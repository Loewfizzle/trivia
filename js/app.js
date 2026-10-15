// Entry point: boot Firebase, restore session, route state -> screen.
import { h, $ } from './ui/dom.js';
import { glitchFlash } from './ui/components.js';
import { toast } from './ui/toast.js';
import { APP_NAME, GAMES } from './config.js';
import { state, setState, subscribe } from './store.js';
import { initFirebase, isConfigured } from './firebase.js';
import { inviteCode, watchDuplicateTabs, slot } from './identity.js';
import { resumeSession, armPresence } from './room.js';
import { startHostLoop } from './host.js';
import { keepAwake } from './wakelock.js';
import { GAME_MODULES } from './games/registry.js';
import { createTitle } from './screens/title.js';
import { createSetup } from './screens/setup.js';
import { createLobby } from './screens/lobby.js';
import { installAudio } from './audio/engine.js';
import { playMusic, prefetch, musicDebug } from './audio/music.js';
import { sfx } from './audio/sfx.js';
import { installSettingsPanel } from './ui/settings-panel.js';

document.title = APP_NAME;
const stage = $('#stage');
const netBadge = $('#net');
let current = null; // { key, screen, el }

function routeKey(st) {
  if (!st.ready) return 'boot';
  if (!st.code) return st.view === 'setup' ? `setup:${st.setupMode}` : 'title';
  if (!st.meta) return 'boot';
  if (st.meta.status === 'playing' && st.game && GAME_MODULES[st.game.id]) return `game:${st.game.id}:${st.game.matchId}`;
  return `lobby:${st.code}`;
}

function makeScreen(key) {
  if (key === 'title') return createTitle();
  if (key.startsWith('setup')) return createSetup();
  if (key.startsWith('lobby')) return createLobby();
  if (key.startsWith('game:')) return GAME_MODULES[key.split(':')[1]].createView();
  return { mount(el) { el.classList.add('boot-screen'); el.append(h('div.boot-spinner'), h('p.mono.dim', 'ESTABLISHING UPLINK…')); }, update() {} };
}

// Which music track a state should hear. [track, fallbackIfMissing]
function musicFor(st) {
  if (!st.code || !st.meta || st.meta.status !== 'playing' || !st.game) return ['menu'];
  const mod = GAME_MODULES[st.game.id];
  const track = (mod && mod.MUSIC) || 'menu';
  return st.game.phase === 'final' ? ['victory', track] : [track];
}

function render(st) {
  const key = routeKey(st);
  if (st.ready) { const [track, fallback] = musicFor(st); playMusic(track, fallback); }
  // theme follows the active game
  const theme = st.game && st.meta && st.meta.status === 'playing' ? (GAMES.find(g => g.id === st.game.id) || {}).theme : '';
  document.body.dataset.theme = theme || '';
  keepAwake(!!(st.code && st.meta && st.meta.status === 'playing'));
  netBadge.classList.toggle('is-on', st.ready && !st.connected);

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

async function boot() {
  installAudio();
  installSettingsPanel();
  // Soft UI tick on every button press (game keyboards opt out with data-sfx="none").
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('button');
    if (b && !b.closest('[data-sfx="none"]') && !b.disabled) sfx('tap');
  }, { capture: true, passive: true });
  // Music is lazy: the menu track warms up after first paint.
  setTimeout(() => prefetch('menu'), 1200);
  window.__arcade = { musicDebug, state };
  // iOS: block pinch-zoom gestures (viewport meta alone is ignored by Safari).
  document.addEventListener('gesturestart', e => e.preventDefault());
  watchDuplicateTabs(() => toast(slot === '1'
    ? 'ALREADY OPEN IN ANOTHER TAB — ADD ?slot=2 TO THE URL TO TEST A SECOND PLAYER'
    : `SLOT ${slot} IS ALREADY OPEN IN ANOTHER TAB`, 'warn', 6000));

  setState({ invite: inviteCode() });
  render(state);
  if (!isConfigured) {
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
    await resumeSession();
  } catch (e) {
    console.error(e);
    toast('UPLINK FAILED — CHECK CONNECTION', 'err', 5000);
  }
  setState({ ready: true });
  startHostLoop();
}

boot();
