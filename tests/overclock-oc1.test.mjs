// OVERCLOCK PASS 1 (OC1 — docs/overclock.md): THE RULES. Quick = the default, LEXICON cut, THE ROOM's NIGHT MEMORY (the deal + its marks,
// the types a rematch favours), THE AFTER-CHALLENGE SKIP (everyone connected tapped, never before 3 s), THE COMBO (maxStreak in the game),
// no chat during the match, the evening station, LOOKS ['night'] + the console's lock — and THE OWNER's TIMINGS, pinned.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as META from '../js/games/overclock/meta.js';
import { TYPES, CATEGORY, INFO, partsFor, generate, tlDeal, tlFair } from '../js/games/overclock/challenges.js';
import {
  buildOrder, categoryClashes, MODES, CHALLENGE_MS, READY_MS, BRIEF_MS, STANDINGS_MS, REVEAL_STANDINGS_MS, OVERALL_STAGE_MS, FINAL_MS,
  PLAY_GRACE_MS, SKIP_MIN_MS, standingsMs, comboFold, marksFor, levelOf, FRESH_TYPE_WEIGHT,
} from '../js/games/overclock/logic.js';
import { COMPASS_STEP_MS, COMPASS_GAP_MS, COMPASS_START_MS, COMPASS_FLASH_MS, REFLEX_TIMEOUT_MS, sortWindowMs } from '../js/games/overclock/challenges.js';
import { createGame, nextStep } from '../js/games/overclock/director.js';
import { DL_LOCK_MS, DL_RACE_MS, DL_FINISH_MS } from '../js/games/overclock/luck.js';
import { dealMatch, keysAt, playedTypes, typeKey, pickFresh, tlKey, DEALT } from '../js/games/overclock/deal.js';
import { usedOf } from '../js/games/kit/night.js';
import { rngFrom } from '../js/core/rng.js';
import { setLists, answersFor } from '../js/games/cipher/words.js';
import { lookLockOf, looksOf, checkCartridge, META_KEYS, START_ARGS } from '../js/games/cartridge.js';
import * as PRISM_META from '../js/games/prism/meta.js';

for (const n of [5, 6, 7]) setLists(n, JSON.parse(readFileSync(`data/words/answers-${n}.json`, 'utf8')), JSON.parse(readFileSync(`data/words/valid-${n}.json`, 'utf8')));
import { BANKS } from './fixtures/oc-banks.mjs';
// (OC7 — TRIVIA LIGHTNING is a bank like the rest: OVERCLOCK's own data/oc/trivia.json, dealt by id)
const deps = { ...BANKS, answersFor };

function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch || {})) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
}
/** a room's meta/used as the host's $room writes build it up */
function applyRoom(meta, patch) {
  for (const [k, v] of Object.entries((patch && patch.$room) || {})) {
    const [, , g, key] = k.split('/');   // meta/used/<game>/<key>
    if (k.startsWith('meta/used/')) ((meta.used ||= {})[g] ||= {})[key] = v;
  }
}
/** what start() does (index.js), minus the network: the order from the night's types, the deal from the night's items */
function startMatch({ matchId, mode = 'quick', participants, now = 0, seed, used = {} }) {
  const mine = usedOf({ used }, 'overclock');
  const total = MODES[mode];
  const order = buildOrder(seed, total, playedTypes(mine));
  const { deal, dk } = dealMatch({ seed, order, total, banks: BANKS, words: answersFor, used: mine });
  return createGame({ matchId, settings: { mode }, participants, now, seed, order, deal, dk });
}
/** DUMB LUCK (OC5) in a simulated match: the odds board locks (the draw), then the race + the finish run out — the step that ends 'play' */
function luckPlay(game, ctx) {
  if (game.phase !== 'play' || game.order[game.ci] !== 'dumbluck') return nextStep(game, ctx);
  if (!(game.dl && game.dl[game.ci])) {
    const lock = nextStep(game, { ...ctx, now: Math.max(ctx.now, game.playStartAt + DL_LOCK_MS) });   // (OC8: the host's lock = after the grace)
    assert.ok(lock && lock[`dl/${game.ci}`] && !lock.phase, 'the lock = the draw, still playing');
    applyPatch(game, lock);
  }
  return nextStep(game, { ...ctx, now: Math.max(ctx.now, game.dl[game.ci].lk + DL_RACE_MS + DL_FINISH_MS) });
}
const specOf = game => {
  const type = game.order[game.ci];
  const occ = game.order.slice(0, game.ci).filter(t => t === type).length;
  return generate(type, { seed: game.seed, ci: game.ci, level: levelOf(game.ci, game.total), occ, deal: (game.deal && game.deal[game.ci]) || null }, deps);
};
/** the items a spec shows, as comparable strings (what a player would call "we just had this one") */
function itemsOf(spec) {
  switch (spec.type) {
    case 'timeline': return spec.items.map(i => `tl:${spec.title}|${i.label}`);
    case 'closest': return [`cc:${spec.q}`];
    case 'missinglink': return spec.puzzles.map(p => `ml:${p.answer}:${[...p.words].sort().join('|')}`);
    case 'spellcheck': return spec.items.map(i => `sp:${i.word}`);
    case 'sortit': return [`so:${spec.left}|${spec.right}`];
    case 'higherlower': return spec.pairs.flatMap(p => [`hl:${p.stat}|${p.a.name}`, `hl:${p.stat}|${p.b.name}`]);
    case 'truefalse': return spec.items.filter((_, i) => i % 2).map(i => `tf:${i.id}`);
    case 'trivia': return spec.questions.map(q => `tv:${q.id}`);
    case 'unscramble': return [`un:${spec.word}`];
    default: return [];
  }
}

