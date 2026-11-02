// /daychart — THE DAY CHART on its own page (SCHED Group 5): admins only (the same check as /admin: this browser's profile id against
// ADMIN_PIDS, /api/admin whoami) — the legendaries' times are a spoiler. A local preview (localhost / 127.0.0.1 with ?preview) skips the check.
import { h } from '../ui/dom.js';
import { initFirebase, isConfigured } from '../firebase.js';
import { api } from '../profile/api.js';
import { mountDayChart } from './daychart.js';

const app = document.getElementById('app');
const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has('preview');
function show() {
  const root = h('div');
  app.replaceChildren(h('header.dc-page-head', h('div', h('div.dc-kicker', 'NEON SPEAKEASY · CITY 2.0'), h('h1', 'The day chart')), h('a.dc-link', { href: '/admin' }, 'Admin ›')), root);
  mountDayChart(root);
}
async function boot() {
  if (local) { show(); return; }
  try {
    if (!isConfigured) throw new Error('Firebase is not configured.');
    await initFirebase();
    const who = await api('admin', { action: 'whoami' });
    if (!who.admin) { app.replaceChildren(h('section.dc-card.dc-deny', h('h2.dc-title', 'Admins only'), h('p.dc-sum', 'The day chart shows when the legendaries come — a spoiler. Open it on the admin’s phone.'))); return; }
    show();
  } catch (e) {
    app.replaceChildren(h('section.dc-card.dc-deny', h('h2.dc-title', 'Can’t check who you are'), h('p.dc-sum', e.message || String(e))));
  }
}
boot();
