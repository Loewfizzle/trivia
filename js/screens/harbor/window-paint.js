// CITY 2.0 — THE HARBOR: THE WINDOWS' PAINTERS (C4a split from windows.js): the rooms' states (the boss's shade + his TV room, the
// bar + the bartender + the patrons, the sax player, the edge windows' moods, the window party), the barbershop's life (shop: the day,
// the CLOSED card, the mirror door), the taps' answers + PAINT[id] — one painter per moment (core/harbor-moments.js#MOMENTS). Made per
// life by createPaint(life) (the life's shared state — windows.js#S).
import { TV_OFF, tvLight, TV_PAL, tvScene, bossWatchAt, bossWatchPlan, tvHolidayTint, tvShadow, MOMENT, TANGO_PATH } from '../../core/harbor-moments.js';
import { sm, clamp01, R, rgb, mixc, TAU, paintBar, tri, hsh, lerp, walkIn, floorShadow, paintBox, paintLampRoom, solveArm, deepAt, boxOf, lampFall, shopGlass, shopChairX, shopLamp, shopMirrorDoor, shopTones, barberChair, SHOP_ROOM } from './window-rooms.js';
import { figure, whoM, BARTENDER_PAL, whoW, figures, litPal, RIM_COL, sax, SIL, setRim, pals, BARBER, NIGHTGOWN, DAY_PALS, SHADOW, LEGS_SH, cat, SIL_TV, TANGO_HIM } from './window-figure.js';
import { idleMoves } from '../../core/harbor-dance.js';
import { rngFrom } from '../../core/rng.js';

const TV_END_S = 3 * 3600;

// SP6 — THE BOSS's TV (the owner: "it's got to be more blue"): 11a-2's lighter blue added WHITE (paler + greyer); the colours are now the
// owner's picked set (core/harbor-moments.js#TV_PAL — deep, saturated, cut between like scenes: tvCols below); a little brighter (× TV_LIFT)
const TV_LIFT = 1.18, HOT = [170, 205, 255];   // (HOT: a rim / hot core's lift — only on edges, never the wash)

