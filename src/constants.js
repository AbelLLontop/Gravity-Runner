export const C = {
    W: 900, H: 500, PX: 150, PS: 32, GAP: 96, SPD: 200, MBH: 30, GS: 0.09, GM: 18, DUR: 60,
    COL: { BG: '#020205', PL: '#e0faff', BB: 'rgba(10, 40, 100, 0.6)', BL: '#00f0ff', BS: 'rgba(0, 240, 255, 0.3)', ST: '#fff', GR: 'rgba(0, 240, 255, 0.05)' }
};

export const GS = { MENU: 0, TAP: 1, SAVE: 2, PLAY: 3, OVER: 4, COUNTDOWN: 5 };

export const STEP_Y = 50;

export const LEVELS = (() => {
    const mid = C.H / 2 - C.GAP / 2;
    const arr = [];
    for (let i = -3; i <= 3; i++) arr.push(Math.round(mid + i * STEP_Y));
    return arr;
})();

// Streak tiers: 0-3 visual FX, 4-7 character transformations
export function getStreakTier(sc) {
    if (sc >= 175) return 7;
    if (sc >= 150) return 6;
    if (sc >= 125) return 5;
    if (sc >= 100) return 4;
    if (sc >= 50)  return 3;
    if (sc >= 25)  return 2;
    if (sc >= 10)  return 1;
    return 0;
}

export const TIER_MSGS = {
    4: { text: '✦ POWERED UP ✦',  sub: 'x100 RACHA' },
    5: { text: '⚡ UNLEASHED ⚡',  sub: 'x125 RACHA' },
    6: { text: '★  ASCENDED  ★',  sub: 'x150 RACHA' },
    7: { text: '∞  GOD MODE  ∞',  sub: 'x175 RACHA' },
};
