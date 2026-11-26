// FREEFALL — THE BREAKTHROUGHS' SHADERS (F3B — docs/freefall.md "THE BREAKTHROUGHS"; breaks.js builds the pieces, night.js owns the ONE
// scene). GLSL text only: no three.js, nothing runs here. A VIEW's: the rules never read any of it. Everything is written in LINEAR light
// and ends in three's own colour-space chunk; every material carries `uBloom` (1 = the bloom pass: only what GIVES light is drawn) and
// reads `uDay` (ONE scene, both looks). A picture's rows: `uFlip…` = 1 when its top row is at t = 0 (an ImageBitmap) — the scene's rule.

/** the breakthroughs' moments on the rules' clock: the ball leaves the floor above at the `area` event's tick — it meets the surface
 *  `HIT_TICKS` later (the skylight's glass, the water) · the cracks race out at `CRACK` world units a second */
export const HIT_TICKS = 8;
export const CRACK = 11;

const ROT = /* glsl */`
vec3 rot(vec3 p, vec3 ax, float a) { float c = cos(a), s = sin(a); return p * c + cross(ax, p) * s + ax * dot(ax, p) * (1.0 - c); }`;
const HASH = /* glsl */`
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }`;

// ---- THE SPRITES (a FIXED pool of quads, flown HERE — the tiers trim how many are shed, never the pool): dust + foam + mist (soft
// clouds), plankton + sediment + a firework's stars (a soft dot), bubbles (a ring), sand + spray (specks), a glint, the impact's burst —
// Kenney's Particle Pack (assets/freefall/fx/burst.webp: 4 × 2 cells). A sprite = its start (aO), its throw (aV), aT (its birth, its
// life, its size at birth → at its end), aK (its cell, its gravity, its drag, a seed), aM (how far it swirls, its spin), aC (its
// colour + how much it COVERS: 1 = a cloud that hides what is behind it, 0 = pure added light).
export const BURST_V = /* glsl */`
attribute vec3 aO, aV;
attribute vec4 aT, aK, aC;
attribute vec2 aM;
uniform float uTime;
varying vec2 vUv, vK; varying vec4 vC;
void main() {
  float age = uTime - aT.x, k = age / aT.y;
  vUv = position.xy + 0.5; vC = aC; vK = vec2(k, aK.x);
  if (age < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float s6 = aK.w * 6.2832, tt = age / (1.0 + aK.z * age);
  vec3 p = aO + aV * tt + vec3(0.0, aK.y * age * age, 0.0);
  p += vec3(sin(age * 3.1 + s6 * 3.0), 0.5 * sin(age * 2.3 + s6), cos(age * 2.7 + s6 * 5.0)) * (aM.x * min(1.0, age * 2.0));
  vec4 c = projectionMatrix * viewMatrix * vec4(p, 1.0);
  float size = mix(aT.z, aT.w, 1.0 - (1.0 - k) * (1.0 - k)), a = s6 + age * aM.y, ca = cos(a), sa = sin(a);
  c.xy += vec2(position.x * ca - position.y * sa, position.x * sa + position.y * ca) * size * vec2(projectionMatrix[0][0], projectionMatrix[1][1]);
  gl_Position = c;
}`;
export const BURST_F = /* glsl */`
uniform sampler2D tFx;
uniform float uHave, uFlip, uBloom, uCover;
varying vec2 vUv, vK; varying vec4 vC;
void main() {
  float cell = floor(vK.y + 0.5), cx = mod(cell, 4.0), cy = floor(cell / 4.0);
  vec2 uv = clamp(vUv, 0.02, 0.98);
  float fromTop = (cy + 1.0 - uv.y) * 0.5;
  float t = texture2D(tFx, vec2((cx + uv.x) * 0.25, mix(1.0 - fromTop, fromTop, uFlip))).r;
  float r = length(vUv - 0.5) * 2.0;
  t = mix(1.0 - smoothstep(0.2, 1.0, r), t, uHave);   // (no picture yet: a soft round puff)
  t *= 1.0 - smoothstep(0.7, 0.97, r);                // (the fresh-eyes review: a smoke cell reaches its border — faded out round, a cloud never shows its square)
  float k = vK.x, a = t * smoothstep(0.0, 0.07, k) * (1.0 - k * k);
  // (BY DAY added light is lost on a bright ground: a light covers what is behind it — uCover)
  float cover = mix(vC.a, max(vC.a, 0.88), uCover);
  vec3 col = vC.rgb * a;
  if (uBloom > 0.5) { col *= (1.0 - vC.a) * 0.6; cover = 0.0; }
  gl_FragColor = vec4(col, a * cover);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- A PANE THAT BREAKS (the skylight's glass · the seabed that cracks open): ONE instanced mesh of TRIANGLES — the pieces it will break
// into, laid out once round the point of impact (breaks.js#fractureGeo). At rest they ARE the pane (one draw call, intact); the CRACKS are
// drawn along the very lines it will break on (a piece's own edges — its barycentric coordinates), racing out from the impact; then each
// piece flies: its throw, its tumble, gravity — nothing is stepped on the CPU. aP0 · aP1 · aP2 = a piece's corners in the pane's plane,
// aV its throw, aR its tumble (axis + spin), aD (the delay before it lets go — the crack front reaches it —, a seed).
export const FRACT_V = /* glsl */`
attribute vec3 aB, aP0, aP1, aP2, aV;
attribute vec4 aR;
attribute vec2 aD;
uniform float uTime, uBreakT, uGrav, uLife;
uniform mat4 uM;   // (the pane's own plane in the world — the roof's: night.js sets it every frame)
varying vec3 vW, vN, vB, vRest;
varying float vK, vSeed;
${ROT}
void main() {
  vec3 rest = aP0 * aB.x + aP1 * aB.y + aP2 * aB.z, cen = (aP0 + aP1 + aP2) / 3.0, p = rest, n = vec3(0.0, 1.0, 0.0);
  float age = uTime - uBreakT - aD.x, k = 0.0;
  if (age > 0.0) {
    k = age / uLife;
    vec3 ax = normalize(aR.xyz);
    p = rot(rest - cen, ax, age * aR.w) + cen + aV * age + vec3(0.0, uGrav * age * age, 0.0);
    n = rot(n, ax, age * aR.w);
  }
  vW = (uM * vec4(p, 1.0)).xyz; vN = normalize(mat3(uM) * n); vB = aB; vRest = rest; vK = k; vSeed = aD.y;
  gl_Position = k > 1.0 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
/** THE SKYLIGHT's GLASS: intact = the roof's own skylight (by night the lit room glowing warm through frosted panes, by day blue glass
 *  mirroring the sky); the cracks race out white from the impact; a flying shard = REAL GLASS — the panorama mirrored in it (soft), bright
 *  fresnel edges, a glint as it turns to the light; by night it catches the pink / violet neon. */
export const GLASS_F = /* glsl */`
uniform sampler2D tPano;
uniform float uTime, uBreakT, uDay, uBloom, uHaveP, uFlipP, uCrack, uHalf;
uniform vec2 uImpact;
varying vec3 vW, vN, vB, vRest;
varying float vK, vSeed;
${HASH}
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  if (dot(N, V) < 0.0) N = -N;
  float nv = max(dot(N, V), 0.0), fres = pow(1.0 - nv, 3.0), fly = step(0.0001, vK);
  vec3 R = reflect(-V, N);
  // what it mirrors: the open sky — and, low down, FREEFALL's own panorama, read soft
  float az = atan(R.x, -R.z), el = asin(clamp(R.y, -1.0, 1.0)), pv = clamp((0.012 - el) / 0.4, 0.02, 0.98);
  vec3 pano = pow(texture2D(tPano, vec2(az / 1.2 + 0.5, mix(1.0 - pv, pv, uFlipP)), 2.0).rgb, vec3(2.2));
  vec3 sky = mix(mix(vec3(0.05, 0.02, 0.12), vec3(0.008, 0.006, 0.03), clamp(R.y, 0.0, 1.0)), mix(vec3(0.6, 0.82, 1.0), vec3(0.16, 0.44, 0.9), clamp(R.y, 0.0, 1.0)), uDay);
  vec3 env = mix(sky, pano * mix(1.5, 1.0, uDay), uHaveP * step(el, 0.012) * step(-0.388, el));
  // the pane at rest: 6 × 6 panes, each a shade its own
  vec2 cell = floor((vRest.xz + uHalf) / (2.0 * uHalf) * 6.0);
  float ph = h21(cell);
  vec3 warm = vec3(1.0, 0.82, 0.46) * (0.82 + 0.4 * ph) * (0.84 + 0.16 * sin(vRest.z * 9.0 + ph * 6.0) * sin(vRest.x * 7.0 + 1.3));
  vec3 body = mix(warm, mix(vec3(0.16, 0.38, 0.7), vec3(0.5, 0.74, 0.98), ph * 0.6 + 0.15), uDay);
  vec3 col = body * (1.0 - 0.6 * fres) + env * (0.16 + 0.84 * fres) * mix(0.5, 1.0, uDay);
  // THE CRACKS: along the lines it breaks on, racing out from the impact
  float e = min(vB.x, min(vB.y, vB.z)), ew = fwidth(e) * 1.4 + 0.0015, line = 1.0 - smoothstep(0.0, ew * 1.5, e);
  float dI = length(vRest.xz - uImpact), front = (uTime - uBreakT) * uCrack, crack = line * smoothstep(0.0, 0.3, front - dI) * step(uBreakT, uTime);
  float star = (1.0 - smoothstep(0.05, 0.3, dI)) * smoothstep(0.0, 0.03, uTime - uBreakT) * (1.0 - fly);
  col = mix(col, vec3(1.0, 0.99, 0.96) * 1.3, max(crack * 0.92, star * 0.8) * (1.0 - fly));
  float alpha = 0.96;
  // A FLYING SHARD
  float glint = pow(max(dot(R, normalize(vec3(-0.3, 0.9, 0.3))), 0.0), 26.0);
  vec3 neon = mix(vec3(1.0, 0.2, 0.75), vec3(0.55, 0.3, 1.0), 0.5 + 0.5 * sin(vSeed * 40.0)) * (1.0 - uDay);
  vec3 shard = env * (0.35 + 0.65 * fres) + vec3(1.0) * line * 0.85 + vec3(1.0) * glint * 1.7 + neon * (0.22 + 0.6 * fres) + body * 0.16;
  col = mix(col, shard, fly);
  alpha = mix(alpha, clamp(0.36 + line * 0.6 + glint + fres * 0.5, 0.0, 1.0) * (1.0 - vK * vK), fly);
  if (uBloom > 0.5) col = mix(body * 0.3 * (1.0 - uDay) + vec3(1.0) * crack * 0.5, vec3(1.0) * (line * 0.25 + glint * 1.1) + neon * 0.2, fly);
  gl_FragColor = vec4(col * alpha, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE SKYLIGHT's FRAME (instanced boxes: aP its place, aS its size, aQ = its kind — 0 the outer frame · 1 a glazing bar · 2 a NEON
// TUBE —, its number round the frame, a seed): by night the tubes outline the frame; the hit SHORTS them — they flicker out one after the
// other round it (uBreakT); the glazing bars fall away with the glass. By day the tubes are unlit.
/** F4B — the skylight's outer frame + its tubes are gone this long after the break (the deck's own 0.25 s — DECK_F) */
export const FRAME_GONE_S = 0.25;
export const FRAME_V = /* glsl */`
attribute vec3 aP, aS, aQ;
uniform float uTime, uBreakT;
uniform mat4 uM;
varying vec3 vN, vW, vQ;
varying float vGone;
${ROT}
void main() {
  vec3 p = position * aS, n = normal;
  float age = uTime - uBreakT - 0.05 - aQ.z * 0.12, gone = 0.0;
  if (aQ.x > 0.5 && aQ.x < 1.5 && age > 0.0) {
    // a glazing bar lets go: it drops, turning about its own length
    vec3 ax = normalize(aS.x > aS.z ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0));
    p = rot(p, ax, age * (3.0 + 5.0 * aQ.z)) + vec3((aQ.z - 0.5) * 0.5 * age, -5.5 * age * age - 0.4 * age, 0.3 * age);
    n = rot(n, ax, age * (3.0 + 5.0 * aQ.z));
    gone = age / 0.8;   // (F4B: 1.3 — the pieces of the glazing bars are clear of the floors with the shards)
  }
  // F4B — THE SKYLIGHT's FRAME BAR (the owner's iPhone, floor 40: the frame's near bar stayed across the screen at the ball's height, its
  // far bar + sides as a dark bar at the top — in front of the tiles): THE OUTER FRAME + ITS TUBES LET GO WITH THE PANE — they drop
  // away, each a touch after the other, and are GONE 0.25 s after the break. Nothing of the skylight stays between the camera and the floors.
  float since = uTime - uBreakT;
  if ((aQ.x < 0.5 || aQ.x > 1.5) && since > 0.0) {
    float a2 = max(0.0, since - aQ.z * 0.05);
    p += vec3((aQ.z - 0.5) * 0.8 * a2, -14.0 * a2 * a2 - 1.5 * a2, 0.0);
    gone = since / ${FRAME_GONE_S.toFixed(2)};
  }
  vec4 w = uM * vec4(aP + p, 1.0);
  vW = w.xyz; vN = normalize(mat3(uM) * n); vQ = aQ; vGone = gone;
  gl_Position = gone > 1.0 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * w;
}`;
export const FRAME_F = /* glsl */`
uniform float uTime, uBreakT, uDay, uBloom;
varying vec3 vN, vW, vQ;
varying float vGone;
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float up = max(N.y, 0.0), nv = max(dot(N, V), 0.0);
  vec3 col = mix(vec3(0.03, 0.03, 0.06) + vec3(0.1, 0.08, 0.2) * up + vec3(0.25, 0.1, 0.35) * pow(1.0 - nv, 3.0) * 0.5, vec3(0.2, 0.24, 0.3) + vec3(0.5, 0.55, 0.62) * up, uDay);
  vec3 emit = vec3(0.0);
  if (vQ.x > 1.5) {
    // A NEON TUBE: cyan · magenta · violet round the frame. The hit shorts them: each flickers, then dies — one after the other
    vec3 tube = vQ.y < 2.5 ? vec3(0.2, 0.9, 1.0) : vQ.y < 5.5 ? vec3(1.0, 0.25, 0.85) : vec3(0.62, 0.35, 1.0);
    // (F4B: the short's cascade runs inside the frame's 0.25 s — the tubes die one after the other as they drop away; the sparks carry the moment on)
    float since = uTime - uBreakT, dead = since - 0.02 - vQ.y * 0.02;
    float flick = since < 0.0 ? 1.0 : dead > 0.06 ? 0.0 : step(0.42, fract(sin(floor(uTime * 38.0) * 12.9898 + vQ.y * 7.3) * 43758.5453));
    float hum = 0.94 + 0.06 * sin(uTime * 31.0 + vQ.y * 2.0);
    emit = tube * flick * hum * (1.0 - uDay);
    col = mix(mix(vec3(0.08, 0.08, 0.12), vec3(0.78, 0.8, 0.84), uDay), tube * 1.7 + vec3(0.5), flick * (1.0 - uDay));
  }
  float alpha = 1.0 - clamp(vGone, 0.0, 1.0) * clamp(vGone, 0.0, 1.0);
  if (uBloom > 0.5) col = emit * 1.1;
  gl_FragColor = vec4(col * alpha, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE ROOF's DECK round the skylight (the painting itself on the roof's own plane — the same picture the roof below shows, with a fine
// grain of its own for when it is close; it fades out all round into it): a hole where the skylight's own glass is; by night the neon
// tubes' light lies on it (until they short).
export const DECK_V = 'varying vec3 vW, vL; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vL = position; gl_Position = projectionMatrix * viewMatrix * w; }';
export const DECK_F = /* glsl */`
uniform sampler2D tRoof;
uniform float uHaveR, uFlipR, uDay, uBloom, uHalf, uWide, uTime, uBreakT, uNear;
uniform vec2 uRoof;
varying vec3 vW, vL;
${HASH}
void main() {
  vec2 q = vL.xz, ru = vec2(uRoof.x + q.x / uWide, uRoof.y + q.y / uWide);   // (the deck's OWN plane: + z = toward the viewer = down the picture)
  float inside = max(abs(q.x), abs(q.y));
  if (inside < uHalf - 0.03) discard;
  vec3 c = pow(texture2D(tRoof, vec2(ru.x, mix(1.0 - ru.y, ru.y, uFlipR))).rgb, vec3(2.2));
  c = mix(mix(vec3(0.016, 0.012, 0.04), vec3(0.3, 0.33, 0.38), uDay), c, uHaveR) * mix(1.5, 1.0, uDay);
  // ITS OWN DETAIL, coming in as the roof comes close (uNear — the painting was made at 1024: soft this near): the roofing felt's fine grain,
  // a coarser mottle, the seams between its sheets — sharp at any distance, laid over the painting's own light + colour
  // (the fresh-eyes review: SMOOTH noise — square cells read as a pixel mosaic on the soft painting by day)
  float grain = vn2(q * 96.0) * 0.45 + vn2(q * 41.0 + 7.0) * 0.35 + vn2(q * 17.0 + 13.0) * 0.2, mott = vn2(q * 3.7 + 3.0);
  vec2 sheet = abs(fract(q / 0.74 + 0.5) - 0.5) * 0.74, sw = fwidth(q) * 1.2 + 0.004;
  float seam = 1.0 - smoothstep(0.0, sw.x + 0.006, sheet.x) * smoothstep(0.0, sw.y + 0.006, sheet.y);
  c *= mix(1.0, (0.8 + 0.36 * grain) * (0.93 + 0.14 * mott) * (1.0 - 0.3 * seam), uNear);
  // the tubes' light on the deck (night), dying with them
  float lit = 1.0 - smoothstep(0.0, 0.5, uTime - uBreakT - 0.3);
  c += mix(vec3(0.2, 0.75, 0.95), vec3(0.95, 0.25, 0.8), smoothstep(-0.4, 0.4, q.x * sign(q.y + 0.001))) * exp(-(inside - uHalf) / 0.28) * 0.55 * lit * (1.0 - uDay);
  float alpha = 1.0 - smoothstep(uHalf + 2.2, uHalf + 3.1, length(q));
  alpha *= 1.0 - smoothstep(0.0, 0.25, uTime - uBreakT);   // (F4A — THE HAZE: the deck lies IN FRONT of the floors under the roof from the play camera — gone 0.25 s after the break; it faded over 0.8 s and held them 20–60 % darker)
  //   // (the fresh-eyes review: the roof is gone with its glass — the deck round it never stays on as a flat band over the offices)
  if (alpha < 0.004) discard;
  if (uBloom > 0.5) c = vec3(0.0);
  gl_FragColor = vec4(c * alpha, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE WATER (THE SPLASHDOWN — floor 120): a real plane across the shaft, NORMAL-MAPPED (Water 001, two layers scrolling against each
// other), mirroring what stands over it — the area's own WALL (the mirrored ray meets the shaft's cylinder: the speakeasy's light), the
// tower's lit rings + the ball (rippling streaks: the neon by night). The plunge: a RING WAVE runs out from the impact; then THE
// WATERLINE sweeps up the screen (uLine, a wavy line in screen space — the camera dips under) and below it the plane is gone: the world
// under the surface shows.
export const WATER_V = 'varying vec3 vW; varying vec4 vClip; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vClip = projectionMatrix * viewMatrix * w; gl_Position = vClip; }';
export const WATER_F = /* glsl */`
uniform sampler2D tN, tWall;
uniform float uHaveN, uFlipN, uHaveW, uFlipW, uTileW, uTime, uDay, uBloom, uRW, uSplashT, uLine, uFloorY;
uniform vec3 uTintW, uRingC, uFaceC, uBall;
uniform vec2 uImpact;
varying vec3 vW; varying vec4 vClip;
vec3 nrm(vec2 uv) { return texture2D(tN, vec2(uv.x, mix(1.0 - uv.y, uv.y, uFlipN))).xyz * 2.0 - 1.0; }
void main() {
  float r = length(vW.xz);
  if (vW.z < 0.0 && r > uRW) discard;          // (its far shore is the shaft's wall)
  // THE WATERLINE (screen space): under it the camera is under water — the plane is gone
  vec2 ndc = vClip.xy / vClip.w;
  float wl = uLine + 0.035 * sin(ndc.x * 9.0 + uTime * 7.0) + 0.02 * sin(ndc.x * 23.0 - uTime * 11.0);
  if (ndc.y < wl) discard;
  vec3 V = normalize(cameraPosition - vW);
  vec3 n1 = nrm(vW.xz * 0.27 + vec2(uTime * 0.021, uTime * 0.013)), n2 = nrm(vW.xz * 0.43 - vec2(uTime * 0.017, -uTime * 0.024));
  vec3 nm = mix(vec3(0.0, 0.0, 1.0), normalize(n1 + n2), uHaveN);
  // THE RING WAVE of the plunge: rings running out from the impact, dying as they go
  float dI = length(vW.xz - uImpact), age = uTime - uSplashT, ring = 0.0;
  if (age > 0.0 && age < 3.0) {
    float ph = dI * 9.0 - age * 13.0, env = exp(-dI * 0.55) * exp(-age * 1.1) * smoothstep(0.0, 0.25, age * 5.0 - dI);
    ring = cos(ph) * env;
    nm.xy += normalize(vW.xz - uImpact + 1e-4) * sin(ph) * env * 1.6;
  }
  // (the fresh-eyes review: by day the ripples lie flatter — a calm sunlit surface, never a slate of blotches)
  // (… and flatter with distance, both looks: far ripples are finer than a pixel — left sharp they flicker between a lamp and the dark)
  float bump = mix(0.8, 0.42, uDay) * mix(1.0, 0.3, clamp((length(cameraPosition - vW) - 2.5) / 5.0, 0.0, 1.0));
  vec3 N = normalize(vec3(nm.x * bump, 1.0, nm.y * bump));
  float nv = max(dot(N, V), 0.0), fres = 0.06 + 0.94 * pow(1.0 - nv, 4.0);
  vec3 R = reflect(-V, N);
  R.y = abs(R.y) + 0.02;
  // what it mirrors — the wall of the room above (the mirrored ray meets the shaft's cylinder)
  float a = dot(R.xz, R.xz), b = dot(vW.xz, R.xz), cc = dot(vW.xz, vW.xz) - uRW * uRW, t = (-b + sqrt(max(0.0, b * b - a * cc))) / max(a, 1e-5);
  vec3 hit = vW + R * t;
  vec2 wu = vec2(atan(hit.x, -hit.z) * 0.15915494, hit.y / (6.2831853 * uRW)) * uTileW;
  vec3 wall = pow(texture2D(tWall, vec2(wu.x, mix(wu.y, 1.0 - wu.y, uFlipW))).rgb, vec3(2.2)) * uTintW * uHaveW;
  wall *= exp(-max(0.0, hit.y - vW.y) / 9.0);
  // (… and by day the open daylight of the room lies on it as well: the water is never darker than what stands round it)
  vec3 refl = wall * mix(1.6, 1.15, uDay) + vec3(0.2, 0.36, 0.42) * uDay;
  // … the tower's rings over it (three floors of them): their lit rims, as rippling streaks
  for (int j = 0; j < 3; j++) {
    float fy = uFloorY + float(j), tt = (fy - vW.y) / R.y;
    vec3 p = vW + R * tt;
    float pr = length(p.xz), on = smoothstep(0.12, 0.3, pr) * (1.0 - smoothstep(0.86, 1.06, pr));   // (soft edges: a mirror image in moving water)
    refl = mix(refl, uFaceC * 0.42 + uRingC * (0.12 + 0.75 * exp(-(1.0 - pr) / 0.07)), on * (0.85 - 0.22 * float(j)));
  }
  // … and the ball: its light on the water
  vec3 tb = normalize(uBall - vW);
  refl += vec3(1.0, 0.62, 0.8) * pow(max(dot(R, tb), 0.0), 160.0) * 0.16 * step(vW.y, uBall.y);   // (a small pink gleam — never a white lump)
  vec3 deep = mix(vec3(0.003, 0.012, 0.022), vec3(0.03, 0.24, 0.3), uDay);
  vec3 col = mix(deep, refl, clamp(fres * 1.5 + mix(0.2, 0.34, uDay), 0.0, 1.0));
  col = min(col, vec3(mix(0.24, 1.0, uDay)));   // (LINEAR light — by night a mirror image stays a dim one: never a white shore, never a blown-out lump)
  col += mix(vec3(0.5, 0.95, 1.0), vec3(1.0), 0.5) * max(ring, 0.0) * 0.5;                    // the ring's crest catches the light
  col += vec3(1.0) * pow(max(dot(R, normalize(vec3(-0.25, 0.9, 0.35))), 0.0), 180.0) * 0.4;      // a lamp's sparkle
  col = min(col, vec3(1.0));                                                    // (… never a blown-out lump of white where the reflections pile up)
  // the meniscus: a bright wet line where the surface meets the lens
  float men = 1.0 - smoothstep(0.0, 0.05, ndc.y - wl);
  col = mix(col, mix(vec3(0.6, 1.0, 1.0), vec3(1.0), 0.4), men * step(-1.5, uLine) * 0.85);
  if (uBloom > 0.5) col = vec3(1.0) * max(ring, 0.0) * 0.25 + col * 0.12 * (1.0 - uDay);
  gl_FragColor = vec4(col * 0.97, 0.97);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE SEABED (THE BOTTOM — floor 200): real sand (Ground 055 S: colour + normal), lit from above; the tower's own glow + the ball's
// light lie on it; by day the water's caustics. THE IMPACT: a shockwave ring of sand + light runs out from under the ball (uImpT).
// SAND = the look, shared by the plane (SEABED_F — outside the square that cracks) and the pieces (CHUNK_F — the square that cracks open).
const SAND = /* glsl */`
uniform sampler2D tSand, tSandN;
uniform float uHaveS, uFlipS, uHaveSN, uFlipSN, uTime, uDay, uBloom, uImpT, uRW, uHole;
uniform vec3 uRimC, uBall;
uniform vec2 uImpact;
/** THE TRENCH's MOUTH (SOLO — the tower goes on down; the fresh-eyes review: the floor under the ball is ALWAYS in sight): the bed is open
 *  round the tower's foot + along the cleft that runs from it toward the viewer — everything the camera sees the lower floors through.
 *  → how far outside the mouth's ragged edge a point of the bed is (under 0 = in it). uHole = 0 (a finish): no mouth, the bed is whole. */
float mouth(vec2 xz) {
  float d = length(vec2(xz.x, min(xz.y, 0.0)));
  return d - uHole - 0.06 * sin(xz.y * 2.9 + xz.x * 1.3) - 0.035 * sin(xz.y * 7.3 - xz.x * 5.1 + 1.7) - 0.02 * sin(xz.x * 13.0 + xz.y * 11.0);
}
/** … its lip: the sand darkens into the cleft, the trench's own light glows up along its edge */
vec3 lipped(vec3 col, float m) {
  if (uHole <= 0.0) return col;
  float lip = 1.0 - smoothstep(0.0, 0.24, m), edge = exp(-max(m, 0.0) / 0.04);
  return mix(col, col * 0.28, lip * 0.85) + mix(uRimC, vec3(0.25, 0.8, 0.95), uDay * 0.7) * edge * mix(0.55, 0.25, uDay);
}
float sc1(vec2 p, float t) {
  vec2 q = p + 0.35 * vec2(sin(p.y * 1.7 + t * 0.9), cos(p.x * 1.9 - t * 0.8));
  float a = sin(q.x * 3.1 + t) + sin(q.y * 2.7 - t * 1.2) + sin((q.x + q.y) * 2.2 + t * 0.7) + sin((q.x - q.y) * 2.9 - t * 0.5);
  return pow(clamp(1.0 - abs(a) * 0.5, 0.0, 1.0), 5.0);
}
/** the sand at a point of the bed (its own xz), under = 1: seen from below (a piece that tumbles shows bare rock), lit = how much of the tower's + the ball's light lies on it → colour · w = the light it GIVES (the bloom pass) */
vec4 sand(vec2 xz, float under, float lit) {
  vec2 uv = xz * 0.36;
  vec3 c = mix(vec3(0.62, 0.52, 0.36), pow(texture2D(tSand, vec2(uv.x, mix(1.0 - uv.y, uv.y, uFlipS))).rgb, vec3(2.2)), uHaveS);
  vec3 nm = mix(vec3(0.0, 0.0, 1.0), texture2D(tSandN, vec2(uv.x, mix(1.0 - uv.y, uv.y, uFlipSN))).xyz * 2.0 - 1.0, uHaveSN);
  vec3 N = normalize(vec3(nm.x * 1.6, nm.z, -nm.y * 1.6));
  float dif = max(dot(N, normalize(vec3(-0.35, 0.8, 0.5))), 0.0), r = length(xz);
  vec2 tb = xz - uBall.xz;
  // (lit — a piece that has let go carries the bed's own light away with it no longer: the pool + the ball's light stay on the bed)
  float pool = exp(-r * r / 3.4) * lit, ball = exp(-dot(tb, tb) / 0.9) * lit;
  // by night: deep violet-blue sand, the tower's rim glow in a pool round its foot, the ball's own light · by day: the deep's blue water light + caustics
  vec3 night = c * vec3(0.04, 0.038, 0.12) * (0.4 + 0.9 * dif) + c * uRimC * pool * 1.0 * (0.4 + 0.6 * dif) + c * vec3(1.0, 0.6, 0.8) * ball * 0.7;
  vec3 day = c * vec3(0.22, 0.5, 0.7) * (0.4 + 0.95 * dif) + c * vec3(0.45, 0.9, 0.95) * (sc1(xz * 1.4, uTime) + 0.6 * sc1(xz * 2.4 + 3.1, uTime * 1.31 + 2.0)) * 0.3 + c * vec3(0.5, 0.75, 0.9) * pool * 0.5;
  vec3 col = mix(night, day, uDay);
  // THE SHOCKWAVE of the impact: a ring of lifted sand + light
  float age = uTime - uImpT, emit = 0.0;
  if (age > 0.0 && age < 1.8) {
    float dI = length(xz - uImpact), rr = 0.25 + 4.6 * (1.0 - exp(-2.3 * age)), band = exp(-pow((dI - rr) / (0.16 + 0.2 * age), 2.0)) * (1.0 - smoothstep(0.7, 1.7, age));
    col += c * 0.5 * band + mix(mix(uRimC, vec3(1.0), 0.35) * 1.5, vec3(0.75, 1.0, 1.0), uDay) * band * 0.9;
    emit = band * 0.9;
    col += vec3(1.0, 0.9, 0.7) * exp(-dI * dI / 0.35) * exp(-age * 5.0) * 1.2;
  }
  // (a piece seen from below: bare wet rock — dark, but a solid thing, never see-through)
  col = mix(col, mix(vec3(0.05, 0.04, 0.09), vec3(0.1, 0.13, 0.15), uDay) * (0.6 + 0.8 * dif), under);
  return vec4(col, emit * (1.0 - under));
}`;
export const SEABED_V = 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
export const SEABED_F = /* glsl */`
${SAND}
uniform float uHalf, uOuter;
varying vec3 vW;
void main() {
  vec2 q = vW.xz;
  if (max(abs(q.x), abs(q.y)) < uHalf - 0.002) discard;      // (the square that cracks open is the pieces')
  if (q.y < 0.0 && length(q) > uRW) discard;                  // (its far side ends at the shaft's wall)
  float m = mouth(q);
  if (uHole > 0.0 && m < 0.0) discard;                        // (SOLO: the trench's mouth)
  vec4 s = sand(q, 0.0, 1.0);
  vec3 col = uBloom > 0.5 ? mix(uRimC, vec3(1.0), 0.3) * s.w * 0.6 : lipped(s.rgb, m);
  gl_FragColor = vec4(col * uOuter, uOuter);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export const CHUNK_F = /* glsl */`
${SAND}
uniform float uBreakT, uCrack;
varying vec3 vW, vN, vB, vRest;
varying float vK, vSeed;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float under = step(dot(normalize(vN), V), 0.0), fly = step(0.0001, vK);
  float m = mouth(vRest.xz);
  if (uHole > 0.0 && m < 0.0) discard;                        // (SOLO: the trench's mouth — a piece keeps its own bite of it as it falls)
  vec4 s = sand(vRest.xz, under, 1.0 - 0.85 * fly);
  s.rgb = mix(lipped(s.rgb, m), s.rgb, under);
  // THE CRACKS: dark clefts along the lines it breaks on — the trench's own light glows up through them
  float e = min(vB.x, min(vB.y, vB.z)), ew = fwidth(e) * 1.4 + 0.002, line = 1.0 - smoothstep(0.0, ew * 2.2, e);
  float dI = length(vRest.xz - uImpact), front = (uTime - uBreakT) * uCrack, crack = line * smoothstep(0.0, 0.4, front - dI) * step(uBreakT, uTime);
  vec3 col = mix(s.rgb, mix(uRimC * 1.6, vec3(0.3, 0.9, 1.0), uDay * 0.6), crack * 0.9 * (1.0 - 0.75 * fly));
  float alpha = 1.0 - fly * smoothstep(0.6, 1.0, vK);
  if (uBloom > 0.5) col = mix(uRimC, vec3(1.0), 0.3) * (s.w * 0.6 + crack * 0.7);
  gl_FragColor = vec4(col * alpha, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
/** THE ROCKS on the bed (a few instanced boulders: aP = its place + size, aS = its squash + turn): the sand's own stone, darker */
export const ROCK_V = /* glsl */`
attribute vec4 aP;
attribute vec3 aS;
uniform vec3 uOrigin;
uniform float uTime, uBreakT;
varying vec3 vN, vW;
varying float vGone;
void main() {
  float c = cos(aS.z), s = sin(aS.z);
  vec3 p = position * vec3(aS.x, aS.y, 1.0) * aP.w, n = normalize(normal / vec3(aS.x, aS.y, 1.0));
  p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); n = vec3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);
  float age = max(0.0, uTime - uBreakT - 0.15 - 0.1 * aS.z);   // (the bed cracks open: they go down with it)
  vec4 w = vec4(uOrigin + aP.xyz + p + vec3(0.0, -4.5 * age * age, 0.0), 1.0);
  vW = w.xyz; vN = n; vGone = age / 1.2;
  gl_Position = vGone > 1.0 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * w;
}`;
export const ROCK_F = /* glsl */`
uniform float uDay, uBloom;
uniform vec3 uRimC;
varying vec3 vN, vW;
varying float vGone;
void main() {
  vec3 N = normalize(vN);
  float dif = max(dot(N, normalize(vec3(-0.35, 0.8, 0.5))), 0.0), r = length(vW.xz);
  // (sand lies on its top, bare stone on its sides)
  vec3 stone = mix(vec3(0.3, 0.27, 0.25), vec3(0.6, 0.5, 0.36), smoothstep(0.35, 0.85, N.y));
  vec3 col = mix(stone * vec3(0.07, 0.065, 0.19) * (0.5 + 1.2 * dif) + stone * uRimC * exp(-r * r / 3.4) * 1.3 * max(0.0, dot(N, normalize(vec3(-vW.x, 0.8, -vW.z)))), stone * vec3(0.22, 0.5, 0.7) * (0.45 + 1.1 * dif), uDay);
  float alpha = 1.0 - clamp(vGone, 0.0, 1.0);
  if (uBloom > 0.5) col = vec3(0.0);
  gl_FragColor = vec4(col * alpha, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
