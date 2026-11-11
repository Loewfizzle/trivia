// FRIENDS A — THE FRIENDS SCREENS (the owner, Nov 7 9:48 pm: NO DOCK TAB — friends live on the PROFILE CARD, a FRIENDS row atop the room's
// INVITE sheet, and ADD FRIEND on any player's name tag: the room's player card, the podium, THE BOARD). THE SHELL's pieces only (THE ROW,
// THE NEON TUBE, THE SHEET); prefix `fr-` (css/friends.css). ONLINE STATUS = NONE: no "online now" anywhere — the only presence is the
// room's own green dot on a friend IN A ROOM WITH YOU (room-city.js).
//   friendsSection()                  → the profile's FRIENDS section (requests, the list + ⋯, sent, recently played with, blocked, YOUR TABLE)
//   friendButton(target, o)           → ADD FRIEND · REQUESTED · ACCEPT · FRIENDS · UNBLOCK (target: { pid } or THE BOARD's { b, bid })
//   openTheirCard(who)                → THE PLAYER PAGE (BOARD 2.0 B — profile/player-page.js) for a player with a profile; else their card
//   inviteFriendsBlock({ code, share }) → the INVITE sheet's FRIENDS row + SHARE INVITE LINK
import { afterTap } from '../ui/tapwatch.js';
import { h } from '../ui/dom.js';
import { avatar, tubeButton, row, ICONS } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { openPfSheet } from './sheets.js';
import { loadFriends, friendsNow, onFriends, relOf, relOfBid, friendDo } from './friends.js';
import { FR_WHY } from '../core/friends.js';
import { state } from '../store.js';
import { stripKit, stripFor, stripFx } from '../ui/strip-board.js';
import { presenceOnline } from '../core/room-logic.js';
import { lazyImport } from '../ui/lazy-import.js';

let css = null;
export function frSheet() {
  if (css) return css;
  css = new Promise(res => {
    if (document.querySelector('link[data-fr]')) { res(); return; }
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/friends.css'; l.dataset.fr = '1';
    l.onload = () => res(); l.onerror = () => res(); document.head.append(l); setTimeout(res, 2500);
  });
  return css;
}
const why = e => (e && (FR_WHY[e.code] || (e.status === 0 ? 'Couldn’t reach the server — try again.' : e.message))) || 'Couldn’t do that.';
const who = c => h('span.fr-who', h('b.fr-n', c.n || 'MEMBER'), h('small', `#${c.t || '····'} · LV ${c.l || 1}`));
const face = c => h('span.fr-av', avatar(c.a, c.c, 34));

// ------------------------------------------------------------------------------------------------ the button (a name tag's ADD FRIEND)
const LABEL = { none: 'ADD FRIEND', out: 'REQUESTED', in: 'ACCEPT FRIEND', friend: 'FRIENDS', blocked: 'UNBLOCK' };
/** one tube that follows the relation; hidden while it isn't known (or /api is down) or it's you */
export function friendButton(target, o = {}) {
  frSheet();
  const wrap = h('div.fr-btn-slot', { dataset: { pid: target.pid || '', bid: target.bid || '' } });
  let busy = false, shown = null;
  const rel = () => (target.pid ? relOf(target.pid) : relOfBid(target.bid));
  // (CITY FIXES — THE TAP WATCH: ADD FRIEND was REBUILT when the friends list loaded (right after the card opened) + on every friends event,
  //  even unchanged — a tap in that moment hit a replaced button (iOS drops it). Now: rebuilt only when the relation CHANGES, never under a finger)
  const paint = (force = false) => afterTap(() => paintNow(force));
  const paintNow = (force = false) => {
    const r = rel();
    if (!force && r === shown && wrap.firstChild) return;
    shown = r;
    if (!r || r === 'self') { wrap.replaceChildren(); wrap.hidden = true; return; }
    wrap.hidden = false;
    const kind = r === 'none' || r === 'in' ? 'main' : 'secondary';
    const run = async k => {
      if (busy) return; busy = true; b.classList.add('is-busy');
      try {
        const res = await friendDo(k, target);
        if (k === 'add') toast(res.rel === 'friend' ? `You and ${o.name || 'they'} are friends` : 'Friend request sent', 'ok', { sub: res.rel === 'friend' ? null : 'They’ll see it on their card.' });
        if (k === 'accept') toast(`You and ${o.name || 'they'} are friends`, 'ok');
      } catch (e) { toast(why(e), 'warn'); }
      busy = false; paint(true);
    };
    const b = r === 'out' ? tubeButton(LABEL.out, { kind, size: o.size, block: o.block !== false, cls: 'fr-btn is-out', confirm: 'TAP AGAIN TO CANCEL', onClick: () => run('cancel') })
      : r === 'friend' ? tubeButton(LABEL.friend, { kind, size: o.size, block: o.block !== false, cls: 'fr-btn is-friend', attrs: { 'aria-disabled': 'true' } })
      : tubeButton(LABEL[r], { kind, size: o.size, block: o.block !== false, cls: `fr-btn is-${r}`, onClick: () => run(r === 'none' ? 'add' : r === 'in' ? 'accept' : 'unblock') });
    if (r === 'friend') b.prepend(h('i.fr-dot', { 'aria-hidden': 'true' }));
    wrap.replaceChildren(b);
  };
  paint();
  const off = onFriends(() => { if (!wrap.isConnected && wrap.dataset.seen) { off(); return; } wrap.dataset.seen = '1'; paint(); });
  loadFriends().then(() => paint()).catch(() => {});
  return wrap;
}

