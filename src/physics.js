import { C, GS, getStreakTier } from './constants.js';
import { state } from './state.js';
import { Sfx } from './audio.js';
import { keys } from './input.js';
import { getSpeed } from './obstacles.js';

export function mkParts(x, y) {
    for (let i = 0; i < 8; i++) {
        state.parts.push({ x, y, vx: (Math.random() - .5) * 12, vy: (Math.random() - .5) * 12, s: Math.random() * 4 + 2, l: 1 });
    }
}

export function mkDust(x, y) {
    for (let i = 0; i < 3; i++) {
        state.parts.push({ x, y, vx: -4 - Math.random() * 8, vy: (Math.random() - .5) * 3, s: Math.random() * 3 + 1, l: 0.8 });
    }
}

export function mkCoinAnim(x, y) {
    for (let i = 0; i < 8; i++) {
        state.parts.push({ x, y, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 8, s: Math.random() * 4 + 3, l: 1, type: 'coin' });
    }
    state.parts.push({ x, y, vx: 0, vy: -0.5, s: 1, l: 1, type: 'ring' });
}

export function trigSc(s) {
    state.scoreA = { on: true, s, t: 0 };
    updateHUD();
    state.guideFlash = 1.0;
}

function updateHUD() {
    const timeEl = document.getElementById('h-time'); if (timeEl) timeEl.textContent = fmtTime(state.et);
    const scoreEl = document.getElementById('h-score'); if (scoreEl) scoreEl.textContent = state.sc;
    const totalEl = document.getElementById('h-total'); if (totalEl) totalEl.textContent = state.totalBl;
    const bestEl = document.getElementById('h-best'); if (bestEl) bestEl.textContent = state.bestSc;
    const coinsEl = document.getElementById('h-coins'); if (coinsEl) coinsEl.textContent = state.coinsCollected;
    const tsEl = document.getElementById('h-totalscore'); if (tsEl) tsEl.textContent = state.totalScore;
    const multEl = document.getElementById('h-mult');
    if (multEl) {
        let inc = 1;
        if (state.sc >= 200) inc = 5;
        else if (state.sc >= 150) inc = 4;
        else if (state.sc >= 100) inc = 3;
        else if (state.sc >= 50) inc = 2;
        multEl.textContent = inc > 1 ? `x${inc}` : '';
    }
}

function fmtTime(ms) {
    const t = Math.floor(ms / 1000);
    const m = Math.floor(t / 60), s = t % 60;
    return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
}

export { updateHUD, fmtTime };

