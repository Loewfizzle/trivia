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
export const last = { tap: null, claim: null, snap: null, phase: null, phases: [], saved: null };
/** (every phase this page passed through, in order — the tests read the list: a short phase is never missed between two polls) */
const setPhase = p => { last.phase = p; last.phases.push(p); if (last.phases.length > 40) last.phases.shift(); };
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
// (THE VAULT 2A: the reveal's scene modules + css/vault.css load HERE, at the tap — never in the middle of the print's gestures)
export function prewarm() { sheet(); import('../audio/progress-sfx.js').then(m => m.pgPrefetch(['flash', 'polaroid', 'card-reveal'])).catch(() => {}); import('../vault/full.js').then(() => import('../vault/sheet.js')).then(m => m.vaultSheet()).catch(() => {}); }

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
  const dev = h('i.sg-dev');
  ph.append(dev);
  // (developing: a script animation, not CSS — it carries on when the print moves from the corner into the moment; a CSS one restarts)
  if (o.dev && dev.animate) dev.animate([{ opacity: 1 }, { opacity: 0.86, offset: 0.3 }, { opacity: 0 }], { duration: 2600, easing: 'cubic-bezier(.4, 0, .3, 1)' });
  const stamp = h('div.sg-stamp', { 'aria-hidden': 'true' }, 'SPOTTED');
  return h('div.sg-pol', ph, h('div.sg-cap', h('b', cap.date), h('span', cap.time)), stamp, o.tag ? h('div.sg-tag', o.tag) : null);
}

