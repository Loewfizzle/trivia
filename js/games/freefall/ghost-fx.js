// FREEFALL — THE GHOSTS' LAYER (F4B — docs/freefall.md "THE GHOSTS"): what a rival LOOKS like on my tower. Its own small scene, drawn (→ §1, docs/freefall.md MODULE NOTES)
import * as THREE from 'three';

/** the most ghosts a match shows (8 players: 7 rivals — the test page's bot room may ask for 8) */
export const GHOSTS_MAX = 8;
/** a tag's box in CSS px (the atlas row) · its text */
export const TAG_W = 132, TAG_H = 24, TAG_FONT = '800 13.5px "Chakra Petch", system-ui, sans-serif';
/** a ghost's record in the stage's array: [phi (radians round MY tower, 0 = the front), y (the ball's foot, world), r, g, b, alpha (0 = not drawn), near (0 … 1: 1 = an outline, no tag), tag (its atlas row, −1 = none)] */
export const GHOST_STRIDE = 8;

const BODY_V = /* glsl */`
attribute vec3 aPos, aCol;
attribute vec2 aK;
varying vec3 vN, vW, vC; varying vec2 vK;
void main() {
  vec3 w = aPos + position;
  vN = normal; vW = w; vC = aCol; vK = aK;
  gl_Position = aK.x <= 0.001 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
const BODY_F = /* glsl */`
uniform float uDay, uXray;
varying vec3 vN, vW, vC; varying vec2 vK;
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float nv = max(dot(N, V), 0.0), rim = pow(1.0 - nv, 2.4), edge = 1.0 - smoothstep(mix(0.0, 0.2, uDay), mix(0.2, 0.46, uDay), nv);   // (FIX A: a wider dark rim by day)   // (by day the dark edge is a real RIM: a yellow ghost on the speakeasy's gold, a white one on the harbor's pearl)
  // the ring: the player's colour, white-hot along its middle · the fill: a faint tint of it · the very edge: DARK (the day's contrast)
  float ring = smoothstep(0.18, 0.5, rim) * (1.0 - edge * 0.85);
  vec3 col = mix(vC * 0.9, mix(vC, vec3(1.0), 0.45), ring);
  float fill = mix(mix(0.15, 0.3, uDay), 0.0, vK.y) + 0.1 * (1.0 - vK.y) * pow(nv, 6.0), a = fill + ring * 0.95;   // (see-through: a ring of light, a breath of colour inside, a soft glint at its heart)
  col = mix(col, vec3(0.03, 0.02, 0.08), edge * mix(0.75, 0.97, uDay));
  a = max(a, edge * mix(0.5, 0.92, uDay));
  // X-RAY (hidden by a floor / the pillar): a soft outline + a faint fill — never as loud as a ghost in sight
  if (uXray > 0.5) { a = (0.1 * (1.0 - vK.y) + ring * 0.55 + edge * 0.3) * (1.0 - vK.y * 0.999); }
  a *= vK.x;
  gl_FragColor = vec4(col * a, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const TAG_V = /* glsl */`
attribute vec3 aAt;
uniform vec2 uPx, uSize;
uniform float uRows;
varying vec2 vUv; varying float vA;
void main() {
  vUv = vec2(position.x + 0.5, 1.0 - (aAt.z < 0.0 ? 0.0 : floor(aAt.z) + (0.5 - position.y)) / uRows);   // (the atlas's rows run DOWN the canvas — a canvas texture is flipped)
  vA = aAt.z < 0.0 ? 0.0 : fract(aAt.z) * 1.25;
  gl_Position = aAt.z < 0.0 ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(aAt.xy + position.xy * uSize * uPx, 0.0, 1.0);
}`;
const TAG_F = /* glsl */`
uniform sampler2D tTags;
varying vec2 vUv; varying float vA;
void main() {
  vec4 c = texture2D(tTags, vUv) * min(1.0, vA);
  if (c.a < 0.004) discard;
  gl_FragColor = c;
  #include <colorspace_fragment>
}`;

/**
 * createGhostLayer({ renderer, cam, uDay, RB, R_BALL }) → { names(list, dpr), place(n, data, w, h, dpr, ballX, ballY), draw(), info(), dispose() }
 *   names: [{ name, hex }] in the ghosts' own order → the atlas (baked again only when a name / a colour / the sharpness changed)
 *   place: the stage's array (GHOST_STRIDE numbers a ghost) → the instances + the tags' places; (ballX, ballY) = MY ball on the screen, CSS px
 */
export function createGhostLayer({ renderer, cam, uDay, RB, R_BALL }) {
  const scene = new THREE.Scene();
  const premul = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
  const ball0 = new THREE.SphereGeometry(R_BALL, 22, 14), geo = new THREE.InstancedBufferGeometry();
  geo.index = ball0.index; geo.setAttribute('position', ball0.getAttribute('position')); geo.setAttribute('normal', ball0.getAttribute('normal'));
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(GHOSTS_MAX * 3), 3), aCol = new THREE.InstancedBufferAttribute(new Float32Array(GHOSTS_MAX * 3), 3), aK = new THREE.InstancedBufferAttribute(new Float32Array(GHOSTS_MAX * 2), 2);
  for (const a of [aPos, aCol, aK]) a.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aPos', aPos); geo.setAttribute('aCol', aCol); geo.setAttribute('aK', aK);
  geo.instanceCount = 0;
  const mat = x => new THREE.ShaderMaterial({ vertexShader: BODY_V, fragmentShader: BODY_F, uniforms: { uDay, uXray: { value: x } }, ...premul, depthTest: true, depthFunc: x ? THREE.GreaterDepth : THREE.LessEqualDepth });
  const seen = new THREE.Mesh(geo, mat(0)), xray = new THREE.Mesh(geo, mat(1));
  // the tags
  const quad = new THREE.PlaneGeometry(1, 1), tGeo = new THREE.InstancedBufferGeometry();
  tGeo.index = quad.index; tGeo.setAttribute('position', quad.getAttribute('position'));
  const aAt = new THREE.InstancedBufferAttribute(new Float32Array(GHOSTS_MAX * 3), 3);
  aAt.setUsage(THREE.DynamicDrawUsage); tGeo.setAttribute('aAt', aAt); tGeo.instanceCount = 0;
  const atlas = document.createElement('canvas'), tex = new THREE.CanvasTexture(atlas);
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.premultiplyAlpha = true; tex.colorSpace = THREE.SRGBColorSpace;
  const tagU = { tTags: { value: tex }, uPx: { value: new THREE.Vector2(1, 1) }, uSize: { value: new THREE.Vector2(TAG_W, TAG_H) }, uRows: { value: GHOSTS_MAX } };
  const tags = new THREE.Mesh(tGeo, new THREE.ShaderMaterial({ vertexShader: TAG_V, fragmentShader: TAG_F, uniforms: tagU, ...premul, depthTest: false }));
  for (const m of [seen, xray, tags]) { m.frustumCulled = false; m.matrixAutoUpdate = false; scene.add(m); }
  scene.matrixAutoUpdate = false; scene.matrixWorldAutoUpdate = false;

  let key = '', count = 0, baked = 0, shown = 0, tagged = 0;
  /** THE ATLAS: a row a ghost — the name in the player's colour (lifted toward white: it must read) on a dark rim, at the screen's own sharpness */
  function names(list, dpr) {
    const s = Math.max(1, Math.min(3, dpr || 1)), k = `${s}|${list.map(g => `${g.name}:${g.hex}`).join('|')}`;
    if (k === key) return;
    key = k; baked++;
    atlas.width = Math.ceil(TAG_W * s); atlas.height = Math.ceil(TAG_H * s) * GHOSTS_MAX;
    const g = atlas.getContext('2d'), rowH = Math.ceil(TAG_H * s);
    g.clearRect(0, 0, atlas.width, atlas.height);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    for (let i = 0; i < list.length && i < GHOSTS_MAX; i++) {
      g.setTransform(s, 0, 0, s, 0, i * rowH);
      g.font = TAG_FONT;
      const name = String(list[i].name || '').toUpperCase().slice(0, 12), x = TAG_W / 2, y = TAG_H / 2 + 0.5;
      try { g.letterSpacing = '0.6px'; } catch { /* an older canvas: plain spacing */ }
      g.strokeStyle = 'rgba(6, 3, 16, 0.94)'; g.lineWidth = 4.2; g.strokeText(name, x, y);
      g.fillStyle = list[i].hex || '#00f0ff'; g.fillText(name, x, y);
      g.fillStyle = 'rgba(255, 255, 255, 0.2)'; g.fillText(name, x, y);   // (lifted a little toward white: a dark colour still reads — the player's colour stays the colour)
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    tex.dispose();   // (the atlas changed SIZE with the names / the sharpness: the texture's storage is made again — an upload into the old one overflows it)
    tex.needsUpdate = true;
  }
  const V = new THREE.Vector3(), tx = new Float32Array(GHOSTS_MAX), ty = new Float32Array(GHOSTS_MAX);
  /** the stage's records → the instances; the tags: over each ghost, away from MY ball, stacked when two would overlap — whole device pixels */
  function place(n, data, w, h, dpr, ballX, ballY) {
    const P = aPos.array, C = aCol.array, K = aK.array, T = aAt.array;
    count = n > GHOSTS_MAX ? GHOSTS_MAX : n; shown = 0; tagged = 0;
    for (let i = 0; i < count; i++) {
      const o = i * GHOST_STRIDE, phi = data[o], a = data[o + 5], near = data[o + 6], row = data[o + 7];
      const x = RB * Math.sin(phi), y = data[o + 1] + R_BALL, z = RB * Math.cos(phi);
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
      C[i * 3] = data[o + 2]; C[i * 3 + 1] = data[o + 3]; C[i * 3 + 2] = data[o + 4];
      K[i * 2] = a; K[i * 2 + 1] = near;
      T[i * 3 + 2] = -1;
      if (a <= 0.001) continue;
      shown++;
      if (row < 0 || near > 0.5 || a < 0.5) continue;   // (the screen review: a tag never FADES with its ball — it is whole, or it is gone and the edge marker names the rival)
      V.set(x, y + R_BALL, z).project(cam);   // (the top of the ball: the tag sits just over it)
      if (V.z > 1 || V.x < -1.1 || V.x > 1.1 || V.y < -1.1 || V.y > 1.1) continue;
      let sx = (V.x + 1) * 0.5 * w, sy = (1 - V.y) * 0.5 * h - TAG_H * 0.5 - 2;
      // away from MY ball: a tag that would lie on it steps to the side its ghost is on
      if (Math.abs(sx - ballX) < 58 && Math.abs(sy - ballY) < 44) sx += (sx >= ballX ? 1 : -1) * (58 - Math.abs(sx - ballX));
      // stacked when two would overlap (the ghosts start on the same slice) — FIX A: asked again until it clears EVERY tag placed (one pass
      // could push it onto a third), a full tag's height apart: never two tags over each other
      for (let pass = 0, hit = true; hit && pass < GHOSTS_MAX; pass++) { hit = false; for (let j = 0; j < tagged; j++) if (Math.abs(tx[j] - sx) < TAG_W * 0.66 && Math.abs(ty[j] - sy) < TAG_H * 0.92) { sy = ty[j] - TAG_H * 0.95; hit = true; } }
      tx[tagged] = sx; ty[tagged] = sy; tagged++;
      const px = Math.round(sx * dpr) / dpr, py = Math.round(sy * dpr) / dpr;
      T[i * 3] = px / w * 2 - 1; T[i * 3 + 1] = 1 - py / h * 2; T[i * 3 + 2] = row + 0.79;
    }
    geo.instanceCount = count; tGeo.instanceCount = count;
    aPos.needsUpdate = aCol.needsUpdate = aK.needsUpdate = aAt.needsUpdate = true;
    tagU.uPx.value.set(2 / w, 2 / h);
  }
  return {
    names, place,
    /** over the finished picture: the SAME depth buffer (nothing is cleared) */
    draw() {
      if (!count || !shown) return;
      const auto = renderer.autoClear;
      renderer.autoClear = false; renderer.render(scene, cam); renderer.autoClear = auto;
    },
    clear() { count = 0; shown = 0; geo.instanceCount = 0; tGeo.instanceCount = 0; },
    /** THE WARM FRAME's share: the three programs built behind the opening (one ghost drawn once, off the picture's way) */
    warm() { aPos.array[0] = 0; aPos.array[1] = 0; aPos.array[2] = RB; aK.array[0] = 0.01; aK.array[1] = 0; aAt.array[0] = 0; aAt.array[1] = 0; aAt.array[2] = 0.01; geo.instanceCount = 1; tGeo.instanceCount = 1; aPos.needsUpdate = aK.needsUpdate = aAt.needsUpdate = true; const auto = renderer.autoClear; renderer.autoClear = false; renderer.render(scene, cam); renderer.autoClear = auto; geo.instanceCount = count; tGeo.instanceCount = count; },
    info: () => ({ ghosts: count, shown, tagged, baked, atlas: [atlas.width, atlas.height] }),
    dispose() { geo.dispose(); ball0.dispose(); tGeo.dispose(); quad.dispose(); tex.dispose(); seen.material.dispose(); xray.material.dispose(); tags.material.dispose(); },
  };
}
