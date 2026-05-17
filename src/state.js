import { C, GS } from './constants.js';

export const state = {
    gs: GS.MENU,
    paused: false,
    lt: performance.now(),
    et: 0,
    gt: 0,
    sc: 0,
    bestSc: 0,
    totalBl: 0,
    totalSuccess: 0,
    coinsCollected: 0,
    totalScore: 0,
    blocks: [],
    parts: [],
    stars: [],
    coins: [],
    pl: {
        y: C.H / 2,
        vy: 0,
        grav: 'DOWN',
        sx: 1,
        sy: 1,
        sq: 0,
        trail: [],
        tt: 0,
        lastGY: 0,
        lastSide: null,
        onSurface: false,
        char: 'CAT',
    },
    curSong: null,
    tapTimes: [],
    tapStart: 0,
    tapTimer: 0,
    scoreA: { on: false, s: 0, t: 0 },
    flash: 0,
    flashW: 0,
    flashPos: { x: 0, y: 0 },
    countT: 0,
    guideFlash: 0,
    curHue: 200,
    energyMult: 1.0,
    smoothEnergy: 0,
    smoothedRMS: 0,
    v_target: 320,
    lastBeatEnergy: 0,
    beatCooldown: 0,
    beatFlash: 0,
    dynamicGap: C.GAP,
    volume: 0.2,
    volDisplayT: 0,
    lastTier: 0,
    tierMsg: { text: '', sub: '', t: 0, tier: 0 },
    // ── New: music-reactive controller state ─────────────────────────────
    totalMapWidth: 0,          // total pixel width of all blocks
    musicSpeedMult: 1.0,       // current real-time speed multiplier from music energy
    controllerError: 0,        // sync error (distance ahead/behind)
    smoothSpeedFactor: 1.0,    // smoothed energy envelope factor
    beatPulse: 0,              // transient beat pulse (decays per frame)
    rmsMax: 0.01,              // dynamic max volume tracking for color
    rmsMin: 1.0,               // dynamic min volume tracking for color
    outroInjected: false,      // flag to ensure outro is only injected once
};
