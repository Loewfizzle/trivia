// SHELL 2.0 B2 — the pure + source checks of the pass (docs/harbor/passes/shell-b2.md). The live halves run in the harbor suite
// (lobbyfix 'platefit': THE HERO-SPOT RULE on the live plate · lobby2 'roomfix': the 1 OF 1 letter by letter · lobby2 'sololook': THE GAME LOOK).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// ---- GROUP 0 — THE HERO-SPOT AUDIT
test('THE HERO-SPOT RULE: every declared hero centred middle → middle-right, none over the tier gem; the moved effects say where', async () => {
  const H = await import('../js/vault/hero.js');
  assert.deepEqual(H.heroMisses(), []);
  assert.ok(Object.keys(H.HERO).length >= 17);
  // a box over the gem, or a centre under the plate's half, is caught
  assert.equal(H.overlaps([0.8, 0.6, 0.15, 0.3], H.GEM_BOX), true);
  assert.equal(H.overlaps([0.5, 0.1, 0.2, 0.3], H.GEM_BOX), false);
  // the fixes (each its strip branch): CAMO's reticle 0.86 → 0.7, CENTURY's sun 0.2 → 0.62, the TR-3B 0.7 → 0.62, the prism 0.55 → 0.63, …
  assert.match(read('js/fx/scan.js'), /const tx = w \* \(s\.opts\.full \? 0\.78 : 0\.7\)/);
  assert.match(read('js/fx/deco.js'), /const ox = full \? w \* 0\.5 : w \* 0\.62/);
  assert.match(read('js/fx/sg-tr3b.js'), /cx = \(full \? S\.cx : w \* 0\.62\)/);
  assert.match(read('js/fx/prism.js'), /pcx = w \* \(full \? 0\.6 : 0\.63\)/);
  assert.match(read('js/fx/ufo.js'), /cx = full \? w \* 0\.5 : w \* 0\.66/);
  assert.match(read('js/fx/marquee.js'), /const x0 = w \* \(full \? 0\.62 : 0\.6\), x1 = w \* \(full \? 0\.88 : 0\.86\)/);
  assert.match(read('js/fx/dev-source.js'), /sign: \[w \* 0\.705 - w \* 0\.125,/);
  // THE SWITCHBOARD's full card: ON AIR up in the band (the owner's B1 look: it sat under a long name's plate) — its BADGE part moved too
  assert.match(read('js/fx/dev-switch.js'), /air = \[w \* 0\.66, h \* 0\.205, w \* 0\.25, h \* 0\.095\]/);
  assert.match(read('js/vault/full.js'), /\[0\.66, 0\.205, 0\.25, 0\.095\]/);
  // every moved card has a CHANGED line at its new version
  const { LAB_V } = await import('../js/vault/catalog.js'), txt = read('api/_lib/lab-text.js');
  for (const id of ['card-camo', 'card-century', 'card-sg-tr3b', 'card-prism', 'card-emerald', 'card-sg-ufo', 'card-marquee', 'card-dev-source', 'card-dev-switchboard', 'full-card-dev-switchboard', 'full-card-dev-source']) {
    assert.ok(LAB_V[id] >= 2, `${id} bumped`);
    assert.match(txt, new RegExp(`'${id}': \\[[^\\n]*v: ${LAB_V[id]}, at: '2026-11-05'`), `${id}: its CHANGED line`);
  }
});

// ---- GROUP 0 — THE 1 OF 1 (the owner: "the fancy GRADIENT colour, just more VISIBLE")
test('THE 1 OF 1: the rainbow gradient on the letters (bright stops, no dark violet), the dark backing, a dark edge, a gap before FOUNDER', () => {
  const css = read('css/vault.css'), full = read('js/vault/full.js');
  assert.match(full, /h\('b\.vl-fc-1of1', h\('i\.vl-fc-1of1-t', ONE_OF_ONE\)\)/);
  const t = /\.vl-fc-1of1-t \{([^}]+)\}/.exec(css)[1];
  assert.match(t, /background-clip: text/);
  assert.match(t, /drop-shadow\(0 0 0\.5px rgba\(0, 0, 0, 0\.95\)\)/, 'a thin dark edge under the letters');
  const stops = [...t.matchAll(/#([0-9a-f]{6})/g)].map(m => m[1]);
  assert.equal(stops.length, 5);
  // every stop bright: its relative luminance ≥ 0.4 (the old end, #8a5cff-ish violet, was ~0.2)
  const lum = hex => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; const n = parseInt(hex, 16); return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
  for (const s of stops) assert.ok(lum(s) >= 0.4, `#${s} is bright (${lum(s).toFixed(2)})`);
  assert.match(css, /\.vl-fc-1of1 \{ font: 900 1em\/1 var\(--font-display\);[^}]*background: rgba\(8, 5, 14, 0\.88\)/);
  assert.match(css, /\.vl-fc-gem\.is-1of1 \{ gap: 0\.9em; margin-left: 10px; \}/);
  assert.match(css, /\.vl-fc-gem\.is-1of1 \{ margin: 3px 3\.5% 0 0; font-size: clamp\(10px, 4cqi, 14\.5px\); \}/, 'a touch bigger');
});

// ---- GROUP 0 — THE GAME LOOK (a Settings row, per device, NO LOCK)
test('THE GAME LOOK: no dock button; a Settings row; saveLook fires the live event; AUTO by the sun; nothing locks a match', async () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  const heard = [];
  globalThis.window = { dispatchEvent: e => heard.push(e.detail) };
  globalThis.CustomEvent = class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } };
  const L = await import('../js/games/kit/look.js');
  assert.deepEqual([...L.LOOKS], ['auto', 'day', 'night']);
  assert.equal(L.savedLook(), 'auto', 'AUTO by default');
  L.saveLook('night'); assert.equal(L.savedLook(), 'night'); assert.deepEqual(heard, ['night'], 'a change tells the page at once (no lock)');
  L.saveLook('nope'); assert.equal(L.currentLook(), 'night');
  assert.equal(L.resolveLook('auto', true), 'day'); assert.equal(L.resolveLook('auto', false), 'night'); assert.equal(L.resolveLook('day', false), 'day');
  assert.equal(L.matchLook, undefined, 'B1\'s per-match lock is gone');
  assert.equal(L.nextLook, undefined, 'B1\'s one-tap cycle (the dock button) is gone');
  const dock = read('js/screens/room-dock.js'), city = read('js/screens/room-city.js'), app = read('js/app.js'), set = read('js/ui/settings-panel.js'), css = read('css/title.css');
  assert.doesNotMatch(dock + city + css, /rdk-look|lookChoice/);
  assert.match(set, /function gameLookRow\(\)/); assert.match(set, /h\('span\.label', 'GAME LOOK'\)/); assert.match(set, /const lookRow = gameLookRow\(\);/);
  // (FRIENDS B — B5: a locked row → no live "Always night" switch under it)
  assert.match(set, /lookRow\.classList\.contains\('is-locked'\) \? \[\] : \[toggle\('Always night', 'alwaysNight'\)\]/);
  // every match on screen (solo or not), live: the event + a minute's sun re-read; no participants-count gate
  assert.match(app, /lookOnNow = !!\(g && st\.meta && st\.meta\.status === 'playing' && st\.quit !== g\.matchId\);/);
  assert.match(app, /window\.addEventListener\(lookMod\.LOOK_EVENT/);
  assert.doesNotMatch(app, /matchLook/);
});

