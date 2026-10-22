// RUMRUNNER — the city: a miniature night-time diorama in three.js, tilted and slowly drifting on a dark base.
// Six districts you can tell apart at a glance (the Docks' cranes and water, Uptown's towers, the Strip's signs, the Old
// Quarter's brick and gas lamps, the Rail Yard's trains, the mansions on Harbor Heights), wet streets that catch the neon,
// searchlights, lit windows, steam, haze, rain, fog, lightning, and the blue-gold dawn of the last morning.
// Trucks in the players' colours park in their districts and drive at dawn. The camera frames the diorama inside a given
// rectangle of the screen (the part the panels leave free) and swoops into a district for an event.
// Budget: instanced buildings and windows, capped particles, no shadows, no post-processing (glow = additive sprites).
import * as THREE from 'three';
import { rngFrom } from '../../core/rng.js';
import { DIST_IDS } from './logic.js';

// district centres on the base (x, z) and their neon
export const SPOTS = {
  docks: { x: -21, z: 11, c: 0x5fd0ff, r: 9 },
  rail: { x: 18, z: 13, c: 0xffa040, r: 9 },
  quarter: { x: -9, z: -1, c: 0xffb070, r: 8 },
  strip: { x: 6, z: 1, c: 0xff4fa0, r: 8 },
  uptown: { x: -4, z: -14, c: 0xf0c75e, r: 9 },
  heights: { x: 21, z: -11, c: 0xfff0c0, r: 9 },
};
const TIERS = [
  { dpr: 1, rain: 320, haze: 0, lights: 0, aa: false },
  { dpr: 1.5, rain: 800, haze: 6, lights: 1, aa: true },
  { dpr: 2, rain: 1400, haze: 10, lights: 2, aa: true },
];
export const WEATHER_LOOK = {
  clear: { fog: 0x0b0a14, density: 0.0026, sky: ['#141230', '#07060f'], amb: 1.15, moon: 1.6, wet: 0.72, rain: 0 },
  rain: { fog: 0x0a0b12, density: 0.004, sky: ['#0f1020', '#05050b'], amb: 1.0, moon: 1.0, wet: 0.22, rain: 1 },
  fog: { fog: 0x1c1c28, density: 0.0052, sky: ['#1a1a26', '#0b0b12'], amb: 1.5, moon: 0.7, wet: 0.5, rain: 0 },
  storm: { fog: 0x07070e, density: 0.0048, sky: ['#0a0a18', '#030308'], amb: 0.9, moon: 0.8, wet: 0.18, rain: 1.6 },
  dawn: { fog: 0x3a3450, density: 0.0022, sky: ['#5a4a7a', '#e2a26a'], amb: 2.4, moon: 1.4, wet: 0.6, rain: 0, dawn: true },
};

export function initialTier() {
  try { const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4; return cores >= 6 && mem >= 4 ? 2 : 1; } catch { return 1; }
}

const streakTex = (() => { let t = null; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = 16; c.height = 64; const g = c.getContext('2d'); const r = g.createLinearGradient(0, 0, 0, 64); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.5, 'rgba(255,255,255,0.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(6, 0, 4, 64); t = new THREE.CanvasTexture(c); return t; }; })();
const glowTex = (() => { let t = null; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); t = new THREE.CanvasTexture(c); return t; }; })();

/** A windows texture: a grid of lit / dark windows, per building style (tint = lit colour). */
function windowsTexture(r, cols, rows, tint, litShare) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#07070b'; g.fillRect(0, 0, 128, 128);
  const w = 128 / cols, h = 128 / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    if (r() > litShare) continue;
    const a = 0.45 + r() * 0.55;
    g.fillStyle = tint; g.globalAlpha = a;
    g.fillRect(i * w + w * 0.26, j * h + h * 0.24, w * 0.48, h * 0.46);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

