// JAYWALK — THE NIGHT LOOK's SHADERS + small pieces (H2 — docs/jaywalk.md "THE NIGHT LOOK"): the lanes' ground (ONE instanced plane a lane,
// drawn in the shader: grass · asphalt + curbs + dashed lines · THE WATER (H5B's add-on: VIDEO-GAME WATER by night too — a clear saturated blue, ripple caps + specks drifting with the lane's current, a bold foam line; BLUE ON THE GROUND = WATER, NOTHING ELSE) · rails + sleepers · the flight path · a landmark's
// paving — the edge columns dimmer, the BLACKOUT's per-lane darkness, the fog), the additive lights (flat on the ground + facing the
// camera — pools, trails, beams, rings, lamps: NO real point light anywhere), the blob shadows, the paint patch (a car's body / the kid's
// hoodie takes its colour; everything else keeps Kenney's), a tiny generated neon environment (the gloss) and THE HALF-RES BLOOM (top tier
// only). Colours in these shaders are DISPLAY values (no colour-space pass): they match the scene's fog colour as the screen shows it.
import * as THREE from 'three';

export const FOG_HEX = 0x0b0716;
/** H5B — THE DAY LOOK's haze (the far lanes fade into it; the day skyline's water meets it) */
export const DAY_FOG_HEX = 0xc6e6f7;   // (H5C — THE FAR EDGE: the day picture's own haze where its sea meets the sky (#87cef4 → #b8e8fb): the far lanes fade into the same air)
export const rgb = hex => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
/** lane kinds as the ground shader counts them */
export const KIND = Object.freeze({ grass: 0, road: 1, water: 2, rail: 3, flight: 4, mark: 5 });

const GROUND_V = `
attribute float aLane; attribute vec4 aKind; attribute vec3 aState;
uniform vec2 uFog;
varying vec2 vP; varying vec4 vKind; varying vec3 vState; varying float vFog; varying float vLane;
void main() {
  vec3 p = vec3(position.x * 46.0, 0.0, -(aLane + 0.5) + position.z);
  vP = vec2(p.x + 4.5, 0.5 - position.z);
  vKind = aKind; vState = aState; vLane = aLane;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vFog = smoothstep(uFog.x, uFog.y, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const GROUND_F = `
