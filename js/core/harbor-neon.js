// CITY 2.0 — THE HARBOR, Part 3: NEON (PURE: no DOM; tests/harbor.test.mjs). docs/harbor.md#neon.
//
//  - flattenPath(): an SVG path (absolute M L H V Q C A Z — the marks' and the tube letters' language) → polylines, so a tube
//    can be lit unevenly along its length (hotter on the bends, dimmer at the electrodes) and its ends + clips found.
//  - THE PALETTE: ~8 neon colours in ROLES (base ~60 % electric blue / cyan / ice white · heat ~30 % the NEON pink + violet,
//    mostly on the hero towers · accent ~10 % amber / signal red / acid green, sparingly); a SCHEME maps the roles to colours
//    (the default; holidays, party nights, CITY CONTROL later swap the scheme, never the roles).
//  - outlines(L): THE NEON OUTLINES on the buildings — world polylines tracing the Art Deco shapes: the hero + landmark towers
//    fully (each tier's edges, the setback ledges, the crown), the middle tier on its rooflines + setbacks, the far bands only as
//    a few faint threads; the needle's spire becomes THE NEON NEEDLE. Never across a word tower's face (only its frame).
//  - signSpots(L): where the city's signs hang (named game signs, icon signs, the game blade, billboards), in world
//    units; assignSigns(): which game takes which spot tonight (a new pick each night, never while you watch).
import { REF_TITLE, cameraFor, fxAt, fOf, project, lighthouseBoxes } from './harbor-layout.js';
import { rngFrom, shuffle } from './rng.js';

export { flattenPath, tubeLight } from './tube-path.js';

// ------------------------------------------------------------------ THE PALETTE + SCHEMES
/** the neon colours (sRGB) */
export const NEON = {
  blue: [46, 123, 255], cyan: [46, 230, 255], ice: [214, 240, 255],          // BASE ~60 %
  pink: [255, 46, 151], violet: [168, 82, 255],                               // HEAT ~30 % (the NEON pink is the logo's glow)
  amber: [255, 176, 46], red: [255, 59, 59], acid: [182, 255, 58],            // ACCENT ~10 %
  // NEON PASS 3 (the owner: "bold but designed" — many colours across the city, like a real neon city)
  magenta: [255, 40, 210], teal: [24, 232, 190], green: [70, 255, 130], gold: [255, 210, 90], white: [255, 248, 236],
};
/** a role → a colour name: b0 b1 b2 (base) · h0 h1 (heat) · a0 a1 a2 (accent) */
export const SCHEMES = {
  city: { b0: 'blue', b1: 'cyan', b2: 'ice', h0: 'pink', h1: 'violet', a0: 'amber', a1: 'red', a2: 'acid', m0: 'magenta', t0: 'teal', g0: 'green', a3: 'gold', w0: 'white' },
  // later parts (holidays 11a–c, party nights 10, CITY CONTROL) — the same roles, other colours
  halloween: { b0: [255, 122, 18], b1: [155, 61, 255], b2: [255, 170, 80], h0: [255, 122, 18], h1: [155, 61, 255], a0: [120, 255, 90], a1: [255, 60, 40], a2: [120, 255, 90] },
  christmas: { b0: [255, 40, 60], b1: [24, 220, 110], b2: 'ice', h0: [255, 40, 60], h1: [24, 220, 110], a0: 'amber', a1: [255, 40, 60], a2: [24, 220, 110] },
  july4: { b0: [255, 48, 72], b1: [244, 246, 255], b2: [61, 123, 255], h0: [255, 48, 72], h1: [61, 123, 255], a0: [244, 246, 255], a1: [255, 48, 72], a2: [61, 123, 255] },
  valentine: { b0: [255, 46, 110], b1: [255, 156, 194], b2: [255, 230, 240], h0: [255, 46, 110], h1: [255, 106, 152], a0: [255, 200, 220], a1: 'red', a2: [255, 156, 194] },
  stpatrick: { b0: [24, 224, 112], b1: [168, 255, 207], b2: [230, 255, 240], h0: [43, 255, 134], h1: [24, 180, 90], a0: 'amber', a1: [43, 255, 134], a2: 'acid' },
  nye: { b0: [255, 216, 122], b1: [236, 240, 255], b2: [255, 248, 230], h0: [255, 196, 74], h1: [220, 226, 255], a0: [255, 196, 74], a1: [255, 240, 200], a2: [236, 240, 255] },
  thanksgiving: { b0: [255, 138, 30], b1: [255, 176, 80], b2: [255, 230, 190], h0: [255, 138, 30], h1: [200, 90, 40], a0: 'amber', a1: [220, 70, 40], a2: [255, 200, 100] },
  easter: { b0: [138, 216, 255], b1: [255, 179, 224], b2: [255, 240, 200], h0: [255, 138, 208], h1: [180, 138, 255], a0: [255, 216, 106], a1: [255, 138, 208], a2: [160, 255, 190] },
  // NEON PASS 4 — THE PARTY SCHEME (the owner: bold party colours in any single frame). NEON PASS 5 (the owner: "I don't want
  // them to just be pink the whole time"): tiers 1–2 wear THE ROTATING PALETTE (core/harbor-show.js#PARTY_PAL, a new colour pair
  // every scene); this baked scheme is tier 0's still party — the same seven colours, pink one of many
  party: { b0: [40, 120, 255], b1: [255, 196, 50], b2: [160, 70, 255], h0: [255, 44, 64], h1: [50, 255, 120], a0: [255, 244, 236], a1: [255, 46, 151], a2: [40, 120, 255], m0: [160, 70, 255], t0: [50, 255, 120], g0: [255, 196, 50], a3: [255, 196, 50], w0: [255, 244, 236] },
};
/** a role's colour in a scheme: [r, g, b] */
export function roleColour(role, scheme = 'city') {
  const sc = (typeof scheme === 'object' && scheme) || SCHEMES[scheme] || SCHEMES.city;
  // (NEON PASS 3's roles m0 t0 g0 a3 w0: a holiday scheme that doesn't name them maps them to its nearest older role — a
  // Halloween night stays orange + purple, never the city's teal)
  const v = sc[role] ?? (sc !== SCHEMES.city && ROLE_FALLBACK[role] ? sc[ROLE_FALLBACK[role]] : null) ?? SCHEMES.city[role] ?? 'ice';
  return Array.isArray(v) ? v : NEON[v] || NEON.ice;
}
const ROLE_FALLBACK = { m0: 'h0', t0: 'b1', g0: 'a2', a3: 'a0', w0: 'b2' };
/** the role family of a role: base | heat | accent (teal + white count as base, magenta as heat, green + gold as accent) */
export const roleFamily = r => (r[0] === 'b' || r[0] === 't' || r[0] === 'w' ? 'base' : r[0] === 'h' || r[0] === 'm' ? 'heat' : 'accent');
/** the WARM roles (pink, magenta, amber, red, gold): the near city leans warm, the far city cool (depth) */
export const WARM_ROLES = new Set(['h0', 'm0', 'a0', 'a1', 'a3']);

