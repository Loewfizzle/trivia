// CITY 2.0 — THE LIGHTNING (9a; ATM-B — THE LIGHTNING MENACING, the owner Oct 26: "jagged, thick, violent forks with a blinding core, a
// split-second double / triple stroke flicker, the whole storm deck lit from inside, the city's shadows thrown for an instant, the thunder
// cracking right on top of a close one"). Only in a real thunderstorm (core/harbor-weather.js's STORM) or a preview.
// THREE KINDS OF STRIKE:
//   · INTRA-CLOUD — the deck lit from inside, a flicker or two through its shapes (stormdeck.js reads flashInfo()), no bolt;
//   · FAR — a branching bolt from the cloud base down BEHIND the far skyline (drawn in the sky layer: the city stands in front of it);
//   · CLOSE — a THICK, jagged, branching fork with a white-hot core, IN FRONT of the skyline (front(): after the water), striking a tower's
//     crown, the harbor's water (a flash on the surface) or THE NEEDLE (~1 in 6 close strikes) — 1–3 return strokes in a split second;
//     the stage lit for an instant from the strike's side (city()).
// The THUNDER follows after the time sound takes (onStrike → sounds.js#thunder: a crack right on top of a close one, a long roll for a far).
// SAFETY (photosensitive viewers): never a full-screen white flash — the light stays in the SKY (the city only a faint, capped lift: CITY);
// the sky's glow capped (CAP); at most 3 strokes in a strike, ≥ 0.13 s apart, inside WINDOW (never more than 3 flashes in any second); never
// two strikes within MIN_GAP s. REDUCED MOTION: dimmed flashes (× RM), one slow soft pulse, no bolt — the thunder still rolls.
export const LIGHTNING = Object.freeze({ CAP: 0.42, CITY: 0.12, MIN_GAP: 4.5, GAP: [5, 15], FLICKERS: 3, WINDOW: 0.62, STROKE_GAP: 0.13, RM: 0.3,
  KINDS: Object.freeze({ ic: 0.34, far: 0.33, close: 0.33 }), NEEDLE: 1 / 6 });
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** PURE: one strike's strokes ([t0, len, k] from the strike's start, s) — 1 to 3, ≥ STROKE_GAP apart, inside WINDOW, each ≤ CAP */
export function strikeFlickers(r) {
  const u = r(), n = u < 0.35 ? 1 : u < 0.75 ? 2 : 3, out = [[0, 0.06 + r() * 0.04, LIGHTNING.CAP * (0.82 + 0.18 * r())]];
  let t = 0;
  for (let i = 1; i < n; i++) {
    t += LIGHTNING.STROKE_GAP + r() * 0.08;
    const len = 0.045 + r() * 0.04;
    if (t + len > LIGHTNING.WINDOW) break;
    out.push([t, len, LIGHTNING.CAP * (0.55 + 0.4 * r())]);
  }
  return out;
}
/** PURE: the brightness of a strike's strokes at e s after it began (a near-instant attack, a short hold, an eased decay) */
export function flickerAt(fl, e) {
  let k = 0;
  for (const [t0, len, a] of fl) { const u = e - t0; if (u < 0 || u > len + 0.3) continue; const v = u < 0.012 ? u / 0.012 : u < len ? 1 : Math.exp(-(u - len) / 0.075); k = Math.max(k, a * v); }
  return Math.min(LIGHTNING.CAP, k);
}
/** PURE: the thunder's delay from a strike d km away (sound ~0.343 km/s) — a close one right on top (≥ 0.5 s), a far one up to 16 s */
export const thunderDelay = km => Math.max(0.5, Math.min(16, km / 0.343));
/** PURE: a strike's kind from a roll (0..1) */
export const strikeKind = u => (u < LIGHTNING.KINDS.ic ? 'ic' : u < LIGHTNING.KINDS.ic + LIGHTNING.KINDS.far ? 'far' : 'close');

