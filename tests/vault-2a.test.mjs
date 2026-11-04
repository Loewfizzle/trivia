// THE VAULT 2A (PURE): the 3 held cards built (a LOOK, an effect, in the lab FIRST — strip + full card, the server's names, PLATINUM epic);
// THE EMBLEM SYSTEM's samples — every emblem / tube style / glow a real item at its tier, EARNED somewhere, its art (a shape + a finish
// that matches the lab's), the new marks' levels; THE PROMINENCE RULE's budget (a legendary card leads); the picker rows + the lab tabs
// wired; the motion rule (only transform + opacity animate; nothing animates on an SVG element — every moving part an HTML-wrapped layer).
import '../api/_lib/catalog.js';
import { ITEM_ROWS, ACH_ROWS, LEVEL_REWARD_ROWS, MILESTONE_ITEMS } from '../api/_lib/catalog.js';
import { LAB_TEXT } from '../api/_lib/lab-text.js';
import { registerLabText, LAB } from '../js/vault/catalog.js';
import { REWARD_LEVELS } from '../js/core/levels.js';
import { SIGHTINGS } from '../js/core/sightings.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

registerLabText(LAB_TEXT);
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const ROW = Object.fromEntries(ITEM_ROWS.map(x => [x.id, x]));
const HELD = ['card-founder', 'card-house', 'card-platinum'];
const SAMPLES = LAB.filter(x => x.n >= 98 && x.n <= 114);

