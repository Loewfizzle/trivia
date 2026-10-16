// NEON PAR — three.js scene: the course, your ball, ghost balls, camera, effects, quality tiers.
// Plane coordinates (x, y) map to world (X = x, Z = -y); world Y is height. All geometry for a hole is
// tracked and disposed on hole change (renderer.info.memory stays flat across 9 holes).
import * as THREE from 'three';
import { heightAt, moverSegments, platformAt, tileOn, R, CUP_R, prepareHole, pointInPoly } from './physics.js';
import { buildZone, glowTexture, PALETTE } from './zones.js';
import { powerIconCanvas, POWER_COLOR } from './ball.js';

const TIERS = [
  { name: 'low', dpr: 1, particles: 40, ghostTrails: false },
  { name: 'mid', dpr: 1.5, particles: 90, ghostTrails: true },
  { name: 'high', dpr: 2, particles: 160, ghostTrails: true },
];

const W = (x, y, h = 0) => new THREE.Vector3(x, h, -y);

export function initialTier() {
  try {
    const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
    return cores >= 6 && mem >= 4 ? 2 : 1;
  } catch { return 1; }
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  let tier = initialTier();
  let T = TIERS[tier];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 900);
  const glow = glowTexture();
  const shared = { glow };
  let hole = null, zone = null, env = null, course = null;
  const track = []; // per-hole disposables
  const own = o => { track.push(o); return o; };
  let me = null;               // { mesh, trail, color, finish, trailStyle }
  const ghosts = new Map();    // uid -> { group, mesh, trail, tag (dom), color }
  const fx = { particles: [], rings: [], shake: 0, shakeUntil: 0 };
  let envMap = null;

  // ------------------------------------------------------------ size / tiers
  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, T.dpr));
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = Math.max(1, r.width) / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }
  const frames = [];
  let tick = 0, tierLock = 0, upLock = 0, autoTier = true, onTier = null;
  const maxTier = initialTier();
  function monitor(dt) {
    if (!autoTier) return;
    frames.push(dt); if (frames.length > 90) frames.shift();
    if (++tick % 15 || frames.length < 90 || performance.now() < tierLock) return;
    const s = [...frames].sort((a, b) => a - b);
    const p75 = s[Math.floor(s.length * 0.75)];
    if (p75 > 0.0195 && tier > 0) setTier(tier - 1);
    // a hiccup (loading, another app) shouldn't cost quality for good: step back up after a calm stretch
    else if (p75 < 0.0175 && s[Math.floor(s.length * 0.95)] < 0.019 && tier < maxTier && performance.now() > upLock) { upLock = performance.now() + 15000; setTier(tier + 1); }
  }
  function setTier(n) {
    tier = Math.max(0, Math.min(TIERS.length - 1, n)); T = TIERS[tier];
    frames.length = 0; tierLock = performance.now() + 3000;
    resize();
    onTier && onTier(T.name);
  }

  // a tiny environment map for chrome/glass (built once from a gradient room)
  function buildEnvMap() {
    const pm = new THREE.PMREMGenerator(renderer);
    const room = new THREE.Scene();
    const geo = new THREE.SphereGeometry(10, 16, 8);
    const c = document.createElement('canvas'); c.width = 4; c.height = 64;
    const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#6a7cff'); g.addColorStop(0.55, '#ff4fa3'); g.addColorStop(1, '#05040d');
    x.fillStyle = g; x.fillRect(0, 0, 4, 64);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    room.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));
    envMap = pm.fromScene(room, 0.02).texture;
    geo.dispose(); tex.dispose(); pm.dispose();
  }
  buildEnvMap();

  // ------------------------------------------------------------ course building
  function clearHole() {
    if (course) scene.remove(course.group);
    if (env) scene.remove(env.group);
    for (const o of track) { try { o.dispose && o.dispose(); } catch { /* already gone */ } }
    for (const o of env ? env.track : []) { try { o.dispose && o.dispose(); } catch { /* */ } }
    track.length = 0;
    course = null; env = null;
  }

  function bounds(h) {
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const add = ([x, y]) => { b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.x1 = Math.max(b.x1, x); b.y1 = Math.max(b.y1, y); };
    for (const f of h.floors) f.poly.forEach(add);
    for (const m of h.movers || []) if (m.poly) m.poly.forEach(add);
    return b;
  }

  /** A floor polygon as a height-following grid (slopes and ramps really tilt). */
  function floorGeometry(poly, hFn, cell = 0.5) {
    const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const nx = Math.max(1, Math.round((x1 - x0) / cell)), ny = Math.max(1, Math.round((y1 - y0) / cell));
    const pos = [], uv = [], idx = [];
    const vid = new Map();
    const v = (i, j) => {
      const k = i * 100000 + j;
      if (vid.has(k)) return vid.get(k);
      const x = x0 + ((x1 - x0) * i) / nx, y = y0 + ((y1 - y0) * j) / ny;
      pos.push(x, hFn(x, y), -y); uv.push(x / 4, y / 4);
      vid.set(k, pos.length / 3 - 1);
      return pos.length / 3 - 1;
    };
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const cxp = x0 + ((x1 - x0) * (i + 0.5)) / nx, cyp = y0 + ((y1 - y0) * (j + 0.5)) / ny;
      if (!pointInPoly(cxp, cyp, poly)) continue;
      const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
      idx.push(a, b, c, a, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function surfaceMaterial(z, surface) {
    const P = PALETTE[z];
    if (surface === 'grid') {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 128, 128);
      x.strokeStyle = 'rgba(63,243,255,0.85)'; x.lineWidth = 3; x.strokeRect(0, 0, 128, 128);
      x.strokeStyle = 'rgba(63,243,255,0.22)'; x.lineWidth = 1; x.beginPath(); x.moveTo(64, 0); x.lineTo(64, 128); x.moveTo(0, 64); x.lineTo(128, 64); x.stroke();
      const t = own(new THREE.CanvasTexture(c)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
      return own(new THREE.MeshStandardMaterial({ color: P.grid, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.2, envMap, envMapIntensity: 0.4 }));
    }
    if (surface === 'chrome') {
      // a pinball playfield: brushed dark metal with light-up inserts (arrows, dots, rings) that pulse
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d');
      x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256);
      const insert = (col, a) => { x.fillStyle = col; x.globalAlpha = a; };
      insert('#ffb627', 0.9);
      for (const [ax, ay] of [[64, 70], [192, 190]]) { x.beginPath(); x.moveTo(ax, ay - 22); x.lineTo(ax + 16, ay + 6); x.lineTo(ax + 6, ay + 6); x.lineTo(ax + 6, ay + 22); x.lineTo(ax - 6, ay + 22); x.lineTo(ax - 6, ay + 6); x.lineTo(ax - 16, ay + 6); x.closePath(); x.fill(); }
      insert('#ff2bd6', 0.85);
      for (const [dx, dy] of [[190, 52], [206, 68], [222, 84], [40, 190], [56, 206], [72, 222]]) { x.beginPath(); x.arc(dx, dy, 6, 0, Math.PI * 2); x.fill(); }
      insert('#ff2bd6', 0.6); x.lineWidth = 4; x.strokeStyle = '#ff2bd6';
      x.beginPath(); x.arc(128, 128, 30, 0, Math.PI * 2); x.stroke();
      x.globalAlpha = 1;
      const em = own(new THREE.CanvasTexture(c)); em.wrapS = em.wrapT = THREE.RepeatWrapping; em.colorSpace = THREE.SRGBColorSpace;
      em.repeat.set(1 / 3, 1 / 3);
      const mat = own(new THREE.MeshStandardMaterial({ color: P.chrome, metalness: 0.7, roughness: 0.34, envMap, envMapIntensity: 0.85, emissive: '#ffffff', emissiveMap: em, emissiveIntensity: 0.8 }));
      if (course) course.pulse.push(mat);
      return mat;
    }
    // turf / wet: mowing stripes + fine grain, a soft teal self-glow ("turf glow") and, on the wet
    // rooftops, a sheen that picks up the neon from the env map
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const base = surface === 'wet' ? P.wet : P.turf;
    x.fillStyle = base; x.fillRect(0, 0, 128, 128);
    x.fillStyle = 'rgba(255,255,255,0.055)'; x.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 1800; i++) { x.fillStyle = `rgba(${150 + Math.random() * 80 | 0},255,${210 + Math.random() * 45 | 0},${Math.random() * 0.08})`; x.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5); }
    const t = own(new THREE.CanvasTexture(c)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return own(new THREE.MeshStandardMaterial({ color: '#ffffff', map: t, emissive: P.edge, emissiveIntensity: 0.07, roughness: surface === 'wet' ? 0.34 : 0.78, metalness: surface === 'wet' ? 0.2 : 0.05, envMap, envMapIntensity: surface === 'wet' ? 0.75 : 0.25 }));
  }

  function setHole(h, now = 0) {
    clearHole();
    hole = h; zone = h.zone;
    prepareHole(h);
    const P = PALETTE[zone];
    const b = bounds(h);
    env = buildZone(zone, b, tier, glow, envMap);
    scene.add(env.group);
    scene.fog = env.fog;
    const group = new THREE.Group();
    course = { group, bumpers: [], movers: [], tiles: [], platforms: [], pickups: [], boosts: [], portals: [], pulse: [], cup: null, b };
    const hFn = (x, y) => heightAt(h, x, y, 0);
    const sideMat = own(new THREE.MeshStandardMaterial({ color: P.side, roughness: 0.7, metalness: 0.3 }));
    const edgeMat = own(new THREE.MeshBasicMaterial({ color: P.edge }));
    // floors + their solid sides + a glowing edge line ("turf glow")
    const addFloor = (poly, surface, hf, parent = group) => {
      const mat = surfaceMaterial(zone, surface);
      const mesh = new THREE.Mesh(own(floorGeometry(poly, hf)), mat);
      parent.add(mesh);
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], c = poly[(i + 1) % poly.length];
        const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
        const mx = (a[0] + c[0]) / 2, my = (a[1] + c[1]) / 2;
        const top = hf(mx - (c[1] - a[1]) * 0.01, my + (c[0] - a[0]) * 0.01);
        const side = new THREE.Mesh(own(new THREE.BoxGeometry(len, 1.2, 0.2)), sideMat);
        side.position.set(mx, top - 0.62, -my); side.rotation.y = Math.atan2(c[1] - a[1], c[0] - a[0]);
        parent.add(side);
        const edge = new THREE.Mesh(own(new THREE.BoxGeometry(len, 0.05, 0.08)), edgeMat);
        edge.position.set(mx, top - 0.02, -my); edge.rotation.y = side.rotation.y;
        parent.add(edge);
      }
      return mesh;
    };
    for (const f of h.floors) addFloor(f.poly, f.surface, hFn);

    // walls: one instanced body + one instanced neon cap
    const segs = prepareHole(h).segs;
    const bodyGeo = own(new THREE.BoxGeometry(1, 1, 1));
    const bodyMat = own(new THREE.MeshStandardMaterial({ color: zone === 'arcade' ? '#d8d0e6' : P.wall, metalness: zone === 'arcade' ? 0.95 : 0.4, roughness: zone === 'arcade' ? 0.18 : 0.5, envMap, envMapIntensity: 0.8 }));
    const capMat = own(new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
    const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, segs.length);
    const caps = new THREE.InstancedMesh(bodyGeo, capMat, segs.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    segs.forEach((s, i) => {
      const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) + 0.3;
      const mx = (s.a[0] + s.b[0]) / 2, my = (s.a[1] + s.b[1]) / 2;
      const base = Math.max(hFn(s.a[0], s.a[1]), hFn(s.b[0], s.b[1]), hFn(mx, my));
      const hh = s.kind === 'lip' ? 0.28 : s.kind === 'rubber' ? 0.62 : 0.55;
      q.setFromAxisAngle(up, Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]));
      p.set(mx, base + hh / 2 - 0.05, -my); sc.set(len, hh, 0.3); m4.compose(p, q, sc); bodies.setMatrixAt(i, m4);
      p.set(mx, base + hh - 0.02, -my); sc.set(len, 0.06, 0.34); m4.compose(p, q, sc); caps.setMatrixAt(i, m4);
      col.set(s.kind === 'rubber' ? P.accent : s.kind === 'laser' ? '#ff3b6b' : s.kind === 'lip' ? '#ffd27a' : P.edge);
      caps.setColorAt(i, col);
    });
    group.add(bodies, caps);

    // bumpers (flash when hit)
    for (const bu of h.bumpers || []) {
      const hb = hFn(bu.c[0], bu.c[1]);
      const g = new THREE.Group();
      const body = new THREE.Mesh(own(new THREE.CylinderGeometry(bu.r, bu.r * 1.05, 0.8, 20)), own(new THREE.MeshStandardMaterial({ color: '#221a2e', metalness: 0.7, roughness: 0.3, envMap })));
      body.position.y = 0.4;
      const ringMat = own(new THREE.MeshBasicMaterial({ color: P.accent, toneMapped: false }));
      const ring = new THREE.Mesh(own(new THREE.TorusGeometry(bu.r * 0.92, 0.09, 8, 28)), ringMat);
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.82;
      const halo = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: glow, color: P.accent, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })));
      halo.scale.set(bu.r * 3.4, bu.r * 3.4, 1); halo.position.y = 0.8; halo.userData.dyn = true;
      g.add(body, ring, halo); g.position.set(bu.c[0], hb, -bu.c[1]);
      group.add(g);
      course.bumpers.push({ data: bu, ring: ringMat, halo, flash: 0 });
    }

    // cup: dark hole, glowing rim, flag
    {
      const [cx, cy] = h.cup; const hc = hFn(cx, cy);
      const g = new THREE.Group();
      const hole3 = new THREE.Mesh(own(new THREE.CircleGeometry(CUP_R, 32)), own(new THREE.MeshBasicMaterial({ color: '#000000' })));
      hole3.rotation.x = -Math.PI / 2; hole3.position.y = 0.012;
      const rimMat = own(new THREE.MeshBasicMaterial({ color: P.accent, toneMapped: false }));
      const rim = new THREE.Mesh(own(new THREE.TorusGeometry(CUP_R, 0.06, 8, 40)), rimMat);
      rim.rotation.x = Math.PI / 2; rim.position.y = 0.03;
      const halo = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: glow, color: P.accent, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })));
      halo.scale.set(4.2, 4.2, 1); halo.position.y = 0.2;
      g.add(hole3, rim, halo);
      if (zone === 'cyber') {
        const beam = new THREE.Mesh(own(new THREE.CylinderGeometry(0.25, 0.6, 9, 16, 1, true)), own(new THREE.MeshBasicMaterial({ color: '#3ff3ff', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
        beam.position.y = 4.5; g.add(beam);
      } else {
        const pole = new THREE.Mesh(own(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 6)), own(new THREE.MeshStandardMaterial({ color: '#e6e8f0', metalness: 0.9, roughness: 0.2, envMap })));
        pole.position.y = 2.1;
        const flag = new THREE.Mesh(own(new THREE.PlaneGeometry(1.5, 0.9)), own(new THREE.MeshBasicMaterial({ color: zone === 'arcade' ? '#ffb627' : '#ff4fa3', side: THREE.DoubleSide, toneMapped: false })));
        flag.position.set(0.76, 3.7, 0); flag.userData.dyn = true;
        g.add(pole, flag);
        course.flag = flag;
      }
      g.position.set(cx, hc, -cy);
      group.add(g);
      course.cup = { group: g, rim: rimMat, halo };
    }

    // tee: two small glowing markers either side of the tee spot
    {
      const th = hFn(h.tee[0], h.tee[1]);
      const mg = own(new THREE.SphereGeometry(0.16, 10, 8)), mm = own(new THREE.MeshBasicMaterial({ color: P.accent, toneMapped: false }));
      for (const dx of [-1.3, 1.3]) { const m = new THREE.Mesh(mg, mm); m.position.set(h.tee[0] + dx, th + 0.16, -h.tee[1] + 0.3); group.add(m); }
    }

    // boost strips: scrolling chevrons
    for (const bo of h.boosts || []) {
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const x = c.getContext('2d'); x.strokeStyle = '#ffffff'; x.lineWidth = 7; x.lineCap = 'round';
      for (const yy of [16, 48]) { x.beginPath(); x.moveTo(14, yy + 10); x.lineTo(32, yy - 6); x.lineTo(50, yy + 10); x.stroke(); }
      const t = own(new THREE.CanvasTexture(c)); t.wrapS = t.wrapT = THREE.RepeatWrapping;
      const xs = bo.poly.map(p2 => p2[0]), ys = bo.poly.map(p2 => p2[1]);
      const w = Math.max(...xs) - Math.min(...xs), d = Math.max(...ys) - Math.min(...ys);
      t.repeat.set(Math.max(1, w / 2), Math.max(1, d / 2));
      const mesh = new THREE.Mesh(own(new THREE.PlaneGeometry(w, d)), own(new THREE.MeshBasicMaterial({ map: t, color: zone === 'cyber' ? '#3ff3ff' : '#ffb627', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
      const mx = (Math.max(...xs) + Math.min(...xs)) / 2, my = (Math.max(...ys) + Math.min(...ys)) / 2;
      mesh.rotation.x = -Math.PI / 2; mesh.rotation.z = Math.atan2(bo.dir[0], bo.dir[1]);
      mesh.position.set(mx, hFn(mx, my) + 0.02, -my);
      group.add(mesh);
      course.boosts.push(t);
    }

    // portals: glowing rings with a swirl
    for (const pt of h.portals || []) {
      for (const [at, color] of [[pt.in, '#3ff3ff'], [pt.out, '#ff4fd8']]) {
        const g = new THREE.Group();
        const ring = new THREE.Mesh(own(new THREE.TorusGeometry((pt.r || 1) + 0.15, 0.12, 8, 36)), own(new THREE.MeshBasicMaterial({ color, toneMapped: false })));
        ring.rotation.x = Math.PI / 2; ring.position.y = 0.05;
        const disc = new THREE.Mesh(own(new THREE.CircleGeometry(pt.r || 1, 32)), own(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
        disc.rotation.x = -Math.PI / 2; disc.position.y = 0.03; disc.userData.dyn = true;
        const halo = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: glow, color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })));
        halo.scale.set(4.4, 4.4, 1); halo.position.y = 0.4;
        g.add(ring, disc, halo); g.position.set(at[0], hFn(at[0], at[1]), -at[1]);
        group.add(g); course.portals.push({ g, disc, ring });
      }
    }

    // movers
    const laserMat = own(new THREE.MeshBasicMaterial({ color: '#ff3b6b', toneMapped: false }));
    const armMat = own(new THREE.MeshStandardMaterial({ color: '#e8e2f2', metalness: 1, roughness: 0.15, envMap }));
    for (const m of h.movers || []) {
      if (m.type === 'laser' || m.type === 'spinner') {
        const arms = [];
        const count = m.arms || 1;
        for (let k = 0; k < count; k++) {
          const len = m.length - (m.inner || 0);
          const arm = new THREE.Mesh(own(new THREE.BoxGeometry(len, m.type === 'laser' ? 0.12 : 0.45, m.type === 'laser' ? 0.12 : 0.35)), m.type === 'laser' ? laserMat : armMat);
          const glowLine = m.type === 'laser' ? new THREE.Mesh(own(new THREE.BoxGeometry(len, 0.5, 0.5)), own(new THREE.MeshBasicMaterial({ color: '#ff3b6b', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }))) : null;
          arm.userData.dyn = true; if (glowLine) glowLine.userData.dyn = true;
          group.add(arm); if (glowLine) group.add(glowLine);
          arms.push({ arm, glowLine });
        }
        const hub = new THREE.Mesh(own(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 16)), armMat);
        hub.position.set(m.pivot[0], hFn(m.pivot[0], m.pivot[1]) + 0.45, -m.pivot[1]);
        group.add(hub);
        course.movers.push({ m, arms, base: hFn(m.pivot[0], m.pivot[1]) });
      } else if (m.type === 'tile') {
        const mat = surfaceMaterial(zone, m.surface || 'grid');
        mat.transparent = true;
        const mesh = new THREE.Mesh(own(floorGeometry(m.poly, () => m.h || 0)), mat);
        const edge = new THREE.LineSegments(own(new THREE.EdgesGeometry(own(new THREE.BoxGeometry(4, 0.1, 5)))), own(new THREE.LineBasicMaterial({ color: '#3ff3ff', transparent: true })));
        const xs = m.poly.map(p2 => p2[0]), ys = m.poly.map(p2 => p2[1]);
        edge.position.set((Math.min(...xs) + Math.max(...xs)) / 2, (m.h || 0), -(Math.min(...ys) + Math.max(...ys)) / 2);
        group.add(mesh, edge);
        course.tiles.push({ m, mesh, mat, edge });
      } else if (m.type === 'platform') {
        const g = new THREE.Group();
        addFloor(m.poly, m.surface || 'chrome', () => m.h || 0, g);
        g.userData.dyn = true;
        group.add(g);
        course.platforms.push({ m, g });
      }
    }

    // power-up pickups
    for (const [i, pu] of (h.powerups || []).entries()) {
      const s = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: own(powerIconTexture(pu.kind)), transparent: true, depthWrite: false })));
      s.scale.set(1.5, 1.5, 1);
      const halo = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: glow, color: POWER_COLOR[pu.kind], transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })));
      halo.scale.set(3, 3, 1);
      const g = new THREE.Group(); g.add(halo, s);
      g.position.set(pu.at[0], hFn(pu.at[0], pu.at[1]) + 1, -pu.at[1]);
      g.userData.dyn = true;
      group.add(g);
      course.pickups.push({ i, g, base: g.position.y, kind: pu.kind });
    }

    // static meshes never move: skip their per-frame matrix updates (animated ones are tagged dyn)
    for (const root of [group, env.group]) root.traverse(o => { if (!o.userData.dyn) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
    scene.add(group);
    camState.snapTo = true;
    return course;
  }

  // ------------------------------------------------------------ balls
  function ballMaterial(color, finish, ghost = false) {
    const c = new THREE.Color(color);
    let mat;
    if (finish === 'chrome') mat = new THREE.MeshStandardMaterial({ color: c.clone().lerp(new THREE.Color('#ffffff'), 0.55), metalness: 1, roughness: 0.12, envMap, envMapIntensity: 1.4, emissive: c, emissiveIntensity: 0.12 });
    else if (finish === 'glass') mat = new THREE.MeshStandardMaterial({ color: c, metalness: 0.1, roughness: 0.05, envMap, envMapIntensity: 1.2, transparent: true, opacity: 0.62, emissive: c, emissiveIntensity: 0.35 });
    else mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, emissive: c, emissiveIntensity: 1.1, toneMapped: false });
    if (ghost) { mat.transparent = true; mat.opacity = 0.38; mat.depthWrite = false; }
    return mat;
  }

  function makeBall({ c: color, f: finish, t: trail }, ghost = false) {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 18), ballMaterial(color, finish, ghost));
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, opacity: ghost ? 0.25 : 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.set(2.4, 2.4, 1);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(R * 1.3, 16), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: ghost ? 0.15 : 0.35, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    // power-up aura: a slowly turning ring around the ball while a power-up is armed / active
    const aura = new THREE.Mesh(new THREE.TorusGeometry(R * 1.55, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    aura.rotation.x = Math.PI / 2; aura.visible = false;
    group.add(mesh, halo, shadow, aura);
    const tr = makeTrail(trail, color, ghost);
    if (tr) scene.add(tr.obj);
    return { group, mesh, halo, shadow, aura, trail: tr, color, ghost, baseOpacity: mesh.material.opacity, transparent0: mesh.material.transparent };
  }
  function disposeBall(b) {
    if (!b) return;
    scene.remove(b.group);
    b.group.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); });
    if (b.trail) { scene.remove(b.trail.obj); b.trail.dispose(); }
  }

  // trails: ribbon (flat glowing strip), sparks (points), pixels (tiny cubes)
  function makeTrail(style, color, ghost) {
    const N = ghost ? 18 : 34;
    if (style === 'sparks') {
      const geo = new THREE.BufferGeometry();
      const arr = new Float32Array(N * 3), life = new Float32Array(N);
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const mat = new THREE.PointsMaterial({ color, size: 0.35, transparent: true, opacity: ghost ? 0.4 : 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const obj = new THREE.Points(geo, mat);
      let k = 0;
      return {
        obj, dispose() { geo.dispose(); mat.dispose(); },
        push(p, moving) {
          if (moving) { arr[k * 3] = p.x + (Math.random() - 0.5) * 0.4; arr[k * 3 + 1] = p.y + (Math.random() - 0.3) * 0.4; arr[k * 3 + 2] = p.z + (Math.random() - 0.5) * 0.4; life[k] = 1; k = (k + 1) % N; }
          for (let i = 0; i < N; i++) { if (life[i] > 0) { life[i] -= 0.04; arr[i * 3 + 1] += 0.01; if (life[i] <= 0) arr[i * 3 + 1] = -999; } }
          geo.attributes.position.needsUpdate = true;
        },
        reset() { life.fill(0); for (let i = 0; i < N; i++) arr[i * 3 + 1] = -999; geo.attributes.position.needsUpdate = true; },
      };
    }
    if (style === 'pixels') {
      const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: ghost ? 0.35 : 0.85, toneMapped: false });
      const obj = new THREE.InstancedMesh(geo, mat, N);
      const pts = [];
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), at = new THREE.Vector3();
      return {
        obj, dispose() { geo.dispose(); mat.dispose(); },
        push(p, moving) {
          if (moving) { pts.unshift({ x: p.x, y: p.y, z: p.z }); if (pts.length > N) pts.pop(); }
          for (let i = 0; i < N; i++) {
            const pt = pts[i];
            const k = pt ? 1 - i / N : 0;
            s.setScalar(pt ? k : 0.0001);
            if (pt) at.set(pt.x, pt.y - 0.1, pt.z); else at.set(0, -999, 0);
            m4.compose(at, q, s);
            obj.setMatrixAt(i, m4);
          }
          obj.instanceMatrix.needsUpdate = true;
          if (!moving && pts.length) pts.pop();
        },
        reset() { pts.length = 0; this.push({ x: 0, y: -999, z: 0 }, false); },
      };
    }
    // ribbon
    const pos = new Float32Array(N * 2 * 3), alpha = new Float32Array(N * 2);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const colors = new Float32Array(N * 2 * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const idx = [];
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: ghost ? 0.35 : 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const obj = new THREE.Mesh(geo, mat);
    obj.frustumCulled = false;
    const pts = [];
    const base = new THREE.Color(color);
    return {
      obj, dispose() { geo.dispose(); mat.dispose(); },
      push(p, moving) {
        if (moving) { pts.unshift({ x: p.x, y: p.y - 0.42, z: p.z }); if (pts.length > N) pts.pop(); } else if (pts.length) pts.pop();
        for (let i = 0; i < N; i++) {
          const a = pts[Math.min(i, pts.length - 1)] || { x: 0, y: -999, z: 0 };
          const b2 = pts[Math.min(i + 1, pts.length - 1)] || a;
          let dx = a.x - b2.x, dz = a.z - b2.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
          const w = R * 0.8 * (1 - i / N);
          const o = i * 6;
          pos[o] = a.x - dz * w; pos[o + 1] = a.y; pos[o + 2] = a.z + dx * w; pos[o + 3] = a.x + dz * w; pos[o + 4] = a.y; pos[o + 5] = a.z - dx * w;
          const k = i < pts.length ? (1 - i / N) : 0;
          colors[o] = colors[o + 3] = base.r * k; colors[o + 1] = colors[o + 4] = base.g * k; colors[o + 2] = colors[o + 5] = base.b * k;
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      },
      reset() { pts.length = 0; },
    };
  }

  function setMyBall(style) { disposeBall(me); me = makeBall(style); scene.add(me.group); }
  /** kind: null | 'ghost' | 'sticky' | 'magnet'; active = the shot is using it (stronger look). */
  function setAura(kind, active = false) {
    if (!me) return;
    me.aura.visible = !!kind;
    if (kind) { me.aura.material.color.set(POWER_COLOR[kind]); me.aura.material.opacity = active ? 1 : 0.7; }
    const phasing = kind === 'ghost' && active;
    me.mesh.material.transparent = phasing || me.transparent0;
    me.mesh.material.opacity = phasing ? 0.35 : me.baseOpacity;
    me.mesh.material.needsUpdate = true;
    if (course) course.cupMagnet = kind === 'magnet' && active;
  }
  function hidePickup(i, hidden = true) { const p = course && course.pickups.find(x => x.i === i); if (p) p.g.visible = !hidden; }
  function setGhost(uid, style, name) {
    let g = ghosts.get(uid);
    if (g && g.styleKey === JSON.stringify(style)) return g;
    if (g) disposeBall(g.ball);
    const ball = makeBall(style, true);
    scene.add(ball.group);
    if (!T.ghostTrails && ball.trail) ball.trail.obj.visible = false;
    g = { ball, styleKey: JSON.stringify(style), name };
    ghosts.set(uid, g);
    return g;
  }
  function removeGhost(uid) { const g = ghosts.get(uid); if (g) { disposeBall(g.ball); ghosts.delete(uid); } }

  // ball pose: plane position + visual height (surface, airborne arc, sinking into the cup)
  const tmpV = new THREE.Vector3();
  const qRoll = new THREE.Quaternion(), axis = new THREE.Vector3();
  /** z: absolute height of the ball's contact point (null = the surface under it). */
  function placeBall(b, x, y, z, t, visible = true) {
    const surf = heightAt(hole, x, y, t);
    const base = z != null ? z : surf;
    b.group.visible = visible;
    const mx = x - (b.lx ?? x), mz = -(y - (b.ly ?? y));
    const moved = Math.hypot(mx, mz);
    b.lx = x; b.ly = y;
    b.group.position.set(x, base + R, -y);
    // roll: rotate about the axis perpendicular to the motion
    if (moved > 1e-4 && moved < 3) { axis.set(mz, 0, -mx).normalize(); qRoll.setFromAxisAngle(axis, moved / R); b.mesh.quaternion.premultiply(qRoll); }
    const lift = surf > -1 ? Math.max(0, base - surf) : 9;
    b.shadow.visible = surf > -1;
    b.shadow.position.y = -lift - R + 0.02;
    b.shadow.material.opacity = (b.ghost ? 0.15 : 0.35) / (1 + lift * 0.6);
    if (b.aura.visible) b.aura.rotation.z += 0.03;
    if (b.trail) b.trail.push(b.group.position, visible && moved > 0.004 && moved < 3);
    return b.group.position;
  }
  function resetTrail(b) { if (b && b.trail) b.trail.reset(); if (b) { b.lx = null; b.ly = null; } }

  // ------------------------------------------------------------ camera
  const camState = { target: new THREE.Vector3(), yaw: 0, dist: 22, pitch: 0.82, panX: 0, panY: 0, zoom: 1, snapTo: true, mode: 'follow', fly: null, cine: null };
  /** desired framing: ball (and cup when resting) */
  function cameraGoal(ball, cupVisible, resting) {
    const cup = hole.cup;
    const toCup = [cup[0] - ball[0], cup[1] - ball[1]];
    const dCup = Math.hypot(toCup[0], toCup[1]);
    const yaw = Math.atan2(toCup[0], toCup[1]);
    let tx = ball[0], ty = ball[1], dist = 18;
    if (resting) { const k = Math.min(0.45, 9 / Math.max(1, dCup)) ; tx += toCup[0] * k; ty += toCup[1] * k; dist = Math.max(16, Math.min(34, dCup * 0.75 + 10)); }
    return { tx, ty, yaw, dist };
  }

  let rawDt = 0;
  function updateCamera(dt, ball, resting, t) {
    const c = camState;
    if (c.fly) { flyStep(Math.min(0.5, rawDt)); return; } // real time: a slow frame never stretches the flyover
    if (c.cine) { cineStep(Math.min(0.5, rawDt)); return; }
    const goal = cameraGoal(ball, true, resting);
    const k = c.snapTo ? 1 : 1 - Math.pow(0.0025, dt);
    const ky = c.snapTo ? 1 : 1 - Math.pow(resting ? 0.02 : 0.6, dt);
    const h = heightAt(hole, ball[0], ball[1], t);
    c.target.lerp(tmpV.set(goal.tx + c.panX, Math.max(-1, h), -(goal.ty + c.panY)), k);
    let dy = goal.yaw - c.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    c.yaw += dy * ky;
    c.dist += (goal.dist * c.zoom - c.dist) * k;
    c.snapTo = false;
    placeCamera();
  }
  function placeCamera() {
    const c = camState;
    const off = new THREE.Vector3(-Math.sin(c.yaw) * Math.cos(c.pitch), Math.sin(c.pitch), Math.cos(c.yaw) * Math.cos(c.pitch)).multiplyScalar(c.dist);
    camera.position.copy(c.target).add(off);
    if (fx.shakeUntil > performance.now()) { const a = 0.35; camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a; }
    camera.lookAt(c.target.x, c.target.y + 0.5, c.target.z);
  }

  // flyover: cup -> along the hole -> tee view (~2.5 s)
  // hold: seconds to linger on the opening shot first (under the zone title card)
  function flyover(onDone, hold = 0) {
    const b = course.b;
    const cupP = W(hole.cup[0], hole.cup[1], heightAt(hole, hole.cup[0], hole.cup[1]));
    const mid = W((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 0);
    camState.fly = { t: -hold, dur: 2.6, onDone, from: cupP, mid, size: Math.max(b.x1 - b.x0, b.y1 - b.y0) };
  }
  function flyStep(dt) {
    const f = camState.fly;
    f.t += dt;
    const k = Math.min(1, Math.max(0, f.t) / f.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    // orbit from above the cup down to behind the tee
    const tee = hole.tee;
    const goal = cameraGoal(tee, true, true);
    const endTarget = W(goal.tx, goal.ty, heightAt(hole, tee[0], tee[1]));
    const target = new THREE.Vector3().lerpVectors(f.from, endTarget, e);
    const yaw = goal.yaw + (1 - e) * 2.2 + Math.min(0, f.t) * 0.12;
    const dist = goal.dist + (1 - e) * f.size * 0.7;
    const pitch = 0.82 + (1 - e) * 0.55;
    camera.position.copy(target).add(new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(dist));
    camera.lookAt(target);
    if (k >= 1) { camState.fly = null; camState.target.copy(endTarget); camState.yaw = goal.yaw; camState.dist = goal.dist; f.onDone && f.onDone(); }
  }
  function skipFlyover() { if (camState.fly) { camState.fly.t = camState.fly.dur; flyStep(0); } }
  function endFlyHold() { if (camState.fly && camState.fly.t < 0) camState.fly.t = 0; }

  // ace cinematic: a low, dramatic angle on the cup while the replay plays
  // follow(): the replay ball's world position (or null = orbit the cup)
  function cinematic(dur, onDone, follow = null) { camState.cine = { t: 0, dur, onDone, follow, a0: camState.yaw, look: null }; }
  function cineStep(dt) {
    const c = camState.cine; c.t += dt;
    const cup = W(hole.cup[0], hole.cup[1], heightAt(hole, hole.cup[0], hole.cup[1]));
    const tgt = (c.follow && c.follow()) || cup;
    // broadcast shot: from behind the ball's line into the cup, a little above, drifting slowly around
    if (c.yaw == null) { const dx = cup.x - tgt.x, dz = cup.z - tgt.z; c.yaw = Math.hypot(dx, dz) > 0.5 ? Math.atan2(dx, -dz) : c.a0; }
    const mid = new THREE.Vector3().lerpVectors(tgt, cup, 0.4);
    const a = c.yaw + 0.35 + c.t * 0.12;
    const dist = Math.max(9, Math.min(16, tgt.distanceTo(cup) * 0.9 + 8));
    const goal = new THREE.Vector3(mid.x - Math.sin(a) * dist, mid.y + 3.2 + dist * 0.32, mid.z + Math.cos(a) * dist);
    if (!c.look) { c.look = mid.clone(); camera.position.copy(goal); }
    const k = 1 - Math.pow(0.02, dt);
    camera.position.lerp(goal, k); c.look.lerp(mid, k);
    camera.lookAt(c.look);
    if (c.t >= c.dur) { camState.cine = null; camState.snapTo = true; c.onDone && c.onDone(); }
  }
  function endCinematic() { if (camState.cine) { camState.cine.t = camState.cine.dur; cineStep(0); } }

  // ------------------------------------------------------------ effects
  function burst(x, y, h, color, n = 24, speed = 6) {
    const count = Math.min(n, T.particles - fx.particles.length);
    for (let i = 0; i < count; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.scale.setScalar(0.5 + Math.random() * 0.6);
      s.position.set(x, h + 0.3, -y);
      const a = Math.random() * Math.PI * 2, up2 = Math.random();
      fx.particles.push({ s, v: new THREE.Vector3(Math.cos(a) * speed * (0.4 + Math.random()), speed * (0.4 + up2), Math.sin(a) * speed * (0.4 + Math.random())), life: 1, dur: 0.5 + Math.random() * 0.5 });
      scene.add(s);
    }
  }
  function ringPulse(x, y, h, color, size = 3) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.75, 40), new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, h + 0.05, -y);
    scene.add(m);
    fx.rings.push({ m, life: 1, size });
  }
  function flashBumper(i) { const b = course && course.bumpers[i]; if (b) b.flash = 1; }
  function shake(seconds) { fx.shakeUntil = performance.now() + seconds * 1000; }

  // ------------------------------------------------------------ per-frame
  let last = 0;
  const clock = { t: 0 };
  /**
   * f: { now (perf ms), t (server s: movers), me: { x, y, h, roll, visible, moving }, ghosts: [{ uid, x, y, h, moving }], resting }
   */
  function frame(f) {
    const raw = last ? (f.now - last) / 1000 : 1 / 60;
    const dt = Math.min(0.1, raw);
    last = f.now;
    monitor(dt);
    if (!hole || !course) { renderer.render(scene, camera); return; }
    clock.t += dt;
    const t = f.t;
    env.update(clock.t);
    // movers follow server time
    for (const mv of course.movers) {
      const segs = moverSegments(mv.m, t);
      segs.forEach((s, k) => {
        const a = mv.arms[k]; if (!a) return;
        const mx = (s.a[0] + s.b[0]) / 2, my = (s.a[1] + s.b[1]) / 2;
        const ang = Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]);
        a.arm.position.set(mx, mv.base + (mv.m.type === 'laser' ? 0.35 : 0.3), -my); a.arm.rotation.y = ang;
        if (a.glowLine) { a.glowLine.position.copy(a.arm.position); a.glowLine.rotation.y = ang; }
      });
    }
    for (const tl of course.tiles) {
      const on = tileOn(tl.m, t);
      const ph = ((((t + (tl.m.phase || 0)) / tl.m.period) % 1) + 1) % 1;
      const warn = on && ph > (tl.m.on ?? 0.6) - 0.12; // flickers just before vanishing
      const vis = on ? (warn ? (Math.floor(clock.t * 16) % 2 ? 0.35 : 0.9) : 1) : 0.06;
      tl.mat.opacity = vis; tl.edge.material.opacity = on ? 1 : 0.25;
    }
    for (const pl of course.platforms) { const p = platformAt(pl.m, t); pl.g.position.set(p.off[0], 0, -p.off[1]); }
    for (const tex of course.boosts) tex.offset.y -= dt * 1.4;
    for (const m of course.pulse) m.emissiveIntensity = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(clock.t * 3.2));
    for (const pt of course.portals) pt.disc.rotation.z += dt * 2.2;
    for (const pu of course.pickups) { pu.g.position.y = pu.base + Math.sin(clock.t * 2 + pu.i) * 0.18; pu.g.rotation.y += dt; }
    for (const bu of course.bumpers) { bu.flash = Math.max(0, bu.flash - dt * 3); bu.halo.material.opacity = 0.3 + bu.flash * 0.7; bu.halo.scale.setScalar(bu.data.r * (3.4 + bu.flash * 1.6)); }
    if (course.flag) course.flag.rotation.y = Math.sin(clock.t * 1.7) * 0.25;
    course.cup.halo.material.opacity = course.cupMagnet ? 0.6 + Math.sin(clock.t * 10) * 0.3 : 0.38 + Math.sin(clock.t * 2.4) * 0.08;
    if (course.cupMagnet && Math.floor(clock.t * 3) !== course.lastPulse) { course.lastPulse = Math.floor(clock.t * 3); ringPulse(hole.cup[0], hole.cup[1], heightAt(hole, hole.cup[0], hole.cup[1]), '#ff4fa3', 2.4); }
    // balls
    let ballPos = [hole.tee[0], hole.tee[1]];
    if (me && f.me) { placeBall(me, f.me.x, f.me.y, f.me.z, t, f.me.visible !== false); ballPos = [f.me.x, f.me.y]; }
    const seen = new Set();
    for (const g of f.ghosts || []) {
      const gh = ghosts.get(g.uid); if (!gh) continue;
      seen.add(g.uid);
      const p = placeBall(gh.ball, g.x, g.y, g.z, t, g.visible !== false);
      gh.screen = g.visible === false ? null : toScreen(p.x, p.y + 0.9, p.z);
    }
    for (const [uid, gh] of ghosts) if (!seen.has(uid)) { gh.ball.group.visible = false; gh.screen = null; }
    // fx
    for (let i = fx.particles.length - 1; i >= 0; i--) {
      const p = fx.particles[i]; p.life -= dt / p.dur;
      if (p.life <= 0) { scene.remove(p.s); p.s.material.dispose(); fx.particles.splice(i, 1); continue; }
      p.v.y -= 9 * dt; p.s.position.addScaledVector(p.v, dt); p.s.material.opacity = p.life;
    }
    for (let i = fx.rings.length - 1; i >= 0; i--) {
      const r = fx.rings[i]; r.life -= dt * 1.8;
      if (r.life <= 0) { scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); fx.rings.splice(i, 1); continue; }
      r.m.scale.setScalar(1 + (1 - r.life) * r.size); r.m.material.opacity = r.life;
    }
    rawDt = raw;
    updateCamera(dt, ballPos, f.resting, t);
    const r0 = performance.now();
    renderer.render(scene, camera);
    renderMs = performance.now() - r0;
  }
  let renderMs = 0;

  // ------------------------------------------------------------ picking / projection
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  /** World plane point under a screen point, at height h (for aiming). */
  function planeAt(clientX, clientY, h = 0) {
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    plane.constant = -h;
    const out = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(plane, out)) return null;
    return [out.x, -out.z];
  }
  function toScreen(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(camera);
    if (v.z > 1) return null;
    const r = canvas.getBoundingClientRect();
    return [(v.x * 0.5 + 0.5) * r.width, (-v.y * 0.5 + 0.5) * r.height];
  }
  const screenOfPlane = (x, y, h) => toScreen(x, h, -y);

  function dispose() {
    clearHole();
    disposeBall(me); me = null;
    for (const uid of [...ghosts.keys()]) removeGhost(uid);
    for (const p of fx.particles) { scene.remove(p.s); p.s.material.dispose(); }
    glow.dispose(); envMap && envMap.dispose();
    renderer.dispose();
  }

  resize();
  return {
    renderer, scene, camera, setHole, setMyBall, setAura, hidePickup, setGhost, removeGhost, resetTrail: uid => resetTrail(uid ? ghosts.get(uid) && ghosts.get(uid).ball : me), frame, resize, setTier,
    flyover, skipFlyover, endFlyHold, cinematic, endCinematic, burst, ringPulse, flashBumper, shake, planeAt, screenOfPlane,
    ghostScreens: () => [...ghosts.entries()].map(([uid, g]) => ({ uid, name: g.name, screen: g.screen })),
    pan(dx, dy) { camState.panX += dx; camState.panY += dy; },
    zoom(k) { camState.zoom = Math.max(0.55, Math.min(1.9, camState.zoom * k)); },
    resetView() { camState.panX = 0; camState.panY = 0; camState.zoom = 1; },
    get yaw() { return camState.yaw; },
    get tier() { return tier; }, get tierName() { return T.name; },
    set autoTier(v) { autoTier = v; }, set onTier(fn) { onTier = fn; },
    get renderMs() { return renderMs; },
    memory: () => ({ ...renderer.info.memory, programs: renderer.info.programs ? renderer.info.programs.length : 0 }),
    dispose,
  };
}

/** Power-up icon texture (drawn by ball.js, shared with the HUD). */
export function powerIconTexture(kind) {
  const t = new THREE.CanvasTexture(powerIconCanvas(kind));
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
