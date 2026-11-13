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
import { tapHandled } from '../ui/tapwatch.js';
import { h } from '../ui/dom.js';
import { avatar, row } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { colorHex, GAMES, APP_NAME, ROOM_IDLE_WARN_MS, isOwnerTest } from '../config.js';
import { state, isHost, setState } from '../store.js';
import { isOnline, idleLeft } from '../core/room-logic.js';
import { roomOrder } from '../core/harbor-room.js';
import { exitHow } from '../room.js';
import { serverNow, dbRef, update as dbUpdate, serverTimestamp } from '../firebase.js';
import { createRoomDock } from './room-dock.js';
import { sfx } from '../audio/sfx.js';
import { openHelp } from '../ui/help.js';
import { reducedMotion } from '../ui/dom.js';
import { closeAll } from '../ui/layers.js';
import { startShow, fileInOrder, backShow, voteState, GO_DEAD_MS, goWaiting } from '../core/room-show.js';
import { createRoomBanner } from './room-banner.js';
import { lazyImport } from '../ui/lazy-import.js';

const rgbOf = id => { const x = colorHex(id).replace('#', ''); return [0, 2, 4].map(i => parseInt(x.slice(i, i + 2), 16)); };
export const FRESH_MS = 12000;      // (a player who joined in the last 12 s walks in, even on a phone seeing the room for the first time)
// (LOBBY FIXES — AN INTENTIONAL LEAVE: the owner saw TESTER lie down (the lost-signal pose), get up, THEN wave + walk off. A leave removes the
//  player node + their presence in ONE update, but each phone hears the two paths as two events — presence first → the lie-down. A presence
//  drop now waits LOST_GRACE_MS before the lie-down: a leave's node goes inside it → straight to the wave + the walk-off; a real lost signal
//  lies down a moment later)
export const LOST_GRACE_MS = 1500;
const NAME_MS = 4200, TAP_NAME_MS = 3000;

