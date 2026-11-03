// CITY CONTROLS B — THE INTERCOM's rules (core/radio-intercom.js): the server's whitelist, the headline, WHEN a phone plays it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanIntercom, cleanHead, headLines, suggestHead, icDecide, icLen, icPublic, canUnsend, IC_AUD, CHIME_S } from '../js/core/radio-intercom.js';
import { knob } from '../js/core/harbor-schedule.js';

const K = knob('radio.intercom');
const clip = n => Buffer.alloc(n, 7).toString('base64');

test('a send: the knob\'s three audiences, a real clip ≤ the cap, a known type, the length bounds', () => {
  assert.deepEqual([...IC_AUD], ['me', 'room', 'everyone']);
  const ok = cleanIntercom({ aud: 'everyone', mime: 'audio/mp4', dur: 12.345, b64: clip(4000), head: 'game night at 8' });
  assert.equal(ok.bad, null); assert.equal(ok.req.head, 'GAME NIGHT AT 8'); assert.equal(ok.req.dur, 12.35); assert.equal(ok.req.wait, true);
  assert.equal(cleanIntercom({ aud: 'everyone', mime: 'audio/webm;codecs=opus', dur: 3, b64: clip(4000), wait: false }).req.wait, false);
  assert.equal(cleanIntercom({ aud: 'city', mime: 'audio/mp4', dur: 3, b64: clip(4000) }).bad, 'bad_audience', 'CITY ONLY is gone');
  assert.equal(cleanIntercom({ aud: 'room', mime: 'audio/mp4', dur: 3, b64: clip(4000) }).bad, 'bad_room');
  assert.equal(cleanIntercom({ aud: 'room', room: 'jazz', mime: 'audio/mp4', dur: 3, b64: clip(4000) }).req.room, 'JAZZ');
  assert.equal(cleanIntercom({ aud: 'me', mime: 'video/mp4', dur: 3, b64: clip(4000) }).bad, 'bad_mime');
  assert.equal(cleanIntercom({ aud: 'me', mime: 'audio/mp4', dur: 0.2, b64: clip(4000) }).bad, 'bad_length');
  assert.equal(cleanIntercom({ aud: 'me', mime: 'audio/mp4', dur: K.maxS + 5, b64: clip(4000) }).bad, 'bad_length');
  assert.equal(cleanIntercom({ aud: 'me', mime: 'audio/mp4', dur: 3, b64: 'not base64!' }).bad, 'bad_clip');
  assert.equal(cleanIntercom({ aud: 'me', mime: 'audio/mp4', dur: 3, b64: clip(K.maxKB * 1024 + 10) }).bad, 'clip_too_big');
});

test('the headline: the radio\'s word rules (≤ 24, the profanity filter, BNAME), two board lines of ≤ 12, a suggestion from the transcript', () => {
  assert.deepEqual(cleanHead(''), { text: '', bad: null });
  assert.equal(cleanHead('x'.repeat(30)).bad, 'long');
  assert.equal(cleanHead('hi dave', { names: ['Dave'] }).bad, 'name');
  assert.equal(cleanIntercom({ aud: 'room', room: 'ABCD', mime: 'audio/mp4', dur: 3, b64: clip(4000), head: 'HI DAVE' }, { names: ['Dave'] }).bad, 'words_name');
  assert.deepEqual(headLines('GAME NIGHT AT 8'), ['GAME NIGHT', 'AT 8']);
  assert.deepEqual(headLines('HAPPY BIRTHDAY'), ['HAPPY', 'BIRTHDAY']);
  for (const t of ['A', 'FIREWORKS TONIGHT AT TEN', 'SUPERCALIFRAGILISTIC']) for (const l of headLines(t)) assert.ok(l.length <= 12, `${t} → ${l}`);
  assert.equal(suggestHead('game night is at eight tonight everybody come'), 'GAME NIGHT IS AT EIGHT');
  assert.ok(suggestHead('hello — world').length <= K.head);
  assert.equal(suggestHead(''), '');
});

