// Entry point: boot Firebase, restore session, route state -> screen.
import { setErrorContext } from './errlog.js';   // first: errors from phones (it also sees errors while the app boots)
import { h, $ } from './ui/dom.js';
import './ui/vv.js';   // (THE VAULT 1B: --vv-ob — every bottom sheet above Safari's toolbar)
import { watchLayers, isTopLayer } from './ui/layers.js';
import { glitchFlash } from './ui/components.js';
import { toast } from './ui/toast.js';
import { APP_NAME, GAMES } from './config.js';
import { state, setState, subscribe } from './store.js';
import { initFirebase, isConfigured, serverNow, lineInfo } from './firebase.js';
import { inviteCode, watchDuplicateTabs, slot, loadSession } from './identity.js';
import { resumeSession, armPresence, roomExists } from './room.js';
import { startHostLoop } from './host.js';
import { keepAwake } from './wakelock.js';
import { GAME_MODULES } from './games/registry.js';
import { createTitle, harborReady, harborPending, harborRemote } from './screens/title.js';
import { createSetup } from './screens/setup.js';
import { createLobby } from './screens/lobby.js';
import { installAudio } from './audio/engine.js';
import { playMusic, musicDebug, musicSeek, registerTracks, setListProvider, switchNow, nowPlaying, cueMusic } from './audio/music.js';
import { partyMusicTick, partyCue, partyMusicDebug, partyClaims } from './audio/party-music.js';
import { cityClock } from './core/city.js';
import { loadMoodMusic, moodNow, fixedMood, songsFor, nextForDevice } from './audio/mood.js';
import { isCity2 } from './core/city.js';
import { lobbyMusicTick, lobbyMusicDebug } from './audio/lobby-music.js';
import { beatSource } from './audio/beat.js';
import { sfx } from './audio/sfx.js';
import { installSettingsPanel } from './ui/settings-panel.js';
import { showBackdrop } from './screens/backdrop.js';
import { settings, onSettings, PAGE_SILENT, setPageQuiet } from './audio/settings.js';
import { lazyView } from './games/lazy-view.js';
import { startShow } from './core/room-show.js';
import { debugTool, onDebugTools } from './ui/debug-tools.js';

// THE BOARD and the profile load only when opened (they're behind the title's buttons)
const createBoardScreen = lazyView(() => import('./board/screen.js'));
const createProfileScreen = lazyView(() => import('./screens/profile.js'));
// profiles + the results queue: loaded once Firebase is up (never on the first paint)
let profileMods = null;
let diagLoaded = false;            // (the AUDIO panel's module: loaded once it was ever on — FP's live switch)
const withProfile = () => (profileMods ||= Promise.all([import('./profile/me.js'), import('./profile/queue.js')]).then(([me, queue]) => ({ me, queue })));

document.title = APP_NAME;
const stage = $('#stage');
const netBadge = $('#net');
let current = null; // { key, screen, el }

// Players with a saved room wait on the boot screen while we reconnect them; everyone else
// gets the title screen straight away (it doesn't need Firebase until they tap HOST/JOIN).
const resuming = !!(loadSession() && loadSession().code);
if (resuming) { const s = document.querySelector('#boot .boot-status'); if (s) s.textContent = 'REJOINING YOUR ROOM'; }

