// LOBBY 2.0 A — THE ROOM IN THE CITY (docs/harbor/passes/lobby-2a.md; the owner's approved mock lobby-room.png): when you HOST or JOIN
// you STAY ON THE LIVE CITY — no separate lobby screen for the waiting part (app.js routes a City 2.0 room that isn't playing to the title,
// which hands it here; the game start still runs through today's path until LOBBY 2.0 B). This module:
//   · the ROSTER → the city (core/harbor-room.js: two lines of 4 at the door, the host first) — the city's own people at the city's scale,
//     each marked by a RING under the feet (people.js) + their EMBLEM over the head (the tags here: DOM, crisp at 3×, tappable — a tap
//     pops the name + opens their card); the name pops briefly as they arrive; a lost-signal guest lies down (dimmed, the emblem dimmed);
//   · THE ROOM DOCK (room-dock.js): INVITE · YOU · GUESTS · GAMES · CHAT · PLAY / WAITING FOR <HOST>;
//   · the sheets: GUESTS (the guest list — room-guests.js), GAMES / PLAY (the playable games → game-options.js), INVITE (the share sheet);
//   · THE ROOM NOTE above the dock (one line, a slim pill — core/room-note.js): the room closing soon (host: KEEP OPEN), a match on that this
//     phone stepped out of (WATCH, + a × until the next match).
// EACH PHONE KEEPS ITS OWN CITY (its sky, sun, weather, its local-time events); the ROOM's things are the same on every phone — all of
// them derived from rooms/{CODE} (players, presence, meta, kicked): a refresh / a rejoin / a host change = everyone back in place.
import { tapHandled, afterTap } from '../ui/tapwatch.js';
import { roomNote, noteHideKey, NOTE_HIDE_KEY } from '../core/room-note.js';
import { h } from '../ui/dom.js';
import { avatar, row } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { colorHex, GAMES, APP_NAME, ROOM_IDLE_WARN_MS, isOwnerTest } from '../config.js';
import { state, isHost, setState } from '../store.js';
import { isOnline, idleLeft } from '../core/room-logic.js';
import { roomOrder } from '../core/harbor-room.js';
import { exitHow, leaveRoom } from '../room.js';
import { serverNow, dbRef, update as dbUpdate, serverTimestamp, expectRefusal } from '../firebase.js';
import { createRoomDock } from './room-dock.js';
import { sfx } from '../audio/sfx.js';
import { openHelp } from '../ui/help-open.js';
import { reducedMotion } from '../ui/dom.js';
import { closeAll } from '../ui/layers.js';
import { startShow, fileInOrder, backShow, voteState, GO_DEAD_MS, goWaiting } from '../core/room-show.js';
import { createRoomBanner } from './room-banner.js';
import { lazyImport } from '../ui/lazy-import.js';
import { holdCity } from '../ui/city-hold.js';
import { tallyVotes, voteOrder, nextVote, myVote, newVotes, mostWantedLine } from '../core/room-votes.js';

const rgbOf = id => { const x = colorHex(id).replace('#', ''); return [0, 2, 4].map(i => parseInt(x.slice(i, i + 2), 16)); };
export const FRESH_MS = 12000;      // (a player who joined in the last 12 s walks in, even on a phone seeing the room for the first time)
// (LOBBY FIXES — AN INTENTIONAL LEAVE: the owner saw TESTER lie down (the lost-signal pose), get up, THEN wave + walk off. A leave removes the
//  player node + their presence in ONE update, but each phone hears the two paths as two events — presence first → the lie-down. A presence
//  drop now waits LOST_GRACE_MS before the lie-down: a leave's node goes inside it → straight to the wave + the walk-off; a real lost signal
//  lies down a moment later)
export const LOST_GRACE_MS = 1500;
const NAME_MS = 4200, TAP_NAME_MS = 3000;
// (THE ROOM NOTE — kept across the room screen's rebuilds (the city pauses for a match): the match whose × this page tapped (storage blocked)
//  + the matches whose watch already said "you're dealt into the next one")
let hideMem = null;
const watchSaid = new Set();
/** THE MESSAGE once the watch is on screen (the city steps aside first — never a message left floating where the dock was) */
function sayWatching(name) {
  let n = 0;
  const go = () => {
    if (document.body.classList.contains('nd-on') && ++n < 20) { setTimeout(go, 150); return; }
    if (state.code && state.game && state.meta && state.meta.status === 'playing') toast(name ? `Watching ${name}` : 'Watching the game', 'info', { ms: 4200, sub: 'You’re dealt into the next one.' });
  };
  setTimeout(go, 150);
}

