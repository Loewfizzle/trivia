// SHELL 2.0 B2 — THE GIFT's REVEAL (the owner, Nov 4 5:47 pm): a gift card given by the owner's GIFT TOOL (api/_lib/gifts.js) waits on the
// server until its player next opens the site: a few seconds after the title is up, ONE light /api call ('giftCheck');
// a gift → "A GIFT FROM THE HOUSE" over the full card FLIPPING IN (vault/full.js#openFullCard — the cover holds everything behind it), it's
// already EQUIPPED (the server did it); closing it says so to the server ('giftSeen') so it shows once. /api down → nothing (polish).
// THE CARD PASS — THE GIFT QUEUE (the owner, Nov 7): several gifts wait in a LINE — the reveal plays ONE CARD AT A TIME, "GIFT 1 OF 5" over
// each, its button NEXT GIFT › (the last one: IT'S YOURS); each is marked seen as it closes ('giftSeen' { k }), so a refresh mid-line
// resumes at the next unseen ("GIFT 3 OF 5"). Never over a match: a match starting mid-line stops it (the rest waits for the next open).
import { api } from './api.js';
import { loadMe, saveMe } from '../identity.js';
import { state, setState } from '../store.js';
import { h } from '../ui/dom.js';
import { lazyImport } from '../ui/lazy-import.js';

const inMatch = () => !!(state.game && state.meta && state.meta.status === 'playing');
let checked = false;
export async function checkGift() {
  if (checked) return; checked = true;
  const m = loadMe();
  if (!m || !m.pid) return;
  let r; try { r = await api('profile', { action: 'giftCheck' }); } catch { return; }
  // (an old server answers only `gift`: a line of one)
  const line = r && Array.isArray(r.gifts) ? r.gifts.filter(g => g && g.id) : (r && r.gift && r.gift.id ? [{ k: '', id: r.gift.id }] : []);
  if (!line.length) return;
  await playLine(line, (r && r.done) || 0, m);
}

/** THE GIFT QUEUE: the line one card at a time — resolves when the last one closes (or a match stops it) */
export function playLine(line, done = 0, m = loadMe(), o = {}) {
  const total = done + line.length;
  return new Promise(resolve => {
    const next = i => {
      if (i >= line.length || (!o.preview && inMatch())) { resolve(i); return; }
      const g = line[i], last = i === line.length - 1;
      revealGift(g.id, m, { ...o, k: g.k, n: total > 1 ? done + i + 1 : 0, of: total, last, after: () => setTimeout(() => next(i + 1), 420) });
    };
    next(0);
  });
}

/** the reveal itself (also the lab's preview: who = { name, lv, … }); o.n / o.of = "GIFT n OF m" in a line; o.after = the next one */
export async function revealGift(id, m = loadMe(), o = {}) {
  const [{ openFullCard }, { levelOf }, { memberLabel }] = await Promise.all([lazyImport(import('../vault/full.js'), '../vault/full.js'), lazyImport(import('../core/levels.js'), '../core/levels.js'), lazyImport(import('../core/member.js'), '../core/member.js')]);
  const p = (m && m.profile) || {};
  const head = h('div.vl-gift-head', h('small', o.n ? `GIFT ${o.n} OF ${o.of}` : 'A GIFT FROM THE HOUSE'),
    o.n ? h('small.vl-gift-sub', 'FROM THE HOUSE') : '',
    h('b', h('span.vl-gift-one', 'ONE OF ONE'), h('i.vl-gift-dot', ' · '), h('span.vl-gift-yours', 'IT’S YOURS')));
  if (o.n) head.dataset.gift = `${o.n}/${o.of}`;
  const onClose = () => {
    if (!o.preview) {
      api('profile', { action: 'giftSeen', k: o.k || '' }).catch(() => {});
      const me = loadMe();
      if (me && me.profile) { me.profile = { ...me.profile, cd: id }; saveMe(me); setState({ me: { pid: me.pid, profile: me.profile } }); }
    }
    if (o.after) o.after();
  };
  return openFullCard(id, { name: o.name || p.n || 'MEMBER', lv: o.lv || levelOf(p.x || 0), avatar: p.a, color: p.c, at: p.at, no: memberLabel(p.mn), fd: !!p.fd, shape: p.es, tube: p.tb, glow: p.g,
    head, flip: true, closeWord: o.n && !o.last ? 'NEXT GIFT ›' : 'IT’S YOURS', onClose });
}
