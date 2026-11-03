// CITY SIGHTINGS — THE MOMENT after a tap on a legendary (PROGRESSION B; the owner, Nov 2: TAP TO UNLOCK, the real polaroid, NO HINT EVER).
// Lazy: loaded on the first tap. The reaction already started in the scene (screens/harbor/sight-react.js). Here, in order:
//   THE FLASHBULB   ~0.45 s into the reaction: the city's ACTUAL frame is captured (scene.snapshot — every city layer at full dpr, the
//                   crisp lettering too) the instant before a press-camera flash whites the screen (A's `flash` sound + its shutter)
//   THE PRINT       the photo slides into the corner as a small polaroid, developing — a BIG legendary (the UFO, the TR-3B, the ghost
//                   ship) keeps it there until the craft has left the screen (never over its own moment)
//   THE POLAROID    it slides out big (A's `polaroid`), develops, the date + time hand-lettered under it
//   SPOTTED         a rubber stamp slammed onto the print (the first time) → THE REVEAL of the MATCHED PAIR — its LEGENDARY CARD + its
//                   EMBLEM (A's `card-reveal`; placeholder art — THE VAULT 1), "X% OF PLAYERS HAVE THIS"; it HOLDS until a tap (the owner's
//                   PROGRESSION A review: taps in its first second are ignored, then "TAP TO CONTINUE") → back to the city
//   AGAIN           the reaction + the flash + a small "SPOTTED · 4th time" stamp on the corner print, no reveal
// The claim (js/profile/sightings.js) runs from the tap; the server's answer decides SPOTTED / the reveal. A preview (&force= / the panel)
// plays the reaction, the flash + the print — never SPOTTED, never the album. &sgdemo=<id> (the owner's preview): the first-time sequence
// on demand, never claimed, never kept. The photo is kept ON THIS DEVICE (js/profile/album.js); the sighting record on the server.
import { h } from '../ui/dom.js';
import { claimSighting } from '../profile/sightings.js';
import { SIGHTING, nth } from '../core/sightings.js';
import { ITEM } from '../core/items.js';
import { cardVars, pctFor, pctLine, reduced as reducedNow } from './look.js';

/** the last moment this page (tests + &debug) */
export const last = { tap: null, claim: null, snap: null, phase: null, saved: null };
const BIG = ['ufo', 'tr3b', 'ghostship'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const wait = ms => new Promise(r => setTimeout(r, ms));

let sheetP = null;
function sheet() {
  if (sheetP) return sheetP;
  sheetP = new Promise(res => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/sightings.css'; l.dataset.sg = '1';
    l.onload = () => res(); l.onerror = () => res(); document.head.append(l); setTimeout(res, 2500);
    // (the print's hand: Caveat — Google Fonts like the app's own; the caption falls back to the system's script face)
    if (!document.querySelector('link[data-sg-font]')) { const f = document.createElement('link'); f.rel = 'stylesheet'; f.dataset.sgFont = '1'; f.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap'; document.head.append(f); }
  });
  return sheetP;
}
/** warm the stylesheet + the sounds before the first tap needs them (the title calls it once a legendary is up) */
export function prewarm() { sheet(); import('../audio/progress-sfx.js').then(m => m.pgPrefetch(['flash', 'polaroid', 'card-reveal'])).catch(() => {}); }

/** the print's caption: the date + the time written by hand (the tap's own moment, on this phone's clock) */
export function caption(t, tz) {
  let d;
  try { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz || undefined, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(new Date(t)).map(x => [x.type, x.value])); d = p; }
  catch { const x = new Date(t); d = { year: x.getFullYear(), month: x.getMonth() + 1, day: x.getDate(), hour: (x.getHours() % 12) || 12, minute: String(x.getMinutes()).padStart(2, '0'), dayPeriod: x.getHours() < 12 ? 'AM' : 'PM' }; }
  return { date: `${MONTHS[+d.month - 1]} ${+d.day}, ${d.year}`, time: `${d.hour}:${d.minute} ${String(d.dayPeriod || '').toLowerCase()}` };
}
const sfx = name => import('../audio/progress-sfx.js').then(m => m.pgSfx(name)).catch(() => {});

