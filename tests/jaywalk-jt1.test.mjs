// JAYWALK JT1 — SEASONS (docs/jaywalk.md "JT1 — SEASONS"): ROOM FIRST (every seasonal layer is THE SEASONAL PACK's — never the start bundle),
// THE SEASON CLOCK's new days (AUTUMN Oct 20 → Nov 30 + the Dec 1 hand-over · the Santa hat Dec 1–31 · the party hat + the fireworks Jan 1 ·
// the fireworks' eve Dec 31), the gate agrees with the clock on every day, the season's sounds fetched only on their days, and THE GAMEPLAY
// LOCK with autumn + New Year's added (the same seeds → the same courses, hits + results; solo, the daily, a match; v1 + v2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seasonOf, seasonAt, packDay, modelsDay, labSeason, labClock, SEASON } from '../js/games/jaywalk/season.js';
import { seasonWindow, dayKeyIn } from '../js/games/jaywalk/season-gate.js';
import { seasonSoundsOf, SOUNDS } from '../js/games/jaywalk/sounds.js';
import { finaleOf, FW } from '../js/games/jaywalk/fireworks.js';
import { PRELOAD } from '../js/games/preload-graph.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun } from '../js/games/jaywalk/engine.js';
import { replay, judgeRun } from '../js/games/jaywalk/replay.js';
import { greedyBot, playBot } from '../js/games/jaywalk/bot.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const days = (from, n) => { const t0 = Date.UTC(...from.split('-').map((v, i) => (i === 1 ? v - 1 : +v))); return Array.from({ length: n }, (_, k) => new Date(t0 + k * 864e5).toISOString().slice(0, 10)); };
const PACK = ['js/games/jaywalk/season.js', 'js/games/jaywalk/seasonal.js', 'js/games/jaywalk/seasonal-fx.js', 'js/games/jaywalk/fireworks.js'];

/** every file a module reaches through its relative imports (static + dynamic) */
function graph(entry, dynamic = true) {
  const seen = new Set(), todo = [join(ROOT, entry)];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f) || !existsSync(f)) continue;
    seen.add(f);
    const src = strip(readFileSync(f, 'utf8'));
    for (const m of src.matchAll(dynamic ? /(?:from\s+|import\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g : /from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) todo.push(resolve(dirname(f), m[1]));
  }
  return [...seen].map(f => f.slice(ROOT.length + 1).replace(/\\/g, '/'));
}

test('JT1 ROOM FIRST: the season clock, the pack\'s code + the fireworks are NEVER in the start bundle — night.js fetches the pack through lazyImport only', () => {
  const start = PRELOAD.jaywalk;
  for (const f of PACK) assert.ok(!start.includes(f), `${f} is never in JAYWALK's preload graph`);
  assert.ok(start.includes('js/games/jaywalk/season-gate.js'), 'the start bundle asks only THE SEASON GATE');
  const g = graph('js/games/jaywalk/index.js', false);
  for (const f of PACK) assert.ok(!g.includes(f), `no STATIC import reaches ${f}`);
  const N = strip(read('js/games/jaywalk/night.js'));
  assert.match(N, /lazyImport\(import\('\.\/seasonal\.js'\), '\.\/seasonal\.js'\)/, 'the pack comes in through the skew wrapper, on a season day');
  assert.doesNotMatch(strip(read('js/games/jaywalk/night-fx.js')), /snowOn\(vec3 c[^)]*\) \{\s*if|createSnow|SNOW_V2|jwSnowUp/, 'J4\'s snow GLSL + the falling snow left night-fx.js (the pack\'s seasonal-fx.js)');
  assert.doesNotMatch(strip(read('js/games/jaywalk/models.js')), /loadWinter|WINTER_MODELS/, 'the winter loader left models.js');
  assert.doesNotMatch(strip(read('js/games/jaywalk/view.js')), /from '\.\/season\.js'/, 'the view knows only the gate');
  // THE PACK's own size: its code + the winter models ≤ 150 KB (the owner's cap)
  const code = PACK.reduce((a, f) => a + statSync(join(ROOT, f)).size, 0), dir = join(ROOT, 'assets/jaywalk/winter');
  const models = readdirSync(dir).filter(f => f.endsWith('.glb')).reduce((a, f) => a + statSync(join(dir, f)).size, 0);
  assert.ok(code + models <= 150 * 1024, `THE SEASONAL PACK ${((code + models) / 1024).toFixed(1)} KB (code ${(code / 1024).toFixed(1)} + models ${(models / 1024).toFixed(1)}) ≤ 150 KB`);
});

