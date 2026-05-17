import { state } from './state.js';

// ─── TIER 0–3: formas originales ────────────────────────────────────────────

export function drawCube(cx, s, drawState, tier = 0) {
    if (tier >= 4) { drawHyperCube(cx, s, drawState); return; }
    let main = `hsla(${state.curHue}, 100%, 85%, 1)`;
    if (drawState === 'CRASH') { main = '#ff4444'; cx.translate(Math.sin(state.et * 0.1) * 3, Math.cos(state.et * 0.1) * 3); }
    const g = cx.createRadialGradient(0, 0, 0, 0, 0, s);
    g.addColorStop(0, '#fff'); g.addColorStop(0.3, `hsla(${state.curHue}, 100%, 75%, 1)`); g.addColorStop(1, main);
    cx.fillStyle = g; cx.globalAlpha = 0.8; cx.fillRect(-s / 2, -s / 2, s, s);
    cx.fillStyle = '#fff'; cx.globalAlpha = 0.6; cx.fillRect(-s / 2 + 4, -s / 2 + 4, 8, 8);
}

export function drawCat(cx, s, drawState, tier = 0) {
    if (tier >= 4) { drawVoidCat(cx, s, drawState); return; }
    const t = state.et * 0.01;
    let main = `hsla(${state.curHue}, 100%, 85%, 1)`, sec = `hsla(${state.curHue}, 100%, 60%, 1)`;
    if (drawState === 'CRASH') { main = '#ff4444'; sec = '#880000'; cx.translate(Math.sin(state.et * 0.1) * 3, Math.cos(state.et * 0.1) * 3); }
    const bob = drawState === 'RUN' ? Math.sin(t * 10) * 1.5 : 0; cx.translate(0, bob);
    cx.fillStyle = main;
    cx.fillRect(-s * 0.4, -s * 0.2, s * 0.8, s * 0.5); cx.fillRect(s * 0.1, -s * 0.3, s * 0.3, s * 0.2); cx.fillRect(s * 0.2, -s * 0.5, s * 0.4, s * 0.4);
    cx.fillStyle = sec; cx.fillRect(s * 0.2, -s * 0.6, s * 0.1, s * 0.15); cx.fillRect(s * 0.5, -s * 0.6, s * 0.1, s * 0.15);
    const tailY = Math.sin(t * 8) * (drawState === 'RUN' ? 6 : 1.5);
    cx.fillRect(-s * 0.5, -s * 0.1 + tailY * 0.5, s * 0.2, s * 0.2); cx.fillRect(-s * 0.6, -s * 0.2 + tailY, s * 0.2, s * 0.2);
    cx.fillStyle = sec;
    if (drawState === 'RUN') { const l1 = Math.sin(t*12)*4, l2 = Math.cos(t*12)*4; cx.fillRect(s*.2, s*.3+l1, s*.15, s*.2); cx.fillRect(-s*.3, s*.3+l2, s*.15, s*.2); }
    else { const ly = drawState === 'AIR' ? s*.1 : s*.25; cx.fillRect(s*.2, ly, s*.15, s*.15); cx.fillRect(-s*.3, ly, s*.15, s*.15); }
    if (drawState === 'CRASH') { cx.strokeStyle='#fff';cx.lineWidth=2;cx.beginPath();cx.moveTo(s*.35,-s*.4);cx.lineTo(s*.45,-s*.3);cx.stroke();cx.beginPath();cx.moveTo(s*.45,-s*.4);cx.lineTo(s*.35,-s*.3);cx.stroke(); }
    else { cx.fillStyle='#000';cx.fillRect(s*.4,-s*.4,s*.08,s*.08);cx.fillStyle='#fff';cx.fillRect(s*.4,-s*.4,s*.03,s*.03); }
}