// A JAGGED channel: midpoint displacement with big sideways kicks (the zigzag of a real stroke), then BRANCHES off it heading down + out
// (each with a sub-branch now + then): [{ pts, w (width share), a (brightness share) }]
function bolt(r, x0, y0, x1, y1, close) {
  const jag = close ? 0.55 : 0.45;
  const grow = (a, b, it, j) => { let pts = [a, b]; for (let i = 0; i < it; i++) { const nx = []; for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], d = Math.hypot(bx - ax, by - ay); nx.push(pts[k], [(ax + bx) / 2 + (r() - 0.5) * d * j, (ay + by) / 2 + (r() - 0.5) * d * 0.14]); } nx.push(pts[pts.length - 1]); pts = nx; } return pts; };
  const main = grow([x0, y0], [x1, y1], 7, jag), out = [{ pts: main, w: 1, a: 1 }];
  const nb = (close ? 3 : 1) + Math.floor(r() * (close ? 3 : 2));
  for (let b = 0; b < nb; b++) {
    const i = 8 + Math.floor(r() * (main.length * 0.62)), [sx, sy] = main[Math.min(main.length - 2, i)], len = (y1 - y0) * (0.16 + r() * 0.3), dir = r() < 0.5 ? -1 : 1;
    const br = grow([sx, sy], [sx + dir * len * (0.45 + r() * 0.6), sy + len * (0.7 + 0.3 * r())], 5, 0.5);
    out.push({ pts: br, w: 0.5, a: 0.6 });
    if (close && r() < 0.55) { const j = Math.floor(br.length * (0.3 + 0.4 * r())), [qx, qy] = br[j], l2 = len * (0.3 + 0.3 * r()); out.push({ pts: grow([qx, qy], [qx + dir * l2 * (0.5 + r() * 0.5), qy + l2], 4, 0.5), w: 0.3, a: 0.4 }); }
  }
  return out;
}

