// RUMRUNNER — the screen: the city (scene.js, three.js) behind a deco-gold glass UI.
//
// Layers: the city canvas (full screen; the camera frames the diorama in the rectangle the panels leave free) → district
// labels (projected each frame, transforms only) → the top bar (day, weather, where you are, the day timer) → the live
// net-worth board → the panel (the morning, the market / Vale / the stash / the garage / travel, DONE) → overlays: events
// (the camera swoops into your district, then a choice card), the dawn and night cards, the newspaper, the podium.
// Everything renders from state + your own private logs: a refresh re-reads your logs and continues the same day.
import { h, reducedMotion, vibrate } from '../../ui/dom.js';
import { avatar, createTimer } from '../../ui/components.js';
import { pubOf } from '../../profile/public.js';
import { rankBadge } from '../../ui/emblems.js';
import { createFinal } from '../../ui/final.js';
import { colorHex } from '../../config.js';
import { dbRef, get, set, update as dbUpdate, serverNow, serverTimestamp } from '../../firebase.js';   // (update: the view has its own update(state))
import { setPlaylist, duckMusic } from '../../audio/music.js';
import { settings } from '../../audio/settings.js';
import { rngFrom, shuffle } from '../../core/rng.js';
import { createAnnouncer, createCards, reportPanel, createTiers, installTestHook, removeTestHook } from '../kit/index.js';
import {
  GOOD_IDS, DIST_IDS, DIST, UPGRADES, HOME, MS, START_CASH, START_DEBT, MAX_ACTS, GARAGE_DISCOUNT, units, fortune, stateOnArrival, rollEvents, eventChoices, applyEvent, applyAction, snapshot,
  upgradesHere, upgradePrice, valeHere, stashHere, tipCost, bribeCost, runOdds, floorOdds, standings, matchStory, interestRate, replay,
} from './logic.js';
import { botDay } from './bot.js';
import { GOOD_TEXT, DISTRICT_TEXT, WEATHER_TEXT, UPGRADE_TEXT, newsLine, rumorLine, eventScene, outcomeLine, valeLines, headlines, fmt$ } from './text.js';
import { GOOD_ICONS, WEATHER_ICONS, DISTRICT_ICONS, VALE_SVG, svgEl } from './icons.js';
import { createCity } from './scene.js';
import { createSfx } from './audio.js';
import { drawNewspaper, loadPaperFonts, savePage } from './newspaper.js';

const num = n => Math.round(n).toLocaleString('en-US');
const fmtPct = r => { const p = r * 100; return Number.isInteger(p) ? String(p) : p.toFixed(1); };
// the four tracks, calm first (run1 quietest → run4 most driving): a seeded calm pair opens the match, the driving pair follows
export const musicOrder = code => { const r = rngFrom(`${code}:rum:music`); return [...shuffle(r, ['run1', 'run2']), ...shuffle(r, ['run3', 'run4'])]; };
const NW0 = START_CASH - START_DEBT;   // everyone's net worth on the first morning
const CHOICE_ORDER = ['run', 'bribe', 'dump', 'pay', 'stall', 'hand', 'floor', 'take', 'noted', 'buy', 'pass'];

