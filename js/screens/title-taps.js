import { openSheet } from '../ui/sheet.js';
import { GAMES, MIN_PLAYERS, MAX_PLAYERS } from '../config.js';
import { toast } from '../ui/toast.js';
import { sfx } from '../audio/sfx.js';
import { openHelp } from '../ui/help.js';
import { neonDropout, knock } from '../audio/ambience.js';
import { useEmulator, loadMe } from '../identity.js';
import { metaOf } from '../games/registry.js';
import { gameArtSvg } from '../ui/game-art.js';
import { h } from '../ui/dom.js';
import { primaryBoard, fmtValue } from '../core/boards.js';
import { setState, state, isHost } from '../store.js';
import { tubeButton, row } from '../ui/components.js';
import { cardActions, playersLine } from '../core/room-logic.js';
import { markFor } from '../core/marks.js';
import { playSolo } from '../host.js';
import { dbRef, update as dbUpdate } from '../firebase.js';
import { layersOpen } from '../ui/layers.js';
import { reducedMotion } from '../ui/dom.js';
import { lazyImport } from '../ui/lazy-import.js';

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
      lazyImport(import('../errlog.js'), '../errlog.js').then(m => m.reportError(new Error(`SIGHTING TRACE (a preview link, not an error): ${JSON.stringify(tr)}`), 'sighting-trace')).catch(() => {});
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
    if (sg) { lazyImport(import('../progress/sighting.js'), '../progress/sighting.js').then(m => m.onSighting(sg, { scene: T.scene, reduced: T.reduced() })).catch(e => console.warn('[sighting]', e)); return; }
    const r = T.logoRect();
    if (r && x >= r.x && x <= r.x + r.w && y >= r.y - 12 && y <= r.y + r.h + 12) { buzz(Math.max(0, Math.min(3, Math.floor((x - r.x) / r.w * 4)))); return; }
    const hit = T.scene.hit(x, y);
    if (!hit) return;
    // (PLAY NOW — THE SKYLINE SIGNS open the game's CARD (the playable games' signs + the speakeasy's PRISM DROP blade — scene.hit). The split:
    //  THE SIGN's own gestures (a letter's tap, THE RACE, THE SURGE) live on NEON SPEAKEASY's letters — answered above (logoRect), before
    //  any city hit; a game sign is only ever a city hit, so a card never steals them)
    if (hit.kind === 'sign') { const g = GAMES.find(x => x.id === hit.id); if (g && !g.playable) { toast(`${g.name} — coming soon`, 'info'); return; } if (g) gameCard(g); }   // (WINDOWS — THE FIVE SIGNS: next on deck = a quiet COMING SOON)
    else if (hit.kind === 'ufo') sfx('portal');
    else if (hit.kind === 'cat') sfx('key');
    // THE STREET: knock on the speakeasy's door — a soft double knock, the peephole slides open, and the JOIN panel opens (a real
    // way in: enter the hush word), exactly like the JOIN ring. Reduced effects: no flash, the panel still opens.
    else if (hit.kind === 'door' && T.roomUi) { knock(); if (!T.reduced()) T.scene.knock(); }   // (LOBBY 2.0 A: in a room the door only knocks)
    else if (hit.kind === 'door') { knock(); if (!T.reduced()) T.scene.knock(); T.dk.openJoin(true, true); lazyImport(import('../profile/events.js'), '../profile/events.js').then(m => m.progressEvent('knock')).catch(() => {}); }   // (PROGRESSION A: KNOCK KNOCK)
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
  let idleTimer = 0, restTimer = 0, swallowed = false, mouseAt = null;
  // (CITY FIXES — THE TAP WATCH: the dock FADES for REST_MS (.is-idle — still tappable: a tap wakes it AND goes through), then RESTS (.is-rest:
  //  untappable, the waking tap only wakes). It used to swallow from the fade's FIRST frame — the owner's lost first taps on HOST / JOIN / YOU)
  const REST_MS = 1800;
  const resting = () => T.els.root.classList.contains('is-rest');
  // (local test runs don't fade on their own unless they ask with &idle=1 — a slow test step must not hide the buttons)
  // (SP3: &idle=0 keeps the dock + the corner buttons up for a look review — the glass's weather shot at length)
  const autoIdle = !(useEmulator && !/[?&]idle(?![a-z])/.test(location.search)) && !/[?&]idle=0(?![0-9])/.test(location.search);
  function armIdle() { clearTimeout(idleTimer); if (!T.destroyed && autoIdle) idleTimer = setTimeout(goIdle, IDLE_MS); }
  function goIdle() {
    if (T.destroyed || !T.tl || !T.tl.done) return;
    if (T.roomUi) { armIdle(); return; }   // (LOBBY 2.0 A: in a room the dock stays up — it's the room's controls)
    // (CITY FIXES: never at rest under ANY pop-up — every one is on THE LAYER STACK (the radio, CUSTOMIZE, a full card, the dailies…): the
    //  radio's SEND after a pause to read was swallowed — only .sh / .modal used to count)
    const busyNow = T.busy || layersOpen() > 0 || document.querySelector('.sh, .modal, .sheet, .rd-modal, .vl-dress, .vl-full, .pf-overlay') || document.activeElement === T.els.code || T.els.actions.classList.contains('is-join');
    if (busyNow) { armIdle(); return; }
    T.els.root.classList.add('is-idle');
    document.body.classList.add('nd-idle');
    clearTimeout(restTimer);
    restTimer = setTimeout(() => { if (!T.destroyed && T.els.root.classList.contains('is-idle')) { T.els.root.classList.add('is-rest'); document.body.classList.add('nd-rest'); } }, reducedMotion() ? 0 : REST_MS);
    T.tagState();
  }
  function wake() { clearTimeout(restTimer); const was = T.els.root.classList.contains('is-idle'); T.els.root.classList.remove('is-idle', 'is-rest'); document.body.classList.remove('nd-idle', 'nd-rest'); if (was) T.tagState(); }
  // 9e — THE QUICK FADE (the owner, DECIDED): a tap WHILE a scene plays on the street under the dock (the car crossing, the patrol…) brings
  // the dock up but lets it fade away again within ~2 s so they keep watching; ANY further touch (a button, a press-and-hold, a scroll)
  // returns to the normal 10 s
  const QUICK_MS = 2000;
  let quickIdle = false;
  function onWake(e) {
    if (T.destroyed) return;
    const wasIdle = T.els.root.classList.contains('is-idle');
    const inLayer = !!(e.target && e.target.closest && e.target.closest('.sh, .modal, [data-layer]'));
    if (wasIdle && e.type === 'pointerdown' && autoIdle && T.scene && T.scene.frontBusy && T.scene.frontBusy()) {
      if (resting() && !inLayer) { swallowed = true; setTimeout(() => { swallowed = false; }, 700); e.preventDefault(); }
      wake(); quickIdle = true; clearTimeout(idleTimer); idleTimer = setTimeout(goIdle, QUICK_MS); return;
    }
    quickIdle = false;
    // the touch that wakes the screen only wakes it (it doesn't press whatever was under it)
    // (9b: never a tap inside the ☰ menu or a sheet — the owner's CREDITS tap on the iPhone was swallowed this way)
    // (CITY FIXES: only once the dock has FADED OUT (.is-rest) — a tap on the still-visible fading dock is a real tap; never inside a pop-up)
    if (resting() && e.type === 'pointerdown' && !inLayer) { swallowed = true; setTimeout(() => { swallowed = false; }, 700); e.preventDefault(); }
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

  /** a game's shelf / card facts: { solo, players ('SOLO · 2–8 PLAYERS' | '2–8 PLAYERS'), mins ('≈ 4 MIN' | null) } */
  function meta(g) {
    const mod = metaOf(g.id) || {};
    const min = Math.max(MIN_PLAYERS, mod.MIN_PLAYERS || 0), solo = mod.SOLO === true;
    const runs = solo && Array.isArray(mod.SOLO_RUNS) ? mod.SOLO_RUNS : null;   // (PD-6 — TWO SOLO BUTTONS: the cartridge's solo list, from its meta)
    let mins = null;
    try { mins = mod.estimateMinutes ? mod.estimateMinutes(mod.DEFAULT_SETTINGS || {}) : null; } catch { mins = null; }
    return { solo, runs, players: `${playersLine(solo, min, MAX_PLAYERS)} PLAYERS`, mins: mins ? `≈ ${Math.round(mins)} MIN` : null };
  }
  /** the game's neon mark as a small inline SVG (the row's icon) — its own tubes, its own colours */
  function markSvg(g) {
    const m = markFor(g);
    const tubes = ((m && m.tubes) || []).map(t => `<path d="${t.d}" style="stroke:${t.col};fill:none;stroke-width:7;stroke-linecap:round;stroke-linejoin:round"/>`).join('');
    return `<svg viewBox="0 0 100 100" aria-hidden="true" class="nd-shelf-mark">${tubes}</svg>`;
  }

  // PLAY NOW — THE GAMES SHELF (the dock's PLAY): the playable games, ONE ROW each (THE ROW — the game's neon mark, its name, "solo · 2–8" /
  // "2–8", the minutes) → a tap opens that game's CARD on top (nested: ‹ back to the shelf)
  function shelf() {
    sfx('select');
    const games = GAMES.filter(g => g.playable);
    openSheet({ title: 'PLAY', kicker: 'PICK A GAME', cls: 'nd-shelf-sheet', label: 'Play a game', body: [
      h('div.nd-shelf', ...games.map(g => { const m = meta(g); return row({ icon: markSvg(g), label: g.name, sub: [m.players.replace(' PLAYERS', ''), m.mins].filter(Boolean).join(' · ').toLowerCase(), ic: T.ACC[g.id] || '#d6f0ff', cls: 'nd-shelf-row', attrs: { dataset: { game: g.id } }, onClick: () => gameCard(g) }); })),
      h('p.sh-note.is-small', 'One phone each. Solo games play right now — or bring friends.')] });
  }

  // PLAY NOW — THE GAME CARD (THE SHEET): the game's art + name, ONE line on what it is, its players + minutes, HOW TO PLAY; the actions
  // (core/room-logic.js#cardActions): a SOLO game → PLAY NOW (the pink MAIN: a solo run in one tap — host.js#playSolo) + PLAY WITH FRIENDS (a
  // normal room, the game picked); no SOLO (HOLD'EM) → PLAY WITH FRIENDS the MAIN + "Needs 2+ players". In a room: the host's PICK THIS GAME
  // (the room's own path — its options, then INITIATE); a guest is told the host picks. Then THE BOARD's top three, as the preview had.
  function gameCard(g) {
    sfx('select');
    const m = meta(g);
    let sheet = null;
    const close = () => { if (sheet) sheet.close(); };
    const A = cardActions({ solo: m.solo, runs: m.runs, inRoom: !!state.code, host: isHost() });
    const act = (id, mode = null) => () => {
      if (id === 'solo') { close(); playSolo(g.id, mode ? { settings: { mode } } : {}); return; }   // (PD-6: a solo button's mode)
      if (id === 'friends') { close(); friends(g); return; }
      if (id === 'pick') { close(); pick(g); }
    };
    // (PD-6 — TWO SOLO BUTTONS: one THE NEON TUBE per solo run — the first the ONE pink MAIN, the rest plain; its `sub` the small line under the
    //  label; each carries its mode (data-mode))
    const tube = (a, kind) => {
      const b = tubeButton(a.label, { kind, block: true, onClick: act(a.id, a.mode), cls: `nd-card-${a.id}${a.sub ? ' has-sub' : ''}`, attrs: { dataset: a.mode ? { act: a.id, mode: a.mode } : { act: a.id } } });
      if (a.sub) b.append(h('small.nd-card-sub', a.sub));
      return b;
    };
    const actions = h('div.nd-card-actions',
      A.main ? tube(A.main, 'main') : null,
      ...(A.more || []).map(a => tube(a, 'secondary')),
      A.second ? tube(A.second, 'secondary') : null,
      A.note ? h('p.nd-card-note', A.note) : null);
    const art = gameArtSvg(g.id);
    // (SHELL 2.0 A: THE SHEET — the game's name its title, its tag the small line)
    sheet = openSheet({ title: g.name, kicker: g.tag, cls: 'nd-preview-sheet nd-card-sheet', theme: g.theme, label: g.name, body: [
      h('div.nd-preview.nd-card', { style: { '--acc': T.ACC[g.id] || '#d6f0ff' }, dataset: { game: g.id } },
        h('div.nd-pv-art', art),
        h('div.nd-pv-body',
          h('p.nd-pv-blurb', g.blurb),
          h('div.nd-pv-meta', h('span', m.players), m.mins ? h('span', m.mins) : null)),
        actions,
        h('div.nd-pv-actions',
          h('button.nd-card-help', { type: 'button', onclick: () => { close(); openHelp(g.id); } }, h('span', 'HOW TO PLAY'), h('i', { 'aria-hidden': 'true' }, ' ›'))),   // (a quiet link — the two PLAY actions lead)
        topThree(g, () => close()))] });
  }
  /** PLAY WITH FRIENDS = HOST with this game PRESELECTED: a normal room (a hush word, THE ROOM IN THE CITY), the host's options sheet opens on it */
  function friends(g) {
    try { sessionStorage.setItem('nd:pick', g.id); } catch { /* the room still opens — the host picks by hand */ }
    if (T.dk && T.dk.host) T.dk.host(); else setState({ view: 'setup', setupMode: 'host', setupGame: g.id });
  }
  /** PICK THIS GAME (the host, in a room): the room's own path — the REMATCH ring cleared if it was up, the game's options → INITIATE */
  function pick(g) {
    if (!isHost()) { toast('The host picks the game', 'info'); return; }
    if (state.code && state.meta && state.meta.back && state.meta.back.rm) dbUpdate(dbRef(`rooms/${state.code}`), { 'meta/back/rm': false, rv: null }).catch(() => {});
    lazyImport(import('./game-options.js'), './game-options.js').then(M => M.openGameOptions(g, { meta: state.meta })).catch(() => {});
  }
  // (the old name — the games' tiles + the signs opened this; THE GAME CARD replaces it)
  const preview = gameCard;

  // the game's top three on THE BOARD (its first record, else its wins) and your own rank there
  function topThree(g, close) {
    const def = primaryBoard(g.id, g.id === 'pulse' ? [{ id: 'pulse1', title: 'Track 01' }] : []);
    const list = h('ol.nd-pv-top', h('li.nd-pv-wait', 'THE BOARD…'));
    const mine = h('div.nd-pv-you');
    const wrap = h('div.nd-pv-board', { style: { '--acc': T.ACC[g.id] || '#d6f0ff' } },
      h('div.nd-pv-bh', h('span', 'THE BOARD'), h('span', def.label)),
      list, mine,
      // (BOARD 2.0 B: THE BOARD's tabs are the two playable games — a sign of a game without a tab shows its top three, no link)
      g.playable !== false ? h('button.nd-pv-more', { type: 'button', onclick: () => { close(); setState({ view: 'board', boardGame: g.id, boardBoard: null, boardPeriod: null }); } }, 'SEE THE FULL BOARD ›') : null);
    const MEDALS = ['gold', 'silver', 'bronze'];
    Promise.all([lazyImport(import('../profile/api.js'), '../profile/api.js').then(api => api.board(def.id, 'all', { n: 3 })), lazyImport(import('../ui/strip-board.js'), '../ui/strip-board.js').then(m => m.stripKit().then(K => ({ ...m, K })))]).then(([d, SB]) => {
      // (LOBBY 2.0 A — REAL USERNAMES: the rows carry the players' usernames; your own row, by your board id, is yours)
      // (BOARD 2.0 B — SLIM CARDS EVERYWHERE: each of the three = their slim card (ui/strip-board.js), the medal at the left, the score under it)
      const you = loadMe();
      const own = r => !!(you && you.profile && you.profile.bid && r.id === you.profile.bid);
      if (!d.rows.length) { list.replaceChildren(h('li.nd-pv-wait', 'No one yet — be the first.')); return; }
      if (!list.isConnected && !wrap.isConnected) return;
      const strips = [];
      list.classList.add('is-strips');
      list.replaceChildren(...d.rows.map(r => (own(r) ? { ...r, ...you.profile, l: r.l } : r)).map(r => {
        const st = SB.stripFor(SB.K, r); strips.push(st);
        return h('li', h('span.nd-pv-medal', { class: `is-${MEDALS[Math.min(2, r.rank - 1)]}` }, String(r.rank)), h('div.nd-pv-card', st.el, h('b', fmtValue(def, r.v))));
      }));
      const surface = SB.K.createSurface(list, { label: 'preview-top' });
      strips.forEach((st, i) => SB.stripFx(SB.K, surface, st, i + 1));
      const iv = setInterval(() => { if (!list.isConnected) { clearInterval(iv); try { surface.destroy(); } catch { /* fine */ } } }, 2000);
    }).catch(() => { wrap.remove(); });
    const me = loadMe();
    if (me && me.pid) {
      lazyImport(import('../profile/me.js'), '../profile/me.js').then(m => m.myRanks([def.id])).then(r => {
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
    get gameCard() { return gameCard; },
    get shelf() { return shelf; },
    get quickIdle() { return quickIdle; },
    get wake() { return wake; },
  };
}