// ---- GROUP 0 — THE AIRLINER (weight 2 → 1; the medium group says MEDIUM)
test('THE AIRLINER: medium.plane weight 1; THE PROGRAM tags the medium moments MEDIUM (common grey), never UNCOMMON', async () => {
  const { SCHEDULE } = await import('../js/core/harbor-schedule.js');
  assert.equal(SCHEDULE.find(x => x.id === 'medium.plane').knobs.medium.weight, 1);
  const R = await import('../js/core/rarity.js');
  assert.equal(R.programWord({ cat: 'medium' }), 'MEDIUM');
  assert.equal(R.programTier({ cat: 'medium' }), 'common');
  assert.equal(R.programWord({ cat: 'windows' }), 'UNCOMMON');
  assert.equal(R.programWord({ cat: 'legendary' }), 'LEGENDARY');
});

// ---- GROUP 0 — GREEN MEANS GREEN (the three test causes)
test('GREEN MEANS GREEN: the panel taps until its sheet is up; the second-tab step follows the visible-tab rule', () => {
  const kit = read('tests/integration/harbor-e2e/kit.mjs'), city = read('tests/integration/harbor-e2e/city.mjs'), prof = read('tests/integration/e2e-profiles.mjs');
  assert.match(kit, /export async function tapUntil\(p, sel, cond, what, ms = 20000\)/);
  assert.match(city, /tapUntil\(O\.page, '\.gm-adm \.sh-row', '!!document\.querySelector\("\.hr-sheet"\)', 'the sheet'\)/);
  assert.doesNotMatch(city, /'the sheet', 5000/);
  assert.match(prof, /const \[Y, A\] = \(await p6\.\$\('\.dup-tab'\)\) \? \[p6, p5\] : \[p5, p6\];/);
  assert.match(prof, /await Y\.bringToFront\(\);/);
});