function routeKey(st) {
  if (!st.ready && (resuming || st.code)) return 'boot';
  if (!st.code && harborPending()) return 'boot';   // ?city=2: the Harbor's module is still loading (title.js#harborReady)
  if (!st.code) return st.view === 'setup' ? `setup:${st.setupMode}` : st.view === 'board' ? 'board' : st.view === 'profile' ? 'profile' : 'title';
  // (LOBBY FIXES — THE DESKTOP HOST's FLASH: between HOST and the room's meta arriving (one round trip) this said 'boot' — the title unmounted,
  //  the boot screen faded in, then the title + its whole city came back. In City 2.0 the room IS the city: the title stays while the meta loads)
  if (!st.meta) return isCity2() && !harborPending() && current && current.key === 'title' ? 'title' : 'boot';
  // (LOBBY 2.0 B — THE GAME START: in City 2.0 the city stays up for the walk inside (core/room-show.js, ≤ 2.6 s from the host's tap, the
  //  same on every phone — a refresh / a late joiner past it goes straight to the game); a timer re-routes the moment it ends)
  if (st.meta.status === 'playing' && st.game && GAME_MODULES[st.game.id] && st.quit !== st.game.matchId) {
    if (isCity2() && !harborPending() && startShow(st.meta, st.game, serverNow()).on) { goTimer(st); return 'title'; }
    return `game:${st.game.id}:${st.game.matchId}`;
  }
  // LOBBY 2.0 A — THE ROOM IN THE CITY: in City 2.0 a room's waiting part IS the live city — the title screen stays (its city never
  // reloads) and turns into the room (screens/room-city.js); the profile from YOU opens over it. City 1.0 keeps today's lobby screen.
  if (isCity2()) return harborPending() ? 'boot' : 'title';   // (a refresh in a room waits for City 2.0's module, like the title does)
  return `lobby:${st.code}`;
}

let goT = 0, goM = '';
function goTimer(st) {
  const s = startShow(st.meta, st.game, serverNow());
  if (goM === st.game.matchId && goT) return;
  goM = st.game.matchId; clearTimeout(goT);
  goT = setTimeout(() => { goT = 0; render(state); }, Math.max(0, (s.on ? s.len - s.age : 0)) + 20);
}

function makeScreen(key) {
  if (key === 'title') return createTitle();
  if (key.startsWith('setup')) return createSetup();
  if (key === 'board') return createBoardScreen();
  if (key === 'profile') return createProfileScreen();
  if (key.startsWith('lobby')) return createLobby();
  if (key.startsWith('game:')) return GAME_MODULES[key.split(':')[1]].createView();
  return { mount(el) { el.classList.add('boot-screen'); }, update() {} }; // the inline #boot overlay covers this
}

// MOOD MUSIC (docs/audio.md): every menu screen follows the time of day — this phone's clock outside a room, the host's in a
// lobby (the room hears one synced song: audio/lobby-music.js). 'mood' is a provider list: the next song is chosen from the
// mood at that moment, so a mood change waits for the song to end. CLASSIC (settings) keeps the old menu playlist.
const moodOn = () => settings.menuMusic !== 'classic';
loadMoodMusic().then(d => {
  if (!d) return;
  registerTracks(Object.fromEntries(Object.keys(d.songs).map(id => [`m:${id}`, id])));
  setListProvider('mood', prev => {
    // (NIGHT-C — THE PARTY SONG IN SYNC: on the party's timeline this phone's own player starts the song EVERY phone hears, at its place)
    // (SKY-B — RADIO STATIONS: every City 2.0 mood is a station on the server clock — its song started at its place; partyCue → null in City 1.0)
    const m = moodNow(), c = moodOn() && !state.code ? partyCue(prev && prev.replace(/^m:/, '')) : null;
    // (SKY-A: …unless the synced player claims it — loading, it plays in a moment: nothing started here, no wasted download, no AbortError)
    if (c && !state.code && partyClaims()) return null;
    if (c) { cueMusic(`m:${c.id}`, c.at); return `m:${c.id}`; }
    const id = nextForDevice(m, prev && prev.replace(/^m:/, '')); return id ? `m:${id}` : null;
  });
  moodWatch();            // (the baseline reading now, not 2 s later: a mood picked in the first seconds still counts as a change)
  render(state);
});
// A FORCED change of mood — the listener picked one (MUSIC MOOD, the preview panel) or City 2.0's party starts — doesn't wait for the song to
// end: it crossfades to the new mood's next song over 4 s (music.js#switchNow). A natural change (evening → late night) never does: the
// song finishes and the next comes from the new mood. A song that is also in the new mood's deck (shared songs) just plays on.
let moodSeen = null, choiceSeen = null;
function moodWatch() {
  if (!moodOn()) { moodSeen = null; return; }
  const m = moodNow(), c = fixedMood();
  if (moodSeen !== null && m !== moodSeen && !lobbySynced && !partySynced && (c !== choiceSeen || (m === 'party' && isCity2()))) {
    const np = nowPlaying();
    // (APP FIXES — Grok 3.7: never while a STATION's timeline runs — the station's own change (party-music.js) places the song)
    if (!(np && songsFor(m).includes(np.id)) && !partyCue()) switchNow(4);
  }
  moodSeen = m; choiceSeen = c;
}
setInterval(moodWatch, 2000);
let lobbySynced = false, partySynced = false;
const inLobby = st => !!(st.code && st.meta && (st.meta.status !== 'playing' || !st.game || st.quit === st.game.matchId));
setInterval(() => {
  const was = lobbySynced, wasP = partySynced; const lob = inLobby(state) && state.ready; lobbySynced = lobbyMusicTick(state, moodOn() && lob, lob);
  // NIGHT-C — THE PARTY SONG IN SYNC (audio/party-music.js): City 2.0's menus outside a room, the PARTY mood — the party's timeline on the
  // server clock (a legendary's tape stop holds it on this phone's own player: the city clock's musicHold)
  const cc = isCity2() ? cityClock() : null;
  partySynced = partyMusicTick(!!cc && moodOn() && !state.code, !!(cc && cc.musicHold && cc.musicHold()));   // (SKY-B: every mood a station)
  if (was !== lobbySynced || wasP !== partySynced) render(state);
}, 250);

