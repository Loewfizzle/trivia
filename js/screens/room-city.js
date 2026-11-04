// LOBBY 2.0 A — THE ROOM IN THE CITY (docs/harbor/passes/lobby-2a.md; the owner's approved mock lobby-room.png): when you HOST or JOIN
// you STAY ON THE LIVE CITY — no separate lobby screen for the waiting part (app.js routes a City 2.0 room that isn't playing to the title,
// which hands it here; the game start still runs through today's path until LOBBY 2.0 B). This module:
//   · the ROSTER → the city (core/harbor-room.js: two lines of 4 at the door, the host first) — the city's own people at the city's scale,
//     each marked by a RING under the feet (people.js) + their EMBLEM over the head (the tags here: DOM, crisp at 3×, tappable — a tap
//     pops the name + opens their card); the name pops briefly as they arrive; a lost-signal guest lies down (dimmed, the emblem dimmed);
//   · THE ROOM DOCK (room-dock.js): INVITE · YOU · GUESTS · GAMES · CHAT · PLAY / WAITING FOR <HOST>;
//   · the sheets: GUESTS (the guest list — room-guests.js), GAMES / PLAY (the playable games → game-options.js), INVITE (the share sheet);
//   · the notes above the dock: the room closing soon (host: KEEP OPEN), a match on that this phone stepped out of (WATCH).
// EACH PHONE KEEPS ITS OWN CITY (its sky, sun, weather, its local-time events); the ROOM's things are the same on every phone — all of
// them derived from rooms/{CODE} (players, presence, meta, kicked): a refresh / a rejoin / a host change = everyone back in place.
import { h } from '../ui/dom.js';
import { avatar } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { colorHex, GAMES, APP_NAME, ROOM_IDLE_WARN_MS } from '../config.js';
import { state, isHost, setState } from '../store.js';
import { isOnline, idleLeft } from '../core/room-logic.js';
import { roomOrder } from '../core/harbor-room.js';
import { serverNow, dbRef, update as dbUpdate, serverTimestamp } from '../firebase.js';
import { createRoomDock } from './room-dock.js';
import { sfx } from '../audio/sfx.js';
import { openHelp } from '../ui/help.js';

const rgbOf = id => { const x = colorHex(id).replace('#', ''); return [0, 2, 4].map(i => parseInt(x.slice(i, i + 2), 16)); };
export const FRESH_MS = 12000;      // (a player who joined in the last 12 s walks in, even on a phone seeing the room for the first time)
const NAME_MS = 4200, TAP_NAME_MS = 3000;