export function drawFox(cx, s, drawState, tier = 0) {
    if (tier >= 4) { drawKitsune(cx, s, drawState); return; }
    const t = state.et * 0.01;
    let main = `hsla(${state.curHue}, 100%, 85%, 1)`, sec = `hsla(${state.curHue}, 100%, 60%, 1)`;
    if (drawState === 'CRASH') { main='#ff4444';sec='#880000';cx.translate(Math.sin(state.et*.1)*3,Math.cos(state.et*.1)*3); }
    const bob = drawState==='RUN'?Math.sin(t*12)*2:(drawState==='AIR'?Math.sin(t*4):0); cx.translate(0,bob);
    cx.fillStyle=main;cx.fillRect(-s*.45,-s*.15,s*.9,s*.4);cx.fillRect(s*.2,-s*.25,s*.3,s*.2);cx.fillRect(s*.3,-s*.45,s*.4,s*.35);cx.fillRect(s*.6,-s*.3,s*.2,s*.15);
    cx.fillStyle=sec;cx.beginPath();cx.moveTo(s*.3,-s*.45);cx.lineTo(s*.35,-s*.65);cx.lineTo(s*.45,-s*.45);cx.moveTo(s*.5,-s*.45);cx.lineTo(s*.55,-s*.65);cx.lineTo(s*.65,-s*.45);cx.fill();
    const ta=Math.sin(t*8)*(drawState==='RUN'?12:3);cx.fillRect(-s*.65,-s*.1+ta*.3,s*.25,s*.25);cx.fillStyle=main;cx.fillRect(-s*.85,-s*.15+ta*.7,s*.25,s*.25);
    cx.fillStyle=sec;
    if (drawState==='RUN'){const l1=Math.sin(t*15)*5,l2=Math.cos(t*15)*5;cx.fillRect(s*.3,s*.25+l1,s*.12,s*.25);cx.fillRect(-s*.4,s*.25+l2,s*.12,s*.25);}
    else{const ly=drawState==='AIR'?s*.1:s*.25;cx.fillRect(s*.3,ly,s*.12,s*.15);cx.fillRect(-s*.4,ly,s*.12,s*.15);}
    if (drawState==='CRASH'){cx.strokeStyle='#fff';cx.lineWidth=2;cx.beginPath();cx.moveTo(s*.4,-s*.35);cx.lineTo(s*.5,-s*.25);cx.stroke();cx.beginPath();cx.moveTo(s*.5,-s*.35);cx.lineTo(s*.4,-s*.25);cx.stroke();}
    else{cx.fillStyle='#000';cx.fillRect(s*.45,-s*.35,s*.08,s*.08);cx.fillStyle='#fff';cx.fillRect(s*.45,-s*.35,s*.03,s*.03);}
    cx.globalAlpha=0.6;cx.fillStyle=sec;cx.fillRect(s*.2,-s*.2,-s*.6,s*.08);cx.globalAlpha=1;
}

export function drawDrone(cx, s, drawState, tier = 0) {
    if (tier >= 4) { drawApexDrone(cx, s, drawState); return; }
    const t=state.et*.01;let main=`hsla(${state.curHue},100%,80%,1)`,glass=`hsla(${state.curHue},100%,40%,0.5)`,core=drawState==='CRASH'?'#ff3333':'#fff';
    if (drawState==='CRASH')cx.translate(Math.sin(state.et*.1)*4,Math.cos(state.et*.1)*4);
    const hov=Math.sin(t*8)*3;cx.translate(0,hov);
    cx.fillStyle=main;cx.fillRect(-s*.35,-s*.35,s*.7,s*.7);
    const wo=Math.sin(t*15)*5;cx.fillStyle=glass;cx.fillRect(s*.35,-s*.2+wo,s*.2,s*.4);cx.fillRect(-s*.55,-s*.2-wo,s*.2,s*.4);
    cx.fillStyle=core;cx.shadowBlur=15;cx.shadowColor=core;cx.beginPath();cx.arc(0,0,s*.15,0,Math.PI*2);cx.fill();cx.shadowBlur=0;
    cx.strokeStyle=`hsla(${state.curHue},100%,50%,0.8)`;cx.lineWidth=2;cx.strokeRect(-s*.25,-s*.25,s*.5,s*.5);
    if (drawState==='RUN'){cx.fillStyle=`hsla(${state.curHue},100%,60%,0.4)`;cx.fillRect(-s*.8,-s*.05,s*.4,s*.1);}
}

export function drawGhost(cx, s, drawState, tier = 0) {
    if (tier >= 4) { drawLich(cx, s, drawState); return; }
    const t=state.et*.01;cx.globalAlpha=drawState==='CRASH'?0.9:0.6;
    const drift=Math.sin(t*5)*4;cx.translate(drift,drift*.5);
    cx.fillStyle=drawState==='CRASH'?'#f00':'#fff';
    cx.beginPath();cx.arc(0,-s*.1,s*.4,Math.PI,0);cx.lineTo(s*.4,s*.4);
    for(let i=0;i<3;i++){const off=Math.sin(t*10+i)*5;cx.lineTo(s*.4-(i*s*.3),s*.4+off);}
    cx.lineTo(-s*.4,s*.4);cx.fill();
    cx.fillStyle='#000';cx.fillRect(-s*.2,-s*.1,s*.1,s*.1);cx.fillRect(s*.1,-s*.1,s*.1,s*.1);cx.globalAlpha=1;
}

