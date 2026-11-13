// OVERCLOCK module entry (see games/registry.js for the contract).
import { createGame, nextStep } from './director.js';
import { DEFAULT_SETTINGS, MODES, standings as ocStandings } from './logic.js';
import { gradeRoom as gradeRoomOf } from './grade.js';
// (SHELL 2.0 B1 — THE THIN META: the console's pieces — OPTIONS, estimateMinutes, MUSIC, the banner, the chat's lock, LOOKS — from meta.js)
export * from './meta.js';
// OC7 — NO LIVE TRIVIA SERVICE: TRIVIA LIGHTNING deals from OVERCLOCK's OWN bank (data/oc/trivia.json — banks.js), like every other pool.
// js/trivia/ (the shared feed: The Trivia API → Open Trivia DB → the bundled bank) stays exactly as it is for HIGH STAKES, LAST SIGNAL, BLUFF …
// — OVERCLOCK imports nothing from it (tests/overclock-oc7.test.mjs).
import { state } from '../../store.js';
import { serverNow, update as dbUpdate, dbRef } from '../../firebase.js';
import { isOnline } from '../../core/room-logic.js';
import { usedOf } from '../kit/night.js';
import { dealMatch, DEALT, orderFor } from './deal.js';
import { loadBank, bankFor, BANK_TYPES } from './banks.js';
import { loadLengths, answersFor } from '../cipher/words.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { sealGate, unsealed, mergeSealed } from '../kit/seal.js';
import { lazyImport } from '../../ui/lazy-import.js';
// the view loads when a match of this game is on screen (keeps first paint light)
export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), gameSheets('overclock'));

// boards = the progress (THE SEAL keeps the answers), marks = the per-answer combo marks (OC1), next = the after-challenge taps (OC1)
export const livePaths = g => ({ boards: `oc/${g.matchId}/${g.ci || 0}`, marks: `ocm/${g.matchId}/${g.ci || 0}`, next: `ocnext/${g.matchId}/${g.ci || 0}` });

const settle = (p, ms) => Promise.race([p.catch(() => null), new Promise(r => setTimeout(() => r(null), ms))]);

// THE ORDER, PREDICTABLE (OC8 — A6, THE FABLE REVIEW: a pool challenge FIRST on a slow connection sat on SYNCING while the room's clock ran, and
// a bank slower than the host's 3-s wait was dealt WITHOUT the night memory): the match's order is drawn from a seed made of the MATCH ID —
// meta/go carries it to every phone at the host's tap — so each phone's preload() predicts the first challenge DURING THE WALK INSIDE and starts
// its pool then. The deal + the race keep their own random seed. (A wrong guess — the night memory or the mode changed in the same second — only
// fetched a pool for nothing.) `?emu` + window.__ocFirst = '<type>' puts that type first on THAT phone (the slow-network E2E, every phone).
// orderSeed + orderFor live in deal.js (pure — unit-tested).
/** the walk inside's length from now (the host's start() waits for its banks up to it — never less than the old 3 s, never past ~6 s) */
const walkLeft = now => Math.max(3000, Math.min(6000, (Number(now) || 0) - serverNow() - 400));

export async function start({ code, matchId, settings, participants, now, used }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const night = used && typeof used === 'object' ? used : ((state.meta && state.meta.used) || {});
  const seed = `${matchId}:${Math.random().toString(36).slice(2, 10)}`;
  const mine = usedOf({ used: night }, 'overclock');
  const total = MODES[s.mode] || MODES.quick;
  const order = orderFor({ matchId, mode: s.mode, used: night, n: Object.keys(participants || {}).length });
  // the deal needs the banks this order uses (+ Unscramble's word lists) — fetched in parallel, never past THE WALK INSIDE (OC8 — A6: was a
  // flat 3 s; a bank that didn't make it = that challenge's seeded per-match deck, as ever)
  // EACH bank settles on its own (OC8 — A6: they waited all together, so ONE slow pool on 3G threw away every challenge's deal)
  const need = BANK_TYPES.filter(t => order.includes(t) && DEALT.includes(t));
  const wait = walkLeft(now);
  const [pairs, words] = await Promise.all([
    Promise.all(need.map(t => settle(loadBank(t), wait).then(b => [t, b]))),
    order.includes('unscramble') ? settle(loadLengths([5, 6, 7]).then(() => true), wait) : Promise.resolve(false),
  ]);
  const banks = Object.fromEntries(pairs.filter(([, b]) => b));
  const { deal, dk } = dealMatch({ seed, order, total, banks: banks || {}, words: words ? answersFor : () => null, used: mine });
  return createGame({ matchId, settings: s, participants, now, seed, order, deal, dk });
}