// ---------------------------------------------------------------------------------------------- THE OWNER's TIMINGS (Nov 4: never change them)
test('THE TIMINGS are unchanged (the owner: "I was barely keeping up as it was") — a later pass that shortens one fails here', () => {
  assert.equal(CHALLENGE_MS, 30_000);
  assert.equal(READY_MS, 3_200);
  assert.equal(BRIEF_MS, 7_000);
  assert.equal(STANDINGS_MS, 8_000);
  assert.equal(REVEAL_STANDINGS_MS, 12_000);
  assert.equal(OVERALL_STAGE_MS, 4_400);
  assert.equal(FINAL_MS, 120_000);
  assert.equal(PLAY_GRACE_MS, 700);
  assert.deepEqual(MODES, { quick: 6, standard: 12, marathon: 24 });
  // per-challenge: Compass's script, Signal Lock's timeout, Sort It's windows, Memory's length (the screens' own step speeds live in ui/)
  assert.deepEqual(COMPASS_STEP_MS, [760, 700, 640, 590, 550]);
  assert.equal(COMPASS_GAP_MS, 80);
  assert.deepEqual(COMPASS_START_MS, [1000, 500, 500, 500, 500]);
  assert.equal(COMPASS_FLASH_MS, 450);
  assert.equal(REFLEX_TIMEOUT_MS, 1200);
  assert.equal(sortWindowMs(0), 2600);
  assert.equal(sortWindowMs(11), 1200);
  // the generators' clocks: QUICK COUNT's flash 1.8 s early → 1.2 s late (the owner's favourite), MEMORY's step 620 → 440 ms
  for (const [level, flash, step] of [[0, 1800, 620], [0.5, 1500, 530], [1, 1200, 440]]) {
    assert.ok(generate('count', { seed: 't', ci: 0, level }).items.every(i => i.flashMs === flash), `QUICK COUNT flash at ${level}`);
    assert.equal(generate('memory', { seed: 't', ci: 0, level }).stepMs, step, `MEMORY step at ${level}`);
  }
  // the after-challenge screen keeps its max (the skip only ends it early) — standingsMs per type as before
  for (const t of TYPES) assert.equal(standingsMs(t), ['timeline', 'closest', 'missinglink', 'spellcheck', 'make24', 'compass', 'sortit', 'higherlower'].includes(t) ? 12_000 : 8_000, t);
  assert.equal(SKIP_MIN_MS, 3_000);
});

// ---------------------------------------------------------------------------------------------- QUICK, LEXICON, CHAT, MUSIC, LOOKS
test('QUICK is the default; the options read the new lineup; the evening station; no chat the whole match; LOOKS night only', () => {
  assert.deepEqual(META.DEFAULT_SETTINGS, { mode: 'quick' });
  assert.equal(META.estimateMinutes({}), META.estimateMinutes({ mode: 'quick' }));
  assert.ok(META.estimateMinutes({ mode: 'quick' }) <= 4);
  const subs = META.OPTIONS[0].choices.map(c => c.sub).join(' · ');
  assert.doesNotMatch(subs, /twenty/i, 'no "All twenty" — 19 kinds now');
  assert.equal(META.MUSIC, 'mood:evening');
  assert.ok(!('CHAT_CHIPS' in META), 'no chat chips');
  for (const phase of ['ready', 'play', 'standings']) assert.equal(META.chatLocked({ phase }, 'u', {}), true, `${phase}: locked`);
  assert.equal(META.chatLocked({ phase: 'final' }, 'u', {}), false, 'the podium: open');
  assert.equal(META.chatLocked(null), false);
  assert.deepEqual(META.LOOKS, ['night']);
  assert.ok(META_KEYS.includes('LOOKS'));
  const g = createGame({ matchId: 'm', settings: {}, participants: { a: true }, now: 0, seed: 's', bank: {}, trivia: { n: 0 } });
  assert.equal(g.total, 6, 'no mode = Quick');
});

test('LEXICON is cut cleanly: no type, category, rules, parts, generator, screen, bank, data file, help line or build script', () => {
  assert.ok(!TYPES.includes('lexicon'));
  assert.equal(TYPES.length, 19, '19 after the Lexicon cut, 18 after Make 24 (OC2), 19 with DUMB LUCK (OC5)');
  assert.ok(!('lexicon' in CATEGORY) && !('lexicon' in INFO));
  assert.equal(partsFor('lexicon', 0), 1, 'unknown → 1');
  assert.equal(generate('lexicon', { seed: 's', ci: 0, level: 0 }, {}), null);
  for (const f of ['js/games/overclock/ui/lexicon.js', 'data/oc/lexicon.json', 'scripts/build-lexicon.mjs']) assert.ok(!existsSync(f), `${f} gone`);
  for (const f of ['js/games/overclock/challenges.js', 'js/games/overclock/view.js', 'js/games/overclock/banks.js', 'js/games/overclock/reveals.js', 'js/games/overclock/logic.js', 'js/ui/help.js', 'css/overclock.css']) {
    assert.doesNotMatch(readFileSync(f, 'utf8'), /lexicon|\.lx-/i, f);
  }
});