export function drawUFO(cx, s, drawState, tier = 0) {
    if (tier >= 4) { drawMothership(cx, s, drawState); return; }
    const t=state.et*.01;let main=`hsla(${state.curHue},100%,70%,1)`;
    if(drawState==='CRASH'){main='#f00';cx.translate(Math.sin(state.et*.2)*5,0);}
    cx.fillStyle=main;cx.beginPath();cx.ellipse(0,0,s*.6,s*.25,0,0,Math.PI*2);cx.fill();
    cx.fillStyle=`hsla(${state.curHue},100%,90%,0.5)`;cx.beginPath();cx.arc(0,-s*.1,s*.25,Math.PI,0);cx.fill();
    for(let i=-2;i<=2;i++){const g=(Math.sin(t*10+i)+1)*.5;cx.fillStyle=`hsla(${(state.curHue+i*30)%360},100%,50%,${g})`;cx.fillRect(i*s*.2-2,s*.05,4,4);}
}

export function drawNinja(cx, s, drawState, tier = 0) {
    if (tier >= 4) { drawShadowDemon(cx, s, drawState); return; }
    const t=state.et*.01;let main='#111',sec=`hsla(${state.curHue},100%,50%,1)`;
    if(drawState==='CRASH'){main='#400';cx.translate(Math.sin(state.et*.1)*3,0);}
    cx.fillStyle=main;cx.fillRect(-s*.2,-s*.4,s*.4,s*.7);cx.fillStyle='#fdb';cx.fillRect(-s*.15,-s*.35,s*.3,s*.15);
    cx.fillStyle='#000';cx.fillRect(-s*.2,-s*.3,s*.4,s*.05);
    const scarfL=drawState==='RUN'?s*.8:s*.4;cx.fillStyle=sec;cx.beginPath();cx.moveTo(-s*.2,-s*.25);cx.bezierCurveTo(-s*.5,-s*.3+Math.sin(t*10)*10,-s*.7,-s*.1,-scarfL,-s*.2+Math.sin(t*10)*5);cx.lineTo(-s*.2,-s*.2);cx.fill();
    if(drawState==='RUN'){const l1=Math.sin(t*15)*6;cx.fillStyle=main;cx.fillRect(0,s*.3,s*.1,s*.15+l1);cx.fillRect(-s*.1,s*.3,s*.1,s*.15-l1);}
}

export function drawShark(cx, s, drawState, tier = 0) {
    if (tier >= 4) { drawMegalodon(cx, s, drawState); return; }
    const t=state.et*.01;let main=`hsla(${state.curHue},60%,40%,1)`;
    if(drawState==='CRASH'){main='#f33';cx.translate(Math.sin(state.et*.1)*4,0);}
    cx.fillStyle=main;cx.beginPath();cx.moveTo(s*.5,0);cx.quadraticCurveTo(0,-s*.4,-s*.5,0);cx.quadraticCurveTo(0,s*.4,s*.5,0);cx.fill();
    cx.beginPath();cx.moveTo(0,-s*.2);cx.lineTo(-s*.1,-s*.5);cx.lineTo(s*.1,-s*.2);cx.fill();
    const tw=Math.sin(t*15)*10;cx.beginPath();cx.moveTo(-s*.5,0);cx.lineTo(-s*.7,-s*.2+tw);cx.lineTo(-s*.7,s*.2+tw);cx.fill();
    cx.fillStyle='#fff';cx.fillRect(s*.2,-s*.1,2,2);
}

// ─── TIER 4: FORMAS ÉPICAS ───────────────────────────────────────────────────

function drawHyperCube(cx, s, drawState) {
    const t = state.et * 0.01;
    const h = state.curHue;
    if (drawState === 'CRASH') cx.translate(Math.sin(t * 10) * 3, Math.cos(t * 10) * 3);

    const ext = s * 0.65;
    // Outer energy frame
    cx.strokeStyle = `hsla(${h}, 100%, 75%, 0.9)`;
    cx.lineWidth = 2;
    cx.shadowColor = `hsla(${h}, 100%, 75%, 1)`;
    cx.shadowBlur = 20;
    cx.strokeRect(-ext, -ext, ext * 2, ext * 2);

    // Inner rotating cube
    cx.save();
    cx.rotate(t * 2.5);
    cx.strokeStyle = `hsla(${(h + 120) % 360}, 100%, 80%, 0.8)`;
    cx.lineWidth = 1.5;
    cx.shadowColor = `hsla(${(h + 120) % 360}, 100%, 80%, 1)`;
    cx.shadowBlur = 10;
    cx.strokeRect(-s * 0.28, -s * 0.28, s * 0.56, s * 0.56);
    cx.restore();

    // Cross-lines (circuit grid)
    cx.strokeStyle = `hsla(${h}, 100%, 60%, 0.35)`;
    cx.lineWidth = 1; cx.shadowBlur = 0;
    cx.beginPath();
    cx.moveTo(-ext, 0); cx.lineTo(ext, 0);
    cx.moveTo(0, -ext); cx.lineTo(0, ext);
    cx.stroke();

    // Pulsing corner nodes
    const pulse = (Math.sin(t * 7) + 1) * 0.5;
    for (let i = 0; i < 4; i++) {
        const bx = (i % 2 === 0 ? -1 : 1) * ext;
        const by = (i < 2 ? -1 : 1) * ext;
        cx.fillStyle = `hsla(${(h + i * 60) % 360}, 100%, 85%, ${0.6 + pulse * 0.4})`;
        cx.shadowColor = `hsla(${(h + i * 60) % 360}, 100%, 85%, 1)`;
        cx.shadowBlur = 6 + pulse * 10;
        cx.beginPath(); cx.arc(bx, by, 3 + pulse * 2, 0, Math.PI * 2); cx.fill();
    }
    cx.shadowBlur = 0;
}