export function createRoomCity({ scene, sign, dockHost, lightFrom }) {
  // (FRIENDS C — THE SLOW-3G START: the cartridges' module lists fetched now, in the lobby — the start then puts a whole graph on the wire at once)
  //  + THE LOBBY IS THE LOADING TIME: a few seconds in, the playable cartridges' graphs are WIRED (modulepreload — fetched + parsed, never run;
  //  the guests only learn the game at the start, and a slow line needs the lobby's wait) — not on a Save-Data line
  const wireT = setTimeout(() => { if (navigator.connection && navigator.connection.saveData) return; Promise.all([lazyImport(import('../games/registry.js'), '../games/registry.js'), lazyImport(import('../games/preload.js'), '../games/preload.js')]).then(([R, P]) => { for (const id of Object.keys(R.META)) P.wireGame(id); }).catch(() => {}); }, (typeof window !== 'undefined' && window.__wireDelay) || 4000);   // (__wireDelay: the slow-3G E2E's hook)
  lazyImport(import('../games/preload.js'), '../games/preload.js').catch(() => {});
  let st = state, destroyed = false, raf = 0, dock = null, lastRoster = '';
  const tags = new Map();            // uid → { el, emb, name, bubble, sig, nameUntil }
  const layer = h('div.rc-tags', { 'aria-label': 'The room' });
  document.body.append(layer);
  document.body.classList.add('rc-on');
  const code = () => st.code || '';
  const players = () => st.players || {};
  const hostName = () => ((players()[st.meta && st.meta.hostId] || {}).name || 'the host');
  // (PLAY NOW — a SOLO room (meta.settings.solo.on — read from the room's own data, no import): no hush word on the door, no host card,
  //  no invite; its lobby is only the instant before THE SOLO START)
  const soloRoom = () => !!(st.meta && st.meta.settings && st.meta.settings.solo && st.meta.settings.solo.on === true);

  // ---------------------------------------------------------------- the dock
  dock = createRoomDock({
    invite: () => { sfx('select'); invite(); },
    play: () => {
      // (LOBBY 2.0 B — THE REMATCH RING: the host's tap = the same game + settings, everyone in (incl. late joiners — host.js#rematch); a
      //  guest's tap = their VOTE (again = take it back); nothing ever starts by itself)
      const vs = voteNow();
      if (vs.on) { if (isHost()) { sfx('select'); lazyImport(import('../host.js'), '../host.js').then(m => m.rematch()).catch(() => {}); } else toggleVote(vs); return; }
      if (!isHost()) { toast(`Waiting for ${hostName()} to start`, 'info'); return; }
      sfx('select'); openGames(true);
    },
    you: () => { sfx('select'); lazyImport(import('./profile.js'), './profile.js').then(m => m.openCard()); },
    guests: () => { sfx('select'); openGuests(); },
    games: () => { sfx('select'); ngTapped(); openGames(isHost()); },
    chat: () => { sfx('tap'); lazyImport(import('../chat/ui.js'), '../chat/ui.js').then(m => m.openChat()); },
    note: () => onNote(),
  });
  if (dockHost) dockHost.append(dock.els.door);
  // (PLAY NOW — PLAY WITH FRIENDS: the card's game PRESELECTED — once this phone hosts its fresh room, the options sheet opens on that game)
  const pickT = setTimeout(() => {
    let id = null; try { id = sessionStorage.getItem('nd:pick'); sessionStorage.removeItem('nd:pick'); } catch { /* fine */ }
    const g = id && GAMES.find(x => x.id === id && x.playable);
    if (!g || destroyed || !isHost() || soloRoom()) return;
    lazyImport(import('./game-options.js'), './game-options.js').then(m => { if (!destroyed) m.openGameOptions(g, { meta: st.meta }); }).catch(() => {});
  }, 700);
  if (sign) setTimeout(() => { if (!destroyed) dock.ringColors(sign, true); }, 60);

  // ---------------------------------------------------------------- INVITE (everyone)
  const inviteUrl = () => `${location.origin}${location.pathname}?room=${code()}`;
  // FRIENDS A — THE INVITE SHEET: with friends on this card, INVITE opens a sheet — FRIENDS at the top (each INVITE = a push + the card that
  // waits), SHARE INVITE LINK under it; with none (or /api down) it shares at once, as before. Decided from the CACHED list, inside the tap
  // (the system share sheet needs the tap's own gesture — never after a network wait); the list is fetched when the room opens.
  let frMod = null;
  let offFr = null;
  lazyImport(import('../profile/friends.js'), '../profile/friends.js').then(m => { if (destroyed) return; frMod = m; offFr = m.onFriends(() => paintFriends()); m.loadFriends().then(() => paintFriends()).catch(() => {}); }).catch(() => {});
  // (THE GREEN DOT — ONLINE STATUS = NONE everywhere else: a FRIEND here, in this room with you, online — a dot on their emblem)
  function paintFriends() {
    if (!frMod || destroyed) return;
    const F = frMod.friendsHere(players());
    for (const [uid, T] of tags) { const on = uid !== st.uid && F.has(uid) && isOnline(st.presence, uid); if (T.el.classList.contains('is-friend') !== on) T.el.classList.toggle('is-friend', on); }
  }
  let invSheet = null;
  function invite() {
    const S = frMod && frMod.friendsNow();
    if (!S || !S.friends.length || invSheet) { shareLink(); return; }
    invited(true); closeHostCard(); paintDock();
    lazyImport(import('../audio/lobby-sfx.js'), '../audio/lobby-sfx.js').then(m => m.lobbySfx('invite')).catch(() => {});
    const here = new Set(Object.values(players()).map(p => p && p.pid).filter(Boolean));
    Promise.all([lazyImport(import('../profile/friends-ui.js'), '../profile/friends-ui.js'), lazyImport(import('../profile/sheets.js'), '../profile/sheets.js')]).then(([F, { openPfSheet }]) => {
      if (destroyed) return;
      invSheet = openPfSheet({ kicker: `THE HUSH WORD IS ${code()}`, title: 'INVITE', cls: 'fr-invite-sheet', body: F.inviteFriendsBlock({ code: code(), here, share: () => shareLink(true) }), onClose: () => { invSheet = null; } });
    }).catch(() => shareLink());
  }
  async function shareLink(quiet = false) {
    invited(true); closeHostCard(); paintDock();
    const url = inviteUrl(), text = `Get in here — the hush word is ${code()}`;
    if (!quiet) lazyImport(import('../audio/lobby-sfx.js'), '../audio/lobby-sfx.js').then(m => m.lobbySfx('invite')).catch(() => {});
    if (navigator.share) { try { await navigator.share({ title: APP_NAME, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(url); toast('Invite link copied', 'ok', { sub: `The hush word is ${code()}.` }); } catch { toast(`The hush word is ${code()}`, 'info', 6000); }
  }

  // ---------------------------------------------------------------- LOBBY FIXES — AFTER HOST: HOW TO SHARE (the owner, Nov 4 2:28–2:29 pm: "after
  // HOST nothing says how to share the room" — the old lobby popped the hush word + SHARE). On HOST, every host, every time: a short glass card
  // "YOUR ROOM IS OPEN — THE HUSH WORD IS MINT" + a big SHARE INVITE + "or tap INVITE anytime"; it closes itself after HOST_CARD_MS or on a tap;
  // the INVITE ring breathes until the host invites someone or a guest arrives (room-dock.js#rdk-pulse)
  const HOST_CARD_MS = 8000;
  const flag = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k) === '1'; sessionStorage.setItem(k, '1'); } catch { /* fine */ } return false; };
  const invited = v => flag(`rc:inv:${code()}`, v ? true : undefined);
  let hostCard = null;
  function closeHostCard() {
    if (!hostCard) return;
    const { el, t, off } = hostCard; hostCard = null; clearTimeout(t); off();
    el.classList.add('is-out'); setTimeout(() => el.remove(), reducedMotion() ? 0 : 320);
  }
  function maybeHostCard() {
    if (hostCard || destroyed || !isHost() || !st.meta || !code() || soloRoom()) return;
    const P = players(), mine = Object.keys(P).length === 1 && P[st.uid];
    const fresh = st.meta.createdAt && serverNow() - st.meta.createdAt < 20000;
    if (!mine || !fresh || flag(`rc:hc:${code()}`)) return;
    flag(`rc:hc:${code()}`, true);
    const share = h('button.btn.btn-primary.btn-block.rc-hc-share', { type: 'button', onclick: e => { e.stopPropagation(); sfx('select'); shareLink(); } }, 'SHARE INVITE');   // (SHELL 2.0 A: THE NEON TUBE's main)
    const el = h('div.rc-hostcard', { role: 'status', 'aria-live': 'polite' },
      h('small.rc-hc-k', 'YOUR ROOM IS OPEN'),
      h('b.rc-hc-t', 'THE HUSH WORD IS ', h('span.rc-hc-w', code())),
      share,
      h('p.rc-hc-or', 'or tap INVITE anytime'));
    document.body.append(el);
    // (a tap anywhere — but SHARE — closes it; so does the clock)
    const onDown = e => { if (!e.target.closest || !e.target.closest('.rc-hc-share')) closeHostCard(); };
    setTimeout(() => { if (hostCard && hostCard.el === el) document.addEventListener('pointerdown', onDown, true); }, 250);
    hostCard = { el, t: setTimeout(closeHostCard, HOST_CARD_MS), off: () => document.removeEventListener('pointerdown', onDown, true) };
  }

  // (LOBBY FIXES — AFTER THE MATCH: NEW GAME breathes until the host taps it — once per match back in the room)
  const ngKey = () => `rc:ng:${code()}:${(st.meta && st.meta.back && st.meta.back.m) || ''}`;
  const ngSeen = () => flag(ngKey());
  const ngTapped = () => { if (isHost() && voteNow().on) { flag(ngKey(), true); paintDock(); } };

  // ---------------------------------------------------------------- GAMES / PLAY: the playable games (the host picks → the options + INITIATE)
  let gamesOpen = null;
  async function openGames(asHost) {
    if (gamesOpen) return;
    const { openPfSheet } = await lazyImport(import('../profile/sheets.js'), '../profile/sheets.js');
    const games = GAMES.filter(g => g.playable || (asHost && isOwnerTest(g.id)));   // (HE8 — THE OWNER'S LIVE TEST: a game being built, on the owner's host phone only)
    const { gameArt } = await lazyImport(import('../ui/game-art.js'), '../ui/game-art.js');
    const list = h('div.rc-games', ...games.map(g => h('button.rc-game', { type: 'button', dataset: { theme: g.theme, game: g.id }, onclick: () => {
      if (!asHost || !isHost()) { openHelp(g.id); return; }
      // (SHELL 2.0 B1: the options open ON the picker — ‹ = back to the games, × = both)
      // (the host picks ANOTHER game after a match: the REMATCH ring goes back to PLAY + every vote clears)
      if (st.meta && st.meta.back && st.meta.back.rm) dbUpdate(dbRef(`rooms/${code()}`), { 'meta/back/rm': false, rv: null }).catch(() => {});
      lazyImport(import('./game-options.js'), './game-options.js').then(m => m.openGameOptions(g, { meta: st.meta }));
    } }, h('span.rc-game-art', gameArt(g.id) || ''), h('span.rc-game-t', h('small', g.tag), h('b', g.name, isOwnerTest(g.id) ? h('em.rc-game-test', 'TEST') : null), h('span', g.blurb)), h('i.rc-game-go', '›'))));
    const s = openPfSheet({ kicker: asHost && isHost() ? 'YOU’RE THE HOST' : `${hostName().toUpperCase()} PICKS THE GAME`, title: asHost && isHost() ? 'PICK A GAME' : 'THE GAMES', cls: 'rc-games-sheet',
      body: [list, h('p.sh-note.is-small', asHost && isHost() ? 'Pick one, set it up, then INITIATE — everyone in the line is dealt in.' : 'Tap one to read how it plays while you wait.')],
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
    lazyImport(import('./room-guests.js'), './room-guests.js').then(m => m.openGuestList({ get st() { return st; }, openCard: openPlayerCard, onClose: () => { guestsUi = null; } })).then(g => { if (destroyed) { g.close(); return; } guestsUi = g; }).catch(e => { guestsUi = null; console.warn('guests', e); });
  }

  // ---------------------------------------------------------------- a player's card (a tap on their figure or their strip)
  // (LOBBY FIXES — THE PLAYER CARD: the owner's phone opened the RADIO panel here (the radio's own "THEIR CARD") — he could see nobody's card.
  //  A player tap ALWAYS opens THAT player's card, on top (the sheet stack), from the line + GUESTS alike; the owner gets a small CREW row at
  //  its foot (crew-row.js — the server checks the role per action); the radio never opens from a player tap)
  async function openPlayerCard(uid) {
    const p = players()[uid]; if (!p) return;
    popName(uid, TAP_NAME_MS);
    const pub = st.pub && p.pid ? st.pub[p.pid] : null;
    const crew = uid !== st.uid ? await lazyImport(import('./crew-row.js'), './crew-row.js').then(m => (m.isOwnerPhone() ? m.crewRow(uid) : null)).catch(() => null) : null;
    // (SHELL 2.0 B2 — MAKE HOST: the host's phone, another player, in the room — the second tap confirms; offline → said, not offered)
    const mk = uid !== st.uid && isHost() && !(st.meta && st.meta.status === 'playing') ? makeHostRow(uid, p) : null;
    // (FRIENDS A — ADD FRIEND on any player's card: a request they accept; REQUESTED / FRIENDS once it's sent / taken)
    const fb = uid !== st.uid && p.pid ? await lazyImport(import('../profile/friends-ui.js'), '../profile/friends-ui.js').then(m => m.friendButton({ pid: p.pid }, { name: p.name })).catch(() => null) : null;
    const foot = crew || mk || fb ? h('div.rc-foot', fb, mk, crew) : null;
    // (BOARD 2.0 B — THE PLAYER PAGE: another player with a profile → their page (the card, LV, the medals, the friend button, ⋯) with the room's
    //  own rows under it (MAKE HOST, the owner's CREW); you, or a player with no profile → the card as before)
    if (uid !== st.uid && p.pid) { lazyImport(import('../profile/player-page.js'), '../profile/player-page.js').then(m => m.openPlayer({ pid: p.pid, row: { ...(pub || {}), n: (pub && pub.n) || p.name, a: (pub && pub.a) || p.avatar, c: (pub && pub.c) || p.color } }, { extra: mk || crew ? [h('div.rc-foot', mk, crew)] : [] })).catch(() => {}); return; }
    if (pub && pub.cd && pub.cd !== 'card-gilded') {
      try {
        const F = await lazyImport(import('../vault/full.js'), '../vault/full.js');
        if (await F.canShowFull(pub.cd)) { const { levelOf } = await lazyImport(import('../core/levels.js'), '../core/levels.js'); const { memberLabel } = await lazyImport(import('../core/member.js'), '../core/member.js');
          F.openFullCard(pub.cd, { name: pub.n || p.name, lv: levelOf(pub.x || 0), avatar: pub.a || p.avatar, color: pub.c || p.color, at: pub.at, no: memberLabel(pub.mn), fd: !!pub.fd, shape: pub.es, tube: pub.tb, glow: pub.g, foot }); return; }
      } catch { /* the gilded card below */ }
    }
    const [{ openPfSheet }, { memberCard }] = await Promise.all([lazyImport(import('../profile/sheets.js'), '../profile/sheets.js'), lazyImport(import('./profile.js'), './profile.js')]);
    openPfSheet({ kicker: uid === st.uid ? 'YOUR CARD' : 'THEIR CARD', title: String(p.name || '').toUpperCase(), cls: 'rc-card-sheet', body: [memberCard(pub, { name: p.name, color: p.color, avatar: p.avatar }, pub ? pub.x : 0), foot] });
  }

  function makeHostRow(uid, p) {
    const online = isOnline(st.presence, uid);
    return row({ icon: 'crown', ic: '#ffd977', label: 'Make host', sub: online ? `${String(p.name || 'They').toUpperCase()} runs the room from here` : 'Offline — they need to be here', cls: 'rc-mkhost',
      attrs: online ? {} : { disabled: true }, confirm: online ? 'TAP AGAIN TO HAND OVER' : null,
      onClick: online ? async () => { const r = await lazyImport(import('../room.js'), '../room.js').then(m => m.makeHost(uid)); if (r !== true) toast(r, 'warn'); else closeAll(); } : null });
  }

  // ---------------------------------------------------------------- the tags over the heads (the emblem · the name · the typing bubble)
  function popName(uid, ms) { const T = tags.get(uid); if (T) { T.nameUntil = performance.now() + ms; T.el.classList.add('is-named'); } }
  // LOBBY 2.0 B — THE TAP AREA (the owner's room test, Nov 4: "you almost have to hit the emblem"): the WHOLE PERSON opens their card — a
  // hit box over the figure + its ring + the emblem, padded to at least 44 pt each way (forgiving), placed with the tag (its size written only
  // when it changes). Overlapping neighbours: the figure NEAREST the finger wins (the tap is resolved over every box, not by which box is on top).
  const HIT_MIN = 44, HIT_PAD = 6;
  function nearestAt(x, y) {
    let best = null, bd = Infinity;
    for (const [uid, T] of tags) {
      const r = T.hit; if (!r || T.el.classList.contains('is-hid')) continue;
      if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) continue;
      const d = Math.hypot(x - r.cx, (y - r.cy) * 0.6);   // (the figure's own centre line; height counts a little less than width)
      if (d < bd) { bd = d; best = uid; }
    }
    return best;
  }
  function tagFor(uid) {
    let T = tags.get(uid);
    if (T) return T;
    const emb = h('span.rc-emb'), name = h('span.rc-name'), bubble = h('span.rc-bubble', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
    const hitEl = h('span.rc-hit', { 'aria-hidden': 'true' });
    const el = h('button.rc-tag', { type: 'button', dataset: { uid } }, hitEl, bubble, name, emb);
    // (a plain-area tap rule: pointerdown + pointerup, never click — iOS Safari skips click on some elements; this IS a button, but the
    //  tag moves under the finger: the same tap whether it moved or not)
    let down = null;
    el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 14) { tapHandled(); openPlayerCard(nearestAt(e.clientX, e.clientY) || uid); } down = null; });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayerCard(uid); } });
    T = { el, emb, name, bubble, hitEl, hit: null, hitSig: '', sig: '', nameUntil: 0 };
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
        if (pub && pub.es) lazyImport(import('../vault/emblem-art.js'), '../vault/emblem-art.js').then(m => { if (T.sig !== sig || !m.hasArt(pub.es)) return; T.emb.replaceChildren(m.emblemEl({ id: pub.es, avatar: p.avatar, color: p.color, tube: pub.tb, mode: 'quiet' })); }).catch(() => {});
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
      if (!b) { if (gone && !(boxes && boxes.has(uid))) { T.el.remove(); tags.delete(uid); } else { T.el.style.opacity = '0'; T.el.classList.add('is-hid'); } continue; }
      if (T.el.classList.contains('is-hid')) T.el.classList.remove('is-hid');
      // (over the head: the box's top; lying = over the body, a little above the ground)
      const cx = b.x + b.w / 2, top = b.y + (b.lie ? b.h * 0.86 * b.lie : 0), x = Math.round(cx * 2) / 2, y = Math.round((top - 3) * 2) / 2;
      T.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      // (THE TAP AREA: the figure's box + the emblem over the head, padded to ≥ 44 pt — relative to the tag's own origin)
      let x0 = Math.min(b.x, cx - 15) - HIT_PAD, x1 = Math.max(b.x + b.w, cx + 15) + HIT_PAD, y0 = y - 30, y1 = b.y + b.h + HIT_PAD + 2;
      if (x1 - x0 < HIT_MIN) { const e = (HIT_MIN - (x1 - x0)) / 2; x0 -= e; x1 += e; }
      if (y1 - y0 < HIT_MIN) { const e = (HIT_MIN - (y1 - y0)) / 2; y0 -= e; y1 += e; }
      T.hit = { x0, x1, y0, y1, cx, cy: (b.y + b.h * 0.45) };
      const hs = `${Math.round(x0 - x)}|${Math.round(y0 - y)}|${Math.round(x1 - x0)}|${Math.round(y1 - y0)}`;
      if (hs !== T.hitSig) { T.hitSig = hs; const [l, t, w, hh] = hs.split('|'); Object.assign(T.hitEl.style, { left: `${l}px`, top: `${t}px`, width: `${w}px`, height: `${hh}px` }); }
      const op = (b.a == null ? 1 : b.a) * (b.lie ? 1 - 0.55 * b.lie : 1);
      const ops = op.toFixed(2); if (T.el.style.opacity !== ops) T.el.style.opacity = ops;
      const named = now < T.nameUntil; if (T.el.classList.contains('is-named') !== named) T.el.classList.toggle('is-named', named);
      if (T.el.classList.contains('is-down') !== !!(b.lie > 0.5)) T.el.classList.toggle('is-down', !!(b.lie > 0.5));
    }
    if (dock && lightFrom) lightFrom(dock);
    raf = requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- LOBBY 2.0 B — THE REMATCH VOTE (core/room-show.js#voteState)
  const voteNow = () => voteState(st.meta, st.rv, players(), serverNow());
  let voting = false;
  function toggleVote(vs) {
    if (voting) return; voting = true;
    const mine = st.rv && st.rv[st.uid] === vs.m;
    sfx(mine ? 'tap' : 'select');
    dbUpdate(dbRef(`rooms/${code()}`), { [`rv/${st.uid}`]: mine ? null : vs.m }).catch(() => toast('COULD NOT REACH THE ROOM', 'err')).finally(() => { voting = false; });
  }
  const banner = createRoomBanner({ scene });

  // ---------------------------------------------------------------- the dock's state + the notes
  let chatMod = null, offChat = null;
  lazyImport(import('../chat/chat.js'), '../chat/chat.js').then(m => { if (destroyed) return; chatMod = m; offChat = m.onChat(() => { paintDock(); paintBubbles(); }); paintDock(); }).catch(() => {});
  function paintDock() {
    if (!dock || destroyed) return;
    const P = players(), me = P[st.uid] || {}, ids = Object.keys(P);
    if (!seen) seen = loadSeen() || new Set(ids);
    const unread = chatMod ? chatMod.chat.unread || 0 : 0;
    const vs = voteNow();
    const rm = vs.on ? { on: true, voted: !!(st.rv && st.rv[st.uid] === vs.m), n: vs.voters.length, total: vs.total, pips: vs.guests.map(u => ({ col: colorHex((P[u] || {}).color), on: vs.voters.includes(u) })) } : null;
    dock.set({ host: isHost(), hostName: hostName(), invitePulse: isHost() && ids.length === 1 && !invited(), newGame: isHost() && vs.on ? (ngSeen() ? 'calm' : 'breathe') : null, guestsDot: ids.some(u => u !== st.uid && !seen.has(u)), chatDot: unread > 0, chatN: unread,
      you: avatar(me.avatar || 'bolt', me.color || 'magenta', 27), youSig: `${me.avatar}|${me.color}`, youAria: `Your card, ${me.name || ''}`, rm,
      // DM2 — THE ROOM WINS (the host's side): who of the room is mid-daily — DFIX2 (FABLE REVIEW #2 finding 6 → Ben's decision 4): each phone's
      // OWN flag on its player node (players/{uid}/dy — js/daily/room-flag.js), read live from the mirrored room; was a 20 s poll of /api
      mid: ids.filter(u => u !== st.uid && P[u] && P[u].dy === true).length });
    // (this phone's own flag: a run held / open while in the room — kept honest on every room update, e.g. the join with a hold from before)
    lazyImport(import('../daily/room-flag.js'), '../daily/room-flag.js').then(m => { if (!destroyed) m.syncMidFlag(m.wantFlag(), st); }).catch(() => {});
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
  const noteT = setInterval(() => { if (!destroyed) { paintNotes(); paintBubbles(); paintDock(); startFx(); } }, 2000);   // (+ FR6 FIXES A: a start past its time ends on the clock, not on a state change)   // (+ the dock: the REMATCH ring comes up on the clock)

  // ---------------------------------------------------------------- THE GAME START — REDONE (LOBBY FIXES — the owner, Nov 4 3:05–3:06 pm: DROP
  // the camera push-in through the door — choppy on the phone). From the host's tap, on every phone at once (meta/go on the server clock —
  // core/room-show.js#START), THE FULL START (~5 s — a room's first game of the night + after a game change):
  //   the speakeasy's NEON sign POWERS DOWN (a flicker out) → THE GAME's OWN NEON SIGN IGNITES on it — pink, the NEON logo's tube quality,
  //   tube by tube with a real ignition flicker, then steady — under "TONIGHT", and HOLDS so its name reads → the TWO LINES walk in through
  //   the side door under the lit sign → a short clean fade into the game. THE QUICK START (a same-game REMATCH, ~3 s): the game's sign is
  //   lit at once — the walk-in + the fade only. Every part is a CSS animation at a NEGATIVE delay = the show's age (a refresh / a late
  //   joiner / a new host lands on the same frame); opacity only; nothing reads layout. Reduced motion: the lit sign by a plain fade + the fade.
  let goFx = null;
  const tubeDelay = i => (i * 137 + (i % 3) * 61) % 460;   // (each tube catches on its own beat — the same on every phone)
  function startFx() {
    const ss = startShow(st.meta, st.game, serverNow());
    // (past the start with the match still being prepared — a slow bank / song: the veil holds WHILE THE STAMP IS UP, at most GO_DEAD_MS (FR6
    //  FIXES A — B3); a failed / dead start takes the stamp down (host.js) → the veil lifts on every phone with THE START DIDN'T GO THROUGH (B2))
    const wAge = goWaiting(st.meta, st.game, serverNow()), waiting = wAge != null && wAge < GO_DEAD_MS;
    if (!ss.on) {
      if (goFx && waiting && wAge > goFx.len + 600 && !goFx.slow) { goFx.slow = true; goFx.veil.append(h('div.rc-veil-note', 'GETTING THE GAME READY…')); }
      if (goFx && !(st.meta && st.meta.status === 'playing') && !waiting) { const m = goFx.m; endFx(); startDied(m); }
      return;
    }
    if (goFx && goFx.m === ss.m) return;
    if (goFx) endFx();
    const g = GAMES.find(x => x.id === ss.g) || { id: ss.g, name: ss.g };
    const age = Math.round(ss.age), quick = ss.kind === 'quick' || ss.kind === 'solo';   // (PLAY NOW: THE SOLO START — the sign lit at once, the short walk)
    const veil = h('div.rc-veil', { 'aria-hidden': 'true' });
    const tonight = h('div.rc-tonight', { 'aria-hidden': 'true' }, h('small.rc-tonight-k', 'TONIGHT'), h('div.rc-tonight-logo'));
    goFx = { m: ss.m, len: ss.len, veil, tonight };
    lazyImport(import('../ui/tube-logo.js'), '../ui/tube-logo.js').then(T => {
      if (!goFx || goFx.m !== ss.m) return;
      const box = goFx.tonight.lastChild;
      box.innerHTML = T.gameLogoSvg(g, { id: `rcg-${g.id}`, lit: true, premium: true, tint: T.NEON_PINK });
      box.querySelectorAll('.ndl').forEach((el, i) => el.style.setProperty('--d', `${tubeDelay(i)}ms`));
    }).catch(() => {});
    const vars = { '--rc-age': `-${age}ms`, '--rc-sign': `${ss.sign}ms`, '--rc-fadeat': `${ss.fadeAt}ms`, '--rc-fadelen': `${ss.len - ss.fadeAt}ms` };
    for (const el of [document.body, sign, veil, tonight]) if (el) for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
    if (sign) { sign.append(tonight); sign.classList.add('rc-go', quick ? 'rc-quick' : 'rc-full'); }
    // (the city's own parts of the sign — its glow + its daylight glass on the canvas: THE SIGN-DIM HOOK, the one the TR-3B uses)
    if (scene && scene.dimSign) scene.dimSign('room-start', { logo: 0, tag: 0, ms: Math.max(60, (quick ? 300 : 450) - age) });
    document.body.append(veil);
    document.body.classList.add('rc-going');
    // (the sign's own recorded neon — a dropout as NEON goes out, a catch as the game's sign ignites; only from the start itself, never a refresh)
    if (age < 300 && !reducedMotion()) lazyImport(import('../audio/ambience.js'), '../audio/ambience.js').then(A => { A.neonDropout({ level: quick ? 0.45 : 0.7 }); goFx && (goFx.catchT = setTimeout(() => A.neonCatch({ level: 0.6, dur: 0.9 }), Math.max(0, (quick ? 120 : ss.sign + 150) - age))); }).catch(() => {});
    for (const gs of [gamesOpen, guestsUi]) if (gs && gs.close) gs.close();
    closeHostCard();
    closeAll();   // (FR6 FIXES A — B1: EVERY sheet + overlay on every phone — the profile, CUSTOMIZE, the full card, ☰, HOW TO PLAY…; never one over the match)
    // (THE CARTRIDGE PLUG — its loading: the walk inside is the console's loading time on EVERY phone — the view module + its sheets warm,
    //  the game's own preload (pools, sounds) runs; the city is still drawing, so nothing heavy is BUILT here — only fetched)
    lazyImport(import('../games/preload.js'), '../games/preload.js').then(P => P.preloadGame(ss.g)).then(mod => { if (!mod) return;   // (FRIENDS C: the whole graph at once — never a waterfall)   // (SHELL 2.0 B1: every phone LOADS the cartridge here — the walk inside)
      if (mod.createView && mod.createView.warm) mod.createView.warm(); if (typeof mod.preload === 'function') { try { mod.preload({ settings: (st.meta && st.meta.settings && st.meta.settings[ss.g]) || mod.DEFAULT_SETTINGS || {}, host: isHost() }); } catch (e) { console.warn('preload', e); } } }).catch(() => {});
  }
  const diedSaid = new Set();
  function startDied(m) {
    if (diedSaid.has(m)) return; diedSaid.add(m);
    if (!isHost()) toast('THE START DIDN’T GO THROUGH — THE HOST CAN TRY AGAIN', 'warn', 4500);   // (the host's phone says its own — host.js)
  }
  function endFx() {
    if (!goFx) return;
    const { veil, tonight, catchT } = goFx; goFx = null; clearTimeout(catchT);
    veil.remove(); tonight.remove();
    if (sign) sign.classList.remove('rc-go', 'rc-quick', 'rc-full');
    if (scene && scene.dimSign) scene.dimSign('room-start', null);
    document.body.classList.remove('rc-going');
  }

  // ---------------------------------------------------------------- the roster → the city
  // (LOBBY 2.0 B — THE GAME START's file-in + THE WALK BACK OUT: each player's own place in the show, from the room's stamps — core/room-show.js;
  //  reduced motion: no walk — they stand, and the start is a plain cross-fade)
  const offSince = new Map();   // uid → when this phone first saw them offline (the lost-signal grace)
  let graceT = 0;
  function onlineNow(uid, t) {
    if (isOnline(st.presence, uid)) { offSince.delete(uid); return true; }
    if (!offSince.has(uid)) offSince.set(uid, t);
    const left = LOST_GRACE_MS - (t - offSince.get(uid));
    if (left > 0) { clearTimeout(graceT); graceT = setTimeout(() => { graceT = 0; if (!destroyed) update(st); }, left + 40); return true; }
    return false;
  }
  function roster() {
    const P = players(), order = roomOrder(P, st.meta && st.meta.hostId), now = serverNow(), mo = !reducedMotion(), tNow = performance.now();
    for (const u of [...offSince.keys()]) if (!P[u]) offSince.delete(u);
    const ss = startShow(st.meta, st.game, now), bs = ss.on ? { on: false } : backShow(st.meta, P, now, st.night);
    const inAt = ss.on && mo ? new Map(fileInOrder(P, st.meta.hostId).map(o => [o.uid, o.at])) : null;
    const outAt = bs.on && mo ? new Map(bs.order.map(o => [o.uid, o.at])) : null;
    const list = order.map(o => ({ uid: o.uid, slot: o.slot, online: onlineNow(o.uid, tNow), col: rgbOf(P[o.uid].color), fresh: now - (P[o.uid].joinedAt || 0) < FRESH_MS,
      goT: inAt && inAt.has(o.uid) ? (ss.age - ss.walkAt) / 1000 - inAt.get(o.uid) : undefined, outT: outAt && outAt.has(o.uid) ? bs.age / 1000 - outAt.get(o.uid) : undefined }));
    list.kicked = Object.keys(st.kicked || {});
    return list;
  }
  function update(s) {
    st = s;
    if (destroyed || !st.code) return;
    paintTags();   // (first: a tag must exist before its name pops)
    const list = roster(), key = list.map(q => `${q.uid}|${q.slot}|${q.online ? 1 : 0}|${q.goT != null ? 'i' : ''}`).join(',');
    if (key !== lastRoster) {
      const before = new Set(lastRoster ? lastRoster.split(',').map(x => x.split('|')[0]) : []);
      lastRoster = key;
      if (scene && scene.room) scene.room(list);
      // (a new guest: their name pops as they arrive; the friend's clink — room-guests / lobby-sfx — Group 2)
      for (const q of list) if (before.size && !before.has(q.uid)) { popName(q.uid, NAME_MS + 6000); if (q.uid !== st.uid) lazyImport(import('../audio/lobby-sfx.js'), '../audio/lobby-sfx.js').then(m => m.lobbySfx('friend')).catch(() => {}); }
      if (!before.size) for (const q of list) if (q.fresh) popName(q.uid, NAME_MS + 8000);
    }
    if (scene && scene.hush) scene.hush(soloRoom() ? null : st.code);   // (PLAY NOW: a solo room's code is never on the door)
    document.body.classList.toggle('rc-solo', soloRoom());   // (its dock stays out of sight for the instant before the start — css/screens.css)
    maybeHostCard();
    if (hostCard && Object.keys(players()).length > 1) closeHostCard();   // (a guest arrived: the card has done its job)
    startFx();
    banner.update(st);
    paintDock();
    paintFriends();
    paintNotes();
    if (guestsUi && guestsUi.update) guestsUi.update(st);
    if (!raf) raf = requestAnimationFrame(frame);
  }

  return {
    update,
    dock,
    startFx: () => (goFx ? { m: goFx.m } : null),
    vote: () => voteNow(),
    banner: () => banner.debug(),
    hostCard: () => (hostCard ? { text: hostCard.el.textContent } : null),
    debug: () => ({ tags: [...tags.keys()], roster: roster(), seen: seen ? [...seen] : null, hits: Object.fromEntries([...tags].map(([u, T]) => [u, T.hit && { x0: Math.round(T.hit.x0), x1: Math.round(T.hit.x1), y0: Math.round(T.hit.y0), y1: Math.round(T.hit.y1) }])) }),
    nearestAt,
    destroy() {
      destroyed = true; clearTimeout(wireT); cancelAnimationFrame(raf); clearInterval(noteT); clearTimeout(graceT); closeHostCard(); if (offChat) offChat(); if (offFr) offFr(); if (invSheet) invSheet.close(); banner.destroy();
      // (the start's veil stays over the hand-off to the game screen — app.js's screen-in fades the game up; then it goes)
      if (goFx) { const v = goFx.veil; goFx.veil = h('i'); v.style.animation = 'none'; v.style.opacity = '1'; void v.offsetWidth; v.style.transition = 'opacity 0.45s ease'; v.style.opacity = '0'; setTimeout(() => v.remove(), 500); endFx(); }
      // (SPEED PASS B: out of the room only YOUR figure leaves the promenade — waving only on a LEAVE; the others carry on inside)
      if (scene && scene.room) { const x = exitHow(); scene.room(null, { me: st.uid, wave: !!(x && x.how === 'leave') }); }
      if (scene && scene.hush) scene.hush(null);
      clearTimeout(pickT);
      layer.remove(); document.body.classList.remove('rc-on', 'rc-solo');
      if (dock) { dock.els.door.remove(); dock.destroy(); }
      if (guestsUi && guestsUi.close) guestsUi.close();
      if (gamesOpen) gamesOpen.close();
    },
  };
}