test('JT1 THE GATE agrees with THE SEASON CLOCK on every day (Oct 20 → the last day of February): the pack is fetched exactly when the clock has a season', () => {
  for (const y of [2026, 2027, 2028]) for (const d of days(`${y}-01-01`, 366)) {
    if (!d.startsWith(String(y))) continue;
    const k = dayKeyIn(d), s = seasonOf(k);
    assert.equal(seasonWindow(k), packDay(s), `${d}: the gate ${seasonWindow(k)} · the clock ${packDay(s)}`);
    if (modelsDay(s)) assert.ok(packDay(s), `${d}: the models only with the pack`);
  }
  assert.equal(dayKeyIn('2026-12-24'), 'd20261224'); assert.equal(dayKeyIn('d20261224'), 'd20261224'); assert.equal(dayKeyIn('nope'), '');
  assert.equal(seasonWindow(''), false);
});

test('JT1 AUTUMN: Oct 20 the first trees turn → full from Nov 1 → full to Nov 30 → WINTER on Dec 1 — no day is both', () => {
  assert.equal(seasonOf('2026-10-19').autumn, 0, 'Oct 19: summer');
  assert.equal(seasonOf('2026-10-20').autumn, SEASON.autumnStart, 'Oct 20: the first trees turn');
  const o26 = seasonOf('2026-10-26').autumn; assert.ok(o26 > 0.4 && o26 < 0.8, `Oct 26 turning (${o26})`);
  for (const d of ['2026-11-01', '2026-11-15', '2026-11-25', '2026-11-30']) assert.equal(seasonOf(d).autumn, 1, `${d}: full autumn`);
  const d1 = seasonOf('2026-12-01'); assert.equal(d1.autumn, 0); assert.ok(d1.winter > 0, 'Dec 1: winter takes over that morning');
  let last = 0;
  for (const d of days('2026-10-20', 13)) { const a = seasonOf(d).autumn; assert.ok(a >= last, `${d} ${a} ≥ ${last} — it only grows`); last = a; }
  for (const y of [2026, 2027]) for (const d of days(`${y}-09-01`, 200)) { const s = seasonOf(d); assert.ok(!(s.autumn > 0 && (s.winter > 0 || s.christmas > 0)), `${d}: never autumn + winter together`); }
  const n25 = seasonOf('2026-11-25'); assert.ok(packDay(n25) && !modelsDay(n25) && n25.snowfall === 'none' && !n25.hat && !n25.fireworks, 'Nov 25: the pack\'s code only — no winter models, no snow, no hat');
  // THE DAY LINE: 3 am on Oct 20 (Eastern) is still Oct 19's — no autumn yet
  assert.equal(seasonAt(Date.UTC(2026, 9, 20, 7)).autumn, 0); assert.equal(seasonAt(Date.UTC(2026, 9, 20, 9)).autumn, SEASON.autumnStart);
});

