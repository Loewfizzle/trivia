// /lab — THE CARD LAB (THE VAULT 1A; docs/vault.md). Admins only: signs in with this browser's own anonymous identity (the same profile
// as the game here), asks the server who it is (POST /api/admin whoami — the owner's ADMIN_PIDS; the crew + strangers get the door), and
// reads + writes the marks through /api/admin (labMarks / labMark — server-checked, audited). The views: js/vault/lab-views.js.
import { h } from '../ui/dom.js';
import { initFirebase, isConfigured } from '../firebase.js';
import { api } from '../profile/api.js';
import { mountLab } from './lab-views.js';

const app = document.getElementById('app');

function denied(who) {
  app.replaceChildren(h('section.vl-deny',
    h('div.vl-lab-k', 'NEON SPEAKEASY · THE VAULT'),
    h('h1', 'THE CARD LAB'),
    h('p', 'This room is for the owner. Open it in the browser where your admin profile lives (the one with the radio).'),
    who && who.pid ? h('p', 'This browser’s profile id: ', h('code', who.pid)) : h('p', 'No profile on this browser yet — open the game here once (or bring your card with your key) and come back.'),
    h('p', h('a.vl-a', { href: '/' }, '‹ Back to the game'))));
}

async function boot() {
  if (!isConfigured) { app.replaceChildren(h('p', 'Firebase is not configured.')); return; }
  try {
    await initFirebase();
    const who = await api('admin', { action: 'whoami' });
    if (!who.admin) { denied(who); return; }
    const { marks } = await api('admin', { action: 'labMarks' });
    const lab = mountLab(app, { marks, onMark: (id, mark, note) => api('admin', { action: 'labMark', id, mark, note }) });
    window.__labPage = { lab, who };
  } catch (e) {
    app.replaceChildren(h('section.vl-deny', h('h1', 'Can’t reach the server'), h('p', e.message || String(e))));
  }
}
boot();
