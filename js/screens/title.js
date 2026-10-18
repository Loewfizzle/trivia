// NEON SPEAKEASY — the front door.
//
// A night city (district/scene.js) behind a neon sign and a short menu. The opening sequence:
//   1. TAP TO ENTER (first visit on this device): the district in near-darkness, rain, a few dim lights.
//      The tap unlocks audio (iPhone needs a gesture) — the menu music fades in from it.
//   2. POWER-ON: windows light up in a sweep from the street up, billboards boot, the haze takes the colour.
//   3. The sign powers on like real neon: a flicker per letter with a hum and crackle, then a steady glow,
//      its light shimmering on the wet street.
//   4. The menu eases in.  The full sequence (≈ 3.4 s) plays on every visit — the TAP TO ENTER gate only on a
//      device's first visit; stepping back from the name / profile screen gets a quick ≈ 1.2 s re-light. Any tap skips. Reduced effects / prefers-reduced-motion: simple fades.
// Menu: HOST GAME (the one glowing element), JOIN with four code boxes (auto-advance, paste, auto-join on the
// 4th letter, ?room= pre-fills), REJOIN when a saved room couldn't be reached, "Welcome back" with the saved
// profile, and a drifting showcase of the games (tap one for a preview sheet).
// Test hook: window.__district.
import { h, reducedMotion } from '../ui/dom.js';
import { step } from '../core/ranks.js';
import { avatar } from '../ui/components.js';
import { gameArt, gameArtSvg } from '../ui/game-art.js';
import { logoSvg, TAGLINE } from '../ui/logo.js';
import { openHelp } from '../ui/help.js';
import { APP_NAME, GAMES, MIN_PLAYERS, MAX_PLAYERS, CODE_ALPHABET, colorHex } from '../config.js';
import { setState } from '../store.js';
import { slot, loadProfile, useEmulator, loadMe } from '../identity.js';
import { rankBadge, emblem, RANK_COLORS } from '../ui/emblems.js';
import { primaryBoard, fmtValue } from '../core/boards.js';
import { createRoom, joinRoom } from '../room.js';
import { firebaseReady } from '../firebase.js';
import { GAME_MODULES } from '../games/registry.js';
import { settings } from '../audio/settings.js';
import { sfx } from '../audio/sfx.js';
import { neonPowerOn, neonTick, startRain, cityPowerOn } from '../audio/ambience.js';
import { createDistrict } from './district/scene.js';
import { captureBackdrop } from './district/backdrop.js';

const ACC = { rum: '#f0c75e', stakes: '#f2c869', overclock: '#ffb627', gridlock: '#7fb2ff', slip: '#ffc46b', prism: '#d6f0ff', golf: '#2ff5d2', agent: '#e6e9ef', pulse: '#a374ff', cipher: '#3dff8b', signal: '#ff4466', bluff: '#efe6d2' };
const SEEN = 'nd:entered';      // localStorage: this device has been through the door before
const BACK = 'nd:back';          // sessionStorage: just stepped back from the name / profile screen (a quick re-light)
const store = (s, k, v) => { try { if (v === undefined) return s.getItem(k); s.setItem(k, v); } catch { /* private mode */ } return null; };

// the sequences (seconds from the start). wave = window lights climbing, lit = the city's glow, bill = billboards,
// logo = when the sign starts, steady = when it holds, menu = when the menu starts easing in
const FULL = { wave: [0.04, 1.6], lit: [0.04, 1.8], bill: [1.0, 1.8], logo: 1.4, steady: 2.2, menu: 2.25, end: 3.4 };
const SHORT = { wave: [0, 0.6], lit: [0, 0.7], bill: [0.25, 0.65], logo: 0.15, steady: 0.55, menu: 0.45, end: 1.2 };
const INSTANT = { wave: [0, 0.01], lit: [0, 0.01], bill: [0, 0.01], logo: 0, steady: 0, menu: 0, end: 0.4 };
const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a || 1e-6))); return t * t * (3 - 2 * t); };
// the light wave answers the tap at once and slows as it reaches the rooftops
const easeOut = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a || 1e-6))); return 1 - Math.pow(1 - t, 2.4); };

