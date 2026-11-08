// THE VAULT 2B (no browser): DRESS YOUR CARD (the profile's one panel + the dress screen's 4 tabs, only owned), MEMBER NUMBERS (the label,
// the server's, separate from the tag), THE TWO DEV CARDS (owner-only, in no reward table), THE REST OF THE SET (every new emblem / glow /
// tube style a real item at its lab tier, earned somewhere, its art registered, its lab text), THE SEASONAL EMBLEMS, THE MOTION RULE for
// 2B's keyframes, the sighting reveal's labels + the demo's wait.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ITEM_ROWS, ACH_ROWS, LEVEL_REWARD_ROWS, MILESTONE_ITEMS, SEASONAL_ITEMS } from '../api/_lib/catalog.js';
import { LAB_TEXT } from '../api/_lib/lab-text.js';
import { LAB } from '../js/vault/catalog.js';
import { DEV_CARDS, isDevCard } from '../js/core/dev-cards.js';
import { memberLabel } from '../js/core/member.js';
import { REWARD_LEVELS } from '../js/core/levels.js';
import { SEASONAL } from '../js/core/progress.js';
import { SIGHTING } from '../js/core/sightings.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const ROW = Object.fromEntries(ITEM_ROWS.map(x => [x.id, x]));
const NEW2B = LAB.filter(x => x.n >= 115);