/** a player's card (the podium's tap): their full card when they wear an approved one, else the gilded card — ADD FRIEND under it */
export async function openTheirCard({ pid, name, color, avatar: av, pub }) {
  // (BOARD 2.0 B: a player with a profile → THE PLAYER PAGE (the podium's tap); the card below only for a player with none)
  if (pid) return lazyImport(import('./player-page.js'), './player-page.js').then(m => m.openPlayer({ pid, row: { ...(pub || {}), n: (pub && pub.n) || name, a: (pub && pub.a) || av, c: (pub && pub.c) || color } }));
  await frSheet();
  const foot = pid ? h('div.rc-foot.fr-foot', friendButton({ pid }, { name })) : null;
  if (pub && pub.cd && pub.cd !== 'card-gilded') {
    try {
      const F = await lazyImport(import('../vault/full.js'), '../vault/full.js');
      if (await F.canShowFull(pub.cd)) { const { levelOf } = await lazyImport(import('../core/levels.js'), '../core/levels.js'); const { memberLabel } = await lazyImport(import('../core/member.js'), '../core/member.js');
        F.openFullCard(pub.cd, { name: pub.n || name, lv: levelOf(pub.x || 0), avatar: pub.a || av, color: pub.c || color, at: pub.at, no: memberLabel(pub.mn), fd: !!pub.fd, shape: pub.es, tube: pub.tb, glow: pub.g, foot }); return; }
    } catch { /* the gilded card below */ }
  }
  const { memberCard } = await lazyImport(import('../screens/profile.js'), '../screens/profile.js');
  openPfSheet({ kicker: 'THEIR CARD', title: String(name || '').toUpperCase(), cls: 'rc-card-sheet', body: [memberCard(pub, { name, color, avatar: av }, pub ? pub.x : 0), foot] });
}

