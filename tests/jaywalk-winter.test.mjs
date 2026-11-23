// JAYWALK J4 — WINTER (docs/jaywalk.md "J4 — WINTER"): THE GAMEPLAY LOCK (winter is a VIEW — the same seeds replay to the same courses,
// hits + results with the season forced on and off: solo, the daily, a match; the rule + server files never reach the season), THE SEASONAL
// PACK (its own folder, its own cap, never in the preload graph, fetched only in season), the swaps only change WHICH model stands where the
// course already put a tree / a planter / a cone, WET NEON STREETS ships OFF, the season's day is the run's own.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun } from '../js/games/jaywalk/engine.js';
import { replay, judgeRun } from '../js/games/jaywalk/replay.js';
import { greedyBot, playBot } from '../js/games/jaywalk/bot.js';
import { seasonOf, seasonAt, WET_LIVE } from '../js/games/jaywalk/season.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

/** every file a module reaches through its relative imports (static + dynamic) */
function graph(entry) {
  const seen = new Set(), todo = [join(ROOT, entry)];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f) || !existsSync(f)) continue;
    seen.add(f);
    const src = strip(readFileSync(f, 'utf8'));
    for (const m of src.matchAll(/(?:from\s+|import\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) todo.push(resolve(dirname(f), m[1]));
  }
  return [...seen].map(f => f.slice(ROOT.length + 1).replace(/\\/g, '/'));
}

test('THE GAMEPLAY LOCK (static): the rules, the replay, the director, the ghosts + the server\'s judge never reach the season, the scene or the models', () => {
  for (const e of ['js/games/jaywalk/course.js', 'js/games/jaywalk/logic.js', 'js/games/jaywalk/tuning.js', 'js/games/jaywalk/versions.js', 'js/games/jaywalk/replay.js',
    'js/games/jaywalk/engine.js', 'js/games/jaywalk/director.js', 'js/games/jaywalk/ghosts.js', 'api/_lib/jaywalk.js', 'api/_lib/jaywalk-times.js']) {
    const g = graph(e);
    for (const bad of ['js/games/jaywalk/season.js', 'js/games/jaywalk/night.js', 'js/games/jaywalk/night-fx.js', 'js/games/jaywalk/models.js'])
      assert.ok(!g.includes(bad), `${e} must never reach ${bad}`);
  }
  // the season module is PURE — no clock of its own but the instant it is handed, no DOM, no random
  const S = strip(read('js/games/jaywalk/season.js'));
  assert.doesNotMatch(S, /Date\.now|Math\.random|document\.|window\.|localStorage/, 'season.js: pure (the day it is handed → the season)');
});

test('THE GAMEPLAY LOCK (replay): the same seeds give the same courses, hits + results with winter forced on and off — solo, the daily, a match; v1 + v2', () => {
  const realNow = Date.now;
  const days = [['2026-07-01', Date.UTC(2026, 6, 1, 16)], ['2026-12-24', Date.UTC(2026, 11, 24, 16)], ['2027-02-25', Date.UTC(2027, 1, 25, 16)]];
  try {
    for (const cv of [1, 2]) for (const mode of ['solo', 'daily', 'match']) for (const seed of ['look3', 'perfseed2', 'w1nter', 'snowday9']) {
      const out = [];
      for (const [, at] of days) {
        Date.now = () => at;   // (the phone's clock on another day: nothing in the rules may read it)
        const s = seasonAt(at);
        const course = createCourse(seed, { cv }), run = createRun({ seed, mode });
        const log = playBot(run, course, greedyBot({ seed }), 60 * 90);
        const lanes = Array.from({ length: 120 }, (_, i) => JSON.stringify(course.lane(i)));
        const r = replay({ seed, mode, log, cv }), j = judgeRun({ seed, mode, log, cv });
        out.push({ winter: s.winter, lanes, log: JSON.stringify(log), r: JSON.stringify(r), j: JSON.stringify(j && { ...j, at: undefined }), live: JSON.stringify({ y: run.y, t: run.t, cause: run.cause, best: run.best }) });
      }
      assert.ok(out[0].winter === 0 && out[1].winter === 1, 'the days really differ in season');
      for (const k of ['lanes', 'log', 'r', 'j', 'live']) for (let i = 1; i < out.length; i++)
        assert.deepEqual(out[i][k], out[0][k], `${mode} v${cv} ${seed}: "${k}" the same in summer, deep winter and the melt`);
    }
  } finally { Date.now = realNow; }
});

