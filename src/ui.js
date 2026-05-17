import { C, GS, LEVELS } from './constants.js';
import { state } from './state.js';
import { Sfx } from './audio.js';
import { SM, MusicCache } from './storage.js';
import { resetKeys } from './input.js';
import { genObstacles } from './obstacles.js';
import { updateHUD, fmtTime } from './physics.js';
import { initCharPreviews, updateActivePreview } from './charPreview.js';

let _previewsInited = false;

export function show(id) { const el = document.getElementById(id); if (el) el.classList.remove('hd'); }
export function hide(id) { const el = document.getElementById(id); if (el) el.classList.add('hd'); }

export function showMenu() {
    state.gs = GS.MENU;
    state.paused = false;
    state.blocks = [];
    state.et = 0;
    resetKeys();
    Sfx.stopMusic();
    updateCharUI();
    hide('ui-hud'); hide('ui-save'); hide('ui-go'); hide('ui-pause'); hide('ui-help'); show('ui-menu');

    const el = document.getElementById('slist');
    el.innerHTML = '';
    const songs = SM.all();
    if (!songs.length) {
        el.innerHTML = '<div style="padding:15px;text-align:center;opacity:.5">No hay canciones. ¡Crea una!</div>';
        return;
    }
    songs.forEach(s => {
        const d = document.createElement('div'); d.className = 'si';

        const info = document.createElement('div');
        info.style.textAlign = 'left';
        info.innerHTML = `<div style="font-weight:bold">${s.name}</div>
                          <div style="font-size:11px;opacity:.6">${s.bpm} BPM ${s.hasMusic ? '• ♫' : ''}</div>`;

        const score = document.createElement('div');
        score.className = 'si-score';
        const acc = s.bestAcc || 0;
        score.style.color = acc > 0 ? '#0c4' : 'rgba(255,255,255,.2)';
        score.textContent = acc + '%';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '5px';
        actions.style.justifyContent = 'flex-end';

        const bp = document.createElement('button'); bp.className = 'bp'; bp.textContent = '▶ JUGAR';
        bp.style.padding = '5px 10px'; bp.onclick = () => startPlay(s);

        const bd = document.createElement('button'); bd.className = 'bd'; bd.textContent = '🗑';
        bd.onclick = () => { if (confirm('¿Borrar canción?')) { SM.del(s.id); showMenu(); } };

        actions.appendChild(bp); actions.appendChild(bd);
        d.appendChild(info); d.appendChild(score); d.appendChild(actions);
        el.appendChild(d);
    });
}

export function startTap() {
    hide('ui-menu'); show('ui-save');
    document.getElementById('sname').value = 'Nivel ' + Math.floor(Math.random() * 1000);
    document.getElementById('sbpm').value = '120';
    setTimeout(() => document.getElementById('sname').focus(), 100);
}

export function saveSong() {
    const nameEl = document.getElementById('sname');
    const bpmEl = document.getElementById('sbpm');
    const musicEl = document.getElementById('smusic');
    if (!nameEl || !bpmEl) return;

    const name = nameEl.value.trim() || 'Sin nombre';
    const bpm = parseInt(bpmEl.value) || 120;
    const musicFile = musicEl ? musicEl.files[0] : null;
    const id = Date.now().toString();

    if (musicFile) MusicCache[id] = musicFile;

    SM.save({ id, name, bpm, hasMusic: !!musicFile, createdAt: Date.now() });
    showMenu();
}

export function startPlay(song) {
    state.curSong = song;
    state.gs = GS.COUNTDOWN;
    state.paused = false;
    resetGame();
    state.et = 0;
    state.countT = 3000;

    hide('ui-menu'); hide('ui-go'); show('ui-hud');
    document.getElementById('h-bpm').textContent = '♫ ' + song.bpm + ' BPM';

    const mFile = MusicCache[song.id];
    if (mFile) {
        Sfx.loadMusic(mFile);
        const profilePromise = Sfx.analyzeBeatProfile(mFile, song.bpm);
        Sfx.aud.onloadedmetadata = () => {
            const dur = Sfx.aud.duration || 60;
            genObstacles(song, dur);
            Sfx.playMusic(state.volume);
            profilePromise.then(profile => {
                if (profile.length > 0 && state.gs === GS.COUNTDOWN) {
                    song.beatProfile = profile;
                    genObstacles(song, dur);
                }
            });
        };
        if (Sfx.aud.readyState >= 1) Sfx.aud.onloadedmetadata();
    } else {
        genObstacles(song, 60);
    }

    const b0 = state.blocks[0] || { gy: LEVELS[3] };
    state.pl.grav = 'UP'; state.pl.vy = 0;
    state.pl.y = b0.gy + (C.GAP / 2) - (C.PS / 2);
    state.pl.lastGY = b0.gy; state.pl.lastSide = 'BOT';
    updateHUD();
}