function drawVoidCat(cx, s, drawState) {
    const t = state.et * 0.01;
    const fh = 15 + Math.sin(t * 5) * 15; // fire hue
    if (drawState === 'CRASH') cx.translate(Math.sin(t * 10) * 3, Math.cos(t * 10) * 3);

    // Fire aura tongues
    for (let i = 0; i < 6; i++) {
        const fa = (i / 6) * Math.PI * 2 + t * 2;
        const flen = s * 0.35 + Math.sin(t * 6 + i) * s * 0.15;
        cx.fillStyle = `hsla(${fh + i * 8}, 100%, 55%, 0.35)`;
        cx.beginPath();
        cx.ellipse(Math.cos(fa) * s * 0.35, Math.sin(fa) * s * 0.35 - flen * 0.3, s * 0.08, flen * 0.5, fa, 0, Math.PI * 2);
        cx.fill();
    }

    // Dark body
    cx.fillStyle = '#0d0008';
    cx.fillRect(-s * 0.4, -s * 0.2, s * 0.8, s * 0.5);
    cx.fillRect(s * 0.1, -s * 0.3, s * 0.3, s * 0.2);
    cx.fillRect(s * 0.2, -s * 0.5, s * 0.4, s * 0.4);

    // Flame outline
    cx.strokeStyle = `hsla(${fh}, 100%, 60%, 0.85)`;
    cx.lineWidth = 1.5;
    cx.shadowColor = `hsla(${fh}, 100%, 60%, 1)`;
    cx.shadowBlur = 10;
    cx.strokeRect(-s * 0.4, -s * 0.2, s * 0.8, s * 0.5);
    cx.shadowBlur = 0;

    // Fire ears
    cx.fillStyle = `hsla(${fh + 20}, 100%, 65%, 0.9)`;
    cx.fillRect(s * 0.22, -s * 0.62, s * 0.1, s * 0.16);
    cx.fillRect(s * 0.5, -s * 0.62, s * 0.1, s * 0.16);

    // Flame tail (3 tongues)
    for (let i = 0; i < 3; i++) {
        const tx = -s * 0.5 - i * s * 0.12;
        const ty = -s * 0.1 + Math.sin(t * 6 + i * 1.5) * s * 0.25;
        cx.fillStyle = `hsla(${fh + i * 20}, 100%, ${60 + i * 8}%, ${0.85 - i * 0.2})`;
        cx.fillRect(tx, ty, s * 0.14, s * 0.13);
    }

    // Burning eyes
    cx.fillStyle = `hsla(${fh + 10}, 100%, 75%, 1)`;
    cx.shadowColor = `hsla(${fh}, 100%, 70%, 1)`;
    cx.shadowBlur = 14;
    cx.fillRect(s * 0.38, -s * 0.42, s * 0.1, s * 0.09);
    cx.shadowBlur = 0;

    // Legs
    cx.fillStyle = '#1a000d';
    if (drawState === 'RUN') {
        const l1 = Math.sin(t * 12) * 4, l2 = Math.cos(t * 12) * 4;
        cx.fillRect(s * 0.2, s * 0.3 + l1, s * 0.14, s * 0.2);
        cx.fillRect(-s * 0.3, s * 0.3 + l2, s * 0.14, s * 0.2);
    } else {
        cx.fillRect(s * 0.2, s * 0.25, s * 0.14, s * 0.14);
        cx.fillRect(-s * 0.3, s * 0.25, s * 0.14, s * 0.14);
    }
}