export function createLightning({ onStrike = null } = {}) {
  let W = 1, HZ = 1, foot = 0, cur = null, next = 3, flash = 0, n = 0, lastAt = -1e9, kinds = { ic: 0, far: 0, close: 0, needle: 0 }, wantClose = false, motion = true;
  const r = Math.random;
  function strike(t, s, kind) {
    lastAt = t; n++;
    const base = s.base != null ? s.base : HZ * 0.2, km = kind === 'close' ? 0.35 + r() * 1.2 : kind === 'far' ? 2.6 + r() * 3.6 : 1.5 + r() * 4;
    const x = W * (0.1 + 0.8 * r());
    let target = null, bl = null;
    if (kind === 'far') bl = bolt(r, x, base + 6, x + (r() - 0.5) * W * 0.22, s.horizon != null ? s.horizon : HZ * 0.92, false);
    if (kind === 'close') {
      // THE NEEDLE ~1 in 6 close strikes (when it stands on screen), else a tower's crown or the harbor's water
      const tip = s.needle, sky = s.skyline, wb = s.water;
      if (tip && r() < LIGHTNING.NEEDLE) target = { kind: 'needle', x: tip[0], y: tip[1] };
      else if (sky && sky.length && r() < 0.55) {
        // a crown: the highest point in a random stretch of the skyline (a tower's top, not a gap)
        const a = Math.floor(sky.length * (0.08 + 0.7 * r())), b = Math.min(sky.length - 1, a + Math.floor(sky.length * 0.14));
        let bx = a; for (let i = a; i <= b; i++) if (sky[i] < sky[bx]) bx = i;
        target = { kind: 'crown', x: bx * (W / sky.length), y: sky[bx] };
      } else if (wb) target = { kind: 'water', x: W * (0.15 + 0.7 * r()), y: wb.y0 + 4 + r() * Math.max(4, (wb.y1 - wb.y0) * 0.35) };
      if (target) { kinds[target.kind === 'needle' ? 'needle' : target.kind] = (kinds[target.kind] || 0) + 1; const sx = target.x + (r() - 0.5) * W * 0.3; bl = bolt(r, sx, base + 4, target.x, target.y, true); }
      else kind = 'far';
    }
    kinds[kind]++;
    const fl = motion ? strikeFlickers(r) : [[0, 0.25, LIGHTNING.CAP * LIGHTNING.RM]];   // (reduced motion: one soft pulse, dimmed)
    cur = { at: t, kind, x: target ? target.x : x, y: base + (HZ - base) * (0.04 + 0.1 * r()), rad: W * (kind === 'ic' ? 0.26 + 0.2 * r() : 0.32 + 0.22 * r()), fl, km, bolt: motion ? bl : null, target, side: target ? (target.x < W / 2 ? -1 : 1) : (x < W / 2 ? -1 : 1) };
    const said = onStrike ? onStrike({ kind, pan: +Math.max(-0.8, Math.min(0.8, (cur.x / W) * 2 - 1)).toFixed(2), near: kind === 'close', km: +km.toFixed(1), delay: thunderDelay(km), level: kind === 'close' ? 1 : kind === 'far' ? 0.62 + 0.25 * (1 - (km - 2.6) / 3.6) : 0.5, bolt: !!bl, target: target ? target.kind : null }) : null;
    // (ATM-C — THE FLASH ON THE TAKE's OWN CRACK: the recorded close take's crack sits `lead` s into its file — the strike is held back that
    // long (everything visible waits on the flash), and a take with a SECOND crack flashes again on it (≥ 0.6 s apart: the safety cap holds))
    if (said && said.lead > 0) { cur.at = t + Math.min(2, said.lead); lastAt = cur.at; }
    if (said && said.second > 0.6 && motion) { cur.fl = [...cur.fl, [said.second, 0.07, LIGHTNING.CAP * 0.92], [said.second + LIGHTNING.STROKE_GAP, 0.05, LIGHTNING.CAP * 0.6]]; cur.hold = said.second; }
  }
  const sw = (P, c) => { c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]); c.stroke(); };
  function drawBolt(c, k, close) {
    if (!cur || !cur.bolt) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
    // a violet glow, a blue-white body, a WHITE-HOT CORE (its branches thinner + fainter) — the core's brightness is the bolt's, not the sky's
    const L = close ? [[13, '160,150,255', 0.16], [5.5, '206,206,255', 0.5], [2.4, '255,255,255', 1]] : [[6, '170,160,255', 0.18], [2.6, '214,214,255', 0.5], [1.1, '255,255,255', 0.95]];
    for (const br of cur.bolt) for (const [lw, col, a] of L) { c.strokeStyle = `rgba(${col},${(a * br.a * k).toFixed(3)})`; c.lineWidth = lw * (0.35 + 0.65 * br.w); sw(br.pts, c); }
    // where it lands: a flare at the crown / the needle / a burst of light on the water
    const tg = cur.target;
    if (close && tg) {
      const rr = tg.kind === 'water' ? 34 : 22, g = c.createRadialGradient(tg.x, tg.y, 0, tg.x, tg.y, rr);
      g.addColorStop(0, `rgba(255,255,255,${(0.9 * k).toFixed(3)})`); g.addColorStop(0.3, `rgba(200,200,255,${(0.45 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(160,160,255,0)');
      c.fillStyle = g; c.fillRect(tg.x - rr, tg.y - rr * (tg.kind === 'water' ? 0.5 : 1), rr * 2, rr * (tg.kind === 'water' ? 1.2 : 2));
    }
    c.restore();
  }
  return {
    resize(w, h, hz) { W = w; HZ = hz; },
    /** s: { on (a storm), t (s), motion, base (the cloud base y), horizon (the far skyline's foot y), force ('lightning': more often),
     *  close ('strike': a CLOSE strike every ~10 s — the panel's control), needle ([x, y] | null), skyline (crown y per column), water ({ y0, y1 }) } */
    tick(s) {
      motion = !!s.motion; if (s.horizon != null) foot = s.horizon + 6;   // (an unset motion = still: the old rule — never a full flash before the setting lands)
      if (!s.on) { flash = 0; if (cur && s.t - cur.at > 1 + (cur.hold || 0)) cur = null; return; }
      if (wantClose && s.t - lastAt >= 1.5) { wantClose = false; strike(s.t, s, 'close'); next = s.t + LIGHTNING.MIN_GAP + r() * 3; }
      else if (s.t >= next && s.t - lastAt >= LIGHTNING.MIN_GAP) {
        strike(s.t, s, s.close && r() < 0.8 ? 'close' : strikeKind(r()));
        next = s.t + (s.close ? 9 + r() * 3 : s.force ? LIGHTNING.MIN_GAP + r() * 2.5 : LIGHTNING.GAP[0] + r() * (LIGHTNING.GAP[1] - LIGHTNING.GAP[0]));
      }
      flash = cur ? flickerAt(cur.fl, s.t - cur.at) : 0;
      if (!motion) { flash = Math.min(flash, LIGHTNING.CAP * LIGHTNING.RM); if (cur) cur.bolt = null; }   // (reduced motion — every frame: dimmed, no bolt)
      if (cur && s.t - cur.at > 1.3 + (cur.hold || 0)) cur = null;
    },
    /** the panel's CLOSE STRIKE: the next moment it may (never inside MIN_GAP of the last — the safety rule wins) */
    strikeClose() { wantClose = true; },
    /** 0..CAP — the sky's light now (the drops + the clouds' undersides read it) */
    flash: () => flash,
    /** the strike's patch of the deck to light from inside (stormdeck.js) — { x, y, rad, k (0..1) } or null */
    flashInfo: () => (cur && flash > 0.005 ? { x: cur.x, y: cur.y, rad: cur.rad, k: flash / LIGHTNING.CAP } : null),
    /** in the sky layer, after the clouds + the storm deck: the glow inside the deck, a faint lift of the sky band, a FAR bolt (behind the city) */
    draw(c) {
      if (!cur || flash <= 0.005) return;
      const k = flash / LIGHTNING.CAP;
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, cur.rad);
      g.addColorStop(0, `rgba(214,220,255,${(0.5 * flash).toFixed(3)})`); g.addColorStop(0.45, `rgba(170,176,240,${(0.2 * flash).toFixed(3)})`); g.addColorStop(1, 'rgba(150,150,230,0)');
      c.fillStyle = g; c.fillRect(cur.x - cur.rad, cur.y - cur.rad, cur.rad * 2, cur.rad * 2);
      c.fillStyle = `rgba(160,170,230,${(0.12 * flash).toFixed(3)})`; c.fillRect(0, 0, W, Math.max(HZ, foot));   // (down to the skyline's foot: no edge in its gaps)
      c.restore();
      if (cur.kind === 'far') drawBolt(c, k, false);
    },
    /** after the water (in front of the skyline): a CLOSE strike's fork + where it lands */
    front(c) { if (cur && cur.kind === 'close' && flash > 0.005) drawBolt(c, flash / LIGHTNING.CAP, true); },
    /** over the stage: THE LIGHT THROWN — the strike lights the whole near scene for an instant from its side (brighter toward the strike,
     *  so the shapes read lit on one side, dark on the other); capped: LIGHTNING.CITY — never a white screen */
    city(c, s) {
      if (!cur || flash <= 0.005) return;
      const kk = (cur.kind === 'close' ? 1 : cur.kind === 'far' ? 0.55 : 0.35) * LIGHTNING.CITY * flash / LIGHTNING.CAP;
      if (kk < 0.004) return;
      const y0 = s.y0 || 0, y1 = s.y1 || 1e4, g = c.createLinearGradient(cur.side < 0 ? 0 : W, 0, cur.side < 0 ? W : 0, 0);
      g.addColorStop(0, `rgba(170,178,240,${kk.toFixed(3)})`); g.addColorStop(1, `rgba(150,160,220,${(kk * 0.35).toFixed(3)})`);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); c.restore();
    },
    debug: () => ({ strikes: n, flash: +flash.toFixed(3), bolt: !!(cur && cur.bolt), kind: cur ? cur.kind : null, target: cur && cur.target ? cur.target.kind : null, kinds: { ...kinds }, next: +next.toFixed(1) }),
  };
}