test('THE SWAPS: winter only changes WHICH model stands where decorOf / the course already put a tree, a planter, a cone — same place, same cell', () => {
  // (JT1 — ROOM FIRST: the swaps are THE SEASONAL PACK's — seasonal.js; the scene asks it at the same places, the round tree / the planter otherwise)
  const n = strip(read('js/games/jaywalk/night.js')), p = strip(read('js/games/jaywalk/seasonal.js'));
  assert.match(p, /KM\['w-xmas'\]\.put\(x, 0, zz, ws, ws, ws, ry,/, 'the Christmas tree stands where the tree stood');
  assert.match(p, /KM\['w-pine'\]\.put\(x, 0, zz, ws, ws, ws, q\.ry \* 3,/, 'the snow pine where the tree stood');
  assert.match(p, /if \(wk\) \{ const ws = [^}]+; KM\[wk\]\.put\(x, 0, zz, ws, ws, ws,/, 'the snowman where the planter stood');
  assert.match(n, /if \(!SE \|\| !SE\.tree\(x, zz, s, q, i, dim, on, lt, q\.tk \|\| ''\)\) \{ if \(!q\.tk \|\| !PR \|\| !PR\.tree\(q\.tk, x, zz, s, q\.ry \* 3, dim\)\) K\.trees\.put\(x, 0, zz,/, 'without the season: the area tree model (VARIETY B2 — props.js) or the round tree as before');
  assert.match(n, /if \(!SE \|\| !SE\.planter\(x, zz, q, i, dim\)\) \{ const s = PROP_S\[q\.k\]; KM\[q\.k\]\.put\(x, 0, zz,/, '… and the planter');
  // winter REPLACES (one or the other — never a model added on top) and the decor plan itself never reads the season
  const dec = n.slice(n.indexOf('function decorOf('), n.indexOf('const PROP_S'));
  assert.doesNotMatch(dec, /\bSZ\b|\bWIN\b|\bSE\b|\bSP\b|[Ss]eason|[Ww]inter/, 'decorOf (what stands where) knows no season');
  assert.doesNotMatch(n + p, /run\.\w+\s*=[^=]|course\.\w+\s*=[^=]/, 'the scene + the pack never write the run or the course');
  // the falling snow = ONE mesh (one draw), drawn BEFORE every light; the tree lights ride the existing glow billboards (no draw of their own)
  const fx = strip(read('js/games/jaywalk/seasonal-fx.js'));
  assert.match(fx, /mesh\.renderOrder = 1\.5;/, 'the snow draws after the shadows (1) and before the lights (2 · 3)');
  assert.match(p, /K\.bill\.put\(x \+ \(lx \* cr \+ lz \* sr\) \* ws/, 'the tree lights = the glow billboards'); assert.match(p, /for \(let j = 0; j < xtN && K\.bill\.left\(\) > XMAS_AT\.length \+ 2; j\+\+\)/, '… put LAST: never a gameplay light lost to them');
  assert.match(fx, /a \*= 1\.0 - 0\.94 \* smoothstep\(-0\.16, -0\.04, dy\) \* \(1\.0 - smoothstep\(0\.34, 0\.5, dy\)\);/, 'the flakes fade out over the lanes just in front of the kid — the whole width');
  assert.match(fx, /bool near = aSeed\.w > 0\.965 && uNear > 0\.5;/); assert.match(fx, /, x = side \* \(0\.74 \+ 0\.26 \*/, 'the big near flakes: heavy snow only, at the screen\'s edges');
});

test('THE SEASONAL PACK: its own folder (≤ 150 KB), never in JAYWALK\'s preload graph or its eager models, fetched only in season; credited', () => {
  const dir = join(ROOT, 'assets/jaywalk/winter'), files = readdirSync(dir).filter(f => f.endsWith('.glb'));
  assert.deepEqual(files.sort(), ['snow-pine.glb', 'snowman.glb', 'xmas-tree.glb'], 'the candy cane DROPPED (the draw-call limit)');
  const bytes = files.reduce((a, f) => a + statSync(join(dir, f)).size, 0);
  assert.ok(bytes <= 150 * 1024, `the pack ${(bytes / 1024).toFixed(1)} KB ≤ 150 KB`);
  assert.doesNotMatch(read('js/games/preload-graph.js'), /winter|seasonal|fireworks|jaywalk\/season\.js/, 'never in the preload graph (JT1: the pack\'s code neither)');
  const M = strip(read('js/games/jaywalk/models.js'));
  assert.match(M, /export const SCENE_MODELS = Object\.freeze\(\[\.\.\.KENNEY\.filter/); assert.doesNotMatch(M, /winter|WINTER/, 'JT1: the winter loader is the pack\'s (seasonal.js) — never warmed with the scene\'s models');
  const P = strip(read('js/games/jaywalk/seasonal.js')), N = strip(read('js/games/jaywalk/night.js'));
  assert.match(N, /if \(!force && !seasonWindow\(day\)\) return Promise\.resolve\(false\);/, 'prepSeason fetches only on a season day (Oct 20 → Mar 1) — the lab\'s forced date too');
  assert.match(P, /if \(modelsDay\(s\)\) ps\.push\(loadModels\(\)\);/, 'the winter models only on a winter / Christmas day');
  assert.match(P, /if \(modelsDay\(s\) && !models\) s = \{ \.\.\.s, winter: 0, christmas: 0,/, 'the models not in by the run\'s start = that run\'s normal winter look (no swap mid-run)');
  assert.match(N, /if \(SP && \(run\.t === 0 \|\| run\.st === 'out' \|\| run\.st === 'taken'\)\) SP\.quiet\(\);/, 'the new kinds are warmed at a quiet frame — never mid-run');
  assert.match(P, /for \(const k of WK\) KM\[k\]\.mesh\.visible = false;/, '… built hidden');
  assert.match(read('js/ui/credits.js'), /Holiday Kit 2\.0/); assert.match(read('assets/jaywalk/models/CREDITS.md'), /Holiday Kit 2\.0/);
  assert.ok(existsSync(join(dir, 'LICENSE-kenney-holiday-kit.txt')));
});

test('THE RUN\'s DAY + WET NEON STREETS OFF: solo + the daily = their GO\'s day, a match = THE FIRST GO\'s playAt; the game passes WET_LIVE (false)', () => {
  const v = strip(read('js/games/jaywalk/view.js'));
  assert.match(v, /run = createRun\(\{ seed, mode: ds \? 'daily' : 'solo' \}\);\n\s*seasonFor\(go\);/, 'solo + the daily: the GO\'s day');
  assert.match(v, /run = createRun\(\{ seed: S\.seed, mode: 'match' \}\);\n\s*seasonFor\(S\.playAt\);/, 'a match: the room\'s one start — every phone the same winter');
  assert.match(v, /seasonRun = night\.setSeason\(d, \{ wet: WET_LIVE, now: srvNow \}\)/, 'the run keeps the season it APPLIED (a rebuilt scene never turns winter on mid-run)'); assert.equal(WET_LIVE, false); assert.match(v, /const WET_LIVE = false;/, 'the game passes it OFF');
  assert.doesNotMatch(v, /labSeason|[?&]date=|get\('wet'\)/, 'the lab\'s switches never reach the game');
  assert.equal(seasonOf('2026-12-24').winter, 1);
});