test('DRESS YOUR CARD: the profile shows ONE panel (the strip, the worn names, the big button) + YOUR COLLECTION; the dress screen = the pinned strip + 4 tabs + tiles', () => {
  const d = read('js/vault/dress.js'), pr = read('js/progress/profile.js');
  assert.match(pr, /export function customizeBar\(data/); assert.match(pr, /'CUSTOMIZE YOUR CARD'/); assert.doesNotMatch(pr, /stylePicker\(|cardPicker\(/, 'the long lists left the profile');
  assert.match(d, /'CUSTOMIZE YOUR CARD'/); assert.match(d, /h\('h2', 'CUSTOMIZE'\)/); assert.doesNotMatch(d, /'DRESS YOUR CARD'/, 'THE VAULT 2C: renamed CUSTOMIZE'); assert.match(d, /'YOUR COLLECTION'/); assert.match(d, /'THE LOBBY SEES THIS'/); assert.match(d, /'VIEW FULL ›'/);
  assert.match(d, /\[\['card', 'CARD'\], \['emblem', 'EMBLEM'\], \['glow', 'GLOW'\], \['tube', 'TUBE'\]\]/, 'the 4 tabs');
  assert.match(d, /ownedOf\(owned, tab\)/, 'only owned items (no ???, no totals of what exists)');
  assert.match(d, /vl-dt-\$\{tier\}/, 'each tile edged in its tier colour'); assert.match(d, /'✓'/, 'the worn one ticked');
  assert.match(d, /o\.wear\(slot, id\)/, 'a tap wears it at once'); assert.match(d, /W\[slot\] = was/, 'a refusal puts it back');
  assert.match(d, /pointerdown[\s\S]*pointerup/, 'taps by pointerdown + pointerup (iOS)'); assert.match(d, /setTimeout\(hold, 450\)/, 'a long-press → the full card'); assert.match(d, /'contextmenu'[^\n]*hold\(\)/, 'the browser long-press too');
  assert.match(d, /tubeApplies\(W\.shape\)/, 'the tube tab says so under a special finish');
  const css = read('css/vault.css');
  for (const t of ['common', 'uncommon', 'rare', 'epic', 'legendary']) assert.match(css, new RegExp(t === 'common' ? '\\.vl-dt \\{ --e: var\\(--tier-common\\)' : `\\.vl-dt-${t} \\{ --e: var\\(--tier-${t}\\)`));
  assert.match(css, /\.vl-dr-tab \{ min-height: 44px/, 'tabs ≥ 44 pt');
});

test('MEMBER NUMBERS: the label (0001), the server writes them (members.js), the cards show mn — never the name tag', () => {
  assert.equal(memberLabel(1), '0001'); assert.equal(memberLabel(42), '0042'); assert.equal(memberLabel(10000), '10000'); assert.equal(memberLabel(0), null); assert.equal(memberLabel(undefined), null);
  const card = read('js/progress/card.js'), prof = read('js/progress/profile.js'), scr = read('js/screens/profile.js');
  assert.match(card, /memberLabel\(p\.mn\)/); assert.doesNotMatch(card, /`№ \$\{p\.t\}`/, 'the tag is not the №');
  assert.doesNotMatch(prof, /no: p\.t/); assert.doesNotMatch(scr, /no: p\.t/);
  const srv = read('api/_lib/profiles.js'), m = read('api/_lib/members.js');
  assert.match(srv, /mn: p\.mn \|\| null/); assert.match(srv, /memberNo\(pid, now\)/);
  assert.match(m, /ownerPid = \(\) => adminPids\(\)\[0\]/, 'the owner = the first ADMIN_PIDS'); assert.match(m, /transaction/, 'the counter in a transaction');
});

test('THE TWO DEV CARDS: owner-only (granted on me, refused on style), legendary in every rule, in NO reward table, names on the server only', () => {
  assert.deepEqual([...DEV_CARDS], ['card-dev-switchboard', 'card-dev-source']);
  for (const id of DEV_CARDS) {
    assert.ok(isDevCard(id)); assert.equal(ROW[id].tier, 'legendary'); assert.equal(ROW[id].dev, true);
    assert.ok(!LEVEL_REWARD_ROWS.some(r => r.item === id) && !ACH_ROWS.some(a => a.item === id) && !Object.values(MILESTONE_ITEMS).flat().includes(id) && !Object.values(SEASONAL_ITEMS).includes(id), `${id}: never earnable`);
    assert.ok(LAB.find(x => x.id === id && x.dev) && LAB.find(x => x.id === `full-${id}` && x.dev), `${id}: strip + full card in the lab`);
    assert.ok(LAB_TEXT[id] && LAB_TEXT[`full-${id}`], `${id}: its lab text (server)`);
  }
  assert.deepEqual(LAB.filter(x => x.kind === 'card').slice(0, 2).map(x => x.id), DEV_CARDS, 'FIRST in the lab');
  const api = read('api/profile.js');
  assert.match(api, /adminPids\(\)\.includes\(pid\)/); assert.match(api, /\(isDevCard\(id\) \|\| isOwnerGift\(id\)\) && !adminPids\(\)\.includes\(pid\)\) throw new ApiError\(403, 'locked'\)/);
  const strip = read('js/vault/strip.js'), fx = read('js/fx/index.js');
  assert.match(strip, /'card-dev-switchboard': \{ mat: 'devswitch', fx: 'devSwitch' \}/); assert.match(strip, /'card-dev-source': \{ mat: 'devsource', fx: 'devSource' \}/);
  assert.match(fx, /devSwitch, devSource/);
  assert.match(read('js/vault/approved.js'), /for \(const id of ONE_OF_ONE_CARDS\)/, 'his own art shows while he marks it (B2: + the gift cards — their one owner sees their art)');
});

test('THE REST OF THE SET: every 2B emblem / glow / tube style a real item at the lab\'s tier, earned somewhere, its art registered, its lab text', async () => {
  const { EMBLEM_ART, TUBE_STYLES } = await import('../js/vault/emblem-art.js').catch(() => ({}));
  const art = read('js/vault/emblem-art.js'), glows = read('js/vault/glows.js');
  const sightEmb = new Set(Object.values(SIGHTING).map(s => s.emblem));
  const earned = id => LEVEL_REWARD_ROWS.some(r => r.item === id) || ACH_ROWS.some(a => a.item === id) || Object.values(MILESTONE_ITEMS).flat().includes(id) || Object.values(SEASONAL_ITEMS).includes(id) || sightEmb.has(id);
  const items = NEW2B.filter(x => !x.dev && !x.gift && x.kind !== 'full');   // (SHELL 2.0 B2: the gift cards are given, never earned — tests/shell-b2.test.mjs; OVERCLOCK CARDS: a FULL card's lab row is its card's art, not an item)
  assert.ok(items.length >= 40, `${items.length} new lab rows`);
  for (const x of items) {
    assert.ok(ROW[x.id], `${x.id}: an item`); assert.equal(ROW[x.id].tier, x.tier, `${x.id}: the item's tier = the lab's`);
    assert.ok(earned(x.id), `${x.id}: earned somewhere`);
    assert.ok(LAB_TEXT[x.id] && LAB_TEXT[x.id].motion.length > 20, `${x.id}: its lab text`);
    if (x.kind === 'emblem') assert.match(art, new RegExp(`'${x.id}': \\{ shape: '\\w+', finish: '${x.fin}' \\}`), `${x.id}: its art in ${x.fin}`);
    if (x.kind === 'tube') assert.match(art, new RegExp(`'${x.id}': '\\w+'`), `${x.id}: a tube style with a look`);
    if (x.kind === 'glow') assert.match(glows, new RegExp(`'${x.id}': \\{ look: '\\w+'`), `${x.id}: a glow with a look`);
  }
  // every emblem item in the catalog has art now (no placeholder glyph left) · every glow + tube style a look
  // (PENDING_ART: an emblem whose art THE LAB hasn't drawn yet — it shows its glyph / the player's sign until then; OC5's lucky emblem had one
  //  until THE CARD PASS drew it — none pending now)
  const PENDING_ART = new Set([]);
  for (const r of ITEM_ROWS.filter(x => x.kind === 'emblem' && !PENDING_ART.has(x.id))) assert.match(art, new RegExp(`'${r.id}': \\{ shape:`), `${r.id}: art`);
  for (const id of PENDING_ART) assert.ok(ROW[id] && ROW[id].glyph && !LAB.some(x => x.id === id), `${id}: pending — a glyph, no lab row yet`);
  for (const r of ITEM_ROWS.filter(x => x.kind === 'glow')) assert.match(glows, new RegExp(`'${r.id}': \\{ look:`), `${r.id}: a look`);
  for (const r of ITEM_ROWS.filter(x => x.kind === 'tube')) assert.match(art, new RegExp(`'${r.id}': '\\w+'`), `${r.id}: a look`);
  // the places: BUTTERFLY 9 · FROST 23 · FIRE 38 · BURNT OUT 53 · GLITCH 63; the client's WHEN list matches
  for (const [id, lvl] of [['emb-butterfly', 9], ['glow-frost', 23], ['glow-fire', 38], ['tube-burnt', 53], ['glow-glitch', 63]]) assert.ok(LEVEL_REWARD_ROWS.some(r => r.item === id && r.lvl === lvl), `${id} at ${lvl}`);
  assert.deepEqual([...REWARD_LEVELS], [...new Set(LEVEL_REWARD_ROWS.map(r => r.lvl))].sort((a, b) => a - b));
  // THE CROWN: its own shape (not THE HOUSE's crown)
  assert.match(art, /'emb-crown': \{ shape: 'crown2', finish: 'neon' \}/);
  void EMBLEM_ART; void TUBE_STYLES;
});

test('THE SEASONAL EMBLEMS: one per big holiday, epic, earned only during it (a counted match on its days), registered by the server', () => {
  assert.deepEqual(SEASONAL_ITEMS, { halloween: 'emb-hw', thanksgiving: 'emb-tg', christmas: 'emb-xmas', nye: 'emb-nye' });
  assert.deepEqual({ ...SEASONAL }, SEASONAL_ITEMS, 'registered into the shared step');
  for (const id of Object.values(SEASONAL_ITEMS)) assert.equal(ROW[id].tier, 'epic');
  assert.match(read('js/core/progress.js'), /if \(ctx\.holiday && SEASONAL\[ctx\.holiday\]\) items\.push\(\.\.\.grant\(next, \[SEASONAL\[ctx\.holiday\]\], now\)\)/);
  assert.match(read('api/_lib/stats.js'), /holiday: hol && hol\.full \? hol\.id : null/, 'only the holiday\'s own days (full)');
});

test('THE MOTION RULE (2B): the new keyframes animate transform + opacity only; emblem accents are HTML layers; a glow\'s copy only fades / shifts', () => {
  const css = read('css/vault.css'), at = css.indexOf('THE VAULT 2B — THE REST OF THE EMBLEM SET');
  assert.ok(at > 0);
  const blocks = css.slice(at).match(/@keyframes [\w-]+ \{[\s\S]*?\} \}/g) || [];
  assert.ok(blocks.length >= 20, `${blocks.length} keyframes`);
  for (const k of blocks) for (const prop of k.match(/\{\s*([a-z-]+):/g) || []) assert.match(prop, /\{\s*(opacity|transform):/, `${k.slice(0, 40)}: ${prop}`);
  assert.doesNotMatch(css.slice(at), /animation:[^;]*(?:box-shadow|filter)/);
  assert.match(read('js/vault/emblem-art.js'), /group\(cls, style\) \{ const g = document\.createElement\('i'\)/, 'a group is an HTML layer');
  assert.match(read('js/vault/beat-sync.js'), /getAnimations/, 'ON THE BEAT: the layer\'s own clock, no restyle a tick');
});

test('THE SIGHTING REVEAL: the two names on one baseline (same-height tiles), the real emblem once approved; &sgdemo waits for the whole legendary', () => {
  const sg = read('js/progress/sighting.js'), css = read('css/sightings.css'), t = read('js/screens/title.js'), sr = read('js/screens/harbor/sight-react.js');
  assert.match(sg, /h\('div\.sg-art', pairArt\)/); assert.match(sg, /h\('div\.sg-art', embBox\)/);
  assert.match(css, /\.sg-art \{ width: 100%; max-width: 168px; aspect-ratio: 1\.586;/);
  assert.match(sg, /upgradeEmblem\(embBox, s\.emblem, !!sg\.demo\)/);
  assert.match(t, /x\.a == null \|\| x\.a >= 0\.85/, 'faded all the way in'); assert.match(t, /onK\(x\.x, x\.w \|\| 0, innerWidth\) >= 0\.7/, 'most of it on screen');
  assert.match(sr, /a: b\.meta && b\.meta\.a != null/); assert.match(read('js/screens/harbor/ghostship.js'), /SR\.box\('ghostship', [^;]*\{ a \}\)/);
});

// FR6 FIXES A — the FAST legendaries (their photo at the tap): sighting.js keeps the list as data (a lazy file never imports the city) —
// the two lists must agree, and every FAST id must be a legendary with a reaction
test('FAST legendaries: sighting.js and sight-react.js name the same craft, each a real legendary', async () => {
  const SR = await import('../js/screens/harbor/sight-react.js');
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../js/progress/sighting.js', import.meta.url), 'utf8');
  const m = /export const FAST = \[([^\]]*)\]/.exec(src);
  assert.ok(m, 'sighting.js exports FAST');
  const list = m[1].split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean);
  assert.deepEqual([...list].sort(), [...SR.FAST].sort());
  for (const id of list) assert.ok(SR.REACT_LEN[id], `${id} has a reaction`);
  assert.deepEqual([...SR.FAST].sort(), ['blackbird', 'f22', 'fireball']);
});
