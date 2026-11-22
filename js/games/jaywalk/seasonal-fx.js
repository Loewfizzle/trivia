// JAYWALK — THE SEASONAL PACK's SHADERS (JT1 — ROOM FIRST, docs/jaywalk.md "JT1 — SEASONS"; J4 "WINTER" moved here VERBATIM): fetched only in
// season (season-gate.js#seasonWindow) or when the lab forces a date — never in the start bundle (tests/jaywalk-jt1.test.mjs). A VIEW: the
// ground's season (J4's snow + plowed roads + WET NEON STREETS · JT1's golden grass + the fallen leaves), the tops' snow + AUTUMN's turned
// trees (a patch on the scene's lit materials), and THE FALL (ONE draw: J4's snowflakes — or JT1's drifting leaves).
import * as THREE from 'three';

/** the ground's season: these replace the start bundle's stubs (night-fx.js //SEA{ … //}SEA — ground.setSea) */
export const SEA_GLSL = `//SEA{
uniform float uSnow; uniform float uAut; uniform float uLN; uniform vec4 uL[16]; uniform vec3 uLC[16];   // (J4 — WINTER + WET NEON STREETS · JT1 — AUTUMN)
// J4 — THE SNOW on a ground lane (uSnow: 0 none · a dusting → 1 full · the melt = patchy, the grass back): procedural (no texture), soft
// drifts; DAY crisp white + STRONG BLUE SHADOWS in the drifts + along the banks (never white-on-white); NIGHT blue-lavender + a faint sparkle
// (the neon / headlight pools are the glow quads' own light over it). bank = how near a road / water / rail edge (0 … 1).
vec3 snowOn(vec3 c, float x, float lw, float bank, float k) {
  if (uSnow < 0.001) return c;
  float n = 0.62 * vnoise(vec2(x * 0.55, lw * 0.7) + 11.0) + 0.38 * vnoise(vec2(x * 1.9, lw * 2.3) + 5.0);
  float thr = 1.12 - uSnow * 1.18, cov = smoothstep(thr - 0.1, thr + 0.1, n) * k;
  float dust = uSnow * 0.35 * (0.5 + 0.5 * hash(floor(vec2(x * 22.0, lw * 22.0)))) * k;
  float dr = vnoise(vec2(x * 0.5 + lw * 0.13, lw * 0.95) + 2.0), rip = vnoise(vec2(x * 2.6 - lw * 0.7, lw * 1.4));
  float sas = smoothstep(0.2, 1.0, sin((x * 0.9 + lw * 2.4 + vnoise(vec2(x * 0.7, lw * 1.1)) * 3.5) * 3.1416)) * smoothstep(0.35, 0.7, dr);   // (wind ridges in the drifts)
  vec3 lite = DN(vec3(0.40, 0.41, 0.60), vec3(0.975, 0.985, 1.0)), shad = DN(vec3(0.16, 0.17, 0.36), vec3(0.52, 0.64, 0.90));
  float sh = clamp((1.0 - smoothstep(0.22, 0.72, dr)) * 0.72 + bank * 1.05 + (rip - 0.5) * 0.2 + sas * 0.12, 0.0, 1.0);
  vec3 sn = mix(lite, shad, sh);
  sn *= 0.985 + 0.03 * hash(floor(vec2(x * 30.0, lw * 30.0)));
  if (uQ > 0.5) {   // (the sparkle: a few tiny glints, twinkling gently — brighter by night)
    vec2 gq = vec2(x * 34.0, lw * 34.0); float gh = hash(floor(gq) + 1.3);
    sn += vec3(1.0) * step(0.986, gh) * smoothstep(0.32, 0.0, length(fract(gq) - 0.5)) * (0.55 + 0.45 * sin(uTime * 2.2 + gh * 60.0)) * mix(0.55, 0.25, uDay) * cov;
  }
  return mix(mix(c, sn, dust), sn, cov);
}
// J4 — WET NEON STREETS: the lights' soft coloured streaks on the asphalt, running from under each light toward the camera (a planar fake —
// no draw call, no texture: the ≤ 16 nearest lights the scene hands over each frame — night-fx.js uL / uLC), + the wet gloss itself.
vec3 wetRoad(vec3 c, float x, float ly, float n1) {
  float wv = uWet;
  c *= 1.0 - 0.34 * wv;
  float mot = vnoise(vec2(x * 1.6, ly * 0.9)) * 0.6 + 0.4 * vnoise(vec2(x * 5.0, ly * 3.0));
  float gl = smoothstep(0.35, 0.8, mot);   // (the puddled patches gloss most)
  vec3 add = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    if (float(i) >= uLN) break;
    vec4 L = uL[i]; float dx = x - L.x, dl = L.y - ly;
    if (abs(dx) > 1.4 || dl < -0.35 || dl > 4.0) continue;
    float w = 0.16 + 0.1 * max(dl, 0.0) + 0.06 * (1.0 - gl);
    float along = smoothstep(-0.35, 0.05, dl) * exp(-max(dl, 0.0) * mix(0.95, 0.55, wv));
    float wob = 0.05 * sin(ly * 9.0 + L.x * 3.0) * (0.5 + gl);
    add += uLC[i] * L.z * exp(-(dx + wob) * (dx + wob) / (w * w)) * along * (0.45 + 0.75 * gl);
  }
  c += add * wv * 0.95;
  vec3 sky = mix(vec3(0.20, 0.06, 0.24), vec3(0.06, 0.10, 0.26), smoothstep(0.3, 0.7, n1));   // (the night city's glow in the gloss)
  c += sky * gl * wv * 0.3;
  return c;
}
// JT1 — AUTUMN on a ground lane (uAut 0 … 1): real grass (the opening · the canal's moss) turns a little golden-olive, and FALLEN LEAVES lie
// scattered — small leaf shapes in orange · red · gold, a grid of chances (no texture, no draw); by night darker, catching the neon a little
vec3 leafAt(vec2 q, float dens, float salt, out float m) {
  vec2 id = floor(q), f = fract(q) - 0.5; m = 0.0;
  float h = hash(id + salt);
  if (h > dens) return vec3(0.0);
  float a = hash(id + salt + 3.1) * 6.2832, s = 0.24 + 0.13 * hash(id + salt + 9.4);
  vec2 o = (vec2(hash(id + salt + 1.3), hash(id + salt + 5.9)) - 0.5) * 0.45, p = f - o;
  p = vec2(cos(a) * p.x - sin(a) * p.y, sin(a) * p.x + cos(a) * p.y);
  float tip = 1.0 - 0.35 * smoothstep(-0.2, 1.0, p.x / s);   // (a leaf: a point at one end)
  float d = length(vec2(p.x / s, p.y / (s * 0.5 * tip)));
  m = 1.0 - smoothstep(0.78, 1.0, d);
  m *= 1.0 - 0.35 * smoothstep(0.06, 0.0, abs(p.y)) * step(abs(p.x), s * 0.8);   // (its midrib)
  float pick = hash(id + salt + 11.2);
  vec3 col = pick < 0.42 ? vec3(0.96, 0.44, 0.08) : pick < 0.72 ? vec3(0.82, 0.15, 0.07) : vec3(0.99, 0.74, 0.13);
  return col * (0.82 + 0.3 * hash(id + salt + 2.6));
}
vec3 leavesOn(vec3 c, float x, float lw, float k, float ar) {
  if (uAut < 0.001) return c;
  float gk = ar < 0.5 ? 1.0 : ar > 5.5 && ar < 6.5 ? 0.6 : 0.0;
  vec3 gold = c * vec3(1.5, 1.12, 0.4) + DN(vec3(0.022, 0.012, 0.0), vec3(0.075, 0.045, 0.0));
  c = mix(c, gold, uAut * 0.78 * gk * (0.7 + 0.3 * vnoise(vec2(x * 0.6, lw * 0.6))));
  float dens = uAut * k * mix(0.16, 0.34, gk), m1, m2;
  vec3 l1 = leafAt(vec2(x * 3.2, lw * 3.2), dens, 7.7, m1), l2 = leafAt(vec2(x * 5.1 + 0.37, lw * 5.1 + 0.61), dens * 0.9, 21.3, m2);
  float nk = mix(0.36, 0.93, uDay);
  c = mix(c, l2 * nk, m2 * 0.95);
  c = mix(c, l1 * nk, m1);
  return c;
}
vec3 seaGround(vec3 c, float x, float lw, float bank, float k, float ar) { return snowOn(leavesOn(c, x, lw, k, ar), x, lw, bank, k); }
vec3 seaRoad(vec3 c, float x, float z, float rly, float curbD, float curbU) {
    if (uSnow > 0.001) {                                           // J4 — PLOWED: the asphalt stays dark; SLUSH banked along the curbs, a grey wet sheen in the wheel ruts
      float sn = vnoise(vec2(x * 1.7, rly * 3.0)), sn2 = vnoise(vec2(x * 5.0, rly * 6.0));
      float wB = (0.13 + 0.07 * sn) * smoothstep(0.0, 0.5, uSnow), slD = smoothstep(wB + 0.035, wB - 0.02, z) * curbD, slU = smoothstep(wB + 0.035, wB - 0.02, 1.0 - z) * curbU;
      float sl = max(slD, slU) * (0.75 + 0.25 * sn2);
      vec3 slush = DN(vec3(0.25, 0.25, 0.35), vec3(0.80, 0.82, 0.87)) * (0.86 + 0.18 * sn2);
      c *= 1.0 - 0.18 * smoothstep(wB + 0.12, wB, min(z, 1.0 - z)) * max(curbD, curbU);   // (the bank's shadow on the road)
      float rut = smoothstep(0.06, 0.0, abs(abs(fract(z * 2.0) - 0.5) - 0.25)) * 0.5 * uSnow;
      c = mix(c, c * 1.18 + DN(vec3(0.015, 0.015, 0.03), vec3(0.04, 0.04, 0.05)), rut * (1.0 - sl));
      c = mix(c, slush, sl * min(1.0, uSnow * 1.6));
      c += DN(vec3(0.05, 0.05, 0.08), vec3(0.12, 0.12, 0.13)) * step(0.993, hash(floor(vec2(x * 26.0, rly * 26.0)))) * uSnow;   // (a few salt / slush flecks)
    }
    if (uAut > 0.001) {                                            // JT1 — a few LEAVES blown into the gutters (along the curbs only)
      float gz = min(z * curbD + (1.0 - curbD) * 9.0, (1.0 - z) * curbU + (1.0 - curbU) * 9.0), m;
      vec3 l = leafAt(vec2(x * 4.3, rly * 4.3), uAut * 0.5, 33.1, m);
      c = mix(c, l * mix(0.32, 0.86, uDay), m * smoothstep(0.17, 0.08, gz));
    }
  return c;
}
//}SEA`;

