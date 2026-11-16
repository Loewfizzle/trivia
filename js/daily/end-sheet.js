// FIXES R2 — TAP A TICKET (the owner, Nov 15): a FINISHED daily's ticket on THE DAILIES → TODAY (made or failed) opens its END SCREEN in a
// sheet — read-only, TODAY only (no history), the game's OWN end-screen renderer (no second copy), stills (no live effects):
//   THE PASSWORD  — the word + every guess with its marks   (games/password/end-card.js — the live end screen's own builder)
//   COAST CLEAR   — the final board as it ended             (games/coastclear/end-card.js — + this phone's buoys for the day)
//   THE DROP      — the final board + its time / lines       (games/drop/share.js#renderShare — its share card's own picture, as a still <img>)
// THE SERVER hands it out (api/daily.js `ended` — the dailies' existing function): ONLY your own run, ONLY once it's finished (409 before —
// the ticket isn't tappable then anyway). THE SHEET (ui/sheet.js — ONE SHEET STACK). Loaded on demand from screens/daily.js.
import { h } from '../ui/dom.js';
import { openSheet } from '../ui/sheet.js';
import { lazyImport } from '../ui/lazy-import.js';
import { dailyEnded } from './contract.js';

let open = null;
const look = () => (document.body.dataset.look === 'day' ? 'day' : 'night');

/** d: the daily's row { id, name } → the sheet (one at a time) */
export async function openEndSheet(d, { uid = '', answer = null } = {}) {   // (answer: the tests' / the shots' server answer, already fetched)
  if (open) return open;
  const body = h('div.dy-end-body', { dataset: { game: d.id } }, h('p.dy-quiet.dy-end-wait', '…'));
  const s = openSheet({ kicker: 'TODAY · YOUR RUN', title: d.name, cls: 'dy-end-sheet', label: `${d.name} — how your run ended`, body: [body], onClose: () => { open = null; } });
  open = s;
  let r = null, why = '';
  try { r = answer || await dailyEnded(d.id); } catch (e) { why = (e && e.code) || 'error'; }
  if (open !== s) return s;
  try {
    if (!r || !r.run) throw new Error(why || 'empty');
    const el = await paint(d.id, r, uid);
    body.replaceChildren(el);
    const t = el.querySelector('.pw-end-t, .cc-end-t');
    if (t) { const { fitTitle } = await lazyImport(import('./end.js'), './end.js'); fitTitle(t); }   // (the live end screen's own fit: a long headline never overruns the sheet)
    body.dataset.state = 'end';
  } catch {
    body.replaceChildren(h('p.dy-quiet', why === 'not_finished' ? 'Finish today’s run to see how it ended.' : 'Your run is resting — try again in a minute.'));
    body.dataset.state = 'error';
  }
  return s;
}

async function paint(id, r, uid) {
  if (id === 'password') {
    const [{ pwEndResult }, { loadSheet }] = await Promise.all([lazyImport(import('../games/password/end-card.js'), '../games/password/end-card.js'), lazyImport(import('../games/lazy-view.js'), '../games/lazy-view.js')]);
    await loadSheet('password');
    const { el, crack } = pwEndResult(r.run);
    return h(`div.pw-tok.pw-endscr.dy-endscr${crack ? '.is-crack' : '.is-fail'}`, el);
  }
  if (id === 'coastclear') {
    const [{ ccEndResult }, { loadSheet }] = await Promise.all([lazyImport(import('../games/coastclear/end-card.js'), '../games/coastclear/end-card.js'), lazyImport(import('../games/lazy-view.js'), '../games/lazy-view.js')]);
    await loadSheet('coastclear');
    // (this phone's buoys for the day — the run's own key; a clear buoys every shut cell itself: endMap shows every light once it's over)
    let buoys = [];
    try { const v = localStorage.getItem(`cc:buoys:${r.day || 'today'}:${uid}`); buoys = v ? v.split(',').map(Number).filter(Number.isInteger) : []; } catch { buoys = []; }
    const { el } = ccEndResult(r.run, buoys);
    return h('div.cc-tok.cc-end.is-still.dy-endscr', { dataset: { out: r.run.out || '' } }, el);
  }
  if (id === 'drop') {
    const { renderShare } = await lazyImport(import('../games/drop/share.js'), '../games/drop/share.js');
    const cv = await renderShare({ inputs: r.run, look: look() });
    const url = await new Promise(res => cv.toBlob(b => res(b ? URL.createObjectURL(b) : null), 'image/png'));
    cv.width = cv.height = 0;   // (a still: the picture kept as an image, its canvas freed at once — THE LONG NIGHT's rule)
    if (!url) throw new Error('no picture');
    const img = h('img.dy-end-drop', { src: url, alt: 'your final board, your time and your lines', decoding: 'async' });
    img.addEventListener('load', () => setTimeout(() => URL.revokeObjectURL(url), 0), { once: true });
    return h('div.dy-endscr.dy-endscr-drop', img);
  }
  throw new Error('no end screen');
}
