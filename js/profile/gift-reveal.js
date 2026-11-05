// SHELL 2.0 B2 — THE GIFT's REVEAL (the owner, Nov 4 5:47 pm): a gift card given by the owner's GIFT TOOL (api/_lib/gifts.js) waits on the
// server (ppriv/{pid}/gift) until its player next opens the site: a few seconds after the title is up, ONE light /api call ('giftCheck');
// a gift → "A GIFT FROM THE HOUSE" over the full card FLIPPING IN (vault/full.js#openFullCard — the cover holds everything behind it), it's
// already EQUIPPED (the server did it); closing it says so to the server ('giftSeen') so it shows once. /api down → nothing (polish).
import { api } from './api.js';
import { loadMe, saveMe } from '../identity.js';
import { state, setState } from '../store.js';
import { h } from '../ui/dom.js';

let checked = false;
export async function checkGift() {
  if (checked) return; checked = true;
  const m = loadMe();
  if (!m || !m.pid) return;
  let r; try { r = await api('profile', { action: 'giftCheck' }); } catch { return; }
  if (!r || !r.gift || !r.gift.id) return;
  if (state.game && state.meta && state.meta.status === 'playing') return;   // (never over a match — the next open shows it)
  await revealGift(r.gift.id, m);
}

/** the reveal itself (also the lab's preview: who = { name, lv, … }) */
export async function revealGift(id, m = loadMe(), o = {}) {
  const [{ openFullCard }, { levelOf }, { memberLabel }] = await Promise.all([import('../vault/full.js'), import('../core/levels.js'), import('../core/member.js')]);
  const p = (m && m.profile) || {};
  const head = h('div.vl-gift-head', h('small', 'A GIFT FROM THE HOUSE'), h('b', h('span.vl-gift-one', 'ONE OF ONE'), h('i.vl-gift-dot', ' · '), h('span.vl-gift-yours', 'IT’S YOURS')));
  const onClose = () => {
    if (o.preview) return;
    api('profile', { action: 'giftSeen' }).catch(() => {});
    const me = loadMe();
    if (me && me.profile) { me.profile = { ...me.profile, cd: id }; saveMe(me); setState({ me: { pid: me.pid, profile: me.profile } }); }
  };
  return openFullCard(id, { name: o.name || p.n || 'MEMBER', lv: o.lv || levelOf(p.x || 0), avatar: p.a, color: p.c, at: p.at, no: memberLabel(p.mn), fd: !!p.fd, shape: p.es, tube: p.tb, glow: p.g,
    head, flip: true, closeWord: 'IT’S YOURS', onClose });
}