// Halloween: fine cobwebs in the sign's two top corners, catching the neon
const WEBS = `<svg viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="rgba(235,225,255,0.55)" stroke-width="0.7" stroke-linecap="round">
<g transform="translate(8 8)"><path d="M0 0 L70 6 M0 0 L52 40 M0 0 L22 64 M0 0 L4 74"/><path d="M14 1 Q14 9 10 12 Q6 15 3 15"/><path d="M28 2 Q27 16 21 24 Q13 30 6 30"/><path d="M44 4 Q42 24 33 36 Q22 46 10 47"/><path d="M60 5 Q56 30 44 46 Q30 60 16 62"/></g>
<g transform="translate(392 8) scale(-1 1)"><path d="M0 0 L58 4 M0 0 L44 34 M0 0 L16 56"/><path d="M14 1 Q13 10 8 14 Q4 16 2 16"/><path d="M30 2 Q28 18 20 26 Q12 32 6 32"/><path d="M46 3 Q42 26 32 38 Q20 48 9 48"/><path d="M2 46 L0 0"/></g>
<path d="M66 9 L66 34" stroke-width="0.6"/><circle cx="66" cy="36" r="2.2" fill="rgba(30,10,40,0.9)" stroke="rgba(255,150,60,0.8)"/></g></svg>`;
// Christmas: a Santa hat tipped on the first N, fur trim catching the pink light
const HAT = `<svg viewBox="0 0 120 100" aria-hidden="true"><defs><linearGradient id="nhr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a6a"/><stop offset="0.6" stop-color="#c8102e"/><stop offset="1" stop-color="#7a0716"/></linearGradient><radialGradient id="nhw" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9dde8"/></radialGradient></defs>
<path d="M18 74 C30 40 52 14 86 8 C96 6 104 14 98 24 C92 34 84 30 80 38 C74 52 76 64 80 74 Z" fill="url(#nhr)"/>
<path d="M30 40 C46 22 64 14 84 11" stroke="rgba(255,255,255,0.25)" stroke-width="2" fill="none"/>
<circle cx="99" cy="22" r="10" fill="url(#nhw)"/><rect x="12" y="68" width="76" height="16" rx="8" fill="url(#nhw)"/></svg>`;

