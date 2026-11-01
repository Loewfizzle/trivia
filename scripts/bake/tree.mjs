// THE CORNER TREE BAKE (WSP Group 4 — the owner, Nov 1: the close-up maple by the bench "looks a little cheap"; ONE try at a sourced
// stylized model, the HARD RULE: it ships only if it CLEARLY beats today's tree on the phone at real size). ONE TREE ALL YEAR:
// danielpetrov's "stylized tree" (CC BY 4.0, art/models/tree/credits-danielpetrov.txt) — its flat-colour 'crown' material RECOLOURED per
// season (spring light green · summer green · autumn patches of red / orange / gold), the trunk as it comes; WINTER two candidates to
// judge in the city: (a) its own bare limbs ('bare'), (b) Quaternius DeadTree_1 (CC0) re-barked toward the same trunk + scaled to the same
// height ('dead') — each also WITH SNOW on its limbs ('-snow'). Rendered at the city camera's REAL view of the corner maple (its world x /
// z / height: core/harbor-promenade.js maples[0], big) in the city's lights — DAY (the afternoon sun from the front-left + the sky),
// GOLD (a low warm sun), NIGHT (the cool sky + the implied lamps' warm wash from the front, low + the grate's uplight on the trunk + the
// violet city glow as a rim).
//
//   node scripts/bake-model.mjs "<chromium>" tree                → assets/city/tree/<season>-<light>.webp + .png + tree.json
//   node scripts/bake-model.mjs "<chromium>" tree --look DIR     → every variant big, PNG, for the look review
//
// The models are SOURCE files (git-ignored, never shipped): node scripts/gltf-to-glb.mjs on the Grok downloads — see the credits files.
export const MODEL = 'art/models/tree/stylized-tree.glb';
export const MODELS = { dp: 'art/models/tree/stylized-tree.glb', dead: 'art/models/tree/deadtree-1.glb' };
export const OUT = 'assets/city/tree';
// the corner maple at 402 pt: foot (357, 745), z 42, the crown's top 8.14 u (trunk 2.9 + crown 4.6 × 1.14), 5.5 u across
export const BAKE = { F: 600, CAMH: 13.5, VPX: 201, z: 42, x: 10.92, H: 8.14, DPR: 3, SS: 2, ext: { w: 3.6, y0: -0.6, y1: 8.8 }, q: 0.9 };
export const SEASONS = ['spring', 'summer', 'autumn', 'bare', 'bare-snow', 'dead', 'dead-snow'];
export const LIGHTS3 = ['day', 'gold', 'night'];
const CROWN = { spring: [[0.42, 0.62, 0.16], [0.56, 0.74, 0.22], [0.66, 0.8, 0.3]], summer: [[0.16, 0.34, 0.06], [0.24, 0.44, 0.08], [0.32, 0.52, 0.12]],
  autumn: [[0.78, 0.1, 0.03], [0.98, 0.38, 0.04], [1.0, 0.66, 0.1]] };

