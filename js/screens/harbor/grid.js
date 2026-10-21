// CITY 2.0 — THE HARBOR: the dev overlay (&grid=1). The reserved zones (the sign + tagline, the skyline's limit, the sun's
// arch band, the dock, the safe areas), the lane bands, the planned sun gaps, and size-check boxes on the stage: a 20 pt
// person and a 110 pt bus at their reference depths. Never shown without the flag.
import { project, groundY, units, Z } from '../../core/harbor-layout.js';

export function drawGrid(c, L, S, roof, sunNow) {
  const cam = L.cam, W = cam.W, H = cam.H;
  c.save();
  c.font = '600 9px "Chakra Petch", system-ui, sans-serif';
  c.textBaseline = 'top';
  const zone = (r, col, label) => { if (!r) return; c.fillStyle = col.replace('1)', '0.14)'); c.fillRect(r.x, r.y, r.w, r.h); c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); c.fillStyle = col; c.fillText(label, r.x + 3, r.y + 2); };
  // the safe areas
  zone({ x: 0, y: 0, w: W, h: cam.safeTop }, 'rgba(255,255,255,1)', 'SAFE TOP');
  zone({ x: 0, y: H - cam.safeBottom, w: W, h: cam.safeBottom }, 'rgba(255,255,255,1)', 'SAFE BOTTOM');
  // the sign + tagline, and the skyline's limit under it
  const tr = S.textRects || {};
  for (const k of ['neon', 'word', 'tag']) if (tr[k]) zone(tr[k], 'rgba(255,90,200,1)', k.toUpperCase());
  c.strokeStyle = 'rgba(255,90,200,1)'; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(0, cam.limitY); c.lineTo(W, cam.limitY); c.stroke(); c.setLineDash([]);
  c.fillStyle = 'rgba(255,90,200,1)'; c.fillText(`SKYLINE LIMIT (squeeze ${L.squeeze.toFixed(2)})`, 4, cam.limitY + 2);
  // the dock
  zone(cam.dock, 'rgba(90,220,255,1)', 'DOCK — nothing alive below its top');
  // the sun's arch band: the open sky between the sign and the roofline (sun.js fits its arch to this roofline), the sun now
  const nb = tr.neon ? tr.neon.y + tr.neon.h : cam.limitY - 80;
  if (roof && roof.length) {
    c.fillStyle = 'rgba(255,210,90,0.10)'; c.beginPath(); c.moveTo(0, nb);
    for (let i = 0; i < roof.length; i++) c.lineTo(i * 4, Math.max(nb, roof[i]));
    c.lineTo(W, nb); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,210,90,0.9)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < roof.length; i++) (i ? c.lineTo(i * 4, roof[i]) : c.moveTo(0, roof[i])); c.stroke();
    c.fillStyle = 'rgba(255,210,90,1)'; c.fillText("SUN'S ARCH BAND (open sky) · ROOFLINE", 4, nb + 2);
  }
  if (sunNow && sunNow.vis > 0) { c.strokeStyle = 'rgba(255,210,90,1)'; c.beginPath(); c.arc(sunNow.x, sunNow.y, sunNow.r + 4, 0, Math.PI * 2); c.stroke(); }
  c.fillStyle = 'rgba(255,210,90,0.22)';
  for (const g of L.gaps) c.fillRect(g.sx - g.w / 2, cam.limitY, g.w, groundY(cam, Z.quay) - cam.limitY);
  // the lanes: sky, skyline, water, road, promenade (+ windows and rooftop on the speakeasy)
  const bands = [['sky', cam.safeTop, cam.limitY], ['skyline', cam.limitY, groundY(cam, Z.quay)], ['water', groundY(cam, Z.quay), groundY(cam, Z.rail)], ['road', groundY(cam, Z.rail), groundY(cam, Z.road[0])], ['promenade', groundY(cam, Z.road[0]), cam.dock.y]];
  bands.forEach(([n, y0, y1], i) => { c.fillStyle = `hsla(${i * 64},90%,60%,0.9)`; c.fillRect(W - 6, y0, 6, y1 - y0); c.save(); c.translate(W - 8, y0 + 4); c.rotate(Math.PI / 2); c.fillText(n.toUpperCase(), 0, 0); c.restore(); });
  const s = L.speakeasy, [wx0, wy0] = project(cam, s.x0, s.h, s.z0), [wx1, wy1] = project(cam, s.x1, 3.9, s.z0);
  c.strokeStyle = 'hsla(300,90%,70%,0.9)'; c.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0); c.fillStyle = 'hsla(300,90%,70%,1)'; c.fillText('WINDOWS', Math.max(2, wx0 + 30), wy0 + 4);
  const [rx0, ry] = project(cam, s.x0, s.h + 4.6, s.z0 + 2); c.fillText('ROOFTOP', Math.max(2, rx0 + 30), ry);
  // size checks on the stage: a 20 pt person at z 47, a 110 pt bus at z 60 (outlines at the exact reference sizes)
  const chk = (u, hU, z, x, label) => { const [a, y0] = project(cam, x, hU, z), [b, y1] = project(cam, x + u, 0, z); c.strokeStyle = 'rgba(120,255,140,1)'; c.lineWidth = 1; c.strokeRect(a, y0, b - a, y1 - y0); c.fillStyle = 'rgba(120,255,140,1)'; c.fillText(`${label} ${Math.round(y1 - y0)}×${Math.round(b - a)} pt`, a, y1 + 2); };
  const p = units('person'), bus = units('bus');
  chk(p * 0.3, p, Z.ref, L.speakeasy.x1 + 6.5, 'PERSON');
  chk(bus, bus * 0.28, 60, L.speakeasy.x1 + 2.2, 'BUS');
  // the door's tap target
  zone(L.door.rect, 'rgba(255,170,60,1)', 'DOOR');
  c.restore();
}