function drawKitsune(cx, s, drawState) {
    const t = state.et * 0.01;
    const h = state.curHue;
    const gold = '#ffdd66';
    if (drawState === 'CRASH') { cx.translate(Math.sin(t * 10) * 3, Math.cos(t * 10) * 3); }
    const bob = drawState === 'RUN' ? Math.sin(t * 12) * 2 : 0;
    cx.translate(0, bob);

    // Three energy tails fanning behind
    for (let i = 0; i < 3; i++) {
        const spreadAngle = (i - 1) * 0.4;
        const tailWave = Math.sin(t * 6 + i * 1.2) * 8;
        const tx = -s * 0.55 - i * s * 0.12;
        const ty = -s * 0.15 + tailWave + (i - 1) * s * 0.18;
        const tailH = (state.curHue + i * 40) % 360;
        cx.fillStyle = `hsla(${tailH}, 100%, 70%, 0.85)`;
        cx.shadowColor = `hsla(${tailH}, 100%, 70%, 1)`;
        cx.shadowBlur = 8;
        cx.beginPath();
        cx.ellipse(tx, ty, s * 0.1, s * 0.28, spreadAngle - 0.3, 0, Math.PI * 2);
        cx.fill();
    }
    cx.shadowBlur = 0;

    // Body (golden tint)
    cx.fillStyle = gold;
    cx.fillRect(-s * 0.45, -s * 0.15, s * 0.9, s * 0.4);
    cx.fillRect(s * 0.2, -s * 0.25, s * 0.3, s * 0.2);
    cx.fillRect(s * 0.3, -s * 0.45, s * 0.4, s * 0.35);

    // Ears (golden pointed)
    cx.fillStyle = `hsla(${h}, 100%, 70%, 0.9)`;
    cx.beginPath();
    cx.moveTo(s * 0.3, -s * 0.45); cx.lineTo(s * 0.35, -s * 0.7); cx.lineTo(s * 0.45, -s * 0.45);
    cx.moveTo(s * 0.5, -s * 0.45); cx.lineTo(s * 0.55, -s * 0.7); cx.lineTo(s * 0.65, -s * 0.45);
    cx.fill();

    // Third eye (center forehead)
    const eyePulse = (Math.sin(t * 4) + 1) * 0.5;
    cx.fillStyle = `hsla(${(h + 60) % 360}, 100%, 80%, ${0.7 + eyePulse * 0.3})`;
    cx.shadowColor = `hsla(${(h + 60) % 360}, 100%, 80%, 1)`;
    cx.shadowBlur = 10 + eyePulse * 8;
    cx.beginPath(); cx.arc(s * 0.47, -s * 0.3, 3.5, 0, Math.PI * 2); cx.fill();
    cx.shadowBlur = 0;

    // Eyes
    cx.fillStyle = '#000'; cx.fillRect(s * 0.45, -s * 0.35, s * 0.08, s * 0.08);
    cx.fillStyle = gold; cx.fillRect(s * 0.45, -s * 0.35, s * 0.03, s * 0.03);

    // Floating kitsunebi orb
    const orbAngle = t * 3;
    const ox = Math.cos(orbAngle) * s * 0.7, oy = Math.sin(orbAngle) * s * 0.5 - s * 0.1;
    cx.fillStyle = `hsla(${(h + 90) % 360}, 100%, 75%, 0.9)`;
    cx.shadowColor = `hsla(${(h + 90) % 360}, 100%, 75%, 1)`;
    cx.shadowBlur = 12;
    cx.beginPath(); cx.arc(ox, oy, 4, 0, Math.PI * 2); cx.fill();
    cx.shadowBlur = 0;

    // Legs
    cx.fillStyle = gold;
    if (drawState === 'RUN') {
        const l1 = Math.sin(t * 15) * 5, l2 = Math.cos(t * 15) * 5;
        cx.fillRect(s * 0.3, s * 0.25 + l1, s * 0.12, s * 0.25);
        cx.fillRect(-s * 0.4, s * 0.25 + l2, s * 0.12, s * 0.25);
    } else {
        cx.fillRect(s * 0.3, s * 0.1, s * 0.12, s * 0.15);
        cx.fillRect(-s * 0.4, s * 0.1, s * 0.12, s * 0.15);
    }
}

