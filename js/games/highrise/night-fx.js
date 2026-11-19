// HIGH RISE — THE NIGHT LOOK's SHADERS + THE BLOOM (S2 — docs/highrise.md "THE NIGHT LOOK"; night.js builds the scene). three.js core
// only: no add-on, no post-processing library. Everything is written in LINEAR light and ends in three's own colour-space chunk.
import * as THREE from 'three';

// ---- THE GLASS: every box on screen (one instanced mesh). aFx = (edge glow, white flash, alpha, kind) — kind 0 a slab · 2 the sliding
// slab (a stronger colour) · 3 a lit tape (YOUR BEST's gold) · 4 the sliding slab's trail (aFx.y = ±1 along x / ±2 along z: the side the
// slab is on).
export const GLASS_V = /* glsl */`
attribute vec3 aColor;
attribute vec4 aFx;
varying vec3 vLocal, vHalf, vNl, vNw, vWorld, vColor;
varying vec4 vFx;
void main() {
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vLocal = position * sc; vHalf = sc * 0.5; vNl = normal;
  mat3 rot = mat3(instanceMatrix[0].xyz / sc.x, instanceMatrix[1].xyz / sc.y, instanceMatrix[2].xyz / sc.z);
  vNw = normalize(rot * normal);
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = wp.xyz; vColor = aColor; vFx = aFx;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
export const GLASS_F = /* glsl */`
uniform float uBloom, uTopY, uFadeH, uEnvOn, uEnvRot;
uniform sampler2D uEnv;
varying vec3 vLocal, vHalf, vNl, vNw, vWorld, vColor;
varying vec4 vFx;
const float LW = 0.0085, HALO = 0.03;
// THE REFLECTION MAP: the HDRI's sky half (its foot row = the horizon) — a ray below the horizon mirrors up into it; the build's tone
// curve is undone here (v = x / (1 + x), gamma 2.2), so the city's lights come back hot
vec3 envAt(vec3 r) {
  float u = atan(r.z, r.x) * 0.15915494 + 0.5 + uEnvRot;
  float v = asin(clamp(abs(r.y), 0.0, 1.0)) * 0.63661977;
  vec3 c = pow(texture2D(uEnv, vec2(u, clamp(v, 0.02, 0.98))).rgb, vec3(2.2));
  return c / (1.0 - min(c, vec3(0.93)));
}
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
  float dim = clamp(1.0 - (uTopY - vWorld.y) / uFadeH, 0.0, 1.0); dim = 0.13 + 0.87 * dim * dim;
  vec3 col; float alpha = vFx.z;
  if (kind > 2.5 && kind < 3.5) {
    col = vColor * (1.25 * vFx.x) + vec3(vFx.y);
    if (uBloom > 0.5) col *= 0.8;
  } else if (kind > 3.5) {
    float ax = abs(vFx.y) < 1.5 ? vLocal.x / vHalf.x : vLocal.z / vHalf.z;
    float t = clamp(0.5 + 0.5 * ax * sign(vFx.y), 0.0, 1.0);
    col = vColor * (0.35 + 1.1 * line);
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
    vec3 env = min(envAt(R), vec3(2.2));
    vec3 refl = mix(env, vColor * dot(env, vec3(0.3, 0.6, 0.1)) * 1.7, 0.5) * uEnvOn * (top > 0.5 ? 0.2 : 0.13) * (0.5 + 2.0 * fres);
    vec3 hot = mix(vColor, vec3(1.0), 0.4);
    vec3 edge = (hot * line * 1.7 + vColor * halo * 0.7) * vFx.x;
    vec3 flash = vec3(vFx.y) * (0.3 + 0.7 * max(line, halo));
    if (uBloom > 0.5) { col = (edge * 0.9 + flash) * mix(0.35, 1.0, dim); }
    else { col = (body + refl) * dim + edge * mix(0.4, 1.0, dim) + flash; alpha = vFx.z * mix(0.9, 1.0, max(line, top * 0.5)); }
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
uniform sampler2D tA, tB;
uniform float uMix, uHaveA, uHaveB, uDriftA, uDriftB, uDim, uFlipA, uFlipB;
uniform vec2 uFit;
varying vec2 vS;
// (no picture yet: a plain night sky — dark navy up top, a violet glow low)
vec3 sky() { return mix(vec3(0.016, 0.006, 0.05), vec3(0.003, 0.002, 0.012), smoothstep(0.0, 0.8, vS.y)); }
// (flip = 1: the picture came as an ImageBitmap — decoded off the frame, its first row at v = 0: night.js "THE PLATES")
vec3 plate(sampler2D t, float have, float drift, float flip) {
  vec2 uv = vec2(0.5 + (vS.x - 0.5) * uFit.x, drift * (1.0 - uFit.y) + vS.y * uFit.y);
  uv.y = mix(uv.y, 1.0 - uv.y, flip);
  return mix(sky(), texture2D(t, uv).rgb, have);
}
void main() {
  vec3 c = mix(plate(tA, uHaveA, uDriftA, uFlipA), plate(tB, uHaveB, uDriftB, uFlipB), uMix) * uDim;
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
export const SPARK_F = /* glsl */`
varying float vK; varying vec2 vQ; varying vec3 vC;
void main() {
  float a = (1.0 - abs(vQ.x)) * (1.0 - vQ.y * vQ.y) * (1.0 - vK * vK);
  vec3 c = mix(vec3(1.0, 0.97, 0.92), vC, smoothstep(0.0, 0.55, vK)) * a * 1.7;
  gl_FragColor = vec4(c, 1.0);
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
uniform float uTime;
varying vec2 vP; varying vec4 vA, vB; varying float vS;
void main() {
  float k = clamp((uTime - vB.w) / vA.w, 0.0, 1.0);
  vec2 q = abs(vP) - vA.xy;
  float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float r = vA.z * (1.0 - (1.0 - k) * (1.0 - k) * (1.0 - k));
  float wd = 0.018 + 0.05 * k, x = (sdf - r) / wd;
  float band = exp(-x * x), wash = sdf > 0.0 && sdf < r ? 0.16 : 0.0, fade = (1.0 - k) * (1.0 - k);
  gl_FragColor = vec4(vB.rgb * (band * 1.5 + wash) * fade * vS, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ---- YOUR BEST's GOLD TAPE (S2 FIX — the owner: "a THIN glowing gold OUTLINE round the tower, not a solid band — it read as a slab"):
// a band of four side faces round the slab of that floor, and on it ONE thin line of light at the slab's mid height — ≈ 2–3 px at 3×
// (never under ~2 device px at any tier: its width follows the pixel), a soft glow off it, NO fill. The faces turned away from the camera
// are drawn too, FAINT (seen through the glass — the mesh ignores depth): the outline goes all the way round the tower.
// The line COVERS what is behind it (premultiplied: its gold stays gold on a cyan slab — added light turned it green: the look review).
export const TAPE_LINE = 0.0021, TAPE_GLOW = 0.011, TAPE_BACK = 0.3;
export const TAPE_V = /* glsl */`
uniform float uH;
varying float vY; varying vec3 vN;
void main() { vY = position.y * uH; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const TAPE_F = /* glsl */`
uniform vec3 uCol;
uniform float uGlow, uWhite;
varying float vY; varying vec3 vN;
void main() {
  if (abs(vN.y) > 0.5) discard;   // (no top, no foot: an outline, never a lid)
  float px = fwidth(vY) + 1e-6, a = abs(vY);
  float hw = max(1.1 * px, ${TAPE_LINE.toFixed(4)});
  float line = 1.0 - smoothstep(hw - 0.75 * px, hw + 0.75 * px, a);
  float halo = exp(-a / ${TAPE_GLOW.toFixed(4)}) * 0.3;
  float face = gl_FrontFacing ? 1.0 : ${TAPE_BACK.toFixed(2)};
  vec3 c = (uCol * (line * 1.08 + halo) + vec3(uWhite) * line) * uGlow * face;
  gl_FragColor = vec4(c, min(1.0, line + halo * 0.6) * face);
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
    render(scene, cam, hide, twins) {
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
      quad.material = add; add.uniforms.tMap.value = c.texture;
      renderer.autoClear = false; renderer.render(qs, qc); renderer.autoClear = auto;
    },
    dispose() { a.dispose(); b.dispose(); c.dispose(); quad.geometry.dispose(); blur.dispose(); add.dispose(); },
  };
}
