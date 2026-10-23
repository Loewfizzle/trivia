// neonspeakeasy.com/board — THE BOARD for anyone, no app and no sign-in: the same hall, read-only, with PLAY NOW.
// Deep links: /board?g=slip&c=records&p=all  (game, records|career, week|all). Your own row lights up when this
// browser has a profile (the app's localStorage, same site); exact ranks outside the top 100 live in the app.
import { setErrorContext } from '../errlog.js';   // first: it also sees errors while the page boots
import { createBoardView } from './view.js';
setErrorContext(() => 'board', 'board');
import { installEmblems } from '../ui/emblems.js';
import { installAudio } from '../audio/engine.js';
import { playMusic, registerTracks, setListProvider, musicDebug, musicNeedsRescue } from '../audio/music.js';
import { loadMoodMusic, moodNow, nextForDevice } from '../audio/mood.js';
import { settings, updateSettings, onSettings } from '../audio/settings.js';

const q = new URLSearchParams(location.search);
function me() {
  try {
    const m = JSON.parse(localStorage.getItem('na:1:me') || 'null');
    return m && m.pid ? { pid: m.pid, profile: m.profile } : null;
  } catch { return null; }
}

installEmblems();
try { installAudio(); } catch { /* sound is polish */ }
// MOOD MUSIC here too (docs/audio.md): it can only start after the visitor's first tap (the audio engine unlocks on it);
// the music button turns it on / off like in the app (same saved setting)
loadMoodMusic().then(d => {
  if (!d) return;
  registerTracks(Object.fromEntries(Object.keys(d.songs).map(id => [`m:${id}`, id])));
  setListProvider('mood', prev => { const id = nextForDevice(moodNow(), prev && prev.replace(/^m:/, '')); return id ? `m:${id}` : null; });
  playMusic(settings.menuMusic === 'classic' ? 'menu3' : 'mood', 'menu3');
});
{
  const NOTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/><path class="slash" d="M3 3l18 18"/></svg>';
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'music-btn bd-music'; b.innerHTML = NOTE;
  b.addEventListener('click', () => { if (musicNeedsRescue()) return; updateSettings({ musicOff: !settings.musicOff }); if (!settings.musicOff) musicNeedsRescue(); });
  const paint = () => { b.classList.toggle('is-off', !!(settings.musicOff || settings.muted)); b.setAttribute('aria-label', settings.musicOff ? 'Music off — tap to turn it on' : 'Music on — tap to turn it off'); };
  onSettings(paint); paint();
  document.body.append(b);
}
const view = createBoardView({
  mode: 'public',
  me,
  initial: { game: q.get('g') || undefined, cat: q.get('c') || undefined, period: q.get('p') === 'all' ? 'all' : q.get('p') === 'week' ? 'week' : undefined },
});
document.getElementById('app').append(view.el);
view.start();
window.__board = { state: () => view.state(), pick: (g, c, p) => view.pick(g, c, p), music: () => musicDebug() };
requestAnimationFrame(() => document.documentElement.classList.add('bd-ready'));