precision highp float;
uniform float uTime; uniform vec3 uFogCol; uniform float uQ; uniform float uDay; uniform float uWall;
// (H5B — THE DAY LOOK: every colour below is NIGHT, DAY — uDay 0 | 1; the shapes, the tells, the areas are the same picture in sunlight)
#define DN(n, d) mix(n, d, uDay)
varying vec2 vP; varying vec4 vKind; varying vec3 vState; varying float vFog; varying float vLane;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
// THE AREAS' GROUND (H5A — areas.js: a WHOLE STRETCH looks like the place): what a "grass" lane is there — 1 THE DOCKS' pier planks ·
// 2 THE FISH MARKET's wet cobbles · 3 THE RAIL YARD's gravel · 4 THE BRIDGE's steel deck · 5 DOWNTOWN's sidewalk · 6 THE CANAL's stone
// embankment · 7 THE LIGHTHOUSE's sand + scrub · 8 THE AIRFIELD's apron. Each its own hue — never the asphalt's, never the water's.
float joint(vec2 f, float w) { return smoothstep(0.0, w, f.x) * smoothstep(1.0, 1.0 - w, f.x) * smoothstep(0.0, w * 2.0, f.y) * smoothstep(1.0, 1.0 - w * 2.0, f.y); }
vec3 areaGround(float ar, float x, float z, float seed, float lane) {
  vec3 c;
  if (ar < 1.5) {
    float b = floor(x * 2.5), f = fract(x * 2.5);
    c = DN(vec3(0.170, 0.108, 0.062), vec3(0.76, 0.57, 0.36)) * (mix(0.74, 0.86, uDay) + mix(0.5, 0.24, uDay) * hash(vec2(b, lane)));   // (H5C — by day the boards differ a little, never a patchwork)
    c *= smoothstep(0.0, 0.07, f) * smoothstep(1.0, 0.93, f) * 0.6 + 0.4;
    c *= 0.92 + 0.16 * hash(floor(vec2(x * 40.0, z * 5.0)) + seed);
    c = mix(c, DN(vec3(0.34, 0.33, 0.36), vec3(0.40, 0.33, 0.27)), smoothstep(0.05, 0.02, length(vec2((f - 0.5) * 0.4, abs(z - 0.5) - 0.38))) * 0.8);
  } else if (ar < 2.5) {
    vec2 q = vec2(x * 3.0 + step(0.5, fract(z * 1.5)) * 0.5, z * 3.0), f = fract(q) - 0.5;
    // (H5C — the owner: by DAY warm SANDSTONE cobbles, never a cyan-blue check; by night warm dark stone under the market's lamps —
    //  no cold wet sheen: it must never read as water)
    c = DN(vec3(0.132, 0.108, 0.086), vec3(0.84, 0.72, 0.53)) * (mix(0.74, 0.86, uDay) + mix(0.5, 0.26, uDay) * hash(floor(q) + seed));
    c *= smoothstep(0.5, 0.36, max(abs(f.x), abs(f.y))) * mix(0.7, 0.42, uDay) + mix(0.3, 0.58, uDay);
    c += DN(vec3(0.075, 0.056, 0.036), vec3(0.10, 0.085, 0.05)) * smoothstep(0.26, 0.0, length(f - vec2(-0.12, 0.14)));
  } else if (ar < 3.5) {
    // (H5C — by day the gravel is FINER + CALMER: a small soft grain, a gentle unevenness — never TV static)
    float gs = mix(26.0, 30.0, uDay);   // (the review: the night gravel was still blocky — finer + calmer there too)
    c = DN(vec3(0.120, 0.100, 0.086), vec3(0.66, 0.60, 0.53)) * (mix(0.84, 0.935, uDay) + mix(0.30, 0.12, uDay) * hash(floor(vec2(x * gs, z * gs)) + seed));
    c *= mix(0.86, 0.93, uDay) + mix(0.26, 0.14, uDay) * vnoise(vec2(x * 1.3, z * 1.3 + lane));
  } else if (ar < 4.5) {
    vec2 q = vec2(x / 1.5, z * 2.0);
    c = DN(vec3(0.105, 0.070, 0.078), vec3(0.66, 0.37, 0.33)) * (0.95 + 0.1 * hash(floor(q) + lane));
    c *= joint(fract(q), 0.02) * 0.55 + 0.45;
    c += DN(vec3(0.12, 0.08, 0.08), vec3(0.15, 0.12, 0.10)) * smoothstep(0.1, 0.04, length(abs(fract(vec2(x * 4.0, z * 4.0)) - 0.5) - 0.3));
  } else if (ar < 5.5) {
    vec2 q = vec2(x, z * 2.0);
    c = DN(vec3(0.150, 0.146, 0.185), vec3(0.78, 0.77, 0.78)) * (0.95 + 0.1 * hash(floor(q) + lane * 3.0));   // (the review: no two-tone checker — the slabs differ a little)
    c *= joint(fract(q), 0.025) * 0.5 + 0.5;
  } else if (ar < 6.5) {
    vec2 q = vec2(x * 1.25 + step(0.5, fract(z)) * 0.5, z * 2.0);
    c = DN(vec3(0.150, 0.135, 0.112), vec3(0.76, 0.70, 0.58)) * (0.8 + 0.4 * hash(floor(q) + seed));
    c = mix(DN(vec3(0.045, 0.115, 0.060), vec3(0.33, 0.52, 0.27)), c, joint(fract(q), 0.035));
  } else if (ar < 7.5) {
    // (H5C — SMOOTH sand: soft dunes, faint wind ripples, a fine grain; SCRUB = small soft tufts, a few to a lane (never blotches);
    //  a pebble here and there)
    float lw = mod(lane, 64.0) + z, dune = vnoise(vec2(x * 0.38, lw * 0.5));
    c = DN(vec3(0.200, 0.170, 0.108), vec3(0.95, 0.86, 0.63)) * (0.93 + 0.12 * dune);
    c *= 0.985 + 0.035 * smoothstep(0.35, 0.65, vnoise(vec2(x * 1.6 + dune * 2.0, lw * 9.0)));
    c *= 0.975 + 0.05 * hash(floor(vec2(x * 24.0, z * 24.0)) + seed);
    vec2 sq = vec2(x * 1.6, lw * 1.6), si = floor(sq), sf = fract(sq) - 0.5;
    vec2 so = (vec2(hash(si + 1.7), hash(si + 9.1)) - 0.5) * 0.5;
    float scr = step(0.74, hash(si + 5.3)) * smoothstep(0.25, 0.08, length((sf - so) * vec2(1.0, 1.35)));
    c = mix(c, DN(vec3(0.060, 0.150, 0.082), vec3(0.43, 0.63, 0.30)) * (0.88 + 0.24 * hash(si)), scr * 0.92);
    vec2 pq = vec2(x * 4.0, lw * 4.0);
    c = mix(c, DN(vec3(0.085, 0.09, 0.105), vec3(0.64, 0.61, 0.58)), step(0.95, hash(floor(pq) + 2.2)) * smoothstep(0.2, 0.09, length(fract(pq) - 0.5)) * 0.85);
  } else {
    vec2 q = vec2(x / 3.0, z);
    c = DN(vec3(0.138, 0.136, 0.150), vec3(0.72, 0.72, 0.73)) * (0.96 + 0.08 * hash(floor(q) + lane));
    c *= smoothstep(0.0, 0.012, fract(q.x)) * smoothstep(1.0, 0.988, fract(q.x)) * 0.45 + 0.55;
    c = mix(c, DN(vec3(0.80, 0.62, 0.10), vec3(1.0, 0.80, 0.08)), smoothstep(0.035, 0.015, abs(z - 0.13)) * mix(0.7, 0.95, uDay));   // (a solid taxi line along its foot — never a road's dashed centre line)
  }
  return c;
}
void main() {
  float type = vKind.x, dn = vKind.y, up = vKind.z, seed = vKind.w, x = vP.x, z = vP.y, ar = vState.z;
  vec3 c;
  if (type < 0.5 || type > 4.5) {
    // THE GRASS (H5C — the owner: never a pixel checkerboard): soft NATURAL variation — larger light / dark patches that run on across
    // the lanes, faint MOWN STRIPES a column wide (they also show the columns), a soft blade grain, small tufts' flecks. Night + day.
    float lw = mod(vLane, 64.0) + z;
    float pat = vnoise(vec2(x * 0.42, lw * 0.42) + 3.0);
    c = mix(DN(vec3(0.064, 0.192, 0.092), vec3(0.285, 0.59, 0.195)), DN(vec3(0.088, 0.242, 0.112), vec3(0.385, 0.705, 0.25)), smoothstep(0.15, 0.85, pat));
    c *= 1.0 + (smoothstep(0.44, 0.56, abs(fract(x * 0.5) - 0.5) * 2.0) - 0.5) * mix(0.06, 0.075, uDay);
    c *= 0.975 + 0.05 * hash(floor(vec2(x * 19.0, lw * 19.0)));
    vec2 tq = vec2(x * 3.0, lw * 3.0); float th = hash(floor(tq) + 3.7);
    c *= 1.0 - 0.2 * step(0.87, th) * smoothstep(0.17, 0.05, length(fract(tq) - 0.5 - (vec2(fract(th * 37.0), fract(th * 91.0)) - 0.5) * 0.5));
    if (ar > 0.5) c = areaGround(ar, x, z, seed, vLane);
    if (type > 4.5) {                                             // a LANDMARK's lane: dark paving, a neon trim on both edges
      c = DN(vec3(0.105, 0.10, 0.15), vec3(0.80, 0.78, 0.72)) * (0.95 + 0.08 * hash(floor(vec2(x * 2.0, z * 2.0)) + seed)) * (joint(fract(vec2(x * 2.0, z * 2.0)), 0.03) * 0.22 + 0.78);   // (H5C: paving slabs + their joints — never a checker)
      float trim = smoothstep(0.05, 0.02, abs(z - 0.08)) + smoothstep(0.05, 0.02, abs(z - 0.92));
      c = mix(c + vec3(1.0, 0.25, 0.72) * trim * 0.75 * (1.0 - uDay), vec3(0.93, 0.30, 0.26), min(1.0, trim) * 0.9 * uDay);   // (by day: a PAINTED trim)
    }
    float soft = step(0.5, dn) * step(dn, 4.5), softU = step(0.5, up) * step(up, 4.5);
    float sk = mix(0.45, 0.16, uDay);
    c *= 1.0 - sk * (1.0 - smoothstep(0.0, 0.22, z)) * soft - sk * (1.0 - smoothstep(0.0, 0.22, 1.0 - z)) * softU;
  } else if (type < 1.5) {
    // (by day: CLEAN GREY asphalt, white + yellow paint — H5C: a FINE grain + a faint wear, never blocky)
    float ag = mix(16.0, 42.0, uDay);
    c = DN(vec3(0.062, 0.062, 0.086), vec3(0.36, 0.37, 0.40)) * (mix(0.92, 0.966, uDay) + mix(0.16, 0.068, uDay) * hash(floor(vec2(x * ag, z * ag))));
    c *= 1.0 + uDay * 0.06 * (vnoise(vec2(x * 0.8, (mod(vLane, 64.0) + z) * 2.2)) - 0.5);
    float curbD = step(0.5, abs(dn - 1.0)), curbU = step(0.5, abs(up - 1.0));
    float cd = (1.0 - smoothstep(0.075, 0.095, z)) * curbD, cu = (1.0 - smoothstep(0.075, 0.095, 1.0 - z)) * curbU;
    c *= 1.0 - 0.35 * (smoothstep(0.26, 0.09, z) * curbD + smoothstep(0.26, 0.09, 1.0 - z) * curbU);
    c = mix(c, DN(vec3(0.27, 0.26, 0.34), vec3(0.84, 0.83, 0.80)) * (0.8 + 0.4 * step(fract(x * 1.0), 0.94)), max(cd, cu));
    float b = vLane + step(0.5, z);
    float dash = step(fract(x * 0.5 + b * 0.37), 0.52);
    float ln = smoothstep(0.04, 0.012, z) * (1.0 - curbD) + smoothstep(0.04, 0.012, 1.0 - z) * (1.0 - curbU);
    vec3 neon = mod(b, 2.0) < 0.5 ? DN(vec3(1.0, 0.62, 0.9), vec3(1.0, 0.84, 0.20)) : DN(vec3(0.93, 0.86, 1.0), vec3(0.97, 0.97, 0.95));   // (H5B's add-on: the second line pale lilac — never cyan: blue on the ground = water)
    c = mix(c, neon * mix(0.62, 1.0, uDay), dash * ln);
  } else if (type < 2.5) {
    // THE WATER (H4 — the owner, Nov 16: CALM, real-looking night water — no electric zigzags): a deep night blue, navy in the troughs →
    // teal on the swell; soft UNEVEN ripples (the contour lines of two slow drifting noise fields — never a sine stripe); gentle broken
    // reflections of the skyline's neon + a few small moving glints of it; a thin soft foam line at the banks. Still unmistakably water
    // beside the grass + the road: the only blue ground, the only one that moves.
    // H5B's add-on (the owner, Nov 16 9:10 pm — after a 4-player match with family): BLUE ON THE GROUND = WATER, NOTHING ELSE, and the
    // water is VIDEO-GAME WATER by night too (readability beats realism: H4's navy read as a dark glass strip) — a clear saturated
    // blue, the brightest + bluest ground in view (night #1a6fe0 → #3fb0ff on the swells · day #2f9cff → #6cc8ff: the same identity,
    // brighter); white-ish ripple caps + specks DRIFTING WITH THE CURRENT (vState.y = the lane's own flow in cells a second — the way
    // its logs go: the flow reads); a BOLD bright foam line at both banks; the neon's reflections kept, small.
    float t = uTime, flow = vState.y, xf = x - flow * t;          // (xf: the surface, carried by the current)
    vec2 q = vec2(xf * 0.85, z * 2.4) + seed * 5.0;
    float n1 = vnoise(q + vec2(0.0, -t * 0.06));
    float n2 = vnoise(q * 2.1 + vec2(0.0, t * 0.05) + 17.0);
    float n3 = vnoise(q * 4.6 + vec2(0.0, t * 0.09) + 41.0);
    float w = clamp(0.58 * n1 + 0.42 * n2, 0.0, 1.0);
    c = mix(DN(vec3(0.102, 0.435, 0.878), vec3(0.184, 0.612, 1.0)), DN(vec3(0.247, 0.690, 1.0), vec3(0.424, 0.784, 1.0)), w * w * 1.25);
    // the ripple caps: thin white-ish lines along the swell's contours, broken up by a finer field — uneven; they ride the current
    float rip = smoothstep(0.075, 0.0, abs(n2 - 0.52)) * smoothstep(0.34, 0.66, n3) + 0.5 * smoothstep(0.06, 0.0, abs(n1 - 0.46)) * smoothstep(0.45, 0.72, n2);
    c += vec3(0.62, 0.74, 0.78) * rip * mix(0.44, 0.34, uDay);
    // the specks: small white flecks carried along by the current, each coming + going to its own slow beat (every tier: the flow must read)
    vec2 sp = vec2(xf * 4.0, z * 4.0), sid = floor(sp);
    float sh = hash(sid + seed * 13.0);
    float gl = step(0.80, sh) * smoothstep(0.1, 1.0, sin(t * (0.9 + sh * 1.5) + sh * 40.0)) * smoothstep(0.30, 0.04, length((fract(sp) - 0.5) * vec2(0.55, 1.0)));
    c += vec3(0.86, 0.95, 1.0) * gl * mix(0.78, 0.95, uDay);
    if (uQ > 0.5) {
      // the neon's reflections, kept SMALL: short soft columns of the skyline's pink + violet lying on the water, broken by the swell (night)
      float sx = xf * 0.7 + seed * 3.1 + (n1 - 0.5) * 0.5, id = floor(sx), f = fract(sx) - 0.5;
      float colm = smoothstep(0.30, 0.04, abs(f)) * step(0.55, hash(vec2(id, seed))) * smoothstep(0.35, 0.8, n2);
      vec3 neon = hash(vec2(id + 3.0, seed)) < 0.5 ? vec3(1.0, 0.30, 0.75) : vec3(0.62, 0.40, 1.0);
      c += neon * colm * 0.10 * (1.0 - uDay);
    }
    // THE BANKS: a BOLD bright foam line + a paler shallow where the water meets anything that is not water
    float shD = step(0.5, abs(dn - 2.0)), shU = step(0.5, abs(up - 2.0));
    float lap = 0.014 * (n3 - 0.5) + 0.006 * sin(xf * 3.1 + seed);
    float foam = max(smoothstep(0.115 + lap, 0.070 + lap, z) * shD, smoothstep(0.115 + lap, 0.070 + lap, 1.0 - z) * shU);
    c += vec3(0.10, 0.16, 0.10) * (smoothstep(0.30, 0.0, z) * shD + smoothstep(0.30, 0.0, 1.0 - z) * shU);
    c = mix(c, vec3(1.0), min(1.0, foam * (0.78 + 0.22 * n3)));
  } else if (type < 3.5) {
    float bs = mix(28.0, 30.0, uDay);   // (H5C — the ballast's grain is finer + calmer, night + day)
    c = DN(vec3(0.088, 0.078, 0.09), vec3(0.58, 0.53, 0.47)) * (mix(0.9, 0.93, uDay) + mix(0.18, 0.13, uDay) * hash(floor(vec2(x * bs, z * bs))));
    float sl = step(fract(x * 2.0), 0.3) * step(0.17, z) * step(z, 0.83);
    c = mix(c, DN(vec3(0.21, 0.135, 0.085), vec3(0.43, 0.29, 0.18)), sl);
    float r = max(smoothstep(0.04, 0.016, abs(z - 0.33)), smoothstep(0.04, 0.016, abs(z - 0.67)));
    c = mix(c, DN(vec3(0.50, 0.53, 0.64), vec3(0.84, 0.86, 0.90)), r);
    // the tell: the rails catch the red signals (by day: the lane itself FLASHES red — still bold in sunlight)
    c = mix(c + vec3(0.85, 0.05, 0.07) * vState.y * (0.16 + 0.6 * r) * (1.0 - uDay), vec3(0.98, 0.10, 0.08), vState.y * (0.2 + 0.7 * r) * uDay);
  } else {
    c = DN(vec3(0.088, 0.086, 0.104), vec3(0.46, 0.47, 0.50)) * (0.97 + 0.06 * hash(floor(vec2(x * 36.0, z * 36.0))));   // (by day: the PAINTED runway — a fine grain)
    float cl = step(fract(x * 0.5 + 0.25), 0.5) * smoothstep(0.035, 0.015, abs(z - 0.5));
    c = mix(c, DN(vec3(0.66, 0.63, 0.58), vec3(0.97, 0.97, 0.94)), cl * mix(0.55, 0.92, uDay));
    // (by day: white piano keys at both edges — a runway, never a road)
    c = mix(c, vec3(0.97, 0.97, 0.94), uDay * 0.9 * step(fract(x * 2.0), 0.5) * (smoothstep(0.11, 0.09, z) + smoothstep(0.11, 0.09, 1.0 - z)) * step(0.03, z) * step(z, 0.97));
    float fx = abs(vState.y);
    if (fx > 0.001) {                                             // the tell: a bright band RACES to the crossing, faster and faster
      float xx = vState.y > 0.0 ? x : 9.0 - x;
      float head = fract(fx * fx * 7.0 + fx * 2.0) * 14.0 - 2.5;
      float band = smoothstep(4.0, 0.0, head - xx) * step(xx, head);
      float chev = step(fract(xx * 1.2 + abs(z - 0.5) * 1.4), 0.5);
      // (H5B's add-on: the runway's tell is AMBER by night too — a blue lane read as water)
      c += (vec3(1.0, 0.66, 0.14) * band * (0.35 + 0.5 * chev) + vec3(0.30, 0.15, 0.02) * fx) * (1.0 - uDay);
      // (by day — THE TELL MUST READ IN SUNLIGHT (the go-live review: yellow on the light runway was low-contrast): within the
      //  tell's first sixth the WHOLE lane turns to AMBER-ON-DARK hazard chevrons that march slowly to the crossing, and the racing
      //  band is the same chevrons at full contrast — near-black + yellow-white. Never the red of the rail lane's tell.)
      float tl = clamp(fx * 6.0, 0.0, 1.0);
      float chd = step(fract(xx * 1.2 + abs(z - 0.5) * 1.4 - fx * 3.0), 0.5);
      c = mix(c, mix(vec3(0.075, 0.07, 0.10), vec3(1.0, 0.64, 0.04), chd), 0.66 * tl * uDay);
      c = mix(c, mix(vec3(0.04, 0.035, 0.05), vec3(1.0, 0.94, 0.38), chd), clamp(band * 1.4, 0.0, 1.0) * uDay);
    }
  }
  // THE WIDER VIEW: the edge columns a step dimmer, the ground beyond them dimmer still
  float inner = smoothstep(-0.14, 0.1, x) * smoothstep(9.14, 8.9, x);
  float outer = smoothstep(-2.6, -1.0, x) * smoothstep(11.6, 10.0, x);
  c *= mix(mix(mix(0.30, 0.60, uDay), mix(0.52, 0.80, uDay), outer), 1.0, inner);
  // THE BLACKOUT: this lane's lights dying (a cold flicker as it goes), then dead
  float dk = vState.x;
  float fl = dk > 0.02 && dk < 0.98 ? step(hash(vec2(floor(uTime * 14.0), vLane)), 0.35 + dk * 0.5) : 0.0;
  if (uDay > 0.5) {
    // THE FOG BANK (the blackout by day — the same lanes, the same timing): the lane whitens under a rolling bank, soft wisps at its edge
    // H5C (the owner: never a flat slab, never a hard line): the bank's edge is measured PER PIXEL off the wall itself (uWall — not
    // lane by lane): soft + ragged (two drifting noise fields), the lane still seen THROUGH its first metre, solid two lanes in —
    // and a cool shadow lies on the ground in front of it
    // (only the pixels NEAR the wall pay for the noise: ahead of its shadow nothing is done, deep inside it is simply fog)
    float ly = vLane + z, d = uWall - ly;
    if (d > 3.4) c = vec3(0.875, 0.906, 0.933) * 0.98;
    else if (d > -3.4) {
      float bn = 0.62 * vnoise(vec2(x * 0.42 + uTime * 0.21, ly * 0.8 - uTime * 0.05)) + 0.38 * vnoise(vec2(x * 1.25 - uTime * 0.33, ly * 1.9 + 7.0));
      float thin = smoothstep(-1.5, 0.7, d + (bn - 0.5) * 1.9);
      float fogA = thin * mix(0.5, 1.0, smoothstep(0.1, 2.1, d));
      c *= 1.0 - 0.2 * smoothstep(-3.2, -0.3, d) * (1.0 - thin);
      // (the go-live review — the fog's banding: the mottle fades OUT before d = 3.4, where the plain fog begins — the two met in a
      //  straight line of up to 5 % brightness)
      c = mix(c, vec3(0.875, 0.906, 0.933) * (0.98 + 0.1 * (bn - 0.5) * (1.0 - smoothstep(1.8, 3.3, d))), clamp(fogA, 0.0, 1.0));
    }
  } else {
    // THE BLACKOUT's edge (H5C — the review: "a ruler-straight cut to black"): per pixel off the wall itself, soft + ragged (two drifting
    // noise fields) — the lights still die lane by lane (the flicker), but the dark's edge is never a straight line; the cold violet
    // glow rides its ragged lip
    // (only the pixels NEAR the wall pay for the noise: ahead of it nothing is done, behind it the lane is simply dark)
    float ly = vLane + z, d = uWall - ly;
    if (d > 1.5) c = vec3(0.012, 0.016, 0.03) + c * 0.05;
    else if (d > -1.7) {
      float e = d + (0.6 * vnoise(vec2(x * 0.5 + uTime * 0.12, ly * 0.9 + uTime * 0.07)) + 0.4 * vnoise(vec2(x * 1.4 - uTime * 0.2, ly * 2.1 + 5.0)) - 0.5) * 1.7;
      float dkp = smoothstep(-0.75, 0.55, e);
      c = mix(c, vec3(0.012, 0.016, 0.03) + c * 0.05, clamp(dkp + fl * 0.35, 0.0, 1.0));
      c += vec3(0.42, 0.28, 0.80) * smoothstep(0.5, 0.0, abs(e + 0.25)) * 0.36 * (1.0 - dkp * 0.6);
    }
  }
  c = mix(c, uFogCol, vFog);
  gl_FragColor = vec4(c, 1.0);
}`;

/** the lanes' ground: n instanced planes. → { mesh, lay(k, lane, kind, down, up, seed, dark, fx, area), done(n), uniforms } */
export function createGround(n, fog) {
  const base = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.attributes.position);
  const lane = new Float32Array(n), kind = new Float32Array(n * 4), state = new Float32Array(n * 3);
  const aL = new THREE.InstancedBufferAttribute(lane, 1), aK = new THREE.InstancedBufferAttribute(kind, 4), aS = new THREE.InstancedBufferAttribute(state, 3);
  for (const a of [aL, aK, aS]) a.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('aLane', aL); g.setAttribute('aKind', aK); g.setAttribute('aState', aS);
  const uniforms = { uTime: { value: 0 }, uFog: { value: fog }, uFogCol: { value: new THREE.Vector3(...rgb(FOG_HEX)) }, uQ: { value: 1 }, uDay: { value: 0 }, uWall: { value: -99 } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: GROUND_V, fragmentShader: GROUND_F, uniforms }));
  mesh.frustumCulled = false; mesh.renderOrder = -1;
  return {
    mesh, uniforms,
    lay(k, i, t, dn, up, seed, dark, fx, ar = 0) { lane[k] = i; kind[k * 4] = t; kind[k * 4 + 1] = dn; kind[k * 4 + 2] = up; kind[k * 4 + 3] = seed; state[k * 3] = dark; state[k * 3 + 1] = fx; state[k * 3 + 2] = ar; },   // (ar — H5A: the lane's AREA, 0 = the opening · 1 … 8)
    done(c) { g.instanceCount = c; aL.needsUpdate = aK.needsUpdate = aS.needsUpdate = true; },
    dispose() { g.dispose(); base.dispose(); mesh.material.dispose(); },
  };
}

// THE FAR HAZE BY THE GROUND (H5C — the review: "the ground fades out before the things standing on it — trucks, trees, containers
// hang as pale ghosts"): three's fog reads a fragment's own depth, and from this camera a thing's top is NEARER than the ground it stands
// on. So every lit material adds its height back (uFogUp = how much nearer a unit of height is: −the camera's forward y) — a thing fades
// exactly as the ground under it does.
export const FOG_UP = { value: 0.72 };
const FOG_UP_V = `#ifdef USE_FOG
  vec4 jwW = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    jwW = instanceMatrix * jwW;
  #endif
  vFogDepth = -mvPosition.z + uFogUp * (modelMatrix * jwW).y;
