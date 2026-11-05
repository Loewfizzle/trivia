import { openSheet } from '../ui/sheet.js';
import { GAMES, MIN_PLAYERS, MAX_PLAYERS } from '../config.js';
import { toast } from '../ui/toast.js';
import { sfx } from '../audio/sfx.js';
import { openHelp } from '../ui/help.js';
import { neonDropout, knock } from '../audio/ambience.js';
import { useEmulator, loadMe } from '../identity.js';
import { GAME_MODULES } from '../games/registry.js';
import { gameArtSvg } from '../ui/game-art.js';
import { h } from '../ui/dom.js';
import { primaryBoard, fmtValue } from '../core/boards.js';
import { setState } from '../store.js';
import { rankBadge } from '../ui/emblems.js';

/** createTaps(T) — moved out of title.js#createTitle by scripts/split-closure.mjs (no behaviour change): T carries the names it shares
 *  with that closure, live (getters + setters); what it returns, the closure reads as tap.<name>. */
export function createTaps(T) {

  // ------------------------------------------------------------------ the living city: taps, and the screen at rest
  // a tap on the city: a sign opens that game's HOW TO PLAY; the moon, the UFO, the cat answer (fx.js); a tap on the
  // main sign makes that tube buzz
  let down = null, introTap = null;
  // THE VAULT 1B — THE NO-TAP SIGHTING (the owner's iPhone, twice: the forced UFO "reacted + took a photo by itself"; WebKit at 402 × 874
  // with zero input never fires — every path to the photo is a pointerdown + pointerup pair, or the owner's &sgdemo link). What reaches
  // the page with nobody meaning to tap: the touch iOS hands to Safari as it comes to the front (a tap on its card in the app switcher, a
  // swipe back from another app) lands mid-screen — where a forced legendary hovers. So a SIGHTING needs: a trusted touch / click that
  // began ≥ 800 ms after the page was last shown (load, back on screen, focus), its DOWN and its UP both on the same legendary. Every
  // sighting on a preview link (&force= / &when= …) sends its trace to /admin's "Errors from phones" (the event, its timing, its target),
  // so if it ever happens again we see exactly what started it.
  let shownAt = performance.now();
  const onShown = () => { if (document.visibilityState !== 'hidden') shownAt = performance.now(); };
  function onCityDown(e) {
    // (a touch that began while the gate / the intro was up — it opened or skipped them — never becomes a city tap)
    if (introTap != null && (introTap === true || introTap === e.pointerId)) { introTap = null; down = null; return; }
    introTap = null;
    if (!e.isTrusted) { down = null; return; }
    down = swallowed || !T.tl || !T.tl.done ? null : { x: e.clientX, y: e.clientY, t: performance.now(), target: e.target, id: e.pointerId, type: e.pointerType,
      shown: Math.round(performance.now() - shownAt), sg: T.scene && T.scene.sightAt ? T.scene.sightAt(e.clientX, e.clientY) : null };
  }
  function onCityUp(e) {
    const d = down; down = null;
    if (!d || !e.isTrusted || (d.id != null && e.pointerId != null && d.id !== e.pointerId)) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || performance.now() - d.t > 600) return;
    onCityTap({ target: d.target, clientX: e.clientX, clientY: e.clientY, down: d });
  }
  /** may this tap start a sighting? (→ the reason it may not, or '') */
  function sightBlock(d, key) {
    if (!d) return 'no down';
    if (!d.sg) return 'the down was not on a legendary';
    if (d.sg !== key) return 'the down + the up on different legendaries';
    if (d.shown < 800) return `a touch ${d.shown} ms after the page was shown (iOS's app-switch touch)`;
    return '';
  }
  let traced = 0;
  function sightTrace(d, key, why) {
    const tr = { key, why: why || 'tap', type: d && d.type, shownMs: d && d.shown, downUpMs: d ? Math.round(performance.now() - d.t) : null,
      at: d ? [Math.round(d.x), Math.round(d.y)] : null, target: d && d.target ? String(d.target.className || d.target.tagName).slice(0, 40) : null,
      sinceLoad: Math.round(performance.now()), vis: document.visibilityState };
    window.__sgTrace = tr;
    const q = new URLSearchParams(location.search);
    if (traced < 3 && ['force', 'when', 'lgnow'].some(k => q.get(k))) {
      traced++;
      import('../errlog.js').then(m => m.reportError(new Error(`SIGHTING TRACE (a preview link, not an error): ${JSON.stringify(tr)}`), 'sighting-trace')).catch(() => {});
    }
  }
  function onCityTap(e) {
    if (T.destroyed || !T.scene || !T.tl || !T.tl.done || swallowed) return;
    if (e.target.closest('button, input, label, a, .sh, .modal, .sheet, .nd-actions, .nd-gate, .menu-btn, .music-btn, .sg-fly, .sg-modal')) return;
    const x = e.clientX, y = e.clientY;
    // (WIN — the spider on the sign is asked BEFORE the letters: a tap on it bolts it down its thread; the letter taps keep the rest of the rect)
    if (T.scene.spiderHit && T.scene.spiderHit(x, y)) return;
    // (PROGRESSION B — CITY SIGHTINGS: a legendary under the finger answers before the letters — its reaction, the flash, the polaroid)
    const lr = T.logoRect(), onSign = !!(lr && x >= lr.x && x <= lr.x + lr.w && y >= lr.y - 12 && y <= lr.y + lr.h + 12);
    const skip = onSign ? ['aurora'] : null;                    // (the aurora is BEHIND the sign: the letters win there)
    const key = T.scene.sightAt ? T.scene.sightAt(x, y, skip) : null;
    const block = key ? sightBlock(e.down, key) : 'none';
    if (key && block) { sightTrace(e.down, key, `IGNORED — ${block}`); return; }
    const sg = key && T.scene.sightTap && T.scene.sightTap(x, y, { skip });
    if (sg) { sightTrace(e.down, sg.key, ''); }
    if (sg) { import('../progress/sighting.js').then(m => m.onSighting(sg, { scene: T.scene, reduced: T.reduced() })).catch(e => console.warn('[sighting]', e)); return; }
    const r = T.logoRect();
    if (r && x >= r.x && x <= r.x + r.w && y >= r.y - 12 && y <= r.y + r.h + 12) { buzz(Math.max(0, Math.min(3, Math.floor((x - r.x) / r.w * 4)))); return; }
    const hit = T.scene.hit(x, y);
    if (!hit) return;
    if (hit.kind === 'sign') { const g = GAMES.find(x => x.id === hit.id); if (g && !g.playable) { toast(`${g.name} — coming soon`, 'info'); return; } sfx('select'); openHelp(hit.id); }   // (WINDOWS — THE FIVE SIGNS: next on deck = a quiet COMING SOON)
    else if (hit.kind === 'ufo') sfx('portal');
    else if (hit.kind === 'cat') sfx('key');
    // THE STREET: knock on the speakeasy's door — a soft double knock, the peephole slides open, and the JOIN panel opens (a real
    // way in: enter the hush word), exactly like the JOIN ring. Reduced effects: no flash, the panel still opens.
    else if (hit.kind === 'door' && T.roomUi) { knock(); if (!T.reduced()) T.scene.knock(); }   // (LOBBY 2.0 A: in a room the door only knocks)
    else if (hit.kind === 'door') { knock(); if (!T.reduced()) T.scene.knock(); T.dk.openJoin(true, true); import('../profile/events.js').then(m => m.progressEvent('knock')).catch(() => {}); }   // (PROGRESSION A: KNOCK KNOCK)
  }
  // a tapped letter: by night it stutters out, stays dark a moment and re-ignites like neon does; by day it sparks to life,
  // glows for a moment and flickers out again. One tap at a time per letter.
  const buzzing = new Set();
  function buzz(i) {
    const l = T.els.sign.querySelectorAll('.ndl')[i];
    if (!l || buzzing.has(i)) return;
    buzzing.add(i);
    if (T.scene && T.scene.poke) T.scene.poke({ kind: 'tap', letter: i, k: 0.65 });   // (WIN2: the spiders near that letter get scared)
    const day = T.els.sign.classList.contains('is-day') || !T.els.sign.classList.contains('is-steady');
    // (City 2.0, NEON PASS 3: the tap's sounds — the dropout when the letter goes dark, the power-on (+ the hum fading after 10 s)
    // when it lights; by night: out at once, re-ignites at 1.6 s; by day: sparks on at once, out at 1.85 s)
    // (PART 8a, the owner: the TAP's on / off ~25 % quieter — 0.75 → 0.5625, ≈ −2.5 dB; THE CATCH's power-on + the first-tap surge
    // keep their level: neonOnSound() at 1 elsewhere)
    const sound = on => { if (T.reduced()) return; if (on) T.neonOnSound(T.NEON_TAP_LEVEL, 'tap'); else neonDropout({ level: T.NEON_TAP_LEVEL }); };
    const set = (on, ms, tick) => setTimeout(() => { if (T.destroyed) return; l.classList.toggle('on', on); if (tick) { T.neonTick(); sound(on); } }, ms);
    // [state, at ms]: the stutter, the hold, the restart flicker
    const plan = day
      ? [[1, 0], [0, 60], [1, 110], [0, 170], [1, 230], [0, 1850], [1, 1910], [0, 1990]]          // sparks on … glows … flickers out
      : [[0, 0], [1, 50], [0, 95], [1, 150], [0, 200], [1, 1600], [0, 1660], [1, 1720], [0, 1800], [1, 1900]];   // out … dark … re-ignites
    plan.forEach(([on, ms], k) => set(!!on, ms, k === 0 || k === 5));        // a tick as it changes, and as it restarts
    if (!day) setTimeout(() => T.raceLogo('tap'), plan[5][1] + 30);           // (NEON PASS 6: the re-ignite sends THE RACE through the sign)
    setTimeout(() => { buzzing.delete(i); if (T.destroyed) return; l.classList.toggle('on', !day); if (T.tl && T.tl.done) T.neonTick(); }, plan[plan.length - 1][1] + 40);
  }

  // after 10 s without a touch (a device's first visit; 5 s after that — 9g) the menu and the tagline fade away — just the sign and the
  // city; any touch brings them back
  const IDLE_MS = T.isFirstVisit() ? T.IDLE_FIRST_MS : T.IDLE_MS_AFTER;
  let idleTimer = 0, swallowed = false, mouseAt = null;
  // (local test runs don't fade on their own unless they ask with &idle=1 — a slow test step must not hide the buttons)
  // (SP3: &idle=0 keeps the dock + the corner buttons up for a look review — the glass's weather shot at length)
  const autoIdle = !(useEmulator && !/[?&]idle(?![a-z])/.test(location.search)) && !/[?&]idle=0(?![0-9])/.test(location.search);
  function armIdle() { clearTimeout(idleTimer); if (!T.destroyed && autoIdle) idleTimer = setTimeout(goIdle, IDLE_MS); }
  function goIdle() {
    if (T.destroyed || !T.tl || !T.tl.done) return;
    if (T.roomUi) { armIdle(); return; }   // (LOBBY 2.0 A: in a room the dock stays up — it's the room's controls)
    const busyNow = T.busy || document.querySelector('.sh, .modal, .sheet') || document.activeElement === T.els.code || T.els.actions.classList.contains('is-join');
    if (busyNow) { armIdle(); return; }
    T.els.root.classList.add('is-idle');
    document.body.classList.add('nd-idle');
    T.tagState();
  }
  function wake() { const was = T.els.root.classList.contains('is-idle'); T.els.root.classList.remove('is-idle'); document.body.classList.remove('nd-idle'); if (was) T.tagState(); }
  // 9e — THE QUICK FADE (the owner, DECIDED): a tap WHILE a scene plays on the street under the dock (the car crossing, the patrol…) brings
  // the dock up but lets it fade away again within ~2 s so they keep watching; ANY further touch (a button, a press-and-hold, a scroll)
  // returns to the normal 10 s
  const QUICK_MS = 2000;
  let quickIdle = false;
  function onWake(e) {
    if (T.destroyed) return;
    const wasIdle = T.els.root.classList.contains('is-idle');
    if (wasIdle && e.type === 'pointerdown' && autoIdle && T.scene && T.scene.frontBusy && T.scene.frontBusy()) {
      if (!(e.target && e.target.closest && e.target.closest('.sh, .modal'))) { swallowed = true; setTimeout(() => { swallowed = false; }, 700); e.preventDefault(); }
      wake(); quickIdle = true; clearTimeout(idleTimer); idleTimer = setTimeout(goIdle, QUICK_MS); return;
    }
    quickIdle = false;
    // the touch that wakes the screen only wakes it (it doesn't press whatever was under it)
    // (9b: never a tap inside the ☰ menu or a sheet — the owner's CREDITS tap on the iPhone was swallowed this way)
    if (T.els.root.classList.contains('is-idle') && e.type === 'pointerdown' && !(e.target && e.target.closest && e.target.closest('.sh, .modal'))) { swallowed = true; setTimeout(() => { swallowed = false; }, 700); e.preventDefault(); }
    wake();
    armIdle();
  }
  function onWakeClick(e) { if (swallowed) { e.stopPropagation(); e.preventDefault(); swallowed = false; } }
  // DESKTOP Group 4 — THE HOVER (the owner's desktop question 5: a pointer cursor + a gentle glow on everything clickable): over the city a
  // MOUSE asks the scene what a click would answer (scene.hover: no side effects), once a frame — the cursor turns to a pointer, a game
  // sign / the door gets a soft glow ring (opacity only; its place set at once); a touch never does any of it
  let hoverRaf = 0, hoverAt = null, hoverOn = false;
  const HOVER_UI = 'button, input, label, a, .sh, .modal, .sheet, .nd-actions, .nd-gate, .menu-btn, .music-btn, .nd-corner';
  function hoverNow() {
    hoverRaf = 0;
    const p = hoverAt; if (!p || T.destroyed || !T.els.root) return;
    let hv = null;
    if (T.scene && T.scene.hover && T.tl && T.tl.done && !swallowed && !(p.t && p.t.closest && p.t.closest(HOVER_UI))) {
      const r = T.logoRect();
      hv = r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y - 12 && p.y <= r.y + r.h + 12 ? { kind: 'logo' } : T.scene.hover(p.x, p.y);
    }
    T.els.root.classList.toggle('nd-hovering', !!hv);
    const g = T.els.hoverGlow, R = hv && hv.rect;
    if (g) { if (R) { g.style.width = `${Math.round(R.w + 10)}px`; g.style.height = `${Math.round(R.h + 10)}px`; g.style.transform = `translate(${Math.round(R.x - 5)}px, ${Math.round(R.y - 5)}px)`; } g.classList.toggle('on', !!R); }
    hoverOn = !!hv;
  }
  function onHover(e) {
    if (e.pointerType !== 'mouse') { if (hoverOn) { hoverAt = { x: -1e4, y: -1e4 }; hoverNow(); } return; }
    hoverAt = { x: e.clientX, y: e.clientY, t: e.target };
    if (!hoverRaf) hoverRaf = requestAnimationFrame(hoverNow);
  }
  function onMouse(e) {
    if (e.pointerType !== 'mouse') return;
    onHover(e);
    if (!mouseAt) { mouseAt = [e.clientX, e.clientY]; return; }
    if (Math.hypot(e.clientX - mouseAt[0], e.clientY - mouseAt[1]) > 24) { mouseAt = [e.clientX, e.clientY]; if (quickIdle && !T.els.root.classList.contains('is-idle')) return; wake(); armIdle(); }
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
    let sheet = null;
    const close = () => { if (sheet) sheet.close(); };
    const art = gameArtSvg(g.id);
    // (SHELL 2.0 A: THE SHEET — the game's name its title, its tag the small line; HOW TO PLAY the one tube)
    sheet = openSheet({ title: g.name, kicker: g.tag, cls: 'nd-preview-sheet', theme: g.theme, label: g.name, body: [
      h('div.nd-preview', { style: { '--acc': T.ACC[g.id] || '#d6f0ff' } },
        h('div.nd-pv-art', art),
        h('div.nd-pv-body',
          h('p.nd-pv-blurb', g.blurb),
          h('div.nd-pv-meta', h('span', m.players), m.mins ? h('span', m.mins) : null, h('span', 'ONE PHONE EACH')),
          topThree(g, () => close())),
        h('div.nd-pv-actions',
          h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => { close(); openHelp(g.id); } }, h('span', 'HOW TO PLAY'))))] });
  }

  // the game's top three on THE BOARD (its first record, else its wins) and your own rank there
  function topThree(g, close) {
    const def = primaryBoard(g.id, g.id === 'pulse' ? [{ id: 'pulse1', title: 'Track 01' }] : []);
    const list = h('ol.nd-pv-top', h('li.nd-pv-wait', 'THE BOARD…'));
    const mine = h('div.nd-pv-you');
    const wrap = h('div.nd-pv-board', { style: { '--acc': T.ACC[g.id] || '#d6f0ff' } },
      h('div.nd-pv-bh', h('span', 'THE BOARD'), h('span', def.label)),
      list, mine,
      h('button.nd-pv-more', { type: 'button', onclick: () => { close(); setState({ view: 'board', boardGame: g.id }); } }, 'SEE THE FULL BOARD ›'));
    const MEDALS = ['gold', 'silver', 'bronze'];
    import('../profile/api.js').then(api => api.board(def.id, 'all', { n: 3 })).then(d => {
      // (LOBBY 2.0 A — REAL USERNAMES: the rows carry the players' usernames; your own row, by your board id, is yours)
      const you = loadMe();
      const own = r => !!(you && you.profile && you.profile.bid && r.id === you.profile.bid);
      list.replaceChildren(...(d.rows.length ? d.rows.map(r => (own(r) ? { ...r, n: you.profile.n, t: you.profile.t } : r)).map(r => h('li', h('span.nd-pv-medal', { class: `is-${MEDALS[Math.min(2, r.rank - 1)]}` }, String(r.rank)), h('span.nd-pv-n', r.n, rankBadge(r, { tag: true, size: 13 })), h('b', fmtValue(def, r.v))))
        : [h('li.nd-pv-wait', 'No one yet — be the first.')]));
    }).catch(() => { wrap.remove(); });
    const me = loadMe();
    if (me && me.pid) {
      import('../profile/me.js').then(m => m.myRanks([def.id])).then(r => {
        const p = (loadMe() || {}).profile || {};
        const under = typeof p.m === 'number' && p.m < (p.mm || 3) && !p.h;   // BNAME: the 3-match floor
        const x = !under && r[def.id] && r[def.id].all;
        mine.replaceChildren(h('span', 'YOU'), h('b', x ? `#${x.rank.toLocaleString('en-US')}` : '—'), h('span', x ? fmtValue(def, x.v) : under ? `${(p.mm || 3) - p.m} MORE TO GET LISTED` : 'NOT RANKED YET'));
      }).catch(() => {});
    }
    return wrap;
  }
  return {
    get armIdle() { return armIdle; },
    get buzzing() { return buzzing; },
    get goIdle() { return goIdle; },
    get hoverRaf() { return hoverRaf; }, set hoverRaf(v) { hoverRaf = v; },
    get IDLE_MS() { return IDLE_MS; },
    get idleTimer() { return idleTimer; },
    get introTap() { return introTap; }, set introTap(v) { introTap = v; },
    get onCityDown() { return onCityDown; },
    get onCityUp() { return onCityUp; },
    get onMouse() { return onMouse; },
    get onShown() { return onShown; },
    get onWake() { return onWake; },
    get onWakeClick() { return onWakeClick; },
    get preview() { return preview; },
    get quickIdle() { return quickIdle; },
    get wake() { return wake; },
  };
}