export function updBlocks(dt) {
    const { gs, blocks, pl } = state;

    if (gs === GS.MENU) {
        const mv = 3 * (dt / 16.666);
        for (const b of blocks) b.x -= mv;
        for (const c of state.coins) c.x -= mv;
        if (Math.random() < .015 && blocks.length < 5) {
            const lx = blocks.length ? blocks[blocks.length - 1].x + blocks[blocks.length - 1].w : C.W;
            blocks.push({ x: Math.max(lx, C.W), w: Math.random() * 150 + 150, gy: Math.random() * 200 + 100, gap: Math.random() * 80 + 120, passed: true, hit: false });
        }
        state.blocks = blocks.filter(b => b.x + b.w > 0);
        state.coins = state.coins.filter(c => c.x > -50);
        return;
    }

    if (gs !== GS.PLAY && gs !== GS.COUNTDOWN) return;

    const spd = getSpeed();

    // ══════════════════════════════════════════════════════════════════════════
    //  MUSIC-REACTIVE SPEED CONTROLLER
    //
    //  The map is a fixed "road" of uniform blocks. Only the scroll speed
    //  changes in real time, driven by two independent musical layers:
    //
    //    LAYER 1 — Sustained Energy Envelope (smooth, follows song dynamics)
    //      Maps the overall loudness/energy to a base speed multiplier.
    //      Quiet intro → slow crawl, loud chorus → fast rush.
    //
    //    LAYER 2 — Transient Beat Pulse (punchy, follows individual hits)
    //      On each detected beat/onset, inject a short speed burst that
    //      decays naturally. Creates the "pumping" rhythm feel.
    //
    //  Both layers are combined and then corrected by a sync controller
    //  that ensures the map finishes when the song ends.
    // ══════════════════════════════════════════════════════════════════════════
    // ── Base Setpoint ────────────────────────────────────────────────────────
    // We start with the base speed. The dynamic speed mapping and the 
    // proportional closed-loop sync controller (below) will handle keeping us 
    // perfectly aligned with the music.
    state.v_target = spd;

    // ── LAYER 1: Pre-calculated Mapped Speed ────────────────────────────────
    // Reads the speed from the offline analysis map. This guarantees high
    // variation between quiet and loud sections, acting like a hand-mapped level.
    let mappedFactor = 1.0;
    let usedOfflineMap = false;
    
    if (state.curSong && state.curSong.beatProfile && state.curSong.beatProfile.speedProfile) {
        const bp = state.curSong.beatProfile;
        if (Sfx.aud && !Sfx.aud.paused) {
            const timeSec = Sfx.aud.currentTime;
            const idx = Math.floor((timeSec * 1000) / bp.windowMs);
            if (idx >= 0 && idx < bp.speedProfile.length) {
                mappedFactor = bp.speedProfile[idx];
                usedOfflineMap = true;
            }
        }
    }
    
    if (!usedOfflineMap) {
        // Fallback to real-time relative metrics if no pre-analyzed map is available,
        // or if we reached the end of the pre-calculated array (e.g., if the browser 
        // truncated the offline decode of a very long song).
        const flux = Sfx.smoothFlux || 0;
        const dynamics = Sfx.localDynamics || 0.5;
        const energy = Sfx.instantEnergy || 0;
        const fluxComponent    = flux * 1.4;
        const dynamicsComponent = (dynamics - 0.5) * 1.0;
        const baseComponent    = 0.35 + Math.pow(energy, 0.6) * 0.5;
        mappedFactor = Math.max(0.25, Math.min(2.2, baseComponent + fluxComponent + dynamicsComponent));
    }

    const envelopeFactor = mappedFactor;

    // Fast smooth — responds in ~3 frames at 60fps
    const envLerp = Math.min(1, dt * 0.022);
    state.smoothSpeedFactor += (envelopeFactor - state.smoothSpeedFactor) * envLerp;

    // ── LAYER 2: Transient Beat Pulse ────────────────────────────────────────
    //  On each detected beat, spike the speed and let it decay naturally.
    //  Beats are now detected via spectral flux too, so they fire in loud sections.
    if (Sfx.isBeat) {
        // Pulse strength scales with beat intensity (0.15 to 0.60 boost)
        const pulseStrength = 0.15 + Sfx.beatIntensity * 0.45;
        // Only set if new pulse is stronger than remaining decay
        if (pulseStrength > state.beatPulse) {
            state.beatPulse = pulseStrength;
        }
    }
    if (state.beatPulse === undefined) state.beatPulse = 0;

    // Faster decay (~120ms half-life) for more rhythmic pumping
    const decayRate = Math.min(1, dt * 0.010);
    state.beatPulse *= (1 - decayRate);
    if (state.beatPulse < 0.005) state.beatPulse = 0;

    const beatMultiplier = 1.0 + state.beatPulse;

    // ── Combine layers ───────────────────────────────────────────────────────
    //  Envelope provides the sustained dynamic feel, beat pulse adds rhythmic kicks
    const musicFactor = state.smoothSpeedFactor * beatMultiplier;

    // ── Dynamic Outro Injection ──────────────────────────────────────────────
    // Instead of forcing the speed to match a pre-calculated map length, we
    // let the speed follow the music perfectly, and simply inject the outro
    // block EXACTLY when there are 5.0 seconds left in the song.
    if (Sfx.aud && Sfx.aud.src && !Sfx.aud.paused && isFinite(Sfx.aud.duration)) {
        const timeLeft = Sfx.aud.duration - Sfx.aud.currentTime;
        if (timeLeft <= 5.0 && !state.outroInjected) {
            state.outroInjected = true;
            
            // Find the active block that the player is currently on or immediately approaching
            let activeIdx = 0;
            for (let i = 0; i < blocks.length; i++) {
                if (blocks[i].x + blocks[i].w > C.PX) {
                    activeIdx = i;
                    break;
                }
            }
            
            // Keep up to the active block, but delete everything after it
            blocks.length = activeIdx + 1;
            const lastB = blocks[activeIdx];
            
            // Add a ridiculously long outro block for the player to slide on 
            // until the song naturally triggers 'audioEnded' and Game Over.
            const outroW = 320 * 4.0 * 10.0; // Overkill length
            blocks.push({
                x: lastB.x + lastB.w, w: outroW, gy: lastB.gy, gap: C.GAP, 
                passed: false, hit: false, scored: false, sndTouch: false, noScore: true 
            });
        }
    }
    
    // ── Final speed ──────────────────────────────────────────────────────────
    const finalSpeed = state.v_target * musicFactor;
    const mv = finalSpeed * (dt / 1000);

    // Store for visual feedback and debugging
    state.musicSpeedMult = musicFactor;

    for (const b of blocks) {
        b.x -= mv;
        if (!b.scored && !b.passed && b.x <= C.PX) {
            b.scored = true;
            if (gs === GS.PLAY && !b.noScore) state.totalBl++;
            const pT = pl.y, pB = pl.y + C.PS;
            const prevBlock = blocks.find(pb => pb !== b && pb.scored && pb.x <= C.PX && pb.x + pb.w > b.x - 5);
            const sameHeight = prevBlock && Math.abs(prevBlock.gy - b.gy) < 2;
            const tolerance = C.GM + 2;
            const inGap = sameHeight || (pT >= b.gy - tolerance && pB <= b.gy + b.gap + tolerance);

            if (inGap) {
                if (gs === GS.PLAY && !b.noScore) {
                    state.sc++;
                    state.totalSuccess++;

                    let inc = 1;
                    if (state.sc >= 200) inc = 5;
                    else if (state.sc >= 150) inc = 4;
                    else if (state.sc >= 100) inc = 3;
                    else if (state.sc >= 50) inc = 2;

                    state.totalScore += inc;
                    state.bestSc = Math.max(state.bestSc, state.sc);
                    trigSc(state.sc);
                }
            } else {
                Sfx.play('crash');
                b.hit = true; state.sc = 0; state.flash = 0.6;
                mkParts(b.x, pl.y + C.PS / 2);
                trigSc(0);
                if (pl.y < b.gy) pl.y = b.gy + 1;
                else if (pl.y + C.PS > b.gy + b.gap) pl.y = b.gy + b.gap - C.PS - 1;
                pl.vy = 0; pl.sx = 1.5; pl.sy = 0.5; pl.sq = 120;
            }
        }
        if (!b.passed && b.x + b.w < C.PX) b.passed = true;
    }

    for (const c of state.coins) c.x -= mv;
    state.blocks = blocks.filter(b => b.x + b.w > 0);
    state.coins = state.coins.filter(c => c.x > -50 && !c.collected);
}

