// CITY 2.0 — THE HARBOR, PART 8a + FP2: THE IMPLIED ROAD's cars. While the dock SHOWS they are never seen (no moving car behind JOIN /
// HOST: the owner's rule), only their LIGHT: at night a car's headlights sweep across the near cobbles, gliding left or right with it;
// by day a soft passing shadow along the front walk. FP2 — while the dock RESTS (hidden, the street under it full-bleed: street.js)
// the same pass is SEEN: a 1920s motorcar rolls across the street (motorcar.js — its own headlamps' pool + its shadow then, the old
// sweep fading out), fading in with the dock's fade-out and gone in 0.25 s when the dock comes back (core/harbor-promenade.js#carVis).
// Its sound (the car-1920s-pass slot) is the PASS'S OWN take (core/city-sounds.js#takeAt: the same on every phone) placed ON THE
// CLOCK (FP3 — the owner's iPhone heard it 5–6 s after the car: it used to start whenever its file had loaded): the take's peak
// lands on the car's centre wherever the wait for the file ended (city-sound.js's sync: joined part-way with a fade if late, silent
// once the car has passed), the next pass's take fetched ~12 s ahead, the car's speed from the take's swell (carSpeed: it crosses
// the visible street within the audible rise and fall), the pan following its x (±0.6, gentle). While the dock covers the street
// the sound alone plays — a car passing behind. The schedule is on the clock (core/harbor-promenade.js#roadPassAt: every phone the
// same, joins mid-way); where the car is: #carAt.
// Behind the owner's flag: &force=no-implied-road switches the road off (the setts then run to the screen's foot); &force=road-pass a
// car every ~13 s. THE RAID's hook (7b): wash({ col, k }) — a red / blue wash rolling up from the front.
import { project, groundY } from '../../core/harbor-layout.js';
import { roadPassAt, ROAD_PASS, carAt, carVis, carSpeed } from '../../core/harbor-promenade.js';
import { takeAt, crossFor, carPre, panOf } from '../../core/city-sounds.js';
import { cityPrefetch } from '../../audio/city-sound.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { createMotorcar } from './motorcar.js';
import { vehicleFor, UNDERGLOW } from './vehicles.js';
import { roadLampAt } from '../../core/harbor-light.js';