// ------------------------------------------------------------------------------------------------ the profile's FRIENDS section
const SHOW = 5;
export function friendsSection(o = {}) {
  frSheet();
  const body = h('div.fr-body', h('p.fr-hint', 'Loading your friends…'));
  const count = h('span.fr-count');
  const el = h('section.pf-sec.fr-sec', { 'aria-label': 'Friends' }, h('h3.pf-h.fr-h', h('span', 'FRIENDS'), count), body, pushRow(),
    // (DM2 — YOUR TABLE: today's table in short — one line per live daily (your place at the table, or WAITING) + SEE SCORES › (the DAILY
    //  screen's SCORES tab). Nothing at all while no daily is live (THE GO-LIVE SWITCH off / /api down))
    tableCard(), ...(o.extra || []));
  const paint = S => {
    if (!S) { count.textContent = ''; body.replaceChildren(h('p.fr-hint', 'Your friends show here when the membership office is open.')); return; }
    count.textContent = S.friends.length ? `${S.friends.length}` : '';
    const kids = [];
    if (S.in.length) kids.push(h('div.fr-group.fr-req', h('h4.fr-gh', `REQUESTS · ${S.in.length}`), ...S.in.map(reqRow)));
    if (S.friends.length) {
      // BOARD 2.0 B — THE FRIENDS LIST as SLIM CARDS (the owner, Nov 9): friends IN YOUR ROOM first (the green dot — the only presence), then the
      // rest by THIS WEEK's XP (that number under each card); the top SHOW + "All n friends" (the same cards in a sheet)
      const ord = friendOrder(S.friends);
      const here = ord.filter(c => c.here), rest = ord.filter(c => !c.here);
      const top = [...here, ...rest].slice(0, Math.max(SHOW, here.length));
      if (here.length) kids.push(h('h4.fr-gh', 'IN YOUR ROOM'), cardList(top.filter(c => c.here)));
      const after = top.filter(c => !c.here);
      if (after.length) kids.push(...(here.length ? [h('h4.fr-gh', 'THIS WEEK')] : []), cardList(after));
      if (S.friends.length > top.length) kids.push(row({ icon: ICONS.friends, label: `All ${S.friends.length} friends`, cls: 'fr-all', onClick: () => openAll() }));
    } else kids.push(h('p.fr-empty', 'No friends yet — tap a player’s name tag after a game to add them.'));
    if (S.out.length) kids.push(h('div.fr-group.fr-sent', h('h4.fr-gh', `SENT · ${S.out.length}`), ...S.out.map(sentRow)));
    if (S.recent.length) kids.push(h('div.fr-group.fr-recent', h('h4.fr-gh', 'RECENTLY PLAYED WITH'), ...S.recent.map(recentRow)));
    if (S.blocked.length) kids.push(row({ icon: ICONS.block, ic: '#ff8aa0', label: 'Blocked', value: String(S.blocked.length), cls: 'fr-blocked', onClick: openBlocked }));
    body.replaceChildren(...kids);
  };
  const off = onFriends(S => { if (!el.isConnected && el.dataset.seen) { off(); return; } el.dataset.seen = '1'; paint(S); });
  if (friendsNow()) paint(friendsNow());
  loadFriends({ fresh: true }).then(S => paint(S)).catch(() => paint(null));
  return el;
}
const act = (kind, c, okMsg) => async () => {
  try { await friendDo(kind, { pid: c.pid }); if (okMsg) toast(okMsg, 'ok'); }
  catch (e) { toast(why(e), 'warn'); }
};
function reqRow(c) {
  return h('div.fr-row.is-req', { dataset: { pid: c.pid } }, face(c), who(c), h('span.fr-acts',
    tubeButton('ACCEPT', { kind: 'main', size: 'sm', cls: 'fr-acc', onClick: act('accept', c, `You and ${c.n} are friends`) }),
    tubeButton('DECLINE', { kind: 'secondary', size: 'sm', cls: 'fr-dec', onClick: act('decline', c) })));
}
/** the friends in YOUR ROOM right now (a live, online player whose node names that profile — the room's own green dot) */
function herePids() {
  const out = new Set();
  if (!state.code) return out;
  for (const [uid, p] of Object.entries(state.players || {})) if (p && p.pid && presenceOnline((state.presence || {})[uid])) out.add(p.pid);
  return out;
}
/** in your room first, then by THIS WEEK's XP (the friends answer's `wx`), then by name */
export function friendOrder(list) {
  const here = herePids();
  // (PD-1 GROUP 0: wx null = that friend opted out of the public boards — no number shown, sorted as 0)
  return (list || []).map(c => ({ ...c, here: here.has(c.pid), wx: c.wx == null ? null : Number(c.wx) || 0 }))
    .sort((a, b) => (b.here - a.here) || ((b.wx || 0) - (a.wx || 0)) || String(a.n || '').localeCompare(String(b.n || '')));
}
/** the friends as SLIM CARDS (ui/strip-board.js — never a second strip system): a tap on the card = THE PLAYER PAGE; the line under it: ⋯ (REMOVE /
 *  BLOCK) · HERE (in your room) · the XP this week at its right end. ONE fx surface per list (it goes with the list) */
