// The district behind the menus (setup + lobby): a still of the lit city, dimmed, drifting very slowly.
// The title's living scene is too costly to keep running while people sit in a lobby, so when the title leaves we
// keep one frame of it; a phone that lands in a lobby straight away (resume, invite) renders the city once, quietly,
// in a hidden canvas. Either way the menus cost one static image — the drift is a compositor transform.
import { createDistrict } from './scene.js';
import { GAMES } from '../../config.js';
import { createBeatClock, advanceBeat } from '../../core/party.js';
import { beatSource } from '../../audio/beat.js';
import { settings } from '../../audio/settings.js';

let snap = null;      // canvas holding the still
let light = null;     // PARTY NIGHTS: the party's light alone (breathes over the still)
let loop = 0;
const bc = createBeatClock();
let el = null;        // the fixed backdrop element
let building = null;

/** Keep the title's current frame (called as the title leaves). */
export function captureBackdrop(canvas, partyLight = null) {
  try {
    if (!canvas || !canvas.width) return;
    const s = Math.min(1, 1100 / Math.max(canvas.width, canvas.height));
    const c = document.createElement('canvas');
    c.width = Math.round(canvas.width * s); c.height = Math.round(canvas.height * s);
    c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
    snap = c;
    light = partyLight || null;
    if (el) paint();
  } catch { /* a still is polish; the menus work without it */ }
}

function render() {
  if (building) return building;
  building = new Promise(resolve => {
    try {
      const cv = document.createElement('canvas');
      cv.setAttribute('aria-hidden', 'true');
      Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100dvh', visibility: 'hidden', pointerEvents: 'none', zIndex: '-5' });
      document.body.append(cv);
      const scene = createDistrict(cv, { games: GAMES, tier: 1 });
      scene.set({ wave: 1, lit: 1, bill: 1, logo: 0, motion: 0, caught: scene.look().w.night + scene.look().w.late > 0.5 });
      // a few frames for the billboards' art to arrive, then keep one
      setTimeout(() => { captureBackdrop(cv, scene.partyLight()); scene.destroy(); cv.remove(); resolve(); }, 900);
    } catch { resolve(); }
  });
  return building;
}

function paint() {
  const cv = el.querySelector('canvas:not(.nd-bd-light)');
  cv.width = snap.width; cv.height = snap.height;
  cv.getContext('2d').drawImage(snap, 0, 0);
  const lc = el.querySelector('.nd-bd-light');
  if (light) { lc.width = light.width; lc.height = light.height; lc.getContext('2d').drawImage(light, 0, 0); lc.hidden = false; breathe(); }
  else { lc.hidden = true; cancelAnimationFrame(loop); loop = 0; }
  el.classList.add('is-on');
}
// the party light breathes to the room's song (every phone in the lobby the same), slowly on its own before it plays
let lastT = 0;
function breathe() {
  cancelAnimationFrame(loop);
  const tick = now => {
    loop = 0;
    if (!el || !light || !el.classList.contains('is-shown')) return;
    const dt = lastT ? Math.min(100, now - lastT) : 16.7; lastT = now;
    advanceBeat(bc, dt, beatSource());
    const b = settings.reducedFx ? 0.5 : bc.breath;
    el.style.setProperty('--bdl', (0.3 + 0.7 * b).toFixed(3));
    loop = requestAnimationFrame(tick);
  };
  loop = requestAnimationFrame(tick);
}

/** The still of the lit city the title left behind (a canvas), or null. THE BOARD's windows show it. */
export const backdropStill = () => snap;

/** Show / hide the backdrop (setup + lobby show it). */
export function showBackdrop(on) {
  if (!on) { if (el) { el.classList.remove('is-shown'); cancelAnimationFrame(loop); loop = 0; } return; }
  if (!el) {
    el = document.createElement('div');
    el.className = 'nd-backdrop';
    el.setAttribute('aria-hidden', 'true');
    el.append(document.createElement('canvas'));
    const lc = document.createElement('canvas'); lc.className = 'nd-bd-light'; lc.hidden = true; el.append(lc);
    document.body.prepend(el);
  }
  el.classList.add('is-shown');
  if (light && !loop) breathe();
  if (snap) { if (!el.classList.contains('is-on')) paint(); }
  else render();
}
