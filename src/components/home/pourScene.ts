/* eslint-disable */
// @ts-nocheck
/* Realistic pour for the home hero: a gooseneck kettle pours water into a
 * dripper and coffee drips into a glass mug. Falling water and drips follow
 * real gravity; the brew itself is sped up. Driven by scroll progress (0..1). */
export function createPourScene(canvas, opts) {
  opts = Object.assign({ scroll: true }, opts);
  opts = opts || {};
  const W = 800, H = 700;
  const ctx = canvas.getContext('2d');
  let dpr = 2;
  function fit() {
    const cssW = canvas.clientWidth || W;
    dpr = Math.min(3200 / W, Math.max(1, (cssW / W) * (window.devicePixelRatio || 1)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  fit();

  // ---------- world (1 cm = S px; gravity is real) ----------
  const S = 19;
  const G = 981 * S;
  const PI = Math.PI;
  const CX = 236, FLOOR = 664;
  const eAt = (y) => 0.2 + 0.1 * (y / H);           // camera ~15° above the table
  const MUG = { ro: 4.2 * S, ri: 3.9 * S, h: 9.6 * S, base: 0.9 * S };
  MUG.top = FLOOR - MUG.h;
  const MUG_AREA = PI * 3.9 * 3.9;                   // cm² inside the mug
  const DR = { plateR: 5.0 * S, plateH: 0.5 * S, neckR: 2.8 * S, neckH: 0.7 * S, coneBot: 2.6 * S, coneTop: 5.8 * S, coneH: 6.8 * S, rimIn: 5.45 * S, paperUp: 1.0 * S };
  DR.plateTop = MUG.top - DR.plateH;
  DR.neckTop = DR.plateTop - DR.neckH;
  DR.rim = DR.neckTop - DR.coneH;
  DR.paperR = 5.92 * S;
  DR.paperY = DR.rim - DR.paperUp;
  const SLOPE = (5.8 - 2.6) / 6.8;

  // brewing: 20 g coffee holds ~36 ml; drawdown time constant; brew clock runs K× (the falling water is real time)
  const HOLD = 36, TAU = 8, K = 6.6;
  const SPOUT_R = 0.21, CD = 0.8; // spout opening radius (cm), discharge coefficient

  // kettle drawn in cm, body-bottom-centre origin
  const BC = { x: 0, y: -5 };
  const SP = [[-6.2, -2.4], [-9.6, -2.2], [-12.0, -7.0], [-13.4, -10.6], [-14.0, -12.0], [-14.9, -12.5], [-15.5, -12.0]];
  const TIP = { x: -15.5, y: -12.0 };
  const TD = (() => { const x = -0.6, y = 0.5, l = Math.hypot(x, y); return { x: x / l, y: y / l }; })();

  const REST = { x: CX + 50, y: 196 };
  const POUR = { x: CX + 21, y: DR.rim - 4.2 * S };

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const rot = (x, y, a) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) });
  const win = (t, a, b, r) => ease((t - a) / r) * (1 - ease((t - (b - r)) / r));

  let seed = 11;
  function rnd() { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

  function pose(t) {
    let th = 0, x = REST.x, y = REST.y;
    if (t >= 0.7 && t < 1.6) { const u = ease((t - 0.7) / 0.9); x = lerp(REST.x, POUR.x, u); y = lerp(REST.y, POUR.y, u); th = 29.5 * u; }
    else if (t >= 1.6 && t < 10.9) {
      x = POUR.x; y = POUR.y;
      if (t < 2.7) th = 29.5;
      else if (t < 3.1) th = lerp(29.5, 16, ease((t - 2.7) / 0.4));
      else if (t < 4.6) th = 16;
      else if (t < 5.1) th = lerp(16, 33, ease((t - 4.6) / 0.5));
      else th = 33;
      const amp = (0.45 * win(t, 1.6, 2.9, 0.3) + 0.9 * win(t, 4.9, 10.9, 0.4)) * S;
      const w = 2 * PI * (t - 1.6) / 1.3;
      x += amp * Math.sin(w);
      y += amp * 0.25 * Math.cos(w);
    } else if (t >= 10.9 && t < 11.9) { const u = ease((t - 10.9) / 1.0); x = lerp(POUR.x, REST.x, u); y = lerp(POUR.y, REST.y, u); th = 33 * (1 - u); }
    return { th, x, y };
  }

  // ---------- state ----------
  let T, water, coffee, splash, ripples, bubbles, steam, waterSeg, coffeeSeg, pouring, dripping, dropReal, dropVol;
  let held, vFree, vMug, wet, lifting, fadeStart, lastTip, tipNow, kPos, theta, flowQ, exitV, impactV, impactW, qOut, lastRipple;
  function reset() {
    seed = 11; T = 0;
    water = []; coffee = []; splash = []; ripples = []; bubbles = []; steam = [];
    waterSeg = 0; coffeeSeg = 0; pouring = false; dripping = 0; dropReal = 0; dropVol = 0;
    held = 0; vFree = 0; vMug = 0; wet = 0; lifting = -1; fadeStart = -1; lastRipple = -1;
    flowQ = 0; exitV = 0; impactV = 0; impactW = 0; qOut = 0;
    const p = pose(0); lastTip = { x: p.x, y: p.y }; tipNow = lastTip; theta = 0; placeKettle(p);
  }
  function placeKettle(p) {
    theta = p.th;
    const a = -theta * PI / 180;
    const rel = rot((TIP.x - BC.x) * S, (TIP.y - BC.y) * S, a);
    kPos = { x: p.x - rel.x, y: p.y - rel.y };
  }

  const level = () => vMug / MUG_AREA * S;                              // px of coffee
  const surfY = () => FLOOR - MUG.base - level();
  const bedDepth = () => (wet ? 3.2 - Math.min(2.2, vFree / 60 * 2.2) : 3.4);   // cm below rim
  const bedY = () => DR.rim + bedDepth() * S;
  const dripOff = () => lifting < 0 ? 0 : -260 * ease((T - lifting) / 1.1) ;
  const dripAlpha = () => lifting < 0 ? 1 : 1 - ease((T - lifting - 0.15) / 0.95);

  const DT = 1 / 240;
  function step() {
    T += DT;
    const p = pose(T);
    placeKettle(p);
    const tip = { x: p.x, y: p.y };
    const tv = { x: (tip.x - lastTip.x) / DT, y: (tip.y - lastTip.y) / DT };
    lastTip = tip; tipNow = tip;
    const a = -theta * PI / 180;
    const dir = rot(TD.x, TD.y, a);
    const hcm = Math.max(0, theta - 22) * 0.21;            // water head above the spout (cm)
    exitV = Math.sqrt(2 * 981 * hcm);                       // Torricelli, cm/s
    flowQ = CD * PI * SPOUT_R * SPOUT_R * exitV;            // cm³/s = g/s
    if (flowQ > 0.05) {
      if (!pouring) { waterSeg++; pouring = true; }
      water.push({ x: tip.x, y: tip.y, vx: dir.x * exitV * S + tv.x, vy: dir.y * exitV * S + tv.y, q: flowQ, seg: waterSeg, t: T });
    } else pouring = false;

    const by = bedY();
    for (let i = water.length - 1; i >= 0; i--) {
      const w = water[i];
      w.vy += G * DT; w.x += w.vx * DT; w.y += w.vy * DT;
      if (lifting < 0 && w.y >= by && Math.abs(w.x - CX) < DR.rimIn) {
        let v = w.q * DT * K;
        const vc = Math.hypot(w.vx, w.vy) / S;
        impactV = vc; impactW = 2 * Math.sqrt(w.q / (PI * vc)) * 10;
        if (held < HOLD) { const take = Math.min(HOLD - held, v); held += take; v -= take; }
        vFree += v; wet = 1;
        water.splice(i, 1);
      } else if (w.y > H + 40) water.splice(i, 1);
    }

    // drawdown through the bed into the mug
    qOut = lifting < 0 ? vFree / TAU : 0;                   // ml/s, real
    const dV = qOut * K * DT;
    vFree = Math.max(0, vFree - dV);
    const outY = MUG.top + 3;
    if (lifting < 0 && qOut > 0.6) {
      if (dripping !== 1) { coffeeSeg++; dripping = 1; }
      coffee.push({ x: CX + (rnd() - 0.5) * 0.6, y: outY, vx: 0, vy: 44 * S, q: qOut, vol: dV, seg: coffeeSeg });
    } else if (lifting < 0 && qOut > 0.004) {
      if (dripping === 1) coffeeSeg++;
      dripping = 2; dropReal += qOut * DT; dropVol += dV;
      if (dropReal >= 0.05) { coffee.push({ x: CX, y: outY, vx: 0, vy: 6 * S, q: 0, vol: dropVol, drop: true, seg: -1 }); dropReal = 0; dropVol = 0; }
    } else dripping = 0;

    const sy = surfY();
    for (let i = coffee.length - 1; i >= 0; i--) {
      const c = coffee[i];
      c.vy += G * DT; c.x += c.vx * DT; c.y += c.vy * DT;
      if (c.y >= sy) {
        vMug = Math.min(380, vMug + c.vol);
        const sp = c.vy / S;
        if (c.drop || T - lastRipple > 0.16) { ripples.push({ t: T, a: c.drop ? 1 : 0.55 }); lastRipple = T; }
        const n = c.drop ? 3 : (rnd() < 0.05 ? 1 : 0);
        for (let k = 0; k < n; k++) splash.push({ x: CX + (rnd() - 0.5) * 6, y: sy - 1, vx: (rnd() - 0.5) * 40 * S, vy: -(0.25 + rnd() * 0.35) * sp * S, r: 0.6 + rnd() * 1.1 });
        coffee.splice(i, 1);
      }
    }
    for (let i = splash.length - 1; i >= 0; i--) {
      const s = splash[i];
      s.vy += G * DT; s.x += s.vx * DT; s.y += s.vy * DT;
      if (s.vy > 0 && s.y >= surfY()) splash.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) if (T - ripples[i].t > 1.2) ripples.splice(i, 1);

    // bloom: CO2 bubbles on the wet bed
    if (wet && T > 1.7 && T < 5.4 && rnd() < 0.09) bubbles.push({ u: (rnd() - 0.5) * 1.5, v: rnd(), t: T, life: 0.5 + rnd() * 1.1, r: 0.6 + rnd() * 1.8 });
    for (let i = bubbles.length - 1; i >= 0; i--) if (T - bubbles[i].t > bubbles[i].life) bubbles.splice(i, 1);

    // lift the dripper once the drips have slowed
    if (lifting < 0 && T > 12 && qOut < 0.25) lifting = T;
    if (lifting >= 0 && T - lifting > 0.05) vFree = 0;

    // steam
    const liftedFor = lifting < 0 ? -1 : T - lifting;
    if (lifting < 0 && wet && rnd() < 7 * DT) steam.push(puff(CX + (rnd() - 0.5) * DR.paperR * 1.2, DR.paperY - 6, 0.55));
    if (liftedFor > 0.4 && vMug > 20 && rnd() < 11 * DT) steam.push(puff(CX + (rnd() - 0.5) * MUG.ri * 1.4, MUG.top + 4, 1));
    for (let i = steam.length - 1; i >= 0; i--) {
      const s = steam[i];
      s.age += DT;
      s.x += (s.vx + Math.sin(s.age * s.f + s.ph) * 9) * DT; s.y += s.vy * DT; s.vy *= 0.999;
      if (s.age > s.life) steam.splice(i, 1);
    }

    if (!opts.scroll && liftedFor > 6.6 && fadeStart < 0) fadeStart = T;
    if (fadeStart >= 0 && T - fadeStart > 0.55) reset();
  }
  function puff(x, y, k) { return { x, y, vx: (rnd() - 0.5) * 6, vy: -(22 + rnd() * 22), age: 0, life: 2.2 + rnd() * 1.8, r0: 7 + rnd() * 6, f: 1.5 + rnd() * 1.5, ph: rnd() * 6, k }; }

  // ---------- drawing helpers ----------
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  (() => { const g = sprite.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); })();

  const logoCv = document.createElement('canvas');
  const LOGO_W = 5.4 * S, LOGO_H = LOGO_W * 405 / 640;
  let logoReady = false;
  function buildLogo() {
    if (!opts.logoPath) return;
    const k = 3;
    logoCv.width = Math.ceil(LOGO_W * k); logoCv.height = Math.ceil(LOGO_H * k);
    const g = logoCv.getContext('2d');
    g.scale(LOGO_W * k / 640, LOGO_H * k / 405);
    g.fillStyle = opts.logoColor || '#678BC7';
    g.fill(new Path2D(opts.logoPath), 'evenodd');
    logoReady = true;
  }
  buildLogo();

  const handleCv = document.createElement('canvas');
  function hpath(g, dx, dy) {
    const x0 = CX - MUG.ro + 3 + dx, y0 = MUG.top + 0.17 * MUG.h + dy, y1 = MUG.top + 0.74 * MUG.h + dy;
    g.beginPath(); g.moveTo(x0, y0);
    g.bezierCurveTo(x0 - 3.3 * S, y0 - 0.25 * S, x0 - 3.7 * S, y1 + 0.3 * S, x0, y1);
  }
  function buildHandle() {
    handleCv.width = canvas.width; handleCv.height = canvas.height;
    const g = handleCv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = 'round';
    hpath(g, 0, 0); g.lineWidth = 1.15 * S; g.strokeStyle = 'rgba(38,52,58,.62)'; g.stroke();
    g.globalCompositeOperation = 'destination-out';
    hpath(g, 0, 0); g.lineWidth = 1.15 * S - 3.4; g.strokeStyle = 'rgba(0,0,0,.8)'; g.stroke();
    g.globalCompositeOperation = 'source-over';
    hpath(g, 0, 0); g.lineWidth = 1.15 * S - 3.4; g.strokeStyle = 'rgba(232,240,242,.22)'; g.stroke();
    hpath(g, -2.2, -1.2); g.lineWidth = 2.2; g.strokeStyle = 'rgba(255,255,255,.85)'; g.stroke();
    hpath(g, 3.4, 1.6); g.lineWidth = 1.2; g.strokeStyle = 'rgba(38,52,58,.28)'; g.stroke();
  }

  function cyl(cx, yT, yB, rT, rB) {
    const eT = eAt(yT), eB = eAt(yB);
    ctx.beginPath();
    ctx.moveTo(cx - rT, yT);
    ctx.lineTo(cx - rB, yB);
    ctx.ellipse(cx, yB, rB, rB * eB, 0, PI, 0, true);
    ctx.lineTo(cx + rT, yT);
    ctx.ellipse(cx, yT, rT, rT * eT, 0, 0, PI, false);
    ctx.closePath();
  }
  function hgrad(x0, x1, stops) { const g = ctx.createLinearGradient(x0, 0, x1, 0); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; }

  // ---------- scene parts ----------
  function drawShadows() {
    const fill = clamp(vMug / 280, 0, 1);
    const ey = MUG.ro * eAt(FLOOR);
    let g = ctx.createRadialGradient(CX + 16, FLOOR + 2, 4, CX + 16, FLOOR + 2, MUG.ro * 1.5);
    g.addColorStop(0, 'rgba(30,42,21,.30)'); g.addColorStop(1, 'rgba(30,42,21,0)');
    ctx.save(); ctx.translate(0, FLOOR + 2); ctx.scale(1, ey / MUG.ro * 1.05); ctx.translate(0, -(FLOOR + 2));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX + 16, FLOOR + 2, MUG.ro * 1.5, 0, 2 * PI); ctx.fill();
    if (fill > 0) {
      g = ctx.createRadialGradient(CX + 58, FLOOR + 6, 2, CX + 58, FLOOR + 6, MUG.ro * 0.9);
      g.addColorStop(0, `rgba(214,128,48,${0.34 * fill})`); g.addColorStop(1, 'rgba(214,128,48,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX + 58, FLOOR + 6, MUG.ro * 0.9, 0, 2 * PI); ctx.fill();
    }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(CX + 3, FLOOR + 1, MUG.ro * 0.98, ey * 0.98, 0, 0, 2 * PI);
    ctx.fillStyle = 'rgba(30,42,21,.16)'; ctx.fill();
  }

  function drawMugBack() {
    ctx.drawImage(handleCv, 0, 0, W, H);
    cyl(CX, MUG.top, FLOOR, MUG.ro, MUG.ro);
    ctx.fillStyle = 'rgba(214,228,232,.16)'; ctx.fill();
    // back inner wall reflections
    ctx.fillStyle = hgrad(CX - MUG.ri, CX + MUG.ri, [[0, 'rgba(255,255,255,0)'], [0.72, 'rgba(255,255,255,0)'], [0.8, 'rgba(255,255,255,.18)'], [0.86, 'rgba(255,255,255,0)']]);
    ctx.fillRect(CX - MUG.ri, MUG.top, MUG.ri * 2, MUG.h - MUG.base);
    // back half of the rim
    const e = eAt(MUG.top);
    ctx.beginPath(); ctx.ellipse(CX, MUG.top, MUG.ri, MUG.ri * e, 0, PI, 2 * PI);
    ctx.strokeStyle = 'rgba(38,52,58,.32)'; ctx.lineWidth = 1; ctx.stroke();
  }

  function liquidPath(yS, yB, r) {
    const eS = eAt(yS), eB = eAt(yB);
    ctx.beginPath();
    ctx.moveTo(CX - r, yS);
    ctx.lineTo(CX - r, yB);
    ctx.ellipse(CX, yB, r, r * eB, 0, PI, 0, true);
    ctx.lineTo(CX + r, yS);
    ctx.ellipse(CX, yS, r, r * eS, 0, 0, -PI, true);
    ctx.closePath();
  }

  function drawCoffeeInMug() {
    const yB = FLOOR - MUG.base, yS = surfY(), r = MUG.ri;
    if (vMug > 0.4) {
      liquidPath(yS, yB, r);
      ctx.fillStyle = hgrad(CX - r, CX + r, [[0, 'rgba(158,82,30,.9)'], [0.07, 'rgba(104,50,18,.95)'], [0.3, 'rgba(52,24,9,.97)'], [0.62, 'rgba(38,17,6,.98)'], [0.9, 'rgba(70,33,12,.96)'], [1, 'rgba(128,62,22,.9)']]);
      ctx.fill();
      // warm glow where light passes through the base
      const gg = ctx.createLinearGradient(0, yB + 8, 0, yB - 46);
      gg.addColorStop(0, 'rgba(196,112,44,.5)'); gg.addColorStop(1, 'rgba(196,112,44,0)');
      ctx.fillStyle = gg; ctx.fill();
      // surface
      const eS = eAt(yS);
      ctx.save();
      ctx.beginPath(); ctx.ellipse(CX, yS, r, r * eS, 0, 0, 2 * PI);
      const sg = ctx.createLinearGradient(0, yS - r * eS, 0, yS + r * eS);
      sg.addColorStop(0, '#6a3a1c'); sg.addColorStop(0.45, '#3a1c0a'); sg.addColorStop(1, '#2a1306');
      ctx.fillStyle = sg; ctx.fill();
      ctx.clip();
      // window reflection on the coffee
      ctx.beginPath(); ctx.ellipse(CX - r * 0.28, yS - r * eS * 0.35, r * 0.42, r * eS * 0.22, -0.06, 0, 2 * PI);
      ctx.fillStyle = 'rgba(255,236,214,.16)'; ctx.fill();
      // ripples from the drips
      for (const rp of ripples) {
        const age = T - rp.t, rr = 8 + age * 26 * S;
        if (rr > r * 1.15) continue;
        ctx.beginPath(); ctx.ellipse(CX, yS, rr, rr * eS, 0, 0, 2 * PI);
        ctx.strokeStyle = `rgba(255,226,196,${0.22 * rp.a * (1 - age / 1.2)})`; ctx.lineWidth = 1.2; ctx.stroke();
      }
      ctx.restore();
      // meniscus
      ctx.beginPath(); ctx.ellipse(CX, yS, r - 0.5, (r - 0.5) * eS, 0, 0, 2 * PI);
      ctx.strokeStyle = 'rgba(190,118,58,.55)'; ctx.lineWidth = 1.3; ctx.stroke();
    }
  }

  function drawRibbon(list, water) {
    // group into continuous streams (same segment, close together)
    let run = [];
    const flush = () => { if (run.length > 1) ribbon(run, water); else if (run.length === 1) dropShape(run[0], water); run = []; };
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (p.drop) { flush(); dropShape(p, water); continue; }
      const prev = run[run.length - 1];
      if (prev && (prev.seg !== p.seg || Math.hypot(prev.x - p.x, prev.y - p.y) > 26)) flush();
      run.push(p);
    }
    flush();
  }
  function radiusOf(p) { const v = Math.max(1, Math.hypot(p.vx, p.vy) / S); return Math.sqrt(p.q / (PI * v)) * S; }
  function ribbon(pts, water) {
    const n = pts.length, L = [], R = [], C = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const p = pts[i];
      const r = Math.max(0.45, radiusOf(p)) * (1 + 0.06 * Math.sin(p.y * 0.21 + (p.t || 0) * 40));
      L.push([p.x - ty * r, p.y + tx * r]); R.push([p.x + ty * r, p.y - tx * r]); C.push([p.x - ty * r * 0.38, p.y + tx * r * 0.38, r]);
    }
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    if (water) {
      ctx.fillStyle = 'rgba(206,224,232,.62)'; ctx.fill();
      ctx.strokeStyle = 'rgba(86,112,126,.42)'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(C[0][0], C[0][1]);
      for (let i = 1; i < n; i++) ctx.lineTo(C[i][0], C[i][1]);
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = Math.max(0.6, C[Math.floor(n / 2)][2] * 0.42); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(92,44,14,.9)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(C[0][0], C[0][1]);
      for (let i = 1; i < n; i++) ctx.lineTo(C[i][0], C[i][1]);
      ctx.strokeStyle = 'rgba(232,160,98,.55)'; ctx.lineWidth = 0.7; ctx.stroke();
    }
  }
  function dropShape(p, water) {
    const v = Math.hypot(p.vx, p.vy) / S;
    const r = p.drop ? 0.229 * S : Math.max(0.6, radiusOf(p));
    const st = 1 + Math.min(0.8, v / 220);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx) - PI / 2);
    ctx.beginPath(); ctx.ellipse(0, 0, r / Math.sqrt(st), r * st, 0, 0, 2 * PI);
    ctx.fillStyle = water ? 'rgba(206,224,232,.7)' : 'rgba(84,40,13,.92)'; ctx.fill();
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, Math.max(0.5, r * 0.28), 0, 2 * PI);
    ctx.fillStyle = water ? 'rgba(255,255,255,.95)' : 'rgba(240,180,120,.6)'; ctx.fill();
    ctx.restore();
  }

  function drawMugFront() {
    const e = eAt(MUG.top), eB = eAt(FLOOR), yIn = FLOOR - MUG.base;
    const fill = vMug > 0.4;
    // thick glass base
    ctx.beginPath();
    ctx.moveTo(CX - MUG.ro, yIn); ctx.lineTo(CX - MUG.ro, FLOOR);
    ctx.ellipse(CX, FLOOR, MUG.ro, MUG.ro * eB, 0, PI, 0, true);
    ctx.lineTo(CX + MUG.ro, yIn);
    ctx.ellipse(CX, yIn, MUG.ro, MUG.ro * eAt(yIn), 0, 0, PI, false);
    ctx.closePath();
    ctx.fillStyle = fill ? 'rgba(150,84,36,.34)' : 'rgba(220,232,236,.32)'; ctx.fill();
    ctx.fillStyle = hgrad(CX - MUG.ro, CX + MUG.ro, [[0, 'rgba(255,255,255,.1)'], [0.25, 'rgba(255,255,255,.42)'], [0.5, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,.05)']]); ctx.fill();
    ctx.beginPath(); ctx.ellipse(CX, yIn, MUG.ri, MUG.ri * eAt(yIn), 0, 0.15, PI - 0.15);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.4; ctx.stroke();

    // walls (glass thickness at the edges)
    ctx.fillStyle = 'rgba(255,255,255,.26)';
    ctx.fillRect(CX - MUG.ro, MUG.top, MUG.ro - MUG.ri, yIn - MUG.top);
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    ctx.fillRect(CX + MUG.ri, MUG.top, MUG.ro - MUG.ri, yIn - MUG.top);

    // printed logo, wrapped around the cylinder
    if (logoReady) {
      const yc = MUG.top + MUG.h * 0.47, eL = eAt(yc);
      const strips = 90, k = logoCv.width / LOGO_W;
      for (let i = 0; i < strips; i++) {
        const s0 = -LOGO_W / 2 + LOGO_W * i / strips, s1 = s0 + LOGO_W / strips;
        const a0 = s0 / MUG.ro, a1 = s1 / MUG.ro;
        const x0 = CX + MUG.ro * Math.sin(a0), x1 = CX + MUG.ro * Math.sin(a1);
        const dy = MUG.ro * eL * (Math.cos((a0 + a1) / 2) - 1);
        const shade = 0.82 + 0.18 * Math.cos((a0 + a1) / 2);
        ctx.globalAlpha = shade;
        ctx.drawImage(logoCv, (s0 + LOGO_W / 2) * k, 0, (s1 - s0) * k, logoCv.height, x0, yc - LOGO_H / 2 + dy, x1 - x0 + 0.35, LOGO_H);
      }
      ctx.globalAlpha = 1;
    }

    // reflections on the front of the glass
    ctx.fillStyle = hgrad(CX - MUG.ro, CX + MUG.ro, [[0.06, 'rgba(255,255,255,0)'], [0.11, 'rgba(255,255,255,.62)'], [0.15, 'rgba(255,255,255,.08)'], [0.19, 'rgba(255,255,255,.3)'], [0.22, 'rgba(255,255,255,0)'], [0.8, 'rgba(255,255,255,0)'], [0.88, 'rgba(255,255,255,.2)'], [0.93, 'rgba(255,255,255,0)']]);
    ctx.fillRect(CX - MUG.ro, MUG.top + 10, MUG.ro * 2, yIn - MUG.top - 14);

    // outline
    ctx.beginPath();
    ctx.moveTo(CX - MUG.ro, MUG.top); ctx.lineTo(CX - MUG.ro, FLOOR);
    ctx.ellipse(CX, FLOOR, MUG.ro, MUG.ro * eB, 0, PI, 0, true);
    ctx.lineTo(CX + MUG.ro, MUG.top);
    ctx.strokeStyle = 'rgba(34,48,54,.55)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CX - MUG.ri, MUG.top + 4); ctx.lineTo(CX - MUG.ri, yIn);
    ctx.moveTo(CX + MUG.ri, MUG.top + 4); ctx.lineTo(CX + MUG.ri, yIn);
    ctx.strokeStyle = 'rgba(34,48,54,.18)'; ctx.lineWidth = 1; ctx.stroke();

    // rim
    ctx.beginPath();
    ctx.ellipse(CX, MUG.top, MUG.ro, MUG.ro * e, 0, 0, 2 * PI);
    ctx.ellipse(CX, MUG.top, MUG.ri, MUG.ri * e, 0, 0, 2 * PI);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill('evenodd');
    ctx.beginPath(); ctx.ellipse(CX, MUG.top, MUG.ro, MUG.ro * e, 0, 0, 2 * PI);
    ctx.strokeStyle = 'rgba(34,48,54,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(CX, MUG.top, MUG.ro - 1.5, (MUG.ro - 1.5) * e, 0, 0.2, PI - 0.2);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  // blue glazed ceramic
  const BL = { hi: '#b7cbec', lt: '#8ea9da', mid: '#678BC7', dk: '#4b6ea9', edge: '#3a5788' };
  const blueSide = (x0, x1) => hgrad(x0, x1, [[0, BL.dk], [0.1, BL.mid], [0.28, BL.lt], [0.36, BL.hi], [0.44, BL.lt], [0.7, BL.mid], [0.92, BL.dk], [1, BL.edge]]);

  function drawDripperBack() {
    const ox = 0;
    // plate
    cyl(CX, DR.plateTop, MUG.top, DR.plateR, DR.plateR);
    ctx.fillStyle = blueSide(CX - DR.plateR, CX + DR.plateR); ctx.fill();
    ctx.strokeStyle = 'rgba(30,42,60,.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(CX, DR.plateTop, DR.plateR, DR.plateR * eAt(DR.plateTop), 0, 0, 2 * PI);
    const tg = ctx.createLinearGradient(0, DR.plateTop - 20, 0, DR.plateTop + 20);
    tg.addColorStop(0, BL.mid); tg.addColorStop(1, BL.lt);
    ctx.fillStyle = tg; ctx.fill();
    // neck
    cyl(CX, DR.neckTop, DR.plateTop, DR.neckR, DR.neckR);
    ctx.fillStyle = blueSide(CX - DR.neckR, CX + DR.neckR); ctx.fill();
    // handle (left)
    const hy0 = DR.rim + 1.1 * S, hy1 = DR.rim + 4.6 * S;
    const xa = CX - DR.coneTop + 0.5 * S * 1.0, xb = CX - (DR.coneTop - SLOPE * 4.6 * S) + 2;
    ctx.beginPath(); ctx.moveTo(xa + 6, hy0);
    ctx.bezierCurveTo(xa - 2.6 * S, hy0 - 0.3 * S, xb - 2.9 * S, hy1 + 0.4 * S, xb + 4, hy1);
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.95 * S; ctx.strokeStyle = BL.edge; ctx.stroke();
    ctx.lineWidth = 0.95 * S - 3; ctx.strokeStyle = BL.mid; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xa + 3, hy0 - 3);
    ctx.bezierCurveTo(xa - 2.4 * S, hy0 - 0.5 * S, xb - 2.75 * S, hy1 + 0.1 * S, xb + 2, hy1 - 3);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(214,226,246,.8)'; ctx.stroke();

    // looking into the paper filter
    const eP = eAt(DR.paperY);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(CX, DR.paperY, DR.paperR, DR.paperR * eP, 0, 0, 2 * PI);
    const ig = ctx.createLinearGradient(0, DR.paperY - DR.paperR * eP, 0, DR.paperY + DR.paperR * eP);
    ig.addColorStop(0, '#f4efe5'); ig.addColorStop(0.7, '#ddd3c2'); ig.addColorStop(1, '#c9bda8');
    ctx.fillStyle = ig; ctx.fill();
    ctx.clip();
    // paper ridges
    ctx.strokeStyle = 'rgba(160,145,120,.18)'; ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(CX + i * 0.75 * S, DR.paperY - DR.paperR * eP); ctx.lineTo(CX + i * 0.45 * S, DR.paperY + 12); ctx.stroke(); }
    // the coffee bed / brew
    const d = bedDepth(), yb = DR.rim + d * S, rb = DR.rimIn - SLOPE * d * S, eb = eAt(yb);
    ctx.beginPath(); ctx.ellipse(CX, yb, rb, rb * eb, 0, 0, 2 * PI);
    if (!wet) {
      ctx.fillStyle = '#8a5d3b'; ctx.fill();
      ctx.fillStyle = 'rgba(60,36,20,.5)';
      for (let i = 0; i < 70; i++) { const u = ((i * 37) % 100) / 100 - 0.5, v = ((i * 61) % 100) / 100; ctx.fillRect(CX + u * rb * 1.8, yb - rb * eb + v * rb * eb * 2, 1.4, 1.4); }
    } else {
      const pool = clamp(vFree / 40, 0, 1);
      const bg = ctx.createRadialGradient(CX, yb, 4, CX, yb, rb);
      bg.addColorStop(0, pool > 0.2 ? '#6b3d1d' : '#4a2b16'); bg.addColorStop(0.75, '#3b2212'); bg.addColorStop(1, `rgba(176,128,82,${0.4 + 0.5 * pool})`);
      ctx.fillStyle = bg; ctx.fill();
      for (const b of bubbles) {
        const age = (T - b.t) / b.life;
        ctx.beginPath(); ctx.arc(CX + b.u * rb, yb - rb * eb * 0.2 + (b.v - 0.5) * rb * eb * 1.4, b.r * (0.6 + age * 0.6), 0, 2 * PI);
        ctx.fillStyle = `rgba(214,170,120,${0.75 * (1 - age)})`; ctx.fill();
        ctx.strokeStyle = `rgba(255,236,214,${0.5 * (1 - age)})`; ctx.lineWidth = 0.6; ctx.stroke();
      }
      if (flowQ > 0.05) {
        ctx.beginPath(); ctx.ellipse(tipNow.x - 18, yb - 2, 9, 3, 0, 0, 2 * PI);
        ctx.fillStyle = 'rgba(232,200,160,.55)'; ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawDripperFront() {
    const eP = eAt(DR.paperY), eR = eAt(DR.rim), eN = eAt(DR.neckTop);
    // cone body
    cyl(CX, DR.rim, DR.neckTop, DR.coneTop, DR.coneBot);
    ctx.fillStyle = blueSide(CX - DR.coneTop, CX + DR.coneTop); ctx.fill();
    // glaze highlight that follows the cone
    ctx.beginPath();
    ctx.moveTo(CX - DR.coneTop * 0.58, DR.rim + DR.coneTop * eR * 0.9);
    ctx.lineTo(CX - DR.coneTop * 0.48, DR.rim + DR.coneTop * eR * 0.95);
    ctx.lineTo(CX - DR.coneBot * 0.5, DR.neckTop + DR.coneBot * eN * 0.6);
    ctx.lineTo(CX - DR.coneBot * 0.6, DR.neckTop + DR.coneBot * eN * 0.55);
    ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
    // soft shadow just under the rim
    const sg = ctx.createLinearGradient(0, DR.rim + DR.coneTop * eR - 2, 0, DR.rim + DR.coneTop * eR + 16);
    sg.addColorStop(0, 'rgba(30,50,90,.28)'); sg.addColorStop(1, 'rgba(30,50,90,0)');
    cyl(CX, DR.rim, DR.neckTop, DR.coneTop, DR.coneBot); ctx.fillStyle = sg; ctx.fill();
    ctx.strokeStyle = 'rgba(30,42,60,.35)'; ctx.lineWidth = 1; ctx.stroke();

    // paper standing above the rim (front side)
    ctx.beginPath();
    ctx.moveTo(CX - DR.paperR, DR.paperY);
    ctx.ellipse(CX, DR.paperY, DR.paperR, DR.paperR * eP, 0, PI, 0, true);
    ctx.lineTo(CX + DR.rimIn, DR.rim);
    ctx.ellipse(CX, DR.rim, DR.rimIn, DR.rimIn * eR, 0, 0, PI, false);
    ctx.closePath();
    ctx.fillStyle = hgrad(CX - DR.paperR, CX + DR.paperR, [[0, '#d9d0c0'], [0.3, '#f6f1e7'], [0.7, '#ebe3d4'], [1, '#cfc4b0']]); ctx.fill();
    ctx.beginPath(); ctx.ellipse(CX, DR.paperY, DR.paperR, DR.paperR * eP, 0, 0, 2 * PI);
    ctx.strokeStyle = 'rgba(120,104,80,.35)'; ctx.lineWidth = 0.9; ctx.stroke();
    // crimped seam
    ctx.beginPath(); ctx.moveTo(CX + DR.paperR * 0.62, DR.paperY + DR.paperR * eP * 0.78); ctx.lineTo(CX + DR.rimIn * 0.6, DR.rim + DR.rimIn * eR * 0.8);
    ctx.strokeStyle = 'rgba(150,130,100,.45)'; ctx.lineWidth = 2.2; ctx.setLineDash([1.6, 1.6]); ctx.stroke(); ctx.setLineDash([]);

    // rim (front half of the glazed lip)
    ctx.beginPath();
    ctx.ellipse(CX, DR.rim, DR.coneTop, DR.coneTop * eR, 0, PI, 0, true);
    ctx.ellipse(CX, DR.rim, DR.rimIn, DR.rimIn * eR, 0, 0, PI, false);
    ctx.closePath(); ctx.fillStyle = BL.lt; ctx.fill();
    ctx.beginPath(); ctx.ellipse(CX, DR.rim, DR.coneTop - 2, (DR.coneTop - 2) * eR, 0, 0.35, PI - 0.25);
    ctx.strokeStyle = 'rgba(232,240,252,.95)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(CX, DR.rim, DR.coneTop, DR.coneTop * eR, 0, 0, PI);
    ctx.strokeStyle = 'rgba(30,42,60,.4)'; ctx.lineWidth = 1; ctx.stroke();
  }

  function drawSteam() {
    for (const s of steam) {
      const u = s.age / s.life;
      const a = Math.sin(PI * Math.min(1, u * 1.25)) * 0.34 * s.k * (1 - u * 0.4);
      const r = s.r0 + u * 34;
      ctx.globalAlpha = a;
      ctx.drawImage(sprite, s.x - r, s.y - r * 1.3, r * 2, r * 2.6);
    }
    ctx.globalAlpha = 1;
  }

  // matte black gooseneck kettle (drawn in cm)
  function spoutOutline() {
    const pts = [];
    const bez = (a, b, c, d, u) => { const m = 1 - u; return m * m * m * a + 3 * m * m * u * b + 3 * m * u * u * c + u * u * u * d; };
    for (let seg = 0; seg < 2; seg++) {
      const P = SP.slice(seg * 3, seg * 3 + 4);
      for (let i = 0; i <= 24; i++) {
        if (seg === 1 && i === 0) continue;
        const u = i / 24;
        pts.push([bez(P[0][0], P[1][0], P[2][0], P[3][0], u), bez(P[0][1], P[1][1], P[2][1], P[3][1], u)]);
      }
    }
    const n = pts.length, Lp = [], Rp = [], Cp = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
      const r = 0.66 - 0.36 * (i / (n - 1));
      Lp.push([pts[i][0] - ty * r, pts[i][1] + tx * r]); Rp.push([pts[i][0] + ty * r, pts[i][1] - tx * r]); Cp.push([pts[i][0] + ty * r * 0.45, pts[i][1] - tx * r * 0.45]);
    }
    return { Lp, Rp, Cp };
  }
  const SPO = spoutOutline();

  function drawKettle() {
    ctx.save();
    ctx.translate(kPos.x, kPos.y);
    ctx.rotate(-theta * PI / 180);
    ctx.translate(-BC.x * S, -BC.y * S);
    ctx.scale(S, S);
    const lw = 1 / S;
    // spout
    ctx.beginPath();
    ctx.moveTo(SPO.Lp[0][0], SPO.Lp[0][1]);
    SPO.Lp.forEach((p) => ctx.lineTo(p[0], p[1]));
    for (let i = SPO.Rp.length - 1; i >= 0; i--) ctx.lineTo(SPO.Rp[i][0], SPO.Rp[i][1]);
    ctx.closePath();
    ctx.fillStyle = '#1b1b1c'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(SPO.Cp[2][0], SPO.Cp[2][1]);
    for (let i = 3; i < SPO.Cp.length - 2; i++) ctx.lineTo(SPO.Cp[i][0], SPO.Cp[i][1]);
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1.6 * lw; ctx.stroke();
    // spout opening
    ctx.save(); ctx.translate(TIP.x, TIP.y); ctx.rotate(Math.atan2(TD.y, TD.x) + PI / 2);
    ctx.beginPath(); ctx.ellipse(0, 0, 0.3, 0.1, 0, 0, 2 * PI); ctx.fillStyle = '#0a0a0a'; ctx.fill();
    ctx.restore();

    // handle
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(5.5, -9.1); ctx.bezierCurveTo(8.7, -9.7, 10.2, -8.4, 9.9, -6.3); ctx.bezierCurveTo(9.7, -4.6, 8.8, -3.1, 6.3, -2.5);
    ctx.lineWidth = 1.15; ctx.strokeStyle = '#161617'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6.0, -9.45); ctx.bezierCurveTo(8.6, -9.95, 9.95, -8.7, 9.7, -6.5);
    ctx.lineWidth = 1.6 * lw; ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.stroke();

    // body
    const eK = 0.22;
    ctx.beginPath();
    ctx.moveTo(-5.9, -10); ctx.bezierCurveTo(-6.3, -7, -6.6, -3, -6.6, -0.4);
    ctx.ellipse(0, -0.4, 6.6, 6.6 * eK, 0, PI, 0, true);
    ctx.bezierCurveTo(6.6, -3, 6.3, -7, 5.9, -10);
    ctx.ellipse(0, -10, 5.9, 5.9 * eK, 0, 0, PI, false);
    ctx.closePath();
    let g = ctx.createLinearGradient(-6.6, 0, 6.6, 0);
    g.addColorStop(0, '#2c2c2e'); g.addColorStop(0.16, '#3f3f42'); g.addColorStop(0.3, '#252527'); g.addColorStop(0.62, '#161617'); g.addColorStop(0.9, '#1d1d1f'); g.addColorStop(1, '#2a2a2c');
    ctx.fillStyle = g; ctx.fill();
    // soft sheen
    g = ctx.createLinearGradient(-5.4, 0, -2.6, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-5.4, -9.4, 2.8, 8.6);
    // steel base band
    ctx.beginPath();
    ctx.ellipse(0, -0.4, 6.6, 6.6 * eK, 0, PI, 0, true);
    ctx.lineTo(6.6, -1.0);
    ctx.ellipse(0, -1.0, 6.6, 6.6 * eK, 0, 0, PI, false);
    ctx.closePath();
    g = ctx.createLinearGradient(-6.6, 0, 6.6, 0);
    g.addColorStop(0, '#5b5d60'); g.addColorStop(0.25, '#c9ccd0'); g.addColorStop(0.45, '#7d8084'); g.addColorStop(0.8, '#3c3e41'); g.addColorStop(1, '#55575a');
    ctx.fillStyle = g; ctx.fill();
    // shoulder and lid
    ctx.beginPath(); ctx.ellipse(0, -10, 5.9, 5.9 * eK, 0, 0, 2 * PI); ctx.fillStyle = '#222224'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5.0, -10); ctx.quadraticCurveTo(0, -12.4, 5.0, -10);
    ctx.ellipse(0, -10, 5.0, 5.0 * eK, 0, 0, PI, false); ctx.closePath();
    g = ctx.createLinearGradient(-5, 0, 5, 0);
    g.addColorStop(0, '#303033'); g.addColorStop(0.3, '#4a4a4e'); g.addColorStop(0.7, '#1b1b1d'); g.addColorStop(1, '#262628');
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -10, 5.0, 5.0 * eK, 0, 0.2, PI - 0.2);
    ctx.lineWidth = 1.2 * lw; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.stroke();
    // knob
    ctx.beginPath(); ctx.moveTo(-0.35, -11.15); ctx.lineTo(-0.35, -11.6); ctx.lineTo(0.35, -11.6); ctx.lineTo(0.35, -11.15); ctx.fillStyle = '#18181a'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -11.95, 0.95, 0.55, 0, 0, 2 * PI);
    g = ctx.createLinearGradient(-0.95, 0, 0.95, 0); g.addColorStop(0, '#3a3a3d'); g.addColorStop(0.35, '#5a5a5f'); g.addColorStop(1, '#151517');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }

  // ---------- frame ----------
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    let alpha = 1;
    if (fadeStart >= 0) alpha = 1 - clamp((T - fadeStart) / 0.55, 0, 1);
    else if (!opts.scroll && T < 0.4) alpha = clamp(T / 0.4, 0, 1);
    if (opts.still) alpha = 1;
    ctx.globalAlpha = alpha;
    drawShadows();
    drawMugBack();
    drawCoffeeInMug();
    drawRibbon(coffee, false);
    for (const s of splash) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 2 * PI); ctx.fillStyle = 'rgba(84,40,13,.9)'; ctx.fill(); }
    drawMugFront();
    const da = dripAlpha();
    if (da > 0.001) {
      ctx.save(); ctx.globalAlpha = alpha * da; ctx.translate(0, dripOff());
      drawDripperBack();
      ctx.restore();
    }
    ctx.globalAlpha = alpha;
    drawRibbon(water, true);
    if (da > 0.001) {
      ctx.save(); ctx.globalAlpha = alpha * da; ctx.translate(0, dripOff());
      drawDripperFront();
      ctx.restore();
    }
    ctx.globalAlpha = alpha;
    drawSteam();
    ctx.globalAlpha = alpha;
    drawKettle();
    ctx.globalAlpha = 1;
  }

  function stats() {
    return {
      tilt: Math.round(theta),
      exit: Math.round(exitV),
      flow: flowQ > 0.05 ? flowQ.toFixed(1) : '0',
      impact: impactV ? Math.round(impactV) : 0,
      exitWidth: flowQ > 0.05 ? (2 * Math.sqrt(flowQ / (PI * Math.max(1, exitV))) * 10).toFixed(1) : '0',
      impactWidth: impactW ? impactW.toFixed(1) : '0',
      drip: qOut > 0.01 ? qOut.toFixed(1) : '0',
      mug: Math.round(vMug),
      pouring: flowQ > 0.05
    };
  }

  // ---------- run ----------
  reset();
  buildHandle();
  const END = 17;
  let raf = 0, last = 0, progress = 0, alive = true, busy = false;
  // Snapshots every half second make scrolling back cheap: restore the nearest
  // earlier snapshot and simulate forward from there.
  const snaps = [];
  function save() {
    return JSON.parse(JSON.stringify({ T, water, coffee, splash, ripples, bubbles, steam, waterSeg, coffeeSeg, pouring, dripping, dropReal, dropVol, held, vFree, vMug, wet, lifting, fadeStart, lastTip, tipNow, kPos, theta, flowQ, exitV, impactV, impactW, qOut, lastRipple, seed }));
  }
  function load(o) {
    o = JSON.parse(JSON.stringify(o));
    ({ T, water, coffee, splash, ripples, bubbles, steam, waterSeg, coffeeSeg, pouring, dripping, dropReal, dropVol, held, vFree, vMug, wet, lifting, fadeStart, lastTip, tipNow, kPos, theta, flowQ, exitV, impactV, impactW, qOut, lastRipple, seed } = o);
  }
  function advance(t) {
    while (T < t) {
      step();
      const k = Math.floor(T * 2);
      if (k > 0 && !snaps[k] && T - k / 2 < DT * 1.5) snaps[k] = save();
    }
  }
  function render(t) {
    if (t > T + DT) advance(t);
    else if (t < T - DT) {
      let k = Math.min(snaps.length - 1, Math.floor(t * 2));
      while (k > 0 && !snaps[k]) k--;
      if (k > 0) load(snaps[k]); else reset();
      advance(t);
    }
    draw();
  }
  // Controlled playback: the scene eases toward the scroll position and never
  // runs faster than MAX_FWD x real time (MAX_BACK x when scrolling back), so a
  // quick flick of the wheel plays as a calm pour instead of a jump.
  const MAX_FWD = 1.6, MAX_BACK = 3.2, EASE = 0.28;
  function frame(now) {
    if (!alive) { busy = false; return; }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    const target = progress * END;
    const diff = target - T;
    let t = target;
    if (Math.abs(diff) > DT * 2) {
      let d = diff * (1 - Math.exp(-dt / EASE));
      const capF = MAX_FWD * dt, capB = MAX_BACK * dt;
      if (d > capF) d = capF; else if (d < -capB) d = -capB;
      t = T + d;
    }
    render(t);
    if (Math.abs(target - T) > DT * 2) raf = requestAnimationFrame(frame);
    else busy = false;
  }
  function wake() { if (!busy && alive) { busy = true; last = 0; raf = requestAnimationFrame(frame); } }
  reset();
  buildHandle();
  draw();

  return {
    setProgress(p) { const v = p > 0.99 ? 1 : clamp(p, 0, 1); if (v !== progress) { progress = v; wake(); } },
    jump(p) { progress = clamp(p, 0, 1); render(progress * END); },
    resize() { fit(); buildHandle(); draw(); },
    isDone() { return T >= END - 0.2; },
    stop() { alive = false; cancelAnimationFrame(raf); }
  };
}
