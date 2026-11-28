// THE END-BOARD SWITCH-ON (Nov 27 — docs/games/passes/endboard.md): every playable solo game's OPT-IN into THE END-SCREEN BOARD (ui/end-board.js —
// ONE shared block, never a second copy) + HIGH RISE's STORED AVERAGE (server-side, core/board-avg.js — JAYWALK's + FREEFALL's path).
// PURE + static reads (THE UNIT JOB INSTALLS NOTHING).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boardDef, fmtValue } from '../js/core/boards.js';
import { avgOf } from '../js/core/board-avg.js';
import { extractMatch } from '../js/core/match-report.js';
import { matchStep } from '../js/core/progress.js';
import { towerScore } from '../js/games/highrise/logic.js';
import { checkCartridge } from '../js/games/contract.js';
import * as EB from '../js/ui/end-board.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const GO = 1_800_000_000_000;

test('THE OPT-INS (the owner, Nov 27): JAYWALK + HIGH RISE with AVG · PRISM DROP (SCORE RUSH) + OVERCLOCK (QUICK, solo) BEST only · NEON PAR, SLIPSTREAM, HOLD\'EM untouched', () => {
  const row = id => { const m = read(`js/games/${id}/index.js`).match(/export const END_BOARD = Object\.freeze\((\{[^\n]*\})\);/); return m ? m[1] : null; };
  assert.equal(row('jaywalk'), "{ b: 'jaywalk-solo', word: 'LANES', avg: true }");
  assert.equal(row('highrise'), "{ b: 'highrise-solo', word: 'FLOORS', avg: true }");
  assert.equal(row('prism'), "{ b: 'prism-rush', word: 'POINTS', soloCounts: false, on: g => !!(g && g.settings && g.settings.mode === 'rush') }");   // (THE FREEFALL CITY PASS: soloCounts — its solo podium says THIS BOARD COUNTS ROOM MATCHES)
  assert.equal(row('overclock'), "{ b: 'overclock-quick', word: 'POINTS', match: false, soloCounts: false, on: g => !!(g && g.settings && g.settings.mode === 'quick') }");
  assert.equal(row('freefall'), "{ b: BOARD, word: 'FLOORS', avg: true }", 'FREEFALL\'s line exactly as F5C left it (BOARD = lines.js — freefall-solo)');
  for (const id of ['golf', 'slip', 'holdem']) assert.doesNotMatch(read(`js/games/${id}/index.js`), /END_BOARD/, `${id}: untouched — not even a line`);
  // every board named is a real RECORD board; AVG only where the board keeps one
  for (const [b, avg] of [['jaywalk-solo', true], ['highrise-solo', true], ['prism-rush', false], ['overclock-quick', false]]) {
    const d = boardDef(b); assert.ok(d && d.kind === 'record', b); assert.equal(!!d.avg, avg, `${b}: avg ${avg}`);
  }
  // THE CONTRACT accepts the new optional pieces + refuses a wrong one
  const base = { start() {}, step() {}, createView() {}, livePaths() {} };
  const bad = checkCartridge('x', { ...base, END_BOARD: { b: 'prism-rush', word: 'POINTS', on: 'rush' } }).filter(s => /END_BOARD/.test(s));
  assert.equal(bad.length, 1, 'on must be a function');
  assert.equal(checkCartridge('x', { ...base, END_BOARD: { b: 'overclock-quick', word: 'POINTS', match: false, on: () => true } }).filter(s => /END_BOARD/.test(s)).length, 0);
});

test('THE PER-MATCH SWITCH: PRISM DROP shows the block for SCORE RUSH only, OVERCLOCK for a QUICK run only — and never in an OVERCLOCK match (its 2-1-3 podium IS the top 3)', () => {
  // (the cartridges import the browser — their END_BOARD row is read from the source + evaluated alone: it is a plain literal)
  const row = id => new Function(`return (${read(`js/games/${id}/index.js`).match(/export const END_BOARD = Object\.freeze\((\{[^\n]*\})\);/)[1]});`)();
  const P = { END_BOARD: row('prism') }, O = { END_BOARD: row('overclock') };
  assert.deepEqual(['rush', 'battle', 'survival'].map(mode => P.END_BOARD.on({ settings: { mode } })), [true, false, false]);
  assert.deepEqual(['quick', 'standard', 'marathon'].map(mode => O.END_BOARD.on({ settings: { mode } })), [true, false, false]);
  assert.equal(O.END_BOARD.match, false);
  assert.equal(P.END_BOARD.on(null), false);
  const f = read('js/ui/final.js');
  assert.ok(f.includes("(typeof ebCfg.on !== 'function' || !!ebCfg.on(g)) && (ebSolo || ebCfg.match !== false)"), 'the frame reads both');
  assert.ok(f.includes("(body && body.dataset.podium === 'all') || (eb && !ebSolo) ? []"), 'a MATCH with the block: the block IS the list — the console\'s own stays away');
  assert.ok(f.includes("eb ? 'has-eb' : ''") && read('css/components.css').includes('.final.has-eb .rc-plaque { display: none; }'), 'the plaques fold into YOUR BEST + the block (F5B\'s call, shared)');
});

