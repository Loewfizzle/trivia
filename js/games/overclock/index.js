// OVERCLOCK module entry (see games/registry.js for the contract).
import { createGame, nextStep } from './director.js';
import { DEFAULT_SETTINGS, MODES, buildOrder, standings as ocStandings } from './logic.js';
// (SHELL 2.0 B1 — THE THIN META: the console's pieces — OPTIONS, estimateMinutes, MUSIC, the banner, the chat's lock, LOOKS — from meta.js)
export * from './meta.js';
// OC7 — NO LIVE TRIVIA SERVICE: TRIVIA LIGHTNING deals from OVERCLOCK's OWN bank (data/oc/trivia.json — banks.js), like every other pool.
// js/trivia/ (the shared feed: The Trivia API → Open Trivia DB → the bundled bank) stays exactly as it is for HIGH STAKES, LAST SIGNAL, BLUFF …
// — OVERCLOCK imports nothing from it (tests/overclock-oc7.test.mjs).
import { state } from '../../store.js';
import { usedOf } from '../kit/night.js';
import { dealMatch, playedTypes, DEALT } from './deal.js';
import { loadBank, BANK_TYPES } from './banks.js';
import { loadLengths, answersFor } from '../cipher/words.js';
import { lazyView, gameSheets } from '../lazy-view.js';
import { sealGate, unsealed, mergeSealed } from '../kit/seal.js';
// the view loads when a match of this game is on screen (keeps first paint light)
export const createView = lazyView(() => import('./view.js'), gameSheets('overclock'));

// boards = the progress (THE SEAL keeps the answers), marks = the per-answer combo marks (OC1), next = the after-challenge taps (OC1)
export const livePaths = g => ({ boards: `oc/${g.matchId}/${g.ci || 0}`, marks: `ocm/${g.matchId}/${g.ci || 0}`, next: `ocnext/${g.matchId}/${g.ci || 0}` });

const settle = (p, ms) => Promise.race([p.catch(() => null), new Promise(r => setTimeout(() => r(null), ms))]);

export async function start({ code, matchId, settings, participants, now, used }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const night = used && typeof used === 'object' ? used : ((state.meta && state.meta.used) || {});
  const seed = `${matchId}:${Math.random().toString(36).slice(2, 10)}`;
  const mine = usedOf({ used: night }, 'overclock');
  const total = MODES[s.mode] || MODES.quick;
  // (OC5 — DUMB LUCK joins the deal with 2+ players only: never in SOLO)
  const order = buildOrder(seed, total, playedTypes(mine), { luck: Object.keys(participants || {}).length >= 2 });
  // the deal needs the banks this order uses (+ Unscramble's word lists) — fetched in parallel, never past ~3 s (a bank that didn't make it =
  // that challenge's seeded per-match deck, as ever)
  const need = BANK_TYPES.filter(t => order.includes(t) && DEALT.includes(t));
  const [banks, words] = await Promise.all([
    settle(Promise.all(need.map(t => loadBank(t).then(b => [t, b], () => [t, null]))).then(Object.fromEntries), 3000),
    order.includes('unscramble') ? settle(loadLengths([5, 6, 7]).then(() => true), 3000) : Promise.resolve(false),
  ]);
  const { deal, dk } = dealMatch({ seed, order, total, banks: banks || {}, words: words ? answersFor : () => null, used: mine });
  return createGame({ matchId, settings: s, participants, now, seed, order, deal, dk });
}

// THE PRELOAD (docs/cartridge.md — every phone, during the walk inside; ≤ PRELOAD_BUDGET 1.5 MB, never blocks the start): OC1's sounds
// (~110 KB), the OVERDRIVE fonts (~67 KB — css/overclock.css's @font-face finds them in the cache), the crack textures + Unscramble's word
// lists (a phone doesn't know the order before the host's start() lands). THE POOLS are NOT preloaded (OC6: the four fact pools; OC7: every
// bank — TRIVIA, CLOSEST CALL, MISSING LINK, SPELLCHECK grew ~10×): each loads only for a match that DEALS it — the host's start() (above) +
// every phone's view at mount (view.js#preloadFor(order)), during the rules card + the 3-2-1, long before its challenge opens.
export const OC_LAZY_POOLS = Object.freeze([...BANK_TYPES]);
export const OC_PRELOAD_BANKS = Object.freeze(BANK_TYPES.filter(t => !OC_LAZY_POOLS.includes(t)));
export const OC_FONT_FILES = ['barlow-condensed-900i', 'barlow-condensed-800i', 'chakra-petch-700', 'chakra-petch-500'];
// OC4 — THE REAL-GLASS CRACK's two textures (~100 KB: assets/overclock/ — crack.js; the view decodes them at mount)
export const OC_CRACK_FILES = ['crack.webp', 'crack-glow.webp'];
export function preload() {
  const fonts = OC_FONT_FILES.map(f => fetch(new URL(`../../../assets/fonts/overclock/${f}.woff2`, import.meta.url)).then(r => r.arrayBuffer()).catch(() => null));
  return Promise.all([
    import('./sfx.js').then(m => m.ocSfxBytes()).catch(() => null),
    ...fonts,
    ...OC_CRACK_FILES.map(f => fetch(new URL(`../../../assets/overclock/${f}`, import.meta.url)).then(r => r.arrayBuffer()).catch(() => null)),
    ...OC_PRELOAD_BANKS.map(t => loadBank(t).catch(() => null)),
    loadLengths([5, 6, 7]).catch(() => null),
  ]).then(() => true, () => false);
}

// (OC7: nothing to top up — the host holds no question supply; every challenge is in the deal)
export function prepare() {}

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

export const finalRanks = game => ocStandings(game).map(r => ({ uid: r.uid, rank: r.rank }));

// THE DAILY PLUG-IN (OC5 — SHIPS OFF; docs/cartridge.md D2): the server-picked, sealed DAY SET in → today's six (a solo QUICK run, fully
// deterministic, never DUMB LUCK) · one try a day (resumeKey) · ONE comparable score out (result + the server's replay) — daily.js
export { daily } from './daily.js';

// THE VICTORY BODY (OC2 — contract D8): the console's podium frame (ui/final.js) draws this inside itself — OVERCLOCKED, the neon-tube winner,
// the podium on the slim cards, the award chips; SOLO's score. victory.js
export { finalScene } from './victory.js';

// (THE CARTRIDGE PLUG's chat lock + BANNER_NAME + LOOKS: meta.js)
