import { Sfx } from './audio.js';
import { state } from './state.js';

export const keys = {};

export function resetKeys() {
    for (const k in keys) delete keys[k];
}

export function setupInput({ onPause }) {
    window.addEventListener('keydown', e => {
        keys[e.key] = true;
        Sfx.init();
        if (e.key === 'p' || e.key === 'P' || e.key === ' ') onPause();
        
        if (e.key === '+' || e.key === '=') {
            state.volume = Math.max(0, Math.min(1, state.volume + 0.05));
            Sfx.setVolume(state.volume);
            localStorage.setItem('gr_volume', state.volume);
            state.volDisplayT = 2000;
        }
        if (e.key === '-' || e.key === '_') {
            state.volume = Math.max(0, Math.min(1, state.volume - 0.05));
            Sfx.setVolume(state.volume);
            localStorage.setItem('gr_volume', state.volume);
            state.volDisplayT = 2000;
        }
    });
    window.addEventListener('keyup', e => { keys[e.key] = false; });
    window.addEventListener('mousedown', () => Sfx.init());
}