test('THE 3 HELD CARDS: built (a LOOK + its effect), first in the lab, strip + full card, PLATINUM epic', () => {
  const strip = read('js/vault/strip.js'), fx = read('js/fx/index.js');
  assert.deepEqual(LAB.filter(x => x.kind === 'card' && !x.dev).slice(0, 3).map(x => x.id), HELD);
  assert.equal(ROW['card-platinum'].tier, 'epic', 'PLATINUM = EPIC (the owner\'s pick)');
  assert.equal(ROW['card-founder'].tier, 'legendary'); assert.equal(ROW['card-house'].tier, 'legendary');
  for (const id of HELD) {
    const lab = LAB.find(x => x.id === id), full = LAB.find(x => x.id === `full-${id}`);
    assert.ok(full && full.of === id, `${id}: its full card in the lab`);
    assert.equal(lab.tier, ROW[id].tier, `${id}: the lab's tier`);
    assert.equal(LAB_TEXT[id].name, ROW[id].name); assert.equal(LAB_TEXT[`full-${id}`].name, `${ROW[id].name} · FULL CARD`);
    assert.match(strip, new RegExp(`'${id}': \\{ mat: '\\w+', fx: '(\\w+)' \\}`), `${id}: a look`);
  }
  for (const k of ['opening', 'house', 'platinum', 'bevel']) assert.match(fx, new RegExp(`\\b${k}\\b`), `the registry has ${k}`);
  assert.equal(LEVEL_REWARD_ROWS.find(r => r.item === 'card-platinum').lvl, 95);
  assert.ok(LEVEL_REWARD_ROWS.some(r => r.item === 'card-house' && r.lvl === 100));
  // FOUNDING MEMBER's gold № (the strip's corner + the full card's stamp); the date stone + the sign drawn by the city's own letters
  assert.match(read('js/vault/strip.js'), /card === 'card-founder' && !plain && no != null \? h\('span\.vl-no'/);
  assert.match(read('js/vault/full.js'), /card === 'card-founder' \? h\('div\.vl-fc-stamp'/);
  const op = read('js/fx/opening.js');
  assert.match(op, /'EST\.'/); assert.match(op, /'1924'/); assert.match(op, /signLayout\(\[\{ logo: true/);
  assert.match(read('js/fx/sign-kit.js'), /import \{ LOGO_LETTERS \} from '\.\.\/ui\/logo\.js'/);
});

test('LIGHTS OUT\'s full card: the red heart pulses dark → full (the owner\'s lab FIX)', () => {
  const s = read('js/fx/sg-tr3b.js');
  assert.match(s, /full \? 0\.02 \+ 0\.98 \* Math\.pow\(0\.5 \+ 0\.5 \* Math\.sin\(tt \* 2\.4\), 3\)/);
  assert.match(s, /full \? 0\.04 \+ 0\.8 \* pulse/);
});

test('THE SAMPLES: every emblem / tube style / glow a real item at the lab\'s tier, earned somewhere, its art matching its finish', async () => {
  const { EMBLEM_ART, TUBE_STYLES, FINISHES } = await import('../js/vault/emblem-art.js').catch(() => ({}));
  const art = read('js/vault/emblem-art.js'), glows = read('js/vault/glows.js');
  const earned = id => LEVEL_REWARD_ROWS.some(r => r.item === id) || ACH_ROWS.some(a => a.item === id) || Object.values(MILESTONE_ITEMS).flat().includes(id)
    || SIGHTINGS.some(s => `emb-sg-${s.id || s}` === id || (s.emblem === id));
  assert.equal(SAMPLES.length, 17, '10 emblems + the sign-up set + 3 tube styles + 3 glows');
  for (const x of SAMPLES) {
    assert.ok(LAB_TEXT[x.id] && LAB_TEXT[x.id].name && LAB_TEXT[x.id].motion.length > 20, `${x.id}: the lab's name + what it does`);
    if (x.id === 'emb-signup') continue;                                        // (the 12 sign-up shapes: a lab-only block, everyone's)
    assert.ok(ROW[x.id], `${x.id}: an item`); assert.equal(ROW[x.id].tier, x.tier, `${x.id}: the item's tier = the lab's`);
    assert.equal(ROW[x.id].kind, x.kind === 'emblem' ? 'emblem' : x.kind, `${x.id}: its kind`);
    assert.ok(earned(x.id) || /^emb-sg-/.test(x.id), `${x.id}: earned somewhere`);
    if (x.kind === 'emblem') assert.match(art, new RegExp(`'${x.id}': \\{ shape: '\\w+', finish: '${x.fin}' \\}`), `${x.id}: its art in ${x.fin}`);
    if (x.kind === 'tube') assert.match(art, new RegExp(`'${x.id}': '\\w+'`), `${x.id}: a tube style with a look`);
    if (x.kind === 'glow') assert.match(glows, new RegExp(`'${x.id}': \\{ look: '\\w+'`), `${x.id}: a glow with a look`);
  }
  assert.deepEqual([...new Set(SAMPLES.filter(x => x.fin).map(x => x.fin))].sort(), ['chrome', 'galaxy', 'glitch', 'gold', 'ice', 'molten', 'neon', 'prism'], 'one per finish');
  void EMBLEM_ART; void TUBE_STYLES; void FINISHES;
  // the new marks' places: SWEETHEART early (level 6), A CHASING LIGHT 26, THE HOUSE's crown with the card at 100; the client's WHEN list
  for (const [id, lvl] of [['emb-sweetheart', 6], ['tube-chase', 26], ['emb-house', 100]]) assert.ok(LEVEL_REWARD_ROWS.some(r => r.item === id && r.lvl === lvl), `${id} at level ${lvl}`);
  assert.deepEqual([...REWARD_LEVELS], [...new Set(LEVEL_REWARD_ROWS.map(r => r.lvl))].sort((a, b) => a - b));
  // the set's names (the owner's sketches) + the glows' new tiers (COMMON still: EMBER · ICE · AFTERGLOW)
  for (const [id, name] of [['emb-lightning', 'RAINMAKER'], ['emb-snowflake', 'SNOWED IN'], ['emb-prism', 'FOUR ON THE FLOOR'], ['emb-torch', 'THE FLAME'], ['glow-gold', 'GOLD LEAF'], ['glow-spark', 'ELECTRIC']]) assert.equal(ROW[id].name, name);
  for (const id of ['glow-ember', 'glow-ice', 'glow-afterglow']) assert.equal(ROW[id].tier, 'common', `${id}: a common, still`);
});

test('THE PROMINENCE RULE as the budget: lead plays every layer, even its signature, quiet still — and a legendary card leads', async () => {
  const src = read('js/vault/emblems.js'), css = read('css/vault.css');
  assert.match(src, /if \(cardTier === 'legendary'\) return 'quiet';/);
  assert.match(css, /\.ve:not\(\.is-lead\) \.ve-2, \.ve\.is-quiet \.ve-l \{ animation: none !important; \}/);
  assert.match(css, /\.vg\.vg-still > i \{ animation: none !important; opacity: 0 !important; \}/);
  assert.match(read('js/vault/strip.js'), /if \(tier === 'legendary'\) nameEl\.classList\.add\('vg-still'\)/);
});

test('THE MOTION RULE: the 2A keyframes animate transform + opacity only; every emblem layer an HTML <i> (never an animated <svg>)', () => {
  const css = read('css/vault.css'), at = css.indexOf('THE VAULT 2A — THE EMBLEM SYSTEM'), part = css.slice(at);
  const frames = [...part.matchAll(/@keyframes (v[eg]-[\w-]+) \{([\s\S]*?)\}\s*\}/g)];
  assert.ok(frames.length >= 25, `${frames.length} keyframes`);
  for (const [, name, body] of frames) for (const [, prop] of body.matchAll(/([a-z-]+)\s*:/g)) assert.ok(['transform', 'opacity'].includes(prop), `${name} animates ${prop}`);
  const art = read('js/vault/emblem-art.js');
  assert.match(art, /const box = document\.createElement\('i'\); box\.className = `ve-l/);
  assert.doesNotMatch(css.slice(at), /filter: drop-shadow/, 'no filter under a moving glint');
});

test('THE PICKER: emblems · tube styles · glows as rows on the player\'s own strip (one surface for THE VAULT); THE LAB: EMBLEMS + GLOWS tabs', () => {
  const pr = read('js/progress/profile.js'), pk = read('js/vault/picker.js'), lab = read('js/vault/lab-views.js');
  // (THE VAULT 2B: the profile's long rows became DRESS YOUR CARD — js/vault/dress.js, tested in vault-2b.test.mjs; the picker's row
  //  builders stay for the lab + the previews)
  assert.match(pr, /openDress\(data, /);   // (THE VAULT 2C: the profile's CUSTOMIZE YOUR CARD opens CUSTOMIZE)
  assert.match(pk, /export function stylePicker\(o\)/); assert.match(pk, /'EQUIPPED ✓'/);   // (LOBBY 2.0 A: EQUIP, not wear)
  assert.doesNotMatch(pr, /pg-vitem/, 'the old tiles gone');
  for (const v of ['emblems', 'glows']) assert.match(lab, new RegExp(`\\['${v}', '`));   // (THE LAB 2.0: the SECTIONS table)
  assert.match(lab, /wearMix/);
  assert.doesNotMatch(read('js/profile/bring.js'), /I’M NEW HERE/);
});