// ------------------------------------------------------------------ THE OUTLINES
// Each building gets at most two roles: its main colour and an accent (the crown); neighbours share a family (colour by
// cluster), the heroes carry the heat, the far bands only a few faint threads.
const ROLES = {
  sunburst: ['h0', 'a0'], needle: ['h1', 'h0'], empire: ['b2', 'b0'],
  wordA: ['b1', 'b1'], wordB: ['b1', 'b2'], wordV: ['b0', 'b2'],
  // (NEON PASS 3: the middle tier in contrasting pairs — teal / violet / magenta / gold — so the midsection reads as lit)
  'm-edge': ['a0', 'm0'], 'm-dome': ['b1', 'a3'], 'm-step': ['t0', 'h0'], 'm-twin': ['h1', 'b1'], 'm-right': ['m0', 'b1'],
  glassL: ['b1', 'b1'], glassR: ['b2', 'b2'],
  hotel: ['a1', 'a1'], pulse: ['h1', 'h1'], par: ['h0', 'h0'],
};
// NEON PASS 4 (the owner: "remove the JAZZ sign — that left corner is cluttered"): the old JAZZ club is PLAIN CITY now — no sign, no
// frame — lit like its neighbours in the near band (NEON PASS 3's trims): [kind, main, accent, detail] (a WARM_L pairing)
const PLAIN_HEROES = { jazz: ['bands', 'm0', 'b1', 'w0'] };
/** strength: the brightness hierarchy (tube width in pt at the reference scale, glow, alpha) */
export const STRENGTH = { hero: { w: 1.5, glow: 7, a: 1 }, word: { w: 1.25, glow: 5.5, a: 0.92 }, mid: { w: 1.0, glow: 4.5, a: 0.8 }, quay: { w: 1.1, glow: 5, a: 0.88 }, far: { w: 0.7, glow: 3.2, a: 0.5 }, pano: { w: 1.2, glow: 5.5, a: 0.9 },
  // NEON PASS 3: the bands' own neon — the near band (the storefront city) just under the middle tier, the mid band softer
  band: { w: 1.0, glow: 4.8, a: 0.95 }, midband: { w: 0.85, glow: 4, a: 0.78 }, farband: { w: 0.75, glow: 3.4, a: 0.62 } };

/**
 * DEPTH (NEON PASS 3, the owner: "use the neon to build DEPTH" — the most important note): every tube's weight, glow, brightness
 * and crispness come from HOW FAR AWAY its building stands, in four clear steps — NEAR (the quay, the near band, the word towers:
 * thick, bright, crisp, a strong glow, a visible glass core), MID (the landmark towers), FAR (the middle tier + the mid band:
 * thinner, softer, dimmer), DEEP (the far band + the glass towers: fine threads sinking into the haze — tinted toward it). A
 * landmark tower keeps a little more light than its depth gives (the hierarchy: the sign → the hero crowns → signs → building neon).
 *   w: the tube (pt at the reference scale) · glow (pt) · a (brightness) · soft (0 crisp .. 1 soft: the core + highlight fade) ·
 *   haze (0..1: the colour sinks toward the night haze)
 */
export const DEPTH = [
  { name: 'near', z: 252, w: 1.62, glow: 6.6, a: 1, soft: 0, haze: 0 },
  { name: 'mid', z: 296, w: 1.24, glow: 5.4, a: 0.92, soft: 0.12, haze: 0.04 },
  { name: 'far', z: 380, w: 0.86, glow: 3.7, a: 0.68, soft: 0.4, haze: 0.18 },
  { name: 'deep', z: Infinity, w: 0.58, glow: 2.5, a: 0.44, soft: 0.66, haze: 0.36 },
];
/** the night haze the far neon sinks toward */
export const HAZE = [118, 96, 172];
/** an outline's strength from its depth (+ the landmark towers' bit of extra light) */
export function depthStrength(o) {
  const st = DEPTH.find(d => (o.z ?? 240) < d.z) || DEPTH[DEPTH.length - 1];
  return o.strength === 'hero' || o.strength === 'pano' ? { ...st, a: Math.min(1, st.a + 0.06), glow: st.glow * 1.08 } : st;
}

/**
 * The outlines: [{ id, group: 'far'|'near', strength, roles: [main, accent], z, lines: [{ pts: [[x,y,z]…], role, closed?,
 * thin? }], power (the boot-up index group: one per building) }]. World units; the renderer projects them.
 *
 * Part 4 (the owner's review): the outlines FOLLOW THE DECO SHAPES. A tower's outline is one bent tube a side — up the shaft,
 * stepping in at every setback, over the crown's steps when the crown shares its colour, down the other side — so the
 * silhouette reads as stepped, not as stacked rectangles; thin vertical FINS (the Deco piers) run up every tier above the
 * shaft (never where a sign hangs: signRects, host → world rects); the crown is traced by its own shape.
 */
