// CITY PART 2 — GAME VOTES IN A ROOM (core/room-votes.js; rooms/{CODE}/gv/{uid} = { g, at }): the pure tally + the wiring's guards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tallyVotes, voteOrder, nextVote, myVote, newVotes, mostWantedLine, cleanVote } from '../js/core/room-votes.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const P = { h: { name: 'HOST' }, a: { name: 'MAYA' }, b: { name: 'RIO' }, c: { name: 'SAM' } };
const IDS = ['prism', 'jaywalk', 'highrise', 'overclock', 'holdem'];

test('the tally: most votes first, a tie = the EARLIEST vote; the host never counts, a player who left never counts, a non-playable game never counts', () => {
  const gv = { a: { g: 'prism', at: 300 }, b: { g: 'jaywalk', at: 100 }, c: { g: 'prism', at: 200 }, h: { g: 'holdem', at: 50 }, gone: { g: 'jaywalk', at: 10 }, x: { g: 'pulse', at: 5 } };
  const T = tallyVotes(gv, P, 'h', IDS);
  assert.deepEqual(T.rows.map(r => [r.g, r.n, r.voters]), [['prism', 2, ['c', 'a']], ['jaywalk', 1, ['b']]]);
  assert.equal(T.top.g, 'prism'); assert.equal(T.n, 3);
  const tie = tallyVotes({ a: { g: 'prism', at: 300 }, b: { g: 'jaywalk', at: 100 } }, P, 'h', IDS);
  assert.equal(tie.top.g, 'jaywalk', 'a tie = the earliest vote');
  assert.equal(mostWantedLine(T, id => ({ prism: 'Prism Drop' })[id]), 'MOST WANTED · PRISM DROP (2)');
  assert.equal(mostWantedLine(tallyVotes({}, P, 'h', IDS), () => ''), '', 'hidden with no votes');
});

test('a tap: another game moves the vote, the same takes it back; the list puts the voted games on top; the dock counts only the NEW votes', () => {
  assert.equal(nextVote(null, 'prism'), 'prism'); assert.equal(nextVote('prism', 'jaywalk'), 'jaywalk'); assert.equal(nextVote('prism', 'prism'), null);
  assert.equal(myVote({ a: { g: 'prism', at: 1 } }, 'a'), 'prism'); assert.equal(myVote({}, 'a'), null);
  const games = IDS.map(id => ({ id }));
  const T = tallyVotes({ a: { g: 'highrise', at: 5 }, b: { g: 'holdem', at: 3 }, c: { g: 'highrise', at: 9 } }, P, 'h', IDS);
  assert.deepEqual(voteOrder(games, T).map(g => g.id), ['highrise', 'holdem', 'prism', 'jaywalk', 'overclock']);
  assert.equal(newVotes({ a: { g: 'highrise', at: 5 }, b: { g: 'holdem', at: 30 } }, P, 'h', IDS, 10), 1, 'cast after the host looked');
  assert.equal(cleanVote({ g: 'NOPE!', at: 1 }), null); assert.deepEqual(cleanVote('prism'), { g: 'prism', at: 0 });
});

test('the wiring: the room mirrors gv, the start clears it in its OWN write (rules without gv never block a start), a refused vote is the quiet late-vote, the dock + the sheet read the ONE tally', () => {
  const room = read('js/room.js'), host = read('js/host.js'), rc = read('js/screens/room-city.js');
  assert.ok(room.includes("listen('gv', gv => setState({ gv: gv || {} }));"));
  assert.ok(host.includes("update(dbRef(`rooms/${state.code}`), { gv: null })") && !/rv: null, gv: null/.test(host), 'the votes clear in their own write');
  assert.ok(host.indexOf("update(dbRef(`rooms/${state.code}`), { gv: null })") > host.indexOf("'meta/status': 'playing',"), 'AFTER the status write (THE REVIEW: no vote slips in between; a failed start keeps them)');
  assert.ok(room.includes("[`gv/${uid}`]: null"), 'a leaver’s vote goes with them');
  assert.ok(rc.includes("expectRefusal(`rooms/${code()}/gv/${st.uid}`") && rc.includes("'late-vote'"));
  assert.ok(rc.includes('votesOff = true') && rc.includes("if (isHost() || votesOff || !lobbyNow() || goWaiting(st.meta, st.game, serverNow())) { openHelp(g.id); return; }"), 'THE RULES-LAG fallback: a refused vote → HOW TO PLAY as before');
  assert.ok(rc.includes('dock.set({ gamesN: gamesN(),') && read('js/screens/room-dock.js').includes("E.gvN = h('i.rdk-cnt'"));
  const rules = JSON.parse(read('database.rules.json'));
  assert.ok(rules.rules.rooms.$code.gv.$uid['.write'].includes("meta/status').val() === 'lobby'"), 'a vote only in the lobby');
});
