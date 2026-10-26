// CITY 2.0 — THE PREVIEW PANEL: the owner's test remote (docs/harbor.md#the-preview-panel). ?city=2 only: title.js imports this
// module after the city's first paint, never on the default city.
//   everyone on ?city=2   listens to city2/live (server-written: /api/admin cityLive / cityClear) once Firebase is up and plays
//                         its state in sync from its startAt (the scene's remote(): the clock runs from there, a sky piece's
//                         first flight starts there) until CLEAR or `until`; then the real city again. A node whose startAt is
//                         still ahead (C2: the panel's DELAY) waits for it — every phone starts on the same beat
//   the owner (admin)     a small TEST pill top left opens the sheet: JUST ME (this phone, kept for the tab) or EVERYONE ON CITY 2
//                         (a draft, sent with SEND TO EVERYONE); every row comes from core/harbor-remote.js
// The state on this phone: JUST ME (if any) wins over EVERYONE's; nothing at all = the real city.
// NEON PASS 5 — A LINK'S OWN SETTINGS WIN: opening a link that carries its own preview flags (&when, &force, &speed, &wx, &scene…)
// drops a stored JUST ME state (a refresh of the same page keeps it); while JUST ME is on the pill says so + a one-tap ✕ beside it.
// CITY 2.0 MUSIC: force a mood (part of the state, so EVERYONE's phones follow too), SKIP TO THE NEXT SONG (this phone), the song now.
// C2 — THE PANEL REWORK (the owner, Oct 25: "very busy and unorganized"):
//   FULL SCREEN       a full-screen glass sheet on a phone (the safe areas kept), a large centred one on a desktop
//   THE DELAY         nothing changes while the sheet is open: JUST ME's taps QUEUE (the status says so); closing the sheet starts a
//                     3-2-1 chip beside the pill (NOW / 3 S / 5 S, remembered on this device) and then the whole queued state
//                     starts at once — its time jump, its sky pieces' first flights, its weather, its toggles, all from that moment.
//                     Reopening during the countdown CANCELS it (what was queued stays queued — close again to start it).
//                     EVERYONE: SEND pushes the server's startAt by the delay; every phone (the owner's shows the chip) starts then.
//   SEARCH            one box over every row (label, hint, keywords, group, section); the sections with hits open, the rest hide
//   RECENT            the last rows fired (6, remembered on this device); one tap fires it again (the sheet closes, the countdown runs)
//   NINE SECTIONS     SKY · LEGENDARY · PEOPLE + WORKERS · WILDLIFE · HARBOR · WEATHER · TIME · LIGHTS + MUSIC · TOOLS (R.SECTIONS),
//                     collapsible, the open ones remembered; inside, blocks: the panel's own controls + one per event group
//   THE MODE          JUST ME = green, EVERYONE = pink: the sheet's top edge + the chips + the pill's dot + the countdown chip
// The DOM keeps the old hooks: every section AND every block is a `.hr-sec` whose first `.hr-h` is its name (MUSIC, …); the
// blocks carry the old category ids in data-cat (sounds, music, lights = PULSE, tools, party, time, weather, holidays + each
// event block its area); openCats() takes a section id or an old category id.
import { h } from '../../ui/dom.js';
import { toast } from '../../ui/toast.js';
import { serverNow, firebaseReady, onValue, dbRef } from '../../firebase.js';
import { localParts, deviceZone } from '../../core/sky.js';
import { api as apiCall } from '../../profile/api.js';
import * as R from '../../core/harbor-remote.js';
import { fitText, towerCapacity, WORD_FACES, FONT_ALIASES } from '../../core/harbor-windows.js';
import { songInfo } from '../../audio/beat.js';
import { switchNow } from '../../audio/music.js';
import { moodNow, fixedMoodFrom, MOOD_LABEL } from '../../audio/mood.js';
import { settings, updateSettings } from '../../audio/settings.js';
import { SLOTS, PARTS, takesOf } from '../../core/city-sounds.js';
import { cityPreview, citySoundsDebug } from '../../audio/city-sound.js';
import { debugTool, setDebugTool } from '../../ui/debug-tools.js';

const ME_KEY = 'nd:hr-me', MODE_KEY = 'nd:hr-mode', ADMIN_KEY = 'nd:hr-admin', OPEN_KEY = 'nd:hr-open', DELAY_KEY = 'nd:hr-delay', RECENT_KEY = 'nd:hr-recent';
const RECENT_MAX = 6;
const ss = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch { return null; } },
  set(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: fine */ } },
};
// this device's conveniences (localStorage — it may throw or come back empty: then the defaults)
const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* fine */ } },
};
const SEC_IDS = R.SECTIONS.map(s => s.id);
function loadOpen() { const v = ls.get(OPEN_KEY); return new Set(Array.isArray(v) ? v.map(R.toSection).filter(Boolean) : []); }
const loadDelay = () => { const v = ls.get(DELAY_KEY); return R.DELAYS.includes(v) ? v : R.DEFAULT_DELAY; };
const loadRecent = () => { const v = ls.get(RECENT_KEY); return Array.isArray(v) ? v.filter(x => x && typeof x.k === 'string' && typeof x.id === 'string' && recentLabel(x)).slice(0, RECENT_MAX) : []; };
const clone = v => JSON.parse(JSON.stringify(v || {}));
const same = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});
// RECENT: what a fired row was (an event, a time, a weather, a holiday, the party, a held scene, a music mood) + its two-line chip
const RECENT_KIND = { t: 'TIME', wx: 'WEATHER', hol: 'HOLIDAY', party: 'PARTY', scene: 'SCENE', mood: 'MUSIC' };
function recentLabel(e) {
  if (e.k === 'ev') { const d = R.eventDef(e.id); return d && d.ready !== false ? d.label : null; }
  if (e.k === 't') return (R.TIMES.find(x => x.id === e.id) || {}).label || null;
  if (e.k === 'wx') return (R.WEATHER.find(x => x.id === e.id) || {}).label || null;
  if (e.k === 'hol') return (R.HOLIDAYS.find(x => x.id === e.id) || {}).label || null;
  if (e.k === 'party') return e.id === 'on' || e.id === 'off' ? `PARTY ${e.id.toUpperCase()}` : null;
  if (e.k === 'scene') return R.SHOW_SCENE_LIST.some(s => s.id === e.id) ? e.id.toUpperCase() : null;
  if (e.k === 'mood') return (R.MUSIC_MOODS.find(x => x.id === e.id) || {}).label || null;
  return null;
}
const recentKind = e => (e.k === 'ev' ? (R.SECTIONS.find(s => s.id === R.sectionOf(e.id)) || {}).label || 'EVENT' : RECENT_KIND[e.k] || '');
/** what a change switched ON (old state → new): the RECENT entries + the countdown's words */
function firedOf(a, b, ui) {
  const out = [], af = new Set((a && a.force) || []);
  for (const id of b.force || []) if (!af.has(id)) out.push({ k: 'ev', id });
  if (b.wx && b.wx !== a.wx) out.push({ k: 'wx', id: b.wx });
  if (b.hol && b.hol !== a.hol) out.push({ k: 'hol', id: b.hol });
  else if (ui && ui.t && !ui.autoT && b.when && b.when !== a.when) out.push({ k: 't', id: ui.t });
  if (b.party && b.party !== a.party) out.push({ k: 'party', id: b.party });
  if (b.scene && b.scene !== a.scene) out.push({ k: 'scene', id: b.scene });
  if (b.mood && b.mood !== a.mood) out.push({ k: 'mood', id: b.mood });
  return out;
}
/** the link's own preview flags (not the tools: &debug, &grid) — a fresh link with any of them wins over a stored JUST ME */
const linkFlags = () => { try { const q = new URLSearchParams(location.search); return R.REMOTE_KEYS.filter(k => k !== 'debug' && k !== 'grid' && q.has(k)); } catch { return []; } };
const navType = () => { try { const e = performance.getEntriesByType('navigation')[0]; return (e && e.type) || 'navigate'; } catch { return 'navigate'; } };
let linkChecked = false;
let cssReady = null;             // (the panel's stylesheet, loaded once a page: the pill waits for it)
// (test-only: the panel without an admin profile — the previews and the emulator E2E; never on the real site's pages)
const TEST_PANEL = typeof location !== 'undefined' && /[?&]panel=1(?:&|$)/.test(location.search)
  && (location.pathname.includes('/tests/') || /[?&]emu(?:[=&]|$)/.test(location.search));