export function checkCol() {
    const { gs, blocks, pl } = state;
    if (gs !== GS.PLAY && gs !== GS.COUNTDOWN) return;

    let pL = C.PX + 2, pR = C.PX + C.PS - 2, pT = pl.y, pB = pl.y + C.PS;
    const HALF = C.PS / 2;

    const spd = getSpeed();
    const maxMv = spd * 0.05; // 50ms lag frame tolerance
    const threshold = Math.max(18, maxMv);

    if (pT <= 0) {
        if (pl.vy < -5) Sfx.play('land');
        pl.y = 0; pl.vy = 0; pT = 0; pB = C.PS;
        if (pl.grav === 'UP') pl.onSurface = true;
    }
    if (pB >= C.H) {
        if (pl.vy > 5) Sfx.play('land');
        pl.y = C.H - C.PS; pl.vy = 0; pT = pl.y; pB = C.H;
        if (pl.grav === 'DOWN') pl.onSurface = true;
    }

    for (const b of blocks) {
        if (b.x <= pR && b.x + b.w > pL) {
            const olvTop = b.gy - pT;
            const olvBot = pB - (b.gy + b.gap);

            if (olvTop > 0) {
                const wasBelowCeiling = (pT - pl.vy >= b.gy - 2);
                const sideCol = (pR - b.x <= threshold) && (olvTop > HALF) && !wasBelowCeiling;
                if (sideCol) {
                    Sfx.play('crash');
                    state.sc = 0;
                    if (!b.scored) {
                        if (gs === GS.PLAY && !b.noScore) { trigSc(0); state.totalBl++; }
                        b.scored = true;
                    }
                    state.flash = 0.6;
                    mkParts(C.PX + C.PS / 2, b.gy);
                    pl.sx = 1.5; pl.sy = 0.5; pl.sq = 130;
                } else if (pl.vy < -2 && (b.gy !== pl.lastGY || pl.lastSide !== 'TOP')) {
                    state.flashW = 0.5;
                    state.flashPos = { x: C.PX + C.PS / 2, y: b.gy };
                    pl.lastGY = b.gy; pl.lastSide = 'TOP';
                }
                pl.y = b.gy + 1;
                pl.vy = 0; pT = pl.y; pB = pl.y + C.PS;
                if (pl.grav === 'UP') pl.onSurface = true;
            } else if (olvBot > 0) {
                const wasAboveFloor = (pB - pl.vy <= b.gy + b.gap + 2);
                const sideCol = (pR - b.x <= threshold) && (olvBot > HALF) && !wasAboveFloor;
                if (sideCol) {
                    Sfx.play('crash');
                    state.sc = 0;
                    if (!b.scored) {
                        if (gs === GS.PLAY && !b.noScore) { trigSc(0); state.totalBl++; }
                        b.scored = true;
                    }
                    state.flash = 0.6;
                    mkParts(C.PX + C.PS / 2, b.gy + b.gap);
                    pl.sx = 1.5; pl.sy = 0.5; pl.sq = 130;
                } else if (pl.vy > 2 && (b.gy + b.gap !== pl.lastGY || pl.lastSide !== 'BOT')) {
                    state.flashW = 0.5;
                    state.flashPos = { x: C.PX + C.PS / 2, y: b.gy + b.gap };
                    pl.lastGY = b.gy + b.gap; pl.lastSide = 'BOT';
                }
                pl.y = b.gy + b.gap - C.PS - 1;
                pl.vy = 0; pT = pl.y; pB = pl.y + C.PS;
                if (pl.grav === 'DOWN') pl.onSurface = true;
            }
        }
    }

    for (const c of state.coins) {
        if (!c.collected && c.x > pL - 30 && c.x < pR + 30) {
            const cS = 26;
            if (pR > c.x - cS / 2 && pL < c.x + cS / 2 && pB > c.y - cS / 2 && pT < c.y + cS / 2) {
                c.collected = true;
                state.coinsCollected++;
                mkCoinAnim(c.x, c.y);
                updateHUD();
            }
        }
    }
}

