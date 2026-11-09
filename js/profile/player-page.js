// BOARD 2.0 B — THE PLAYER PAGE (the owner, Nov 9 — the mock: tests/integration/board2-preview.html?shot=player): tap ANY name — a friend, a room's
// name tag, a board row, the podium — and that player's page opens as a FULL SHEET over the paused city (the same way your own card opens):
// THE FULL CARD with its live effects on top (vault/full.js#fullCardEl — no member line: the top line reads NEON SPEAKEASY) · LV + the rank line +
// the streak flame (none when `alive` is false) · the TOP 3 RAREST achievements with their names + art + "% OF PLAYERS" (THE APPROVED EXCEPTION —
// the names come only on this answer: api/_lib/player.js) · INVITE (you in a room, they a friend not in it) or the friend button · ⋯ → by `rel`.
// NOT the stats, NOT the best game. `limited` (hidden / opted out / they blocked you) → the name + the emblem only, no card, no ⋯ ADD.
// It reads ONLY `POST /api/profile { action: 'player' }`. THE COVER (vault/full.js#coverBehind — the fx behind held, body.vl-covered, the city's
// frames held), THE LAYER STACK (ui/layers.js — the ONE Esc), a short skeleton while it loads; /api down → the name + the emblem from what the
// screen already had (never a dead sheet). Your OWN name opens YOUR CARD as before (never a second copy of your profile).
//   openPlayer({ pid } | { b, bid } | { id }, { row: what the screen already shows { n, a, c, cd, l… }, extra: [elements — e.g. the room's MAKE HOST / CREW] })
import { h } from '../ui/dom.js';
import { tubeButton, row as shellRow, ICONS } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { takeLayer, onCloseAll } from '../ui/layers.js';
import { state } from '../store.js';
import { api } from './api.js';
import { loadMe } from '../identity.js';
import { bandOf, XP_AT } from '../core/levels.js';

let css = null;
export function playerSheet() {
  if (css) return css;
  css = new Promise(res => {
    if (document.querySelector('link[data-pp]')) { res(); return; }
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/player.css'; l.dataset.pp = '1';
    l.onload = () => res(); l.onerror = () => res(); document.head.append(l); setTimeout(res, 2500);
  });
  return css;
}
const DOTS = '<svg viewBox="0 0 16 4" aria-hidden="true"><circle cx="2" cy="2" r="1.8"/><circle cx="8" cy="2" r="1.8"/><circle cx="14" cy="2" r="1.8"/></svg>';
/** "% OF PLAYERS" — under 1 % reads <1 % (a rare one never shows as 0) */
export const pctText = p => (p == null ? '' : `${Number(p) < 1 ? '<1' : Math.round(Number(p))}% OF PLAYERS`);
const isSelf = ({ pid, bid }) => { const m = loadMe(); return !!(m && ((pid && m.pid === pid) || (bid && m.profile && m.profile.bid === bid))); };

let open = null;
onCloseAll(() => { if (open) open.close(); });

/** the query the server takes: a pid, a board row ({ b, bid }), or a board id */
const queryOf = t => (t.pid ? { pid: t.pid } : t.b && t.bid ? { b: t.b, bid: t.bid } : t.id ? { id: t.id } : null);