export function createPaint(life) {
  const { taps, glow, litP } = life;
  // ---------------------------------------------------------------- THE ROOMS' STATES
  function apartmentState(E, st, list) {
    const { k, t } = E, bs = life.last.boss || {};
    if (list.find(e => e.id === 'lights-out')) return false;   // (the routine's painter draws the whole room: the shade's lamp off, the set on)
    const tp = taps.find(o => o.id === 'apartment' && t - o.at < 3.2);   // (a tap on his window: the shade's peek)
    // SP5 — ON A PARTY NIGHT he watches over his party: the shade all the way down, glowing with the set's light (the lamp's before it)
    // (SP6 — the owner: before 10 pm it read as a flat blank YELLOW pane among the dancing windows: the TV is ON from the party's start — the
    // one cool-blue window all party night)
    if (bs.party && k > 0.02) { bossShade(E, { glow: st === 'tv' || st === 'tvoff' || st === 'lamp' ? 'tv' : 'dark', cover: 1, watch: bs.watch, signal: bs.signal, tap: tp }); return true; }
    if (st === 'tv') { if (k > 0.01) { if (life.last.tvOff) tvDark(E); else tvRoom(E, 1); return true; } return false; }
    // (SP3 — the owner's 3 am bug: the TV room went ORANGE; now the TV gives a last flicker, the picture shrinks away, the room DARK)
    if (st === 'tvoff') { const el = (life.last.sec - TV_END_S + 86400) % 86400, on = el < 0.35 ? 1 : el < 0.5 ? 0.25 : el < 0.8 ? 0.95 : Math.max(0, 1 - (el - 0.8) / (TV_OFF - 0.8)) ** 1.6; if (k > 0.01 && on > 0.01) { if (life.last.tvOff) tvDark(E); else tvRoom(E, on); return true; } return false; }
    // SP5 — BY DAY + THE EVENING: THE DRAWN SHADE (the one window that never opens to the daylight) with its rare life + the tell
    bossShade(E, { glow: st === 'lamp' && k > 0.02 ? 'lamp' : 'dark', day: bs.day, signal: bs.signal, tap: tp });
    return true;
  }
  /** SP5 — THE BOSS's SHADE: a plain 1920s roller blind drawn down the pane (o.cover of it; 0.9 by day: a dark gap at the sill), its ring
   *  pull; by DAY it reads DARK against the sunlit facade (a dull olive cloth, the daylight only on its top edge); at dusk it glows WARM
   *  from the lamp behind (o.glow 'lamp'), on a party night cool BLUE from the set (o.glow 'tv', core#tvLight); the TELL: VIOLET with a
   *  dark SPADE cut-out (o.signal); its life: the PEEK (the hem lifts an inch + drops — o.day / a tap), the CIGAR SMOKE out of the sash
   *  cracked at the top, the SHADOW crossing behind the lit shade (o.day); THE WATCH: his shadow standing against the glow + the ember */
  /** C4a — THE LIT BLIND (review-4 §C1 1b; the owner: "a blind with the lamp behind it" read as a flat glow): a roller blind from the
   *  head down to o.hem with a light behind it — the cloth's own dim colour, the lamp's light through it as ONE radial from where the
   *  lamp stands (o.lamp { u, v }: brightest there, falling off to the edges — source-over on the cloth, never added on), the lamp's
   *  silhouette faint through the cloth (o.sil: a shade + its stem; none for a TV's glow), a few soft vertical folds (light / dark),
   *  the edges darker (the recess), then the hem bar, the ring pull + its cord down to the sill. o.cloth [r,g,b] the unlit cloth,
   *  o.col the light's colour, o.a 0..1 its strength */
  function litBlind(c, G, o) {
    const hem = o.hem, H = G.h1 - hem, a = clamp01(o.a), col = o.col, L = o.lamp || { u: G.cx, v: hem + H * 0.45 }, on = clamp01(a / 0.15);   // (on: the folds + edges fade in with the light — no step at dusk)
    if (H <= 0.01) return;
    c.save(); c.beginPath(); c.rect(G.g0 - 0.1, hem, G.cw + 0.2, H + 0.1); c.clip();
    // the cloth: dim, the light reaching all of it a little through the weave
    R(c, G.g0 - 0.1, hem, G.g1 + 0.1, G.h1 + 0.1, rgb(mixc(o.cloth, col, 0.22 * a)));
    // the lamp's light through it: brightest at the lamp, falling off to the edges
    { const hot = mixc(mixc(o.cloth, col, 0.92), [255, 248, 232], 0.18), r = G.cw * 0.85, g = c.createRadialGradient(L.u, L.v, 0, L.u, L.v, r);
      for (const [t, k] of [[0, 1], [0.3, 0.62], [0.62, 0.3], [1, 0.12]]) g.addColorStop(t, rgb(hot, k * a));
      c.fillStyle = g; c.fillRect(G.g0 - 0.1, hem, G.cw + 0.2, H + 0.1); }
    // the lamp's silhouette through the cloth (its shade + the stem down to the floor)
    if (o.sil && a > 0.05) {
      c.fillStyle = `rgba(60,36,20,${(0.35 * a).toFixed(3)})`;
      c.beginPath(); c.moveTo(L.u - 0.15, L.v - 0.06); c.lineTo(L.u + 0.15, L.v - 0.06); c.lineTo(L.u + 0.09, L.v + 0.06); c.lineTo(L.u - 0.09, L.v + 0.06); c.closePath(); c.fill();
      c.fillRect(L.u - 0.01, Math.max(hem, G.h0), 0.02, L.v - 0.06 - Math.max(hem, G.h0));
    }
    // the folds: six soft vertical waves, alternately catching the light + in shadow
    for (let i = 0; i < 6; i++) {
      const u = G.g0 + G.cw * (0.09 + 0.165 * i), w = G.cw * 0.06, lt = i % 2 === 0, g = c.createLinearGradient(u - w, 0, u + w, 0);
      const cc = lt ? `255,246,226,${(0.08 * on * Math.max(0.4, a)).toFixed(3)}` : `20,10,6,${(0.1 * on * Math.max(0.4, a)).toFixed(3)}`;
      g.addColorStop(0, `rgba(${cc.replace(/,[^,]*$/, ',0')})`); g.addColorStop(0.5, `rgba(${cc})`); g.addColorStop(1, `rgba(${cc.replace(/,[^,]*$/, ',0')})`);
      c.fillStyle = g; c.fillRect(u - w, hem, w * 2, H + 0.1);
    }
    // the edges darker (the light falls off + the recess), the head under the roller darker
    { const ed = 0.42 * on * Math.max(0.3, a), g = c.createLinearGradient(G.g0, 0, G.g1, 0);
      g.addColorStop(0, `rgba(0,0,0,${ed.toFixed(3)})`); g.addColorStop(0.16, 'rgba(0,0,0,0)'); g.addColorStop(0.84, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${ed.toFixed(3)})`);
      c.fillStyle = g; c.fillRect(G.g0 - 0.1, hem, G.cw + 0.2, H + 0.1);
      const g2 = c.createLinearGradient(0, G.h1, 0, G.h1 - G.ch * 0.2); g2.addColorStop(0, `rgba(0,0,0,${(0.6 * ed).toFixed(3)})`); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(G.g0 - 0.1, G.h1 - G.ch * 0.2, G.cw + 0.2, G.ch * 0.2); }
    c.restore();
    // the hem bar, the ring pull + its cord hanging to the sill (lit by the room's glow from behind: a warm edge)
    const bar = mixc([120, 100, 60], col, 0.25 * a);
    c.fillStyle = 'rgba(0,0,0,0.42)'; c.fillRect(G.g0 - 0.1, hem, G.cw + 0.2, 0.035);
    c.fillStyle = rgb(bar); c.fillRect(G.g0 - 0.1, hem - 0.012, G.cw + 0.2, 0.024);
    c.strokeStyle = rgb(mixc(bar, [255, 236, 190], 0.25), 0.95); c.lineWidth = 0.014; c.beginPath(); c.arc(G.cx, hem - 0.07, 0.035, 0, TAU); c.stroke();
    if (hem - 0.105 > G.h0 + 0.04) { c.fillStyle = rgb(mixc(bar, [0, 0, 0], 0.2), 0.9); c.fillRect(G.cx - 0.007, G.h0 + 0.03, 0.014, hem - 0.105 - G.h0 - 0.03); }
  }
  function bossShade(E, o = {}) {
    const { c, G, k, t, mo, day } = E, sig = o.signal || 0, wa = o.watch, cover0 = o.cover == null ? 0.9 : o.cover;
    const ev = o.day, p = ev ? ev.p : 0;
    const liftK = v => sm(0, 0.12, v) * (1 - sm(0.5, 0.82, v));   // (up over ~0.4 s, a hold, down)
    const peek = Math.max(ev && ev.id === 'peek' ? liftK(p) : 0, o.tap ? liftK(clamp01((t - o.tap.at) / 3.2)) : 0);
    const cover = cover0 - 0.07 * peek, hem = G.h1 - G.ch * cover;
    // the dark room under the hem (a sliver), lit faintly by what's behind
    const glowC = o.glow === 'tv' ? (() => { const tv = mo ? tvLight(t, 11, { late: !!life.last.tvLate }) : { k: 0.7, tint: 0.4, warm: 0 }; return { col: tvCols(tv, t).near, a: Math.min(1, (0.5 + 0.5 * tv.k) * TV_LIFT) * k }; })()   /* (SP6: a quiet stretch never sinks the party's one blue window) */
      : o.glow === 'lamp' ? { col: [255, 196, 120], a: 0.85 * k } : { col: [40, 36, 50], a: 0 };
    // (NIGHT-A — the owner, Oct 29: by day the strip under his hem read as an OPEN HOLE — this near-black was opaque over the bake's glass.
    // By day it is only a dim room seen THROUGH the same glass as the neighbours' lower panes (the bake's sky tint + sheen under this
    // layer show through); at night as before — the dark room + the lamp / TV's glow under the hem)
    { const dk = clamp01(day) * (1 - Math.min(1, glowC.a * 2)), a0 = c.globalAlpha; c.globalAlpha = a0 * (1 - 0.78 * dk); R(c, G.g0, G.h0, G.g1, G.h1, rgb(mixc([9, 8, 14], glowC.col, 0.18 * glowC.a))); c.globalAlpha = a0; }
    // THE SHADE: the cloth — 9c (the owner: the olive "reads a weird dark brown"; DECIDED: the building's own blind): by day the same CREAM /
    // TAN HOLLAND LINEN as the edge windows' blinds ([236,214,176] → [176,146,84]), fully down + evenly lit by the sun from outside (his
    // window reads CLOSED by being the only one fully drawn); dark at night, lit from behind
    const cloth = mixc([228, 206, 166], [30, 28, 30], 1 - day), lit = mixc(mixc(cloth, glowC.col, (o.glow === 'tv' ? 0.92 : 0.75) * glowC.a), [150, 84, 240], 0.7 * sig);   // (the tell: the cloth itself violet)
    if (glowC.a <= 0.02) { const g = c.createLinearGradient(0, hem, 0, G.h1); g.addColorStop(0, rgb(mixc(lit, [0, 0, 0], 0.2))); g.addColorStop(0.5, rgb(lit)); g.addColorStop(1, rgb(mixc(lit, [255, 250, 230], 0.18 * day))); c.fillStyle = g; c.fillRect(G.g0 - 0.1, hem, G.cw + 0.2, G.h1 - hem + 0.1); }
    // C4a — LIT, A REAL BLIND (litBlind): the light from behind a radial from where it stands (the lamp low left of centre, its shade
    // faint through the cloth; the set below the sill at the front right — no silhouette), the folds, the edges, the hem + the cord
    if (glowC.a > 0.02) {
      const tvG = o.glow === 'tv', hx = tvG ? G.g1 - G.cw * 0.26 : G.g0 + G.cw * 0.4, hy = tvG ? G.h0 + G.ch * 0.26 : G.h0 + G.ch * 0.42;
      litBlind(c, G, { hem, cloth: mixc(cloth, [150, 84, 240], 0.7 * sig), col: mixc(glowC.col, [168, 96, 255], 0.7 * sig), a: glowC.a * (tvG ? 0.95 : 0.9), lamp: { u: hx, v: hy }, sil: !tvG });
    }
    // 9c — THE LINEN BY DAY: its soft vertical sheen (the cloth's slight waves catching the light), a faint sag from the hem's corners, the
    // darker hem bar + the pull ring hanging under it, a little shade under the roller at the head
    if (day > 0.05 && glowC.a <= 0.02) {
      c.globalAlpha = day;
      for (let i = 0; i < 5; i++) { const u = G.g0 + G.cw * (0.1 + 0.2 * i), w = G.cw * 0.08; const g = c.createLinearGradient(u - w, 0, u + w, 0); g.addColorStop(0, 'rgba(255,250,236,0)'); g.addColorStop(0.5, `rgba(${i % 2 ? '120,96,60,0.07' : '255,250,236,0.16'})`); g.addColorStop(1, 'rgba(255,250,236,0)'); c.fillStyle = g; c.fillRect(u - w, hem, w * 2, G.h1 - hem); }
      c.strokeStyle = 'rgba(110,84,50,0.16)'; c.lineWidth = 0.018;
      c.beginPath(); c.moveTo(G.g0 + 0.02, hem + 0.04); c.quadraticCurveTo(G.g0 + G.cw * 0.28, hem + G.ch * 0.08, G.g0 + G.cw * 0.4, hem + G.ch * 0.2); c.stroke();
      c.beginPath(); c.moveTo(G.g1 - 0.02, hem + 0.04); c.quadraticCurveTo(G.g1 - G.cw * 0.28, hem + G.ch * 0.08, G.g1 - G.cw * 0.4, hem + G.ch * 0.2); c.stroke();
      const g2 = c.createLinearGradient(0, G.h1, 0, G.h1 - G.ch * 0.16); g2.addColorStop(0, 'rgba(60,44,28,0.28)'); g2.addColorStop(1, 'rgba(60,44,28,0)'); c.fillStyle = g2; c.fillRect(G.g0 - 0.1, G.h1 - G.ch * 0.16, G.cw + 0.2, G.ch * 0.16);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(G.g0 - 0.1, hem, G.cw + 0.2, 0.03);
      c.fillStyle = rgb([176, 146, 84]); c.fillRect(G.g0 - 0.1, hem - 0.014, G.cw + 0.2, 0.03);   // (the hem bar)
      c.strokeStyle = rgb([150, 120, 64], 0.95); c.lineWidth = 0.016; c.beginPath(); c.arc(G.cx, hem - 0.075, 0.038, 0, TAU); c.stroke();   // (the ring pull)
      c.globalAlpha = 1;
    }
    // THE TELL: the violet lamp's glow through the cloth + the dark spade against it
    if (sig > 0.01) {
      const VI = [168, 96, 255]; c.globalCompositeOperation = 'lighter';
      glow(c, VI, G.cx, G.h0 + G.ch * 0.52, G.cw * 1.1, 1.0 * sig * (0.92 + 0.08 * Math.sin(t * 0.9)), 0.85); glow(c, [214, 176, 255], G.cx, G.h0 + G.ch * 0.52, G.cw * 0.55, 0.7 * sig, 0.65);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      // THE SPADE ♠ (y is UP here) — 11a-2 (the owner: "reads as a black TRIANGLE"): BOLDER — two full lobes, a fat body to a sharp point,
      // the classic FLARED FOOT under it (a stem widening to a broad base), sized to the pane (~0.7 of its width) and filled as ONE shape
      // (the subpaths' union — no darker overlaps), crisp against the violet
      const S = Math.min(G.cw * 0.36, G.ch * 0.36), sx = G.cx, sy = G.h0 + G.ch * 0.5 - S * 0.04;
      const spade = () => { c.beginPath();
        // (every subpath wound the same way — counter-clockwise with y up, like arc()'s — so 'nonzero' fills their union)
        c.moveTo(sx, sy + S * 1.1); c.bezierCurveTo(sx - S * 0.22, sy + S * 0.78, sx - S * 0.98, sy + S * 0.42, sx - S * 0.98, sy - S * 0.06);
        c.lineTo(sx, sy - S * 0.2); c.lineTo(sx + S * 0.98, sy - S * 0.06); c.bezierCurveTo(sx + S * 0.98, sy + S * 0.42, sx + S * 0.22, sy + S * 0.78, sx, sy + S * 1.1); c.closePath();
        for (const d of [-1, 1]) { c.moveTo(sx + d * S * 0.48 + S * 0.5, sy - S * 0.1); c.arc(sx + d * S * 0.48, sy - S * 0.1, S * 0.5, 0, TAU); }
        c.moveTo(sx - S * 0.11, sy - S * 0.42); c.quadraticCurveTo(sx - S * 0.13, sy - S * 0.88, sx - S * 0.52, sy - S * 1.04); c.lineTo(sx + S * 0.52, sy - S * 1.04);
        c.quadraticCurveTo(sx + S * 0.13, sy - S * 0.88, sx + S * 0.11, sy - S * 0.42); c.closePath(); };
      spade(); c.fillStyle = `rgba(5,3,10,${(0.96 * sig).toFixed(3)})`; c.fill('nonzero');
    }
    // THE SHADOW behind the lit shade (an overcast day: someone crossing; a party night: him, standing — looking down at the street)
    if (ev && ev.id === 'shadow') { const u = p, a = Math.sin(Math.PI * u); glow(c, [8, 6, 12], G.g0 + G.cw * (0.15 + 0.7 * u), G.h0 + G.ch * 0.5, G.cw * 0.3, 0.55 * a, 1.2); c.globalAlpha = 1; }
    if (wa && wa.a > 0.01) {
      // 11a-2 — HIS SHADOW (core#bossWatchAt): sharp + dark against the shade when he stands at it, a bigger SOFT blur while he's deeper
      // in the room (walking up / away — the shade catches him from the lamp's side); a fedora's brim + crown, the shoulders; the
      // weight shift (a lean + a step across), the head's slow turn (narrowing to a profile), the cigar's ember — faint at his side,
      // raised to the mouth + flaring on a draw
      const nr = wa.near == null ? 1 : wa.near, soft = 1 - nr, sc = 1 + 0.35 * soft, sway = mo ? Math.sin(t * 0.7) * 0.008 : 0;
      const x = G.g0 + G.cw * wa.x + (wa.shift || 0) * G.cw * 0.035 + sway, lean = (wa.shift || 0) * 0.025, hd = wa.head || 0;
      const A = 0.9 * wa.a * Math.max(0.35, glowC.a), Y = v => hem + (G.h0 + v * G.ch - hem) * sc, X = (u, v) => x + (u * G.cw + lean * (v * G.ch)) * sc;
      const body = (ox, oy) => {
        c.beginPath(); c.moveTo(X(-0.3, 0) + ox, hem - 0.02 + oy); c.quadraticCurveTo(X(-0.29, 0.53) + ox, Y(0.53) + oy, X(-0.1, 0.49) + ox, Y(0.49) + oy);
        c.lineTo(X(0.1, 0.49) + ox, Y(0.49) + oy); c.quadraticCurveTo(X(0.3, 0.53) + ox, Y(0.53) + oy, X(0.32, 0) + ox, hem - 0.02 + oy); c.closePath(); c.fill();   // (the shoulders)
        const hx = X(0.03 * hd, 0.58) + ox, rx = G.cw * 0.105 * sc * (1 - 0.22 * Math.abs(hd));
        c.beginPath(); c.ellipse(hx, Y(0.585) + oy, rx, G.ch * 0.095 * sc, 0, 0, TAU); c.fill();   // (the head)
        if (Math.abs(hd) > 0.15) { c.beginPath(); c.ellipse(hx + Math.sign(hd) * rx * 0.95, Y(0.565) + oy, rx * 0.22 * Math.abs(hd), G.ch * 0.022 * sc, 0, 0, TAU); c.fill(); }   // (a profile: the nose)
        c.beginPath(); c.ellipse(X(0.03 * hd, 0.655) + ox, Y(0.655) + oy, G.cw * 0.2 * sc * (1 - 0.12 * Math.abs(hd)), G.ch * 0.02 * sc, 0, 0, TAU); c.fill();   // (the fedora's brim)
        const cx0 = X(0.03 * hd - 0.085, 0.66) + ox, cx1 = X(0.03 * hd + 0.085, 0.66) + ox, ct = Y(0.745) + oy, cb = Y(0.655) + oy;
        c.beginPath(); c.moveTo(cx0, cb); c.lineTo(cx0 + G.cw * 0.012, ct - G.ch * 0.012); c.quadraticCurveTo((cx0 + cx1) / 2, ct - G.ch * 0.004, cx1 - G.cw * 0.012, ct - G.ch * 0.012); c.lineTo(cx1, cb); c.closePath(); c.fill();   // (the crown, pinched)
      };
      const passes = soft > 0.06 ? 7 : 1, br = soft * G.cw * 0.09;
      c.fillStyle = `rgba(4,3,9,${(passes > 1 ? A * (0.32 + 0.3 * nr) : A).toFixed(3)})`;
      for (let i = 0; i < passes; i++) { const an = i * TAU / Math.max(1, passes - 1); body(i ? Math.cos(an) * br : 0, i ? Math.sin(an) * br : 0); }
      glow(c, [2, 2, 6], x, Y(0.5), G.cw * 0.32 * sc, 0.35 * wa.a, 1.1); c.globalAlpha = 1;
      const em = wa.ember || 0, hold = wa.hold || 0, up = Math.min(1, em * 1.7);
      if (em + hold > 0.02) { const ex = X(0.24 + (0.12 + 0.03 * hd - 0.24) * up, 0.3 + 0.26 * up), ey = Y(0.3 + 0.26 * up);
        c.globalCompositeOperation = 'lighter'; glow(c, [255, 120, 30], ex, ey, G.cw * (0.045 + 0.035 * em), (0.35 * hold + 0.95 * em) * wa.a, 0.5); if (em > 0.3) glow(c, [255, 214, 150], ex, ey, G.cw * 0.018, 0.8 * em * wa.a, 0.4);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    }
    // THE CIGAR SMOKE out of the sash cracked open at the top: a thin curl rising + drifting under the head, out over the brick
    if (ev && ev.id === 'smoke' && mo) {
      const a = sm(0, 0.08, p) * (1 - sm(0.85, 1, p));
      c.fillStyle = `rgba(4,4,8,${(0.6 * a).toFixed(3)})`; c.fillRect(G.g0, G.h1 - 0.035, G.cw, 0.035);   // (the sash's dark crack)
      const SM = day > 0.5 ? [120, 118, 130] : [160, 150, 170];
      for (let i = 0; i < 5; i++) { const ph = (t * 0.22 + i * 0.37) % 1, x = G.g0 + G.cw * (0.28 + 0.1 * i) + Math.sin(t * 0.8 + i * 1.9) * 0.08 * ph + ph * 0.22, y = G.h1 - 0.02 + ph * 0.42, r = 0.05 + 0.13 * ph; glow(c, SM, x, y, r, 0.26 * a * (1 - ph) * (1 - ph), 0.7); }
      if (E.after) E.after.push(() => { for (let i = 0; i < 4; i++) { const ph = (t * 0.19 + i * 0.29) % 1, x = G.g0 + G.cw * (0.4 + 0.08 * i) + Math.sin(t * 0.6 + i * 2.3) * 0.12 * ph + ph * 0.35, y = G.h1 + 0.05 + ph * 0.75, r = 0.09 + 0.2 * ph; glow(c, SM, x, y, r, 0.16 * a * (1 - ph) * (1 - ph), 0.8); } c.globalAlpha = 1; });
      c.globalAlpha = 1;
    }
    // the hem's bar + the ring pull (the shade reads as a roller blind, not a dark pane); the gap under it dark (lit: litBlind's own)
    if (glowC.a <= 0.02) {
      c.fillStyle = 'rgba(0,0,0,0.42)'; c.fillRect(G.g0 - 0.1, hem, G.cw + 0.2, 0.035);
      c.fillStyle = rgb(mixc([120, 100, 60], [255, 230, 160], 0.3 * day)); c.fillRect(G.g0 - 0.1, hem - 0.012, G.cw + 0.2, 0.024);
      c.strokeStyle = rgb(mixc([140, 118, 70], [255, 240, 190], 0.3 * day), 0.9); c.lineWidth = 0.014; c.beginPath(); c.arc(G.cx, hem - 0.07, 0.035, 0, TAU); c.stroke();
    }
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(G.g0, G.h1 - 0.05, G.cw, 0.05);   // (the roller's shadow at the head)
    c.globalAlpha = 1;
  }
  function barState(E, st, list) {
    const { c, G, k, day, t, mo } = E;
    if (list.find(e => e.id === 'bartender')) return false;
    if (st === 'last') {
      // THE LAST LIGHT (3 → 4 am): the bar low, the pendant on, the stools up on the counter, someone sweeping up
      if (k < 0.01) return false;
      c.globalAlpha = k; paintBar(c, G, 1, 0.62, E.B);
      const cy = G.h0 + G.ch * 0.3;
      E.deep(0.3, () => { c.fillStyle = 'rgb(30,16,12)';
        for (const u of [0.18, 0.42, 0.66, 0.88]) { const x = G.g0 + G.cw * u; c.fillRect(x - 0.1, cy, 0.2, 0.04); c.fillRect(x - 0.09, cy + 0.04, 0.025, 0.22); c.fillRect(x + 0.065, cy + 0.04, 0.025, 0.22); } });
      const sw = mo ? Math.sin(t * 2.4) : 0, x = G.g0 + G.cw * (0.5 + 0.22 * Math.sin(t * 0.21));
      E.deep(0.6, () => figure(c, { x, y: G.h0 + 0.02, s: 0.92, lean: 0.18 + 0.08 * sw, tilt: 0.2, face: 1, arms: [[0.5 + 0.25 * sw, 0.6], [0.7 + 0.25 * sw, 0.4]], hold: [null, 'broom'], ...litP(E, whoM(0)), hair: null }));
      c.globalAlpha = 1;
      return true;
    }
    if (st !== 'open') return false;
    // THE AFTERNOON (the bartender came at 4): the shade half drawn, the lower half lit warm, the bartender pottering — by day
    if (day > 0.01) { c.globalAlpha = day; barAfternoon(E, 1, 1); c.globalAlpha = 1; }
    // THE NIGHT: the bartender behind the bar + the patron in the hat (the toast brings two more) over the still bar
    const salute = taps.find(o => o.id === 'bar' && t - o.at < 3.2);
    if (k > 0.01 && !list.find(e => e.id === 'toast')) { c.globalAlpha = k; bartender(E, 'night'); if (!salute) patrons(E, null); c.globalAlpha = 1; }
    else if (k > 0.01) { c.globalAlpha = k; bartender(E, 'night'); c.globalAlpha = 1; }
    return day > 0.01 || k > 0.01;
  }
  /** the bar by day after 4 pm: the shade at `shade` (0..1 of the way to half), the room lit `lit` (0..1, the shelves one by one) */
  function barAfternoon(E, shade, lit) {
    // (a third of the way down — half-drawn reads as the shade's own height: the lit shelves + the bartender stay in view below it)
    const { c, G } = E, sv = G.h1 - G.ch * 0.34 * shade;
    // the lower half: the bar lit warm (or still dark)
    c.save(); c.beginPath(); c.rect(G.g0, G.h0, G.cw, sv - G.h0); c.clip();
    if (lit > 0.01) { const a = c.globalAlpha; c.globalAlpha = a * Math.min(1, 0.35 + lit); paintBar(c, G, lit, 0.15 * (1 - lit), E.B); c.globalAlpha = a; }
    else R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(36,26,26)');
    bartender(E, 'day', lit);
    // the glass: a little of the street's reflection over it
    R(c, G.g0, G.h0, G.g1, sv, 'rgba(236,232,220,0.1)');
    c.restore();
    // the shade: cream linen, its pull + hem, its folds
    const bl = tri(E.T, [232, 220, 192], [240, 196, 150], [80, 64, 60]);
    R(c, G.g0, sv, G.g1, G.h1, rgb(bl)); R(c, G.g0, sv, G.g1, sv + 0.05, rgb(mixc(bl, [0, 0, 0], 0.25)));
    c.fillStyle = rgb(mixc(bl, [0, 0, 0], 0.12)); for (let v = sv + 0.18; v < G.h1; v += 0.22) c.fillRect(G.g0, v, G.cw, 0.012);
    R(c, G.cx - 0.03, sv - 0.1, G.cx + 0.03, sv, E.frameC);
  }
  /** the bartender behind the counter, facing us: polishing a glass, now and then the cocktail shake (seeded on the clock) */
  function bartender(E, mode, lit = 1) {
    const { c, G, t, mo } = E, x = G.g0 + G.cw * 0.2, y = G.h0 + G.ch * 0.3 - 0.3;
    const slot = Math.floor(t / 31), ph = t - slot * 31, shake = mo && hsh(slot, 3) < 0.7 && ph > 22 && ph < 25;
    const pol = mo ? Math.sin(t * 5.2) : 0;
    let arms = [[0.55, 1.75 + 0.15 * pol], [0.35, 1.9 - 0.12 * pol]], hold = ['cloth', 'glass'];
    // (WIN — measured: the shake was a 22 rad/s sine switched on in one frame — 0.24 rad a frame, a blur that read as a stutter; now it
    // EASES in + out over 0.3 s and shakes at 1.75 Hz with a smaller throw: ≤ 0.05 rad a frame at 60 fps)
    if (shake) { const su = sm(22, 22.3, ph) * (1 - sm(24.7, 25, ph)), u = Math.sin((ph - 22) * 11) * su; arms = [[lerp(0.55, 0.25, su), lerp(1.75 + 0.15 * pol, 2.3, su)], [lerp(0.35, 1.9 + 0.25 * u, su), lerp(1.9 - 0.12 * pol, 0.9 - 0.22 * u, su)]]; hold = su > 0.5 ? [null, 'shaker'] : ['cloth', 'glass']; }
    // (behind the counter = further back than the patrons: a step smaller + a lighter silhouette, the back-bar's glow round him — so the
    // patrons' raised glasses read against him)
    // (WIN: behind the counter at depth 0.55 — a step smaller than the patrons in front of it; WIN2: the routine's arrival — he walks in
    // from the room's back right to his place, small to his size, never a cut: E.arrive 0..1 from the routine)
    const ar = E.arrive == null ? 1 : E.arrive, ax = lerp(G.g1 + 0.3, x, ar), ad = lerp(0.95, 0.55, ar), wk = mo && ar < 0.999 ? Math.sin(t * 6.5) : 0;
    const armsW = ar < 0.999 ? [[0.1 + 0.08 * wk, 0.3], [0.1 - 0.08 * wk, 0.3]] : arms, holdW = ar < 0.999 ? null : hold;
    E.deep(ad, () => { if (mode === 'day') figure(c, { x: ax, y, s: 0.86, face: ar < 0.999 ? -0.9 : 0, arms: armsW, hold: holdW, pal: { ...DAY_PALS[2], body: 'rgb(236,232,222)', arm: 'rgb(236,232,222)' }, glints: lit > 0.5 ? E.glints : null });
    else figure(c, { x: ax, y, s: 0.86, face: ar < 0.999 ? -0.9 : 0, arms: armsW, hold: holdW, ...litP(E, BARTENDER_PAL), glints: E.glints }); });   // (SP4: lit — a white shirt, a black waistcoat)
    // the counter in front of him (his waist behind it), nearer
    E.deep(0.3, () => { R(c, G.g0 - 0.4, G.h0 - 0.4, G.g1 + 0.4, G.h0 + G.ch * 0.3, mode === 'day' ? 'rgb(70,40,28)' : 'rgb(70,34,20)');
    R(c, G.g0 - 0.4, G.h0 + G.ch * 0.3 - 0.05, G.g1 + 0.4, G.h0 + G.ch * 0.3, mode === 'day' ? `rgba(230,170,90,${(0.5 + 0.5 * lit).toFixed(2)})` : 'rgb(230,170,90)'); });
  }
  /** the patrons at the bar (their backs to us, in front of the counter): the regular in the hat; THE TOAST brings two friends —
   *  three glasses raised high over their heads (catching the light), the clink over the middle (a sparkle), a drink, glasses down.
   *  toast: { p } (0..1) | { p, solo } (a tap: the regular alone salutes you) | null */
  function patrons(E, toast) {
    const { c, G, mo, t } = E, y = G.h0 - 0.02;
    const full = toast && !toast.solo;
    // (WIN2 — ACT BIG: TWO friends, bigger; they WALK UP from the room's depth (from the right, small) to the glass, raise BOTH arms high,
    // clink, drink, and drift back the way they came — never a cut; the regular alone keeps his stool)
    const who = full ? [[0.3, 'fedora', 1.0, 1, whoM(0)], [0.68, 'cloche', 0.94, -1, whoW(0)]] : [[0.74, 'fedora', 0.9, -1, whoM(1)]];
    const p = toast ? toast.p : 0, W = full ? walkIn(p, { pin: 0.24, pout: 0.8, from: 0.78, to: 0.14 }) : { d: 0.28, k: 1, walking: 0 };
    const up = toast ? sm(0.3, 0.44, p) * (1 - sm(0.76, 0.86, p)) : 0, clink = full ? sm(0.46, 0.52, p) * (1 - sm(0.58, 0.64, p)) : 0, drink = toast ? sm(0.64, 0.7, p) * (1 - sm(0.74, 0.8, p)) : 0;
    // (the walk ↔ the toast blended over a few frames — a hard switch snapped the arms 1.8 rad in one frame)
    const wk = full ? Math.max(1 - sm(0.17, 0.26, p), sm(0.78, 0.87, p)) : 0, step = mo && wk > 0.01 ? Math.sin(t * 6.5) : 0, group = [];
    for (const [u, hat, s, toward, pal] of who) {
      // the way in: from the room's right side, deep, to each one's place at the glass
      const ux = full ? lerp(1.15 + (u - 0.3) * 0.5, u, W.k) : u, x = G.g0 + G.cw * ux;
      // the toasting arms: BOTH straight up high over the head → leaning in for the clink → the glass folded to the mouth
      const a = lerp(lerp(0.12, 3.05, up), 2.5, clink), e = lerp(lerp(0.2, 0.1, up), 0.4, clink);
      const main = drink > 0.01 ? [lerp(a, 0.7, drink), lerp(e, 2.3, drink)] : [a, e], other = [lerp(0.12, 2.75, up) * (1 - 0.5 * clink), lerp(0.2, 0.15, up)];
      const arms = toward < 0 ? [main, other] : [other, main], hold = toward < 0 ? ['glass', null] : [null, 'glass'];
      const walkArms = [[0.1 + 0.08 * step, 0.3], [0.1 - 0.08 * step, 0.3]], armsNow = [0, 1].map(j => [lerp(arms[j][0], walkArms[j][0], wk), lerp(arms[j][1], walkArms[j][1], wk)]);
      group.push({ x: x + toward * 0.06 * clink, y, s, face: (W.out > 0 ? 1 : -1) * 0.8 * wk, lean: toward * 0.14 * clink + 0.05 * step * wk, tilt: -0.45 * drink, arms: armsNow, hold: up > 0.05 || !toast ? hold : null, hat, hair: hat === 'cloche' ? 'bob' : null, ...litP(E, pal), glints: up > 0.3 ? E.glints : null });
    }
    E.deep(W.d, () => {
    figures(c, group);
    if (full) {
      const k = sm(0.49, 0.53, p) * (1 - sm(0.56, 0.64, p));
      if (k > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, [255, 244, 210], G.cx, G.h0 + G.ch * 0.8, 0.5, 0.95 * k); glow(c, [255, 255, 255], G.cx, G.h0 + G.ch * 0.8, 0.16, k); c.restore(); }
    }
    });
  }
  /** 9e — THE SAX REWORK (the owner: "comically cheap" — and "as ALWAYS, it has to be readable for the phone"): ONE big LIT musician in
   *  the honey room (the shade up), real colours modelled by the room's lamp (a dark suit, the white shirt-front + a bow, a fedora), the
   *  BRASS SAX the one bright accent (gold, its bell catching the lamp); a playing pose that reads by silhouette alone (the horn's angle,
   *  the lean) and THE SWAY on the city's beat (the dance clock: one sway every two beats, livelier with the song's energy; a slow
   *  drift with no music). THE SOLO (the sax moment): he steps forward to the glass (bigger, nearer), leans back, the bell up — then
   *  back. Nothing smaller than reads at ~40 pt: no fingers, no breathing, no band behind. */
  const SAXMAN = { body: 'rgb(44,40,54)', skin: 'rgb(196,148,112)', hair: 'rgb(36,28,26)', hat: 'rgb(32,28,36)', legs: 'rgb(40,36,48)', prop: 'rgb(226,180,70)', arm: 'rgb(44,40,54)', marks: 'rgb(240,236,226)', m: ['collar', 'bow'] };
  function saxPlayer(E, solo) {
    const { c, G, t, mo, kl } = E;
    const p = solo ? solo.el / solo.len : 0, big = solo ? sm(0, 0.15, p) * (1 - sm(0.85, 1, p)) : 0;
    const d = life.last.dance || {}, bf = mo ? (d.bf != null && !d.gap ? d.bf : t * 0.9) : 0, dk = d.dk == null || d.gap ? 0.45 : 0.45 + 0.55 * d.dk;
    const sway = mo ? Math.sin(bf * Math.PI) * 0.07 * dk : 0, bob = mo ? Math.abs(Math.sin(bf * Math.PI)) * 0.03 * dk : 0;
    const lean = sway * (1 - 0.5 * big) - big * 0.36;
    c.save(); c.globalAlpha = kl;
    E.deep(0.5 - 0.3 * big, () => {
      // (2nd look pass: standing ON the floor — the legs drawn, never a floating half-figure; the arms in, both hands on the horn; the
      // mouthpiece at the lips + the horn no longer than waist-to-mouth)
      // (3rd pass: in PROFILE facing right — the classic sax silhouette, the horn in front of him; a size that keeps the hat inside the pane)
      const legs = 0.55 * 0.92, x = G.g0 + G.cw * (0.42 - 0.04 * big), y = G.h0 + 0.03 + legs + bob, sc = 0.92;
      floorShadow(c, x, G.h0 + 0.03, sc, 0.25);
      const pal = litPal(SAXMAN, RIM_COL.jazz, E.kl);
      figure(c, { x, y, s: sc, legs, lean, tilt: -0.12 - big * 0.32, face: 1, hat: 'fedora', arms: [[-0.15, 2.3 + 0.2 * big], [0.3, 1.6 + 0.3 * big]], pal, lit: { side: 0, a: 0.55 }, marks: SAXMAN.m, rim: { col: RIM_COL.jazz, a: 0.45, side: 0, w: 0.026 } });
      // THE SAX in brass: its mouthpiece at the lips, the body down + out to the bell at the hip, swung up in the solo
      const SX = sc * 1.1, mx = x + 0.12 * sc + Math.sin(lean) * 0.7 * sc, my = y + 0.72 * sc, ang = 0.15 - big * 0.65;   // (the solo: the bell swings UP in front of him)
      sax(c, mx, my, SX, ang, 1, rgb(mixc([226, 180, 70], [255, 222, 150], 0.25 * kl)));
      // the bell catching the lamp (the bright accent at phone size: a soft gold glint, brighter in the solo)
      const bx = 0.45 * SX, by = -0.3 * SX, th = -ang, gx = mx + bx * Math.cos(th) - by * Math.sin(th), gy = my + bx * Math.sin(th) + by * Math.cos(th);
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, [255, 214, 120], gx, gy, 0.22 * sc, (0.5 + 0.4 * big) * kl, 0.9); c.restore();
    });
    c.restore(); c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- WIN2 — THE EDGE WINDOWS' MOOD LIGHTS
  /** the edge window's night: a dark room box behind cream curtains, ONE mood's light + shadow in it (seeded per night, the two never
   *  alike), occasional soft flickers (never a strobe), the blackout through k, a lightning flash in it, the holidays' tints, the
   *  "never fully dark" floor */
  function edgeMood(E, mood, M) {
    const { c, G, k, t, mo, w, f } = E, h = life.last.h || 0, idx = w.id === 'edge3' ? 1 : 0;
    const flash = clamp01((f && f.flash) || 0), tint = M && M.tint === 'halloween' ? (idx ? [170, 70, 255] : [255, 150, 40]) : M && M.tint === 'christmas' ? (idx ? [60, 200, 90] : [255, 60, 60]) : null;
    const lv = k * (h >= 2 && h < 6 ? 0.75 : 1);
    // the room: dark; the curtains over it tied back, a gap between
    paintBox(c, G, E.B, { wall: [[26, 20, 22], [40, 32, 34]], floor: [[16, 12, 12], [26, 20, 20]], side: [[20, 16, 16], [34, 26, 26]], flat: () => R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(30,24,24)') });
    let col = [255, 214, 150], a = 0.9, cx = G.cx, cy = G.h0 + G.ch * 0.55, r = G.cw * 1.1, extra = null;
    const slot = Math.floor(t / 1.3), buzz = hsh(slot + idx * 7, 41) < 0.12 ? 0.4 + 0.6 * Math.abs(Math.sin(t * 47)) : 1;
    if (mood === 'tv') { const tv = mo ? tvLight(t, 29 + idx * 3) : { k: 0.7, tint: 0.4, warm: 0 }; col = tv.warm ? TV_PAL.W[0] : mixc(...TV_PAL[tvScene(t, 29 + idx * 3).id], 0.3); a = 0.75 * Math.min(1, tv.k); cy = G.h0 + G.ch * 0.4; }   // (SP6: the owner's deep blues)
    else if (mood === 'red') { col = [255, 40, 30]; a = 0.55 * (mo ? buzz : 1); cy = G.h0 + G.ch * 0.8; r = G.cw * 0.9; }
    else if (mood === 'candle') { col = [255, 180, 90]; a = (mo ? 0.62 + 0.18 * Math.sin(t * 7.3) * Math.sin(t * 3.1) + 0.08 * Math.sin(t * 11.7) : 0.7); cx = G.g0 + G.cw * 0.32; cy = G.h0 + G.ch * 0.28; r = G.cw * 0.95; }
    else if (mood === 'banker') { col = [120, 230, 150]; a = 0.6; cy = G.h0 + G.ch * 0.42; r = G.cw * 0.8; const per = 38, ph = (t + idx * 11) % per; if (ph < 3) extra = cc => { const u = ph / 3, sx = G.g0 - 0.4 + (G.cw + 0.8) * u; cc.fillStyle = 'rgba(4,2,4,0.55)'; cc.fillRect(sx - 0.22, G.h0, 0.44, G.ch); }; }
    else if (mood === 'headlights') { col = [40, 36, 48]; a = 0.3; const per = 24, ph = (t + idx * 9) % per; if (ph < 2.6) extra = cc => { const u = ph / 2.6, x0 = G.g0 - G.cw * 0.8 + (G.cw * 2.2) * u; cc.save(); cc.beginPath(); cc.rect(G.g0, G.h0 + G.ch * 0.45, G.cw, G.ch * 0.55); cc.clip(); cc.globalCompositeOperation = 'lighter'; const g = cc.createLinearGradient(x0, 0, x0 + G.cw * 0.9, 0); g.addColorStop(0, 'rgba(255,240,210,0)'); g.addColorStop(0.5, `rgba(255,240,210,${(0.55 * lv * Math.sin(Math.PI * u)).toFixed(3)})`); g.addColorStop(1, 'rgba(255,240,210,0)'); cc.fillStyle = g; cc.fillRect(G.g0, G.h0, G.cw, G.ch); cc.globalCompositeOperation = 'source-over'; cc.fillStyle = 'rgba(0,0,0,0.5)'; for (let i = 0; i < 6; i++) cc.fillRect(G.g0, G.h0 + G.ch * (0.5 + i * 0.085), G.cw, 0.03); cc.restore(); }; }
    else if (mood === 'fan') { col = [255, 214, 150]; a = 0.8; cy = G.h0 + G.ch * 0.7; extra = cc => { const ang = mo ? t * 0.9 : 0.4; cc.save(); cc.translate(G.cx, G.h0 + G.ch * 0.8); cc.fillStyle = 'rgba(8,4,6,0.5)'; for (let i = 0; i < 3; i++) { cc.rotate(ang + i * 2.094 - (i ? (i - 1) * 2.094 + 2.094 : 0)); cc.beginPath(); cc.moveTo(0, 0); cc.lineTo(G.cw * 0.55, -0.12); cc.lineTo(G.cw * 0.55, 0.12); cc.closePath(); cc.fill(); } cc.restore(); }; }
    else if (mood === 'out') { const off = M ? M.off : 23.9 * 3600, sec = life.last.sec || 0, gone = (h < 6 ? sec + 86400 : sec) >= off; col = gone ? [214, 140, 84] : [255, 214, 150]; a = gone ? 0.32 : 0.85; if (!gone && mo && sec > off - 0.35) a *= hsh(Math.floor(t * 20), 43) < 0.5 ? 0.3 : 1; }   // (a click: a flicker, then out)
    else if (mood === 'party') { const hue = (t * 18) % 360, pr = f && f.party && f.party.ramp != null ? f.party.ramp : 1, pulse = mo ? 0.12 * Math.max(0, Math.sin(t * 4.2)) * pr : 0; col = [[255, 46, 151], [46, 230, 255], [255, 210, 90], [125, 255, 106], [179, 107, 255]][Math.floor(hue / 72)]; a = 0.7 + pulse; }
    if (tint) col = mixc(col, tint, 0.55);
    const A = Math.max(0.25, a) * lv;   // (never fully dark: the floor)
    c.save(); c.beginPath(); c.rect(G.g0, G.h0, G.cw, G.ch); c.clip();
    // (C4a: the mood's light is a LAMP in the room — its pool, the back wall round it, the corners dark: lampFall — never two blobs)
    if (E.B) lampFall(c, G, E.B, { u: cx, v: cy, t: 0.7 }, col, 2.2 * A, { reach: r / G.cw, corner: 0.6 });
    else { c.globalCompositeOperation = 'lighter'; glow(c, col, cx, cy, r, 0.85 * A, 0.9); c.globalCompositeOperation = 'source-over'; }
    c.globalAlpha = 1;
    if (extra) extra(c);
    if (flash > 0.02) { c.fillStyle = `rgba(236,240,255,${(0.6 * flash * k).toFixed(3)})`; c.fillRect(G.g0, G.h0, G.cw, G.ch); }
    // SP5 — THE ROLLER SHADE (the owner: the curtains read as bow ties and blocked what little window there is — NO curtains in the half-cut
    // windows): a plain fabric blind from the head at tonight's seeded height (core#edgeShades) — UP: the roller only (the full mood light);
    // HALF: the cloth over the top half, the light + its shadows below one straight edge; DOWN: the shade itself a warm translucent panel
    // the mood's light + shadows play ON (the fan's blades, a passer, the flicker show through it, softened). One clean horizontal edge.
    const shd = (life.last.shades && life.last.shades[w.id]) || 'half', cover = shd === 'down' ? 0.93 : shd === 'half' ? 0.5 : 0.07, hem = G.h1 - G.ch * cover;
    // (C4a: the cloth a LIT BLIND — the mood's light through it from where it stands, the same painter as the boss's shade)
    c.globalAlpha = (shd === 'down' ? 0.72 : shd === 'half' ? 0.86 : 0.94) * Math.max(0.5, k);
    litBlind(c, G, { hem, cloth: [96, 80, 62], col, a: Math.min(1, A * 1.05), lamp: { u: cx, v: Math.max(hem + 0.1, cy) }, sil: false });
    c.globalAlpha = Math.max(0.5, k);
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(G.g0, G.h1 - 0.05, G.cw, 0.05);                                                // (the roller's shadow at the head)
    c.globalAlpha = 1; c.restore();
  }

  // ---------------------------------------------------------------- THE APARTMENT AT NIGHT: the TV, the night lamp
  /** WIN — THE BLUE TV ROOM REBUILT (the owner: the set must NOT be visible, the room LIT BY THE UNSEEN TV; the couch's back + the heads
   *  SHADED 3D forms, never flat cut-outs; REAL TV FLICKER; the smoke caught in it). The set sits below the sill at the window's right,
   *  facing the couch: its light comes from the FRONT-RIGHT + BELOW — the back wall + the left wall washed brightest low-right, the
   *  ceiling line darker; the couch (mid depth, its back to us) rim-lit along its top + its right end; the heads spheres lit from the
   *  front-right (a rim where the screen's light leaks round them, the far side dark). Small life as before (a slow tilt, a nod, a lean on
   *  a shoulder, an arm to the drink); THE SMOKE some nights: a cigarette's ember at the right head, wisps rising + a layered haze drifting
   *  across the room's upper half, lit by the flicker, thinning out over a few minutes. people: true | 0..1 (a forced head level) | false */
  // WIN3 — THE BOSS's TV ROOM (the owner: driving late at night he'd see, on a top floor at 3 am, the blue glow of someone watching TV —
  // you NEVER saw the person, so you wondered who he was; seeing the person takes that away): NO PERSON AT ALL — the mystery is the
  // point. The room DARK; the only light the unseen set's, below the sill at the front right, thrown UP onto the back wall + the ceiling,
  // through the half-drawn curtain whose inner edge catches it; REAL TV flicker (core#tvLight: irregular cuts, brightness jumps, colour
  // shifts, long steady dim stretches, the channel flipping late); once in a while a SHADOW crosses the glow (core#tvShadow — only ever a
  // shadow); the haze some nights (no cigarette: nobody is ever seen); the holiday film's faint tint (core#tvHolidayTint). Every night
  // ~10 pm → 3 am (roomState 'tv'), the only cool-blue window among the warm rooms. LORE: maybe it's the boss's room; nobody knows — on a
  // raid night the set snaps off early as the siren starts + a shadow at the curtain watches the street (tvDark); it never joins the
  // window party; on the quiet nights the other rooms go to bed around it. lastTv: the light drawn this frame (the readout + the e2e).
  /** 11a-2 — his shadow now: on a party night the night's plan on the PEAK's clock (life.partyPeakS: seconds since the peak began — the
   *  same on every phone); forced (&force=boss-watch, the panel's row) the short demo cycle from the flag's first frame */
  let watchT0 = null, watchPlans = {};
  function watchNow(L, t) {
    const seed = L.seed || 11;
    if (L.bossWatch) { if (watchT0 == null) watchT0 = t; return bossWatchAt(watchPlans.d || (watchPlans.d = bossWatchPlan(seed, { demo: true })), t - watchT0, seed); }
    watchT0 = null;
    if (L.partyPeakS == null || L.partyPeakS < 0) return null;
    return bossWatchAt(watchPlans[seed] || (watchPlans[seed] = bossWatchPlan(seed)), L.partyPeakS, seed);
  }
  /** SP6 — the set's light now: the scene's palette (core#tvScene — cuts between the owner's picked blues, settling on B), the late burst's
   *  channel flips each their own, the quiet stretches on B, a rare warm cut (W); the holiday film's tint over the blues →
   *  { near (the light by the set), far (the deeper wash), ceil (H: the ceiling catching it), id } */
  function tvCols(tv, t, seed = 11) {
    const id = tv.burst ? 'BANHFBW'[Math.min(6, Math.floor((tv.tint || 0) * 7))] : tv.quiet != null ? 'B' : tv.warm ? 'W' : tvScene(t, seed).id;
    let [near, far] = TV_PAL[id];
    const hol = tvHolidayTint(life.last.hol ? life.last.hol.id : null);
    if (hol && id !== 'W') { near = mixc(near, hol.col, hol.w); far = mixc(far, hol.col, hol.w); }
    return { near, far, ceil: id === 'H' ? 1 : 0, id, hol };
  }
  function tvRoom(E, on = 1) {
    const { c, G, t, k, mo, B } = E, a = k * on, late = !!life.last.tvLate;
    const tv = mo ? tvLight(t, 11, { late }) : { k: 0.75, tint: 0.4, warm: 0, cut: 1, dim: 0 };
    // SP6 — THE BLUE TV WINDOW (the owner: "you almost nailed it the very first time — it's got to be more blue"): 7b's FIRST look filled
    // the pane with the set's light; WIN's room made most of it dim GREY furniture. Now: (1) the colour DEEP + SATURATED (TV_PAL, no white
    // added), (2) the WHOLE pane washed with it — strongest low at the front right, where the unseen set stands below the sill, the ceiling +
    // the curtain's inner edge catching it — (3) the room's shapes DARK against it, each with a lit side toward the set: an EMPTY couch's
    // back low across (a thin blue rim along its top — whoever watches may be lying down below it), a floor lamp (off), a picture frame on
    // the back wall. STILL NO PERSON, ever. The calm, irregular flicker (core#tvLight) untouched.
    const P = tvCols(tv, t), near = P.near, far = P.far;
    // (SP6 — the owner, on a frame burst: "THAT's the glow" — the bright frame (the pane ≈ [38,64,150]) is the PRIMARY glow; the old quiet
    // stretches sank it to a dim navy most of the time. Now a quiet stretch HOLDS the primary glow, the cuts + the flicker move round it, a
    // dim spell dips only a little)
    const tk = tv.quiet != null ? 0.92 : 0.6 + 0.4 * Math.min(1, tv.k * TV_LIFT), L = a * (0.62 + 0.38 * tk);   // (the wash never sinks far: it must read "a TV is on" from across the street, even in a quiet stretch)
    life.lastTv = { k: +tv.k.toFixed(3), tint: +tv.tint.toFixed(2), warm: tv.warm, burst: tv.burst ? 1 : 0, quiet: tv.quiet ? 1 : 0, late, hol: P.hol ? life.last.hol.id : null, on: +on.toFixed(2), scene: P.id, col: near.map(Math.round) };
    c.globalAlpha = 1;
    const dark = [3, 4, 12], v = (col, x) => mixc(dark, col, clamp01(x));
    // (1 + 2) THE WASH: every face of the box the set's blue at a value — never grey
    paintBox(c, G, B, { wall: [v(near, 0.6 * L), v(far, 0.62 * L)], floor: [v(far, 0.12 * L), v(far, 0.3 * L)], side: [v(far, 0.2 * L), v(far, 0.5 * L)],
      flat: () => { const g = c.createLinearGradient(0, G.h0, 0, G.h1); g.addColorStop(0, rgb(v(far, 0.32 * L))); g.addColorStop(1, rgb(v(near, 0.74 * L))); c.fillStyle = g; c.fillRect(G.g0, G.h0, G.cw, G.ch); } });
    c.globalCompositeOperation = 'lighter';
    const sx = G.g1 - G.cw * 0.2;   // (the unseen set below the sill, front right)
    glow(c, near, sx, G.h0 + G.ch * 0.22, G.cw * 1.05, 0.72 * a * tk, 1.0);                                  // (strongest low at the front right)
    glow(c, mixc(near, HOT, 0.25), sx, G.h0 + G.ch * 0.16, G.cw * 0.42, 0.4 * a * tk, 0.8);                  // (its hot core just over the couch)
    glow(c, near, G.cx + G.cw * 0.18, G.h1 - G.ch * 0.06, G.cw * 1.1, (0.3 + 0.3 * P.ceil) * a * tk, 0.42);   // (the ceiling catching it)
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // (3) THE ROOM's DARK SHAPES — the lit side toward the set (right + below), the far side dark
    const SIL = rgb(v(far, 0.06 * a)), rimA = x => Math.min(1, x * a * tk), rimC = mixc(near, HOT, 0.45);   // (a rim brighter than the wall behind it)
    // the picture frame on the back wall, its glass catching a little of the light
    E.deep(0.9, () => {
      const x0 = G.cx + G.cw * 0.0, x1 = G.cx + G.cw * 0.26, y0 = G.h0 + G.ch * 0.52, y1 = G.h0 + G.ch * 0.7, fw = (x1 - x0) * 0.12;
      c.fillStyle = SIL; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgb(v(far, 0.16 * a))); g.addColorStop(1, rgb(v(near, 0.55 * L))); c.fillStyle = g; c.fillRect(x0 + fw, y0 + fw, x1 - x0 - 2 * fw, y1 - y0 - 2 * fw);
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgb(rimC, rimA(0.55)); c.lineWidth = 0.02;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1, y0); c.lineTo(x0, y0); c.stroke();   // (its lower + right edges lit from below right)
      c.globalCompositeOperation = 'source-over';
    });
    // the floor lamp (off) just past the curtain's edge
    E.deep(0.5, () => {
      const lx = G.g0 + G.cw * 0.33, top = G.h0 + G.ch * 0.46, sw0 = G.cw * 0.05, sw1 = G.cw * 0.095, sh = G.ch * 0.1;
      c.fillStyle = SIL;
      c.fillRect(lx - 0.013, G.h0 - 0.2, 0.026, top - G.h0 + 0.2);
      c.beginPath(); c.moveTo(lx - sw1, top); c.lineTo(lx + sw1, top); c.lineTo(lx + sw0, top + sh); c.lineTo(lx - sw0, top + sh); c.closePath(); c.fill();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgb(rimC, rimA(0.7)); c.lineWidth = 0.018;
      c.beginPath(); c.moveTo(lx - sw1 * 0.6, top); c.lineTo(lx + sw1, top); c.lineTo(lx + sw0, top + sh); c.stroke();   // (the shade's lit underside + right edge)
      c.strokeStyle = rgb(rimC, rimA(0.45)); c.lineWidth = 0.012; c.beginPath(); c.moveTo(lx + 0.013, G.h0 - 0.2); c.lineTo(lx + 0.013, top); c.stroke();   // (the pole's lit side)
      c.globalCompositeOperation = 'source-over';
    });
    // the EMPTY COUCH's back, low across the window — two cushions, a thin blue rim along its top (brightest toward the set)
    E.deep(0.2, () => {
      const x0 = G.g0 + G.cw * 0.18, x1 = G.g1 + G.cw * 0.06, top = G.h0 + G.ch * 0.1, bot = G.h0 - 0.3, r = G.ch * 0.05, mid = (x0 + x1) / 2;
      const path = () => { c.beginPath(); c.moveTo(x0, bot); c.lineTo(x0, top - r); c.quadraticCurveTo(x0, top, x0 + r, top);
        c.quadraticCurveTo((x0 + mid) / 2, top + r * 0.3, mid, top - r * 0.2); c.quadraticCurveTo((mid + x1) / 2, top + r * 0.3, x1 - r, top);
        c.quadraticCurveTo(x1, top, x1, top - r); c.lineTo(x1, bot); c.closePath(); };
      path(); c.fillStyle = SIL; c.fill();
      c.globalCompositeOperation = 'lighter';
      { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, rgb(near, 0)); g.addColorStop(1, rgb(near, rimA(0.13))); c.fillStyle = g; path(); c.fill(); }   // (the face toward the set, faintly)
      c.save(); c.beginPath(); c.rect(x0 - 0.1, top - r * 1.6, x1 - x0 + 0.2, r * 3); c.clip();
      { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, rgb(rimC, rimA(0.3))); g.addColorStop(1, rgb(rimC, rimA(1))); c.strokeStyle = g; c.lineWidth = 0.026; path(); c.stroke(); }
      c.restore();
      c.globalCompositeOperation = 'source-over';
    });
    // the sill's foot a touch darker (the light comes from below the sill, not through it)
    { const g = c.createLinearGradient(0, G.h0, 0, G.h0 + G.ch * 0.14); g.addColorStop(0, `rgba(2,2,8,${(0.45 * a).toFixed(3)})`); g.addColorStop(1, 'rgba(2,2,8,0)'); c.fillStyle = g; c.fillRect(G.g0, G.h0, G.cw, G.ch * 0.14); }
    // the shadow across the glow now and then (only ever a shadow)
    const sh = mo ? tvShadow(t, 11) : null;
    if (sh) { const u = sh.dir > 0 ? sh.u : 1 - sh.u; glow(c, [2, 2, 6], G.g0 + G.cw * (0.2 + 0.6 * u), G.h0 + G.ch * 0.66, G.cw * 0.26, 0.6 * sh.a * a, 1.3); }
    // the haze some nights, catching the blue (no cigarette, no one)
    const smk = smokeLevel(t);
    if (smk.haze > 0.01) { c.globalCompositeOperation = 'lighter'; const sc = mixc([120, 140, 200], near, 0.6); for (let i = 0; i < 4; i++) { const hx2 = G.g0 + G.cw * ((0.15 + 0.25 * i + (mo ? t * 0.012 : 0)) % 1.1), hy2 = G.h0 + G.ch * (0.6 + 0.12 * Math.sin(t * 0.21 + i * 1.7)); glow(c, sc, hx2, hy2, G.cw * 0.34, 0.08 * smk.haze * a * (0.35 + 0.65 * tk), 0.42); } c.globalCompositeOperation = 'source-over'; }
    c.globalAlpha = 1;
    // THE HALF-DRAWN CURTAIN over the left third, hanging from the rod, its folds dark, its inner edge catching the screen's light
    const cu = G.g0 + G.cw * 0.22;
    c.fillStyle = rgb(v(far, 0.09 * a)); c.fillRect(G.g0 - 0.1, G.h0 - 0.1, cu - G.g0 + 0.1, G.ch + 0.2);
    c.fillStyle = 'rgba(0,0,0,0.35)'; for (const f of [0.25, 0.7]) c.fillRect(G.g0 + (cu - G.g0) * f, G.h0, 0.035, G.ch);
    { const g = c.createLinearGradient(cu - 0.16, 0, cu, 0); g.addColorStop(0, rgb(near, 0)); g.addColorStop(1, rgb(near, rimA(0.6))); c.fillStyle = g; c.fillRect(cu - 0.16, G.h0, 0.16, G.ch); }
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgb(near, rimA(0.7)); c.lineWidth = 0.03; c.beginPath(); c.moveTo(cu, G.h0); c.lineTo(cu, G.h1); c.stroke(); c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(G.g0, G.h1 - 0.06, G.cw, 0.06);   // (the rod's shadow line)
  }
  /** WIN3 — THE PARTY IN THE WINDOWS (the owner): ONE room's party — the colour flooding it (pulsing on the beat), the crowd as DARK
   *  SILHOUETTES against it jumping with their arms swinging on the beat (the city's beat when the music plays, a 120 bpm of its own
   *  without), a few glow wands, the blind sliding up as the room joins (k: 0 → 1) — the edge windows light only; at a raid the lights snap
   *  off at once, the dancers scatter to the sides + the blind drops (o.cut, o.scatter s) */
  function partyRoom(E, col, k, o = {}) {
    const { c, G, t, mo, B } = E, P = o.party, sc = o.scatter || 0, cut = !!o.cut;
    // SP5 — THE DANCE CLOCK (core/harbor-dance.js): the beat the dancers follow is the BLENDED one (a song switch never snaps them), their
    // ENERGY dk winds down over a song's last bars, is 0 in the gap (they idle: sway, shift, turn to each other, a clap, a sip, a cheer as the
    // song ends) and picks up smoothly on the new song's first beats. Without music: the city's own calm beat at full energy.
    const D = life.last.dance || { bf: t * 2, dk: 1, cheer: 0, gap: 0 }, dk = mo ? D.dk : 1, ch = mo ? D.cheer : 0;
    const beatsF = P && P.beat ? D.bf : t * 2, punch = P && P.beat ? Math.max(0.5, P.beat.punch) : 0.8;
    const ph = beatsF - Math.floor(beatsF), hit = mo ? Math.pow(1 - ph, 2.2) * (0.3 + 0.7 * dk) : 0.5;
    const lightK = cut ? 0 : k * (0.78 + 0.22 * hit * punch);
    const dark = [8, 6, 16], wash = mixc(dark, col, 0.55 * lightK);
    paintBox(c, G, B, { wall: [mixc(dark, wash, 0.9), mixc(dark, wash, 0.6)], floor: [mixc(dark, wash, 0.5), mixc(dark, wash, 0.8)], side: [mixc(dark, wash, 0.6), mixc(dark, wash, 0.8)], flat: () => R(c, G.g0, G.h0, G.g1, G.h1, rgb(mixc(dark, wash, 0.8))) });
    if (lightK > 0.01) { c.globalCompositeOperation = 'lighter'; glow(c, col, G.cx, G.h0 + G.ch * 0.55, G.cw * 1.1, 0.75 * lightK, 0.9); glow(c, col, G.cx - G.cw * 0.3, G.h0 + G.ch * 0.2, G.cw * 0.6, 0.35 * lightK * (0.6 + 0.4 * hit), 0.5); c.globalCompositeOperation = 'source-over'; }
    c.globalAlpha = 1; setRim(null);   // (glow() leaves its alpha behind; the dancers are DARK silhouettes — no lamp rim: backlit by the colour)
    if (k > 0.3 || sc > 0) {
      const seed = o.seed || 0, SIL = 'rgb(6,5,12)', wc = mixc(col, [255, 255, 255], 0.6);
      // (SP5 — the owner: the half-cut EDGE windows join with one or two dancers at the cut side — the room continues past the screen's
      // edge; the full rooms get one more dancer BEHIND the group: smaller, dimmer, partly hidden — the 2.5D depth)
      const edge = !!o.edge, n = edge ? 1 + (seed % 2) : (o.n || 4);
      const dancer = (i, d, x0, dim, s0) => {
        const off = hsh(seed + i, 41) < 0.35 ? 0.5 : 0, pj = beatsF + off, u = pj - Math.floor(pj);
        const jump = mo ? Math.pow(Math.sin(Math.PI * Math.min(1, u / 0.6)), 1.4) * (u < 0.6 ? 1 : 0) * (0.6 + 0.4 * hsh(seed + i, 42)) * (0.1 + 0.9 * dk) : 0;
        const swing = mo ? Math.sin((beatsF + off) * Math.PI) * (hsh(seed + i, 43) < 0.5 ? 1 : -1) * dk : 0.5 * dk;
        const im = mo ? idleMoves(t, seed * 3 + i) : { sway: 0, shift: 0, clap: 0, sip: 0, turn: 0 }, idle = 1 - dk;
        const scat = sc > 0 ? sc * 2.2 * (x0 < G.cx ? -1 : 1) : 0, wand = hsh(seed + i, 46) < 0.4 && !edge;
        // the arms: the dance's swing at full energy; idle: hanging, a clap (both forward), a sip (one to the mouth), the cheer (both up)
        const dA = [1.2 + 0.9 * swing + 0.6 * jump, 1.2 - 0.9 * swing + 0.6 * jump], dE = 0.5;
        const iA = [0.25 + 0.12 * im.sway, 0.25 - 0.12 * im.sway], iE = [0.35, 0.35];
        if (im.clap > 0.01) { iA[0] = lerp(iA[0], 1.05, im.clap); iA[1] = lerp(iA[1], 1.05, im.clap); iE[0] = lerp(iE[0], 1.5, im.clap); iE[1] = lerp(iE[1], 1.5, im.clap); }
        if (im.sip > 0.01) { iA[1] = lerp(iA[1], 0.55, im.sip); iE[1] = lerp(iE[1], 2.3, im.sip); }
        const arms = [[lerp(iA[0], dA[0], dk) + 1.2 * ch, lerp(iE[0], dE, dk) - 0.2 * ch], [lerp(iA[1], dA[1], dk) + 1.2 * ch, lerp(iE[1], dE, dk) - 0.2 * ch]];
        const lean = 0.08 * swing + 0.05 * im.sway * idle, tilt = 0.1 * swing + 0.04 * im.shift * idle, face = 0.6 * im.turn * idle;
        c.save(); if (dim < 1) c.globalAlpha = dim;
        E.deep(d, () => figure(c, { x: x0 + scat, y: G.h0 - 0.08 + (sc > 0 ? 0 : 0.16 * jump), s: s0, col: SIL, face, lean, tilt, hair: hsh(seed + i, 47) < 0.5 ? 'bob' : 'short', hat: hsh(seed + i, 48) < 0.3 ? 'fedora' : null, dress: hsh(seed + i, 47) < 0.5,
          arms, hold: wand ? ['wand', null] : null, step: sc > 0 ? Math.sin(t * 14) : 0,
          glints: wand && !cut ? (cc, gx, gy, ss) => { cc.save(); cc.globalCompositeOperation = 'lighter'; cc.strokeStyle = rgb(wc, 0.95); cc.lineWidth = 0.035 * ss; cc.lineCap = 'round'; cc.beginPath(); cc.moveTo(gx - 0.1 * ss * swing, gy - 0.1 * ss); cc.lineTo(gx + 0.08 * ss * swing, gy + 0.14 * ss); cc.stroke(); glow(cc, wc, gx, gy + 0.02 * ss, 0.1 * ss, 0.6); cc.restore(); } : null }));
        c.restore();
      };
      if (!edge) dancer(9, 0.74, G.g0 + G.cw * (0.3 + 0.4 * hsh(seed, 49)), 0.55, 0.72);   // (the one behind: deep, small, dim, half hidden by the front row)
      for (let i = 0; i < n; i++) {
        // (an edge window: its LEFT part is past the screen's edge — the first dancer stands in the visible right part, a second further toward the cut, half off the screen)
        const d = 0.25 + 0.4 * hsh(seed + i, 44), x0 = edge ? G.g1 - G.cw * (0.22 + 0.4 * i + (hsh(seed + i, 45) - 0.5) * 0.08) : G.g0 + G.cw * (0.12 + 0.76 * ((i + 0.5) / n) + (hsh(seed + i, 45) - 0.5) * 0.1);
        dancer(i, d, x0, 1, 0.9 + 0.3 * (1 - d));
      }
    }
    // THE BLIND: a dark slab from the top covering (1 − k) of the pane, sliding up as the room joins; dropping over 1.2 s at a raid
    const cover = cut ? Math.min(1, Math.max(0, sc / 1.2)) : 1 - k;
    if (cover > 0.001) { const hem = G.h1 - G.ch * cover; c.fillStyle = 'rgb(14,12,20)'; c.fillRect(G.g0 - 0.1, hem, G.cw + 0.2, G.ch * cover + 0.1); c.fillStyle = 'rgba(0,0,0,0.35)'; for (let v = hem + 0.1; v < G.h1; v += 0.1) c.fillRect(G.g0, v, G.cw, 0.012); c.fillStyle = 'rgb(40,34,44)'; c.fillRect(G.g0 - 0.1, hem - 0.02, G.cw + 0.2, 0.04); }
  }
  /** WIN3 — THE TV OFF ON A RAID NIGHT: the room dark but for the street's faint cool light; for a while a SHADOW at the curtain's edge
   *  watches the street (only ever a shadow); dark till morning after */
  function tvDark(E) {
    const { c, G, k, t, mo, B } = E, a = k, rs = life.last.raidS;
    life.lastTv = { k: 0, off: 'raid', on: 0 };
    const dark = [6, 7, 14], amb = [40, 50, 80];
    paintBox(c, G, B, { wall: [mixc(dark, amb, 0.12 * a), mixc(dark, amb, 0.3 * a)], floor: [dark, dark], side: [dark, mixc(dark, amb, 0.15 * a)], flat: () => R(c, G.g0, G.h0, G.g1, G.h1, rgb(mixc(dark, amb, 0.15 * a))) });
    const cu = G.g0 + G.cw * 0.22;
    c.fillStyle = 'rgb(9,8,18)'; c.fillRect(G.g0 - 0.1, G.h0 - 0.1, cu - G.g0 + 0.1, G.ch + 0.2);
    if (rs != null && rs >= 0 && rs < 150) {
      // the watcher: a head + a shoulder past the curtain's edge, swaying a little, gone again
      const w = Math.min(1, rs / 2, (150 - rs) / 3), bob = mo ? Math.sin(t * 0.8) * 0.02 : 0;
      c.fillStyle = `rgba(3,3,8,${(0.9 * a * w).toFixed(3)})`;
      c.beginPath(); c.ellipse(cu + 0.16 + bob, G.h0 + G.ch * 0.62, 0.11, 0.13, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(cu - 0.05, G.h0 + G.ch * 0.5); c.quadraticCurveTo(cu + 0.2 + bob, G.h0 + G.ch * 0.52, cu + 0.36 + bob, G.h0 + G.ch * 0.42); c.lineTo(cu + 0.36 + bob, G.h0); c.lineTo(cu - 0.05, G.h0); c.closePath(); c.fill();
    }
  }
  /** THE SMOKE's cycle (seeded on the clock, not every night): a cigarette lit in the first minute of a ~4-min cycle on about a third of
   *  them — the wisps for ~70 s (on), the haze building to ~1 over the first 90 s and thinning out by the cycle's end */
  function smokeLevel(t) {
    const CYC = 240, slot = Math.floor(t / CYC), el = t - slot * CYC;
    if (life.smokeForced) return { on: 1, haze: 0.85 };   // (&force=smoke — the panel's row)
    if (hsh(slot, 15) >= 0.38) return { on: 0, haze: 0 };
    return { on: sm(2, 6, el) * (1 - sm(64, 76, el)), haze: sm(10, 90, el) * (1 - sm(120, 235, el)) };
  }
  /** the night lamp (3 am → the wake): the blind down, glowing warm from a small lamp low in the room — the speakeasy never goes dark */
  function nightLamp(E, up = 0) {
    const { c, G, k, t, mo } = E, a = k;
    const g = c.createRadialGradient(G.g0 + G.cw * 0.74, G.h0 + G.ch * 0.18, 0, G.g0 + G.cw * 0.74, G.h0 + G.ch * 0.18, G.ch * 1.1);
    const br = 0.92 + (mo ? 0.04 * Math.sin(t * 0.7) : 0);
    g.addColorStop(0, rgb([255, 206, 140], a * br)); g.addColorStop(0.45, rgb([214, 140, 84], a * 0.85)); g.addColorStop(1, rgb([96, 52, 40], a * 0.9));
    c.fillStyle = g; c.fillRect(G.g0, G.h0, G.cw, G.ch);
    // the blind's folds + its hem (the blind drawn down to `up` of the way up)
    const bv = G.h0 + G.ch * up;
    c.fillStyle = rgb([120, 70, 40], 0.3 * a); for (let v = bv + 0.18; v < G.h1; v += 0.22) c.fillRect(G.g0, v, G.cw, 0.014);
    if (up > 0.01) R(c, G.g0, bv - 0.03, G.g1, bv + 0.02, rgb([90, 50, 30], a));
  }

  // ---------------------------------------------------------------- THE SHOP (the barbershop's big window)
  function shop(c, env, fr, list, o) {
    const sw = env.shopWin; if (!sw) return;
    const [w0, w1, v0, v1] = sw, { k, day, t, mo } = o, open = fr.states.shop === 'open';
    const routine = list.find(e => e.id === 'shop-open'), mirror = list.find(e => e.id === 'mirror');
    // (C4a: the shop is a ROOM — window-rooms.js#paintShopRoom: the barber, his customer + the chair at the chair's depth, the lamp at
    // its own, the mirror door in the back wall)
    const SG = shopGlass(sw), B = boxOf(SG, env.vp), chairX = shopChairX(SG), base = v0 + 0.02, T = o.T || { day, gold: 0, night: k };
    c.save(); env.map(c); c.beginPath(); c.rect(w0, v0, w1 - w0, v1 - v0); c.clip();
    if (day > 0.01 && (routine || !open)) {
      // CLOSED (before 9, after 6): the shop dim inside (the bake is the open shop by day) — the opening brings the lights up
      const lit = routine ? sm(0.02, 0.12, routine.el / routine.len) : 0;
      c.globalAlpha = day * (1 - lit) * 0.5; R(c, w0, v0, w1, v1, 'rgb(14,12,18)'); c.globalAlpha = 1;
    }
    if (day > 0.01 && (open || routine)) {
      c.globalAlpha = day;
      // (the opening: the lamp switched on — its light at the lamp's own depth, a flicker as it catches)
      if (routine) { const p = routine.el / routine.len, L = shopLamp(SG); if (p > 0.04) deepAt(c, B, L.t, () => { c.globalCompositeOperation = 'lighter'; glow(c, [255, 226, 170], L.u, L.v - 0.08, 0.5, 0.55 * sm(0.04, 0.1, p) * (1 - sm(0.06, 0.08, p) * 0.4 * (mo ? (Math.sin(t * 40) > 0 ? 1 : 0) : 0))); c.globalCompositeOperation = 'source-over'; c.globalAlpha = day; }); }
      deepAt(c, B, SHOP_ROOM.chairT, () => {
        if (routine) shopOpening(c, routine.el / routine.len, { w0, w1, v0, v1, chairX, base, t, mo, T });
        else barberDay(c, fr, { w0, w1, v0, v1, chairX, base, t, mo, T });
      });
      c.globalAlpha = 1;
    }
    if (mirror && k > 0.01) { mirrorDoor(c, mirror.el / mirror.len, { SG, B, k, t, glow }); }
    c.restore();
    // the door's card: CLOSED by day before the opening (the bake says OPEN by day) → flipped at the opening
    if (day > 0.01 && env.card && (!open || routine)) {
      c.save(); env.map(c);
      const flip = routine ? sm(0.3, 0.36, routine.el / routine.len) : 0, [cu, cv] = env.card;
      c.globalAlpha = day;
      const wd = 0.3 * Math.abs(Math.cos(flip * Math.PI));
      R(c, cu - wd, cv - 0.02, cu + wd, cv + 0.2, 'rgb(244,240,228)');
      if (wd > 0.12) { c.save(); c.translate(cu, cv + 0.035); c.scale(1, -1); c.font = '700 11px "Chakra Petch", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.scale(wd / 0.3 / 100, 1 / 100); c.fillStyle = flip > 0.5 ? 'rgb(190,30,36)' : 'rgb(30,30,40)'; c.font = `700 ${flip > 0.5 ? 15 : 11}px "Chakra Petch", sans-serif`; c.fillText(flip > 0.5 ? 'OPEN' : 'CLOSED', 0, 0); c.restore(); }
      c.globalAlpha = 1; c.restore();
    }
  }
  /** the barbershop's day: a customer every ~8 min (in, the cape, the haircut, out), between them the barber reading in his chair */
  function barberDay(c, fr, g) {
    const CYC = 480, el = (fr.sec - (life.routines['shop-open'] || 9 * 3600) - MOMENT['shop-open'].len) + 40, n = Math.floor(el / CYC), ph = el - n * CYC;
    const { chairX, base, w0, t, mo } = g;
    if (ph < 360) {
      // the haircut: the customer walks in (≤ 14 s), sits, the cape; the barber circling the chair, snipping
      const inn = ph < 14 ? ph / 14 : 1, out = ph > 344 ? (ph - 344) / 16 : 0;
      const sit = sm(0.85, 1, inn) * (1 - sm(0, 0.25, out));
      if (sit < 0.99) { const x = inn < 1 ? lerp(w0 - 0.6, chairX + 0.1, sm(0, 0.85, inn)) : lerp(chairX + 0.1, w0 - 0.7, sm(0.25, 1, out)); figure(c, { x, y: base + 0.95, s: 0.98, legs: 0.95, step: mo ? Math.sin(t * 7) : 0, face: inn < 1 ? 1 : -1, pal: pals(n), hat: 'fedora', arms: [[0.15, 0.1], [0.15, 0.1]] }); }
      if (sit > 0.01) seated(c, chairX, base, sit, pals(n), mo ? t : 0, 1, false, g.T);
      // (WIN2: the barber right at his head — the comb in one hand, the scissors snipping at the hair in the other)
      const orbit = mo ? Math.sin(t * 0.13 + n) : 0.3, bx = chairX + 0.66 + 0.12 * orbit, snip = mo ? (Math.sin(t * 9) > 0 ? 1 : 0) : 0;
      figure(c, { x: bx, y: base + 0.95, s: 1.0, legs: 0.95, face: -1, lean: 0.08, tilt: 0.14, pal: BARBER, marks: BARBER.m, arms: [[1.45, 1.3 + 0.08 * snip], [1.25, 1.55 + 0.1 * snip]], hold: ['cloth', 'scissors'], snip });
    } else {
      // between customers: the barber reading the paper in his own chair
      seated(c, chairX, base, 1, BARBER, 0, 0, true, g.T);
    }
  }
  /** THE BARBER CHAIR (WIN2 — the owner: the customer read as a white box): the chrome column + its round footrest, the leather seat, the
   *  armrests, the headrest; then the customer — a real seated man: his shoes out at the footrest, the striped cape DRAPED over his
   *  shoulders + knees (a lit top, folds, its hem), his head + hair + face above it; reading: the barber himself with the paper */
  function seated(c, x, base, k, pal, t, cape, reading = false, T = null) {
    const y = base + 0.86, s = 0.92, rise = (1 - k) * 0.35;
    // the chair (C4a: the bake's own — window-rooms.js#barberChair in the day's tones: no step when someone sits down)
    barberChair(c, x, base, shopTones(T || { day: 1, gold: 0, night: 0 }));
    if (cape && k > 0.6) {
      // the customer's shoes at the footrest, his trousers' cuffs under the cape's hem
      c.fillStyle = 'rgb(36,30,30)'; for (const dx of [0.16, 0.42]) { c.beginPath(); c.ellipse(x + dx, base + 0.4, 0.11, 0.045, 0, 0, TAU); c.fill(); }
      c.fillStyle = pal.legs || 'rgb(50,48,56)'; c.fillRect(x + 0.06, base + 0.4, 0.46, 0.14);
      // THE CAPE (SP5 — the owner: the barber + the customer both read as white → the customer under a DEEP NAVY cape with a thin
      // pinstripe, the two opposite values): draped from the shoulders out over the knees, lit from the window (bluer at the top), its folds
      const g = c.createLinearGradient(0, y + 0.72 * s, 0, base + 0.5); g.addColorStop(0, 'rgb(58,70,124)'); g.addColorStop(0.5, 'rgb(38,46,92)'); g.addColorStop(1, 'rgb(22,28,60)');
      c.fillStyle = g; c.beginPath(); c.moveTo(x - 0.34, y + 0.66 * s); c.quadraticCurveTo(x - 0.5, y + 0.2, x - 0.44, base + 0.52); c.lineTo(x + 0.64, base + 0.52); c.quadraticCurveTo(x + 0.62, y + 0.2, x + 0.38, y + 0.66 * s); c.closePath(); c.fill();
      c.save(); c.beginPath(); c.moveTo(x - 0.34, y + 0.66 * s); c.quadraticCurveTo(x - 0.5, y + 0.2, x - 0.44, base + 0.52); c.lineTo(x + 0.64, base + 0.52); c.quadraticCurveTo(x + 0.62, y + 0.2, x + 0.38, y + 0.66 * s); c.closePath(); c.clip();
      c.strokeStyle = 'rgba(196,206,236,0.42)'; c.lineWidth = 0.011; c.beginPath(); for (let u = -0.4; u <= 0.6; u += 0.085) { c.moveTo(x + u, y + 0.7 * s); c.lineTo(x + u * 1.22 + 0.04, base + 0.5); } c.stroke();   // (the pinstripe)
      c.strokeStyle = 'rgba(10,14,40,0.5)'; c.lineWidth = 0.025; c.beginPath(); for (const u of [-0.18, 0.02, 0.24]) { c.moveTo(x + u, y + 0.5 * s); c.quadraticCurveTo(x + u * 1.4, y - 0.1, x + u * 1.7, base + 0.56); } c.stroke();   // (the folds)
      c.restore();
      // his head + shoulders above the cape (the shoulders in the cape's navy: the kit's torso), his face front, his hair
      figure(c, { x: x + 0.02, y: y + rise, s, face: 0.2, pal: { ...pal, body: 'rgb(44,52,100)', arm: 'rgb(44,52,100)' }, arms: [[0.05, 0.05], [0.05, 0.05]], hair: 'short', tilt: t ? 0.05 * Math.sin(t * 0.8) : 0 });
      return;
    }
    figure(c, { x: x + 0.02, y: y + rise, s, face: reading ? 0 : 1, pal, marks: pal.m || null, arms: reading ? [[0.5, 1.7], [0.5, 1.7]] : [[0.1, 0.9], [0.1, 0.9]], hold: reading ? ['paper', null] : null, tilt: t ? 0.05 * Math.sin(t * 0.8) : 0 });
  }
  /** THE OPENING (~9 am): the lamp on, the barber in from the back → out to the door (the card flips) → back to the chair; the first
   *  customer in; the cape; the first snips */
  function shopOpening(c, p, g) {
    const { chairX, base, w0, w1, t, mo } = g;
    const walk = mo ? Math.sin(t * 7) : 0;
    let bx = null, face = -1;
    if (p > 0.08 && p < 0.3) { bx = lerp(w1 + 0.3, w0 - 0.6, sm(0.08, 0.3, p)); face = -1; }
    else if (p >= 0.36 && p < 0.5) { bx = lerp(w0 - 0.6, chairX + 0.7, sm(0.36, 0.5, p)); face = 1; }
    else if (p >= 0.5) { bx = chairX + 0.7; face = -1; }
    const cust = p >= 0.48 ? sm(0.48, 0.66, p) : 0;
    if (cust > 0 && cust < 0.85) figure(c, { x: lerp(w0 - 0.6, chairX + 0.1, cust / 0.85), y: base + 0.95, s: 0.98, legs: 0.95, step: walk, face: 1, pal: pals(0), hat: 'fedora' });
    if (cust >= 0.85) seated(c, chairX, base, sm(0.85, 1, cust), pals(0), mo ? t : 0, p > 0.72, false, g.T);
    if (bx != null) { const working = p > 0.74, snip = working && mo ? (Math.sin(t * 9) > 0 ? 1 : 0) : 0; figure(c, { x: bx, y: base + 0.95, s: 1, legs: 0.95, step: p < 0.5 ? walk : 0, face, pal: BARBER, arms: working ? [[0.3, 1.6 + 0.08 * snip], [0.2, 1.3]] : p > 0.66 ? [[1.2, 0.8], [1.2, 0.8]] : [[0.12, 0.1], [0.12, 0.1]], hold: working ? [null, 'scissors'] : null, snip }); }
  }
  /** THE HIDDEN MIRROR DOOR: the mirror right of the chair swings in on its hinge — warm amber light, the bar's bottle shelves
   *  glowing, a silhouette with a glass, the light spilling across the closed shop — then it swings shut */
  function mirrorDoor(c, p, g) {
    const { SG, B, k, t } = g;
    const o = sm(0, 0.2, p) * (1 - sm(0.76, 0.95, p));
    if (o <= 0.004) return;
    // (C4a: the door is the third mirror panel IN THE BACK WALL — drawn at depth 1 in the shop's box: window-rooms.js#shopMirrorDoor)
    const [m0, m1, mv0, mv1] = shopMirrorDoor(SG);
    // (C4b — the owner: "the mirror door's opening is a little CHOPPY": the leaf was painted a flat dark board over the whole doorway the
    // instant the swing began — a one-frame jump from the lit mirror the room's bake shows there. Now the bar beyond is painted only in the
    // GAP the leaf uncovers (from its free edge to the jamb) and the leaf fades in as it turns — the first frames change nothing)
    const th = o * 1.25, wv = (m1 - m0) * Math.cos(th), ins = 0.12 * Math.sin(th), gap0 = m0 + wv, leafA = sm(0, 0.35, o);
    c.globalAlpha = k;
    deepAt(c, B, 1, () => {
      c.save(); c.beginPath(); c.rect(gap0, mv0, m1 - gap0, mv1 - mv0); c.clip();
      // the bar beyond: amber, the shelves of bottles glowing, a couple with their glasses
      const bg = c.createLinearGradient(0, mv0, 0, mv1); bg.addColorStop(0, 'rgb(255,170,80)'); bg.addColorStop(0.6, 'rgb(220,120,52)'); bg.addColorStop(1, 'rgb(120,56,28)');
      c.fillStyle = bg; c.fillRect(m0, mv0, m1 - m0, mv1 - mv0);
      const r = rngFrom(57), bc = [[255, 196, 90], [120, 220, 140], [255, 90, 80], [255, 240, 190], [140, 190, 255]];
      for (const v of [mv0 + 0.62, mv0 + 0.9, mv0 + 1.16]) { R(c, m0, v - 0.03, m1, v, 'rgb(90,44,22)'); for (let u = m0 + 0.04; u < m1 - 0.04; u += 0.08 + r() * 0.04) { const cc = bc[Math.floor(r() * bc.length)], hh = 0.1 + r() * 0.08; R(c, u, v, u + 0.045, v + hh, rgb(cc)); } }
      const sway = Math.sin(t * 1.6) * 0.05;
      // (SP4: lit by the bar's amber — a dark suit, a red dress)
      c.save(); c.beginPath(); c.rect(m0, mv0, m1 - m0, mv1 - mv0); c.clip();
      figure(c, { x: m0 + 0.5, y: mv0 + 0.32, s: 0.86, lean: sway, face: -1, hat: 'fedora', arms: [[0.15, 0.3], [0.4, 1.9]], hold: [null, 'glass'], pal: litPal(whoM(1), RIM_COL.bar, 1), lit: { side: 0, a: 0.55 }, marks: whoM(1).m, rim: { col: RIM_COL.bar, a: 0.5, side: 0, w: 0.026 } });
      figure(c, { x: m0 + 0.14, y: mv0 + 0.3, s: 0.76, lean: -sway, face: 1, hat: 'cloche', hair: 'bob', dress: true, arms: [[0.2, 0.5], [0.3, 0.4]], pal: litPal(whoW(0), RIM_COL.bar, 1), lit: { side: 0, a: 0.55 }, marks: whoW(0).m, rim: { col: RIM_COL.bar, a: 0.5, side: 0, w: 0.026 } });
      c.restore();
      c.restore();
      // the mirror itself, swung in on its left hinge (foreshortened: narrower, its far edge shorter), catching the light — faded in
      c.globalAlpha = k * leafA;
      c.fillStyle = 'rgb(46,40,52)'; c.beginPath(); c.moveTo(m0, mv0); c.lineTo(m0 + wv, mv0 + ins); c.lineTo(m0 + wv, mv1 - ins); c.lineTo(m0, mv1); c.closePath(); c.fill();
      c.fillStyle = `rgba(255,214,150,${(0.35 * o).toFixed(3)})`; c.beginPath(); c.moveTo(m0, mv0); c.lineTo(m0 + wv, mv0 + ins); c.lineTo(m0 + wv, mv1 - ins); c.lineTo(m0, mv1); c.closePath(); c.fill();
      // the doorway's lit edge (its frame catching the bar's light)
      c.globalAlpha = k;
      c.fillStyle = `rgba(255,200,130,${(0.8 * o).toFixed(3)})`; c.fillRect(m1 - 0.03, mv0, 0.03, mv1 - mv0);
    });
    // its light LANDS in the dark shop (C4a: real light — a pool across the tiles from the doorway, the back wall warmed round it; the
    // shop's own corners stay as they are) — no blobs over the glass
    lampFall(c, SG, B, { u: (m0 + m1) / 2, v: (mv0 + mv1) / 2, t: 0.92 }, [255, 176, 96], 1.6 * o * k, { reach: 1.25, corner: 0 });
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- THE TAPS
  function tapPaint(E, tap) {
    const { c, G, t, k } = E, el = t - tap.at, p = clamp01(el / 3.2);
    if (tap.kind === 'twitch') {
      // a curtain twitches: its edge pulled aside a hand's width and let go (the room's light through the gap)
      const o = sm(0, 0.12, p) * (1 - sm(0.45, 0.8, p)) * (1 + 0.15 * Math.sin(el * 14) * (1 - p)), gx = G.g0 + G.cw * 0.5;
      c.fillStyle = k > 0.3 ? `rgba(255,214,150,${(0.85 * k).toFixed(2)})` : 'rgba(20,16,22,0.7)'; c.beginPath(); c.moveTo(gx, G.h1); c.lineTo(gx + 0.36 * o, G.h1); c.quadraticCurveTo(gx + 0.3 * o, G.mid, gx, G.h0); c.fill();
      if (o > 0.4) { c.fillStyle = k > 0.3 ? SIL : 'rgb(60,50,56)'; c.beginPath(); c.arc(gx + 0.16 * o, G.mid + 0.32, 0.13, 0, TAU); c.fill(); }
    } else if (tap.kind === 'salute') {
      // the patron in the hat turns + raises his glass to you
      return void patrons(E, { p: 0.12 + 0.6 * sm(0, 0.3, p) * (1 - sm(0.7, 1, p)), solo: true });
    } else if (tap.kind === 'lamp') {
      // the back room's lamp knocked: it swings, the pool of light swaying on the table
      const sw = Math.sin(el * 5) * 0.25 * (1 - p), tx = G.cx + sw, ty = G.h0 + G.ch * 0.22;
      c.globalCompositeOperation = 'lighter'; glow(c, [255, 214, 140], tx, ty + 0.2, 0.7, 0.3 * k * (1 - p)); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    } else peekPaint(E, Math.min(1, 0.15 + p * 0.85), tap.at * 7);
  }
  function peekPaint(E, p, seed = 0) {
    const { c, G, k, w } = E, night = k > 0.3;
    const o = sm(0, 0.18, p) * (1 - sm(0.82, 1, p)), look = Math.sin(sm(0.22, 0.8, p) * Math.PI * 2);
    const lk = night ? litP(E, w.id === 'jazz' ? whoM(2) : whoW(1)) : { col: 'rgb(70,58,60)' };   // (SP4: lit by the room)
    if (w.id === 'jazz') {
      // under the jazz room's shade: someone ducks under its hem and looks out, left then right (the shade's hem lifted over the head)
      const sv = G.h0 + G.ch * 0.26, x = G.g0 + G.cw * (0.36 + 0.28 * hsh(seed | 0, 9)), rise = 0.42 * o;
      c.save(); c.beginPath(); c.rect(G.g0, G.h0, G.cw, sv - G.h0 + 0.1 * o); c.clip();
      E.deep(0.08, () => figure(c, { x, y: sv - 0.86 + rise, s: 0.95, face: look, tilt: 0.1, ...lk, arms: [[2.4, 0.5], [0.3, 0.3]], hair: 'short' }));
      c.restore();
      c.fillStyle = 'rgba(110,60,30,0.85)'; c.beginPath(); c.moveTo(x - 0.34, sv); c.quadraticCurveTo(x, sv + 0.26 * o, x + 0.34, sv); c.lineTo(x + 0.34, sv + 0.05); c.quadraticCurveTo(x, sv + 0.3 * o, x - 0.34, sv + 0.05); c.fill();
      return;
    }
    // behind a curtain: the body hidden by the curtain pulled half across, the HEAD leaning out past its edge (turning to look down the
    // street, left then right), the hand gripping the edge
    const side = hsh(seed | 0, 9) < 0.5 ? -1 : 1, open = -side, x0 = side < 0 ? G.g0 : G.g1;
    const xe = x0 + open * (0.3 + 0.32 * o), y = G.h0 + 0.02;
    // (WIN2: in from the room's depth to the curtain's edge — bigger as she comes)
    E.deep(lerp(0.8, 0.08, o), () => figure(c, { x: lerp(G.cx, xe - open * 0.14, o), y, s: 1.05, face: Math.max(-1, Math.min(1, look + open * 0.55 * (1 - Math.abs(look)))), hair: 'short', lean: open * 0.24 * o, tilt: -0.12 * look, ...lk, arms: [[0.2, 0.3], [0.2, 0.3]] }));
    const cc = night ? 'rgb(130,36,40)' : rgb(tri(E.T, [140, 40, 44], [150, 50, 44], [20, 10, 18]));
    c.fillStyle = cc; c.beginPath(); c.moveTo(x0, G.h1); c.lineTo(xe, G.h1); c.quadraticCurveTo(xe - open * 0.06, G.mid, xe + open * 0.04, G.h0); c.lineTo(x0, G.h0); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.25)'; for (let u = 0.08; u < Math.abs(xe - x0) - 0.04; u += 0.11) c.fillRect(x0 + open * u, G.h0, 0.03, G.ch);
    // (the hand gripping the curtain's edge: her lit skin at night, the silhouette's colour by day — HOTFIX: this read an undefined `col`
    // since SP4 and threw every frame a curtain window peeked, which stopped the city's loop)
    c.fillStyle = lk.pal ? lk.pal.skin : lk.col; c.beginPath(); c.arc(xe + open * 0.02, G.h0 + G.ch * 0.52, 0.065, 0, TAU); c.fill();
  }

  // ---------------------------------------------------------------- THE MOMENTS' PAINTERS (PAINT[id](E, el, len, inst); the holidays' in window-holiday.js)
  const PAINT = {
    // 9a — A FAN ON A HOT DAY: a little desk fan on the sill (its round cage, the stand, the blades a soft blur turning), the curtain's hem
    // stirring in its breeze; the room's own light behind it (a silhouette at night, a dark shape on the daylit glass)
    fan(E, el, len) {
      const { c, G, k, t, mo } = E, p = el / len, a = sm(0, 0.06, p) * (1 - sm(0.94, 1, p));
      if (a <= 0.01) return;
      const r = Math.min(G.cw * 0.2, G.ch * 0.22), x = G.g0 + G.cw * 0.7, base = G.h0 + 0.02, cy = base + r * 1.75;   // (y runs UP here: h0 the sill)
      const body = k > 0.4 ? 'rgb(18,14,18)' : 'rgb(44,46,52)', rim = k > 0.4 ? 'rgba(255,214,150,0.5)' : 'rgba(220,226,236,0.7)';
      c.save(); c.globalAlpha = a;
      // the curtain's hem stirring (a soft pale fold at the window's left edge, swaying in the fan's breeze)
      const sw = mo ? Math.sin(t * 3.1) * 0.05 + Math.sin(t * 7.3) * 0.02 : 0;
      c.fillStyle = k > 0.4 ? 'rgba(255,220,170,0.18)' : 'rgba(236,230,214,0.5)'; c.beginPath(); c.moveTo(G.g0, G.h1); c.lineTo(G.g0 + G.cw * 0.16, G.h1); c.quadraticCurveTo(G.g0 + G.cw * (0.2 + sw), G.h0 + G.ch * 0.5, G.g0 + G.cw * (0.14 + sw * 1.6), G.h0 + G.ch * 0.08); c.lineTo(G.g0, G.h0 + G.ch * 0.08); c.closePath(); c.fill();
      // the stand + the base
      c.fillStyle = body; c.fillRect(x - r * 0.08, base, r * 0.16, cy - base - r * 0.6); c.fillRect(x - r * 0.55, base, r * 1.1, r * 0.18);
      // the blades: a soft disc of blur + three faint blades turning
      c.fillStyle = k > 0.4 ? 'rgba(30,24,28,0.55)' : 'rgba(70,74,84,0.45)'; c.beginPath(); c.arc(x, cy, r * 0.92, 0, Math.PI * 2); c.fill();
      const ang = mo ? t * 19 : 0.4; c.fillStyle = body;
      for (let i = 0; i < 3; i++) { const a0 = ang + i * 2.094; c.beginPath(); c.ellipse(x + Math.cos(a0) * r * 0.45, cy + Math.sin(a0) * r * 0.45, r * 0.42, r * 0.16, a0, 0, Math.PI * 2); c.globalAlpha = a * 0.5; c.fill(); }
      c.globalAlpha = a;
      // the cage: its rim catching the light + the hub
      c.strokeStyle = rim; c.lineWidth = Math.max(0.02, r * 0.07); c.beginPath(); c.arc(x, cy, r, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = k > 0.4 ? 'rgba(255,214,150,0.2)' : 'rgba(220,226,236,0.3)'; c.lineWidth = Math.max(0.01, r * 0.03);
      c.beginPath(); for (let i = 0; i < 6; i++) { const a0 = i * Math.PI / 3; c.moveTo(x, cy); c.lineTo(x + Math.cos(a0) * r, cy + Math.sin(a0) * r); } c.stroke();
      c.fillStyle = body; c.beginPath(); c.arc(x, cy, r * 0.2, 0, Math.PI * 2); c.fill();
      c.restore(); c.globalAlpha = 1;
    },
    wake(E, el, len) {
      const { c, G, k, t, mo } = E, p = el / len, day = 1 - k;
      // the room: the lamp room at night (the morning before the sun), the dark glass by day
      if (k > 0.01) { c.globalAlpha = k; paintLampRoom(c, G, 1, E.B); c.fillStyle = 'rgba(236,240,255,0.14)'; c.fillRect(G.g0, G.h0, G.cw, G.ch); c.globalAlpha = 1; }   // (SP2: the dawn's lamp a little paler)
      if (day > 0.01) { c.globalAlpha = day; R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(40,32,38)'); c.globalAlpha = 1; }
      const night = k > 0.4, lk = night ? litP(E, NIGHTGOWN) : { pal: DAY_PALS[0] };   // (SP4: lit by her lamp — a pale nightgown)
      // the figure: in from the back (0.18), THE STRETCH (arms up in a V, a yawn, side to side), a look out at the morning, away
      // (POLISH 5: the window box is gone — no watering can, no raised sash)
      // (WIN2 — ACT BIG: she walks in from the back of the room (small) to the window (big), a BIG stretch, a look out, back the same way)
      const inx = sm(0.17, 0.32, p), outx = sm(0.84, 0.97, p), x = G.g0 + G.cw * (0.92 - 0.42 * inx + 0.5 * outx), d = lerp(0.85, 0.2, inx * (1 - outx));
      const st = sm(0.34, 0.42, p) * (1 - sm(0.54, 0.6, p)), sway = mo ? Math.sin(el * 2.2) * st : 0, stepW = mo && (inx < 0.99 || outx > 0.01) ? Math.sin(el * 6.5) : 0;
      const look = sm(0.6, 0.66, p) * (1 - sm(0.78, 0.84, p));
      if (inx > 0.01 && outx < 0.99) {
        const arms = st > 0.02 ? [[0.2 + 2.9 * st, 0.1], [0.2 + 2.9 * st, 0.1]] : look > 0.02 ? [[0.12, 0.15], [0.3 + 0.2 * look, 0.25]] : [[0.12 + 0.08 * stepW, 0.15], [0.12 - 0.08 * stepW, 0.15]];
        E.deep(d, () => figure(c, { x, y: G.h0 + 0.02 - 0.08 * st, s: 1.08, lean: 0.14 * sway + 0.08 * look, tilt: -0.35 * st, face: look, arms, hair: 'bun', ...lk }));
      }
      // the blind: down until the wake, rolled up in its first seconds
      const up = sm(0.02, 0.16, p), bv = lerp(G.h0, G.h1, up);
      if (up < 0.995) {
        if (k > 0.01) { c.save(); c.beginPath(); c.rect(G.g0, bv, G.cw, G.h1 - bv); c.clip(); nightLamp(E, 0); c.restore(); }
        if (day > 0.01) { c.globalAlpha = day; R(c, G.g0, bv, G.g1, G.h1, rgb(tri(E.T, [232, 220, 192], [240, 196, 150], [60, 50, 50]))); c.globalAlpha = 1; }
        R(c, G.g0, bv, G.g1, bv + 0.05, 'rgb(90,60,40)'); R(c, G.cx - 0.03, bv - 0.1, G.cx + 0.03, bv, E.frameC);
      }
    },
    'lights-out'(E, el, len) {
      const { c, G, k } = E, p = el / len;
      if (k < 0.01) return;
      const lamp = 1 - sm(0.24, 0.27, p), tvOn = sm(0.36, 0.56, p);
      c.globalAlpha = k;
      if (lamp > 0.01) { bossShade(E, { glow: 'lamp', signal: life.last.boss ? life.last.boss.signal : 0 }); if (lamp < 1) { c.globalAlpha = k * (1 - lamp); bossShade(E, { glow: 'dark' }); } if (tvOn > 0) { c.globalAlpha = k * tvOn; tvRoom(E, tvOn); } }   // (SP5: the warm shade dims, then the set comes on behind the curtain)
      else tvRoom(E, tvOn * (0.6 + 0.4 * ((E.t * 9) % 1 > 0.3 ? 1 : 0.4) * (1 - sm(0.5, 0.56, p)) + 0.4 * sm(0.5, 0.56, p)));
      c.globalAlpha = 1;
    },
    bartender(E, el, len) {
      const { c, G, k } = E, p = el / len, day = 1 - k;
      // (an evening already dark — winter: the routine runs over the lit bar; by day the half-drawn shade + the lights one by one)
      const shade = sm(0.02, 0.12, p), lit = sm(0.14, 0.46, p);
      if (day > 0.01) { c.globalAlpha = day; barAfternoon({ ...E, arrive: sm(0.03, 0.16, p) }, shade, lit); c.globalAlpha = 1; }
      if (k > 0.01) { c.globalAlpha = k; paintBar(c, G, Math.max(0.2, lit), 0, E.B); bartender({ ...E, arrive: sm(0.03, 0.16, p) }, 'night', lit); c.globalAlpha = 1; }
    },
    dance(E, el, len, inst) {
      const { c, G, kl, mo } = E, p = el / len, dir = hsh(inst.n, 2) < 0.5 ? 1 : -1, sv = G.h0 + G.ch * 0.26;
      const x = lerp(dir > 0 ? G.g0 - 0.9 : G.g1 + 0.9, dir > 0 ? G.g1 + 0.9 : G.g0 - 0.9, p);
      const spin = sm(0.38, 0.5, p) * (1 - sm(0.56, 0.68, p)), sway = mo ? Math.sin(el * 4.2) : 0, ph = mo ? Math.sin(el * 8.4) : 0;
      c.save(); c.globalAlpha = kl;
      for (const pass of ['shade', 'legs']) {
        c.save(); c.beginPath(); if (pass === 'shade') c.rect(G.g0, sv, G.cw, G.h1 - sv); else c.rect(G.g0, G.h0, G.cw, sv - G.h0); c.clip();
        const col = pass === 'shade' ? SHADOW : LEGS_SH, s = 1.12, y = G.h0 + 0.46;
        // HIM (a fedora, his arm round her / up for her twirl) · HER (the bob, the dress flaring as she spins)
        E.deep(0.4, () => {
        figure(c, { rim: null, x: x - dir * 0.26, y, s, legs: 0.5, step: ph, lean: dir * 0.08 * sway, face: dir, hat: 'fedora', col, arms: dir > 0 ? [[0.3, 0.5], [0.9 + 1.6 * spin, 0.5 - 0.4 * spin]] : [[0.9 + 1.6 * spin, 0.5 - 0.4 * spin], [0.3, 0.5]] });
        figure(c, { rim: null, x: x + dir * (0.24 + 0.08 * spin), y: y - 0.02, s: s * 0.92, legs: 0.48, step: -ph, lean: -dir * 0.1 * sway, face: spin > 0.5 ? dir : -dir, hair: 'bob', dress: true, skirt: 0.3 + 0.7 * spin, col, arms: dir > 0 ? [[0.9 + 1.8 * spin, 0.6], [0.4, 0.3]] : [[0.4, 0.3], [0.9 + 1.8 * spin, 0.6]] });
        });
        c.restore();
      }
      c.restore(); c.globalAlpha = 1;
    },
    toast(E, el, len) { const { c, kl } = E; c.globalAlpha = kl; patrons(E, { p: el / len }); c.globalAlpha = 1; },
    sax() { /* (drawn by saxPlayer with the solo) */ },
    cat(E, el, len, inst) {
      const { c, G, kl, k, t, mo, w } = E, p = el / len;
      const night = k > 0.3, a = night ? Math.max(0.2, kl) : 1, col = night ? (life.last.states.apartment === 'tv' && w.id === 'apartment' ? SIL_TV : 'rgb(16,8,8)') : 'rgb(30,26,30)';
      const x = w.edge ? G.g0 + G.cw * 0.74 : G.g0 + G.cw * 0.66, y = G.h0 + 0.03;
      const tapped = life.catTap >= 0 && t - life.catTap < 0.9 ? (t - life.catTap) / 0.9 : life.catTap >= 0 && t - life.catTap < len ? 1.01 : -1;
      if (tapped > 1) return;
      const up = sm(0, 0.07, p), down = tapped >= 0 ? tapped : sm(0.9, 0.98, p);
      if (up >= 1 && down <= 0) { const fl = mo ? Math.pow(clamp01(Math.sin(el * 2.6 + inst.n) * 1.6 - 0.6), 2) : 0; c.globalAlpha = a; cat(c, x, y, 1.12, { pose: 0, flick: fl, dir: -1, look: mo ? Math.sin(el * 0.5) : 0, col }); c.globalAlpha = 1; return; }
      // the leap up (an arc from below the sill) / the hop down (off the back)
      const q = up < 1 ? up : down, j = up < 1 ? 1 - up : down;
      c.globalAlpha = a; cat(c, x + (up < 1 ? 0.4 * j : -0.5 * j), y - 0.7 * j * j + (up < 1 ? 0.15 * Math.sin(Math.PI * q) : 0.25 * Math.sin(Math.PI * j)), 1.12, { pose: j > 0.15 ? 1 : 0, dir: up < 1 ? -1 : 1, col }); c.globalAlpha = 1;
    },
    peek(E, el, len, inst) { const { c, kl, k } = E; c.globalAlpha = k > 0.3 ? kl : 1; peekPaint(E, el / len, inst.n); c.globalAlpha = 1; },
    tango(E, el, len) {
      // THE TANGO (legendary): a top hat + a flapper dress, in every window in turn (TANGO_PATH: the top floor left → right, then the
      // bar floor right → left), each pass with its own figure — the stride, the turn, THE DIP, the kick
      const { c, G, w, kl, mo } = E, i = TANGO_PATH.indexOf(w.id), slot = len / TANGO_PATH.length, e = el - i * slot;
      if (i < 0 || e < 0 || e > slot) return;
      const p = e / slot, dir = i < 3 ? 1 : -1, jazz = w.id === 'jazz', sv = G.h0 + G.ch * 0.26;
      const x = lerp(dir > 0 ? G.g0 - 0.8 : G.g1 + 0.8, dir > 0 ? G.g1 + 0.8 : G.g0 - 0.8, p);
      const move = ['stride', 'turn', 'dip', 'kick', 'dip', 'turn'][i], m = sm(0.36, 0.48, p) * (1 - sm(0.56, 0.68, p));
      const step = mo ? Math.sin(e * 6) : 0, s = 0.98, y = G.h0 + 0.4;
      const passes = jazz ? ['shade', 'legs'] : ['clear'];
      c.save(); c.globalAlpha = Math.max(0.35, kl);
      for (const pass of passes) {
        c.save();
        if (pass !== 'clear') { c.beginPath(); if (pass === 'shade') c.rect(G.g0, sv, G.cw, G.h1 - sv); else c.rect(G.g0, G.h0, G.cw, sv - G.h0); c.clip(); }
        const col = pass === 'shade' ? SHADOW : pass === 'legs' ? LEGS_SH : SIL;
        // (SP4: through a lit room they're LIT — his black tails + white front, her red dress + pearls; on the jazz shade a shadow)
        const him = pass === 'clear' ? litP(E, TANGO_HIM) : { col }, her = pass === 'clear' ? litP(E, whoW(0)) : { col };
        const dip = move === 'dip' ? m : 0, kick = move === 'kick' ? m : 0, turn = move === 'turn' ? m : 0;
        // him: the top hat, the tails, his arm out with her hand (the tango's line), leaning over her in the dip
        E.deep(0.45, () => {
        if (pass === 'clear') { floorShadow(c, x - dir * 0.24, y - 0.44, s, 0.28); floorShadow(c, x + dir * 0.26, y - 0.46, s * 0.93, 0.26); }   // (WIN: their shadows on the floor)
        figures(c, [{ rim: pass === 'clear' ? undefined : null, x: x - dir * 0.24, y, s, legs: 0.48, step: step * (1 - dip), lean: dir * (0.12 + 0.28 * dip), face: dir, hat: 'top', tails: true, ...him, arms: dir > 0 ? [[0.2, 0.4], [1.5 - 0.4 * dip, 0.1]] : [[1.5 - 0.4 * dip, 0.1], [0.2, 0.4]] },
        // her: the cloche + its feather, the bob, the fringed dress — bent back in the dip, a leg up in the kick, flaring in the turn
        { rim: pass === 'clear' ? undefined : null, x: x + dir * (0.26 + 0.1 * dip), y: y - 0.04 - 0.12 * dip, s: s * 0.93, legs: 0.46 + 0.1 * kick, step: kick ? -1.6 * kick : -step, lean: -dir * (0.1 + 0.95 * dip), face: -dir, hat: 'cloche', hair: 'bob', dress: true, skirt: 0.2 + 0.8 * Math.max(turn, kick), ...her, arms: dir > 0 ? [[1.45 - 0.3 * dip, 0.1], [0.6 + 1.6 * dip, 0.8]] : [[0.6 + 1.6 * dip, 0.8], [1.45 - 0.3 * dip, 0.1]] }]);
        });
        c.restore();
      }
      c.restore(); c.globalAlpha = 1;
    },
    mirror() { /* (drawn by shop: mirrorDoor) */ },
    // WIN2 — THE EYES IN THE HAZE (the owner's add-on): a dark room full of slow drifting haze lit faintly from below by an ember-red
    // glow, and just a pair of big red glowing eyes watching the street — blinking rarely (slow, deliberate), drifting a little,
    // narrowing now + then; no body, no face. Readable unzoomed: two red glows ~3 pt wide with halos in a black pane
    eyes(E, el, len, inst) {
      const { c, G, k, t, mo } = E, p = el / len, a = sm(0, 0.04, p) * (1 - sm(0.96, 1, p));
      if (a <= 0.01 || k < 0.05) return;
      const A = a * clamp01(k * 3), seed = (inst && inst.n) | 0;   // (the eyes burn at full strength in any lit night; only the blackout takes them)
      c.save(); c.globalAlpha = A;
      R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(6,5,8)');
      c.globalCompositeOperation = 'lighter';
      const emb = mo ? 0.8 + 0.2 * Math.sin(t * 0.7) * Math.sin(t * 0.23) : 0.9;
      glow(c, [150, 30, 20], G.cx + 0.1, G.h0 - 0.2, G.cw * 0.95, 0.42 * emb * A, 0.5);
      for (let i = 0; i < 5; i++) { const u = mo ? (t * 0.028 + i * 0.2) % 1 : i * 0.2 + 0.1, hx = G.g0 - 0.3 + (G.cw + 0.6) * u, hy = G.h0 + G.ch * (0.25 + 0.5 * ((i * 0.37 + (mo ? Math.sin(t * 0.09 + i) * 0.1 : 0) + 1) % 1)); glow(c, mixc([96, 84, 96], [160, 60, 40], 0.3 * emb), hx, hy, G.cw * 0.42, 0.09 * A * Math.sin(Math.PI * u), 0.6); }
      // THE EYES: a slow blink every 11–20 s, a narrowing for ~2 s now and then, a slow drift
      const per = 11 + 9 * hsh(seed, 3), ph = (t + hsh(seed, 4) * per) % per, bl = mo && ph < 0.7 ? Math.sin(ph / 0.7 * Math.PI) : 0;
      const nph = (t * 0.03 + hsh(seed, 5)) % 1, nar = mo ? sm(0.4, 0.46, nph) * (1 - sm(0.52, 0.58, nph)) : 0;
      const ex = G.cx + (mo ? Math.sin(t * 0.17 + seed) * 0.12 : 0), ey = G.h0 + G.ch * (0.6 + (mo ? Math.sin(t * 0.11) * 0.03 : 0)), open = (1 - bl) * (1 - 0.55 * nar), rx = 0.21, ry = 0.14 * open + 0.012;
      for (const s of [-1, 1]) { const x = ex + s * 0.38; glow(c, [255, 40, 30], x, ey, 0.75, 0.55 * A * (0.3 + 0.7 * open)); c.fillStyle = rgb([255, 70, 60], A); c.beginPath(); c.ellipse(x, ey, rx, ry, 0, 0, TAU); c.fill(); c.fillStyle = rgb([255, 220, 200], 0.9 * A * open); c.beginPath(); c.ellipse(x, ey, rx * 0.45, ry * 0.5, 0, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
      c.restore(); c.globalAlpha = 1;
    },
    // WIN — COUNTING THE CASH (the owner): a CLOSE-UP in the back room — the bootlegger's take under the green banker's lamp: a man in
    // shirtsleeves + braces, head + shoulders + hands filling the pane, banded stacks + a loose heap, bills peeled off one by one into
    // the stacks, a thumb licked now and then, a glance over his shoulder; at the end a shadow passes the door and it all goes in the
    // bag. Late on the bootleggers' nights (core: boot), never on a raid night (the cash is gone before the police come)
    // WIN3 — COUNTING THE CASH, THE CLOSE-UP ONLY (the owner: the table-wide opening read like a poker table, "almost unviewable"): from
    // the first frame the man — head, shoulders, hands — counting under the green banker's lamp at the glass; NATURAL HANDS on a real
    // rhythm: the left holds the stack, the right thumb flicks bills off it one at a time onto the counted pile, a lick of the thumb now
    // and then, the pile squared up + tapped on the table, a band snapped on, the banded brick set aside; eased, never robotic. Late on
    // the bootleggers' nights (core: boot), never on a raid night. At the end the lamp clicks off.
    cash(E, el, len) {
      const { c, G, kl, k, t, mo, B } = E, p = el / len, a = sm(0, 0.05, p) * (1 - sm(0.97, 1, p));
      if (a <= 0.01 || k < 0.05) return;
      const al = a * Math.max(0.5, kl);
      c.save(); c.globalAlpha = al;
      paintBox(c, G, B, { wall: [[22, 20, 16], [34, 30, 22]], floor: [[14, 11, 9], [20, 16, 12]], side: [[18, 15, 11], [28, 23, 17]], flat: () => R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(26,21,16)') });
      const GREEN = [96, 220, 150], PALE = [214, 248, 206], SKIN = [214, 172, 140], lx = G.g0 + G.cw * 0.2, ly = G.h0 + G.ch * 0.9;
      const out = sm(0.955, 0.985, p), lampK = (1 - out) * (mo ? 0.95 + 0.05 * Math.sin(t * 47) * Math.sin(t * 13) : 1);
      const ty = G.h0 + G.ch * 0.3;   // (the table's edge, low: the close-up is above it)
      // SP5 — HE WALKS UP FIRST (the owner: he snapped in): in from the room's depth over the first fifth of the moment (WIN2's walk-in),
      // leans in at the table, THEN the close-up count; back out through the depth at the end. DM: the man's + his hands' ONE depth
      const W = walkIn(p, { pin: 0.2, pout: 0.93, from: 0.85, to: 0.24 }), DM = 0.24, T_IN = len * 0.2, elc = Math.max(0, el - T_IN);
      // THE RHYTHM (a 24-s loop inside the count): counting 0–15.5 s (a bill every 0.46 s, a lick at 7.4), the square-up + two taps
      // 15.5–17.2, the band 17.2–18.0, the brick set aside 18.0–18.8, a breath, then counting again
      const LOOP = 24, e = mo ? elc % LOOP : 5.3, FL = 0.46, ec = e < 15.5 ? e : Math.max(0, e - 19.2);
      const counting = e < 15.5 || e >= 19.2, cnt = (ec % FL) / FL, lick = e > 7.4 && e < 8.1 ? sm(7.4, 7.55, e) * (1 - sm(7.9, 8.1, e)) : 0;
      const sq = sm(15.5, 15.9, e) * (1 - sm(18.6, 18.9, e)), tap = e > 16.0 && e < 17.0 ? Math.abs(Math.sin((e - 16.0) * Math.PI * 2)) : 0, band = sm(17.2, 17.5, e) * (1 - sm(17.95, 18.05, e)), aside = sm(18.0, 18.8, e);
      const bricks = Math.min(3, Math.floor(elc / LOOP) + (e >= 18.4 ? 1 : 0));   // (the banded bricks at the table's right grow)
      // the lamp's pool on the table (near) + the table's edge
      E.deep(0.22, () => { R(c, G.g0 - 0.4, G.h0 - 0.4, G.g1 + 0.4, ty, 'rgb(18,32,24)'); c.globalCompositeOperation = 'lighter'; glow(c, GREEN, G.cx, ty - 0.1, G.cw * 0.5, 0.5 * lampK, 0.4); c.globalCompositeOperation = 'source-over'; c.globalAlpha = al; R(c, G.g0 - 0.4, ty - 0.04, G.g1 + 0.4, ty, 'rgb(70,46,28)'); });
      const pal = litPal(whoM(0), [214, 248, 222], 0.95), bow = 0.22 - 0.12 * lick, LIT = { side: -1, a: 0.6, cast: 0.3 }, RIM = { col: GREEN, a: 0.5, side: -1, w: 0.03 };
      if (W.k < 0.99) {
        // THE WALK: in from the back wall (small) to the table — the feet stepping, the arms swinging a little; out again the same way
        const xw = G.cx + G.cw * (0.04 + 0.32 * (1 - W.k)), stepW = mo && W.walking ? Math.sin(el * 6.5) : 0;
        E.deep(W.d, () => figure(c, { x: xw, y: ty - 0.2, s: 1.7, face: W.out > 0.01 ? -0.25 : 0.12, step: stepW, lean: 0.02, hair: 'short', arms: [[0.18 + 0.22 * stepW, 0.3], [0.18 - 0.22 * stepW, 0.3]], pal, lit: LIT, marks: ['braces'], rim: RIM }));
        life.cashTrace = { el: +el.toFixed(1), phase: 'walk', flicks: life.cashTrace.flicks || 0, n: 0, bricks, d: +W.d.toFixed(2) };
      } else E.deep(DM, () => {
        // ONE RIG (the owner: four arms — the kit's arms + the counting hands): the hands' places first, then the kit's arms SOLVED to end
        // AT them (two-bone IK; the kit draws no mittens), then the hands + the money at those places
        const hy = ty + 0.34, lxh = G.cx - G.cw * 0.2, rxh = G.cx + G.cw * 0.2;
        const skin = (sh = 0) => rgb(mixc(mixc(SKIN, GREEN, 0.18), [40, 30, 24], sh)), hand = (x, y, rot, s = 1) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = skin(0.25); c.beginPath(); c.ellipse(0.02, -0.02, 0.17 * s, 0.13 * s, 0, 0, TAU); c.fill(); c.fillStyle = skin(0); c.beginPath(); c.ellipse(0, 0, 0.16 * s, 0.12 * s, 0, 0, TAU); c.fill(); c.restore(); };
        const bill = (x, y, rot, lit2 = 1) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = rgb(mixc([70, 110, 70], PALE, 0.55 + 0.45 * lit2 * lampK)); c.fillRect(-0.2, -0.09, 0.4, 0.18); c.fillStyle = rgb(mixc([40, 70, 44], PALE, 0.3 * lampK)); c.fillRect(-0.14, -0.04, 0.28, 0.08); c.restore(); };
        const stackH = 0.26 - 0.1 * (counting ? Math.min(1, ec / 15.5) : 1);
        const sx = lxh + (sq > 0.01 ? (rxh - lxh) * 0.5 * sq : 0), sy = hy + (sq > 0.01 ? 0.06 * tap : 0);
        const n = counting ? Math.min(14, Math.floor(ec / FL)) : 14, px = rxh - (sq > 0.01 ? (rxh - lxh) * 0.5 * sq : 0), py = hy - 0.02 + (sq > 0.01 ? 0.06 * tap : 0);
        // where the hands are this frame (the left under the stack; the right: the flick's arc / the lick / the square-up + the brick aside)
        let phase = 'count', LH = [sx, sy - 0.06, -0.2], RH = [px + 0.04, py + n * 0.014 + 0.1, 0.3], thumb = null, flick = null;
        if (counting && lick < 0.3 && sq < 0.01) {
          const u = sm(0, 0.55, cnt), arc = Math.sin(Math.PI * Math.min(1, cnt / 0.75)) * 0.16;
          if (cnt < 0.75) flick = [lerp(sx + 0.05, px, u), lerp(sy + stackH + 0.02, py + n * 0.014 + 0.02, u) + arc, lerp(-0.5, 0.1, u) + 0.4 * arc];
          const hx = cnt < 0.6 ? lerp(sx + 0.16, px + 0.04, sm(0.2, 0.6, cnt)) : px + 0.04, hy2 = cnt < 0.6 ? lerp(sy + stackH + 0.08, py + n * 0.014 + 0.1, sm(0.2, 0.6, cnt)) + arc * 0.6 : py + n * 0.014 + 0.1;
          RH = [hx, hy2, 0.3 - 0.5 * u]; thumb = [hx - 0.14, hy2 - 0.06, 0.6];
        } else if (lick > 0.01) {
          phase = 'lick';
          const hx = lerp(px + 0.04, G.cx + G.cw * 0.14, lick), hy2 = lerp(py + 0.1, ty + 1.12, lick);
          RH = [hx, hy2, 0.3 - 1.2 * lick]; thumb = [hx - 0.02, hy2 + 0.1 * lick, 1.2];
        } else if (sq > 0.01 || aside > 0.01) {
          phase = band > 0.01 ? 'band' : aside > 0.01 ? 'aside' : 'square';
          const bx = lerp(px, G.g1 - 0.25, aside), by = py + 0.06 * tap;
          RH = [bx + 0.14, by + 0.04, 0.2]; if (aside < 0.01) LH = [bx - 0.14, by + 0.04, -0.2];
        }
        // THE MAN (big, at the glass): head bowed to the count, shirtsleeves + braces, lit green from the left; a glance up at the lick; his
        // arms end where his hands are (the kit's shoulders: ±(0.295·s − 0.055·s) from his middle, 0.64·s − 0.045·s above his waist)
        const fx = G.cx + G.cw * 0.04, fy = ty - 0.2, S = 1.7, shy = fy + 0.64 * S - 0.045 * S, shx = 0.295 * S * (1 - 0.22 * Math.abs(0.1 + 0.3 * lick)) - 0.055 * S;
        const arm = (side, hx, hy2) => solveArm(side, hx - (fx + side * shx), hy2 - shy, 0.32 * S, 0.29 * S);
        figure(c, { x: fx, y: fy, s: S, face: 0.1 + 0.3 * lick, tilt: bow, lean: 0.03, hair: 'short', arms: [arm(-1, LH[0], LH[1]), arm(1, RH[0], RH[1])], noHands: true, pal, lit: LIT, marks: ['braces'], rim: RIM });
        // THE HANDS + THE MONEY: the left hand under the stack (a brick of bills thinning as he counts), its thumb on top
        hand(LH[0], LH[1], LH[2], 1.05);
        if (sq < 0.01 || aside > 0.01) { c.fillStyle = rgb(mixc([70, 110, 70], PALE, 0.55 * lampK)); c.fillRect(sx - 0.2, sy - 0.02, 0.4, stackH); for (let yy = 0.04; yy < stackH; yy += 0.05) R(c, sx - 0.2, sy - 0.02 + yy, sx + 0.2, sy + yy, rgb([40, 70, 44], 0.5)); c.fillStyle = skin(0.1); c.beginPath(); c.ellipse(sx - 0.1, sy + stackH - 0.01, 0.07, 0.045, -0.4, 0, TAU); c.fill(); }
        // the counted pile (growing through the count), its bills loosely squared — then squared up; the band snapped on
        for (let i = 0; i < n; i++) bill(px + (hsh(i, 3) - 0.5) * 0.08 * (1 - sq), py + i * 0.014, (hsh(i, 4) - 0.5) * 0.5 * (1 - sq), 0.8 + 0.2 * hsh(i, 5));
        if (band > 0.01) { const st = 1.3 - 0.3 * sm(0.6, 1, band); c.fillStyle = rgb([150, 40, 50], 0.9 * band); c.fillRect(px - 0.2 * st, py + 0.06, 0.4 * st, 0.05); }
        if (flick) bill(flick[0], flick[1], flick[2], 1);   // (THE FLICK: the top bill up off the stack, an arc over, dropped flat on the pile)
        hand(RH[0], RH[1], RH[2], 1.05);
        if (thumb) { c.fillStyle = skin(0.1); c.beginPath(); c.ellipse(thumb[0], thumb[1], phase === 'lick' ? 0.06 : 0.07, 0.045, thumb[2], 0, TAU); c.fill(); }
        // the banded bricks set aside at the table's right (the night's take growing)
        for (let i = 0; i < bricks; i++) { const bx = G.g1 - 0.25 - (i % 2) * 0.42, by = hy - 0.04 + Math.floor(i / 2) * 0.24; c.fillStyle = rgb(mixc([70, 110, 70], PALE, 0.55 * lampK)); c.fillRect(bx - 0.2, by, 0.4, 0.2); c.fillStyle = rgb([150, 40, 50], 0.9); c.fillRect(bx - 0.2, by + 0.07, 0.4, 0.05); }
        life.cashTrace = { el: +el.toFixed(1), phase, flicks: counting ? Math.floor(ec / FL) : life.cashTrace.flicks, n, bricks, d: DM };
      });
      // the lamp (near, top-left): the green glass shade on its brass stem, the bulb under it, its glow on the wall
      E.deep(0.18, () => {
        c.fillStyle = 'rgb(150,120,60)'; c.fillRect(lx - 0.02, ly - 0.5, 0.04, 0.5);
        c.fillStyle = rgb(mixc([30, 90, 60], GREEN, 0.5 * lampK)); c.beginPath(); c.moveTo(lx - 0.42, ly - 0.02); c.lineTo(lx + 0.42, ly - 0.02); c.quadraticCurveTo(lx + 0.3, ly + 0.24, lx, ly + 0.26); c.quadraticCurveTo(lx - 0.3, ly + 0.24, lx - 0.42, ly - 0.02); c.closePath(); c.fill();
        c.fillStyle = rgb(mixc([200, 255, 220], [255, 255, 240], lampK), 0.9 * lampK); c.fillRect(lx - 0.36, ly - 0.07, 0.72, 0.05);
        c.globalCompositeOperation = 'lighter'; glow(c, GREEN, lx, ly + 0.08, 0.55, 0.35 * lampK); c.globalCompositeOperation = 'source-over'; c.globalAlpha = al;
      });
      c.restore(); c.globalAlpha = 1;
    },

  };

  return { apartmentState, barState, saxPlayer, edgeMood, partyRoom, watchNow, tvCols, shop, tapPaint, litBlind, PAINT };
}