// Which music track a state should hear. [track, fallbackIfMissing]
function musicFor(st) {
  if (moodOn() && !(st.code && st.meta && st.meta.status === 'playing' && st.game && st.quit !== st.game.matchId)) {
    if (lobbySynced && inLobby(st)) return [null];          // the room's synced song is playing (lobby-music.js)
    if (partySynced && !st.code) return [null];             // (NIGHT-C) the party's synced song is playing (party-music.js)
    return ['mood', 'menu'];
  }
  if (!st.code && st.view === 'board') return ['menu3', 'menu'];     // THE BOARD's hall: menu3.mp3
  if (!st.code && st.view === 'profile') return ['menu1', 'menu'];   // the membership card: menu.mp3
  if (!st.code || !st.meta || st.meta.status !== 'playing' || !st.game || st.quit === st.game.matchId) return ['menu'];
  const mod = GAME_MODULES[st.game.id];
  // MUSIC: null = no music during the match (PULSE: the song is the music; menu music fades out)
  // musicFor(game): a track that changes during the match (NEON PAR: one per zone) -> [track, fallback]
  if (mod && mod.musicFor && st.game.phase !== 'final') return mod.musicFor(st.game);
  const track = mod && mod.musicFor ? mod.musicFor(st.game)[0] : mod && 'MUSIC' in mod ? mod.MUSIC : 'menu';
  // FINAL_MUSIC: a game's own podium music (HIGH STAKES: victory.mp3, never the other fanfares)
  return st.game.phase === 'final' ? [(mod && mod.FINAL_MUSIC) || 'victory', track] : [track];
}