function cardList(cs) {
  const list = h('ol.fr-cards');
  for (const c of cs) {
    list.append(h('li.fr-crow', { dataset: { pid: c.pid } }, h('div.fr-scard',
      h('button.fr-open', { type: 'button', 'aria-label': `${c.n} — their card`, onclick: () => lazyImport(import('./player-page.js'), './player-page.js').then(m => m.openPlayer({ pid: c.pid, row: c })).catch(() => {}) }),
      h('div.fr-ssub',
        h('button.fr-dots', { type: 'button', 'aria-label': `More for ${c.n}`, html: '<svg viewBox="0 0 16 4" aria-hidden="true"><circle cx="2" cy="2" r="1.8"/><circle cx="8" cy="2" r="1.8"/><circle cx="14" cy="2" r="1.8"/></svg>', onclick: () => openMore(c) }),
        c.here ? h('span.fr-here', h('i.fr-dot', { 'aria-hidden': 'true' }), 'HERE') : null,
        c.wx == null ? null : h('span.fr-wx', c.wx.toLocaleString('en-US'), h('small', 'XP THIS WEEK'))))));
  }
  stripKit().then(K => {
    if (!list.isConnected && !list.dataset.wait) { list.dataset.wait = '1'; requestAnimationFrame(() => dress(K)); return; }
    dress(K);
  }).catch(() => {});
  let done = false;
  function dress(K) {
    if (done) return; done = true;
    const surface = K.createSurface(list, { label: 'friends' });
    cs.forEach((c, i) => { const slot = list.querySelector(`.fr-crow[data-pid="${c.pid}"] .fr-open`); if (!slot) return; const st = stripFor(K, c); slot.append(st.el); stripFx(K, surface, st, i + 1); });
    list.dataset.strips = String(cs.length);
    const iv = setInterval(() => { if (!list.isConnected && list.dataset.seen) { clearInterval(iv); try { surface.destroy(); } catch { /* fine */ } } else if (list.isConnected) list.dataset.seen = '1'; }, 2000);
  }
  return list;
}
function friendRow(c) {
  return h('div.fr-row.is-friend', { dataset: { pid: c.pid } }, face(c), who(c),
    h('button.fr-more', { type: 'button', 'aria-label': `More for ${c.n}`, onclick: () => openMore(c) }, h('span', { 'aria-hidden': 'true' }, '⋯')));
}
function sentRow(c) {
  return h('div.fr-row.is-sent', { dataset: { pid: c.pid } }, face(c), who(c), h('span.fr-acts',
    tubeButton('CANCEL', { kind: 'secondary', size: 'sm', cls: 'fr-cancel', confirm: 'TAP AGAIN', onClick: act('cancel', c) })));
}
function recentRow(c) {
  const b = c.rel === 'out' ? h('span.fr-tag', 'REQUESTED') : c.rel === 'in' ? tubeButton('ACCEPT', { kind: 'main', size: 'sm', cls: 'fr-acc', onClick: act('accept', c, `You and ${c.n} are friends`) })
    : tubeButton('ADD', { kind: 'secondary', size: 'sm', cls: 'fr-add', onClick: act('add', c, 'Friend request sent') });
  return h('div.fr-row.is-recent', { dataset: { pid: c.pid } }, face(c), who(c), h('span.fr-acts', b));
}
/** a friend's ⋯ → REMOVE (quiet) · BLOCK (no more requests) */
function openMore(c) {
  let s = null;
  s = openPfSheet({ kicker: 'YOUR FRIEND', title: String(c.n || '').toUpperCase(), cls: 'fr-more-sheet', body: [
    h('div.fr-row.is-head', face(c), who(c)),
    h('div.sh-row-list',
      row({ icon: ICONS.leave, label: 'Remove friend', sub: 'Quietly — they aren’t told', danger: true, chevron: false, confirm: 'TAP AGAIN TO REMOVE', cls: 'fr-remove', onClick: async () => { await act('remove', c, `${c.n} removed`)(); s.close(); } }),
      row({ icon: ICONS.block, label: 'Block', sub: 'No more requests or invites from them', danger: true, chevron: false, confirm: 'TAP AGAIN TO BLOCK', cls: 'fr-block', onClick: async () => { await act('block', c, `${c.n} blocked`)(); s.close(); } }))] });
}
function openAll() {
  const S = friendsNow(); if (!S) return;
  const list = h('div.fr-group.fr-list.is-all');
  // (BOARD 2.0 B: the whole list as the same slim cards, in the same order)
  let sig = '';
  const paint = X => { const ord = friendOrder(X ? X.friends : []); const k = JSON.stringify(ord.map(c => [c.pid, c.wx, c.here, c.cd, c.n])); if (k === sig) return; sig = k; list.replaceChildren(cardList(ord)); };
  paint(S);
  const off = onFriends(X => { if (!list.isConnected && list.dataset.seen) { off(); return; } list.dataset.seen = '1'; paint(X); });
  openPfSheet({ kicker: 'YOUR CARD', title: `FRIENDS · ${S.friends.length}`, cls: 'fr-all-sheet', body: [list] });
}
function openBlocked() {
  const list = h('div.fr-group.fr-blist');
  const paint = X => {
    const B = X ? X.blocked : [];
    list.replaceChildren(...(B.length ? B.map(c => h('div.fr-row.is-blocked', face(c), who(c), h('span.fr-acts', tubeButton('UNBLOCK', { kind: 'secondary', size: 'sm', cls: 'fr-unblock', onClick: act('unblock', c, `${c.n} unblocked`) })))) : [h('p.fr-empty', 'Nobody blocked.')]));
  };
  paint(friendsNow());
  const off = onFriends(X => { if (!list.isConnected && list.dataset.seen) { off(); return; } list.dataset.seen = '1'; paint(X); });
  openPfSheet({ kicker: 'FRIENDS', title: 'BLOCKED', cls: 'fr-blocked-sheet', body: [h('p.sh-note.is-small', 'They can’t send you requests or invites. Unblocking doesn’t tell them.'), list] });
}