test('ONE BLOCK, NO COPY: JAYWALK\'s + HIGH RISE\'s own YOUR TABLE is gone (code + css); PRISM DROP\'s rush body drops its own top 3; the YOUR BEST lines say "YOUR BEST n · AVG n" (BEST only without AVG)', () => {
  for (const f of ['js/games/jaywalk/victory.js', 'js/games/highrise/final.js']) assert.doesNotMatch(read(f), /function yourTable|tableRows|action: 'table'/, `${f}: no second table`);
  assert.doesNotMatch(read('css/jaywalk.css'), /\.jw-table/); assert.doesNotMatch(read('css/highrise-play.css'), /\.hi-table/);
  assert.ok(read('js/games/jaywalk/victory.js').includes('export const bestWords = n => `YOUR BEST ${num(n)}`;'));
  assert.ok(read('js/games/highrise/endscreen.js').includes('withAvg ? `YOUR BEST ${say(v)} · ${av}`'));
  assert.ok(read('js/games/prism/victory.js').includes("if (rushOf(game)) { el.dataset.eb = '1';"));
  assert.ok(read('js/games/overclock/victory.js').includes('best.textContent = `YOUR BEST ${fmtNum(b[1])}`;'));
});

test('THE BLOCK prints each board\'s OWN format: HIGH RISE\'s board keeps a tower as ONE sort number → its floor; a plain count unchanged (FREEFALL / JAYWALK)', () => {
  const t = towerScore(57, 12, 9000);
  assert.ok(t > 1e11, 'the stored value is the packed tower');
  assert.equal(EB.valText(t, 'highrise-solo'), '57'); assert.equal(fmtValue(boardDef('highrise-solo'), t), '57');
  assert.equal(EB.valText(57, 'highrise-solo'), '57', 'a match row\'s score (the floor itself) prints the same');
  assert.equal(EB.valText(1234, 'freefall-solo'), '1,234'); assert.equal(EB.valText(1234, 'jaywalk-solo'), '1,234'); assert.equal(EB.valText(98765, 'prism-rush'), '98,765');
  assert.equal(EB.youLine(12, t, 'FLOORS', 'highrise-solo'), 'YOU · 12TH · 57 FLOORS');
  assert.equal(EB.youLine(12, 88, 'FLOORS'), 'YOU · 12TH · 88 FLOORS', 'FREEFALL\'s line unchanged');
});

test('HIGH RISE\'s STORED AVERAGE (server-side — JAYWALK\'s path): a counted SOLO run\'s FLOORS into pstats.av/highrise-solo; 5 runs over the last 14 played days; the BEST (the sort number) untouched; a MATCH run never averages', () => {
  const B = 'highrise-solo';
  const row = (f, mode = 'solo') => extractMatch({ id: 'highrise', matchId: 'm1', phase: 'final', mode, sv: 1, participants: mode === 'solo' ? { u1: true } : { u1: true, u2: true }, settings: {}, results: { u1: { f, p: 3, s: 2, t: f * 50, w: 'miss' }, ...(mode === 'solo' ? {} : { u2: { f: 1, p: 0, s: 0, t: 100, w: 'miss' } }) } }).rows.u1;
  assert.deepEqual(row(57).av, { [B]: 57 }, 'the floor alone — never the tower number');
  assert.equal(row(57).rec[B], towerScore(57, 3, 57 * 50), 'the record stays the tower\'s ONE sort number');
  assert.equal(row(57, 'match').av, undefined, 'a match run: no average');
  let s = null;
  [40, 60, 100, 20, 80].forEach((f, i) => { const at = GO + i * 600_000 + (i >= 3 ? 86_400_000 : 0); const r = matchStep(s, { key: `k${i}`, gid: 'highrise', row: row(f), n: 1, now: at, at, gap: 0 }); assert.ok(!r.skip, `run ${i}: ${r.skip}`); s = r.next; if (i === 3) assert.equal(avgOf(s.av[B]).avg, null, 'four runs: AVG —'); });
  assert.deepEqual([avgOf(s.av[B]).avg, avgOf(s.av[B]).runs, avgOf(s.av[B]).days], [60, 5, 2]);
  assert.equal(s.b[B].a, towerScore(100, 3, 5000), 'the ranking value stays the BEST tower');
  assert.ok(read('js/core/match-report.js').includes("if (solo) out.av = { 'highrise-solo': Math.max(0, Math.floor(num(r.f))) };"));
});

