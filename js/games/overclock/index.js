// OVERCLOCK module entry (see games/registry.js for the contract).
import { createGame, nextStep, triviaNeeded } from './director.js';
import { DEFAULT_SETTINGS, MODES, buildOrder, standings as ocStandings } from './logic.js';
// (SHELL 2.0 B1 — THE THIN META: the console's pieces — OPTIONS, estimateMinutes, MUSIC, the banner, the chat's lock, LOOKS — from meta.js)
export * from './meta.js';
import { initialBank, topUp, fallbackPatch } from '../../trivia/feed.js';
import { loadFallback } from '../../trivia/bank.js';
import { state } from '../../store.js';
import { usedOf } from '../kit/night.js';
import { dealMatch, playedTypes, DEALT } from './deal.js';
import { loadBank, BANK_TYPES } from './banks.js';
import { loadLengths, answersFor } from '../cipher/words.js';

// THE ROOM's NIGHT MEMORY (deal.js): what this room has seen tonight. start() gets it through the contract (start({ used }) —
// docs/cartridge.md); the host's later top-ups (prepare, every tick) read the room as it is now.
const roomSeen = () => usedOf(state.meta, 'trivia');
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
  // the deal needs the banks this order uses (+ Unscramble's word lists) — fetched in parallel with the trivia bank, never past ~3 s
  const need = BANK_TYPES.filter(t => order.includes(t) && DEALT.includes(t));
  const [trivia, banks, words] = await Promise.all([
    initialBank({ code, matchId, cats: [], now, min: 12, roomSeen: usedOf({ used: night }, 'trivia') }),
    settle(Promise.all(need.map(t => loadBank(t).then(b => [t, b], () => [t, null]))).then(Object.fromEntries), 3000),
    order.includes('unscramble') ? settle(loadLengths([5, 6, 7]).then(() => true), 3000) : Promise.resolve(false),
  ]);
  const { deal, dk } = dealMatch({ seed, order, total, banks: banks || {}, words: words ? answersFor : () => null, used: mine });
  const { bank, trivia: tv, $room } = trivia;
  return { ...createGame({ matchId, settings: s, participants, now, seed, bank, trivia: tv, order, deal, dk }), $room };
}

// THE PRELOAD (docs/cartridge.md — every phone, during the walk inside; ≤ PRELOAD_BUDGET 1.5 MB, never blocks the start): OC1's sounds
// (~110 KB), the OVERDRIVE fonts (~67 KB — css/overclock.css's @font-face finds them in the cache) and the content pools — ALL of them, they
// are small (the banks ~125 KB + Unscramble's word lists ~260 KB): a phone doesn't know the order before the host's start() lands.
export const OC_FONT_FILES = ['barlow-condensed-900i', 'barlow-condensed-800i', 'chakra-petch-700', 'chakra-petch-500'];
// OC4 — THE REAL-GLASS CRACK's two textures (~100 KB: assets/overclock/ — crack.js; the view decodes them at mount)
export const OC_CRACK_FILES = ['crack.webp', 'crack-glow.webp'];
export function preload() {
  const fonts = OC_FONT_FILES.map(f => fetch(new URL(`../../../assets/fonts/overclock/${f}.woff2`, import.meta.url)).then(r => r.arrayBuffer()).catch(() => null));
  return Promise.all([
    import('./sfx.js').then(m => m.ocSfxBytes()).catch(() => null),
    ...fonts,
    ...OC_CRACK_FILES.map(f => fetch(new URL(`../../../assets/overclock/${f}`, import.meta.url)).then(r => r.arrayBuffer()).catch(() => null)),
    ...BANK_TYPES.map(t => loadBank(t).catch(() => null)),
    loadLengths([5, 6, 7]).catch(() => null),
  ]).then(() => true, () => false);
}

export function prepare(game, { code, host }) {
  if (!host) return;
  loadFallback().catch(() => {});
  topUp(() => state.game, code, triviaNeeded(game), roomSeen);
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
    fallback: n => fallbackPatch(game, code, n, roomSeen()),
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