export function outlines(L, signRects = new Map()) {
  const out = [];
  const add = (o) => { if (o.lines.length) out.push(o); };
  const signsOn = id => (signRects instanceof Map ? signRects.get(id) || [] : signRects.has && signRects.has(id) ? [{ x0: -1e9, x1: 1e9, y0: -1e9, y1: 1e9 }] : []);
  // the towers: the heroes + the landmarks + the word towers fully, the middle tier on the setbacks + crowns, the glass towers' roofs
  for (const t of L.towers) {
    const pano = t.rank === 'pano', hero = t.rank === 'hero' || pano, word = t.rank === 'word', mid = t.rank === 'mid', modern = t.rank === 'modern';
    const k = pano ? Math.abs(t.seed) % 4 : 0;
    const roles = ROLES[t.id] || (modern ? ['b1', 'b1'] : pano ? [['b0', 'b1'], ['h0', 'a0'], ['b2', 'b0'], ['h1', 'b1']][k] : ['b0', 'b0']);
    const lines = [], n = t.tiers.length, topT = t.tiers[n - 1];
    if (modern) { const y1 = topT.y0 + topT.h, z = topT.z0 - 0.05; lines.push({ pts: [[topT.x0, y1, z], [topT.x1, y1, z]], role: roles[0] }); }
    else {
      // THE CONTOUR (NEON PASS 2, the owner's zoomed review): ONE tube a side bent like a sign shop would — up the shaft from its
      // FOOT (the cut ends it cleanly at the roofs in front: neon.js), stepping in only at the MAIN setbacks (a setback narrower than
      // MIN_STEP is skipped: the tube runs straight up the inner edge), over a simplified crown, every bend ROUNDED (fillet) — never
      // an 8-bit staircase. The middle tier from its shaft's top (its stepped cap).
      const full = hero || word || mid, groups = [];      // (NEON PASS 3: the middle tier from its foot too — full runs)
      t.tiers.forEach((tr, i) => {
        const g = groups[groups.length - 1], y1 = tr.y0 + tr.h, z = tr.z0 - 0.05;
        if (g && Math.abs(tr.x0 - g.x0) < MIN_STEP && Math.abs(tr.x1 - g.x1) < MIN_STEP) { g.x0 = Math.max(g.x0, tr.x0); g.x1 = Math.min(g.x1, tr.x1); g.y1 = y1; g.z1 = z; }
        else groups.push({ x0: tr.x0, x1: tr.x1, y0: i === 0 && !full ? y1 : tr.y0, y1, z0: z, z1: z });
      });
      const left = [], right = [];
      for (const g of groups) { left.push([g.x0, g.y0, g.z0], [g.x0, g.y1, g.z1]); right.push([g.x1, g.y0, g.z0], [g.x1, g.y1, g.z1]); }
      const cr = topT.crown ? crownPath(t, topT) : null;
      const one = cr && cr.path && (roles[1] || roles[0]) === roles[0];
      // one continuous tube when the crown is the building's own colour; else the contour closes over the roof and the crown is its own tube
      const lastG = groups[groups.length - 1], over = one ? cr.path.map(([x, y, z], i, a) => [i === 0 ? lastG.x0 : i === a.length - 1 ? lastG.x1 : x, y, z]) : [[lastG.x0, lastG.y1, lastG.z1], [lastG.x1, lastG.y1, lastG.z1]];
      const pts = fillet(dedupe([...left, ...over, ...right.reverse()]), FILLET);
      if (pts.length > 1) lines.push({ pts, role: roles[0], part: 'contour' });
      if (cr) { if (cr.path && !one) lines.push({ pts: fillet(cr.path, FILLET * 0.8), role: roles[1] || roles[0], part: 'crown' }); for (const e of cr.extras) lines.push({ ...e, role: e.needle ? e.role : roles[1] || roles[0], part: 'crown' }); }
      // DECO FINS: thin piers up every tier above the shaft (the heroes', the word towers' + the panorama's), never under a sign
      if (hero || word) t.tiers.forEach((tr, i) => {
        if (i === 0) return;
        const w = tr.x1 - tr.x0, z = tr.z0 - 0.05, y0 = tr.y0 + tr.h * 0.08, y1 = tr.y0 + tr.h;
        if (w < 3.2 || signsOn(t.id).some(r => r.y1 > tr.y0 && r.y0 < y1)) return;
        const fr = w >= 9 ? [0.2, 0.4, 0.6, 0.8] : w >= 5.5 ? [0.27, 0.5, 0.73] : [0.34, 0.66];
        for (const f of fr) lines.push({ pts: [[tr.x0 + w * f, y0, z], [tr.x0 + w * f, y1, z]], role: roles[0], thin: true, part: 'fin', lvl: Math.round(f * 10) });
      });
      // NEON PASS 3 — SETBACK LEDGES: a Deco band across the face at every setback (+ two spandrel bands up a hero's shaft), in the
      // building's accent — the tower reads as lit floor over floor (and the party show lights them one by one up the tower).
      // Never on a word tower (its face is the message) and never through a sign (the cut ends them at its cabinet).
      if (hero || mid) {
        const ys = [];
        t.tiers.forEach((tr, i) => { if (i < n - 1) ys.push([tr.y0 + tr.h - 0.3, tr]); });
        if (hero) { const s0 = t.tiers[0]; for (const f of [0.55, 0.78]) if (s0.h > 20) ys.push([s0.y0 + s0.h * f, s0]); }
        ys.sort((a, b) => a[0] - b[0]).forEach(([y, tr], i) => { if (tr.x1 - tr.x0 > 2.2 && !signsOn(t.id).some(r => y > r.y0 - 0.5 && y < r.y1 + 0.5)) lines.push({ pts: [[tr.x0 + 0.35, y, tr.z0 - 0.05], [tr.x1 - 0.35, y, tr.z0 - 0.05]], role: roles[1] || roles[0], thin: true, part: 'ledge', lvl: i }); });
        // the middle tier's fins on its top tier (two or three, its main colour)
        if (mid) { const tr = topT, w = tr.x1 - tr.x0; if (w > 3) for (const f of w > 6 ? [0.3, 0.5, 0.7] : [0.35, 0.65]) lines.push({ pts: [[tr.x0 + w * f, tr.y0 + tr.h * (n > 1 ? 0.12 : 0.6), tr.z0 - 0.05], [tr.x0 + w * f, tr.y0 + tr.h - 0.35, tr.z0 - 0.05]], role: roles[0], thin: true, part: 'fin', lvl: Math.round(f * 10) }); }
      }
    }
    add({ id: t.id, group: t.z0 >= 300 ? 'far' : 'near', strength: hero ? 'hero' : word ? 'word' : modern ? 'far' : pano ? 'pano' : 'mid', roles, z: t.z0, lines });
  }
  // the hero blocks on the quay: their rooflines (their signs are the signs)
  // (NEON PASS 2: + a Deco LEDGE BAND across the second floor and CORNER TRIMS up the upper floors — warm, the storefront city;
  // a sign hung on the wall cuts them cleanly: neon.js)
  for (const b of L.heroes) {
    const plain = PLAIN_HEROES[b.id];
    if (plain) {
      const lines = [];
      bandNeon(lines, { ...b, seed: 0 }, plain[0], plain[1], plain[2], plain[3], true, true);
      add({ id: b.id, group: 'near', strength: 'band', roles: [...new Set(lines.map(l => l.role))], z: b.z0, lines, band: 'near', blocks: [b.id] });
      continue;
    }
    const role = (ROLES[b.id] || ['a0'])[0], z = b.z0 - 0.05, w = b.x1 - b.x0;
    const lines = [{ pts: [[b.x0, b.h, z], [b.x1, b.h, z]], role }];
    lines.push({ pts: [[b.x0 + 0.3, b.h * 0.3, z], [b.x1 - 0.3, b.h * 0.3, z]], role, thin: true });
    if (w > 6) for (const x of [b.x0 + 0.25, b.x1 - 0.25]) lines.push({ pts: [[x, b.h * 0.3, z], [x, b.h - 0.2, z]], role, thin: true });
    add({ id: b.id, group: 'near', strength: 'quay', roles: [role, role], z: b.z0, lines });
  }
  // THE LIGHTHOUSE IN NEON (NEON PASS 3, the owner): its tower's edges + the stripes' rims, the gallery ring, the lantern room and
  // the dome in classic RED + WHITE tubes (its own stripes'), the keeper's house's roofline in a warm amber — the 'harbor' group
  // (drawn over the baked harbor layer, mirrored by the water); the beam keeps sweeping
  if (L.lighthouse) {
    const l = L.lighthouse, R = y => l.r0 + (l.r1 - l.r0) * y / l.h, z = l.z - 0.3, yb = 2.3, g = l.gallery || l.r1 + 1, lw = l.r1 * 0.7, x = l.x;
    const lines = [
      { pts: [[x - R(yb) + 0.12, yb, z], [x - R(l.h) + 0.12, l.h - 0.05, z]], role: 'w0', part: 'contour', lvl: 0 },
      { pts: [[x + R(yb) - 0.12, yb, z], [x + R(l.h) - 0.12, l.h - 0.05, z]], role: 'w0', part: 'contour', lvl: 1 },
      ...[0.25, 0.38, 0.6, 0.73].map((f, i) => ({ pts: [[x - R(l.h * f) + 0.15, l.h * f, z], [x + R(l.h * f) - 0.15, l.h * f, z]], role: 'a1', thin: true, part: 'ledge', lvl: i })),
      { pts: [[x - g, l.h + 0.3, z], [x + g, l.h + 0.3, z]], role: 'a1', part: 'ledge', lvl: 4 },
      { pts: [[x - g + 0.08, l.h + 1.25, z], [x + g - 0.08, l.h + 1.25, z]], role: 'w0', thin: true, part: 'ledge', lvl: 5 },
      { pts: fillet([[x - lw, l.h + 1.3, z], [x - lw, l.h + 3.4, z], [x + lw, l.h + 3.4, z], [x + lw, l.h + 1.3, z]], 0.25), role: 'w0', part: 'crown' },
    ];
    const dome = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; dome.push([x - Math.cos(a) * l.r1, l.h + 3.45 + Math.sin(a) * 1.6, z]); }
    lines.push({ pts: dome, role: 'a1', part: 'crown' });
    add({ id: 'lighthouse', group: 'harbor', strength: 'quay', roles: ['w0', 'a1'], z: l.z, lines });
    const k = L.cottage;
    if (k) { const cz = k.z + 0.9; add({ id: 'cottage', group: 'harbor', strength: 'quay', roles: ['a0', 'a0'], z: k.z, lines: [{ pts: fillet([[k.x - 0.3, k.h + 0.05, cz], [k.x + k.w / 2, k.roof + 0.05, cz], [k.x + k.w + 0.3, k.h + 0.05, cz]], 0.3), role: 'a0', part: 'roof' }] }); }
  }
  // THE BANDS — NEON PASS 3 (the owner: "neon on (almost) every building", "bold but designed"): every near + mid building gets
  // Deco neon of its own, from a small trim to a full outline — FULL RUNS (a trim goes all the way along its edge and ends at caps,
  // never half a building): edge + roofline contours, Deco LEDGE BANDS floor over floor, CORNER PILASTERS, FINS, a CHEVRON on the
  // parapet, a SUNBURST fan under the roof. Up to three colours a building from DESIGNED PAIRINGS (a sign shop's combinations:
  // pink + gold, red + white, magenta + cyan …), the near city WARM, the mid city COOL (depth), neighbours always contrasting;
  // each district of the skyline its own family of pairings, so it reads crafted — never a rainbow smear. A few buildings stay
  // quiet, only where it makes their neighbours pop. Never behind the wheel (its quiet zone), never on a corridor's clipped piece.
  // Each band comes in CLUSTERS (3 neighbours an outline item: they boot one by one, and the party show plays them apart).
  const cam = L.cam, wh = L.wheel;
  const [wcx, wcy] = cam ? project(cam, wh.x, wh.y, wh.z) : [0, 0], wr = cam ? cam.F * wh.r / wh.z + 6 : 0;
  const nearWheel = b => { if (!cam) return false; const [a, ty] = project(cam, b.x0, b.h, b.z0), [c, fy] = project(cam, b.x1, 0, b.z0); const nx = Math.max(a, Math.min(wcx, c)), ny = Math.max(ty, Math.min(wcy, fy)); return Math.hypot(nx - wcx, ny - wcy) < wr; };
  const dice = (b, k) => ((b.seed >>> (k * 5)) % 997) / 997;
  // (a building standing in front of a word tower's face keeps its neon under its roof: no chevron, no parapet into the face)
  const faces = cam ? L.towers.filter(t => t.word && t.face).map(t => { const tr = t.tiers[0]; return { x0: project(cam, tr.x0, 0, tr.z0)[0], x1: project(cam, tr.x1, 0, tr.z0)[0], z: tr.z0 }; }) : [];
  const underFace = b => faces.some(f => b.z0 < f.z && project(cam, b.x1, 0, b.z0)[0] > f.x0 - 2 && project(cam, b.x0, 0, b.z0)[0] < f.x1 + 2);
  for (const bd of L.bands) {
    if (bd.id === 'haze') continue;
    const near = bd.id === 'near', mid = bd.id === 'mid';
    const share = near ? 0.96 : mid ? 0.88 : 0.62;
    const blocks = bd.blocks.filter(b => b.cap == null && b.x1 - b.x0 >= (near ? 2.4 : 3) && !((near || mid) && nearWheel(b))).sort((p, q) => (p.x0 + p.x1) - (q.x0 + q.x1));
    let prevMain = null, prevKind = null, cluster = [], ci = 0;
    const flush = () => {
      if (!cluster.length) return;
      const lines = cluster.flatMap(c => c.lines), roles = [...new Set(lines.map(l => l.role))];
      add({ id: `threads-${bd.id}-${ci++}`, group: near ? 'near' : 'far', strength: near ? 'band' : mid ? 'midband' : 'farband', roles: roles.length ? roles : ['b0'], z: Math.min(...cluster.map(c => c.b.z0)), lines, band: bd.id, blocks: cluster.map(c => c.b.id) });
      cluster = [];
    };
    for (const b of blocks) {
      const lines = [];
      if (dice(b, 0) <= share) {
        const f = fOf((b.x0 + b.x1) / 2, b.z0), fr = ((f % 1) + 1) % 1;
        // the district's pairings (left / middle / right of the skyline: each its own family); the building's dice picks one,
        // a neighbour with the same main colour (or the same hue family) moves on to the next
        const fam = near ? (fr < 0.36 ? WARM_L : fr < 0.68 ? WARM_M : WARM_R) : mid ? (fr < 0.4 ? COOL_L : fr < 0.7 ? COOL_M : COOL_R) : FAR_P;
        let i = Math.floor(dice(b, 1) * fam.length), tries = 0;
        while (tries++ < fam.length && prevMain && (fam[i][0] === prevMain || (fam[i][0][0] === prevMain[0] && fam[i][0] !== 'w0'))) i = (i + 1) % fam.length;
        const [main, acc, det] = fam[i];
        const kind = bandKind(b, near, mid, dice, prevKind);
        if (kind !== 'quiet') { bandNeon(lines, b, kind, main, acc, det, near, !underFace(b)); prevMain = main; }
        prevKind = kind;
      } else prevKind = 'quiet';
      if (!lines.length) continue;
      cluster.push({ b, lines });
      if (cluster.length >= (near ? 3 : 4)) flush();
    }
    flush();
  }
  return out;
}
// THE PAIRINGS (NEON PASS 3): [main, accent, detail] — designed like a sign shop's combinations. The near city WARM (its
// districts: left / middle / right), the mid city COOL, the far threads single colours.
const WARM_L = [['h0', 'a3', 'w0'], ['a1', 'w0', 'a3'], ['a0', 'm0', 'w0'], ['m0', 'b1', 'w0'], ['a3', 'a1', 'w0']];
const WARM_M = [['h0', 't0', 'w0'], ['h1', 'a0', 'w0'], ['a3', 'h0', 'w0'], ['a1', 'a3', 'w0'], ['m0', 'a3', 'w0'], ['w0', 'h0', 'a3']];
const WARM_R = [['a0', 'h1', 'w0'], ['h0', 'a3', 'w0'], ['g0', 'h0', 'w0'], ['a1', 'b1', 'w0'], ['m0', 'a0', 'w0']];
const COOL_L = [['b1', 'h1', 'w0'], ['t0', 'h0', 'w0'], ['h1', 'b1', 'w0'], ['b0', 'w0', 'b1']];
const COOL_M = [['h1', 'b1', 'w0'], ['b0', 'w0', 'b1'], ['m0', 'b0', 'w0'], ['t0', 'h1', 'w0']];
const COOL_R = [['t0', 'h0', 'w0'], ['b1', 'h1', 'w0'], ['g0', 'b0', 'w0'], ['w0', 'b1', 'h1']];
const FAR_P = [['b1'], ['h1'], ['b0'], ['t0'], ['w0'], ['b1'], ['m0']];
/** a band building's neon (by its dice): outline · bands · pilasters · fins · sunburst · trim · quiet */
function bandKind(b, near, mid, dice, prevKind) {
  const d = dice(b, 2), h = b.h, w = b.x1 - b.x0;
  // (the far band: its tall slim towers — the ones that peek between the landmarks — outlined; the rest a roofline thread)
  if (!near && !mid) return (b.kind === 'tower' ? d < 0.75 : d < 0.22) && h > 8 ? 'outline' : 'trim';
  // (a few stay quiet — only where a lit neighbour pops against them: never two dark in a row)
  if (d < (near ? 0.05 : 0.08) && prevKind && prevKind !== 'quiet' && prevKind !== 'trim') return 'quiet';
  if (mid) return d < 0.36 ? 'outline' : d < 0.58 && h > 9 ? 'bands' : d < 0.78 && w > 5 ? 'pilasters' : 'trim';
  return d < 0.3 ? 'outline' : d < 0.47 && h > 9 ? 'bands' : d < 0.62 && w > 5 && h > 9 ? 'pilasters' : d < 0.76 && w > 6 && h > 10 ? 'fins' : d < 0.88 && w > 5.5 && h > 9 ? 'sunburst' : 'trim';
}
/** a band building's tubes (world units; the cut ends them at the roofs in front: neon.js) */
function bandNeon(lines, b, kind, main, acc, det, near, above = true) {
  const z = b.z0 - 0.05, x0 = b.x0, x1 = b.x1, h = b.h, w = x1 - x0, cx = (x0 + x1) / 2, bid = b.id;
  const L = (pts, role, part, o = {}) => lines.push({ pts, role, z: b.z0, block: bid, part, ...o });
  const roof = () => L([[x0, h, z], [x1, h, z]], main, 'roof');
  const acc2 = acc || main, det2 = det || acc2;
  if (kind === 'outline') {
    // the full contour: up one edge from the foot, over the roof (a parapet step on a wide one), down the other — one bent tube
    const ph = near && above && w > 7 ? Math.min(1.2, h * 0.05) : 0, pw = w * 0.3;
    const top = ph ? [[x0, h, z], [cx - pw, h, z], [cx - pw, h + ph, z], [cx + pw, h + ph, z], [cx + pw, h, z], [x1, h, z]] : [[x0, h, z], [x1, h, z]];
    L(fillet([[x0, 0, z], ...top, [x1, 0, z]], Math.min(FILLET, w * 0.12)), main, 'contour');
    if (near && w > 6 && h > 12) L([[x0 + 0.3, h * 0.62, z], [x1 - 0.3, h * 0.62, z]], acc2, 'ledge', { thin: true, lvl: 0 });
    if (near && above && w > 5 && ((b.seed >>> 3) % 3 === 0)) chevron(L, cx, h + ph, z, Math.min(w * 0.22, 1.8), det2);
  } else if (kind === 'bands') {
    // Deco LEDGE BANDS floor over floor up the upper half (the party show lights them floor by floor), the roofline over them
    roof();
    const n = near ? (h > 22 ? 4 : 3) : 2;
    for (let i = 0; i < n; i++) { const y = h * (0.42 + 0.5 * i / n); L([[x0 + 0.25, y, z], [x1 - 0.25, y, z]], i % 2 ? det2 : acc2, 'ledge', { thin: true, lvl: i }); }
  } else if (kind === 'pilasters') {
    // CORNER PILASTERS full height (the building's frame), the roofline in the accent
    [x0 + 0.22, x1 - 0.22].forEach((x, i) => L([[x, 0, z], [x, h - 0.15, z]], main, 'trim', { lvl: i }));
    L([[x0, h, z], [x1, h, z]], acc2, 'roof');
    if (near && h > 14) L([[x0 + 0.3, h * 0.75, z], [x1 - 0.3, h * 0.75, z]], det2, 'ledge', { thin: true, lvl: 0 });
  } else if (kind === 'fins') {
    roof();
    const fr = w > 10 ? [0.2, 0.4, 0.6, 0.8] : w > 7.5 ? [0.25, 0.5, 0.75] : [0.33, 0.67];
    fr.forEach((k, i) => L([[x0 + w * k, h * 0.5, z], [x0 + w * k, h - 0.4, z]], acc2, 'fin', { thin: true, lvl: i }));
    L([[x0 + 0.3, h * 0.47, z], [x1 - 0.3, h * 0.47, z]], det2, 'ledge', { thin: true, lvl: 0 });
  } else if (kind === 'sunburst') {
    // a Deco SUNBURST fan on the top floor (rays from a point under the roof + its arc), the roofline + a band under it
    roof();
    const hf = Math.min(2.6, h * 0.12), r = Math.min(w * 0.36, hf * 0.92), oy = h - hf - 0.15;
    const arc = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.12 + 0.76 * i / 10); arc.push([cx - Math.cos(a) * r, oy + Math.sin(a) * r, z]); }
    L(arc, acc2, 'crown');
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.2 + 0.6 * i / 4); L([[cx - Math.cos(a) * r * 0.18, oy + Math.sin(a) * r * 0.18, z], [cx - Math.cos(a) * r * 0.8, oy + Math.sin(a) * r * 0.8, z]], det2, 'crown', { thin: true, lvl: i }); }
    L([[x0 + 0.3, oy - 0.5, z], [x1 - 0.3, oy - 0.5, z]], acc2, 'ledge', { thin: true, lvl: 0 });
  } else {
    // a small trim: the roofline (+ on a near building, its corners' top floors)
    roof();
    if (near && w > 4.5 && h > 10 && ((b.seed >>> 6) % 2 === 0)) [x0 + 0.22, x1 - 0.22].forEach((x, i) => L([[x, h * 0.72, z], [x, h - 0.15, z]], acc2, 'trim', { thin: true, lvl: i }));
  }
}
/** a Deco chevron on a parapet (an inverted V, its point up) */
function chevron(L, cx, y, z, cw, role) { L([[cx - cw, y, z], [cx, y + cw * 0.75, z], [cx + cw, y, z]], role, 'crown', { thin: true }); }
const dedupe = pts => pts.filter((p, i) => !i || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1e-6);
/** a setback narrower than this (world units, ~2–3 pt on a phone) is skipped: the tube runs straight up the inner edge */
export const MIN_STEP = 1.1;
/** the radius of a bend (world units): every corner of a contour is rounded, like bent glass */
export const FILLET = 0.8;
/** round every corner of a polyline [[x, y, z]…] with radius r (limited by the legs), a quadratic bend sampled in 6 steps */
export function fillet(pts, r) {
  if (pts.length < 3 || !(r > 0)) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const cross = Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) / Math.max(1e-9, l1 * l2);
    const rr = Math.min(r, l1 * 0.45, l2 * 0.45);
    if (rr < 0.04 || cross < 0.05) { out.push(b); continue; }                 // (a straight joint: nothing to round)
    const p = [b[0] + (a[0] - b[0]) * rr / l1, b[1] + (a[1] - b[1]) * rr / l1, b[2] + (a[2] - b[2]) * rr / l1];
    const q = [b[0] + (c[0] - b[0]) * rr / l2, b[1] + (c[1] - b[1]) * rr / l2, b[2] + (c[2] - b[2]) * rr / l2];
    for (let k = 0; k <= 6; k++) { const u = k / 6, w0 = (1 - u) * (1 - u), w1 = 2 * (1 - u) * u, w2 = u * u; out.push([w0 * p[0] + w1 * b[0] + w2 * q[0], w0 * p[1] + w1 * b[1] + w2 * q[1], w0 * p[2] + w1 * b[2] + w2 * q[2]]); }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
