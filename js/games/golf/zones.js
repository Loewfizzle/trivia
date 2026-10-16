// NEON PAR — the three worlds around the course: sky, fog, lighting mood and decor.
// Everything here is built once per hole (zones only change between holes) and disposed with it.
// Decor is low-poly and instanced; glow is emissive materials + additive sprites (no post-processing).
import * as THREE from 'three';

export const PALETTE = {
  rooftops: {
    sky: ['#04060f', '#0b1430', '#2a1840'], fog: '#0c1022', fogDensity: 0.012,
    hemi: ['#6c8cff', '#120a1e', 0.55], key: ['#ffd9b0', 0.9], rim: ['#ff4fa3', 0.6],
    turf: '#17605c', wet: '#174f55', side: '#0b0f1a', wall: '#1a2030', edge: '#2ff5d2', accent: '#ff4fa3',
  },
  cyber: {
    sky: ['#010712', '#02182a', '#04324a'], fog: '#021422', fogDensity: 0.014,
    hemi: ['#3fd7ff', '#020812', 0.5], key: ['#9ff4ff', 0.55], rim: ['#ff4fd8', 0.5],
    turf: '#0c3442', grid: '#062230', side: '#020a12', wall: '#062436', edge: '#3ff3ff', accent: '#ff4fd8',
  },
  arcade: {
    sky: ['#0a0210', '#1d0626', '#3a0b2c'], fog: '#14051a', fogDensity: 0.01,
    hemi: ['#ffb36b', '#1a0618', 0.55], key: ['#ffe2c0', 0.85], rim: ['#ff2bd6', 0.75],
    turf: '#2a1838', chrome: '#4a4258', side: '#0c0812', wall: '#2c2636', edge: '#ffb627', accent: '#ff2bd6',
  },
};

const canvasTex = (w, h, draw, opts = {}) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
};

/** Shared glow sprite texture (radial falloff). */
export function glowTexture() {
  return canvasTex(64, 64, (x, w) => {
    const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, w);
  });
}

/** Seeded RNG so a hole's skyline is the same every time. */
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/**
 * Builds the zone environment around a course whose plane bounds are b = {x0, y0, x1, y1}.
 * Returns { group, update(time, energy), track: [disposables] }.
 */
