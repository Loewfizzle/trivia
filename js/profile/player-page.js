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
import { lazyImport } from '../ui/lazy-import.js';

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
/** "% OF PLAYERS" — under 1 % reads <1 % (a rare one never shows as 0) */
export const pctText = p => (p == null ? '' : `${Number(p) < 1 ? '<1' : Math.round(Number(p))}% OF PLAYERS`);
const isSelf = ({ pid, bid }) => { const m = loadMe(); return !!(m && ((pid && m.pid === pid) || (bid && m.profile && m.profile.bid === bid))); };

let open = null;
onCloseAll(() => { if (open) open.close(); });

/** the query the server takes: a pid, a board row ({ b, bid }), or a board id */
const queryOf = t => (t.pid ? { pid: t.pid } : t.b && t.bid ? { b: t.b, bid: t.bid } : t.id ? { id: t.id, ...(t.dg ? { dg: t.dg } : {}) } : null);   // (FIXES R2: dg = the daily whose TODAY list the row came from)

export async function openPlayer(target = {}, o = {}) {
  const row = target.row || o.row || {}, extra = (o.extra || target.extra || []).filter(Boolean), report = o.report || target.report || null;   // (CITY H2: THE BOARD's REPORT — in MORE)
  if (isSelf(target)) { lazyImport(import('../screens/profile.js'), '../screens/profile.js').then(m => m.openCard()).catch(() => {}); return null; }
  const q = queryOf(target);
  if (!q) return null;
  if (open) open.close();
  const [F, { pgSheet }] = await Promise.all([lazyImport(import('../vault/full.js'), '../vault/full.js'), lazyImport(import('../progress/look.js'), '../progress/look.js'), playerSheet()]);
  await Promise.all([pgSheet(), lazyImport(import('../vault/strip.js'), '../vault/strip.js').then(m => m.vaultSheet())]);
  const name = String(row.n || row.name || '').toUpperCase();
  let surface = null, release = null, uncover = null, gone = false;
  const close = () => { if (gone) return; gone = true; if (surface) surface.destroy(); el.remove(); if (open && open.close === close) open = null; if (release) release(); if (uncover) uncover(); };
  // the skeleton: a card-shaped glass with the name + the emblem the screen already had, two quiet bars under it (no spinner)
  const stage = h('div.vl-full-stage.pp-stage', skeletonCard(row, name));
  const foot = h('div.pp-foot', h('div.pp-skel-bar'), h('div.pp-skel-bar.is-short'), ...extra.map(x => h('div.pp-extra', x)));
  // (FIXES R2 — the owner: CLOSE is a NEON TUBE — gold is a vault / card accent, never a button)
  // FIXES R3 — THE ACTION BAR (the owner picked option B of three mockups): ONE compact bar at the BOTTOM, in a quiet framed strip —
  //  [ ADD FRIEND (the main pink tube, a little wider — it follows the relation; INVITE in a room) ] [ MORE (the ⋯ menu) ] [ CLOSE ]: 44 px tall,
  //  squared-off corners (no pills), every tap area ≥ 44 × 44; NOTHING over the card (no corner button on it). While loading / limited: CLOSE alone.
  const closeBtn = tubeButton('CLOSE', { kind: 'secondary', cls: 'pp-close vl-full-x', size: 'sm', attrs: { 'data-press': true, 'aria-label': 'Close' }, onClick: close });
  const bar = h('div.pp-bar', { role: 'group', 'aria-label': 'Actions' }, closeBtn);
  const box = h('div.vl-full-in.pp-in', stage, foot, bar);
  const born = performance.now();
  const el = h('div.vl-full.pp', { role: 'dialog', 'aria-modal': 'true', 'aria-label': name ? `${name} — their card` : 'A player’s card', dataset: { state: 'loading', pid: target.pid || '' },
    onclick: e => { if (e.target === el && performance.now() - born > 350) close(); } }, box);
  // CITY C — ONE CLEAN STEP (the owner: a tap on a slim card = their page, no skeleton swap, no fade-in-again, no zoom): the page opens ONCE,
  //  whole — the answer in, the card built, laid out HIDDEN (vault/layout.js settles it) and its material's picture decoded — so the card never
  //  moves and the live art arriving over its matching still changes only the motion. A slow answer (> SLOW_MS) opens on the skeleton as before.
  open = { close, el };
  const answer = api('profile', { action: 'player', ...q }).catch(e => ({ error: e }));
  let d = await Promise.race([answer, new Promise(r => setTimeout(() => r(null), SLOW_MS))]);
  const show = () => { release = takeLayer(el, { close }); uncover = F.coverBehind(el); if (!el.isConnected) document.body.append(el); el.style.visibility = ''; };
  if (gone) return open;
  if (!d) { show(); d = await answer; if (gone) return open; }
  if (d.error || !d.card) { paintLimited(d.error ? 'Their card is resting — try again in a minute.' : 'This member keeps their card private.', d.card || row); el.dataset.state = d.error ? 'error' : 'limited'; if (!release) show(); return open; }
  if (d.limited) { paintLimited('This member keeps their card private.', d.card); el.dataset.state = 'limited'; if (!release) show(); return open; }
  if (!release) { el.style.visibility = 'hidden'; document.body.append(el); }   // (built + laid out unseen: one step)
  await paintCard(d);
  if (!release && !gone) { await materialIn(stage); if (!gone) show(); }
  el.dataset.state = 'card';
  return open;

  function paintLimited(line, c = {}) {
    stage.replaceChildren(h('div.pp-lim', h('span.pp-lim-emb'), h('b', String(c.n || name || 'MEMBER').toUpperCase()), h('span', line)));
    lazyImport(import('../vault/emblem-art.js'), '../vault/emblem-art.js').then(E => { const s = stage.querySelector('.pp-lim-emb'); if (s) s.replaceChildren(E.emblemEl({ avatar: c.a || 'bolt', color: c.c || 'magenta', mode: 'quiet', size: 96 })); }).catch(() => {});
    foot.replaceChildren(...extra.map(x => h('div.pp-extra', x)));
  }

  async function paintCard(D) {
    const c = D.card, lv = c.l || 1;
    const who = { name: c.n, lv, avatar: c.a, color: c.c, shape: c.es, tube: c.tb, glow: c.g, at: c.at, fd: !!c.fd, cardName: c.cn || '' };   // (cn: the WORN card's name — CARD NAMES YOU CAN SEE)
    let card;
    if (c.cd && await F.canShowFull(c.cd)) card = F.fullCardEl({ card: c.cd, who });
    else {
      const { gildedCard } = await lazyImport(import('../progress/card.js'), '../progress/card.js');
      card = gildedCard({ n: c.n, a: c.a, c: c.c, cd: c.cd || 'card-gilded', g: c.g, at: c.at, fd: c.fd, x: XP_AT[lv] || 0 }, {}, { card: c.cd || 'card-gilded' });
      card.querySelectorAll('.pg-card-no').forEach(n => n.remove());   // (no member line on someone else's page — CITY C: the label + its value)
    }
    if (gone) return;
    stage.replaceChildren(card);
    if (card.classList.contains('vl-fc')) { const { createSurface } = await lazyImport(import('../fx/renderer.js'), '../fx/renderer.js'); if (gone) return; surface = createSurface(stage, { label: 'player' }); F.mountFull(surface, card, c.cd); }
    const band = bandOf(lv);
    const flame = D.streak && D.streak.alive && D.streak.n ? await lazyImport(import('../progress/flame-art.js'), '../progress/flame-art.js').then(m => h('span.pp-fl', { 'aria-label': `${D.streak.n}-day streak` }, m.flameArt('lit', 26), String(D.streak.n))).catch(() => null) : null;
    const lvBox = h('div.pp-lv', h('span.pp-lvn', h('small', 'LEVEL'), String(lv)), h('span.pp-band', h('b', D.band || band.name), h('span', band.line)), flame);
    const top = Array.isArray(D.top) ? D.top.slice(0, 3) : [];
    // (FIXES R2 — the owner: the block always shows — none yet = its heading + a quiet line, fewer than 3 = what they have)
    let meds;
    if (top.length) {
      const { medal } = await lazyImport(import('../progress/trophies.js'), '../progress/trophies.js');
      meds = h('div.pp-meds', h('div.pp-h', 'RAREST ACHIEVEMENTS'), ...top.map(a => h('div.pp-med', { dataset: { id: a.id } }, medal({ id: a.id, group: a.group, item: a.item }, a.tier || 'common'), h('b', a.name || ''), h('em', pctText(a.pct)))));
    } else meds = h('div.pp-meds.is-none', h('div.pp-h', 'RAREST ACHIEVEMENTS'), h('p.pp-none', 'NO ACHIEVEMENTS YET'));
    foot.replaceChildren(lvBox, meds, ...extra.map(x => h('div.pp-extra', x)));
    bar.replaceChildren(...actions(D), closeBtn);
  }

  /** THE BAR's first two: INVITE (in a room, a friend who isn't in it) or the friend button (ADD FRIEND · REQUESTED · ACCEPT · FRIENDS) + MORE (the ⋯ menu, by `rel`) */
  function actions(D) {
    const rel = D.rel || 'none', pid = target.pid || (D.card && D.card.pid) || null;
    const ft = pid ? { pid } : { b: target.b, bid: target.bid };
    const here = new Set(Object.values(state.players || {}).map(p => p && p.pid).filter(Boolean));
    const canInvite = !!(state.code && rel === 'friend' && pid && !here.has(pid));
    const slot = h('div.pp-main');
    if (canInvite) {
      let sent = false;
      slot.append(tubeButton('INVITE', { kind: 'main', size: 'sm', block: true, cls: 'pp-invite', attrs: { 'aria-label': 'Invite them to the room' }, onClick: async () => {
        if (sent) return;
        try { const r = await api('profile', { action: 'friendInvite', pid, room: state.code }); sent = true; toast(`${D.card.n} is invited`, 'ok', { sub: r.sent ? 'A notification is on its way — and it waits on their card for 30 min.' : 'It waits on their card for 30 min.' }); }
        catch (e) { toast((e && e.message) || 'Couldn’t send the invite.', 'warn'); }
      } }));
    } else lazyImport(import('./friends-ui.js'), './friends-ui.js').then(m => { if (!gone) slot.replaceChildren(m.friendButton(ft, { name: D.card.n, size: 'sm', labels: BAR_LABELS })); }).catch(() => {});
    const more = tubeButton('MORE', { kind: 'secondary', size: 'sm', cls: 'pp-more', attrs: { 'data-press': true, 'aria-label': 'More — remove, block' }, onClick: () => openMore(D, ft, rel) });
    return [slot, more];
  }

  /** ⋯ → by `rel`: friend → REMOVE · BLOCK; none → ADD FRIEND · BLOCK; in → ACCEPT · BLOCK; out → CANCEL REQUEST · BLOCK; blocked → UNBLOCK */
  async function openMore(D, ft, rel) {
    const [{ openPfSheet }, FR] = await Promise.all([lazyImport(import('./sheets.js'), './sheets.js'), lazyImport(import('./friends.js'), './friends.js')]);
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
    // (CITY H2 — opened from THE BOARD: its row's REPORT lives here now (the board's ⋯ line is gone) — the report sheet opens on top)
    if (report) rows.push(shellRow({ icon: ICONS.board, label: 'Report', sub: 'A suspicious score or a bad name', chevron: false, cls: 'pp-report', onClick: () => { if (s) s.close(); report(); } }));
    s = openPfSheet({ kicker: 'THEIR CARD', title: String(n || '').toUpperCase(), cls: 'pp-more-sheet', body: [h('div.sh-row-list', ...rows)] });
  }
}