/** a polaroid element round a photo (a canvas, or an image URL) */
export function polaroid(photo, cap, o = {}) {
  const ph = h('div.sg-photo');
  if (photo instanceof HTMLCanvasElement) ph.append(photo);
  else if (photo) ph.append(h('img', { src: photo, alt: '' }));
  ph.append(h('i.sg-dev'));
  const stamp = h('div.sg-stamp', { 'aria-hidden': 'true' }, 'SPOTTED');
  return h('div.sg-pol', { class: o.dev ? 'is-dev' : '' }, ph, h('div.sg-cap', h('b', cap.date), h('span', cap.time)), stamp, o.tag ? h('div.sg-tag', o.tag) : null);
}
/** the pair's placeholder art (THE VAULT 1 replaces it, never the ids): the card in its palette + its glyph; the emblem in neon */
export function pairCard(id) {
  const s = SIGHTING[id], it = ITEM[s.card], em = ITEM[s.emblem];
  return h('div.sg-card', { style: cardVars(s.card), dataset: { item: it ? it.id : s.card } }, h('i', em ? em.glyph : '✦'), h('span', 'LEGENDARY'), h('em.sg-shine'));
}

let busy = null;
/** a tap that found a legendary → the moment (one at a time; a second tap while it runs only reacts) */
export async function onSighting(sg, ctx = {}) {
  last.tap = { id: sg.id, live: sg.live, demo: !!sg.demo, at: Date.now() };
  // (the owner's preview: &sgdemo — the first time; + &sgagain=N — the Nth time: the corner print + its stamp)
  const claimP = sg.demo ? Promise.resolve(sg.again ? { state: 'again', r: { n: sg.again } } : { state: 'demo' }) : claimSighting({ id: sg.id, t: sg.t, tz: sg.tz, live: sg.live });
  claimP.then(r => { last.claim = r; }).catch(() => {});
  if (busy) return claimP;
  busy = run(sg, ctx, claimP).catch(e => console.warn('[sighting]', e)).finally(() => { busy = null; });
  await busy;
  return claimP;
}

async function run(sg, ctx, claimP) {
  const still = ctx.reduced != null ? ctx.reduced : reducedNow();
  sheet(); prewarm();
  last.phase = 'react';
  await wait(still ? 120 : 450);                                  // (the reaction reads first)
  // THE FLASHBULB: the frame captured the instant before the flash
  let snap = null;
  const box = (ctx.scene && ctx.scene.sightBoxes ? ctx.scene.sightBoxes() : []).find(b => b.key === sg.key) || sg;
  try {
    const sign = document.querySelector('.nd-sub') || document.querySelector('.nd-tag');
    const sb = sign ? sign.getBoundingClientRect() : null;
    if (ctx.scene && ctx.scene.snapshot) snap = await Promise.race([ctx.scene.snapshot(box.x, box.y, { avoid: sb ? { y: sb.bottom + 6 } : null }), wait(1500).then(() => null)]);
  } catch (e) { console.warn('[sighting] snapshot', e); }
  last.snap = snap ? { ms: snap.ms, w: snap.canvas.width, h: snap.canvas.height, box: snap.box } : null;
  await sheet();
  const flash = h('div.sg-flash', { class: still ? 'sg-still' : '' });
  document.body.append(flash);
  requestAnimationFrame(() => flash.classList.add('is-on'));
  sfx('flash');
  setTimeout(() => flash.remove(), 900);
  last.phase = 'flash';
  const cap = caption(sg.t, sg.tz);
  const photo = snap ? snap.canvas : null;
  // THE PRINT into the corner
  await wait(still ? 60 : 260);
  const pol = polaroid(photo, cap, { dev: !still });
  const chip = h('div.sg-chip', { class: `is-from ${still ? 'sg-still' : ''}` }, pol);
  document.body.append(chip);
  requestAnimationFrame(() => requestAnimationFrame(() => { chip.classList.remove('is-from'); chip.classList.add('is-in'); }));
  last.phase = 'print';
  // the server's answer (it has had ~0.7 s; a slow line: up to 6 s more, then the print stands as SPOTTED-unverified)
  const res = await Promise.race([claimP, wait(6000).then(() => ({ state: 'queued', slow: true }))]);
  const st = res && res.state, r = (res && res.r) || {};
  const first = st === 'demo' || (st === 'counted' && r.first);
  const keep = st === 'counted' || st === 'again' || st === 'queued';
  const n = r.n || 0;
  // KEEP THE PHOTO (this device only) — encoded AFTER the moment closes: a JPEG encode of the 3× print costs ~110 ms on Safari's main thread,
  // never while the print slides (the owner's &sgdemo prints go to the PREVIEW album — ?preview=card shows them; never the real one)
  const savePhoto = () => {
    if (!photo) return;
    const enc = () => import('../screens/harbor/snapshot.js').then(m => m.toJpeg(photo));
    if (sg.demo && !sg.again) enc().then(b => b && import('../profile/album.js').then(a => { a.useAlbum('ns-album-preview'); return a.addPhoto({ id: sg.id, t: sg.t, n: 1, blob: b, w: photo.width }).finally(() => a.useAlbum('ns-album')); })).then(ok => { last.saved = !!ok; }).catch(() => { last.saved = false; });
    else if (keep && st !== 'again' && !sg.demo) enc().then(b => b && import('../profile/album.js').then(a => a.addPhoto({ id: sg.id, t: sg.t, n, blob: b, w: photo.width }))).then(ok => { last.saved = !!ok; }).catch(() => { last.saved = false; });
  };
  const again = st === 'counted' && !r.first || st === 'again';
  if (again || st === 'refused' || (!first && st !== 'queued' && st !== 'preview')) {
    // AGAIN: a small stamp on the corner print, no reveal
    if (again) { const s = pol.querySelector('.sg-stamp'); s.replaceChildren('SPOTTED', h('small', n > 1 ? `${nth(n)} time` : '')); requestAnimationFrame(() => s.classList.add('is-on')); }
    last.phase = again ? 'again' : 'refused';
    await wait(again ? 3400 : 1600);
    chip.classList.add('is-out'); await wait(500); chip.remove();
    last.phase = 'done';
    savePhoto();
    return;
  }
  // A BIG legendary: the print waits in the corner until the craft has left the screen (never over its own moment)
  if (BIG.includes(sg.id) && !sg.demo && ctx.scene && ctx.scene.sightBoxes) {
    last.phase = 'waiting';
    const t0 = Date.now(); let goneAt = 0;
    while (Date.now() - t0 < 160e3) {
      const up = ctx.scene.sightBoxes().some(b => b.id === sg.id);
      if (up) goneAt = 0; else if (!goneAt) goneAt = Date.now(); else if (Date.now() - goneAt > 1200) break;
      await wait(300);
    }
  }
  await bigMoment(sg, { pol, chip, first, preview: st === 'preview', still, cap });
  savePhoto();
}