export const page = ({ THREE }) => String.raw`<!doctype html><meta charset=utf-8><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"${THREE}/build/three.module.js","three/addons/":"${THREE}/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const B = ${JSON.stringify(BAKE)}, CROWN = ${JSON.stringify(CROWN)};
// a crown recoloured: three colours in soft world-space patches (value noise in the shader) — autumn's red / orange / gold, a summer's
// greens; the lit side + the shade come from the lights. (The model's crown mesh carries a flat ground square at its foot: cut — y < 0.3.)
function crownMat(cols, base) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: base.roughness ?? 0.85, metalness: 0, side: THREE.FrontSide });   // (front faces only: the crown's inside faces showed through its gaps as dark blotches)
  m.onBeforeCompile = sh => {
    sh.uniforms.cA = { value: new THREE.Color(...cols[0]) }; sh.uniforms.cB = { value: new THREE.Color(...cols[1]) }; sh.uniforms.cC = { value: new THREE.Color(...cols[2]) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp; uniform vec3 cA; uniform vec3 cB; uniform vec3 cC;\nfloat h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\nfloat vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y), mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'if (vWp.y < 0.3) discard; float n = vn(vWp * 0.9) * 0.65 + vn(vWp * 2.3) * 0.35; vec3 cc = n < 0.52 ? mix(cA, cB, smoothstep(0.3, 0.52, n)) : mix(cB, cC, smoothstep(0.58, 0.85, n)); cc *= 0.92 + 0.14 * smoothstep(0.0, 1.0, (vWp.y - 3.0) / 5.0); vec4 diffuseColor = vec4( cc, opacity );');
  };
  return m;
}
// snow on the limbs: white where the surface faces up (a world normal's y), thicker on the flatter limbs
function snowify(m) {
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWn;').replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvWn = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWn;').replace('#include <map_fragment>', '#include <map_fragment>\nfloat sk = smoothstep(0.42, 0.7, vWn.y); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 1.0), sk);');
  };
  m.needsUpdate = true;
}
window.ready = (async () => {
  const L = new GLTFLoader(), dp = (await L.loadAsync('/m/dp.glb')).scene, dead = (await L.loadAsync('/m/dead.glb')).scene;
  const info = { dp: {}, dead: {} };
  const prep = (root, key) => { root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3()); info[key] = { size: size.toArray().map(v => +v.toFixed(2)) }; const k = B.H / size.y; const g = new THREE.Group(); root.position.set(-ctr.x, -box.min.y, -ctr.z); g.add(root); g.scale.setScalar(k); return g; };
  const gDp = prep(dp, 'dp'), gDead = prep(dead, 'dead');
  let crown = null, trunk = null, deadMesh = [];
  dp.traverse(o => { if (o.isMesh) { if (/crown/i.test(o.name) || (o.material && /crown/i.test(o.material.name))) crown = o; else trunk = o; } });
  dead.traverse(o => { if (o.isMesh) deadMesh.push(o); });
  const crownBase = crown.material, trunkMat = trunk.material, trunkSnow = trunkMat.clone(); snowify(trunkSnow);
  // (b) the dead tree re-barked toward the stylized trunk's warm red-brown (its own texture kept for the grain), + its snow copy
  const deadMat = deadMesh[0].material; deadMat.color = new THREE.Color(2.1, 1.3, 1.0); const deadSnow = deadMat.clone(); snowify(deadSnow);
  const crowns = Object.fromEntries(Object.entries(CROWN).map(([k, c]) => [k, crownMat(c, crownBase)]));
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setClearColor(0x000000, 0);
  document.body.append(renderer.domElement);
  const scene = new THREE.Scene(), holder = new THREE.Group(); holder.add(gDp, gDead); scene.add(holder);
  holder.position.set(B.x, 0, -B.z);   // (three.js looks down −z: the tree B.z in front of the camera, B.x to its right)
  const day = [new THREE.HemisphereLight(0xc4dcff, 0x8a7560, 1.15), new THREE.AmbientLight(0xfff4e6, 0.35)], gold = [new THREE.HemisphereLight(0xffd2a8, 0x7a5a48, 1.0)], night = [new THREE.HemisphereLight(0x3a4480, 0x2a1c12, 1.0), new THREE.AmbientLight(0x6a5a70, 0.55)];
  { const sun = new THREE.DirectionalLight(0xfff0d8, 2.6); sun.position.set(-0.55, 0.8, 0.55); day.push(sun); }
  { const sun = new THREE.DirectionalLight(0xffa860, 3.0); sun.position.set(-0.8, 0.28, 0.5); gold.push(sun); }
  { const key = new THREE.DirectionalLight(0xffb46a, 1.9); key.position.set(-0.15, 0.25, 1); night.push(key);
    const up = new THREE.PointLight(0xffc27a, 9, 5.5, 2); up.position.set(B.x + 0.2, 0.25, -B.z + 0.9); night.push(up);   // (the grate's uplight: the trunk + the crown's underside)
    const glow = new THREE.DirectionalLight(0x8f6bd8, 0.45); glow.position.set(0.3, 0.4, -1); night.push(glow); }
  for (const l of [...day, ...gold, ...night]) scene.add(l);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  /** o: { season, light, big } → { url, w, h, footX, footY } */
  window.shoot = o => {
    const s = o.season, isDead = /^dead/.test(s), bare = s === 'bare' || s === 'bare-snow';
    gDp.visible = !isDead; gDead.visible = isDead;
    if (!isDead) { crown.visible = !bare; if (!bare) crown.material = crowns[s]; trunk.material = s === 'bare-snow' ? trunkSnow : trunkMat; }
    else for (const m of deadMesh) m.material = s === 'dead-snow' ? deadSnow : deadMat;
    for (const l of day) l.visible = o.light === 'day'; for (const l of gold) l.visible = o.light === 'gold'; for (const l of night) l.visible = o.light === 'night';
    renderer.toneMappingExposure = o.light === 'night' ? 0.95 : 1.0;
    scene.updateMatrixWorld(true);
    const M = o.big ? 2 : 1, F = B.F * B.DPR * B.SS * M, Hf = 4000 * B.SS * M, Wf = 2400 * B.SS * M, z = B.z;
    cam.position.set(0, B.CAMH, 0); cam.lookAt(0, B.CAMH, -1); cam.fov = 2 * Math.atan((Hf / 2) / F) * 180 / Math.PI; cam.aspect = Wf / Hf;
    // the cut: the tree's box at its depth (x ±ext.w round B.x; y ext.y0 … ext.y1), the shifted lens
    const pw = Math.ceil(2 * B.ext.w / z * F), cx = Wf / 2 + F * B.x / z, yTop = Hf / 2 + F * (B.CAMH - B.ext.y1) / z, yBot = Hf / 2 + F * (B.CAMH - B.ext.y0) / z, ph = Math.ceil(yBot - yTop), xLeft = cx - pw / 2;
    cam.setViewOffset(Wf, Hf, xLeft, yTop, pw, ph); cam.updateProjectionMatrix();
    renderer.setSize(pw, ph, false); renderer.render(scene, cam);
    const out = document.createElement('canvas'); out.width = Math.round(pw / B.SS); out.height = Math.round(ph / B.SS);
    const x = out.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(renderer.domElement, 0, 0, out.width, out.height);
    const footX = (cx - xLeft) / B.SS, footY = (Hf / 2 + F * B.CAMH / z - yTop) / B.SS;
    return { url: out.toDataURL(o.png ? 'image/png' : 'image/webp', B.q), w: out.width, h: out.height, footX: +footX.toFixed(2), footY: +footY.toFixed(2) };
  };
  return info;
})();
</script>`;

export async function run({ page, out, look, save, dataUrlToBuf }) {
  const meta = { z: BAKE.z, F: BAKE.F, dpr: BAKE.DPR, x: BAKE.x, H: BAKE.H, seasons: SEASONS, lights: LIGHTS3 };
  for (const season of SEASONS) for (const light of LIGHTS3) {
    if (look) { const r = await page.evaluate(o => window.shoot(o), { season, light, png: true }); console.log(`${season}-${light}.png`, save(`${season}-${light}.png`, dataUrlToBuf(r.url)), 'bytes'); continue; }
    const r = await page.evaluate(o => window.shoot(o), { season, light });
    console.log(`${season}-${light}.webp`, save(`${season}-${light}.webp`, dataUrlToBuf(r.url)), 'bytes', r.w, '×', r.h);
    const p = await page.evaluate(o => window.shoot(o), { season, light, png: true });
    save(`${season}-${light}.png`, dataUrlToBuf(p.url));
    Object.assign(meta, { w: r.w, h: r.h, footX: r.footX, footY: r.footY });
  }
  if (!look) { save('tree.json', Buffer.from(JSON.stringify(meta, null, 1))); console.log('tree.json', JSON.stringify(meta)); }
}
