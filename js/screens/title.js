// NEON SPEAKEASY — the front door.
//
// THE HARBOR (City 2.0 — harbor/scene.js; the ONLY city since CITY 1.0 OUT, Nov 5) behind a neon sign and a short menu. The opening sequence:
//   1. TAP TO ENTER (first visit on this device): the city in near-darkness, a few dim lights.
//      The tap unlocks audio (iPhone needs a gesture) — the menu music fades in from it.
//   2. POWER-ON: windows light up in a sweep from the street up, billboards boot, the haze takes the colour.
//   3. The sign powers on like real neon: a flicker per letter with a hum and crackle, then a steady glow,
//      its light shimmering on the wet street.
//   4. The menu eases in.  The full sequence (≈ 3.4 s) plays on every visit — the TAP TO ENTER gate only on a
//      device's first visit; stepping back from the name / profile screen gets a quick ≈ 1.2 s re-light. Any tap skips. Reduced effects / prefers-reduced-motion: simple fades.
// The dock — THE NEON RING: one floating glass bar, JOIN · BOARD · [HOST] · GAMES · YOU. HOST is a raised neon ring in
// the sign's colours (always lit); JOIN opens a glass panel with four hush-word boxes (paste, auto-join on the 4th letter, ?room=
// pre-fills); REJOIN floats above the bar when a saved room couldn't be reached; YOU opens the membership card.
// Test hook: window.__district.
import { openSheet } from '../ui/sheet.js';
import { wordNeonChars, wordNeonDefs } from '../ui/word-neon.js';
import { h, reducedMotion } from '../ui/dom.js';
import { levelLabel } from '../core/levels.js';
import { avatar } from '../ui/components.js';
import { gameArt, gameArtSvg } from '../ui/game-art.js';
import { logoSvg, logoGlowSvg, logoRaceSvg, logoTrack, anchorsSvg, TAGLINE } from '../ui/logo.js';
import { openHelp } from '../ui/help.js';
import { toast } from '../ui/toast.js';
import { APP_NAME, GAMES, MIN_PLAYERS, MAX_PLAYERS, colorHex } from '../config.js';
import { setState } from '../store.js';
import { slot, loadProfile, useEmulator, loadMe } from '../identity.js';
import { rankBadge, emblem, RANK_COLORS } from '../ui/emblems.js';
import { primaryBoard, fmtValue } from '../core/boards.js';
import { createRoom, joinRoom } from '../room.js';
import { firebaseReady } from '../firebase.js';
import { settings } from '../audio/settings.js';
import { sfx } from '../audio/sfx.js';
import { neonPowerOn, neonTick, neonFlicker, neonTwitch, NEON_GAINS, neonDropout, neonCatch, neonHumFade, neonRaceCrackle, neonPreload, cityPowerOn, fireworkBurst, knock } from '../audio/ambience.js';
import { beatSource, beatKick, beatWhy, beatCal, beatReport, songInfo, syncLine, clockLine } from '../audio/beat.js';
import { partyMusicDebug, partyNow } from '../audio/party-music.js';
// (NIGHT-C: the song's clock = the party's synced song when it sounds — its own buffer voice — else this phone's song element)
// (SKY-B: a station's song with the music OFF / muted is silence to the sign — the music back on is a start again, the surge answers it)
const songClock = () => { const p = partyNow(); return p && !settings.musicOff && !settings.muted && settings.music > 0 ? p.at : musicClock(); };
import { beatMode } from '../core/harbor-beat.js';
import { moodNow, fixedMoodFrom, MOOD_LABEL } from '../audio/mood.js';
import { cityClock } from '../core/city.js';
import { tiredLetters, tiredForced } from '../core/harbor-show.js';
import { isUnlocked } from '../audio/engine.js';
import { musicClock } from '../audio/music.js';
import { captureBackdrop } from './backdrop.js';
import { neonPlan, neonState, neonNext, firstTapAnswer, createStartDetector } from '../core/neon-ramp.js';
import { createDock, createDockWork, dressCorners, ICON } from './title-dock.js';
import { createTaps } from './title-taps.js';
import { createNeon } from './title-neon.js';
import { onScreenWait } from '../ui/onscreen.js';
import { lazyImport } from '../ui/lazy-import.js';
// CITY 2.0 — THE HARBOR (docs/harbor.md): THE city (CITY 1.0 OUT, Nov 5 — City 1.0 deleted; an old `?city=1` / `?city=2` link lands here).
// No top-level await (iOS 14 can't parse one — the whole app would die, every game too): app.js holds the title on the boot screen until
// harborReady settles. A failed load is tried 3 times (LOAD FIX 3), then the boot watchdog's one reload; after that → the title shows THE CITY COULDN'T LOAD + RELOAD
// (cityDown — it was City 1.0 until CITY 1.0 OUT). A unit test keeps await out of module tops.
let createHarbor = null, harborSettled = false;
let visitAnswered = false;   // (ATM-A: the sign has answered a song this visit — the first-tap detector is FRESH until then)
const loadHarbor = () => import('./harbor/scene.js').then(m => { createHarbor = m.createHarbor; if (window.__boot) window.__boot.stage('the city’s module in'); });   // (LOAD FIX 3: the watchdog's stage)
// (LOAD FIX 3 — THE BOOT SAFETY NET: three tries (1.5 s, then 3 s apart — the browser asks again only for the files that failed), then
//  index.html's watchdog's ONE reload; THE CITY COULDN'T LOAD only once that reload was used — a flaky line used to end a load here)
// (LOAD FIX 4 — Grok's boot audit #7: a LINK / parse error (a SyntaxError — two deploys' files met in the city's graph) is CACHED in the
//  module map, so every retry failed the same and only cost 4.5 s, then the plain reload kept WebKit's cached copy. Now it is SKEW at once:
//  no retries → the watchdog's skew path (the boot's files asked for afresh, then the ONE reload). A network failure keeps the 3 tries.)
const linkError = e => !!e && (e.name === 'SyntaxError' || /does not provide an export|Importing binding name|ambiguous indirect export/i.test(String(e.message || '')));
const tryHarbor = n => loadHarbor().catch(e => { console.warn(`harbor (try ${n})`, e); if (n >= 3 || linkError(e)) throw e; return new Promise(r => setTimeout(r, 1500 * n)).then(() => tryHarbor(n + 1)); });
export const harborReady = tryHarbor(1)
  .catch(e => {
    console.warn('harbor (gave up)', e);
    const skew = linkError(e);
    if (typeof window !== 'undefined' && window.__boot && window.__boot.reload && window.__boot.reload(skew ? `a module of the city failed to link (two deploys’ files?) — ${e && e.message}` : 'the city’s module failed 3 times', { skew })) return new Promise(() => {});
  })
  .finally(() => { harborSettled = true; });
export const harborPending = () => !harborSettled;
// THE LOAD FIX (Nov 6 — the owner's "pops in in chunks" + "a whole different screen flashes"): the boot screen (index.html #boot) stays over
// the title until THE CITY's reveal — app.js#dismissBoot waits on cityShown() — so the lit sign, the dock + the corners never stand over
// the black canvas first (THE DARK TITLE); under it the city reveals at once (no fade of its own), and the boot screen's fade is the ONE
// fade: the boot screen → the whole title + its city. A title with no city (THE CITY COULDN'T LOAD) or one going away lets it go too.
let cityIn = false;
const cityWaits = [];
const cityDone = () => { cityIn = true; while (cityWaits.length) cityWaits.shift()(); };
export const cityShown = () => (cityIn ? Promise.resolve() : new Promise(r => cityWaits.push(r)));
/** the boot screen still covering the page (not yet fading) */
const bootCovers = () => { const b = typeof document !== 'undefined' && document.getElementById('boot'); return !!b && !b.classList.contains('out'); };
/** CITY 2.0 MUSIC: the &debug=1 readout's lines — the mood, the song, whether its beat grid can be trusted; + what the beat subtracts to
 *  land on the sound as heard (M2: the output latency, the song element's measured lead) */
function musicLine() {
  const i = songInfo(), fx = fixedMoodFrom();
  // (the mood + the party show read the SAME clock — the Harbor's, the preview's &when= included; a mood that doesn't follow it is
  // a CHOICE, and the line says whose: `music DAY (setting)` / `(panel)` — then the party may pulse to a non-party song, by design)
  const m = `music ${MOOD_LABEL[moodNow()]}${fx ? ` (${fx.from})` : ''}${i ? ` · ${i.id}${i.bpm ? ` ${i.bpm.toFixed(1)}` : ''} · grid ${i.grid}${i.lock != null ? ` (lock ${i.lock})` : ''}` : ' · no song'}`;
  const p = partyLine();
  return i ? [m, syncLine(), clockLine(), ...(p ? [p] : [])] : p ? [m, p] : [m];
}
/** NIGHT-C — THE PARTY SONG IN SYNC (audio/party-music.js): `party NIGHT · c2-party4 1:23 / 4:53 · SYNCED (server clock) · next in 3:30 ·
 *  break CONGA` — the timeline's song + where it is, who plays it here (SYNCED = the synced player, sample-accurate on the server clock;
 *  riding = this phone's own player, on the timeline within 0.12 s; own player = not in sync yet — decoding, a locked context, the
 *  direct path, a legendary's hold) */
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function partyLine() {
  let d = null; try { d = partyMusicDebug(); } catch { d = null; }
  if (!d || !d.song) return null;
  // (SKY-B — RADIO STATIONS: `station EVENING · c2-eve3 1:23 / 4:53 · SYNCED (server clock) · next in 3:30`)
  const cc = cityClock(), b = cc && cc.streetParty ? cc.streetParty() : null, brk = b && b.brk && b.k > 0 ? b.brk : null;
  const who = d.synced ? 'SYNCED (server clock)' : d.riding ? 'riding (own player, on the clock)' : settings.musicOff || settings.muted ? 'music off — the clock runs' : 'own player (not synced yet)';
  // (MODELS — TWO DEVICES IN STEP: what this browser reports of its output delay (out / base ms, ts = getOutputTimestamp — the synced player
  // schedules by it) + the SPEAKER DELAY set here (a TV / soundbar's own) — compare two devices' lines: `lat out 12 base 5 ts · spk 150`)
  const lat = d.lat ? ` · lat out ${d.lat.out} base ${d.lat.base}${d.lat.ts ? ' ts' : ''}${d.speaker ? ` · spk ${d.speaker}` : ''}` : '';
  return `${d.kind === 'station' ? `station ${String(d.station || '').toUpperCase()}` : `party ${String(d.kind).toUpperCase()}`} · ${d.song} ${mmss(d.at)} / ${mmss(d.dur)} · ${who}${lat} · next in ${mmss(Math.max(0, d.left))}${brk ? ` · break ${String(brk.kind).toUpperCase()}${brk.song === d.song ? ' (this song)' : ''}` : ''}`;
}

const ACC = { rum: '#f0c75e', stakes: '#f2c869', overclock: '#ffb627', gridlock: '#7fb2ff', slip: '#ffc46b', prism: '#d6f0ff', golf: '#2ff5d2', agent: '#e6e9ef', pulse: '#a374ff', cipher: '#3dff8b', signal: '#ff4466', bluff: '#efe6d2', holdem: '#f2c14e' };
const SEEN = 'nd:entered';      // localStorage: this device has been through the door before
const BACK = 'nd:back';          // sessionStorage: just stepped back from the name / profile screen (a quick re-light)
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
// 11a-2 — the power-on's sound per kind (s): the strike cut to `strike`, the hum up over `up`, held `hold`, faded over `fade`;
// the crackle's ticks across `crackle` (the race's run); `cool` ms between two taps' strikes. A tap ≤ 1.5 s in all.
const NEON_SOUND = { tap: { strike: 1.2, up: 0.3, hold: 0.35, fade: 1.1, crackle: 0.9, ticks: 4 }, catch: { strike: 2.14, up: 0.6, hold: 0.9, fade: 2.2, crackle: 1.4, ticks: 6 }, cool: 350 };
const neonSoundLog = [];
const NEON_TAP_LEVEL = 0.75 * 0.75;   // City 2.0: tapping a NEON letter — its dropout / power-on (PART 8a: ~25 % quieter than 0.75)
let surgeAt = -1e9;             // THE MUSIC STARTING (City 2.0, FP3a): when the sign last really answered it (module-wide: the 10 s cooldown spans re-mounts)
const store = (s, k, v) => { try { if (v === undefined) return s.getItem(k); s.setItem(k, v); } catch { /* private mode */ } return null; };
// 9g — THE DOCK FADE (the owner, DECIDED Oct 28): 10 s on a device's FIRST visit (a newcomer still reading the screen + finding HOST /
// JOIN), 5 s on every visit after. "First" = this page load began before the device ever went through the door (SEEN) — read ONCE per
// page load, so the title made again later in the same visit (back from a room) keeps the first visit's 10 s
let firstVisit = null;
const isFirstVisit = () => (firstVisit == null ? (firstVisit = !store(localStorage, SEEN)) : firstVisit);
export const IDLE_FIRST_MS = 10000, IDLE_MS_AFTER = 5000;