test('MAKE 24 is cut cleanly (OC2 — the owner: "I don\'t like that challenge"): type, category, rules, parts, generator, screen, reveal, bank, solver, data, build script, help line', () => {
  assert.ok(!TYPES.includes('make24'));
  assert.ok(!('make24' in CATEGORY) && !('make24' in INFO));
  assert.equal(partsFor('make24', 0), 1, 'unknown → 1');
  assert.equal(generate('make24', { seed: 's', ci: 0, level: 0 }, {}), null);
  assert.ok(!DEALT.includes('make24'), 'the night memory deals no Make 24');
  for (const f of ['js/games/overclock/ui/make24.js', 'data/oc/make24.json', 'scripts/build-make24.mjs']) assert.ok(!existsSync(f), `${f} gone`);
  for (const f of ['js/games/overclock/challenges.js', 'js/games/overclock/view.js', 'js/games/overclock/banks.js', 'js/games/overclock/reveals.js', 'js/games/overclock/logic.js', 'js/games/overclock/deal.js', 'js/games/overclock/shared.js', 'js/ui/help.js', 'css/overclock.css']) {
    assert.doesNotMatch(readFileSync(f, 'utf8'), /make ?24|\bm24|solve24|fracEl/i, f);
  }
  // the room-night deal + buildOrder keep working without it (every type still dealt / ordered)
  const g = startMatch({ matchId: 'm24', participants: { a: true, b: true }, seed: 'no24' });
  assert.ok(g.order.every(t => TYPES.includes(t)) && g.total === 6);
});

test('MARATHON: every one of the 19 once + 5 repeats (OC5: DUMB LUCK once, never a repeat; SOLO = the 18 once + 6), its spacing + the category spread kept', () => {
  for (let s = 0; s < 200; s++) {
    const o = buildOrder(`mx${s}`, 24);
    const count = {};
    o.forEach(t => { count[t] = (count[t] || 0) + 1; });
    assert.equal(Object.keys(count).length, 19);
    assert.equal(count.dumbluck, 1);
    assert.equal(Object.values(count).filter(n => n === 2).length, 5);
    const solo = buildOrder(`mx${s}`, 24, [], { luck: false }), sc = {};
    solo.forEach(t => { sc[t] = (sc[t] || 0) + 1; });
    assert.equal(Object.keys(sc).length, 18);
    assert.ok(!solo.includes('dumbluck'));
    assert.equal(Object.values(sc).filter(n => n === 2).length, 6);
    assert.ok(Object.values(count).every(n => n <= 2));
    for (const t of Object.keys(count)) { const at = o.map((x, k) => (x === t ? k : -1)).filter(k => k >= 0); if (at.length === 2) assert.ok(at[1] - at[0] >= 8); }
    assert.equal(categoryClashes(o), 0);
  }
});

test('THE LOOKS through the plug: a one-look game is locked to it whatever the phone says; another game follows the setting', () => {
  assert.equal(lookLockOf(META), 'night', 'OVERCLOCK plays at night even on a phone set to DAY');
  assert.equal(lookLockOf(PRISM_META), null, 'PRISM DROP follows THE GAME LOOK');
  assert.deepEqual(looksOf(PRISM_META), ['day', 'night']);
  assert.equal(lookLockOf(null), null);
  const base = { start() {}, prepare() {}, step() {}, livePaths() {}, createView() {}, DEFAULT_SETTINGS: {}, OPTIONS: [], estimateMinutes() {}, finalRanks() {}, MUSIC: null };
  assert.deepEqual(checkCartridge('x', { ...base, LOOKS: ['night'] }), []);
  assert.equal(checkCartridge('x', { ...base, LOOKS: [] }).length, 1);
  assert.equal(checkCartridge('x', { ...base, LOOKS: ['dusk'] }).length, 1);
  assert.equal(checkCartridge('x', { ...base, LOOKS: ['day', 'day'] }).length, 1);
  // the console paints it (app.js#paintLook) + the setting says LOCKED (settings-panel.js) — read through the plug, never a game id
  const app = readFileSync('js/app.js', 'utf8'), panel = readFileSync('js/ui/settings-panel.js', 'utf8');
  assert.match(app, /lookLock = lookLockOf\(metaOf\(g\.id\)\)/);
  assert.match(panel, /lookLockOf\(metaOf\(g\.id\)\)/);
  assert.match(panel, /LOCKED/);
});