/** a crown traced (world units; the shapes of blocks.js#crown): path = from the top tier's left roof corner over the crown's
 *  steps to its right one (null when the crown is not a closed silhouette), extras = its other tubes (the sunburst's inner
 *  arch + needle, the mast's antenna, THE NEON NEEDLE) */
function crownPath(t, tr) {
  const c = tr.crown, y = tr.y0 + tr.h, z = tr.z0 - 0.05, cx = (tr.x0 + tr.x1) / 2, hw = (tr.x1 - tr.x0) / 2, H = c.h;
  const extras = [];
  const arc = (rx, ry, yc, n = 14) => { const p = []; for (let i = 0; i <= n; i++) { const a = Math.PI + Math.PI * i / n; p.push([cx + Math.cos(a) * rx, yc - Math.sin(a) * ry, z]); } return p; };
  const L0 = [cx - hw, y, z], R0 = [cx + hw, y, z];
  const sym = (half, apex) => [...half, ...(apex ? [apex] : []), ...half.map(([x, yy]) => [2 * cx - x, yy, z]).reverse()];
  let path = null;
  if (c.t === 'sunburst') {
    path = [L0, ...arc(hw, Math.min(hw * 0.95, H * 0.3), y).slice(1, -1), R0];
    const rx = hw * 0.6; extras.push({ pts: arc(rx, Math.min(rx * 0.95, H * 0.3 * 0.8), y + 2 * H * 0.11) });
    extras.push({ pts: [[cx, y + H * 0.3, z], [cx, y + H, z]] });
  } else if (c.t === 'spire') {
    const bw = hw * 0.62;
    path = [L0, [cx - bw, y, z], [cx, y + H * 0.8, z], [cx + bw, y, z], R0];
    if (t.id === 'needle') extras.push({ pts: [[cx, y - 1, z - 0.1], [cx, y + H + (t.needle || 0), z - 0.1]], role: (ROLES.needle || [])[1], needle: true });
  } else if (c.t === 'mast') {
    const dw = hw * 0.62;
    path = sym([L0, [cx - dw, y, z], [cx - dw, y + H * 0.3, z], [cx - dw * 0.55, y + H * 0.42, z]], [cx, y + H * 0.78, z]);
    extras.push({ pts: [[cx, y + H * 0.78, z], [cx, y + H, z]] });
  } else if (c.t === 'pyramid') {
    path = [L0, [cx - hw * 0.72, y + H * 0.27, z], [cx - hw * 0.52, y + H * 0.54, z], [cx - hw * 0.3, y + H * 0.81, z], [cx, y + H, z], [cx + hw * 0.3, y + H * 0.81, z], [cx + hw * 0.52, y + H * 0.54, z], [cx + hw * 0.72, y + H * 0.27, z], R0];
  } else if (c.t === 'dome') {
    path = [L0, [cx - hw * 0.82, y, z], ...arc(hw * 0.74, Math.max(0.5, H * 0.62), y), [cx + hw * 0.82, y, z], R0];
  } else if (c.t === 'stepped') {
    path = sym([L0, [cx - hw, y + H * 0.5, z], [cx - hw * 0.5, y + H * 0.5, z], [cx - hw * 0.5, y + H, z]]);
  } else if (c.t === 'deco') {
    // the word towers' parapet: the full-width bar, the stepped centre (the Deco ziggurat)
    path = sym([L0, [cx - hw, y + H * 0.45, z], [cx - hw * 0.42, y + H * 0.45, z], [cx - hw * 0.42, y + H, z]]);
  } else if (c.t === 'slant') {
    extras.push({ pts: [[cx - hw, y + H, z], [cx + hw, y + H * 0.25, z]] });
  }
  return { path: path && dedupe(path), extras };
}