// ---- THE TOPS (J4): a top face takes the snow — its world normal's y, the ground's own amount; the colour is lit like the face, so the
// night's is lavender. JT1 — AUTUMN's TREES (`leaf`): the round trees' canopy (its green-dominant vertex colours) turns ORANGE · RED · GOLD,
// a colour per tree picked from where it stands (stable: every frame + every phone the same), the turning trees first as autumn grows.
const SNOW_V = `
  jwSnowK = 1.0;
  #ifdef USE_INSTANCING_COLOR
    jwSnowK = max(instanceColor.r, max(instanceColor.g, instanceColor.b));
  #endif
  vec3 jwN = objectNormal;
  #ifdef USE_INSTANCING
    jwN = mat3(instanceMatrix) * jwN;
  #endif
  jwSnowUp = normalize(mat3(modelMatrix) * jwN).y;`;
// (a top face takes the snow: its world normal's y — the ground's own amount; the colour is lit like the face, so the night's is lavender)
const snowPatch = (sh, SNOW) => {
  sh.uniforms.uSnowK = SNOW;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float jwSnowUp; varying float jwSnowK;').replace('#include <defaultnormal_vertex>', `#include <defaultnormal_vertex>${SNOW_V}`);
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float jwSnowUp; varying float jwSnowK; uniform float uSnowK;')
    .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 1.0) * min(jwSnowK, 1.0), smoothstep(0.62, 0.9, jwSnowUp) * smoothstep(0.08, 0.6, uSnowK) * 0.92);');
};
const LEAF_V = `
  vec3 jwT = vec3(0.0);
  #ifdef USE_INSTANCING
    jwT = instanceMatrix[3].xyz;
  #endif
  float jwH = fract(sin(dot(floor(jwT.xz * 4.0 + 0.5), vec2(12.9898, 78.233))) * 43758.5453), jwH2 = fract(jwH * 57.31);
  vec3 jwA = jwH < 0.38 ? vec3(0.98, 0.47, 0.07) : jwH < 0.7 ? vec3(0.86, 0.16, 0.06) : vec3(1.0, 0.72, 0.12);
  jwLeafC = jwA * (0.88 + 0.24 * sin(position.y * 11.0 + position.x * 7.0 + jwH * 20.0));
  jwLeafK = smoothstep(jwH2 * 0.8, jwH2 * 0.8 + 0.2, uAutK);`;