export function createRemote({ scene, api = apiCall }) {
  let destroyed = false, live = null, liveNext = null, nextT = 0, unsub = null, admin = false, chip = null, bar = null, xb = null, label = null, cdEl = null, sheet = null, sendBusy = false, typeT = 0;
  let mode = ss.get(MODE_KEY) === 'all' ? 'all' : 'me';
  let stored = ss.get(ME_KEY);
  if (!linkChecked) {
    linkChecked = true;
    if (stored && linkFlags().length && navType() !== 'reload') { ss.set(ME_KEY, null); stored = null; }
  }
  const mine = { state: R.cleanRemote(stored && stored.state).state, ui: (stored && stored.ui) || {}, at: serverNow() };
  let pend = null;                 // JUST ME's queued state while the sheet is open (null = nothing queued)
  const restart = new Set();       // events already on that a RECENT tap fires again (they start over)
  let draft = { state: {}, ui: {} }, mins = R.DEFAULT_MINS, delay = loadDelay(), query = '', recent = loadRecent();
  let cd = null;                   // the countdown: { mode, at (server ms), what, n, iv }
  const openSecs = loadOpen();
  const saveMine = () => ss.set(ME_KEY, R.isEmpty(mine.state) ? null : { state: mine.state, ui: mine.ui });

  // ---------------------------------------------------------------- what this phone shows
  const liveOn = () => !!(live && live.until > serverNow());
  function promote() {
    clearTimeout(nextT);
    if (!liveNext) return;
    const wait = liveNext.startAt - serverNow();
    if (wait > 25) { nextT = setTimeout(promote, Math.min(wait, 5000)); return; }
    live = liveNext; liveNext = null;
    apply();
    if (sheet) render();
  }
  function apply() {
    const sc = scene();
    if (liveNext && liveNext.startAt <= serverNow()) { live = liveNext; liveNext = null; }
    if (destroyed || !sc || !sc.remote) return;
    if (!R.isEmpty(mine.state)) sc.remote(R.toParams(mine.state), { at: mine.at, srv: serverNow });
    else if (liveOn()) sc.remote(R.toParams(live.state), { at: live.startAt, srv: serverNow });
    else sc.remote(null, { srv: serverNow });
    paintChip();
  }
  const tick = setInterval(() => { apply(); if (sheet) paintStatus(); }, 4000);

  // EVERYONE's node (readable by any signed-in visitor; only the server writes it). A startAt still ahead (the DELAY) waits: the
  // phone keeps what it shows until then — the owner's phone counts it down beside the pill
  firebaseReady.then(() => {
    if (destroyed) return;
    try {
      unsub = onValue(dbRef('city2/live'), snap => {
        const v = snap && snap.val ? snap.val() : null;
        const ok = v && typeof v === 'object' && Number.isFinite(v.startAt) && Number.isFinite(v.until);
        let node = ok ? { state: R.cleanRemote(v.state).state, startAt: v.startAt, until: v.until, by: v.by || null } : null;
        if (node && R.isEmpty(node.state)) node = null;
        clearTimeout(nextT);
        if (node && node.startAt > serverNow() + 25) {
          liveNext = node; promote();
          if (admin && (!cd || cd.mode !== 'all' || cd.at !== node.startAt)) countdown('all', node.startAt, R.describe(node.state));
        } else { live = node; liveNext = null; if (cd && cd.mode === 'all') stopCd(); }
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
    if (destroyed || !a) return false;
    admin = true;
    if (!cssReady) cssReady = new Promise(res => { const l = h('link', { rel: 'stylesheet', href: '/css/harbor-remote.css', 'data-hr': '1' }); const done = () => res(true); l.onload = l.onerror = done; setTimeout(done, 3000); document.head.append(l); });
    return cssReady;
  }).then(ok => {
    // (7a §0: the pill appears once its stylesheet is in — never a moment unstyled at the page's foot, where a tap would miss it)
    if (destroyed || !ok) return;
    chip = h('button.hr-pill', { type: 'button', 'aria-label': 'Preview panel', onclick: open }, h('span.hr-dot'), label = h('span.hr-lbl', 'TEST'));
    // (JUST ME on: a one-tap clear beside the pill — back to the real city, or the link's own flags)
    xb = h('button.hr-x', { type: 'button', 'aria-label': 'Clear JUST ME', onclick: () => { mode = 'me'; ss.set(MODE_KEY, 'me'); clearAll(); } }, h('span', '×'));
    bar = h('div.hr-bar', chip, xb);
    document.body.append(bar);
    if (liveNext && !cd) countdown('all', liveNext.startAt, R.describe(liveNext.state));
    paintChip(); paintCd();
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

  // ---------------------------------------------------------------- THE COUNTDOWN (C2): a 3-2-1 chip under the pill, then it starts
  function countdown(m, at, what) {
    stopCd();
    cd = { mode: m, at, what, n: -1, iv: setInterval(cdTick, 100) };
    cdTick();
  }
  function stopCd() { if (cd) clearInterval(cd.iv); cd = null; paintCd(); }
  function cdTick() {
    if (!cd) return;
    const left = cd.at - serverNow();
    if (left <= 0) { const m = cd.mode; stopCd(); if (m === 'me') commit(); else promote(); goFlash(m); return; }
    const n = Math.ceil(left / 1000);
    if (n !== cd.n) { cd.n = n; paintCd(); }
  }
  let goT = 0;
  function paintCd(go) {
    if (!bar) return;
    clearTimeout(goT);
    bar.classList.toggle('hr-counting', !!(cd || go));
    if (!cd && !go) { if (cdEl) { cdEl.remove(); cdEl = null; } return; }
    if (!cdEl) { cdEl = h('div.hr-cd', { role: 'status', 'aria-live': 'polite' }, h('b.hr-cd-n'), h('span.hr-cd-l')); bar.append(cdEl); }
    const m = cd ? cd.mode : go;
    cdEl.dataset.mode = m;
    cdEl.classList.toggle('is-go', !cd);
    cdEl.firstChild.textContent = cd ? String(cd.n) : 'GO';
    cdEl.lastChild.textContent = `${m === 'me' ? 'JUST ME' : 'EVERYONE'}${cd && cd.what ? ` · ${cd.what}` : ''}`;
    // (the number pops on each new second: transform + opacity only)
    cdEl.classList.remove('is-pop'); void cdEl.offsetWidth; cdEl.classList.add('is-pop');
    if (!cd) goT = setTimeout(() => { if (cdEl && !cd) { cdEl.remove(); cdEl = null; if (bar) bar.classList.remove('hr-counting'); } }, 900);
  }
  const goFlash = m => paintCd(m);

  // ---------------------------------------------------------------- editing: JUST ME queues (pend), EVERYONE drafts (draft)
  const ensurePend = () => pend || (pend = { state: clone(mine.state), ui: clone(mine.ui) });
  const cur = () => (mode === 'me' ? ensurePend() : draft);
  const dirtyMe = () => !!pend && (!same(R.cleanRemote(pend.state).state, mine.state) || restart.size > 0);
  const liveBase = () => (liveNext ? liveNext.state : liveOn() ? live.state : {});
  const draftDirty = () => !same(R.cleanRemote(draft.state).state, liveBase());
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
    if (soft) paintStatus(); else render();
  }
  // NEON PASS 5: a NIGHT-ONLY event (☾) or PARTY ON switched on by day, with no time picked, jumps the clock to tonight (the
  // satellite train: to dusk — it only shows in twilight), like the links do
  const dayNow = () => { const sc = scene(), L = sc && sc.look ? sc.look() : null; return !!(L && L.sun && L.sun.el > -4); };
  function toTonight(s, u, t) { if (s.when || u.custom || u.t || !dayNow()) return; u.t = t; u.autoT = true; retime({ state: s, ui: u }); }
  function forceOn(s, u, id) {
    const def = R.eventDef(id); if (!def) return;
    const f = new Set(s.force || []); f.add(id); s.force = [...f];
    for (const k of def.inputs || []) { if (s[k] == null && u.mem && u.mem[k] != null) s[k] = u.mem[k]; if (s[k] == null && R.INPUTS[k].default) s[k] = R.INPUTS[k].default; }
    if (def.night || id === 'satellites') toTonight(s, u, id === 'satellites' ? 'dusk' : 'night');
  }
  const toggleForce = id => edit((s, u) => { if ((s.force || []).includes(id)) s.force = s.force.filter(x => x !== id); else forceOn(s, u, id); });
  // a RECENT entry back on (an event, a time, a weather …)
  function applyEntry(s, u, e) {
    if (e.k === 'ev') forceOn(s, u, e.id);
    else if (e.k === 't') { u.t = e.id; delete u.custom; delete u.autoT; retime({ state: s, ui: u }); }
    else if (e.k === 'wx') s.wx = e.id;
    else if (e.k === 'hol') { s.hol = e.id; delete u.custom; retime({ state: s, ui: u }); }
    else if (e.k === 'party') { s.party = e.id; if (e.id === 'on') toTonight(s, u, 'night'); }
    else if (e.k === 'scene') s.scene = e.id;
    else if (e.k === 'mood') s.mood = e.id;
  }
  function remember(list) {
    if (!list.length) return;
    const key = e => `${e.k}:${e.id}`, seen = new Set();
    recent = [...list, ...recent].filter(e => recentLabel(e) && !seen.has(key(e)) && seen.add(key(e))).slice(0, RECENT_MAX).map(e => ({ k: e.k, id: e.id }));
    ls.set(RECENT_KEY, recent);
  }
  /** JUST ME: the queued state starts now (the time jump, the sky pieces' first flights, the toggles — all from this moment) */
  function commit() {
    if (!pend) return;
    const old = mine.state, next = R.cleanRemote(pend.state).state, now = serverNow(), sc = scene();
    const again = [...restart].filter(id => (old.force || []).includes(id) && (next.force || []).includes(id));
    const fired = [...again.map(id => ({ k: 'ev', id })), ...firedOf(old, next, pend.ui)];
    mine.state = next; mine.ui = pend.ui; mine.at = now; pend = null; restart.clear();
    saveMine();
    // (fired again: the piece goes off for an instant, so it starts over from now)
    if (again.length && sc && sc.remote) sc.remote(R.toParams({ ...next, force: next.force.filter(id => !again.includes(id)) }), { at: now, srv: serverNow });
    apply();
    remember(fired);
    if (sheet) render();
  }
  /** JUST ME: closing the sheet (or a RECENT tap) — the countdown, or at once with NOW */
  function fire() {
    if (!dirtyMe()) { pend = null; restart.clear(); return; }
    const words = [...[...restart].map(id => ({ k: 'ev', id })), ...firedOf(mine.state, R.cleanRemote(pend.state).state, pend.ui)].map(recentLabel).filter(Boolean);
    const what = [...new Set(words)].join(' · ') || (R.isEmpty(R.cleanRemote(pend.state).state) ? 'THE REAL CITY' : 'CHANGES');
    if (!delay) { commit(); goFlash('me'); return; }
    countdown('me', serverNow() + delay * 1000, what);
  }

  async function send() {
    if (sendBusy || !api) return;
    const st = R.cleanRemote(draft.state).state, base = liveBase();
    if (R.isEmpty(st)) { toast('NOTHING TO SEND — PICK SOMETHING FIRST', 'warn'); return; }
    sendBusy = true; render();
    try {
      const r = await api('admin', { action: 'cityLive', state: st, mins, delay });
      // (her own phone shows what everyone sees: her JUST ME preview steps aside)
      mine.state = {}; mine.ui = {}; ss.set(ME_KEY, null); pend = null; restart.clear();
      remember(firedOf(base, st, draft.ui));
      draft = { state: clone(st), ui: draft.ui };
      const at = r && r.live && Number.isFinite(r.live.startAt) ? r.live.startAt : serverNow();
      sendBusy = false;
      close({ sent: true });
      if (at > serverNow() + 150 && (!cd || cd.at !== at)) countdown('all', at, R.describe(st));
      toast('SENT TO EVERYONE ON CITY 2', 'ok');
    } catch (e) { toast(`NOT SENT — ${String(e && e.message || e).toUpperCase().slice(0, 60)}`, 'err', 4000); }
    sendBusy = false; render(); apply();
  }
  // the phone's own MUSIC MOOD setting forcing a mood (the panel's AUTO + CLEAR ALL put it back to AUTO; M4)
  function autoSetting() {
    if ((settings.musicMood || 'auto') === 'auto') return;
    updateSettings({ musicMood: 'auto' });
    toast('MUSIC MOOD SETTING BACK TO AUTO', 'info');
  }
  /** CLEAR ALL — at once, no countdown (nothing to watch start): JUST ME back to the real city; EVERYONE: cityClear */
  async function clearAll() {
    autoSetting();
    if (mode === 'me') {
      if (cd && cd.mode === 'me') stopCd();
      pend = null; restart.clear(); mine.state = {}; mine.ui = {}; mine.at = serverNow(); saveMine(); apply(); render();
      toast('BACK TO THE REAL CITY', 'info'); return;
    }
    draft = { state: {}, ui: {} };
    if (!api || sendBusy) { render(); return; }
    sendBusy = true; render();
    try { await api('admin', { action: 'cityClear' }); toast('CLEARED FOR EVERYONE', 'ok'); } catch (e) { toast(`NOT CLEARED — ${String(e && e.message || e).toUpperCase().slice(0, 60)}`, 'err', 4000); }
    sendBusy = false; render();
  }
  /** RECENT: one tap fires it again — JUST ME: the sheet closes + the countdown runs; EVERYONE: into the draft (SEND stays a tap) */
  function fireRecent(e) {
    if (mode === 'all') { edit((s, u) => applyEntry(s, u, e)); toast(`${recentLabel(e)} ADDED — TAP SEND TO EVERYONE`, 'info'); return; }
    const c = ensurePend();
    applyEntry(c.state, c.ui, e);
    c.state = R.cleanRemote(c.state).state;
    if (e.k === 'ev') restart.add(e.id);
    if (sheet) close(); else fire();
  }

  // ---------------------------------------------------------------- the sheet
  function open() {
    if (sheet) return;
    // (reopening during JUST ME's countdown cancels it — what was queued stays queued: close again to start it)
    if (cd && cd.mode === 'me') stopCd();
    if (mode === 'all' && !draftDirty()) draft = { state: clone(liveBase()), ui: {} };
    if (mode === 'me') ensurePend();
    sheet = h('div.modal.hr-modal', { onclick: e => { if (e.target === sheet) close(); }, onkeydown: e => { if (e.key === 'Escape' && !(e.target.classList && e.target.classList.contains('hr-q'))) close(); } },
      h('div.sheet.hr-sheet', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Preview panel' }));
    document.body.append(sheet);
    render();
    musicT = setInterval(() => { paintMusic(); paintSounds(); }, 1000);
  }
  function close(o = {}) {
    if (!sheet) return;
    const s = sheet; sheet = null; musicEl = null; soundsEl = null; clearInterval(musicT); s.classList.add('out'); setTimeout(() => s.remove(), 260);
    if (mode === 'me') fire();
    else if (!o.sent && draftDirty()) toast('NOT SENT — THE EVERYONE DRAFT IS KEPT', 'warn');
    paintChip();
  }
  const btn = (label, on, onclick, o = {}) => h('button.hr-b', { type: 'button', class: [on ? 'is-on' : '', o.cls || ''].join(' ').trim() || null, 'aria-pressed': on ? 'true' : 'false', disabled: o.disabled || null, title: o.title || null, dataset: o.q != null ? { q: o.q } : null, onclick }, label, o.night ? h('span.hr-moon', { 'aria-hidden': 'true' }, '☾') : null);
  const grid = (...kids) => h('div.hr-grid', ...kids);
  const opts = (...kids) => h('div.hr-grid.hr-g3', ...kids);
  let statusEl = null, musicEl = null, musicT = 0, pulseT = 0, soundsEl = null;
  const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  // ---- PART 8a — THE CITY SOUNDS: a slot's row (▶, its id + what it is + what calls it, FILLED / EMPTY) and what's sounding now
  function soundRow(s) {
    const t = takesOf(s.id), on = t.length > 0;
    const st = !on ? 'EMPTY' : t.length > 1 ? `${t.length} TAKES` : s.kind === 'loop' ? `LOOP ${Math.round(t[0].loop)} S` : `${t[0].d.toFixed(1)} S`;
    const play = h('button.hr-b.hr-snd-play', { type: 'button', disabled: on ? null : true, 'aria-label': on ? `Play ${s.id}` : `${s.id}: empty`,
      onclick: () => { const r = cityPreview(s.id); toast(r.ok ? `▶ ${s.id.toUpperCase()}` : `${s.id.toUpperCase()} — ${String(r.why).toUpperCase()}`, r.ok ? 'info' : 'warn'); } }, '▶');
    return h('div.hr-snd', { class: on ? 'is-filled' : null, dataset: { slot: s.id, q: `${s.id.replace(/-/g, ' ')} ${s.what} ${s.by || ''} sound` } }, play,
      h('div.hr-snd-t', h('b', s.id), h('small', `${s.kind === 'loop' ? 'LOOP' : 'ONE-SHOT'} · ${s.what}${s.by ? ` — ${s.by}` : ''}`)),
      h('span.hr-snd-st', st));
  }
  function paintSounds() {
    if (!soundsEl) return;
    let line = 'NOTHING SOUNDING — TAP THE CITY FOR SOUND, EFFECTS ON';
    try {
      const d = citySoundsDebug(), on = d.loops.filter(l => l.voices > 0 && l.gain > 0.001);
      if (on.length) line = on.map(l => `${l.slot} ${l.gain.toFixed(3)}`).join(' · ');
      const last = d.log[d.log.length - 1];
      soundsEl.replaceChildren(h('div.hr-line', h('b', 'SOUNDING NOW'), h('span', line), h('small', `${d.mb.toFixed(1)} MB decoded${last ? ` · last: ${last.slot} (${Math.round((performance.now() - last.at) / 1000)} s ago)` : ''}`)));
    } catch { /* fine */ }
  }
  function paintMusic() {
    if (!musicEl) return;
    const i = songInfo();
    const mood = MOOD_LABEL[moodNow()], f = fixedMoodFrom();
    // (M4, the owner: "music MORNING all day" — the phone's own MUSIC MOOD setting was forcing it while the panel said AUTO: say where it comes from)
    const from = !f ? 'AUTO · THE CITY’S CLOCK' : f.from === 'panel' ? 'THIS PANEL' : 'THE MUSIC MOOD SETTING ON THIS PHONE';
    const line = i ? `${i.id}${i.bpm ? ` · ${i.bpm.toFixed(1)} bpm` : ''} · ${mmss(i.at)}${i.dur ? ` / ${mmss(i.dur)}` : ''}` : 'NO SONG — TAP THE CITY FOR SOUND, MUSIC ON';
    const g = i ? `GRID ${i.grid.toUpperCase()}${i.lock != null ? ` · LOCK ${i.lock}` : ''}${i.grid === 'NOT TRUSTED' ? ' · THE KICKS LEAD' : ''}` : '';
    musicEl.replaceChildren(h('div.hr-line', h('b', `PLAYING ${mood} — ${from}`), h('span', line), g ? h('small', { class: i.grid === 'NOT TRUSTED' ? 'hr-warn' : null }, g) : null));
  }
  function statusText() {
    const now = serverNow();
    const until = ms => { const d = new Date(ms), m = Math.max(0, Math.round((ms - now) / 60000)); return `UNTIL ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} (${m} MIN)`; };
    const lines = [];
    if (!R.isEmpty(mine.state)) lines.push({ who: 'JUST ME', what: R.describe(mine.state), when: '', k: 'me' });
    if (mode === 'me' && dirtyMe()) lines.push({ who: 'QUEUED', what: R.describe(R.cleanRemote(pend.state).state), when: delay ? `STARTS ${delay} S AFTER YOU CLOSE` : 'STARTS AS YOU CLOSE', k: 'q' });
    if (liveOn()) lines.push({ who: 'EVERYONE', what: R.describe(live.state), when: until(live.until) + (!R.isEmpty(mine.state) ? ' · HIDDEN HERE BY JUST ME' : ''), k: 'all' });
    if (liveNext) lines.push({ who: 'EVERYONE NEXT', what: R.describe(liveNext.state), when: `STARTS IN ${Math.max(0, Math.ceil((liveNext.startAt - now) / 1000))} S`, k: 'all' });
    if (mode === 'all' && draftDirty()) lines.push({ who: 'NOT SENT', what: R.describe(R.cleanRemote(draft.state).state), when: 'TAP SEND TO EVERYONE', k: 'q' });
    if (!lines.length) lines.push({ who: 'NOTHING ON', what: R.describe(null), when: '' });
    return lines;
  }
  function paintStatus() {
    if (!statusEl) return;
    statusEl.replaceChildren(...statusText().map(l => h('div.hr-line', { class: l.k === 'q' ? 'hr-draft' : l.k ? `hr-l-${l.k}` : null }, h('b', l.who), h('span', l.what), l.when ? h('small', l.when) : null)));
  }
  // ---- THE PANEL'S OWN BLOCKS (not events): where each sits (its section; first or last in it), how many choices, what's on, its rows.
  // The ids are the old categories' (the tests + the shots find them by data-cat).
  const timeLabel = (st, ui) => { const t = ui.t && R.TIMES.find(x => x.id === ui.t); return t ? t.label : st.when && !st.hol ? `${+st.when.slice(5, 7)}/${+st.when.slice(8, 10)} ${st.when.slice(11)}` : null; };
  const OWN = {
    time: {
      sec: 'time', last: false, label: 'TIME OF DAY', q: 'time of day clock jump when',
      n: () => R.TIMES.length,
      on: (st, ui) => [timeLabel(st, ui), st.speed > 1 ? `${st.speed}×` : null],
      kids: (st, ui) => {
        const dt = h('input.input.hr-dt', { type: 'datetime-local', value: st.when || '', 'aria-label': 'Date and time',
          onchange: e => edit((s, u) => { const v = String(e.target.value || '').slice(0, 16); u.t = null; delete u.autoT; delete s.hol; if (v) { u.custom = v; s.when = v; } else { delete u.custom; delete s.when; } retime({ state: s, ui: u }); }) });
        const tb = t => btn(t.label, ui.t === t.id, () => edit((s, u) => { u.t = t.id; delete u.autoT; delete u.custom; retime({ state: s, ui: u }); }), { q: `${t.label} ${t.id} time` });
        // (the day in time order, SUNRISE → NIGHT; then the night's edges + the lights' power-up / down)
        return [opts(...R.TIMES.filter(t => !t.more).map(tb)),
          h('div.hr-gl', 'MORE'), opts(...R.TIMES.filter(t => t.more).map(tb)),
          h('div.hr-row', { dataset: { q: 'date time custom calendar day' } }, dt),
          h('div.hr-gl', 'CLOCK SPEED'), opts(...R.SPEEDS.map(v => btn(`${v}×`, (st.speed || 1) === v, () => edit(s => { if (v === 1) delete s.speed; else s.speed = v; }), { q: `${v}x ${v}× clock speed fast` }))),
          h('div.hr-row', btn('BACK TO NOW', false, () => edit((s, u) => { delete s.when; delete s.speed; delete s.hol; delete u.t; delete u.autoT; delete u.custom; }), { cls: 'hr-wide', q: 'back to now real time clock reset' }))];
      },
    },
    holidays: {
      sec: 'time', last: true, label: 'HOLIDAY', q: 'holiday holidays date',
      n: () => R.HOLIDAYS.length,
      on: st => [st.hol ? R.HOLIDAYS.find(x => x.id === st.hol).label : null],
      kids: st => [h('p.hr-note', 'jumps to its next date (keeps the time you picked; else 21:00)'),
        opts(btn('NONE', !st.hol, () => edit((s, u) => { delete s.hol; retime({ state: s, ui: u }); }), { q: 'no holiday none' }),
          ...R.HOLIDAYS.map(hd => btn(hd.label, st.hol === hd.id, () => edit((s, u) => { s.hol = hd.id; delete u.custom; retime({ state: s, ui: u }); }), { q: `${hd.label} holiday` })))],
    },
    weather: {
      sec: 'weather', last: false, label: 'THE WEATHER', q: 'weather sky',
      n: () => R.WEATHER.length,
      on: st => [st.wx ? R.WEATHER.find(w => w.id === st.wx).label : null],
      kids: st => [opts(btn('REAL', !st.wx, () => edit(s => { delete s.wx; delete s.wxk; }), { q: 'real live weather clear it' }), ...R.WEATHER.map(w => btn(w.label, st.wx === w.id, () => edit(s => { s.wx = w.id; }), { q: `${w.label} ${w.id} weather` }))),
        // (9a: the INTENSITY of the forced state — AUTO = its own)
        opts(btn('AUTO', !st.wxk, () => edit(s => { delete s.wxk; }), { q: 'weather intensity auto' }), ...R.WX_INTENSITY.map(w => btn(w.label, st.wxk === w.id, () => edit(s => { s.wxk = w.id; }), { q: `${w.label} intensity weather rain` })))],
    },
    party: {
      sec: 'lightsmusic', last: false, label: 'PARTY SHOW', q: 'party show night neon',
      n: () => 2 + R.SHOW_SCENE_LIST.length,
      on: st => [st.party ? `PARTY ${st.party.toUpperCase()}` : null, st.scene ? st.scene.toUpperCase() : null],
      kids: st => [
        h('div.hr-gl', 'PARTY NIGHT'), opts(...[['', 'AUTO'], ['on', 'ON'], ['off', 'OFF']].map(([v, l]) => btn(l, (st.party || '') === v, () => edit((s, u) => { if (v) s.party = v; else delete s.party; if (v === 'on') toTonight(s, u, 'night'); }), { q: `party night ${l}` }))),
        h('div.hr-gl', 'HOLD A SCENE'), opts(btn('LET IT RUN', !st.scene, () => edit(s => { delete s.scene; }), { q: 'let it run party scene' }),
          ...R.SHOW_SCENE_LIST.map(sc => btn(sc.id.toUpperCase(), st.scene === sc.id, () => edit(s => { s.scene = sc.id; }), { cls: `hr-${sc.list}`, q: `${sc.id} scene party show ${sc.list}` })))],
    },
    music: {
      sec: 'lightsmusic', last: true, label: 'MUSIC', q: 'music mood song',
      n: () => R.MUSIC_MOODS.length,
      on: st => [st.mood ? R.MUSIC_MOODS.find(m => m.id === st.mood).label : null],
      kids: st => [h('div.hr-gl', 'MOOD'),
        // (AUTO here means AUTO: it also puts this phone's MUSIC MOOD setting back to AUTO, so the city's clock really decides)
        opts(btn('AUTO', !st.mood, () => { autoSetting(); edit(s => { delete s.mood; }); }, { q: 'auto music mood' }), ...R.MUSIC_MOODS.map(m => btn(m.label, st.mood === m.id, () => edit(s => { s.mood = m.id; }), { q: `${m.label} music mood` }))),
        musicEl = h('div.hr-status.hr-music', { 'aria-live': 'off' }),
        h('div.hr-row', btn('SKIP TO THE NEXT SONG', false, async () => { const ok = await switchNow(2); toast(ok ? 'NEXT SONG' : 'NOTHING TO SKIP — THE ROOM’S SONG IS THE HOST’S', ok ? 'info' : 'warn'); paintMusic(); }, { cls: 'hr-wide', title: 'this phone only — at once', q: 'skip next song music' }))],
    },
    // 8a — PULSE STRENGTH (the owner dials it; the number she picks becomes the default: core/harbor-beat.js#PULSE_DEFAULT)
    lights: {
      sec: 'lightsmusic', last: true, label: 'PULSE STRENGTH', q: 'pulse strength beat punch lights',
      n: () => 1,
      on: st => [st.pulse ? `PULSE ${st.pulse} %` : null],
      kids: st => {
        const P = R.PULSE, v = st.pulse || P.def;
        const num = h('b.hr-pv', { 'aria-hidden': 'true' }, `${v} %`);
        const set = (n, soft) => edit(s => { if (n === P.def) delete s.pulse; else s.pulse = n; }, { soft });
        const rng = h('input.hr-range', { type: 'range', min: String(P.min), max: String(P.max), step: String(P.step), value: String(v), 'aria-label': 'Pulse strength, percent',
          oninput: e => { const n = +e.target.value; num.textContent = `${n} %`; clearTimeout(pulseT); pulseT = setTimeout(() => set(n, true), 60); },
          onchange: e => { clearTimeout(pulseT); set(+e.target.value, false); } });
        return [h('div.hr-gl', 'EVERY LIGHT ON THE BEAT'), h('div.hr-pulse', rng, num),
          h('p.hr-note', `${P.def} % = the default · ${P.min}–${P.max} % · a party night, music on: pick what feels right, then tell Claude the number`),
          h('div.hr-row', btn(`BACK TO ${P.def} %`, v === P.def, () => set(P.def, false), { cls: 'hr-wide', q: 'pulse default back' }))];
      },
    },
    // FP — THE DEBUG TOOLS ON THIS PHONE: the READOUT + the AUDIO PANEL, on / off AT ONCE (no countdown: instruments, not shows),
    // remembered on this device (ui/debug-tools.js) — never sent to EVERYONE. The GRID stays a preview flag (it can go to everyone).
    tools: {
      sec: 'tools', last: false, label: 'DEBUG TOOLS', q: 'debug tools readout audio panel grid',
      n: () => 3,
      on: st => [debugTool('readout') || st.debug ? 'READOUT' : null, debugTool('audio') ? 'AUDIO PANEL' : null, st.grid ? 'GRID' : null],
      kids: st => {
        const tool = (id, label) => { const on = debugTool(id) || (id === 'readout' && !!st.debug); const b = btn(label, on, () => { const next = !on; setDebugTool(id, next); if (!next && id === 'readout' && st.debug) edit(s => { delete s.debug; }); else render(); }, { title: 'this phone only · remembered · at once', q: `${label} debug` }); b.dataset.tool = id; return b; };
        return [h('div.hr-gl', 'ON THIS PHONE — AT ONCE, REMEMBERED'), opts(tool('readout', 'READOUT'), tool('audio', 'AUDIO PANEL')),
          h('div.hr-gl', 'PREVIEW'), opts(btn('GRID', !!st.grid, () => edit(s => { if (s.grid) delete s.grid; else s.grid = true; }), { q: 'grid layout' }))];
      },
    },
    // PART 8a — THE CITY SOUNDS: every slot by part — FILLED (its takes) or EMPTY, ▶ plays it on THIS phone at once
    sounds: {
      sec: 'tools', last: true, label: 'CITY SOUNDS', q: 'city sounds sfx audio slots',
      n: () => SLOTS.length,
      on: () => [],
      kids: () => {
        const filled = SLOTS.filter(s => takesOf(s.id).length).length;
        const kids = [h('p.hr-note', `${filled} of ${SLOTS.length} filled · ▶ plays it on this phone at once (a loop ~8 s; louder than in the city) · to fill one: <slot>.wav into Downloads/city-sfx, then scripts/add-city-sfx.py`),
          soundsEl = h('div.hr-status.hr-snd-now', { 'aria-live': 'off' })];
        for (const p of PARTS) kids.push(h('div.hr-gl', p.label), h('div.hr-snds', ...SLOTS.filter(s => s.part === p.id).map(soundRow)));
        return kids;
      },
    },
  };
  // a block: `.hr-sec.hr-k` (the old hooks) — its heading (`.hr-h`), its rows
  const block = (cat, head, q, kids, extra = {}) => h('div.hr-sec.hr-k', { dataset: { cat, q: `${head} ${q || ''}`, ...extra } }, h('h3.hr-h.hr-kh', head), h('div.hr-kb', ...kids));
  function flip(id, secEl) {
    const on = !openSecs.has(id);
    if (on) openSecs.add(id); else openSecs.delete(id);
    ls.set(OPEN_KEY, [...openSecs]);
    if (!secEl) return;
    secEl.classList.toggle('is-open', on);
    secEl.querySelector('.hr-cat').setAttribute('aria-expanded', on ? 'true' : 'false');
    secEl.querySelector('.hr-body').hidden = !on;
  }
  const onLabel = (e, st) => e.label + ((e.inputs || []).includes('text') && st.text ? ` “${st.text}”` : '') + ['scheme', 'game'].filter(k => (e.inputs || []).includes(k) && st[k]).map(k => ` ${st[k].toUpperCase()}`).join('');
  function section(sec, st, ui, force) {
    const own = Object.entries(OWN).filter(([, o]) => o.sec === sec.id);
    const evs = R.PANEL_EVENTS.filter(e => R.sectionOf(e.id) === sec.id);
    const n = evs.length + own.reduce((a, [, o]) => a + o.n(), 0);
    if (!n) return null;
    const onEvs = evs.filter(e => force.has(e.id));
    // (what's on, short: an event + its text / scheme / game, like the status line)
    const on = [...own.flatMap(([, o]) => o.on(st, ui)), ...onEvs.map(e => onLabel(e, st))].filter(Boolean);
    const body = [];
    if (evs.some(e => e.night)) body.push(h('p.hr-note.hr-legend', '☾ = night only: by day it jumps to tonight'));
    const ownBlock = ([id, o]) => block(id, o.label, o.q, o.kids(st, ui));
    for (const ob of own.filter(([, o]) => !o.last)) body.push(ownBlock(ob));
    for (const head of [...new Set(evs.map(e => R.blockOf(e.id)))]) {
      const list = evs.filter(e => R.blockOf(e.id) === head);
      // the inputs of this block's events that are on (shared between events like the links' flags)
      const inputs = [...new Set(list.filter(e => force.has(e.id)).flatMap(e => e.inputs || []))];
      body.push(block(list[0].cat, head, '', [
        inputs.length ? h('div.hr-opts', { dataset: { q: list.filter(e => force.has(e.id)).map(e => `${e.label} ${(e.inputs || []).join(' ')}`).join(' ') } }, ...inputs.map(k => input(k, st, force))) : null,
        grid(...list.map(e => { const b = btn(e.label, force.has(e.id), () => toggleForce(e.id), { night: e.night, title: e.hint, q: R.eventText(e.id) }); b.dataset.ev = e.id; return b; }))], { block: head }));
    }
    for (const ob of own.filter(([, o]) => o.last)) body.push(ownBlock(ob));
    const isOpen = openSecs.has(sec.id), id = `hr-s-${sec.id}`;
    return h('section.hr-sec.hr-s', { class: isOpen ? 'is-open' : null, dataset: { sec: sec.id, q: sec.label } },
      h('button.hr-cat', { type: 'button', 'aria-expanded': isOpen ? 'true' : 'false', 'aria-controls': id, onclick: e => { if (!query.trim()) flip(sec.id, e.currentTarget.parentNode); } },
        h('span.hr-cat-t', h('span.hr-h', sec.label), on.length ? h('small.hr-cat-on', on.join(' · ')) : null),
        on.length ? h('span.hr-cat-dot', { 'aria-label': `${on.length} on` }) : null,
        h('span.hr-cat-n', { 'aria-label': `${n} previews`, dataset: { n: String(n) } }, String(n)),
        h('span.hr-chev', { 'aria-hidden': 'true' })),
      h('div.hr-body', { id, hidden: !isOpen }, ...body));
  }
  function header() {
    const qx = h('button.hr-qx', { type: 'button', 'aria-label': 'Clear the search', hidden: !query, onclick: () => { query = ''; qi.value = ''; qx.hidden = true; filter(); qi.focus(); } }, h('span', '×'));
    const qi = h('input.input.hr-q', { type: 'text', value: query, placeholder: 'Search…', 'aria-label': 'Search the previews', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', enterkeyhint: 'search',
      oninput: e => { query = e.target.value; qx.hidden = !query; filter(); const b = sheet && sheet.firstChild; if (b) b.scrollTop = 0; },
      onkeydown: e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { query = ''; e.target.value = ''; qx.hidden = true; filter(); } } });
    return h('div.hr-top',
      h('div.hr-head',
        h('div.hr-title', h('h2.sheet-title', 'PREVIEW PANEL'), h('div.hr-who', h('span.hr-who-dot'), mode === 'me' ? 'JUST ME — ONLY THIS PHONE' : 'EVERYONE — EVERY PHONE ON CITY 2')),
        h('button.icon-btn.hr-close', { type: 'button', 'aria-label': 'Close the preview panel', onclick: () => close() }, '×')),
      h('div.hr-mode', { role: 'radiogroup', 'aria-label': 'Who sees it' },
        ...[['me', 'JUST ME'], ['all', 'EVERYONE ON CITY 2']].map(([v, l]) => h('button.hr-b.hr-modeb', { type: 'button', role: 'radio', 'aria-checked': mode === v ? 'true' : 'false', class: mode === v ? 'is-on' : null, dataset: { m: v },
          onclick: () => { if (mode === v) return; mode = v; ss.set(MODE_KEY, v); if (v === 'all' && !draftDirty()) draft = { state: clone(liveBase()), ui: {} }; if (v === 'me') ensurePend(); render(); } }, l))),
      h('div.hr-stat',
        statusEl = h('div.hr-status', { 'aria-live': 'polite' }),
        h('button.btn.btn-ghost.hr-clear', { type: 'button', disabled: sendBusy || null, 'aria-label': mode === 'me' ? 'Clear all — back to the real city' : 'Clear all for everyone', onclick: clearAll },
          h('span', 'CLEAR ALL'), h('small', mode === 'me' ? 'REAL CITY' : 'EVERYONE'))),
      h('div.hr-find',
        h('div.hr-search', h('span.hr-mag', { 'aria-hidden': 'true' }), qi, qx),
        h('div.hr-delay', { role: 'radiogroup', 'aria-label': 'Start after closing the panel' },
          h('span.hr-delay-l', { 'aria-hidden': 'true' }, 'START'),
          ...R.DELAYS.map(v => h('button.hr-dl', { type: 'button', role: 'radio', 'aria-checked': delay === v ? 'true' : 'false', class: delay === v ? 'is-on' : null, 'aria-label': v ? `${v} seconds after closing` : 'As soon as it closes',
            onclick: () => { delay = v; ls.set(DELAY_KEY, v); render(); } }, v ? `${v} S` : 'NOW')))));
  }
  function recentRow() {
    if (!recent.length) return null;
    return h('div.hr-recent',
      h('div.hr-gl', mode === 'me' ? 'RECENT — ONE TAP FIRES IT AGAIN' : 'RECENT — ONE TAP ADDS IT TO THE DRAFT'),
      h('div.hr-rcs', ...recent.map(e => h('button.hr-b.hr-rc', { type: 'button', dataset: { rk: `${e.k}:${e.id}` }, 'aria-label': `Fire ${recentLabel(e)} again`, onclick: () => fireRecent(e) },
        h('small', recentKind(e)), h('span', recentLabel(e))))));
  }
  function render() {
    if (!sheet) return;
    const box = sheet.firstChild, top = box.scrollTop, c = cur(), st = c.state, ui = c.ui, force = new Set(st.force || []);
    const focused = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('hr-q');
    musicEl = null; soundsEl = null;
    const kids = [header(), recentRow()];
    for (const sec of R.SECTIONS) kids.push(section(sec, st, ui, force));
    kids.push(h('p.hr-empty', { 'aria-live': 'polite' }));
    if (mode === 'all') {
      kids.push(h('div.hr-send',
        // (7a §0: one row of durations + the button that names the one picked — the bar stays short under the categories)
        h('div.hr-mins', { role: 'radiogroup', 'aria-label': 'For how long, minutes' }, h('span.hr-mins-l', { 'aria-hidden': 'true' }, 'MIN'), ...R.DURATIONS.map(m => h('button.hr-dl', { type: 'button', role: 'radio', 'aria-checked': mins === m ? 'true' : 'false', class: mins === m ? 'is-on' : null, 'aria-label': `${m} minutes`, onclick: () => { mins = m; render(); } }, String(m)))),
        h('button.btn.btn-primary.hr-go', { type: 'button', disabled: sendBusy || null, onclick: send }, sendBusy ? h('span', 'SENDING…') : [h('span', 'SEND'), h('small', 'TO EVERYONE')])));
    }
    box.replaceChildren(...kids.filter(Boolean));
    box.dataset.mode = mode;
    paintStatus(); paintMusic(); paintSounds(); filter();
    box.scrollTop = top;
    if (focused) { const q = box.querySelector('.hr-q'); if (q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch { /* fine */ } } }
  }
  // ---- SEARCH: every row with its text in data-q; a block or a section whose own name matches shows whole
  function filter() {
    const box = sheet && sheet.firstChild;
    if (!box) return;
    const on = !!R.normQ(query);
    box.classList.toggle('is-search', on);
    for (const el of box.querySelectorAll('.hr-nohit')) el.classList.remove('hr-nohit');
    let total = 0;
    for (const sec of box.querySelectorAll('.hr-s')) {
      const nEl = sec.querySelector('.hr-cat-n');
      if (!on) { nEl.textContent = nEl.dataset.n; continue; }
      const sm = R.matchQuery(query, sec.dataset.q);
      let n = 0;
      for (const blk of sec.querySelectorAll('.hr-k')) {
        const bm = sm || R.matchQuery(query, blk.dataset.q);
        let bn = 0;
        for (const it of blk.querySelectorAll('[data-q]')) {
          if (bm || R.matchQuery(query, it.dataset.q)) { if (it.matches('.hr-b, .hr-snd')) bn++; } else it.classList.add('hr-nohit');
        }
        // (labels + notes between the rows: only with their block)
        if (!bm) for (const ch of blk.querySelector('.hr-kb').children) if (ch.dataset.q == null && !ch.querySelector('[data-q]:not(.hr-nohit)')) ch.classList.add('hr-nohit');
        if (!bm && !bn) blk.classList.add('hr-nohit');
        n += bn;
      }
      if (!n && !sm) sec.classList.add('hr-nohit');
      nEl.textContent = String(n);
      total += n;
    }
    const empty = box.querySelector('.hr-empty');
    if (empty) empty.textContent = on && !total ? `NOTHING MATCHES “${query.trim().toUpperCase()}”` : '';
  }
  function input(k, st, force) {
    const def = R.INPUTS[k], users = R.EVENTS.filter(e => force.has(e.id) && (e.inputs || []).includes(k)).map(e => e.label).join(' · ');
    const lab = h('div.hr-gl', `${def.label} — ${users}`);
    if (def.kind === 'text') {
      const max = R.textMax([...force].filter(id => (R.eventDef(id).inputs || []).includes('text')));
      const el = h('input.input.hr-text', { type: 'text', value: st.text || '', maxlength: String(max), placeholder: `up to ${max} letters`, autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', 'aria-label': def.label,
        oninput: e => { const v = e.target.value; for (const o of sheet ? sheet.querySelectorAll('.hr-text') : []) if (o !== e.target) o.value = v; for (const o of sheet ? sheet.querySelectorAll('.hr-fit') : []) paintFit(o, v, cur().state.tower); clearTimeout(typeT); typeT = setTimeout(() => edit(s => { if (v.trim()) s.text = v; else delete s.text; }, { soft: true }), 150); },
        onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } });
      // (7a §0: THE WORD TOWERS — what the message does on them, live while she types)
      const fit = force.has('spell') ? h('div.hr-fit', { 'aria-live': 'polite' }) : null;
      if (fit) { towerFaces = null; paintFit(fit, st.text || '', st.tower); }
      return h('div.hr-opt', lab, el, fit);
    }
    if (def.kind === 'bool') return h('div.hr-opt', lab, opts(btn(st[k] ? 'ON' : 'OFF', !!st[k], () => edit(s => { if (s[k]) delete s[k]; else s[k] = true; }))));
    if (def.kind === 'select') return h('div.hr-opt', lab, swatchesOr(def, k, st));
    // multi / colours: up to def.max picked, in the order picked
    const picked = String(st[k] || '').split(',').filter(Boolean);
    return h('div.hr-opt', lab, h(def.kind === 'colours' ? 'div.hr-swg' : 'div.hr-grid.hr-g3', ...def.options.map(o => btn(def.kind === 'colours' ? '' : o.replace('mark:', '★ ').toUpperCase(), picked.includes(o), () => edit(s => {
      const p = String(s[k] || '').split(',').filter(Boolean), i = p.indexOf(o);
      if (i >= 0) p.splice(i, 1); else if (p.length < def.max) p.push(o);
      if (p.length) s[k] = p.join(','); else delete s[k];
    }), { cls: def.kind === 'colours' ? 'hr-sw' : '' })).map((b, i) => { if (def.kind === 'colours') { b.style.setProperty('--sw', `#${def.options[i]}`); b.setAttribute('aria-label', `#${def.options[i]}`); } return b; })));
  }
  // ---- THE WORD TOWERS' readout (7a §0): each tower's room on this screen and what the typed message does on them
  let towerFaces = null;
  function liveFaces() {
    if (towerFaces) return towerFaces;
    let f = null;
    try { const sc = scene(), hb = sc && sc.harbor ? sc.harbor() : null; f = hb && hb.windows && hb.windows.faces; } catch { f = null; }
    const ok = f && Object.keys(WORD_FACES).every(id => f[id] && f[id].cols);
    towerFaces = ok ? Object.fromEntries(Object.keys(WORD_FACES).map(id => [id, { cols: f[id].cols, rows: f[id].rows, word: f[id].word }])) : WORD_FACES;
    return towerFaces;
  }
  const TW = { wordA: 'A', wordB: 'B', wordV: 'V' };
  const CHARS = `A–Z 0–9 ! ? - . ' ${Object.entries(FONT_ALIASES).map(([c, a]) => `${c} (${a})`).join(' ')}`;
  function paintFit(el, text, tower) {
    const faces = liveFaces(), cap = towerCapacity(faces), fit = fitText(text, faces, tower || '');
    const room = Object.entries(cap).map(([id, c]) => `${TW[id]} ${c.letters}${c.word === 'v' ? ' DOWN' : c.lines > 1 ? ` × ${c.lines} LINES` : ''}`).join(' · ');
    const rows = fit ? fit.plan.map(p => h('div.hr-fit-row', { class: p.scroll ? 'is-scroll' : null }, h('b', TW[p.tower]), h('span', p.text),
      h('small', p.scroll ? `${p.letters} of ${p.cap} — SCROLLS` : `${p.letters} of ${p.cap}`))) : [h('div.hr-fit-row', h('span', 'TYPE A MESSAGE — ONE WORD PER TOWER'))];
    el.replaceChildren(...[...rows,
      h('small.hr-fit-n', `ROOM (LETTERS): ${room}`),
      fit && fit.bad.length ? h('small.hr-fit-n.hr-warn', `NOT IN THE WINDOW FONT (SKIPPED): ${fit.bad.join(' ')}`) : null,
      h('small.hr-fit-n', `WORKS: ${CHARS}`)].filter(Boolean));
  }
  // a select: one choice (a colour shows as its swatch)
  function swatchesOr(def, k, st) {
    return h(def.options.some(o => /^[0-9a-f]{6}$/.test(o)) ? 'div.hr-swg' : 'div.hr-grid.hr-g3', ...def.options.map(o => {
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
    /** (tests + shots) the mode, and this phone's JUST ME state — at once (no countdown, nothing queued) */
    setMode(v) { mode = v === 'all' ? 'all' : 'me'; ss.set(MODE_KEY, mode); if (mode === 'all') draft = { state: clone(liveBase()), ui: {} }; render(); },
    setMine(st) { if (cd && cd.mode === 'me') stopCd(); pend = null; restart.clear(); mode = 'me'; mine.state = R.cleanRemote(st).state; mine.ui = {}; mine.at = serverNow(); saveMine(); apply(); render(); },
    /** (tests + shots) open exactly these sections (section ids or the old category ids, or '*' = all); remembered like a tap */
    openCats(ids) { openSecs.clear(); for (const id of ids === '*' ? SEC_IDS : ids || []) { const s = R.toSection(id); if (s) openSecs.add(s); } ls.set(OPEN_KEY, [...openSecs]); render(); },
    /** (tests + shots) the search box's text; the delay (0 / 3 / 5 s, remembered) */
    search(q) { query = String(q || ''); render(); },
    delay(v) { if (v != null && R.DELAYS.includes(v)) { delay = v; ls.set(DELAY_KEY, v); render(); } return delay; },
    /** (shots) a countdown chip on show, as if the sheet had just closed */
    previewCountdown(m = 'me', s = 3, what = 'AURORA · DUSK') { countdown(m, serverNow() + s * 1000 + 400, what); setTimeout(() => { if (cd && cd.what === what) clearInterval(cd.iv); }, 450); },
    debug: () => ({ mode, admin, mine: mine.state, pend: pend && pend.state, queued: dirtyMe(), live, liveNext, delay, query, recent: recent.slice(), countdown: cd && { mode: cd.mode, at: cd.at, n: cd.n, what: cd.what }, open: [...openSecs], effective: !R.isEmpty(mine.state) ? 'me' : liveOn() ? 'all' : null }),
    destroy() {
      destroyed = true; clearInterval(tick); clearInterval(musicT); clearTimeout(typeT); clearTimeout(nextT); clearTimeout(goT);
      if (cd) clearInterval(cd.iv);
      if (unsub) { try { unsub(); } catch { /* fine */ } }
      if (bar) bar.remove();
      if (sheet) sheet.remove();
      chip = sheet = bar = xb = cdEl = null;
    },
  };
}
