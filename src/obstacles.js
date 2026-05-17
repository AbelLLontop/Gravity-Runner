import { C, GS, LEVELS, STEP_Y } from './constants.js';
import { state } from './state.js';

export function getSpeed() {
    return 320;
}

export function genObstacles(song, duration) {
    state.blocks = [];
    state.coins = [];
    const bw = C.PS * 5;
    let curX = 0;
    let curGY = LEVELS[3];
    let targetGY = LEVELS[3];
    const stepAmount = STEP_Y;

    function addBlock(x, w, gy, noScore = false, gap = C.GAP) {
        state.blocks.push({ x, w, gy, gap, passed: false, hit: false, scored: false, sndTouch: false, noScore });
    }

    const spd = getSpeed();
    const blockTime = (bw / spd) * 1000;
    const countdownBlocks = Math.ceil(3500 / blockTime);

    for (let i = 0; i < countdownBlocks; i++) {
        addBlock(curX, bw, curGY, true);
        curX += bw;
    }

    const profile = song.beatProfile;
    const hasProfile = profile && profile.energyProfile && profile.energyProfile.length > 0;
    
    // We don't need to perfectly calculate the map length anymore.
    // We will generate an abundance of blocks (enough for 2.5x speed)
    // and dynamically cut to the outro when the song has exactly 5 seconds left.
    const actionDuration = Math.max(0, duration);
    const safeMaxSpeedMult = 2.5; 
    const actionDist = actionDuration * (spd * safeMaxSpeedMult);
    let numActionBlocks = Math.ceil(actionDist / bw);

    // Approximate time spent in countdown (for terrain generation syncing)
    const countdownTimeActual = (countdownBlocks * bw) / spd;

    const energyArr = hasProfile ? profile.energyProfile : [];
    const profileCenter = Math.floor(LEVELS.length / 2);

    let patternType = 'NONE';
    let patternCount = 0;

    for (let i = 0; i < numActionBlocks; i++) {
        if (patternCount <= 0) {
            const r = Math.random();
            if (r < 0.15) {
                patternType = 'ESCALERA_UP';
                patternCount = 2 + Math.floor(Math.random() * 3);
            } else if (r < 0.30) {
                patternType = 'ESCALERA_DOWN';
                patternCount = 2 + Math.floor(Math.random() * 3);
            } else if (r < 0.65) {
                patternType = 'ZIGZAG';
                patternCount = 4 + Math.floor(Math.random() * 4);
            } else {
                patternType = 'MUSIC_RANDOM';
                patternCount = 1 + Math.floor(Math.random() * 2);
            }
        }

        if (patternType === 'ESCALERA_UP') {
            targetGY = curGY - STEP_Y;
        } else if (patternType === 'ESCALERA_DOWN') {
            targetGY = curGY + STEP_Y;
        } else if (patternType === 'ZIGZAG') {
            targetGY = (i % 2 === 0) ? LEVELS[1] : LEVELS[5];
        } else {
            if (hasProfile) {
                // Map the energy profile window to this block's time position
                const blockTimeSec = countdownTimeActual + i * 0.5;
                const windowMs = profile.windowMs || 100;
                const pidx = Math.min(energyArr.length - 1, Math.floor((blockTimeSec * 1000) / windowMs));
                let musicIdx = Math.round(energyArr[pidx] * (LEVELS.length - 1));
                if (Math.random() < 0.3) musicIdx = Math.max(0, Math.min(LEVELS.length - 1, musicIdx + (Math.random() > 0.5 ? 1 : -1)));
                targetGY = LEVELS[musicIdx];
            } else {
                targetGY = LEVELS[Math.floor(Math.random() * LEVELS.length)];
            }
        }

        targetGY = Math.max(LEVELS[0], Math.min(LEVELS[LEVELS.length - 1], targetGY));

        if (curGY < targetGY) curGY = Math.min(targetGY, curGY + stepAmount);
        else if (curGY > targetGY) curGY = Math.max(targetGY, curGY - stepAmount);

        addBlock(curX, bw, curGY, false, C.GAP);
        
        if (Math.random() < 0.6) {
            const isTop = Math.random() > 0.5;
            const coinY = isTop ? curGY + C.PS / 2 : curGY + C.GAP - C.PS / 2;
            state.coins.push({ x: curX + bw / 2, y: coinY, collected: false });
        }

        curX += bw;
        patternCount--;
    }

    // We do not append the outro block here. The physics engine will dynamically
    // inject it exactly when 5.0 seconds remain in the song.
    
    // Reset closed-loop variables since we don't need them anymore
    state.totalMapWidth = 0;
}