test('THE CONTRACT\'s `used`: host.js passes the room\'s night memory to start() (START_ARGS), the cartridge reads it there', () => {
  assert.ok(START_ARGS.includes('used'));
  const host = readFileSync('js/host.js', 'utf8');
  const call = host.match(/mod\.start\(\{([^}]*)\}/);
  assert.ok(call, 'the start call');
  for (const a of START_ARGS) assert.match(call[1], new RegExp(`\\b${a}\\b`), `host.js passes ${a}`);
  assert.match(readFileSync('js/games/overclock/index.js', 'utf8'), /export async function start\(\{[^}]*\bused\b/);
});

// ---------------------------------------------------------------------------------------------- THE ROOM's NIGHT MEMORY
test('the deal: every phone builds the same challenge from it; it avoids what the room saw tonight; a used-up pool reshuffles', () => {
  for (let s = 0; s < 40; s++) {
    const g = startMatch({ matchId: `m${s}`, mode: 'marathon', participants: { a: true }, seed: `deal${s}` });
    // every dealt type got a deal, and each is in range
    g.order.forEach((t, ci) => { if (DEALT.includes(t)) assert.ok(g.deal[ci] && g.dk[ci], `${t} at ${ci} dealt`); });
    const realRandom = Math.random;
    try {
      for (let ci = 0; ci < g.total; ci++) {
        const x = { ...g, ci };
        Math.random = () => 0.1; const A = JSON.stringify(specOf(x));
        Math.random = () => 0.9; const B = JSON.stringify(specOf(x));
        assert.equal(A, B, `${g.order[ci]} the same on two phones`);
        assert.notEqual(A, 'null');
      }
    } finally { Math.random = realRandom; }
    // inside one Marathon: no item twice (a type that comes twice gets new items)
    const all = [];
    for (let ci = 0; ci < g.total; ci++) all.push(...itemsOf(specOf({ ...g, ci })));
    assert.equal(new Set(all).size, all.length, `no repeats inside a match: ${all.filter((x, i) => all.indexOf(x) !== i)}`);
    // the keys it marks are stable ids / text hashes (never an index)
    assert.ok(Object.values(g.dk).every(k => /^[a-z0-9]+-[A-Za-z0-9_-]+( [a-z0-9]+-[A-Za-z0-9_-]+)*$/.test(k)), 'database-safe keys');
  }
  // the deal never deals a used item while a fresh fair four exists … (OC6: TIMELINE remembers ITEMS by id)
  const T = BANKS.timeline[0];
  const four = tlDeal(rngFrom('four'), T).map(i => T.items[i][3]);
  const used = {};
  for (const t of BANKS.timeline) for (const it of t.items) if (t !== T || !four.includes(it[3])) used[tlKey(t, it)] = true;
  const order = ['timeline'];
  const d = dealMatch({ seed: 'x', order, total: 1, banks: BANKS, used });
  assert.equal(d.deal[0][0], T.id, 'the one theme with a fresh four');
  assert.deepEqual(d.deal[0].slice(1).sort(), four.slice().sort(), 'the four fresh items');
  // … and a pool the night used up reshuffles (still deals four fair items, never stalls)
  const all = {}; for (const t of BANKS.timeline) for (const it of t.items) all[tlKey(t, it)] = true;
  const d2 = dealMatch({ seed: 'x', order, total: 1, banks: BANKS, used: all });
  assert.equal(d2.deal[0].length, 5);
  const T2 = BANKS.timeline.find(t => t.id === d2.deal[0][0]);
  const vals = d2.deal[0].slice(1).map(id => T2.items.find(it => it[3] === id)[1]);
  assert.ok(vals.every((a, i) => vals.every((b, j) => i === j || tlFair(T2.unit || 'year', a, b))), 'fair');
  assert.deepEqual(pickFresh(rngFrom('p'), 3, 5, () => true).sort(), [0, 1, 2], 'never more than the pool, never fewer');
  // a bank that didn't load → no deal for it (the old per-match deck)
  assert.equal(dealMatch({ seed: 'x', order, total: 1, banks: {}, used: {} }).deal[0], undefined);
});

test('a game night: 6 Quick matches in one room — no item dealt twice, the types rotate, every challenge marks itself as it opens', () => {
  const meta = {};
  const seenItems = new Map();
  const typesByMatch = [];
  const P = { a: true, b: true };
  for (let m = 0; m < 6; m++) {
    const game = startMatch({ matchId: `n${m}`, participants: P, seed: `night-${m}`, used: meta.used || {} });
    typesByMatch.push(game.order);
    let now = 0;
    for (let ci = 0; ci < game.total; ci++) {
      now = game.phaseEndsAt;
      const open = nextStep(game, { now, boards: {}, online: { a: true, b: true } });
      // the step that opens it marks its type + items (THE ROOM-NIGHT PATH: meta/used/overclock/<key>)
      const want = keysAt(game, ci).map(k => `meta/used/overclock/${k}`).sort();
      assert.deepEqual(Object.keys(open.$room).sort(), want);
      assert.ok(want.includes(`meta/used/overclock/${typeKey(game.order[ci])}`));
      // a replayed step (host migration) = the same patch
      assert.deepEqual(nextStep(game, { now, boards: {}, online: { a: true, b: true } }), open);
      applyRoom(meta, open);
      applyPatch(game, open);
      for (const it of itemsOf(specOf(game))) {
        assert.ok(!seenItems.has(it), `${it} — first in match ${seenItems.get(it)}, again in ${m}`);
        seenItems.set(it, m);
      }
      const parts = partsFor(game.order[ci], levelOf(ci, game.total));
      now += 4000;
      const done = { p: parts, ok: parts, n: parts, done: true, doneAt: now };
      applyPatch(game, luckPlay(game, { now, boards: { a: done, b: done }, online: { a: true, b: true } }));
      if (game.phase === 'standings') { now = game.phaseEndsAt; applyPatch(game, nextStep(game, { now, boards: {}, online: { a: true, b: true } })); }
    }
    assert.equal(game.phase, 'final');
  }
  // the rematch FAVOURS the types this room hasn't played: matches 1 + 2 + 3 together cover 18 of 19 types (with no memory ~13)
  // (OC5: 19 types — one night is a draw: 15+ here, and over many nights three matches average 16+ of 18 slots; with no memory ~13)
  const first3 = new Set(typesByMatch.slice(0, 3).flat());
  assert.ok(first3.size >= 15, `three matches cover ${first3.size} types`);
  let cover = 0;
  for (let n = 0; n < 300; n++) {
    const played = new Set();
    for (let m = 0; m < 3; m++) for (const t of buildOrder(`cover${n}-${m}`, 6, [...played])) played.add(t);
    cover += played.size;
  }
  assert.ok(cover / 300 >= 16, `three matches cover ${(cover / 300).toFixed(1)} types on average`);
  const overlap = typesByMatch[1].filter(t => typesByMatch[0].includes(t)).length;
  assert.ok(overlap <= 1, `match 2 repeats ${overlap} of match 1's types`);
  assert.ok(seenItems.size > 40);
});

test('the rematch favours fresh types — over many nights, and with no memory it is exactly the old draw', () => {
  let repeats = 0, n = 0;
  for (let s = 0; s < 300; s++) {
    const a = buildOrder(`r${s}`, 6);
    const b = buildOrder(`r${s}b`, 6, a);
    repeats += b.filter(t => a.includes(t)).length; n += 6;
    assert.equal(categoryClashes(b), 0, 'the category spread still holds');
    assert.equal(new Set(b).size, 6);
  }
  assert.ok(repeats / n < 0.08, `a rematch repeats ${(100 * repeats / n).toFixed(1)}% of the types (no memory ≈ 32%)`);
  // every type played → all count the same again (= the old draw)
  for (let s = 0; s < 50; s++) assert.deepEqual(buildOrder(`z${s}`, 6, TYPES), buildOrder(`z${s}`, 6));
  assert.ok(FRESH_TYPE_WEIGHT > 1);
});

// ---------------------------------------------------------------------------------------------- THE AFTER-CHALLENGE SKIP
test('THE AFTER-CHALLENGE SKIP: everyone connected tapped → on (never before 3 s); a dropped player never blocks; solo = your tap; else the full time', () => {
  const P = { a: true, b: true, c: true };
  const toStandings = () => {
    const g = createGame({ matchId: 'sk', settings: { mode: 'quick' }, participants: P, now: 0, seed: 'skip', bank: {}, trivia: { n: 99 } });
    applyPatch(g, nextStep(g, { now: g.phaseEndsAt, boards: {}, online: P }));
    const parts = partsFor(g.order[0], 0), t = g.playStartAt + 2000;
    const b = { p: parts, ok: parts, n: parts, done: true, doneAt: t };
    applyPatch(g, nextStep(g, { now: t, boards: { a: b, b, c: b }, online: P }));
    assert.equal(g.phase, 'standings');
    return g;
  };
  const g = toStandings();
  const t0 = g.phaseStartAt;
  const all = { a: t0 + 100, b: t0 + 200, c: t0 + 300 };
  assert.equal(nextStep(g, { now: t0 + 2999, boards: {}, online: P, next: all }), null, 'never before 3 s — the answer lands first');
  const go = nextStep(g, { now: t0 + 3000, boards: {}, online: P, next: all });
  assert.equal(go.phase, 'ready', 'everyone tapped + 3 s → the next challenge');
  assert.deepEqual(nextStep(g, { now: t0 + 3000, boards: {}, online: P, next: all }), go, 'a replay = the same patch');
  assert.equal(nextStep(g, { now: t0 + 6000, boards: {}, online: P, next: { a: 1, b: 1 } }), null, 'c hasn\'t tapped');
  assert.equal(nextStep(g, { now: t0 + 6000, boards: {}, online: { a: true, b: true, c: false }, next: { a: 1, b: 1 } }).phase, 'ready', 'c dropped — never blocks');
  assert.equal(nextStep(g, { now: t0 + 6000, boards: {}, online: { a: false, b: false, c: false }, next: {} }), null, 'nobody connected: the full time, no skip');
  assert.equal(nextStep(g, { now: g.phaseEndsAt - 1, boards: {}, online: P, next: {} }), null);
  assert.equal(nextStep(g, { now: g.phaseEndsAt, boards: {}, online: P, next: {} }).phase, 'ready', 'the max time is unchanged');
  assert.equal(g.phaseEndsAt - t0, standingsMs(g.order[0]));
  // solo: your own tap
  const s = createGame({ matchId: 'so', settings: { mode: 'quick' }, participants: { a: true }, now: 0, seed: 'solo', bank: {}, trivia: { n: 99 } });
  applyPatch(s, nextStep(s, { now: s.phaseEndsAt, boards: {}, online: { a: true } }));
  const ps = partsFor(s.order[0], 0);
  applyPatch(s, nextStep(s, { now: s.playStartAt + 1000, boards: { a: { p: ps, ok: 0, n: ps, done: true, doneAt: 1 } }, online: { a: true } }));
  assert.equal(nextStep(s, { now: s.phaseStartAt + 3100, boards: {}, online: { a: true }, next: { a: s.phaseStartAt + 50 } }).phase, 'ready');
});

// ---------------------------------------------------------------------------------------------- THE COMBO
test('THE COMBO: right answers in a row across challenges; a wrong one resets; halves + SIGNAL LOCK hold; maxStreak in the game', () => {
  assert.deepEqual(comboFold({ c: 0, m: 0 }, '111'), { c: 3, m: 3 });
  assert.deepEqual(comboFold({ c: 3, m: 3 }, '1101'), { c: 1, m: 5 });
  assert.deepEqual(comboFold({ c: 2, m: 4 }, 'h1-'), { c: 3, m: 4 }, 'a half + a no-right-or-wrong hold');
  assert.equal(marksFor('reflex', { s: '11111' }, {}, 5), '', 'SIGNAL LOCK neither adds nor breaks');
  assert.equal(marksFor('trivia', { s: '1x1' }, { p: 3, ok: 3 }, 3), '111', 'bad marks → the board');
  assert.equal(marksFor('trivia', null, { p: 3, ok: 3 }, 3), '111', 'old rules (no marks): a perfect board adds all');
  assert.equal(marksFor('trivia', null, { p: 3, ok: 2 }, 3), '0', '… anything less breaks it');
  assert.equal(marksFor('trivia', null, { p: 0, ok: 0 }, 3), '', '… nothing answered holds');
  // through the director: a 10-in-a-row across two challenges = the OVERDRIVE feat (m ≥ 10)
  const P = { a: true, b: true };
  const g = createGame({ matchId: 'cb', settings: { mode: 'quick' }, participants: P, now: 0, seed: 'combo', bank: {}, trivia: { n: 99 }, order: ['truefalse', 'math', 'reflex', 'count', 'oddone', 'memory'] });
  const run = (marksA, marksB, okA, okB) => {
    applyPatch(g, nextStep(g, { now: g.phaseEndsAt, boards: {}, online: P }));
    const parts = partsFor(g.order[g.ci], levelOf(g.ci, g.total)), t = g.playStartAt + 3000;
    const bd = ok => ({ p: parts, ok, n: parts, done: true, doneAt: t });
    applyPatch(g, nextStep(g, { now: t, boards: { a: bd(okA), b: bd(okB) }, online: P, marks: { a: { s: marksA }, b: { s: marksB } } }));
    if (g.phase === 'standings') applyPatch(g, nextStep(g, { now: g.phaseEndsAt, boards: {}, online: P }));
  };
  run('01111111', '11110111', 7, 7);     // true or false: a ends on 7, b on 3 (best 4)
  assert.deepEqual(g.combo.a, { c: 7, m: 7 });
  assert.deepEqual(g.combo.b, { c: 3, m: 4 });
  run('1111', '1011', 4, 3);             // quick math: a → 11 in a row (the x10 OVERDRIVE moment), b → 2
  assert.deepEqual(g.combo.a, { c: 11, m: 11 });
  assert.deepEqual(g.combo.b, { c: 2, m: 4 });
  run('-----', '-----', 5, 1);           // signal lock: holds
  assert.deepEqual(g.combo.a, { c: 11, m: 11 });
  run('1h10', '0000', 2.5, 0);           // quick count: a half holds, then a miss resets
  assert.deepEqual(g.combo.a, { c: 0, m: 13 });
  assert.deepEqual(g.combo.b, { c: 0, m: 4 });
});

// ---------------------------------------------------------------------------------------------- the whole match
test('8 players, a whole Standard match: the deal, the marks, the skip, a host change + a refresh mid-way change nothing', () => {
  const P = Object.fromEntries('abcdefgh'.split('').map(u => [u, true]));
  const meta = { used: { overclock: { [typeKey('trivia')]: true, [typeKey('math')]: true } } };
  const game = startMatch({ matchId: 'm8', mode: 'standard', participants: P, seed: 'eight', used: meta.used });
  assert.equal(game.total, 12);
  let now = 0, skipped = 0;
  for (let ci = 0; ci < game.total; ci++) {
    now = game.phaseEndsAt;
    const open = nextStep(game, { now, boards: {}, online: P });
    applyRoom(meta, open); applyPatch(game, open);
    const parts = partsFor(game.order[ci], levelOf(ci, game.total));
    const boards = {}, marks = {};
    Object.keys(P).forEach((u, k) => {
      const ok = Math.max(0, parts - (k % 3));
      boards[u] = { p: parts, ok, n: parts, done: true, doneAt: now + 2000 + k * 900 };
      marks[u] = { s: '1'.repeat(ok).padEnd(Math.min(24, parts), '0') };
    });
    now += 9000;
    // a NEW HOST picks up mid-match: the step is the same from the same state (it holds no private state)
    const s1 = luckPlay(structuredClone(game), { now, boards, online: P, marks });
    const s2 = luckPlay(structuredClone(game), { now, boards, online: P, marks });
    assert.deepEqual(s1, s2);
    if (game.order[ci] === 'dumbluck') luckPlay(game, { now, boards, online: P, marks });   // (the lock lands on the real game too)
    applyPatch(game, s1);
    if (game.phase === 'standings') {
      // everyone but h taps; h drops at ci 4 → the skip goes on without them
      const t0 = game.phaseStartAt;
      const next = Object.fromEntries(Object.keys(P).filter(u => u !== 'h').map(u => [u, t0 + 500]));
      const online = ci === 4 ? { ...P, h: false } : P;
      const st = nextStep(game, { now: t0 + 3200, boards: {}, online, next });
      if (st) { skipped++; applyPatch(game, st); } else { now = game.phaseEndsAt; applyPatch(game, nextStep(game, { now, boards: {}, online })); }
    }
  }
  assert.equal(game.phase, 'final');
  assert.equal(skipped, 1, 'only when h was gone did the screen skip');
  assert.ok(game.combo.a.m >= 20, `a never missed: ${game.combo.a.m}`);
  assert.ok(Object.values(game.combo).every(c => c.m >= c.c));
  // the night now knows every type of this match + the two from before
  const played = playedTypes(meta.used.overclock);
  for (const t of game.order) assert.ok(played.includes(t));
  assert.ok(played.includes('trivia') && played.includes('math'));
  assert.ok(game.order.filter(t => t === 'trivia' || t === 'math').length <= 1, 'the two the room already played tonight mostly stay out');
});

// ---------------------------------------------------------------------------------------------- THE OVERDRIVE SKIN's assets (Group 3)
test('OVERDRIVE assets: the fonts + their OFL licences, every sound the game names, credits kept, the preload inside its 1.5 MB budget', async () => {
  const { statSync, readdirSync } = await import('node:fs');
  const { PRELOAD_BUDGET } = await import('../js/games/cartridge.js');
  const { OC_SOUNDS, OC1_FILES } = await import('../js/games/overclock/sfx.js');
  const idx = readFileSync('js/games/overclock/index.js', 'utf8');
  const fonts = [...idx.matchAll(/'((?:barlow|chakra)[\w-]+)'/g)].map(m => m[1]);
  assert.equal(fonts.length, 4);
  for (const f of fonts) assert.ok(statSync(`assets/fonts/overclock/${f}.woff2`).size > 4000, f);
  for (const l of ['OFL-BarlowCondensed.txt', 'OFL-ChakraPetch.txt']) assert.match(readFileSync(`assets/fonts/overclock/${l}`, 'utf8'), /SIL Open Font License/);
  const css = readFileSync('css/overclock.css', 'utf8');
  for (const f of fonts) assert.ok(css.includes(`assets/fonts/overclock/${f}.woff2`), `@font-face for ${f}`);
  const files = readdirSync('audio/sfx/overclock');
  assert.ok(files.includes('credits.txt'));
  assert.ok(!files.includes('17-winner-fanfare-b.mp3'), 'the rejected fanfare stays out (the owner picked the main 17)');
  assert.equal(files.filter(f => f.endsWith('.mp3')).length, 33);
  for (const [name, [file]] of Object.entries(OC_SOUNDS)) assert.ok(files.includes(`${file}.mp3`), `${name} → ${file}.mp3`);
  for (const f of files.filter(x => x.endsWith('.mp3'))) assert.ok(statSync(`audio/sfx/overclock/${f}`).size < 80 * 1024, `${f}: compressed`);
  // the preload: the sounds this pass plays + the fonts + every bank + the Unscramble word lists
  // (OC6: the four big pools load only for a match that deals them — index.js#OC_LAZY_POOLS; OC7: every bank does — the preload holds none.
  //  index.js doesn't import in node (the view's DOM), so the fallback states the same: no bank)
  const { OC_PRELOAD_BANKS } = await import('../js/games/overclock/index.js').catch(() => ({ OC_PRELOAD_BANKS: [] }));
  const banks = OC_PRELOAD_BANKS.map(t => statSync(`data/oc/${t}.json`).size).reduce((a, b) => a + b, 0);
  const words = [5, 6, 7].flatMap(n => [`answers-${n}`, `valid-${n}`]).map(f => statSync(`data/words/${f}.json`).size).reduce((a, b) => a + b, 0);
  const snd = OC1_FILES.map(f => statSync(`audio/sfx/overclock/${f}.mp3`).size).reduce((a, b) => a + b, 0);
  const fnt = fonts.map(f => statSync(`assets/fonts/overclock/${f}.woff2`).size).reduce((a, b) => a + b, 0);
  const total = banks + words + snd + fnt;
  assert.ok(total <= PRELOAD_BUDGET, `the preload: ${Math.round(total / 1024)} KB of ${PRELOAD_BUDGET / 1024}`);
  console.log(`[oc1] preload ${Math.round(total / 1024)} KB (sounds ${Math.round(snd / 1024)} · fonts ${Math.round(fnt / 1024)} · banks ${Math.round(banks / 1024)} · words ${Math.round(words / 1024)})`);
});

test('OVERDRIVE rules: Overclock\'s own classes (oc- + the kit\'s gk-), no animated shadow / filter in its keyframes, American spelling, reduced motion', () => {
  const css = readFileSync('css/overclock.css', 'utf8');
  const od = css.slice(css.indexOf('OVERDRIVE — OVERCLOCK\'s skin'));
  for (const kf of od.matchAll(/@keyframes ([\w-]+) \{([^@]*?)\}\s*\}/g)) assert.doesNotMatch(kf[2], /box-shadow|filter|text-shadow|width:|height:|left:|top:/, `@keyframes ${kf[1]}: transform + opacity only`);
  assert.match(od, /prefers-reduced-motion/);
  for (const f of ['fx.js', 'answers.js', 'sfx.js', 'ui/trivia.js', 'ui/truefalse.js']) {
    const src = readFileSync(`js/games/overclock/${f}`, 'utf8');
    for (const m of src.matchAll(/h\(['`]([a-z0-9]+)((?:\.[\w-]+)+)['`]/g)) for (const c of m[2].split('.').filter(Boolean)) assert.match(c, /^(oc-|gk-|is-|tl-|tf-|ch-|ch$)/, `${f}: .${c}`);
    assert.doesNotMatch(src, /colour/i, `${f}: American spelling ("color")`);
    assert.doesNotMatch(src, /Date\.now\(\)/, `${f}: never Date.now`);
  }
});

// ---------------------------------------------------------------------------------------------- the ADD-ON (the owner's review)
test('ADD-ON: "NEXT IN n" = the whole seconds left of THIS screen on the server clock — always 0 … its max (≤ 12), never a stored end\'s 599', async () => {
  const { nextInSec } = await import('../js/games/overclock/logic.js');
  for (const type of TYPES) {
    const max = standingsMs(type) / 1000;
    assert.ok(max <= 12);
    for (const ends of [standingsMs(type), 600_000, 3_000, NaN]) {      // the real end, a stale / bogus one, an early skip, none
      const g = { order: [type], ci: 0, phase: 'standings', phaseStartAt: 50_000, phaseEndsAt: 50_000 + ends };
      let prev = Infinity;
      for (let t = 49_000; t <= 50_000 + 20_000; t += 137) {
        const n = nextInSec(g, t);
        assert.ok(Number.isInteger(n) && n >= 0 && n <= max, `${type} ends +${ends}: ${n} at ${t}`);
        if (t >= 50_000) { assert.ok(n <= prev, 'counts down'); prev = n; }
      }
      assert.equal(nextInSec(g, 50_000 + standingsMs(type)), 0);
    }
  }
  // through the director: the screen it opens shows its max at the start and 0 at its end, then the next challenge
  const P = { a: true, b: true };
  const g = createGame({ matchId: 'nx', settings: { mode: 'quick' }, participants: P, now: 0, seed: 'next-in', bank: {}, trivia: { n: 99 }, order: ['closest', 'math', 'memory', 'oddone', 'stroop', 'count'] });
  applyPatch(g, nextStep(g, { now: g.phaseEndsAt, boards: {}, online: P }));
  applyPatch(g, nextStep(g, { now: g.playStartAt + CHALLENGE_MS + 800, boards: {}, online: P }));
  assert.equal(g.phase, 'standings');
  assert.equal(nextInSec(g, g.phaseStartAt), 12);
  assert.equal(nextInSec(g, g.phaseStartAt + 11_999), 1);
  assert.equal(nextInSec(g, g.phaseEndsAt), 0);
  // the view counts with it (never phaseEndsAt itself)
  const view = readFileSync('js/games/overclock/view.js', 'utf8');
  assert.match(view, /nextInSec\(game, serverNow\(\)\)/);
  assert.doesNotMatch(view, /phaseEndsAt - serverNow\(\)\) \/ 1000/);
});

test('ADD-ON: the after-challenge screen — the answer scrolls in its own box, the beats above, NEXT + the countdown in a footer of their own; light rows with the emblem', () => {
  const view = readFileSync('js/games/overclock/view.js', 'utf8');
  // (OC2: the beats — the answer, the round winner, the standings — stack in .oc-st-body ABOVE the footer; the answer still scrolls in its box)
  assert.match(view, /h\('div\.panel-full\.oc-standings', body\.el,\s*h\('footer\.oc-st-foot'/);
  assert.match(view, /h\('div\.oc-st-scroll', reveal\(game\)\)/);
  assert.match(view, /avatar\(p\.avatar, p\.color, 30\)/, 'the emblem ≥ 28 pt');
  const css = readFileSync('css/overclock.css', 'utf8');
  assert.match(css, /\.oc-st-scroll \{[^}]*overflow-y: auto/);
  assert.match(css, /\.oc-st-foot \{[^}]*flex: none/);
  assert.doesNotMatch(css, /\.oc-next \{[^}]*position: sticky/, 'never a sticky bar over the rows');
  assert.match(readFileSync('docs/overclock.md', 'utf8'), /LIGHT slanted rows/);
});

test('THE RULES-LAG: the nodes newer than the published rules (ocm, ocnext) are never inside the atomic start / return — cleared in a write of their own', async () => {
  const { ALL_PLAYER_NODES, NEW_PLAYER_NODES } = await import('../js/games/registry.js');
  const live = JSON.parse(readFileSync('tests/fixtures/rules-live.json', 'utf8')).rules.rooms.$code;
  for (const n of NEW_PLAYER_NODES) assert.ok(!ALL_PLAYER_NODES.includes(n), `${n} stays out of the atomic clear`);
  for (const n of ALL_PLAYER_NODES) assert.ok(n in live, `${n} is in the rules as published (a delete of an unknown path would refuse the whole start)`);
  const host = readFileSync('js/host.js', 'utf8');
  // (FR7 FIXES B — A SEAT IS NOT A PLAY: the return keeps the proof nodes — `clearNewNodes(code, true)`)
  assert.ok(host.includes('const clearNewNodes = (code, keepProof = false) =>') && /clearNewNodes = \(code, keepProof = false\) =>.*\.catch\(\(\) => \{\}\)/.test(host), 'best effort');
  assert.equal((host.match(/clearNewNodes\((state\.)?code(, true)?\)/g) || []).length, 2, 'at the start + the return');
});
