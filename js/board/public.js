// neonspeakeasy.com/board — THE BOARD for anyone, no app and no sign-in: the same hall, read-only, with PLAY NOW.
// Deep links: /board?g=slip&c=records&p=all  (game, records|career, week|all). Your own row lights up when this
// browser has a profile (the app's localStorage, same site); exact ranks outside the top 100 live in the app.
import { createBoardView } from './view.js';
import { installEmblems } from '../ui/emblems.js';
import { installAudio } from '../audio/engine.js';

const q = new URLSearchParams(location.search);
function me() {
  try {
    const m = JSON.parse(localStorage.getItem('na:1:me') || 'null');
    return m && m.pid ? { pid: m.pid, profile: m.profile } : null;
  } catch { return null; }
}

installEmblems();
try { installAudio(); } catch { /* sound is polish */ }
const view = createBoardView({
  mode: 'public',
  me,
  initial: { game: q.get('g') || undefined, cat: q.get('c') || undefined, period: q.get('p') === 'all' ? 'all' : q.get('p') === 'week' ? 'week' : undefined },
});
document.getElementById('app').append(view.el);
view.start();
window.__board = { state: () => view.state(), pick: (g, c, p) => view.pick(g, c, p) };
requestAnimationFrame(() => document.documentElement.classList.add('bd-ready'));