/** wrap a lit material (the start bundle's fogUp) with the season's patch: the snow on its tops; `leaf` = a round tree — autumn too */
export function seaPatch(mat, U, leaf) {
  const base = mat.onBeforeCompile;
  mat.onBeforeCompile = sh => {
    base(sh); snowPatch(sh, U.snow);
    if (!leaf) return;
    sh.uniforms.uAutK = U.aut;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uAutK; varying vec3 jwLeafC; varying float jwLeafK;').replace('#include <begin_vertex>', `#include <begin_vertex>${LEAF_V}`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 jwLeafC; varying float jwLeafK;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  float jwG = step(diffuseColor.r * 1.12, diffuseColor.g) * jwLeafK;\n  { float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)); diffuseColor.rgb = mix(diffuseColor.rgb, jwLeafC * min(1.35, lum / 0.2) * 0.92, jwG); }')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * 0.2 * jwG;');   // (the palette colour × the canopy's own shading; a touch of their own warmth — the turned trees read by night too)
  };
  mat.customProgramCacheKey = () => (leaf ? 'jw-fogup-sea-leaf' : 'jw-fogup-sea');
  mat.needsUpdate = true;
  return mat;
}

// ---- J4 — THE FALLING SNOW (ONE draw call): instanced soft flakes, ALL their motion in the vertex shader (no per-frame CPU work but the
// uniforms). FAR flakes live in a world box round the camera's focus (wrapped — they never swim as the camera follows); the few BIG soft
// near-camera flakes (heavy only) are screen-space, at the screen's EDGES only. Every flake is see-through and fades out over the lanes just
// in front of the kid (uKid — his place on the screen); the lights draw AFTER it (renderOrder) — every gameplay light shows over the snow.
// By night a flake near one of THE LIGHTS catches its colour. HEAVY SNOW CHANGES NOTHING IN PLAY: it is a picture over the scene.
const SNOW_V2 = `
attribute vec4 aSeed;
uniform float uTime; uniform vec3 uFocus; uniform vec3 uKid; uniform float uAspect; uniform float uNear; uniform float uDay; uniform float uFall; uniform vec2 uFog; uniform float uLN; uniform vec4 uL[16]; uniform vec3 uLC[16]; uniform float uLeaf;
varying vec2 vUv; varying float vA; varying vec3 vCol;
void main() {
  vUv = position.xy + 0.5;
  bool near = aSeed.w > 0.965 && uNear > 0.5;   // (heavy snow only)
  float t = uTime;
  vec3 col = mix(vec3(0.86, 0.88, 1.0), vec3(0.97, 0.985, 1.0), uDay);
  float a;
  vec4 clip;
  if (near) {                                                        // a BIG soft flake near the lens — the screen's edges only
    float side = aSeed.x < 0.5 ? -1.0 : 1.0, sp = 0.05 + 0.05 * aSeed.z;
    float y = 1.25 - fract(aSeed.y + t * sp) * 2.5, x = side * (0.74 + 0.26 * fract(aSeed.x * 7.3) + 0.03 * sin(t * 0.7 + aSeed.z * 9.0));
    float s = 0.045 + 0.05 * aSeed.z;
    clip = vec4(x + position.x * s / uAspect * 2.0, y + position.y * s * 2.0, -0.999, 1.0);
    a = 0.26 + 0.14 * aSeed.z;
  } else {
    float W = 15.0, D = 30.0, Hh = 5.5, sp = uFall * (0.75 + 0.5 * aSeed.w);
    float y = Hh - mod(aSeed.y * Hh + t * sp, Hh);
    float px = uFocus.x + (fract((aSeed.x * W - uFocus.x + 0.35 * sin(t * 0.45 + aSeed.z * 20.0) + t * (0.18 + 0.22 * uLeaf)) / W) - 0.5) * W;
    float pz = uFocus.z + (fract((aSeed.z * D - uFocus.z) / D) - 0.5) * D;
    vec4 mv = viewMatrix * vec4(px, y, pz, 1.0);
    float s = (0.035 + 0.05 * aSeed.w * aSeed.w) * (1.0 + 0.35 * uFall);
    if (uLeaf > 0.5) {                                              // JT1 — A LEAF: bigger, turning over as it drifts down (its width breathes), at its own slant
      float tum = sin(t * (1.4 + 1.6 * aSeed.z) + aSeed.x * 30.0), an = aSeed.z * 6.2832 + t * (0.4 + 0.5 * aSeed.y) * (aSeed.x < 0.5 ? -1.0 : 1.0);
      vec2 q = vec2(position.x * (0.3 + 0.7 * abs(tum)), position.y) * (0.07 + 0.05 * aSeed.w) * 2.0;
      mv.xy += vec2(cos(an) * q.x - sin(an) * q.y, sin(an) * q.x + cos(an) * q.y);
      float pk = fract(aSeed.y * 13.7);
      col = (pk < 0.42 ? vec3(0.98, 0.5, 0.1) : pk < 0.72 ? vec3(0.9, 0.2, 0.08) : vec3(1.0, 0.78, 0.16)) * mix(0.62, 1.0, uDay);
    } else mv.xy += position.xy * s * 2.0;
    clip = projectionMatrix * mv;
    a = (0.5 + 0.35 * aSeed.w) * (1.0 - 0.18 * uLeaf) * (1.0 - smoothstep(uFog.x, uFog.y, -mv.z)) * smoothstep(0.0, 0.6, y) * smoothstep(0.42, 0.62, -mv.z / uFog.x);   // (none near the lens but the edge flakes: never a big blur mid-screen)
    if (uDay < 0.5) for (int i = 0; i < 16; i++) {                  // (by night: a flake near a light catches its colour)
      if (float(i) >= uLN) break;
      vec2 d = vec2(px + 4.5 - uL[i].x, -pz - uL[i].y);
      col += uLC[i] * uL[i].z * 0.55 / (1.0 + dot(d, d) * 2.5 + y * y * 0.35);
    }
  }
  vec2 nd = clip.xy / clip.w; float dy = nd.y - uKid.y;   // (the lanes just in front of the kid — the WHOLE width, a car coming from the side too: kept clear)
  a *= 1.0 - 0.94 * smoothstep(-0.16, -0.04, dy) * (1.0 - smoothstep(0.34, 0.5, dy));
  vA = a; vCol = col;
  gl_Position = clip;
}`;
const SNOW_F = `
precision highp float;
uniform float uLeaf;
varying vec2 vUv; varying float vA; varying vec3 vCol;
void main() { vec2 p = vUv - 0.5; float d = uLeaf > 0.5 ? length(p * vec2(2.0, 3.6 - 1.4 * p.x)) : length(p) * 2.0, a = (uLeaf > 0.5 ? smoothstep(1.0, 0.72, d) : smoothstep(1.0, 0.25, d)) * vA; if (a < 0.004) discard; gl_FragColor = vec4(min(vCol, vec3(1.0)), a); }`;
/** THE FALL — the falling snow (J4), or JT1's drifting leaves (uLeaf 1): `max` flakes (an instance count picks how many show) → { mesh, uniforms, show(count) } */
export function createFall(max, fog, LIGHTS) {
  const base = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.attributes.position);
  const seed = new Float32Array(max * 4);
  let x = 0x9e3779b9;
  const rnd = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
  for (let i = 0; i < max * 4; i++) seed[i] = rnd();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.instanceCount = 0;
  const uniforms = { uTime: { value: 0 }, uFocus: { value: new THREE.Vector3() }, uKid: { value: new THREE.Vector3(0, -0.2, 0) }, uAspect: { value: 0.46 }, uNear: { value: 0 }, uDay: { value: 0 }, uFall: { value: 1 }, uFog: { value: fog }, uLeaf: { value: 0 },
    uLN: LIGHTS.n, uL: { value: LIGHTS.pos }, uLC: { value: LIGHTS.col } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: SNOW_V2, fragmentShader: SNOW_F, uniforms, transparent: true, depthWrite: false }));
  mesh.frustumCulled = false; mesh.renderOrder = 1.5; mesh.visible = false;   // (after the shadows, BEFORE every light: the lights draw over the snow)
  return { mesh, uniforms, show(n) { g.instanceCount = Math.min(max, n); mesh.visible = n > 0; }, dispose() { g.dispose(); base.dispose(); mesh.material.dispose(); } };
}
