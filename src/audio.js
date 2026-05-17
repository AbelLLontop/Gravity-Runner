export const Sfx = {
    ctx: null, ana: null, gain: null, src: null, aud: null, fData: null, tData: null,

    // ── Multi-band frequency analysis ────────────────────────────────────────
    bassEnergy: 0,
    midEnergy: 0,
    highEnergy: 0,
    instantEnergy: 0,     // raw total energy this frame
    smoothBass: 0,
    smoothMid: 0,
    smoothHigh: 0,

    // ── Spectral flux & dynamics (keeps varying even in loud sections) ───────
    prevFData: null,      // previous frame's frequency data for flux calculation
    spectralFlux: 0,      // 0-1: how much the spectrum changed from last frame
    smoothFlux: 0,        // smoothed spectral flux
    localDynamics: 0,     // 0-1: ratio of short-term to medium-term energy
    shortEnergy: 0,       // ~4 frame moving average
    mediumEnergy: 0,      // ~40 frame moving average

    // ── Onset / beat detection ───────────────────────────────────────────────
    onsetValue: 0,        // how much current energy exceeds recent average
    energyHistory: [],    // sliding window of recent energy values
    energyHistoryLen: 30, // ~30 frames ≈ 500ms — adapts faster to new loudness
    isBeat: false,        // true on the frame a beat is detected
    beatIntensity: 0,     // 0-1 strength of the detected beat
    beatCooldownMs: 0,

    // ── Tempo estimation ─────────────────────────────────────────────────────
    recentBeatTimes: [],  // timestamps of recent beats for BPM estimation
    estimatedBPM: 120,
    bpmConfidence: 0,     // 0-1

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.ana = this.ctx.createAnalyser();
        this.ana.fftSize = 1024;                 // 512 bins → better frequency resolution
        this.ana.smoothingTimeConstant = 0.4;     // much less smoothing → more reactive
        this.fData = new Uint8Array(this.ana.frequencyBinCount);
        this.tData = new Uint8Array(this.ana.frequencyBinCount);
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0.2;
        this.aud = new Audio();
        this.aud.loop = false;
        // Signal chain: src → ana (reads raw signal) → gain (volume control) → speakers
        this.src = this.ctx.createMediaElementSource(this.aud);
        this.src.connect(this.ana);
        this.ana.connect(this.gain);
        this.gain.connect(this.ctx.destination);
    },

    loadMusic(file) {
        if (!file) { this.aud.src = ''; return; }
        this.aud.src = URL.createObjectURL(file);
    },

    playMusic(volume = 0.2) {
        this.init();
        this.gain.gain.value = volume;
        // Reset analysis state
        this.energyHistory = [];
        this.recentBeatTimes = [];
        this.smoothBass = 0; this.smoothMid = 0; this.smoothHigh = 0;
        this.beatCooldownMs = 0;
        this.prevFData = null;
        this.spectralFlux = 0; this.smoothFlux = 0;
        this.localDynamics = 0; this.shortEnergy = 0; this.mediumEnergy = 0;
        this.aud.play().catch(e => {
            if (e.name !== 'AbortError') console.error('Error playing music:', e);
        });
    },

    setVolume(v) {
        if (this.gain) this.gain.gain.value = v;
    },

    stopMusic() {
        if (this.aud) { this.aud.pause(); this.aud.currentTime = 0; }
    },

    // ── Per-frame multi-band analysis (call once per frame) ──────────────────
    analyze(dt) {
        if (!this.ana) return;
        this.ana.getByteFrequencyData(this.fData);
        this.ana.getByteTimeDomainData(this.tData);

        const bins = this.fData.length;            // 512
        // Approximate frequency per bin: sampleRate / fftSize
        // At 44100Hz, fftSize=1024 → each bin ≈ 43Hz
        // Bass: 0-300Hz → bins 0-6,  Mid: 300-2000Hz → bins 7-46,  High: 2000-8000Hz → bins 47-186
        const bassCut = Math.floor(300 / (44100 / 1024));   // ~7
        const midCut  = Math.floor(2000 / (44100 / 1024));  // ~46
        const highCut = Math.floor(8000 / (44100 / 1024));  // ~186

        let bass = 0, mid = 0, high = 0;
        for (let i = 0; i < bins; i++) {
            const v = this.fData[i];
            if (i <= bassCut) bass += v;
            else if (i <= midCut) mid += v;
            else if (i <= highCut) high += v;
        }
        // Normalize to 0-1 range (max bin value = 255)
        this.bassEnergy = bass / ((bassCut + 1) * 255);
        this.midEnergy  = mid / ((midCut - bassCut) * 255);
        this.highEnergy = high / ((highCut - midCut) * 255);

        // Weighted total energy — bass drives rhythm, mid drives melody
        this.instantEnergy = this.bassEnergy * 0.5 + this.midEnergy * 0.35 + this.highEnergy * 0.15;

        // Smooth bands with fast lerp for reactivity
        const a = Math.min(1, dt * 0.012);  // ~0.2 at 60fps
        this.smoothBass += (this.bassEnergy - this.smoothBass) * a;
        this.smoothMid  += (this.midEnergy  - this.smoothMid)  * a;
        this.smoothHigh += (this.highEnergy - this.smoothHigh) * a;

        // ── Spectral Flux: measures HOW MUCH the spectrum changed ────────────
        //  This keeps varying even during consistently loud sections because
        //  drums, vocal changes, and instrument transitions always shift the
        //  frequency distribution, even when overall volume stays the same.
        if (this.prevFData) {
            let flux = 0;
            for (let i = 0; i < bins; i++) {
                const diff = this.fData[i] - this.prevFData[i];
                if (diff > 0) flux += diff;  // only count increases (onsets)
            }
            this.spectralFlux = Math.min(1.0, flux / (bins * 40));
        } else {
            this.prevFData = new Uint8Array(bins);
        }
        // Copy current frame for next comparison
        this.prevFData.set(this.fData);

        // Smooth flux with fast lerp
        const fluxLerp = Math.min(1, dt * 0.020);
        this.smoothFlux += (this.spectralFlux - this.smoothFlux) * fluxLerp;

        // ── Local Dynamics: short-term vs medium-term energy ratio ───────────
        //  Short window (~4 frames ≈ 66ms) captures transients
        //  Medium window (~40 frames ≈ 660ms) captures the local "floor"
        //  Their ratio reveals dynamics at ANY loudness level.
        const shortLerp = Math.min(1, dt * 0.04);   // fast: ~4 frames
        const medLerp   = Math.min(1, dt * 0.004);  // slow: ~40 frames
        this.shortEnergy += (this.instantEnergy - this.shortEnergy) * shortLerp;
        this.mediumEnergy += (this.instantEnergy - this.mediumEnergy) * medLerp;

        // Ratio > 1 means energy is rising, < 1 means falling
        // Map to 0..1 centered at 0.5 (neutral)
        const ratio = this.mediumEnergy > 0.01
            ? this.shortEnergy / this.mediumEnergy
            : 1.0;
        this.localDynamics = Math.max(0, Math.min(1, (ratio - 0.5) / 1.5 + 0.5));

        // ── Beat/onset detection ─────────────────────────────────────────────
        this.energyHistory.push(this.instantEnergy);
        if (this.energyHistory.length > this.energyHistoryLen) {
            this.energyHistory.shift();
        }

        // Compute mean and variance of energy history
        let mean = 0;
        for (let i = 0; i < this.energyHistory.length; i++) mean += this.energyHistory[i];
        mean /= this.energyHistory.length;

        let variance = 0;
        for (let i = 0; i < this.energyHistory.length; i++) {
            const d = this.energyHistory[i] - mean;
            variance += d * d;
        }
        variance /= this.energyHistory.length;

        // Adaptive threshold: lower when variance is high OR when flux is high
        // This allows beat detection even in consistently loud sections
        const fluxBonus = this.spectralFlux * 0.3;
        const sensitivity = 1.1 + Math.max(0, 0.5 - variance * 8) - fluxBonus;
        this.onsetValue = mean > 0.001 ? (this.instantEnergy / mean) : 0;

        // Also detect beats via spectral flux alone (catches hi-hats, snares in loud sections)
        const fluxBeat = this.spectralFlux > this.smoothFlux * 1.8 && this.spectralFlux > 0.15;

        this.beatCooldownMs -= dt;
        this.isBeat = false;
        if (((this.onsetValue > sensitivity && this.instantEnergy > 0.05) || fluxBeat) && this.beatCooldownMs <= 0) {
            this.isBeat = true;
            const energyStrength = Math.min(1.0, (this.onsetValue - sensitivity) / 1.2);
            const fluxStrength = Math.min(1.0, this.spectralFlux / 0.5);
            this.beatIntensity = Math.max(energyStrength, fluxStrength * 0.8);
            this.beatCooldownMs = 100; // 100ms between beats
            // Record beat time for tempo estimation
            const now = performance.now();
            this.recentBeatTimes.push(now);
            if (this.recentBeatTimes.length > 16) this.recentBeatTimes.shift();
            this._estimateBPM();
        }
    },

    _estimateBPM() {
        const times = this.recentBeatTimes;
        if (times.length < 4) return;
        // Compute inter-beat intervals
        const intervals = [];
        for (let i = 1; i < times.length; i++) {
            const interval = times[i] - times[i - 1];
            if (interval > 200 && interval < 2000) intervals.push(interval); // 30-300 BPM range
        }
        if (intervals.length < 3) return;
        // Median interval is more robust than mean
        intervals.sort((a, b) => a - b);
        const median = intervals[Math.floor(intervals.length / 2)];
        const bpm = 60000 / median;
        // Confidence based on how consistent the intervals are
        let consistent = 0;
        for (const iv of intervals) {
            if (Math.abs(iv - median) < median * 0.15) consistent++;
        }
        this.bpmConfidence = consistent / intervals.length;
        this.estimatedBPM = bpm;
    },

    // Legacy getters for backward compat
    getVol() {
        if (!this.ana) return 0;
        this.ana.getByteFrequencyData(this.fData);
        let sum = 0;
        for (let i = 0; i < this.fData.length; i++) sum += this.fData[i];
        return sum / this.fData.length;
    },

    getRMS() {
        if (!this.ana) return 0;
        if (!this.tData) this.tData = new Uint8Array(this.ana.frequencyBinCount);
        this.ana.getByteTimeDomainData(this.tData);
        let sum = 0;
        for (let i = 0; i < this.tData.length; i++) {
            const norm = (this.tData[i] - 128) / 128;
            sum += norm * norm;
        }
        return Math.sqrt(sum / this.tData.length);
    },

    async analyzeBeatProfile(file) {
        try {
            const ab = await file.arrayBuffer();
            // Use a standard AudioContext for decoding to avoid browser-specific length truncations 
            // that happen with dummy 1-sample OfflineAudioContexts on long songs.
            const decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
            const buf = await decodeCtx.decodeAudioData(ab);
            const pcm = buf.getChannelData(0);
            const sr = buf.sampleRate;

            // ── High-resolution energy profile (100ms windows) ───────────────
            const windowMs = 100;
            const windowSamples = Math.round(sr * windowMs / 1000);
            const numWindows = Math.ceil(pcm.length / windowSamples);
            const energyProfile = [];
            let maxE = 0;

            for (let i = 0; i < numWindows; i++) {
                const start = i * windowSamples;
                const end = Math.min(start + windowSamples, pcm.length);
                // RMS energy for this window
                let rmsSum = 0;
                for (let j = start; j < end; j++) rmsSum += pcm[j] * pcm[j];
                const rms = Math.sqrt(rmsSum / (end - start));
                energyProfile.push(rms);
                if (rms > maxE) maxE = rms;
            }

            // Normalize to 0-1
            if (maxE > 0) {
                for (let i = 0; i < energyProfile.length; i++) {
                    energyProfile[i] /= maxE;
                }
            }

            // ── Segment analysis: find quiet/loud sections ───────────────────
            const segments = [];
            const segLen = 10; // 10 windows = 1 second
            for (let i = 0; i < energyProfile.length; i += segLen) {
                const slice = energyProfile.slice(i, i + segLen);
                const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
                // Compute "activity" — how much variation in this segment
                let activity = 0;
                for (let j = 1; j < slice.length; j++) {
                    activity += Math.abs(slice[j] - slice[j - 1]);
                }
                activity /= slice.length;
                segments.push({ time: (i * windowMs) / 1000, energy: avg, activity });
            }

            // ── Pre-calculate Dynamic Speed Profile ─────────────────────────
            // This acts like a "map" for the game's base speed, allowing
            // extreme dynamic changes without getting stuck on high energy
            const speedProfile = [];
            
            // 1. Calculate a moving average to smooth out the energy (over ~2 seconds)
            const smoothedE = [];
            const smoothWindow = 10; // 1 second each side
            for (let i = 0; i < energyProfile.length; i++) {
                let sum = 0, count = 0;
                for (let j = Math.max(0, i - smoothWindow); j <= Math.min(energyProfile.length - 1, i + smoothWindow); j++) {
                    sum += energyProfile[j];
                    count++;
                }
                smoothedE.push(sum / count);
            }
            
            // 2. Find percentiles to adapt to this specific song's range
            const sortedE = [...smoothedE].sort((a,b) => a - b);
            const p10 = sortedE[Math.floor(sortedE.length * 0.1)] || 0;
            const p90 = sortedE[Math.floor(sortedE.length * 0.9)] || 1;
            const eRange = Math.max(0.05, p90 - p10);
            
            // 3. Generate a highly varied speed multiplier for each window
            const absoluteMaxE = sortedE[sortedE.length - 1];
            // Normalize so the ABSOLUTE loudest part is near 1.0, but we use a lower range
            // to allow extreme drops to exceed 1.0 and feel faster
            // eRange already declared above
            
            for (let i = 0; i < energyProfile.length; i++) {
                // eNorm is roughly 0.0 to 1.0+, NOT clamped at 1.0!
                const eNorm = Math.max(0, (smoothedE[i] - p10) / eRange);
                
                // Compare raw 100ms energy to the 2-second average to find micro-dynamics
                // This captures every drum hit, vocal swell, and dip
                const localDiff = energyProfile[i] - smoothedE[i];
                
                // Base speed curve: 0.35x (quietest) to ~2.2x (loudest)
                let baseSpd = 0.35 + Math.pow(eNorm, 1.1) * 1.65;
                
                // Add the local diff (multiplied by a strong factor)
                // This ensures that even during a sustained loud chorus,
                // the speed bobs up and down with the actual waveform.
                let speedFactor = baseSpd + (localDiff * 2.5);

                // Keep it in a playable range
                speedFactor = Math.max(0.2, speedFactor);
                
                speedProfile.push(speedFactor);
            }

            return { energyProfile, segments, speedProfile, windowMs };
        } catch (e) {
            console.error('Beat profile analysis failed:', e);
            return { energyProfile: [], segments: [], speedProfile: [], windowMs: 100 };
        }
    },

    play(type) {
        this.init();
        const c = this.ctx, g = c.createGain(), o = c.createOscillator();
        g.connect(c.destination); o.connect(g);
        const t = c.currentTime;
        if (type === 'crash') {
            const buf = c.createBuffer(1, c.sampleRate * 0.2, c.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            const srcNode = c.createBufferSource();
            srcNode.buffer = buf;
            const f = c.createBiquadFilter();
            f.type = 'lowpass'; f.frequency.value = 1000;
            const gn = c.createGain();
            gn.gain.setValueAtTime(0.5, t);
            gn.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            srcNode.connect(f); f.connect(gn); gn.connect(c.destination); srcNode.start();
        } else if (type === 'land') {
            o.type = 'sine';
            o.frequency.setValueAtTime(400, t);
            o.frequency.exponentialRampToValueAtTime(600, t + 0.05);
            g.gain.setValueAtTime(0.12, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            o.start(); o.stop(t + 0.05);
        } else if (type === 'coin') {
            o.type = 'sine';
            o.frequency.setValueAtTime(880, t);
            o.frequency.setValueAtTime(1760, t + 0.05);
            g.gain.setValueAtTime(0.2, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            o.start(); o.stop(t + 0.15);
        }
    }
};
