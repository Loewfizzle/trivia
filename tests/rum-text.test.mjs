// RUMRUNNER — the flavour text: every template, every good × district × kind × choice × outcome, many seeds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rngFrom } from '../js/core/rng.js';
import {
  GOOD_TEXT, DISTRICT_TEXT, WEATHER_TEXT, UPGRADE_TEXT, fmt$, newsLine, rumorLine, eventScene, outcomeLine, valeLines, headlines,
} from '../js/games/rum/text.js';
import { playMatch } from '../js/games/rum/bot.js';
import { matchStory, GOOD_IDS, DIST_IDS } from '../js/games/rum/logic.js';
import { UPGRADES } from '../js/games/rum/tuning.js';

const BAD = /undefined|null|NaN|\[object|Infinity/;
const FORBIDDEN = /drug|gun|shoot|kill/i;
const WEATHERS = ['clear', 'rain', 'fog', 'storm', 'dawn'];
const SEEDS = 40;
function check(s, max, what) {
  assert.equal(typeof s, 'string', `${what}: not a string`);
  assert.ok(s.length > 0, `${what}: empty`);
  assert.ok(!BAD.test(s), `${what}: bad token in "${s}"`);
  assert.ok(!FORBIDDEN.test(s), `${what}: forbidden word in "${s}"`);
  if (max) assert.ok(s.length <= max, `${what}: ${s.length} > ${max}: "${s}"`);
}
const seeds = tag => Array.from({ length: SEEDS }, (_, i) => rngFrom(`${tag}:${i}`));

test('fmt$', () => {
  assert.equal(fmt$(12345), '$12,345');
  assert.equal(fmt$(-1200), '−$1,200');
  assert.equal(fmt$(0), '$0');
  assert.equal(fmt$(999), '$999');
  assert.equal(fmt$(1234567.4), '$1,234,567');
});

test('catalogue: names, lengths, every id covered', () => {
  for (const g of GOOD_IDS) {
    const t = GOOD_TEXT[g];
    assert.ok(t, g);
    for (const k of ['name', 'short', 'unit', 'blurb']) check(t[k], k === 'blurb' ? 60 : 20, `good ${g}.${k}`);
  }
  assert.equal(GOOD_TEXT.shine.unit, 'jars'); assert.equal(GOOD_TEXT.rum.unit, 'bottles');
  assert.equal(GOOD_TEXT.cigars.unit, 'boxes'); assert.equal(GOOD_TEXT.champ.unit, 'cases');
  for (const d of DIST_IDS) {
    const t = DISTRICT_TEXT[d];
    check(t.name, 20, `dist ${d}.name`); check(t.tagline, 32, `dist ${d}.tagline`); check(t.blurb, 110, `dist ${d}.blurb`);
  }
  for (const w of WEATHERS) { check(WEATHER_TEXT[w].name, 20, `weather ${w}`); check(WEATHER_TEXT[w].effect, 70, `weather ${w}.effect`); }
  for (const w of ['clear', 'rain', 'fog', 'dawn']) check(WEATHER_TEXT[w].effect, 60, `weather ${w}.effect`);
  for (const id of Object.keys(UPGRADES)) { check(UPGRADE_TEXT[id].name, 24, `upg ${id}`); check(UPGRADE_TEXT[id].blurb, 70, `upg ${id}.blurb`); }
});

test('news and rumours: every good × district × kind, several variations', () => {
  for (const k of ['spike', 'crash']) {
    const newsSeen = new Set(), rumSeen = new Set();
    for (const good of GOOD_IDS) for (const dist of DIST_IDS) for (const r of seeds(`n${k}${good}${dist}`)) {
      const n = newsLine({ dist, good, k, m: 2 }, r); check(n, 90, 'news'); newsSeen.add(n.replace(/\w+/g, w => w).slice(0, 12));
      const ru = rumorLine({ dist, good, k }, r); check(ru, 110, 'rumor'); rumSeen.add(ru.slice(0, 14));
      assert.ok(!/\b(true|false|fake|real)\b/i.test(ru), `rumour gives it away: ${ru}`);
    }
    assert.ok(newsSeen.size >= 4, `news ${k} variations ${newsSeen.size}`);
    assert.ok(rumSeen.size >= 6, `rumor ${k} variations ${rumSeen.size}`);
  }
  // deterministic
  assert.equal(newsLine({ dist: 'docks', good: 'rum', k: 'crash' }, rngFrom('a')), newsLine({ dist: 'docks', good: 'rum', k: 'crash' }, rngFrom('a')));
});

const EVENTS = [
  ...GOOD_IDS.map(good => ({ t: 'find', good, n: 17 })),
  ...GOOD_IDS.flatMap(good => DIST_IDS.flatMap(dist => ['spike', 'crash'].map(k => ({ t: 'rumor', dist, good, k })))),
  ...Object.keys(UPGRADES).map(id => ({ t: 'garage', id })),
  { t: 'vale' }, { t: 'feds' }, { t: 'hijack' }, { t: 'find', good: 'champ', n: 1 },
];
const ALL = { vale: ['pay', 'stall'], feds: ['run', 'bribe', 'dump'], hijack: ['hand', 'floor'], find: ['take'], rumor: ['noted'], garage: ['buy', 'pass'] };

test('event scenes: every type × district × weather, choices + hints within limits', () => {
  for (const ev of EVENTS) {
    const bodies = new Set();
    for (const dist of DIST_IDS) for (const weather of WEATHERS) for (const r of seeds(`e${ev.t}${dist}${weather}`).slice(0, 6)) {
      for (const choices of [ALL[ev.t], ev.t === 'feds' ? ['run', 'dump'] : ev.t === 'garage' ? ['pass'] : ALL[ev.t]]) {
        const ctx = {
          weather, dist, odds: 0.73, bribe: 1234567, price: 8400, upgradeName: ev.id ? UPGRADE_TEXT[ev.id].name : undefined,
          goodName: ev.good ? GOOD_TEXT[ev.good].name : undefined, choices, debt: ev.t === 'vale' ? 1234567 : undefined,
        };
        const sc = eventScene(ev, ctx, r);
        check(sc.title, 26, `${ev.t} title`); check(sc.kicker, 40, `${ev.t} kicker`); check(sc.body, 180, `${ev.t} body`);
        assert.deepEqual(Object.keys(sc.choices), choices);
        for (const [id, c] of Object.entries(sc.choices)) { check(c.label, 14, `${ev.t}.${id} label`); check(c.hint, 44, `${ev.t}.${id} hint`); }
        bodies.add(sc.body.slice(0, 20));
      }
    }
    assert.ok(bodies.size >= 4, `${ev.t} body variations ${bodies.size}`);
  }
  const sc = eventScene({ t: 'feds' }, { odds: 0.55, bribe: 900, choices: ['run', 'bribe', 'dump'] }, rngFrom('h'));
  assert.match(sc.choices.run.hint, /55%/); assert.match(sc.choices.bribe.hint, /\$900/);
  assert.match(eventScene({ t: 'hijack' }, { odds: 0.5 }, rngFrom('h')).choices.floor.hint, /50%.*60%/);
  assert.match(eventScene({ t: 'garage', id: 'armor' }, { price: 4900 }, rngFrom('h')).choices.buy.hint, /\$4,900/);
});

const LOSTS = [{ shine: 1 }, { champ: 250 }, { whiskey: 120, cigars: 199 }, { shine: 100, rum: 50, gin: 3, whiskey: 2, cigars: 1, champ: 1 }, {}];
const OUTS = [
  { t: 'feds', choice: 'run', ok: true, odds: 0.6 },
  ...LOSTS.map(lost => ({ t: 'feds', choice: 'run', caught: true, fine: 1234567, lost })),
  { t: 'feds', choice: 'bribe', ok: true, bribe: 1234567 },
  ...LOSTS.map(lost => ({ t: 'feds', choice: 'bribe', caught: true, bribe: 1234567, lost })),
  ...LOSTS.map(lost => ({ t: 'feds', choice: 'dump', lost })),
  ...LOSTS.map(lost => ({ t: 'hijack', choice: 'hand', lost })),
  { t: 'hijack', choice: 'floor', ok: true, odds: 0.5 },
  ...LOSTS.map(lost => ({ t: 'hijack', choice: 'floor', caught: true, odds: 0.5, lost })),
  { t: 'vale', choice: 'pay', paid: 1234567 }, { t: 'vale', choice: 'pay', paid: 0 },
  { t: 'vale', choice: 'stall', slide: true }, { t: 'vale', choice: 'stall', took: 1234567 },
  ...GOOD_IDS.flatMap(good => [{ t: 'find', choice: 'take', got: 26, good }, { t: 'find', choice: 'take', got: 1, good }, { t: 'find', choice: 'take', full: true, ev: { good } }]),
  { t: 'rumor', choice: 'noted' },
  ...Object.keys(UPGRADES).map(id => ({ t: 'garage', choice: 'buy', bought: id, price: 8400 })),
  { t: 'garage', choice: 'pass' },
];
test('outcomes: every case within limits, several variations', () => {
  const goodNames = Object.fromEntries(GOOD_IDS.map(g => [g, GOOD_TEXT[g].name]));
  const upgradeNames = Object.fromEntries(Object.keys(UPGRADES).map(id => [id, UPGRADE_TEXT[id].name]));
  const seen = {};
  for (const out of OUTS) for (const r of seeds(`o${JSON.stringify(out)}`)) {
    const o = outcomeLine(out, { goodNames, upgradeNames }, r);
    check(o.title, 22, `${out.t}.${out.choice} title`); check(o.body, 140, `${out.t}.${out.choice} body`);
    const key = `${out.t}.${out.choice}.${out.ok ? 'ok' : ''}${out.caught ? 'c' : ''}${out.slide ? 's' : ''}${out.full ? 'f' : ''}${out.paid === 0 ? 'z' : ''}`;
    (seen[key] ??= new Set()).add(o.body.slice(0, 16));
  }
  for (const [k, s] of Object.entries(seen)) assert.ok(s.size >= 3, `${k}: ${s.size} variations`);
  assert.match(outcomeLine({ t: 'feds', choice: 'run', caught: true, fine: 900, lost: { rum: 12 } }, { goodNames }, rngFrom('z')).body, /12 bottles of rum/);
});

test('Mr. Vale: every kind, 2–3 lines ≤ 70 chars, ≥ 4 variations', () => {
  for (const kind of ['intro', 'office', 'cleared', 'collect', 'last']) {
    const seen = new Set();
    for (const r of seeds(`v${kind}`)) {
      const lines = valeLines(kind, { debt: 1234567 }, r);
      assert.ok(lines.length >= 2 && lines.length <= 3, `${kind}: ${lines.length} lines`);
      for (const l of lines) check(l, 70, `vale ${kind}`);
      seen.add(lines[0]);
    }
    assert.ok(seen.size >= 4, `${kind}: ${seen.size}`);
    for (const l of valeLines(kind, {}, rngFrom('x'))) check(l, 70, `vale ${kind} no ctx`);
  }
});

function checkPaper(P, story, names, game) {
  check(P.masthead, 30, 'masthead'); check(P.dateline, 60, 'dateline');
  check(P.main.head, 44, 'main head'); check(P.main.deck, 120, 'main deck');
  assert.equal(P.items.length, game.final.length);
  assert.deepEqual(P.items.map(i => i.uid), game.final.map(f => f.uid));
  for (const it of P.items) { check(it.head, 40, `item head (${it.type})`); check(it.body, 150, `item body (${it.type})`); }
  assert.ok(P.stats.length >= 4 && P.stats.length <= 6, `stats ${P.stats.length}`);
  for (const s of P.stats) { check(s.label, 18, 'stat label'); check(s.value, 0, 'stat value'); if (s.uid != null) assert.ok(names[s.uid], 'stat uid'); else assert.ok(/[A-Z]{2,}/.test(String(s.value)), 'a stat without a player names one in its value'); }
  const fled = P.items.filter(i => story[i.uid].fortune < 0 && story[i.uid].debt > 0);
  for (const i of fled) assert.equal(i.type, 'flee');
  for (const i of P.items) if (i.type === 'tipster') assert.ok(story[i.uid].tipsSent.length);
}

test('headlines: a real six-bot match, and long names', () => {
  const strategies = { a: 'trader', b: 'careful', c: 'gambler', d: 'random', e: 'idle', f: 'mean' };
  const short = { a: 'KATIE', b: 'MIKE', c: 'SARAH', d: 'JAKE', e: 'ROSE', f: 'EDDIE' };
  const long = Object.fromEntries(Object.keys(short).map(u => [u, 'MAXIMILIANOS'.slice(0, 12)]));
  const types = new Set();
  for (const days of [15, 20, 30]) for (const matchId of ['m1', 'm2', 'm3']) {
    const { game } = playMatch({ matchId, settings: { days }, strategies });
    const story = matchStory(game);
    for (const names of [short, long]) for (const r of seeds(`p${days}${matchId}`).slice(0, 10)) {
      const P = headlines(story, names, game, r);
      checkPaper(P, story, names, game);
      for (const i of P.items) types.add(i.type);
    }
  }
  assert.ok(types.size >= 5, `item types seen: ${[...types]}`);
  // the brief's example
  const { game } = playMatch({ settings: { days: 15 }, strategies });
  const P = headlines(matchStory(game), short, game, rngFrom('x'));
  checkPaper(P, matchStory(game), short, game);
});

test('headlines: every item type and both main kinds, synthetic stories', () => {
  const base = { cash: 0, stash: 0, best: null, raids: 0, caught: 0, hijacked: 0, paid: 0, tipsSent: [], upgrades: [], visited: { docks: 3, rail: 2 }, peak: 5000, low: -3500, trades: 9, bribes: 0, dumped: 0, finds: 0, leftover: 0 };
  const story = {
    a: { ...base, fortune: 1234567, debt: 0, paid: 5500, best: { good: 'champ', profit: 987654, d: 12, dist: 'heights', units: 250 }, peak: 1300000 },
    b: { ...base, fortune: -12345, debt: 23456 },
    c: { ...base, fortune: 900, debt: 0, tipsSent: [{ to: 'a', d: 7, cost: 25000 }, { to: 'd', d: 9, cost: 300 }, { to: 'a', d: 11, cost: 300 }, { to: 'e', d: 13, cost: 300 }] },
    d: { ...base, fortune: 800, debt: 100, visited: { strip: 20 } },
    e: { ...base, fortune: 700, debt: 100, raids: 9, caught: 4 },
    f: { ...base, fortune: 600, debt: 100, caught: 5, raids: 5 },
    g: { ...base, fortune: 500, debt: 100, leftover: 240 },
    h: { ...base, fortune: 400, debt: 100, peak: 900000 },
    i: { ...base, fortune: 300, debt: 100, finds: 6 },
    j: { ...base, fortune: 200, debt: 100, bribes: 7 },
    k: { ...base, fortune: 100, debt: 100 },
  };
  const uids = Object.keys(story);
  const names = Object.fromEntries(uids.map(u => [u, 'ABCDEFGHIJKL']));
  const game = { settings: { days: 20 }, final: uids.map((uid, i) => ({ uid, rank: i + 1, nw: story[uid].fortune })) };
  const types = new Set();
  for (const r of seeds('syn')) { const P = headlines(story, names, game, r); checkPaper(P, story, names, game); P.items.forEach(i => types.add(i.type)); }
  for (const t of ['flee', 'tipster', 'king', 'raided', 'caught', 'leftover', 'fall', 'cleared', 'finds', 'bribes', 'plain']) assert.ok(types.has(t), `missing ${t}`);
  // everyone broke
  const broke = Object.fromEntries(uids.map(u => [u, { ...story[u], fortune: -1000 - uids.indexOf(u), debt: 5000 }]));
  const g2 = { settings: { days: 30 }, final: uids.map((uid, i) => ({ uid, rank: i + 1, nw: broke[uid].fortune })) };
  for (const r of seeds('broke')) checkPaper(headlines(broke, names, g2, r), broke, names, g2);
  // per-type variations
  const heads = {};
  for (const r of seeds('var')) for (const i of headlines(story, { ...names, a: 'KATIE', b: 'MIKE' }, game, r).items) (heads[i.type] ??= new Set()).add(i.head);
  for (const [t, s] of Object.entries(heads)) assert.ok(s.size >= 3, `${t} head variations ${s.size}`);
});