test('WHEN a phone plays it: the lobby TOGETHER, the city\'s feed late, a game holds it (WAIT / NO_INTERCOM), a legendary first, UNSEND', () => {
  const at = 1e12, m = icPublic('x1', { at, until: at + icLen(10) * 1000, made: at - 2000, aud: 'everyone', wait: true, dur: 10, mime: 'audio/mp4' });
  assert.equal(icLen(10), CHIME_S * 2 + 0.3 + 10 + 0.35);
  const D = (now, o = {}) => icDecide(m, { now, source: 'room', inGame: false, holdGame: false, busy: false, held: false, ...o });
  assert.equal(D(at - 500), 'wait', 'before its start');
  assert.equal(D(at + 100), 'play', 'a lobby starts it together');
  assert.equal(D(at + 6000), 'skip', 'a lobby phone late by more than a few seconds skips it');
  assert.equal(D(at + 30e3, { source: 'feed' }), 'play', 'the feed arrives ~45 s late — still played');
  assert.equal(D(m.until + (K.late + 5) * 1000, { source: 'feed' }), 'skip');
  assert.equal(D(at + 100, { inGame: true }), 'hold', 'WAIT FOR THE LOBBY: in a game it holds');
  assert.equal(D(at + 20 * 60e3, { held: true }), 'play', 'back in the lobby within the hour: it plays');
  assert.equal(D(at + (K.keep + 10) * 1000, { held: true }), 'skip', 'after the hour: dropped');
  const nw = { ...m, wait: false };
  assert.equal(icDecide(nw, { now: at + 100, source: 'room', inGame: true }), 'play', 'DON\'T WAIT plays over the game');
  assert.equal(icDecide(nw, { now: at + 100, source: 'room', inGame: true, holdGame: true }), 'hold', '...unless the game exports NO_INTERCOM');
  assert.equal(D(at + 100, { busy: true }), 'wait', 'a legendary\'s own audio first');
  assert.equal(icDecide({ ...m, state: 'stopped' }, { now: at + 100, source: 'room' }), 'skip', 'UNSENT');
  assert.ok(canUnsend(m, m.made + 30e3) && !canUnsend(m, m.made + (K.unsend + 1) * 1000), 'UNSEND for its window only');
  assert.ok(!JSON.stringify(m).includes('by'), 'the public copy names nobody');
});

test('THE WHEN (PROGRESSION B add-on): NOW · IN 10 MIN · AT A TIME up to a day; a scheduled clip kept + cancellable until it plays', async () => {
  const { icWhen, IC_IN10_MS, canUnsend: cu, icDecide: dec } = await import('../js/core/radio-intercom.js');
  const { knob } = await import('../js/core/harbor-schedule.js');
  const now = 1e12, K = knob('radio.intercom');
  assert.deepEqual(icWhen({}, now), { at: null, bad: null });
  assert.equal(icWhen({ when: 'in10' }, now).at, now + IC_IN10_MS);
  assert.equal(icWhen({ when: 'at', at: now + 3 * 3600e3 }, now).at, now + 3 * 3600e3);
  assert.equal(icWhen({ when: 'at', at: now - 5000 }, now).bad, 'bad_time');
  assert.equal(icWhen({ when: 'at', at: now + 26 * 3600e3 }, now).bad, 'bad_time');
  const m = { made: now, at: now + 5 * 3600e3, until: now + 5 * 3600e3 + 9000, dur: 3, state: 'q', wait: true };
  assert.equal(cu(m, now + 4 * 3600e3), true, 'cancellable hours later, before it plays');
  assert.equal(cu(m, m.at + (K.unsend + 1) * 1000), false);
  assert.equal(dec(m, { now: now + 2 * 3600e3, source: 'desk' }), 'wait', 'not before its time (and NOT dropped after an hour)');
  assert.equal(dec(m, { now: m.at + 500, source: 'desk' }), 'play', 'then it plays');
  assert.equal(dec(m, { now: m.at + (K.keep + 5) * 1000, source: 'desk', held: true }), 'skip', 'its hour after its own start');
});