test('THE ADD-ONS (the owner, Nov 27): EACH END SCREEN STAYS ITS GAME\'S OWN — the block\'s accents = the game\'s (--fin / --fin-ink), FREEFALL\'s F5C pink kept; JAYWALK\'s YOUR SPLITS off the end screen (the data kept)', () => {
  const css = read('css/components.css');
  assert.ok(css.includes('.final.has-accent .eb { --eb-acc: var(--fin); --eb-you: var(--fin); --eb-tick: var(--fin-ink, #fff); }'), 'the game\'s accent, the ✓ in the ink that reads on it');
  for (const r of ['.eb-tick.is-on .eb-box { background: var(--eb-acc); border-color: var(--eb-acc); }', 'border: solid var(--eb-tick);', '.eb-list li.is-me .eb-n { color: var(--eb-you); }', 'color: var(--eb-you); }']) assert.ok(css.includes(r), r);
  assert.doesNotMatch(css.slice(css.indexOf('.eb-head'), css.indexOf('.eb-you:empty')), /#ff4fa8|#ff8fe0/, 'no hard-coded pink left in the block\'s rules (the defaults sit on .eb)');
  assert.ok(read('css/freefall-play.css').includes('.ff-final .final.has-eb .eb { --eb-acc: #ff4fa8; --eb-you: #ff8fe0; --eb-tick: #fff; }'), 'FREEFALL: F5C\'s pink, pixel for pixel');
  assert.ok(read('css/prism.css').includes(".pd[data-look='crayon'] .pd-final .eb { --eb-acc: #1d5aa6; --eb-you: #1d5aa6; --eb-tick: #fff; }"), 'PRISM DROP by day: its own day ink on the paper');
  const v = read('js/games/jaywalk/victory.js'), vw = read('js/games/jaywalk/view.js');
  assert.doesNotMatch(v, /splitsCard|addSplits/); assert.doesNotMatch(vw, /splitsCard\(/);
  assert.match(vw, /keepOwnSplits\(matchId, run\.sp\)/); assert.match(read('js/games/jaywalk/daily-run.js'), /splitsCard\(sp\)/, 'the DAILY\'s end card keeps its splits');
});

test('ONE ICON PER GAME (the inbox, Nov 27 8:36 am): HOW TO PLAY\'s tabs = each game\'s NEON MARK (ui/mark-svg.js — the PLAY sheet\'s); game-art.js = the big posters only (the game card\'s 120-pt art)', () => {
  const help = read('js/ui/help.js');
  assert.ok(help.includes("import { markSvg } from './mark-svg.js';") && !/gameArtSvg|game-art\.js'/.test(help.replace(/\/\/[^\n]*/g, '')), 'help.js: the marks, never the posters');
  assert.match(help, /h\('span\.help-ic', \{ html: markSvg\(g, 'help-mark'\), 'aria-hidden': 'true' \}\)/);
  const users = ['js/screens/title-taps.js', 'js/ui/help.js', 'js/screens/room-city.js', 'js/board/view.js'].filter(f => /gameArtSvg\(/.test(read(f)));
  assert.deepEqual(users, ['js/screens/title-taps.js'], 'the one big-poster place: the game card sheet');
  assert.match(read('js/screens/title-taps.js'), /const art = gameArtSvg\(g\.id\) \|\| h\('i\.nd-pv-mark', \{ html: markSvg\(g\) \}\);/, 'its fallback = the mark');
  assert.match(read('js/screens/title-taps.js'), /row\(\{ icon: markSvg\(g\)/, 'the PLAY shelf: the marks'); assert.match(read('js/screens/room-city.js'), /html: markSvg\(g\)/, 'PICK A GAME: the marks');
  assert.match(read('CLAUDE.md'), /THE INBOX WRITE RULE: re-read ADDONS\.md IMMEDIATELY before writing; APPEND only; never write back a copy read earlier\./);
});
