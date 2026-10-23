// CITY 2.0 — THE PREVIEW PANEL: the owner's test remote (docs/harbor.md#the-preview-panel). ?city=2 only: title.js imports this
// module after the city's first paint, never on the default city.
//   everyone on ?city=2   listens to city2/live (server-written: /api/admin cityLive / cityClear) once Firebase is up and plays
//                         its state in sync from its startAt (the scene's remote(): the clock runs from there, a sky piece's
//                         first flight starts there) until CLEAR or `until`; then the real city again
//   the owner (admin)     a small TEST pill top left opens the glass sheet: JUST ME (this phone, live, kept for the tab) or
//                         EVERYONE ON CITY 2 (a draft, sent with SEND TO EVERYONE); every row comes from core/harbor-remote.js
// The state on this phone: JUST ME (if any) wins over EVERYONE's; nothing at all = the real city.
// NEON PASS 5 — A LINK'S OWN SETTINGS WIN (the owner's iPhone: a leftover JUST ME state, kept for the tab, replaced the party link's
// own &when): opening a link that carries its own preview flags (&when, &force, &speed, &wx, &scene…) drops a stored JUST ME state
// (a refresh of the same page keeps it, as before); while JUST ME is on the pill says so — "JUST ME · PARTY ON · SAT 10/24 23:00"
// — with a one-tap ✕ beside it.
// CITY 2.0 MUSIC: a MUSIC section — force a mood (AUTO / MORNING / DAY / EVENING / LATE NIGHT / PARTY: part of the state, so EVERYONE's
// phones follow too), SKIP TO THE NEXT SONG (this phone), and the song playing now with its beat grid's status.
import { h } from '../../ui/dom.js';
import { toast } from '../../ui/toast.js';
import { serverNow, firebaseReady, onValue, dbRef } from '../../firebase.js';
import { localParts, deviceZone } from '../../core/sky.js';
import { api as apiCall } from '../../profile/api.js';
import * as R from '../../core/harbor-remote.js';
import { songInfo } from '../../audio/beat.js';
import { switchNow } from '../../audio/music.js';
import { moodNow, MOOD_LABEL } from '../../audio/mood.js';

const ME_KEY = 'nd:hr-me', MODE_KEY = 'nd:hr-mode', ADMIN_KEY = 'nd:hr-admin';
const ss = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch { return null; } },
  set(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: fine */ } },
};
// (test-only: the panel without an admin profile — the previews and the emulator E2E; never on the real site's pages)
/** the link's own preview flags (not the tools: &debug, &grid) — a fresh link with any of them wins over a stored JUST ME */
const linkFlags = () => { try { const q = new URLSearchParams(location.search); return R.REMOTE_KEYS.filter(k => k !== 'debug' && k !== 'grid' && q.has(k)); } catch { return []; } };
const navType = () => { try { const e = performance.getEntriesByType('navigation')[0]; return (e && e.type) || 'navigate'; } catch { return 'navigate'; } };
let linkChecked = false;          // (once a page load: the title mounts the panel again after every visit to a menu)
const TEST_PANEL = typeof location !== 'undefined' && /[?&]panel=1(?:&|$)/.test(location.search)
  && (location.pathname.includes('/tests/') || /[?&]emu(?:[=&]|$)/.test(location.search));

