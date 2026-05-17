import { drawCube, drawCat, drawFox, drawDrone, drawGhost, drawUFO, drawNinja, drawShark } from './characters.js';

const CHARS = [
    { id: 'CUBE',  draw: drawCube  },
    { id: 'CAT',   draw: drawCat   },
    { id: 'FOX',   draw: drawFox   },
    { id: 'DRONE', draw: drawDrone },
    { id: 'GHOST', draw: drawGhost },
    { id: 'UFO',   draw: drawUFO   },
    { id: 'NINJA', draw: drawNinja },
    { id: 'SHARK', draw: drawShark },
];

const TIER_LABELS   = ['BASE', '✦ TIER I', '✦✦ TIER II', '✦✦✦ TIER III', '⚡ EPIC ⚡'];
const TIER_COLORS   = ['rgba(200,220,255,0.45)', '#7df', '#7df', '#fa0', '#ff7700'];
const TIER_HOLD_MS  = [1100, 900, 900, 900, 0];   // ms each tier is shown (0 = hold forever)
const CV  = 72;   // canvas size px
const PSZ = 34;   // character draw size

const state = {};  // keyed by charId

// ─── Draw one preview frame ───────────────────────────────────────────────────
function drawFrame(charId, tier, elapsed) {
    const s = state[charId];
    if (!s) return;
    const cx = s.ctx;
    const hue = (elapsed * 0.05) % 360;

    cx.clearRect(0, 0, CV, CV);

    // Epic background glow
    if (tier >= 4) {
        const rg = cx.createRadialGradient(CV / 2, CV / 2, 0, CV / 2, CV / 2, 46);
        rg.addColorStop(0, `hsla(${hue}, 100%, 22%, 0.65)`);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        cx.fillStyle = rg;
        cx.fillRect(0, 0, CV, CV);
    }

    // Tier 3+: orbiting particles
    if (tier >= 3) {
        for (let i = 0; i < 4; i++) {
            const angle = elapsed * 0.004 + i * Math.PI / 2;
            const ox = CV / 2 + Math.cos(angle) * PSZ * 0.88;
            const oy = CV / 2 + Math.sin(angle) * PSZ * 0.88;
            cx.save();
            const ph = (hue + i * 70) % 360;
            cx.fillStyle = `hsla(${ph}, 100%, 80%, 0.95)`;
            cx.shadowColor = `hsla(${ph}, 100%, 80%, 1)`;
            cx.shadowBlur = 8;
            cx.beginPath();
            cx.arc(ox, oy, 3, 0, Math.PI * 2);
            cx.fill();
            cx.restore();
        }
    }

    // Tier 2+: aura ring
    if (tier >= 2) {
        const pulse = 1 + Math.sin(elapsed * 0.01) * 0.15;
        cx.save();
        cx.strokeStyle = `hsla(${(hue + 40) % 360}, 100%, 75%, 0.6)`;
        cx.lineWidth = 2;
        cx.shadowColor = `hsla(${(hue + 40) % 360}, 100%, 75%, 1)`;
        cx.shadowBlur = 12;
        cx.beginPath();
        cx.arc(CV / 2, CV / 2, PSZ * 0.72 * pulse, 0, Math.PI * 2);
        cx.stroke();
        cx.restore();
    }

    // Character
    cx.save();
    cx.translate(CV / 2, CV / 2);
    if (tier >= 1) {
        cx.shadowColor = `hsla(${hue}, 100%, 70%, 1)`;
        cx.shadowBlur = 6 + tier * 5;
    }
    s.draw(cx, PSZ, 'RUN', tier);
    cx.restore();
    cx.shadowBlur = 0;
}

// ─── RAF tick ─────────────────────────────────────────────────────────────────
function tick(charId, now) {
    const s = state[charId];
    if (!s) return;

    const dt = Math.min(now - s.lastTime, 100);
    s.lastTime = now;
    s.elapsed  += dt;

    // Advance tier while hovered and not at max
    if (s.hovered && s.tier < 4) {
        s.holdT += dt;
        if (TIER_HOLD_MS[s.tier] > 0 && s.holdT >= TIER_HOLD_MS[s.tier]) {
            s.tier++;
            s.holdT = 0;
            setLabel(charId, s.tier);
        }
    }

    drawFrame(charId, s.tier, s.elapsed);
    s.rafId = requestAnimationFrame(t => tick(charId, t));
}

function setLabel(charId, tier) {
    const s = state[charId];
    if (!s) return;
    const t = Math.min(tier, 4);
    s.labelEl.textContent = TIER_LABELS[t];
    s.labelEl.style.color = TIER_COLORS[t];
}

function stopAnim(charId) {
    const s = state[charId];
    if (!s || !s.rafId) return;
    cancelAnimationFrame(s.rafId);
    s.rafId = null;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function initCharPreviews(activeChar) {
    for (const ch of CHARS) {
        const card = document.querySelector(`.char-card[data-char="${ch.id}"]`);
        if (!card) continue;
        const canvas  = card.querySelector('.char-cv');
        const labelEl = card.querySelector('.char-tier-label');
        if (!canvas || !labelEl) continue;

        canvas.width  = CV;
        canvas.height = CV;
        const ctx = canvas.getContext('2d');

        state[ch.id] = {
            ctx, draw: ch.draw,
            tier: 0, holdT: 0, elapsed: 0,
            hovered: false, lastTime: performance.now(),
            rafId: null, resetTimer: null, labelEl,
        };

        // Static base frame on load
        drawFrame(ch.id, 0, 0);
        setLabel(ch.id, 0);

        card.addEventListener('mouseenter', () => {
            const s = state[ch.id];
            clearTimeout(s.resetTimer);
            s.hovered = true;
            // Always restart evolution from base
            s.tier = 0; s.holdT = 0; s.elapsed = 0;
            s.lastTime = performance.now();
            setLabel(ch.id, 0);
            if (!s.rafId) s.rafId = requestAnimationFrame(t => tick(ch.id, t));
        });

        card.addEventListener('mouseleave', () => {
            const s = state[ch.id];
            s.hovered = false;
            // Epic form lingers for 2s, then resets
            clearTimeout(s.resetTimer);
            s.resetTimer = setTimeout(() => {
                if (!s.hovered) {
                    stopAnim(ch.id);
                    s.tier = 0; s.holdT = 0; s.elapsed = 0;
                    setLabel(ch.id, 0);
                    drawFrame(ch.id, 0, 0);
                }
            }, 2000);
        });

        if (ch.id === activeChar) card.classList.add('active');
    }
}

export function updateActivePreview(charId) {
    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('active'));
    const active = document.querySelector(`.char-card[data-char="${charId}"]`);
    if (active) active.classList.add('active');
}