function render(st) {
  const key = routeKey(st);
  if (st.ready || !st.code) { const [track, fallback] = musicFor(st); playMusic(track, fallback); }
  // theme follows the active game
  const theme = st.game && st.meta && st.meta.status === 'playing' && st.quit !== st.game.matchId ? (GAMES.find(g => g.id === st.game.id) || {}).theme : '';
  document.body.dataset.theme = theme || '';
  keepAwake(!!(st.code && st.meta && st.meta.status === 'playing'));
  renderConnection(st);
  // the menus (setup, lobby) sit on glass over the lit district, like the title
  const glass = key.startsWith('setup') || key.startsWith('lobby') || key === 'profile';
  if (document.body.classList.contains('nd-glass') !== glass) { document.body.classList.toggle('nd-glass', glass); showBackdrop(glass); }
  // SPLIT CORNERS (7a section 0): the lobby (like the title) puts ☰ top-left and the music top-right (components.css)
  document.body.classList.toggle('cb-split', key.startsWith('lobby'));

  if (current && current.key === key) { current.screen.update && current.screen.update(st); return; }
  const old = current;
  const el = h('section.screen');
  const screen = makeScreen(key);
  current = { key, screen, el };
  stage.append(el);
  screen.mount(el, st);
  if (old) {
    old.screen.unmount && old.screen.unmount();
    old.el.classList.add('screen-out');
    old.el.setAttribute('aria-hidden', 'true');
    setTimeout(() => old.el.remove(), 380);
    // (LOBBY 2.0 B: City 2.0's room ↔ a game has its own transitions — the push through the door in, the walk back out — never the glitch)
    if (old.key !== 'boot' && !(isCity2() && (old.key === 'title' || key === 'title') && st.code)) glitchFlash();
  }
  requestAnimationFrame(() => el.classList.add('screen-in'));
}

subscribe(render);
// error reports say which screen was up — never the room code or match id
setErrorContext(() => {
  const k = routeKey(state);
  if (k.startsWith('lobby')) return 'lobby';
  if (k.startsWith('game:')) return `game:${k.split(':')[1]}${state.game && state.game.phase ? `/${state.game.phase}` : ''}`;
  return k;
});
// A finished match goes to the global boards: every phone in it queues one report when the podium appears
// (the server counts it once and answers each phone with its own outcome). Back in the lobby, the key reminder.
let reportedKey = '';
subscribe(st => {
  const g = st.game;
  if (!st.code || !g || g.phase !== 'final' || !g.participants || !g.participants[st.uid]) return;
  const k = `${st.code}_${g.matchId}`;
  if (k === reportedKey) return;
  reportedKey = k;
  withProfile().then(m => m.queue.queueReport(st.code, g)).catch(() => {});
});
let lastStatus = '';
subscribe(st => {
  const s = st.code && st.meta ? st.meta.status : '';
  if (s === lastStatus) return;
  const back = lastStatus === 'playing' && s === 'lobby';
  lastStatus = s;
  // (LOBBY 2.0 A — THE SAVE-YOUR-KEY POP-UP: back from a counted match — a new player's first — profile/keypop.js; it waits while anything is up)
  if (back) import('./profile/keypop.js').then(k => setTimeout(() => k.maybeKeyPop({ why: 'match' }), 1400)).catch(() => {});
});
// THE CARTRIDGE PLUG (LOBBY 2.0 B — docs/cartridge.md): a game's own quick replies on the chat's chips row while it's on screen
let chipsFor = '';
subscribe(st => {
  const k = routeKey(st), id = k.startsWith('game:') ? k.split(':')[1] : '';
  if (id === chipsFor) return;
  chipsFor = id;
  import('./games/cartridge.js').then(C => import('./chat/ui.js').then(m => m.setGameChips(C.chipsOf(GAME_MODULES[id])))).catch(() => {});
});
// Room chat loads the first time we're in a room (never on the first paint): the in-game chat button.
let chatInstalled = false;
subscribe(st => {
  if (chatInstalled || !st.code) return;
  chatInstalled = true;
  import('./chat/ui.js').then(m => m.installChatFab()).catch(e => { chatInstalled = false; console.warn('chat', e); });
});

