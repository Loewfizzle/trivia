// JAYWALK — THE NIGHT LOOK's SHADERS + small pieces (H2 — docs/jaywalk.md "THE NIGHT LOOK"): the lanes' ground (ONE instanced plane a lane,
// drawn in the shader: grass · asphalt + curbs + dashed lines · water + its reflections · rails + sleepers · the flight path · a landmark's
// paving — the edge columns dimmer, the BLACKOUT's per-lane darkness, the fog), the additive lights (flat on the ground + facing the
// camera — pools, trails, beams, rings, lamps: NO real point light anywhere), the blob shadows, the paint patch (a car's body / the kid's
// hoodie takes its colour; everything else keeps Kenney's), a tiny generated neon environment (the gloss) and THE HALF-RES BLOOM (top tier
// only). Colours in these shaders are DISPLAY values (no colour-space pass): they match the scene's fog colour as the screen shows it.
import * as THREE from 'three';

export const FOG_HEX = 0x0b0716;
export const rgb = hex => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
/** lane kinds as the ground shader counts them */
export const KIND = Object.freeze({ grass: 0, road: 1, water: 2, rail: 3, flight: 4, mark: 5 });

const GROUND_V = `
attribute float aLane; attribute vec4 aKind; attribute vec2 aState;
uniform vec2 uFog;
varying vec2 vP; varying vec4 vKind; varying vec2 vState; varying float vFog; varying float vLane;
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
uniform float uTime; uniform vec3 uFogCol; uniform float uQ;
varying vec2 vP; varying vec4 vKind; varying vec2 vState; varying float vFog; varying float vLane;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float type = vKind.x, dn = vKind.y, up = vKind.z, seed = vKind.w, x = vP.x, z = vP.y;
  vec3 c;
  if (type < 0.5 || type > 4.5) {
    float chk = mod(floor(x) + vLane, 2.0);
    c = mix(vec3(0.070, 0.205, 0.098), vec3(0.082, 0.232, 0.108), chk);
    c *= 0.9 + 0.2 * hash(floor(vec2(x * 2.5, z * 2.5)) + seed * 7.0);
    if (type > 4.5) {                                             // a LANDMARK's lane: dark paving, a neon trim on both edges
      c = vec3(0.105, 0.10, 0.15) * (0.9 + 0.2 * mod(floor(x * 2.0) + floor(z * 2.0), 2.0));
      float trim = smoothstep(0.05, 0.02, abs(z - 0.08)) + smoothstep(0.05, 0.02, abs(z - 0.92));
      c += vec3(1.0, 0.25, 0.72) * trim * 0.75;
    }
    float soft = step(0.5, dn) * step(dn, 4.5), softU = step(0.5, up) * step(up, 4.5);
    c *= 1.0 - 0.45 * (1.0 - smoothstep(0.0, 0.22, z)) * soft - 0.45 * (1.0 - smoothstep(0.0, 0.22, 1.0 - z)) * softU;
  } else if (type < 1.5) {
    c = vec3(0.062, 0.062, 0.086) * (0.92 + 0.16 * hash(floor(vec2(x * 16.0, z * 16.0))));
    float curbD = step(0.5, abs(dn - 1.0)), curbU = step(0.5, abs(up - 1.0));
    float cd = (1.0 - smoothstep(0.075, 0.095, z)) * curbD, cu = (1.0 - smoothstep(0.075, 0.095, 1.0 - z)) * curbU;
    c *= 1.0 - 0.35 * (smoothstep(0.26, 0.09, z) * curbD + smoothstep(0.26, 0.09, 1.0 - z) * curbU);
    c = mix(c, vec3(0.27, 0.26, 0.34) * (0.8 + 0.4 * step(fract(x * 1.0), 0.94)), max(cd, cu));
    float b = vLane + step(0.5, z);
    float dash = step(fract(x * 0.5 + b * 0.37), 0.52);
    float ln = smoothstep(0.04, 0.012, z) * (1.0 - curbD) + smoothstep(0.04, 0.012, 1.0 - z) * (1.0 - curbU);
    vec3 neon = mod(b, 2.0) < 0.5 ? vec3(1.0, 0.62, 0.9) : vec3(0.6, 0.9, 1.0);
    c = mix(c, neon * 0.62, dash * ln);
  } else if (type < 2.5) {
    float t = uTime;
    float w = sin(x * 2.3 + t * 0.8 + sin(z * 7.0 + t * 0.5) * 0.8) * 0.5 + 0.5;
    c = vec3(0.010, 0.024, 0.052) + vec3(0.010, 0.030, 0.052) * w * w;
    if (uQ > 0.5) {                                               // dim reflections: streaks of the skyline's colours, wobbling
      float sx = x * 1.25 + seed * 3.1, id = floor(sx), f = fract(sx) - 0.5;
      float wob = sin(z * 17.0 + t * 1.6 + id * 4.0) * 0.11;
      float streak = smoothstep(0.17, 0.0, abs(f + wob)) * step(0.4, hash(vec2(id, seed)));
      float pick = hash(vec2(id + 3.0, seed));
      vec3 neon = pick < 0.36 ? vec3(1.0, 0.25, 0.75) : (pick < 0.7 ? vec3(0.15, 0.8, 1.0) : vec3(0.62, 0.36, 1.0));
      c += neon * streak * 0.10 * (0.6 + 0.4 * sin(t * 0.9 + id));
    }
    c *= 1.0 - 0.55 * (smoothstep(0.14, 0.0, z) * step(0.5, abs(dn - 2.0)) + smoothstep(0.14, 0.0, 1.0 - z) * step(0.5, abs(up - 2.0)));
  } else if (type < 3.5) {
    c = vec3(0.088, 0.078, 0.09) * (0.85 + 0.3 * hash(floor(vec2(x * 18.0, z * 18.0))));
    float sl = step(fract(x * 2.0), 0.3) * step(0.17, z) * step(z, 0.83);
    c = mix(c, vec3(0.21, 0.135, 0.085), sl);
    float r = max(smoothstep(0.04, 0.016, abs(z - 0.33)), smoothstep(0.04, 0.016, abs(z - 0.67)));
    c = mix(c, vec3(0.50, 0.53, 0.64), r);
    c += vec3(0.85, 0.05, 0.07) * vState.y * (0.16 + 0.6 * r);    // the tell: the rails catch the red signals
  } else {
    c = vec3(0.068, 0.084, 0.135) * (0.94 + 0.12 * hash(floor(vec2(x * 12.0, z * 12.0))));
    float cl = step(fract(x * 0.5 + 0.25), 0.5) * smoothstep(0.035, 0.015, abs(z - 0.5));
    c = mix(c, vec3(0.46, 0.52, 0.7), cl * 0.55);
    float fx = abs(vState.y);
    if (fx > 0.001) {                                             // the tell: a bright band RACES to the crossing, faster and faster
      float xx = vState.y > 0.0 ? x : 9.0 - x;
      float head = fract(fx * fx * 7.0 + fx * 2.0) * 14.0 - 2.5;
      float band = smoothstep(4.0, 0.0, head - xx) * step(xx, head);
      float chev = step(fract(xx * 1.2 + abs(z - 0.5) * 1.4), 0.5);
      c += vec3(0.20, 0.55, 1.0) * band * (0.35 + 0.5 * chev) + vec3(0.05, 0.12, 0.34) * fx;
    }
  }
  // THE WIDER VIEW: the edge columns a step dimmer, the ground beyond them dimmer still
  float inner = smoothstep(-0.06, 0.06, x) * smoothstep(9.06, 8.94, x);
  float outer = smoothstep(-2.6, -1.0, x) * smoothstep(11.6, 10.0, x);
  c *= mix(mix(0.30, 0.52, outer), 1.0, inner);
  // THE BLACKOUT: this lane's lights dying (a cold flicker as it goes), then dead
  float dk = vState.x;
  float fl = dk > 0.02 && dk < 0.98 ? step(hash(vec2(floor(uTime * 14.0), vLane)), 0.35 + dk * 0.5) : 0.0;
  c = mix(c, vec3(0.012, 0.016, 0.03) + c * 0.05, clamp(dk + fl * 0.35, 0.0, 1.0));
  c = mix(c, uFogCol, vFog);
  gl_FragColor = vec4(c, 1.0);
}`;