/** THE POLAROID big → SPOTTED → THE REVEAL (first) — held until a tap */
async function bigMoment(sg, { pol, chip, first, preview, still }) {
  const s = SIGHTING[sg.id];
  const stage = h('div.sg-stage');
  const head = h('div.sg-head', preview ? 'A PREVIEW · IT DOESN’T COUNT' : 'SPOTTED OVER THE HARBOR');
  const pctEl = h('em', '');
  const pair = h('div.sg-pair',
    h('div.sg-item', h('small', 'LEGENDARY CARD'), pairCard(sg.id), h('b', s.name), pctEl),
    h('div.sg-item', h('small', 'EMBLEM'), h('div.sg-emb', ITEM[s.emblem] ? ITEM[s.emblem].glyph : '✦'), h('b', s.name), h('em', '')));
  const go = h('button.btn.btn-primary.sg-go', { type: 'button' }, 'CONTINUE');
  const modal = h('div.sg-modal', { class: `${first ? 'has-pair' : ''} ${still ? 'sg-still' : ''}`, role: 'dialog', 'aria-label': `${s.what} — spotted` }, stage, h('div.sg-foot', go));
  // the print moves from the corner into the middle (the same element — its photo + its developing carry on)
  chip.remove();
  stage.append(head, pol); modal.insertBefore(pair, modal.lastChild);
  document.body.append(modal);
  last.phase = 'polaroid';
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-in', 'is-print')));
  if (!still) sfx('polaroid');
  if (preview) pol.append(h('div.sg-tag', 'PREVIEW'));
  let shownAt = performance.now(), closeR;
  const closed = new Promise(r => { closeR = r; });
  const close = () => { if (modal.classList.contains('is-out')) return; modal.classList.add('is-out'); last.phase = 'done'; setTimeout(() => { modal.remove(); closeR(); }, 320); };
  const done = () => { modal.classList.add('is-done'); shownAt = performance.now(); };
  // (THE HOLD: taps in its first second never dismiss it — a skip-tap can't throw it away unread)
  modal.addEventListener('pointerup', e => { if (!modal.classList.contains('is-done') || performance.now() - shownAt < 1000) return; if (e.target.closest('.sg-go')) return; close(); });
  go.addEventListener('click', () => { if (performance.now() - shownAt >= 350) close(); });
  await wait(still ? 200 : 2300);
  if (!preview) { const stp = pol.querySelector('.sg-stamp'); stp.classList.add('is-on'); last.phase = 'spotted'; }
  if (first) {
    await wait(still ? 300 : 1100);
    modal.classList.add('is-reveal'); last.phase = 'reveal';
    sfx('card-reveal');
    pctFor({ fresh: true }).then(p => { const v = p && p.i ? p.i[s.card] : null; if (v) pctEl.textContent = pctLine(v); }).catch(() => {});
    await wait(still ? 300 : 1000);
  } else await wait(still ? 300 : 900);
  done();
  await closed;
}
