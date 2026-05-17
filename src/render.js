import { C, GS, getStreakTier } from './constants.js';
import { state } from './state.js';
import { Sfx } from './audio.js';
import { mkDust } from './physics.js';
import { drawCube, drawCat, drawFox, drawDrone, drawGhost, drawUFO, drawNinja, drawShark } from './characters.js';

const cv = document.getElementById('cv');
const cx = cv.getContext('2d');
cv.width = C.W;
cv.height = C.H;

export { cv, cx };

function rBg() {
    const g = cx.createLinearGradient(0, 0, 0, C.H);
    g.addColorStop(0, '#020205'); g.addColorStop(1, '#0a0a15');
    cx.fillStyle = g; cx.fillRect(0, 0, C.W, C.H);

    const gridOpacity = Math.min(0.22, 0.05 + state.energyMult * 0.04);
    cx.strokeStyle = `rgba(0, 240, 255, ${gridOpacity})`; cx.lineWidth = 1; cx.beginPath();
    const off = (state.gs === GS.MENU ? state.et * 10 : state.et * 20) % 50;
    for (let x = -off; x < C.W; x += 50) { cx.moveTo(x, 0); cx.lineTo(x, C.H); }
    for (let y = 0; y < C.H; y += 50) { cx.moveTo(0, y); cx.lineTo(C.W, y); }
    cx.stroke();

    cx.fillStyle = '#fff';
    for (const s of state.stars) {
        if (!state.paused && (state.gs === GS.PLAY || state.gs === GS.MENU)) {
            s.x -= s.sp * state.energyMult;
            if (s.x < 0) { s.x = C.W; s.y = Math.random() * C.H; }
        }
        cx.globalAlpha = s.sp * .8; cx.fillRect(s.x, s.y, s.s, s.s);
    }
    cx.globalAlpha = 1;
}

function rBlocks() {
    for (const b of state.blocks) {
        if (b.x > C.W || b.x + b.w < 0 || b.w <= 0) continue;

        let growth = 1, alpha = 1;

        if (b.x > C.W - 300) {
            alpha = 1 - (b.x - (C.W - 300)) / 300;
            if (b.x > C.W - 150) {
                growth = 1 - (b.x - (C.W - 150)) / 150;
                growth = Math.max(0, Math.min(1, Math.pow(growth, 0.4)));
            }
        } else if (b.x + b.w < 300) {
            alpha = (b.x + b.w) / 300;
            if (b.x + b.w < 120) {
                growth = Math.max(0, (b.x + b.w) / 120);
                growth = Math.pow(growth, 0.6);
            }
        }
        alpha = Math.max(0, Math.min(1, alpha));
        cx.globalAlpha = alpha;

        const drawGy = b.gy * growth;
        const targetBh = C.H - (b.gy + b.gap);
        const drawBh = targetBh * growth;

        const gTop = cx.createLinearGradient(b.x, 0, b.x, drawGy);
        gTop.addColorStop(0, `hsla(${state.curHue}, 70%, 10%, 0.9)`);
        gTop.addColorStop(1, `hsla(${state.curHue}, 70%, 30%, 0.6)`);
        cx.fillStyle = gTop;
        cx.fillRect(b.x, 0, b.w, drawGy);
        cx.strokeStyle = `hsla(${state.curHue}, 100%, 50%, 0.5)`; cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(b.x, drawGy); cx.lineTo(b.x + b.w, drawGy); cx.stroke();
        cx.strokeRect(b.x, 0, b.w, drawGy);

        const drawBy = C.H - drawBh;
        const gBot = cx.createLinearGradient(b.x, drawBy, b.x, drawBy + drawBh);
        gBot.addColorStop(0, `hsla(${state.curHue}, 70%, 30%, 0.6)`);
        gBot.addColorStop(1, `hsla(${state.curHue}, 70%, 10%, 0.9)`);
        cx.fillStyle = gBot;
        cx.fillRect(b.x, drawBy, b.w, drawBh);
        cx.strokeStyle = `hsla(${state.curHue}, 100%, 50%, 0.5)`; cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(b.x, drawBy); cx.lineTo(b.x + b.w, drawBy); cx.stroke();
        cx.strokeRect(b.x, drawBy, b.w, drawBh);

        if (state.gs === GS.PLAY || state.gs === GS.COUNTDOWN) {
            const pl = state.pl;
            const isTouchingTop = (b.x <= C.PX + C.PS && b.x + b.w >= C.PX) && (pl.y <= b.gy + 1.5 && pl.grav === 'UP');
            const isTouchingBot = (b.x <= C.PX + C.PS && b.x + b.w >= C.PX) && (pl.y + C.PS >= b.gy + b.gap - 1.5 && pl.grav === 'DOWN');
            if (isTouchingTop || isTouchingBot) {
                const edgeY = isTouchingTop ? b.gy : b.gy + b.gap;
                cx.save();
                cx.shadowColor = '#fff'; cx.shadowBlur = 15;
                cx.fillStyle = 'rgba(255,255,255,0.7)';
                cx.fillRect(b.x, edgeY - 2, b.w, 4);
                cx.restore();
                if (Math.random() < 0.8) mkDust(C.PX + Math.random() * C.PS, edgeY);
            }
        }
        cx.globalAlpha = 1;
    }
    cx.shadowBlur = 0;
}

