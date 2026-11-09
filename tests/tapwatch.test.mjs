// CITY FIXES — THE TAP WATCH (js/ui/tapwatch.js) + the lost taps' shared-layer fixes: the pure parts, the hover rule, the leaving layers,
// the server's LOST TAP kind (its own buckets, kept per kind).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mayReport, cleanTap, RESCUE_MS } from '../js/ui/tapwatch.js';
import { groupReports } from '../js/admin/groups.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');

test('the watch reports ≤ 1 a minute + ≤ 20 a day per device', () => {
  const t0 = Date.parse('2026-11-08T20:00:00Z');
  let r = mayReport(null, t0);
  assert.equal(r.ok, true);
  assert.equal(mayReport(r.mem, t0 + 30_000).ok, false, 'a second inside the minute');
  let mem = r.mem, sent = 1;
  for (let i = 1; i < 40; i++) { const x = mayReport(mem, t0 + i * 61_000); if (x.ok) sent++; mem = x.mem; }
  assert.equal(sent, 20, 'twenty a day at most');
  assert.equal(mayReport(mem, t0 + 86_400_000).ok, true, 'a new day');
  assert.ok(RESCUE_MS <= 500, 'the rescue comes inside the brief\'s 500 ms');
});

test('a clean tap: short, still, on the same control, nothing cancelled it, never a game\'s own pad', () => {
  const p = { dur: 90, travel: 2, sameAtUp: true };
  assert.equal(cleanTap(p), true);
  assert.equal(cleanTap({ ...p, dur: 900 }), false, 'a long-press');
  assert.equal(cleanTap({ ...p, travel: 30 }), false, 'a scroll / a slide');
  assert.equal(cleanTap({ ...p, cancelled: true }), false, 'pointercancel');
  assert.equal(cleanTap({ ...p, prevented: true }), false, 'the page cancelled the click itself (touchend preventDefault)');
  assert.equal(cleanTap({ ...p, own: true }), false, '[data-tap-own]');
  assert.equal(cleanTap({ ...p, game: true }), false, 'a game is on (its pads act on their own pointer events)');
  assert.equal(cleanTap({ ...p, sameAtUp: false }), false, 'lifted on another control');
});

// every CSS file the site ships
const cssFiles = () => {
  const out = [];
  const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.css')) out.push(p); } };
  walk(path.join(ROOT, 'css'));
  for (const f of ['js/vault', 'js/games']) { const d = path.join(ROOT, f); if (fs.existsSync(d)) walk(d); }
  return out;
};
/** every rule's selector with the @media prelude(s) it sits in */
function rules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [], stack = [];
  let buf = '';
  for (const ch of css) {
    if (ch === '{') { stack.push(buf.trim()); buf = ''; }
    else if (ch === '}') { const sel = stack.pop(); if (sel != null && !sel.startsWith('@')) out.push({ sel, media: stack.filter(s => s.startsWith('@')).join(' ') }); buf = ''; }
    else if (ch === ';' && !stack.length) buf = '';
    else buf += ch;
  }
  return out;
}

test('suspect 2 — every :hover rule sits behind @media (hover: hover) (iOS spends a first tap on a hover)', () => {
  const stray = [];
  for (const f of cssFiles()) for (const r of rules(fs.readFileSync(f, 'utf8'))) {
    if (r.sel.includes(':hover') && !/hover:\s*hover/.test(r.media)) stray.push(`${path.relative(ROOT, f)}: ${r.sel.slice(0, 80)}`);
  }
  assert.deepEqual(stray, [], `hover rules outside @media (hover: hover):\n${stray.join('\n')}`);
});

test('suspect 3 — a pop-up on its way out never catches a tap (the closing sheet + the others in the list)', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css/components.css'), 'utf8');
  const m = /([^{}]*\.sh\.is-out[^{}]*)\{\s*pointer-events:\s*none\s*!important;\s*\}/.exec(css);
  assert.ok(m, 'the leaving list in components.css');
  for (const sel of ['.sh.is-out', '.screen-out', '.sg-modal.is-out', '.fr-wait.is-out', '.rc-hostcard.is-out', '.pg-sc.is-out', '.mh-hint.is-out', '.vl-dress:not(.is-in)', '.rd-modal:not(.is-in)', '.dy-banner']) {
    assert.ok(m[1].includes(sel), `${sel} in the leaving list`);
  }
  // the message bar takes no taps (only its ×)
  assert.match(css, /\.sh-msgs \{[^}]*pointer-events: none/);
});

test('suspect 1 — the shared repainters wait for a tap in progress (afterTap) and patch in place', () => {
  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  assert.match(read('js/screens/harbor/radio.js'), /function render\(\) \{ afterTap\(renderNow\); \}/, 'the radio desk');
  assert.match(read('js/screens/harbor/radio.js'), /function paintLive\(\) \{ afterTap\(paintLiveNow\); \}/, 'the radio\'s live paint');
  assert.match(read('js/screens/room-guests.js'), /update: \(\) => afterTap\(paint\)/, 'the guest list');
  assert.match(read('js/screens/room-guests.js'), /lockRow\.dataset\.sig !== lockSig/, 'LOCK THE DOOR only rebuilt on a change');
  assert.match(read('js/profile/friends-ui.js'), /r === shown && wrap\.firstChild\) return/, 'ADD FRIEND only rebuilt on a change');
  assert.match(read('js/screens/title-dock.js'), /function setDaily\(d\) \{ afterTap\(/, 'the dock\'s DAILY slot (it shifts the icons)');
  assert.match(read('js/vault/dress.js'), /tapHandled\(\); onTap\(\)/, 'CUSTOMIZE\'s tiles say they took the press');
  // the watch is installed at boot on both entries
  assert.match(read('js/app.js'), /installTapWatch\(/);
  assert.match(read('js/board/public.js'), /installTapWatch\(/);
});

test('/admin groups THE TAP WATCH’s reports as LOST TAP (the server half — its buckets + the per-kind keep: tests/integration/server.test.mjs)', () => {
  const g = groupReports([{ id: 'a', kind: 'lost', at: 1 }, { id: 'b', kind: 'hang', at: 2 }]);
  assert.deepEqual(g.map(x => x.title).sort(), ['HANG', 'LOST TAP']);
});