// ------------------------------------------------------------------ THE SIGNS' SPOTS
// Designed on the reference phone (402×874, pt: x across, y down the screen) at a depth z — each spot is in front of the
// building it hangs on (its host). Converted to world units once with the reference camera, so every upright phone shows the
// same signs scaled to its width (like the skyline) and a wide screen keeps them in its centre group. Checked against the
// layout (tests): on screen, never over a word face, the wheel, the lighthouse or the sign; clear of each other; nothing
// nearer in front.
//   kind: named (a game's NAME + mark; cap = the longest name it takes) · icon (a game's tube mark) · fixed (a text sign:
//   `text`, `col`; none hang now) · billboard (painted, gooseneck lamps; CITY CONTROL changes what it shows). type: vbox
//   (vertical) · box · icon · script.
// Part 4 (the owner's review): the icons are ~20–21 pt (they read at a glance; were 11–18) and stand on the calm walls — the
// near band's corners left and right, under the word tower, on PAR — never in the busy centre (the NEON NEEDLE, the
// sunburst's sign, the wheel, the HOTEL blade breathe), never on the construction tower's face (wordV); the billboard is half
// as big again (66×32) on the left near band's wall. NEON PASS 4: the JAZZ sign is gone (the left corner was cluttered).
export const SPOTS = [
  // (NEON PASS 5 — the owner's glance test: every name >= 10 pt at 390 wide. The roof signs are STACKED — the mark on top, the name
  // across the whole cabinet under it — and take names of up to 6 letters; the longer ones hang as icons or on the billboard)
  { id: 'n-roof', kind: 'named', type: 'box', stack: true, host: 'near', mount: 'roof', x: [29, 85], y: [446, 478], z: 240, cap: 6 },
  // (NEON PASS 5: n-par — PAR's narrow vertical name, 10.5 pt wide between PAR's roof and docked Rosie — is gone: six stacked letters
  // stood 5.7 pt there, and no taller box fits; PAR keeps its two icons)
  // Part 6a (the owner's SIGN PLACEMENT RULE: no sign covers a hero tower's face or outline): the sunburst's named sign is gone
  // and the HOTEL blade with it (its thin letters didn't read) — THE GAME BLADE takes the hotel's spot: a projecting vertical
  // cabinet with chasing bulbs, tonight's game (≤ 6 letters: they stand ~9 pt tall on a phone, the glance test)
  // NEON PASS 3 (the owner: the bulbs fought the letters): a bigger cabinet — the LETTERS win (bigger, brighter tubes on a dark
  // panel), the bulbs on an OUTER FRAME with a dark gap between them and the letters (signs.js#bladeLayout)
  // NEON PASS 4 (the owner: "the blade is partly hidden behind the building in front of it on some nights — the whole word must
  // read"): it was docked ROSIE — her twin stacks + their bulb strings stood over its last letter for her four minutes alongside.
  // She now rests bow-out (core/harbor-boats.js) and the blade ends 2.5 pt over her stern's bulb string (its top 1.5 pt under the
  // hotel's roof): every letter clear, still ≥ 10 pt (signs.js#bladeLayout) — tested against her docked silhouette
  { id: 'n-blade', kind: 'named', type: 'vbox', host: 'hotel', bulbs: true, x: [248, 266], y: [474.5, 552], z: 229.4, cap: 6 },
  { id: 'i-par', kind: 'icon', type: 'icon', host: 'par', x: [309, 329], y: [493, 513], z: 233.6 },
  // (NEON PASS 5, the owner: the small icon left of the Ferris wheel — i-mid, Neon Pass 4's — is gone: 5 named + 6 icons; the
  // game the night leaves without a sign is the one the billboard advertises, and the nightly shuffle rotates it)
  { id: 'i-left', kind: 'icon', type: 'icon', host: 'near', mount: 'roof', x: [5, 25], y: [459, 479], z: 238 },
  { id: 'i-c1', kind: 'icon', type: 'icon', host: 'near', mount: 'wall', x: [269, 289], y: [517, 537], z: 232.1 },
  { id: 'i-r1', kind: 'icon', type: 'icon', host: 'near', mount: 'wall', x: [356, 377], y: [494, 515], z: 235.1 },
  { id: 'i-r2', kind: 'icon', type: 'icon', host: 'near', mount: 'wall', x: [376, 397], y: [524, 545], z: 235.1 },
  // NEON PASS 2 (the owner: no sign on any hero tower's face — the EMPIRE's named sign is gone): a second icon on PAR, under its
  // first (the one plain wall on a phone that passes every rule: tested), so every game still has a sign each night
  { id: 'i-par2', kind: 'icon', type: 'icon', host: 'par', x: [309, 329], y: [522, 542], z: 233.6 },
  // Part 5 (the owner's call): two NAMED ROOF SIGNS on the word towers' roofs, in the open sky above their crowns (they took
  // i-c2 + i-par2 off the crowded right wall) — under the skyline limit, out of the sun corridors, the towers' beacons on top
  // of their frames; while a tower spells a word its roof sign dims (the message is the star). Placed from the tower's own
  // top roof (towerRoofSign), not from reference pt: wpt × hpt is the cabinet at the reference scale.
  { id: 'n-roofA', kind: 'named', type: 'box', stack: true, host: 'wordA', mount: 'tower', wpt: 55, hpt: 31, cap: 6 },
  { id: 'n-roofB', kind: 'named', type: 'box', stack: true, host: 'wordB', mount: 'tower', wpt: 55, hpt: 31, cap: 6 },
  // (NEON PASS 5 — the owner: the billboard's name was small beside its icon: a bigger board, the mark small in its corner, the NAME
  // across the whole board: signs.js#buildBillboard)
  { id: 'bb-left', kind: 'billboard', type: 'billboard', host: 'near', mount: 'wall', x: [6, 71], y: [483, 524], z: 233.1, show: 'rum' },
];
let refCam = null;
const ref = () => refCam || (refCam = cameraFor(REF_TITLE.W, REF_TITLE.H, { tag: REF_TITLE.tag, dock: REF_TITLE.dock }, REF_TITLE.safe));
/** a spot in world units: { x0, x1, y0 (bottom), y1 (top), z } */
export function spotWorld(sp) {
  const c = ref(), X = sx => (sx - c.VPX) * sp.z / c.F, Y = sy => c.CAMH - (sy - c.VPY) * sp.z / c.F;
  return { x0: X(sp.x[0]), x1: X(sp.x[1]), y0: Y(sp.y[1]), y1: Y(sp.y[0]), z: sp.z };
}
/**
 * The spots for a layout: the reference phone's, in world units (+ on a panorama, a named vertical sign on every other extra
 * tower and named roof signs along the near band, so every game gets its name on a wide screen). Each: { ...spot, w: world
 * rect, rect: screen rect (pt) }.
 */