export function updPlayer(dt) {
    const { gs, pl } = state;
    pl.onSurface = false;

    if (pl.sq > 0) {
        pl.sq -= dt;
        const t = 1 - (pl.sq / 100);
        pl.sx = 1.4 + (1 - 1.4) * t;
        pl.sy = .6 + (1 - .6) * t;
        if (pl.sq <= 0) { pl.sx = 1; pl.sy = 1; }
    }

    if (gs === GS.PLAY || gs === GS.COUNTDOWN) {
        const isDown = keys['ArrowDown'] || keys['ArrowRight'] || keys['s'] || keys['d'];
        const targetGrav = isDown ? 'DOWN' : 'UP';
        if (pl.grav !== targetGrav) {
            pl.grav = targetGrav;
            pl.lastSide = null;
            pl.sx = 1.4; pl.sy = 0.6; pl.sq = 100;
        }
        const g = pl.grav === 'UP' ? -1 : 1;
        pl.vy += g * C.GS * dt;
        if (pl.vy > C.GM) pl.vy = C.GM;
        if (pl.vy < -C.GM) pl.vy = -C.GM;
        pl.y += pl.vy * (dt / 16.666);
    }

    if (gs !== GS.MENU) {
        pl.tt -= dt;
        if (pl.tt <= 0) {
            pl.trail.unshift({ x: C.PX, y: pl.y });
            const maxTrail = 4 + getStreakTier(state.sc) * 3;
            if (pl.trail.length > maxTrail) pl.trail.pop();
            pl.tt = 40;
        }
    }

    for (let i = state.parts.length - 1; i >= 0; i--) {
        const p = state.parts[i];
        p.x += p.vx; p.y += p.vy; p.l -= dt / 500;
        if (p.l <= 0) state.parts.splice(i, 1);
    }

    if (state.flash > 0) { state.flash -= dt / 300; if (state.flash < 0) state.flash = 0; }
    if (state.flashW > 0) { state.flashW -= dt / 200; if (state.flashW < 0) state.flashW = 0; }
    if (state.guideFlash > 0) { state.guideFlash -= dt / 300; if (state.guideFlash < 0) state.guideFlash = 0; }
}
