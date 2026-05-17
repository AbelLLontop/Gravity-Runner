export const Sfx = {
    ctx: null, ana: null, gain: null, src: null, aud: null, fData: null, tData: null,

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.ana = this.ctx.createAnalyser();
        this.ana.fftSize = 512;
        this.ana.smoothingTimeConstant = 0.8;
        this.fData = new Uint8Array(this.ana.frequencyBinCount);
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
            const offCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 44100);
            const buf = await offCtx.decodeAudioData(ab);
            const pcm = buf.getChannelData(0);
            const sr = buf.sampleRate;
            const beatSamples = Math.round(sr * 0.5);
            const numBeats = Math.ceil(pcm.length / beatSamples);
            const raw = [];
            let maxVal = 0;
            for (let i = 0; i < numBeats; i++) {
                let s = i * beatSamples, e = Math.min(s + beatSamples, pcm.length);
                let peak = 0;
                for (let j = s; j < e; j++) { const abs = Math.abs(pcm[j]); if (abs > peak) peak = abs; }
                raw.push(peak);
                if (peak > maxVal) maxVal = peak;
            }
            return maxVal > 0 ? raw.map(r => r / maxVal) : [];
        } catch (e) { return []; }
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
