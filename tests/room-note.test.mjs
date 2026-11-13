// THE ROOM NOTE (the owner's add-on, Nov 13 1:38 pm): the room's one-line pill above the dock — js/core/room-note.js (PURE) + its wiring.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { roomNote, noteHideKey, noteHidden, NOTE_HIDE_KEY } from '../js/core/room-note.js';

const WARN = 10 * 60 * 1000;
const live = (o = {}) => roomNote({ status: 'playing', matchId: 'm1', gameName: 'PRISM DROP', quit: 'm1', left: 50 * 60000, warnMs: WARN, host: false, code: 'GULF', hidden: null, ...o });

test('LIVE: ONE line — "<GAME> IS ON · TAP TO WATCH", with a ×; the "dealt into the next one" words are gone from the pill', () => {
  const n = live();
  assert.deepEqual(n, { kind: 'live', text: 'PRISM DROP IS ON · TAP TO WATCH', close: true });
  assert.ok(!/dealt|\(|—/.test(n.text));
  assert.equal(live({ gameName: '' }).text, 'A GAME IS ON · TAP TO WATCH');
  // only for a match this phone stepped out of (quit = that match) — a phone in the match / a lobby shows nothing
  assert.equal(live({ quit: null }).kind, '');
  assert.equal(live({ quit: 'm0' }).kind, '');
  assert.equal(live({ status: 'lobby' }).kind, '');
});

test('THE ×: keyed per match id — hides THIS match only; the next match brings the note back; a dismissed live note never falls through to the idle one', () => {
  assert.equal(noteHideKey('GULF', 'm1'), 'GULF:m1');
  assert.equal(noteHideKey('GULF', ''), '');
  assert.equal(noteHideKey('', 'm1'), '');
  assert.ok(noteHidden('GULF:m1', 'GULF', 'm1'));
  assert.ok(!noteHidden('GULF:m1', 'GULF', 'm2'));
  assert.ok(!noteHidden('GULF:m1', 'MINT', 'm1'));
  assert.ok(!noteHidden(null, 'GULF', 'm1'));
  assert.equal(live({ hidden: 'GULF:m1' }).kind, '');
  assert.equal(live({ hidden: 'GULF:m1', matchId: 'm2', quit: 'm2' }).kind, 'live');
  assert.equal(live({ hidden: 'GULF:m1', left: 60000 }).kind, '');
  assert.equal(NOTE_HIDE_KEY, 'nd:note-x');
});

test('IDLE: one line, NO × (the host must see it) — the host is offered KEEP OPEN, a guest is told a game keeps it open', () => {
  const idle = o => roomNote({ status: 'lobby', matchId: 'm1', quit: null, left: 8 * 60000, warnMs: WARN, code: 'GULF', ...o });
  assert.deepEqual(idle({ host: true }), { kind: 'idle', text: 'ROOM CLOSES IN 8 MIN · TAP TO KEEP IT OPEN', close: false });
  assert.deepEqual(idle({ host: false }), { kind: 'idle', text: 'ROOM CLOSES IN 8 MIN · A GAME KEEPS IT OPEN', close: false });
  assert.equal(idle({ left: 1000 }).text.startsWith('ROOM CLOSES IN 1 MIN'), true);
  assert.equal(idle({ left: -5000 }).text.startsWith('ROOM CLOSES IN 1 MIN'), true);
  assert.equal(idle({ left: WARN + 1 }).kind, '');
  assert.equal(idle({ left: Infinity }).kind, '');
  assert.equal(idle({ hidden: 'GULF:m1', host: true }).kind, 'idle');   // (a × on a match never hides the idle close)
  assert.equal(roomNote(null).kind, '');
});

test('the wiring: room-city draws its OWN pill (the title .nd-note steps aside in a room), taps through the dock\'s pressTap, repaints after a tap, the × stores per match', () => {
  const rc = readFileSync(new URL('../js/screens/room-city.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/title.css', import.meta.url), 'utf8');
  assert.match(rc, /from '\.\.\/core\/room-note\.js'/);
  assert.ok(!/querySelector\('\.nd-note'\)/.test(rc), 'room-city no longer writes the title note');
  assert.match(rc, /dock\.pressTap/);
  assert.ok(!/import \{[^}]*pressTap[^}]*\} from '\.\.\/ui\/tapwatch\.js'/.test(rc), 'THE STALE-MODULE RULE: pressTap through the dock, never a new import');
  assert.match(rc, /afterTap\(paintNotesNow\)/);
  assert.match(rc, /localStorage\.setItem\(NOTE_HIDE_KEY/);
  assert.match(rc, /try \{ return localStorage\.getItem\(NOTE_HIDE_KEY\)/);
  assert.match(rc, /You’re dealt into the next one\./);
  assert.match(css, /\.nd\.is-room \.nd-note \{ display: none !important; \}/);
  assert.match(css, /\.rc-note-t \{[^}]*white-space: nowrap/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{ \.rc-note/);
});