// the sequences (seconds from the start). wave = window lights climbing, lit = the city's glow, bill = billboards,
// logo = when the sign starts, steady = when it holds, menu = when the menu starts easing in
const FULL = { wave: [0.04, 1.6], lit: [0.04, 1.8], bill: [1.0, 1.8], logo: 1.4, steady: 2.2, menu: 2.25, end: 3.4 };
const SHORT = { wave: [0, 0.6], lit: [0, 0.7], bill: [0.25, 0.65], logo: 0.15, steady: 0.55, menu: 0.45, end: 1.2 };
const INSTANT = { wave: [0, 0.01], lit: [0, 0.01], bill: [0, 0.01], logo: 0, steady: 0, menu: 0, end: 0.4 };
const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a || 1e-6))); return t * t * (3 - 2 * t); };
// the light wave answers the tap at once and slows as it reaches the rooftops
const easeOut = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a || 1e-6))); return 1 - Math.pow(1 - t, 2.4); };

// Christmas: a velvet Santa hat slung over the first N, its tip flopping over the side; folds in the velvet, a fluffy
// fur brim and pom-pom built from soft tufts, the pink neon catching its edge, snow resting in the creases
function santaHat() {
  // fur tufts along the brim and around the pom-pom (deterministic)
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const tufts = [];
  for (let i = 0; i <= 26; i++) {
    const u = i / 26, x = 10 + u * 104, y = 98 - Math.sin(u * Math.PI) * 9 + (rnd() - 0.5) * 2;
    for (const dy of [-6, 0, 6]) tufts.push([x + (rnd() - 0.5) * 3, y + dy + (rnd() - 0.5) * 3, 5.2 + rnd() * 2.6]);
  }
  for (let i = 0; i < 22; i++) { const a = rnd() * Math.PI * 2, d = rnd() * 8; tufts.push([150 + Math.cos(a) * d, 80 + Math.sin(a) * d, 4.6 + rnd() * 2.8]); }
  const fur = tufts.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`).join('');
  const hi = tufts.filter((_, i) => i % 3 === 0).map(([x, y, r]) => `<circle cx="${(x - r * 0.3).toFixed(1)}" cy="${(y - r * 0.35).toFixed(1)}" r="${(r * 0.45).toFixed(1)}"/>`).join('');
  return `<svg viewBox="0 0 170 128" aria-hidden="true"><defs>
<linearGradient id="nh-v" x1="0.1" y1="0.1" x2="0.8" y2="1"><stop offset="0" stop-color="#e2253f"/><stop offset="0.45" stop-color="#b0102c"/><stop offset="1" stop-color="#5e0614"/></linearGradient>
<linearGradient id="nh-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#eef0f6"/><stop offset="1" stop-color="#b9bfd2"/></linearGradient>
<radialGradient id="nh-p" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e8ebf3"/><stop offset="1" stop-color="#aeb5ca"/></radialGradient>
<filter id="nh-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.6"/></filter>
<filter id="nh-rim" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
<g transform="translate(0 0)">
<!-- the crown: a slouched cone, the tip flopping over to the right -->
<path d="M14 98 C18 56 46 20 88 14 C118 10 146 30 152 64 C153 70 148 74 144 70 C138 54 126 44 118 54 C113 64 114 84 116 98 Z" fill="url(#nh-v)"/>
<!-- the underside of the flop, in shadow -->
<path d="M118 54 C126 44 138 54 144 70 C134 60 124 56 118 62 Z" fill="#6a0618" opacity="0.5"/>
<!-- folds and the velvet's sheen -->
<path d="M64 22 C58 46 60 74 66 96" stroke="#4a0410" stroke-width="8" opacity="0.3" fill="none" filter="url(#nh-rim)"/>
<path d="M36 72 C44 46 62 28 92 20" stroke="#ff8a9a" stroke-width="3.4" opacity="0.4" fill="none" filter="url(#nh-rim)"/>
<path d="M104 18 C124 20 140 34 146 52" stroke="#ff9aa8" stroke-width="2.4" opacity="0.35" fill="none" filter="url(#nh-rim)"/>
<!-- the sign's light on the left edge -->
<path d="M14 98 C18 56 46 20 88 14" stroke="#ff4fb0" stroke-width="3" opacity="0.7" fill="none" filter="url(#nh-rim)"/>
<!-- the fur brim and the pom-pom -->
<g fill="url(#nh-f)" filter="url(#nh-soft)">${fur}</g>
<g fill="#ffffff" opacity="0.55" filter="url(#nh-soft)">${hi}</g>
<circle cx="150" cy="80" r="9" fill="url(#nh-p)" opacity="0.9" filter="url(#nh-soft)"/>
<path d="M10 100 C40 112 84 114 116 100" stroke="#ff4fb0" stroke-width="2.4" opacity="0.45" fill="none" filter="url(#nh-rim)"/>
</g></svg>`;
}
const HAT = santaHat();

// Halloween / St. Patrick's: the O of NEON becomes a neon jack-o'-lantern / a four-leaf clover, bent in the same glass tube
// as the letters (glass, two glows, body, white-hot core, highlight, electrode caps), so it powers on, flickers and takes the
// holiday colours like them. Drawn in the O's own box (0..64 × 0..100). Parts: [d, width, colour-vars | null]
const O_ALT = {
  halloween: [
    // (ATM-D — THE PUMPKIN AT THE O's FULL SIZE, the owner Oct 31 1:09 pm: it looked SHRUNK inside the word — the old body, scaled ×1.24 about
    // its foot, spanned only y 9.5 → 97 (88 % of the letters' height) and its round shoulders read smaller still. Drawn natively in the O's box
    // now, no transform: the body from the cap height to the baseline (a round shape overshoots a hair, like a typeface's O), the O's full
    // width, the letters' own tube (9); only the stem + vine rise above the word)
    ['M32 10 C26 0 14 -1 7 8 C1 16 -2.5 33 -2.5 52 C-2.5 72 1 86 8 93 C14 100 24 101 32 97 C40 101 50 100 56 93 C63 86 66.5 72 66.5 52 C66.5 33 63 16 57 8 C50 -1 38 0 32 10', 9, null],
    ['M22 4 C11 22 10 78 23 98 M42 4 C53 22 54 78 41 98', 4, null],
    // the carved face: triangle eyes, a nose, a toothy grin (the old face, kept in proportion to the taller body)
    ['M10.4 40.7 L20 27.7 L27.2 43.3 Z M53.6 40.7 L44 27.7 L36.8 43.3 Z', 4.5, '--g:#ffcf4a;--b:#ffe07a;--c:#fffbe8'],
    ['M29.6 55 L32 48.5 L34.4 55 Z', 3.7, '--g:#ffcf4a;--b:#ffe07a;--c:#fffbe8'],
    ['M9.2 62.8 Q32 86.2 54.8 62.8 L50 71.9 L44 65.4 L38 74.5 L32 66.7 L26 74.5 L20 65.4 L14 71.9 Z', 4.2, '--g:#ffcf4a;--b:#ffe07a;--c:#fffbe8'],
    // the stem and a curling vine (above the letters, as before)
    ['M31 9 C29.5 0.8 33.2 -9 40.7 -14 M34.5 -1.7 C41.9 2 50.6 -1.7 54.3 -10 C56.8 -15 53 -19 49.4 -16.6', 5.2, '--g:#3ddc6a;--b:#7dff9c;--c:#efffe9'],
  ],
  stpatrick: [
    // four heart-shaped leaves round the centre, a slender stem
    ...[45, 135, 225, 315].map(a => [`M32 54 C27 47 15 44 15 34 C15 26 25 24 29 31 C30 33 31 34 32 36 C33 34 34 33 35 31 C39 24 49 26 49 34 C49 44 37 47 32 54`, 5.2, null, `translate(32 46) scale(1.72) translate(-32 -54) rotate(${a} 32 54)`]),
    ['M32 50 C36 66 33 84 22 100', 5.4, null],
  ],
};
function swapO(svg, kind) {
  const g = svg && svg.querySelector('.ndl-3');
  if (!g) return;
  if (!g.dataset.orig) g.dataset.orig = g.innerHTML;
  if (!kind) { if (g.dataset.kind) { g.innerHTML = g.dataset.orig; delete g.dataset.kind; } return; }
  if (g.dataset.kind === kind) return;
  const filt = (g.querySelector('.ndl-glow1') || {}).getAttribute ? g.querySelector('.ndl-glow1').getAttribute('filter') : '';
  const filt2 = g.querySelector('.ndl-glow2') ? g.querySelector('.ndl-glow2').getAttribute('filter') : '';
  const parts = O_ALT[kind];
  const paths = (cls, extra) => parts.map(([d, w, vars, tf]) => `<path class="${cls}" d="${d}" ${tf ? `transform="${tf}"` : ''} ${vars ? `style="${vars}"` : ''} stroke-width="${extra(w)}"/>`).join('');
  const tube = (cls, extra) => cls.includes('glow') ? `<g filter="${cls.includes('glow1') ? filt : filt2}"><rect x="-30" y="-30" width="124" height="160" fill="none" stroke="none"/>${paths(cls, extra)}</g>` : paths(cls, extra);
  g.innerHTML = `<g class="ndl-glass-g">${parts.map(([d, w, v, tf]) => `<path class="ndl-glass" d="${d}" ${tf ? `transform="${tf}"` : ''} stroke="#40243a" stroke-width="${w + 2}"/>`).join('')}</g>
<g class="ndl-light">${tube('ndl-glow2', w => w + 12)}${tube('ndl-glow1', w => w + 3.5)}${tube('ndl-body', w => w)}${tube('ndl-core', w => w * 0.36)}
${parts.map(([d, w, v, tf]) => `<path class="ndl-hi" d="${d}" ${tf ? `transform="${tf}"` : ''} stroke="#ffffff" stroke-width="0.6" opacity="0.3"/>`).join('')}</g>`;
  // inline colour vars on the parts that need them (eyes, stem): set on the <path>s, which read var(--g/--b/--c)
  g.querySelectorAll('path[style]').forEach(p => { p.style.cssText = p.getAttribute('style'); });
  g.dataset.kind = kind;
}


// Christmas: a string of glass C9 bulbs wound round the sign's own tubes. The wire spirals along each letter's tube path
// (traced from the live SVG), passing in front of the glass and behind it; at every turn a bulb hangs off the side of the
// tube, drooping a little under its weight; between letters the wire sags in a swag with a few bulbs. k: how many are lit.
// (PERF-A — FR5 #8: the trace walked every letter's tube with getPointAtLength every 1.4 units at mount — 1.2 s at 4× on every December
//  load, both cities. The traced wire (its paths + its bulbs' places) depends only on the letters, so it is kept per letter set: in memory
//  + this device's localStorage — the first December load traces, every later one only draws. k (how many are lit) stays live.)
const XWIRE_V = 1, xwireMem = new Map();
function xmasWire(svg) {
  const parts = [svg.getAttribute('viewBox') || ''];
  for (const g of svg.querySelectorAll('.ndl')) { const p = g.querySelector('.ndl-body'); parts.push((g.getAttribute('transform') || '') + '|' + (p ? p.getAttribute('d') || '' : '')); }
  let hsh = 2166136261; const str = parts.join('#'); for (let i = 0; i < str.length; i++) { hsh ^= str.charCodeAt(i); hsh = Math.imul(hsh, 16777619); }
  const key = `nd:xwire:${XWIRE_V}:${(hsh >>> 0).toString(36)}:${str.length}`;
  if (xwireMem.has(key)) return xwireMem.get(key);
  let w = null;
  try { const j = localStorage.getItem(key); if (j) w = JSON.parse(j); } catch { w = null; }
  if (!w || !w.bulbs) {
    w = traceXmasWire(svg);
    try { for (let i = localStorage.length - 1; i >= 0; i--) { const k2 = localStorage.key(i); if (k2 && k2.startsWith('nd:xwire:') && k2 !== key) localStorage.removeItem(k2); } localStorage.setItem(key, JSON.stringify(w)); } catch { /* full / blocked: traced again next load */ }
  }
  xwireMem.set(key, w);
  return w;
}
function xmasWrapSvg(svg, k) {
  const vb = svg.getAttribute('viewBox');
  const COLS = ['#ff3b4e', '#2fe07a', '#ffc94a', '#4ea3ff', '#fff1d6'];
  const { back, front, swags, bulbs } = xmasWire(svg);
  return xmasWireSvg(vb, COLS, back, front, swags, bulbs, k);
}
/** the wire traced along the live SVG's tubes → { back, front, swags (each a path's d), bulbs: [{ x, y, ang }] } */
function traceXmasWire(svg) {
  const P = 23, A = 8.2, R = 5.4;             // turn length, wire swing (tube radius 4.5 + a little), what the glass hides
  const back = [], front = [], bulbs = [];
  const ends = [];
  let bi = 0;
  for (const g of svg.querySelectorAll('.ndl')) {
    const tx = +((g.getAttribute('transform') || '').match(/translate\(([-\d.]+)/) || [0, 0])[1];
    const path = g.querySelector('.ndl-body');
    if (!path) continue;
    const len = path.getTotalLength();
    const pt = d => { const q = path.getPointAtLength(Math.max(0, Math.min(len, d))); return [q.x + tx, q.y]; };
    let segF = [], segB = [], prev = null, first = null, last = null;
    const flush = () => { if (segF.length > 1) front.push(segF); if (segB.length > 1) back.push(segB); segF = []; segB = []; };
    for (let d = 0; d <= len; d += 1.4) {
      const p = pt(d), a = pt(d - 1), b = pt(d + 1);
      if (prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 4) flush();          // a jump between the tube's strokes
      prev = p;
      let tX = b[0] - a[0], tY = b[1] - a[1]; const tl = Math.hypot(tX, tY) || 1; tX /= tl; tY /= tl;
      const nX = -tY, nY = tX;
      const ph = (d / P) * Math.PI * 2, off = A * Math.sin(ph), z = Math.cos(ph);
      const w = [p[0] + nX * off, p[1] + nY * off];
      if (!first) first = w; last = w;
      if (z >= 0) { if (segB.length > 1) back.push(segB); segB = []; segF.push(w); }
      else { if (segF.length > 1) front.push(segF); segF = []; if (Math.abs(off) > R) segB.push(w); else { if (segB.length > 1) back.push(segB); segB = []; } }
      // a bulb at each turn, hanging off the side the wire is on (alternating), drooping under its weight
      const turn = (d / P) % 1, prevTurn = ((d - 1.4) / P) % 1;
      if (d > 4 && d < len - 4 && ((turn >= 0.25 && prevTurn < 0.25) || (turn >= 0.75 && prevTurn < 0.75))) {
        const side = turn < 0.5 ? 1 : -1;
        let vx = nX * side * 0.65, vy = nY * side * 0.65 + 0.55; const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
        if ((bi++) % 2 === 0) bulbs.push({ x: w[0], y: w[1], ang: Math.atan2(vy, vx) * 180 / Math.PI - 90 });
      }
    }
    flush();
    ends.push({ first, last });
  }
  // swags between the letters: from the bottom of one to the bottom of the next
  const swags = [];
  const bottoms = [...svg.querySelectorAll('.ndl')].map(g => +((g.getAttribute('transform') || '').match(/translate\(([-\d.]+)/) || [0, 0])[1]);
  for (let i = 0; i < bottoms.length - 1; i++) {
    const x0 = bottoms[i] + 60, x1 = bottoms[i + 1] + 4, y = 102, sag = 13;
    const pts = []; for (let j = 0; j <= 16; j++) { const t = j / 16; pts.push([x0 + (x1 - x0) * t, y + Math.sin(Math.PI * t) * sag]); }
    swags.push(pts);
    for (const t of [0.3, 0.7]) bulbs.push({ x: x0 + (x1 - x0) * t, y: y + Math.sin(Math.PI * t) * sag, ang: 0 });
  }
  const d = segs => segs.map(sg => 'M' + sg.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')).join(' ');
  return { back: d(back), front: d(front), swags: d(swags), bulbs: bulbs.map(b => ({ x: +b.x.toFixed(3), y: +b.y.toFixed(3), ang: +b.ang.toFixed(3) })) };
}
function xmasWireSvg(vb, COLS, back, front, swags, bulbs, k) {
  const order = bulbs.map((_, i) => ((i * 7919 + 13) % 97) / 97);
  const defs = COLS.map((hot, i) => `<radialGradient id="ndw-b${i}" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff"/><stop offset="0.3" stop-color="${hot}"/><stop offset="1" stop-color="${hot}" stop-opacity="0.88"/></radialGradient>
<radialGradient id="ndw-g${i}"><stop offset="0" stop-color="${hot}" stop-opacity="0.6"/><stop offset="0.45" stop-color="${hot}" stop-opacity="0.16"/><stop offset="1" stop-color="${hot}" stop-opacity="0"/></radialGradient>
<linearGradient id="ndw-d${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hot}" stop-opacity="0.55"/><stop offset="1" stop-color="#0b0710" stop-opacity="0.9"/></linearGradient>`).join('');
  const bulbSvg = bulbs.map((b, i) => {
    const c = i % COLS.length, on = order[i] < k;
    const tw = on && i % 6 === 3 ? ` class="nd-xb-tw" style="animation-delay:${(-((i * 1.37) % 4)).toFixed(2)}s"` : '';
    return `<g transform="translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.ang.toFixed(0)}) scale(0.9)">${on ? `<circle cx="0" cy="8" r="12" fill="url(#ndw-g${c})"${tw}/>` : ''}
<rect x="-1.8" y="-0.4" width="3.6" height="3.8" rx="0.7" fill="#1a3a22"/><rect x="-1.8" y="1.2" width="3.6" height="0.6" fill="#0c1f12"/>
<path d="M-2.3 3.3 C-3.7 6 -3.3 9.6 0 11.8 C3.3 9.6 3.7 6 2.3 3.3 Z" fill="url(#ndw-${on ? 'b' : 'd'}${c})"/>
<path d="M-1.4 4.4 C-2 6.4 -1.8 8.4 -0.6 9.6" stroke="#fff" stroke-width="0.55" fill="none" stroke-linecap="round" opacity="${on ? 0.8 : 0.3}"/></g>`;
  }).join('');
  return `<svg viewBox="${vb}" aria-hidden="true"><defs>${defs}</defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="${back}" stroke="#0b1d10" stroke-width="0.9" opacity="0.55"/>
<path d="${swags}" stroke="#0e2414" stroke-width="1.05"/>
<path d="${front}" stroke="#0e2414" stroke-width="1.25"/>
<path d="${front}" stroke="rgba(180,255,200,0.18)" stroke-width="0.4" transform="translate(-0.3 -0.3)"/>
</g>${bulbSvg}</svg>`;
}


// the colour each holiday's sign throws on the haze and the wet street
// the dock's neon line icons, each drawn twice: the tube (its colour, glowing) and a thin white-hot core on top
const SIGN_LIGHT = { dotd: '#ffa62a', halloween: '#ff8a2a', christmas: '#ff3048', nye: '#ffd27a', valentine: '#ff4f8a', stpatrick: '#3dff8b', easter: '#c9a2ff', thanksgiving: '#ffa040', july4: '#5a8cff' };

/** CITY CONTROLS A: the title's preview remote while it lives (the radio plays its desk's moments through it) */
let liveRemote = null;
export const harborRemote = () => liveRemote;

export function createTitle() {
  isFirstVisit();   // (9g: read before the door is ever walked through on this load)
  const els = {};
  let scene = null;
  let tl = null;                 // { plan, t0, raf, kind }
  let remote = null, remoteT = 0;  // CITY 2.0 only: THE PREVIEW PANEL (harbor/remote.js), loaded after the first paint
  let flickerTimer = 0, lastFlick = -1, tiredT = 0, tiredKey = '', tiredPokeAt = 0;
  function tiredTick() {
    if (destroyed || !scene || !els.sign) return;
    // (THE DAY PASS: &force=tired&letter=N|E|O|N2 holds that letter tired — the owner checks each one)
    const q = new URLSearchParams(location.search), forced = /(^|,)tired(,|$)/.test(q.get('force') || '');
    const L = scene.look ? scene.look() : null, t = forced ? tiredForced(q.get('letter')) : tiredLetters(L && L.local), k = t.join(',');
    // (WIN2: a tired tube's flicker scares the spider beside it — when it starts, then now and then while it lasts)
    if (t.length && scene && scene.poke && performance.now() - tiredPokeAt > 25000) { tiredPokeAt = performance.now(); scene.poke({ kind: 'tired', letter: t[0], k: 0.4 }); }
    if (k === tiredKey) return;
    tiredKey = k;
    els.sign.querySelectorAll('.nd-logo .ndl').forEach((l, i) => l.classList.toggle('is-tired', t.includes(i)));
  }
  let destroyed = false;
  let busy = false;
  let st = null;
  // LOBBY 2.0 A — THE ROOM IN THE CITY: in a room (City 2.0) this screen stays — the city never reloads — and room-city.js takes the dock
  let roomUi = null, roomLoading = false;
  /** the room dock's tubes light with the title's (the sign drives the title dock's: dockLight / ringOn) */
  const roomLight = d => {
    const lit = !!(els.youTab && els.youTab.classList.contains('is-lit')), rl = !!(els.host && els.host.classList.contains('is-lit'));
    for (const t of [d.els.youTab, d.els.guestsTab, d.els.gamesTab, d.els.chatTab]) t.classList.toggle('is-lit', lit);
    d.els.host.classList.toggle('is-lit', rl); d.els.joinTab.classList.toggle('is-lit', rl);
  };
  // (CITY 1.0 OUT — THE STUCK JOIN, the owner Nov 5: City 2.0's title is never unmounted by a room, so a JOIN / HOST that got in left
  //  `busy` true + the boxes breathing (is-busy) + the old word in the field: after a LEAVE nothing could be typed or joined. The room's
  //  edges reset the dock's JOIN + HOST to a fresh one — on the way in AND on the way out)
  let wasInRoom = false;
  function freshDock() {
    busy = false;
    if (!els.code) return;
    els.code.value = '';
    els.code.parentElement.classList.remove('is-busy', 'is-shake');
    els.go && els.go.classList.remove('is-ready');
    els.host && (els.host.classList.remove('is-busy'), els.host.removeAttribute('aria-busy'));
    dk.paintCode(); dk.say('');
  }
  function roomSync(state) {
    const inRoom = !!(scene && state.code && state.meta);
    if (inRoom !== wasInRoom) { wasInRoom = inRoom; freshDock(); }
    if (inRoom && !roomUi && !roomLoading && scene) {
      roomLoading = true;
      dk.openJoin(false);
      lazyImport(import('./room-city.js'), './room-city.js').then(m => {
        roomLoading = false;
        if (destroyed || !st || !st.code || roomUi) return;
        roomUi = m.createRoomCity({ scene, sign: els.sign, dockHost: els.door.parentElement, lightFrom: roomLight });
        els.root.classList.add('is-room'); tap.wake();
        roomUi.update(st);
        lazyImport(import('../profile/keypop.js'), '../profile/keypop.js').then(k => keyPopDot(k.keyPopState())).catch(() => {});
      }).catch(e => { roomLoading = false; console.warn('room', e); });
    }
    if (!inRoom && roomUi) {
      roomUi.destroy(); roomUi = null; els.root.classList.remove('is-room');
      // (LOBBY 2.0 B — THE NIGHT's CHAMPION: leaving after 2+ games — this phone's city flies LAST CALL — <the leader> WINS THE NIGHT)
      if (scene) lazyImport(import('./room-banner.js'), './room-banner.js').then(m => { if (!destroyed && scene) m.champBanner(scene, 'last-call', !!(st && st.code)); }).catch(() => {});
    }
    if (roomUi) roomUi.update(state);
    feedRoomRadio(state);
  }
  // (LOBBY 2.0 B — the room's sky moments to this phone's city: only while in the room; [] the moment it leaves)
  let roomRadioSig = '';
  function feedRoomRadio(state) {
    const list = state && state.code ? state.roomRadio || [] : [], sig = list.map(m => `${m.id}:${m.state}:${m.at}`).join(',');
    if (!remote || !remote.roomMoments || sig === roomRadioSig) return;
    roomRadioSig = sig; remote.roomMoments(list);
  }
  const reduced = () => !!settings.reducedFx || reducedMotion();

  // CITY 1.0 OUT — THE CITY COULDN'T LOAD: the Harbor's module failed twice (no signal mid-load, a broken deploy) — this used to fall back to
  // City 1.0. A plain card on the boot screen's dark: what happened + RELOAD (nothing else here works without the city).
  function cityDown(el) {
    cityDone();   // (THE LOAD FIX: no city to wait for — the boot screen lets this card show)
    el.classList.add('title-screen', 'nd', 'nd-down');
    els.down = h('div.nd-down-card', { role: 'alert' },
      h('h2.sheet-title', 'THE CITY COULDN’T LOAD'),
      h('p.mono.dim', 'Check your connection, then reload.'),
      h('button.btn.btn-primary', { type: 'button', onclick: () => location.reload() }, h('span', 'RELOAD')));
    el.append(els.down);
  }
  function mount(el, state) {
    st = state;
    el.classList.add('title-screen', 'nd');
    if (!createHarbor) { cityDown(el); return; }   // (CITY 1.0 OUT: the Harbor's module never came — THE CITY COULDN'T LOAD + RELOAD)
    el.classList.add('nd-c2');          // (DT1: City 2.0's own sign styles — the tagline's dark halo, css/title.css)
    document.body.classList.add('nd-on');
    dressCorners(true);
    // the city: fixed behind everything, full viewport (the screen column is narrower on desktop)
    els.sceneWrap = h('div.nd-scene', { 'aria-hidden': 'true' }, els.canvas = h('canvas'));
    // (FP3a — THE LOAD GATE: City 2.0's canvas stays DARK until the scene says its first full frame is ready — onReveal below —
    // so Safari's bars settling, the bakes and the fonts never show as a jump: dark → the city fades in, with the NEON sign)
    // (POLISH 5: City 2.0's canvas is the LARGE viewport — 100lvh — so a Safari tab's bars settling or sliding never resize it: the
    // city stays put under them (css/title.css .nd-scene.nd-lvh))
    els.sceneWrap.classList.add('is-hold', 'nd-lvh'); onScreenWait(7500).then(reveal);   // (THE LOAD FIX: past the scene's own latest — REVEAL_MAX + its wait for one camera; LOAD FIX 4: ON SCREEN — reveal() is a no-op once revealed / gone)
    document.body.prepend(els.sceneWrap);
    // (City 2.0 starts every phone at tier 2 — iOS reports a capped core count, so the old guess put every iPhone at tier 1 while it
    // ran the Harbor in 1–3 ms; the Harbor's own step-down still protects a slow phone: docs/harbor.md#performance)
    scene = createHarbor(els.canvas, { games: GAMES, tier: 2 });
    scene.set({ motion: reduced() ? 0 : 1 });
    scene.set({ onReveal: reveal, measure: () => ({ clear: clearZones(), textRects: textRects() }), revealInstant: bootCovers });   // (THE LOAD FIX: under the boot screen the city comes in at once — the boot's fade is the one fade)
    // a lightning strike: the glass of the dock catches the flash (9a: the Harbor plays its own thunder — 'thunder-far', delayed by the
    // strike's distance: harbor/sounds.js#thunder)
    scene.set({ onFlash: e => { if (destroyed) return; flashGlass(e.near); } });
    // PARTY NIGHTS: the beat the city breathes to, the finale's distant thumps, and the party's numbers for the CSS (the sign,
    // SPEAKEASY and the rings breathe through custom properties on the root: one style write a frame)
    scene.set({ beat: beatSource, song: songInfo, kick: beatKick, beatWhy, beatCal, beatReport, musicLine, onBurst: () => { if (!destroyed) fireworkBurst({ delay: 0.25 + Math.random() * 0.15, level: 0.9 }); }, onParty: neon.partyFrame });
    // CITY 2.0 — THE TIRED TUBE (NEON PASS 5): one or two letters of the NEON logo look tired for ~3 hours (core/harbor-show.js
    // #tiredLetters — any letter, sometimes none, never the same twice running; it was always the O)
    // (and again once the scene has its clock: the first check can come before its look — then nothing showed for 30 s)
    tiredTick(); setTimeout(tiredTick, 1200); tiredT = setInterval(tiredTick, 30000);
    // CITY 2.0 — THE SIGN-DIM HOOK (C1.5; Part 6b's sky messages use it): the scene says how dim the logo and the tagline should be
    scene.set({ onSignDim: applySignDim, onSignFlash: applySignFlash });
    // CITY 2.0: THE PREVIEW PANEL (docs/harbor.md) — everyone on ?city=2 follows the owner's city2/live; she gets the TEST pill.
    // (LOAD FIX 2: loaded AT ONCE, in the hidden frames before the reveal — its modules come with THE BOOT PRELOAD (build-boot-preload.mjs
    //  ENTRIES), so this is their evaluation only. Moved to 1.5 s after the reveal first, it evaluated IN VIEW: the harbor sightings
    //  group's capture caught a 100-ms frame. The reveal never waits for it unless a JUST ME state is stored for the tab (SP4))
    const loadRemote = () => { if (!destroyed) lazyImport(import('./harbor/remote.js'), './harbor/remote.js').then(m => { if (!destroyed && scene) { remote = m.createRemote({ scene: () => scene }); liveRemote = remote; roomRadioSig = ''; feedRoomRadio(st); } }).catch(e => console.warn('preview panel', e)); };
    remoteT = setTimeout(loadRemote, 0);

    // the sign is there from the start, dark (glass tubes only, like the boot screen); the power-on lights it
    els.sign = h('div.nd-sign', { class: 'is-glass' },
      h('div.nd-bloom', { 'aria-hidden': 'true' }),   // PARTY NIGHTS: the logo's breath, behind the letters
      h('div.nd-logo-wrap', { html: logoSvg({ id: 'ndt', title: APP_NAME, premium: true }) + logoGlowSvg({ id: 'ndtg' }) + logoRaceSvg({ id: 'ndtr' }) + (/[?&]force=[^&]*anchors/.test(location.search) ? anchorsSvg() : '') }),
      // (City 2.0, SP3: SPEAKEASY in WHITE NEON — each character carries its tube letter; the punch + the race layers the same: ui/word-neon.js)
      h('div.nd-word.nd-wn', { html: `<span class="nd-word-g">${wordNeonChars('SPEAKEASY')}<span class="nd-word-p" aria-hidden="true">${wordNeonChars('SPEAKEASY', 'blaze')}</span><span class="nd-word-r" aria-hidden="true">${wordNeonChars('SPEAKEASY', 'blaze', 'i')}</span></span>${wordNeonDefs()}` }),
      h('div.nd-tag', TAGLINE),
      els.sub = h('div.nd-sub', `${GAMES.filter(g => g.playable).length >= 4 ? `${GAMES.filter(g => g.playable).length} ` : ''}PARTY GAMES · ONE PHONE EACH`));   // (WINDOWS: "2 PARTY GAMES" undersold it — the count comes back with the games)
    // (11a-1: THE SIGN DECORATION SYSTEM's overlay lives in the logo's wrap — harbor/signdress.js; the scene drives it)
    scene.set({ dressHost: els.sign.querySelector('.nd-logo-wrap'), signLetters: [...els.sign.querySelectorAll('.nd-logo .ndl')] });   // (9c: the snow on each letter glows by its own light)
    els.actions = dk.buildActions();
    { const st0 = neon.neonNow(); if (!st0.caught) { els.sign.classList.add('is-day'); if (st0.stage !== 'goodbye') els.actions.classList.add('is-daylit'); } }
    els.gate = h('button.nd-gate', { type: 'button', 'aria-label': 'Tap to enter', onclick: enter },
      h('span.nd-gate-txt', 'TAP TO ENTER'),
      h('span.nd-gate-sub', 'BEST WITH SOUND ON'));
    el.append(
      h('div.nd-corner', slot !== '1' ? h('span.tag.tag-you', `TEST SLOT ${slot}`) : null),
      els.sign,
      h('div.nd-city'),
      els.actions,
      els.gate);
    el.addEventListener('pointerdown', onAnyTap, { capture: true });
    // (DESKTOP Group 4: the hover glow ring over a game sign / the door — a mouse only, hidden on a touch screen by CSS)
    els.hoverGlow = h('div.nd-hover', { 'aria-hidden': 'true' });
    el.append(els.hoverGlow);
    els.root = el;
    dk.ringColors();
    requestAnimationFrame(dk.ringColors);
    // the sign's text boxes for the scene at once (not only after the intro): a phone's sun hangs its arch off the words and
    // the rainbow sits under them — measured once the sign is laid out, then kept in step by trackLogo
    requestAnimationFrame(() => { if (!destroyed) { const tr = textRects(); if (tr) scene.set({ textRects: tr }); } });
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', dk.fitKeyboard); window.visualViewport.addEventListener('scroll', dk.fitKeyboard); }
    window.addEventListener('pointerdown', tap.onWake, { capture: true });
    window.addEventListener('click', tap.onWakeClick, { capture: true });
    window.addEventListener('keydown', tap.onWake, { capture: true });
    window.addEventListener('pointermove', tap.onMouse, { passive: true });
    // city taps come from the touch itself (iOS Safari never sends 'click' to plain page areas like the city)
    window.addEventListener('pointerdown', tap.onCityDown, { passive: true });
    window.addEventListener('pointerup', tap.onCityUp, { passive: true });
    document.addEventListener('visibilitychange', tap.onShown); window.addEventListener('pageshow', tap.onShown); window.addEventListener('focus', tap.onShown);
    els.probe = h('div', { style: { position: 'fixed', top: '0', left: '0', width: '1px', height: 'var(--safe-t)', visibility: 'hidden', pointerEvents: 'none' } });
    els.probeB = h('div', { style: { position: 'fixed', bottom: '0', left: '0', width: '1px', height: 'var(--safe-b)', visibility: 'hidden', pointerEvents: 'none' } });
    document.body.append(els.probe, els.probeB);
    scene.safeTop(els.probe.offsetHeight);
    scene.safeBottom(els.probeB.offsetHeight);
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
    if (!tl || tl.done || e.target.closest('.nd-gate')) { if (!tl) tap.introTap = e.pointerId ?? true; return; }
    // (the owner's PROGRESSION B review: a skip-tap is never a CITY tap — it finished the intro on its pointerdown, so its pointerup used to
    // reach onCityTap and a legendary forced with &lgnow=1 under the finger reacted + took a photo "by itself")
    tap.introTap = e.pointerId ?? true;
    if (performance.now() - tl.t0 < 250) return;
    skip();
  }

  function run(plan, kind) {
    const r = reduced();
    tl = { plan: r ? { ...INSTANT, end: 0.7 } : plan, kind: r ? 'reduced' : kind, t0: performance.now(), done: false, marks: {} };
    const root = els.sign.closest('.nd');
    root.classList.add(`seq-${tl.kind}`);
    armTagline();     // (CITY 2.0: the tagline's 10 s count from the moment the title appears, not from the end of its power-on)
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

  // POLISH 5 — THE LOAD (the owner's jumping load): the screen ENTERS with a transform (.screen: translateY(14px) scale(0.985) → none
  // over 0.42 s, css/base.css — far longer under a busy first second), so every rect read while it runs is up to ~19 pt off; the
  // city was laid out on those, then re-laid when the title reported again after its power-on — AFTER the reveal: the skyline
  // shifted + crossfaded. Each rect handed to the scene is measured through the screen's transform UNDONE: where it will rest.
  function restRect(el) {
    const r = el.getBoundingClientRect(), scr = els.root;
    if (!scr || !scr.contains(el)) return r;
    const tf = getComputedStyle(scr).transform;
    if (!tf || tf === 'none') return r;
    const m = tf.match(/^matrix\(([^)]+)\)$/);
    if (!m) return r;
    const [a, , , d, e, f] = m[1].split(',').map(Number);
    if (!(a > 0) || !(d > 0)) return r;
    // (the origin: the screen's own untransformed centre — its offset box inside the stage, which never moves)
    const st = scr.offsetParent ? scr.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
    const ox = st.left + scr.offsetLeft + scr.offsetWidth / 2, oy = st.top + scr.offsetTop + scr.offsetHeight / 2;
    const left = ox + (r.left - ox - e) / a, top = oy + (r.top - oy - f) / d;
    return { left, top, width: r.width / a, height: r.height / d, right: left + r.width / a, bottom: top + r.height / d };
  }
  function logoRect() {
    const svg = els.sign.querySelector('svg');
    if (!svg) return null;
    const r = restRect(svg);
    return { x: r.left + r.width * 0.07, y: r.top + r.height * 0.18, w: r.width * 0.86, h: r.height * 0.64 };
  }

  // the sign: glass -> per-letter flicker -> steady glow (crackles + hum on the SFX bus)
  function signOn() {
    const s = els.sign;
    const root = s.closest('.nd');
    if (root) root.classList.add('is-dock');
    s.classList.remove('is-off');
    s.classList.add('is-glass');
    const letters = [...s.querySelectorAll('.ndl')];
    // daylight: the sign rests (glass and brackets, unlit) until dusk
    // before the catch (and in the morning goodbye) the city boots but the sign isn't forced on: it joins its stage of the day
    const st0 = neon.neonNow();
    if (!st0.caught) { s.classList.add('is-day'); if (dk.ringsWanted(st0)) dk.ringOn(tl && (tl.kind === 'full' || tl.kind === 'short') ? [[140, true], [210, false], [300, true]] : null); neon.applyNeon(st0, { quiet: true }); return; }
    scene.set({ signPow: null });
    s.classList.remove('is-day');
    const kind = tl.kind;
    if (kind === 'instant' || kind === 'reduced') {
      letters.forEach(l => l.classList.add('on'));
      s.classList.add('is-steady', 'is-warm');
      dk.dockAll(true);
      dk.ringOn(null);
      return;
    }
    const full = kind === 'full';
    // on/off toggles per letter (ms after the sign starts); one letter stutters a little longer (NEON PASS 5: City 2.0 picks it at
    // random each time — it was always the O)
    const base = full ? [0, 70, 150, 220] : [0, 40, 80, 120];
    const pattern = full ? [0, 45, 110, 150, 250, 290, 400] : [0, 40, 90];
    const crackles = [], slow = Math.floor(Math.random() * letters.length);
    letters.forEach((l, i) => {
      const pat = i === slow && full ? [...pattern.slice(0, -1), 470, 520, 600] : pattern;
      pat.forEach((ms, k) => {
        const at = base[i] + ms;
        setTimeout(() => { if (!destroyed) l.classList.toggle('on', k % 2 === 0); }, at);
        setTimeout(() => dk.dockLight(i, k % 2 === 0), at + 40);
        if (k % 2 === 0 && (k < 3 || i === slow)) crackles.push(at / 1000);
      });
    });
    neonPowerOn({ crackles: crackles.slice(0, full ? 7 : 3), dur: full ? 2.4 : 1.4 });
    const steadyIn = ((tl.plan.steady - tl.plan.logo) * 1000);
    // the ring flickers with the first N (a beat behind it), then holds
    dk.ringOn([...pattern.map((ms, k) => [base[0] + ms + 30, k % 2 === 0]), [steadyIn, true]]);
    setTimeout(() => { if (!destroyed) { letters.forEach(l => l.classList.add('on')); s.classList.add('is-steady'); dk.dockAll(true); } }, steadyIn);
    setTimeout(() => { if (!destroyed) s.classList.add('is-warm'); }, steadyIn + 60);
  }

  function skip() {
    if (!tl || tl.done) return;
    const root = els.sign.closest('.nd');
    root.classList.add('is-skip');
    if (!tl.marks.logo) { tl.marks.logo = true; tl.kind = 'instant'; signOn(); }
    else if (neon.neonNow().caught) { els.sign.querySelectorAll('.ndl').forEach(l => l.classList.add('on')); els.sign.classList.add('is-steady', 'is-warm'); dk.dockAll(true); }
    else neon.applyNeon(neon.neonNow(), { quiet: true });
    dk.dock.resetRing(); if (dk.ringsWanted(neon.neonNow())) dk.ringOn(null); else dk.dock.ringSet(false);
    root.classList.add('is-menu', 'is-dock');
    finish();
  }

  // PROGRESSION B — THE OWNER's SIGHTING PREVIEW (&sgdemo=<id>, with its legendary forced): once it's in view, the first-time sequence plays
  // on its own — the reaction, the flash, the REAL polaroid, SPOTTED, the reveal — never claimed, never kept
  let sgDemoT = 0, extrasT = 0;
  // PROGRESSION B — THIS PHONE's OWN MOMENTS on its city (harbor/remote.js#localMoments — played once, like a fired one):
  //   a favor's JUST ME preview (the profile hands it over: sessionStorage nd:local-moment) and, ON THE BIRTHDAY (month + day — the phone's
  //   copy, nd:bd), the HAPPY BDAY <NAME> skywrite the first time the city opens that day (+ MANY HAPPY RETURNS, server-checked). A
  //   preview page (&when= / &force= …) never plays the birthday.
  function cityExtras(n = 0) {
    if (destroyed) return;
    if (!remote || !remote.localMoments) { if (n < 40) extrasT = setTimeout(() => cityExtras(n + 1), 500); return; }
    Promise.all([lazyImport(import('../core/birthday.js'), '../core/birthday.js'), lazyImport(import('../progress/extras.js'), '../progress/extras.js'), lazyImport(import('../firebase.js'), '../firebase.js')]).then(([B, X, F]) => {
      if (destroyed || !remote) return;
      const srv = () => { try { return F.serverNow(); } catch { return Date.now(); } };
      let hand = null; try { hand = JSON.parse(sessionStorage.getItem('nd:local-moment') || 'null'); sessionStorage.removeItem('nd:local-moment'); } catch { /* fine */ }
      if (hand && hand.jack && Date.now() - (hand.at || 0) < 10 * 60e3) {
        const at = srv() + 2500;
        remote.localMoments([{ id: `favor-pv-${hand.at}`, jack: hand.jack, at, until: at + 90e3, text: hand.text || null, colour: hand.colour || 'ff6fd0' }]);
      }
      const q = new URLSearchParams(location.search), preview = ['when', 'tz', 'force', 'wx', 'speed', 'at', 'preview', 'sgdemo'].some(k => q.get(k));
      // (THE OWNER's PREVIEW: &bday=1 — the HAPPY BDAY skywrite on this city now, with this phone's name; nothing sent, nothing counted)
      if (q.get('bday') === '1') { const at = srv() + 2500; remote.localMoments([{ id: `bday-preview-${Date.now()}`, jack: 'skywrite', at, until: at + 90e3, text: B.bdayText((loadProfile() || {}).name || ''), colour: 'ff6fd0' }]); return; }
      const bd = X.storedBirthday(), tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; } })();
      if (!bd || preview || !B.isBirthdayOn(bd, srv(), tz)) return;
      const key = B.dayKeyOf(srv(), tz);
      let seen = null; try { seen = localStorage.getItem('nd:bday-sky'); } catch { /* fine */ }
      if (seen === key) return;
      try { localStorage.setItem('nd:bday-sky', key); } catch { /* fine */ }
      const at = srv() + 3500, name = (loadProfile() || {}).name || '';
      remote.localMoments([{ id: `bday-${key}`, jack: 'skywrite', at, until: at + 90e3, text: B.bdayText(name), colour: 'ff6fd0' }]);
      lazyImport(import('../profile/events.js'), '../profile/events.js').then(m => m.progressEvent('birthday', { tz })).catch(() => {});
    }).catch(e => console.warn('[city extras]', e));
  }
  // THE VAULT 1A — BRING YOUR CARD: a device with NOTHING saved (no key, no profile) is asked "ALREADY A MEMBER?" — the Home Screen app
  // (standalone) LEADS with the sheet on its first open; a browser tab gets a quiet pill over the dock. A preview page (&when= / &force= …)
  // never asks; ?bringcard=1 opens the sheet anyway, ?bringcard=chip shows the pill (the owner's look — nothing happens unless a key is pasted).
  let bycT = 0;
  function bringCard() {
    const q = new URLSearchParams(location.search), force = q.get('bringcard') === '1', chip = q.get('bringcard') === 'chip';
    if (!force && !chip && ['when', 'tz', 'force', 'wx', 'at', 'preview', 'sgdemo'].some(k => q.get(k))) return;
    lazyImport(import('../profile/bring.js'), '../profile/bring.js').then(B => {
      if (destroyed || (!force && !chip && !B.shouldOffer())) return;
      if (force || (!chip && B.standalone())) { bycT = setTimeout(() => { if (!destroyed && !document.querySelector('.sh, .modal')) B.openBring({ lead: true }); }, 900); return; }
      if (els.actions && !els.actions.querySelector('.byc-chip')) B.offerChip(els.actions);
    }).catch(e => console.warn('[bring]', e));
  }
  function sightDemo() {
    const id = new URLSearchParams(location.search).get('sgdemo');
    if (!id || !scene || !scene.sightBoxes) return;
    lazyImport(import('../progress/sighting.js'), '../progress/sighting.js').then(m => m.prewarm()).catch(() => {});
    // (THE VAULT 2B — the owner's ghost-ship check: the demo snapped ~2 s in, the ship still fading in at the edge → it waits until the
    //  legendary is FULLY VISIBLE: faded all the way in (a ≥ 0.85 — the ship's lantern flicker dips a little) + at least 70 % of it on
    //  screen (the ship enters from the right edge at ~½ pt a second on a phone: its whole hull can take minutes), held 0.9 s; the photo
    //  then centres on it — the crop always followed the tap, clamped to the screen)
    let seenAt = 0; const t0 = performance.now();
    const onK = (c, r, max) => (r > 0 ? Math.max(0, Math.min(max, c + r) - Math.max(0, c - r)) / (2 * r) : (c > 0 && c < max ? 1 : 0));
    const whole = x => x.id === id && (x.a == null || x.a >= 0.85) && x.x > 8 && x.x < innerWidth - 8 && x.y > 60 && x.y < innerHeight - 140 && onK(x.x, x.w || 0, innerWidth) >= 0.7 && onK(x.y, x.h || 0, innerHeight) >= 0.7;
    const look = () => {
      if (destroyed || performance.now() - t0 > 120e3) return;
      const b = scene.sightBoxes().find(whole);
      if (!b) seenAt = 0; else if (!seenAt) seenAt = performance.now();
      if (b && performance.now() - seenAt > 900) {
        const sg = scene.sightTap(b.x, b.y);
        if (sg) { sg.demo = true; sg.live = false; sg.seenA = b.a; sg.again = Math.max(0, Math.min(999, Number(new URLSearchParams(location.search).get('sgagain')) || 0)); lazyImport(import('../progress/sighting.js'), '../progress/sighting.js').then(m => m.onSighting(sg, { scene, reduced: reduced() })).catch(e => console.warn('[sighting]', e)); }
        return;
      }
      sgDemoT = setTimeout(look, 200);
    };
    look();
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
    neon.neonTick();
    tap.armIdle();
    document.addEventListener('visibilitychange', onVisTitle);
    sightDemo();
    cityExtras();
    bringCard();
    neon.surgeRetry();     // (FP3a: the music started during the intro → the sign answers now)
  }

  // CITY 2.0 (docs/harbor.md): THE TAGLINE follows the screen at rest (Part 5, the owner's call): shown on arrival, it fades out
  // together with the dock when the screen goes to rest and comes back with the dock on a tap (opacity only: its rect, and so the
  // city, never move — the scene only hands its band to the sky-low lane while it is gone). Its band is THE TAGLINE SLOT:
  // tagSlot(text, ms) shows a special line there for a while, even at rest (holidays, the countdown, CITY CONTROL).
  // &tagms=N (dev + shots): the tagline alone fades N ms in, as if at rest.
  function armTagline() {
    if (destroyed) return;
    const ms = +((location.search.match(/[?&]tagms=(\d+)/) || [])[1] || 0);
    clearTimeout(els.tagTimer);
    if (ms) els.tagTimer = setTimeout(() => { if (destroyed) return; els.sign.classList.add('nd-tag-gone'); scene.set({ tagGone: true }); }, ms);
    scene.set({ tagSlot });
  }
  /** City 2.0: the tagline's band is the sky's while the tagline is hidden (at rest, or faded by &tagms) and no message shows */
  function tagState() {
    if (destroyed || !scene) return;
    const tag = els.sign.querySelector('.nd-tag');
    const msg = tag && tag.classList.contains('nd-tag-msg');
    // (FP2: + the dock at rest — the street under it shows, and the implied road's car is seen rolling across it)
    scene.set({ tagGone: !msg && (els.root.classList.contains('is-idle') || els.sign.classList.contains('nd-tag-gone')), dockGone: els.root.classList.contains('is-idle') });
  }
  function tagSlot(text, ms = 6000) {
    if (destroyed) return false;
    const tag = els.sign.querySelector('.nd-tag');
    if (!tag || tag.classList.contains('nd-count')) return false;
    clearTimeout(els.tagSlotTimer);
    tag.textContent = text;
    tag.classList.add('nd-tag-msg');
    els.sign.classList.remove('nd-tag-gone'); tagState();
    els.tagSlotTimer = setTimeout(() => {
      if (destroyed) return;
      // the message fades out; then the tagline is back in its place (shown with the dock, hidden at rest)
      els.sign.classList.add('nd-tag-gone');
      els.tagSlotTimer = setTimeout(() => {
        if (destroyed) return;
        tag.classList.remove('nd-tag-msg');
        if (!tag.classList.contains('nd-count')) tag.textContent = TAGLINE;
        els.sign.classList.remove('nd-tag-gone'); tagState();
      }, 2600);
    }, ms);
    return true;
  }

  // LIVING CITY: the sign follows the hour (off at dawn like closing time, back on at dusk tube by tube) and wears the
  // holiday (cobwebs, a Santa hat, the New Year countdown, rose / green tubes)
  function watchSky() {
    if (destroyed || !scene) return;
    // (a hidden page — the phone locked, another app in front — does none of this; visibilitychange re-arms it at once)
    if (document.visibilityState !== 'visible') { els.skyTimer = setTimeout(watchSky, 5000); return; }
    dressSign(scene.look());
    premiumLogo(scene.look());
    els.root.classList.toggle('nd-noblur', (scene.tier ? scene.tier() : 2) === 0);
    tintGlass();
    snowOnSign();
    tagShade();
    els.skyTimer = setTimeout(watchSky, 1000);
  }
  // CITY 2.0 (NEON PASS 2): the sun + the moon may pass behind the tagline — while a bright disc is behind it, a soft shadow behind
  // its letters keeps it readable (no box; only where needed)
  function tagShade() {
    const tag = els.sign && els.sign.querySelector('.nd-tag');
    if (!tag) return;
    const r = tag.getBoundingClientRect(), s = scene.sun && scene.sun(), m = scene.moonAt && scene.moonAt();
    const near = d => d && d.x + d.r * 1.6 > r.left && d.x - d.r * 1.6 < r.right && d.y + d.r * 1.6 > r.top && d.y - d.r * 1.6 < r.bottom;
    tag.classList.toggle('nd-tag-shade', !!((s && (s.vis == null || s.vis > 0.1) && near(s)) || near(m)));
  }
  // CITY 2.0's premium logo (logo.js#premiumBits): the glass highlight leans toward the light — the real sun's side by day, a
  // little left at night — moving with the sun through the day; a faint flutter now and then in one lit tube's core (rare and
  // brief: each is one repaint of the sign)
  let hiKey = '';
  function premiumLogo(L) {
    if (!L) return;
    const svg = els.sign.querySelector('svg.nd-logo');
    if (!svg) return;
    const az = L.sun ? L.sun.az : 180, el = L.sun ? L.sun.el : -10, side = el > -2 ? Math.max(-1, Math.min(1, (((az - 180 + 540) % 360) - 180) / 70)) : -0.6;
    const k = (side * 1.5).toFixed(2);
    if (k !== hiKey) { hiKey = k; svg.style.setProperty('--hix', `${k}px`); }
    if (reduced() || Math.random() > 0.22 || !els.sign.classList.contains('is-steady')) return;
    const lit = [...svg.querySelectorAll('.ndl.on .ndl-core')];
    const core = lit[Math.floor(Math.random() * lit.length)];
    if (!core) return;
    // (a class, never core.style: clearing an inline style leaves style="" behind — review-2.md §2)
    core.classList.add('is-flut');
    setTimeout(() => core.classList.remove('is-flut'), 70 + Math.random() * 60);
  }
  // THE SIGN-DIM HOOK (C1.5, core/harbor-signdim.js): a sky message flies in front of the logo — the NEON letters + SPEAKEASY dim
  // (--sd-logo: opacity on their own wrappers, nothing else writes those) and the tagline fades (nd-tag-sky), over d.ms; back after
  // PART 10 — THE SIGN JOINS THE FIREWORKS (the owner, Oct 31 9:05 pm: it stays LIT in front of them; a subtle brightening on the biggest
  // bursts): the scene hands the flare 0..1 — on a party night it rides the party's swell (partyFrame), any other night it lights the sign's
  // bloom itself (opacity only — a compositor change), easing back as the flare decays
  let fwFlare = 0;
  function applySignFlash(k) {
    if (destroyed || !els.sign) return;
    fwFlare = k;
    if (els.root && els.root.classList.contains('is-party')) return;
    const b = els.sign.querySelector('.nd-bloom'); if (!b) return;
    if (k > 0.01 && els.sign.classList.contains('is-steady')) b.style.opacity = String(Math.round(k * 0.6 * 50) / 50); else b.style.opacity = '';
  }
  function applySignDim(d) {
    if (destroyed || !els.sign) return;
    els.sign.style.setProperty('--sd-ms', `${Math.round(d.ms)}ms`);
    if (d.logo >= 1) els.sign.style.removeProperty('--sd-logo'); else els.sign.style.setProperty('--sd-logo', String(+d.logo.toFixed(3)));
    els.sign.style.setProperty('--sd-tag', String(+d.tag.toFixed(3)));
    els.sign.classList.toggle('nd-tag-sky', d.tag < 1);
  }
  // the dock's glass takes the sky's light: the sign's neon after dark (the holiday's colour on its days), amber at golden
  // hour, rose at dawn, a cool frosted daylight — and rain runs down it while it rains. The labels never change (contrast).
  let glassKey = '';
  function tintGlass() {
    const L = scene.look(), P = scene.palette && scene.palette();
    if (!L || !P) return;
    const hex = h6 => [parseInt(h6.slice(1, 3), 16), parseInt(h6.slice(3, 5), 16), parseInt(h6.slice(5, 7), 16)];
    const neon = hex((scene.signCol && scene.signCol()) || '#ff4fb4');
    const LIGHT = { night: neon, late: neon, golden: [255, 166, 96], dawn: [255, 160, 186], day: [214, 228, 255] };
    const mix = [0, 0, 0];
    let tw = 0;
    for (const [k, w] of Object.entries(L.w)) { const c = LIGHT[k]; if (!c || w <= 0) continue; tw += w; for (let i = 0; i < 3; i++) mix[i] += c[i] * w; }
    const glow = mix.map(v => Math.round(v / (tw || 1)));
    // the glass itself: the sky's low colour, darkened so white labels always read on it
    const sky = P.sky[2].map(v => Math.round(v * 0.32));
    const day = clamp01(L.w.day + L.w.dawn * 0.5);
    const key = `${glow.join(',')}|${sky.join(',')}|${Math.round(day * 10)}`;
    if (key !== glassKey) {
      glassKey = key;
      const st = els.root.style;
      st.setProperty('--dk-glow', `rgb(${glow.join(',')})`);
      st.setProperty('--dk-tint', `rgb(${sky.join(',')})`);
      document.body.style.setProperty('--dk-tint', `rgb(${sky.join(',')})`);   // (the corner buttons live on the body)
      st.setProperty('--dk-day', String(Math.round(day * 100) / 100));
    }
  }
  // LIVE WEATHER: snow settles on the sign's tubes while it snows (fades in over a minute, melts slowly after), drawn from the
  // tubes themselves (their top edges: the shape minus itself shifted down); the first snow of the winter starts gently
  function snowOnSign() {
    const L = scene.look(), logo = els.sign.querySelector('svg.nd-logo');
    if (!logo) return;
    const snowing = (L.snow || 0) > 0.25;
    if (snowing && !els.snowCap) {
      const paths = [...logo.querySelectorAll('.ndl')].map(g => {
        const p = g.querySelector('.ndl-glass');
        return p ? `<path d="${p.getAttribute('d')}" transform="${g.getAttribute('transform') || ''}" stroke="#fff" stroke-width="${p.getAttribute('stroke-width')}"/>` : '';
      }).join('');
      els.snowCap = h('div.nd-snowcap', { 'aria-hidden': 'true', html: `<svg viewBox="${logo.getAttribute('viewBox')}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="nd-snow" x="-5%" y="-10%" width="110%" height="120%"><feOffset in="SourceAlpha" dy="2.8" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="top"/><feGaussianBlur in="top" stdDeviation="0.45" result="b"/><feFlood flood-color="#f6f8ff"/><feComposite in2="b" operator="in"/></filter></defs><g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#nd-snow)">${paths}</g></svg>` });
      logo.parentNode.append(els.snowCap);
    }
    els.sign.classList.toggle('is-snowy', snowing);
    // the first snow of this winter (per device): a hush — a few big, slow flakes before it really comes down
    if (snowing) {
      const winter = L.local ? (L.local.m >= 7 ? L.local.y : L.local.y - 1) : 0;
      if (store(localStorage, 'nd:firstsnow') !== String(winter)) { store(localStorage, 'nd:firstsnow', String(winter)); scene.set({ firstSnow: performance.now() }); }
    }
  }
  let glassT = 0;
  function flashGlass(near) {
    if (!els.door) return;
    els.door.classList.remove('is-flash', 'is-flash-near'); void els.door.offsetWidth;
    els.door.classList.add('is-flash'); if (near) els.door.classList.add('is-flash-near');
    clearTimeout(glassT); glassT = setTimeout(() => els.door && els.door.classList.remove('is-flash', 'is-flash-near'), 900);
  }
  // (title-neon.js: moved out by scripts/split-closure.mjs — T carries the names it shares with this closure, live)
  const neon = createNeon({
    get destroyed() { return destroyed; },
    get dk() { return dk; },
    get els() { return els; },
    get fwFlare() { return fwFlare; },
    get NEON_SOUND() { return NEON_SOUND; },
    get neonSoundLog() { return neonSoundLog; },
    get reduced() { return reduced; },
    get scene() { return scene; },
    get songClock() { return songClock; },
    get surgeAt() { return surgeAt; }, set surgeAt(v) { surgeAt = v; },
    get tap() { return tap; },
    get tl() { return tl; },
    get visitAnswered() { return visitAnswered; }, set visitAnswered(v) { visitAnswered = v; },
  });

  let dressKey = '';
  function dressSign(L) {
    const hol = L && L.holiday;
    const n = L && L.nye;
    const key = `${hol ? hol.id + (hol.full ? 'F' : '') + Math.round((hol.k || 0) * 40) : ''}|${n ? (n.countdown != null ? 'c' + n.countdown : 'f') : ''}`;
    if (key === dressKey) return;
    dressKey = key;
    const s = els.sign;
    const full = hol && hol.full ? hol.id : null;
    for (const k of ['halloween', 'christmas', 'nye', 'valentine', 'stpatrick', 'easter', 'thanksgiving', 'july4', 'dotd']) s.classList.toggle(`sg-${k}`, full === k);
    if (scene) scene.set({ signCol: SIGN_LIGHT[full] || null });
    s.querySelectorAll('.nd-dress').forEach(e => e.remove());
    swapO(s.querySelector('svg.nd-logo'), full === 'halloween' || full === 'stpatrick' ? full : null);
    const wrap = s.querySelector('.nd-logo-wrap');
    // (11a-1: Halloween's web + spider are THE SIGN DECORATION SYSTEM's — harbor/signdress.js, a canvas in this wrap)
    if (hol && hol.id === 'christmas') { const logo = wrap.querySelector('svg.nd-logo'); if (logo) wrap.append(h('div.nd-dress.nd-xlights', { 'aria-hidden': 'true', html: xmasWrapSvg(logo, hol.full ? 1 : hol.k) })); }
    if (full === 'christmas') wrap.append(h('div.nd-dress.nd-hat', { 'aria-hidden': 'true', html: HAT }));
    const tag = s.querySelector('.nd-tag');
    if (n && n.countdown != null) { const m = Math.floor(n.countdown / 60), sec = n.countdown % 60; tag.textContent = `${m}:${String(sec).padStart(2, '0')} TO MIDNIGHT`; tag.classList.add('nd-count'); }
    else if (n && n.finale != null) { tag.textContent = 'HAPPY NEW YEAR'; tag.classList.add('nd-count'); }
    else { tag.textContent = TAGLINE; tag.classList.remove('nd-count'); }
    dk.ringColors();
  }

  // keep the sign's light in the scene in sync with layout (resizes, the keyboard)
  /** FP3a: the scene's first full frame is ready (or the safety timer) — the canvas fades in from dark */
  function reveal() {
    if (destroyed || !els.sceneWrap || !els.sceneWrap.classList.contains('is-hold')) return;
    els.sceneWrap.classList.add(bootCovers() ? 'is-now' : 'is-reveal');   // (THE LOAD FIX: under the boot screen — no fade of its own: css/title.css .is-now)
    els.sceneWrap.classList.remove('is-hold');
    cityDone();
    pgPreviewSoon(600);
    keyPopSoon(2600);
    friendsSoon(3400);   // (FRIENDS A — the requests badge on YOU + INVITES THAT WAIT: ONE /api call, never a socket)
    // (LOBBY 2.0 B — THE NIGHT's CHAMPION: the app closed during a night of 2+ games → LAST NIGHT'S CHAMPION: <them>, the next open within ~12 h, once)
    setTimeout(() => { if (!destroyed && scene && !(st && st.code)) lazyImport(import('./room-banner.js'), './room-banner.js').then(m => { if (!destroyed && scene) m.champBanner(scene, 'last-night', !!(st && st.code)); }).catch(() => {}); }, 4200);
  }
  // LOBBY 2.0 A — THE SAVE-YOUR-KEY POP-UP (profile/keypop.js): a RETURNING player whose key isn't saved meets it once, on the city, a moment
  // after the reveal — never over a legendary (it waits); its YOU dot on the docks until the key is saved
  let keyPopT = 0, offKeyPop = null;
  function keyPopSoon(ms) {
    clearTimeout(keyPopT);
    keyPopT = setTimeout(() => { if (!destroyed) lazyImport(import('../profile/keypop.js'), '../profile/keypop.js').then(k => { if (destroyed) return; k.maybeKeyPop({ why: 'open', busy: () => !!(scene && scene.legendBusy && scene.legendBusy()) }); keyPopDot(k.keyPopState()); if (!offKeyPop) offKeyPop = k.onKeyPop(keyPopDot); }).catch(() => {}); }, ms);
  }
  // FRIENDS A — THE BADGE (pending friend requests) on YOU + INVITES THAT WAIT (profile/invites.js: a friend's room → the card, after a match)
  let frT = 0, offFrB = null;
  function friendsSoon(ms) {
    clearTimeout(frT);
    frT = setTimeout(() => {
      if (destroyed) return;
      Promise.all([lazyImport(import('../profile/invites.js'), '../profile/invites.js'), lazyImport(import('../profile/friends.js'), '../profile/friends.js')]).then(([I, F]) => {
        if (destroyed) return;
        if (!offFrB) offFrB = F.onFriends(() => frBadge(F.pendingBadge()));
        I.checkInvites({ busy: () => !!(scene && scene.legendBusy && scene.legendBusy()) }).then(() => frBadge(F.pendingBadge())).catch(() => {});
      }).catch(() => {});
    }, ms);
  }
  function frBadge(n) {
    for (const t of [els.youTab, roomUi && roomUi.dock && roomUi.dock.els.youTab]) {
      if (!t) continue;
      let b = t.querySelector(':scope > .fr-badge');
      if (!b && n > 0) { lazyImport(import('../profile/friends-ui.js'), '../profile/friends-ui.js').then(m => m.frSheet()).catch(() => {}); b = h('i.fr-badge', { 'aria-hidden': 'true' }); t.append(b); }
      if (b) { b.hidden = !(n > 0); b.textContent = n > 9 ? '9+' : String(n); }
      t.setAttribute('aria-description', n > 0 ? `${n} friend request${n > 1 ? 's' : ''} waiting` : '');
    }
  }
  function keyPopDot(stt) {
    const on = stt === 'dot';
    for (const t of [els.youTab, roomUi && roomUi.dock && roomUi.dock.els.youTab]) {
      if (!t) continue;
      let d = t.querySelector(':scope > .kp-dot'); if (!d && on) { d = h('i.kp-dot', { 'aria-hidden': 'true' }); t.append(d); }
      if (d) d.hidden = !on;
      t.classList.toggle('has-kp', on);
    }
  }
  // PROGRESSION A — THE PREVIEW LINKS (?preview=moment | card | streak | flame [&streak=N] [&up=0] …): the screen with scripted data over the
  // city, a moment after the reveal (or 4 s in, whatever the city does). Nothing is written or sent — a preview never counts.
  let pgPv = (() => { try { const v = new URLSearchParams(location.search).get('preview'); return /^(moment|card|profile|streak)$/.test(v || '') ? v : null; } catch { return null; } })();
  function pgPreviewSoon(ms) {
    if (!pgPv) return;
    const v = pgPv; pgPv = null;
    setTimeout(() => { if (!destroyed) lazyImport(import('../progress/preview.js'), '../progress/preview.js').then(m => m.preview(v, new URLSearchParams(location.search))).catch(() => {}); }, ms);
  }
  if (pgPv) setTimeout(() => pgPreviewSoon(0), 4000);
  function clearZones() {
    const out = [];
    const add = el => { if (!el) return; const r = restRect(el); if (r.width && r.height) out.push({ x: r.left, y: r.top, w: r.width, h: r.height }); };
    add(els.sign); add(els.actions);
    // open sky under the tagline too, so the city frames the sign instead of crowding it
    if (out[0]) out[0].h += 34;
    document.querySelectorAll('.menu-btn, .music-btn').forEach(add);
    return out;
  }
  // CITY 2.0, 9a — THE GLASS the weather lands on (harbor/glasswx.js): JOIN + HOST's discs, the dock's pill, ☰ + ♪ — at rest
  function glassShapes() {
    const out = [], add = (el, id, kind, group) => { if (!el) return; const r = restRect(el); if (r.width > 4 && r.height > 4) out.push({ id, kind, group, el, x: r.left, y: r.top, w: r.width, h: r.height }); };
    const root = els.root;
    if (root) { add(root.querySelector('.nd-joinring .nd-hdisc'), 'join', 'circle', 'dock'); add(root.querySelector('.nd-hostbtn .nd-hdisc'), 'host', 'circle', 'dock'); add(root.querySelector('.nd-bar-glass'), 'pill', 'pill', 'dock'); }
    add(document.querySelector('.menu-btn'), 'menu', 'circle', 'corner'); add(document.querySelector('.music-btn'), 'music', 'circle', 'corner');
    return out;
  }
  // the NEON letters, SPEAKEASY and the tagline, for the phone sun's arch (it passes behind the words, never the letters)
  function textRects() {
    const box = el => { if (!el) return null; const r = restRect(el); return r.width && r.height ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; };
    const neon = logoRect(), word = box(els.sign.querySelector('.nd-word')), tag = box(els.sign.querySelector('.nd-tag'));
    // (sub: a first visit's "12 PARTY GAMES · ONE PHONE EACH" under the tagline — the rainbow keeps under it too)
    // (DT1: + glyphs — SPEAKEASY's own letters, without the word's decorative rules: City 2.0's dark halo hugs them)
    return neon && word && tag ? { neon, word, tag, sub: box(els.sign.querySelector('.nd-sub')), glyphs: box(els.sign.querySelector('.nd-word-g')) } : null;
  }
  // BATTERY: the title's loops (the sign's rects, the sky watch) idle while the page is hidden and pick up at once when it shows
  function onVisTitle() { if (document.visibilityState !== 'visible') neon.humSync(false); if (destroyed || !tl || !tl.done || document.visibilityState !== 'visible') return; clearTimeout(els.logoTimer); clearTimeout(els.skyTimer); trackLogo(); watchSky(); neon.neonTick(); }
  function trackLogo() {
    if (destroyed) return;
    if (document.visibilityState !== 'visible') { els.logoTimer = setTimeout(trackLogo, 5000); return; }
    scene.set({ logoRect: logoRect(), clear: clearZones(), textRects: textRects(), glass: glassShapes(), dockIdle: !!(els.root && els.root.classList.contains('is-idle')) });
    sunGlass();
    // (City 2.0, NEON PASS 3: a drone show's formation fills the band under SPEAKEASY — the tagline steps aside while it flies)
    if (scene.holdTag) { const h = !!scene.holdTag(); if (h !== els.sign.classList.contains('nd-tag-hold')) els.sign.classList.toggle('nd-tag-hold', h); }
    els.logoTimer = setTimeout(trackLogo, 500);
  }

  // the sun passing behind the corner buttons (☰, music): it glows through their frosted glass; while it's there the glass
  // darkens a touch and the icon gets a soft dark edge, so the icon stays readable (≥ 4.5:1) — the rest of the time, unchanged
  let sunOverride = null;   // test-only: a sun placed by the hook (dock.sunAt) to review the glass
  function sunGlass() {
    const sn = sunOverride || (scene && scene.sun ? scene.sun() : null);
    document.querySelectorAll('.menu-btn, .music-btn').forEach(b => {
      let k = 0;
      const r = b.getBoundingClientRect();
      if (sn && sn.vis > 0.15 && r.width > 0) {
        const br = r.width / 2, d = Math.hypot(sn.x - (r.left + br), sn.y - (r.top + br));
        k = clamp01((br + sn.r * 1.3 - d) / (sn.r * 1.3)) * Math.min(1, sn.vis);   // how much of the sun (and its halo) is behind it
        // the sun's light in the glass: where it is behind the button, in its own colour, as strong as it is close
        const st = b.style;
        st.setProperty('--sun-x', `${Math.round(sn.x - r.left)}px`);
        st.setProperty('--sun-y', `${Math.round(sn.y - r.top)}px`);
        st.setProperty('--sun-c', (sn.col || [255, 240, 220]).join(', '));
        st.setProperty('--sun-k', k.toFixed(2));
        st.setProperty('--sun-r', `${Math.round(sn.r * 2.4)}px`);
      }
      b.classList.toggle('nd-sunlit', k > 0.02);
    });
    // the words the sun passes behind keep a soft dark edge while it's there (readable on the bright disc), barely any otherwise
    [els.sign.querySelector('.nd-word'), els.sign.querySelector('.nd-tag')].forEach(t => {
      if (!t) return;
      let k = 0;
      if (sn && sn.vis > 0.15) {
        const r = t.getBoundingClientRect(), R = sn.r * 2.2;
        const dx = Math.max(r.left - sn.x, 0, sn.x - r.right), dy = Math.max(r.top - sn.y, 0, sn.y - r.bottom);
        k = clamp01(1 - Math.hypot(dx, dy) / R) * Math.min(1, sn.vis);
      }
      t.style.setProperty('--sunk', k.toFixed(2));
      t.classList.toggle('nd-sunbk', k > 0.02);
    });
  }

  // every ~20–40 s one letter gives a tiny, realistic flicker
  function scheduleFlicker() {
    if (reduced()) return;
    flickerTimer = setTimeout(() => {
      if (destroyed) return;
      // only a lit sign flickers (by day the tubes are dark: a flicker there used to leave a letter switched on)
      if (!els.sign.classList.contains('is-steady') || els.sign.classList.contains('is-day') || !(neon.neonStage === 'lit' || neon.neonStage === 'night')) { scheduleFlicker(); return; }
      // never a letter someone just tapped (its own animation is running)
      const all = [...els.sign.querySelectorAll('.nd-logo .ndl')];
      let letters = all.filter((_, i) => !tap.buzzing.has(i));
      // (NEON PASS 5, City 2.0 — the owner: any letter, at random, never the same one twice running; sometimes two at once; rarely a
      // whole letter dropping out for a second before it strikes back)
      if (letters.length > 1) letters = letters.filter(l => all.indexOf(l) !== lastFlick);
      if (!letters.length) { scheduleFlicker(); return; }
      const pickL = () => letters.splice(Math.floor(Math.random() * letters.length), 1)[0];
      const roll = Math.random();
      const picks = [pickL()];
      if (roll < 0.22 && letters.length) picks.push(pickL());
      lastFlick = all.indexOf(picks[0]);
      const drop = roll > 0.92;
      for (const l of picks) {
        const li = all.indexOf(l), off = 140 * Math.random() * (picks.length > 1 ? 1 : 0);
        const seq = drop ? [0, 50, 90, 1050, 1110, 1160, 1230] : [0, 60, 95, 130, 190];
        seq.forEach((ms, k) => setTimeout(() => { if (destroyed) return; const on = k % 2 === 1 || k === seq.length - 1; l.classList.toggle('on', on); dk.dockLight(li, on); }, ms + off));
      }
      // (City 2.0: the flicker sounds — rare and random, one of four recordings, never the same twice running. Oct 24, the owner: at the
      // TAP's level — what a tapped letter plays at — about one in three a little louder, never a startle: ambience.js#neonTwitch)
      if (document.visibilityState === 'visible') neonTwitch({ gain: NEON_TAP_LEVEL * NEON_GAINS.dropout, louder: Math.random() < 1 / 3 });
      neon.neonTick();
      scene.set({ logo: 0.8 }); setTimeout(() => scene && scene.set({ logo: 1 }), 200);
      scheduleFlicker();
    }, 20000 + Math.random() * 20000);
  }

  // ------------------------------------------------------------------ the games (a sheet; the city's billboards show them too)
  function openGames() {
    sfx('select');
    const games = GAMES.filter(g => g.playable);
    // (SHELL 2.0 A: THE SHEET)
    const sheet = openSheet({ title: 'THE GAMES', kicker: `${games.length} party games · ${MIN_PLAYERS}–${MAX_PLAYERS} players · one phone each`, cls: 'nd-games-sheet', label: 'The games', body: [
      h('div.nd-games',
        h('div.nd-games-grid', ...games.map(g => h('button.nd-gtile', {
          type: 'button', dataset: { id: g.id, theme: g.theme }, style: { '--acc': ACC[g.id] || '#d6f0ff' },
          onclick: () => { sheet.close(); tap.preview(g); },
        }, gameArt(g.id) || h('div.gc-glyph'), h('span.nd-gtile-n', g.name), h('span.nd-gtile-t', g.tag)))))] });
  }
  // (title-taps.js: moved out by scripts/split-closure.mjs — T carries the names it shares with this closure, live)
  const tap = createTaps({
    get ACC() { return ACC; },
    get busy() { return busy; },
    get destroyed() { return destroyed; },
    get dk() { return dk; },
    get els() { return els; },
    get IDLE_FIRST_MS() { return IDLE_FIRST_MS; },
    get IDLE_MS_AFTER() { return IDLE_MS_AFTER; },
    get isFirstVisit() { return isFirstVisit; },
    get logoRect() { return logoRect; },
    get NEON_TAP_LEVEL() { return NEON_TAP_LEVEL; },
    get neonOnSound() { return neon.neonOnSound; },
    get neonTick() { return neon.neonTick; },
    get raceLogo() { return neon.raceLogo; },
    get reduced() { return reduced; },
    get roomUi() { return roomUi; },
    get scene() { return scene; },
    get tagState() { return tagState; },
    get tl() { return tl; },
  });

  // the screen's update (the dock's YOU / REJOIN / an invite; the room — roomSync)
  function update(state) {
    st = state;
    if (!els.youTab) return;
    roomSync(state);
    // (FRIENDS A — A FRIEND's INVITE PUSH (/?room=CODE&inv=1) opens straight into the room's JOIN: once the app is ready + this phone has a
    //  name, the knock goes by itself — the normal join rules (LOCK THE DOOR, kicked, full) answer as for any join; no name → setup first)
    if (state.invite && state.ready && els.autoJoined !== state.invite && (state.autoJoin === state.invite || /(^|[?&])inv=1(&|$)/.test(location.search)) && !state.code) {
      els.autoJoined = state.invite;
      try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])inv=1(&|$)/, '$1').replace(/[?&]$/, '')); } catch { /* fine */ }
      dk.join(dk.clean(state.invite));
    }
    const p = loadProfile();
    const me = loadMe();
    const pub = me && me.profile && me.uid === state.uid ? me.profile : null;
    const sig = `${p ? `${p.name}|${p.color}|${p.avatar}` : ''}|${pub ? `${pub.t}|${pub.r}|${pub.x}` : ''}|${state.rejoin || ''}|${state.invite || ''}|${state.inviteExpired || ''}`;
    if (sig === els.sig) return;
    els.sig = sig;
    // YOU: your own emblem in your colour (a neutral outline emblem before there's a profile). Each piece is rebuilt only
    // when its own data changes: replacing a button between a finger's touch-down and its click loses the click.
    const youSig = `${p ? `${p.name}|${p.color}|${p.avatar}` : ''}|${pub ? `${pub.r}|${pub.x}` : ''}`;
    const ic = els.youTab.querySelector('.nd-tab-ic');
    if (youSig === els.youSig) { /* unchanged */ } else if ((els.youSig = youSig) && p && p.name) {
      ic.replaceChildren(avatar(p.avatar, p.color, 27));
      els.youTab.setAttribute('aria-label', `Your membership card, ${p.name}${pub ? `, ${levelLabel(pub.x || 0)}` : ''}`);
      els.youTab.classList.remove('is-guest');
    } else {
      ic.innerHTML = ICON.guest;
      els.youTab.setAttribute('aria-label', 'Create your player');
      els.youTab.classList.add('is-guest');
    }
    if (els.sub) els.sub.hidden = !!(p && p.name);
    if ((state.rejoin || '') !== els.rejoinCode) els.rejoin.replaceChildren(...(state.rejoin ? [h('button.nd-rejoin-btn', { type: 'button', 'aria-label': `Rejoin room ${state.rejoin}`, onclick: () => dk.join(state.rejoin, true) },
      h('i.nd-rejoin-dot', { 'aria-hidden': 'true' }), h('span.nd-rejoin-l', 'REJOIN'), ' ', h('b.nd-rejoin-c', state.rejoin))] : []));
    els.rejoinCode = state.rejoin || '';
    els.rejoin.hidden = !state.rejoin;
    if (state.invite && !els.code.value) {
      dk.openJoin(true);
      els.code.value = dk.clean(state.invite);
      dk.paintCode();
      dk.say(`You’re invited — the hush word is ${els.code.value}. Tap › to join.`, 'info');
      els.go.classList.add('is-ready');
    }
    if (state.inviteExpired) dk.note(`That room has closed (${state.inviteExpired}). Host a new game, or ask for a fresh hush word.`, 'warn', 9000);   // (FR6 FIXES A: a push for a room gone by the tap lands here)
  }
  // (title-dock.js#createDockWork: moved out by scripts/split-closure.mjs — T carries the names it shares with this closure, live)
  const dk = createDockWork({
    get busy() { return busy; }, set busy(v) { busy = v; },
    get destroyed() { return destroyed; },
    get els() { return els; },
    get openGames() { return openGames; },
  });

  // ------------------------------------------------------------------ test hook + unmount
  function setupHook() {
    window.__district = {
      scene: () => scene && scene.debug(),
      phase: () => (tl ? { kind: tl.kind, done: tl.done, t: tl.done ? tl.doneAt : (performance.now() - tl.t0) / 1000 } : { kind: 'gate', done: false }),
      skip,
      enter,
      setTier: t => scene && scene.setTier(t),
      frames: () => scene && scene.frames(),
      tiering: () => (scene && scene.tiering ? scene.tiering() : null),
      speakCtx: () => (scene && scene.speakCtx ? scene.speakCtx() : null),   // (WIN2: the facade's bake context — the washer swap's proof)
      boardXf: () => (scene && scene.boardXf ? scene.boardXf() : null),
      tri: () => (scene && scene.tri ? scene.tri() : null),   // (THE TRI-VISION — e2e lobby.mjs 'trivision')
      roomBanner: () => (roomUi && roomUi.banner ? roomUi.banner() : null),   // (LOBBY 2.0 B: THE WINNER's BANNER — e2e lobby2.mjs)
      bannerOn: () => !!(scene && scene.bannerOn && scene.bannerOn()),
      roomNearest: (x, y) => (roomUi && roomUi.nearestAt ? roomUi.nearestAt(x, y) : null),   // (LOBBY 2.0 B: the tap area's nearest rule — e2e lobby2.mjs)
      roomPeople: () => (scene && scene.roomDebug ? scene.roomDebug() : null),
      drawnNow: () => (scene && scene.drawnNow ? scene.drawnNow() : null),   // (SPEED PASS B: every figure the near pass drew — the leaver's count)   // (THE SPEED PASS: the room's figures even after the room is gone — e2e speed.mjs)
      room: () => (roomUi ? { ...roomUi.debug(), people: scene && scene.roomDebug ? scene.roomDebug() : null, solidHits: scene && scene.roomSolidHits ? scene.roomSolidHits() : [] } : null),   // (LOBBY 2.0 A: the room in the city — e2e lobby.mjs)   // (LOBBY 2.0 A: the billboard's cross-fade — e2e lobby.mjs)
      signDim: (id, o) => (scene && scene.dimSign ? (id ? scene.dimSign(id, o) : scene.signDim()) : null),   // (City 2.0, C1.5: the sign-dim hook)            // (City 2.0, NEON PASS 5: the tier, the frame-rate cap found)
      reduced,
      hit: (x, y) => scene && scene.hit(x, y),
      sightBoxes: () => (scene && scene.sightBoxes ? scene.sightBoxes() : []),   // (PROGRESSION B: the legendaries' tap boxes up now)
      idle: () => tap.goIdle(),
      quickIdle: () => tap.quickIdle,   // (9e: the QUICK FADE armed — the dock up for ~2 s over a front-street scene)
      idleMs: () => tap.IDLE_MS,        // (9g: 10 s on a device's first visit, 5 s after)
      frontBusy: () => (scene && scene.frontBusy ? scene.frontBusy() : null),
      isIdle: () => els.root.classList.contains('is-idle'),
      neonAt: t => (neon.neonPlanV ? neonState(neon.neonPlanV, t) : null),
      neonSounds: () => neon.neonSounds,
      neonSoundLog: () => neonSoundLog.slice(),                               // (11a-2: each power-on's kind + its total length, s)
      neonWarmSounds: () => neon.neonWarmSounds,                                   // (City 2.0: the warm-up's last-30-s flickers)
      neon: () => { const p = neon.neonPlanV; return { stage: neon.neonStage, letters: [...els.sign.querySelectorAll('.ndl')].map(l => l.classList.contains('on')), signs: neon.neonNow().signs, plan: p && { startAt: p.startAt, catchAt: p.catchAt, clearAt: p.clearAt, endAt: p.endAt, offFrom: p.offFrom, offTo: p.offTo, reduced: p.reduced }, now: scene && scene.now() }; },
      party: () => (scene ? scene.party() : null),
      lost: () => (scene && scene.lost ? scene.lost() : null),                // (FR7 FIXES A: THE LOST LOOK — n, why, the sentinel)
      purge: () => (scene && scene.purge ? scene.purge() : 0),                // (TESTS: a background purge, as iOS does it)
      loop: () => (scene && scene.loop ? scene.loop() : null),                // (8a: the city's frame loop — running, ms since its last frame, the watchdog's restarts)
      report: () => (scene && scene.report ? scene.report() : null),        // (9e: City 2.0's report snapshot + the hang watch)
      rainbow: () => (scene && scene.rainbow ? scene.rainbow() : null),
      street: () => (scene && scene.street ? scene.street() : null),
      cost: () => (scene && scene.cost ? scene.cost() : []),
      harbor: () => (scene && scene.harbor ? scene.harbor() : null),
      loadProbe: () => (scene && scene.loadProbe ? scene.loadProbe() : null),   // (THE LOAD FIX: the cheap per-frame read for kit/load-probe.mjs)
      radio: () => (scene && scene.radioDebug ? scene.radioDebug() : null),   // CITY CONTROLS A: the fired moments this phone plays
      remote: () => remote,                                              // CITY 2.0 only: THE PREVIEW PANEL (tests)     // CITY 2.0 only (?city=2): camera, layout, bake + memory
      door: () => (scene && scene.door ? scene.door() : null),
      finale: () => scene && scene.finale(),
      // (City 2.0 — THE MUSIC STARTING: signSurge() fires the sign's answer now and says what it did ('surge' unlit | 'first' lit |
      // 'catch' the warm-up window | 'soft' | 'skip:…'); surge() — how many ran, the last one { why: music | force | hook, did, at },
      // pending (waiting for the intro / a race to end), cool (ms left of the 10 s cooldown after a real answer to the music))
      signSurge: () => neon.signSurge('hook'),
      surge: () => ({ count: neon.surgeCount, last: neon.surgeLast, skip: neon.surgeSkip, pending: !!neon.surgePending, onBeat: neon.onBeat ? { ...neon.onBeat } : null, cool: Math.max(0, Math.round(neon.SURGE_COOL - (performance.now() - surgeAt))),
        running: !!(neon.race && (neon.race.kind === 'surge' || neon.race.kind === 'first')) }),
      dock: {
        join: dk.openJoin,
        preview: patch => { els.sig = null; update({ ...st, ...patch }); },   // test-only: show the dock for a state (REJOIN, an invite)
        note: dk.note,
        recolor: () => dk.ringColors(true),
        sunAt: (x, y, r = 16.5) => { sunOverride = x == null ? null : { x, y, r, vis: 1, col: [255, 236, 200] }; sunGlass(); },
        // [BOARD, GAMES, YOU, the corner buttons]
        icons: () => [...dk.dock.tabs().map(t => !!(t && t.classList.contains('is-lit'))), dk.dock.corners().length > 0 && dk.dock.corners().every(b => b.classList.contains('nd-cl-lit'))],
        ring: () => ({ lit: dk.dock.ringLit(), on: !!(els.host && els.host.classList.contains('is-lit')), join: !!(els.joinTab && els.joinTab.classList.contains('is-lit')), multi: els.host ? els.host.dataset.multi : null, g: [1, 2, 3, 4].map(i => (els.hostSlot ? els.hostSlot.style.getPropertyValue(`--hg${i}`) : '')) }),
      },
    };
  }

  function unmount() {
    destroyed = true;
    if (els.down) { els.down.remove(); els.down = null; return; }   // (CITY 1.0 OUT: the city never loaded — only the card to take away)
    clearTimeout(keyPopT); if (offKeyPop) { offKeyPop(); offKeyPop = null; }
    clearTimeout(frT); if (offFrB) { offFrB(); offFrB = null; }
    if (roomUi) { roomUi.destroy(); roomUi = null; }
    neon.humSync(false);
    if (tl) cancelAnimationFrame(tl.raf);
    clearTimeout(flickerTimer); clearInterval(tiredT);
    clearTimeout(els.logoTimer);
    clearTimeout(els.skyTimer);
    clearTimeout(neon.neonT);
    clearTimeout(tap.idleTimer); clearTimeout(els.tagTimer); clearTimeout(els.tagSlotTimer);
    document.body.classList.remove('nd-idle');
    document.querySelectorAll('.nd-sunlit').forEach(b => b.classList.remove('nd-sunlit'));
    window.removeEventListener('pointerdown', tap.onWake, { capture: true });
    window.removeEventListener('click', tap.onWakeClick, { capture: true });
    window.removeEventListener('keydown', tap.onWake, { capture: true });
    window.removeEventListener('pointermove', tap.onMouse); if (tap.hoverRaf) cancelAnimationFrame(tap.hoverRaf); tap.hoverRaf = 0;
    window.removeEventListener('pointerdown', tap.onCityDown);
    window.removeEventListener('pointerup', tap.onCityUp);
    document.removeEventListener('visibilitychange', tap.onShown); window.removeEventListener('pageshow', tap.onShown); window.removeEventListener('focus', tap.onShown);
    clearTimeout(sgDemoT); clearTimeout(extrasT);
    clearTimeout(neon.surgeIv); clearTimeout(neon.beatT); clearTimeout(bycT); document.removeEventListener('pointerup', neon.armTap, true);
    document.removeEventListener('visibilitychange', onVisTitle);
    window.removeEventListener('pointerdown', dk.outsideDown, { capture: true });
    if (window.visualViewport) { window.visualViewport.removeEventListener('resize', dk.fitKeyboard); window.visualViewport.removeEventListener('scroll', dk.fitKeyboard); }
    clearTimeout(dk.noteT);
    if (els.probe) els.probe.remove();
    if (els.probeB) els.probeB.remove();
    document.body.classList.remove('nd-on');
    document.body.style.removeProperty('--dk-tint');
    dressCorners(false);
    if (dk.dock) dk.dock.destroy();
    clearTimeout(remoteT);
    if (remote) { remote.destroy(); remote = null; liveRemote = null; }
    const wrap = els.sceneWrap;
    captureBackdrop(els.canvas, scene.partyLight ? scene.partyLight() : null);   // the menus keep a still of the city (+ the party's light, which breathes on)
    const sc = scene;
    scene = null;
    // (THE CITY's LONG NIGHT: the city STOPS at once — its frame loop + timers — the last frame under the fade; its teardown after it)
    if (sc && sc.halt) sc.halt();
    wrap.classList.add('is-out');
    setTimeout(() => { sc && sc.destroy(); wrap.remove(); }, 420);
    if (window.__district) delete window.__district;
    cityDone();   // (THE LOAD FIX: a title going away never keeps the boot screen up)
  }

  return { mount, update, unmount };
}