function drawApexDrone(cx, s, drawState) {
    const t = state.et * 0.01;
    const h = state.curHue;
    const core = drawState === 'CRASH' ? '#ff3333' : '#fff';
    if (drawState === 'CRASH') cx.translate(Math.sin(t * 10) * 4, Math.cos(t * 10) * 4);

    const hov = Math.sin(t * 8) * 2; cx.translate(0, hov);

    // Armor shell (slightly bigger)
    cx.fillStyle = `hsla(${h}, 60%, 30%, 0.9)`;
    cx.fillRect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9);
    cx.fillStyle = `hsla(${h}, 80%, 50%, 0.6)`;
    cx.fillRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7);

    // Side cannons
    cx.fillStyle = `hsla(${h}, 70%, 40%, 0.9)`;
    cx.fillRect(s * 0.4, -s * 0.15, s * 0.35, s * 0.1);
    cx.fillRect(-s * 0.75, -s * 0.15, s * 0.35, s * 0.1);
    // Cannon tips (glowing)
    cx.fillStyle = `hsla(${h}, 100%, 70%, 1)`;
    cx.shadowColor = `hsla(${h}, 100%, 70%, 1)`;
    cx.shadowBlur = 8;
    cx.fillRect(s * 0.7, -s * 0.12, s * 0.08, s * 0.04);
    cx.fillRect(-s * 0.78, -s * 0.12, s * 0.08, s * 0.04);

    // Wings (animated)
    const wo = Math.sin(t * 12) * 4;
    cx.fillStyle = `hsla(${h}, 100%, 40%, 0.5)`;
    cx.fillRect(s * 0.45, -s * 0.25 + wo, s * 0.2, s * 0.5);
    cx.fillRect(-s * 0.65, -s * 0.25 - wo, s * 0.2, s * 0.5);

    // Core (glowing)
    cx.fillStyle = core; cx.shadowColor = core; cx.shadowBlur = 18;
    cx.beginPath(); cx.arc(0, 0, s * 0.18, 0, Math.PI * 2); cx.fill();
    cx.shadowBlur = 0;

    // HUD targeting ring
    const rings = (Math.floor(t * 3) % 2 === 0);
    cx.strokeStyle = `hsla(${h}, 100%, 70%, ${rings ? 0.7 : 0.3})`;
    cx.lineWidth = 1.5;
    cx.beginPath(); cx.arc(0, 0, s * 0.45, 0, Math.PI * 2); cx.stroke();
    // Targeting crosshair
    cx.strokeStyle = `hsla(${h}, 100%, 80%, 0.5)`;
    cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(-s * 0.5, 0); cx.lineTo(-s * 0.3, 0);
    cx.moveTo(s * 0.3, 0); cx.lineTo(s * 0.5, 0);
    cx.moveTo(0, -s * 0.5); cx.lineTo(0, -s * 0.3);
    cx.moveTo(0, s * 0.3); cx.lineTo(0, s * 0.5);
    cx.stroke();
}

function drawLich(cx, s, drawState) {
    const t = state.et * 0.01;
    if (drawState === 'CRASH') cx.translate(Math.sin(t * 10) * 3, Math.cos(t * 10) * 3);

    cx.globalAlpha = 0.9;
    const drift = Math.sin(t * 4) * 3; cx.translate(drift * 0.5, drift * 0.3);

    // Dark cloak
    cx.fillStyle = '#050008';
    cx.beginPath(); cx.arc(0, -s * 0.08, s * 0.42, Math.PI, 0); cx.lineTo(s * 0.42, s * 0.45);
    for (let i = 0; i < 4; i++) {
        const off = Math.sin(t * 8 + i * 0.8) * 6;
        cx.lineTo(s * 0.42 - i * s * 0.22, s * 0.45 + off);
    }
    cx.lineTo(-s * 0.42, s * 0.45); cx.fill();

    // Dark crown
    const crownH = state.curHue;
    for (let i = 0; i < 5; i++) {
        const cx_ = -s * 0.3 + i * s * 0.15;
        const spikeH = (i % 2 === 0) ? s * 0.3 : s * 0.18;
        cx.fillStyle = `hsla(${(crownH + i * 20) % 360}, 80%, 35%, 0.9)`;
        cx.shadowColor = `hsla(${(crownH + i * 20) % 360}, 100%, 50%, 1)`;
        cx.shadowBlur = 6;
        cx.fillRect(cx_ - s * 0.04, -s * 0.5 - spikeH, s * 0.08, spikeH);
    }

    // Glowing eyes
    cx.fillStyle = `hsla(${(crownH + 180) % 360}, 100%, 70%, 1)`;
    cx.shadowColor = `hsla(${(crownH + 180) % 360}, 100%, 70%, 1)`;
    cx.shadowBlur = 16;
    cx.beginPath(); cx.arc(-s * 0.12, -s * 0.12, 4, 0, Math.PI * 2); cx.fill();
    cx.beginPath(); cx.arc(s * 0.12, -s * 0.12, 4, 0, Math.PI * 2); cx.fill();
    cx.shadowBlur = 0;

    // Shadow tendrils
    for (let i = 0; i < 3; i++) {
        const tx = -s * 0.3 + i * s * 0.3;
        const ty = s * 0.45 + Math.sin(t * 7 + i) * s * 0.2;
        cx.strokeStyle = `hsla(${crownH}, 60%, 25%, 0.7)`;
        cx.lineWidth = 2;
        cx.beginPath();
        cx.moveTo(tx, s * 0.35);
        cx.quadraticCurveTo(tx + Math.sin(t * 5 + i) * 10, ty - s * 0.1, tx + Math.cos(t * 4 + i) * 8, ty);
        cx.stroke();
    }
    cx.globalAlpha = 1;
}

