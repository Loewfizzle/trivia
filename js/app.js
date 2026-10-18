// Entry point: boot Firebase, restore session, route state -> screen.
import { h, $ } from './ui/dom.js';
import { glitchFlash } from './ui/components.js';
import { toast } from './ui/toast.js';
import { APP_NAME, GAMES } from './config.js';
import { state, setState, subscribe } from './store.js';
import { initFirebase, isConfigured } from './firebase.js';
import { inviteCode, watchDuplicateTabs, slot, loadSession } from './identity.js';
import { resumeSession, armPresence, roomExists } from './room.js';
import { startHostLoop } from './host.js';
import { keepAwake } from './wakelock.js';
import { GAME_MODULES } from './games/registry.js';
import { createTitle } from './screens/title.js';
import { createSetup } from './screens/setup.js';
import { createLobby } from './screens/lobby.js';
import { installAudio } from './audio/engine.js';
import { playMusic, musicDebug } from './audio/music.js';
import { sfx } from './audio/sfx.js';
import { installSettingsPanel } from './ui/settings-panel.js';
import { showBackdrop } from './screens/district/backdrop.js';
import { settings, onSettings } from './audio/settings.js';
import { lazyView } from './games/lazy-view.js';

// THE BOARD and the profile load only when opened (they're behind the title's buttons)
const createBoardScreen = lazyView(() => import('./board/screen.js'));
const createProfileScreen = lazyView(() => import('./screens/profile.js'));
// profiles + the results queue: loaded once Firebase is up (never on the first paint)
let profileMods = null;
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
  if (!st.code) return st.view === 'setup' ? `setup:${st.setupMode}` : st.view === 'board' ? 'board' : st.view === 'profile' ? 'profile' : 'title';
  if (!st.meta) return 'boot';
  if (st.meta.status === 'playing' && st.game && GAME_MODULES[st.game.id]) return `game:${st.game.id}:${st.game.matchId}`;
  return `lobby:${st.code}`;
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

// Which music track a state should hear. [track, fallbackIfMissing]
function musicFor(st) {
  if (!st.code && (st.view === 'board' || st.view === 'profile')) return ['menu1', 'menu']; // menu.mp3 in the board hall
  if (!st.code || !st.meta || st.meta.status !== 'playing' || !st.game) return ['menu'];
  const mod = GAME_MODULES[st.game.id];
  // MUSIC: null = no music during the match (PULSE: the song is the music; menu music fades out)
  // musicFor(game): a track that changes during the match (NEON PAR: one per zone) -> [track, fallback]
  if (mod && mod.musicFor && st.game.phase !== 'final') return mod.musicFor(st.game);
  const track = mod && mod.musicFor ? mod.musicFor(st.game)[0] : mod && 'MUSIC' in mod ? mod.MUSIC : 'menu';
  return st.game.phase === 'final' ? ['victory', track] : [track];
}

function render(st) {
  const key = routeKey(st);
  if (st.ready || !st.code) { const [track, fallback] = musicFor(st); playMusic(track, fallback); }
  // theme follows the active game
  const theme = st.game && st.meta && st.meta.status === 'playing' ? (GAMES.find(g => g.id === st.game.id) || {}).theme : '';
  document.body.dataset.theme = theme || '';
  keepAwake(!!(st.code && st.meta && st.meta.status === 'playing'));
  renderConnection(st);
  // the menus (setup, lobby) sit on glass over the lit district, like the title
  const glass = key.startsWith('setup') || key.startsWith('lobby') || key === 'profile';
  if (document.body.classList.contains('nd-glass') !== glass) { document.body.classList.toggle('nd-glass', glass); showBackdrop(glass); }

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
    if (old.key !== 'boot') glitchFlash();
  }
  requestAnimationFrame(() => el.classList.add('screen-in'));
}

subscribe(render);
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
  if (back) withProfile().then(m => { if (m.me.shouldPromptKey()) import('./screens/profile.js').then(p => setTimeout(() => p.promptKey(), 1400)); }).catch(() => {});
});
// Room chat loads the first time we're in a room (never on the first paint): the in-game chat button.
let chatInstalled = false;
subscribe(st => {
  if (chatInstalled || !st.code) return;
  chatInstalled = true;
  import('./chat/ui.js').then(m => m.installChatFab()).catch(e => { chatInstalled = false; console.warn('chat', e); });
});

// ---- connection banner: "reconnecting…" while our own socket is down, "back online" when it returns ----
let everConnected = false;
let wasOffline = false;
let backTimer = 0;
function renderConnection(st) {
  if (st.connected) everConnected = true;
  const offline = st.ready && everConnected && (!st.connected || !navigator.onLine);
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
  el.classList.add('out');
  setTimeout(() => el.remove(), 500);
}

async function boot() {
  installAudio();
  installSettingsPanel();
  const fxClass = () => document.body.classList.toggle('reduced-fx', !!settings.reducedFx);
  fxClass();
  onSettings(fxClass);
  // Soft UI tick on every button press (game keyboards opt out with data-sfx="none").
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('button');
    if (b && !b.closest('[data-sfx="none"]') && !b.disabled) sfx('tap');
  }, { capture: true, passive: true });
  // Music is lazy: tracks download only after the first tap unlocks audio (see audio/music.js).
  window.__arcade = { musicDebug, state };
  // Escape closes the top-most sheet (its backdrop click handler does the closing).
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const modal = [...document.querySelectorAll('.modal:not(.out)')].pop();
    if (modal) modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  // iOS: block pinch-zoom gestures (viewport meta alone is ignored by Safari).
  document.addEventListener('gesturestart', e => e.preventDefault());
  watchDuplicateTabs(() => toast(slot === '1'
    ? 'ALREADY OPEN IN ANOTHER TAB — ADD ?slot=2 TO THE URL TO TEST A SECOND PLAYER'
    : `SLOT ${slot} IS ALREADY OPEN IN ANOTHER TAB`, 'warn', 6000));

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
    const uid = await initFirebase(connected => {
      setState({ connected });
      if (connected) armPresence();
    });
    setState({ uid });
    withProfile().then(m => { m.me.watchProfile(); m.me.syncMe(); m.queue.startQueue(); }).catch(e => console.warn('profile', e));
    const saved = loadSession();
    const resumed = await resumeSession();
    if (resumed === 'gone') setState({ inviteExpired: saved.code, invite: '' });
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
  // Installable app: a network-first service worker (never caches Firebase traffic). Not on localhost/dev.
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/^(localhost|127\.)/.test(location.hostname)) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

boot();
