import { C, GS, getStreakTier, TIER_MSGS } from './constants.js';
import { state } from './state.js';
import { Sfx } from './audio.js';
import { setupInput } from './input.js';
import { updBlocks, checkCol, updPlayer, updateHUD } from './physics.js';
import { render } from './render.js';
import { showMenu, showGameOver, togglePause } from './ui.js';

// Init stars
for (let i = 0; i < 50; i++) {
    state.stars.push({ x: Math.random() * C.W, y: Math.random() * C.H, s: Math.random() * 2 + 1, sp: Math.random() * .5 + .1 });
}

// Load saved character
let savedChar = localStorage.getItem('gr_char') || 'CAT';
if (savedChar === 'FOX') savedChar = 'CAT';
state.pl.char = savedChar;

// Load saved volume (default 0.2)
const _savedVol = parseFloat(localStorage.getItem('gr_volume'));
state.volume = isNaN(_savedVol) ? 0.2 : _savedVol;

// Input
setupInput({ onPause: togglePause });

// Main loop
function loop(now) {
    let dt = now - state.lt;
    state.lt = now;
    if (dt > 100) dt = 100;

    if (!state.paused) {
        if (Sfx.ana) {
            // ── Unified per-frame audio analysis ─────────────────────────
            Sfx.analyze(dt);

            // Legacy compat: keep smoothedRMS updated for any remaining uses
            // ── Visual: hue shifts from Blue (calm) to Red (intense) ─────
            // Driven purely by the absolute perceived volume (RMS) of the song.
            // We dynamically track the song's loudest and quietest moments.
            const rawRMS = Sfx.getRMS();
            state.smoothedRMS = state.smoothedRMS * 0.8 + rawRMS * 0.2; // Smooth tracking
            
            // Adapt min/max trackers
            if (state.smoothedRMS > state.rmsMax) state.rmsMax = state.smoothedRMS;
            if (state.smoothedRMS < state.rmsMin && state.smoothedRMS > 0.005) state.rmsMin = state.smoothedRMS;
            
            // Very slowly decay the bounds so it adapts if the song changes structure
            state.rmsMax *= 0.9995;
            state.rmsMin += (0.1 - state.rmsMin) * 0.0002;

            // Map current volume within the tracked bounds
            const range = Math.max(0.02, state.rmsMax - state.rmsMin);
            let power = (state.smoothedRMS - state.rmsMin) / range;
            power = Math.max(0, Math.min(1.0, power));
            
            // Make the curve exponential so it stays in Blue/Purple for most of the song,
            // and only hits bright Red during the ABSOLUTE loudest peaks.
            power = Math.pow(power, 1.6);
            
            // Map power: 0.0 -> Blue (240), 1.0 -> Red (360)
            const targetHue = 240 + (power * 120);
            state.curHue += (targetHue - state.curHue) * 0.08; // smooth transition

            // ── Visual: energy multiplier from combined bands ────────────
            const totalE = Sfx.instantEnergy * 255;
            state.smoothEnergy += (totalE - state.smoothEnergy) * 0.12;
            state.energyMult += (state.smoothEnergy / 60 - state.energyMult) * 0.08;
            state.energyMult = Math.max(0.55, Math.min(2.5, state.energyMult));

            // ── Dynamic gap: tighter gap during loud sections ────────────
            const targetGap = Math.max(90, Math.min(C.GAP, C.GAP * (1.0 - Sfx.instantEnergy * 0.35)));
            state.dynamicGap += (targetGap - state.dynamicGap) * 0.06;

            // ── Beat reaction: use real onset detector ───────────────────
            if ((state.gs === GS.PLAY || state.gs === GS.COUNTDOWN) && Sfx.isBeat) {
                const dir = state.pl.grav === 'UP' ? -1 : 1;
                state.pl.vy += dir * (3.0 + Sfx.beatIntensity * 3.0);
                state.pl.sq = 80;
                state.beatFlash = 0.12 + Sfx.beatIntensity * 0.15;
            }
        }

        if (state.beatFlash > 0) state.beatFlash -= dt * 0.002;
        if (state.volDisplayT > 0) state.volDisplayT = Math.max(0, state.volDisplayT - dt);
        if (state.tierMsg.t > 0) state.tierMsg.t = Math.max(0, state.tierMsg.t - dt);

        if (state.gs === GS.COUNTDOWN || state.gs === GS.PLAY) state.et += dt;

        if (state.gs === GS.COUNTDOWN) {
            state.countT -= dt;
            updBlocks(dt); checkCol(); updPlayer(dt);
            if (state.countT <= 0) state.gs = GS.PLAY;
        } else if (state.gs === GS.PLAY) {
            updBlocks(dt); checkCol(); updPlayer(dt);
            if (state.scoreA.on) state.scoreA.t += dt;

            // Fade out music in the last 5 seconds
            if (Sfx.aud && Sfx.aud.src && !Sfx.aud.paused && isFinite(Sfx.aud.duration)) {
                const timeLeft = Sfx.aud.duration - Sfx.aud.currentTime;
                if (timeLeft <= 5 && timeLeft > 0) {
                    const factor = Math.max(0, timeLeft / 5);
                    Sfx.setVolume(state.volume * factor);
                } else if (timeLeft > 5) {
                    Sfx.setVolume(state.volume);
                }
            }

            // Tier-up detection
            const curTier = getStreakTier(state.sc);
            if (curTier > state.lastTier) {
                if (TIER_MSGS[curTier]) {
                    state.tierMsg = { ...TIER_MSGS[curTier], t: 3000, tier: curTier };
                    state.beatFlash = 0.5;
                }
                state.lastTier = curTier;
            } else if (curTier < state.lastTier) {
                state.lastTier = curTier;
            }

            const audioEnded = Sfx.aud && Sfx.aud.src && Sfx.aud.ended;
            if (audioEnded || state.blocks.length === 0) showGameOver();
        } else if (state.gs === GS.MENU) {
            updBlocks(dt);
        }
    }

    render();
    updateHUD();
    requestAnimationFrame(loop);
}

showMenu();
requestAnimationFrame(loop);