function drawMothership(cx, s, drawState) {
    const t = state.et * 0.01;
    const h = state.curHue;
    if (drawState === 'CRASH') { cx.translate(Math.sin(t * 20) * 5, 0); }

    // Main saucer (bigger)
    cx.fillStyle = `hsla(${h}, 70%, 55%, 1)`;
    cx.beginPath(); cx.ellipse(0, 0, s * 0.8, s * 0.3, 0, 0, Math.PI * 2); cx.fill();

    // Upper dome
    cx.fillStyle = `hsla(${h}, 100%, 85%, 0.6)`;
    cx.beginPath(); cx.arc(0, -s * 0.1, s * 0.32, Math.PI, 0); cx.fill();

    // 8 rotating edge lights
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + t * 2;
        const lx = Math.cos(angle) * s * 0.72;
        const ly = Math.sin(angle) * s * 0.24;
        const glow = (Math.sin(t * 8 + i) + 1) * 0.5;
        cx.fillStyle = `hsla(${(h + i * 40) % 360}, 100%, 70%, ${0.5 + glow * 0.5})`;
        cx.shadowColor = `hsla(${(h + i * 40) % 360}, 100%, 70%, 1)`;
        cx.shadowBlur = 8;
        cx.beginPath(); cx.arc(lx, ly, 3.5, 0, Math.PI * 2); cx.fill();
    }

    // Tractor beam (triangle below)
    const beamAlpha = (Math.sin(t * 3) + 1) * 0.15 + 0.05;
    const beamGrad = cx.createLinearGradient(0, s * 0.3, 0, s * 1.0);
    beamGrad.addColorStop(0, `hsla(${h}, 100%, 70%, ${beamAlpha * 2})`);
    beamGrad.addColorStop(1, `hsla(${h}, 100%, 70%, 0)`);
    cx.fillStyle = beamGrad;
    cx.beginPath();
    cx.moveTo(-s * 0.35, s * 0.3); cx.lineTo(s * 0.35, s * 0.3); cx.lineTo(s * 0.7, s * 1.0); cx.lineTo(-s * 0.7, s * 1.0);
    cx.fill();

    cx.shadowBlur = 0;
}

function drawShadowDemon(cx, s, drawState) {
    const t = state.et * 0.01;
    if (drawState === 'CRASH') cx.translate(Math.sin(t * 10) * 3, 0);

    // 2 shadow afterimages offset
    for (let i = 1; i <= 2; i++) {
        const ox = -i * 5, oy = -i * 2;
        cx.globalAlpha = 0.15 - i * 0.04;
        cx.fillStyle = '#000020';
        cx.fillRect(-s * 0.2 + ox, -s * 0.4 + oy, s * 0.4, s * 0.7);
    }
    cx.globalAlpha = 1;

    // Dark body
    cx.fillStyle = '#050010';
    cx.fillRect(-s * 0.2, -s * 0.4, s * 0.4, s * 0.7);

    // Scarf as shadow flame
    const sh = state.curHue;
    const scarfL = drawState === 'RUN' ? s * 1.0 : s * 0.6;
    cx.fillStyle = `hsla(${sh}, 80%, 35%, 0.9)`;
    cx.shadowColor = `hsla(${sh}, 100%, 50%, 1)`;
    cx.shadowBlur = 10;
    cx.beginPath();
    cx.moveTo(-s * 0.2, -s * 0.25);
    cx.bezierCurveTo(-s * 0.5, -s * 0.3 + Math.sin(t * 8) * 12, -s * 0.7, -s * 0.1, -scarfL, -s * 0.2 + Math.sin(t * 8) * 6);
    cx.lineTo(-s * 0.2, -s * 0.2); cx.fill();

    // Red demon eyes
    cx.fillStyle = '#ff2020';
    cx.shadowColor = '#ff0000';
    cx.shadowBlur = 18;
    cx.beginPath(); cx.arc(-s * 0.07, -s * 0.28, 3.5, 0, Math.PI * 2); cx.fill();
    cx.beginPath(); cx.arc(s * 0.07, -s * 0.28, 3.5, 0, Math.PI * 2); cx.fill();
    cx.shadowBlur = 0;

    // Orbiting shuriken
    const sAngle = t * 5;
    for (let i = 0; i < 2; i++) {
        const angle = sAngle + i * Math.PI;
        const sr = s * 0.65;
        const bx = Math.cos(angle) * sr, by = Math.sin(angle) * sr * 0.5;
        cx.save();
        cx.translate(bx, by);
        cx.rotate(angle * 3);
        cx.fillStyle = `hsla(${sh}, 100%, 60%, 0.9)`;
        cx.shadowColor = `hsla(${sh}, 100%, 60%, 1)`;
        cx.shadowBlur = 6;
        for (let j = 0; j < 4; j++) {
            cx.save(); cx.rotate(j * Math.PI / 2);
            cx.beginPath(); cx.moveTo(0, -5); cx.lineTo(2, 0); cx.lineTo(0, 5); cx.lineTo(-2, 0); cx.fill();
            cx.restore();
        }
        cx.restore();
    }
    cx.shadowBlur = 0;

    // Legs (dark)
    cx.fillStyle = '#0a0018';
    if (drawState === 'RUN') {
        const l1 = Math.sin(t * 15) * 6;
        cx.fillRect(0, s * 0.3, s * 0.1, s * 0.15 + l1); cx.fillRect(-s * 0.1, s * 0.3, s * 0.1, s * 0.15 - l1);
    } else {
        cx.fillRect(0, s * 0.25, s * 0.1, s * 0.12); cx.fillRect(-s * 0.1, s * 0.25, s * 0.1, s * 0.12);
    }
}