export function createView() {
  let st = null, game = null, root = null, city = null, raf = 0, ro = null, roPanel = null, destroyed = false;
  let ann = null, cards = null, timer = null, finalView = null, tiers = null, hook = null;
  const sfx = createSfx();
  const els = {};
  const me = () => st && st.uid;
  const inMatch = () => !!(game && game.participants && game.participants[me()]);
  const reduced = () => !!settings.reducedFx || reducedMotion();
  // my private side of the match (logs are the truth; everything else is derived)
  let my = fresh();
  function fresh() { return { matchId: null, logs: {}, loaded: false, loading: false, day: 0, log: null, events: [], outs: [], evIdx: 0, showing: null, done: false, S: null, S0: null, tab: 'market', open: null, bot: null, writeT: 0, pubT: 0, paper: null, podium: false, typed: '' }; }
  let lastKey = '', rootW = 1;
  const timers = new Map();
  const later = (k, ms, fn) => { clearTimeout(timers.get(k)); timers.set(k, setTimeout(fn, ms)); };

  // ================================================================ mount / unmount
  function mount(el, state) {
    st = state;
    root = h('div.rr-root.mk-root', { style: { '--c': '#f0c75e' } });
    els.city = h('canvas.rr-city', { 'aria-hidden': 'true' });
    els.sky = h('div.rr-sky', { 'aria-hidden': 'true' }, ...['clear', 'rain', 'fog', 'storm', 'dawn'].map(w => h('div.rr-sky-l', { 'data-w': w })));
    els.flash = h('div.rr-flash', { 'aria-hidden': 'true' });
    els.labels = h('div.rr-labels', { 'aria-hidden': 'true' });
    for (const id of DIST_IDS) { const l = h('div.rr-dlabel', { 'data-dist': id }, h('span.rr-dlabel-n', DISTRICT_TEXT[id].name), h('span.rr-dlabel-dots')); els.labels.append(l); }
    els.top = h('div.rr-top');
    els.board = h('div.rr-board');
    els.space = h('div.rr-space');
    els.panel = h('div.rr-panel');
    els.ann = h('div.rr-ann', { 'aria-live': 'polite' });
    els.overlay = h('div.rr-overlay');
    els.event = h('div.rr-event');
    els.card = h('div.rr-dcard');
    els.paper = h('div.rr-paper');
    els.final = h('div.rr-final');
    els.ui = h('div.rr-ui', els.top, els.board, els.space, els.panel);
    root.append(els.sky, els.city, els.flash, els.labels, els.ui, els.ann, els.card, els.event, els.overlay, els.paper, els.final);
    el.classList.add('rr-screen');
    el.append(root);
    document.body.classList.add('rr-on');
    loadFont();
    ann = createAnnouncer(els.ann, { prefix: 'rr', holdMs: 1900, queueMax: 4 });
    cards = createCards(els.overlay, { prefix: 'rr' });
    timer = createTimer({ warnAt: 10000 });
    city = createCity(els.city, { reduced: reduced() });
    city.onFlash(() => { if (!destroyed) { els.flash.classList.remove('is-on'); void els.flash.offsetWidth; els.flash.classList.add('is-on'); sfx.thunder(); } });
    tiers = createTiers({ apply: t => { city.setTier(t); root.dataset.tier = t; } });
    ro = new ResizeObserver(() => { if (!city || !root) return; rootW = root.clientWidth; city.resize(rootW, root.clientHeight); frameCity(); });
    ro.observe(root);
    roPanel = new ResizeObserver(() => frameCity());
    roPanel.observe(els.panel); roPanel.observe(els.space);
    setPlaylist('rum', musicOrder(state.code));
    setupHook();
    update(state);
    raf = requestAnimationFrame(frame);
  }
  function loadFont() {
    if (document.getElementById('rr-font')) return;
    document.head.append(h('link', { id: 'rr-font', rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,600&display=swap' }));
  }
  function unmount() {
    destroyed = true;
    cancelAnimationFrame(raf);
    for (const t of timers.values()) clearTimeout(t);
    if (ro) ro.disconnect(); if (roPanel) roPanel.disconnect();
    if (timer) timer.stop();
    sfx.stop();
    duckMusic(1, 0.6);
    if (city) city.destroy();
    if (finalView) finalView.destroy();
    document.body.classList.remove('rr-on');
    removeTestHook('__rum', hook);
  }
  // the rectangle the city should sit in: the space between the board and the panel (phones), the left column (desktop)
  function frameCity() {
    if (!city || !els.space.offsetParent) return;
    let x = 0, y = 0, e = els.space;
    for (; e && e !== root; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
    city.setFrame({ x, y, w: els.space.offsetWidth, h: els.space.offsetHeight });
  }

  // ================================================================ state
  function update(state) {
    st = state;
    const g = state.game;
    if (!g || g.id !== 'rum') return;
    const newMatch = !game || game.matchId !== g.matchId;
    game = g;
    if (newMatch) resetMatch();
    if (!my.loaded && !my.loading && inMatch()) loadLogs();
    if (my.day !== game.day) newDay();
    if (!my.done && inMatch() && st.liveKey && st.live && st.live.pub && st.live.pub[me()] && st.live.pub[me()].done) { my.done = true; els.panel.dataset.sig = ''; }
    syncPhase();
    renderTop();
    renderBoard();
    renderPanel();
    renderTrucks();
  }
  function resetMatch() {
    my = fresh(); my.matchId = game.matchId;
    lastKey = '';
    for (const t of timers.values()) clearTimeout(t); timers.clear();
    if (finalView) { finalView.destroy(); finalView = null; }
    els.final.replaceChildren(); els.paper.replaceChildren(); els.event.replaceChildren(); els.card.replaceChildren();
    root.classList.remove('is-final', 'is-paper', 'is-event', 'is-dawn', 'is-night', 'is-intro');
    city.focus(null);
    city.setTrucks({});
  }
  function loadLogs() {
    my.loading = true;
    const m = game.matchId;
    get(dbRef(`rrp/${st.code}/${m}/${me()}`)).then(s => {
      if (destroyed || !game || game.matchId !== m) return;
      const v = s.val() || {};
      // (day-keyed objects come back from Firebase as arrays with a null at 0)
      for (const [d, log] of Object.entries(v)) if (log && Number(d) > 0 && !my.logs[d]) my.logs[d] = normalizeLog(log);
      my.loaded = true; my.loading = false;
      if (my.logs[game.day]) { my.log = my.logs[game.day]; my.evIdx = Object.keys(my.log.ev || {}).length; }
      derive(); renderPanel(); renderBoard(); maybeEvent();
    }).catch(() => { my.loading = false; later('reload', 1500, () => { if (!my.loaded && !my.loading && game && game.matchId === m) loadLogs(); }); });
  }
  const normalizeLog = log => ({ ev: { ...(log.ev || {}) }, a: Array.isArray(log.a) ? log.a.map(x => Array.isArray(x) ? x : Object.values(x || {})) : Object.values(log.a || {}).map(x => Array.isArray(x) ? x : Object.values(x || {})), dest: log.dest || null });
  function newDay() {
    my.day = game.day;
    // the host's books are the truth: if my own replay disagrees with last night's net worth (a write that never
    // landed), re-read my logs before doing anything today
    if (my.loaded && game.day > 1 && game.nwh && game.nwh[game.day - 1] && typeof game.nwh[game.day - 1][me()] === 'number') {
      const R = replay(game, me(), my.logs, game.day - 1);
      const H = R.hist[R.hist.length - 1];
      if (H && H.nw !== game.nwh[game.day - 1][me()]) { my.loaded = false; my.logs = {}; loadLogs(); }
    }
    later('seatme', 300, () => { const s = els.board.querySelector('.rr-seat.is-me'); if (s && s.scrollIntoView) s.scrollIntoView({ inline: 'nearest', block: 'nearest' }); });
    my.log = my.logs[game.day] || null;
    my.evIdx = my.log ? Object.keys(my.log.ev || {}).length : 0;
    my.outs = []; my.showing = null; my.open = null; my.typed = '';
    my.done = !!(st.live && st.live.pub && st.live.pub[me()] && st.live.pub[me()].done);
    my.tab = 'market';
    derive();
  }
  const day = () => game.days && game.days[game.day];
  const prices = () => { const d = day(); return (d && d.p && my.S && d.p[my.S.dist]) || {}; };
  /** My state today, from my logs: arrival → the events I've answered → my actions, in order (what replay() will do). */
  function derive() {
    if (!inMatch() || !day() || !my.loaded) { my.S = null; return; }
    const d = game.day;
    const { S: S0 } = stateOnArrival(game, me(), my.logs, d);
    my.S0 = S0;
    const S = snapshot(S0);
    const pr = (day().p && day().p[S.dist]) || {};
    my.events = rollEvents(game.matchId, me(), d, S0, day(), game.settings.days);
    const log = my.log || { ev: {}, a: [], dest: null };
    my.outs = [];
    my.events.forEach((ev, i) => { if (i < my.evIdx) my.outs[i] = applyEvent(ev, log.ev[i], S, day(), pr); });
    const ctx = { uid: me(), participants: game.participants, nw: (game.nwh && game.nwh[d - 1]) || null, canTip: d < game.settings.days, tipped: false };
    for (const a of log.a) applyAction(a, S, pr, ctx);
    my.tipped = ctx.tipped;
    my.S = S;
  }
  const seed = () => game.matchId;
  const effDest = () => { const d = my.log && my.log.dest; if (!d || !DIST[d]) return null; if (DIST[d].fee && d !== myDist() && my.S && my.S.cash < DIST[d].fee) return null; return d; };
  const myDist = () => (my.S && my.S.dist) || (day() && day().at && day().at[me()]) || HOME;
  const nwOf = uid => { const p = st.live && st.live.pub && st.live.pub[uid]; if (p && typeof p.nw === 'number') return p.nw; return (game.nw && game.nw[uid]) ?? NW0; };
  const rngFor = (...k) => rngFrom([seed(), me(), game.day, ...k].join(':'));

  // ================================================================ phases
  const phaseKey = () => `${game.matchId}|${game.day}|${game.phase}`;
  function syncPhase() {
    const key = phaseKey();
    const fresh = key !== lastKey;
    if (!fresh) return;
    lastKey = key;
    const d = day();
    root.classList.toggle('is-intro', game.phase === 'intro');
    root.classList.toggle('is-dawn', game.phase === 'dawn');
    root.classList.toggle('is-night', game.phase === 'night');
    root.classList.toggle('is-day', game.phase === 'day');
    root.classList.toggle('is-final', game.phase === 'final');
    root.dataset.weather = d ? d.w : 'clear';
    city.setWeather(d ? d.w : 'clear');
    sfx.weather(d ? d.w : 'clear');
    if (game.phase === 'intro') { showIntro(); city.focus('quarter', 0.6); }
    if (game.phase === 'dawn') { closeEvent(); showDawn(); }
    if (game.phase === 'day') { closeDawn(); city.focus(null); if (game.day === 1) city.focus('quarter', 0.7); later('unfocus', 1500, () => { if (!my.showing) city.focus(null); }); maybeEvent(); if (my.bot) later('bot', 900 + Math.random() * 1500, runBot); }
    if (game.phase === 'night') { closeEvent(); showNight(); }
    if (game.phase === 'final') { closeEvent(); closeDawn(); showPaper(); }
    if (game.phase !== 'final') { root.classList.remove('is-paper'); }
  }

  // ---- intro: the title and Vale's welcome
  function showIntro() {
    const lines = valeLines('intro', { debt: START_DEBT }, rngFor('intro'));
    els.card.replaceChildren(h('div.rr-intro',
      h('div.rr-intro-k', `${game.settings.days} DAYS · ${Object.keys(game.participants).length} RUMRUNNERS`),
      h('div.rr-intro-t', 'RUMRUNNER'),
      h('div.rr-vale', h('div.rr-vale-sil', svgEl(VALE_SVG)), h('div.rr-vale-lines'))));
    typeLines(els.card.querySelector('.rr-vale-lines'), lines, 26);
    root.classList.add('is-card');
  }
  function typeLines(el, lines, ms) {
    el.replaceChildren();
    let li = 0, ci = 0;
    const cur = () => el.lastChild;
    const step = () => {
      if (destroyed || !el.isConnected) return;
      if (li >= lines.length) return;
      if (ci === 0) el.append(h('p'));
      const line = lines[li];
      cur().textContent = line.slice(0, ci + 1);
      ci++;
      if (ci % 2 === 0) sfx.type();
      if (ci >= line.length) { li++; ci = 0; sfx.ding(); later('type', reduced() ? 60 : 520, step); }
      else later('type', reduced() ? 6 : ms, step);
    };
    if (reduced()) { lines.forEach(l => el.append(h('p', l))); return; }
    step();
  }

  // ---- dawn: the day, the weather, the news; the trucks drive in
  function showDawn() {
    const d = day(); if (!d) return;
    const n = game.day, days = game.settings.days;
    const W = WEATHER_TEXT[d.w] || WEATHER_TEXT.clear;
    const r = rngFor('dawn');
    const items = [];
    for (const item of d.news || []) items.push(h('div.rr-news', h('span.rr-news-k', 'EXTRA'), newsLine(item, r)));
    if (d.hot && d.hot[me()]) items.push(h('div.rr-news.is-hot', h('span.rr-news-k', 'PSST'), 'Word on the street: someone’s been talking. Keep your head down today.'));
    if (n === days) items.push(h('div.rr-news.is-last', h('span.rr-news-k', 'LAST DAY'), 'Whatever you don’t sell today is worth nothing at dusk.'));
    else if (n === days - 1) items.push(h('div.rr-news.is-last', h('span.rr-news-k', 'NOTICE'), 'Tomorrow is the last day. Plan your final sale now — unsold cargo is worth nothing.'));
    const me0 = inMatch() ? (d.at && d.at[me()]) || HOME : null;
    const arriving = me0 ? `YOU ARRIVE ${DISTRICT_TEXT[me0].at.toUpperCase()}` : 'WATCHING THE CITY';
    els.card.replaceChildren(h('div.rr-dawn',
      h('div.rr-dawn-k', n === days ? 'THE LAST MORNING' : 'A NEW DAY'),
      h('div.rr-dawn-day', h('span', 'DAY'), h('b', String(n)), h('span.rr-dawn-of', `OF ${days}`)),
      h('div.rr-dawn-w', svgEl(WEATHER_ICONS[d.w] || WEATHER_ICONS.clear), h('div', h('b', W.name), h('span', W.effect))),
      h('div.rr-dawn-arr', arriving),
      items.length ? h('div.rr-dawn-news', ...items) : null,
      d.f && n < days ? h('div.rr-dawn-f', `TOMORROW: ${(WEATHER_TEXT[d.f] || {}).name || ''}`) : null));
    root.classList.add('is-card');
    if (n === days) ann.announce('THE LAST MORNING', 'last');
    // the drive
    const prev = game.days[n - 1];
    const now = serverNow();
    let k = 0;
    for (const uid of Object.keys(game.participants)) {
      const from = prev && prev.at ? prev.at[uid] : HOME, to = (d.at && d.at[uid]) || HOME;
      if (from !== to) { city.drive(uid, from, to, 3400, performance.now(), 120 * k++); }
    }
    if (k && inMatch() && prev && prev.at && prev.at[me()] !== (d.at && d.at[me()])) { sfx.drive(true); later('drive', 3600, () => sfx.drive(false)); }
    void now;
    if (me0) later('dawnfocus', 2600, () => city.focus(me0, 0.6));
  }
  function closeDawn() { root.classList.remove('is-card'); later('cardclear', 500, () => { if (game.phase !== 'dawn' && game.phase !== 'intro' && game.phase !== 'night') els.card.replaceChildren(); }); }

  // ---- night: the city sleeps; your day in one card
  function showNight() {
    const d = game.day;
    const R = inMatch() ? replay(game, me(), my.logs, d) : null;
    const H = R && R.hist[d - 1];
    const rows = [];
    if (H) {
      let sold = 0, bought = 0, paid = 0;
      for (const a of H.acts) { if (a.k === 't') { if (a.q < 0) sold += -a.q * a.price; else bought += a.q * a.price; } if (a.k === 'p') paid += a.amt; }
      for (const e of H.events) if (e.t === 'vale' && e.paid) paid += e.paid;
      if (sold) rows.push(['SOLD', fmt$(sold)]);
      if (bought) rows.push(['BOUGHT', fmt$(bought)]);
      if (paid) rows.push(['PAID VALE', fmt$(paid)]);
      const prevNw = d > 1 && game.nwh && game.nwh[d - 1] ? game.nwh[d - 1][me()] : NW0;
      rows.push(['NET WORTH', `${fmt$(H.nw)} (${H.nw - prevNw >= 0 ? '+' : '−'}${fmt$(Math.abs(H.nw - prevNw))})`]);
      if (d < game.settings.days) rows.push(['TOMORROW', DISTRICT_TEXT[H.dest || H.dist].name + (H.dest && H.dest !== H.dist ? '' : ' (STAYING)')]);
      if (d < game.settings.days && R.S.debt > 0) rows.push(['VALE’S INTEREST', `+${fmt$(Math.round(R.S.debt * interestRate(game.settings.days)))} tonight`]);
    }
    els.card.replaceChildren(h('div.rr-night',
      h('div.rr-night-t', d >= game.settings.days ? 'LAST CALL' : 'THE CITY SLEEPS'),
      rows.length ? h('div.rr-night-rows', ...rows.map(([k, v]) => h('div.rr-night-row', h('span', k), h('b', v)))) : h('div.rr-night-sub', 'The presses are warming up.')));
    root.classList.add('is-card');
    city.focus(null);
  }

  // ---- the events: one at a time, the camera on your district
  function maybeEvent() {
    if (game.phase !== 'day' || !inMatch() || !my.loaded || my.bot) return;
    if (my.showing) return;
    const ev = my.events[my.evIdx];
    if (!ev) { closeEvent(); return; }
    showEvent(ev, my.evIdx);
  }
  function showEvent(ev, i) {
    const S = my.S;
    const pr = prices();
    const choices = eventChoices(ev, S, pr);
    const ctx = { weather: day().w, dist: S.dist, odds: ev.t === 'feds' ? runOdds(S, day().w) : ev.t === 'hijack' ? floorOdds(S) : 0, bribe: bribeCost(S, pr), price: ev.id ? upgradePrice(ev.id, GARAGE_DISCOUNT) : 0, keep: S.upg.hidden ? 0.5 : 1, upgradeName: ev.id ? UPGRADES[ev.id].name : '', goodName: ev.good ? GOOD_TEXT[ev.good].name : '', choices, debt: S.debt, n: ev.n };
    const scene = eventScene(ev, ctx, rngFor('ev', i));
    my.showing = { i, ev };
    root.classList.add('is-event'); root.dataset.ev = ev.t;
    city.focus(S.dist, rootW > 900 ? 0.52 : 0.4);
    duckMusic(0.35, 0.6);
    if (ev.t === 'feds') sfx.siren(); else if (ev.t === 'vale' || ev.t === 'hijack') sfx.low(); else sfx.sting();
    const body = ev.t === 'rumor' ? rumorLine(ev, rngFor('rum', i)) : scene.body;
    const list = CHOICE_ORDER.filter(c => choices.includes(c)).map(c => {
      const t = (scene.choices && scene.choices[c]) || { label: c.toUpperCase(), hint: '' };
      return h('button.rr-choice', { type: 'button', 'data-choice': c, onclick: () => choose(c) }, h('b', t.label), h('span', t.hint));
    });
    els.event.replaceChildren(h('div.rr-ev', { 'data-t': ev.t },
      h('div.rr-ev-k', scene.kicker || ''),
      h('div.rr-ev-t', scene.title || ''),
      ev.t === 'vale' ? h('div.rr-vale.is-small', h('div.rr-vale-sil', svgEl(VALE_SVG)), h('div.rr-vale-lines')) : null,
      h('div.rr-ev-b', body),
      h('div.rr-ev-c', ...list)));
    if (ev.t === 'vale') typeLines(els.event.querySelector('.rr-vale-lines'), valeLines('collect', { debt: S.debt }, rngFor('vl', i)), 22);
  }
  function choose(c) {
    if (!my.showing || game.phase !== 'day') return;
    const { i, ev } = my.showing;
    const log = ensureLog();
    log.ev[i] = c;
    my.evIdx = i + 1;
    derive();
    writeLog();
    const out = my.outs[i];
    const line = outcomeLine(out, { goodNames: Object.fromEntries(GOOD_IDS.map(g => [g, GOOD_TEXT[g].name])), upgradeNames: Object.fromEntries(Object.keys(UPGRADES).map(u => [u, UPGRADES[u].name])) }, rngFor('out', i));
    if (out.caught || out.took) { vibrate([30, 40, 30]); sfx.low(); } else if (out.ok || out.got || out.bought || out.slide || out.paid) { sfx.coins(3); } else sfx.tap();
    if (out.t === 'feds' && out.ok) sfx.drive(true), later('drive', 1400, () => sfx.drive(false));
    const lost = out.lost && Object.keys(out.lost).length ? h('div.rr-out-lost', ...Object.entries(out.lost).map(([g, n]) => h('span', `−${n} ${GOOD_TEXT[g].short}`))) : null;
    const money = out.fine ? h('div.rr-out-money.is-bad', `−${fmt$(out.fine)} fine`) : out.bribe ? h('div.rr-out-money.is-bad', `−${fmt$(out.bribe)}`) : out.took ? h('div.rr-out-money.is-bad', `−${fmt$(out.took)}`) : out.paid ? h('div.rr-out-money', `−${fmt$(out.paid)} to Vale`) : out.price ? h('div.rr-out-money', `−${fmt$(out.price)}`) : null;
    els.event.replaceChildren(h('div.rr-ev.is-out', { 'data-t': ev.t, 'data-ok': out.ok || out.got || out.slide || out.bought ? '1' : out.caught || out.took ? '0' : '' },
      h('div.rr-ev-t', line.title), h('div.rr-ev-b', line.body), lost, money,
      h('button.rr-choice.is-go', { type: 'button', onclick: () => { my.showing = null; maybeEvent(); renderPanel(); } }, h('b', my.events[i + 1] ? 'NEXT' : 'TO BUSINESS'))));
    renderPanel(); renderBoard();
  }
  function closeEvent() {
    if (!root.classList.contains('is-event')) return;
    root.classList.remove('is-event');
    my.showing = null;
    later('evclear', 450, () => els.event.replaceChildren());
    if (game.phase === 'day') city.focus(null);
    duckMusic(1, 1.2);
  }

  // ================================================================ writing my day
  // every write is logged, never thrown: a refused write (the phase turned) must not break the screen
  const safe = (fn, what) => { try { return Promise.resolve(fn()).catch(e => console.warn(what, e && (e.code || e.message || e))); } catch (e) { console.warn(what, e); return Promise.resolve(); } };
  const ensureLog = () => { if (!my.log) { my.log = { ev: {}, a: [], dest: null }; my.logs[game.day] = my.log; } return my.log; };
  function writeLog() {
    if (!inMatch() || game.phase !== 'day' || !my.log) return;
    const d = game.day, m = game.matchId;
    clearTimeout(my.writeT);
    my.writeT = setTimeout(() => {
      const log = my.logs[d]; if (!log) return;
      safe(() => set(dbRef(`rrp/${st.code}/${m}/${me()}/${d}`), { ev: log.ev, a: log.a, dest: log.dest || null, at: serverTimestamp() }), 'rum log');
    }, game.phaseEndsAt && game.phaseEndsAt - serverNow() < 2500 ? 0 : 120);
    publishNw(false);
  }
  function publishNw(done) {
    if (!inMatch() || !my.S) return;
    const d = game.day, m = game.matchId;
    // a net-worth update never erases a DONE flag already there
    const nw = () => { const R = replay(game, me(), my.logs, d); const H = R.hist[R.hist.length - 1]; return H ? H.nw : fortune(my.S); };
    const write = () => safe(() => (done || my.done ? set(dbRef(`rooms/${st.code}/rrpub/${m}/${d}/${me()}`), { nw: nw(), done: serverTimestamp() }) : dbUpdate(dbRef(`rooms/${st.code}/rrpub/${m}/${d}/${me()}`), { nw: nw() })), 'rum pub');
    if (done) { clearTimeout(my.pubT); write(); return; }
    clearTimeout(my.pubT); my.pubT = setTimeout(write, 500);
  }
  /** One action from the panel: validated locally the way the replay will, then appended to the log. */
  function act(a) {
    if (!inMatch() || game.phase !== 'day' || my.done || !my.S || my.evIdx < my.events.length) return null;
    if (game.phaseEndsAt && game.phaseEndsAt - serverNow() < 700) { sfx.tap(); return null; }   // too late to land before night
    if (my.log && my.log.a.length >= MAX_ACTS) { ann.announce('THAT’S ENOUGH DEALS FOR ONE DAY', 'warn'); return null; }
    const S = snapshot(my.S);
    const ctx = { uid: me(), participants: game.participants, nw: (game.nwh && game.nwh[game.day - 1]) || null, canTip: game.day < game.settings.days, tipped: my.tipped };
    const rec = applyAction(a, S, prices(), ctx);
    if (!rec) return null;
    ensureLog().a.push(a);
    derive(); writeLog();
    if (rec.k === 't') { if (rec.q < 0) sfx.register(); else sfx.coins(Math.min(6, 2 + Math.round(Math.log10(rec.price * rec.q + 1)))); vibrate(10); }
    else if (rec.k === 'p' || rec.k === 's') sfx.coins(4);
    else if (rec.k === 'u') sfx.sting();
    else if (rec.k === 'x') sfx.low();
    renderPanel(); renderBoard();
    return rec;
  }
  function setDest(id) {
    if (!inMatch() || game.phase !== 'day' || my.done || !my.S || my.evIdx < my.events.length) return;
    if (!DIST[id]) return;
    if (DIST[id].fee && id !== myDist() && my.S.cash < DIST[id].fee) { sfx.tap(); return; }
    ensureLog().dest = id === myDist() ? null : id;
    writeLog(); sfx.tap(); renderPanel();
  }
  function finishDay() {
    if (!inMatch() || game.phase !== 'day' || my.done || !my.S || my.evIdx < my.events.length) return;
    my.done = true;
    if (my.log) { clearTimeout(my.writeT); const d = game.day, m = game.matchId; safe(() => set(dbRef(`rrp/${st.code}/${m}/${me()}/${d}`), { ev: my.log.ev, a: my.log.a, dest: my.log.dest || null, at: serverTimestamp() }), 'rum done'); }
    publishNw(true);
    sfx.done(); vibrate(18);
    renderPanel();
  }
  function runBot() {
    if (!my.bot || game.phase !== 'day' || !inMatch() || my.done) return;
    const log = botDay(game, me(), my.logs, my.bot.strategy, my.bot.seed || '');
    my.logs[game.day] = my.log = { ev: log.ev, a: log.a, dest: log.dest === myDist() ? null : log.dest };
    my.evIdx = my.events.length;
    derive();
    closeEvent();
    const d = game.day, m = game.matchId;
    set(dbRef(`rrp/${st.code}/${m}/${me()}/${d}`), { ev: my.log.ev, a: my.log.a, dest: my.log.dest || null, at: serverTimestamp() })
      .then(() => { if (game.day === d && game.phase === 'day') later('botdone', (my.bot.delay || 600) + Math.random() * 800, finishDay); })
      .catch(e => console.warn('rum bot', e));
    renderPanel(); renderBoard();
  }

  // ================================================================ render: top, board, trucks, labels
  function renderTop() {
    const d = day();
    const w = d ? d.w : 'clear';
    const W = WEATHER_TEXT[w] || WEATHER_TEXT.clear;
    const where = inMatch() ? DISTRICT_TEXT[myDist()].name : 'THE CITY';
    const sig = `${game.day}|${w}|${where}|${game.phase}`;
    if (els.top.dataset.sig !== sig) {
      els.top.dataset.sig = sig;
      els.top.replaceChildren(
        h('div.rr-top-l', h('div.rr-top-day', h('span', 'DAY'), h('b', String(game.day)), h('i', `/ ${game.settings.days}`)), h('div.rr-top-where', where)),
        h('button.rr-top-w', { type: 'button', title: W.effect, onclick: () => ann.announce(`${W.name}: ${W.effect}`, 'w') }, svgEl(WEATHER_ICONS[w] || WEATHER_ICONS.clear), h('span', W.name)),
        h('div.rr-top-t', timer.el));
    }
    if (game.phase === 'day' && game.phaseEndsAt) { timer.set(game.phaseEndsAt, game.settings.daySec * 1000); els.top.classList.add('has-timer'); }
    else { timer.stop(); els.top.classList.remove('has-timer'); }
  }
  function renderBoard() {
    const uids = Object.keys(game.participants || {});
    const rows = uids.map(u => ({ uid: u, nw: u === me() && my.S ? fortune(my.S) : nwOf(u) })).sort((a, b) => b.nw - a.nw);
    const pub = (st.live && st.live.pub) || {};
    const sig = JSON.stringify([rows, rows.map(r => [(st.players[r.uid] || {}).name, !!(pub[r.uid] && pub[r.uid].done), st.presence[r.uid] && st.presence[r.uid].online]), game.phase]);
    if (els.board.dataset.sig === sig) return;
    els.board.dataset.sig = sig;
    els.board.replaceChildren(...rows.map((r, i) => {
      const p = st.players[r.uid] || { name: '—', color: 'cyan', avatar: 'bolt' };
      const off = st.presence[r.uid] && st.presence[r.uid].online === false;
      const done = game.phase === 'day' && pub[r.uid] && pub[r.uid].done;
      const badge = pubOf(p) && pubOf(p).r != null ? rankBadge(pubOf(p).r, 12) : null;
      return h('div.rr-seat', { class: [i === 0 && r.nw > rows[1]?.nw ? 'is-lead' : '', r.uid === me() ? 'is-me' : '', off ? 'is-off' : '', done ? 'is-done' : ''].join(' '), style: { '--pc': colorHex(p.color) } },
        avatar(p.avatar, p.color, 22), h('div.rr-seat-t', h('span.rr-seat-n', p.name, badge), h('b.rr-seat-nw', { class: r.nw < 0 ? 'is-neg' : '' }, fmt$(r.nw))), done ? h('i.rr-seat-ok', '✓') : null);
    }));
  }
  function renderTrucks() {
    const d = day(); if (!d) return;
    const map = {};
    for (const uid of Object.keys(game.participants || {})) map[uid] = { dist: (d.at && d.at[uid]) || HOME, color: colorHex((st.players[uid] || {}).color || 'cyan') };
    const sig = JSON.stringify(map);
    if (els.labels.dataset.tsig === sig) return;
    els.labels.dataset.tsig = sig;
    city.setTrucks(map, { instant: game.phase !== 'dawn' });
    city.setMine(inMatch() ? me() : null);
    for (const l of els.labels.children) {
      const here = Object.entries(map).filter(([, t]) => t.dist === l.dataset.dist);
      l.querySelector('.rr-dlabel-dots').replaceChildren(...here.slice(0, 8).map(([uid, t]) => h('i', { style: { '--pc': t.color }, class: uid === me() ? 'is-me' : '' })));
      l.classList.toggle('is-here', inMatch() && myDist() === l.dataset.dist);
    }
  }

  // ================================================================ render: the panel
  function renderPanel() {
    if (!game) return;
    const ph = game.phase;
    if (!inMatch()) { setPanel(`spec|${ph}`, () => [h('div.rr-spec', h('b', 'WATCHING THE CITY'), h('span', 'You’ll be dealt in next game.'))]); return; }
    if (!my.S) { setPanel('loading', () => [h('div.rr-spec', h('span', 'OPENING THE BOOKS…'))]); return; }
    if (ph === 'final') { els.panel.replaceChildren(); els.panel.dataset.sig = 'final'; return; }
    const S = my.S;
    const wallet = h('div.rr-wallet',
      h('div.rr-w', h('span', 'CASH'), h('b.rr-cash', fmt$(S.cash))),
      h('div.rr-w', h('span', 'DEBT'), h('b', { class: S.debt > 0 ? 'is-neg' : 'is-ok' }, S.debt > 0 ? fmt$(S.debt) : 'PAID')),
      S.stash ? h('div.rr-w', h('span', 'STASH'), h('b', fmt$(S.stash))) : null,
      h('div.rr-w.rr-w-cargo', h('span', 'CARGO'), h('b', `${units(S)}/${S.cap}`), h('i.rr-cap', h('i', { style: { transform: `scaleX(${Math.min(1, units(S) / S.cap)})` } }))));
    if (ph !== 'day') {
      // dawn / night / intro: the wallet and a line
      const line = ph === 'dawn' ? `ARRIVING ${DISTRICT_TEXT[myDist()].at.toUpperCase()}` : ph === 'night' ? 'THE DAY IS DONE' : 'MR. VALE IS WAITING';
      setPanel(`${ph}|${game.day}|${fortune(S)}|${units(S)}`, () => [wallet, h('div.rr-panel-line', line)]);
      return;
    }
    root.classList.toggle('is-done', !!my.done);
    if (my.done) {
      const pub = (st.live && st.live.pub) || {};
      const uids = Object.keys(game.participants).filter(u => !(st.presence[u] && st.presence[u].online === false));
      const left = uids.filter(u => !(pub[u] && pub[u].done)).length;
      setPanel(`done|${game.day}|${left}|${fortune(S)}`, () => [wallet, h('div.rr-done-wait', h('b', 'DONE FOR THE DAY'), h('span', left ? `Waiting on ${left} ${left === 1 ? 'rumrunner' : 'rumrunners'}…` : 'Everyone’s in. Night falls.'), h('span.rr-done-dest', `TOMORROW: ${DISTRICT_TEXT[effDest() || myDist()].name}`))]);
      return;
    }
    const tabs = [['market', 'MARKET']];
    if (valeHere(S)) tabs.push(['vale', 'VALE']);
    if (stashHere(S)) tabs.push(['stash', 'STASH']);
    if (upgradesHere(S, S.dist).length) tabs.push(['garage', 'GARAGE']);
    if (game.day < game.settings.days) tabs.push(['travel', 'TRAVEL']);
    if (!tabs.some(t => t[0] === my.tab)) my.tab = 'market';
    const sig = JSON.stringify([game.day, my.tab, my.open, S, my.log && my.log.dest, my.tipped, tabs.map(t => t[0]), prices()]);
    if (els.panel.dataset.sig === sig) return;
    els.panel.dataset.sig = sig;
    const body = my.tab === 'market' ? renderMarket(S) : my.tab === 'vale' ? renderVale(S) : my.tab === 'stash' ? renderStash(S) : my.tab === 'garage' ? renderGarage(S) : renderTravel(S);
    const dest = effDest(), wanted = my.log && my.log.dest;
    const last = game.day >= game.settings.days;
    els.panel.replaceChildren(
      wallet,
      h('div.rr-tabs', ...tabs.map(([id, label]) => h('button.rr-tab', { type: 'button', class: id === my.tab ? 'is-on' : '', onclick: () => { my.tab = id; my.open = null; sfx.tap(); renderPanel(); } }, label))),
      h('div.rr-body', body),
      h('button.rr-done.btn.btn-primary', { type: 'button', onclick: finishDay }, h('b', 'DONE'), h('span', last ? 'CLOSE THE BOOKS' : dest ? `DRIVE TO ${DISTRICT_TEXT[dest].name}` : wanted && wanted !== myDist() ? `CAN’T AFFORD THE DRIVE — STAYING` : `STAY ${DISTRICT_TEXT[myDist()].at.toUpperCase()}`)));
    const bd = els.panel.querySelector('.rr-body');
    if (my.scroll && my.scrollTab === my.tab) bd.scrollTop = my.scroll;
    bd.addEventListener('scroll', () => { my.scroll = bd.scrollTop; my.scrollTab = my.tab; }, { passive: true });
  }
  function setPanel(sig, make) { if (els.panel.dataset.sig === sig) return; els.panel.dataset.sig = sig; els.panel.replaceChildren(...make().filter(Boolean)); }

  // ---- the market
  function renderMarket(S) {
    const d = day(), pr = prices();
    const prev = game.days[game.day - 1];
    const prevP = prev && prev.p && prev.p[S.dist];
    const last = game.day >= game.settings.days;
    const cards = GOOD_IDS.map(g => {
      const price = pr[g] || 0, have = S.cargo[g] || 0, cost = S.cost[g] || 0;
      const was = prevP && prevP[g];
      const trend = price && was ? (price - was) / was : null;
      const news = (d.news || []).find(x => x.dist === S.dist && x.good === g);
      const open = my.open && my.open.g === g ? my.open : null;
      const canBuy = price > 0 && !last && S.cash >= price && units(S) < S.cap;
      const canSell = price > 0 && have > 0;
      return h('div.rr-good', { class: [open ? 'is-open' : '', price ? '' : 'is-off', news ? `is-${news.k}` : ''].join(' '), 'data-g': g },
        h('div.rr-good-row',
          h('div.rr-good-i', svgEl(GOOD_ICONS[g])),
          h('div.rr-good-t', h('b', GOOD_TEXT[g].name), h('span', have ? `YOU HOLD ${have} · PAID ${fmt$(cost)}` : GOOD_TEXT[g].blurb)),
          h('div.rr-good-p', price ? [h('b', fmt$(price)), trend != null ? h('span', { class: trend > 0.02 ? 'is-up' : trend < -0.02 ? 'is-down' : '' }, `${trend > 0 ? '▲' : trend < 0 ? '▼' : '•'} ${Math.abs(Math.round(trend * 100))}%`) : news ? h('span', { class: news.k === 'spike' ? 'is-up' : 'is-down' }, news.k === 'spike' ? '▲ SOARING' : '▼ CRASH') : h('span', '')] : h('span.rr-good-none', 'NOT ON SALE')),
          h('div.rr-good-b',
            h('button.rr-mini', { type: 'button', disabled: !canBuy, onclick: () => openTrade(g, 1) }, 'BUY'),
            h('button.rr-mini.is-sell', { type: 'button', disabled: !canSell, onclick: () => openTrade(g, -1) }, 'SELL'))),
        open ? renderTrade(S, g, open) : null);
    });
    const spots = Object.keys(game.participants).filter(u => u !== me() && d.at && d.at[u] === S.dist).map(u => (st.players[u] || {}).name).filter(Boolean);
    return h('div.rr-market',
      h('div.rr-market-h', h('span', DISTRICT_TEXT[S.dist].tagline), spots.length ? h('span.rr-market-rivals', `ALSO HERE: ${spots.join(', ')}`) : h('span.rr-market-rivals', 'YOU HAVE THE MARKET TO YOURSELF')),
      last ? h('div.rr-warn', 'LAST DAY — anything you don’t sell is worth nothing.') : game.day === game.settings.days - 1 ? h('div.rr-warn', 'Tomorrow is the last day: buy only what you can sell tomorrow.') : null,
      ...cards);
  }
  function openTrade(g, dir) {
    const S = my.S, price = prices()[g] || 0;
    const max = dir > 0 ? Math.min(S.cap - units(S), Math.floor(S.cash / price)) : (S.cargo[g] || 0);
    if (max <= 0) return;
    my.open = { g, dir, n: max, max };
    sfx.tap(); renderPanel();
  }
  function renderTrade(S, g, o) {
    const price = prices()[g] || 0;
    const total = price * o.n;
    const setN = n => { o.n = Math.max(1, Math.min(o.max, Math.round(n))); const r = els.panel.querySelector(`.rr-good[data-g="${g}"]`); if (!r) return; r.querySelector('.rr-trade-n').textContent = String(o.n); r.querySelector('.rr-trade-sum').textContent = fmt$(price * o.n); r.querySelector('input').value = String(o.n); };
    return h('div.rr-trade', { class: o.dir > 0 ? 'is-buy' : 'is-sell' },
      h('div.rr-trade-top', h('span', o.dir > 0 ? 'BUY' : 'SELL'), h('b.rr-trade-n', String(o.n)), h('span', `× ${fmt$(price)} =`), h('b.rr-trade-sum', fmt$(total))),
      h('input.rr-slider', { type: 'range', min: 1, max: o.max, step: 1, value: o.n, 'aria-label': 'quantity', oninput: e => setN(Number(e.target.value)) }),
      h('div.rr-trade-q',
        ...[0.25, 0.5].map(f => h('button.rr-mini', { type: 'button', onclick: () => setN(o.max * f) }, f === 0.25 ? '¼' : '½')),
        h('button.rr-mini', { type: 'button', onclick: () => setN(o.max) }, 'MAX'),
        h('button.rr-mini.is-ghost', { type: 'button', onclick: () => { my.open = null; renderPanel(); } }, 'CANCEL'),
        h('button.rr-mini.is-go', { type: 'button', onclick: () => { const n = o.n; my.open = null; act(['t', g, o.dir > 0 ? n : -n]); } }, o.dir > 0 ? 'BUY' : 'SELL')));
  }
  // ---- Mr. Vale's office
  function renderVale(S) {
    const kind = S.debt <= 0 ? 'cleared' : game.day >= game.settings.days ? 'last' : 'office';
    const lines = valeLines(kind, { debt: S.debt }, rngFor('office', my.typed === kind ? 'x' : 'y'));
    const box = h('div.rr-vale', h('div.rr-vale-sil', svgEl(VALE_SVG)), h('div.rr-vale-lines'));
    const pay = Math.min(S.cash, S.debt);
    const o = my.open && my.open.g === 'vale' ? my.open : (my.open = { g: 'vale', n: pay, max: pay });
    o.max = pay; o.n = Math.min(o.n || pay, pay);
    const el = h('div.rr-office',
      box,
      h('div.rr-debt', h('span', 'YOU OWE'), h('b', S.debt > 0 ? fmt$(S.debt) : 'NOTHING'), S.debt > 0 ? h('i', `+${fmtPct(interestRate(game.settings.days))}% every night`) : null),
      S.debt > 0 && pay > 0 ? h('div.rr-trade.is-pay',
        h('div.rr-trade-top', h('span', 'PAY'), h('b.rr-trade-n', fmt$(o.n))),
        h('input.rr-slider', { type: 'range', min: 1, max: o.max, step: 1, value: o.n, 'aria-label': 'payment', oninput: e => { o.n = Number(e.target.value); el.querySelector('.rr-trade-n').textContent = fmt$(o.n); } }),
        h('div.rr-trade-q',
          h('button.rr-mini', { type: 'button', onclick: () => { o.n = Math.round(o.max / 2); el.querySelector('.rr-trade-n').textContent = fmt$(o.n); el.querySelector('input').value = o.n; } }, '½'),
          h('button.rr-mini', { type: 'button', onclick: () => { o.n = o.max; el.querySelector('.rr-trade-n').textContent = fmt$(o.n); el.querySelector('input').value = o.n; } }, S.cash >= S.debt ? 'ALL OF IT' : 'ALL I HAVE'),
          h('button.rr-mini.is-go', { type: 'button', onclick: () => { const n = o.n; my.open = null; act(['p', n]); } }, 'PAY VALE')))
        : S.debt > 0 ? h('div.rr-panel-line', 'No cash to pay him with. Sell something first.') : null);
    if (my.typed !== kind) { my.typed = kind; typeLines(box.querySelector('.rr-vale-lines'), lines, 22); }
    else lines.forEach(l => box.querySelector('.rr-vale-lines').append(h('p', l)));
    return el;
  }
  // ---- the stash
  function renderStash(S) {
    const o = my.open && my.open.g === 'stash' ? my.open : (my.open = { g: 'stash', dir: 1, n: S.cash, max: S.cash });
    o.max = o.dir > 0 ? S.cash : S.stash; o.n = Math.max(0, Math.min(o.n, o.max));
    const el = h('div.rr-stashp',
      h('div.rr-debt', h('span', 'IN THE STASH'), h('b', fmt$(S.stash)), h('i', 'Safe from fines and Vale’s men. Counts in your fortune.')),
      h('div.rr-tabs.is-sub', h('button.rr-tab', { type: 'button', class: o.dir > 0 ? 'is-on' : '', onclick: () => { o.dir = 1; o.n = S.cash; renderPanel(); } }, 'DEPOSIT'), h('button.rr-tab', { type: 'button', class: o.dir < 0 ? 'is-on' : '', onclick: () => { o.dir = -1; o.n = S.stash; renderPanel(); } }, 'WITHDRAW')),
      o.max > 0 ? h('div.rr-trade',
        h('div.rr-trade-top', h('span', o.dir > 0 ? 'DEPOSIT' : 'WITHDRAW'), h('b.rr-trade-n', fmt$(o.n))),
        h('input.rr-slider', { type: 'range', min: 1, max: o.max, step: 1, value: o.n, 'aria-label': 'amount', oninput: e => { o.n = Number(e.target.value); el.querySelector('.rr-trade-n').textContent = fmt$(o.n); } }),
        h('div.rr-trade-q', h('button.rr-mini', { type: 'button', onclick: () => { o.n = o.max; el.querySelector('.rr-trade-n').textContent = fmt$(o.n); el.querySelector('input').value = o.n; } }, 'ALL'),
          h('button.rr-mini.is-go', { type: 'button', onclick: () => { const n = o.n; my.open = null; act(['s', o.dir > 0 ? n : -n]); } }, o.dir > 0 ? 'DEPOSIT' : 'WITHDRAW')))
        : h('div.rr-panel-line', o.dir > 0 ? 'Nothing to deposit.' : 'The stash is empty.'));
    return el;
  }
  // ---- the garage
  function renderGarage(S) {
    return h('div.rr-garage', ...upgradesHere(S, S.dist).map(id => {
      const price = upgradePrice(id);
      return h('div.rr-upg', h('div.rr-upg-t', h('b', UPGRADES[id].name), h('span', (UPGRADE_TEXT[id] || {}).blurb || '')), h('div.rr-upg-b', h('b', fmt$(price)), h('button.rr-mini.is-go', { type: 'button', disabled: S.cash < price, onclick: () => act(['u', id]) }, 'BUY')));
    }), h('div.rr-owned', Object.keys(S.upg).length ? `YOURS: ${Object.keys(S.upg).map(u => UPGRADES[u].name).join(' · ')}` : 'A plain truck, for now.'));
  }
  // ---- travel + tip-offs
  function renderTravel(S) {
    const d = day();
    const dest = (my.log && my.log.dest) || null;
    const last = game.day >= game.settings.days;
    const list = last ? null : h('div.rr-dests', ...DIST_IDS.map(id => {
      const here = id === S.dist;
      const fee = DIST[id].fee && !here ? DIST[id].fee : 0;
      const who = Object.keys(game.participants).filter(u => d.at && d.at[u] === id).length;
      const cant = fee && S.cash < fee;
      return h('button.rr-dest', { type: 'button', class: [here ? 'is-here' : '', dest === id || (!dest && here) ? 'is-on' : '', cant ? 'is-cant' : ''].join(' '), disabled: cant, onclick: () => setDest(id) },
        svgEl(DISTRICT_ICONS[id]), h('div.rr-dest-t', h('b', DISTRICT_TEXT[id].name), h('span', DISTRICT_TEXT[id].tagline)), h('div.rr-dest-m', here ? h('span', 'YOU ARE HERE') : fee ? h('span', `FEE ${fmt$(fee)}`) : null, who ? h('span', `${who} HERE`) : null));
    }));
    const rivals = Object.keys(game.participants).filter(u => u !== me());
    const o = my.open && my.open.g === 'tip' ? my.open : (my.open = { g: 'tip', to: rivals[0] || null });
    const costOf = u => tipCost((game.nwh && game.nwh[game.day - 1] && game.nwh[game.day - 1][u]) ?? NW0);
    const tip = last || !rivals.length ? null : h('div.rr-tip',
      h('div.rr-tip-h', h('b', 'TIP OFF THE FEDS'), h('span', 'A rival’s raid odds jump tomorrow. They’ll hear someone talked — your name only comes out in the morning paper.')),
      my.tipped ? h('div.rr-panel-line', 'You’ve made your call today.') : h('div.rr-tip-row',
        h('div.rr-tip-who', ...rivals.map(u => { const p = st.players[u] || {}; return h('button.rr-chip', { type: 'button', class: o.to === u ? 'is-on' : '', style: { '--pc': colorHex(p.color || 'cyan') }, onclick: () => { o.to = u; renderPanel(); } }, p.name || '—'); })),
        h('button.rr-mini.is-go', { type: 'button', disabled: !o.to || S.cash < costOf(o.to), onclick: () => act(['x', o.to]) }, `TIP OFF · ${fmt$(o.to ? costOf(o.to) : 0)}`)));
    return h('div.rr-travel', list, tip, last ? h('div.rr-panel-line', 'The last day. Sell up and close the books.') : null);
  }

  // ================================================================ the newspaper and the podium
  async function showPaper() {
    if (my.paper) return;
    my.paper = 'drawing';
    root.classList.add('is-paper');
    sfx.press(true);
    const names = Object.fromEntries(Object.keys(game.participants).map(u => [u, ((st.players[u] || {}).name || 'A RUMRUNNER').toUpperCase().slice(0, 12)]));
    const story = matchStory(game);
    const paper = headlines(story, names, game, rngFrom(`${game.matchId}:paper`));
    els.paper.replaceChildren(h('div.rr-paper-in', h('div.rr-paper-wait', 'HOLD THE FRONT PAGE…')));
    await loadPaperFonts();
    if (destroyed || !game || game.phase !== 'final') return;
    const canvas = drawNewspaper(paper, { names, seed: game.matchId, days: game.settings.days, dpr: Math.min(2, window.devicePixelRatio || 1) });
    canvas.className = 'rr-paper-c';
    my.paper = { canvas, paper, story };
    sfx.press(false); sfx.rustle();
    duckMusic(1, 0.8);
    els.paper.replaceChildren(h('div.rr-paper-in',
      h('div.rr-paper-scroll', canvas),
      h('div.rr-paper-b',
        h('button.btn.btn-ghost.rr-zoom', { type: 'button', onclick: e => { const w = e.currentTarget.closest('.rr-paper-in'); w.classList.toggle('is-zoom'); e.currentTarget.textContent = w.classList.contains('is-zoom') ? 'FIT' : 'ZOOM'; } }, 'ZOOM'),
        h('button.btn.btn-ghost', { type: 'button', onclick: () => savePage(canvas, `neon-gazette-day${game.settings.days}.png`) }, 'SAVE'),
        h('button.btn.btn-primary', { type: 'button', onclick: showPodium }, 'THE STANDINGS'))));
  }
  function showPodium() {
    if (my.podium) return;
    my.podium = true;
    root.classList.remove('is-paper');
    const rows = standings(game).map(r => ({ uid: r.uid, rank: r.rank, score: r.nw, label: fmt$(r.nw) }));
    const story = (my.paper && my.paper.story) || matchStory(game);
    const report = reportPanel({ prefix: 'rr', title: 'THE LEDGER', head: ['PLACE', 'FORTUNE', 'BEST TRADE', 'RAIDS', 'PAID VALE'],
      rows: standings(game).map(r => { const s = story[r.uid] || {}; const p = st.players[r.uid] || {}; return { uid: r.uid, name: p.name || '—', color: p.color || 'cyan', me: r.uid === me(), cells: [r.rank, fmt$(r.nw), s.best ? `+${fmt$(s.best.profit)}` : '—', `${s.caught || 0}/${s.raids || 0}`, fmt$(s.paid || 0)] }; }), calls: null, player: null, showCalls: false });
    finalView = createFinal({ rows, players: st.players, me: me(), presence: st.presence, winnerLine: name => `${name} owns the town`, scoreLabel: 'FORTUNE', kicker: 'THE MORNING AFTER', extra: report });
    els.final.replaceChildren(finalView.el);
    root.classList.add('is-podium');
  }

  // ================================================================ frame
  let lastTick = -1;
  const lab = {};
  function frame(now) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (!city || !game) return;
    if (my.paper && my.paper.canvas) return;   // the paper and the podium cover the city: let the phone rest
    const work = city.frame(now);
    tiers.sample(now, work); tiers.tick(now);
    // district labels follow the city
    for (const l of els.labels.children) {
      const p = city.project(l.dataset.dist, lab);
      const vis = p.z < 1 && p.x > -40 && p.x < rootW + 40;
      l.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -100%)`;
      l.style.opacity = vis ? '' : '0';
    }
    // the last seconds of a day you haven't finished
    if (game.phase === 'day' && inMatch() && !my.done && game.phaseEndsAt) {
      const s = Math.ceil((game.phaseEndsAt - serverNow()) / 1000);
      if (s !== lastTick) { lastTick = s; if (s <= 5 && s > 0) sfx.tick(); }
    }
  }

  // ================================================================ test hook
  function setupHook() {
    hook = {
      state: () => ({ phase: game && game.phase, day: game && game.day, dist: inMatch() ? myDist() : null, S: my.S && snapshot(my.S), events: my.events.map(e => e.t), evIdx: my.evIdx, showing: !!my.showing, done: my.done, dest: my.log && my.log.dest, tab: my.tab, loaded: my.loaded, paper: !!(my.paper && my.paper.canvas), podium: my.podium }),
      prices: () => prices(),
      act: a => act(a),
      choose: c => choose(c),
      choices: () => (my.showing ? eventChoices(my.showing.ev, my.S, prices()) : []),
      dest: id => setDest(id),
      done: () => finishDay(),
      tab: t => { my.tab = t; renderPanel(); },
      bot: (o = {}) => { my.bot = { strategy: o.strategy || 'trader', seed: o.seed || '', delay: o.delay || 600 }; if (game && game.phase === 'day') runBot(); },
      stopBot: () => { my.bot = null; },
      tier: () => tiers.get(), setTier: t => tiers.set(t), fps: () => tiers.fps(), work: () => tiers.work(), stats: () => city.stats(),
      weather: () => city.weather(), announcements: () => ann.log,
      paper: () => (my.paper && my.paper.paper) || null, podium: () => showPodium(), save: () => my.paper && my.paper.canvas && savePage(my.paper.canvas),
      logs: () => my.logs,
    };
    installTestHook('__rum', hook);
  }

  return { mount, update, unmount };
}