// ---- connection banner: "reconnecting…" while our own socket is down, "back online" when it returns ----
// CONN: a PARKED database (no room, nothing wanted it — firebase.js#want) is not "offline": no banner. st.net: 'parked' · 'waking'
// (opening; never warned, as before the first connection) · 'online' · 'lost' (it was up and the network dropped it)
let wasOffline = false;
let backTimer = 0;
function renderConnection(st) {
  const offline = st.ready && (st.net === 'lost' || (st.net === 'online' && !navigator.onLine));
  if (offline && !wasOffline) {
    clearTimeout(backTimer);
    netBadge.classList.remove('is-back');
    netBadge.classList.add('is-on');
    netBadge.querySelector('.net-text').textContent = navigator.onLine ? 'SIGNAL LOST — RECONNECTING…' : 'NO NETWORK — WAITING FOR SIGNAL…';
  } else if (!offline && wasOffline) {
    netBadge.classList.add('is-back');
    netBadge.querySelector('.net-text').textContent = 'SIGNAL RESTORED';
    sfx('lock');
    backTimer = setTimeout(() => netBadge.classList.remove('is-on', 'is-back'), 1800);
  }
  wasOffline = offline;
}
window.addEventListener('offline', () => renderConnection(state));
window.addEventListener('online', () => renderConnection(state));

// ---- boot overlay: fades once Firebase is ready and fonts have loaded (max ~1.5 s wait for fonts) ----
async function dismissBoot() {
  const el = document.getElementById('boot');
  if (!el) return;
  // wait for the core stylesheets (never show unstyled UI) and briefly for the web fonts
  await new Promise(r => { const check = () => (document.documentElement.classList.contains('css-ready') ? r() : setTimeout(check, 30)); check(); });
  // (the title's TAP TO ENTER should be up within ~1 s, so it waits less for the fonts)
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, resuming ? 1500 : 700))]); } catch { /* old browser */ }
  // (FP3a — THE LOAD GATE: on ?city=2 the boot screen — the dark sky + the unlit sign — stays until the Harbor's module is in, so a
  // slow network never shows the bare shell between it and the title; ≤ 8 s, then the shell's own boot route covers the rest)
  if (harborPending()) await Promise.race([harborReady, new Promise(r => setTimeout(r, 8000))]);
  el.classList.add('out');
  setTimeout(() => el.remove(), 500);
}