/** The ground: streets, sidewalks, blocks, the water's edge, painted once. */
function groundTexture(r) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 704;
  const g = c.getContext('2d');
  const X = x => (x + 32) / 64 * 1024, Z = z => (z + 22) / 44 * 704;
  g.fillStyle = '#121327'; g.fillRect(0, 0, 1024, 704);
  // blocks: a faint lighter concrete inside the street grid
  g.fillStyle = '#1a1c2e';
  for (let x = -30; x < 30; x += 6) for (let z = -20; z < 20; z += 6) g.fillRect(X(x) + 7, Z(z) + 7, X(x + 6) - X(x) - 14, Z(z + 6) - Z(z) - 14);
  // streets with a centre line
  g.strokeStyle = '#3a3c58'; g.lineWidth = 1.5;
  for (let x = -30; x <= 30; x += 6) { g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), 704); g.stroke(); }
  for (let z = -20; z <= 20; z += 6) { g.beginPath(); g.moveTo(0, Z(z)); g.lineTo(1024, Z(z)); g.stroke(); }
  g.strokeStyle = 'rgba(240,199,94,0.18)'; g.setLineDash([6, 10]);
  for (let x = -24; x <= 24; x += 12) { g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), 704); g.stroke(); }
  for (let z = -14; z <= 20; z += 12) { g.beginPath(); g.moveTo(0, Z(z)); g.lineTo(1024, Z(z)); g.stroke(); }
  g.setLineDash([]);
  // the quay at the docks, the tracks at the rail yard, the hill's lanes
  g.fillStyle = '#1a1b2c'; g.fillRect(0, Z(2), X(-26), 704);
  g.strokeStyle = '#4a4a58'; g.lineWidth = 2;
  for (let k = 0; k < 4; k++) { const z = 9 + k * 2.2; g.beginPath(); g.moveTo(X(8), Z(z)); g.lineTo(X(30), Z(z + 0.8)); g.stroke(); }
  // grime
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.12})`; const s = 4 + r() * 30; g.fillRect(r() * 1024, r() * 704, s, s * (0.4 + r())); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createCity(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 1, 400);
  const r = rngFrom('rum-city');
  let tier = initialTier(), T = TIERS[tier];
  let W = 1, H = 1, frame = { x: 0, y: 0, w: 1, h: 1 };
  const disposables = [];
  const keep = o => { disposables.push(o); return o; };

  // ---------------------------------------------------------------- light
  const hemi = new THREE.HemisphereLight(0x5a6ab8, 0x14101c, 1.15); scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x9fb4ff, 1.6); moon.position.set(-30, 60, 20); scene.add(moon);
  const flashLight = new THREE.DirectionalLight(0xdfe8ff, 0); flashLight.position.set(10, 80, -10); scene.add(flashLight);
  const neonLights = [];
  for (const id of DIST_IDS) {
    const s = SPOTS[id];
    const l = new THREE.PointLight(s.c, 0, 20, 2); l.position.set(s.x, 4, s.z); scene.add(l); neonLights.push(l);
  }
  scene.fog = new THREE.FogExp2(0x0b0a14, 0.0028);

  // ---------------------------------------------------------------- the base and the ground
  const groundMat = keep(new THREE.MeshStandardMaterial({ map: keep(groundTexture(r)), roughness: 0.75, metalness: 0.18, color: 0xffffff }));
  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(64, 44)), groundMat); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const base = new THREE.Mesh(keep(new THREE.BoxGeometry(66, 2.2, 46)), keep(new THREE.MeshStandardMaterial({ color: 0x0a0910, roughness: 0.9 }))); base.position.y = -1.11; scene.add(base);
  // a thin gold frame around the base (four bars, never over the streets)
  const rimMat = keep(new THREE.MeshBasicMaterial({ color: 0xf0c75e, transparent: true, opacity: 0.8 }));
  for (const [w, d, x, z] of [[66.6, 0.5, 0, -22.3], [66.6, 0.5, 0, 22.3], [0.5, 44.6, -33.05, 0], [0.5, 44.6, 33.05, 0]]) { const m = new THREE.Mesh(keep(new THREE.BoxGeometry(w, 0.16, d)), rimMat); m.position.set(x, 0.0, z); scene.add(m); }
  // the water beyond the docks
  const waterMat = keep(new THREE.MeshStandardMaterial({ color: 0x0b1f33, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.95 }));
  const water = new THREE.Mesh(keep(new THREE.PlaneGeometry(10, 22, 1, 1)), waterMat); water.rotation.x = -Math.PI / 2; water.position.set(-27.5, 0.02, 12); scene.add(water);
  // the hill of Harbor Heights
  const hill = new THREE.Mesh(keep(new THREE.CylinderGeometry(7, 11.5, 2.6, 24)), keep(new THREE.MeshStandardMaterial({ color: 0x343044, roughness: 0.95 }))); hill.position.set(SPOTS.heights.x, 1.3, SPOTS.heights.z); scene.add(hill);

  // ---------------------------------------------------------------- buildings (instanced per style)
  const styles = [
    { key: 'brick', tint: '#ffb070', color: 0x4a2a24, lit: 0.34, cols: 6, rows: 9, rough: 0.95, roof: 0x2a1a18 },
    { key: 'stone', tint: '#ffe0a0', color: 0x3a3a4a, lit: 0.36, cols: 7, rows: 14, rough: 0.8, roof: 0x24242e },
    { key: 'tower', tint: '#f0c75e', color: 0x26283a, lit: 0.4, cols: 9, rows: 40, rough: 0.5, roof: 0x1c1c26 },
    { key: 'mansion', tint: '#fff2cc', color: 0x9a948a, lit: 0.5, cols: 5, rows: 4, rough: 0.7, roof: 0x5a3a3a },
    { key: 'shed', tint: '#9fd8ff', color: 0x24303a, lit: 0.22, cols: 5, rows: 4, rough: 0.9, roof: 0x1a2028 },
  ];
  // The city on its street grid: streets every 6 units (the ground texture draws them at x = -30 + 6i, z = -20 + 6j),
  // one block between each pair, buildings on lots inside the block with a sidewalk's margin. Each block takes the style
  // and the skyline of its nearest district: Uptown's blocks carry one or two towers, the Strip low wide clubs, the Old
  // Quarter tight brick, the Docks and the Rail Yard sheds, the Heights mansions on the hill — and far from any district
  // the blocks thin out into low filler, so the districts read from above.
  const plan = [];   // { style, x, z, w, h, d, y, v }
  const KIND = { docks: { style: 4, h: [1.2, 3.2], alt: 0, altH: [2, 4.5] }, uptown: { style: 2, h: [6, 20], alt: 1, altH: [3, 8] },
    strip: { style: 1, h: [1.6, 5], alt: 1, altH: [1.6, 4] }, quarter: { style: 0, h: [1.8, 5.5], alt: 0, altH: [1.8, 4] },
    rail: { style: 4, h: [1.2, 3], alt: 1, altH: [2.5, 6] }, heights: { style: 3, h: [1.4, 3], alt: 3, altH: [1.4, 3] } };
  const near = (x, z) => { let best = null, bd = Infinity; for (const id of DIST_IDS) { const sp = SPOTS[id]; const d = Math.hypot(x - sp.x, (z - sp.z) * 1.25); if (d < bd) { bd = d; best = id; } } return { id: best, d: bd }; };
  const HILL = SPOTS.heights;
  const lot = (x, z, w, d, style, h, y, v) => plan.push({ style, x, z, w, h, d, y, v });
  for (let i = 0; i < 10; i++) for (let j = 0; j < 7; j++) {
    const cx = -27 + i * 6, cz = -17 + j * 6;           // the block's centre; its usable square is 4.4 wide (0.8 sidewalk)
    if (cx < -24 && cz > 1) continue;                      // the water
    if (cz > 6.5 && cz < 17 && cx > 5) continue;           // the rail yard's tracks and platforms
    const dh = Math.hypot(cx - HILL.x, cz - HILL.z);
    if (dh > 6.3 && dh < 11.8) continue;                   // the slope of the hill
    const onHill = dh <= 6.3;
    const { id, d } = near(cx, cz);
    const K = KIND[id];
    const far = d > SPOTS[id].r + 2;                       // between districts: low filler
    const alt = r() < 0.35;
    let style = far ? (r() < 0.5 ? 0 : 1) : alt ? K.alt : K.style;
    let [h0, h1] = far ? [1.2, 3.4] : alt ? K.altH : K.h;
    if (onHill) { style = 3; [h0, h1] = [1.4, 3]; }
    const y = onHill ? 2.6 : 0;
    const v = (r() - 0.5) * 0.12;
    const hgt = () => h0 + Math.pow(r(), id === 'uptown' && !far ? 1.1 : 1.6) * (h1 - h0);
    const layout = id === 'uptown' && !far && !alt ? (r() < 0.55 ? 'tower' : 'twin') : onHill ? 'twin' : r() < 0.2 ? 'tower' : r() < 0.55 ? 'quad' : r() < 0.8 ? 'twin' : 'row';
    const g = 0.35;                                        // the gap between lots
    if (layout === 'tower') { const w = 3.2 + r() * 1.2; lot(cx + (r() - 0.5) * 0.6, cz + (r() - 0.5) * 0.6, w, w * (0.8 + r() * 0.4), style, hgt(), y, v); }
    else if (layout === 'twin') { const along = r() < 0.5; for (let k = 0; k < 2; k++) { const w = along ? 4.4 : 2.0, d = along ? 2.0 : 4.4; const ox = along ? 0 : (k ? 1.2 : -1.2), oz = along ? (k ? 1.2 : -1.2) : 0; if (r() < 0.12 && !onHill) continue; lot(cx + ox, cz + oz, w - g, d - g, style, hgt(), y, v); } }
    else if (layout === 'quad') { for (let k = 0; k < 4; k++) { if (r() < 0.15) continue; const ox = k % 2 ? 1.1 : -1.1, oz = k < 2 ? -1.1 : 1.1; lot(cx + ox, cz + oz, 2.2 - g, 2.2 - g, style, hgt(), y, v + (r() - 0.5) * 0.06); } }
    else { for (let k = 0; k < 3; k++) { if (r() < 0.1) continue; lot(cx - 1.5 + k * 1.5, cz + (r() - 0.5) * 0.4, 1.5 - g, 3.6 + r() * 0.6, style, hgt(), y, v + (r() - 0.5) * 0.06); } }
  }
  const boxGeo = keep(new THREE.BoxGeometry(1, 1, 1));
  boxGeo.translate(0, 0.5, 0);
  const instanced = [];
  const dummy = new THREE.Object3D();
  styles.forEach((st, si) => {
    const items = plan.filter(p => p.style === si);
    if (!items.length) return;
    const tex = keep(windowsTexture(r, st.cols, st.rows, st.tint, st.lit));
    const mat = keep(new THREE.MeshStandardMaterial({ color: st.color, roughness: st.rough, metalness: 0.05, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.5 }));
    const roofMat = keep(new THREE.MeshStandardMaterial({ color: st.roof, roughness: 0.95 }));
    // the windows on the four walls only; the roof is plain
    const mesh = new THREE.InstancedMesh(boxGeo, [mat, mat, roofMat, roofMat, mat, mat], items.length);
    const col = new THREE.Color();
    items.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z); dummy.scale.set(p.w, p.h, p.d); dummy.rotation.y = 0; dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      col.set(st.color).offsetHSL(0, 0, p.v); mesh.setColorAt(i, col);
    });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh); instanced.push(mesh);
  });
  // tower crowns and spires Uptown
  const spireMat = keep(new THREE.MeshStandardMaterial({ color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 0.35, roughness: 0.4 }));
  plan.filter(p => p.style === 2 && p.h > 14).slice(0, 5).forEach(p => {
    const sp = new THREE.Mesh(keep(new THREE.ConeGeometry(0.35, 3.5, 6)), spireMat); sp.position.set(p.x, p.h + 1.7, p.z); scene.add(sp);
    const tip = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff4040, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))); tip.position.set(p.x, p.h + 3.6, p.z); tip.scale.set(1.2, 1.2, 1); scene.add(tip);
  });

  // ---------------------------------------------------------------- landmarks
  const basic = (c, o = {}) => keep(new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o }));
  const addBox = (w, h, d, x, y, z, mat, ry = 0) => { const m = new THREE.Mesh(keep(new THREE.BoxGeometry(w, h, d)), mat); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; };
  const steel = basic(0x3a3f4a, { metalness: 0.5, roughness: 0.5 });
  // docks: two cranes and a ship
  for (const [cx, cz] of [[-24, 6], [-19, 17]]) { addBox(0.5, 9, 0.5, cx, 4.5, cz, steel); addBox(7, 0.4, 0.5, cx + 2.5, 9, cz, steel); addBox(0.4, 3, 0.4, cx + 5.5, 7.6, cz, steel); }
  const hull = addBox(3, 1.6, 9, -28.5, 0.7, 6, basic(0x2a2024)); hull.rotation.y = 0.15;
  addBox(1.2, 1.2, 2.4, -28.4, 2, 5, basic(0xe8e0d0)); addBox(0.5, 1.6, 0.5, -28.4, 3.3, 4.2, basic(0x6a2a2a));
  // the strip: big sign planes
  const signs = [];
  const signMat = c => keep(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95 }));
  for (let i = 0; i < 7; i++) {
    const s = SPOTS.strip; const x = s.x - 6 + i * 2, z = s.z + (i % 2 ? 3.4 : -3.4);
    const m = addBox(1.6, 0.7 + r() * 0.8, 0.12, x, 2.8 + r() * 2.5, z, signMat([0xff4fa0, 0x5fd0ff, 0xf0c75e, 0x7fff9f][i % 4]));
    signs.push(m);
    const gl = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glowTex(), color: m.material.color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))); gl.position.copy(m.position); gl.scale.set(4, 3, 1); scene.add(gl); signs.push(gl);
  }
  // old quarter: gas lamps and Balboni's office (a tall narrow building with a green-shaded window)
  const lampMat = keep(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffb060, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  for (let i = 0; i < 9; i++) { const s = SPOTS.quarter; const x = s.x - 6 + (i % 5) * 3, z = s.z - 4 + Math.floor(i / 5) * 7; addBox(0.1, 1.6, 0.1, x, 0.8, z, steel); const sp = new THREE.Sprite(lampMat); sp.position.set(x, 1.8, z); sp.scale.set(1.3, 1.3, 1); scene.add(sp); }
  const vale = addBox(2.6, 6.5, 2.6, SPOTS.quarter.x + 1, 3.25, SPOTS.quarter.z - 2.5, basic(0x2a1a1c, { emissive: 0x2fbf6a, emissiveIntensity: 0.08 }));
  const valeWin = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glowTex(), color: 0x3fd49a, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }))); valeWin.position.set(vale.position.x, 5.4, vale.position.z + 1.4); valeWin.scale.set(1.6, 1.2, 1); scene.add(valeWin);
  // rail yard: a train and steam
  for (let k = 0; k < 4; k++) addBox(14, 0.08, 0.1, 19, 0.05, 9 + k * 2.2, steel);
  addBox(3.2, 1.6, 1.3, 14, 0.8, 11.2, basic(0x1a1a22)); addBox(1.4, 0.9, 1.3, 12.6, 2, 11.2, basic(0x1a1a22));
  for (let k = 0; k < 3; k++) addBox(3, 1.3, 1.2, 17.6 + k * 3.3, 0.65, 11.2, basic(k % 2 ? 0x4a2a2a : 0x2a3a2a));
  // heights: mansions with pitched roofs and a lit drive
  const roof = basic(0x5a3a3a);
  plan.filter(p => p.style === 3).forEach(p => { const m = new THREE.Mesh(keep(new THREE.ConeGeometry(Math.max(p.w, p.d) * 0.78, 1.2, 4)), roof); m.position.set(p.x, p.y + p.h + 0.6, p.z); m.rotation.y = Math.PI / 4; scene.add(m); });
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const sp = new THREE.Sprite(lampMat); sp.position.set(SPOTS.heights.x + Math.cos(a) * 8.5, 1.3, SPOTS.heights.z + Math.sin(a) * 7); sp.scale.set(1.1, 1.1, 1); scene.add(sp); }

  // ---------------------------------------------------------------- the sky's moving parts: searchlights, haze, steam, rain
  const beamMat = keep(new THREE.MeshBasicMaterial({ color: 0xfff2cc, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  const beams = [];
  for (const [x, z, ph] of [[SPOTS.uptown.x + 3, SPOTS.uptown.z - 2, 0], [SPOTS.strip.x - 4, SPOTS.strip.z + 5, 2.1]]) {
    const b = new THREE.Mesh(keep(new THREE.ConeGeometry(1.5, 60, 12, 1, true)), beamMat);
    b.geometry.translate(0, 30, 0);
    const pivot = new THREE.Group(); pivot.position.set(x, 0.5, z); pivot.add(b); b.rotation.z = -0.6; scene.add(pivot);
    beams.push({ pivot, ph });
  }
  const hazeGroup = new THREE.Group(); scene.add(hazeGroup);
  const hazes = [];
  for (const id of DIST_IDS) for (let k = 0; k < 2; k++) {
    const s = SPOTS[id];
    const sp = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glowTex(), color: s.c, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false })));
    sp.position.set(s.x + (r() - 0.5) * 6, 2.5 + k * 2, s.z + (r() - 0.5) * 6); sp.scale.set(14 + r() * 8, 7 + r() * 4, 1);
    hazeGroup.add(sp); hazes.push({ sp, ph: r() * 6, base: 0.06 + r() * 0.05 });
  }
  const steamMat = keep(new THREE.SpriteMaterial({ map: glowTex(), color: 0xc8d0e0, transparent: true, opacity: 0.18, depthWrite: false }));
  const steams = [];
  for (let i = 0; i < 10; i++) { const sp = new THREE.Sprite(steamMat); sp.position.set(12.6, 2.6, 11.2); sp.scale.set(1, 1, 1); scene.add(sp); steams.push({ sp, t: r() }); }
  const rainN = TIERS[2].rain;
  const rainPos = new Float32Array(rainN * 3);
  for (let i = 0; i < rainN; i++) { rainPos[i * 3] = -32 + r() * 64; rainPos[i * 3 + 1] = r() * 26; rainPos[i * 3 + 2] = -22 + r() * 44; }
  const rainGeo = keep(new THREE.BufferGeometry()); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = keep(new THREE.PointsMaterial({ color: 0xc8d4f0, size: 1.6, map: streakTex(), alphaTest: 0.05, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true }));
  const rain = new THREE.Points(rainGeo, rainMat); rain.visible = false; rain.frustumCulled = false; scene.add(rain);

  // ---------------------------------------------------------------- trucks
  const trucks = new Map();   // uid -> { g, color, dist, drive }
  const headMat = keep(new THREE.SpriteMaterial({ map: glowTex(), color: 0xfff2cc, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  const tailMat = keep(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff3040, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  const coneGeo = keep(new THREE.PlaneGeometry(2.6, 5));
  function makeTruck(color) {
    const g = new THREE.Group();
    const c = new THREE.Color(color);
    const body = new THREE.Mesh(keep(new THREE.BoxGeometry(1.1, 0.75, 2.1)), keep(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.45, metalness: 0.3 }))); body.position.y = 0.55; g.add(body);
    const cab = new THREE.Mesh(keep(new THREE.BoxGeometry(0.95, 0.5, 0.7)), keep(new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.4, metalness: 0.4 }))); cab.position.set(0, 1.15, 0.55); g.add(cab);
    for (const sx of [-0.35, 0.35]) { const hl = new THREE.Sprite(headMat); hl.position.set(sx, 0.5, 1.15); hl.scale.set(0.7, 0.7, 1); g.add(hl); const tl = new THREE.Sprite(tailMat); tl.position.set(sx, 0.5, -1.12); tl.scale.set(0.45, 0.45, 1); g.add(tl); }
    const cone = new THREE.Mesh(coneGeo, keep(new THREE.MeshBasicMaterial({ color: 0xfff2cc, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))); cone.rotation.x = -Math.PI / 2; cone.position.set(0, 0.03, 3.4); g.add(cone);
    const halo = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glowTex(), color: c, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }))); halo.position.y = 0.6; halo.scale.set(3.4, 2.4, 1); g.add(halo);
    g.scale.setScalar(1.5);
    scene.add(g);
    g.userData.halo = halo;
    return g;
  }
  const slot = (dist, k, n) => { const s = SPOTS[dist]; const a = -Math.PI * 0.5 + (k - (n - 1) / 2) * 0.55; return { x: s.x + Math.cos(a) * 3.2, z: s.z + 3.6 + Math.sin(a) * 1.6 }; };
  function placeTrucks(instant) {
    const byDist = {};
    for (const [uid, t] of trucks) (byDist[t.dist] ??= []).push(uid);
    for (const [dist, uids] of Object.entries(byDist)) uids.forEach((uid, k) => {
      const t = trucks.get(uid); const p = slot(dist, k, uids.length);
      t.home = p;
      if (instant || !t.drive) { t.g.position.set(p.x, 0, p.z); t.g.rotation.y = 0; }
    });
  }

  // ---------------------------------------------------------------- camera
  const target = new THREE.Vector3(-1, 1.5, -1);
  const _m4 = new THREE.Matrix4(), _c1 = new THREE.Color(), _c2 = new THREE.Color(), _v3 = new THREE.Vector3();
  const look = { x: -1, z: -1, dist: 70, tilt: 0.86, az: -0.35, zoom: 1 };
  const goal = { x: -1, z: -1, zoom: 1 };
  let driftT = 0;
  function fitDistance() {
    const fov = camera.fov * Math.PI / 180;
    const tan = Math.tan(fov / 2);
    const fr = frame;
    const E = 62, Eh = 46 * Math.sin(look.tilt) + 14;
    const dW = E * H / (2 * tan * Math.max(80, fr.w) * 0.92);
    const dH = Eh * H / (2 * tan * Math.max(80, fr.h) * 0.9);
    return Math.max(dW, dH) * look.zoom;
  }
  function updateCamera(dt) {
    if (!reduced) driftT += dt;
    const az = look.az + Math.sin(driftT * 0.07) * 0.12;
    const tilt = look.tilt + Math.sin(driftT * 0.05) * 0.03;
    const e = 1 - Math.exp(-dt * (reduced ? 20 : 3.2));
    look.x += (goal.x - look.x) * e; look.z += (goal.z - look.z) * e; look.zoom += (goal.zoom - look.zoom) * e;
    const d = fitDistance();
    camera.position.set(look.x + Math.sin(az) * Math.cos(tilt) * d, Math.sin(tilt) * d, look.z + Math.cos(az) * Math.cos(tilt) * d);
    target.set(look.x, 1.5 * look.zoom, look.z);
    camera.lookAt(target);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    // shift the picture so the city sits in the free rectangle (an off-centre frustum: a translation in clip space)
    const cx = (frame.x + frame.w / 2) / W * 2 - 1, cy = -((frame.y + frame.h / 2) / H * 2 - 1);
    camera.projectionMatrix.premultiply(_m4.makeTranslation(cx, cy, 0));
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }

  // ---------------------------------------------------------------- weather
  let weather = 'clear', lookW = { ...WEATHER_LOOK.clear }, wantW = WEATHER_LOOK.clear;
  const mix = (a, b, t) => a + (b - a) * t;
  let flashT = 0, nextFlash = 3, rainAmt = 0, dawnT = 0;
  function applyWeather(dt) {
    const e = 1 - Math.exp(-dt * 1.4);
    for (const k of ['density', 'amb', 'moon', 'wet', 'rain']) lookW[k] = mix(lookW[k], wantW[k], e);
    scene.fog.density = lookW.density;
    scene.fog.color.lerp(_c1.setHex(wantW.fog), e);
    hemi.intensity = lookW.amb; moon.intensity = lookW.moon;
    groundMat.roughness = mix(0.9, 0.3, 1 - lookW.wet); groundMat.metalness = mix(0.1, 0.35, 1 - lookW.wet);
    rainAmt = lookW.rain;
    rain.visible = rainAmt > 0.05 && T.rain > 0 && !reduced;
    rainMat.opacity = Math.min(0.6, rainAmt * 0.45);
    dawnT = mix(dawnT, wantW.dawn ? 1 : 0, e);
    if (dawnT > 0.001) {
      hemi.color.setHex(0xe0b890).lerp(_c1.setHex(0x4a5aa0), 1 - dawnT); hemi.groundColor.setHex(0x3a2a40).lerp(_c2.setHex(0x0a0812), 1 - dawnT);
      moon.color.setHex(0xffd9a0).lerp(_c1.setHex(0x9fb4ff), 1 - dawnT);
      for (const m of instanced) m.material[0].emissiveIntensity = mix(1.5, 0.4, dawnT);
    }
  }

  // ---------------------------------------------------------------- frame
  let last = 0, lightsT = 0;
  const stats = { tier, rain: 0, trucks: 0 };
  function frameStep(now) {
    const t = now / 1000;
    const dt = Math.min(0.1, last ? t - last : 0.016); last = t;
    const w0 = performance.now();
    updateCamera(dt);
    applyWeather(dt);
    // searchlights sweep
    beams.forEach((b, i) => { b.pivot.visible = T.lights > i && !reduced; b.pivot.rotation.y = t * 0.35 + b.ph; });
    // haze breathes; neon flickers a little
    hazes.forEach((hz, i) => { hz.sp.visible = i < T.haze; hz.sp.material.opacity = hz.base + Math.sin(t * 0.6 + hz.ph) * 0.02 + rainAmt * 0.03; });
    lightsT += dt;
    // the low tier keeps three neon lights (the Strip, Uptown, the Docks), the rest go dark
    neonLights.forEach((l, i) => { l.intensity = (T.lights ? 70 : i % 2 ? 0 : 55) * (0.85 + 0.15 * Math.sin(t * 2.1 + i * 1.7)) * (1 - dawnT * 0.6); });
    if (!reduced) signs.forEach((m, i) => { if (m.material.opacity != null) m.material.opacity = (i % 7 === 3 && Math.sin(t * 13) > 0.92 ? 0.3 : 1) * (m.isSprite ? 0.55 : 0.95); });
    // steam from the engine
    for (const s of steams) { s.t += dt * 0.25; if (s.t > 1) { s.t -= 1; } s.sp.position.set(12.6 + s.t * 1.5 + Math.sin(s.t * 9) * 0.3, 2.6 + s.t * 4, 11.2 + s.t * 0.8); const k = 0.6 + s.t * 2.4; s.sp.scale.set(k, k, 1); s.sp.material.opacity = 0.22 * (1 - s.t) * (1 - dawnT * 0.3); }
    // rain falls
    if (rain.visible) {
      const n = Math.min(rainN, T.rain); rainGeo.setDrawRange(0, n);
      const a = rainGeo.attributes.position.array;
      const fall = (22 + rainAmt * 10) * dt;
      for (let i = 0; i < n; i++) { let y = a[i * 3 + 1] - fall; if (y < 0) { y += 26; a[i * 3] = -32 + Math.random() * 64; a[i * 3 + 2] = -22 + Math.random() * 44; } a[i * 3 + 1] = y; a[i * 3] += dt * 2; }
      rainGeo.attributes.position.needsUpdate = true;
      stats.rain = n;
    } else stats.rain = 0;
    // lightning in a storm
    if (weather === 'storm' && !reduced) {
      nextFlash -= dt;
      if (nextFlash <= 0) { flashT = 0.22 + Math.random() * 0.2; nextFlash = 4 + Math.random() * 9; onFlash && onFlash(); }
    }
    if (flashT > 0) { flashT -= dt; flashLight.intensity = flashT > 0 ? (Math.random() < 0.7 ? 2.2 : 0.4) : 0; } else flashLight.intensity = 0;
    // trucks driving
    for (const tr of trucks.values()) {
      if (!tr.drive) continue;
      const D = tr.drive; const p = Math.min(1, Math.max(0, (now - D.t0) / D.ms));
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      // an L-shaped route along the streets: east/west first, then north/south
      const mid = { x: D.to.x, z: D.from.z };
      const seg1 = Math.abs(mid.x - D.from.x), seg2 = Math.abs(D.to.z - mid.z), total = seg1 + seg2 || 1;
      const s = ease * total;
      let x, z, ry;
      if (s < seg1) { x = D.from.x + Math.sign(mid.x - D.from.x) * s; z = D.from.z; ry = mid.x > D.from.x ? Math.PI / 2 : -Math.PI / 2; }
      else { x = mid.x; z = mid.z + Math.sign(D.to.z - mid.z) * (s - seg1); ry = D.to.z > mid.z ? 0 : Math.PI; }
      tr.g.position.set(x, 0.05 + Math.sin(now / 60) * 0.015, z); tr.g.rotation.y = ry;
      if (p >= 1) { tr.drive = null; tr.g.rotation.y = 0; if (tr.home) tr.g.position.set(tr.home.x, 0, tr.home.z); }
    }
    for (const tr of trucks.values()) {
      if (!tr.halo) continue;
      if (tr.mine) { const k = 1 + 0.22 * Math.sin(t * 3.2); tr.halo.scale.set(4.6 * k, 3.4 * k, 1); tr.halo.material.opacity = 0.8; }
      else { tr.halo.scale.set(3.4, 2.4, 1); tr.halo.material.opacity = 0.5; }
    }
    stats.trucks = trucks.size; stats.tier = tier;
    renderer.render(scene, camera);
    return performance.now() - w0;
  }

  let onFlash = null;
  const api = {
    resize(w, h) { W = Math.max(1, w); H = Math.max(1, h); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, T.dpr)); renderer.setSize(W, H, false); },
    /** The free rectangle (CSS px, in the canvas) the city should be framed in. */
    setFrame(f) { frame = { x: f.x, y: f.y, w: Math.max(40, f.w), h: Math.max(40, f.h) }; },
    setWeather(w) { weather = WEATHER_LOOK[w] ? w : 'clear'; wantW = WEATHER_LOOK[weather]; nextFlash = 1.5; },
    weather: () => weather,
    /** Everyone's truck: { uid: { dist, color } }. New trucks appear parked; moved ones drive when `drive` is called. */
    setTrucks(map, { instant = true } = {}) {
      for (const uid of [...trucks.keys()]) if (!map[uid]) { scene.remove(trucks.get(uid).g); trucks.delete(uid); }
      for (const [uid, t] of Object.entries(map)) {
        let tr = trucks.get(uid);
        if (!tr) { const g = makeTruck(t.color); tr = { g, halo: g.userData.halo, color: t.color, dist: t.dist, drive: null, mine: false }; trucks.set(uid, tr); }
        tr.dist = t.dist;
      }
      placeTrucks(instant);
    },
    /** Drives a truck from one district to another over ms (from its current spot). */
    drive(uid, fromDist, toDist, ms, now, delay = 0) {
      const tr = trucks.get(uid); if (!tr) return;
      tr.dist = toDist; placeTrucks(false);
      const from = fromDist === toDist ? { x: tr.g.position.x, z: tr.g.position.z } : (() => { const s = SPOTS[fromDist] || SPOTS.quarter; return { x: s.x, z: s.z + 3.6 }; })();
      tr.drive = { from, to: tr.home, t0: now + delay, ms: reduced ? 1 : ms };
    },
    /** Swoop the camera into a district (null = the whole city). */
    focus(dist, zoom = 0.42) {
      if (!dist) { goal.x = -1; goal.z = -1; goal.zoom = 1; return; }
      const s = SPOTS[dist]; goal.x = s.x; goal.z = s.z; goal.zoom = zoom;
    },
    setMine(uid) { for (const [u, tr] of trucks) tr.mine = u === uid; },
    flash() { flashT = 0.3; },
    onFlash(fn) { onFlash = fn; },
    /** Screen position (CSS px) of a district's centre, for labels. */
    project(dist, out = {}) { const s = SPOTS[dist]; const v = _v3.set(s.x, 2.2, s.z).project(camera); out.x = (v.x + 1) / 2 * W; out.y = (1 - v.y) / 2 * H; out.z = v.z; return out; },
    setTier(t) { tier = Math.max(0, Math.min(2, t)); T = TIERS[tier]; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, T.dpr)); renderer.setSize(W, H, false); },
    tier: () => tier,
    frame: frameStep,
    stats: () => ({ ...stats, W, H, dpr: renderer.getPixelRatio() }),
    destroy() { for (const d of disposables) { try { d.dispose(); } catch { /* fine */ } } renderer.dispose(); },
  };
  return api;
}