export function signSpots(L, { all = false } = {}) {
  const cam = L.cam, out = SPOTS.map(sp => ({ ...sp, w: sp.mount === 'tower' ? towerRoofSign(L, sp) : spotWorld(sp) })).filter(sp => sp.w);
  // a sign on a tower hangs down the middle of its shaft, never past a setback: centred on the tower, as wide as the narrowest
  // tier it crosses allows
  for (const sp of out) {
    const t = L.towers.find(tt => tt.id === sp.host);
    if (!t || sp.type !== 'vbox') continue;
    const cross = t.tiers.filter(tr => tr.y0 < sp.w.y1 && tr.y0 + tr.h > sp.w.y0);
    if (!cross.length) continue;
    const minW = Math.min(...cross.map(tr => tr.x1 - tr.x0)), cx = (t.tiers[0].x0 + t.tiers[0].x1) / 2, ww = Math.min(sp.w.x1 - sp.w.x0, minW - 1.6);
    sp.w = { ...sp.w, x0: cx - ww / 2, x1: cx + ww / 2, z: cross[cross.length - 1].z0 - 0.4 };
  }
  const rectOf = w => { const [a, b] = project(cam, w.x0, w.y1, w.z), [c, d] = project(cam, w.x1, w.y0, w.z); return { x: a, y: b, w: c - a, h: d - b }; };
  if (cam.wide) {
    // the panorama's towers: a named vertical sign on each, from above the near band's roofs in front of it up the shaft
    const base = [...L.bands.find(b => b.id === 'near').blocks, ...L.heroes];
    let i = 0;
    for (const t of L.towers.filter(t => t.rank === 'pano')) {
      // (on the shaft: the highest tier the sign still fits inside, so it never hangs past a setback)
      const sw = Math.min(4.8, (t.tiers[0].x1 - t.tiers[0].x0) * 0.36), zz = t.tiers[0].z0 - 0.6;
      const inner = t.tiers.filter(q => q.x1 - q.x0 >= sw * 1.5), tr = inner[inner.length - 1] || t.tiers[0], w = tr.x1 - tr.x0, x = tr.x0 + w * (t.x0 < 0 ? 0.72 : 0.28);
      const [sa] = project(cam, x - sw / 2, 0, zz), [sb] = project(cam, x + sw / 2, 0, zz);
      let top = groundOf(cam, zz);
      for (const b of base) { const p = Math.min(project(cam, b.x0, 0, b.z0)[0], project(cam, b.x0, 0, b.z1)[0]), [q0, y] = project(cam, b.x1, b.h, b.z0), q = Math.max(q0, project(cam, b.x1, 0, b.z1)[0]); if (q > sa - 2 && p < sb + 2) top = Math.min(top, y); }
      const y0 = cam.CAMH - (top - 8 - cam.VPY) * zz / cam.F, y1 = Math.min(y0 + sw * 7.6, tr.y0 + tr.h - 1.5);
      if (y1 - y0 > sw * 3.2) out.push({ id: `n-pano${i++}`, kind: 'named', type: 'vbox', host: t.id, cap: Math.floor((y1 - y0) / (sw * 0.78)), w: { x0: x - sw / 2, x1: x + sw / 2, y0, y1, z: zz } });
    }
  }
  for (const s of out) s.rect = rectOf(s.w);
  // on a wide screen the near band is its own (generated across the width): a phone's spot that ends up hidden there is
  // dropped (the panorama's named signs take the games); on a phone every spot is clear (tested)
  return out.filter(s => s.rect.x + s.rect.w > -2 && s.rect.x < cam.W + 2 && (all || !cam.wide || !spotConflicts(L, s, out).length));
}
const groundOf = (cam, z) => cam.VPY + cam.F * cam.CAMH / z;
const ovr = (a, b, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
/** the margin (pt) a roof sign keeps from a sun corridor's edge */
export const CORRIDOR_PAD = 3;
/**
 * A NAMED ROOF SIGN on a tower's top roof (Part 5): its cabinet in world units { x0, x1, y0, y1, z, roof, legs: [x0, x1],
 * beacon: [x, y] } — centred over the roof, in the open sky above the crown (a clearance over the crown's tip for the frame),
 * narrowed so it keeps CORRIDOR_PAD pt clear of every sun corridor, shrunk so its beacon stays under the skyline limit; null
 * when it cannot stand there (less than 60 % of its width or height left).
 */
export function towerRoofSign(L, sp) {
  const cam = L.cam, t = L.towers.find(tt => tt.id === sp.host);
  if (!t || !t.tiers) return null;
  const top = t.tiers[t.tiers.length - 1], roof = top.y0 + top.h, z = top.z0 + Math.min(1.2, (top.z1 - top.z0) * 0.4);
  const crownH = top.crown ? top.crown.h : t.crown ? t.crown.h : 0;
  const u = z / 600;                                  // world units per reference pt at this depth (the city's scale)
  const w = sp.wpt * u;
  let h = sp.hpt * u;
  const cx = (top.x0 + top.x1) / 2;
  let x0 = cx - w / 2, x1 = cx + w / 2;
  // out of the sun corridors (screen): trim the side that reaches into one, then the other side to match (centred on the roof)
  const sxOf = x => project(cam, x, 0, z)[0], xOf = sx => (sx - cam.VPX) * z / cam.F;
  for (const g of L.gaps || []) {
    const a = g.sx - g.w / 2 - CORRIDOR_PAD, b = g.sx + g.w / 2 + CORRIDOR_PAD;
    if (sxOf(x1) <= a || sxOf(x0) >= b) continue;
    if (g.sx < sxOf(cx)) x0 = Math.max(x0, xOf(b)); else x1 = Math.min(x1, xOf(a));
  }
  const half = Math.min(cx - x0, x1 - cx); x0 = cx - half; x1 = cx + half;
  if (x1 - x0 < w * 0.6) return null;
  // the frame lifts it 4 ref pt over the crown's tip; the beacon's post (3 ref pt) stays under the skyline limit
  const y0 = roof + crownH + 4 * u, post = 3 * u;
  const yLimit = cam.CAMH - (cam.limitY + 2 - cam.VPY) * z / cam.F;          // the world height whose top lands on the limit
  if (y0 + h + post > yLimit) h = yLimit - post - y0;
  if (h < sp.hpt * u * 0.6) return null;
  return { x0, x1, y0, y1: y0 + h, z, roof, legs: [top.x0 + 0.4, top.x1 - 0.4], beacon: [cx, y0 + h + post] };
}

/** what a spot conflicts with (→ [] when it is clear): off screen, a word face, the lighthouse, the wheel (an icon may sit
 *  behind its spokes), another spot, anything nearer standing in front of it */
export function spotConflicts(L, sp, spots = []) {
  const cam = L.cam, R = sp.rect, P = (x, y, z) => project(cam, x, y, z), bad = [];
  const rectOf = (x0, x1, y0, y1, z) => { const [a, b] = P(x0, y1, z), [c, d] = P(x1, y0, z); return { x: a, y: b, w: c - a, h: d - b }; };
  if (R.x < 0 || R.x + R.w > cam.W) bad.push('off screen');
  for (const t of L.towers) if (t.word && t.face) { const tr = t.tiers[0], f = rectOf(tr.x0, tr.x1, 0, tr.y0 + tr.h, tr.z0); f.h = t.face.y - f.y; if (ovr(R, f, 1)) bad.push(`the ${t.id} face`); }
  for (const b of lighthouseBoxes(L.lighthouse)) if (ovr(R, rectOf(b.x0, b.x1, b.y0, b.y1, b.z0), 1)) { bad.push('the lighthouse'); break; }
  const w = L.wheel, [cx, cy] = P(w.x, w.y, w.z), r = cam.F * w.r / w.z;
  if (sp.kind !== 'icon' && Math.hypot(Math.max(R.x - cx, 0, cx - (R.x + R.w)), Math.max(R.y - cy, 0, cy - (R.y + R.h))) < r + 2) bad.push('the wheel');
  for (const o of spots) if (o !== sp && o.rect && ovr(R, o.rect, 1)) bad.push(o.id);
  for (const o of [...L.bands.flatMap(b => b.blocks), ...L.heroes, ...L.towers.flatMap(t => t.tiers.map(tr => ({ ...tr, id: t.id })))]) {
    if (o.z0 >= sp.w.z - 0.01 || o.id === sp.host) continue;
    if (ovr(R, rectOf(o.x0, o.x1, o.y0 || 0, (o.y0 || 0) + o.h + (o.crown ? o.crown.h : 0), o.z0), -0.5)) bad.push(`hidden by ${o.id}`);
  }
  return bad;
}

/** tonight's key: the local date of the evening (before noon it is still last night) — the pick changes by day, unlit */
export function nightKey(local) {
  if (!local) return 'x';
  const d = new Date(Date.UTC(local.y, local.m - 1, local.d) - (local.h < 12 ? 86400000 : 0));
  return d.toISOString().slice(0, 10);
}

/**
 * Which game takes which spot tonight. games: [{ id, name, short }] (short: the name a sign spells — the blade word); spots:
 * signSpots(). A new shuffle each night (key): the named spots get the first games whose name fits (cap), the icon spots the
 * rest in order — every game has a sign while there are spots enough (12 games: 4 named + 8 icons on a phone); a game list
 * that grows or shrinks just fills more or fewer spots (an empty spot hangs nothing). → Map(spot id → game id).
 */
export function assignSigns(games, spots, key = 'x') {
  const R = rngFrom(`signs|${key}`);
  const order = shuffle(R, games.map(g => g.id));
  const byId = new Map(games.map(g => [g.id, g]));
  const out = new Map(), used = new Set();
  const named = spots.filter(s => s.kind === 'named'), icons = spots.filter(s => s.kind === 'icon');
  // the named spots, the wide/long ones first (they take the long names)
  for (const s of [...named].sort((a, b) => (b.cap || 0) - (a.cap || 0))) {
    const g = order.find(id => !used.has(id) && (byId.get(id).short || '').replace(/ /g, '').length <= (s.cap || 99));
    if (g) { out.set(s.id, g); used.add(g); }
  }
  for (const s of icons) { const g = order.find(id => !used.has(id)); if (g) { out.set(s.id, g); used.add(g); } }
  return out;
}
export { fxAt };