test('JT1 THE HATS + NEW YEAR\'S: Santa Dec 1 → Dec 31 · the party hat Jan 1 · the fireworks Dec 31 (the eve) + Jan 1 (light) · none on Jan 2', () => {
  for (const d of ['2026-12-01', '2026-12-10', '2026-12-24', '2026-12-31']) assert.equal(seasonOf(d).hat, 'santa', `${d}: the Santa hat`);
  assert.equal(seasonOf('2026-11-30').hat, ''); assert.equal(seasonOf('2027-01-01').hat, 'party'); assert.equal(seasonOf('2027-01-02').hat, '');
  assert.equal(seasonOf('2026-12-31').fireworks, 'eve'); assert.equal(seasonOf('2027-01-01').fireworks, 'day');
  for (const d of ['2026-12-30', '2027-01-02', '2026-11-25', '2027-07-04']) assert.equal(seasonOf(d).fireworks, '', `${d}: no fireworks`);
  // THE GAME DAY: 2 am Jan 1 (Eastern) is still the game day Dec 31 — the eve's fireworks, the Santa hat
  const s = seasonAt(Date.UTC(2027, 0, 1, 7)); assert.equal(s.day, 'd20261231'); assert.equal(s.fireworks, 'eve'); assert.equal(s.hat, 'santa');
  // THE FINALE: the last 3 minutes before LOCAL midnight, the eve only
  assert.equal(FW.finaleMin, 3); assert.ok(finaleOf('eve', 23 * 60 + 57) && finaleOf('eve', 23 * 60 + 59.9)); assert.ok(!finaleOf('eve', 23 * 60 + 56.9)); assert.ok(!finaleOf('day', 23 * 60 + 59)); assert.ok(!finaleOf('eve', 0.5));
  assert.deepEqual(FW.sounds, ['firework-pops', 'firework-crackle', 'firework-volley']);
  // the lab's &clock=HH:MM
  assert.equal(labClock('23:58'), 1438); assert.equal(labClock('0:05'), 5); assert.equal(labClock('24:00'), -1); assert.equal(labClock('x'), -1);
  const L = labSeason(new URLSearchParams('date=2026-12-31&clock=23:58'), Date.UTC(2026, 6, 1));
  assert.equal(L.clock, 1438); assert.equal(L.season.fireworks, 'eve'); assert.ok(L.forced);
});

test('JT1 THE SEASON\'s SOUNDS: fetched ONLY on their days (the leaf crunch in autumn, the fireworks Dec 31 + Jan 1) — never with the game\'s own; the fireworks rotate, never the same twice', () => {
  for (const d of days('2026-01-01', 730)) {
    const k = dayKeyIn(d), s = seasonOf(k), ids = seasonSoundsOf(k);
    assert.equal(ids.includes('leaf-crunch'), s.autumn > 0, `${d}: the leaf crunch with autumn`);
    assert.equal(ids.includes('firework-pops'), !!s.fireworks, `${d}: the fireworks with their days`);
  }
  assert.ok(SOUNDS.filter(s => s.season).every(s => s.pri === 1 && s.max === 1), 'the lowest priority, one at a time');
  assert.match(strip(read('js/games/jaywalk/sfx.js')), /SOUNDS\.filter\(s => s\.play && !s\.match && !s\.season\)/, 'the game\'s own fetch never takes them');
  const F = strip(read('js/games/jaywalk/fireworks.js'));
  assert.match(F, /const pick = FW\.sounds\.filter\(s => s !== lastId\)/, 'never the same firework sound twice running');
  assert.match(F, /if \(t >= soundAt\)/, '… a gap of a few seconds between them');
  for (const id of ['leaf-crunch', 'firework-pops', 'firework-crackle', 'firework-volley']) assert.ok(existsSync(join(ROOT, `audio/jaywalk/${id}.mp3`)), `${id}.mp3 ships`);
  const cr = read('js/ui/credits.js');
  for (const who of ['Feet in Leaves #1', 'JelleGeus', 'Fireworks #1', 'Fireworks #2', 'Pierre SIBANARCO']) assert.ok(cr.includes(who), `credited: ${who}`);
});

test('JT1 THE GAMEPLAY LOCK (static): the rules, the replay, the director, the ghosts + the server\'s judge never reach the pack, the gate or the scene', () => {
  for (const e of ['js/games/jaywalk/course.js', 'js/games/jaywalk/logic.js', 'js/games/jaywalk/tuning.js', 'js/games/jaywalk/versions.js', 'js/games/jaywalk/replay.js',
    'js/games/jaywalk/engine.js', 'js/games/jaywalk/director.js', 'js/games/jaywalk/ghosts.js', 'api/_lib/jaywalk.js', 'api/_lib/jaywalk-times.js']) {
    const g = graph(e);
    for (const bad of [...PACK, 'js/games/jaywalk/season-gate.js', 'js/games/jaywalk/night.js']) assert.ok(!g.includes(bad), `${e} must never reach ${bad}`);
  }
  const P = strip(read('js/games/jaywalk/seasonal.js'));
  assert.doesNotMatch(P, /run\.\w+\s*=[^=]|course\.\w+\s*=[^=]|Math\.random/, 'the pack never writes the run or the course; its piles are from the seed + the day');
  assert.doesNotMatch(strip(read('js/games/jaywalk/season-gate.js')), /Date\.now|Math\.random|document\.|window\./, 'the gate: pure');
});