function rPlayer() {
    const { pl } = state;
    const tier = getStreakTier(state.sc);
    const px = C.PX + C.PS / 2;
    const py = pl.y + C.PS / 2;

    // Trail — longer and brighter with tier
    const trailBase = 0.15 + tier * 0.06;
    const trailStep = trailBase / (pl.trail.length || 1);
    pl.trail.forEach((t, i) => {
        let o = trailBase - i * trailStep; if (o < 0) o = 0;
        cx.save();
        cx.translate(t.x + C.PS / 2, t.y + C.PS / 2);
        if (pl.grav === 'UP') cx.scale(1, -1);
        cx.fillStyle = `hsla(${state.curHue}, 100%, ${50 + tier * 10}%, ${o})`;
        cx.fillRect(-C.PS / 2, -C.PS / 2, C.PS, C.PS);
        cx.restore();
    });

    // Tier 2+: pulsing aura ring (world coords, behind character)
    if (tier >= 2) {
        const pulse = 1 + Math.sin(state.et * 0.012) * 0.2;
        const hue2 = (state.curHue + 40) % 360;
        cx.save();
        cx.strokeStyle = `hsla(${hue2}, 100%, 75%, 0.55)`;
        cx.lineWidth = 2 + tier;
        cx.shadowColor = `hsla(${hue2}, 100%, 75%, 1)`;
        cx.shadowBlur = 18;
        cx.beginPath();
        cx.arc(px, py, C.PS * 0.85 * pulse, 0, Math.PI * 2);
        cx.stroke();
        cx.restore();
    }

    // Player character
    cx.save();
    cx.translate(px, py);
    cx.scale(pl.sx, pl.sy);
    if (pl.grav === 'UP') cx.scale(1, -1);

    // Tier 1+: glow on character
    if (tier >= 1) {
        cx.shadowColor = `hsla(${state.curHue}, 100%, 70%, 1)`;
        cx.shadowBlur = 8 + tier * 6;
    }

    let drawState = 'RUN';
    if (state.flash > 0) drawState = 'CRASH';
    else if (!pl.onSurface) drawState = 'AIR';

    if (pl.char === 'CAT') drawCat(cx, C.PS, drawState, tier);
    else if (pl.char === 'FOX') drawFox(cx, C.PS, drawState, tier);
    else if (pl.char === 'DRONE') drawDrone(cx, C.PS, drawState, tier);
    else if (pl.char === 'GHOST') drawGhost(cx, C.PS, drawState, tier);
    else if (pl.char === 'UFO') drawUFO(cx, C.PS, drawState, tier);
    else if (pl.char === 'NINJA') drawNinja(cx, C.PS, drawState, tier);
    else if (pl.char === 'SHARK') drawShark(cx, C.PS, drawState, tier);
    else drawCube(cx, C.PS, drawState, tier);

    cx.restore();
    cx.globalAlpha = 1;
    cx.shadowBlur = 0;

    // Tier 3: orbiting particles (world coords, in front)
    if (tier >= 3) {
        for (let i = 0; i < 4; i++) {
            const angle = state.et * 0.005 + i * Math.PI / 2;
            const orbitR = C.PS * 1.15;
            const ox = px + Math.cos(angle) * orbitR;
            const oy = py + Math.sin(angle) * orbitR;
            cx.save();
            const orbitHue = (state.curHue + i * 70) % 360;
            cx.fillStyle = `hsla(${orbitHue}, 100%, 80%, 0.9)`;
            cx.shadowColor = `hsla(${orbitHue}, 100%, 80%, 1)`;
            cx.shadowBlur = 10;
            cx.beginPath();
            cx.arc(ox, oy, 4, 0, Math.PI * 2);
            cx.fill();
            cx.restore();
        }
        cx.shadowBlur = 0;
    }

    // Tier 5: chromatic aberration echo — two ghost copies offset in R and B
    if (tier >= 5) {
        cx.save();
        cx.translate(px - 6, py);
        cx.scale(pl.sx, pl.sy);
        if (pl.grav === 'UP') cx.scale(1, -1);
        cx.globalAlpha = 0.28;
        cx.globalCompositeOperation = 'screen';
        cx.shadowColor = 'rgba(255,0,0,0.8)';
        cx.shadowBlur = 10;
        cx.fillStyle = 'rgba(255,30,0,0.6)';
        cx.fillRect(-C.PS / 2, -C.PS / 2, C.PS, C.PS);
        cx.restore();

        cx.save();
        cx.translate(px + 6, py);
        cx.scale(pl.sx, pl.sy);
        if (pl.grav === 'UP') cx.scale(1, -1);
        cx.globalAlpha = 0.28;
        cx.globalCompositeOperation = 'screen';
        cx.shadowColor = 'rgba(0,60,255,0.8)';
        cx.shadowBlur = 10;
        cx.fillStyle = 'rgba(0,60,255,0.6)';
        cx.fillRect(-C.PS / 2, -C.PS / 2, C.PS, C.PS);
        cx.restore();
        cx.globalCompositeOperation = 'source-over';
        cx.globalAlpha = 1;
    }

    // Tier 6: void rift — jagged dark energy crack behind player
    if (tier >= 6) {
        cx.save();
        cx.globalAlpha = 0.7;
        const riftLen = 80 + Math.sin(state.et * 0.008) * 20;
        cx.strokeStyle = `hsla(${(state.curHue + 180) % 360}, 100%, 40%, 0.9)`;
        cx.lineWidth = 3;
        cx.shadowColor = `hsla(${(state.curHue + 180) % 360}, 100%, 70%, 1)`;
        cx.shadowBlur = 12;
        cx.beginPath();
        cx.moveTo(px, py);
        let rx = px + 15;
        for (let s = 0; s < 8; s++) {
            rx += riftLen / 8;
            const ry = py + (Math.random() - 0.5) * 22;
            cx.lineTo(rx, ry);
        }
        cx.stroke();
        cx.restore();
        cx.shadowBlur = 0;
    }

    // Tier 7: lightning cage + screen edge glow
    if (tier >= 7) {
        // Cage arcs
        for (let i = 0; i < 3; i++) {
            const ang = state.et * 0.007 + i * (Math.PI * 2 / 3);
            const r = C.PS * 1.5;
            cx.save();
            cx.strokeStyle = `hsla(${(state.curHue + i * 60) % 360}, 100%, 90%, 0.8)`;
            cx.lineWidth = 1.5;
            cx.shadowColor = '#fff';
            cx.shadowBlur = 14;
            cx.beginPath();
            cx.arc(px, py, r, ang, ang + Math.PI * 0.9);
            cx.stroke();
            cx.restore();
        }
        // Screen edge pulse
        const edgeA = 0.08 + Math.sin(state.et * 0.01) * 0.05;
        const eg = cx.createRadialGradient(C.W / 2, C.H / 2, C.H * 0.3, C.W / 2, C.H / 2, C.H * 0.9);
        eg.addColorStop(0, 'rgba(0,0,0,0)');
        eg.addColorStop(1, `hsla(${state.curHue}, 100%, 70%, ${edgeA})`);
        cx.fillStyle = eg;
        cx.fillRect(0, 0, C.W, C.H);
        cx.shadowBlur = 0;
    }
}