async function boot() {
  watchLayers();   // (LOBBY 2.0 B — ONE SHEET STACK: every pop-up opens on top of whatever opened it — ui/layers.js)
  installAudio();
  installSettingsPanel();
  // &debug=1: THE AUDIO DIAGNOSTIC (docs/audio.md#m3) — what the music is doing, on any screen; FP: or switched on from THE PREVIEW
  // PANEL → TOOLS → AUDIO PANEL on this device (ui/debug-tools.js: remembered, live on / off)
  const syncDiag = () => { if (PAGE_SILENT) return; const on = debugTool('audio'); if (on || diagLoaded) import('./audio/diag.js').then(m => { diagLoaded = true; if (debugTool('audio')) m.mountAudioDiag(); else m.unmountAudioDiag(); }).catch(() => {}); };
  syncDiag();
  onDebugTools(id => { if (id === 'audio') syncDiag(); });
  const fxClass = () => document.body.classList.toggle('reduced-fx', !!settings.reducedFx);
  fxClass();
  onSettings(fxClass);
  let lastMM = settings.menuMusic;
  onSettings(() => { if (settings.menuMusic !== lastMM) { lastMM = settings.menuMusic; render(state); } moodWatch(); });
  // Soft UI tick on every button press (game keyboards opt out with data-sfx="none").
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('button');
    if (b && !b.closest('[data-sfx="none"]') && !b.disabled) sfx('tap');
  }, { capture: true, passive: true });
  // Music is lazy: tracks download only after the first tap unlocks audio (see audio/music.js).
  window.__arcade = { musicDebug, musicSeek, lobbyMusicDebug, partyMusicDebug, beat: beatSource, mood: () => moodNow(), state, serverNow, line: lineInfo };
  // Escape closes the top-most sheet (its backdrop click handler does the closing).
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const modal = [...document.querySelectorAll('.modal:not(.out)')].pop();
    if (modal && isTopLayer(modal)) modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));   // (ONE SHEET STACK: only when it's the top layer)
  });
  // iOS: block pinch-zoom gestures (viewport meta alone is ignored by Safari).
  document.addEventListener('gesturestart', e => e.preventDefault());
  // THE SECOND TAB (PERF-A): never "add ?slot=2" (an empty login on a phone) — a banner that stays while the other tab is the player,
  // this tab's host loop stopped (state.dupTab); USE THIS TAB swaps them
  { let bar = null; const tabs = watchDuplicateTabs(y => {
    setState({ dupTab: y });
    setPageQuiet(y);   // (SPEED PASS B: a yielded tab never doubles the music — audio/settings.js)
    if (!y) { if (bar) { bar.remove(); bar = null; } return; }
    if (bar) return;
    bar = h('div.dup-tab', { role: 'status' },
      h('span', slot === '1' ? 'ALREADY OPEN IN ANOTHER TAB — USE THAT ONE' : `SLOT ${slot} IS ALREADY OPEN IN ANOTHER TAB`),
      h('button.btn.btn-sm.btn-ghost', { type: 'button', onclick: () => tabs.take() }, h('span', 'USE THIS TAB')));
    document.body.prepend(bar);   // (before the toasts' box: they step down under it — components.css)
  }); }

  setState({ invite: inviteCode() });
  render(state);
  // First-time visitors: show the title first, then start the Firebase SDK (~120 KB) once it has painted —
  // nothing on the title needs it (HOST/JOIN wait for firebaseReady). Returning players reconnect right away.
  if (!resuming) { await dismissBoot(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))); }
  if (!isConfigured) {
    dismissBoot();
    stage.replaceChildren(h('section.screen.screen-in.boot-screen',
      h('h2.sheet-title', 'FIREBASE NOT CONFIGURED'),
      h('p.mono.dim', 'Paste your web config into js/firebase-config.js — see CLAUDE.md.')));
    return;
  }
  try {
    const uid = await initFirebase((connected, net) => {
      setState({ connected, net });
      if (connected) armPresence();
    });
    setState({ uid });
    withProfile().then(m => { m.me.watchProfile(); m.me.syncMe(); m.queue.startQueue(); }).catch(e => console.warn('profile', e));
    const saved = loadSession();
    const resumed = await resumeSession();
    if (resumed === 'ok') setState({ invite: '' });   // (CITY 1.0 OUT — THE STUCK JOIN: a reload in a room left ?room= as an "invite" that filled JOIN after a LEAVE)
    else if (resumed === 'gone') setState({ inviteExpired: saved.code, invite: '' });
    else if (resumed === 'moved') { setState({ invite: '' }); import('./room.js').then(m => toast(`YOU’RE IN ROOM ${m.movedTo() || ''} ON ANOTHER DEVICE — JOIN TO MOVE HERE`, 'info', 5000)).catch(() => {}); }
    else if (resumed === 'idle') { setState({ invite: '' }); toast('YOUR ROOM CLOSED AFTER AN HOUR WITHOUT A GAME', 'info', 5000); }
    // Couldn't reach the room (weak signal): keep the seat and offer a one-tap REJOIN on the title.
    else if (resumed === 'error') setState({ rejoin: saved.code });
    // An invite link to a room that no longer exists: say so up front instead of failing on JOIN.
    else if (resumed === 'none' && state.invite && !(await roomExists(state.invite))) setState({ inviteExpired: state.invite, invite: '' });
  } catch (e) {
    console.error(e);
    toast('UPLINK FAILED — CHECK CONNECTION', 'err', 5000);
  }
  setState({ ready: true });
  dismissBoot();
  startHostLoop();
  // CITY CONTROLS A — THE RADIO: the server says who has one (radio-gate.js) — only then does anything load (City 2.0 only)
  if (isCity2()) setTimeout(() => import('./screens/harbor/radio-gate.js').then(m => m.startRadioGate({ remote: harborRemote, roomCode: () => state.code || null })).catch(e => console.warn('radio', e)), 2500);
  // Installable app: a network-first service worker (never caches Firebase traffic). Not on localhost/dev.
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/^(localhost|127\.)/.test(location.hostname)) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

boot();
harborReady.then(() => render(state));