// ------------------------------------------------------------------------------------------------ the INVITE sheet's FRIENDS row
/** { code, share() } → [elements]: your friends, each with INVITE (a push + the card that waits on their next open), then SHARE INVITE LINK */
export function inviteFriendsBlock({ code, share, here = new Set() }) {
  frSheet();
  const list = h('div.fr-group.fr-inv-list', h('p.fr-hint', 'Loading your friends…'));
  const sent = new Map();
  const paint = S => {
    if (!S) { list.replaceChildren(h('p.fr-hint', 'Friends show here when the membership office is open.')); return; }
    if (!S.friends.length) { list.replaceChildren(h('p.fr-empty', 'No friends yet — tap a player’s name tag after a game to add them.')); return; }
    list.replaceChildren(...S.friends.map(c => {
      const inRoom = here.has(c.pid);
      const b = inRoom ? h('span.fr-tag.is-here', h('i.fr-dot', { 'aria-hidden': 'true' }), 'HERE')
        : sent.has(c.pid) ? h('span.fr-tag', 'INVITED')
          : tubeButton('INVITE', { kind: 'secondary', size: 'sm', cls: 'fr-inv', onClick: async () => {
            try {
              const { api } = await lazyImport(import('./api.js'), './api.js');
              const r = await api('profile', { action: 'friendInvite', pid: c.pid, room: code });
              sent.set(c.pid, r); paint(friendsNow());
              toast(`${c.n} is invited`, 'ok', { sub: r.sent ? 'A notification is on its way — and it waits on their card for 30 min.' : 'It waits on their card for 30 min — they’ll see it when they open the app.' });
            } catch (e) { toast(why(e), 'warn'); }
          } });
      return h('div.fr-row.is-inv', { dataset: { pid: c.pid } }, face(c), who(c), h('span.fr-acts', b));
    }));
  };
  if (friendsNow()) paint(friendsNow());
  loadFriends().then(paint).catch(() => paint(null));
  return [
    h('h4.fr-gh', 'FRIENDS'),
    list,
    h('p.fr-small', 'INVITE sends a notification + waits on their card for 30 min. On an iPhone the notification needs the Home Screen app with notifications allowed.'),
    h('h4.fr-gh', 'ANYONE ELSE'),
    tubeButton('SHARE INVITE LINK', { kind: 'secondary', block: true, cls: 'fr-share', onClick: share }),
  ];
}

