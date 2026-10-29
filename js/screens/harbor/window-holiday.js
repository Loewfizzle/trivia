// CITY 2.0 — THE HARBOR: THE HOLIDAYS IN THE ROOMS (C4a split from windows.js; 11b's home): which dressing a window wears, the
// ofrenda, the sill's jack-o'-lantern, Thanksgiving's table + football, Halloween's ghost / mummy / witch / costume party moments.
import { clamp01, sm, R, TAU, lerp, mixc, paintBox, rgb, lampFall, deepAt, hsh, walkIn } from './window-rooms.js';
import { rngFrom } from '../../core/rng.js';
import { figure, whoW, whoM, SHADOW, LEGS_SH, COSTUME_PALS, SIL, figures } from './window-figure.js';
import { tvLight } from '../../core/harbor-moments.js';

export function createHoliday({ glow, litP, passing, seated }) {
  // ---------------------------------------------------------------- 11a-1 — THE HOLIDAYS IN THE ROOMS
  /** which holiday dressing a window wears tonight: 'ofrenda' (Day of the Dead's altars: the edge windows + the back room) ·
   *  'pumpkin' (Halloween's last week: a jack-o'-lantern on the edge windows' sills) · null */
  function holDress(hol, id) {
    if (!hol) return null;
    if (hol.id === 'dotd' && (hol.ofrendas || 0) > 0.05 && (id === 'edge2' || id === 'edge3' || id === 'back')) return 'ofrenda';
    if (hol.id === 'halloween' && (hol.stage || 0) >= 0.75 && (id === 'edge2' || id === 'edge3')) return 'pumpkin';
    return null;
  }
  const CANDLE = [255, 196, 110];
  /** THE OFRENDA: three tiers at the window's foot under a white cloth — candles (lit one by one through the lighting moment), the
   *  marigolds' orange masses, a framed photo, a sugar skull, the bread — papel picado across the glass's top; its candlelight the room's
   *  warm flickering glow (the edge's curtains + the back room's walls take it). up: the piece's 0..1 (going up / coming down). */
  function ofrendaState(E, lighting, up) {
    const { c, G, k, kl, t, mo, day } = E, a = clamp01(up), L = Math.max(kl, 0.25 * day);
    if (a <= 0.01 || L <= 0.01) return;
    const lit = lighting ? sm(0.18, 0.78, lighting.el / lighting.len) : (k > 0.25 ? 1 : 0);
    const x0 = G.g0 + G.cw * 0.08, x1 = G.g1 - G.cw * 0.08, base = G.h0 + 0.02, th = G.ch * 0.085;
    c.save(); c.globalAlpha *= a;
    // the room in candlelight: a warm glow rising from the altar (the curtains + the walls take it)
    if (k > 0.05) { c.globalCompositeOperation = 'lighter'; const fl = mo ? 0.88 + 0.12 * Math.sin(t * 7.3) * Math.sin(t * 3.1) : 1; glow(c, CANDLE, G.cx, base + th * 2.6, G.cw * 0.95, 0.42 * k * Math.max(0.35, lit) * fl, 0.85); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; }
    // the tiers: a white cloth, its lace edge, a band of papel colour on each riser
    // (the cloth a deep magenta + violet — the ofrenda reads by its COLOUR + its marigold arch + its candles, never a white cake)
    const cloth = k > 0.25 ? 'rgb(150,26,92)' : 'rgb(120,40,90)', bands = ['rgb(255,140,30)', 'rgb(110,40,170)', 'rgb(255,190,40)'];
    for (let i = 0; i < 3; i++) {
      const w = (x1 - x0) * (1 - i * 0.22), u0 = G.cx - w / 2, v0 = base + i * th;
      R(c, u0, v0, u0 + w, v0 + th, cloth);
      R(c, u0, v0 + th * 0.62, u0 + w, v0 + th * 0.86, bands[i]);
      c.fillStyle = cloth; for (let u = u0; u < u0 + w - 0.01; u += 0.05) { c.beginPath(); c.arc(u + 0.025, v0 + th * 0.62, 0.022, Math.PI, 0); c.fill(); }
    }
    // THE MARIGOLD ARCH over the altar (cempasúchil bound to a bent cane): orange + gold blooms round a half-ellipse
    { const ax = G.cx, ay = base + th * 1.2, arx = (x1 - x0) * 0.48, ary = G.ch * 0.6, n2 = 22;
      for (let i = 0; i <= n2; i++) { const a = Math.PI * i / n2, bx = ax - Math.cos(a) * arx, by = ay + Math.sin(a) * ary, br = 0.05 + 0.012 * ((i * 7) % 3);
        c.fillStyle = 'rgb(214,92,10)'; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); c.fillStyle = i % 3 ? 'rgb(255,170,30)' : 'rgb(255,206,60)'; c.beginPath(); c.arc(bx - br * 0.2, by + br * 0.2, br * 0.62, 0, TAU); c.fill(); } }
    // the photo (a dark frame in gold) + the sugar skull + the bread on the top tier
    const top = base + th * 3;
    R(c, G.cx - 0.13, top, G.cx + 0.13, top + 0.3, 'rgb(196,150,70)'); R(c, G.cx - 0.105, top + 0.025, G.cx + 0.105, top + 0.275, 'rgb(70,54,48)');
    c.fillStyle = 'rgb(120,100,92)'; c.beginPath(); c.arc(G.cx, top + 0.17, 0.05, 0, TAU); c.fill(); c.fillRect(G.cx - 0.07, top + 0.03, 0.14, 0.09);
    c.fillStyle = 'rgb(250,246,240)'; c.beginPath(); c.ellipse(G.cx - 0.26, top + 0.07, 0.075, 0.068, 0, 0, TAU); c.fill(); c.fillRect(G.cx - 0.3, top, 0.08, 0.05);
    c.fillStyle = 'rgb(40,24,40)'; for (const e of [-0.028, 0.028]) { c.beginPath(); c.arc(G.cx - 0.26 + e, top + 0.08, 0.018, 0, TAU); c.fill(); }
    c.fillStyle = 'rgb(236,60,150)'; c.beginPath(); c.arc(G.cx - 0.26, top + 0.125, 0.016, 0, TAU); c.fill();
    c.fillStyle = 'rgb(176,104,52)'; c.beginPath(); c.ellipse(G.cx + 0.27, top + 0.02, 0.09, 0.07, 0, Math.PI, 0, true); c.fill();
    // the marigolds: orange masses at each tier's ends, each bloom two tones
    const r = rngFrom(77);
    for (let i = 0; i < 3; i++) { const w = (x1 - x0) * (1 - i * 0.22), v = base + (i + 1) * th; for (const e of [-1, 1]) for (let j = 0; j < 3; j++) { const bx = G.cx + e * (w / 2 - 0.06 - j * 0.07), by = v + 0.03 + r() * 0.03, br = 0.04 + r() * 0.015; c.fillStyle = 'rgb(226,110,16)'; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); c.fillStyle = 'rgb(255,176,40)'; c.beginPath(); c.arc(bx - br * 0.2, by + br * 0.25, br * 0.6, 0, TAU); c.fill(); } }
    // the candles: white sticks along the tiers, flames lit in their order (a fine flicker each), their light round them
    const n = 9;
    for (let i = 0; i < n; i++) {
      const tier = i % 3, w = (x1 - x0) * (1 - tier * 0.22), u = G.cx + (((i * 0.37) % 1) - 0.5) * (w - 0.24), v = base + (tier + 1) * th, hgt = 0.07 + (i % 2) * 0.03;
      R(c, u - 0.016, v, u + 0.016, v + hgt, 'rgb(252,244,230)');
      const on = lit * n > i + (lighting ? 0.5 : 0);
      if (!on || k < 0.05) continue;
      const fl = mo ? 0.8 + 0.2 * Math.sin(t * (9 + i) + i * 2.1) : 1;
      c.fillStyle = 'rgb(255,236,170)'; c.beginPath(); c.ellipse(u, v + hgt + 0.03 * fl, 0.012, 0.03 * fl, 0, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter'; glow(c, CANDLE, u, v + hgt + 0.03, 0.14, 0.55 * k * fl); glow(c, [255, 250, 220], u, v + hgt + 0.03, 0.04, 0.8 * k * fl); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
    }
    // papel picado across the glass's top: a string of cut tissue flags, swaying a little
    const pc = ['rgb(236,60,140)', 'rgb(255,150,30)', 'rgb(140,80,220)', 'rgb(40,190,170)', 'rgb(255,214,40)', 'rgb(90,200,80)'], fy = G.h1 - 0.04, nf = Math.max(5, Math.round(G.cw / 0.2));
    R(c, G.g0, fy - 0.006, G.g1, fy + 0.006, 'rgba(60,40,40,0.8)');
    for (let i = 0; i < nf; i++) {
      const fw = G.cw / nf * 0.86, u = G.g0 + (i + 0.07) * G.cw / nf, sw = mo ? Math.sin(t * 1.7 + i * 1.3) * 0.012 : 0, fh = 0.2;
      c.fillStyle = pc[i % pc.length]; c.globalAlpha = a * (k > 0.25 ? 0.95 : 0.8);
      c.beginPath(); c.moveTo(u, fy); c.lineTo(u + fw, fy); c.lineTo(u + fw + sw, fy - fh); for (let z = 4; z >= 0; z--) c.lineTo(u + sw + fw * z / 4, fy - fh + (z % 2 ? 0.03 : 0)); c.closePath(); c.fill();
      c.fillStyle = 'rgba(30,16,24,0.55)'; c.fillRect(u + fw * 0.3 + sw * 0.5, fy - fh * 0.62, fw * 0.4, 0.035); c.fillRect(u + fw * 0.44 + sw * 0.5, fy - fh * 0.85, fw * 0.12, fh * 0.6);
      c.globalAlpha = a;
    }
    // the moment: someone kneels at the altar with a lit candle (its glow on the face), lighting them one by one
    if (lighting) {
      const p = lighting.el / lighting.len, inn = sm(0, 0.14, p), out = sm(0.86, 1, p), x = G.g0 + G.cw * (1.1 - 0.45 * inn + 0.55 * out);
      const reach = mo ? 0.5 + 0.5 * Math.sin(lighting.el * 1.4) : 0.5;
      figure(c, { x, y: base + 0.12, s: 0.9, face: -0.8, lean: -0.32 - 0.12 * reach, tilt: 0.2, hair: 'long', arms: [[1.1 + 0.3 * reach, 0.5], [0.4, 1.2]], hold: [null, 'candle'], ...litP(E, whoW(2), { lamp: [255, 200, 120], side: -1, a: 0.6 }), glints: E.glints, flame: 'rgb(255,236,170)' });   // (SP4: lit by her candle)
    }
    c.restore();
  }
  /** a jack-o'-lantern on the edge window's sill (Halloween's last week): backlit by the room, its carved face glowing from its candle */
  function sillPumpkin(E) {
    const { c, G, k, t, mo, w } = E, x = G.g0 + G.cw * (w.id === 'edge2' ? 0.24 : 0.74), y = G.h0 + 0.02, rx = 0.2, ry = 0.15;
    const fl = mo ? 0.82 + 0.18 * Math.sin(t * 8.1 + x) * Math.sin(t * 3.7) : 1;
    c.fillStyle = 'rgb(46,20,8)'; for (const [dx, sx] of [[-0.09, 0.62], [0.09, 0.62], [0, 0.8]]) { c.beginPath(); c.ellipse(x + dx, y + ry, rx * sx, ry, 0, 0, TAU); c.fill(); }
    c.fillStyle = 'rgb(30,40,16)'; c.fillRect(x - 0.015, y + ry * 1.9, 0.03, 0.07);
    c.strokeStyle = 'rgba(255,170,80,0.45)'; c.lineWidth = 0.02; c.beginPath(); c.ellipse(x, y + ry, rx * 1.02, ry * 1.02, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    if (k < 0.05) return;
    c.fillStyle = 'rgba(255,' + Math.round(170 + 50 * fl) + ',70,' + (0.95 * k).toFixed(2) + ')';
    for (const e of [-1, 1]) { c.beginPath(); c.moveTo(x + e * 0.1, y + ry * 1.1); c.lineTo(x + e * 0.03, y + ry * 1.1); c.lineTo(x + e * 0.065, y + ry * 1.5); c.closePath(); c.fill(); }
    c.beginPath(); c.moveTo(x - 0.12, y + ry * 0.75); c.quadraticCurveTo(x, y + ry * 0.2, x + 0.12, y + ry * 0.75); c.lineTo(x + 0.07, y + ry * 0.62); c.lineTo(x + 0.04, y + ry * 0.72); c.lineTo(x, y + ry * 0.58); c.lineTo(x - 0.04, y + ry * 0.72); c.lineTo(x - 0.07, y + ry * 0.62); c.closePath(); c.fill();
    c.globalCompositeOperation = 'lighter'; glow(c, [255, 150, 50], x, y + ry, 0.5, 0.45 * k * fl); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- 11a-2 — THANKSGIVING's ROOM LIFE (core#holidayPlays)
  // (the owner: "candlelit family tables in windows on the lit 3D kit + ACT BIG — NEVER in the boss's room; a football game on a TV in
  // another room"). Both are the rooms' own steady life all afternoon / evening on the day: the people ARRIVE through the room's depth in
  // the first chunk + LEAVE the same way in the last (tgSeat), everything between seamless; small natural motion on a seeded loop.
  const TG_CANDLE = [255, 188, 104], TG_TV = [150, 236, 168];
  /** person i of n: 0 (away) … 1 (in place) — the first chunk brings them in one after another, the last takes them out */
  function tgSeat(inst, el, len, i, n) {
    const first = !!(inst && (inst.first || (inst.n != null && inst.n < 0))), lst = !!(inst && inst.last);
    let w = 1;
    if (first) w = Math.min(w, sm(2 + i * 3.2, 8 + i * 3.2, el));
    if (lst) w = Math.min(w, 1 - sm(len - 26 + (n - 1 - i) * 3.2, len - 20 + (n - 1 - i) * 3.2, el));
    return w;
  }
  /** a person walking in from the room's door (deep, at doorX) to their place (x, depth d, seated waist y): → the figure's x, depth, y,
   *  legs (while standing), step */
  function tgWalk(E, w, doorX, x, d, y, s) {
    const go = sm(0, 0.82, w), sit = sm(0.78, 1, w), walking = w > 0.001 && w < 0.8;
    return { x: lerp(doorX, x, go), d: lerp(0.9, d, go), y: y + 0.44 * s * (1 - sit), legs: sit < 0.6 ? 0.6 * s : 0, step: walking && E.mo ? Math.sin(E.t * 6.2) : 0, face: walking ? Math.sign(x - doorX) * 0.85 : null, walking };
  }
  /** THE FAMILY TABLE (the back room, floor 3 — next door to the boss, never in his room): a dining room in candlelight — claret walls
   *  catching the two tapers, a framed picture, velvet drapes framing the pane; a table under a white cloth with the TURKEY on its platter,
   *  the cranberry + the sweet potatoes + the greens, a plate + a glass at every place; a family of four seated round it (grandpa at the
   *  left end, mother + father behind it, the daughter at the right end), lit FROM BELOW by the candles. On a 64-s loop (offset per
   *  chunk): talk passing round (heads turning to whoever speaks), forks to mouths, a dish passed across, grandpa leaning in, a laugh —
   *  and a TOAST (glasses up, the clink's glint). */
  function tgTable(E, el, len, inst) {
    const { c, G, k, t, mo, B } = E, night = clamp01(k), day = 1 - night, seed = 3;
    c.save(); c.globalAlpha = 1;
    // ---- the room (a dimmer daylight interior by day; at night only what the candles + the low lamp reach)
    const W0 = mixc([112, 84, 72], [58, 22, 26], night), W1 = mixc([164, 128, 108], [128, 52, 46], night);
    paintBox(c, G, B, { wall: [W0, W1], floor: [mixc([84, 60, 44], [32, 18, 14], night), mixc([108, 80, 58], [52, 30, 22], night)], side: [mixc([92, 68, 58], [44, 18, 20], night), mixc([132, 100, 84], [84, 34, 32], night)], flat: () => R(c, G.g0, G.h0, G.g1, G.h1, rgb(W1)) });
    if (B) lampFall(c, G, B, { u: G.cx, v: G.h0 + G.ch * 0.42, t: 0.45 }, TG_CANDLE, 0.55 + 0.45 * night, { reach: 1.05, corner: 0.62 });
    // the picture over the sideboard (deep): a gilt frame, a dark landscape
    deepAt(c, B, 0.98, () => { const px = G.cx + G.cw * 0.02, py = G.h0 + G.ch * 0.66; R(c, px - 0.34, py, px + 0.34, py + 0.42, rgb(mixc([170, 130, 60], [120, 84, 40], night))); R(c, px - 0.29, py + 0.05, px + 0.29, py + 0.37, rgb(mixc([88, 96, 70], [40, 34, 30], night))); R(c, px - 0.29, py + 0.05, px + 0.29, py + 0.15, rgb(mixc([120, 110, 70], [60, 46, 34], night))); });
    // ---- the people (the loop: who speaks, the dish, the toast)
    const LOOP = 64, L0 = mo ? ((el + (inst && inst.n > 0 ? inst.n * 23 : 0)) % LOOP) : 20;
    const toast = sm(41, 43, L0) * (1 - sm(47, 49, L0)), clink = sm(43.6, 44.2, L0) * (1 - sm(44.6, 45.4, L0)), sip = sm(47, 48, L0) * (1 - sm(49.5, 50.5, L0));
    const pass = sm(14, 16, L0) * (1 - sm(20, 22, L0)), passU = sm(16, 20, L0), laugh = sm(30, 30.6, L0) * (1 - sm(33, 34, L0)), lean = sm(52, 54, L0) * (1 - sm(60, 62, L0));
    const speaker = Math.floor(L0 / 7.5) % 4;
    const DP = 0.46, DT = 0.3, seatY = G.h0 + G.ch * 0.2, doorX = G.g0 + G.cw * 0.06;
    const SEATS = [
      { u: 0.14, s: 1.04, face: 0.85, hair: 'short', pal: { ...whoM(2), hair: 'rgb(196,192,184)' } },                 // grandpa (the left end, a brown suit, grey)
      { u: 0.38, s: 1.06, face: 0.25, hair: 'bun', dress: true, pal: whoW(2) },                                     // mother (champagne + pearls)
      { u: 0.63, s: 1.12, face: -0.2, hair: 'short', pal: whoM(0) },                                                // father (a white shirt + braces)
      { u: 0.86, s: 0.9, face: -0.85, hair: 'bob', dress: true, pal: whoW(1) },                                     // the daughter (the right end, teal)
    ];
    const lightOf = pal => ({ ...litP(E, pal, { lamp: TG_CANDLE, side: 0, a: 0.6 }), lit: { side: 0, a: 0.6, below: true, cast: 0.28 } });
    const list = [];
    SEATS.forEach((S, i) => {
      const w = tgSeat(inst, el, len, i, SEATS.length);
      if (w <= 0.001) return;
      const x = G.g0 + G.cw * S.u, P = tgWalk(E, w, doorX, x, DP, seatY, S.s);
      // the arms: resting / a fork up now + then (each on its own beat) / the dish across / the toast / leaning in
      const fork = mo ? sm(0.55, 0.62, ((L0 + i * 2.7) % 5.2) / 5.2) * (1 - sm(0.8, 0.9, ((L0 + i * 2.7) % 5.2) / 5.2)) * (1 - toast) * (1 - pass * (i === 1 || i === 2 ? 1 : 0)) : 0;
      const rest = [0.32, 1.25], forkA = [0.22, 2.35];
      let L = rest, Rt = [lerp(rest[0], forkA[0], fork), lerp(rest[1], forkA[1], fork)];
      if (i === 1 && pass > 0.01) Rt = [lerp(Rt[0], 1.35, pass), lerp(Rt[1], 0.35, pass)];          // (mother hands the dish across…)
      if (i === 2 && pass > 0.01) L = [lerp(L[0], 1.3, pass), lerp(L[1], 0.4, pass)];               // (…father takes it)
      if (toast > 0.01) { const up = [lerp(Rt[0], 2.35 - 0.25 * clink, toast), lerp(Rt[1], 0.45 + 0.2 * clink, toast)]; Rt = sip > 0.01 ? [lerp(up[0], 0.75, sip), lerp(up[1], 2.25, sip)] : up; }
      const arms = P.walking ? [[0.12 + 0.08 * P.step, 0.3], [0.12 - 0.08 * P.step, 0.3]] : i === 0 ? [Rt, L] : [L, Rt];   // (grandpa faces right: his near hand is his left)
      const talk = speaker === i ? (mo ? Math.sin(t * 2.3 + i) * 0.04 : 0) : 0, look = P.face != null ? P.face : lerp(S.face, Math.sign(SEATS[speaker].u - S.u) * 0.55 || S.face, speaker === i ? 0 : 0.5);
      const lk = (i === 0 ? lean : 0) * 0.16 - (i === 3 ? laugh : 0) * 0.12;
      list.push({ d: P.d, F: { x: P.x, y: P.y, s: S.s, face: look, lean: lk * Math.sign(S.face) + talk, tilt: (i === 3 ? laugh * 0.18 : 0) + talk * 0.6, hair: S.hair, dress: !!S.dress, legs: P.legs || 0, step: P.step,
        arms, hold: toast > 0.2 ? (i === 0 ? ['glass', null] : [null, 'glass']) : null, glints: toast > 0.3 ? E.glints : null, ...lightOf(S.pal) } });
    });
    list.sort((a, b) => b.d - a.d);
    for (const p of list) E.deep(p.d, () => figure(c, p.F));
    // ---- the table (nearer than the family: its cloth covers their laps)
    E.deep(DT, () => {
      const y0 = G.h0 + G.ch * 0.06, y1 = y0 + 0.22, a0 = G.g0 + 0.02, a1 = G.g1 - 0.02, cloth = mixc([226, 222, 210], [244, 226, 196], night);
      // the top (seen a little from above), the cloth's drop + its folds + the hem
      c.fillStyle = rgb(cloth); c.beginPath(); c.moveTo(a0, y0); c.lineTo(a1, y0); c.lineTo(a1 - 0.08, y1); c.lineTo(a0 + 0.08, y1); c.closePath(); c.fill();
      { const g = c.createLinearGradient(0, y0, 0, y0 - 0.5); g.addColorStop(0, rgb(mixc(cloth, [120, 90, 70], 0.18 + 0.2 * night))); g.addColorStop(1, rgb(mixc(cloth, [60, 30, 26], 0.55))); c.fillStyle = g; c.fillRect(a0, y0 - 0.5, a1 - a0, 0.5); }
      c.fillStyle = 'rgba(80,50,40,0.18)'; for (let u = a0 + 0.16; u < a1 - 0.1; u += 0.27) c.fillRect(u, y0 - 0.5, 0.035, 0.5);
      // the places: a plate + a glass in front of each
      for (const S of SEATS) { const px = G.g0 + G.cw * S.u; c.fillStyle = rgb(mixc([246, 244, 236], [255, 236, 206], night)); c.beginPath(); c.ellipse(px + (S.u < 0.2 ? 0.14 : S.u > 0.8 ? -0.14 : 0), y0 + 0.12, 0.13, 0.035, 0, 0, TAU); c.fill(); }
      // the platter + THE TURKEY (golden brown, glossy, its drumsticks with paper frills), parsley round it
      const tx = G.cx - 0.02, ty = y0 + 0.11;
      c.fillStyle = rgb(mixc([206, 210, 214], [236, 214, 176], night)); c.beginPath(); c.ellipse(tx, ty, 0.34, 0.07, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgb(70,120,50)'; for (let j = 0; j < 7; j++) { c.beginPath(); c.arc(tx - 0.28 + j * 0.093, ty + 0.01 + (j % 2) * 0.012, 0.03, 0, TAU); c.fill(); }
      const tb = c.createRadialGradient(tx - 0.05, ty + 0.17, 0.02, tx, ty + 0.1, 0.25); tb.addColorStop(0, 'rgb(236,170,92)'); tb.addColorStop(0.55, 'rgb(176,98,40)'); tb.addColorStop(1, 'rgb(104,52,22)');
      c.fillStyle = tb; c.beginPath(); c.ellipse(tx, ty + 0.1, 0.22, 0.135, 0, 0, TAU); c.fill();
      for (const e of [-1, 1]) { c.fillStyle = 'rgb(150,78,32)'; c.beginPath(); c.ellipse(tx + e * 0.2, ty + 0.06, 0.09, 0.05, e * 0.5, 0, TAU); c.fill(); c.fillStyle = 'rgb(250,246,236)'; c.beginPath(); c.arc(tx + e * 0.29, ty + 0.1, 0.026, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(255,240,210,0.55)'; c.beginPath(); c.ellipse(tx - 0.07, ty + 0.17, 0.07, 0.03, -0.3, 0, TAU); c.fill();
      // the dishes: cranberry (left), sweet potatoes (right), the green beans (passed across)
      const dish = (x, y, col) => { c.fillStyle = 'rgb(232,230,222)'; c.beginPath(); c.ellipse(x, y, 0.11, 0.035, 0, 0, TAU); c.fill(); c.fillStyle = rgb(col); c.beginPath(); c.ellipse(x, y + 0.02, 0.085, 0.035, 0, Math.PI, 0); c.fill(); };
      dish(G.g0 + G.cw * 0.27, y0 + 0.09, [168, 20, 40]); dish(G.g0 + G.cw * 0.74, y0 + 0.08, [236, 128, 40]);
      const bx = lerp(G.g0 + G.cw * 0.42, G.g0 + G.cw * 0.58, passU), by = y0 + 0.16 + 0.12 * pass;
      dish(bx, by, [80, 140, 60]);
      // the CANDLES: two tall tapers in brass sticks either side of the bird, their flames flickering
      for (const [e, ph] of [[-1, 0], [1, 2.1]]) {
        const cx = tx + e * 0.42, base = y0 + 0.12, top = base + 0.34, fl = mo ? 0.82 + 0.18 * Math.sin(t * 8.3 + ph) * Math.sin(t * 3.7 + ph * 1.7) : 1;
        c.fillStyle = 'rgb(176,136,60)'; c.beginPath(); c.ellipse(cx, base, 0.06, 0.018, 0, 0, TAU); c.fill(); R(c, cx - 0.014, base, cx + 0.014, base + 0.08, 'rgb(196,156,70)');
        R(c, cx - 0.018, base + 0.08, cx + 0.018, top, 'rgb(250,244,230)');
        c.fillStyle = 'rgb(255,236,170)'; c.beginPath(); c.ellipse(cx + (mo ? Math.sin(t * 5 + ph) * 0.004 : 0), top + 0.035 * fl, 0.014, 0.036 * fl, 0, 0, TAU); c.fill();
        c.save(); c.globalCompositeOperation = 'lighter'; glow(c, TG_CANDLE, cx, top + 0.03, 0.75, (0.32 + 0.35 * night) * fl, 0.9); glow(c, [255, 248, 220], cx, top + 0.03, 0.06, 0.9 * fl); c.restore(); c.globalAlpha = 1;
      }
      if (clink > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, [255, 246, 214], G.cx, y0 + 0.95, 0.4, 0.8 * clink); c.restore(); c.globalAlpha = 1; }
    });
    // the drapes framing the pane (deep red velvet, their inner edges catching the light)
    for (const [p, q] of [[G.g0 - 0.05, G.g0 + 0.1], [G.g1 - 0.1, G.g1 + 0.05]]) { R(c, p, G.h0, q, G.h1, rgb(mixc([120, 40, 44], [70, 16, 22], night))); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect((p + q) / 2, G.h0, 0.03, G.ch); }
    R(c, G.g0, G.h1 - 0.1, G.g1, G.h1, rgb(mixc([110, 36, 40], [60, 14, 20], night)));
    // by day the room reads dimmer than the street (a lit interior through glass)
    if (day > 0.01) { c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.35 * day; R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(150,160,176)'); c.globalCompositeOperation = 'source-over'; }
    c.restore(); c.globalAlpha = 1;
  }
  /** THE GAME ON TV (the jazz room becomes the den for the afternoon — never the boss's room): wood panelling, the SET on its stand at the
   *  left (its green field, the yard lines, the two teams' dots running, the ball), its green-white light flickering over three on the
   *  couch at the right watching it (lit from the screen's side). On a 48-s loop: the drive (leaning in, a sip from a mug), the long
   *  run, the SCORE (the screen flashes, they jump up, arms high, then flop back down) */
  function tgFootball(E, el, len, inst) {
    const { c, G, k, t, mo, B } = E, night = clamp01(k), day = 1 - night;
    c.save(); c.globalAlpha = 1;
    const LOOP = 48, L0 = mo ? ((el + (inst && inst.n > 0 ? inst.n * 17 : 0)) % LOOP) : 18;
    const drive = sm(18, 21, L0) * (1 - sm(29, 30, L0)), run = sm(26, 29.5, L0), score = sm(30, 30.5, L0) * (1 - sm(34.5, 36, L0)), flash = sm(29.8, 30.2, L0) * (1 - sm(30.6, 31.6, L0));
    const sip = sm(8, 9, L0) * (1 - sm(11, 12, L0));
    const tv = mo ? tvLight(t, 23) : { k: 0.8, tint: 0.5 }, tvk = Math.min(1, 0.55 + 0.45 * tv.k + 0.6 * flash);
    const W0 = mixc([96, 74, 58], [30, 26, 22], night), W1 = mixc([140, 108, 82], [52, 44, 34], night);
    paintBox(c, G, B, { wall: [W0, W1], floor: [mixc([90, 70, 54], [24, 22, 18], night), mixc([110, 86, 66], [36, 32, 26], night)], side: [mixc([84, 64, 50], [26, 24, 20], night), mixc([120, 94, 72], [44, 40, 32], night)], flat: () => R(c, G.g0, G.h0, G.g1, G.h1, rgb(W1)) });
    // the panelling's seams on the back wall
    deepAt(c, B, 0.98, () => { c.fillStyle = 'rgba(0,0,0,0.18)'; for (let u = G.g0 + 0.2; u < G.g1; u += 0.32) c.fillRect(u, G.h0, 0.025, G.ch); });
    // ---- THE SET (the left, mid depth): a wooden cabinet, the screen inset — the game on it
    const sx = G.g0 + G.cw * 0.2, sy = G.h0 + G.ch * 0.3;
    deepAt(c, B, 0.62, () => {
      R(c, sx - 0.42, sy - 0.3, sx + 0.42, sy, 'rgb(46,30,20)');                                   // (the stand)
      R(c, sx - 0.4, sy, sx + 0.4, sy + 0.6, rgb(mixc([120, 76, 40], [60, 38, 22], night)));       // (the cabinet)
      const s0 = sx - 0.31, s1 = sx + 0.31, v0 = sy + 0.09, v1 = sy + 0.5;
      const fg = c.createLinearGradient(0, v0, 0, v1); fg.addColorStop(0, rgb(mixc([40, 120, 50], [255, 255, 255], 0.5 * flash))); fg.addColorStop(1, rgb(mixc([70, 170, 80], [255, 255, 255], 0.5 * flash)));
      c.fillStyle = fg; c.fillRect(s0, v0, s1 - s0, v1 - v0);
      c.save(); c.beginPath(); c.rect(s0, v0, s1 - s0, v1 - v0); c.clip();
      const pan = mo ? (L0 * 0.035 + run * 0.4) % 0.16 : 0;
      c.strokeStyle = 'rgba(240,250,240,0.85)'; c.lineWidth = 0.014;
      for (let u = s0 - 0.2 - pan; u < s1 + 0.2; u += 0.16) { c.beginPath(); c.moveTo(u + 0.06, v0); c.lineTo(u - 0.04, v1); c.stroke(); }
      for (let j = 0; j < 9; j++) {
        const team = j % 2, ph = j * 1.7, ux = s0 + 0.04 + ((j * 0.37 + (mo ? Math.sin(t * 0.9 + ph) * 0.04 : 0) + run * (team ? 0.25 : 0.2)) % 1) * (s1 - s0 - 0.08), vy = v0 + 0.06 + ((j * 0.53) % 1) * (v1 - v0 - 0.12);
        c.fillStyle = team ? 'rgb(240,240,236)' : 'rgb(170,30,40)'; c.fillRect(ux - 0.016, vy - 0.02, 0.032, 0.045);
      }
      { const bx = s0 + 0.08 + (s1 - s0 - 0.16) * (0.3 + 0.6 * run), byy = v0 + (v1 - v0) * 0.5; c.fillStyle = 'rgb(120,70,30)'; c.beginPath(); c.ellipse(bx, byy, 0.016, 0.011, 0, 0, TAU); c.fill(); }
      c.restore();
      c.strokeStyle = 'rgb(30,22,16)'; c.lineWidth = 0.03; c.strokeRect(s0, v0, s1 - s0, v1 - v0);
      for (const e of [-1, 1]) { c.fillStyle = 'rgb(176,140,80)'; c.beginPath(); c.arc(sx + e * 0.18, sy + 0.04, 0.022, 0, TAU); c.fill(); }   // (the knobs)
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, TG_TV, sx, sy + 0.3, 0.9, (0.25 + 0.35 * night) * tvk, 0.8); glow(c, [255, 255, 255], sx, sy + 0.3, 0.32, 0.3 * flash); c.restore(); c.globalAlpha = 1;
    });
    // the screen's light thrown across the room (onto the couch side)
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, TG_TV, G.cx + G.cw * 0.18, G.h0 + G.ch * 0.42, G.cw * 0.75, (0.12 + 0.3 * night) * tvk, 0.8); c.restore(); c.globalAlpha = 1;
    // ---- THE COUCH (the right, nearer) + the three watching, turned to the set (lit from its side)
    const DC = 0.36, cy0 = G.h0 + G.ch * 0.08, seatY = cy0 + 0.36, doorX = G.g1 - G.cw * 0.04;
    const WHO = [{ u: 0.5, s: 0.94, hair: 'short', pal: whoM(3) }, { u: 0.69, s: 0.9, hair: 'bob', dress: true, pal: whoW(3) }, { u: 0.87, s: 0.98, hair: 'short', pal: whoM(1), mug: true }];
    const sofa = mixc([150, 56, 46], [74, 30, 28], night);
    E.deep(DC + 0.04, () => { R(c, G.g0 + G.cw * 0.38, cy0 + 0.18, G.g1 + 0.1, cy0 + 0.68, rgb(mixc(sofa, [0, 0, 0], 0.25))); });   // (the couch's back)
    const list = [];
    WHO.forEach((S, i) => {
      const w = tgSeat(inst, el, len, i, WHO.length);
      if (w <= 0.001) return;
      const x = G.g0 + G.cw * S.u, P = tgWalk(E, w, doorX, x, DC, seatY, S.s), up = score * (0.8 + 0.2 * Math.sin(i * 2.1)), hop = mo ? Math.abs(Math.sin((L0 - 30) * 7 + i)) * 0.06 * score : 0;
      let arms = [[0.3, 1.1], [0.3, 1.1]];
      if (i === 0) arms = [[lerp(0.3, 0.55, drive), lerp(1.1, 1.7, drive)], [lerp(0.3, 0.55, drive), lerp(1.1, 1.7, drive)]];   // (elbows on his knees for the drive)
      if (S.mug && sip > 0.01) arms = [arms[0], [lerp(0.3, 0.7, sip), lerp(1.1, 2.3, sip)]];
      if (up > 0.01) arms = arms.map(([a, e], j) => [lerp(a, 2.85 + 0.12 * j, up), lerp(e, 0.15, up)]);
      if (P.walking) arms = [[0.12 + 0.08 * P.step, 0.3], [0.12 - 0.08 * P.step, 0.3]];
      list.push({ d: P.d, F: { x: P.x, y: P.y + 0.3 * up * S.s + hop, s: S.s, face: P.face != null ? P.face : -0.6, lean: (i === 0 ? -0.14 * drive : 0) + 0.1 * up, tilt: 0.08 * up, hair: S.hair, dress: !!S.dress, legs: P.legs || (up > 0.4 ? 0.45 * S.s * up : 0), step: P.step,
        arms, hold: S.mug ? [null, 'cup'] : null, ...litP(E, S.pal, { lamp: mixc(TG_TV, [255, 240, 220], 0.4 + 0.3 * day), side: -1, a: 0.55 }) } });
    });
    list.sort((a, b) => b.d - a.d);
    for (const p of list) E.deep(p.d, () => figure(c, p.F));
    // the couch's seat + its arms in front of their laps; a bowl of popcorn on the cushion
    E.deep(DC - 0.04, () => {
      R(c, G.g0 + G.cw * 0.38, cy0 - 0.1, G.g1 + 0.1, cy0 + 0.3, rgb(sofa)); R(c, G.g0 + G.cw * 0.38, cy0 + 0.26, G.g1 + 0.1, cy0 + 0.32, rgb(mixc(sofa, [255, 220, 200], 0.15)));
      c.fillStyle = rgb(mixc(sofa, [0, 0, 0], 0.15)); c.beginPath(); c.ellipse(G.g0 + G.cw * 0.38, cy0 + 0.22, 0.09, 0.2, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgb(214,214,206)'; c.beginPath(); c.ellipse(G.g0 + G.cw * 0.6, cy0 + 0.32, 0.1, 0.03, 0, 0, TAU); c.fill(); c.fillStyle = 'rgb(252,240,200)'; c.beginPath(); c.ellipse(G.g0 + G.cw * 0.6, cy0 + 0.34, 0.08, 0.04, 0, Math.PI, 0, true); c.fill();
    });
    if (day > 0.01) { c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.35 * day; R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(150,160,176)'); c.globalCompositeOperation = 'source-over'; }
    c.restore(); c.globalAlpha = 1;
  }


  // ---------------------------------------------------------------- the holidays' moments (merged into windows.js's PAINT)
  const PAINT = {
    // 11a-2 — THANKSGIVING's ROOM LIFE (tgTable / tgFootball above)
    table: (E, el, len, inst) => tgTable(E, el, len, inst),
    football: (E, el, len, inst) => tgFootball(E, el, len, inst),
    // 11a-1 — A GHOST BEHIND THE CURTAIN (Halloween): a pale glowing sheet rises behind the drawn curtains, drifts to the gap, its eyes at
    // the gap a moment (crisp there — no fabric between), the room's light shivering, then it sinks away
    ghost(E, el, len, inst) {
      const { c, G, kl, mo, w } = E, p = el / len, a = sm(0.02, 0.2, p) * (1 - sm(0.8, 1, p)), behind = !!w.edge;
      if (a <= 0.01) return;
      const dir = hsh(inst.n, 4) < 0.5 ? -1 : 1, u = sm(0.12, 0.42, p) * (1 - 0.7 * sm(0.66, 0.86, p));
      const x = lerp(G.cx + dir * G.cw * 0.3, G.cx + dir * 0.01, u) + (mo ? Math.sin(el * 1.2) * 0.035 : 0), y = G.h0 + 0.05 + 0.32 * sm(0.02, 0.25, p) + (mo ? Math.sin(el * 2.3) * 0.04 : 0);
      const shiver = mo ? (Math.sin(el * 27) > 0.5 ? 1 : 0) * sm(0.42, 0.48, p) * (1 - sm(0.56, 0.62, p)) : 0;
      c.save();
      c.globalAlpha = (0.3 * a + 0.3 * shiver) * kl; R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(34,58,50)');
      // through the fabric: soft, green-white, glowing
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * kl;
      const ghostP = { x, y, s: 1.08, sheet: true, sway: mo ? Math.sin(el * 1.7) : 0, legs: 0.42, face: dir * -0.3, eyes: false, lean: -dir * 0.06 * (1 - u) };
      const gd = 0.7 - 0.5 * u;   // (WIN: it rises deep in the room and drifts to the glass — growing as it comes)
      E.deep(gd, () => { figure(c, { ...ghostP, col: 'rgba(150,255,196,0.16)', rim: { col: [120, 255, 170], a: 0.14, w: 0.11 } });
      figure(c, { ...ghostP, col: 'rgba(228,255,238,0.42)', rim: { col: [170, 255, 205], a: 0.3, w: 0.045 } }); });
      c.globalCompositeOperation = 'source-over';
      if (!behind) { c.globalAlpha = a * kl * 0.85; E.deep(gd, () => figure(c, { ...ghostP, col: 'rgba(236,255,244,0.55)', eyes: true, eyeCol: 'rgba(12,20,18,0.85)', rim: { col: [120, 255, 170], a: 0.5, w: 0.03 } })); c.restore(); c.globalAlpha = 1; return; }
      // the curtains' folds over it (it's BEHIND them) — except at the gap, where its eyes look out crisp
      c.globalAlpha = 0.4 * kl; c.fillStyle = 'rgba(120,70,40,1)'; for (const fx of [0.1, 0.22, 0.34, 0.66, 0.78, 0.9]) c.fillRect(G.g0 + G.cw * fx, G.h0, 0.035, G.ch);
      const gap0 = G.g0 + G.cw * 0.46, gap1 = G.g0 + G.cw * 0.56, at = sm(0.36, 0.44, p) * (1 - sm(0.62, 0.7, p));
      if (at > 0.01) { c.save(); c.beginPath(); c.rect(gap0, G.h0, gap1 - gap0, G.ch); c.clip(); c.globalAlpha = at * kl; figure(c, { ...ghostP, col: 'rgb(236,255,244)', eyes: true, eyeCol: 'rgb(12,20,18)', rim: { col: [120, 255, 170], a: 0.6, w: 0.03 } }); c.restore(); }
      c.restore(); c.globalAlpha = 1;
    },
    // 11a-1 — A MUMMY ON THE SHADE (Halloween): its shadow lurches across the jazz room's shade, arms out stiff, the wraps' loose ends
    // swinging, the legs dark under the hem
    mummy(E, el, len, inst) {
      const { c, G, kl, mo } = E, p = el / len, dir = hsh(inst.n, 2) < 0.5 ? 1 : -1, sv = G.h0 + G.ch * 0.26;
      const x = lerp(dir > 0 ? G.g0 - 0.7 : G.g1 + 0.7, dir > 0 ? G.g1 + 0.7 : G.g0 - 0.7, p), lurch = mo ? Math.sin(el * 2.4) : 0;
      c.save(); c.globalAlpha = kl;
      for (const pass of ['shade', 'legs']) {
        c.save(); c.beginPath(); if (pass === 'shade') c.rect(G.g0, sv, G.cw, G.h1 - sv); else c.rect(G.g0, G.h0, G.cw, sv - G.h0); c.clip();
        const col = pass === 'shade' ? SHADOW : LEGS_SH, s = 1.14, y = G.h0 + 0.48 + 0.03 * Math.abs(lurch);
        E.deep(0.4, () => figure(c, { rim: null, x, y, s, legs: 0.5, step: 0.45 * lurch, lean: dir * (0.1 + 0.07 * lurch), tilt: -dir * 0.25 + 0.1 * lurch, face: dir * 0.9, col, hair: null, arms: dir > 0 ? [[1.25, 0.15], [1.45 + 0.08 * lurch, 0.05]] : [[1.45 + 0.08 * lurch, 0.05], [1.25, 0.15]] }));
        // the wraps' loose ends hanging from the arms + the hip, swinging with the lurch
        c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = 0.035;
        for (const [ox, oy, l] of [[0.34, 0.6, 0.22], [0.5, 0.58, 0.16], [0.12, 0.05, 0.26]]) { const bx = x + dir * ox * s, by = y + oy * s, sw = mo ? Math.sin(el * 3.1 + ox * 9) * 0.06 : 0; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sw - dir * 0.03, by - l * 0.5, bx + sw * 1.6 - dir * 0.06, by - l); c.stroke(); }
        c.restore();
      }
      c.restore(); c.globalAlpha = 1;
    },
    // 11a-1 — A WITCH AT HER CAULDRON (Halloween): the room dark, the cauldron's green glow from below lighting her front, the bubbles
    // rising; she stirs, leans in, then throws her head back in a cackle
    witchsil(E, el, len) {
      const { c, G, k, t, mo } = E, p = el / len, a = sm(0, 0.08, p) * (1 - sm(0.92, 1, p));
      if (a <= 0.01 || k < 0.05) return;
      c.save(); c.globalAlpha = a * k;
      paintBox(c, G, E.B, { wall: [[16, 22, 20], [24, 34, 30]], floor: [[10, 14, 12], [16, 22, 18]], side: [[12, 18, 16], [20, 28, 24]], flat: () => R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(16,22,20)') });   // (WIN: her dark box)
      const px = G.cx + 0.05, py = G.h0 + 0.02, pr = Math.min(0.46, G.cw * 0.22);
      const pulse = mo ? 0.85 + 0.15 * Math.sin(t * 4.3) * Math.sin(t * 1.9) : 1;
      c.globalCompositeOperation = 'lighter';
      glow(c, [90, 255, 140], px, py + pr * 1.1, G.cw * 0.7, 0.55 * pulse * a * k, 1.1);
      glow(c, [170, 255, 120], px, py + pr * 1.05, pr * 1.1, 0.7 * pulse * a * k, 0.5);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a * k;
      // the witch behind the pot: the hat, the long hair, the cloak; her right arm circling with the paddle
      const cackle = sm(0.66, 0.72, p) * (1 - sm(0.84, 0.9, p)), stir = mo ? el * 2.6 : 0;
      const hx = px + Math.cos(stir) * pr * 0.45, hy = py + pr * 1.25 + Math.sin(stir) * 0.04;
      figure(c, { x: px - 0.06, y: py + pr * 0.8, s: 0.92, face: 0.55 - 0.4 * cackle, lean: 0.12 * (1 - cackle) - 0.1 * cackle, tilt: -0.5 * cackle, hat: 'witch', hair: 'long', cape: true, col: 'rgb(8,10,10)', rim: { col: [120, 255, 150], a: 0.75, side: 1, w: 0.03 },
        arms: cackle > 0.3 ? [[2.4, 0.3], [2.5, 0.25]] : [[0.5, 0.9], [0.9 + 0.25 * Math.cos(stir), 0.5 + 0.3 * Math.sin(stir)]] });
      if (cackle < 0.3) { c.strokeStyle = 'rgb(10,12,10)'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(hx, hy + 0.2); c.lineTo(px + Math.cos(stir) * pr * 0.25, py + pr * 0.9); c.stroke(); }
      // the cauldron: a black iron pot, its rim lit green, the brew's surface glowing, bubbles rising + bursting
      c.fillStyle = 'rgb(8,9,10)'; c.beginPath(); c.ellipse(px, py + pr * 0.6, pr, pr * 0.62, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgb(140,255,150)'; c.beginPath(); c.ellipse(px, py + pr * 1.08, pr * 0.86, pr * 0.14, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgb(20,24,22)'; c.lineWidth = 0.05; c.beginPath(); c.ellipse(px, py + pr * 1.08, pr * 0.9, pr * 0.16, 0, 0, TAU); c.stroke();
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const ph = ((t * 0.5 + i * 0.37) % 1), bx = px + (hsh(i, 8) - 0.5) * pr * 1.4 + Math.sin(t * 2 + i) * 0.03, by = py + pr * 1.1 + ph * pr * 1.6; glow(c, [160, 255, 150], bx, by, 0.05 + 0.03 * (1 - ph), 0.8 * (1 - ph) * a * k); }
      c.globalCompositeOperation = 'source-over';
      c.restore(); c.globalAlpha = 1;
    },
    // 11a-1 — THE COSTUME PARTY at the bar (Halloween): a witch, a devil, a cat + a sheet ghost raise their glasses — the clink in the middle
    costume(E, el, len) {
      const { c, G, kl } = E, p = el / len, y = G.h0 - 0.02;
      const up = sm(0.3, 0.44, p) * (1 - sm(0.76, 0.86, p)), clink = sm(0.46, 0.52, p) * (1 - sm(0.58, 0.64, p)), drink = sm(0.64, 0.7, p) * (1 - sm(0.74, 0.8, p));
      c.globalAlpha = kl;
      // (SP4: lit by the bar — the witch in black + a purple cape, a red devil, the sheet ghost white)
      // (WIN2 — ACT BIG: THREE, bigger, walking up from the room's depth like the toast — the witch, the devil, the sheet ghost)
      const who = [[0.24, { hat: 'witch', hair: 'long', cape: true, ...litP(E, COSTUME_PALS.witch) }, 0.98, 1], [0.52, { hat: 'horns', hair: 'short', ...litP(E, COSTUME_PALS.devil) }, 1.0, -1], [0.8, { sheet: true, legs: 0.3, col: 'rgb(222,214,198)', eyes: true }, 0.96, -1]];
      const W = walkIn(p, { pin: 0.24, pout: 0.8, from: 0.78, to: 0.14 }), step = E.mo && W.walking ? Math.sin(E.t * 6.5) : 0, group = [];
      for (const [u, look, s, toward] of who) {
        const ux = lerp(1.15 + (u - 0.24) * 0.5, u, W.k), x = G.g0 + G.cw * ux, a = lerp(lerp(0.15, 3.05, up), 2.5, clink), e = lerp(lerp(0.25, 0.1, up), 0.4, clink);
        const arm = drink > 0.01 ? [lerp(a, 0.7, drink), lerp(e, 2.3, drink)] : [a, e], other = [lerp(0.12, 2.75, up) * (1 - 0.5 * clink), 0.15];
        const arms = W.walking ? [[0.1 + 0.08 * step, 0.3], [0.1 - 0.08 * step, 0.3]] : toward < 0 ? [arm, other] : [other, arm], hold = toward < 0 ? ['glass', null] : [null, 'glass'];
        group.push({ x: x + toward * 0.05 * clink, y: look.sheet ? y + 0.3 : y, s, face: W.walking ? -0.8 : 0, lean: toward * 0.12 * clink, tilt: -0.4 * drink, arms: look.sheet ? null : arms, hold: look.sheet ? null : (up > 0.05 ? hold : null), col: SIL, glints: up > 0.3 ? E.glints : null, ...look });
      }
      E.deep(W.d, () => { figures(c, group);
      const kk = sm(0.49, 0.53, p) * (1 - sm(0.56, 0.64, p));
      if (kk > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, [255, 244, 210], G.cx, G.h0 + G.ch * 0.8, 0.5, 0.95 * kk); c.restore(); } });
      c.globalAlpha = 1;
    },
    ofrenda() { /* (drawn by ofrendaState with the lighting) */ },
  };

  return { holDress, ofrendaState, sillPumpkin, PAINT };
}
