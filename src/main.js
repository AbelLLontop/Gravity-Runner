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
state.pl.char = localStorage.getItem('gr_char') || 'FOX';

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
            const vol = Sfx.getVol();

            const targetHue = 200 + (vol / 120) * 160;
            state.curHue += (targetHue - state.curHue) * 0.1;

            state.smoothEnergy += (vol - state.smoothEnergy) * 0.08;
            state.energyMult += (state.smoothEnergy / 60 - state.energyMult) * 0.04;
            state.energyMult = Math.max(0.55, Math.min(2.0, state.energyMult));

            const targetGap = Math.max(90, Math.min(C.GAP, C.GAP * (1.0 - (state.smoothEnergy / 120) * 0.35)));
            state.dynamicGap += (targetGap - state.dynamicGap) * 0.03;

            state.beatCooldown -= dt;
            if ((state.gs === GS.PLAY || state.gs === GS.COUNTDOWN) && vol > state.lastBeatEnergy * 1.35 && vol > 30 && state.beatCooldown <= 0) {
                const dir = state.pl.grav === 'UP' ? -1 : 1;
                state.pl.vy += dir * 4.5;
                state.pl.sq = 80;
                state.beatFlash = 0.18;
                state.beatCooldown = 200;
            }
            state.lastBeatEnergy += (vol - state.lastBeatEnergy) * 0.15;
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