#endif`;
const fogPatch = sh => { sh.uniforms.uFogUp = FOG_UP; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uFogUp;').replace('#include <fog_vertex>', FOG_UP_V); };
/** a plain lit material whose fog follows the ground under the thing */
export function fogUp(mat) { mat.onBeforeCompile = fogPatch; mat.customProgramCacheKey = () => 'jw-fogup'; return mat; }

// ---- THE LIGHTS: additive quads (flat on the ground, or facing the camera) + the blob shadows — ONE material each, the shape picked per instance
const GLOW_V = `
attribute vec2 aFx;
uniform vec2 uFog; uniform float uBill; uniform float uFogUp;
varying vec2 vUv; varying vec3 vCol; varying vec2 vFx; varying float vFog; varying float vY;
void main() {
  vUv = uv; vFx = aFx; vY = 1.0;
  #ifdef USE_INSTANCING_COLOR
    vCol = instanceColor;
  #else
    vCol = vec3(1.0);
  #endif
  vec4 mv;
  if (uBill > 0.5) {
    mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
    vY = dot(viewMatrix[1].xyz, mv.xyz) + cameraPosition.y;   // (this corner's height over the ground — shape 10 fades into it)
  } else mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vFog = smoothstep(uFog.x, uFog.y, -mv.z + uFogUp * (modelMatrix * instanceMatrix * vec4(uBill > 0.5 ? vec3(0.0) : position, 1.0)).y);
  gl_Position = projectionMatrix * mv;
}`;
const GLOW_F = `
precision highp float;
uniform float uDay;
varying vec2 vUv; varying vec3 vCol; varying vec2 vFx; varying float vFog; varying float vY;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float s = vFx.x, a, d = length(p);
  if (s < -0.5) {                                                                                                // −1 THE TAIL POOL (H5C): an oval that STARTS at u = 0 (the lamps — hot there), stretching + fading away behind
    float u = vUv.x; vec2 q = vec2(u < 0.3 ? (0.3 - u) / 0.3 * 0.72 : (u - 0.3) / 0.7, p.y);
    a = smoothstep(1.0, 0.0, length(q)); a = a * sqrt(a) * (1.0 + 1.2 * smoothstep(0.5, 0.0, u)) * (1.0 - 0.45 * u);
  }
  else if (s < 0.5) { a = smoothstep(1.0, 0.0, d); a *= a; }                                                     // 0 a soft round glow
  else if (s < 1.5) { float u = vUv.x, w = mix(0.06, 1.0, u); a = smoothstep(w, w * 0.15, abs(p.y)) * u * u; }    // 1 a tapered ribbon (bright at u = 1)
  else if (s < 2.5) { float u = vUv.x, w = mix(0.22, 1.0, u); a = smoothstep(w, 0.0, abs(p.y)) * (1.0 - u) * (1.0 - u * 0.4); }   // 2 a beam (from u = 0)
  else if (s < 3.5) { a = smoothstep(0.16, 0.0, abs(d - 0.8)); }                                                  // 3 a ring
  else if (s < 4.5) { a = smoothstep(1.0, 0.15, abs(p.y)) * smoothstep(1.0, 0.8, abs(p.x)); }                     // 4 a soft line along x
  else if (s < 5.5) { a = smoothstep(0.42, 0.3, d) + 0.6 * smoothstep(1.0, 0.0, d) * smoothstep(1.0, 0.0, d); }   // 5 a lamp: a hot core + its halo
  else if (s < 6.5) { float u = vUv.x, w = mix(0.4, 1.0, u), e = smoothstep(w, 0.0, abs(p.y)); a = e * e * (1.0 - u) * (1.0 - u * u) * smoothstep(0.0, 0.07, u); }   // 6 a SHORT SOFT beam (a headlight's glow on the road: a quick falloff, soft edges)
  // 10 A FOG PUFF (the go-live review — the fog bank's banded streaks: a camera-facing puff was CUT by the ground where it leaned
  //    into it — a hard horizontal line across every puff): the soft round glow, FADING OUT into the ground over its last metre,
  //    dithered (a wide near-white gradient steps in 8 bits)
  else if (s > 9.5) { a = smoothstep(1.0, 0.0, d); a *= a * smoothstep(0.03, 1.15, vY); a += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.012 * step(0.004, a); }
  else if (s > 8.5) { float w = mix(1.0, 0.3, vUv.y); a = smoothstep(w, w * 0.3, abs(p.x)) * (0.5 + 0.5 * vUv.y) * smoothstep(0.0, 0.07, vUv.y) * smoothstep(1.0, 0.93, vUv.y); }   // 9 a BEAM standing up (H6A — a bill: narrow at its top, wide at its foot)
  else { float asp = max(1.0, (s - 7.0) * 10.0); vec2 q = vec2(abs(p.x) * asp - (asp - 1.0), p.y); a = smoothstep(0.2, 0.0, abs(length(vec2(max(q.x, 0.0), q.y)) - 0.78)); }   // 7 + aspect / 10: a thin STADIUM ring (the waterline round a log — its quad is that many times longer than wide)
  #ifdef JW_SHADOW
    gl_FragColor = vec4(vec3(0.03, 0.07, 0.17) * uDay, a * vFx.y * (1.0 - vFog));   // (H5C — by day a shadow is COOL, never plain black: the sky fills it)
  #else
    // (H5B — BY DAY a light is PAINT: the same shapes, alpha-blended in their own colour (the material's blending is switched with
    //  uDay — night.js#setLook): a red signal stays red on a sunlit lane instead of washing out to white)
    float k = a * vFx.y * (1.0 - vFog);
    if (uDay > 0.5) gl_FragColor = vec4(vCol, clamp(k, 0.0, 1.0)); else gl_FragColor = vec4(vCol * k, 1.0);
  #endif
}`;
/** bill: 1 = the quad faces the camera · shadow: black, alpha-blended (the blob shadows) */
export function glowMaterial(fog, { bill = false, shadow = false } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: GLOW_V, fragmentShader: GLOW_F, uniforms: { uFog: { value: fog }, uBill: { value: bill ? 1 : 0 }, uDay: { value: 0 }, uFogUp: FOG_UP },
    defines: shadow ? { JW_SHADOW: 1 } : {}, transparent: true, depthWrite: false,
    blending: shadow ? THREE.NormalBlending : THREE.AdditiveBlending,
  });
}

