// THE BOARD in the app (the title's third door). The hall and the scoreboard are js/board/view.js; this screen adds
// the player's own profile (their pinned row, exact ranks from the server) and the way back to the title.
import { createBoardView } from './view.js';
import { setState } from '../store.js';
import { loadMe } from '../identity.js';
import { backdropStill } from '../screens/district/backdrop.js';

export function createView() {
  let view = null, unsub = null, lastMe = '';
  const me = () => {
    const m = loadMe();
    return m && m.pid ? { pid: m.pid, profile: m.profile } : null;
  };
  return {
    mount(el, st) {
      el.classList.add('bd-screen');
      document.body.classList.add('bd-on');
      view = createBoardView({
        mode: 'app',
        me,
        ranks: async boards => (await import('../profile/me.js')).myRanks(boards),
        onBack: () => { try { sessionStorage.setItem('nd:back', '1'); } catch { /* fine */ } setState({ view: 'title' }); },
        onProfile: () => setState({ view: 'profile' }),
        initial: { still: backdropStill(), game: st.boardGame || undefined },
      });
      el.append(view.el);
      view.start();
      window.__board = { state: () => view.state(), pick: (g, c, p) => view.pick(g, c, p) };
      lastMe = JSON.stringify(st.me || null);
    },
    update(st) {
      const s = JSON.stringify(st.me || null);
      if (s !== lastMe) { lastMe = s; view && view.meChanged(); }
    },
    unmount() {
      document.body.classList.remove('bd-on');
      if (unsub) unsub();
      view && view.destroy();
      delete window.__board;
    },
  };
}