// THE PRELOAD (docs/cartridge.md — every phone, during the walk inside; ≤ PRELOAD_BUDGET 1.5 MB, never blocks the start) — OC8 (A6): + the
// FIRST challenge's pool when it is a pool challenge (predicted from meta/go — orderFor above; the biggest, TRIVIA, keeps it inside the budget): OC1's sounds
// (~110 KB), the OVERDRIVE fonts (~67 KB — css/overclock.css's @font-face finds them in the cache), the crack textures + Unscramble's word
// lists (a phone doesn't know the order before the host's start() lands). THE POOLS are NOT preloaded (OC6: the four fact pools; OC7: every
// bank — TRIVIA, CLOSEST CALL, MISSING LINK, SPELLCHECK grew ~10×): each loads only for a match that DEALS it — the host's start() (above) +
// every phone's view at mount (view.js#preloadFor(order)), during the rules card + the 3-2-1, long before its challenge opens.
export const OC_LAZY_POOLS = Object.freeze([...BANK_TYPES]);
export const OC_PRELOAD_BANKS = Object.freeze(BANK_TYPES.filter(t => !OC_LAZY_POOLS.includes(t)));
export const OC_FONT_FILES = ['barlow-condensed-900i', 'barlow-condensed-800i', 'chakra-petch-700', 'chakra-petch-500'];
// OC4 — THE REAL-GLASS CRACK's two textures (~100 KB: assets/overclock/ — crack.js; the view decodes them at mount)
export const OC_CRACK_FILES = ['crack.webp', 'crack-glow.webp'];
/** OC8 — A6: the first challenge's pool, predicted from the start's stamp (meta/go: the match id) — fetched during the walk inside */
export function firstPool({ settings } = {}) {
  const go = state.meta && state.meta.go;
  if (!go || !go.m || (go.g && go.g !== 'overclock')) return null;
  const n = Object.keys(state.players || {}).filter(u => isOnline(state.presence, u)).length;
  const order = orderFor({ matchId: go.m, mode: { ...DEFAULT_SETTINGS, ...(settings || {}) }.mode, used: (state.meta && state.meta.used) || {}, n });
  return BANK_TYPES.includes(order[0]) ? order[0] : null;
}
export function preload(opts = {}) {
  let first = null;
  try { first = firstPool(opts); } catch { /* */ }
  const fonts = OC_FONT_FILES.map(f => fetch(new URL(`../../../assets/fonts/overclock/${f}.woff2`, import.meta.url)).then(r => r.arrayBuffer()).catch(() => null));
  return Promise.all([
    lazyImport(import('./sfx.js'), './sfx.js').then(m => m.ocSfxBytes()).catch(() => null),
    ...fonts,
    ...OC_CRACK_FILES.map(f => fetch(new URL(`../../../assets/overclock/${f}`, import.meta.url)).then(r => r.arrayBuffer()).catch(() => null)),
    ...OC_PRELOAD_BANKS.map(t => loadBank(t).catch(() => null)),
    first ? loadBank(first).catch(() => null) : null,
    loadLengths([5, 6, 7]).catch(() => null),
  ]).then(() => true, () => false);
}

// (OC7: nothing to top up — the host holds no question supply; every challenge is in the deal)
// THE LATE DEAL (OC8 — A6): a pool that missed the host's start() (a slow connection) is dealt as soon as it arrives — with THE NIGHT MEMORY,
// around every item already dealt — for a challenge that hasn't opened yet: a later one, or the current one while ≥ 2.5 s of its rules card
// remain (every phone has the deal long before it builds the challenge at 'play'; never a deal that could land after a phone built it).
// Idempotent: once written, game.deal[ci] is there and nothing is asked again.
const LATE_MARGIN_MS = 2500;
let lateSig = '';
export function prepare(game, { code } = {}) {
  if (!game || !code || !Array.isArray(game.order) || (game.phase !== 'ready' && game.phase !== 'play' && game.phase !== 'standings')) return;
  const now = serverNow();
  const open = (t, ci) => BANK_TYPES.includes(t) && DEALT.includes(t) && !(game.deal && game.deal[ci])
    && (ci > game.ci || (ci === game.ci && game.phase === 'ready' && now < (game.phaseEndsAt || 0) - LATE_MARGIN_MS));
  const want = game.order.map((t, ci) => [t, ci]).filter(([t, ci]) => open(t, ci));
  if (!want.length) return;
  for (const [t] of want) if (!bankFor(t)) loadBank(t).catch(() => {});
  const ready = want.filter(([t]) => bankFor(t));
  const sig = `${game.matchId}:${ready.map(([, ci]) => ci).join(',')}`;
  if (!ready.length || sig === lateSig) return;
  lateSig = sig;
  const used = { ...((state.meta && state.meta.used && state.meta.used.overclock) || {}) };
  for (const keys of Object.values(game.dk || {})) for (const k of String(keys || '').split(' ')) if (k) used[k] = true;
  const banks = Object.fromEntries(ready.map(([t]) => [t, bankFor(t)]));
  const { deal, dk } = dealMatch({ seed: `${game.seed}:late`, order: game.order, total: game.total, banks, words: () => null, used });
  const patch = {};
  for (const [, ci] of ready) if (deal[ci] && dk[ci]) { patch[`deal/${ci}`] = deal[ci]; patch[`dk/${ci}`] = dk[ci]; }
  if (Object.keys(patch).length) dbUpdate(dbRef(`rooms/${code}/game`), patch).catch(() => { lateSig = ''; });
}