function rVolToast() {
    if (state.volDisplayT <= 0) return;
    const alpha = Math.min(1, state.volDisplayT / 400);
    const pct = Math.round(state.volume * 100);
    const barW = 100;

    cx.save();
    cx.globalAlpha = alpha;
    const tx = C.W / 2 - 70, ty = 12;
    cx.fillStyle = 'rgba(0,0,0,0.75)';
    cx.fillRect(tx, ty, 140, 38);
    cx.strokeStyle = `hsla(${state.curHue}, 80%, 60%, 0.5)`;
    cx.lineWidth = 1;
    cx.strokeRect(tx, ty, 140, 38);

    cx.fillStyle = 'rgba(255,255,255,0.5)';
    cx.font = '9px "Space Mono",monospace';
    cx.textAlign = 'left';
    cx.textBaseline = 'top';
    cx.fillText('VOLUMEN', tx + 10, ty + 8);

    cx.fillStyle = 'rgba(255,255,255,0.15)';
    cx.fillRect(tx + 10, ty + 24, barW, 7);
    cx.fillStyle = `hsla(${state.curHue}, 100%, 60%, 1)`;
    cx.fillRect(tx + 10, ty + 24, barW * state.volume, 7);

    cx.fillStyle = '#fff';
    cx.font = 'bold 11px "Space Mono",monospace';
    cx.textAlign = 'right';
    cx.textBaseline = 'top';
    cx.fillText(pct + '%', tx + 130, ty + 8);
    cx.restore();
}

