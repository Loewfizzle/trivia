// Room chat rules: lock states per game, profanity masking (whole words only), text cleanup, helpers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chatLocked, maskProfanity, cleanText, relTime, typingLine, typists, unreadCount, continues, MAX_LEN } from '../js/chat/logic.js';

const P = { me: true, you: true };

test('chat is locked only during your own active play', () => {
  assert.equal(chatLocked(null, 'me', null), false, 'lobby');
  // spectators (late joiners) chat any time
  assert.equal(chatLocked({ id: 'cipher', phase: 'play', participants: { you: true } }, 'me', {}), false);
  // CIPHER: guessing locks; solved / out of guesses unlocks; breaks are open
  assert.equal(chatLocked({ id: 'cipher', phase: 'play', participants: P }, 'me', { boards: {} }), true);
  assert.equal(chatLocked({ id: 'cipher', phase: 'play', participants: P }, 'me', null), true, 'unknown progress = locked');
  assert.equal(chatLocked({ id: 'cipher', phase: 'play', participants: P }, 'me', { boards: { me: { solved: true } } }), false);
  assert.equal(chatLocked({ id: 'cipher', phase: 'play', participants: P }, 'me', { boards: { me: { done: true } } }), false);
  for (const phase of ['intro', 'reveal', 'standings', 'final']) assert.equal(chatLocked({ id: 'cipher', phase, participants: P }, 'me', {}), false, phase);
  // LAST SIGNAL: answering locks; eliminated players chat any time
  assert.equal(chatLocked({ id: 'signal', phase: 'question', participants: P }, 'me', {}), true);
  assert.equal(chatLocked({ id: 'signal', phase: 'reveal', participants: P }, 'me', {}), false);
  assert.equal(chatLocked({ id: 'signal', phase: 'question', participants: P, out: { me: 4 } }, 'me', {}), false);
  // OVERCLOCK
  assert.equal(chatLocked({ id: 'overclock', phase: 'play', participants: P }, 'me', { boards: {} }), true);
  assert.equal(chatLocked({ id: 'overclock', phase: 'play', participants: P }, 'me', { boards: { me: { done: true } } }), false);
  assert.equal(chatLocked({ id: 'overclock', phase: 'standings', participants: P }, 'me', {}), false);
  // NEURAL BLUFF
  for (const [phase, locked] of [['intro', false], ['write', true], ['vote', true], ['reveal', false], ['standings', false], ['final', false]]) {
    assert.equal(chatLocked({ id: 'bluff', phase, participants: P }, 'me', {}), locked, `bluff ${phase}`);
  }
  // PULSE
  for (const [phase, locked] of [['load', false], ['song', true], ['echo', true], ['standings', false], ['final', false]]) {
    assert.equal(chatLocked({ id: 'pulse', phase, participants: P }, 'me', {}), locked, `pulse ${phase}`);
  }
  // NEON PAR: still playing the hole locks; holed out (this hole) unlocks; scorecard open
  const golf = { id: 'golf', phase: 'play', hi: 2, participants: P };
  assert.equal(chatLocked(golf, 'me', { nodes: { me: { h: 2, s: 1 } } }), true);
  assert.equal(chatLocked(golf, 'me', { nodes: { me: { h: 2, s: 3, f: 3 } } }), false);
  assert.equal(chatLocked(golf, 'me', { nodes: { me: { h: 1, s: 3, f: 3 } } }), true, 'last hole’s score doesn’t count');
  assert.equal(chatLocked({ ...golf, phase: 'card' }, 'me', {}), false);
});

test('profanity is masked as whole words only', () => {
  assert.equal(maskProfanity('what the fuck'), 'what the f***');
  assert.equal(maskProfanity('FUCKING hell, shit!'), 'F****** hell, s***!');
  assert.equal(maskProfanity('you absolute bastard'), 'you absolute b******');
  assert.equal(maskProfanity('dumbass move'), 'd****** move');
  for (const ok of ['Scunthorpe', 'assassin', 'class', 'classic', 'passage', 'cocktail', 'Dickens', 'therapist', 'grass', 'bass', 'shitake', 'Matsushita', 'cockpit', 'pushit', 'analysis', 'hello']) {
    assert.equal(maskProfanity(`${ok} ok`), `${ok} ok`, ok);
  }
  assert.equal(maskProfanity('emoji 🔥 fuck 🔥'), 'emoji 🔥 f*** 🔥');
});

test('text cleanup + helpers', () => {
  assert.equal(cleanText('  hi\n\tthere  '), 'hi there');
  assert.equal(cleanText('a‮b'), 'a b');
  assert.equal(cleanText('x'.repeat(400)).length, MAX_LEN);
  assert.equal(cleanText('   '), '');
  assert.equal(relTime(10_000), 'now');
  assert.equal(relTime(5 * 60_000), '5m');
  assert.equal(relTime(3 * 3600_000), '3h');
  assert.equal(typingLine([]), '');
  assert.equal(typingLine(['MIKE']), 'MIKE is typing…');
  assert.equal(typingLine(['MIKE', 'ANA']), 'MIKE and ANA are typing…');
  assert.equal(typingLine(['A', 'B', 'C']), '3 people are typing…');
  assert.deepEqual(typists({ a: 10_000, me: 10_000, b: 1_000, c: 'x' }, 'me', 12_000), ['a']);
  const msgs = [{ u: 'a', at: 5 }, { u: 'me', at: 6 }, { s: 'join', at: 7 }, { u: 'b', at: 8 }];
  assert.equal(unreadCount(msgs, 'me', 0), 2);
  assert.equal(unreadCount(msgs, 'me', 5), 1);
  assert.equal(continues({ u: 'a', at: 0 }, { u: 'a', at: 60_000 }), true);
  assert.equal(continues({ u: 'a', at: 0 }, { u: 'a', at: 400_000 }), false);
  assert.equal(continues({ u: 'a', at: 0 }, { u: 'b', at: 1 }), false);
});