export function createTitle() {
  const els = {};
  let scene = null;
  let stopRain = null;
  let tl = null;                 // { plan, t0, raf, kind }
  let flickerTimer = 0;
  let destroyed = false;
  let busy = false;
  let st = null;
  const reduced = () => !!settings.reducedFx || reducedMotion();

  function mount(el, state) {
    st = state;
    el.classList.add('title-screen', 'nd');
    document.body.classList.add('nd-on');
    // the city: fixed behind everything, full viewport (the screen column is narrower on desktop)
    els.sceneWrap = h('div.nd-scene', { 'aria-hidden': 'true' }, els.canvas = h('canvas'));
    document.body.prepend(els.sceneWrap);
    scene = createDistrict(els.canvas, { games: GAMES, tier: (window.devicePixelRatio || 1) > 2.5 && (navigator.hardwareConcurrency || 8) <= 4 ? 1 : 2 });
    scene.set({ motion: reduced() ? 0 : 1 });

    // the sign is there from the start, dark (glass tubes only, like the boot screen); the power-on lights it
    els.sign = h('div.nd-sign', { class: 'is-glass' },
      h('div.nd-logo-wrap', { html: logoSvg({ id: 'ndt', title: APP_NAME }) }),
      h('div.nd-word', 'SPEAKEASY'),
      h('div.nd-tag', TAGLINE));
    els.show = buildShowcase();
    els.actions = buildActions();
    if (!scene.signOn()) els.sign.classList.add('is-day');
    els.gate = h('button.nd-gate', { type: 'button', 'aria-label': 'Tap to enter', onclick: enter },
      h('span.nd-gate-txt', 'TAP TO ENTER'),
      h('span.nd-gate-sub', 'BEST WITH SOUND ON'));
    el.append(
      h('div.nd-corner', slot !== '1' ? h('span.tag.tag-you', `TEST SLOT ${slot}`) : null),
      els.sign,
      h('div.nd-city'),
      els.show,
      els.actions,
      els.gate);
    el.addEventListener('pointerdown', onAnyTap, { capture: true });
    setupHook();

    // local test runs (?emu) skip the intro unless they ask for it (&intro=1) — every other E2E just needs the menu
    const testSkip = useEmulator && !/[?&]intro(?![a-z])/.test(location.search);
    const first = !testSkip && !store(localStorage, SEEN);
    // every visit gets the full power-on (the tap screen only the first time: it's there to unlock sound);
    // stepping back from the name / profile screen a moment later gets the quick version
    const back = store(sessionStorage, BACK) === '1';
    try { sessionStorage.removeItem(BACK); } catch { /* fine */ }
    if (first) {
      el.classList.add('is-gated');
      requestAnimationFrame(() => els.gate.classList.add('is-in'));
    } else {
      els.gate.remove();
      if (testSkip) run(INSTANT, 'instant');
      else if (back) run(SHORT, 'short');
      else { if (!reduced()) cityPowerOn(); run(FULL, 'full'); }
    }
    update(state);
  }

  // ------------------------------------------------------------------ the sequence
  function enter() {
    if (tl) return;
    store(localStorage, SEEN, '1');
    els.gate.classList.add('is-out');
    setTimeout(() => els.gate.remove(), 600);
    els.gate.closest('.nd').classList.remove('is-gated');
    if (!reduced()) cityPowerOn();
    run(FULL, 'full');
  }

  function onAnyTap(e) {
    // a tap during the sequence skips to the end (but never swallows a tap on the menu itself)
    if (!tl || tl.done || e.target.closest('.nd-gate')) return;
    if (performance.now() - tl.t0 < 250) return;
    skip();
  }

  function run(plan, kind) {
    const r = reduced();
    tl = { plan: r ? { ...INSTANT, end: 0.7 } : plan, kind: r ? 'reduced' : kind, t0: performance.now(), done: false, marks: {} };
    const root = els.sign.closest('.nd');
    root.classList.add(`seq-${tl.kind}`);
    if (!stopRain) stopRain = startRain();
    tick();
  }

  function tick() {
    if (destroyed || !tl) return;
    const p = tl.plan;
    const e = (performance.now() - tl.t0) / 1000;
    scene.set({
      wave: tl.kind === 'reduced' ? 1 : easeOut(p.wave[0], p.wave[1], e) * (e >= p.wave[1] ? 1 : 0.999),
      lit: tl.kind === 'reduced' ? smooth(0, 0.7, e) : easeOut(p.lit[0], p.lit[1], e) * (e >= p.lit[1] ? 1 : 0.999),
      bill: tl.kind === 'reduced' ? smooth(0, 0.7, e) : smooth(p.bill[0], p.bill[1], e),
      logo: logoLevel(e),
      logoRect: logoRect(),
    });
    if (e >= p.wave[1]) scene.set({ wave: 1 });
    if (!tl.marks.logo && e >= p.logo) { tl.marks.logo = true; signOn(); }
    if (!tl.marks.menu && e >= p.menu) { tl.marks.menu = true; els.sign.closest('.nd').classList.add('is-menu'); }
    if (e >= p.end) { finish(); return; }
    tl.raf = requestAnimationFrame(tick);
  }

  function logoLevel(e) {
    if (!tl.marks.logo) return 0;
    return els.sign.classList.contains('is-steady') ? 1 : 0.45;
  }

  function logoRect() {
    const svg = els.sign.querySelector('svg');
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return { x: r.left + r.width * 0.07, y: r.top + r.height * 0.18, w: r.width * 0.86, h: r.height * 0.64 };
  }

  // the sign: glass -> per-letter flicker -> steady glow (crackles + hum on the SFX bus)
  function signOn() {
    const s = els.sign;
    s.classList.remove('is-off');
    s.classList.add('is-glass');
    const letters = [...s.querySelectorAll('.ndl')];
    // daylight: the sign rests (glass and brackets, unlit) until dusk
    if (scene && !scene.signOn()) { s.classList.add('is-day'); return; }
    s.classList.remove('is-day');
    const kind = tl.kind;
    if (kind === 'instant' || kind === 'reduced') {
      letters.forEach(l => l.classList.add('on'));
      s.classList.add('is-steady', 'is-warm');
      return;
    }
    const full = kind === 'full';
    // on/off toggles per letter (ms after the sign starts); the O stutters a little longer
    const base = full ? [0, 70, 150, 220] : [0, 40, 80, 120];
    const pattern = full ? [0, 45, 110, 150, 250, 290, 400] : [0, 40, 90];
    const crackles = [];
    letters.forEach((l, i) => {
      const pat = i === 2 && full ? [...pattern.slice(0, -1), 470, 520, 600] : pattern;
      pat.forEach((ms, k) => {
        const at = base[i] + ms;
        setTimeout(() => { if (!destroyed) l.classList.toggle('on', k % 2 === 0); }, at);
        if (k % 2 === 0 && (k < 3 || i === 2)) crackles.push(at / 1000);
      });
    });
    neonPowerOn({ crackles: crackles.slice(0, full ? 7 : 3), dur: full ? 2.4 : 1.4 });
    const steadyIn = ((tl.plan.steady - tl.plan.logo) * 1000);
    setTimeout(() => { if (!destroyed) { letters.forEach(l => l.classList.add('on')); s.classList.add('is-steady'); } }, steadyIn);
    setTimeout(() => { if (!destroyed) s.classList.add('is-warm'); }, steadyIn + 60);
  }

  function skip() {
    if (!tl || tl.done) return;
    const root = els.sign.closest('.nd');
    root.classList.add('is-skip');
    if (!tl.marks.logo) { tl.marks.logo = true; tl.kind = 'instant'; signOn(); }
    else { els.sign.querySelectorAll('.ndl').forEach(l => l.classList.add('on')); els.sign.classList.add('is-steady', 'is-warm'); }
    root.classList.add('is-menu');
    finish();
  }

  function finish() {
    if (!tl || tl.done) return;
    tl.done = true;
    tl.doneAt = (performance.now() - tl.t0) / 1000;
    cancelAnimationFrame(tl.raf);
    scene.set({ wave: 1, lit: 1, bill: 1, logo: 1 });
    trackLogo();
    scheduleFlicker();
    watchSky();
  }

  // LIVING CITY: the sign follows the hour (off at dawn like closing time, back on at dusk tube by tube) and wears the
  // holiday (cobwebs, a Santa hat, the New Year countdown, rose / green tubes)
  function watchSky() {
    if (destroyed || !scene) return;
    const want = scene.signOn();
    const lit = els.sign.classList.contains('is-steady');
    if (want && !lit) { tl.kind = 'full'; signOn(); scene.set({ logo: 1 }); }
    else if (!want && lit) signOff();
    dressSign(scene.look());
    els.skyTimer = setTimeout(watchSky, 1000);
  }
  function signOff() {
    const s = els.sign;
    const letters = [...s.querySelectorAll('.ndl')];
    s.classList.remove('is-warm');
    letters.forEach((l, i) => {
      const at = 300 * i + Math.random() * 120;
      [0, 70, 120, 260].forEach((ms, k) => setTimeout(() => { if (!destroyed) l.classList.toggle('on', k % 2 === 1 && k < 3); }, at + ms));
    });
    setTimeout(() => { if (!destroyed) { s.classList.remove('is-steady'); s.classList.add('is-day'); letters.forEach(l => l.classList.remove('on')); } }, 300 * letters.length + 400);
    neonTick();
  }
  let dressKey = '';
  function dressSign(L) {
    const hol = L && L.holiday;
    const n = L && L.nye;
    const key = `${hol ? hol.id + (hol.full ? 'F' : '') : ''}|${n ? (n.countdown != null ? 'c' + n.countdown : 'f') : ''}`;
    if (key === dressKey) return;
    dressKey = key;
    const s = els.sign;
    const full = hol && hol.full ? hol.id : null;
    s.classList.toggle('is-rose', full === 'valentine');
    s.classList.toggle('is-shamrock', full === 'stpatrick');
    s.classList.toggle('is-candle', full === 'thanksgiving');
    s.querySelectorAll('.nd-dress').forEach(e => e.remove());
    const wrap = s.querySelector('.nd-logo-wrap');
    if (full === 'halloween') wrap.append(h('div.nd-dress.nd-webs', { 'aria-hidden': 'true', html: WEBS }));
    if (full === 'christmas') wrap.append(h('div.nd-dress.nd-hat', { 'aria-hidden': 'true', html: HAT }));
    const tag = s.querySelector('.nd-tag');
    if (n && n.countdown != null) { const m = Math.floor(n.countdown / 60), sec = n.countdown % 60; tag.textContent = `${m}:${String(sec).padStart(2, '0')} TO MIDNIGHT`; tag.classList.add('nd-count'); }
    else if (n && n.finale != null) { tag.textContent = 'HAPPY NEW YEAR'; tag.classList.add('nd-count'); }
    else { tag.textContent = TAGLINE; tag.classList.remove('nd-count'); }
  }

  // keep the sign's light in the scene in sync with layout (resizes, the keyboard)
  function trackLogo() {
    if (destroyed) return;
    scene.set({ logoRect: logoRect() });
    els.logoTimer = setTimeout(trackLogo, 500);
  }

  // every ~20–40 s one letter gives a tiny, realistic flicker
  function scheduleFlicker() {
    if (reduced()) return;
    flickerTimer = setTimeout(() => {
      if (destroyed) return;
      const letters = [...els.sign.querySelectorAll('.ndl')];
      const l = letters[Math.floor(Math.random() * letters.length)];
      const seq = [0, 60, 95, 130, 190];
      seq.forEach((ms, k) => setTimeout(() => { if (!destroyed) l.classList.toggle('on', k % 2 === 1 || k === seq.length - 1); }, ms));
      neonTick();
      scene.set({ logo: 0.8 }); setTimeout(() => scene && scene.set({ logo: 1 }), 200);
      scheduleFlicker();
    }, 20000 + Math.random() * 20000);
  }

  // ------------------------------------------------------------------ showcase
  function buildShowcase() {
    const card = (g, dup) => h('button.nd-card', {
      type: 'button', 'aria-label': `${g.name} — preview`, tabindex: dup ? '-1' : null, 'aria-hidden': dup ? 'true' : null,
      dataset: { theme: g.theme, id: g.id }, style: { '--acc': ACC[g.id] || '#d6f0ff' }, onclick: () => preview(g),
    }, gameArt(g.id) || h('div.gc-glyph'), h('span.nd-card-name', g.name));
    const games = GAMES.filter(g => g.playable);
    return h('section.nd-show', { 'aria-label': 'The games' },
      h('div.nd-track', ...games.map(g => card(g, false)), ...games.map(g => card(g, true))));
  }

  function meta(g) {
    const mod = GAME_MODULES[g.id] || {};
    const min = Math.max(MIN_PLAYERS, mod.MIN_PLAYERS || 0);
    let mins = null;
    try { mins = mod.estimateMinutes ? mod.estimateMinutes(mod.DEFAULT_SETTINGS || {}) : null; } catch { mins = null; }
    return { players: `${min}–${MAX_PLAYERS} PLAYERS`, mins: mins ? `≈ ${Math.round(mins)} MIN` : null };
  }

  function preview(g) {
    sfx('select');
    const m = meta(g);
    let sheet;
    const close = () => { sheet.classList.add('out'); setTimeout(() => sheet.remove(), 260); };
    const art = gameArtSvg(g.id);
    sheet = h('div.modal', { onclick: e => { if (e.target === sheet) close(); } },
      h('div.sheet.nd-preview', { role: 'dialog', 'aria-label': g.name, dataset: { theme: g.theme }, style: { '--acc': ACC[g.id] || '#d6f0ff' } },
        h('div.sheet-grip'),
        h('div.nd-pv-art', art),
        h('div.nd-pv-body',
          h('div.gc-tag', g.tag),
          h('h2.nd-pv-name', g.name),
          h('p.nd-pv-blurb', g.blurb),
          h('div.nd-pv-meta', h('span', m.players), m.mins ? h('span', m.mins) : null, h('span', 'ONE PHONE EACH')),
          topThree(g, () => close())),
        h('div.nd-pv-actions',
          h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => { close(); openHelp(g.id); } }, h('span', 'HOW TO PLAY')),
          h('button.btn.btn-text.btn-block', { type: 'button', onclick: close }, 'CLOSE'))));
    document.body.append(sheet);
  }

  // the game's top three on THE BOARD (its first record, else its wins) and your own rank there
  function topThree(g, close) {
    const def = primaryBoard(g.id, g.id === 'pulse' ? [{ id: 'pulse1', title: 'Track 01' }] : []);
    const list = h('ol.nd-pv-top', h('li.nd-pv-wait', 'THE BOARD…'));
    const mine = h('div.nd-pv-you');
    const wrap = h('div.nd-pv-board', { style: { '--acc': ACC[g.id] || '#d6f0ff' } },
      h('div.nd-pv-bh', h('span', 'THE BOARD'), h('span', def.label)),
      list, mine,
      h('button.nd-pv-more', { type: 'button', onclick: () => { close(); setState({ view: 'board', boardGame: g.id }); } }, 'SEE THE FULL BOARD ›'));
    const MEDALS = ['gold', 'silver', 'bronze'];
    import('../profile/api.js').then(api => api.board(def.id, 'all', { n: 3 })).then(d => {
      list.replaceChildren(...(d.rows.length ? d.rows.map(r => h('li', h('span.nd-pv-medal', { class: `is-${MEDALS[Math.min(2, r.rank - 1)]}` }, String(r.rank)), h('span.nd-pv-n', r.n, rankBadge(r, { tag: true, size: 13 })), h('b', fmtValue(def, r.v))))
        : [h('li.nd-pv-wait', 'No one yet — be the first.')]));
    }).catch(() => { wrap.remove(); });
    const me = loadMe();
    if (me && me.pid) {
      import('../profile/me.js').then(m => m.myRanks([def.id])).then(r => {
        const x = r[def.id] && r[def.id].all;
        mine.replaceChildren(h('span', 'YOU'), h('b', x ? `#${x.rank.toLocaleString('en-US')}` : '—'), h('span', x ? fmtValue(def, x.v) : 'NOT RANKED YET'));
      }).catch(() => {});
    }
    return wrap;
  }

  // ------------------------------------------------------------------ actions
  function buildActions() {
    els.welcome = h('div.nd-welcome');
    els.rejoin = h('div.nd-rejoin');
    els.host = h('button.nd-host', { type: 'button', onclick: host }, h('span.nd-host-sheen'), h('span.nd-host-label', 'HOST GAME'));
    // one real input under four boxes: native keyboard, autocapitalise, paste, iOS autofill all just work
    els.code = h('input.nd-code-in', {
      type: 'text', inputmode: 'text', autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off', spellcheck: false,
      maxLength: 24, 'aria-label': 'Room code, 4 letters', enterkeyhint: 'go',
      oninput: onCode, onpaste: onPaste, onfocus: paintCode, onblur: paintCode,
      onkeydown: e => { if (e.key === 'Enter' && els.code.value.length === 4) join(els.code.value); },
    });
    els.boxes = [0, 1, 2, 3].map(i => h('span.nd-box', { style: { '--i': i } }));
    els.go = h('button.nd-go', { type: 'button', 'aria-label': 'Join room', onclick: () => (els.code.value.length === 4 ? join(els.code.value) : els.code.focus()) }, '›');
    els.msg = h('p.nd-msg', { role: 'status', 'aria-live': 'polite' });
    // the third door: THE BOARD (the global leaderboards)
    els.board = h('button.nd-board', { type: 'button', onclick: () => { sfx('select'); setState({ view: 'board' }); } },
      h('span.nd-board-mark', { 'aria-hidden': 'true' }), h('span.nd-board-l', 'THE BOARD'), h('span.nd-board-s', 'HALL OF FAME'));
    // YOUR CARD: the membership card, with your rank step and how far to the next
    els.cardBtn = h('button.nd-card-btn', { type: 'button', 'aria-label': 'Your membership card', onclick: () => { sfx('select'); setState({ view: 'profile' }); } });
    // under the code boxes, one line: a join message when there is one, otherwise "Welcome back"
    return h('section.nd-actions',
      els.rejoin,
      els.host,
      h('div.nd-join',
        h('span.nd-join-label', 'JOIN'),
        h('label.nd-codebox', { onpointerdown: () => setTimeout(() => els.code.focus(), 0) }, els.code, ...els.boxes),
        els.go),
      h('div.nd-pair', els.board, els.cardBtn),
      h('div.nd-foot', els.msg, els.welcome));
  }

  function update(state) {
    st = state;
    if (!els.welcome) return;
    const p = loadProfile();
    const me = loadMe();
    const pub = me && me.profile && me.uid === state.uid ? me.profile : null;
    paintCardBtn(pub);
    const sig = `${p ? `${p.name}|${p.color}|${p.avatar}` : ''}|${pub ? `${pub.t}|${pub.r}` : ''}|${state.rejoin || ''}|${state.invite || ''}|${state.inviteExpired || ''}`;
    if (sig === els.sig) return;
    els.sig = sig;
    els.welcome.replaceChildren(...(p && p.name ? [
      avatar(p.avatar, p.color, 22),
      h('button.nd-me', { type: 'button', 'aria-label': 'Your membership card', onclick: () => setState({ view: 'profile' }) },
        h('span', 'Welcome back, ', h('b', { style: { color: colorHex(p.color) } }, p.name)), rankBadge(pub, { tag: false, size: 16 })),
      h('button.nd-edit', { type: 'button', onclick: () => setState({ view: 'setup', setupMode: 'edit' }) }, 'EDIT'),
    ] : []));
    els.welcome.hidden = !(p && p.name);
    els.rejoin.replaceChildren(...(state.rejoin ? [h('button.nd-rejoin-btn', { type: 'button', onclick: () => join(state.rejoin, true) },
      h('span.nd-rejoin-k', 'YOUR ROOM IS STILL OPEN'), h('span.nd-rejoin-l', `REJOIN ${state.rejoin}`))] : []));
    els.rejoin.hidden = !state.rejoin;
    els.host.classList.toggle('is-quiet', !!state.rejoin);
    if (state.invite && !els.code.value) { els.code.value = clean(state.invite); paintCode(); say(`You’re invited to room ${els.code.value} — tap › to join.`, 'info'); els.go.classList.add('is-ready'); }
    if (state.inviteExpired) say(`Room ${state.inviteExpired} has closed. Host a new game, or ask your friend for a fresh code.`, 'warn');
  }

  function paintCardBtn(pub) {
    if (!els.cardBtn) return;
    const xp = pub ? pub.x || 0 : 0;
    const sig = `${xp}|${pub ? pub.s : ''}`;
    if (els.cardBtn.dataset.sig === sig) return;
    els.cardBtn.dataset.sig = sig;
    const sp = step(xp);
    els.cardBtn.style.setProperty('--rk', RANK_COLORS[sp.i]);
    els.cardBtn.replaceChildren(...[
      h('span.nd-cb-emb', emblem(sp.i, 26)),
      h('span.nd-cb-name', pub ? sp.name : 'YOUR CARD'),
      h('span.nd-cb-bar', h('i', { style: { transform: `scaleX(${pub ? sp.frac : 0})` } })),
      pub && pub.s >= 2 ? h('span.nd-cb-flame', `${pub.s}🔥`) : null].filter(Boolean));
  }

  const clean = v => String(v || '').toUpperCase().replace(/[^A-Z]/g, '');

  function onCode() {
    const raw = clean(els.code.value);
    const bad = [...raw].some(ch => !CODE_ALPHABET.includes(ch));
    const v = [...raw].filter(ch => CODE_ALPHABET.includes(ch)).join('').slice(0, 4);
    els.code.value = v;
    paintCode();
    els.go.classList.toggle('is-ready', v.length === 4);
    if (bad) say('Room codes never use I or O.', 'warn');
    else if (v.length < 4) say('');
    if (v.length === 4) join(v);
  }

  function onPaste(e) {
    // pasting an invite link works too: take the code out of it
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    const m = /[?&]room=([A-Za-z]{4})\b/.exec(text) || /\b([A-Za-z]{4})\b/.exec(text.trim());
    if (!m) return;
    e.preventDefault();
    els.code.value = m[1].toUpperCase();
    onCode();
  }

  function paintCode() {
    const v = els.code.value;
    const focused = document.activeElement === els.code;
    els.boxes.forEach((b, i) => {
      b.textContent = v[i] || '';
      b.classList.toggle('is-filled', !!v[i]);
      b.classList.toggle('is-caret', focused && i === Math.min(v.length, 3) && v.length < 4);
    });
  }

  function say(text, kind = 'info') {
    els.msg.textContent = text;
    els.msg.dataset.kind = kind;
  }

  function shake() {
    const c = els.code.parentElement;
    c.classList.remove('is-shake');
    void c.offsetWidth;
    c.classList.add('is-shake');
  }

  async function host() {
    if (busy) return;
    const p = loadProfile();
    if (!p || !p.name) { setState({ view: 'setup', setupMode: 'host' }); return; }
    busy = true;
    els.host.classList.add('is-busy');
    els.host.querySelector('.nd-host-label').textContent = 'OPENING A ROOM…';
    try {
      await Promise.race([firebaseReady, new Promise((_, rej) => setTimeout(() => rej(new Error('network')), 20000))]);
      await createRoom(p);
      setState({ invite: '', rejoin: '' });
    } catch (e) {
      busy = false;
      els.host.classList.remove('is-busy');
      els.host.querySelector('.nd-host-label').textContent = 'HOST GAME';
      say(friendly(e), 'warn');
      sfx('invalid');
    }
  }

  async function join(code, isRejoin = false) {
    if (busy) return;
    const p = loadProfile();
    if (!p || !p.name) { setState({ view: 'setup', setupMode: 'join', invite: code }); return; }
    busy = true;
    els.code.blur();
    els.code.parentElement.classList.add('is-busy');
    say(isRejoin ? `Rejoining room ${code}…` : `Joining room ${code}…`, 'info');
    try {
      await Promise.race([firebaseReady, new Promise((_, rej) => setTimeout(() => rej(new Error('network')), 20000))]);
      await joinRoom(code, p);
      setState({ invite: '', rejoin: '', inviteExpired: '' });
    } catch (e) {
      busy = false;
      els.code.parentElement.classList.remove('is-busy');
      say(friendly(e, code), 'warn');
      if (isRejoin) setState({ rejoin: '' });
      sfx('invalid');
      shake();
      els.code.select && els.code.select();
    }
  }

  function friendly(e, code = '') {
    const m = String((e && e.message) || e);
    if (/No room/i.test(m)) return `There’s no room ${code} right now. Check the code, or ask for a fresh invite.`;
    if (/full/i.test(m)) return `Room ${code} is full — 8 players is the limit.`;
    if (/removed you/i.test(m)) return 'The host removed you from that room.';
    if (/permission|network|unavailable|offline/i.test(m)) return 'Couldn’t reach the game servers. Check your connection and try again.';
    return m;
  }

  // ------------------------------------------------------------------ test hook + unmount
  function setupHook() {
    window.__district = {
      scene: () => scene && scene.debug(),
      phase: () => (tl ? { kind: tl.kind, done: tl.done, t: tl.done ? tl.doneAt : (performance.now() - tl.t0) / 1000 } : { kind: 'gate', done: false }),
      skip,
      enter,
      setTier: t => scene && scene.setTier(t),
      frames: () => scene && scene.frames(),
      reduced,
    };
  }

  function unmount() {
    destroyed = true;
    if (tl) cancelAnimationFrame(tl.raf);
    clearTimeout(flickerTimer);
    clearTimeout(els.logoTimer);
    clearTimeout(els.skyTimer);
    if (stopRain) stopRain(0.6);
    document.body.classList.remove('nd-on');
    const wrap = els.sceneWrap;
    captureBackdrop(els.canvas);   // the menus keep a still of the city
    const sc = scene;
    scene = null;
    wrap.classList.add('is-out');
    setTimeout(() => { sc && sc.destroy(); wrap.remove(); }, 420);
    if (window.__district) delete window.__district;
  }

  return { mount, update, unmount };
}

