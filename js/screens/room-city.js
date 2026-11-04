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
import { reducedMotion } from '../ui/dom.js';
import { closeAll } from '../ui/layers.js';
import { startShow, fileInOrder, backShow, voteState, START_MS, PUSH_AT_MS, GO_DEAD_MS, goWaiting } from '../core/room-show.js';
import { createRoomBanner } from './room-banner.js';

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
    play: () => {
      // (LOBBY 2.0 B — THE REMATCH RING: the host's tap = the same game + settings, everyone in (incl. late joiners — host.js#rematch); a
      //  guest's tap = their VOTE (again = take it back); nothing ever starts by itself)
      const vs = voteNow();
      if (vs.on) { if (isHost()) { sfx('select'); import('../host.js').then(m => m.rematch()).catch(() => {}); } else toggleVote(vs); return; }
      if (!isHost()) { toast(`WAITING FOR ${hostName().toUpperCase()} TO START`, 'info'); return; }
      sfx('select'); openGames(true);
    },
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
      s.close();
      // (the host picks ANOTHER game after a match: the REMATCH ring goes back to PLAY + every vote clears)
      if (st.meta && st.meta.back && st.meta.back.rm) dbUpdate(dbRef(`rooms/${code()}`), { 'meta/back/rm': false, rv: null }).catch(() => {});
      import('./game-options.js').then(m => m.openGameOptions(g, { meta: st.meta }));
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
    // (THE OWNER — the radio loaded: another player's card is the radio's own, with THE CREW switch — harbor/radio.js listens)
    if (uid !== st.uid && document.body.classList.contains('rd-owner')) { window.dispatchEvent(new CustomEvent('ns:owner-card', { detail: { uid } })); return; }
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
    el.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 14) openPlayerCard(nearestAt(e.clientX, e.clientY) || uid); down = null; });
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
  import('../chat/chat.js').then(m => { if (destroyed) return; chatMod = m; offChat = m.onChat(() => { paintDock(); paintBubbles(); }); paintDock(); }).catch(() => {});
  function paintDock() {
    if (!dock || destroyed) return;
    const P = players(), me = P[st.uid] || {}, ids = Object.keys(P);
    if (!seen) seen = loadSeen() || new Set(ids);
    const unread = chatMod ? chatMod.chat.unread || 0 : 0;
    const vs = voteNow();
    const rm = vs.on ? { on: true, voted: !!(st.rv && st.rv[st.uid] === vs.m), n: vs.voters.length, total: vs.total, pips: vs.guests.map(u => ({ col: colorHex((P[u] || {}).color), on: vs.voters.includes(u) })) } : null;
    dock.set({ host: isHost(), hostName: hostName(), guestsDot: ids.some(u => u !== st.uid && !seen.has(u)), chatDot: unread > 0, chatN: unread,
      you: avatar(me.avatar || 'bolt', me.color || 'magenta', 27), youSig: `${me.avatar}|${me.color}`, youAria: `Your card, ${me.name || ''}`, rm });
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

  // ---------------------------------------------------------------- LOBBY 2.0 B — THE GAME START (the owner, Nov 4 7:56 am: "as planned")
  // From the host's tap, on every phone at once (meta/go on the server clock — core/room-show.js), START_MS (2.6 s) at most:
  //   the speakeasy's NEON sign POWERS DOWN (a flicker out) → the GAME's own tube logo POWERS UP on it under "TONIGHT" → the TWO LINES file
  //   in through the side door (people.js — the host first, the lines alternating) → the view PUSHES THROUGH THE DOOR (the screen scales
  //   toward the door + a dark veil) → app.js routes to the game. Every part is a CSS animation started at a NEGATIVE delay = the show's age:
  //   a refresh / a late joiner / a new host mid-start lands on the same frame. transform + opacity only. Reduced motion: no flicker, no
  //   walk, no push — the sign swaps by a plain fade and the city cross-fades to the game.
  let goFx = null;
  function startFx() {
    const ss = startShow(st.meta, st.game, serverNow());
    // (past the start with the match still being prepared — a slow bank / song: the veil holds WHILE THE STAMP IS UP, at most GO_DEAD_MS (FR6
    //  FIXES A — B3: a 12-s start used to lift the veil at 9 s, relight the sign, then hard-cut into the game); a failed / dead start takes
    //  the stamp down (host.js) → the veil lifts on every phone with THE START DIDN'T GO THROUGH (B2))
    const wAge = goWaiting(st.meta, st.game, serverNow()), waiting = wAge != null && wAge < GO_DEAD_MS;
    if (!ss.on) {
      if (goFx && waiting && wAge > START_MS + 600 && !goFx.slow) { goFx.slow = true; goFx.veil.append(h('div.rc-veil-note', 'GETTING THE GAME READY…')); }
      if (goFx && !(st.meta && st.meta.status === 'playing') && !waiting) { const m = goFx.m; endFx(); startDied(m); }
      return;
    }
    if (goFx && goFx.m === ss.m) return;
    if (goFx) endFx();
    const g = GAMES.find(x => x.id === ss.g) || { id: ss.g, name: ss.g };
    const screen = sign ? sign.closest('.screen') : null, age = Math.round(ss.age);
    const veil = h('div.rc-veil', { 'aria-hidden': 'true' });
    const tonight = h('div.rc-tonight', { 'aria-hidden': 'true' }, h('small.rc-tonight-k', 'TONIGHT'), h('div.rc-tonight-logo'));
    goFx = { m: ss.m, screen, veil, tonight };
    import('../ui/tube-logo.js').then(T => { if (goFx && goFx.m === ss.m) goFx.tonight.lastChild.innerHTML = T.gameLogoSvg(g, { id: `rcg-${g.id}`, lit: true, premium: true }); }).catch(() => {});
    for (const el of [document.body, screen, sign, veil, tonight]) if (el) el.style.setProperty('--rc-age', `-${age}ms`);
    document.body.style.setProperty('--rc-push', `${PUSH_AT_MS - age}ms`);
    document.body.style.setProperty('--rc-len', `${START_MS - PUSH_AT_MS}ms`);
    if (sign) { sign.append(tonight); sign.classList.add('rc-go'); }
    // (the city's own parts of the sign — its glow + its daylight glass on the canvas: THE SIGN-DIM HOOK, the one the TR-3B uses)
    if (scene && scene.dimSign) scene.dimSign('room-start', { logo: 0, tag: 0, ms: Math.max(60, 450 - age) });
    // (the push: toward the side door's point on THIS phone's screen)
    const d = scene && scene.roomDoor ? scene.roomDoor() : null;
    // (both layers move together: the screen (the sign, the dock) + the city's own layer (.nd-scene — outside the screen); each scales about
    //  the door's point in its own box — read once, here, never in a frame)
    const layers = [screen, document.querySelector('.nd-scene')].filter(Boolean);
    for (const el of layers) { if (d) { const r = el.getBoundingClientRect(); el.style.transformOrigin = `${Math.round(d.x - r.left)}px ${Math.round(d.y - r.top)}px`; } el.classList.add('rc-pushing'); }
    goFx.layers = layers;
    document.body.append(veil);
    document.body.classList.add('rc-going');
    // (the sign's own recorded neon — a dropout as NEON goes out, a catch as the game's logo lights; only from the start itself, never a refresh)
    if (age < 300 && !reducedMotion()) import('../audio/ambience.js').then(A => { A.neonDropout({ level: 0.7 }); goFx && (goFx.catchT = setTimeout(() => A.neonCatch({ level: 0.6, dur: 0.9 }), 470 - age)); }).catch(() => {});
    for (const gs of [gamesOpen, guestsUi]) if (gs && gs.close) gs.close();
    closeAll();   // (FR6 FIXES A — B1: EVERY sheet + overlay on every phone — the profile, CUSTOMIZE, the full card, ☰, HOW TO PLAY…; never one over the match)
    // (THE CARTRIDGE PLUG — its loading: the walk inside is the console's loading time on EVERY phone — the view module + its sheets warm,
    //  the game's own preload (pools, sounds) runs; the city is still drawing, so nothing heavy is BUILT here — only fetched)
    import('../games/registry.js').then(R => { const mod = R.GAME_MODULES[ss.g]; if (!mod) return; if (mod.createView && mod.createView.warm) mod.createView.warm(); if (typeof mod.preload === 'function') { try { mod.preload({ settings: (st.meta && st.meta.settings && st.meta.settings[ss.g]) || mod.DEFAULT_SETTINGS || {}, host: isHost() }); } catch (e) { console.warn('preload', e); } } }).catch(() => {});
  }
  const diedSaid = new Set();
  function startDied(m) {
    if (diedSaid.has(m)) return; diedSaid.add(m);
    if (!isHost()) toast('THE START DIDN’T GO THROUGH — THE HOST CAN TRY AGAIN', 'warn', 4500);   // (the host's phone says its own — host.js)
  }
  function endFx() {
    if (!goFx) return;
    const { veil, tonight, layers = [], catchT } = goFx; goFx = null; clearTimeout(catchT);
    veil.remove(); tonight.remove();
    if (sign) sign.classList.remove('rc-go');
    if (scene && scene.dimSign) scene.dimSign('room-start', null);
    for (const el of layers) { el.classList.remove('rc-pushing'); el.style.transformOrigin = ''; }
    document.body.classList.remove('rc-going');
  }

  // ---------------------------------------------------------------- the roster → the city
  // (LOBBY 2.0 B — THE GAME START's file-in + THE WALK BACK OUT: each player's own place in the show, from the room's stamps — core/room-show.js;
  //  reduced motion: no walk — they stand, and the start is a plain cross-fade)
  function roster() {
    const P = players(), order = roomOrder(P, st.meta && st.meta.hostId), now = serverNow(), mo = !reducedMotion();
    const ss = startShow(st.meta, st.game, now), bs = ss.on ? { on: false } : backShow(st.meta, P, now, st.night);
    const inAt = ss.on && mo ? new Map(fileInOrder(P, st.meta.hostId).map(o => [o.uid, o.at])) : null;
    const outAt = bs.on && mo ? new Map(bs.order.map(o => [o.uid, o.at])) : null;
    const list = order.map(o => ({ uid: o.uid, slot: o.slot, online: isOnline(st.presence, o.uid), col: rgbOf(P[o.uid].color), fresh: now - (P[o.uid].joinedAt || 0) < FRESH_MS,
      goT: inAt && inAt.has(o.uid) ? ss.age / 1000 - inAt.get(o.uid) : undefined, outT: outAt && outAt.has(o.uid) ? bs.age / 1000 - outAt.get(o.uid) : undefined }));
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
      for (const q of list) if (before.size && !before.has(q.uid)) { popName(q.uid, NAME_MS + 6000); if (q.uid !== st.uid) import('../audio/lobby-sfx.js').then(m => m.lobbySfx('friend')).catch(() => {}); }
      if (!before.size) for (const q of list) if (q.fresh) popName(q.uid, NAME_MS + 8000);
    }
    if (scene && scene.hush) scene.hush(st.code);
    startFx();
    banner.update(st);
    paintDock();
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
    debug: () => ({ tags: [...tags.keys()], roster: roster(), seen: seen ? [...seen] : null, hits: Object.fromEntries([...tags].map(([u, T]) => [u, T.hit && { x0: Math.round(T.hit.x0), x1: Math.round(T.hit.x1), y0: Math.round(T.hit.y0), y1: Math.round(T.hit.y1) }])) }),
    nearestAt,
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); clearInterval(noteT); if (offChat) offChat(); banner.destroy();
      // (the start's veil stays over the hand-off to the game screen — app.js's screen-in fades the game up; then it goes)
      if (goFx) { const v = goFx.veil; goFx.veil = h('i'); v.style.animation = 'none'; v.style.opacity = '1'; void v.offsetWidth; v.style.transition = 'opacity 0.45s ease'; v.style.opacity = '0'; setTimeout(() => v.remove(), 500); endFx(); }
      if (scene && scene.room) scene.room(null);
      if (scene && scene.hush) scene.hush(null);
      layer.remove(); document.body.classList.remove('rc-on');
      if (dock) { dock.els.door.remove(); dock.destroy(); }
      if (guestsUi && guestsUi.close) guestsUi.close();
      if (gamesOpen) gamesOpen.close();
    },
  };
}
