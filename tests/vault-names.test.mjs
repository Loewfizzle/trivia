// THE VAULT 1B — ITEM NAMES ONLY TO OWNERS (the owner: "keep them guessing"): the site's code can't list what exists. The catalog (every
// item's name + line + look, the 32 achievements, what each level + milestone gives, the lab's names) lives in api/_lib/ (never served by
// Vercel); a phone gets display rows only for what its player owns (withShow). This test reads every file the site SHIPS (js/, css/, the
// root pages) and proves none carries the catalog; then that withShow describes exactly the ids a response holds — no more.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ITEM_ROWS, ACH_ROWS, LEVEL_REWARD_ROWS, withShow, displayOf, displayForStats } from '../api/_lib/catalog.js';
import { LAB_TEXT } from '../api/_lib/lab-text.js';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
function shipped() {
  const out = [];
  const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (['.js', '.css', '.html', '.mjs'].includes(extname(p))) out.push(p); } };
  walk(join(ROOT, 'js')); walk(join(ROOT, 'css'));
  for (const f of readdirSync(ROOT)) if (extname(f) === '.html') out.push(join(ROOT, f));
  return out.map(p => [p, readFileSync(p, 'utf8')]);
}

test('THE SITE\'S CODE carries no catalog: no item\'s line, no achievement\'s line, no lab description, no sighting card\'s name', () => {
  const files = shipped();
  // (exempt: the OLD VAULT's finishes + glows — public before PROGRESSION, their lines in core/ranks.js for City 1.0 — and two sighting names that
  //  are everyday city words, LIGHTS OUT (a window scene) + AFTERBURNER (the jets): those two are checked in the vault + progression code only)
  const COMMON_WORDS = ['LIGHTS OUT', 'AFTERBURNER'];
  const lines = [...ITEM_ROWS.filter(x => !x.old).map(x => x.line), ...ACH_ROWS.map(a => a.line), ...Object.values(LAB_TEXT).map(x => x.motion)].filter(s => s && s.length > 14);
  const sightNames = ITEM_ROWS.filter(x => x.sg && x.kind === 'card').map(x => x.name);
  const hits = [];
  for (const [p, src] of files) {
    for (const s of lines) if (src.includes(s)) hits.push(`${p.slice(ROOT.length)}: "${s}"`);
    for (const n of sightNames) if (src.includes(n) && (!COMMON_WORDS.includes(n) || /[\\/](vault|progress|fx)[\\/]/.test(p))) hits.push(`${p.slice(ROOT.length)}: ${n}`);
  }
  // (THE VAULT 2A: the 3 held cards' names out of the art's code — FOUNDING MEMBER is the public pill's word, exempt)
  for (const [p, src] of files) if (/[\\/](vault|progress|fx)[\\/]|vault\.css$/.test(p)) for (const n of ['PLATINUM', 'THE HOUSE', 'OPENING NIGHT', 'THE METAL CARD', 'FULL BLAZE']) if (src.includes(n)) hits.push(`${p.slice(ROOT.length)}: ${n}`);
  // (SHELL 2.0 B2: THE GIFT CARDS' names — the owner's tool + THE LAB get them from the server; no shipped file names one)
  //  (everyday words — GOLDEN HOUR, HALL OF FAME, ICE COLD — live in the city's code too: checked where cards are drawn + named)
  for (const n of ITEM_ROWS.filter(x => x.gift).map(x => x.name)) for (const [p, src] of files) if (/[\\/](vault|progress|fx|profile|admin)[\\/]|vault\.css$|admin\.css$/.test(p) && src.includes(n)) hits.push(`${p.slice(ROOT.length)}: ${n}`);
  assert.deepEqual(hits, [], `${hits.length} leaks`);
  assert.ok(files.length > 300, `${files.length} shipped files read`);
});

test('THE SHARED MODULES alone (as a phone loads them): the ORIGINAL GILDED only, no achievements, no level\'s WHAT — only WHEN', () => {
  const js = "const I = await import('./js/core/items.js'); const A = await import('./js/core/achievements.js'); const L = await import('./js/core/levels.js'); const S = await import('./js/core/streak.js');" +
    "console.log(JSON.stringify({ items: I.ITEMS.map(x => x.id), ach: A.ACHIEVEMENTS.length, lr: L.LEVEL_REWARDS.length, when: L.REWARD_LEVELS.length, ms: S.MILESTONES.flatMap(m => m.items).length }))";
  const r = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', js], { cwd: ROOT, encoding: 'utf8' }).trim());
  // (THE VAULT 2C — ONE EMBLEM SYSTEM: the 12 sign-up shapes are every member's own from day one — owned by all, so nothing to hide)
  assert.deepEqual(r.items, ['card-gilded', ...['bolt', 'eye', 'diamond', 'hex', 'ghost', 'crown', 'star', 'moon', 'cube', 'alien', 'target', 'wave'].map(a => `emb-sign-${a}`)]);
  assert.equal(r.ach, 0); assert.equal(r.lr, 0); assert.equal(r.ms, 0);
  assert.equal(r.when, new Set(LEVEL_REWARD_ROWS.map(x => x.lvl)).size, 'WHEN stays (the vague tease)');
});

test('THE SHOW: a response describes exactly the ids it carries — an outcome\'s unlocks, the profile\'s owned + held; never the rest', () => {
  const r = withShow({ ok: true, outcome: { items: ['card-inferno'], ach: ['first-round'] } });
  assert.deepEqual(Object.keys(r.show.items), ['card-inferno']);
  assert.deepEqual(Object.keys(r.show.ach), ['first-round']);
  assert.equal(r.show.items['card-inferno'].lv, 42, 'a level reward carries its level (the end of round sorts it)');
  assert.ok(!('check' in r.show.ach['first-round']), 'never an achievement\'s check');
  const me = displayForStats({ it: { 'card-midnight': 1, 'emb-key': 2 }, ac: { 'house-warming': 3 } });
  assert.deepEqual(Object.keys(me.items).sort(), ['card-midnight', 'emb-key']);
  assert.deepEqual(Object.keys(me.ach), ['house-warming']);
  assert.deepEqual(withShow({ ok: true }), { ok: true }, 'nothing to describe → no show');
  assert.deepEqual(displayOf(['nope', 'card-sg-tr3b']), { 'card-sg-tr3b': displayOf(['card-sg-tr3b'])['card-sg-tr3b'] });
});
