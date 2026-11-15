// LOBBY 2.0 A — THE GUEST LIST (GUESTS on the room dock → a glass sheet): everyone in the room as their SLIM CARD STRIP (the stepped plate —
// js/vault/strip.js), on ONE shared effect surface, animated GENTLY (the calm cut; a legendary holds its lit still frame — the prominence
// rule: never 8 full shows at once); the host marked (LV n · HOST), a lost-signal guest dimmed (SIGNAL LOST); a tap on a strip = their card.
// The host's KICK (a second tap confirms) + LOCK THE DOOR live here (today's rules). Only APPROVED art shows (js/vault/approved.js) — a card the
// owner hasn't approved keeps its plain palette. THE JOIN ENTRANCE: a joiner's strip slides in playing its FULL animation once (~3.2 s),
// then settles into the calm cut; its card-in sound (audio/lobby-sfx.js).
//   openGuestList({ st (a live getter), openCard(uid), onClose }) → { update(st), close() }
import { row, tubeButton } from '../ui/components.js';
import { h } from '../ui/dom.js';
import { afterTap } from '../ui/tapwatch.js';
import { holdCity } from '../ui/city-hold.js';
import { toast } from '../ui/toast.js';
import { isHost } from '../store.js';
import { isOnline } from '../core/room-logic.js';
import { roomOrder } from '../core/harbor-room.js';
import { levelOf } from '../core/levels.js';
import { ITEM } from '../core/items.js';
import { kickPlayer, setDoorLocked, leaveRoom } from '../room.js';
import { sfx } from '../audio/sfx.js';
import { nightStandings } from '../core/night.js';
import { MAX_PLAYERS } from '../config.js';
import { memberLabel } from '../core/member.js';
import { lazyImport } from '../ui/lazy-import.js';