// ---- GROUP 1 — THE GIFT CARDS + THE GIFT TOOL (the server half: tests/integration/server.test.mjs "THE GIFT TOOL")
test('THE GIFT CARDS: 19 one-of-ones (18 giftable + the owner\'s own — + THE CARD PASS\'s seven), real items, never earnable, in THE LAB\'s GIFTS, each with its art + motion', async () => {
  const G = await import('../js/core/gift-cards.js'), D = await import('../js/core/dev-cards.js');
  const { ITEM_ROWS, LEVEL_REWARD_ROWS, ACH_ROWS, MILESTONE_ITEMS, SEASONAL_ITEMS } = await import('../api/_lib/catalog.js');
  const { LAB } = await import('../js/vault/catalog.js'), { LAB_TEXT } = await import('../api/_lib/lab-text.js');
  const { GIFT_SPECS } = await import('../js/fx/gift-specs.js');
  assert.equal(G.GIFT_CARDS.length, 19);
  assert.deepEqual([...G.OWNER_GIFTS], ['card-gift-anarchist']);
  assert.equal(G.GIFTABLE.length, 18); assert.ok(!G.isGiftable('card-gift-anarchist') && G.isGiftable('card-gift-enforcer'));
  const strip = read('js/vault/strip.js'), index = read('js/fx/index.js'), css = read('css/vault.css');
  for (const id of G.GIFT_CARDS) {
    assert.ok(D.isOneOfOne(id) && !D.isDevCard(id), `${id}: a 1 of 1 (not a dev card)`);
    const row = ITEM_ROWS.find(r => r.id === id);
    assert.ok(row && row.kind === 'card' && row.tier === 'legendary' && row.gift, `${id}: a legendary gift item`);
    assert.ok(!LEVEL_REWARD_ROWS.some(r => r.item === id) && !ACH_ROWS.some(a => a.item === id) && !Object.values(MILESTONE_ITEMS).flat().includes(id) && !Object.values(SEASONAL_ITEMS).includes(id), `${id}: never earnable`);
    assert.ok(LAB.find(x => x.id === id && x.gift) && LAB.find(x => x.id === `full-${id}` && x.gift), `${id}: strip + full card in THE LAB`);
    assert.ok(LAB_TEXT[id] && LAB_TEXT[`full-${id}`], `${id}: its lab text (server)`);
    const S = GIFT_SPECS[id];
    assert.ok(S && S.layers.length >= 3 && S.hero, `${id}: its motion (≥ 3 layers) + its hero`);
    assert.ok(strip.includes(`'${id}': { mat: 'g-${S.art}', fx: 'gift:${id}' }`), `${id}: its LOOK`);
    // the CSS crop = the effect's crop (one set of numbers — a glint lands on the lens)
    // (CARD FIXES: a zoom out — strip[2] — is `z·100% auto` over the art's own ground colour)
    const sz = S.strip[2] ? `${+(S.strip[2] * 100).toFixed(2)}% auto` : 'cover', sa = S.stripArt ? S.stripArt.art : S.art, sc = S.stripArt ? (S.stripArt.crop || [50, 50]) : S.strip;   // (BRUH: its own strip picture)
    assert.match(css, new RegExp(`\\.vl-s-g-${S.art} \\.vl-mat \\{ background: #[0-9a-f]{6} url\\('\\.\\./assets/vault/gift/${sa}\\.webp'\\) ${sc[0]}% ${sc[1]}% / ${sz} no-repeat`), `${id}: the strip's crop = gift-specs`);
    assert.ok(existsSync(new URL(`../assets/vault/gift/${S.art}.webp`, import.meta.url)), `${id}: its art file`);
  }
  assert.match(index, /\.\.\.Object\.fromEntries\(Object\.keys\(GIFT_SPECS\)\.map\(id => \[`gift:\$\{id\}`, giftFx\(id\)\]\)\)/);
  assert.ok(existsSync(new URL('../assets/vault/gift/goldenhour-polaroid.webp', import.meta.url)));
  // every layer kind the specs use is drawn by the engine; motion on the DOM side = transform + opacity (the flip-in)
  const eng = read('js/fx/gift.js');
  for (const S of Object.values(GIFT_SPECS)) for (const L of S.layers) assert.ok(eng.includes(`\n  ${L.t}(c, L, M, t, s, Q, F) {`), `the engine draws '${L.t}'`);
  assert.match(css, /@keyframes vl-gift-flip \{ 0% \{ opacity: 0; transform: rotateY\(-180deg\) scale\(0\.7\); \}/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{ \.vl-full-flip \.vl-gift-head, \.vl-full-flip \.vl-full-stage \{ animation: none; \} \}/);
  // the credit
  assert.match(read('js/ui/credits.js'), /Art generated with Grok Imagine \(xAI\)/);
});
test('THE GIFT TOOL: owner-only on the server (the admin gate), one profile ever (a transaction first), equipped + a reveal; the owner\'s own card on \'me\'', () => {
  const g = read('api/_lib/gifts.js'), adm = read('api/admin.js'), prof = read('api/profile.js'), rev = read('js/profile/gift-reveal.js'), app = read('js/app.js');
  assert.match(g, /const lock = await ref\(`gifts\/\$\{card\}`\)\.transaction\(cur => \(cur \? undefined : \{ pid, at: now, by \}\)\);/);
  assert.match(g, /if \(isOwnerGift\(card\)\) throw new ApiError\(403, 'not_giftable'/);
  assert.match(g, /\[`profiles\/\$\{pid\}\/cd`\]: card/); assert.match(g, /\[`\$\{qPath\(pid\)\}\/\$\{ref\(qPath\(pid\)\)\.push\(\)\.key\}`\]: \{ id: card, at: now \}/);   // (THE CARD PASS: into THE GIFT QUEUE)
  // (the gate: every non-radio action past `if (!admin) throw … not_admin`)
  assert.ok(adm.indexOf("if (!admin) throw new ApiError(403, 'not_admin'") < adm.indexOf("case 'giftGive':"));
  assert.match(adm, /await audit\(me, 'giftGive', r\.gift\.pid/);
  assert.match(prof, /OWN = \[\.\.\.DEV_CARDS, \.\.\.OWNER_GIFTS\]/); assert.match(prof, /act: 'giftOwner'/);
  assert.match(prof, /case 'giftCheck':/); assert.match(prof, /case 'giftSeen':/);
  assert.match(rev, /h\('small', o\.n \? `GIFT \$\{o\.n\} OF \$\{o\.of\}` : 'A GIFT FROM THE HOUSE'\)/); assert.match(rev, /flip: true/);
  assert.match(app, /lazyImport\(import\('\.\/profile\/gift-reveal\.js'\), '[^']*'\)\.then\(m => m\.checkGift\(\)\)/);   // (LOAD FIX 4: through the skew wrapper)
  assert.match(read('js/admin/admin.js'), /tubeButton\('GIVE', \{ kind: 'main', size: 'sm', cls: 'ad-btn ad-gift-go', confirm: 'TAP AGAIN TO GIVE'/);
});

// ---- THE ADD-ON — THE DISPLAY CHECK (the owner, Nov 5 12:58 pm: no dummy HDMI plug): the real-compositor speed checks ask first
test('THE DISPLAY CHECK: attached → the check runs as before; none → SKIPPED with its reason, counted apart (never a fail, never a silent pass)', async () => {
  const K = await import('./integration/kit/display.mjs');   // (no puppeteer: the cloud's unit job has none)
  assert.equal(K.NO_DISPLAY, 'no display attached (a no-screen boot)');
  assert.deepEqual(K.displayVerdict({ platform: 'win32', count: 0 }), { attached: false, reason: K.NO_DISPLAY });
  assert.equal(K.displayVerdict({ platform: 'win32', count: 1 }).attached, true);
  assert.equal(K.displayVerdict({ platform: 'win32', count: null }).attached, true, 'unknown → run as before');
  assert.equal(K.displayVerdict({ platform: 'linux', count: 0 }).attached, true, 'the cloud has its own skip (ON_CI)');
  assert.equal(K.displayVerdict({ platform: 'win32', count: 2, env: '0' }).attached, false); assert.equal(K.displayVerdict({ platform: 'win32', count: 0, env: '1' }).attached, true);
  // the skip: recorded as not-failed WITH its kind + reason; the summary counts it apart
  const kit = read('tests/integration/harbor-e2e/kit.mjs'), v = read('tests/integration/harbor-e2e/vault.mjs'), top = read('tests/integration/e2e-harbor.mjs');
  assert.match(kit, /export const skipNoDisplay = \(what, why\) => \{ checks\.push\(\{ what, ok: true, warn: 'skipped-display' \}\); warnings\.push\(`\[skipped \(no display\)\]/);
  assert.match(v, /const realCheck = async \(speed, rule, what\) => \{ const d = await displayAttached\(\); if \(!ON_CI && !d\.attached\) \{ ok\(rule, `\$\{what\} — its rule half`\); skipNoDisplay\(what, d\.reason\); \} else gpuCheck\(speed, rule, what\); \};/);
  assert.equal((v.match(/await realCheck\(/g) || []).length, 2, 'the two real-compositor lobbies');
  assert.match(top, /skipped \(no display\)/);
});

// ---- GROUP 2 — MAKE HOST + THE CREW SWITCH LIVE (the live halves: harbor 'makehost' + 'crew'; the rule: rules.test.mjs "MAKE HOST")
test('MAKE HOST: the host only, in the room only, to an online player only; meta/hostBy so both phones say it; the rule validates the hand-off', () => {
  const room = read('js/room.js'), host = read('js/host.js'), city = read('js/screens/room-city.js'), rules = JSON.parse(read('database.rules.json'));
  assert.match(room, /if \(!code \|\| !state\.meta \|\| state\.meta\.hostId !== state\.uid\) return 'Only the host can do that\.';/);
  assert.match(room, /if \(state\.meta\.status === 'playing'\) return 'Not during a match — in the room\.';/);
  assert.match(room, /if \(!isOnline\(state\.presence, uid\)\) return 'They’re offline — they need to be here\.';/);
  assert.match(room, /update\(dbRef\(`\$\{R\(code\)\}\/meta`\), \{ hostId: uid, hostBy: state\.uid, hostBeat: serverTimestamp\(\) \}\)/);
  assert.match(host, /state\.players\[handPending\.from\] && state\.meta\.hostBy !== handPending\.from\) return;/);
  assert.match(city, /confirm: online \? 'TAP AGAIN TO HAND OVER' : null/);
  const meta = rules.rules.rooms.$code.meta;
  assert.match(meta.hostId['.validate'], /newData\.val\(\) === auth\.uid \|\| \(root\.child\('rooms\/' \+ \$code \+ '\/players\/' \+ newData\.val\(\)\)\.exists\(\) && !root\.child\('rooms\/' \+ \$code \+ '\/kicked\/' \+ newData\.val\(\)\)\.exists\(\)/);
  assert.ok(meta.hostBy && /isString/.test(meta.hostBy['.validate']));
  // (the leave's hand-off survives a refused heir: the phone still leaves)
  assert.match(room, /try \{ await update\(dbRef\(`\$\{R\(code\)\}\/meta`\), \{ hostId: heir, hostBeat: serverTimestamp\(\) \}\); \} catch/);
});
test('THE CREW SWITCH LIVE: the server stamps the room; the player\'s phone loads / drops its radio at once (a fresh ask, never the cached yes)', () => {
  const srv = read('api/_lib/radio.js'), gate = read('js/screens/harbor/radio-gate.js'), app = read('js/app.js'), row = read('js/screens/crew-row.js'), radio = read('js/screens/harbor/radio.js');
  assert.match(srv, /ref\(`rooms\/\$\{room\}\/radioCrew\/role\/\$\{String\(body\.uid\)\}`\)\.set\(\{ on, at: now \}\)/);
  assert.match(row, /action: 'radioCrewSet', uid, on: !pk\.on, room: state\.code \|\| null/);
  assert.match(gate, /const drop = \(\) => \{ ss\.set\(KEY, null\); if \(radio\)/); assert.match(gate, /const fresh = \(\) => \{ ss\.set\(KEY, null\); if \(!radio\) return tryIt\(\);/);
  assert.match(app, /if \(r\.on\) radioGate\.fresh\(\); else radioGate\.drop\(\);/);
  assert.match(app, /^let radioGate = null, crewSeen;$/m, 'declared before the first render (B1\'s TDZ lesson)');
  assert.match(radio, /if \(onGone\) try \{ onGone\(\); \}/);
});

// ---- GROUP 3 — THE MUSIC's IDLE CUTOFF (a faked clock)
test('THE IDLE CUTOFF: 5 h with no tap / key / scroll → the music off + ONE message; a tap brings it back; never during a match; the second tab\'s quiet holds on its own', async () => {
  const S = await import('../js/audio/settings.js'), I = await import('../js/audio/idle.js');
  const ls = new Map(), tgt = { h: new Map(), addEventListener(e, f) { this.h.set(e, f); }, removeEventListener(e) { this.h.delete(e); } };
  let T = 1_000_000, match = false; const said = [];
  S.updateSettings({ musicOff: false });
  const C = I.startIdleCutoff({ now: () => T, inMatch: () => match, say: l => { said.push(l); return { close() { said.push('closed'); } }; }, target: tgt, every: 0 });
  assert.deepEqual([...tgt.h.keys()].sort(), ['keydown', 'pointerdown', 'scroll', 'touchstart', 'wheel']);
  T += I.IDLE_MS - 60e3; assert.equal(C.check(), false, '4 h 59 min: still playing'); assert.equal(S.settings.musicOff, false);
  T += 60e3; assert.equal(C.check(), true, '5 h: the cutoff'); assert.equal(S.settings.musicOff, true, 'the music off (this page)');
  assert.deepEqual(said, ['Music paused — tap to bring it back']); assert.equal(C.check(), false, 'said once');
  tgt.h.get('pointerdown')(); assert.equal(S.settings.musicOff, false, 'a tap brings it back'); assert.equal(said.at(-1), 'closed', 'the message goes with it');
  match = true; T += I.IDLE_MS * 2; assert.equal(C.check(), false, 'never during a match in a room'); match = false;
  // the second tab's quiet (reason 'tab') + the idle one: waking from idle leaves the tab's quiet in place
  S.setPageQuiet(true); assert.equal(C.check(), true); tgt.h.get('keydown')(); assert.equal(S.settings.musicOff, true, 'still the yielded tab — quiet');
  S.setPageQuiet(false); assert.equal(S.settings.musicOff, false, 'both reasons gone → the device\'s own choice');
  C.stop(); assert.equal(tgt.h.size, 0);
  assert.equal(I.isIdle({ last: 0, now: I.IDLE_MS, inMatch: false }), true);
  assert.match(read('js/app.js'), /startIdleCutoff\(\{ inMatch: \(\) => !!\(state\.code && state\.game && state\.meta && state\.meta\.status === 'playing'\)/);
});

// ---- GROUP 3 — YOUR PREVIOUS KEY · THE LINK-PREVIEW IMAGE · THE CITY-1.0 SONGS
test('YOUR PREVIOUS KEY on YOU → ACCOUNT; the link preview og.jpg (FRIENDS B: 1200 × 630 JPEG ≤ 300 KB, ?v=4, a shots.mjs size); late1 + late2 out of the deploy, nothing names them', () => {
  const prof = read('js/screens/profile.js');
  assert.match(prof, /els\.prevKey = prevKeyRow\(\);/); assert.match(prof, /const k = previousKey\(\);\n    if \(!k\) return null;/);
  assert.match(prof, /label: 'Your previous key', sub: k, value: 'COPY'/); assert.match(prof, /confirm: 'TAP AGAIN TO FORGET IT'/);
  const og = readFileSync(new URL('../assets/og.jpg', import.meta.url));
  assert.equal(og.readUInt16BE(0), 0xffd8, 'a JPEG'); assert.ok(og.length <= 300 * 1024, `≤ 300 KB (${og.length})`);
  // (the frame's size from its SOF marker)
  let i = 2, dim = null;
  while (i < og.length - 9) { if (og[i] !== 0xff) { i++; continue; } const m = og[i + 1]; if (m >= 0xc0 && m <= 0xc3) { dim = [og.readUInt16BE(i + 7), og.readUInt16BE(i + 5)]; break; } i += 2 + og.readUInt16BE(i + 2); }
  assert.deepEqual(dim, [1200, 630]);
  assert.ok(!existsSync(new URL('../assets/og.png', import.meta.url)), 'the 1 MB png gone');
  const idx = read('index.html'); assert.equal((idx.match(/assets\/og\.jpg\?v=4/g) || []).length, 2); assert.match(idx, /og:image:type" content="image\/jpeg"/);
  assert.match(read('tests/integration/shots.mjs'), /og: '1200x630'/);
  for (const f of ['late1', 'late2']) {
    assert.ok(!existsSync(new URL(`../audio/music/${f}.mp3`, import.meta.url)), `${f}.mp3 gone`);
    for (const p of ['data/mood-music.json', 'js/audio/music.js', 'js/audio/mood.js', 'js/audio/party-music.js', 'js/core/city-mood.js']) assert.ok(!read(p).includes(`"${f}"`) && !read(p).includes(`'${f}'`), `${p} names ${f}`);
  }
});