export async function openPlayer(target = {}, o = {}) {
  const row = target.row || o.row || {}, extra = (o.extra || target.extra || []).filter(Boolean);
  if (isSelf(target)) { import('../screens/profile.js').then(m => m.openCard()).catch(() => {}); return null; }
  const q = queryOf(target);
  if (!q) return null;
  if (open) open.close();
  const [F, { pgSheet }] = await Promise.all([import('../vault/full.js'), import('../progress/look.js'), playerSheet()]);
  await Promise.all([pgSheet(), import('../vault/strip.js').then(m => m.vaultSheet())]);
  const name = String(row.n || row.name || '').toUpperCase();
  let surface = null, release = null, uncover = null, gone = false;
  const close = () => { if (gone) return; gone = true; if (surface) surface.destroy(); el.remove(); if (open && open.close === close) open = null; if (release) release(); if (uncover) uncover(); };
  // the skeleton: a card-shaped glass with the name + the emblem the screen already had, two quiet bars under it (no spinner)
  const stage = h('div.vl-full-stage.pp-stage', skeletonCard(row, name));
  const foot = h('div.pp-foot', h('div.pp-skel-bar'), h('div.pp-skel-bar.is-short'), ...extra.map(x => h('div.pp-extra', x)));
  const box = h('div.vl-full-in.pp-in', stage, foot, h('button.vl-full-x', { type: 'button', 'aria-label': 'Close', onclick: close }, 'CLOSE'));
  const born = performance.now();
  const el = h('div.vl-full.pp', { role: 'dialog', 'aria-modal': 'true', 'aria-label': name ? `${name} — their card` : 'A player’s card', dataset: { state: 'loading' },
    onclick: e => { if (e.target === el && performance.now() - born > 350) close(); } }, box);
  release = takeLayer(el, { close });
  uncover = F.coverBehind(el);
  document.body.append(el);
  open = { close, el };
  let d = null;
  try { d = await api('profile', { action: 'player', ...q }); } catch (e) { d = { error: e }; }
  if (gone) return open;
  if (d.error || !d.card) { paintLimited(d.error ? 'Their card is resting — try again in a minute.' : 'This member keeps their card private.', d.card || row); el.dataset.state = d.error ? 'error' : 'limited'; return open; }
  if (d.limited) { paintLimited('This member keeps their card private.', d.card); el.dataset.state = 'limited'; return open; }
  await paintCard(d);
  el.dataset.state = 'card';
  return open;

  function paintLimited(line, c = {}) {
    stage.replaceChildren(h('div.pp-lim', h('span.pp-lim-emb'), h('b', String(c.n || name || 'MEMBER').toUpperCase()), h('span', line)));
    import('../vault/emblem-art.js').then(E => { const s = stage.querySelector('.pp-lim-emb'); if (s) s.replaceChildren(E.emblemEl({ avatar: c.a || 'bolt', color: c.c || 'magenta', mode: 'quiet', size: 96 })); }).catch(() => {});
    foot.replaceChildren(...extra.map(x => h('div.pp-extra', x)));
  }

  async function paintCard(D) {
    const c = D.card, lv = c.l || 1;
    const who = { name: c.n, lv, avatar: c.a, color: c.c, shape: c.es, tube: c.tb, glow: c.g, at: c.at, fd: !!c.fd };
    let card;
    if (c.cd && await F.canShowFull(c.cd)) card = F.fullCardEl({ card: c.cd, who });
    else {
      const { gildedCard } = await import('../progress/card.js');
      card = gildedCard({ n: c.n, a: c.a, c: c.c, cd: c.cd || 'card-gilded', g: c.g, at: c.at, fd: c.fd, x: XP_AT[lv] || 0 }, {}, { card: c.cd || 'card-gilded' });
      const no = card.querySelector('.pg-card-no'); if (no) no.remove();   // (no member line on someone else's page)
    }
    if (gone) return;
    stage.replaceChildren(card);
    if (card.classList.contains('vl-fc')) { const { createSurface } = await import('../fx/renderer.js'); if (gone) return; surface = createSurface(stage, { label: 'player' }); F.mountFull(surface, card, c.cd); }
    const band = bandOf(lv);
    const flame = D.streak && D.streak.alive && D.streak.n ? await import('../progress/flame-art.js').then(m => h('span.pp-fl', { 'aria-label': `${D.streak.n}-day streak` }, m.flameArt('lit', 26), String(D.streak.n))).catch(() => null) : null;
    const lvBox = h('div.pp-lv', h('span.pp-lvn', h('small', 'LEVEL'), String(lv)), h('span.pp-band', h('b', D.band || band.name), h('span', band.line)), flame);
    const top = Array.isArray(D.top) ? D.top.slice(0, 3) : [];
    let meds = null;
    if (top.length) {
      const { medal } = await import('../progress/trophies.js');
      meds = h('div.pp-meds', h('div.pp-h', 'RAREST ACHIEVEMENTS'), ...top.map(a => h('div.pp-med', { dataset: { id: a.id } }, medal({ id: a.id, group: a.group, item: a.item }, a.tier || 'common'), h('b', a.name || ''), h('em', pctText(a.pct)))));
    }
    foot.replaceChildren(lvBox, meds || '', actions(D), ...extra.map(x => h('div.pp-extra', x)));
  }

  /** INVITE (in a room, a friend who isn't in it) or the friend button (ADD FRIEND · REQUESTED · ACCEPT · FRIENDS) + ⋯ (by `rel`) */
  function actions(D) {
    const rel = D.rel || 'none', pid = target.pid || (D.card && D.card.pid) || null;
    const ft = pid ? { pid } : { b: target.b, bid: target.bid };
    const here = new Set(Object.values(state.players || {}).map(p => p && p.pid).filter(Boolean));
    const canInvite = !!(state.code && rel === 'friend' && pid && !here.has(pid));
    const slot = h('div.pp-main');
    if (canInvite) {
      let sent = false;
      slot.append(tubeButton('INVITE TO THE ROOM', { kind: 'main', block: true, cls: 'pp-invite', onClick: async () => {
        if (sent) return;
        try { const r = await api('profile', { action: 'friendInvite', pid, room: state.code }); sent = true; toast(`${D.card.n} is invited`, 'ok', { sub: r.sent ? 'A notification is on its way — and it waits on their card for 30 min.' : 'It waits on their card for 30 min.' }); }
        catch (e) { toast((e && e.message) || 'Couldn’t send the invite.', 'warn'); }
      } }));
    } else import('./friends-ui.js').then(m => { if (!gone) slot.replaceChildren(m.friendButton(ft, { name: D.card.n })); }).catch(() => {});
    const dots = h('button.pp-dots', { type: 'button', 'aria-label': 'More', html: DOTS, onclick: () => openMore(D, ft, rel) });
    return h('div.pp-acts', slot, dots);
  }

  /** ⋯ → by `rel`: friend → REMOVE · BLOCK; none → ADD FRIEND · BLOCK; in → ACCEPT · BLOCK; out → CANCEL REQUEST · BLOCK; blocked → UNBLOCK */
  async function openMore(D, ft, rel) {
    const [{ openPfSheet }, FR] = await Promise.all([import('./sheets.js'), import('./friends.js')]);
    let s = null;
    const run = (kind, ok) => async () => { try { await FR.friendDo(kind, ft); if (ok) toast(ok, 'ok'); } catch (e) { toast((e && e.message) || 'Couldn’t do that.', 'warn'); } if (s) s.close(); if (kind === 'remove' || kind === 'block') close(); };
    const n = D.card.n;
    const rows = [];
    if (rel === 'none') rows.push(shellRow({ icon: ICONS.friends, label: 'Add friend', sub: 'A request they accept', chevron: false, cls: 'pp-add', onClick: run('add', 'Friend request sent') }));
    if (rel === 'in') rows.push(shellRow({ icon: ICONS.friends, label: 'Accept friend', chevron: false, cls: 'pp-accept', onClick: run('accept', `You and ${n} are friends`) }));
    if (rel === 'out') rows.push(shellRow({ icon: ICONS.leave, label: 'Cancel request', chevron: false, confirm: 'TAP AGAIN TO CANCEL', cls: 'pp-cancel', onClick: run('cancel') }));
    if (rel === 'friend') rows.push(shellRow({ icon: ICONS.leave, label: 'Remove friend', sub: 'Quietly — they aren’t told', danger: true, chevron: false, confirm: 'TAP AGAIN TO REMOVE', cls: 'pp-remove', onClick: run('remove', `${n} removed`) }));
    if (rel === 'blocked') rows.push(shellRow({ icon: ICONS.block, label: 'Unblock', chevron: false, cls: 'pp-unblock', onClick: run('unblock', `${n} unblocked`) }));
    else rows.push(shellRow({ icon: ICONS.block, label: 'Block', sub: 'No more requests or invites from them', danger: true, chevron: false, confirm: 'TAP AGAIN TO BLOCK', cls: 'pp-block', onClick: run('block', `${n} blocked`) }));
    s = openPfSheet({ kicker: 'THEIR CARD', title: String(n || '').toUpperCase(), cls: 'pp-more-sheet', body: [h('div.sh-row-list', ...rows)] });
  }
}

/** the card-shaped skeleton: the emblem + the name the screen already had (a board row, a friend, a name tag) */
function skeletonCard(row, name) {
  const emb = h('span.pp-sk-emb');
  import('../vault/emblem-art.js').then(E => emb.replaceChildren(E.emblemEl({ avatar: row.a || row.avatar || 'bolt', color: row.c || row.color || 'magenta', mode: 'quiet', size: 34 }))).catch(() => {});
  return h('div.pp-sk', { 'aria-hidden': 'true' }, h('i.pp-sk-sheen'), h('div.pp-sk-plate', emb, h('b', name || ' ')));
}