test('JT1 THE GAMEPLAY LOCK (replay): autumn, Christmas Eve, the eve + New Year\'s Day added — the same seeds give the same courses, hits + results; solo, the daily, a match; v1 + v2', () => {
  const realNow = Date.now;
  const at = [Date.UTC(2026, 6, 1, 16), Date.UTC(2026, 10, 25, 16), Date.UTC(2026, 11, 10, 16), Date.UTC(2026, 11, 31, 16), Date.UTC(2027, 0, 1, 16)];
  try {
    for (const cv of [1, 2]) for (const mode of ['solo', 'daily', 'match']) for (const seed of ['look3', 'leafpile7', 'nye2027']) {
      const out = [];
      for (const ms of at) {
        Date.now = () => ms;   // (the phone's clock on another day: nothing in the rules may read it)
        const course = createCourse(seed, { cv }), run = createRun({ seed, mode });
        const log = playBot(run, course, greedyBot({ seed }), 60 * 90);
        const lanes = Array.from({ length: 120 }, (_, i) => JSON.stringify(course.lane(i)));
        const r = replay({ seed, mode, log, cv }), j = judgeRun({ seed, mode, log, cv });
        out.push({ s: seasonAt(ms), lanes, log: JSON.stringify(log), r: JSON.stringify(r), j: JSON.stringify(j && { ...j, at: undefined }), live: JSON.stringify({ y: run.y, t: run.t, cause: run.cause, best: run.best }) });
      }
      assert.ok(out[1].s.autumn === 1 && out[2].s.hat === 'santa' && out[3].s.fireworks === 'eve' && out[4].s.hat === 'party', 'the days really differ in season');
      for (const k of ['lanes', 'log', 'r', 'j', 'live']) for (let i = 1; i < out.length; i++)
        assert.deepEqual(out[i][k], out[0][k], `${mode} v${cv} ${seed}: "${k}" the same on ${out[i].s.day} as in summer`);
    }
  } finally { Date.now = realNow; }
});

test('JT1 THE DRAW CALLS by design: the hats ride the kid\'s own geometry, the prints the blob shadows\' kind, the leaves + the burst the particles, the drifting leaves THE FALL\'s one draw — only the leaf piles add ONE instanced kind', () => {
  const P = strip(read('js/games/jaywalk/seasonal.js'));
  assert.match(P, /m\.geometry = g;/, 'THE HAT: merged into the kid\'s geometry (yours + the rivals\' kind) — no draw of its own');
  assert.match(P, /K\.shadow\.raw\(PR\[o\] \+ dx/, 'THE FOOTPRINTS: the blob shadows\' kind');
  assert.match(P, /A\.part\('drop', X\(c \+ 0\.5\), 0\.12, z, PILE\.burstMs/, 'THE BURST: the scene\'s particles');
  assert.match(P, /Uf\.uLeaf\.value = leaves \? 1 : 0;/, 'THE DRIFTING LEAVES: the falling snow\'s one draw, its leaf mode');
  assert.equal((P.match(/= kind\(/g) || []).length, 4, 'the kinds the pack makes: the leaf pile + J4\'s three winter models — nothing else');
  assert.doesNotMatch(strip(read('js/games/jaywalk/fireworks.js')), /from 'three'/, 'THE FIREWORKS: their own small 2D canvas in the skyline layer — no scene draw');
  assert.match(strip(read('js/games/jaywalk/night.js')), /lWant = !!SE && !day/, 'THE LIGHTS list only with the pack in');
});
