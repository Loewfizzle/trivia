// /jaywalk-lab — THE JAYWALK LAB (H1 — docs/jaywalk.md "THE LAB"): the preview of a game BEING BUILT, on the LIVE site, on a phone, on
// cellular. **OPEN SINCE H2B** (the owner, Nov 16: his brother tests it on his own phone from a shared link): NO owner gate, NO sign-in,
// NO GAME CALLS — the page never loads Firebase, never calls /api for anything of the game: the run is the pure engine in this tab
// (J2 — THE LINE CORRECTED, the owner's call: the shared audio engine may send ONE anonymous count when the page is left with its sound
// on — engine.js#quietAudio → errlog.js#countQuiet('snd'), no id, no data of the run — it is not blocked). Still noindex nofollow +
// UNLISTED (nothing links to it), NO room, NO database writes of any kind. (Its one possible request beyond its own files: THE SKEW
// WRAPPER asks the deploy's id if a module ever fails to link — ui/lazy-import.js, the rule for every dynamic import.)
import { h } from '../../ui/dom.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { TICK_MS, TICK_HZ, MODES, MODE_IDS, FP } from './tuning.js';
import { createCourse, pulseAt, moverLeft, gateName, ufoX, ufoY } from './course.js';
import { createArrival } from './arrival.js';
import { LOOKS as AREA_LOOKS } from './areas.js';
import { createRun, step, isOver, resultOf, canLog } from './engine.js';
import { replay } from './replay.js';
import { versionAt } from './versions.js';
import { labSeason } from './season.js';
import { wireControls } from './controls.js';
import { createTiers } from '../kit/tiers.js';
import { getPref, setPref } from './lab-prefs.js';
import { ZOOMS, ZOOM, ANGLES, ANGLE } from './camera.js';
import { runLine, hitVehicle, vehicleAt } from './causes.js';
import { createCues, cuesAt } from './cues.js';
import { setNum, prepNums } from './numerals.js';

const app = document.getElementById('app');
const Q = new URLSearchParams(location.search);
/** J2 — COURSE RULES v2: `?cv=2` previews v2 any time, `?cv=1` today's; none = the version in force by this phone's clock (a look check — the lab never counts) */
const CV = Q.get('cv') === '2' ? 2 : Q.get('cv') === '1' ? 1 : versionAt(Date.now());
/** J4 — WINTER's lab switches: `&date=YYYY-MM-DD` (the season clock forced to that day) · `&snow=none|light|heavy` · `&wet=1` (WET NEON STREETS) —
 *  JT1: `&clock=HH:MM` (the phone's LOCAL time forced — the New Year's finale before midnight) — a look check only: they never reach the live
 *  game or any count. None = today's season by this phone's clock. */
const SEA = labSeason(Q, Date.now()), SZ0 = SEA.season;
const SEA_FORCE = SEA.forced || !!SEA.snow || SEA.wet;   // (the pack fetched on ANY day the lab asks for — the live game: season days only)
const SEA_SET = { wet: SEA.wet, snow: SEA.snow, clock: SEA.clock, force: SEA_FORCE, hat: Q.get('hat') !== '0' };   // (`&hat=0` — the hats off: the A/B against the code before them only)
const SEA_LINE = SZ0.winter > 0 || SZ0.christmas > 0 || SZ0.autumn > 0 || SZ0.hat || SZ0.fireworks || SZ0.snowfall !== 'none' || SEA.wet ? ` · ${SZ0.day.slice(5, 7)}/${SZ0.day.slice(7)}${SZ0.autumn ? ` autumn ${SZ0.autumn}` : ''}${SZ0.winter ? ` winter ${SZ0.winter}` : ''}${SZ0.christmas ? ` xmas ${SZ0.christmas}` : ''}${SZ0.hat && Q.get('hat') !== '0' ? ` · ${SZ0.hat} hat` : ''}${SZ0.fireworks ? ` · fireworks ${SZ0.fireworks}` : ''}${SEA.clock >= 0 ? ` · ${Q.get('clock')}` : ''} · snow ${SZ0.snowfall}${SEA.wet ? ' · wet' : ''}` : '';
// (no game calls: the shared audio engine's REPORTS of a cut come only from the owner's phone inside the app, or on a link that says
//  &debug=1 — the lab drops that flag before the engine is ever installed; its one anonymous LEAVE count may still go — J2's corrected line)
if (Q.has('debug')) { try { Q.delete('debug'); history.replaceState(null, '', `${location.pathname}${Q.toString() ? `?${Q}` : ''}`); } catch { /* fine */ } }

