/* eslint-disable */
// @ts-nocheck
/* Lifelike brew animations for the brew guide (French press, moka pot,
 * AeroPress, espresso). Liquids fall under real gravity; each scene loops. */
/* Lifelike brew animations for the brew guide: French press, moka pot,
 * AeroPress and espresso, in the same style as the home-page pour.
 * Each scene loops on its own. Liquids fall under real gravity; streams
 * thin as they speed up (same flow, faster = narrower). */
export function createBrewScene(canvas, method, opts) {
  opts = opts || {};
  const W = 600, H = 660, PI = Math.PI, G = 981;
  const ctx = canvas.getContext('2d');
  let dpr = 2;
  function fit() {
    const cssW = canvas.clientWidth || W;
    dpr = Math.min(3200 / W, Math.max(1, (cssW / W) * (window.devicePixelRatio || 1)));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  fit();

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const seg = (t, a, b) => ease((t - a) / (b - a));
  let seed = 7;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let E = 0.24; // camera a little above the table (moka uses a higher view)
  function hg(x0, x1, stops) { const g = ctx.createLinearGradient(x0, 0, x1, 0); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; }
  function vg(y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; }
  function cyl(cx, yT, yB, rT, rB) {
    ctx.beginPath(); ctx.moveTo(cx - rT, yT); ctx.lineTo(cx - rB, yB);
    ctx.ellipse(cx, yB, rB, rB * E, 0, PI, 0, true); ctx.lineTo(cx + rT, yT);
    ctx.ellipse(cx, yT, rT, rT * E, 0, 0, PI, false); ctx.closePath();
  }
  function ell(cx, y, r) { ctx.beginPath(); ctx.ellipse(cx, y, r, r * E, 0, 0, 2 * PI); }
  function shadow(cx, y, rx, a) {
    ctx.save(); ctx.translate(cx + rx * 0.12, y); ctx.scale(1, 0.2);
    const g = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx * 1.35);
    g.addColorStop(0, `rgba(30,42,21,${a || 0.3})`); g.addColorStop(1, 'rgba(30,42,21,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx * 1.35, 0, 2 * PI); ctx.fill(); ctx.restore();
  }
  const STEEL = [[0, '#6f7377'], [0.12, '#b9bec3'], [0.26, '#eef1f3'], [0.36, '#9da2a7'], [0.62, '#5d6165'], [0.84, '#8b9095'], [1, '#4c5054']];
  const ALU = [[0, '#7c8084'], [0.15, '#c9cdd0'], [0.3, '#e6e8ea'], [0.45, '#aeb2b6'], [0.7, '#8d9196'], [0.88, '#b4b8bc'], [1, '#6c7074']];
  const BLACK = [[0, '#2c2c2e'], [0.22, '#47474b'], [0.4, '#1f1f21'], [1, '#141415']];

  // ---- glass (walls, highlights, outline) ----
  function glassBack(cx, top, bot, r) {
    cyl(cx, top, bot, r, r); ctx.fillStyle = 'rgba(214,228,232,.16)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, top, r - 3, (r - 3) * E, 0, PI, 2 * PI); ctx.strokeStyle = 'rgba(38,52,58,.3)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function glassFront(cx, top, bot, r, o) {
    o = o || {};
    const wall = o.wall || 4;
    ctx.fillStyle = 'rgba(255,255,255,.24)'; ctx.fillRect(cx - r, top, wall, bot - top);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(cx + r - wall, top, wall, bot - top);
    ctx.fillStyle = hg(cx - r, cx + r, [[0.06, 'rgba(255,255,255,0)'], [0.11, 'rgba(255,255,255,.62)'], [0.15, 'rgba(255,255,255,.06)'], [0.19, 'rgba(255,255,255,.28)'], [0.22, 'rgba(255,255,255,0)'], [0.8, 'rgba(255,255,255,0)'], [0.88, 'rgba(255,255,255,.2)'], [0.93, 'rgba(255,255,255,0)']]);
    ctx.fillRect(cx - r, top + 8, r * 2, bot - top - 12);
    ctx.beginPath(); ctx.moveTo(cx - r, top); ctx.lineTo(cx - r, bot); ctx.ellipse(cx, bot, r, r * E, 0, PI, 0, true); ctx.lineTo(cx + r, top);
    ctx.strokeStyle = 'rgba(34,48,54,.55)'; ctx.lineWidth = 1.3; ctx.stroke();
    if (!o.noRim) {
      ctx.beginPath(); ctx.ellipse(cx, top, r, r * E, 0, 0, 2 * PI); ctx.ellipse(cx, top, r - wall, (r - wall) * E, 0, 0, 2 * PI);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill('evenodd');
      ctx.beginPath(); ctx.ellipse(cx, top, r, r * E, 0, 0, 2 * PI); ctx.strokeStyle = 'rgba(34,48,54,.5)'; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, top, r - 1.5, (r - 1.5) * E, 0, 0.2, PI - 0.2); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
  }
  function glassBase(cx, bot, r, h, tint) {
    ctx.beginPath(); ctx.moveTo(cx - r, bot - h); ctx.lineTo(cx - r, bot); ctx.ellipse(cx, bot, r, r * E, 0, PI, 0, true); ctx.lineTo(cx + r, bot - h);
    ctx.ellipse(cx, bot - h, r, r * E, 0, 0, PI, false); ctx.closePath();
    ctx.fillStyle = tint || 'rgba(220,232,236,.32)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, bot - h, r - 4, (r - 4) * E, 0, 0.15, PI - 0.15); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.3; ctx.stroke();
  }
  // coffee inside a glass cylinder, from the inner base up to yS
  function coffeeIn(cx, yS, yB, r, o) {
    o = o || {};
    if (yS >= yB - 0.5) return;
    ctx.beginPath(); ctx.moveTo(cx - r, yS); ctx.lineTo(cx - r, yB); ctx.ellipse(cx, yB, r, r * E, 0, PI, 0, true);
    ctx.lineTo(cx + r, yS); ctx.ellipse(cx, yS, r, r * E, 0, 0, -PI, true); ctx.closePath();
    ctx.fillStyle = hg(cx - r, cx + r, o.body || [[0, 'rgba(158,82,30,.9)'], [0.07, 'rgba(104,50,18,.95)'], [0.3, 'rgba(52,24,9,.97)'], [0.62, 'rgba(38,17,6,.98)'], [0.9, 'rgba(70,33,12,.96)'], [1, 'rgba(128,62,22,.9)']]);
    ctx.fill();
    const gg = ctx.createLinearGradient(0, yB + 6, 0, yB - 40); gg.addColorStop(0, 'rgba(196,112,44,.45)'); gg.addColorStop(1, 'rgba(196,112,44,0)'); ctx.fillStyle = gg; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, yS, r, r * E, 0, 0, 2 * PI);
    ctx.fillStyle = o.top || vg(yS - r * E, yS + r * E, [[0, '#6a3a1c'], [0.45, '#3a1c0a'], [1, '#2a1306']]); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, yS, r - 0.5, (r - 0.5) * E, 0, 0, 2 * PI); ctx.strokeStyle = o.rim || 'rgba(190,118,58,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  // ---- steam: warm-grey haze with a lighter core, visible on cream ----
  const mk = (rgb) => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(0.5, `rgba(${rgb},.45)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return c; };
  const SPR = mk('255,255,255'), HAZE = mk('96,104,80');
  let steam = [];
  function puff(x, y, k, spread) { steam.push({ x: x + (rnd() - 0.5) * (spread || 20), y, vx: (rnd() - 0.5) * 8, vy: -(22 + rnd() * 24), age: 0, life: 2 + rnd() * 1.8, r0: 6 + rnd() * 6, f: 1.5 + rnd() * 1.5, ph: rnd() * 6, k: k || 1 }); }
  function stepSteam(dt) { for (let i = steam.length - 1; i >= 0; i--) { const s = steam[i]; s.age += dt; s.x += (s.vx + Math.sin(s.age * s.f + s.ph) * 9) * dt; s.y += s.vy * dt; if (s.age > s.life) steam.splice(i, 1); } }
  function drawSteam() {
    const o = ctx.globalAlpha;
    for (const s of steam) {
      const u = s.age / s.life, a = Math.sin(PI * Math.min(1, u * 1.25)) * 0.34 * s.k * (1 - u * 0.4), r = s.r0 + u * 26;
      ctx.globalAlpha = o * a * 0.45; ctx.drawImage(HAZE, s.x - r * 0.8, s.y - r * 1.4, r * 1.6, r * 2.8);
      ctx.globalAlpha = o * a * 0.9; ctx.drawImage(SPR, s.x - r * 0.55, s.y - r * 1.15, r * 1.1, r * 2.2);
    }
    ctx.globalAlpha = o;
  }

  // ---- liquid streams: particles under gravity, drawn as a ribbon whose width follows the flow ----
  function Stream(color) { this.p = []; this.seg = 0; this.on = false; this.color = color; }
  Stream.prototype.emit = function (x, y, vx, vy, q, S) { if (!this.on) { this.seg++; this.on = true; } this.p.push({ x, y, vx, vy, q, seg: this.seg, S }); };
  Stream.prototype.stop = function () { this.on = false; };
  Stream.prototype.drop = function (x, y, vy, r) { this.p.push({ x, y, vx: 0, vy, q: 0, seg: -1, drop: true, r }); };
  Stream.prototype.update = function (dt, S, floorAt, onHit) {
    for (let i = this.p.length - 1; i >= 0; i--) {
      const p = this.p[i]; p.vy += G * S * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y >= floorAt(p.x)) { onHit && onHit(p); this.p.splice(i, 1); }
    }
  };
  Stream.prototype.draw = function (S) {
    const pts = this.p; let run = [];
    const col = this.color;
    const flush = () => { if (run.length > 1) ribbon(run, S, col); else if (run.length === 1) blob(run[0], S, col); run = []; };
    for (const p of pts) {
      if (p.drop) { flush(); blob(p, S, col); continue; }
      const pr = run[run.length - 1];
      if (pr && (pr.seg !== p.seg || Math.hypot(pr.x - p.x, pr.y - p.y) > 22)) flush();
      run.push(p);
    }
    flush();
  };
  function rad(p, S) { const v = Math.max(1, Math.hypot(p.vx, p.vy) / S); return Math.sqrt(p.q / (PI * v)) * S; }
  function ribbon(pts, S, col) {
    const n = pts.length, L = [], R = [], C = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const p = pts[i], r = Math.max(0.5, rad(p, S)) * (1 + 0.05 * Math.sin(p.y * 0.23));
      L.push([p.x - ty * r, p.y + tx * r]); R.push([p.x + ty * r, p.y - tx * r]); C.push([p.x - ty * r * 0.38, p.y + tx * r * 0.38, r]);
    }
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]); for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath();
    ctx.fillStyle = col.fill; ctx.fill();
    if (col.edge) { ctx.strokeStyle = col.edge; ctx.lineWidth = 0.8; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(C[0][0], C[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(C[i][0], C[i][1]);
    ctx.strokeStyle = col.hi; ctx.lineWidth = Math.max(0.6, C[n >> 1][2] * 0.4); ctx.stroke();
  }
  function blob(p, S, col) {
    const v = Math.hypot(p.vx, p.vy) / S, r = p.drop ? p.r : Math.max(0.6, rad(p, S)), st = 1 + Math.min(0.8, v / 220);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx) - PI / 2);
    ctx.beginPath(); ctx.ellipse(0, 0, r / Math.sqrt(st), r * st, 0, 0, 2 * PI); ctx.fillStyle = col.fill; ctx.fill();
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, Math.max(0.5, r * 0.28), 0, 2 * PI); ctx.fillStyle = col.hi; ctx.fill(); ctx.restore();
  }
  const COFFEE = { fill: 'rgba(92,44,14,.92)', hi: 'rgba(232,160,98,.55)' };
  const ESPRESSO = { fill: 'rgba(110,52,18,.95)', hi: 'rgba(240,180,110,.6)' };

  // ---- logo printed on glass (cylindrical wrap) ----
  let logo = null;
  if (opts.logoPath) {
    logo = document.createElement('canvas'); logo.width = 640; logo.height = 405;
    const g = logo.getContext('2d'); g.fillStyle = '#678BC7'; g.fill(new Path2D(opts.logoPath), 'evenodd');
  }
  function printLogo(cx, yc, r, w) {
    if (!logo) return;
    const h = w * 405 / 640, n = 60;
    for (let i = 0; i < n; i++) {
      const s0 = -w / 2 + w * i / n, s1 = s0 + w / n, a0 = s0 / r, a1 = s1 / r;
      const x0 = cx + r * Math.sin(a0), x1 = cx + r * Math.sin(a1), dy = r * E * (Math.cos((a0 + a1) / 2) - 1);
      ctx.globalAlpha = 0.82 + 0.18 * Math.cos((a0 + a1) / 2);
      ctx.drawImage(logo, (s0 + w / 2) / w * 640, 0, 640 / n, 405, x0, yc - h / 2 + dy, x1 - x0 + 0.4, h);
    }
    ctx.globalAlpha = 1;
  }
  function handleGlass(cx, r, y0, y1, out, side) {
    const s = side || 1, x0 = cx + s * (r - 2);
    const path = () => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(x0 + s * out, y0 - 4, x0 + s * out * 1.1, y1 + 6, x0, y1); };
    ctx.lineCap = 'round';
    path(); ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(38,52,58,.45)'; ctx.stroke();
    path(); ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(240,226,179,.85)'; ctx.stroke();
    path(); ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(232,240,242,.3)'; ctx.stroke();
    ctx.save(); ctx.translate(-s * 2, -1); path(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke(); ctx.restore();
  }

  // =====================================================================
  // FRENCH PRESS
  // =====================================================================
  function frenchPress() {
    const S = 19, cx = 290, floor = 626, r = 4.75 * S, baseH = 1.1 * S, bot = floor - baseH, top = bot - 16 * S;
    const fillY = top + 1.6 * S, rod = 15.2 * S, P = 11.5;
    let bubbles = [];
    return {
      P,
      reset() { bubbles = []; },
      plunge(t) { return seg(t, 1.6, 6.8); },
      update(t, dt) {
        const u = this.plunge(t), fy = lerp(fillY - 6, bot - 2.4 * S, u);
        if (u > 0.02 && u < 0.98 && rnd() < 30 * dt) bubbles.push({ x: cx + (rnd() < 0.5 ? -1 : 1) * (r - 6 - rnd() * 6), y: fy - 4, vy: -(30 + rnd() * 30), r: 1 + rnd() * 2.2 });
        for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.y += b.vy * dt; if (b.y < fillY + 4) bubbles.splice(i, 1); }
        if (rnd() < 9 * dt) puff(cx - r + 6, top - 10, 0.9, 10);
      },
      draw(t) {
        E = 0.24;
        const u = this.plunge(t), fy = lerp(fillY - 6, bot - 2.4 * S, u), bed = lerp(0.3, 1.7, u) * S;
        shadow(cx, floor, r * 1.25, 0.32);
        // base (steel foot)
        cyl(cx, bot, floor, r + 6, r + 8); ctx.fillStyle = hg(cx - r - 8, cx + r + 8, STEEL); ctx.fill();
        ell(cx, bot, r + 6); ctx.fillStyle = '#d5d9dc'; ctx.fill();
        glassBack(cx, top, bot, r);
        // coffee: murky below the filter, clearer above it, grounds bed at the bottom
        coffeeIn(cx, fillY, bot, r - 3);
        ctx.save(); cyl(cx, Math.max(fy, fillY), bot - bed, r - 3, r - 3); ctx.clip();
        ctx.fillStyle = 'rgba(44,24,10,.55)'; ctx.fillRect(cx - r, fy, 2 * r, bot - fy);
        ctx.fillStyle = 'rgba(150,102,60,.5)';
        for (let i = 0; i < 160; i++) { const gx = cx + (((i * 53) % 100) / 100 - 0.5) * 2 * r, gy = fy + (((i * 37) % 100) / 100) * (bot - fy); ctx.fillRect(gx, gy, 1.5, 1.5); }
        ctx.restore();
        // compacted grounds at the bottom
        cyl(cx, bot - bed, bot, r - 3, r - 3); ctx.fillStyle = hg(cx - r, cx + r, [[0, '#6e4527'], [0.4, '#4a2d18'], [1, '#3a2213']]); ctx.fill();
        ctx.fillStyle = 'rgba(190,140,92,.55)';
        for (let i = 0; i < 90; i++) { ctx.fillRect(cx + (((i * 61) % 100) / 100 - 0.5) * 2 * (r - 4), bot - bed + (((i * 29) % 100) / 100) * bed, 1.6, 1.6); }
        // the crust of grounds floats on top until the plunger pushes it down
        if (u < 0.12) {
          const a = 1 - u / 0.12;
          ell(cx, fillY, r - 3); ctx.fillStyle = `rgba(150,104,62,${0.95 * a})`; ctx.fill();
          ctx.fillStyle = `rgba(80,48,24,${0.8 * a})`;
          for (let i = 0; i < 70; i++) { const ang = i * 2.399, rr = (r - 6) * Math.sqrt((i % 23) / 23); ctx.fillRect(cx + Math.cos(ang) * rr, fillY + Math.sin(ang) * rr * E, 1.8, 1.8); }
        }
        for (const b of bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 2 * PI); ctx.strokeStyle = 'rgba(255,236,214,.55)'; ctx.lineWidth = 0.8; ctx.stroke(); }
        // mesh filter + rod
        ctx.save(); cyl(cx, top, bot, r - 3, r - 3); ctx.clip();
        ell(cx, fy, r - 3); ctx.fillStyle = hg(cx - r, cx + r, STEEL); ctx.fill();
        ctx.strokeStyle = 'rgba(40,40,40,.35)'; ctx.lineWidth = 0.6;
        for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 6, fy - (r - 3) * E * Math.sqrt(Math.max(0, 1 - (i * 6 / (r - 3)) ** 2))); ctx.lineTo(cx + i * 6, fy + (r - 3) * E * Math.sqrt(Math.max(0, 1 - (i * 6 / (r - 3)) ** 2))); ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(cx, fy, r - 3, (r - 3) * E, 0, 0, 2 * PI); ctx.strokeStyle = '#5d6165'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        ctx.fillStyle = hg(cx - 3, cx + 3, STEEL); ctx.fillRect(cx - 2.5, fy - rod, 5, rod);
        glassFront(cx, top, bot, r);
        if (logo) printLogo(cx, top + 9.4 * S, r, 4.6 * S);
        // steel cage: top band, two straps, handle
        cyl(cx, top - 4, top + 0.9 * S, r + 3, r + 3); ctx.fillStyle = hg(cx - r - 3, cx + r + 3, STEEL); ctx.fill();
        cyl(cx, bot - 0.9 * S, bot + 2, r + 3, r + 3); ctx.fillStyle = hg(cx - r - 3, cx + r + 3, STEEL); ctx.fill();
        ctx.fillStyle = hg(cx - r - 3, cx - r + 6, STEEL); ctx.fillRect(cx - r - 3, top + 0.9 * S, 7, bot - top - 1.8 * S);
        ctx.fillStyle = hg(cx + r - 4, cx + r + 3, STEEL); ctx.fillRect(cx + r - 4, top + 0.9 * S, 7, bot - top - 1.8 * S);
        // spout
        ctx.beginPath(); ctx.moveTo(cx - r - 3, top - 2); ctx.lineTo(cx - r - 16, top - 9); ctx.lineTo(cx - r - 3, top + 10); ctx.closePath(); ctx.fillStyle = hg(cx - r - 16, cx - r, STEEL); ctx.fill();
        // handle (black)
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx + r + 3, top + 1.5 * S); ctx.bezierCurveTo(cx + r + 3.6 * S, top + 1.2 * S, cx + r + 3.8 * S, top + 11 * S, cx + r + 3, top + 12 * S);
        ctx.lineWidth = 1.3 * S; ctx.strokeStyle = '#19191b'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + r + 8, top + 1.2 * S); ctx.bezierCurveTo(cx + r + 3.2 * S, top + 0.9 * S, cx + r + 3.3 * S, top + 9 * S, cx + r + 2.9 * S, top + 10.5 * S);
        ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.stroke();
        // lid
        ctx.beginPath(); ctx.moveTo(cx - r - 4, top - 4); ctx.quadraticCurveTo(cx, top - 1.6 * S, cx + r + 4, top - 4); ctx.ellipse(cx, top - 4, r + 4, (r + 4) * E, 0, 0, PI, false); ctx.closePath();
        ctx.fillStyle = hg(cx - r - 4, cx + r + 4, STEEL); ctx.fill();
        ell(cx, top - 1.2 * S + 6, 0.9 * S); ctx.fillStyle = '#7d8185'; ctx.fill();
        // rod above the lid + knob
        const ky = fy - rod;
        ctx.fillStyle = hg(cx - 3, cx + 3, STEEL); ctx.fillRect(cx - 2.5, ky, 5, Math.max(0, top - 1.3 * S - ky));
        ctx.beginPath(); ctx.arc(cx, ky - 0.7 * S, 0.95 * S, 0, 2 * PI);
        const kg = ctx.createRadialGradient(cx - 6, ky - 0.7 * S - 6, 2, cx, ky - 0.7 * S, 0.95 * S); kg.addColorStop(0, '#5a5a5e'); kg.addColorStop(1, '#141415'); ctx.fillStyle = kg; ctx.fill();
        drawSteam();
      }
    };
  }

  // =====================================================================
  // MOKA POT
  // =====================================================================
  function mokaPot() {
    // Lid closed, on a gas flame. Steam and a gurgle tell you it is done; then
    // the pot lifts off and pours into a small glass cup.
    const S = 19, P = 10;
    const stoveY = 610, potX = 380, cupX = 140, cupR = 3.0 * S, cupH = 5.6 * S, cupTop = stoveY - cupH, cupBase = 0.6 * S;
    // pot geometry, local coords: origin at the bottom centre, y up is negative
    const rB = 4.9 * S, rW = 3.4 * S, rT = 4.2 * S, hB = 6.6 * S, hW = 0.7 * S, hT = 6.8 * S;
    const yW = -hB, yWT = -hB - hW, yR = yWT - hT;
    const spout = { x: -rT - 1.15 * S, y: yR + 0.15 * S };
    const pourS = new Stream(COFFEE);
    let vol = 0;
    const tilt = (t) => -1.05 * (seg(t, 4.4, 5.6) - seg(t, 7.0, 7.9));          // radians
    const lift = (t) => seg(t, 3.9, 5.3) - seg(t, 7.5, 8.7);
    function pose(t) {
      // the pot's base travels on a gentle arc from the stove to its pouring spot
      // (worked out so the spout lip ends up just above the cup at full tilt)
      const l = lift(t), a = tilt(t), A = -1.05, c = Math.cos(A), s2 = Math.sin(A);
      const tx = cupX + 0.4 * S, ty = cupTop - 2.4 * S;
      const end = { x: tx - (spout.x * c - spout.y * s2), y: ty - (spout.x * s2 + spout.y * c) };
      return { x: lerp(potX, end.x, l), y: lerp(stoveY - 4, end.y, l) - Math.sin(PI * l) * 2.2 * S, a };
    }
    const toWorld = (p, q) => { const c = Math.cos(p.a), s2 = Math.sin(p.a); return { x: p.x + q.x * c - q.y * s2, y: p.y + q.x * s2 + q.y * c }; };
    return {
      P,
      reset() { pourS.p = []; pourS.on = false; vol = 0; },
      update(t, dt) {
        const p = pose(t);
        // steam from the spout once the water boils through, gurgle bursts at the end
        if (t > 1.2 && t < 4.2) {
          const sp = toWorld(p, spout), k = t > 2.6 ? 1.3 : 0.7;
          if (rnd() < (t > 2.6 ? 26 : 10) * dt) puff(sp.x - 4, sp.y - 2, k, 8);
          if (t > 2.6 && rnd() < 8 * dt) puff(p.x + (rnd() - 0.5) * rT, p.y + yR - 0.6 * S, 0.8, 10);
        }
        // pouring: flow follows how far the pot is tipped
        const a = -p.a;
        const sp = toWorld(p, spout);
        if (a > 0.55 && t < 7.5) {
          const q = 2.2 + 3.0 * clamp((a - 0.55) / 0.4, 0, 1);
          pourS.emit(sp.x + (rnd() - 0.5) * 0.5, sp.y, -6 * S, 6 * S, q, S);
        } else pourS.stop();
        const surf = stoveY - cupBase - (vol / (PI * 2.75 * 2.75)) * S;
        pourS.update(dt, S, (x) => Math.abs(x - cupX) < cupR ? surf : stoveY + 40, (h) => { if (Math.abs(h.x - cupX) < cupR) vol = Math.min(60, vol + 0.085); });
        if (t > 7.6 && rnd() < 10 * dt) puff(cupX, cupTop - 4, 1, cupR);
      },
      draw(t) {
        E = 0.24;
        const p = pose(t), flame = seg(t, 0.1, 0.6) * (1 - seg(t, 3.5, 4.0));
        // gas ring and pan support
        shadow(potX, stoveY + 14, 5.4 * S, 0.22);
        ctx.fillStyle = vg(stoveY, stoveY + 34, [[0, '#2a2a2c'], [1, '#0f0f10']]);
        ctx.beginPath(); ctx.ellipse(potX, stoveY + 16, 3.1 * S, 3.1 * S * E, 0, 0, 2 * PI); ctx.fill();
        ctx.beginPath(); ctx.ellipse(potX, stoveY + 13, 2.4 * S, 2.4 * S * E, 0, 0, 2 * PI); ctx.fillStyle = '#3b3c3f'; ctx.fill();
        if (flame > 0.01) {
          for (let i = 0; i < 16; i++) {
            const an = (i / 16) * 2 * PI, fx = potX + Math.cos(an) * 2.6 * S, fy = stoveY + 13 + Math.sin(an) * 2.6 * S * E;
            const h = (16 + 6 * Math.sin(t * 23 + i * 1.7) + 4 * Math.sin(t * 37 + i)) * flame;
            const g = ctx.createLinearGradient(0, fy, 0, fy - h);
            g.addColorStop(0, 'rgba(50,100,235,.95)'); g.addColorStop(0.55, 'rgba(110,160,255,.6)'); g.addColorStop(1, 'rgba(160,200,255,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - 5, fy); ctx.quadraticCurveTo(fx - 4, fy - h * 0.6, fx + Math.sin(t * 9 + i) * 2, fy - h); ctx.quadraticCurveTo(fx + 4, fy - h * 0.6, fx + 5, fy); ctx.fill();
          }
        }
        ctx.strokeStyle = '#18181a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(potX + k * 5.4 * S, stoveY + 2); ctx.lineTo(potX + k * 1.8 * S, stoveY - 2); ctx.stroke(); }
        // the cup on the counter
        shadow(cupX, stoveY, cupR * 1.2, 0.3);
        glassBack(cupX, cupTop, stoveY, cupR);
        handleGlass(cupX, cupR, cupTop + 0.2 * cupH, cupTop + 0.62 * cupH, 2.2 * S, -1);
        const surf = stoveY - cupBase - (vol / (PI * 2.75 * 2.75)) * S;
        if (vol > 0.3) coffeeIn(cupX, surf, stoveY - cupBase, cupR - 3, { body: [[0, 'rgba(150,80,32,.9)'], [0.1, 'rgba(90,40,14,.96)'], [0.5, 'rgba(40,18,6,.98)'], [1, 'rgba(110,52,18,.92)']], top: vg(surf - 12, surf + 12, [[0, '#a8703e'], [0.5, '#7a4a22'], [1, '#4a2a12']]) });
        pourS.draw(S);
        glassBase(cupX, stoveY, cupR, cupBase, vol > 0.3 ? 'rgba(150,84,36,.34)' : null);
        glassFront(cupX, cupTop, stoveY - cupBase, cupR);
        printLogo(cupX, cupTop + cupH * 0.42, cupR, 3.6 * S);
        // the pot, drawn in its own (moving, tipping) frame
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        const face = (yT, yB, rt, rb) => {
          const k = [-1, -0.62, 0, 0.62, 1], shade = ['#8e9296', '#dadddf', '#b5b9bd', '#7c8084'];
          for (let i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.moveTo(k[i] * rt, yT); ctx.lineTo(k[i + 1] * rt, yT); ctx.lineTo(k[i + 1] * rb, yB); ctx.lineTo(k[i] * rb, yB); ctx.closePath();
            ctx.fillStyle = shade[i]; ctx.fill();
            ctx.fillStyle = vg(yT, yB, [[0, 'rgba(255,255,255,.14)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.14)']]); ctx.fill();
          }
          ctx.beginPath(); ctx.moveTo(-rt, yT); ctx.lineTo(-rb, yB); ctx.lineTo(rb, yB); ctx.lineTo(rt, yT); ctx.closePath();
          ctx.strokeStyle = 'rgba(40,44,48,.5)'; ctx.lineWidth = 1.1; ctx.stroke();
        };
        // handle first (behind the top chamber where it joins)
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(rT - 6, yR + 1.0 * S); ctx.bezierCurveTo(rT + 2.8 * S, yR + 0.7 * S, rT + 2.6 * S, yR + 5.4 * S, rW + 8, yWT - 4);
        ctx.lineWidth = 1.15 * S; ctx.strokeStyle = '#17171a'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rT + 2, yR + 0.6 * S); ctx.bezierCurveTo(rT + 2.4 * S, yR + 0.3 * S, rT + 2.2 * S, yR + 3.8 * S, rT + 1.7 * S, yR + 4.8 * S);
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.stroke();
        face(yW, 0, rW, rB);
        ctx.beginPath(); ctx.arc(-rW * 0.95, yW + 2.4 * S, 0.42 * S, 0, 2 * PI); ctx.fillStyle = '#c9a24a'; ctx.fill();
        ctx.fillStyle = hg(-rW, rW, ALU); ctx.fillRect(-rW - 2, yWT, 2 * rW + 4, hW);
        ctx.strokeStyle = 'rgba(40,44,48,.45)'; ctx.lineWidth = 1; ctx.strokeRect(-rW - 2, yWT, 2 * rW + 4, hW);
        face(yR, yWT, rT, rW);
        // spout: a pinched lip on the left of the rim
        ctx.beginPath(); ctx.moveTo(-rT + 4, yR - 1); ctx.lineTo(spout.x, spout.y - 0.25 * S); ctx.lineTo(-rT + 0.25 * S, yR + 1.5 * S); ctx.closePath();
        ctx.fillStyle = hg(spout.x, -rT + S, [[0, '#9a9ea2'], [0.5, '#dfe2e4'], [1, '#a3a7ab']]); ctx.fill();
        ctx.strokeStyle = 'rgba(40,44,48,.45)'; ctx.lineWidth = 1; ctx.stroke();
        // closed lid: low faceted dome with a black knob
        ctx.beginPath(); ctx.moveTo(-rT - 2, yR); ctx.lineTo(-rT * 0.72, yR - 1.15 * S); ctx.lineTo(rT * 0.72, yR - 1.15 * S); ctx.lineTo(rT + 2, yR); ctx.closePath();
        ctx.fillStyle = hg(-rT, rT, ALU); ctx.fill(); ctx.strokeStyle = 'rgba(40,44,48,.45)'; ctx.stroke();
        ctx.fillStyle = 'rgba(30,30,30,.5)'; ctx.fillRect(-rT - 2, yR - 1, 2 * rT + 4, 2);
        ctx.beginPath(); ctx.ellipse(0, yR - 1.55 * S, 0.85 * S, 0.5 * S, 0, 0, 2 * PI);
        const kg = ctx.createRadialGradient(-4, yR - 1.75 * S, 1, 0, yR - 1.55 * S, 0.9 * S); kg.addColorStop(0, '#55555a'); kg.addColorStop(1, '#121214'); ctx.fillStyle = kg; ctx.fill();
        ctx.fillStyle = '#1c1c1e'; ctx.fillRect(-0.25 * S, yR - 1.25 * S, 0.5 * S, 0.2 * S);
        ctx.restore();
        drawSteam();
      }
    };
  }

  // =====================================================================
  // AEROPRESS
  // =====================================================================
  function aeroPress() {
    const S = 17, cx = 290, floor = 632, mugR = 4.2 * S, mugH = 9.6 * S, mugTop = floor - mugH, base = 0.9 * S;
    const capY = mugTop - 0.5 * S, chR = 3.15 * S, chTop = capY - 12.5 * S, plR = 2.85 * S, plLen = 12.6 * S, P = 11;
    const out = new Stream(COFFEE);
    let vol = 0, airB = [];
    const press = (t) => seg(t, 1.4, 7.2);
    const area = PI * 3.9 * 3.9;
    return {
      P,
      reset() { out.p = []; out.on = false; vol = 0; airB = []; },
      update(t, dt) {
        const u = press(t), du = press(t + 0.05) - u;
        const q = du > 0.0004 ? 3.4 : 0; // ml/s through the paper filter (real flow); mug fills faster than life
        if (q > 0) out.emit(cx + (rnd() - 0.5) * 0.6, capY + 6, 0, 30 * S, q, S); else out.stop();
        if (t > 7.2 && t < 7.8 && rnd() < 14 * dt) out.drop(cx, capY + 6, 6 * S, 2.6);
        const surf = floor - base - vol / area * S;
        out.update(dt, S, () => surf, (p) => { vol = Math.min(240, vol + (p.drop ? 0.6 : 0.16)); });
        if (t > 6.6 && t < 7.8 && rnd() < 40 * dt) airB.push({ x: cx + (rnd() - 0.5) * 2 * plR, y: capY - 6, r: 1 + rnd() * 2.5, a: 1 });
        for (let i = airB.length - 1; i >= 0; i--) { airB[i].a -= dt * 2; airB[i].y -= dt * 8; if (airB[i].a <= 0) airB.splice(i, 1); }
        if (t > 7.6 && rnd() < 12 * dt) puff(cx, mugTop - 4, 1.1, mugR);
      },
      draw(t) {
        const u = press(t), seal = lerp(chTop + 1.2 * S, capY - 1.3 * S, u);
        const surf = floor - base - vol / area * S;
        shadow(cx, floor, mugR * 1.3, 0.3);
        glassBack(cx, mugTop, floor, mugR);
        handleGlass(cx, mugR, mugTop + 0.17 * mugH, mugTop + 0.74 * mugH, 3.4 * S, -1);
        coffeeIn(cx, surf, floor - base, mugR - 3);
        out.draw(S);
        glassBase(cx, floor, mugR, base, vol > 1 ? 'rgba(150,84,36,.34)' : null);
        glassFront(cx, mugTop, floor - base, mugR);
        printLogo(cx, mugTop + mugH * 0.5, mugR, 4.6 * S);
        // filter cap (black, vented) and flange resting on the mug
        cyl(cx, capY - 0.6 * S, capY, chR + 6, chR + 6); ctx.fillStyle = hg(cx - chR, cx + chR, BLACK); ctx.fill();
        ell(cx, capY - 0.6 * S, chR + 6); ctx.fillStyle = '#2b2b2e'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - chR - 1.8 * S, capY - 0.7 * S); ctx.lineTo(cx + chR + 1.8 * S, capY - 0.7 * S); ctx.lineTo(cx + chR + 1.4 * S, capY - 1.5 * S); ctx.lineTo(cx - chR - 1.4 * S, capY - 1.5 * S); ctx.closePath();
        ctx.fillStyle = hg(cx - chR - 2 * S, cx + chR + 2 * S, [[0, 'rgba(70,74,78,.95)'], [0.3, 'rgba(150,154,158,.95)'], [1, 'rgba(60,64,68,.95)']]); ctx.fill();
        // chamber (smoky translucent plastic) with the coffee slurry between seal and filter
        const ct = chTop, cb = capY - 1.5 * S;
        cyl(cx, ct, cb, chR, chR); ctx.fillStyle = 'rgba(120,124,128,.22)'; ctx.fill();
        if (seal < cb - 1) {
          ctx.save(); cyl(cx, seal, cb, chR - 3, chR - 3); ctx.clip();
          ctx.fillStyle = hg(cx - chR, cx + chR, [[0, 'rgba(110,60,26,.92)'], [0.3, 'rgba(48,24,10,.96)'], [1, 'rgba(70,36,14,.94)']]); ctx.fillRect(cx - chR, seal, 2 * chR, cb - seal);
          ctx.fillStyle = 'rgba(160,112,70,.55)';
          for (let i = 0; i < 120; i++) ctx.fillRect(cx + (((i * 41) % 100) / 100 - 0.5) * 2 * chR, seal + (((i * 67) % 100) / 100) * (cb - seal), 1.5, 1.5);
          ctx.restore();
        }
        for (const b of airB) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 2 * PI); ctx.strokeStyle = `rgba(255,240,220,${0.6 * b.a})`; ctx.lineWidth = 0.8; ctx.stroke(); }
        // printed level marks (1 to 4) on the chamber
        ctx.font = `700 ${Math.round(0.62 * S)}px Montserrat, Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = 1; i <= 4; i++) {
          const my = cb - (i * 2.1 + 0.4) * S, mx = cx + chR * 0.45;
          ctx.beginPath(); ctx.arc(mx, my, 0.5 * S, 0, 2 * PI); ctx.strokeStyle = 'rgba(240,240,240,.85)'; ctx.lineWidth = 1.3; ctx.stroke();
          ctx.fillStyle = 'rgba(240,240,240,.9)'; ctx.fillText(String(i), mx, my + 0.5);
        }
        ctx.textAlign = 'start';
        // plunger: darker tube with black rubber seal
        cyl(cx, seal - plLen, seal, plR, plR); ctx.fillStyle = hg(cx - plR, cx + plR, [[0, 'rgba(50,52,56,.92)'], [0.25, 'rgba(110,114,118,.9)'], [0.45, 'rgba(70,72,76,.92)'], [1, 'rgba(36,38,40,.95)']]); ctx.fill();
        cyl(cx, seal - 0.5 * S, seal, plR + 1, plR + 1); ctx.fillStyle = '#121213'; ctx.fill();
        ell(cx, seal - plLen, plR + 6); ctx.fillStyle = hg(cx - plR, cx + plR, [[0, '#3a3c40'], [0.3, '#8a8e92'], [1, '#2c2e31']]); ctx.fill();
        // chamber glass-like front sheen + outline + flared top
        ctx.fillStyle = hg(cx - chR, cx + chR, [[0.08, 'rgba(255,255,255,0)'], [0.14, 'rgba(255,255,255,.45)'], [0.2, 'rgba(255,255,255,0)'], [0.85, 'rgba(255,255,255,0)'], [0.9, 'rgba(255,255,255,.18)'], [0.95, 'rgba(255,255,255,0)']]);
        ctx.fillRect(cx - chR, ct, 2 * chR, cb - ct);
        ctx.strokeStyle = 'rgba(40,44,48,.5)'; ctx.lineWidth = 1.2; ctx.strokeRect(cx - chR, ct, 2 * chR, cb - ct);
        ctx.beginPath(); ctx.ellipse(cx, ct, chR + 4, (chR + 4) * E, 0, 0, 2 * PI); ctx.ellipse(cx, ct, chR - 2, (chR - 2) * E, 0, 0, 2 * PI); ctx.fillStyle = 'rgba(150,154,158,.8)'; ctx.fill('evenodd');
        drawSteam();
      }
    };
  }

  // =====================================================================
  // ESPRESSO
  // =====================================================================
  function espresso() {
    const S = 26, cx = 270, tray = 600, cupR = 3.0 * S, cupH = 5.6 * S, cupTop = tray - cupH, base = 0.6 * S;
    const ghTop = 134, ghBot = 3.6 * S + 134, ghR = 3.4 * S, pfBot = ghBot + 1.6 * S, spY = pfBot + 1.0 * S, P = 10;
    const sL = new Stream(ESPRESSO), sR = new Stream(ESPRESSO);
    let vol = 0, crema = 0;
    const flow = (t) => t < 1.6 ? 0 : t < 2.2 ? 0.25 : t < 6.6 ? 1 : t < 7.4 ? 1 - seg(t, 6.6, 7.4) : 0;
    const area = PI * 2.75 * 2.75;
    return {
      P,
      reset() { sL.p = []; sR.p = []; sL.on = sR.on = false; vol = 0; crema = 0; },
      update(t, dt) {
        const f = flow(t);
        const surf = tray - base - (vol / area) * S;
        const hit = (p) => { vol = Math.min(52, vol + (p.drop ? 0.25 : 0.9 * dt * 60 / 60 * 6)); crema = Math.min(1, crema + 0.004); };
        if (t > 1.6 && t < 2.2) { if (rnd() < 7 * dt) sL.drop(cx - 14, spY, 4 * S, 2.4); if (rnd() < 7 * dt) sR.drop(cx + 14, spY, 4 * S, 2.4); }
        else if (f > 0.15) { const q = 0.9 * f; sL.emit(cx - 14 + (rnd() - 0.5) * 0.5, spY, -0.4 * S, 12 * S, q, S); sR.emit(cx + 14 + (rnd() - 0.5) * 0.5, spY, 0.4 * S, 12 * S, q, S); }
        else { sL.stop(); sR.stop(); if (t > 7.4 && t < 8 && rnd() < 6 * dt) sL.drop(cx - 14, spY, 4 * S, 2.2); }
        sL.update(dt, S, () => surf, hit); sR.update(dt, S, () => surf, hit);
        if (t > 7.6 && rnd() < 9 * dt) puff(cx, cupTop - 4, 0.9, cupR);
      },
      draw(t) {
        const blond = seg(t, 5.8, 7.2);
        const col = `rgba(${Math.round(lerp(96, 196, blond))},${Math.round(lerp(42, 128, blond))},${Math.round(lerp(14, 60, blond))},.95)`;
        sL.color = sR.color = { fill: col, hi: 'rgba(245,190,120,.6)' };
        // machine face behind the group head
        ctx.fillStyle = hg(0, W, [[0, '#9a9fa4'], [0.35, '#e3e6e8'], [0.6, '#b3b8bc'], [1, '#8a8f94']]); ctx.fillRect(40, 0, W - 80, ghTop + 18);
        ctx.fillStyle = vg(0, ghTop + 18, [[0, 'rgba(0,0,0,.06)'], [0.85, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.12)']]); ctx.fillRect(40, 0, W - 80, ghTop + 18);
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(40, ghTop + 16, W - 80, 3);
        // group head (chrome)
        cyl(cx, ghTop, ghBot, ghR, ghR); ctx.fillStyle = hg(cx - ghR, cx + ghR, STEEL); ctx.fill();
        ctx.fillStyle = vg(ghTop, ghBot, [[0, 'rgba(255,255,255,.1)'], [1, 'rgba(0,0,0,.15)']]); ctx.fill();
        // portafilter basket and black handle
        cyl(cx, ghBot, pfBot, ghR - 6, ghR - 16); ctx.fillStyle = hg(cx - ghR, cx + ghR, STEEL); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + ghR - 12, ghBot + 0.4 * S); ctx.lineTo(cx + ghR + 1.2 * S, ghBot + 0.9 * S); ctx.lineTo(cx + ghR + 1.2 * S, ghBot + 1.5 * S); ctx.lineTo(cx + ghR - 12, pfBot - 0.2 * S); ctx.closePath(); ctx.fillStyle = hg(cx, cx + ghR + S, STEEL); ctx.fill();
        ctx.save(); ctx.translate(cx + ghR + 1.2 * S, ghBot + 1.2 * S); ctx.rotate(0.08);
        ctx.beginPath(); ctx.moveTo(0, -0.55 * S); ctx.lineTo(7.5 * S, -0.75 * S); ctx.quadraticCurveTo(8.4 * S, 0, 7.5 * S, 0.75 * S); ctx.lineTo(0, 0.55 * S); ctx.closePath();
        ctx.fillStyle = vg(-0.8 * S, 0.8 * S, [[0, '#4a4a4e'], [0.35, '#232325'], [1, '#101011']]); ctx.fill();
        ctx.restore();
        // double spout
        for (const dx of [-14, 14]) { ctx.beginPath(); ctx.moveTo(cx + dx * 0.5 - 7, pfBot); ctx.lineTo(cx + dx - 4, spY); ctx.lineTo(cx + dx + 4, spY); ctx.lineTo(cx + dx * 0.5 + 7, pfBot); ctx.closePath(); ctx.fillStyle = hg(cx - 20, cx + 20, STEEL); ctx.fill(); }
        shadow(cx, tray + 4, cupR * 1.2, 0.3);
        // espresso glass
        glassBack(cx, cupTop, tray, cupR);
        handleGlass(cx, cupR, cupTop + 0.2 * cupH, cupTop + 0.62 * cupH, 2.2 * S, 1);
        const surf = tray - base - (vol / area) * S;
        if (vol > 0.3) {
          coffeeIn(cx, surf, tray - base, cupR - 3, { body: [[0, 'rgba(150,80,32,.9)'], [0.1, 'rgba(90,40,14,.96)'], [0.5, 'rgba(40,18,6,.98)'], [1, 'rgba(110,52,18,.92)']] });
          // crema: a tan layer that thickens, tiger-striped at the edge
          const ch = Math.min((vol / area) * S, crema * 0.8 * S);
          if (ch > 1) {
            ctx.beginPath(); ctx.moveTo(cx - cupR + 3, surf); ctx.lineTo(cx - cupR + 3, surf + ch); ctx.ellipse(cx, surf + ch, cupR - 3, (cupR - 3) * E, 0, PI, 0, true); ctx.lineTo(cx + cupR - 3, surf); ctx.closePath();
            ctx.fillStyle = hg(cx - cupR, cx + cupR, [[0, 'rgba(200,140,80,.9)'], [0.4, 'rgba(176,112,58,.95)'], [1, 'rgba(150,90,44,.9)']]); ctx.fill();
          }
          ctx.beginPath(); ctx.ellipse(cx, surf, cupR - 3, (cupR - 3) * E, 0, 0, 2 * PI);
          const cg = ctx.createRadialGradient(cx - 10, surf - 3, 2, cx, surf, cupR);
          cg.addColorStop(0, `rgba(222,170,110,${0.6 + 0.4 * crema})`); cg.addColorStop(0.7, `rgba(184,120,62,${0.6 + 0.4 * crema})`); cg.addColorStop(1, 'rgba(120,66,26,.95)');
          ctx.fillStyle = cg; ctx.fill();
          ctx.fillStyle = 'rgba(110,60,24,.45)';
          for (let i = 0; i < 40; i++) { const a = i * 2.4, rr = (cupR - 6) * Math.sqrt((i % 17) / 17); ctx.fillRect(cx + Math.cos(a) * rr, surf + Math.sin(a) * rr * E, 2, 1.2); }
        }
        sL.draw(S); sR.draw(S);
        glassBase(cx, tray, cupR, base, vol > 0.3 ? 'rgba(150,84,36,.34)' : null);
        glassFront(cx, cupTop, tray - base, cupR);
        printLogo(cx, cupTop + cupH * 0.42, cupR, 3.6 * S);
        drawSteam();
      }
    };
  }

  const scenes = { french: frenchPress, moka: mokaPot, aero: aeroPress, espresso };
  const sc = scenes[method]();
  let t = 0, raf = 0, last = 0, alive = true;
  function reset() { seed = 7; t = 0; steam = []; sc.reset && sc.reset(); }
  reset();
  function frame(now) {
    if (!alive) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    t += dt;
    // small fixed steps keep falling liquid smooth
    let k = Math.ceil(dt / (1 / 240)); const h = dt / k;
    for (let i = 0; i < k; i++) { sc.update(t - dt + h * (i + 1), h); stepSteam(h); }
    let a = 1;
    if (t > sc.P - 0.5) a = clamp((sc.P - t) / 0.5, 0, 1);
    else if (t < 0.4) a = clamp(t / 0.4, 0, 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.globalAlpha = a;
    sc.draw(t); ctx.globalAlpha = 1;
    if (t >= sc.P) reset();
    raf = requestAnimationFrame(frame);
  }
  function still(at) { reset(); const h = 1 / 240; while (t < at) { t += h; sc.update(t, h); stepSteam(h); } ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); sc.draw(t); }
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (opts.still !== undefined) still(opts.still);
  else if (reduce) still(sc.P - 1.5);
  else raf = requestAnimationFrame(frame);
  return { stop() { alive = false; cancelAnimationFrame(raf); }, resize() { fit(); }, still };
}