export function buildZone(zone, b, tier, glow, envMap = null) {
  const P = PALETTE[zone];
  const group = new THREE.Group();
  const track = [];
  const own = o => { track.push(o); return o; };
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const span = Math.max(b.x1 - b.x0, b.y1 - b.y0);
  const rnd = rng(zone.length * 977 + Math.round(span * 13));
  const anims = [];

  // sky: a big inverted sphere with a vertical gradient
  const skyTex = own(canvasTex(4, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, P.sky[0]); g.addColorStop(0.55, P.sky[1]); g.addColorStop(1, P.sky[2]);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }));
  const sky = new THREE.Mesh(own(new THREE.SphereGeometry(400, 24, 12)), own(new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })));
  sky.renderOrder = -10;
  group.add(sky);

  // lights
  group.add(new THREE.HemisphereLight(P.hemi[0], P.hemi[1], P.hemi[2]));
  const key = new THREE.DirectionalLight(P.key[0], P.key[1]);
  key.position.set(cx - 20, 40, -cy + 25);
  group.add(key);
  const rim = new THREE.DirectionalLight(P.rim[0], P.rim[1]);
  rim.position.set(cx + 30, 18, -cy - 40);
  group.add(rim);

  const glowMat = color => own(new THREE.SpriteMaterial({ map: glow, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const sprite = (color, size, x, y, z, opacity = 1) => {
    const s = new THREE.Sprite(glowMat(color));
    s.scale.set(size, size, 1); s.position.set(x, y, z); s.material.opacity = opacity;
    group.add(s);
    return s;
  };

  if (zone === 'rooftops') {
    // the roof slab the course sits on (a margin around the course, slightly below it)
    // wet concrete: tar seams, puddles that catch the neon (a canvas texture + a sheen from the env map)
    const W = b.x1 - b.x0 + 14, D = b.y1 - b.y0 + 14;
    const roofTex = own(canvasTex(256, 256, (x, w, h) => {
      x.fillStyle = '#2a3042'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 2400; i++) { const v = 30 + rnd() * 40 | 0; x.fillStyle = `rgba(${v},${v + 6},${v + 22},0.35)`; x.fillRect(rnd() * w, rnd() * h, 2, 2); }
      x.strokeStyle = 'rgba(8,10,18,0.55)'; x.lineWidth = 2;
      for (let k = 0; k <= 4; k++) { x.beginPath(); x.moveTo(0, k * 64); x.lineTo(w, k * 64); x.moveTo(k * 64, 0); x.lineTo(k * 64, h); x.stroke(); }
      for (let i = 0; i < 9; i++) {
        const px = rnd() * w, py = rnd() * h, r = 14 + rnd() * 30;
        const g = x.createRadialGradient(px, py, 0, px, py, r);
        const tint = i % 3 === 0 ? '255,79,163' : i % 3 === 1 ? '47,245,210' : '120,140,255';
        g.addColorStop(0, `rgba(${tint},0.22)`); g.addColorStop(0.6, 'rgba(10,14,28,0.5)'); g.addColorStop(1, 'rgba(10,14,28,0)');
        x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r * 1.4, r, rnd() * 3, 0, Math.PI * 2); x.fill();
      }
    }, { repeat: true }));
    roofTex.repeat.set(W / 16, D / 16);
    const slab = new THREE.Mesh(own(new THREE.BoxGeometry(W, 2, D)),
      own(new THREE.MeshStandardMaterial({ color: '#8a93ad', map: roofTex, roughness: 0.32, metalness: 0.35, envMap, envMapIntensity: 0.55 })));
    slab.position.set(cx, -1.4, -cy);
    group.add(slab);
    // parapet wall around the roof
    const parMat = own(new THREE.MeshStandardMaterial({ color: '#232838', roughness: 0.7 }));
    for (const [x, z, w, d] of [[cx, -(b.y0 - 7), W, 0.6], [cx, -(b.y1 + 7), W, 0.6], [b.x0 - 7, -cy, 0.6, D], [b.x1 + 7, -cy, 0.6, D]]) {
      const m = new THREE.Mesh(own(new THREE.BoxGeometry(w, 1.1, d)), parMat); m.position.set(x, -0.05, z); group.add(m);
    }
    // rooftop props: AC units with status lights, vents, a water tank
    const propMat = own(new THREE.MeshStandardMaterial({ color: '#3a4256', roughness: 0.5, metalness: 0.5, envMap, envMapIntensity: 0.4 }));
    const ledMats = ['#2ff5d2', '#ff4fa3', '#ffb46b'].map(c => own(new THREE.MeshBasicMaterial({ color: c, toneMapped: false })));
    const boxG = own(new THREE.BoxGeometry(1, 1, 1)), ledG = own(new THREE.BoxGeometry(0.18, 0.18, 0.05)), cylG = own(new THREE.CylinderGeometry(1, 1, 1, 12));
    const spots = [];
    for (let k = 0; k < 9; k++) {
      const side = k % 4;
      const along = rnd();
      const x = side === 0 ? b.x0 - 3.6 : side === 1 ? b.x1 + 3.6 : b.x0 - 6 + along * (W - 2);
      const y = side === 2 ? b.y0 - 3.8 : side === 3 ? b.y1 + 3.8 : b.y0 - 5 + along * (D - 4);
      if (spots.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 4)) continue;
      spots.push([x, y]);
      if (k % 5 === 4) {
        const t = new THREE.Mesh(cylG, propMat); t.scale.set(1.4, 3, 1.4); t.position.set(x, 1.1, -y); group.add(t);
      } else {
        const w = 1.8 + rnd() * 1.6, hh = 0.8 + rnd() * 0.9, d = 1.4 + rnd() * 1.2;
        const m = new THREE.Mesh(boxG, propMat); m.scale.set(w, hh, d); m.position.set(x, -0.4 + hh / 2, -y); group.add(m);
        const led = new THREE.Mesh(ledG, ledMats[k % 3]); led.position.set(x + w * 0.3, -0.4 + hh * 0.75, -y + d / 2 + 0.03); group.add(led);
      }
    }
    // a neon sign on the next roof over
    const signTex = own(canvasTex(512, 160, (x, w, h) => {
      x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, w, h);
      x.font = '900 92px Orbitron, Arial Black, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.shadowColor = '#ff4fa3'; x.shadowBlur = 26; x.fillStyle = '#ff7fbf'; x.fillText('NEON PAR', w / 2, h / 2 + 4);
      x.shadowBlur = 0; x.fillStyle = '#ffe3f1'; x.fillText('NEON PAR', w / 2, h / 2 + 4);
    }));
    const sign = new THREE.Mesh(own(new THREE.PlaneGeometry(22, 6.9)), own(new THREE.MeshBasicMaterial({ map: signTex, transparent: true, depthWrite: false, toneMapped: false, fog: false })));
    sign.position.set(cx + 4, 13, -(b.y1 + 34)); group.add(sign);
    const signFrame = new THREE.Mesh(boxG, own(new THREE.MeshStandardMaterial({ color: '#1a1e2c', roughness: 0.6 })));
    signFrame.scale.set(23, 0.5, 0.5); signFrame.position.set(cx + 4, 9.4, -(b.y1 + 34.2)); group.add(signFrame);
    anims.push(t => { sign.material.opacity = Math.sin(t * 13) > 0.97 ? 0.45 : 1; });
    // rain: thin streaks falling through the light (skipped on the lowest tier)
    if (tier > 0) {
      const n = tier === 1 ? 260 : 520;
      const geo = own(new THREE.BufferGeometry());
      const arr = new Float32Array(n * 6), base = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { base[i * 3] = cx + (rnd() - 0.5) * (W + 30); base[i * 3 + 1] = rnd() * 30; base[i * 3 + 2] = -cy + (rnd() - 0.5) * (D + 30); }
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const rain = new THREE.LineSegments(geo, own(new THREE.LineBasicMaterial({ color: '#9fb8ff', transparent: true, opacity: 0.28, depthWrite: false })));
      rain.frustumCulled = false;
      group.add(rain);
      anims.push(t => {
        for (let i = 0; i < n; i++) {
          const y = 28 - ((base[i * 3 + 1] + t * 26) % 30);
          const x = base[i * 3] - y * 0.12;
          const o = i * 6, z = base[i * 3 + 2];
          arr[o] = x; arr[o + 1] = y; arr[o + 2] = z; arr[o + 3] = x + 0.08; arr[o + 4] = y + 0.7; arr[o + 5] = z;
        }
        geo.attributes.position.needsUpdate = true;
      });
    }
    // roof edge trim lights
    const trim = own(new THREE.MeshBasicMaterial({ color: '#ffb46b' }));
    for (const [x, z, w, d] of [[cx, -(b.y0 - 7), b.x1 - b.x0 + 14, 0.15], [cx, -(b.y1 + 7), b.x1 - b.x0 + 14, 0.15], [b.x0 - 7, -cy, 0.15, b.y1 - b.y0 + 14], [b.x1 + 7, -cy, 0.15, b.y1 - b.y0 + 14]]) {
      const m = new THREE.Mesh(own(new THREE.BoxGeometry(w, 0.12, d)), trim);
      m.position.set(x, -0.38, z); group.add(m);
    }
    // the city far below: instanced towers with a lit-window texture
    const winTex = own(canvasTex(64, 128, (x, w, h) => {
      x.fillStyle = '#0a0d18'; x.fillRect(0, 0, w, h);
      for (let yy = 4; yy < h; yy += 7) for (let xx = 3; xx < w; xx += 6) {
        if (rnd() < 0.42) { x.fillStyle = rnd() < 0.6 ? `rgba(255,${190 + rnd() * 50 | 0},${120 + rnd() * 60 | 0},${0.5 + rnd() * 0.5})` : `rgba(130,${200 + rnd() * 40 | 0},255,${0.4 + rnd() * 0.5})`; x.fillRect(xx, yy, 3, 4); }
      }
    }, { repeat: true }));
    const towers = tier === 0 ? 70 : tier === 1 ? 130 : 200;
    const tGeo = own(new THREE.BoxGeometry(1, 1, 1));
    const tMat = own(new THREE.MeshStandardMaterial({ color: '#0d1120', emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 0.9, roughness: 0.8 }));
    const inst = new THREE.InstancedMesh(tGeo, tMat, towers);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
    for (let i = 0; i < towers; i++) {
      const ang = rnd() * Math.PI * 2, r = 30 + rnd() * 150;
      const w = 4 + rnd() * 10, h = 20 + rnd() * 70;
      pos.set(cx + Math.cos(ang) * r, -60 + h / 2 - 20 + rnd() * 10, -cy + Math.sin(ang) * r);
      sc.set(w, h, w * (0.6 + rnd() * 0.8));
      m4.compose(pos, q, sc); inst.setMatrixAt(i, m4);
    }
    group.add(inst);
    // ground glow far below + traffic light-streams
    const streets = new THREE.Mesh(own(new THREE.PlaneGeometry(900, 900)), own(new THREE.MeshBasicMaterial({ color: '#1a1030', fog: true })));
    streets.rotation.x = -Math.PI / 2; streets.position.y = -78; group.add(streets);
    const streams = tier === 0 ? 3 : 6;
    for (let k = 0; k < streams; k++) {
      const n = 26;
      const geo = own(new THREE.BufferGeometry());
      const arr = new Float32Array(n * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const pts = new THREE.Points(geo, own(new THREE.PointsMaterial({ color: k % 2 ? '#ff5a4f' : '#fff0c8', size: 1.6, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })));
      group.add(pts);
      const ang = rnd() * Math.PI, off = (rnd() - 0.5) * 220, speed = 18 + rnd() * 14;
      anims.push(t => {
        const dir = [Math.cos(ang), Math.sin(ang)];
        for (let i = 0; i < n; i++) {
          const d = ((t * speed + i * 14) % 360) - 180;
          arr[i * 3] = cx + dir[0] * d - dir[1] * off; arr[i * 3 + 1] = -77; arr[i * 3 + 2] = -cy + dir[1] * d + dir[0] * off;
        }
        geo.attributes.position.needsUpdate = true;
      });
    }
    // antenna beacons on the near towers
    for (let k = 0; k < 5; k++) {
      const ang = rnd() * Math.PI * 2, r = 22 + rnd() * 30;
      const x = cx + Math.cos(ang) * r, z = -cy + Math.sin(ang) * r;
      const mast = new THREE.Mesh(own(new THREE.CylinderGeometry(0.08, 0.12, 9, 5)), own(new THREE.MeshStandardMaterial({ color: '#2a3040' })));
      mast.position.set(x, 1, z); group.add(mast);
      const s = sprite('#ff3355', 2.2, x, 5.6, z);
      const ph = rnd() * 6;
      anims.push(t => { s.material.opacity = Math.sin(t * 2.4 + ph) > 0.55 ? 1 : 0.15; });
    }
  }

  if (zone === 'cyber') {
    // infinite grid floor below the void
    const gridTex = own(canvasTex(128, 128, (x, w) => {
      x.fillStyle = '#000'; x.fillRect(0, 0, w, w);
      x.strokeStyle = 'rgba(63,243,255,0.9)'; x.lineWidth = 2; x.strokeRect(0, 0, w, w);
      x.strokeStyle = 'rgba(63,243,255,0.25)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, w); x.moveTo(0, w / 2); x.lineTo(w, w / 2); x.stroke();
    }, { repeat: true }));
    gridTex.repeat.set(60, 60);
    const plane = new THREE.Mesh(own(new THREE.PlaneGeometry(600, 600)), own(new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })));
    plane.rotation.x = -Math.PI / 2; plane.position.set(cx, -24, -cy); group.add(plane);
    // floating data particles
    const n = tier === 0 ? 120 : tier === 1 ? 260 : 420;
    const geo = own(new THREE.BufferGeometry());
    const arr = new Float32Array(n * 3), base = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { base[i * 3] = cx + (rnd() - 0.5) * 140; base[i * 3 + 1] = -20 + rnd() * 50; base[i * 3 + 2] = -cy + (rnd() - 0.5) * 140; }
    arr.set(base);
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(geo, own(new THREE.PointsMaterial({ color: '#7ff6ff', size: 0.45, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })));
    group.add(pts);
    anims.push(t => {
      for (let i = 0; i < n; i++) arr[i * 3 + 1] = base[i * 3 + 1] + ((t * (0.6 + (i % 7) * 0.15)) % 40) - 20;
      geo.attributes.position.needsUpdate = true;
    });
    // distant data monoliths
    const mono = own(new THREE.MeshBasicMaterial({ color: '#0a3a50', transparent: true, opacity: 0.5 }));
    const edgeMat = own(new THREE.LineBasicMaterial({ color: '#3ff3ff', transparent: true, opacity: 0.55 }));
    for (let k = 0; k < (tier === 0 ? 6 : 12); k++) {
      const ang = rnd() * Math.PI * 2, r = 50 + rnd() * 80, h = 10 + rnd() * 40;
      const g = own(new THREE.BoxGeometry(3 + rnd() * 6, h, 3 + rnd() * 6));
      const m = new THREE.Mesh(g, mono); m.position.set(cx + Math.cos(ang) * r, -24 + h / 2, -cy + Math.sin(ang) * r); group.add(m);
      const e = new THREE.LineSegments(own(new THREE.EdgesGeometry(g)), edgeMat); e.position.copy(m.position); group.add(e);
    }
  }

  if (zone === 'arcade') {
    // the cabinet: a dark chrome tray around the course with neon rails, a glowing backglass, chasing bulbs
    const tray = new THREE.Mesh(own(new THREE.BoxGeometry(b.x1 - b.x0 + 16, 3, b.y1 - b.y0 + 18)),
      own(new THREE.MeshStandardMaterial({ color: '#120a18', metalness: 0.6, roughness: 0.35 })));
    tray.position.set(cx, -3.2, -cy); group.add(tray);
    const back = new THREE.Mesh(own(new THREE.PlaneGeometry(b.x1 - b.x0 + 40, 34)), own(new THREE.MeshBasicMaterial({
      map: own(canvasTex(256, 128, (x, w, h) => {
        const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2a0838'); g.addColorStop(0.5, '#ff2bd6'); g.addColorStop(1, '#ffb627');
        x.fillStyle = '#0c0410'; x.fillRect(0, 0, w, h);
        x.globalAlpha = 0.6; x.fillStyle = g;
        for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(w / 2, h * 1.25, 30 + i * 14, Math.PI, 0); x.lineWidth = 4; x.strokeStyle = g; x.stroke(); }
        x.globalAlpha = 1;
      })), transparent: true, opacity: 0.8, fog: false })));
    back.position.set(cx, 12, -(b.y1 + 22)); group.add(back);
    const bulbs = [];
    const nb = tier === 0 ? 14 : 28;
    for (let k = 0; k < nb; k++) {
      const side = k % 2 ? 1 : -1, along = (Math.floor(k / 2) / (nb / 2)) * (b.y1 - b.y0 + 16) + b.y0 - 8;
      bulbs.push(sprite(k % 4 < 2 ? '#ffb627' : '#ff2bd6', 1.6, (side > 0 ? b.x1 + 7 : b.x0 - 7), -0.9, -along));
    }
    anims.push(t => { bulbs.forEach((s, i) => { s.material.opacity = ((Math.floor(t * 6) + i) % 6) < 2 ? 1 : 0.25; }); });
    // chrome side rails
    const railMat = own(new THREE.MeshStandardMaterial({ color: '#c9c2d6', metalness: 1, roughness: 0.2 }));
    for (const x of [b.x0 - 8, b.x1 + 8]) { const r = new THREE.Mesh(own(new THREE.CylinderGeometry(0.35, 0.35, b.y1 - b.y0 + 18, 8)), railMat); r.rotation.x = Math.PI / 2; r.position.set(x, -1.2, -cy); group.add(r); }
  }

  const scene = { group, track, palette: P, fog: new THREE.FogExp2(P.fog, P.fogDensity) };
  scene.update = (t, energy = 0.5) => { for (const a of anims) a(t, energy); };
  return scene;
}