function drawMegalodon(cx, s, drawState) {
    const t = state.et * 0.01;
    const h = state.curHue;
    if (drawState === 'CRASH') { cx.translate(Math.sin(t * 10) * 4, 0); }

    // Crackling electric trail behind
    for (let i = 0; i < 4; i++) {
        const tz = -s * 0.5 - i * s * 0.18;
        const ty = Math.sin(t * 10 + i * 1.3) * s * 0.3;
        cx.strokeStyle = `hsla(${(h + 40) % 360}, 100%, 80%, ${0.5 - i * 0.1})`;
        cx.lineWidth = 1.5;
        cx.beginPath();
        cx.moveTo(tz, 0);
        cx.lineTo(tz + Math.random() * 8 - 4, ty / 2);
        cx.lineTo(tz - s * 0.1, ty);
        cx.stroke();
    }

    // Main body (slightly larger)
    cx.fillStyle = `hsla(${h}, 65%, 35%, 1)`;
    cx.beginPath();
    cx.moveTo(s * 0.65, 0); cx.quadraticCurveTo(0, -s * 0.5, -s * 0.6, 0); cx.quadraticCurveTo(0, s * 0.5, s * 0.65, 0); cx.fill();

    // Electric dorsal fin
    const finH = (h + 40) % 360;
    cx.fillStyle = `hsla(${finH}, 100%, 65%, 1)`;
    cx.shadowColor = `hsla(${finH}, 100%, 65%, 1)`;
    cx.shadowBlur = 12;
    cx.beginPath(); cx.moveTo(0, -s * 0.2); cx.lineTo(-s * 0.15, -s * 0.65); cx.lineTo(s * 0.15, -s * 0.2); cx.fill();
    cx.shadowBlur = 0;

    // Crackling jaw lines
    cx.strokeStyle = `hsla(${finH}, 100%, 75%, 0.8)`;
    cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(s * 0.4, 0); cx.lineTo(s * 0.55, -s * 0.08); cx.lineTo(s * 0.62, 0); cx.lineTo(s * 0.55, s * 0.08);
    cx.stroke();

    // Electric sparks
    const sparkCount = 3;
    for (let i = 0; i < sparkCount; i++) {
        const sa = (t * 4 + i * 2.1) % (Math.PI * 2);
        const sx2 = Math.cos(sa) * s * 0.45, sy2 = Math.sin(sa) * s * 0.35;
        cx.fillStyle = `hsla(${finH}, 100%, 90%, 0.9)`;
        cx.shadowColor = `hsla(${finH}, 100%, 90%, 1)`;
        cx.shadowBlur = 8;
        cx.beginPath(); cx.arc(sx2, sy2, 2, 0, Math.PI * 2); cx.fill();
    }

    // Electric tail
    const tw = Math.sin(t * 15) * 12;
    cx.fillStyle = `hsla(${h}, 65%, 45%, 0.9)`;
    cx.beginPath(); cx.moveTo(-s * 0.6, 0); cx.lineTo(-s * 0.8, -s * 0.25 + tw); cx.lineTo(-s * 0.8, s * 0.25 + tw); cx.fill();

    // Eye
    cx.fillStyle = '#fff'; cx.shadowBlur = 0;
    cx.beginPath(); cx.arc(s * 0.3, -s * 0.12, 4, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = `hsla(${finH}, 100%, 50%, 1)`;
    cx.beginPath(); cx.arc(s * 0.31, -s * 0.12, 2, 0, Math.PI * 2); cx.fill();
}
