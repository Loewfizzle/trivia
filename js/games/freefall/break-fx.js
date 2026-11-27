// FREEFALL — THE BREAKTHROUGHS' SHADERS (F3B — docs/freefall.md "THE BREAKTHROUGHS"; breaks.js builds the pieces, night.js owns the ONE (→ §1, docs/freefall.md MODULE NOTES)

/** the breakthroughs' moments on the rules' clock: the ball leaves the floor above at the `area` event's tick — it meets the surface
 *  `HIT_TICKS` later (the skylight's glass, the water) · the cracks race out at `CRACK` world units a second */
export const HIT_TICKS = 8;
export const CRACK = 11;

const ROT = /* glsl */`
vec3 rot(vec3 p, vec3 ax, float a) { float c = cos(a), s = sin(a); return p * c + cross(ax, p) * s + ax * dot(ax, p) * (1.0 - c); }`;
const HASH = /* glsl */`
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }`;

// ---- THE SPRITES (a FIXED pool of quads, flown HERE — the tiers trim how many are shed, never the pool): dust + foam + mist (soft (→ §2, docs/freefall.md MODULE NOTES)
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
  vec4 mv = viewMatrix * vec4(p, 1.0), c = projectionMatrix * mv;
  float size = mix(aT.z, aT.w, 1.0 - (1.0 - k) * (1.0 - k)), a = s6 + age * aM.y, ca = cos(a), sa = sin(a);
  // (F5A — THE DUST: a puff is a soft BALL, not a card — its depth is its NEAR side's. A card at its middle's depth was cut off along a
  //  straight line wherever the ground under it ran in front: the dust clouds' flat edges)
  vec4 cn = projectionMatrix * (mv + vec4(0.0, 0.0, size * 0.6 + 0.14, 0.0));   // (+ 0.14: a small star just over the sand is whole too — the review: half-discs)
  c.z = cn.z / cn.w * c.w;
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
  // (F5A — a SOFT CLOUD (a cover under 0: the seabed's dust) keeps its own thin cover in both looks — many soft veils, never a heavy blob)
  float soft = step(vC.a, -0.001), own = abs(vC.a);
  float cover = mix(mix(own, max(own, 0.88), uCover), own, soft);
  vec3 col = vC.rgb * a;
  if (uBloom > 0.5) { col *= (1.0 - own) * 0.6 * (1.0 - soft); cover = 0.0; }
  gl_FragColor = vec4(col, a * cover);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- A PANE THAT BREAKS (the skylight's glass · the seabed that cracks open): ONE instanced mesh of TRIANGLES — the pieces it will break (→ §3, docs/freefall.md MODULE NOTES)
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
    // (F4B — the screen review: at 0.3 s the bars still hung in front of the top floors as a straight LATTICE — each turned about its own
    //  length, which the eye can not see, and had dropped a third of a unit. They TUMBLE now — a tilted axis of their own — are thrown
    //  outward from the pane's middle, fall as fast as the frame, and are gone in 0.45 s: debris, with the shards)
    vec3 ax = normalize(vec3(aQ.z - 0.5, 0.35, 0.8 - aQ.z));
    float turn = age * (7.0 + 9.0 * aQ.z);
    p = rot(p, ax, turn) + vec3(aP.x * 1.6 * age + (aQ.z - 0.5) * 0.8 * age, -14.0 * age * age - 0.8 * age, aP.z * 1.6 * age + 0.3 * age);
    n = rot(n, ax, turn);
    gone = age / 0.45;
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
uniform sampler2D tRoof, tGrain;
uniform float uHaveR, uFlipR, uDay, uBloom, uHalf, uWide, uTime, uBreakT, uNear, uHaveG;
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
  // (F5A — THE ROOF GRAIN: the same detail tile, read as the roof below reads it — night-fx.js SKY_F: one roof, no edge where the deck ends)
  float gr = (texture2D(tGrain, ru * 15.0).r - 0.5) * 0.5 + (texture2D(tGrain, vec2(ru.y, -ru.x) * 5.7 + 0.31).r - 0.5) * 0.5;
  c *= 1.0 + gr * uNear * uHaveG * mix(0.55, 1.45, uDay);
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

// ---- THE WATER (THE SPLASHDOWN — floor 120): a real plane across the shaft. F5A — THE WATER SURFACE REBUILT to the owner's two targets (→ §4, docs/freefall.md MODULE NOTES)
export const WATER_V = 'varying vec3 vW; varying vec4 vClip; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vClip = projectionMatrix * viewMatrix * w; gl_Position = vClip; }';
/** FIX A — the ripple map's slopes were stretched × RIP_K when it was baked (scripts/build-freefall-assets.py#RIP_K) */
export const RIP_K = 10;
export const WATER_F = /* glsl */`
uniform sampler2D tWall, tRip;
uniform float uHaveW, uTileW, uTime, uDay, uBloom, uRW, uRP, uRO, uSplashT, uLine, uHaveR;
uniform vec3 uBall;
uniform vec2 uImpact;
varying vec3 vW; varying vec4 vClip;
${HASH}
/** THE SWELL (FIX A — the owner's targets: Grok's mock B by day, its night recolour): Grok's soft ripple map, two layers scrolling slowly
 *  against each other → the surface's slopes (x: across the screen · y: toward the viewer); a faint wave of its own until the map lands */
vec2 swell(vec2 p, float t) {
  vec2 a = texture2D(tRip, p * 1.15 + vec2(t * 0.024, t * 0.014)).xy - 0.5;
  vec2 b = texture2D(tRip, p * 3.4 + vec2(-t * 0.034, t * 0.022) + 0.37).xy - 0.5;
  vec2 c = texture2D(tRip, p * 7.3 + vec2(t * 0.05, -t * 0.041) + 0.71).xy - 0.5;   // (a fine third layer: the crests' own detail)
  vec2 g = (a + b * 0.75 + c * 0.5) * (32.0 / ${RIP_K}.0) * uHaveR;
  vec2 q = p + 0.32 * vec2(sin(p.y * 0.83 + t * 0.29), cos(p.x * 0.71 - t * 0.23));
  g += (1.0 - 0.75 * uHaveR) * (vec2(0.12, 1.0) * cos((q.x * 0.12 + q.y) * 2.1 + t * 0.9) + vec2(0.8, 0.6) * 0.5 * cos((q.x * 0.8 + q.y * 0.6) * 1.3 + t * 0.5));
  return g;
}
/** small lights lying on the surface, one to a cell (\`keep\` of the cells have one) → x = how lit this point is · y = that cell's own dice */
vec2 speck(vec2 p, float keep, vec2 stretch, float rad) {
  vec2 c = floor(p), f = p - c;
  float h = h21(c), h2 = h21(c + 17.3);
  float d = length((f - vec2(0.25 + 0.5 * h2, 0.25 + 0.5 * fract(h * 57.3))) * stretch);
  return vec2(step(h, keep) * (1.0 - smoothstep(rad * 0.3, rad, d)), h2);
}
void main() {
  float r = length(vW.xz);
  if (vW.z < 0.0 && r > uRW) discard;          // (its far shore is the shaft's wall)
  // THE WATERLINE (screen space): under it the camera is under water — the plane is gone
  vec2 ndc = vClip.xy / vClip.w;
  float wl = uLine + 0.035 * sin(ndc.x * 9.0 + uTime * 7.0) + 0.02 * sin(ndc.x * 23.0 - uTime * 11.0);
  if (ndc.y < wl) discard;
  vec3 toCam = cameraPosition - vW;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  float far = clamp((dist - 3.2) / 5.5, 0.0, 1.0);
  vec2 g = swell(vW.xz, uTime) * mix(1.0, 0.55, far);                    // (calmer with distance: far ripples are finer than a pixel)
  // THE RINGS where the tower meets the water: soft rings running out from the floor's edge, dying as they go
  vec2 rd = vW.xz / max(r, 1e-4);
  float rEnv = smoothstep(uRO * 0.9, uRO * 1.03, r) * exp(-max(r - uRO, 0.0) * 3.2), rPh = r * 22.0 - uTime * 1.5 + 0.6 * sin(atan(vW.x, vW.z) * 3.0 + uTime * 0.4);
  g += rd * sin(rPh) * rEnv * 1.3;
  float ringHi = pow(max(cos(rPh), 0.0), 3.0) * rEnv;
  // THE RING WAVE of the plunge: rings running out from the impact, dying as they go
  float dI = length(vW.xz - uImpact), age = uTime - uSplashT, ring = 0.0;
  if (age > 0.0 && age < 3.0) {
    float ph = dI * 9.0 - age * 13.0, env = exp(-dI * 0.55) * exp(-age * 1.1) * smoothstep(0.0, 0.25, age * 5.0 - dI);
    ring = cos(ph) * env;
    g += normalize(vW.xz - uImpact + 1e-4) * sin(ph) * env * 2.2;
  }
  // the surface's light: the swells' faces toward the far wall catch the shaft's light (a broad sheen), their crests a hot glint
  float face = g.y + 0.35 * g.x, sheen = smoothstep(0.25, 1.5, face), crest = smoothstep(0.9, 1.9, face + 0.5 * ringHi);
  float sy = clamp(ndc.y * 0.5 + 0.5, 0.0, 1.0);   // (0 = the bottom of the screen · 1 = its top)
  // where the mirrored ray (off the surface at rest) meets the shaft's wall: the wall's lamps over this point
  vec2 Rh = -V.xz;
  float a = dot(Rh, Rh), b = dot(vW.xz, Rh), cc = r * r - uRW * uRW, tt = (-b + sqrt(max(0.0, b * b - a * cc))) / max(a, 1e-5);
  vec2 hit = vW.xz + Rh * tt;
  float s = length(Rh) * tt;                    // (how far out from the wall's foot this point lies)
  float u = atan(hit.x, -hit.y) * 0.15915494 * uTileW + g.x * (0.006 + 0.01 * s);
  float bias = 5.0 - clamp(log2(fwidth(u) * 1024.0 + 1e-4), -3.0, 5.0);
  float v1 = mix(0.125, 0.155, uDay), v2 = mix(0.375, 0.345, uDay);
  vec3 c1 = texture2D(tWall, vec2(u, v1), bias).rgb, c2 = texture2D(tWall, vec2(u, v2), bias).rgb;
  c1 *= c1; c2 *= c2;
  float l1 = dot(c1, vec3(0.3, 0.55, 0.15)) * smoothstep(0.22, 0.55, (c1.r - c1.b) / (c1.r + c1.b + 1e-4));
  float l2 = dot(c2, vec3(0.3, 0.55, 0.15)) * smoothstep(0.22, 0.55, (c2.r - c2.b) / (c2.r + c2.b + 1e-4));
  float lamp = smoothstep(mix(0.05, 0.16, uDay), mix(0.2, 0.32, uDay), max(l1, l2)) * uHaveW;
  // THE LAMP COLUMN: straight down the middle from the tower toward the viewer, the far wall's own lamp — broken up by the waves
  float cw = (0.055 + 0.006 * max(vW.z, 0.0)) * mix(0.62, 1.0, uDay), cx = vW.x + g.x * 0.04 + 0.02 * sin(vW.z * 13.0 + uTime);
  float colm = exp(-cx * cx / (cw * cw)) * smoothstep(uRO * 0.7, uRO * 1.3, vW.z) * exp(-max(vW.z - uRO, 0.0) / 2.4);
  // (the waves cut a lamp's light into bright flecks: lit on the faces toward the light, dark between)
  float bands = 0.5 + 0.5 * sin(vW.z * 21.0 + g.y * 3.6 - uTime * 1.1);
  float brk = smoothstep(0.42, 0.88, bands) * (0.6 + 0.4 * smoothstep(-0.3, 0.8, face));
  float hc = h21(vec2(floor(u * 32.0), 7.0));
  float streak = lamp * lamp * lamp * smoothstep(0.45, 0.85, bands) * exp(-s / (1.0 + 1.2 * hc)) * smoothstep(0.0, 0.2, s);
  float amber = smoothstep(0.12, 0.65, min(colm * brk * 1.3 + streak * 0.5, 1.0));   // (a faint amber over the blue reads BROWN: bright flecks only)
  vec3 col, glow = vec3(0.0);
  vec2 tb = vW.xz - uBall.xz;
  float pool = exp(-dot(tb, tb) / 0.4) * step(vW.y, uBall.y);
  if (uDay < 0.5) {
    // ---- NIGHT (Claude's recolour of mock B): dark teal, its swells lit teal, the amber column, a few pink / violet / cyan glints, plankton
    col = mix(vec3(0.002, 0.016, 0.03), vec3(0.008, 0.075, 0.1), smoothstep(0.05, 0.85, sy));
    col *= 0.9 + 0.36 * sheen;
    col += vec3(0.012, 0.13, 0.14) * sheen * sheen + vec3(0.06, 0.34, 0.34) * crest * 0.4;
    col += vec3(0.02, 0.14, 0.15) * ringHi * 0.8;
    col = mix(col, vec3(1.0, 0.62, 0.24), min(amber * 1.05, 0.92));
    col += vec3(0.4, 0.26, 0.08) * amber * amber;
    glow += vec3(0.5, 0.26, 0.06) * amber * 0.35;
    vec2 gl = speck(vW.xz * 7.0 + g * 0.1 + 3.7, 0.2, vec2(1.0, max(V.y, 0.3) * 2.0), 0.1);
    vec3 gc = mix(mix(vec3(1.0, 0.3, 0.75), vec3(0.62, 0.35, 1.0), step(0.33, fract(gl.y * 7.0))), vec3(0.3, 0.9, 1.0), step(0.66, fract(gl.y * 7.0)));
    gc *= gl.x * pow(0.5 + 0.5 * sin(uTime * 1.7 + gl.y * 50.0), 4.0) * (0.45 + 0.55 * crest) * (1.0 - far) * 1.1;
    // glowing cyan PLANKTON: a few specks riding the swell, breathing slowly (round ON THE SCREEN: drawn longer toward the viewer)
    vec2 pk = speck((vW.xz + g * 0.03) * 3.4 + vec2(uTime * 0.02, 0.0), 0.5, vec2(1.0, V.y), 0.055);
    vec3 pc = vec3(0.22, 0.9, 1.0) * pk.x * (0.35 + 0.65 * fract(pk.y * 13.7)) * (0.6 + 0.4 * sin(uTime * 0.9 + pk.y * 40.0));
    col += gc + pc; glow += (gc + pc) * 0.6;
    col = mix(col, vec3(1.0, 0.45, 0.8), pool * pool * 0.12);
    col = min(col, vec3(0.9));
  } else {
    // ---- DAY (Grok's mock B): a saturated ocean blue deepening toward the bottom of the screen, real swells (their faces lit sky-blue),
    // the warm amber lamp column breaking up on the waves, small white glints on the crests
    col = mix(vec3(0.002, 0.03, 0.17), vec3(0.01, 0.12, 0.5), smoothstep(0.0, 0.6, sy));
    col = mix(col, vec3(0.02, 0.2, 0.6), smoothstep(0.5, 0.9, sy));
    col *= 0.9 + 0.36 * sheen;
    col += vec3(0.03, 0.15, 0.32) * sheen * sheen + vec3(0.25, 0.5, 0.75) * crest * 0.22;
    col += vec3(0.1, 0.3, 0.5) * ringHi * 0.7;
    col = mix(col, vec3(1.0, 0.66, 0.24), min(amber * 1.1, 0.95));
    col += vec3(0.5, 0.36, 0.12) * amber * amber;
    glow += vec3(0.5, 0.28, 0.06) * amber * 0.3;
    // SUN GLINTS — small, only on the moving crests, each a short blink (never a static dot: they ride the waves)
    vec2 sp = speck(vW.xz * 10.0 + g * 0.16 + vec2(0.0, uTime * 0.1), 0.5, vec2(1.0, max(V.y, 0.25) * 2.2), 0.09);
    float glint = sp.x * smoothstep(0.5, 1.5, face) * pow(0.5 + 0.5 * sin(uTime * 3.1 + sp.y * 60.0), 6.0) * (1.0 - 0.5 * far);
    col = mix(col, vec3(1.0, 0.97, 0.9), min(glint, 0.85));
    col = mix(col, vec3(1.0, 0.25, 0.62), pool * pool * 0.25);
    col = min(col, vec3(0.9));
  }
  // THE FOAM: a soft line where the water meets the wall + round the pillar (by night only a faint pale edge)
  float ang = atan(vW.x, -vW.z), fe = vn2(vec2(ang * 9.0, uTime * 0.25)) * 0.16 + 0.04 * sin(ang * 31.0 + uTime * 0.8);
  float wallF = smoothstep(uRW - 0.24 - fe, uRW - 0.02, r) * (1.0 - smoothstep(-0.6, 0.4, vW.z));
  float pillF = 1.0 - smoothstep(uRP + 0.03 + fe * 0.3, uRP + 0.15 + fe * 0.6, r);
  // (F5C — by DAY the far wall's foam was a pale ICE-RINK rim: the water now sinks into the wall there — a soft darker wet edge; the foam
  //  stays round the pillar, softer. By night as before.)
  float foam = uDay > 0.5 ? pillF * 0.6 : max(wallF, pillF);
  col = mix(col, mix(vec3(0.07, 0.3, 0.38), vec3(0.85, 0.96, 1.0), uDay), foam * mix(0.28, 0.85, uDay));
  col *= 1.0 - 0.45 * uDay * smoothstep(uRW - 0.5, uRW - 0.02, r) * (1.0 - smoothstep(-0.6, 0.4, vW.z));
  col += mix(vec3(0.5, 0.95, 1.0), vec3(1.0), 0.5) * max(ring, 0.0) * 0.5;      // the ring's crest catches the light
  col = min(col, vec3(1.0));
  // the meniscus: a bright wet line where the surface meets the lens
  float men = 1.0 - smoothstep(0.0, 0.05, ndc.y - wl);
  col = mix(col, mix(vec3(0.6, 1.0, 1.0), vec3(1.0), 0.4), men * step(-1.5, uLine) * 0.85);
  if (uBloom > 0.5) col = vec3(1.0) * max(ring, 0.0) * 0.25 + glow;
  gl_FragColor = vec4(col, 1.0);               // (F5A: the surface hides what is under it — at 0.97 the floors below showed through as ghost rings)
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE SEABED (THE BOTTOM — floor 200): real sand (Ground 055 S: colour + normal), lit from above; the tower's own glow + the ball's
// light lie on it; by day the water's caustics. THE IMPACT: a shockwave ring of sand + light runs out from under the ball (uImpT).
// SAND = the look, shared by the plane (SEABED_F — outside the square that cracks) and the pieces (CHUNK_F — the square that cracks open).
const SAND = /* glsl */`
${HASH}
uniform sampler2D tSand, tSandN;
uniform float uHaveS, uFlipS, uHaveSN, uFlipSN, uTime, uDay, uBloom, uImpT, uRW, uHole, uCrisp;
uniform vec3 uRimC, uBall;
uniform vec2 uImpact;
/** THE TRENCH's MOUTH (SOLO — the tower goes on down; the fresh-eyes review: the floor under the ball is ALWAYS in sight): the bed is open
 *  round the tower's foot + along the cleft that runs from it toward the viewer — everything the camera sees the lower floors through.
 *  → how far outside the mouth's ragged edge a point of the bed is (under 0 = in it). uHole = 0 (a finish): no mouth, the bed is whole. */
/** (F5A — the review: the bed ended in a ruler-straight line against the wall) the bed thins out toward the shaft's FAR wall: what is behind it shows through → how much of it is there */
float farFade(vec2 xz) { return 1.0 - smoothstep(uRW - 1.0, uRW - 0.04, length(xz)) * smoothstep(0.3, -0.6, xz.y); }
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
  // F5A — THE SAND READS AS SAND: its own warm colour kept (it was washed to one grey-teal / one flat violet), SOFT LIGHT across it — low
  // dunes (a slow swell of light + shade) —, a fine grain, and single grains that catch the light near the ball + the tower's foot
  float dune = vn2(xz * 0.5 + 3.0) * 0.62 + vn2(xz * 1.6 + 11.0) * 0.38, grain = vn2(xz * 64.0), soft = 0.62 + 0.76 * dune;
  c *= 0.86 + 0.28 * grain;
  // by night: deep blue-violet sand, the tower's rim glow in a pool round its foot, the ball's own warm light (the sand's true colour shows in it) · by day: sunlit sand under blue water + the caustics
  vec3 night = c * vec3(0.075, 0.07, 0.19) * (0.34 + 0.95 * dif) * soft + c * uRimC * pool * (0.4 + 0.6 * dif) + c * vec3(1.0, 0.7, 0.74) * ball * 0.9;
  vec3 day = c * vec3(0.82, 0.82, 0.72) * (0.42 + 0.92 * dif) * soft + c * vec3(0.5, 0.92, 0.95) * (sc1(xz * 1.4, uTime) + 0.6 * sc1(xz * 2.4 + 3.1, uTime * 1.31 + 2.0)) * 0.42 + c * vec3(0.55, 0.78, 0.9) * pool * 0.4;
  vec3 col = mix(night, day, uDay);
  // (… and it goes off into the water's own haze toward the shaft's far wall: never a hard bright line where the bed ends)
  col = mix(col, mix(vec3(0.008, 0.008, 0.035), vec3(0.02, 0.15, 0.3), uDay), smoothstep(uRW - 1.3, uRW, r) * step(xz.y, 0.0) * 0.8);
  // THE SHOCKWAVE of the impact: a ring of lifted sand + light
  float age = uTime - uImpT, emit = 0.0;
  if (age > 0.0 && age < 1.8) {
    float dI = length(xz - uImpact), rr = 0.25 + 4.6 * (1.0 - exp(-2.3 * age)), band = exp(-pow((dI - rr) / (0.16 + 0.2 * age), 2.0)) * (1.0 - smoothstep(0.7, 1.7, age));
    // (F5B — THE BOTTOM's SHARE PICTURE alone, uCrisp: the ring stands TIGHT round the ball, a thin crisp gold line at its full strength —
    //  in the card it was a wide pale band + a white pool: "a hazy white blur at 360 px")
    if (uCrisp > 0.5) { rr = 0.3; band = exp(-pow((dI - rr) / 0.035, 2.0)); }   // (≈ 2.4 balls out — the ball is 0.125 wide a side)
    // (F5A: a FINISH's ring is GOLD — uHole 0: the bed is whole, the run MADE IT; the gold band's own colour, the share card's gold ring)
    col += c * mix(0.5, 0.15, step(uHole, 0.0)) * band + mix(mix(mix(uRimC, vec3(1.0), 0.35) * 1.5, vec3(0.75, 1.0, 1.0), uDay), vec3(1.0, 0.56, 0.09), step(uHole, 0.0)) * band * mix(0.5, 0.8, step(uHole, 0.0));   // (F5A: a ring of lifted sand + light — never a clipped white band where it meets the far edge)
    emit = band * 0.5;
    col += mix(vec3(1.0, 0.9, 0.7) * 1.2, vec3(1.0, 0.72, 0.3) * 0.7, step(uHole, 0.0)) * exp(-dI * dI / 0.35) * exp(-age * 5.0) * (1.0 - 0.85 * uCrisp);   // (a finish: a gold flash, held down — never a white pool; the share picture: all but none)
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
  float fo = uOuter * farFade(q);
  gl_FragColor = vec4(col * fo, fo);
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
  float alpha = (1.0 - fly * smoothstep(0.6, 1.0, vK)) * farFade(vRest.xz);
  if (uBloom > 0.5) col = mix(uRimC, vec3(1.0), 0.3) * (s.w * 0.6 + crack * 0.7);
  gl_FragColor = vec4(col * alpha, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
/** THE ROCKS on the bed (a few instanced boulders: aP = its place + size, aS = its squash + turn). F5A — THE ROCKS READ AS ROCKS: a
 *  smooth, worn boulder (breaks.js: a finer ball, pushed about by a slow noise — never a spiky low-poly lump), lit softly from above +
 *  by the tower's own glow, darker where it sits in the sand, mottled stone with sand lying on its top; each on its own soft SHADOW. */
export const ROCK_V = /* glsl */`
attribute vec4 aP;
attribute vec3 aS;
uniform vec3 uOrigin;
uniform float uTime, uBreakT;
varying vec3 vN, vW, vL;
varying float vGone;
void main() {
  float c = cos(aS.z), s = sin(aS.z);
  vec3 p = position * vec3(aS.x, aS.y, 1.0) * aP.w, n = normalize(normal / vec3(aS.x, aS.y, 1.0));
  p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); n = vec3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);
  float age = max(0.0, uTime - uBreakT - 0.15 - 0.1 * aS.z);   // (the bed cracks open: they go down with it)
  vec4 w = vec4(uOrigin + aP.xyz + p + vec3(0.0, -4.5 * age * age, 0.0), 1.0);
  vW = w.xyz; vN = n; vL = position * (1.0 + aS.z); vGone = age / 1.2;
  gl_Position = vGone > 1.0 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * w;
}`;
export const ROCK_F = /* glsl */`
uniform float uDay, uBloom;
uniform vec3 uRimC, uOrigin;
varying vec3 vN, vW, vL;
varying float vGone;
${HASH}
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float key = max(dot(N, normalize(vec3(-0.35, 0.8, 0.5))), 0.0), hemi = 0.5 + 0.5 * N.y, r = length(vW.xz);
  // mottled stone: a slow patchwork + a fine grain; sand lies on its top (the bed's own colour)
  float mott = vn2(vL.xz * 2.6 + vL.y * 1.9), fine = vn2(vL.xy * 15.0 + vL.z * 9.0);
  vec3 stone = mix(vec3(0.17, 0.17, 0.19), vec3(0.4, 0.38, 0.36), mott) * (0.82 + 0.36 * fine);
  stone = mix(stone, vec3(0.6, 0.51, 0.37), smoothstep(0.5, 0.92, N.y + 0.25 * (fine - 0.5)) * 0.8);
  // darker where it sits in the sand; a soft edge light against the water behind it
  float ao = 0.4 + 0.6 * smoothstep(0.0, 0.16, vW.y - uOrigin.y), rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 night = stone * vec3(0.1, 0.095, 0.24) * (0.3 + 0.5 * hemi + 0.8 * key) * ao + stone * uRimC * exp(-r * r / 3.4) * 1.3 * max(0.0, dot(N, normalize(vec3(-vW.x, 0.8, -vW.z)))) + vec3(0.1, 0.12, 0.3) * rim * 0.5;
  vec3 day = stone * vec3(0.58, 0.8, 0.86) * (0.3 + 0.45 * hemi + 0.8 * key) * ao + vec3(0.3, 0.6, 0.7) * rim * 0.22;
  vec3 col = mix(night, day, uDay);
  float alpha = 1.0 - clamp(vGone, 0.0, 1.0);
  if (uBloom > 0.5) col = vec3(0.0);
  gl_FragColor = vec4(col * alpha, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
/** … a rock's SHADOW on the sand (a soft dark pool under it, thrown a little away from the light — the same instances as the rocks) */
export const RSHADOW_V = /* glsl */`
attribute vec4 aP;
attribute vec3 aS;
uniform vec3 uOrigin;
uniform float uTime, uBreakT;
varying vec2 vUv;
varying float vGone;
void main() {
  float c = cos(aS.z), s = sin(aS.z);
  vec3 p = position * vec3(aS.x, 1.0, 1.0) * aP.w * 2.9;
  p = vec3(p.x * c + p.z * s, 0.0, -p.x * s + p.z * c);
  float age = max(0.0, uTime - uBreakT - 0.15 - 0.1 * aS.z);
  vUv = position.xz * 2.0; vGone = age / 0.3;
  gl_Position = projectionMatrix * viewMatrix * vec4(uOrigin + vec3(aP.x + 0.3 * aP.w, 0.012, aP.z - 0.25 * aP.w) + p, 1.0);
}`;
export const RSHADOW_F = /* glsl */`
uniform float uDay, uBloom;
varying vec2 vUv;
varying float vGone;
void main() {
  float d = length(vUv), a = (1.0 - smoothstep(0.25, 1.0, d)) * mix(0.62, 0.5, uDay) * (1.0 - clamp(vGone, 0.0, 1.0)) * (1.0 - uBloom);
  gl_FragColor = vec4(vec3(0.0), a);
}`;

// ---- THE DAY FINISH's SUN RAYS (F5A — THE DAY CELEBRATION): shafts of sunlight falling through the water from high above onto the spot
// where the ball came down — a fan of soft moving rays on one upright card behind the ball (turned to the camera in its vertex shader),
// pure added light; it comes with the burst of bubbles (uT0) and is gone 3.4 s later.
export const RAYS_V = /* glsl */`
uniform vec3 uO;
varying vec2 vP;
void main() {
  vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]));
  vP = position.xy;
  gl_Position = projectionMatrix * viewMatrix * vec4(uO + right * position.x * 4.4 + vec3(0.0, (position.y + 0.5) * 6.5, 0.0), 1.0);
}`;
export const RAYS_F = /* glsl */`
uniform float uTime, uT0, uBloom;
varying vec2 vP;
void main() {
  float y = vP.y + 0.5, a = vP.x / mix(0.92, 0.3, y), t = uTime * 0.4;      // (the fan: wide on the bed, narrow high above)
  float rays = 0.5 + 0.5 * sin(a * 41.0 + t * 1.3 + sin(a * 9.0 - t) * 2.0);
  rays = rays * rays * rays * (0.55 + 0.45 * sin(a * 97.0 - t * 2.3)) + 0.12;     // (many thin shafts on a faint veil of light — never two wide bars)
  float env = (1.0 - smoothstep(0.2, 0.5, abs(a))) * smoothstep(0.0, 0.1, y) * (1.0 - smoothstep(0.82, 1.0, y)) * (0.4 + 0.6 * y);
  float age = uTime - uT0, life = smoothstep(0.0, 0.45, age) * (1.0 - smoothstep(2.3, 3.4, age));
  vec3 col = mix(vec3(0.5, 0.95, 1.0), vec3(1.0, 0.97, 0.78), y) * rays * env * life * 0.3;   // (the review: rays + dust never add up to a white-out)
  if (uBloom > 0.5) col *= 0.3;
  gl_FragColor = vec4(col, 0.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