const sprite = (rgbStr, soft = 0.5) => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = safeCtx(c);
  if (x) { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, `rgba(${rgbStr},1)`); g.addColorStop(soft, `rgba(${rgbStr},0.45)`); g.addColorStop(1, `rgba(${rgbStr},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
  return c;
};

export function createRoadLight() {
  let L = null, cam = null, beam = null, shade = null, washSp = null;
  let cur = null, center = 0, cross = null, ti = -1, washCol = null, washK = 0, vis = 0, seen = false;
  // FP3: the sound playing (its own pass's centre / direction / speed, so it pans on after the next pass begins); the city's clock
  // vs performance.now() (the sync reads the clock when the file is ready, between frames); the passes whose take was fetched
  let snd = null, skew = 0, panAt = 0, nextAt = 0;
  const playing = new Set(), fetched = new Set(), motor = createMotorcar();
  const SLOT = 'car-1920s-pass';
  // where a pass's car is along the road (world x) at ms, at depth z — its own speed (its take's swell)
  const xAt = (p, ms, z) => p.dir * ((ms - p.center) / 1000) * carSpeed(cam, z, p.cross);
  // the street lamps' light on the car as it passes (x → 0..1): the front walk's globes + the speakeasy's corner
  const lampAt = x => roadLampAt(L.lamps, x);          // (core/harbor-light.js — FP3a, the one light model)
  return {
    layout(l) { L = l; cam = l.cam; },
    /** the raid (7b): a coloured wash from the front ({ col: [r,g,b], k: 0..1 }; null clears) */
    wash(o) { washCol = o && o.col ? o.col : null; washK = o ? Math.max(0, Math.min(1, +o.k || 0)) : 0; },
    /** a car is on screen (seen): the scene keeps 60 fps for its wheels */
    busy: () => seen,
    /**
     * f: { ms (the city's clock), hourAt (local hour at a ms — the busy-ness), night (the lamps' darkness 0..1), day (0..1), motion,
     * fade, on (the implied road is on), force (a pass every ~13 s), play(slot, o) → handle | null; FP2: gone (the dock rests),
     * dt (ms), T (the bake's tones: the sun's side + height), dpr, t (s), wet (0..1) }
     */
    /** FP3a (FREV H3 — no sound inside a painter): the pass on the clock, its sound placed + panned, the next take fetched ahead —
     *  every frame the scene runs, whether or not the light is drawn (the same f as draw) */
    tick(f) {
      // (reduced motion: no car rolls — the implied light stays, as with the dock shown)
      vis = carVis(vis, !!f.gone && !!f.on && !!f.motion, f.dt || 16.7);
      if (!L || !f.on) return;
      skew = f.ms - performance.now();
      const st0 = L.impliedRoad && L.impliedRoad.street, zc = L.edge ? L.edge.z - 4 : 31.5;
      const laneZ = p => (st0 ? (p.dir < 0 ? st0.lanes[0] : st0.lanes[1]).z : zc);
      const pass = roadPassAt(f.ms, f.hourAt, { force: f.force });
      if (pass && (!cur || cur.id !== pass.id)) {
        // the car is nearest at the pass's CENTRE (the same on every phone); its take = the pass's own (takeAt): its swell sets the speed
        cur = pass; center = pass.t0 + ROAD_PASS.peak;
        const tk = takeAt(SLOT, pass.take);
        cross = crossFor(tk && tk.take); ti = tk ? tk.i : -1;
        // its sound, placed on the clock: the take's peak on the centre (city-sound.js#citySound's sync — whenever its file is ready);
        // a pass whose centre is under 1.5 s away (the page opened mid-pass) stays silent
        if (f.play && tk && !playing.has(pass.id) && center - f.ms > 1500) {
          const me = { center, cross, dir: pass.dir, lane: pass.lane };
          const h = f.play(SLOT, { take: tk.i, gain: pass.lane ? 0.8 : 1, pan: panOf(xAt(me, f.ms, laneZ(me)), cam.hw(laneZ(me))),
            sync: { peakIn: () => (me.center - (performance.now() + skew)) / 1000, pre: carPre(cross), fade: 0.8, late: 1 } });
          playing.add(pass.id); if (playing.size > 8) playing.delete(playing.values().next().value);
          if (h) snd = { h, ...me };
        }
      }
      if (!pass) cur = null;
      // the sound follows its car: a gentle pan from its x (~8× a second); dropped once it has played out
      if (snd && f.ms - panAt > 120) {
        panAt = f.ms;
        if (snd.h.ended()) snd = null;
        else { const z = laneZ(snd); snd.h.set({ pan: panOf(xAt(snd, f.ms, z), cam.hw(z)) }, 0.15); }
      }
      // the next pass's take fetched + decoded ahead (~12 s): its sound then starts on time, never waiting on the network
      if (f.play && f.ms - nextAt > 1000) {
        nextAt = f.ms;
        const nx = roadPassAt(f.ms + 12e3, f.hourAt, { force: f.force });
        if (nx && !fetched.has(nx.id)) { const tk = takeAt(SLOT, nx.take); if (tk && cityPrefetch(SLOT, tk.i)) { fetched.add(nx.id); if (fetched.size > 8) fetched.delete(fetched.values().next().value); } }
      }
    },
    draw(c, f) {
      seen = false;
      if (!L || !f.on || f.fade <= 0) { motor.reset(); return; }
      const zc = L.edge ? L.edge.z - 4 : 31.5;
      // the wash (the raid's lights) first, under the car's own light
      if (washCol && washK > 0.01) {
        if (!washSp || washSp.key !== washCol.join()) { washSp = sprite(washCol.join(), 0.4); washSp.key = washCol.join(); }
        const W = cam.W, r = W * 0.9;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * washK * f.fade; c.drawImage(washSp, W / 2 - r, cam.H - r * 0.55, r * 2, r * 1.1); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      if (!cur) { motor.reset(); return; }
      // FP2: THE CAR ITSELF while the dock rests (its own light + shadow); the implied light below fades out as it fades in
      const st = L.impliedRoad && L.impliedRoad.street;
      if (st && vis > 0.004) {
        const car = carAt(cur, center, f.ms, cam, st, cross);
        if (car.on) {
          // (POL4: the pass's vehicle from the street's cycle — never the same model twice in a row; a party night: one in three glows)
          const n = parseInt(String(cur.id).slice(1), 10) || 0, veh = vehicleFor(n, 'street'), ug = f.party && ((n * 2654435761) >>> 0) % 3 === 0 ? UNDERGLOW[((n >>> 0) % UNDERGLOW.length)] : null;
          motor.draw(c, car, { cam, T: f.T, k: vis * f.fade, night: f.night, lampAt, vehicle: veh, underglow: ug, dpr: f.dpr || 2, t: f.t || 0, motion: f.motion, wet: f.wet || 0, rails: st.rails });
          seen = true;
        } else motor.reset();
      } else motor.reset();
      const iv = 1 - vis;
      if (iv <= 0.01) return;
      // the car's x (world) along the road just below the frame: nearest (x 0) at `center`, at its take's speed (the same timing as
      // the car itself + its sound: carSpeed)
      const span = cam.hw(zc) + 14;
      const carX = xAt({ center, cross, dir: cur.dir }, f.ms, zc);
      if (Math.abs(carX) > span) return;
      const env = Math.max(0, 1 - Math.abs(carX) / span) ** 0.6;
      const P = (x, z) => project(cam, x, 0, z);
      // AT NIGHT: the headlights' light ahead of the car on the near cobbles (a long soft pool + a brighter core near the curb), the
      // curb's top catching it; warm 1920s incandescent
      if (f.night > 0.05) {
        if (!beam) beam = sprite('255,226,170', 0.35);
        const k = f.night * env * f.fade * iv;
        c.globalCompositeOperation = 'lighter';
        for (const [dz, rx, rz, a] of [[4.2, 10, 5, 0.34], [2.2, 6, 2.6, 0.55], [0.9, 3.4, 1.1, 0.7]]) {
          const z = (L.edge ? L.edge.z : 35.6) + dz, [cx] = P(carX + cur.dir * 5, z), ya = groundY(cam, z + rz), yb = groundY(cam, z - rz), rw = cam.F * rx / z;
          c.globalAlpha = a * k; c.drawImage(beam, cx - rw, ya, rw * 2, yb - ya);
        }
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
      // BY DAY: a soft shadow sliding along the front walk (the car in the sun just below the frame)
      if (f.day > 0.2) {
        if (!shade) shade = sprite('20,16,34', 0.55);
        const z = (L.edge ? L.edge.z : 35.6) + 0.9, [cx] = P(carX, z), rx = 3.4, ya = groundY(cam, z + 0.9), yb = groundY(cam, z - 0.9), rw = cam.F * rx / z;
        c.globalAlpha = 0.22 * f.day * env * f.fade * iv; c.drawImage(shade, cx - rw, ya, rw * 2, yb - ya); c.globalAlpha = 1;
      }
    },
    debug: () => ({ pass: cur ? { id: cur.id, dir: cur.dir, center, take: ti, cross } : null, played: playing.size,
      sound: snd ? { take: snd.h.take, started: snd.h.started() > 0, late: snd.h.late(), center: snd.center } : null, wash: washK, vis: +vis.toFixed(3), car: seen ? motor.debug() : null }),
    destroy() { motor.destroy(); for (const s of [beam, shade, washSp]) if (s) s.width = s.height = 0; beam = shade = washSp = null; },
  };
}