// ------------------------------------------------------------------------------------------------ INVITE NOTIFICATIONS (this phone)
// Web Push (api/_lib/push.js): an iPhone takes it only from the Home Screen app (iOS 16.4+) with notifications allowed — the row says so.
const pushOk = () => { try { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; } catch { return false; } };
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => { try { return !!navigator.standalone || matchMedia('(display-mode: standalone)').matches; } catch { return false; } };
const keyBytes = b64u => { const s = atob(b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4)); return Uint8Array.from(s, c => c.charCodeAt(0)); };
async function curSub() { try { const r = await navigator.serviceWorker.getRegistration('/'); return r && r.pushManager ? await r.pushManager.getSubscription() : null; } catch { return null; } }
export function pushRow() {
  const slot = h('div.fr-push');
  const can = pushOk() && !(isIOS() && !standalone());
  const paint = (on, sub, busy = false) => {
    const r = row({ icon: ICONS.bell, ic: '#9fd8ff', label: 'Invite notifications', sub, toggle: can && !busy ? v => (v ? turnOn() : turnOff()) : null, on, chevron: false, cls: `fr-push-row${can ? '' : ' is-off'}` });
    slot.replaceChildren(r);
  };
  const say = isIOS() && !standalone() ? 'iPhone: add NEON SPEAKEASY to your Home Screen, open it from there, then turn this on' : !pushOk() ? 'This browser can’t take notifications — invites still wait on your card' : 'A friend’s invite lands on this phone';
  async function turnOn() {
    paint(true, 'Turning on…', true);
    try {
      const { api } = await lazyImport(import('./api.js'), './api.js');
      const st = await api('profile', { action: 'friendPush', op: 'state' });
      if (!st.key) throw new Error('Notifications aren’t set up on the server yet.');
      if ((await Notification.requestPermission()) !== 'granted') throw new Error('Notifications are blocked for this site — allow them in the phone’s settings.');
      const reg = (await navigator.serviceWorker.getRegistration('/')) || await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(st.key) });
      await api('profile', { action: 'friendPush', op: 'sub', sub: sub.toJSON() });
      paint(true, 'ON — a friend’s invite lands on this phone');
    } catch (e) { paint(false, (e && e.message) || 'Couldn’t turn it on'); }
  }
  async function turnOff() {
    paint(false, 'Turning off…', true);
    try { const { api } = await lazyImport(import('./api.js'), './api.js'); const s = await curSub(); await api('profile', { action: 'friendPush', op: 'unsub', endpoint: s ? s.endpoint : undefined }); paint(false, 'Off — invites still wait on your card'); }
    catch (e) { paint(false, (e && e.message) || 'Couldn’t reach the server'); }
  }
  paint(false, can ? 'Checking this phone…' : say);
  if (can) (async () => {
    try { const s = await curSub(); const { api } = await lazyImport(import('./api.js'), './api.js'); const st = await api('profile', { action: 'friendPush', op: 'state', endpoint: s ? s.endpoint : undefined }); paint(!!st.mine, st.mine ? 'ON — a friend’s invite lands on this phone' : say); }
    catch { paint(false, say); }
  })();
  return slot;
}

// ------------------------------------------------------------------------------------------------ DM2 — YOUR TABLE (today, in short)
function tableCard() {
  const el = h('div.fr-table', { 'aria-label': 'Your table', hidden: true });
  Promise.all([lazyImport(import('../daily/today.js'), '../daily/today.js'), lazyImport(import('../daily/today-logic.js'), '../daily/today-logic.js'), lazyImport(import('./me.js'), './me.js')]).then(([T, L, M]) => {
    const metas = {};
    const paint = async t => {
      if (!el.isConnected && el.dataset.on) { off(); return; }
      const ds = (t && t.dailies) || [];
      if (!ds.length) { el.hidden = true; return; }
      await Promise.all(ds.map(async d => { if (!(d.id in metas)) metas[d.id] = await lazyImport(import(`../games/${d.id}/meta.js`), '../games/*/meta.js').catch(() => ({})); }));
      const S = friendsNow(), names = Object.fromEntries(((S && S.friends) || []).map(c => [c.pid, String(c.n || 'FRIEND').toUpperCase()]));
      const me = { pid: M.myPid(), name: 'YOU' };
      const lines = ds.map(d => {
        const tb = L.tableFor(t, d.id, { names, me, better: d.better }), mine = t.mine && t.mine[d.id] != null;
        const m = metas[d.id] || {}, score = mine ? (typeof m.scoreLine === 'function' ? m.scoreLine(t.mine[d.id]) : String(t.mine[d.id])) : '';
        const right = !mine ? 'NOT PLAYED YET' : tb.place && tb.of > 1 ? `${L.ordinal(tb.place)} OF ${tb.of}` : score;
        return h('div.fr-tl', h('span.fr-tn', d.name), h('span.fr-tv', right));
      });
      el.dataset.on = '1';
      el.replaceChildren(h('b.fr-th', 'YOUR TABLE · TODAY'), h('div.fr-tls', ...lines),
        tubeButton('SEE SCORES', { kind: 'secondary', size: 'sm', cls: 'fr-tgo', onClick: () => lazyImport(import('../store.js'), '../store.js').then(st => st.setState({ daily: { v: 'screen', tab: 'scores' } })) }));
      el.hidden = false;
    };
    const off = T.onToday(paint);
    if (T.todayNow()) paint(T.todayNow());
    T.loadToday();
  }).catch(() => {});
  return el;
}