// THE SEAL (kit/seal.js): a challenge's ANSWERS (o: an order · g: a guess · rw: the rewiring) live in seal/{CODE}/… —
// the room shows the progress (p · ok · n · done); at the end of 'play' the host unseals them and publishes them for the reveal
// (game/rv/{ci}/{uid}: the closest guesses on the number line, …). ('w' was LEXICON's word — cut in OC1; the rules still allow it.)
export const sealed = g => ({ boards: `oc/${g.matchId}/${g.ci || 0}` });
export const OC_SECRET = ['w', 'o', 'g', 'rw'];
export const step = (game, { code, now, live, online }) => {
  const ck = String(game.ci || 0);
  const patch = sealGate(game, nextStep(game, {
    now,
    online,
    boards: mergeSealed(live.boards, live.seal_boards),
    marks: live.marks || {},
    next: live.next || {},
    graded: gradeRoom(game, live, ck),
  }), { node: 'oc', key: ck, phase: 'play' });
  if (patch && game.phase === 'play' && patch.phase && patch.phase !== 'play' && unsealed(game, 'oc', ck)) {
    const rv = {};
    for (const [uid, e] of Object.entries(live.seal_boards || {})) {
      const x = {};
      for (const f of OC_SECRET) if (e && e[f] != null) x[f] = e[f];
      if (Object.keys(x).length) rv[uid] = x;
    }
    if (Object.keys(rv).length) patch[`rv/${ck}`] = rv;
  }
  return patch;
};

/**
 * FR7 FIXES A — HOST-GRADED (grade.js; the owner's decision 1): after PENCILS DOWN (the unseal) the host rebuilds the dealt challenge — the
 * same generate() every phone ran — and grades each player's sealed picks → { uid: ok } (the director's computeResults takes the min with
 * the phone's own). Picks (`a`) are sealed only on rules that know them: no envelope in the room with `a` = the old rules → null (the phones'
 * ok stands — the fallback until the re-publish); once one has them, a missing one grades as no answers. TIMELINE + CLOSEST CALL grade from
 * the order / the guess every phone has always sealed. A pool not loaded on this phone yet → loads it, the phones' ok this once.
 */
export function gradeRoom(game, live, ck = String((game && game.ci) || 0)) {
  if (!game || !unsealed(game, 'oc', ck)) return null;
  return gradeRoomOf(game, live, { bank: t => { if (!BANK_TYPES.includes(t)) return {}; const b = bankFor(t); if (!b) loadBank(t).catch(() => {}); return b || null; } });
}

export const finalRanks = game => ocStandings(game).map(r => ({ uid: r.uid, rank: r.rank }));
// PLAY NOW's add-on — SHARE YOUR RUN: the console's solo podium offers SHARE when a cartridge has this (a lazy share.js draws the card ON THE
// PHONE through the kit's frame — js/games/kit/share-run.js) → 'shared' | 'saved' | 'copied' | 'none' | 'failed'
export const shareRun = (game, state) => lazyImport(import('./share.js'), './share.js').then(m => m.shareRun(game, state));

// THE DAILY PLUG-IN (OC5 — SHIPS OFF; docs/cartridge.md D2): the server-picked, sealed DAY SET in → today's six (a solo QUICK run, fully
// deterministic, never DUMB LUCK) · one try a day (resumeKey) · ONE comparable score out (result + the server's replay) — daily.js
export { daily } from './daily.js';

// THE VICTORY BODY (OC2 — contract D8): the console's podium frame (ui/final.js) draws this inside itself — OVERCLOCKED, the neon-tube winner,
// the podium on the slim cards, the award chips; SOLO's score. victory.js
export { finalScene } from './victory.js';

// (THE CARTRIDGE PLUG's chat lock + BANNER_NAME + LOOKS: meta.js)