export const ENTRANCE_MS = 3200;
// CITY C 0d — THE 8-CARD LOBBY (CITY A left it open: ~4.6–5.3 s to appear at 4× CPU — every module first, then 8 strips built in one go while
// the city still drew its ~200 ms frames): the CITY HOLDS first (its frames stop — the main thread is the list's), the sheet opens with the
// names at once (a plain row a guest), then the strips fill in ONE PER FRAME (the stills), then the live art one per frame.
export async function openGuestList(ctx) {
  let unhold = ctx.hold || holdCity(), closedEarly = false;
  const { openPfSheet } = await lazyImport(import('../profile/sheets.js'), '../profile/sheets.js');
  const list = h('div.rg-list'), count = h('span.rg-count'), lockRow = h('div.rg-lock'), night = h('div.rg-night');
  const surfHost = h('div.rg-strips');
  list.append(surfHost);
  // (the names at once: a plain row per guest, replaced by its strip — never a blank sheet)
  { const st = ctx.st, P = st.players || {};
    for (const { uid } of roomOrder(P, st.meta && st.meta.hostId)) surfHost.append(h('div.rg-row.rg-ph', { dataset: { uid, ph: '1' } }, h('span', String((P[uid] || {}).name || '').toUpperCase())));
    count.textContent = `${surfHost.children.length} / ${MAX_PLAYERS}`; }
  let surface = null, paint = () => {};
  const leave = tubeButton('LEAVE ROOM', { kind: 'danger', block: true, cls: 'rg-leave', confirm: 'TAP AGAIN TO LEAVE', onClick: () => { sheet.close(); leaveRoom(); } });
  const sheet = openPfSheet({ kicker: 'THE GUEST LIST', title: 'IN THE ROOM', cls: 'rg-sheet', body: [h('div.rg-h', count), list, lockRow, night, leave],
    onClose: () => { closedEarly = true; if (unhold) { unhold(); unhold = null; } if (surface) surface.destroy(); if (ctx.onClose) ctx.onClose(); } });
  const [V, { FX }, { cardVars }, { approvedIds }, { isOneOfOne }, { lobbySfx }] = await Promise.all([
    lazyImport(import('../vault/strip.js'), '../vault/strip.js'), lazyImport(import('../fx/index.js'), '../fx/index.js'), lazyImport(import('../progress/look.js'), '../progress/look.js'), lazyImport(import('../vault/approved.js'), '../vault/approved.js'), lazyImport(import('../core/dev-cards.js'), '../core/dev-cards.js'), lazyImport(import('../audio/lobby-sfx.js'), '../audio/lobby-sfx.js')]);
  // (LOBBY 2.0 B — the owner's ADD-ON: LEAVE ROOM at the foot of the guest list — red-edged, a second tap = "SURE?")
  // (SHELL 2.0 A: the danger tube; the second tap = the button itself red — ui/components.js#confirmTap)
  const { createSurface } = await lazyImport(import('../fx/renderer.js'), '../fx/renderer.js');
  if (closedEarly) return { update: () => {}, close: () => {} };
  V.vaultSheet();
  let approved = new Set();
  surface = createSurface(surfHost, { label: 'guests' });
  const rows = new Map();     // uid → { el, sig, slot }
  let kickArmed = { uid: null, at: 0 }, first = true, lockBusy = false;
  // (CITY FIXES — the owner, Nov 8: THE GUEST LIST PAUSES THE CITY behind it — THE ROOM's OWN COST: 8 live strips + the full city at 4× CPU
  //  were +7.2 ms. The shared, COUNTED hold (ui/city-hold.js — the full card's + the dailies'): the city keeps its last frame while the list is up,
  //  and runs on from the same clock on close — no jump; a full card opened from a strip just adds its own hold)
  // (0d: the approved list re-dresses the strips through the same one-per-frame queue — never 8 rebuilt in one go)
  approvedIds().then(a => { approved = new Set(a || []); if (closedEarly) return; for (const [uid, r] of rows) { r.sig = ''; pendingIds.add(uid); queue(() => { if (rows.get(uid) === r) paint(uid); }); } }).catch(() => {});

  function stripOf(uid, p, pub, st) {
    const host = st.meta && st.meta.hostId === uid, card = (pub && pub.cd) || 'card-gilded', tier = (ITEM[card] || {}).tier || 'common';
    const real = !!(approved.has(card) && V.LOOKS[card]);
    const el = V.stripEl({ card: real ? card : null, tier, plain: real ? null : cardVars(card), name: String((pub && pub.n) || p.name || '').toUpperCase(), lv: levelOf((pub && pub.x) || 0), host,
      emblem: pub && pub.es, avatar: p.avatar, color: p.color, tube: pub && pub.tb, glow: pub && pub.g, no: pub ? memberLabel(pub.mn) : null });
    return { el, real, card };
  }
  // (0d: the first fill — ONE strip per frame (the still), then the live art ONE per frame; a later paint (a join, a change) builds at once)
  const later = [], liveLater = [], pendingIds = new Set();
  let pumping = false;
  const pump = () => {
    if (closedEarly) return;
    const job = later.shift() || liveLater.shift();
    if (job) { try { job(); } catch (e) { console.warn('[guests] strip', e); } }
    if (later.length || liveLater.length) requestAnimationFrame(pump); else pumping = false;
  };
  const queue = (job, live) => { (live ? liveLater : later).push(job); if (!pumping) { pumping = true; requestAnimationFrame(pump); } };
  paint = function paintList(only = null) {
    const st = ctx.st, P = st.players || {}, order = roomOrder(P, st.meta && st.meta.hostId), host = isHost();
    count.textContent = `${order.length} / ${MAX_PLAYERS}${st.meta && st.meta.locked ? ' · THE DOOR IS LOCKED' : ''}`;
    const seen = new Set();
    order.forEach(({ uid }, i) => {
      seen.add(uid);
      const p = P[uid], pub = st.pub && p.pid ? st.pub[p.pid] : null, off = !isOnline(st.presence, uid);
      const sig = JSON.stringify([p.name, p.color, p.avatar, pub && [pub.n, pub.x, pub.cd, pub.es, pub.tb, pub.g], off, st.meta && st.meta.hostId, host, kickArmed.uid === uid, [...approved].length]);
      let r = rows.get(uid);
      if (!r || r.sig !== sig) {
        // (0d: the first fill waits its frame — the name row holds the place; its sig left empty so a change before then rebuilds it)
        if (first && !r) {
          const ph = [...surfHost.children].find(c => c.dataset.ph && c.dataset.uid === uid) || h('div.rg-row.rg-ph', { dataset: { uid, ph: '1' } }, h('span', String(p.name || '').toUpperCase()));
          r = { el: ph, sig: '' }; rows.set(uid, r); pendingIds.add(uid);
          queue(() => { if (rows.get(uid) === r) paint(uid); });
          if (surfHost.children[i] !== r.el) surfHost.insertBefore(r.el, surfHost.children[i] || null);
          return;
        }
        // (a strip still waiting its frame stays a name row until its own job — `only` — comes round)
        if (r && r.sig === '' && pendingIds.has(uid) && only !== uid) { if (surfHost.children[i] !== r.el) surfHost.insertBefore(r.el, surfHost.children[i] || null); return; }
        pendingIds.delete(uid);
        const { el, real, card } = stripOf(uid, p, pub, st);
        const kick = host && uid !== st.uid ? h('button.rg-kick', { type: 'button', 'aria-label': `Kick ${p.name}`, onclick: e => { e.stopPropagation(); onKick(uid, p.name); } }, kickArmed.uid === uid ? 'KICK?' : '✕') : null;
        const row = h('div.rg-row', { 'data-press': true, dataset: { uid }, class: `${off ? 'is-off' : ''}${uid === st.uid ? ' is-me' : ''}`, role: 'button', tabindex: '0', 'aria-label': `${p.name}${off ? ' — signal lost' : ''} — their card`,
          onclick: () => ctx.openCard(uid), onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ctx.openCard(uid); } } },
          el, off ? h('span.rg-off', 'SIGNAL LOST') : null, kick);
        if (isOneOfOne(card) && real) lazyImport(import('../vault/dress.js'), '../vault/dress.js').then(m => m.oneOfOne(el)).catch(() => {});
        // THE JOIN ENTRANCE: a strip that wasn't in the list when it opened slides in at its FULL animation once, then the calm cut
        const fresh = !r && !first;
        if (r) { const old = r.el.querySelector('.vl-strip'); if (old) surface.remove(old); r.el.replaceWith(row); }
        else { surfHost.append(row); if (fresh) { row.classList.add('is-in'); lobbySfx('card-in'); } }
        const look = V.LOOKS[card];
        if (real && look && look.fx && FX[look.fx]) {
          const addLive = () => { if (!row.isConnected) return; const sl = surface.add(el, FX[look.fx], V.fxOpts(card, { seed: i + 1, calm: fresh ? 0 : 1, radius: 12 })); if (fresh) setTimeout(() => { sl.opts = { ...sl.opts, calm: 1 }; }, ENTRANCE_MS); };
          if (filling) queue(addLive, true); else addLive();   // (0d: the first fill's live art after every still is up, one per frame)
        }
        r = { el: row, sig };
        rows.set(uid, r);
      }
      if (surfHost.children[i] !== r.el) surfHost.insertBefore(r.el, surfHost.children[i] || null);
    });
    for (const el of [...surfHost.children]) if (el.dataset.ph && !seen.has(el.dataset.uid)) el.remove();
    for (const [uid, r] of rows) if (!seen.has(uid)) { { const old = r.el.querySelector('.vl-strip'); if (old) surface.remove(old); } r.el.classList.add('is-out'); setTimeout(() => r.el.remove(), 280); rows.delete(uid); }
    // LOCK THE DOOR (host only): no new players; everyone inside keeps their seat
    const locked = !!(st.meta && st.meta.locked === true);
    lockRow.hidden = !host;
    // (SHELL 2.0 A: THE ROW with the pink switch)
    // (CITY FIXES — THE TAP WATCH: rebuilt only when it CHANGES — it was replaced on every room update (presence included): a tap on it lost)
    const lockSig = host ? String(locked) : '';
    if (host && lockRow.dataset.sig !== lockSig) lockRow.replaceChildren(row({ icon: 'lock', ic: '#ffd84a', label: locked ? 'The door is locked' : 'Lock the door', sub: locked ? 'No new players · tap to open' : 'Anyone with the word can join', cls: 'rg-lockbtn', toggle: () => toggleLock(), on: locked }));
    lockRow.dataset.sig = lockSig;
    // GAME NIGHT (every match played in this room): 3 / 2 / 1 points
    const nr = nightStandings(st.night, P);
    night.hidden = !nr.length;
    if (nr.length) night.replaceChildren(h('div.pg-prof-h', h('span', 'GAME NIGHT'), h('em', `${Object.keys(st.night || {}).length} played`)),
      h('ol.rg-night', ...nr.map(r => h('li', h('b', r.leader ? '♛' : String(r.rank)), h('span', (P[r.uid] || {}).name || r.name), h('em', `${r.points} pts`)))));
    first = false;
  };
  function onKick(uid, name) {
    if (kickArmed.uid === uid && Date.now() - kickArmed.at < 3000) {
      kickArmed = { uid: null, at: 0 };
      kickPlayer(uid).then(() => toast(`${String(name || 'The player')} was shown out`, 'ok')).catch(() => toast('KICK FAILED', 'err'));
      return;
    }
    kickArmed = { uid, at: Date.now() }; paint();
    setTimeout(() => { if (kickArmed.uid === uid) { kickArmed = { uid: null, at: 0 }; paint(); } }, 3000);
  }
  async function toggleLock() {
    if (lockBusy || !isHost()) return;
    lockBusy = true;
    const on = !(ctx.st.meta && ctx.st.meta.locked === true);
    sfx(on ? 'lock' : 'tap');
    try { await setDoorLocked(on); toast(on ? 'DOOR LOCKED' : 'DOOR OPEN', 'ok'); } catch { toast('COULDN’T REACH THE DOOR — TRY AGAIN', 'err'); }
    lockBusy = false;
  }
  let filling = true;
  paint();
  queue(() => { filling = false; });   // (the first fill's stills are all queued before this — the live art after it is the normal path)
  // (CITY FIXES — THE TAP WATCH: a room update never repaints the list under a finger — it waits until the tap has landed)
  return { update: () => afterTap(paint), close: () => sheet.close() };
}