/** PURE (CITY A — item 15): the game a room has PICKED, as every phone can see it — the start's stamp (meta.go.g), else the match in play / just
 *  played (game.id, meta.back.g — the rematch plays it again); null = nothing picked yet (the host's options sheet wires its own choice) */
export function pickedGame(st) {
  const go = st && st.meta && st.meta.go, back = st && st.meta && st.meta.back, g = st && st.game;
  return (go && typeof go.g === 'string' && go.g) || (g && typeof g.id === 'string' && g.id) || (back && typeof back.g === 'string' && back.g) || null;
}

export function createRoomCity({ scene, sign, dockHost, lightFrom }) {
  // (FRIENDS C — THE SLOW-3G START: the cartridges' module lists fetched now, in the lobby — the start then puts a whole graph on the wire at once)
  //  + THE LOBBY IS THE LOADING TIME: a few seconds in, the playable cartridges' graphs are WIRED (modulepreload — fetched + parsed, never run;
  //  the guests only learn the game at the start, and a slow line needs the lobby's wait) — not on a Save-Data line
  // (CITY A — item 15, A GAME COSTS NOTHING UNTIL IT'S PICKED: the lobby wired EVERY playable cartridge's graph a few seconds in — every guest
  //  paid for three games to play one. Now ONLY the room's PICKED game (pickedGame — the start's stamp, else the match in play / just played:
  //  the rematch) is wired, a few seconds in, and again whenever it changes; the host's options sheet wires its own pick at the tap
  //  (game-options.js), every phone's start wires the room's game (host.js, startShow). Not on a Save-Data line.)
  let wiredPick = null, wireReady = false;
  const wirePick = () => {
    if (!wireReady || destroyed || (navigator.connection && navigator.connection.saveData)) return;
    const id = pickedGame(st);
    if (!id || id === wiredPick) return;
    wiredPick = id;
    lazyImport(import('../games/preload.js'), '../games/preload.js').then(P => P.wireGame(id)).catch(() => {});
  };
  // (CITY A — item 19, THE 8-CARD LOBBY: the GUESTS sheet came in 519 ms after its tap at 1× (4.7 s at 4× CPU) — its module + the slim cards'
  //  were fetched AT the tap; they are warmed with the wiring now, so the tap only builds the sheet)
  const wireT = setTimeout(() => { wireReady = true; wirePick(); if (!destroyed) lazyImport(import('./room-guests.js'), './room-guests.js').catch(() => {}); }, (typeof window !== 'undefined' && window.__wireDelay) || 4000);   // (__wireDelay: the slow-3G E2E's hook)
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
    // (CITY H1 — LEAVE ON THE DOCK: the left ring = LEAVE → THE LEAVE SHEET (ui/leave-sheet.js); INVITE lives at the top of GUESTS)
    leave: () => { sfx('select'); askLeave(); },
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
    // (FIXES R2 — THE BOARD IN A ROOM: the same screen as outside one — app.js routes view 'board' while the room waits; its BACK = the room)
    board: () => { sfx('select'); setState({ view: 'board', boardGame: null, boardBoard: null, boardPeriod: null }); },
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
  /** THE LEAVE SHEET (CITY H1): LEAVE <WORD>? · LEAVE · STAY — the dock's ring + the guest list's foot */
  function askLeave() { lazyImport(import('../ui/leave-sheet.js'), '../ui/leave-sheet.js').then(m => { if (!destroyed) m.openLeave({ onLeave: () => leaveRoom() }); }).catch(() => {}); }
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
      h('p.rc-hc-or', 'or GUESTS → INVITE anytime'));
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
  // CITY PART 2 — GAME VOTES IN A ROOM (core/room-votes.js; rooms/{CODE}/gv/{uid} = { g, at }): a GUEST's tap on a game in GAMES = their vote
  // (another game moves it, the same takes it back — "YOUR VOTE" on it; HOW TO PLAY on its own ? button); the HOST's list shows each game's
  // voters as their colour DOTS + the count (most-voted first; a tap on the dots = who), MOST WANTED · <GAME> (n) on top = one tap starts it
  // (game-options.js#quickStart — the host's own tap: votes are suggestions, never an auto-start); the dock's GAMES tab counts the new votes.
  // Votes only in the lobby; the host's start clears them (host.js). THE RULES-LAG: on rules without gv a vote is refused → the quiet
  // 'late-vote', votes go quiet for this page and a tap reads HOW TO PLAY as before (nothing shown, nothing broken).
  const playableIds = () => GAMES.filter(g => g.playable).map(g => g.id);
  const tally = () => tallyVotes(st.gv, players(), st.meta && st.meta.hostId, playableIds());
  const lobbyNow = () => !!(st.meta && st.meta.status === 'lobby');
  let votesOff = false, voteBusy = false;
  const gvSeenKey = () => `rc:gv:${code()}`;
  const gvSeen = () => { try { return Number(sessionStorage.getItem(gvSeenKey())) || 0; } catch { return 0; } };
  const markGvSeen = () => { try { sessionStorage.setItem(gvSeenKey(), String(serverNow())); } catch { /* fine */ } };
  const gamesN = () => (isHost() && lobbyNow() ? newVotes(st.gv, players(), st.meta && st.meta.hostId, playableIds(), gvSeen()) : 0);
  function castVote(g) {
    if (voteBusy) return;
    // (THE REVIEW: the host (a MAKE HOST since the sheet opened) / votes off / a start on its way → HOW TO PLAY, as before votes)
    if (isHost() || votesOff || !lobbyNow() || goWaiting(st.meta, st.game, serverNow())) { openHelp(g.id); return; }
    voteBusy = true;
    const v = nextVote(myVote(st.gv, st.uid), g.id);
    sfx(v ? 'select' : 'tap');
    expectRefusal(`rooms/${code()}/gv/${st.uid}`, 'a game vote refused (the room had moved on, or rules without gv)', 8000, 'late-vote');
    dbUpdate(dbRef(`rooms/${code()}`), { [`gv/${st.uid}`]: v ? { g: v, at: serverTimestamp() } : null })
      // (THE REVIEW: votes go quiet only for a refusal IN a settled lobby — the rules without gv; a race with a start just drops the vote)
      .catch(e => { if (e && /permission|denied/i.test(String(e.code || e.message))) { if (lobbyNow() && !goWaiting(st.meta, st.game, serverNow()) && players()[st.uid]) { votesOff = true; paintGames(); openHelp(g.id); } } else toast('COULD NOT REACH THE ROOM', 'err'); })
      .finally(() => { voteBusy = false; });
  }
  const nameOfGame = id => (GAMES.find(x => x.id === id) || {}).name || id;
  const whoLine = (r) => r.voters.map(u => String((players()[u] || {}).name || '?').toUpperCase()).join(' · ');
  /** the open GAMES sheet's vote marks — set in place (text + attributes), after any finger lands (THE TAP WATCH) */
  function paintGames() { afterTap(paintGamesNow); }
  function paintGamesNow() {
    const G = gamesOpen && gamesOpen.rows;
    if (!G || destroyed) return;
    const T = tally(), mine = myVote(st.gv, st.uid), host = isHost();
    for (const [id, R] of G) {
      const r = T.by[id], n = r ? r.n : 0, sig = `${n}|${r ? r.voters.map(u => (players()[u] || {}).color).join(',') : ''}|${mine === id ? 1 : 0}`;
      if (R.sig === sig) continue; R.sig = sig;
      R.dots.replaceChildren(...(r ? r.voters.slice(0, 8).map(u => h('i.rc-gv-dot', { style: { '--c': colorHex((players()[u] || {}).color) } })) : []));
      R.n.textContent = n ? String(n) : '';
      R.box.hidden = !n; R.box.setAttribute('aria-label', n ? `${n} vote${n === 1 ? '' : 's'}: ${r ? whoLine(r) : ''}` : '');
      R.mine.hidden = !(mine === id && !host);
      R.btn.classList.toggle('is-voted', mine === id && !host);
    }
    if (gamesOpen.mw) {
      const line = host && lobbyNow() ? mostWantedLine(T, nameOfGame) : '';
      gamesOpen.mw.hidden = !line; gamesOpen.mw.dataset.g = T.top ? T.top.g : '';
      // (two lines: the small MOST WANTED over the game's name + its count — the words read whole at 375; the text stays the one line)
      const m = /^(MOST WANTED) · (.*)$/.exec(line);
      gamesOpen.mwT.replaceChildren(...(m ? [h('small', m[1]), h('i.rc-mw-sep', ' · '), h('b', m[2])] : []));
    }
    if (host) markGvSeen();
  }
  async function openGames(asHost) {
    if (gamesOpen) return;
    gamesOpen = { pending: true };
    try { await openGamesNow(asHost); } catch (e) { console.warn('games', e); toast('COULDN’T OPEN THE GAMES — TAP AGAIN', 'warn'); } finally { if (gamesOpen && gamesOpen.pending) gamesOpen = null; }   // (THE REVIEW: a failed chunk never leaves GAMES dead)
  }
  async function openGamesNow(asHost) {
    const { openPfSheet } = await lazyImport(import('../profile/sheets.js'), '../profile/sheets.js');
    const base = GAMES.filter(g => g.playable || (asHost && isOwnerTest(g.id)));   // (HE8 — THE OWNER'S LIVE TEST: a game being built, on the owner's host phone only)
    const [{ markSvg, GAME_ACC }, O] = await Promise.all([lazyImport(import('../ui/mark-svg.js'), '../ui/mark-svg.js'), lazyImport(import('../core/game-order.js'), '../core/game-order.js').catch(() => null)]);
    // (CITY H2 — THE GAMES LIST ORDER: the PLAY sheet's own order — most played first, a game's first 14 days on top with NEW; CITY PART 2: the
    //  HOST's list puts the voted games on top at the open — most votes first, a tie = the earliest vote; never re-ordered under a finger)
    const shelf = O ? O.shelfOrder(base, O.storedOrder()) : base;   // (FIXES R2 — the owner: the PLAY sheet's neon marks, never the poster tiles)
    const host = asHost && isHost(), guestVotes = !isHost() && lobbyNow() && !votesOff;
    const games = host ? voteOrder(shelf, tally()) : shelf;
    const rows = new Map();
    const list = h('div.rc-games', ...games.map(g => {
      const dots = h('span.rc-gv-dots', { 'aria-hidden': 'true' }), n = h('b.rc-gv-n'), mine = h('em.rc-gv-mine', { hidden: true }, 'YOUR VOTE');
      const box = h('span.rc-gv', { hidden: true, role: 'button', 'data-gv': '1' }, dots, n);
      const help = guestVotes ? h('span.rc-game-help', { role: 'button', 'aria-label': `How to play ${g.name}`, 'data-help': '1' }, '?') : null;
      const btn = h('button.rc-game', { type: 'button', dataset: { theme: g.theme, game: g.id }, onclick: e => {
        const t = e && e.target && e.target.closest ? e.target : null;
        if (t && t.closest('[data-gv]')) { const r = tally().by[g.id]; if (r) toast(`${r.n} WANT${r.n === 1 ? 'S' : ''} ${String(g.name).toUpperCase()}`, 'ok', { sub: whoLine(r) }); return; }   // (the dots = who)
        if (t && t.closest('[data-help]')) { openHelp(g.id); return; }
        if (!asHost || !isHost()) { castVote(g); return; }
        // (SHELL 2.0 B1: the options open ON the picker — ‹ = back to the games, × = both)
        // (the host picks ANOTHER game after a match: the REMATCH ring goes back to PLAY + every vote clears)
        if (st.meta && st.meta.back && st.meta.back.rm) dbUpdate(dbRef(`rooms/${code()}`), { 'meta/back/rm': false, rv: null }).catch(() => {});
        lazyImport(import('./game-options.js'), './game-options.js').then(m => m.openGameOptions(g, { meta: st.meta }));
      } }, h('span.sh-row-ic.rc-game-ic', { style: { '--ic': GAME_ACC[g.id] || '#d6f0ff' }, html: markSvg(g), 'aria-hidden': 'true' }), h('span.rc-game-t', g.isNew ? h('em.gm-new', 'NEW') : null, h('small', g.tag), h('b', g.name, isOwnerTest(g.id) ? h('em.rc-game-test', 'TEST') : null), h('span', g.blurb), mine), box, help || h('i.rc-game-go', '›'));
      rows.set(g.id, { btn, dots, n, box, mine, sig: '' });
      return btn;
    }));
    // (MOST WANTED — the host's line on top: one tap = start it with the room's saved settings; hidden with no votes)
    const mwT = h('span.rc-mw-t');
    const mw = host ? h('button.rc-mw', { type: 'button', hidden: true, onclick: () => {
      const g = GAMES.find(x => x.id === mw.dataset.g && x.playable); if (!g || mw.classList.contains('is-busy')) return;
      mw.classList.add('is-busy'); sfx('select');
      lazyImport(import('./game-options.js'), './game-options.js').then(m => m.quickStart(g, { meta: st.meta })).then(ok => { if (!ok) mw.classList.remove('is-busy'); }, () => mw.classList.remove('is-busy'));
    } }, h('i.rc-mw-ic', { 'aria-hidden': 'true' }, '★'), mwT, h('i.rc-mw-go', { 'aria-hidden': 'true' }, 'START ›')) : null;
    const note = host ? 'Pick one, set it up, then INITIATE — everyone in the line is dealt in.' : guestVotes ? `Tap a game to vote for it — ${hostName().toUpperCase()} still picks. ? = how to play.` : 'Tap one to read how it plays while you wait.';
    const s = openPfSheet({ kicker: host ? 'YOU’RE THE HOST' : `${hostName().toUpperCase()} PICKS THE GAME`, title: host ? 'PICK A GAME' : 'THE GAMES', cls: 'rc-games-sheet',
      body: [mw, list, h('p.sh-note.is-small', note)].filter(Boolean),
      onClose: () => { gamesOpen = null; } });
    gamesOpen = { sheet: s, rows, mw, mwT };
    paintGamesNow();
    if (host) { markGvSeen(); paintDock(); }
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
    // (CITY C 0d: the city HOLDS at the tap — its ~200 ms frames at 4× CPU stop before the list's modules load; the list takes the hold over)
    const hold = holdCity();
    lazyImport(import('./room-guests.js'), './room-guests.js').then(m => m.openGuestList({ get st() { return st; }, hold, openCard: openPlayerCard, invite: () => { sfx('select'); invite(); }, leave: askLeave, onClose: () => { guestsUi = null; } }), e => { hold(); throw e; }).then(g => { if (destroyed) { g.close(); return; } guestsUi = g; }).catch(e => { guestsUi = null; console.warn('guests', e); });
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
    // (CITY PART 1: a vote that lands after the room moved on is refused by the rule — EXPECTED: the quiet 'late-vote', never an alarm or a toast)
    expectRefusal(`rooms/${code()}/rv/${st.uid}`, 'a late rematch vote (the room had moved on)', 8000, 'late-vote');
    dbUpdate(dbRef(`rooms/${code()}`), { [`rv/${st.uid}`]: mine ? null : vs.m }).catch(e => { if (!(e && /permission|denied/i.test(String(e.code || e.message)))) toast('COULD NOT REACH THE ROOM', 'err'); }).finally(() => { voting = false; });
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
    // (CITY G — A LATE VOTE NEVER GOES IN: CITY F's queued podium vote (ns:rv-wait) went in here, after its end screen was gone — refused by
    //  the rules, /admin Nov 17 10:27 pm. Nothing is queued any more; a key an older build left is simply dropped)
    if (vs.on) { try { sessionStorage.removeItem('ns:rv-wait'); } catch { /* fine */ } }
    const rm = vs.on ? { on: true, voted: !!(st.rv && st.rv[st.uid] === vs.m), n: vs.voters.length, total: vs.total, pips: vs.guests.map(u => ({ col: colorHex((P[u] || {}).color), on: vs.voters.includes(u) })) } : null;
    dock.set({ gamesN: gamesN(), host: isHost(), hostName: hostName(), alone: isHost() && ids.length === 1 && !invited() && !soloRoom(), newGame: isHost() && vs.on ? (ngSeen() ? 'calm' : 'breathe') : null, guestsDot: ids.some(u => u !== st.uid && !seen.has(u)), chatDot: unread > 0, chatN: unread,
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
  // THE ROOM NOTE (the owner's add-on, Nov 13 1:38 pm — core/room-note.js): ONE LINE in a slim pill sized to its words, just above the dock
  // (css/title.css .rc-note — the room's own; the title's .nd-note steps aside in a room). LIVE: "<GAME> IS ON · TAP TO WATCH" + a × (44 pt)
  // that hides it until the NEXT match (per match id, localStorage — a refresh keeps it; storage blocked → this page's memory); the pill's
  // body still opens the watch, and the first watch of a match says "you're dealt into the next one" (THE MESSAGE, once). IDLE: "ROOM CLOSES
  // IN n MIN · …" — no × (the host must see it). Taps through the dock's own pointer-up path (title-dock.js hands its pressTap over — this
  // lazy chunk imports no new export); a repaint waits for a finger on the pill to land (ui/tapwatch.js#afterTap — never under a finger).
  const wire = (el, fn) => (dock && typeof dock.pressTap === 'function' ? dock.pressTap(el, fn) : (el.addEventListener('click', fn), el));
  const noteWords = h('span.rc-note-w');
  const noteBody = wire(h('button.rc-note-t', { type: 'button' }, h('i.rc-note-dot', { 'aria-hidden': 'true' }), noteWords), () => onNote());
  const noteX = wire(h('button.rc-note-x', { type: 'button', 'aria-label': 'Hide this until the next game', hidden: true },
    h('span', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6"/></svg>' })), () => hideNote());
  const noteEl = h('div.rc-note', { role: 'status', 'aria-live': 'polite' }, noteBody, noteX);
  { const above = dockHost && dockHost.querySelector('.nd-above'); if (above) above.prepend(noteEl); }
  let noteKind = '', noteSig = '';
  const readHide = () => { try { return localStorage.getItem(NOTE_HIDE_KEY); } catch { return null; } };
  function paintNotes() { afterTap(paintNotesNow); }
  function paintNotesNow() {
    if (destroyed || !st.meta) return;
    const g = st.game || null, mid = (g && g.matchId) || '', gm = g && GAMES.find(x => x.id === g.id), key = noteHideKey(code(), mid);
    const n = roomNote({ status: st.meta.status, matchId: mid, gameName: gm ? gm.name : '', quit: st.quit, left: idleLeft(st.meta, serverNow()),
      warnMs: ROOM_IDLE_WARN_MS, host: isHost(), code: code(), hidden: key && hideMem === key ? hideMem : readHide() });
    noteKind = n.kind;
    const sig = `${n.kind}|${n.text}|${n.close ? 1 : 0}`;
    if (sig === noteSig) return;
    noteSig = sig;
    if (n.text) { noteWords.textContent = n.text; noteEl.dataset.kind = n.kind; noteX.hidden = !n.close; }   // (fading out: the last words stay)
    noteEl.classList.toggle('is-on', !!n.text);
  }
  function hideNote() {
    const key = noteHideKey(code(), st.game && st.game.matchId);
    if (!key || noteKind !== 'live') return;
    hideMem = key;
    try { localStorage.setItem(NOTE_HIDE_KEY, key); } catch { /* this page's memory holds it */ }
    sfx('tap');
    paintNotesNow();
  }
  function onNote() {
    if (noteKind === 'live') {
      const m = st.game && st.game.matchId, gm = st.game && GAMES.find(x => x.id === st.game.id);
      setState({ quit: null });
      if (m && !watchSaid.has(m)) { watchSaid.add(m); sayWatching(gm ? gm.name : ''); }
    } else if (noteKind === 'idle' && isHost()) dbUpdate(dbRef(`rooms/${code()}/meta`), { activeAt: serverTimestamp() }).then(() => toast('ROOM KEPT OPEN FOR ANOTHER HOUR', 'ok')).catch(() => toast('COULD NOT REACH THE ROOM', 'err'));
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
    wirePick();   // (CITY A — item 15: the picked game's graph, re-wired when the host changes it)
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
    if (gamesOpen && gamesOpen.rows) paintGames();   // (CITY PART 2: the votes live on an open GAMES sheet)
    if (!raf) raf = requestAnimationFrame(frame);
  }

  return {
    update,
    dock,
    startFx: () => (goFx ? { m: goFx.m } : null),
    vote: () => voteNow(),
    banner: () => banner.debug(),
    hostCard: () => (hostCard ? { text: hostCard.el.textContent } : null),
    debug: () => ({ gv: ({ tally: tally(), mine: myVote(st.gv, st.uid), n: gamesN(), off: votesOff, sheet: gamesOpen && gamesOpen.rows ? { mw: gamesOpen.mw ? (gamesOpen.mw.hidden ? '' : gamesOpen.mwT.textContent) : null, rows: [...gamesOpen.rows].map(([id, R]) => ({ id, n: R.n.textContent, dots: R.dots.children.length, mine: !R.mine.hidden })) } : null }),   // (CITY PART 2 — GAME VOTES: the votes E2E's read)
      tags: [...tags.keys()], roster: roster(), seen: seen ? [...seen] : null,
      note: { kind: noteKind, on: noteEl.classList.contains('is-on'), text: noteWords.textContent, x: !noteX.hidden },   // (THE ROOM NOTE — the tests' read)
      hits: Object.fromEntries([...tags].map(([u, T]) => [u, T.hit && { x0: Math.round(T.hit.x0), x1: Math.round(T.hit.x1), y0: Math.round(T.hit.y0), y1: Math.round(T.hit.y1) }])) }),
    nearestAt,
    destroy() {
      destroyed = true; clearTimeout(wireT); cancelAnimationFrame(raf); clearInterval(noteT); clearTimeout(graceT); closeHostCard(); if (offChat) offChat(); if (offFr) offFr(); if (invSheet) invSheet.close(); banner.destroy();
      // (the start's veil stays over the hand-off to the game screen — app.js's screen-in fades the game up; then it goes)
      if (goFx) { const v = goFx.veil; goFx.veil = h('i'); v.style.animation = 'none'; v.style.opacity = '1'; void v.offsetWidth; v.style.transition = 'opacity 0.45s ease'; v.style.opacity = '0'; setTimeout(() => v.remove(), 500); endFx(); }
      // (SPEED PASS B: out of the room only YOUR figure leaves the promenade — waving only on a LEAVE; the others carry on inside)
      if (scene && scene.room) { const x = exitHow(); scene.room(null, { me: st.uid, wave: !!(x && x.how === 'leave') }); }
      if (scene && scene.hush) scene.hush(null);
      clearTimeout(pickT);
      layer.remove(); noteEl.remove(); document.body.classList.remove('rc-on', 'rc-solo');
      if (dock) { dock.els.door.remove(); dock.destroy(); }
      if (guestsUi && guestsUi.close) guestsUi.close();
      if (gamesOpen) gamesOpen.close();
    },
  };
}