/** the lanes' ground: n instanced planes. → { mesh, lay(k, lane, kind, down, up, seed, dark, fx), done(n), uniforms } */
export function createGround(n, fog) {
  const base = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.attributes.position);
  const lane = new Float32Array(n), kind = new Float32Array(n * 4), state = new Float32Array(n * 2);
  const aL = new THREE.InstancedBufferAttribute(lane, 1), aK = new THREE.InstancedBufferAttribute(kind, 4), aS = new THREE.InstancedBufferAttribute(state, 2);
  for (const a of [aL, aK, aS]) a.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('aLane', aL); g.setAttribute('aKind', aK); g.setAttribute('aState', aS);
  const uniforms = { uTime: { value: 0 }, uFog: { value: fog }, uFogCol: { value: new THREE.Vector3(...rgb(FOG_HEX)) }, uQ: { value: 1 } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: GROUND_V, fragmentShader: GROUND_F, uniforms }));
  mesh.frustumCulled = false; mesh.renderOrder = -1;
  return {
    mesh, uniforms,
    lay(k, i, t, dn, up, seed, dark, fx) { lane[k] = i; kind[k * 4] = t; kind[k * 4 + 1] = dn; kind[k * 4 + 2] = up; kind[k * 4 + 3] = seed; state[k * 2] = dark; state[k * 2 + 1] = fx; },
    done(c) { g.instanceCount = c; aL.needsUpdate = aK.needsUpdate = aS.needsUpdate = true; },
    dispose() { g.dispose(); base.dispose(); mesh.material.dispose(); },
  };
}