export function createRoomCity({ scene, sign, dockHost, lightFrom }) {
  let st = state, destroyed = false, raf = 0, dock = null, lastRoster = '';
  const tags = new Map();            // uid → { el, emb, name, bubble, sig, nameUntil }
  const layer = h('div.rc-tags', { 'aria-label': 'The room' });
  document.body.append(layer);
  document.body.classList.add('rc-on');
  const code = () => st.code || '';
  const players = () => st.players || {};
  const hostName = () => ((players()[st.meta && st.meta.hostId] || {}).name || 'the host');

  // ---------------------------------------------------------------- the dock
  dock = createRoomDock({
    invite: () => { sfx('select'); invite(); },
    play: () => { if (!isHost()) { toast(`WAITING FOR ${hostName().toUpperCase()} TO START`, 'info'); return; } sfx('select'); openGames(true); },
    you: () => { sfx('select'); import('./profile.js').then(m => m.openCard()); },
    guests: () => { sfx('select'); openGuests(); },
    games: () => { sfx('select'); openGames(isHost()); },
    chat: () => { sfx('tap'); import('../chat/ui.js').then(m => m.openChat()); },
    note: () => onNote(),
  });
  if (dockHost) dockHost.append(dock.els.door);
  if (sign) setTimeout(() => { if (!destroyed) dock.ringColors(sign, true); }, 60);

  // ---------------------------------------------------------------- INVITE (everyone)
  const inviteUrl = () => `${location.origin}${location.pathname}?room=${code()}`;
  async function invite() {
    const url = inviteUrl(), text = `Get in here — the hush word is ${code()}`;
    import('../audio/lobby-sfx.js').then(m => m.lobbySfx('invite')).catch(() => {});
    if (navigator.share) { try { await navigator.share({ title: APP_NAME, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(url); toast(`INVITE LINK COPIED — THE HUSH WORD IS ${code()}`, 'ok'); } catch { toast(`THE HUSH WORD IS ${code()}`, 'info', 6000); }
  }

  // ---------------------------------------------------------------- GAMES / PLAY: the playable games (the host picks → the options + INITIATE)
  let gamesOpen = null;
  async function openGames(asHost) {
    if (gamesOpen) return;
    const { openPfSheet } = await import('../profile/sheets.js');
    const games = GAMES.filter(g => g.playable);
    const { gameArt } = await import('../ui/game-art.js');
    const list = h('div.rc-games', ...games.map(g => h('button.rc-game', { type: 'button', dataset: { theme: g.theme, game: g.id }, onclick: () => {
      if (!asHost || !isHost()) { openHelp(g.id); return; }
      s.close(); import('./game-options.js').then(m => m.openGameOptions(g, { meta: st.meta }));
    } }, h('span.rc-game-art', gameArt(g.id) || ''), h('span.rc-game-t', h('small', g.tag), h('b', g.name), h('span', g.blurb)), h('i.rc-game-go', '›'))));
    const s = openPfSheet({ kicker: asHost && isHost() ? 'YOU’RE THE HOST' : `${hostName().toUpperCase()} PICKS THE GAME`, title: asHost && isHost() ? 'PICK A GAME' : 'THE GAMES', cls: 'rc-games-sheet',
      body: [list, h('p.pfs-note.is-small', asHost && isHost() ? 'Pick one, set it up, then INITIATE — everyone in the line is dealt in.' : 'Tap one to read how it plays while you wait.')],
      onClose: () => { gamesOpen = null; } });
    gamesOpen = s;
  }

  // ---------------------------------------------------------------- GUESTS: the guest list (room-guests.js) + its yellow dot
  const seenKey = () => `rc:seen:${code()}`;
  let seen = null;
  const loadSeen = () => { try { const v = JSON.parse(sessionStorage.getItem(seenKey()) || 'null'); return Array.isArray(v) ? new Set(v) : null; } catch { return null; } };
  const saveSeen = () => { try { sessionStorage.setItem(seenKey(), JSON.stringify([...seen])); } catch { /* fine */ } };
  let guestsUi = null;
  function openGuests() {
    seen = new Set(Object.keys(players())); saveSeen(); paintDock();
    if (guestsUi) return;
    guestsUi = { pending: true };
    import('./room-guests.js').then(m => m.openGuestList({ get st() { return st; }, openCard: openPlayerCard, onClose: () => { guestsUi = null; } })).then(g => { if (destroyed) { g.close(); return; } guestsUi = g; }).catch(e => { guestsUi = null; console.warn('guests', e); });
  }

  // ---------------------------------------------------------------- a player's card (a tap on their figure or their strip)
  async function openPlayerCard(uid) {
    const p = players()[uid]; if (!p) return;
    popName(uid, TAP_NAME_MS);
    const pub = st.pub && p.pid ? st.pub[p.pid] : null;
    if (pub && pub.cd && pub.cd !== 'card-gilded') {
      try {
        const F = await import('../vault/full.js');
        if (await F.canShowFull(pub.cd)) { const { levelOf } = await import('../core/levels.js'); const { memberLabel } = await import('../core/member.js');
          F.openFullCard(pub.cd, { name: pub.n || p.name, lv: levelOf(pub.x || 0), avatar: pub.a || p.avatar, color: pub.c || p.color, at: pub.at, no: memberLabel(pub.mn), fd: !!pub.fd, shape: pub.es, tube: pub.tb, glow: pub.g }); return; }
      } catch { /* the gilded card below */ }
    }
    const [{ openPfSheet }, { memberCard }] = await Promise.all([import('../profile/sheets.js'), import('./profile.js')]);
    openPfSheet({ kicker: uid === st.uid ? 'YOUR CARD' : 'THEIR CARD', title: String(p.name || '').toUpperCase(), cls: 'rc-card-sheet', body: [memberCard(pub, { name: p.name, color: p.color, avatar: p.avatar }, pub ? pub.x : 0)] });
  }

  // ---------------------------------------------------------------- the tags over the heads (the emblem · the name · the typing bubble)
  function popName(uid, ms) { const T = tags.get(uid); if (T) { T.nameUntil = performance.now() + ms; T.el.classList.add('is-named'); } }
  function tagFor(uid) {
    let T = tags.get(uid);
    if (T) return T;
    const emb = h('span.rc-emb'), name = h('span.rc-name'), bubble = h('span.rc-bubble', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
    const el = h('button.rc-tag', { type: 'button', dataset: { uid } }, bubble, name, emb);
    // (a plain-area tap rule: pointerdown + pointerup, never click — iOS Safari skips click on some elements; this IS a button, but the
    //  tag moves under the finger: the same tap whether it moved or not)
    let down = null;
    el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 14) openPlayerCard(uid); down = null; });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayerCard(uid); } });
    T = { el, emb, name, bubble, sig: '', nameUntil: 0 };
    tags.set(uid, T); layer.append(el);
    return T;
  }
  function paintTags() {
    const P = players(), want = new Set(Object.keys(P));
    for (const uid of want) {
      const p = P[uid], pub = st.pub && p.pid ? st.pub[p.pid] : null, T = tagFor(uid);
      const sig = `${p.name}|${p.color}|${p.avatar}|${pub ? `${pub.es || ''}|${pub.tb || ''}` : ''}`;
      if (sig !== T.sig) {
        T.sig = sig;
        T.name.textContent = String(p.name || '').toUpperCase();
        T.el.style.setProperty('--c', colorHex(p.color));
        T.el.setAttribute('aria-label', `${p.name}${uid === (st.meta && st.meta.hostId) ? ' (host)' : ''} — their card`);
        T.emb.replaceChildren(avatar(p.avatar, p.color, 18));
        if (pub && pub.es) import('../vault/emblem-art.js').then(m => { if (T.sig !== sig || !m.hasArt(pub.es)) return; T.emb.replaceChildren(m.emblemEl({ id: pub.es, avatar: p.avatar, color: p.color, tube: pub.tb, mode: 'quiet' })); }).catch(() => {});
      }
    }
    // (a tag whose player left: kept while they walk off — the city still draws them — then removed in the frame loop)
  }

  // ---------------------------------------------------------------- the frame loop (only while in the room): place the tags
  function frame() {
    raf = 0; if (destroyed) return;
    const boxes = scene && scene.roomBoxes ? scene.roomBoxes() : null, now = performance.now();
    for (const [uid, T] of tags) {
      const b = boxes ? boxes.get(uid) : null, gone = !players()[uid];
      if (!b) { if (gone && !(boxes && boxes.has(uid))) { T.el.remove(); tags.delete(uid); } else T.el.style.opacity = '0'; continue; }
      // (over the head: the box's top; lying = over the body, a little above the ground)
      const cx = b.x + b.w / 2, top = b.y + (b.lie ? b.h * 0.86 * b.lie : 0), x = Math.round(cx * 2) / 2, y = Math.round((top - 3) * 2) / 2;
      T.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const op = (b.a == null ? 1 : b.a) * (b.lie ? 1 - 0.55 * b.lie : 1);
      const ops = op.toFixed(2); if (T.el.style.opacity !== ops) T.el.style.opacity = ops;
      const named = now < T.nameUntil; if (T.el.classList.contains('is-named') !== named) T.el.classList.toggle('is-named', named);
      if (T.el.classList.contains('is-down') !== !!(b.lie > 0.5)) T.el.classList.toggle('is-down', !!(b.lie > 0.5));
    }
    if (dock && lightFrom) lightFrom(dock);
    raf = requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- the dock's state + the notes
  let chatMod = null, offChat = null;
  import('../chat/chat.js').then(m => { if (destroyed) return; chatMod = m; offChat = m.onChat(() => { paintDock(); paintBubbles(); }); paintDock(); }).catch(() => {});
  function paintDock() {
    if (!dock || destroyed) return;
    const P = players(), me = P[st.uid] || {}, ids = Object.keys(P);
    if (!seen) seen = loadSeen() || new Set(ids);
    const unread = chatMod ? chatMod.chat.unread || 0 : 0;
    dock.set({ host: isHost(), hostName: hostName(), guestsDot: ids.some(u => u !== st.uid && !seen.has(u)), chatDot: unread > 0, chatN: unread,
      you: avatar(me.avatar || 'bolt', me.color || 'magenta', 27), youSig: `${me.avatar}|${me.color}`, youAria: `Your card, ${me.name || ''}` });
  }
  function paintBubbles() {
    const ty = chatMod ? chatMod.chat.typing || {} : {}, now = serverNow();
    for (const [uid, T] of tags) { const on = uid !== st.uid && ty[uid] && now - ty[uid] < 6000; if (T.el.classList.contains('is-typing') !== !!on) T.el.classList.toggle('is-typing', !!on); }
  }
  let noteKind = '';
  function paintNotes() {
    const note = dockHost && dockHost.closest('.nd-actions') ? dockHost.closest('.nd-actions').querySelector('.nd-note') : null;
    if (!note || !st.meta) return;
    const live = st.meta.status === 'playing' && st.game && st.quit === st.game.matchId;
    const left = idleLeft(st.meta, serverNow()), idle = !live && left <= ROOM_IDLE_WARN_MS;
    let text = '', kind = '';
    if (live) { const g = GAMES.find(x => x.id === st.game.id); text = `${g ? g.name : 'A GAME'} IS ON — TAP TO WATCH (you’re dealt into the next one)`; kind = 'live'; }
    else if (idle) { const m = Math.max(1, Math.ceil(left / 60000)); text = isHost() ? `ROOM CLOSES IN ${m} MIN — TAP TO KEEP IT OPEN` : `ROOM CLOSES IN ${m} MIN — A GAME KEEPS IT OPEN`; kind = 'idle'; }
    noteKind = kind;
    if (note.textContent !== text) note.textContent = text;
    note.dataset.kind = kind ? 'warn' : '';
    note.classList.toggle('is-on', !!text);
  }
  function onNote() {
    if (noteKind === 'live') setState({ quit: null });
    else if (noteKind === 'idle' && isHost()) dbUpdate(dbRef(`rooms/${code()}/meta`), { activeAt: serverTimestamp() }).then(() => toast('ROOM KEPT OPEN FOR ANOTHER HOUR', 'ok')).catch(() => toast('COULD NOT REACH THE ROOM', 'err'));
  }
  const noteT = setInterval(() => { if (!destroyed) { paintNotes(); paintBubbles(); } }, 2000);

  // ---------------------------------------------------------------- the roster → the city
  function roster() {
    const P = players(), order = roomOrder(P, st.meta && st.meta.hostId), now = serverNow();
    const list = order.map(o => ({ uid: o.uid, slot: o.slot, online: isOnline(st.presence, o.uid), col: rgbOf(P[o.uid].color), fresh: now - (P[o.uid].joinedAt || 0) < FRESH_MS }));
    list.kicked = Object.keys(st.kicked || {});
    return list;
  }
  function update(s) {
    st = s;
    if (destroyed || !st.code) return;
    paintTags();   // (first: a tag must exist before its name pops)
    const list = roster(), key = list.map(q => `${q.uid}${q.slot}${q.online ? 1 : 0}`).join(',');
    if (key !== lastRoster) {
      const before = new Set(lastRoster ? lastRoster.split(',').map(x => x.slice(0, -3)) : []);
      lastRoster = key;
      if (scene && scene.room) scene.room(list);
      // (a new guest: their name pops as they arrive; the friend's clink — room-guests / lobby-sfx — Group 2)
      for (const q of list) if (before.size && ![...before].some(b => b.startsWith(q.uid))) { popName(q.uid, NAME_MS + 6000); if (q.uid !== st.uid) import('../audio/lobby-sfx.js').then(m => m.lobbySfx('friend')).catch(() => {}); }
      if (!before.size) for (const q of list) if (q.fresh) popName(q.uid, NAME_MS + 8000);
    }
    if (scene && scene.hush) scene.hush(st.code);
    paintDock();
    paintNotes();
    if (guestsUi && guestsUi.update) guestsUi.update(st);
    if (!raf) raf = requestAnimationFrame(frame);
  }

  return {
    update,
    dock,
    debug: () => ({ tags: [...tags.keys()], roster: roster(), seen: seen ? [...seen] : null }),
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); clearInterval(noteT); if (offChat) offChat();
      if (scene && scene.room) scene.room(null);
      if (scene && scene.hush) scene.hush(null);
      layer.remove(); document.body.classList.remove('rc-on');
      if (dock) { dock.els.door.remove(); dock.destroy(); }
      if (guestsUi && guestsUi.close) guestsUi.close();
      if (gamesOpen) gamesOpen.close();
    },
  };
}