/** the page could not start (a module that failed to load): say so — never a blank page */
function cantOpen(msg) {
  app.replaceChildren(h('section.jw-deny',
    h('div.jw-lab-k', 'NEON SPEAKEASY · BEING BUILT'),
    h('h1', 'THE JAYWALK LAB'),
    h('p', msg),
    h('p', h('a.jw-a', { href: '/' }, '‹ THE CITY'))));
}

const newSeed = () => { const a = new Uint32Array(2); crypto.getRandomValues(a); return [...a].map(x => x.toString(36)).join(''); };
const clock = ticks => { const s = Math.max(0, Math.ceil(ticks / TICK_HZ)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/** a button that acts on its own press + lift (never a click: iOS drops them on a page that just moved) */
function press(el, fn) {
  let id = null;
  el.addEventListener('pointerdown', e => { id = e.pointerId; e.stopPropagation(); });
  el.addEventListener('pointerup', e => { e.stopPropagation(); if (id === e.pointerId) { id = null; fn(); } });
  el.addEventListener('pointercancel', () => { id = null; });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fn(); } });
  return el;
}

async function mount() {
  // THE POSTER (H4 — `?poster=1`): the hero frame for THE TRI-VISION board, rendered from the game itself (poster.js)
  if (Q.get('poster') === '1') { const P = await lazyImport(import('./poster.js'), './poster.js'); return P.mountPoster(app); }
  // THE NIGHT LOOK (H2 — night.js); `?gray=1` keeps H1's graybox for comparison (the same engine, the same camera — camera.js)
  const GRAY = Q.get('gray') === '1';
  const [{ createGraybox, createNight }, { greedyBot }] = await Promise.all([
    GRAY ? lazyImport(import('./graybox.js'), './graybox.js') : lazyImport(import('./night.js'), './night.js'), lazyImport(import('./bot.js'), './bot.js')]);
  let kidColor = '#00f0ff';
  try { const p = JSON.parse(localStorage.getItem('na:1:profile') || 'null'); const C = { cyan: '#00f0ff', magenta: '#ff2bd6', yellow: '#f3ff3a', green: '#3dff8b', orange: '#ff8c1a', violet: '#a66bff', red: '#ff3355', blue: '#3d7bff' }; if (p && C[p.color]) kidColor = C[p.color]; } catch { /* the default */ }

  // ---- the page: the play area (the canvas + the two screen-space bands), the HUD over it
  const play = h('div.jw-play', { role: 'application', 'aria-label': 'Jaywalk — tap to hop, swipe to move' });
  const lanes = h('div.jw-lanes', '0'), sub = h('div.jw-sub', ''), mark = h('div.jw-mark', '');
  const tabs = MODE_IDS.map(m => press(h('button.jw-tab', { type: 'button', 'data-mode': m }, m.toUpperCase()), () => restart(m)));
  const seedBtn = press(h('button.jw-new', { type: 'button' }, 'NEW SEED'), () => restart(mode));
  // THE CAMERA's switches (H2B — the owner judges by feel; remembered on this phone; the rules are 9 columns whatever he picks):
  // ZOOM 7 · 8 · 9 = the columns seen across the screen · ANGLE STRAIGHT · TURNED = the slight turn (camera.js)
  const pick = (k, list, d) => { const u = Q.get(k), m = getPref(k, String(d)); return list.map(String).includes(u) ? u : list.map(String).includes(m) ? m : String(d); };
  let zoom = Number(pick('zoom', ZOOMS, ZOOM)), angle = pick('angle', ANGLES, ANGLE);
  const zooms = ZOOMS.map(n => press(h('button.jw-tab.jw-w', { type: 'button', 'data-zoom': String(n), 'aria-label': `Zoom: ${n} columns across` }, String(n)), () => setCamera(n, angle)));
  const angles = ANGLES.map(a => press(h('button.jw-tab.jw-ang', { type: 'button', 'data-angle': a, 'aria-label': `Angle: ${a}` }, a.toUpperCase()), () => setCamera(zoom, a)));
  // H5B — LOOK: DAY · NIGHT (the lab's own switch — the game follows the phone's GAME LOOK setting; `?look=day|night` for a link)
  let look = pick('look', ['night', 'day'], 'night');
  const looks = ['day', 'night'].map(l => press(h('button.jw-tab.jw-lk', { type: 'button', 'data-look': l, 'aria-label': `Look: ${l}` }, l.toUpperCase()), () => pickLook(l)));
  const pickLook = l => { setLook(l); if (shown) endT.textContent = runLine(course, resultOf(run), look); };   // (… and an end on screen says the look's own words)
  function setLook(l) { look = l === 'day' ? 'day' : 'night'; setPref('look', look); if (view && view.setLook) view.setLook(look); const st = app.querySelector('.jw-stage'); if (st) st.dataset.look = look; for (const b of looks) b.classList.toggle('is-on', b.dataset.look === look); }
  const markCamera = () => { for (const b of zooms) b.classList.toggle('is-on', b.dataset.zoom === String(zoom)); for (const b of angles) b.classList.toggle('is-on', b.dataset.angle === angle); };
  function setCamera(z, a, snap) { zoom = z; angle = a; setPref('zoom', z); setPref('angle', a); view.setCamera(z, a, snap); markCamera(); }
  const end = h('div.jw-end', { hidden: true }), endT = h('div.jw-end-t'), endL = h('div.jw-end-l'), endGo = h('div.jw-end-go', 'TAP — PLAY AGAIN'), check = h('div.jw-check');
  end.append(endT, endL, endGo, check);
  const fps = Q.get('fps') === '1' ? h('div.jw-fps', '') : null, seedLine = h('div.jw-seed', '');
  // THE SOUNDS (sfx.js — the SHARED audio engine's SFX bus; unlocked by the first tap, never before) + THE SOUND AUDITION (the SOUNDS sheet)
  let snd = null, sheetOpen = false, cues = createCues();
  const soundsBtn = press(h('button.jw-new.jw-snd', { type: 'button' }, 'SOUNDS'), () => {
    if (sheetOpen) return;
    sheetOpen = true;
    lazyImport(import('./audition.js'), './audition.js').then(A => A.openAudition({ press, onClose: () => { sheetOpen = false; last = 0; } })).catch(() => { sheetOpen = false; });
  });
  if (!GRAY) Promise.all([lazyImport(import('../../audio/engine.js'), '../../audio/engine.js'), lazyImport(import('./sfx.js'), './sfx.js')]).then(([E, S]) => { E.installAudio(); S.useLabPicks(true); S.fetchSounds(); S.fetchSounds(S.seasonSoundsOf(SZ0.day)); snd = S; lab.sfx = S; }).catch(() => { /* silent: audio is polish */ });
  // (the tools' row: ZOOM + ANGLE — the graybox follows the same camera; SOUNDS sits in the top left corner, off the play)
  const tools = h('div.jw-bar.jw-bar2', h('div.jw-tabs', h('span.jw-bar-k', 'ZOOM'), ...zooms), h('div.jw-tabs', ...angles));
  const lookBar = GRAY ? null : h('div.jw-bar.jw-bar3', h('div.jw-tabs', h('span.jw-bar-k', 'LOOK'), ...looks));
  app.replaceChildren(h(`div.jw-stage${GRAY ? '.is-gray' : ''}`, play, GRAY ? h('div.jw-sky') : null, h('div.jw-blackout'),
    h('div.jw-hud', lanes, sub, mark), GRAY ? null : soundsBtn, lookBar, tools, h('div.jw-bar', h('div.jw-tabs', ...tabs), seedBtn), end, seedLine, fps));
  const arrive = createArrival(app.querySelector('.jw-stage'), AREA_LOOKS);   // (BEFORE THE FLIP — THE ARRIVAL BANNER: the game's own, arrival.js)
  const pin = /^[012]$/.test(Q.get('tier') || '') ? Number(Q.get('tier')) : null;   // (`?tier=0|1|2` pins a quality tier — the pass's measure)
  let view;
  try { view = GRAY ? createGraybox(play, { kidColor, zoom, angle }) : createNight(play, { kidColor, zoom, angle, tier: pin == null ? 2 : pin, look, rwNight: Q.get('rwnight') === 'new' }); }   // (J2 FIX — `&rwnight=new`: THE NIGHT COMPARE, the lab only)
  catch { app.querySelector('.jw-stage').append(h('p.jw-nogl', 'This browser can’t draw the game here (it has no WebGL).')); return; }   // (the page still loaded: its stage is up)
  markCamera(); setLook(look);
  // J4 — THE SEASON: the pack fetched now (in season / a forced date); the run waiting for its first touch takes it the moment it lands
  if (view.prepSeason) Promise.resolve(view.prepSeason(SZ0.day, { force: SEA_FORCE })).then(ok => { if (ok && !started && view.setSeason) view.setSeason(SZ0.day, SEA_SET); }, () => {});
  if (view.onSeasonSound) view.onSeasonSound(id => { if (snd) { try { snd.play(id); } catch { /* silent */ } } });   // (JT1 — a pile's crunch, the fireworks)
  // J1 — THE LOOK CHECKS (`?j1=splits` · `splits9` · `moments` — lab-j1.js, lazy: the real end card's YOUR SPLITS + THE MATCH MOMENTS)
  if (/^(splits9?|moments|graves)$/.test(Q.get('j1') || ''))   // (+ graves — THE GRAVESTONES: 8 players, 4 out)
 lazyImport(import('./lab-j1.js'), './lab-j1.js').then(m => m.mountJ1(app.querySelector('.jw-stage'), { what: Q.get('j1'), sfx: () => snd })).catch(() => {});
  // AUTOMATIC quality steps (the match kit's tiers 2 / 1 / 0): the frame time slips → a step down; headroom → back up
  const tierPath = [pin == null ? 2 : pin];   // (every tier the automatic steps went through — the pass's measure + ?fps=1 read it)
  const tiers = createTiers({ apply: t => { if (view.setTier) view.setTier(t); if (tierPath.length < 40) tierPath.push(t); }, initial: pin == null ? 2 : pin });

  // ---- the run: the pure engine, stepped at 60 ticks a second from the frame clock (the RULES never read it)
  let mode = MODE_IDS.includes(Q.get('mode')) ? Q.get('mode') : 'solo', seed, course, run, log, queue = [], acc = 0, last = 0, overAt = 0, shown = false, bot = null, markUntil = 0;
  const frames = [], cost = [];   // (the frame times + the work in each frame, for &fps=1 + the pass's measure)
  const LANE_Q = /^\d{1,5}$/.test(Q.get('lane') || '') ? Math.min(20000, Number(Q.get('lane'))) : 0;   // (`?lane=N` — a look check from lane N: WARPED, never counts)
  let steps = 0, slow = 0, warped = false, started = false, safe = false;   // (safe — a LOOK CHECK's warp only: the blackout holds still behind the kid; never in a real run)   // (started: the run's tick 0 is the FIRST touch — the page never runs the wall at a kid nobody is playing)
  /** J2 — the `k`th Blackbird runway from a lane (v2: 3–4 lanes, a jet each · v1: a band of 2 sharing one): { y0, n, period, tell, pass,
   *  trail, lanes: [{ phase, dir }] } | null */
  function runwayFrom(from = 0, k = 1) {
    for (let i = from; i < from + 2000; i++) {
      const L = course.lane(i), p = L.pulse;
      if (L.type !== 'flight' || (p.rw != null ? p.rw !== i : p.band !== i)) continue;
      if (--k > 0) continue;
      const n = p.rn || p.n, lanes = [];
      for (let j = 0; j < n; j++) { const q = course.lane(i + j).pulse; lanes.push({ phase: q.phase, dir: q.dir, v: q.v, len: q.len }); }
      return { y0: i, n, period: p.period, tell: p.tell, pass: p.pass, trail: p.trail || 0, lanes };
    }
    return null;
  }
  function restart(m = mode, s = Q.get('seed') && !seed ? Q.get('seed') : newSeed()) {
    mode = m; seed = s; course = createCourse(seed, { cv: CV }); run = createRun({ seed, mode }); log = []; queue = []; acc = 0; shown = false; overAt = 0; warped = false; started = false; safe = false;
    cues = createCues(); if (snd) { snd.onCue({ cue: 'bell-off' }); snd.onCue({ cue: 'tick-off' }); }
    end.hidden = true; mark.textContent = 'TAP TO HOP · SWIPE TO MOVE'; markUntil = 0;
    for (const t of tabs) t.classList.toggle('is-on', t.dataset.mode === mode);
    seedLine.textContent = `seed ${seed} · v${CV}${SEA_LINE}`;
    if (view.setSeason) view.setSeason(SZ0.day, SEA_SET);   // (J4 — every run starts with the season; a pack not in yet = the normal look)
    if (bot) bot = greedyBot({ seed });
    // H6B — `?lane=N` (the owner opens any area on his phone): A LOOK CHECK — the kid stands on the grass lane nearest N (the one before it first), the blackout
    // held behind him. WARPED: the run is no longer its log's — it never counts, is never replayed (the end says so), nothing is sent.
    // J2 — `?rw=N` (+ `?cv=2`): the same look check, the kid on the SAFE lane before the course's Nth Blackbird runway (v1: its Nth band)
    const RW = /^\d{1,2}$/.test(Q.get('rw') || '') ? Number(Q.get('rw')) : 0, R = RW ? runwayFrom(0, RW) : null, LANE0 = R ? R.y0 - 1 : LANE_Q;
    if (LANE0) { let y = LANE0; for (let d = 0; d < 40; d++) { if (LANE0 - d > 0 && course.lane(LANE0 - d).type === 'grass') { y = LANE0 - d; break; } if (course.lane(LANE0 + d).type === 'grass') { y = LANE0 + d; break; } } warped = true; safe = true; run.y = y; run.best = y; run.wall = (y - 5) * FP; mark.textContent = `LOOK CHECK · LANE ${y} · TAP TO HOP`; }
  }
  const findLane = (kind, from = 0) => { for (let i = from; i < from + 900; i++) { const L = course.lane(i); if (kind === 'ufo' ? L.ufo && L.ufo.y0 === i : kind === 'mark' ? !!L.mark : L.type === kind) return i; } return -1; };
  const hop = d => { if (!isOver(run) && queue.length < 2) queue.push(d); };
  wireControls(play, { onHop: hop, onAny: () => { if (isOver(run) && shown && performance.now() - overAt > 300) restart(); } });

  function tick() {
    let d = '';
    if (bot && !queue.length) { const b = bot(run, course); if (b) queue.push(b); }
    if (queue.length && canLog(log, run.t, queue[0], run.mode)) { d = queue.shift(); log.push({ t: run.t, d }); }
    const ev = [];
    if (safe && run.wall > (run.y - 5) * FP) run.wall = (run.y - 5) * FP;
    step(run, course, d, ev);
    for (const e of ev) { if (e.e === 'landmark') { arrive.show(e.lane, look); if (snd) snd.play('area-arrive'); } if (snd) snd.onEvent(e); if (snd && (e.e === 'hop' || (e.e === 'land' && e.on === 'wood'))) { if (syncs.length >= 400) syncs.shift(); syncs.push({ e: e.e, at: performance.now() }); } }
    if (snd && !isOver(run)) for (const q of cuesAt(cues, run, course)) snd.onCue(q);   // (H5A — THE WORLD's SOUNDS: cues.js)
    if (snd && isOver(run)) { snd.onCue({ cue: 'bell-off' }); snd.onCue({ cue: 'tick-off' }); }   // (H5A: the area's name as its gateway shows it — THE DOCKS · LAP 2)
    steps++;
  }
  function showEnd() {
    shown = true; overAt = performance.now();
    const live = resultOf(run);
    // (the game's own words — causes.js#runLine: the SAME table + the SAME vehicle function the night look draws by; never a generic line)
    endT.textContent = runLine(course, live, look);
    endL.textContent = live.taken ? `LANE ${live.lanes} — THE FINISH LINE` : `LANE ${live.lanes}`;
    // THE DETERMINISM CHECK: the run replayed from its seed + hop log — the SAME code the server runs
    const { used, ...r } = replay({ seed, mode, log, cv: CV });
    const same = JSON.stringify(r) === JSON.stringify(live) && used === log.length;
    check.className = `jw-check ${warped ? '' : same ? 'is-ok' : 'is-bad'}`;
    check.textContent = warped ? 'WARPED (a look check) — no replay' : same ? `REPLAY = LIVE · lane ${r.lanes} · tick ${r.tick} · ${log.length} hops`
      : `REPLAY ≠ LIVE — live lane ${live.lanes} t ${live.tick} ${live.cause} · replay lane ${r.lanes} t ${r.tick} ${r.cause} (${used}/${log.length} hops)`;
    // (J1 — YOUR SPLITS on the lab's end too: the phone's own engine — no server here, so no NEW BEST marks)
    if (endSp) { endSp.remove(); endSp = null; }
    if (!warped) lazyImport(import('./splits-card.js'), './splits-card.js').then(m => { const SC = m.splitsCard(run.sp); if (SC.el && shown && !endSp) { endSp = SC.el; end.append(SC.el); } }).catch(() => {});
    end.hidden = false;
    lab.ends.push({ seed, mode, same, live, replay: r, hops: log.length });
  }
  let raf = 0, hudKey = '', holdAt = null, fakes = null, frozen = false, endAt = 0, endSp = null;
  // HIGH RISE S4A — THE SOUND SYNC: a LIVE run holds the audio context awake (PODCAST MODE naps it between two effects — a hop's sound then
  // had to wake it first); a lease renewed once a second, let go when the run ends (audio/engine.js#holdAwake, through its hub)
  let awakeAt = 0;
  const awake = on => { const f = globalThis.__nsHoldAwake; if (f) { try { f(on, 'lab'); } catch { /* audio is polish */ } } };
  const syncs = [];
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(250, now - last) : TICK_MS;
    last = now;
    if (document.visibilityState === 'hidden' || sheetOpen) return;   // (the SOUNDS sheet holds the run still)
    const t0 = performance.now();
    if (bot && shown && now - overAt > 600) restart();   // (the measure's bot plays on)
    if (!started) { if (queue.length || bot) { started = true; mark.textContent = ''; } else acc = -dt; }
    acc += dt;
    let n = 0;
    const held = () => frozen || (holdAt != null && run.st === 'hop' && run.k >= holdAt);   // (a look check: the kid held mid-hop for a shot)
    while (acc >= TICK_MS && n < 6) { if (!isOver(run) && !held()) tick(); acc -= TICK_MS; n++; }
    if (acc > TICK_MS) { acc = 0; slow++; }   // (a long stall: the run simply waits — it never skips rules)
    // (H6A — THE BIG MOMENTS are SEEN before the end's words cover them: the abduction, the shockwave, THE MOTHERSHIP's lift — as in the game)
    if (started && !isOver(run)) { if (snd && now - awakeAt > 1000) { awakeAt = now; awake(true); } } else if (awakeAt) { awakeAt = 0; awake(false); }
    if (isOver(run) && !shown) { if (!endAt) endAt = now; if (now - endAt >= (view.holdMs ? view.holdMs(run) : 0)) showEnd(); } else if (!isOver(run)) endAt = 0;
    // (a measure only — lab.ghosts(n): n see-through kids hop beside him, each a copy of his own run a column over: an 8-KID scene)
    if (fakes) for (let k = 0; k < fakes.length; k++) { if (fakes[k].still) continue; const dx = ((k + 1) % 2 ? 1 : -1) * Math.ceil((k + 1) / 2) * FP, r = fakes[k].run; Object.assign(r, run); r.x = Math.max(FP / 2, Math.min(8.5 * FP, run.x + dx)); r.fx = run.fx + (r.x - run.x); r.tx = run.tx + (r.x - run.x); }
    view.draw(run, course, isOver(run) || held() ? 0 : acc / TICK_MS, dt, fakes ? { ghosts: fakes } : null);
    tiers.sample(now, performance.now() - t0); if (pin == null && !GRAY) tiers.tick(now);
    const M = MODES[mode];
    const key = `${run.best}|${M.cap ? Math.ceil((M.cap - run.t) / TICK_HZ) : ''}`;
    if (key !== hudKey) {
      if (lanes.dataset.num !== String(run.best)) { setNum(lanes, run.best); lanes.classList.remove('is-pop'); void lanes.offsetWidth; lanes.classList.add('is-pop'); }
      hudKey = key;
      // (H6B — ONE COUNTDOWN: the big red one (flyers.js) is THE MOTHERSHIP's; this line is the mode's quiet clock, gone for the warning)
      sub.textContent = M.cap ? (M.cap - run.t > 10 * TICK_HZ ? `${mode.toUpperCase()} · ${clock(M.cap - run.t)}` : '') : 'ENDLESS';
    }
    if (markUntil && now > markUntil) { mark.textContent = ''; markUntil = 0; }
    if (frames.length < 20000) { frames.push(dt); cost.push(performance.now() - t0); }
    if (fps && frames.length % 30 === 0) { const l = frames.slice(-120), avg = l.reduce((a, b) => a + b, 0) / l.length, i = view.info(); fps.textContent = `${(1000 / avg).toFixed(0)} fps · ${avg.toFixed(1)} ms · worst ${Math.max(...l).toFixed(0)} · ${i.calls} calls · ${i.tris} tris · ${i.w}×${i.h} @${i.dpr}${i.tier == null ? '' : ` · tier ${tierPath.join('→')}`} · tick ${run.t}`; }
  }
  document.addEventListener('visibilitychange', () => { last = 0; acc = 0; if (document.visibilityState === 'hidden' && awakeAt) { awakeAt = 0; awake(false); } });
  restart();
  raf = requestAnimationFrame(frame);

  // (the pass's own checks — tests/integration/jaywalk-lab.mjs: the bot plays through the same input path, the frame times, the camera)
  const lab = window.__jwLab = {
    ends: [], view,
    state: () => ({ mode, seed, t: run.t, st: run.st, y: run.y, x: run.x / FP, best: run.best, cause: run.cause, line: endT.textContent, hitBy: run.cause === 'car' ? hitVehicle(course, { y: run.y, x: run.x, end: run.end }) : '', wall: run.wall / FP, hops: log.length, asked: log.length + queue.length, over: isOver(run), shown, started, steps, slow, kidY: view.kidScreenY(), kidX: view.kidScreenX(), kidPx: view.kidHeightPx ? view.kidHeightPx() : 0, zoom, angle, gray: GRAY, tier: tiers.get(), tierPath: tierPath.slice(), capped: tiers.capped(), info: view.info() }),
    bot(on) { bot = on ? greedyBot({ seed }) : null; },
    restart: (m, s) => restart(m || mode, s),
    setCamera, setLook: pickLook, look: () => look, setTier: t => tiers.set(t), ready: view.ready || Promise.resolve(true),
    /** (the framing's checks) a ground point (column cells, lane) → [x, y] on the screen, 0 … 1 from the top left */
    project: (cells, lane) => view.project(cells, lane),
    lane: i => { const L = course.lane(i); return { type: L.type, dir: L.dir || (L.pulse && L.pulse.dir) || 0, mark: L.mark || '' }; },
    hop, syncs: () => syncs.slice(),
    frames: () => frames.slice(),
    cost: () => cost.slice(),
    clearFrames() { frames.length = 0; cost.length = 0; },
    stop() { cancelAnimationFrame(raf); view.destroy(); },
    // (the look checks only: put the kid on a lane far up the course — the run is then no longer its log's, the end screen says WARPED)
    warp(lane, o = {}) { warped = true; safe = o.safe !== false; run.y = lane; run.best = Math.max(run.best, lane); run.x = o.x == null ? 4.5 * FP : o.x; run.st = 'idle'; run.buf = ''; run.wall = (lane - 5) * FP; queue = []; started = true; mark.textContent = ''; },
    /** (a look check) the middle of a log on this water lane that is well inside the 9 columns right now (FP; −1 = none) */
    logAt(lane) { const L = course.lane(lane); if (L.type !== 'water') return -1; for (const it of L.items) { const l = moverLeft(L, it, run.t); if (l > 1500 && l + it.len < 7500) return l + it.len / 2; } return -1; },
    /** (a look check) a road / water lane's movers right now, in cells: [{ left, len }] + the lane's dir + v */
    items(lane) { const L = course.lane(lane); return { dir: L.dir || 0, v: L.v || 0, items: (L.items || []).map((it, j) => ({ left: moverLeft(L, it, run.t) / FP, len: it.len / FP, what: L.type === 'road' ? vehicleAt(course, lane, j) : 'log' })) }; },
    find: findLane, lane0: () => LANE_Q, warped: () => warped,
    /** (THE TOUCH-UP PASS's check) the run + its course as they are — the share frame's moment (shot.js#shotMs) reads both */
    raw: () => ({ run: { ...run }, course }),
    pulse(lane) { const L = course.lane(lane); return L.pulse ? pulseAt(L.pulse, run.t) : null; },
    /** (H6A's look checks) the run's tick put somewhere (WARPED) · the world held still (the scene still draws) · a UFO's ring right now ·
     *  the first flight band from a lane: { lane, period, phase, tell, pass, dir } */
    setT(t) { warped = true; run.t = Math.max(0, Math.floor(t)); },
    freeze(on) { frozen = !!on; },
    ufoAt(lane) { const U = course.lane(lane).ufo; return U ? { x: ufoX(U, run.t), y: ufoY(U, run.t) / FP, id: U.id, y0: U.y0 } : null; },
    runway: (from = 0, k = 1) => runwayFrom(from, k),
    cv: () => CV,
    flight(from = 0) { for (let i = from; i < from + 900; i++) { const L = course.lane(i); if (L.type === 'flight' && L.pulse.band === i) return { lane: i, period: L.pulse.period, phase: L.pulse.phase, tell: L.pulse.tell, pass: L.pulse.pass, dir: L.pulse.dir }; } return null; },
    /** (a look check) hold the kid still the moment a hop is `k` ticks in (null = let go) — the world stops with him */
    hold(k) { holdAt = k; },
    gate: gateName, arrive: () => arrive.text(), arriveAt: (l, lk) => arrive.show(l, lk || look),
    /** (a look check — H5B's add-on) ghosts standing at these offsets from the kid: [[columns, lanes], …] (null = none) */
    ghostsAt(offs) { fakes = offs && offs.length ? offs.map(([dx, dy], k) => ({ still: true, run: { ...run, x: run.x + dx * FP, y: run.y + dy, st: 'idle' }, hex: [0x22e0ff, 0xffe04a, 0x7dffb0, 0xff7a4a, 0xa05bff, 0xff5a7a, 0x4d7dff, 0xffffff][k % 8] })) : null; },
    /** (a measure) n ghosts beside the kid — the night look's instanced, skinned kids: 7 = an 8-kid match's scene (0 = none) */
    ghosts(n) { fakes = n > 0 ? Array.from({ length: Math.min(8, n) }, (_, k) => ({ run: { ...run }, hex: [0x22e0ff, 0xffe04a, 0x7dffb0, 0xff7a4a, 0xa05bff, 0xff5a7a, 0x4d7dff, 0xffffff][k] })) : null; },
  };
}

async function boot() {
  try { await mount(); }
  catch (e) { cantOpen(`Can’t open the lab: ${(e && e.message) || e}`); }
}
boot();