function rParts() {
    for (const p of state.parts) {
        cx.globalAlpha = p.l;
        cx.fillStyle = p.s > 2 ? '#fff' : '#00f0ff';
        cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, Math.PI * 2); cx.fill();
    }
    cx.globalAlpha = 1;
}

function rDarkness() {
    const g = cx.createLinearGradient(0, 0, C.PX + C.PS, 0);
    g.addColorStop(0, C.COL.BG);
    g.addColorStop(0.7, C.COL.BG + '00');
    cx.fillStyle = g;
    cx.fillRect(0, 0, C.PX + C.PS, C.H);
}

function rGuide() {
    cx.save();
    cx.setLineDash([8, 8]);
    const alpha = 0.12 + (state.guideFlash * 0.4);
    cx.strokeStyle = state.guideFlash > 0 ? `rgba(0, 255, 68, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
    cx.lineWidth = 1 + (state.guideFlash * 1.5);
    if (state.guideFlash > 0) { cx.shadowColor = '#0c4'; cx.shadowBlur = 15 * state.guideFlash; }
    cx.beginPath(); cx.moveTo(C.PX, 0); cx.lineTo(C.PX, C.H); cx.stroke();
    cx.restore();
}

function rVisualizer() {
    if (!Sfx.ana || (state.gs !== GS.PLAY && state.gs !== GS.COUNTDOWN)) return;
    const bars = 20, barW = (C.W / 2) / bars;
    cx.save();
    cx.fillStyle = `hsla(${state.curHue}, 100%, 50%, 0.3)`;
    for (let i = 0; i < bars; i++) {
        const idx = Math.floor((i / bars) * 60);
        const v = Sfx.fData[idx];
        const h = (v / 255) * 160;
        const xR = (C.W / 2) + (i * barW);
        const xL = (C.W / 2) - (i * barW) - barW;
        cx.fillRect(xR, C.H - h, barW - 4, h);
        cx.fillRect(xL, C.H - h, barW - 4, h);
        cx.fillStyle = `hsla(${state.curHue}, 100%, 80%, 0.5)`;
        cx.fillRect(xR, C.H - h, barW - 4, 2);
        cx.fillRect(xL, C.H - h, barW - 4, 2);
        cx.fillStyle = `hsla(${state.curHue}, 100%, 50%, 0.3)`;
    }
    cx.restore();
}

function rScAnim() {
    if (!state.scoreA.on) return;
    const t = state.scoreA.t;
    let s = 1, o = 1;
    if (t < 100) {
        s = 0.4 + (t / 100) * 1.0;
    } else if (t < 200) {
        s = 1.4 - ((t - 100) / 100) * 0.4;
    } else if (t < 500) {
        const prog = (t - 200) / 300;
        s = 1.0 - prog * 0.05;
        o = 1.0 - prog;
    } else {
        state.scoreA.on = false; return;
    }
    cx.save(); cx.globalAlpha = o;
    cx.translate(C.W / 2, C.H / 2); cx.scale(s, s);
    cx.fillStyle = C.COL.ST;
    cx.font = 'bold 90px "Space Mono",monospace';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.shadowColor = '#fff'; cx.shadowBlur = 20;
    cx.fillText(state.scoreA.s, 0, 0);
    cx.restore();
}

function rCountdown() {
    if (state.gs !== GS.COUNTDOWN) return;
    const p = state.countT / 1000;
    let s = '';
    if (p > 2) s = 'PREPARADO'; else if (p > 1) s = 'LISTO'; else s = 'INICIA';
    const alpha = p < 0.3 ? p / 0.3 : 1;
    cx.save();
    cx.globalAlpha = 0.85 * alpha;
    cx.fillStyle = 'rgba(0,0,0,0.9)';
    cx.fillRect(0, 0, C.W, C.H);
    cx.restore();
    const beatProg = 1 - (p % 1);
    const scale = 1 + Math.sin(beatProg * Math.PI) * 0.15;
    cx.save();
    cx.globalAlpha = alpha;
    cx.translate(C.W / 2, C.H / 2); cx.scale(scale, scale);
    cx.fillStyle = '#fff';
    cx.font = "bold 80px 'Space Mono',monospace";
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.shadowColor = '#00f0ff'; cx.shadowBlur = 30;
    cx.fillText(s, 0, 0);
    cx.restore();
}

function rTierBanner() {
    const msg = state.tierMsg;
    if (!msg || msg.t <= 0) return;
    const dur = 3000;
    const age = dur - msg.t;
    let scale, alpha;
    if (age < 200) {
        scale = 0.3 + (age / 200) * 0.9;
        alpha = age / 200;
    } else if (age < 2600) {
        scale = 1.0 + Math.sin((age - 200) / 2400 * Math.PI) * 0.06;
        alpha = 1;
    } else {
        const fade = (age - 2600) / 400;
        scale = 1.0 - fade * 0.1;
        alpha = 1 - fade;
    }
    if (alpha <= 0) return;

    const hues = [0, 0, 0, 0, 180, 55, 270, 60];
    const h = hues[msg.tier] || state.curHue;

    cx.save();
    cx.globalAlpha = alpha;
    cx.translate(C.W / 2, C.H * 0.3);
    cx.scale(scale, scale);
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';

    // glow backdrop
    cx.shadowColor = `hsla(${h}, 100%, 70%, 1)`;
    cx.shadowBlur = 30;
    cx.fillStyle = `hsla(${h}, 100%, 75%, 1)`;
    cx.font = "bold 32px 'Space Mono',monospace";
    cx.fillText(msg.text, 0, 0);

    cx.shadowBlur = 12;
    cx.fillStyle = `rgba(255,255,255,0.85)`;
    cx.font = "bold 14px 'Space Mono',monospace";
    cx.fillText(msg.sub, 0, 30);

    cx.restore();
    cx.shadowBlur = 0;
}

export function render() {
    cx.clearRect(0, 0, C.W, C.H);
    rBg();
    rVisualizer();
    rGuide();
    if (state.gs === GS.MENU) { cx.globalAlpha = .2; rBlocks(); cx.globalAlpha = 1; return; }
    rBlocks();
    rDarkness();
    rParts(); rPlayer();
    if (state.beatFlash > 0) { cx.fillStyle = `hsla(${state.curHue}, 80%, 80%, ${state.beatFlash * 0.6})`; cx.fillRect(0, 0, C.W, C.H); }
    if (state.flash > 0) { cx.fillStyle = `rgba(255,0,0,${state.flash})`; cx.fillRect(0, 0, C.W, C.H); }
    if (state.flashW > 0) {
        const g = cx.createRadialGradient(state.flashPos.x, state.flashPos.y, 0, state.flashPos.x, state.flashPos.y, 300);
        g.addColorStop(0, `rgba(255,255,255,${state.flashW})`);
        g.addColorStop(0.5, `rgba(0,240,255,${state.flashW * 0.3})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        cx.fillStyle = g; cx.fillRect(0, 0, C.W, C.H);
    }
    rScAnim(); rCountdown();
    rTierBanner();
    rVolToast();
}