export function createRemote({ scene, api = apiCall }) {
  let destroyed = false, live = null, unsub = null, admin = false, chip = null, bar = null, xb = null, label = null, sheet = null, sendBusy = false, typeT = 0;
  let mode = ss.get(MODE_KEY) === 'all' ? 'all' : 'me';
  let stored = ss.get(ME_KEY);
  if (!linkChecked) {
    linkChecked = true;
    if (stored && linkFlags().length && navType() !== 'reload') { ss.set(ME_KEY, null); stored = null; }
  }
  const mine = { state: R.cleanRemote(stored && stored.state).state, ui: (stored && stored.ui) || {}, at: serverNow() };
  let draft = { state: {}, ui: {} }, mins = R.DEFAULT_MINS;

  // ---------------------------------------------------------------- what this phone shows
  const liveOn = () => !!(live && live.until > serverNow());
  function apply() {
    const sc = scene();
    if (destroyed || !sc || !sc.remote) return;
    if (!R.isEmpty(mine.state)) sc.remote(R.toParams(mine.state), { at: mine.at, srv: serverNow });
    else if (liveOn()) sc.remote(R.toParams(live.state), { at: live.startAt, srv: serverNow });
    else sc.remote(null, { srv: serverNow });
    paintChip();
  }
  const tick = setInterval(() => { apply(); if (sheet) paintStatus(); }, 4000);

  // EVERYONE's node (readable by any signed-in visitor; only the server writes it)
  firebaseReady.then(() => {
    if (destroyed) return;
    try {
      unsub = onValue(dbRef('city2/live'), snap => {
        const v = snap && snap.val ? snap.val() : null;
        const ok = v && typeof v === 'object' && Number.isFinite(v.startAt) && Number.isFinite(v.until);
        live = ok ? { state: R.cleanRemote(v.state).state, startAt: v.startAt, until: v.until, by: v.by || null } : null;
        if (live && R.isEmpty(live.state)) live = null;
        apply();
        if (sheet) render();
      }, () => {});
    } catch (e) { console.warn('city2/live', e); }
  }).catch(() => {});

  // ---------------------------------------------------------------- the owner's pill (admins only)
  async function checkAdmin() {
    if (TEST_PANEL) return true;
    const c = ss.get(ADMIN_KEY);
    if (c && c.at > Date.now() - 6 * 3600e3) return !!c.admin;
    if (!api) return false;
    await firebaseReady;
    try { const r = await api('admin', { action: 'whoami' }); ss.set(ADMIN_KEY, { admin: !!r.admin, at: Date.now() }); return !!r.admin; } catch { return false; }
  }
  checkAdmin().then(a => {
    if (destroyed || !a) return;
    admin = true;
    if (!document.querySelector('link[data-hr]')) document.head.append(h('link', { rel: 'stylesheet', href: '/css/harbor-remote.css', 'data-hr': '1' }));
    chip = h('button.hr-pill', { type: 'button', 'aria-label': 'Preview panel', onclick: open }, h('span.hr-dot'), label = h('span.hr-lbl', 'TEST'));
    // (JUST ME on: a one-tap clear beside the pill — back to the real city, or the link's own flags)
    xb = h('button.hr-x', { type: 'button', 'aria-label': 'Clear JUST ME', onclick: () => { mode = 'me'; ss.set(MODE_KEY, 'me'); clearAll(); } }, h('span', '×'));
    bar = h('div.hr-bar', chip, xb);
    document.body.append(bar);
    paintChip();
  });
  function paintChip() {
    if (!chip) return;
    const on = !R.isEmpty(mine.state) ? 'me' : liveOn() ? 'all' : '';
    chip.dataset.on = on;
    const txt = on === 'me' ? `JUST ME · ${R.describe(mine.state)}` : on === 'all' ? 'TEST · EVERYONE' : 'TEST';
    if (label.textContent !== txt) label.textContent = txt;
    xb.hidden = on !== 'me';
    bar.classList.toggle('hr-under', !!document.querySelector('.nd-corner .tag'));
    // (the &debug=1 readout sits top left too: the pill steps under it)
    bar.classList.toggle('hr-low', !!(on === 'me' ? mine.state.debug : on === 'all' ? live.state.debug : /[?&]debug=1/.test(location.search)));
  }

  // ---------------------------------------------------------------- editing
  const cur = () => (mode === 'me' ? mine : draft);
  const tz = () => new URLSearchParams(location.search).get('tz') || deviceZone();
  function today() { const lp = localParts(Date.now(), tz()); return { y: lp.y, m: lp.m, d: lp.d }; }
  const place = () => { const sc = scene(), L = sc && sc.look ? sc.look() : null; return L ? { lat: L.lat, lon: L.lon } : { lat: 42.96, lon: -85.67 }; };
  const ymd = t => `${t.y}-${String(t.m).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`;
  // the time + the holiday → `when`
  function retime(c) {
    const { t, custom } = c.ui;
    const day = c.state.hol ? R.holidayDay(c.state.hol, today()) : ymd(today());
    if (custom && !c.state.hol) c.state.when = custom;
    else if (t) { const p = place(); c.state.when = R.timeAt(t, day, tz(), p.lat, p.lon); }
    else if (c.state.hol) c.state.when = `${day}T21:00`;
    else delete c.state.when;
  }
  function edit(fn, { soft = false } = {}) {
    const c = cur();
    fn(c.state, c.ui);
    // (an event's inputs are remembered while it is off: switched back on, it has its text, shapes, colours again)
    const mem = c.ui.mem || (c.ui.mem = {});
    for (const k of Object.keys(R.INPUTS)) if (c.state[k] != null) mem[k] = c.state[k];
    c.state = R.cleanRemote(c.state).state;
    if (mode === 'me') { mine.at = serverNow(); ss.set(ME_KEY, R.isEmpty(mine.state) ? null : { state: mine.state, ui: mine.ui }); apply(); }
    if (soft) paintStatus(); else render();
  }
  // NEON PASS 5 (the owner: from the panel the sky pieces "often don't show up, or barely show"; PARTY ON didn't show what the
  // party link shows): a NIGHT-ONLY event (☾) or PARTY ON switched on by day, with no time picked, jumps the clock to tonight
  // (the satellite train: to dusk — it only shows in twilight), like the links do; a sky piece switched on makes the sheet PEEK
  // (a third of the screen for a few seconds) so it doesn't fly behind it
  const dayNow = () => { const sc = scene(), L = sc && sc.look ? sc.look() : null; return !!(L && L.sun && L.sun.el > -4); };
  function toTonight(s, u, t) { if (s.when || u.custom || u.t || !dayNow()) return; u.t = t; retime({ state: s, ui: u }); }
  const toggleForce = id => edit((s, u) => {
    const f = new Set(s.force || []), def = R.eventDef(id);
    if (f.has(id)) f.delete(id);
    else {
      f.add(id); for (const k of def.inputs || []) { if (s[k] == null && u.mem && u.mem[k] != null) s[k] = u.mem[k]; if (s[k] == null && R.INPUTS[k].default) s[k] = R.INPUTS[k].default; }
      if (def.night || id === 'satellites') toTonight(s, u, id === 'satellites' ? 'dusk' : 'night');
      if (['SKY', 'BIRDS', 'RAINBOWS'].includes(def.group)) peek();
    }
    s.force = [...f];
  });
  let peekT = 0;
  function peek() {
    const box = sheet && sheet.firstChild; if (!box) return;
    box.classList.add('hr-peek'); clearTimeout(peekT);
    peekT = setTimeout(() => { if (box.isConnected) box.classList.remove('hr-peek'); }, 9000);
  }

  async function send() {
    if (sendBusy || !api) return;
    const st = R.cleanRemote(draft.state).state;
    if (R.isEmpty(st)) { toast('NOTHING TO SEND — PICK SOMETHING FIRST', 'warn'); return; }
    sendBusy = true; render();
    try {
      await api('admin', { action: 'cityLive', state: st, mins });
      // (her own phone shows what everyone sees: her JUST ME preview steps aside)
      mine.state = {}; mine.ui = {}; ss.set(ME_KEY, null);
      toast('SENT TO EVERYONE ON CITY 2', 'ok');
    } catch (e) { toast(`NOT SENT — ${String(e && e.message || e).toUpperCase().slice(0, 60)}`, 'err', 4000); }
    sendBusy = false; render(); apply();
  }
  async function clearAll() {
    if (mode === 'me') { edit((s, u) => { for (const k of Object.keys(s)) delete s[k]; for (const k of Object.keys(u)) delete u[k]; }); toast('BACK TO THE REAL CITY', 'info'); return; }
    draft = { state: {}, ui: {} };
    if (!api || sendBusy) { render(); return; }
    sendBusy = true; render();
    try { await api('admin', { action: 'cityClear' }); toast('CLEARED FOR EVERYONE', 'ok'); } catch (e) { toast(`NOT CLEARED — ${String(e && e.message || e).toUpperCase().slice(0, 60)}`, 'err', 4000); }
    sendBusy = false; render();
  }

  // ---------------------------------------------------------------- the sheet
  function open() {
    if (sheet) return;
    if (mode === 'all') draft = { state: liveOn() ? { ...live.state } : {}, ui: {} };
    sheet = h('div.modal.hr-modal', { onclick: e => { if (e.target === sheet) close(); } },
      h('div.sheet.hr-sheet', { role: 'dialog', 'aria-label': 'Preview panel', onpointerdown: e => { if (e.currentTarget.classList.contains('hr-peek') && !e.target.closest('.hr-b')) { e.currentTarget.classList.remove('hr-peek'); clearTimeout(peekT); } } }));
    document.body.append(sheet);
    render();
    musicT = setInterval(paintMusic, 1000);
  }
  function close() {
    if (!sheet) return;
    const s = sheet; sheet = null; musicEl = null; clearInterval(musicT); s.classList.add('out'); setTimeout(() => s.remove(), 260);
  }
  const btn = (label, on, onclick, o = {}) => h('button.hr-b', { type: 'button', class: [on ? 'is-on' : '', o.cls || ''].join(' ').trim() || null, 'aria-pressed': on ? 'true' : 'false', disabled: o.disabled || null, title: o.title || null, onclick }, label, o.night ? h('span.hr-moon', { 'aria-hidden': 'true' }, '☾') : null);
  const sec = (title, ...kids) => h('section.hr-sec', h('h3.hr-h', title), ...kids);
  const grid = (...kids) => h('div.hr-grid', ...kids);
  let statusEl = null, musicEl = null, musicT = 0;
  const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  function paintMusic() {
    if (!musicEl) return;
    const i = songInfo();
    const mood = MOOD_LABEL[moodNow()];
    const line = i ? `${i.id}${i.bpm ? ` · ${i.bpm.toFixed(1)} bpm` : ''} · ${mmss(i.at)}${i.dur ? ` / ${mmss(i.dur)}` : ''}` : 'NO SONG — TAP THE CITY FOR SOUND, MUSIC ON';
    const grid = i ? `GRID ${i.grid.toUpperCase()}${i.lock != null ? ` · LOCK ${i.lock}` : ''}${i.grid === 'NOT TRUSTED' ? ' · THE KICKS LEAD' : ''}` : '';
    musicEl.replaceChildren(h('div.hr-line', h('b', `PLAYING ${mood}`), h('span', line), grid ? h('small', { class: i.grid === 'NOT TRUSTED' ? 'hr-warn' : null }, grid) : null));
  }
  function statusText() {
    const now = serverNow();
    const until = ms => { const d = new Date(ms), m = Math.max(0, Math.round((ms - now) / 60000)); return `UNTIL ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} (${m} MIN)`; };
    const lines = [];
    if (!R.isEmpty(mine.state)) lines.push({ who: 'JUST ME', what: R.describe(mine.state), when: 'THIS PHONE · UNTIL CLEAR ALL' });
    if (liveOn()) lines.push({ who: 'EVERYONE', what: R.describe(live.state), when: until(live.until) + (!R.isEmpty(mine.state) ? ' · HIDDEN HERE BY JUST ME' : '') });
    if (!lines.length) lines.push({ who: 'NOTHING ON', what: R.describe(null), when: '' });
    if (mode === 'all' && JSON.stringify(R.cleanRemote(draft.state).state) !== JSON.stringify(liveOn() ? live.state : {})) lines.push({ who: 'NOT SENT', what: R.describe(R.cleanRemote(draft.state).state), when: 'TAP SEND TO EVERYONE' , draft: true });
    return lines;
  }
  function paintStatus() {
    if (!statusEl) return;
    statusEl.replaceChildren(...statusText().map(l => h('div.hr-line', { class: l.draft ? 'hr-draft' : null }, h('b', l.who), h('span', l.what), l.when ? h('small', l.when) : null)));
  }
  function render() {
    if (!sheet) return;
    const box = sheet.firstChild, top = box.scrollTop, c = cur(), st = c.state, ui = c.ui, force = new Set(st.force || []);
    const kids = [];
    kids.push(h('div.sheet-grip'),
      h('div.hr-head', h('div', h('div.sheet-kicker', 'CITY 2.0 · OWNER ONLY'), h('h2.sheet-title', 'PREVIEW PANEL')),
        h('button.icon-btn', { type: 'button', 'aria-label': 'Close the preview panel', onclick: close }, '×')),
      h('div.hr-mode', { role: 'radiogroup' },
        ...[['me', 'JUST ME'], ['all', 'EVERYONE ON CITY 2']].map(([v, l]) => h('button.hr-b.hr-modeb', { type: 'button', role: 'radio', 'aria-checked': mode === v ? 'true' : 'false', class: mode === v ? 'is-on' : null,
          onclick: () => { if (mode === v) return; mode = v; ss.set(MODE_KEY, v); if (v === 'all') draft = { state: liveOn() ? { ...live.state } : {}, ui: {} }; render(); } }, l))),
      statusEl = h('div.hr-status', { 'aria-live': 'polite' }));
    // EVENTS: every &force= preview, by group; the inputs of the ones that are on underneath
    const evs = R.EVENT_GROUPS.map(g => h('div.hr-group', h('div.hr-gl', g), grid(...R.PANEL_EVENTS.filter(e => e.group === g).map(e => btn(e.label, force.has(e.id), () => toggleForce(e.id), { night: e.night, title: e.hint })))));
    const inputs = [...new Set(R.EVENTS.filter(e => force.has(e.id)).flatMap(e => e.inputs || []))];
    const opts = inputs.map(k => input(k, st, force));
    kids.push(sec('EVENTS', opts.length ? h('div.hr-opts', ...opts) : null, h('p.hr-note', '☾ shows at night only · tap again to switch off'), ...evs));
    // PARTY SHOW
    kids.push(sec('PARTY SHOW',
      h('div.hr-gl', 'PARTY NIGHT'), grid(...[['', 'AUTO'], ['on', 'ON'], ['off', 'OFF']].map(([v, l]) => btn(l, (st.party || '') === v, () => edit((s, u) => { if (v) s.party = v; else delete s.party; if (v === 'on') toTonight(s, u, 'night'); })))),
      h('div.hr-gl', 'HOLD A SCENE'), grid(btn('LET IT RUN', !st.scene, () => edit(s => { delete s.scene; })),
        ...R.SHOW_SCENE_LIST.map(sc => btn(sc.id.toUpperCase(), st.scene === sc.id, () => edit(s => { s.scene = sc.id; }), { cls: `hr-${sc.list}` })))));
    // TIME
    const dt = h('input.input.hr-dt', { type: 'datetime-local', value: st.when || '', 'aria-label': 'Date and time',
      onchange: e => edit((s, u) => { const v = String(e.target.value || '').slice(0, 16); u.t = null; delete s.hol; if (v) { u.custom = v; s.when = v; } else { delete u.custom; delete s.when; } retime({ state: s, ui: u }); }) });
    kids.push(sec('TIME',
      grid(...R.TIMES.map(t => btn(t.label, ui.t === t.id, () => edit((s, u) => { u.t = t.id; delete u.custom; retime({ state: s, ui: u }); })))),
      h('div.hr-row', dt),
      h('div.hr-gl', 'CLOCK SPEED'), grid(...R.SPEEDS.map(v => btn(`${v}×`, (st.speed || 1) === v, () => edit(s => { if (v === 1) delete s.speed; else s.speed = v; })))),
      h('div.hr-row', btn('BACK TO NOW', false, () => edit((s, u) => { delete s.when; delete s.speed; delete s.hol; delete u.t; delete u.custom; }), { cls: 'hr-wide' }))));
    kids.push(sec('WEATHER', grid(btn('REAL', !st.wx, () => edit(s => { delete s.wx; })), ...R.WEATHER.map(w => btn(w.label, st.wx === w.id, () => edit(s => { s.wx = w.id; }))))));
    kids.push(sec('HOLIDAY', h('p.hr-note', 'jumps to its next date (keeps the time you picked; else 21:00)'),
      grid(btn('NONE', !st.hol, () => edit((s, u) => { delete s.hol; retime({ state: s, ui: u }); })),
        ...R.HOLIDAYS.map(hd => btn(hd.label, st.hol === hd.id, () => edit((s, u) => { s.hol = hd.id; delete u.custom; retime({ state: s, ui: u }); }))))));
    kids.push(sec('MUSIC',
      h('div.hr-gl', 'MOOD'),
      grid(btn('AUTO', !st.mood, () => edit(s => { delete s.mood; })), ...R.MUSIC_MOODS.map(m => btn(m.label, st.mood === m.id, () => edit(s => { s.mood = m.id; })))),
      musicEl = h('div.hr-status.hr-music', { 'aria-live': 'off' }),
      h('div.hr-row', btn('SKIP TO THE NEXT SONG', false, async () => { const ok = await switchNow(2); toast(ok ? 'NEXT SONG' : 'NOTHING TO SKIP — THE ROOM’S SONG IS THE HOST’S', ok ? 'info' : 'warn'); paintMusic(); }, { cls: 'hr-wide', title: 'this phone only' }))));
    kids.push(sec('TOOLS', grid(btn('READOUT', !!st.debug, () => edit(s => { if (s.debug) delete s.debug; else s.debug = true; })),
      btn('GRID', !!st.grid, () => edit(s => { if (s.grid) delete s.grid; else s.grid = true; }))),
      h('div.hr-row', h('button.btn.btn-ghost.btn-block.hr-clear', { type: 'button', disabled: sendBusy || null, onclick: clearAll }, h('span', mode === 'me' ? 'CLEAR ALL — BACK TO THE REAL CITY' : 'CLEAR ALL FOR EVERYONE')))));
    if (mode === 'all') {
      kids.push(h('div.hr-send',
        h('div.hr-gl', 'FOR'), h('div.hr-grid.hr-mins', ...R.DURATIONS.map(m => btn(`${m} MIN`, mins === m, () => { mins = m; render(); }))),
        h('button.btn.btn-primary.btn-block', { type: 'button', disabled: sendBusy || null, onclick: send }, h('span', sendBusy ? 'SENDING…' : 'SEND TO EVERYONE'))));
    }
    box.replaceChildren(...kids);
    paintStatus(); paintMusic();
    box.scrollTop = top;
  }
  function input(k, st, force) {
    const def = R.INPUTS[k], users = R.EVENTS.filter(e => force.has(e.id) && (e.inputs || []).includes(k)).map(e => e.label).join(' · ');
    const lab = h('div.hr-gl', `${def.label} — ${users}`);
    if (def.kind === 'text') {
      const max = R.textMax([...force].filter(id => (R.eventDef(id).inputs || []).includes('text')));
      const el = h('input.input.hr-text', { type: 'text', value: st.text || '', maxlength: String(max), placeholder: `up to ${max} letters`, autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', 'aria-label': def.label,
        oninput: e => { const v = e.target.value; clearTimeout(typeT); typeT = setTimeout(() => edit(s => { if (v.trim()) s.text = v; else delete s.text; }, { soft: true }), mode === 'me' ? 700 : 0); },
        onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } });
      return h('div.hr-opt', lab, el);
    }
    if (def.kind === 'bool') return h('div.hr-opt', lab, grid(btn(st[k] ? 'ON' : 'OFF', !!st[k], () => edit(s => { if (s[k]) delete s[k]; else s[k] = true; }))));
    if (def.kind === 'select') return h('div.hr-opt', lab, swatchesOr(def, k, st));
    // multi / colours: up to def.max picked, in the order picked
    const picked = String(st[k] || '').split(',').filter(Boolean);
    return h('div.hr-opt', lab, grid(...def.options.map(o => btn(def.kind === 'colours' ? '' : o.replace('mark:', '★ ').toUpperCase(), picked.includes(o), () => edit(s => {
      const p = String(s[k] || '').split(',').filter(Boolean), i = p.indexOf(o);
      if (i >= 0) p.splice(i, 1); else if (p.length < def.max) p.push(o);
      if (p.length) s[k] = p.join(','); else delete s[k];
    }), { cls: def.kind === 'colours' ? 'hr-sw' : '' })).map((b, i) => { if (def.kind === 'colours') { b.style.setProperty('--sw', `#${def.options[i]}`); b.setAttribute('aria-label', `#${def.options[i]}`); } return b; })));
  }
  // a select: one choice (a colour shows as its swatch)
  function swatchesOr(def, k, st) {
    return grid(...def.options.map(o => {
      const b = btn(def.labels && def.labels[o] != null ? def.labels[o] : o === '' ? 'DEFAULT' : /^[0-9a-f]{6}$/.test(o) ? '' : o.toUpperCase(), (st[k] || def.default || '') === o, () => edit(s => { if (o === '') delete s[k]; else s[k] = o; }), { cls: /^[0-9a-f]{6}$/.test(o) ? 'hr-sw' : '' });
      if (/^[0-9a-f]{6}$/.test(o)) { b.style.setProperty('--sw', `#${o}`); b.setAttribute('aria-label', `#${o}`); }
      return b;
    }));
  }

  apply();
  return {
    /** the scene was re-created (title.js) or the state should be re-applied */
    apply,
    open, close,
    /** (tests + shots) the mode, and this phone's JUST ME state */
    setMode(v) { mode = v === 'all' ? 'all' : 'me'; ss.set(MODE_KEY, mode); if (mode === 'all') draft = { state: liveOn() ? { ...live.state } : {}, ui: {} }; render(); },
    setMine(st) { mode = 'me'; mine.state = R.cleanRemote(st).state; mine.ui = {}; mine.at = serverNow(); ss.set(ME_KEY, R.isEmpty(mine.state) ? null : { state: mine.state, ui: mine.ui }); apply(); render(); },
    debug: () => ({ mode, admin, mine: mine.state, live, effective: !R.isEmpty(mine.state) ? 'me' : liveOn() ? 'all' : null }),
    destroy() {
      destroyed = true; clearInterval(tick); clearInterval(musicT); clearTimeout(typeT); clearTimeout(peekT);
      if (unsub) { try { unsub(); } catch { /* fine */ } }
      if (bar) bar.remove();
      if (sheet) sheet.remove();
      chip = sheet = bar = xb = null;
    },
  };
}
