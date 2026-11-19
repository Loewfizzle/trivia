// HIGH RISE — THE NIGHT LOOK's SHADERS + THE BLOOM (S2 — docs/highrise.md "THE NIGHT LOOK"; night.js builds the scene). three.js core
// only: no add-on, no post-processing library. Everything is written in LINEAR light and ends in three's own colour-space chunk.
// THE DAY LOOK (S3 — docs/highrise.md "THE DAY LOOK") is the SAME programs: every material carries `uDay` (0 = night … 1 = day — the
// look switch cross-fades it), so a switch builds nothing (THE LAG RULES) and the night's own maths are untouched at uDay = 0.
import * as THREE from 'three';

// ---- THE GLASS: every box on screen (one instanced mesh). aFx = (edge glow, white flash, alpha, kind) — kind 0 a slab · 2 the sliding
// slab (a stronger colour) · 3 a lit tape (YOUR BEST's gold) · 4 the sliding slab's trail (aFx.y = ±1 along x / ±2 along z: the side the
// slab is on).
export const GLASS_V = /* glsl */`
attribute vec3 aColor;
attribute vec4 aFx, aUp;
varying vec3 vLocal, vHalf, vNl, vNw, vWorld, vColor;
varying vec4 vFx, vUp;
void main() {
  vUp = aUp;
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vLocal = position * sc; vHalf = sc * 0.5; vNl = normal;
  mat3 rot = mat3(instanceMatrix[0].xyz / sc.x, instanceMatrix[1].xyz / sc.y, instanceMatrix[2].xyz / sc.z);
  vNw = normalize(rot * normal);
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = wp.xyz; vColor = aColor; vFx = aFx;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
export const GLASS_F = /* glsl */`
uniform float uBloom, uTopY, uFadeH, uEnvOn, uEnvRot, uEnvFlip, uDay, uEnvDOn, uEnvDFlip;
uniform sampler2D uEnv, uEnvD;
uniform vec3 uSun, uHaze;
varying vec3 vLocal, vHalf, vNl, vNw, vWorld, vColor;
varying vec4 vFx, vUp;
const float LW = 0.0085, HALO = 0.03;
// THE REFLECTION MAP: the HDRI's sky half (its foot row = the horizon) — a ray below the horizon mirrors up into it; the build's tone
// curve is undone here (v = x / (1 + x), gamma 2.2), so the city's lights come back hot. (flip = 1: the picture came as an
// ImageBitmap — decoded off the frame, its first row at v = 0.)
vec3 envAt(sampler2D t, vec3 r, float flip) {
  float u = atan(r.z, r.x) * 0.15915494 + 0.5 + uEnvRot;
  float v = asin(clamp(abs(r.y), 0.0, 1.0)) * 0.63661977;
  v = clamp(v, 0.02, 0.98);
  vec3 c = pow(texture2D(t, vec2(u, mix(v, 1.0 - v, flip))).rgb, vec3(2.2));
  return c / (1.0 - min(c, vec3(0.93)));
}
// (THE DAY LOOK: the slab ABOVE this one — aUp = its x0, x1, z0, z1 in the world; x1 < x0 = none — throws its shadow on this slab's ledge)
float sdUp(vec2 p) { vec2 q = max(vUp.xz - p, p - vUp.yw); return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
void main() {
  float kind = vFx.w;
  vec3 an = abs(vNl);
  // each face's own distance to its border (world units): the lit edge is drawn from it — crisp at any size, no texture
  vec3 d = vHalf - abs(vLocal);
  float e = min(an.x > 0.5 ? 1e3 : d.x, min(an.y > 0.5 ? 1e3 : d.y, an.z > 0.5 ? 1e3 : d.z));
  float aa = fwidth(e) * 1.25 + 1e-5;
  float line = 1.0 - smoothstep(LW - aa, LW + aa, e);
  float halo = exp(-e / HALO);
  vec3 N = normalize(vNw), V = normalize(cameraPosition - vWorld);
  float top = step(0.5, N.y);
  // the tower dims as it falls away under the top slab (the play is at the top)
  float fall = clamp(1.0 - (uTopY - vWorld.y) / uFadeH, 0.0, 1.0); fall *= fall;
  float dim = 0.13 + 0.87 * fall;
  vec3 col; float alpha = vFx.z;
  if (kind > 2.5 && kind < 3.5) {
    col = vColor * (1.25 * vFx.x) + vec3(vFx.y);
    if (uBloom > 0.5) col *= 0.8;
  } else if (kind > 3.5) {
    float ax = abs(vFx.y) < 1.5 ? vLocal.x / vHalf.x : vLocal.z / vHalf.z;
    float t = clamp(0.5 + 0.5 * ax * sign(vFx.y), 0.0, 1.0);
    col = vColor * (0.35 + 1.1 * line);
    // (by day the trail is the slab's own colour as pale paint — light on a bright sky adds nothing)
    col = mix(col, mix(vColor, vec3(1.0), 0.2 + 0.7 * line), uDay);
    alpha = vFx.z * t * (0.35 + 0.65 * line);
    if (uBloom > 0.5) col *= 0.5;
  } else {
    // SMOKED GLASS in the slab's colour: the top face the brightest (a soft sheen across it), the left face lit, the right in shade,
    // each side face brighter up at its lit edge
    float lit = top > 0.5 ? 1.0 : (an.x > 0.5 ? 0.58 : 0.34);
    float grad = top > 0.5 ? 0.8 + 0.5 * smoothstep(-1.0, 1.0, 0.5 * (vLocal.x / vHalf.x + vLocal.z / vHalf.z)) : mix(0.45, 1.0, clamp(0.5 + vLocal.y / (2.0 * vHalf.y), 0.0, 1.0));
    float fill = kind > 1.5 ? 2.4 : 1.0;
    vec3 body = vColor * (0.045 + 0.23 * lit * grad) * fill;
    // the reflection: the city's lights, held in (never a white wash) and half-tinted by the glass itself
    vec3 R = reflect(-V, N);
    float fres = 0.1 + 0.9 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 env = uDay < 0.999 ? min(envAt(uEnv, R, uEnvFlip), vec3(2.2)) : vec3(0.0);
    vec3 refl = mix(env, vColor * dot(env, vec3(0.3, 0.6, 0.1)) * 1.7, 0.5) * uEnvOn * (top > 0.5 ? 0.2 : 0.13) * (0.5 + 2.0 * fres);
    vec3 hot = mix(vColor, vec3(1.0), 0.4);
    vec3 edge = (hot * line * 1.7 + vColor * halo * 0.7) * vFx.x;
    vec3 flash = vec3(vFx.y) * (0.3 + 0.7 * max(line, halo));
    if (uBloom > 0.5) { col = (edge * 0.9 + flash) * mix(0.35, 1.0, dim) * (1.0 - uDay); }
    else { col = (body + refl) * dim + edge * mix(0.4, 1.0, dim) + flash; alpha = vFx.z * mix(0.9, 1.0, max(line, top * 0.5)); }
    if (uDay > 0.001 && uBloom < 0.5) {
      // ---- THE DAY LOOK: FROSTED GLASS + POLISHED CHROME RIMS, lit by ONE sun (behind, on the left) + the sky. A milky body, the
      // band's pastel showing through the MIDDLE of each side face; the top the brightest; the face turned from the sun in cool
      // shade; the slab above throws its shadow on a ledge; the day sky mirrored in it; a light haze as the tower falls away.
      float slider = step(1.5, kind);
      float ndl = max(dot(N, uSun), 0.0);
      float hy = clamp(abs(vLocal.y) / vHalf.y, 0.0, 1.0);
      float core = top > 0.5 ? 0.3 : mix(0.94, 0.46, smoothstep(0.15, 0.95, hy));
      vec3 milk = mix(vec3(0.94, 0.965, 1.0), vColor, core);
      // (THE SLIDING SLAB: its colour at full strength — night.js hands it the band's ACCENT: the clearest thing on a sunlit screen)
      vec3 strong = vColor * (top > 0.5 ? 1.0 : 0.72) + vec3(0.03);
      milk = mix(milk, strong, slider);
      // the sky's fill (cool on a face turned from the sun) + the sun
      vec3 amb = mix(vec3(0.2, 0.27, 0.46), vec3(0.42, 0.46, 0.52), N.y * 0.5 + 0.5);
      vec3 light = amb + vec3(1.0, 0.95, 0.86) * (0.8 * ndl);
      light = mix(light, max(light, vec3(0.74)), slider);
      // the top: warm where it faces the sun, cool away from it; a side: brighter up at its lit edge
      float across = smoothstep(-1.0, 1.0, 0.5 * (vLocal.z / vHalf.z - vLocal.x / vHalf.x));
      vec3 sheen = top > 0.5 ? mix(vec3(0.86, 0.92, 1.0), vec3(1.05, 1.02, 0.97), across) : vec3(mix(0.84, 1.06, clamp(0.5 + vLocal.y / (2.0 * vHalf.y), 0.0, 1.0)));
      vec3 dcol = milk * light * sheen;
      // THE SUN's GLINT: one soft band of light slanting down the lit face of the whole tower (it rides with the camera — a reflection, not paint)
      if (top < 0.5 && an.z > 0.5) dcol += vec3(1.0, 0.97, 0.9) * 0.2 * exp(-pow((vWorld.x * 0.8 + (uTopY - vWorld.y) * 0.5 - 0.1) / 0.2, 2.0)) * (1.0 - slider);
      if (top > 0.5 && vUp.y > vUp.x) {
        float ao = smoothstep(0.0, 0.06, sdUp(vWorld.xz));
        float shade = smoothstep(-0.004, 0.014, sdUp(vWorld.xz + uSun.xz / uSun.y * (2.0 * vHalf.y)));
        dcol *= mix(vec3(0.5, 0.56, 0.72), vec3(1.0), min(shade, 0.4 + 0.6 * ao));
      }
      vec3 envd = min(envAt(uEnvD, R, uEnvDFlip), vec3(3.0)) * uEnvDOn;
      dcol += envd * (top > 0.5 ? 0.11 : 0.07) * (0.35 + 2.4 * fres) * (1.0 - 0.6 * slider);
      // the chrome rim: a bright line where it catches the sun, a darker line just inside it (polished metal reads by its contrast)
      float lw = LW * 1.3;
      float rim = 1.0 - smoothstep(lw - aa, lw + aa, e);
      float inner = (1.0 - smoothstep(lw * 2.5 - aa, lw * 2.5 + aa, e)) * (1.0 - rim);
      vec3 chrome = mix(vec3(0.62, 0.7, 0.84), vec3(1.0), clamp(0.3 + 0.95 * ndl + 0.35 * top, 0.0, 1.0)) * (0.92 + 0.16 * vFx.x);
      dcol = mix(dcol, dcol * mix(0.7, 0.5, slider), inner * 0.6);
      // (the sliding slab's EDGE GLOW: its faces lift to white toward the rim)
      dcol = mix(dcol, vec3(1.0), slider * 0.5 * exp(-e / 0.04));
      dcol = mix(dcol, mix(chrome, vec3(1.0), slider), rim);
      // a landing's flare + a PERFECT's flash: gold-white by day
      dcol = mix(dcol, vec3(1.0, 0.94, 0.72) * 1.08, clamp(vFx.y * (0.4 + 0.5 * max(rim, halo)), 0.0, 1.0));
      dcol = mix(dcol, uHaze, (1.0 - fall) * 0.5 * (1.0 - slider));
      col = mix(col, dcol, uDay); alpha = mix(alpha, vFx.z, uDay);
    }
  }
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE PLATES: the band's painted backdrop — two pictures cross-faded, each drifting through its slack (bands.js)
export const PLATE_V = /* glsl */`
varying vec2 vS;
void main() { vS = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
export const PLATE_F = /* glsl */`
uniform sampler2D tA, tB, tC, tD;   // (tA · tB = the NIGHT look's two plates, tC · tD = the DAY look's — a look switch cross-fades the pairs by uDay)
uniform float uMix, uHaveA, uHaveB, uHaveC, uHaveD, uDriftA, uDriftB, uDim, uFlipA, uFlipB, uFlipC, uFlipD, uDay, uSpace, uTime, uAspect;
uniform vec2 uFit;
varying vec2 vS;
// (no picture yet: a plain night sky — dark navy up top, a violet glow low; by day a clear blue one)
vec3 sky(float day) { return mix(mix(vec3(0.016, 0.006, 0.05), vec3(0.003, 0.002, 0.012), smoothstep(0.0, 0.8, vS.y)), mix(vec3(0.42, 0.62, 0.9), vec3(0.1, 0.3, 0.72), vS.y), day); }
// (flip = 1: the picture came as an ImageBitmap — decoded off the frame, its first row at v = 0: night.js "THE PLATES")
vec3 plate(sampler2D t, float have, float drift, float flip, float day) {
  vec2 uv = vec2(0.5 + (vS.x - 0.5) * uFit.x, drift * (1.0 - uFit.y) + vS.y * uFit.y);
  uv.y = mix(uv.y, 1.0 - uv.y, flip);
  return mix(sky(day), texture2D(t, uv).rgb, have);
}
// ---- DEEP SPACE (S3 — past THE MOTHERSHIP, floor 200 on, both looks): slow drifting stars in two depths + an aurora's ribbons, over
// the last plate (uSpace 0 … 1). Light only — it is added.
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float stars(vec2 p, float n, float seed) {
  vec2 g = p * n, c = floor(g), f = fract(g) - 0.5;
  float h = hash(c + seed);
  vec2 o = (vec2(hash(c + seed + 3.1), hash(c + seed + 7.7)) - 0.5) * 0.7;
  float r = length(f - o), tw = 0.55 + 0.45 * sin(uTime * (0.6 + 2.2 * h) + h * 40.0);
  return step(0.86, h) * smoothstep(0.05, 0.012, r) * tw;
}
vec3 space() {
  vec2 p = vec2((vS.x - 0.5) * uAspect, vS.y);
  float s = stars(p + vec2(0.0, uTime * 0.012), 30.0, 0.0) * 0.8 + stars(p + vec2(0.0, uTime * 0.026), 17.0, 9.0) * 1.25;
  // the aurora: two ribbons that wave slowly, green into violet, in the upper half
  float w1 = 0.66 + 0.07 * sin(p.x * 3.1 + uTime * 0.13) + 0.035 * sin(p.x * 7.3 - uTime * 0.21);
  float w2 = 0.8 + 0.06 * sin(p.x * 2.3 - uTime * 0.1 + 1.7) + 0.03 * sin(p.x * 6.1 + uTime * 0.17);
  float a1 = exp(-pow((p.y - w1) / 0.07, 2.0)) * (0.6 + 0.4 * sin(p.x * 21.0 + uTime * 0.5)), a2 = exp(-pow((p.y - w2) / 0.09, 2.0)) * (0.6 + 0.4 * sin(p.x * 17.0 - uTime * 0.4));
  vec3 au = vec3(0.1, 0.85, 0.5) * a1 * 0.17 + vec3(0.5, 0.25, 0.9) * a2 * 0.15;
  return vec3(0.82, 0.9, 1.0) * s + au;
}
void main() {
  vec3 n = uDay < 0.999 ? mix(plate(tA, uHaveA, uDriftA, uFlipA, 0.0), plate(tB, uHaveB, uDriftB, uFlipB, 0.0), uMix) * uDim : vec3(0.0);
  vec3 d = uDay > 0.001 ? mix(plate(tC, uHaveC, uDriftA, uFlipC, 1.0), plate(tD, uHaveD, uDriftB, uFlipD, 1.0), uMix) : vec3(0.0);
  vec3 c = mix(n, d, uDay);
  if (uSpace > 0.001) c += space() * uSpace;
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE SPARKS: a spark = its start (aO), its throw (aV), (its birth s, its life s, its width) in aT, its colour — flown HERE: a
// streak from where it was 35 ms ago to where it is, under gravity. Nothing is stepped on the CPU.
export const SPARK_V = /* glsl */`
attribute vec3 aO, aV, aT, aC;
uniform float uTime, uAspect;
varying float vK; varying vec2 vQ; varying vec3 vC;
vec3 at(float t) { return aO + aV * t + vec3(0.0, -4.5 * t * t, 0.0); }
void main() {
  float age = uTime - aT.x, k = age / aT.y;
  if (age < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vK = 1.0; vQ = vec2(0.0); vC = vec3(0.0); return; }
  vec4 c1 = projectionMatrix * viewMatrix * vec4(at(age), 1.0);
  vec4 c0 = projectionMatrix * viewMatrix * vec4(at(max(0.0, age - 0.035)), 1.0);
  vec2 p1 = c1.xy / c1.w, p0 = c0.xy / c0.w;
  vec2 dir = (p1 - p0) * vec2(uAspect, 1.0);
  float len = length(dir);
  dir = len > 1e-5 ? dir / len : vec2(0.0, 1.0);
  float wid = aT.z * (1.0 - 0.6 * k) * 1.1;
  vec2 off = dir * position.y * (len + wid) + vec2(dir.y, -dir.x) * position.x * wid;
  off.x /= uAspect;
  gl_Position = vec4(((p0 + p1) * 0.5 + off) * c1.w, c1.z, c1.w);
  vK = k; vQ = position.xy * 2.0; vC = aC;
}`;
// (S3 — both looks in ONE program: drawn ONE · ONE_MINUS_SRC_ALPHA. By night the alpha is 0 — pure added light, as before; by day it
// is PAINT in its own colour — warm gold —, which reads on a bright sky where added light washes out.)
export const SPARK_F = /* glsl */`
uniform float uDay;
varying float vK; varying vec2 vQ; varying vec3 vC;
void main() {
  float a = (1.0 - abs(vQ.x)) * (1.0 - vQ.y * vQ.y) * (1.0 - vK * vK);
  vec3 hue = mix(vec3(1.0, 0.97, 0.92), vC, smoothstep(0.0, 0.55, vK));
  float pa = min(1.0, a * 1.5);
  gl_FragColor = vec4(mix(hue * a * 1.7, hue * pa, uDay), pa * uDay);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE RINGS OF LIGHT: flat on a slab's top — aP = (centre, strength) · aA = (half x, half z, reach, life s) · aB = (colour, birth s).
// The ring is the slab's own OUTLINE running outward (the distance to its rectangle), fading as it goes.
export const RING_V = /* glsl */`
attribute vec4 aA, aB, aP;
uniform float uTime;
varying vec2 vP; varying vec4 vA, vB; varying float vS;
void main() {
  vec2 size = 2.0 * (aA.xy + aA.z) + 0.12;
  vP = position.xz * size; vA = aA; vB = aB; vS = aP.w;
  float k = (uTime - aB.w) / aA.w;
  vec3 wp = aP.xyz + vec3(vP.x, 0.0, vP.y);
  gl_Position = k < 0.0 || k > 1.0 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
export const RING_F = /* glsl */`
uniform float uTime, uDay;
varying vec2 vP; varying vec4 vA, vB; varying float vS;
void main() {
  float k = clamp((uTime - vB.w) / vA.w, 0.0, 1.0);
  vec2 q = abs(vP) - vA.xy;
  float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float r = vA.z * (1.0 - (1.0 - k) * (1.0 - k) * (1.0 - k));
  float wd = 0.018 + 0.05 * k, x = (sdf - r) / wd;
  float band = exp(-x * x), wash = sdf > 0.0 && sdf < r ? 0.16 : 0.0, fade = (1.0 - k) * (1.0 - k);
  // (by day the ring is PAINT — gold-white, a white-hot heart: night.js hands the colour; by night added light, as before)
  float pa = clamp((band + wash * 0.5) * fade * vS, 0.0, 1.0);
  gl_FragColor = vec4(mix(vB.rgb * (band * 1.5 + wash) * fade * vS, mix(vB.rgb, vec3(1.0), band * band * 0.55) * pa, uDay), pa * uDay);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- YOUR BEST's GOLD TAPE (S2 FIX — the owner: "a THIN glowing gold OUTLINE round the tower, not a solid band — it read as a slab"):
// a band of four side faces round the slab of that floor, and on it ONE thin line of light at the slab's mid height — ≈ 3 px at 3×
// (never under ~2 device px at any tier: its width follows the pixel), a soft glow off it, NO fill, no lid. Drawn TWICE (night.js):
// the faces towards the camera at full strength WITH depth (the sliding slab + a falling piece pass in front of it), the faces turned
// away FAINT and through the glass (uFace — the outline goes all the way round), and those only once the tape lies well under the
// top: just crossed, they drew a bright diamond inside the top slab — in the aim zone (the fresh-eyes review).
// The line COVERS what is behind it (premultiplied: its gold stays gold on a cyan slab — added light turned it green); in the bloom
// pass it is held down (uBloom): the blur's added light washed the gold to lemon.
export const TAPE_LINE = 0.0021, TAPE_GLOW = 0.016, TAPE_BACK = 0.3;
export const TAPE_V = /* glsl */`
uniform float uH;
varying float vY; varying vec3 vN;
void main() { vY = position.y * uH; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const TAPE_F = /* glsl */`
uniform vec3 uCol;
uniform float uGlow, uWhite, uFace, uBloom, uDay;
varying float vY; varying vec3 vN;
void main() {
  if (abs(vN.y) > 0.5 || uFace < 0.004) discard;   // (no top, no foot: an outline, never a lid)
  float px = fwidth(vY) + 1e-6, a = abs(vY);
  float hw = max(1.1 * px, ${TAPE_LINE.toFixed(4)});
  float line = 1.0 - smoothstep(hw - 0.75 * px, hw + 0.75 * px, a);
  float halo = exp(-a / ${TAPE_GLOW.toFixed(4)}) * 0.42;
  float k = uFace * (uBloom > 0.5 ? 0.4 : 1.0);
  // (the line + its glow never ADD past the gold itself: 1.4 × the colour clipped its red and read as lemon — the look review)
  // (THE DAY LOOK: the glow goes — light adds nothing to a bright sky — and a DARKER OUTLINE lies under the gold line, both sides,
  //  so the tape still reads on white glass + blue sky)
  float glow = halo * (1.0 - 0.85 * uDay);
  float dark = (1.0 - smoothstep(hw + 1.2 * px, hw + 2.7 * px, a)) * (1.0 - line) * uDay * 0.85;
  vec3 c = (uCol * (line + glow * (1.0 - line)) + vec3(uWhite) * line) * uGlow * k + vec3(0.2, 0.085, 0.01) * dark * k;
  gl_FragColor = vec4(c, min(1.0, line + glow * 0.6 + dark) * k);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE FLYERS (S3 — docs/highrise.md "THE FLYERS"; flyers.js flies them, night.js holds their stage). Two programs, BUILT IN THE
// WARM FRAME on a stand-in triangle (THE LAG RULES: a model that lands later brings only its buffers):
// A FLYER's BODY — a model's vertex colours lit in the WORLD: by day the tower's own sun + the sky's fill + a soft highlight; by night
// a moonlit top, the city's glow from below, a rim of light round its outline (a near-black jet must read on a dark sky). uEmit = a
// light its BELLY gives off (the UFO's violet, THE MOTHERSHIP's warm underside); uHaze sets it IN the air.
export const FLY_V = /* glsl */`
attribute vec3 color;
varying vec3 vN, vNl, vW, vC;
void main() {
  vC = color; vNl = normal; vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
export const FLY_F = /* glsl */`
uniform float uDay, uBloom, uOpacity, uHazeK, uLift;
uniform vec3 uSun, uTint, uRim, uEmit, uHazeC;
varying vec3 vN, vNl, vW, vC;
void main() {
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);
  vec3 alb = vC * uTint;
  vec3 dayL = vec3(0.3, 0.37, 0.52) * (0.65 + 0.35 * N.y) + vec3(1.0, 0.96, 0.88) * (0.95 * max(dot(N, uSun), 0.0));
  float spec = pow(max(dot(reflect(-uSun, N), V), 0.0), 28.0);
  vec3 day = alb * dayL + vec3(1.0, 0.97, 0.9) * spec * 0.4 + vec3(0.5, 0.62, 0.8) * fres * 0.12;
  vec3 albN = mix(alb, vec3(0.2, 0.22, 0.3), uLift);
  vec3 nightL = vec3(0.08, 0.09, 0.16) + vec3(0.26, 0.32, 0.5) * max(N.y, 0.0) + vec3(0.4, 0.12, 0.42) * (0.6 * max(-N.y, 0.0));
  vec3 night = albN * nightL * 1.9 + uRim * fres * 0.55;
  float under = pow(max(-vNl.y, 0.0), 1.5);
  vec3 col = mix(night, day, uDay) + uEmit * under;
  col = mix(col, uHazeC, uHazeK);
  if (uBloom > 0.5) col = uEmit * under * 0.5 * (1.0 - uDay);
  gl_FragColor = vec4(col, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
// THE FLYERS' LIGHTS — one instanced quad for every light a flyer carries: aP = (its place in the world, half its width) · aQ = (half
// its length along aAx — 0 = round —, its kind, its strength, PAINT) · aC its colour · aAx its axis in the world (a flame, a trail,
// the finish's beam: the +axis end is its HEAD). Kinds: 0 a round glow (a hot heart) · 1 a flame (bright at its head, a point at its
// tail) · 2 a vapour trail (a soft ribbon fading to its tail) · 3 THE FINISH's light (a cone: narrow at the ship, wide on the slab).
// PAINT 0 = added light (ONE · ONE_MINUS_SRC_ALPHA with alpha 0) … 1 = paint in its own colour (it reads on a bright sky).
export const LIGHT_V = /* glsl */`
attribute vec4 aP, aQ;
attribute vec3 aC, aAx;
uniform float uAspect;
varying vec2 vQ; varying vec3 vK, vC;
void main() {
  vec4 c = projectionMatrix * viewMatrix * vec4(aP.xyz, 1.0);
  float sx = projectionMatrix[0][0], sy = projectionMatrix[1][1], len = aP.w;
  vec2 dir = vec2(0.0, 1.0);
  if (aQ.x > 0.0) {
    vec4 c2 = projectionMatrix * viewMatrix * vec4(aP.xyz + aAx, 1.0);
    vec2 d = (c2.xy / c2.w - c.xy / c.w) * vec2(uAspect, 1.0);
    float l = length(d);
    dir = l > 1e-6 ? d / l : vec2(0.0, 1.0);
    len = aQ.x * min(1.0, l * c.w / sy);   // (an axis turned towards the lens is seen short)
  }
  vec2 off = dir * position.y * len * 2.0 + vec2(dir.y, -dir.x) * position.x * aP.w * 2.0;
  c.xy += vec2(off.x * sx, off.y * sy);
  gl_Position = c;
  vQ = position.xy * 2.0; vK = aQ.yzw; vC = aC;
}`;
export const LIGHT_F = /* glsl */`
varying vec2 vQ; varying vec3 vK, vC;
void main() {
  float kind = vK.x, a, heart = 0.0, t = vQ.y * 0.5 + 0.5;
  if (kind < 0.5) { float r = length(vQ); a = exp(-r * r * 4.5) * smoothstep(1.0, 0.7, r); heart = a * a; }
  else if (kind < 1.5) { float w = 1.0 - vQ.x * vQ.x / max(0.05, t * t); a = max(w, 0.0) * t * t * smoothstep(1.0, 0.9, t); heart = a * a; }
  else if (kind < 2.5) { a = exp(-vQ.x * vQ.x * 3.2) * t * smoothstep(1.0, 0.94, t) * (1.0 - 0.999 * step(1.0, abs(vQ.x))); }
  else { float w = mix(1.0, 0.3, t), x = abs(vQ.x) / w; a = smoothstep(1.0, 0.15, x) * (0.5 + 0.5 * t) * smoothstep(0.0, 0.06, t); heart = smoothstep(0.5, 0.0, x) * 0.5; }
  a *= vK.y;
  gl_FragColor = vec4(mix(vC, vec3(1.0), min(1.0, heart * 0.8)) * a, a * vK.z);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- THE HALF-RES BLOOM (tier 2 only): the scene's LIGHTS again (every material's uBloom pass: its lit edges, sparks, rings — the
// glass itself black, still hiding what is behind it) → a half-res target → blurred at a quarter → added back over the picture
const QUAD_V = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const BLUR_F = `precision highp float; uniform sampler2D tMap; uniform vec2 uStep; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tMap, vUv).rgb * 0.227027;
  c += (texture2D(tMap, vUv + uStep * 1.3846).rgb + texture2D(tMap, vUv - uStep * 1.3846).rgb) * 0.316216;
  c += (texture2D(tMap, vUv + uStep * 3.2308).rgb + texture2D(tMap, vUv - uStep * 3.2308).rgb) * 0.070270;
  gl_FragColor = vec4(c, 1.0);
}`;
const ADD_F = 'precision highp float; uniform sampler2D tMap; uniform float uK; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tMap, vUv).rgb * uK, 1.0); }';
export const BLOOM_K = 0.62;
export function createBloom(renderer, uBloom) {
  const opt = { depthBuffer: true, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const a = new THREE.WebGLRenderTarget(4, 4, opt), b = new THREE.WebGLRenderTarget(4, 4, { ...opt, depthBuffer: false }), c = new THREE.WebGLRenderTarget(4, 4, { ...opt, depthBuffer: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), qs = new THREE.Scene(), qc = new THREE.Camera();
  quad.frustumCulled = false; qs.add(quad);
  const blur = new THREE.ShaderMaterial({ vertexShader: QUAD_V, fragmentShader: BLUR_F, uniforms: { tMap: { value: null }, uStep: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false });
  const add = new THREE.ShaderMaterial({ vertexShader: QUAD_V, fragmentShader: ADD_F, uniforms: { tMap: { value: null }, uK: { value: BLOOM_K } }, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending });
  const black = new THREE.Color(0x000000), keep = new THREE.Color();
  return {
    size(w, h) { a.setSize(Math.max(2, w >> 1), Math.max(2, h >> 1)); b.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); c.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); },
    /** after the main picture: the lights again → blur → add. `hide` = what is no light at all (the plate). `twins` = [mesh, its
     *  material for THIS pass, (a slot)] — S2 FIX, THE LAG HUNT: one material drawn to the screen AND into a target is given a
     *  different program by three.js each time (the target's colour space) — it re-worked the program's whole key, a ~150-field object +
     *  a long string, SIX times a frame: megabytes of garbage a second, the collector's pauses. A twin is only ever drawn here. */
    render(scene, cam, hide, twins, k = 1) {
      const auto = renderer.autoClear, was = hide ? hide.visible : false;
      renderer.getClearColor(keep); const alpha = renderer.getClearAlpha();
      renderer.setClearColor(black, 1);
      if (hide) hide.visible = false;
      uBloom.value = 1;
      if (twins) for (let i = 0; i < twins.length; i++) { const t = twins[i]; t[2] = t[0].material; t[0].material = t[1]; }
      renderer.setRenderTarget(a); renderer.clear(); renderer.render(scene, cam);
      if (twins) for (let i = 0; i < twins.length; i++) { const t = twins[i]; t[0].material = t[2]; }
      uBloom.value = 0;
      if (hide) hide.visible = was;
      quad.material = blur;
      blur.uniforms.tMap.value = a.texture; blur.uniforms.uStep.value.set(1 / b.width, 0); renderer.setRenderTarget(b); renderer.render(qs, qc);
      blur.uniforms.tMap.value = b.texture; blur.uniforms.uStep.value.set(0, 1 / c.height); renderer.setRenderTarget(c); renderer.render(qs, qc);
      renderer.setRenderTarget(null); renderer.setClearColor(keep, alpha);
      quad.material = add; add.uniforms.tMap.value = c.texture; add.uniforms.uK.value = BLOOM_K * k;
      renderer.autoClear = false; renderer.render(qs, qc); renderer.autoClear = auto;
    },
    dispose() { a.dispose(); b.dispose(); c.dispose(); quad.geometry.dispose(); blur.dispose(); add.dispose(); },
  };
}
