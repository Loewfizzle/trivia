// FRIENDS A — INVITES THAT WAIT (the owner, Nov 7 9:48 pm): a friend's INVITE is a web push AND a card waiting on the server; on this phone's
// next open (the title, a moment after the reveal) the card shows "BEN invited you · JOIN ROOM XXXX" — JOIN · NOT NOW — while that room is
// still open; it expires when the room closes or after ~30 min (the server's inviteCheck prunes). NEVER DURING A MATCH: held, shown after it.
// ONE /api call (never a socket — a parked title stays parked: CONN); it also brings the requests badge's count.
import { h } from '../ui/dom.js';
import { avatar, tubeButton } from '../ui/components.js';
import { state } from '../store.js';
import { testMode } from '../identity.js';
import { api } from './api.js';
import { myPid } from './me.js';
import { setBadge } from './friends.js';
import { frSheet } from './friends-ui.js';

let card = null, waitT = 0, checking = null;
const inMatch = () => !!(state.code && state.meta && state.meta.status === 'playing');

/** → the waiting invites (shown one at a time, newest first) — o.busy(): a legendary on screen (the card waits for it) */
export function checkInvites(o = {}) {
  if (testMode || !myPid()) return Promise.resolve([]);
  if (checking) return checking;
  checking = (async () => {
    try {
      const r = await api('profile', { action: 'inviteCheck' });
      if (typeof r.frIn === 'number') setBadge(r.frIn);
      const list = (r.invites || []).filter(x => x.room !== state.code);
      for (const x of (r.invites || []).filter(y => y.room === state.code)) api('profile', { action: 'inviteDismiss', pid: x.pid }).catch(() => {});   // (already in that room)
      if (list.length) showWhenFree(list, o);
      return list;
    } catch { return []; }
    finally { checking = null; }
  })();
  return checking;
}

function showWhenFree(list, o) {
  clearTimeout(waitT);
  const now = Date.now(), live = list.filter(x => x.until > now);
  if (!live.length) return;
  if (inMatch() || card || (o.busy && o.busy()) || document.querySelector('.sh.is-open, .vl-full')) { waitT = setTimeout(() => showWhenFree(live, o), 4000); return; }
  show(live[0], () => showWhenFree(live.slice(1), o));
}

function show(x, next) {
  frSheet();
  const close = (dismiss = true) => {
    if (!card) return;
    const el = card; card = null;
    el.classList.add('is-out'); setTimeout(() => el.remove(), 300);
    if (dismiss) api('profile', { action: 'inviteDismiss', pid: x.pid }).catch(() => {});
    setTimeout(next, 600);
  };
  const join = tubeButton('JOIN', { kind: 'main', cls: 'fr-wait-join', onClick: async () => {
    close(true);
    // (the normal join: the title dock's knock — LOCK THE DOOR, kicked, a full room answer as for any join; a closed room says so)
    const { setState } = await import('../store.js');
    if (state.code) { try { const R = await import('../room.js'); await R.leaveRoom(); } catch { /* the join below still knocks */ } }
    setState({ invite: x.room, autoJoin: x.room });   // (title.js knocks once it sees it — dk.join)
  } });
  const later = tubeButton('NOT NOW', { kind: 'secondary', cls: 'fr-wait-later', onClick: () => close(true) });
  const left = Math.max(1, Math.round((x.until - Date.now()) / 60e3));
  card = h('div.fr-wait', { role: 'dialog', 'aria-label': `${x.n} invited you` },
    h('div.fr-wait-top', avatar(x.card && x.card.a, x.card && x.card.c, 38),
      h('div.fr-wait-t', h('small', 'A FRIEND’S INVITE'), h('b', `${String(x.n || 'A friend').toUpperCase()} invited you · JOIN ROOM ${x.room}`),
        h('small.fr-wait-left', { style: { letterSpacing: '0.08em', color: 'rgba(226,232,255,0.76)' } }, `the invite waits ${left} more min`))),
    h('div.fr-wait-acts', later, join));
  document.body.append(card);
  // (a closed room or the 30 min: the card goes by itself)
  setTimeout(() => { if (card && Date.now() >= x.until) close(false); }, Math.max(0, x.until - Date.now()) + 50);
}

/** the preview / the tests: the card for a scripted invite (nothing is sent) */
export function previewInvite(x) { show({ pid: 'preview', n: 'BEN', room: 'MOON', at: Date.now(), until: Date.now() + 30 * 60e3, ...x }, () => {}); }