// THE PARKED PRINT (the owner's PROGRESSION B review: "not smooth"): ONE element the whole way — the full-size print, scaled. Out of the
// flash it SHRINKS + GLIDES into its corner with a slight tilt + a soft settle (one eased gesture); parked there it's TAPPABLE (opens the
// moment at once); then it GROWS BACK from that exact spot into the moment with a spring (FLIP: measured once, never in a frame loop).
// Transform + opacity only; reduced motion = placed, no motion.
const CORNER_W = 84;
function cornerOf(W, H, s) {
  const mark = h('i.sg-corner'); document.body.append(mark);
  const m = mark.getBoundingClientRect(); mark.remove();
  return { tx: m.right - W * s / 2 - W / 2, ty: m.bottom - H * s / 2 - H / 2 };
}
const tf = (x, y, s, r) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)}) rotate(${r}deg)`;
export function parkPrint(pol, from, still, onTap) {
  const fly = h('div.sg-fly', { role: 'button', 'aria-label': 'Open the photo', tabindex: '0' }, pol);
  fly.style.opacity = '0';
  document.body.append(fly);
  const W = pol.offsetWidth || 316, H = pol.offsetHeight || 380, s = CORNER_W / W;
  const c = cornerOf(W, H, s);
  const park = tf(c.tx, c.ty, s, 4);
  fly.style.transform = park; fly.style.opacity = '1';
  fly._park = { c, s, W, H }; fly._at = performance.now();
  let tapped = false;
  const go = e => { if (tapped || fly.classList.contains('is-going')) return; if (e && e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; tapped = true; onTap && onTap(); };
  fly.addEventListener('pointerup', go); fly.addEventListener('keydown', go);
  if (still || !fly.animate) return fly;
  // from the craft (where the camera looked), mid-size, fading in under the flash → the corner
  const fx = Math.max(W * 0.3, Math.min(innerWidth - W * 0.3, from.x || innerWidth / 2)) - W / 2;
  const fy = Math.max(H * 0.3, Math.min(innerHeight - H * 0.3, from.y || innerHeight / 2)) - H / 2;
  // (each segment starts + ends at rest-speed — the per-frame trace in the harbor `sightings` group: no frame leaps)
  fly.animate([
    { transform: tf(fx, fy, 0.56, -6), opacity: 0, easing: 'cubic-bezier(.33, 0, .3, 1)' },
    { transform: tf(fx + (c.tx - fx) * 0.05, fy + (c.ty - fy) * 0.05, 0.6, -4), opacity: 1, offset: 0.14, easing: 'cubic-bezier(.42, 0, .22, 1)' },
    { transform: tf(c.tx, c.ty, s * 1.015, 5.5), opacity: 1, offset: 0.86, easing: 'cubic-bezier(.35, 0, .35, 1)' },
    { transform: park, opacity: 1 },
  ], { duration: 1150 });
  return fly;
}
/** the parked print leaves the corner (AGAIN / a refused claim): a soft drop + fade */
function unpark(fly, still) {
  const p = fly._park;
  if (still || !fly.animate || !p) { fly.remove(); return wait(0); }
  const a = fly.animate([{ transform: tf(p.c.tx, p.c.ty, p.s, 4), opacity: 1 }, { transform: tf(p.c.tx + 18, p.c.ty + 26, p.s * 0.92, 8), opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.4, 0, .6, 1)', fill: 'forwards' });
  return a.finished.catch(() => {}).then(() => fly.remove());
}
/** the parked print GROWS BACK into the moment's slot from exactly where it sits (FLIP) */
function unparkInto(fly, pol, stage, still) {
  const a = pol.getBoundingClientRect();
  fly.classList.add('is-going');
  pol.classList.add('is-flip');
  stage.append(pol); fly.remove();
  if (still || !pol.animate) return;
  const b = pol.getBoundingClientRect();
  if (!(b.width > 0)) return;
  const k = a.width / b.width, dx = (a.left + a.width / 2) - (b.left + b.width / 2), dy = (a.top + a.height / 2) - (b.top + b.height / 2);
  // (a spring: it eases out of the corner (never a first-frame leap), overshoots a touch, settles)
  pol.animate([
    { transform: tf(dx, dy, k, 4), easing: 'cubic-bezier(.38, 0, .24, 1)' },
    { transform: tf(-dx * 0.012, -dy * 0.012, 1.03, -3.6), offset: 0.74, easing: 'cubic-bezier(.4, 0, .3, 1)' },
    { transform: 'translate(0px, 0px) scale(1) rotate(-3deg)' },
  ], { duration: 520 });
}
/** the pair's placeholder art (THE VAULT 1 replaces it, never the ids): the card in its palette + its glyph; the emblem in neon */
export function pairCard(id) {
  const s = SIGHTING[id], it = ITEM[s.card], em = ITEM[s.emblem];
  return h('div.sg-card', { style: cardVars(s.card), dataset: { item: it ? it.id : s.card } }, h('i', em ? em.glyph : '✦'), h('span', 'LEGENDARY'), h('em.sg-shine'));
}

let busy = null;
/** a tap that found a legendary → the moment (one at a time; a second tap while it runs only reacts) */
export async function onSighting(sg, ctx = {}) {
  // (THE VAULT 1B — names only to owners: the owner's &sgdemo preview claims nothing, so its pair's names come from /api/admin — admins only;
  //  anyone else's preview shows the craft's plain name)
  if (sg.demo) import('../profile/api.js').then(A => A.api('admin', { action: 'sightShow', id: sg.id })).catch(() => {});
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
  setPhase('react');
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
  setPhase('flash');
  const cap = caption(sg.t, sg.tz);
  const photo = snap ? snap.canvas : null;
  // THE PRINT into the corner (one eased gesture; parked there it's tappable: opens the moment at once)
  await wait(still ? 60 : 120);
  const pol = polaroid(photo, cap, { dev: !still });
  let openNow = false;
  const chip = parkPrint(pol, { x: box.x, y: box.y }, still, () => { openNow = true; last.tappedPrint = true; });
  setPhase('print');
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
    setPhase(again ? 'again' : 'refused');
    chip.classList.add('is-going');
    await wait(again ? 3400 : 1600);
    await unpark(chip, still);
    setPhase('done');
    savePhoto();
    return;
  }
  // A BIG legendary: the print waits in the corner until the craft has CLEARED or LEFT THE SCREEN (never over its own moment) — or the
  // print is tapped. It ALWAYS pops (the owner's review: once it stayed a thumbnail): a hidden tab only waits (its frames stop, so its
  // boxes go stale — never read as "gone"); back on screen, the craft is asked again; a forced one that loops is let go after ~75 s.
  if (BIG.includes(sg.id) && !sg.demo && ctx.scene && ctx.scene.sightBoxes) {
    setPhase('waiting');
    const t0 = Date.now(); let goneAt = 0, seen = Date.now();
    while (!openNow && Date.now() - t0 < 75e3) {
      if (document.hidden) { goneAt = 0; seen = Date.now(); await wait(300); continue; }
      if (Date.now() - seen < 400) { await wait(120); continue; }    // (just back: let the city draw a frame first)
      const up = ctx.scene.sightBoxes().some(b => b.id === sg.id && b.x > -b.rx && b.x < innerWidth + b.rx && b.y > -b.ry && b.y < innerHeight + b.ry);
      if (up) goneAt = 0; else if (!goneAt) goneAt = Date.now(); else if (Date.now() - goneAt > 1200) break;
      await wait(300);
    }
    while (document.hidden) await wait(300);                          // (it pops where it can be seen)
  }
  // (a print that only just parked rests a beat before it grows back — never a shrink straight into a grow)
  { const rest = 1300 - (performance.now() - (chip._at || 0)); if (!still && !openNow && rest > 0) await wait(rest); }
  await bigMoment(sg, { pol, chip, first, preview: st === 'preview', still, cap });
  savePhoto();
}

/** THE POLAROID big → SPOTTED → THE REVEAL (first) — held until a tap */
async function bigMoment(sg, { pol, chip, first, preview, still }) {
  const s = SIGHTING[sg.id];
  const stage = h('div.sg-stage');
  const head = h('div.sg-head', preview ? 'A PREVIEW · IT DOESN’T COUNT' : 'SPOTTED OVER THE HARBOR');
  const pctEl = h('em', '');
  // (THE VAULT 1C: the placeholder until the card's REAL scene is approved + in — then its scene, moving: js/vault/full.js#upgradeScene)
  const pairArt = pairCard(sg.id);
  let scene = null;
  import('../vault/full.js').then(V => V.upgradeScene(pairArt, s.card, { label: 'reveal' })).then(r => { scene = r; }).catch(() => {});
  const pair = h('div.sg-pair',
    h('div.sg-item', h('small', 'LEGENDARY CARD'), pairArt, h('b', ((ITEM[s.card] || {}).name || s.what)), pctEl),
    h('div.sg-item', h('small', 'EMBLEM'), h('div.sg-emb', ITEM[s.emblem] ? ITEM[s.emblem].glyph : '✦'), h('b', ((ITEM[s.card] || {}).name || s.what)), h('em', '')));
  const go = h('button.btn.btn-primary.sg-go', { type: 'button' }, 'CONTINUE');
  const modal = h('div.sg-modal', { class: `${first ? 'has-pair' : ''} ${still ? 'sg-still' : ''}`, role: 'dialog', 'aria-label': `${s.what} — spotted` }, stage, h('div.sg-foot', go));
  // the print GROWS BACK from the corner into the middle (the same element — its photo + its developing carry on)
  stage.append(head); modal.insertBefore(pair, modal.lastChild);
  document.body.append(modal);
  unparkInto(chip, pol, stage, still);
  setPhase('polaroid');
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-in', 'is-print')));
  if (!still) sfx('polaroid');
  if (preview) pol.append(h('div.sg-tag', 'PREVIEW'));
  let shownAt = performance.now(), closeR;
  const closed = new Promise(r => { closeR = r; });
  const close = () => { if (modal.classList.contains('is-out')) return; modal.classList.add('is-out'); setPhase('done'); setTimeout(() => { if (scene) scene.surface.destroy(); modal.remove(); closeR(); }, 320); };
  const done = () => { modal.classList.add('is-done'); shownAt = performance.now(); };
  // (THE HOLD: taps in its first second never dismiss it — a skip-tap can't throw it away unread)
  modal.addEventListener('pointerup', e => { if (!modal.classList.contains('is-done') || performance.now() - shownAt < 1000) return; if (e.target.closest('.sg-go')) return; close(); });
  go.addEventListener('click', () => { if (performance.now() - shownAt >= 350) close(); });
  await wait(still ? 200 : 2300);
  if (!preview) { const stp = pol.querySelector('.sg-stamp'); stp.classList.add('is-on'); setPhase('spotted'); }
  if (first) {
    await wait(still ? 300 : 1100);
    modal.classList.add('is-reveal'); setPhase('reveal');
    sfx('card-reveal');
    pctFor({ fresh: true }).then(p => { const v = p && p.i ? p.i[s.card] : null; if (v) pctEl.textContent = pctLine(v); }).catch(() => {});
    await wait(still ? 300 : 1000);
  } else await wait(still ? 300 : 900);
  done();
  await closed;
}