const SKIN_V = `attribute float bone; attribute vec4 aKid; uniform highp sampler2D uPose;
mat4 jwRow(int y) {
  int x = int(bone + 0.5) * 3;
  vec4 a = texelFetch(uPose, ivec2(x, y), 0), b = texelFetch(uPose, ivec2(x + 1, y), 0), c = texelFetch(uPose, ivec2(x + 2, y), 0);
  return mat4(a.x, b.x, c.x, 0.0, a.y, b.y, c.y, 0.0, a.z, b.z, c.z, 0.0, a.w, b.w, c.w, 1.0);
}
mat4 jwPose(float row) { float f = fract(row); int y = int(floor(row)); return jwRow(y) * (1.0 - f) + jwRow(y + 1) * f; }`;
/** THE PAINT PATCH on a lit material: vertices marked `paint` take the tint (an instance's colour, or uTint) by their own brightness; the
 *  rest keep their vertex colours; `lit` (0 … 1 — the blackout, the dim edge columns) scales both. */
export function paintMaterial(mat, { instanced = false, rim = false, skin = null, fade = false } = {}) {
  const u = { uTint: { value: new THREE.Color(0xffffff) }, uLit: { value: 1 }, uRim: { value: new THREE.Color(0x000000) }, uPose: { value: skin } };
  mat.vertexColors = true;
  mat.onBeforeCompile = sh => {
    fogPatch(sh);
    sh.uniforms.uTint = u.uTint; sh.uniforms.uLit = u.uLit;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float paint;\n${skin ? SKIN_V : instanced ? 'attribute float aLit;' : 'uniform vec3 uTint; uniform float uLit;'}`)
      .replace('#include <color_vertex>', instanced
        ? `vColor = mix(color, instanceColor * (0.22 + 1.6 * dot(color, vec3(0.299, 0.587, 0.114))), paint) * ${skin ? 'mod(aKid.x, 8.0)' : 'aLit'};${fade ? ' vJwA = 1.0 - 0.68 * floor(aKid.x / 8.0) / 15.0;' : ''}`
        : 'vColor = mix(color, uTint * (0.22 + 1.6 * dot(color, vec3(0.299, 0.587, 0.114))), paint) * uLit;');
    // THE KID's SKIN (H5A): every vertex follows ONE bone; a pose = a row of the pose texture (models.js#loadKid). An instance blends
    // two poses — aKid = (lit, row A, row B, how far to B), each row a frame + a fraction to the next: idle → the jump → the splay
    if (skin) {
      sh.uniforms.uPose = u.uPose;
      sh.vertexShader = sh.vertexShader
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nmat4 jwM = jwPose(aKid.y) * (1.0 - aKid.w) + jwPose(aKid.z) * aKid.w;\nobjectNormal = mat3(jwM) * objectNormal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = (jwM * vec4(transformed, 1.0)).xyz;');
    }
    // A GHOST's OWN FADE (H5B's add-on — NEAR YOU = FAINT): an instance's alpha, packed with its light — aKid.x = lit (< 8) + 8 × the
    // fade in 16 steps: 0 = the ghost as it is · 15 = a faint see-through outline (≈ 15 %)
    if (fade) {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vJwA;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vJwA;').replace('#include <opaque_fragment>', 'diffuseColor.a *= vJwA;\n#include <opaque_fragment>');
    }
    // THE RIM (the kid — H2B: he always stands out): a light of his own on every edge that turns away from the camera
    if (rim) {
      sh.uniforms.uRim = u.uRim;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uRim;')
        .replace('#include <opaque_fragment>', 'outgoingLight += uRim * pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.6);\n#include <opaque_fragment>');
    }
  };
  mat.customProgramCacheKey = () => `jw-paint-${instanced ? 'i' : 'u'}${rim ? 'r' : ''}${skin ? 's' : ''}${fade ? 'f' : ''}`;
  mat.userData.u = u;
  return mat;
}

/** a cheap generated neon environment (the gloss on the cars + the kid): a dark sky, a pink + a cyan + a violet glow low on the horizon */
export function neonEnv(renderer) {
  const W = 64, H = 32, d = new Uint8Array(W * H * 4);
  const blobs = [[0.12, 0.52, 255, 60, 190, 0.16], [0.42, 0.5, 40, 200, 255, 0.14], [0.68, 0.53, 150, 90, 255, 0.15], [0.9, 0.5, 255, 150, 60, 0.08], [0.5, 0.1, 150, 160, 220, 0.22]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 6, g = 5, b = 14;
    for (const [bx, by, cr, cg, cb, rad] of blobs) {
      let dx = Math.abs(x / W - bx); dx = Math.min(dx, 1 - dx);
      const k = Math.max(0, 1 - Math.hypot(dx, (y / H - by) * 1.6) / rad), f = k * k;
      r += cr * f; g += cg * f; b += cb * f;
    }
    const o = (y * W + x) * 4; d[o] = Math.min(255, r); d[o + 1] = Math.min(255, g); d[o + 2] = Math.min(255, b); d[o + 3] = 255;
  }
  const tex = new THREE.DataTexture(d, W, H, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const gen = new THREE.PMREMGenerator(renderer), env = gen.fromEquirectangular(tex).texture;
  gen.dispose(); tex.dispose();
  return env;
}

/** H5B — THE DAY LOOK's environment (the gloss on the cars + the kid by day): a clear blue sky, a bright horizon, the sun high on
 *  one side, warm ground light from below */
export function dayEnv(renderer) {
  const W = 64, H = 32, d = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = y / (H - 1), up = Math.max(0, 1 - v * 2), dn = Math.max(0, v * 2 - 1);   // (v 0 = straight up · 0.5 = the horizon · 1 = down)
    let r = 250 - up * 140 - dn * 90, g = 252 - up * 80 - dn * 100, b = 255 - up * 12 - dn * 150;
    let dx = Math.abs(x / W - 0.3); dx = Math.min(dx, 1 - dx);
    const s = Math.max(0, 1 - Math.hypot(dx, (v - 0.2) * 1.4) / 0.12), f = s * s;
    r += 120 * f; g += 110 * f; b += 60 * f;
    const o = (y * W + x) * 4; d[o] = Math.min(255, r); d[o + 1] = Math.min(255, g); d[o + 2] = Math.min(255, b); d[o + 3] = 255;
  }
  const tex = new THREE.DataTexture(d, W, H, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const gen = new THREE.PMREMGenerator(renderer), env = gen.fromEquirectangular(tex).texture;
  gen.dispose(); tex.dispose();
  return env;
}

// ---- THE HALF-RES BLOOM (top tier only): the LIGHTS alone (layer 1) drawn into a half-res target, blurred at a quarter, added back on top
const BLUR_F = `
precision highp float;
uniform sampler2D tMap; uniform vec2 uStep; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tMap, vUv).rgb * 0.227;
  c += (texture2D(tMap, vUv + uStep * 1.385).rgb + texture2D(tMap, vUv - uStep * 1.385).rgb) * 0.316;
  c += (texture2D(tMap, vUv + uStep * 3.231).rgb + texture2D(tMap, vUv - uStep * 3.231).rgb) * 0.070;
  gl_FragColor = vec4(c, 1.0);
}`;
const QUAD_V = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
export function createBloom(renderer) {
  const opt = { depthBuffer: true, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const a = new THREE.WebGLRenderTarget(4, 4, opt), b = new THREE.WebGLRenderTarget(4, 4, { ...opt, depthBuffer: false }), c = new THREE.WebGLRenderTarget(4, 4, { ...opt, depthBuffer: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), qs = new THREE.Scene(), qc = new THREE.Camera();
  quad.frustumCulled = false; qs.add(quad);
  const blur = new THREE.ShaderMaterial({ vertexShader: QUAD_V, fragmentShader: BLUR_F, uniforms: { tMap: { value: null }, uStep: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false });
  const add = new THREE.ShaderMaterial({ vertexShader: QUAD_V, fragmentShader: 'precision highp float; uniform sampler2D tMap; uniform float uK; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tMap, vUv).rgb * uK, 1.0); }',
    uniforms: { tMap: { value: null }, uK: { value: 0.6 } }, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending });
  const black = new THREE.Color(0x000000), keep = new THREE.Color();
  return {
    size(w, h) { a.setSize(Math.max(2, w >> 1), Math.max(2, h >> 1)); b.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); c.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); },
    /** after the main picture: the lights again (layer 1) → blur → add */
    render(scene, cam) {
      const bg = scene.background, auto = renderer.autoClear;
      renderer.getClearColor(keep); const alpha = renderer.getClearAlpha();
      scene.background = null; renderer.setClearColor(black, 1);
      cam.layers.set(1);
      renderer.setRenderTarget(a); renderer.clear(); renderer.render(scene, cam);
      cam.layers.enableAll(); scene.background = bg;
      quad.material = blur;
      blur.uniforms.tMap.value = a.texture; blur.uniforms.uStep.value.set(1 / b.width, 0); renderer.setRenderTarget(b); renderer.render(qs, qc);
      blur.uniforms.tMap.value = b.texture; blur.uniforms.uStep.value.set(0, 1 / c.height); renderer.setRenderTarget(c); renderer.render(qs, qc);
      renderer.setRenderTarget(null); renderer.setClearColor(keep, alpha);
      quad.material = add; add.uniforms.tMap.value = c.texture;
      renderer.autoClear = false; renderer.render(qs, qc); renderer.autoClear = auto;
    },
    dispose() { a.dispose(); b.dispose(); c.dispose(); quad.geometry.dispose(); blur.dispose(); add.dispose(); },
  };
}