// ---- THE LIGHTS: additive quads (flat on the ground, or facing the camera) + the blob shadows — ONE material each, the shape picked per instance
const GLOW_V = `
attribute vec2 aFx;
uniform vec2 uFog; uniform float uBill;
varying vec2 vUv; varying vec3 vCol; varying vec2 vFx; varying float vFog;
void main() {
  vUv = uv; vFx = aFx;
  #ifdef USE_INSTANCING_COLOR
    vCol = instanceColor;
  #else
    vCol = vec3(1.0);
  #endif
  vec4 mv;
  if (uBill > 0.5) {
    mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
  } else mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vFog = smoothstep(uFog.x, uFog.y, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const GLOW_F = `
precision highp float;
varying vec2 vUv; varying vec3 vCol; varying vec2 vFx; varying float vFog;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float s = vFx.x, a, d = length(p);
  if (s < 0.5) { a = smoothstep(1.0, 0.0, d); a *= a; }                                                          // 0 a soft round glow
  else if (s < 1.5) { float u = vUv.x, w = mix(0.06, 1.0, u); a = smoothstep(w, w * 0.15, abs(p.y)) * u * u; }    // 1 a tapered ribbon (bright at u = 1)
  else if (s < 2.5) { float u = vUv.x, w = mix(0.22, 1.0, u); a = smoothstep(w, 0.0, abs(p.y)) * (1.0 - u) * (1.0 - u * 0.4); }   // 2 a beam (from u = 0)
  else if (s < 3.5) { a = smoothstep(0.16, 0.0, abs(d - 0.8)); }                                                  // 3 a ring
  else if (s < 4.5) { a = smoothstep(1.0, 0.15, abs(p.y)) * smoothstep(1.0, 0.8, abs(p.x)); }                     // 4 a soft line along x
  else { a = smoothstep(0.42, 0.3, d) + 0.6 * smoothstep(1.0, 0.0, d) * smoothstep(1.0, 0.0, d); }                // 5 a lamp: a hot core + its halo
  #ifdef JW_SHADOW
    gl_FragColor = vec4(0.0, 0.0, 0.0, a * vFx.y * (1.0 - vFog));
  #else
    gl_FragColor = vec4(vCol * (a * vFx.y * (1.0 - vFog)), 1.0);
  #endif
}`;
/** bill: 1 = the quad faces the camera · shadow: black, alpha-blended (the blob shadows) */
export function glowMaterial(fog, { bill = false, shadow = false } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: GLOW_V, fragmentShader: GLOW_F, uniforms: { uFog: { value: fog }, uBill: { value: bill ? 1 : 0 } },
    defines: shadow ? { JW_SHADOW: 1 } : {}, transparent: true, depthWrite: false,
    blending: shadow ? THREE.NormalBlending : THREE.AdditiveBlending,
  });
}

/** THE PAINT PATCH on a lit material: vertices marked `paint` take the tint (an instance's colour, or uTint) by their own brightness; the
 *  rest keep their vertex colours; `lit` (0 … 1 — the blackout, the dim edge columns) scales both. */
export function paintMaterial(mat, { instanced = false } = {}) {
  const u = { uTint: { value: new THREE.Color(0xffffff) }, uLit: { value: 1 } };
  mat.vertexColors = true;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTint = u.uTint; sh.uniforms.uLit = u.uLit;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float paint;\n${instanced ? 'attribute float aLit;' : 'uniform vec3 uTint; uniform float uLit;'}`)
      .replace('#include <color_vertex>', instanced
        ? 'vColor = mix(color, instanceColor * (0.22 + 1.6 * dot(color, vec3(0.299, 0.587, 0.114))), paint) * aLit;'
        : 'vColor = mix(color, uTint * (0.22 + 1.6 * dot(color, vec3(0.299, 0.587, 0.114))), paint) * uLit;');
  };
  mat.customProgramCacheKey = () => `jw-paint-${instanced ? 'i' : 'u'}`;
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
