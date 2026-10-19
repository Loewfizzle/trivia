// HUSH WORDS: the word list (data/hushwords.json) and picking a word for a new room (js/core/hush.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readLists, problems } from '../scripts/build-hushwords.mjs';
import { hushCandidates, staleHush, claimFirst, missCooldown, cooling, HUSH_COOL_MS, HUSH_TRIES, MISS_MAX, MISS_COOLDOWN_MS } from '../js/core/hush.js';
import { normalizeCode } from '../js/core/room-logic.js';
import { rngFrom } from '../js/core/rng.js';
const mulberry32 = s => rngFrom(s);

const WORDS = JSON.parse(readFileSync(new URL('../data/hushwords.json', import.meta.url), 'utf8'));
const lists = readLists();

test('the list: 4 letters A–Z, no duplicates, sorted, the same as the source', () => {
  assert.ok(WORDS.length >= 700, `${WORDS.length} words`);
  for (const w of WORDS) assert.match(w, /^[A-Z]{4}$/, w);
  assert.equal(new Set(WORDS).size, WORDS.length, 'no duplicates');
  assert.deepEqual(WORDS, [...WORDS].sort(), 'sorted');
  assert.deepEqual(WORDS, [...lists.words].sort(), 'data/hushwords.json is built from scripts/hushwords/words.txt (node scripts/build-hushwords.mjs)');
  for (const w of WORDS) assert.equal(normalizeCode(w.toLowerCase()), w, `${w} joins as typed`);
});

test('the list: no blocked word, no word that sounds like another word', () => {
  assert.deepEqual(problems(WORDS, lists), []);
  // the checks themselves catch what they should
  assert.ok(problems(['PEAR'], lists).some(p => p.includes('sounds like')), 'PEAR / PAIR');
  assert.ok(problems(['KNOT'], lists).some(p => p.includes('sounds like')), 'KNOT / NOT');
  assert.ok(problems(['WAIT'], lists).some(p => p.includes('sounds like')), 'WAIT / WEIGHT');
  assert.ok(problems(['ROSE'], lists).some(p => p.includes('sounds like')), 'ROSE / ROWS');
  assert.ok(problems(['BEER'], lists).some(p => p.includes('blocked')));
  assert.ok(problems(['MINT', 'MINT'], lists).some(p => p.includes('twice')));
  assert.ok(problems(['MINTY'], lists).some(p => p.includes('4 letters')));
  // the speakeasy flavour is there
  for (const w of ['JAZZ', 'GOLD', 'MINT', 'LIME', 'WINK', 'HUSH']) assert.ok(WORDS.includes(w), w);
});

test('picking: never a word closed in the last 24 h, never one already tried; free words first', () => {
  const now = 1_800_000_000_000;
  const words = ['JAZZ', 'GOLD', 'MINT', 'LIME', 'WINK', 'HUSH'];
  const hush = { JAZZ: { closedAt: now - 1000 }, GOLD: { closedAt: now - HUSH_COOL_MS + 5000 }, MINT: { closedAt: now - HUSH_COOL_MS - 1 } };
  for (let s = 1; s < 200; s++) {
    const c = hushCandidates(words, hush, now, { rand: mulberry32(s), tried: new Set(['LIME']) });
    const free = c.slice(0, 3);
    assert.deepEqual([...free].sort(), ['HUSH', 'MINT', 'WINK'], 'MINT cooled more than 24 h ago is free again; LIME was tried');
    assert.deepEqual(c.slice(3), ['JAZZ', 'GOLD'].sort((a, b) => hush[a].closedAt - hush[b].closedAt), 'then the cooled ones, oldest first');
  }
  assert.ok(cooling(hush.JAZZ, now) && !cooling(hush.MINT, now) && !cooling(undefined, now));
});

test('picking: every word cooling → the oldest-cooled word first (a room is never refused)', () => {
  const now = 1_800_000_000_000;
  const hush = Object.fromEntries(WORDS.map((w, i) => [w, { closedAt: now - 1000 - i * 10 }]));
  const c = hushCandidates(WORDS, hush, now);
  assert.equal(c.length, WORDS.length);
  assert.equal(c[0], WORDS[WORDS.length - 1], 'the longest-resting word goes first');
});

test('picking: tries a bounded number of free words, spread over the list', () => {
  const c = hushCandidates(WORDS, {}, Date.now(), { rand: mulberry32(7) });
  assert.equal(c.length, HUSH_TRIES);
  const firsts = new Set();
  for (let s = 0; s < 300; s++) firsts.add(hushCandidates(WORDS, {}, 0, { rand: mulberry32(s) })[0]);
  assert.ok(firsts.size > 200, `random enough (${firsts.size} different first picks in 300)`);
});

test('claiming: the atomic claim means concurrent hosts never share a word, and in-use words are skipped', async () => {
  // a fake database whose claim is atomic like the RTDB transaction (check-and-set in one step, after a random delay)
  const open = new Set(['JAZZ', 'GOLD']); // rooms already open
  const rand = mulberry32(42);
  const claim = async w => { await new Promise(r => setTimeout(r, rand() * 4)); if (open.has(w)) return false; open.add(w); return true; };
  const words = ['JAZZ', 'GOLD', 'MINT', 'LIME', 'WINK', 'HUSH', 'NEON', 'OPAL'];
  const got = await Promise.all(Array.from({ length: 6 }, (_, i) => claimFirst(hushCandidates(words, {}, 0, { rand: mulberry32(i % 2) }), claim)));
  assert.equal(new Set(got).size, got.length, `no two hosts got the same word (${got})`);
  for (const w of got) assert.ok(!['JAZZ', 'GOLD'].includes(w), 'never a word an open room has');
  assert.equal(await claimFirst(['JAZZ'], claim), null, 'nothing free → null (room.js then falls back to random codes)');
  assert.equal(await claimFirst(['X', 'ZEST'], async w => { if (w === 'X') throw new Error('offline'); return true; }), 'ZEST', 'an error moves on');
});

test('cleanup: only entries older than 24 h are swept, a few at a time', () => {
  const now = 1_800_000_000_000;
  const hush = { A: { closedAt: now - HUSH_COOL_MS - 5 }, B: { closedAt: now - 5 }, C: { closedAt: now - 2 * HUSH_COOL_MS } };
  assert.deepEqual(staleHush(hush, now).sort(), ['A', 'C']);
  const many = Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`W${i}`, { closedAt: 0 }]));
  assert.equal(staleHush(many, now).length, 50);
});

test('guessing guard: five misses within a minute → 30 s wait; spread-out misses never lock', () => {
  const t = 1_000_000;
  assert.equal(missCooldown([], t), 0);
  const quick = [t, t + 5000, t + 9000, t + 15000];
  assert.equal(missCooldown(quick, t + 16000), 0, 'four misses: still fine');
  const five = [...quick, t + 20000];
  assert.equal(missCooldown(five, t + 21000), MISS_COOLDOWN_MS - 1000);
  assert.equal(missCooldown(five, t + 20000 + MISS_COOLDOWN_MS), 0, 'the door opens again');
  const slow = Array.from({ length: MISS_MAX + 3 }, (_, i) => t + i * 20000);
  assert.equal(missCooldown(slow, slow.at(-1) + 1), 0, 'one miss every 20 s never locks');
  assert.equal(missCooldown(['x', null], t), 0, 'junk in storage is ignored');
});
