// FREEFALL — THE VEIL (FIX C, Group 0 — the compositing fix; docs/freefall.md "THE VEIL"): THE DARKNESS (the dark edge creeping down from
// the top + the sides closing in) and THE SHADE (the dark fall behind the HUD while a run is on) drawn as the LAST pass of the 3D picture —
// one full-screen triangle, a few lines of maths — instead of three full-screen HTML layers composited over the canvas on every frame at the
// phone's full 3× (the iPhone A/B: no canvas switch helped, every hitch "gpu"). The shapes + colours are the old stylesheet's, number for
// number; the eases are its transitions (0.45 s linear · 0.55 s ease). Never in a staged share frame (the HTML darkness was never in it).
import * as THREE from 'three';

const V = /* glsl */`
varying vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const F = /* glsl */`
precision mediump float;
varying vec2 vUv;
uniform float uOn, uEdge, uVig, uShade, uDay;
uniform vec3 uDk, uDkE;
vec4 over(vec4 d, vec3 c, float a) { return vec4(c * a + d.rgb * (1.0 - a), a + d.a * (1.0 - a)); }
float ramp(float p, float a, float b, float va, float vb) { return mix(va, vb, clamp((p - a) / (b - a), 0.0, 1.0)); }
void main() {
  float t = 1.0 - vUv.y;                       // 0 = the top of the screen
  vec4 o = vec4(0.0);
  if (uOn > 0.0) {
    // the dark EDGE: a band 24 % tall, moved by uEdge (-1 = above the screen … 0 = at the top)
    float p = (t - uEdge * 0.24) / 0.24;
    if (p >= 0.0 && p <= 1.0) {
      float a = p < 0.55 ? ramp(p, 0.0, 0.55, 0.97, 0.84) : p < 0.84 ? ramp(p, 0.55, 0.84, 0.84, 0.5) : ramp(p, 0.84, 1.0, 0.5, 0.0);
      o = over(o, uDk, a);
      float e = p < 0.86 ? 0.0 : p < 0.92 ? ramp(p, 0.86, 0.92, 0.0, 0.7) : ramp(p, 0.92, 0.98, 0.7, 0.0);
      o = over(o, uDkE, e);
    }
    // the sides closing in: ellipse 66 % × 46 % at (50 %, 45 %), clear to 44 %, 0.97 at its rim
    vec2 q = vec2((vUv.x - 0.5) / 0.66, (t - 0.45) / 0.46);
    float r = length(q), v = ramp(r, 0.44, 1.0, 0.0, 0.97) * uVig;
    o = over(o, uDk, v);
    o *= uOn;
  }
  if (uShade > 0.0) {
    float s;
    if (uDay > 0.5) { vec2 k = vec2((vUv.x - 0.5) / 0.64, t / 0.3); float r = length(k); s = r < 0.42 ? ramp(r, 0.0, 0.42, 0.8, 0.66) : r < 0.72 ? ramp(r, 0.42, 0.72, 0.66, 0.3) : ramp(r, 0.72, 1.0, 0.3, 0.0); }
    else { float p = t / 0.26; s = p < 0.52 ? ramp(p, 0.0, 0.52, 0.86, 0.7) : ramp(p, 0.52, 1.0, 0.7, 0.0); }
    vec3 c = uDay > 0.5 ? vec3(6.0, 22.0, 52.0) / 255.0 : vec3(5.0, 3.0, 13.0) / 255.0;
    o = over(o, c, s * uShade);
  }
  if (o.a <= 0.0) discard;
  gl_FragColor = o;                             // premultiplied (the canvas is sRGB like the old layers: the same blend)
}`;
/** THE DARKNESS's colours: [dark, edge] (0–255) — night · day (the storm cloud) · day rooftop · day under the water */
const C = { night: [[3, 0, 10], [150, 100, 255]], day: [[12, 14, 26], [4, 5, 12]], roof: [[50, 56, 74], [26, 30, 44]], sea: [[5, 36, 40], [1, 16, 19]] };
const SEA = new Set(['harbor', 'deep', 'bottom', 'trench']);
export const veilInk = (day, area) => (!day ? C.night : area === 'rooftop' ? C.roof : SEA.has(area) ? C.sea : C.day);
/** the edge's place for data-dark 3 · 2 · 1 (and none) — the old translate3d(0, -80 % / -36 % / 0) */
const EDGE = [-1, 0, -0.36, -0.8], VIG = [0, 0.95, 0.38, 0.001];
const ease = x => 1 - (1 - x) * (1 - x) * (1 - x);   // (≈ the old cubic-bezier(0.3, 0, 0.2, 1))

/** createVeil(renderer) → { set(dark, shade, day, area), draw(now), info(), dispose() } — `dark` = the stage's data-dark (0 · 1 · 2 · 3) */
export function createVeil(renderer, reduced) {
  const U = { uOn: { value: 0 }, uEdge: { value: -1 }, uVig: { value: 0 }, uShade: { value: 0 }, uDay: { value: 0 }, uDk: { value: new THREE.Vector3() }, uDkE: { value: new THREE.Vector3() } };
  const mat = new THREE.ShaderMaterial({ vertexShader: V, fragmentShader: F, uniforms: U, transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const tri = new THREE.Mesh(geo, mat); tri.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(tri); scene.matrixAutoUpdate = false; tri.matrixAutoUpdate = false;
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  // each value eases from → to over its own time, as its old CSS transition did: [from, to, start ms, length ms, eased?]
  const tw = { on: [0, 0, 0, 450, 0], edge: [-1, -1, 0, 550, 1], vig: [0, 0, 0, 550, 0], shade: [0, 0, 0, 450, 1] };
  let now0 = 0, kDay = null, kArea = null;
  const cur = k => { const a = tw[k], x = a[3] > 0 && !reduced ? Math.min(1, Math.max(0, (now0 - a[2]) / a[3])) : 1; return a[0] + (a[1] - a[0]) * (a[4] ? ease(x) : x); };
  const to = (k, v) => { const a = tw[k]; if (a[1] === v) return; a[0] = cur(k); a[1] = v; a[2] = now0; };
  return {
    set(dark, shade, day, area) {
      now0 = performance.now(); const d = dark >= 1 && dark <= 3 ? dark : 0;
      to('on', d ? 1 : 0); if (d) { to('edge', EDGE[d]); to('vig', VIG[d]); }
      to('shade', shade ? 1 : 0);
      if (day !== kDay || area !== kArea) { kDay = day; kArea = area; const [a, b] = veilInk(day, area); U.uDk.value.set(a[0] / 255, a[1] / 255, a[2] / 255); U.uDkE.value.set(b[0] / 255, b[1] / 255, b[2] / 255); U.uDay.value = day ? 1 : 0; }
    },
    /** the last pass of a frame (after the bloom + the ghosts) — nothing drawn when nothing shows */
    draw(now) {
      now0 = now;
      U.uOn.value = cur('on'); U.uEdge.value = cur('edge'); U.uVig.value = cur('vig'); U.uShade.value = cur('shade');
      if (U.uOn.value <= 0.001 && U.uShade.value <= 0.001) return;
      const auto = renderer.autoClear; renderer.autoClear = false; renderer.render(scene, cam); renderer.autoClear = auto;
    },
    warm() { const s = U.uShade.value; U.uShade.value = 0.01; const auto = renderer.autoClear; renderer.autoClear = false; renderer.render(scene, cam); renderer.autoClear = auto; U.uShade.value = s; },
    info: () => ({ on: +U.uOn.value.toFixed(3), edge: +U.uEdge.value.toFixed(3), vig: +U.uVig.value.toFixed(3), shade: +U.uShade.value.toFixed(3), dk: U.uDk.value.toArray().map(v => Math.round(v * 255)), edgeInk: U.uDkE.value.toArray().map(v => Math.round(v * 255)), day: U.uDay.value }),
    dispose() { geo.dispose(); mat.dispose(); },
  };
}
