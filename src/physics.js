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
    let v_ideal = spd;

    const outroBlock = blocks[blocks.length - 1];

    if (Sfx.aud && Sfx.aud.src && !Sfx.aud.paused && isFinite(Sfx.aud.duration)) {
        const timeLeft = Sfx.aud.duration - Sfx.aud.currentTime;
        if (timeLeft > 5) {
            const remActiveTime = timeLeft - 5;
            if (outroBlock) {
                const distanceToOutro = outroBlock.x - C.PX;
                if (distanceToOutro > 0 && remActiveTime > 0.1) {
                    v_ideal = distanceToOutro / remActiveTime;
                }
            }
        } else if (timeLeft > 0) {
            if (outroBlock) {
                const distanceToOutroTail = outroBlock.x + outroBlock.w - C.PX;
                if (distanceToOutroTail > 0) {
                    v_ideal = distanceToOutroTail / timeLeft;
                }
            }
        }
    }

    // Clamp v_ideal to prevent extreme speeds during lag spikes
    v_ideal = Math.max(spd * 0.4, Math.min(spd * 2.5, v_ideal));

    // Smoothly LERP state.v_target towards v_ideal by 2% per frame
    // This allows music-reactive speed fluctuations to breathe without being canceled out!
    state.v_target += (v_ideal - state.v_target) * 0.02;

    // Dynamic music-reactive speed using smoothed RMS energy mapped from 0.0 to 0.25 (typical music RMS range)
    const norm = Math.min(1.0, state.smoothedRMS / 0.25);
    const speedFactor = 0.6 + norm * 0.9; // speed range: [60%, 150%] of required speed

    const mv = state.v_target * speedFactor * (dt / 1000);

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