const SLOW_MS = 2500;
/** FIXES R3 — THE BAR's friend tube: its labels (ADD FRIEND — the owner's 12:19 am add-on: the "+" read too small · REQUESTED · ACCEPT · FRIENDS · UNBLOCK) */
const BAR_LABELS = Object.freeze({ none: 'ADD FRIEND', out: 'REQUESTED', in: 'ACCEPT', friend: 'FRIENDS', blocked: 'UNBLOCK' });
/** CITY C — the card's material picture decoded before the page shows (≤ 900 ms — a missing picture never holds it) */
function materialIn(stage) {
  const m = stage.querySelector('.vl-mat'), urls = m ? [...getComputedStyle(m).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(x => x[1]) : [];
  return Promise.race([Promise.all(urls.map(u => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); })), new Promise(r => setTimeout(r, 900))]).then(() => new Promise(r => requestAnimationFrame(() => r())));
}
/** the card-shaped skeleton: the emblem + the name the screen already had (a board row, a friend, a name tag) */
function skeletonCard(row, name) {
  const emb = h('span.pp-sk-emb');
  lazyImport(import('../vault/emblem-art.js'), '../vault/emblem-art.js').then(E => emb.replaceChildren(E.emblemEl({ avatar: row.a || row.avatar || 'bolt', color: row.c || row.color || 'magenta', mode: 'quiet', size: 34 }))).catch(() => {});
  return h('div.pp-sk', { 'aria-hidden': 'true' }, h('i.pp-sk-sheen'), h('div.pp-sk-plate', emb, h('b', name || ' ')));
}