export function showGameOver() {
    state.gs = GS.OVER;
    Sfx.stopMusic();
    hide('ui-hud'); show('ui-go');
    const acc = state.totalBl > 0 ? Math.round((state.bestSc / state.totalBl) * 100) : 0;
    if (state.curSong) SM.updateBest(state.curSong.id, acc);
    document.getElementById('go-sc').textContent = 'Porcentaje: ' + acc + '% | Bloques: ' + state.totalBl;
}

export function togglePause() {
    if (state.gs !== GS.PLAY) return;
    state.paused = !state.paused;
    if (state.paused) {
        Sfx.aud.pause();
        show('ui-pause');
    } else {
        Sfx.aud.play().catch(e => { if (e.name !== 'AbortError') console.error('Pause Resume Error:', e); });
        hide('ui-pause');
    }
}

export function retryGame() {
    if (state.curSong) startPlay(state.curSong);
}

export function setChar(c) {
    state.pl.char = c;
    localStorage.setItem('gr_char', c);
    updateCharUI();
}

export function updateCharUI() {
    updateActivePreview(state.pl.char);
}

export function showSettings() {
    show('ui-settings');
    applyFullscreen(_fsEnabled); // sync button state
    if (!_previewsInited) {
        initCharPreviews(state.pl.char);
        _previewsInited = true;
    } else {
        updateActivePreview(state.pl.char);
    }
}

export function showHelp() { show('ui-help'); }
export function hideHelp() { hide('ui-help'); }
export function hideSettings() { hide('ui-settings'); }

export async function detectBPMFromInput(input) {
    const file = input.files[0];
    if (!file) return;
    const status = document.getElementById('bpm-status');
    status.textContent = 'Analizando...';
    try {
        const bpm = await Sfx.analyzeBPM(file);
        document.getElementById('sbpm').value = bpm;
        status.textContent = 'OK!';
    } catch (e) {
        status.textContent = 'Error';
    }
    setTimeout(() => { status.textContent = ''; }, 2000);
}

export function adjBPM(m) {
    const el = document.getElementById('sbpm');
    const v = Math.round(parseInt(el.value) * m);
    if (v >= 40 && v <= 600) el.value = v;
}

function resetGame() {
    state.blocks = []; state.parts = []; state.pl.trail = [];
    state.et = 0; state.sc = 0; state.bestSc = 0; state.totalBl = 0; state.totalSuccess = 0;
    state.scoreA.on = false; state.flash = 0; state.pl.vy = 0;
    state.energyMult = 1.0; state.smoothEnergy = 0;
    state.lastBeatEnergy = 0; state.beatCooldown = 0; state.beatFlash = 0;
    state.dynamicGap = C.GAP;
    state.lastTier = 0; state.tierMsg = { text: '', sub: '', t: 0, tier: 0 };
}

// ─── Fullscreen mode ─────────────────────────────────────────────────────────
let _fsEnabled = localStorage.getItem('gr_fullscreen') === '1';

function applyFullscreen(enabled) {
    const gc = document.getElementById('gc');
    if (!gc) return;
    if (enabled) {
        const scale = Math.min(window.innerWidth / 900, window.innerHeight / 500);
        gc.style.transform = `scale(${scale})`;
        document.body.classList.add('fs-mode');
    } else {
        gc.style.transform = '';
        document.body.classList.remove('fs-mode');
    }
    const btn = document.getElementById('btn-fullscreen');
    if (btn) {
        btn.textContent = enabled ? 'ON' : 'OFF';
        btn.style.borderColor = enabled ? '#0cf' : '';
        btn.style.color = enabled ? '#0cf' : '';
        btn.style.boxShadow = enabled ? '0 0 10px #0cf' : '';
    }
}

export function toggleFullscreenMode() {
    _fsEnabled = !_fsEnabled;
    localStorage.setItem('gr_fullscreen', _fsEnabled ? '1' : '0');
    applyFullscreen(_fsEnabled);
}

// Apply on load
applyFullscreen(_fsEnabled);

// Re-apply on window resize while in fs mode
window.addEventListener('resize', () => { if (_fsEnabled) applyFullscreen(true); });

// Expose to HTML onclick handlers
window.showMenu = showMenu;
window.startTap = startTap;
window.saveSong = saveSong;
window.startPlay = startPlay;
window.togglePause = togglePause;
window.showHelp = showHelp;
window.hideHelp = hideHelp;
window.showSettings = showSettings;
window.hideSettings = hideSettings;
window.setChar = setChar;
window.detectBPMFromInput = detectBPMFromInput;
window.adjBPM = adjBPM;
window.toggleFullscreenMode = toggleFullscreenMode;
window.retryGame = retryGame;
