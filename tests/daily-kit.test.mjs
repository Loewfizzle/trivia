// THE DAILY KIT (DM1 — js/daily/: FABLE REVIEW #1, 10): the pieces THE PASSWORD + COAST CLEAR shared by copy are ONE now — the clock, the
// judge, the finish + its retries, the countdown, the end screen's SHARE block, the share card's frame + sender, the look's music. The pure
// parts here; the games' behaviour unchanged = their E2E (e2e-password, e2e-coastclear).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { msToTurn, fmtCountdown, runDayKey } from '../js/daily/clock.js';
import * as PW from '../js/games/password/logic.js';
import * as CC from '../js/games/coastclear/logic.js';

const src = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('the clock: the next 4 am Eastern, h:mm:ss, the run\'s own day — both games read the kit\'s', () => {
  assert.equal(msToTurn({ h: 3, mi: 59, s: 59 }, 0), 1000);
  assert.equal(msToTurn({ h: 4, mi: 0, s: 0 }, 0), 86400e3, 'at the turn: a whole day to the next');
  assert.equal(msToTurn({ h: 20, mi: 0, s: 0 }, 250), 8 * 3600e3 - 250);
  assert.equal(fmtCountdown(13 * 3600e3 + 39 * 60e3 + 21e3), '13:39:21');
  assert.equal(fmtCountdown(500), '0:00:01', 'rounds up (never shows 0 before the turn)');
  assert.equal(runDayKey('d20261108', 0, 0), 'd20261108');
  assert.equal(runDayKey(null, Date.UTC(2026, 10, 9, 8, 30), 0), 'd20261108', 'before 4 am Eastern: the day before');
  assert.equal(PW.msToTurn, msToTurn); assert.equal(CC.msToTurn, msToTurn);
  assert.equal(PW.fmtClock, fmtCountdown, 'THE PASSWORD\'s countdown = the kit\'s'); assert.equal(CC.fmtCountdown, fmtCountdown);
});

test('the finish is recorded with retries (a lost signal), never past a refusal; nothing after the view is gone', async () => {
  const { recordFinish, retryable } = await import('../js/daily/end.js').catch(() => ({}));
  if (!recordFinish) return;   // (the DOM kit imports ui/dom.js — fine in node; guarded in case)
  let n = 0;
  const waits = [];
  const ok = await recordFinish(async () => { if (++n < 3) { const e = new Error('x'); e.status = 0; throw e; } return { score: 7 }; }, { wait: async ms => { waits.push(ms); } });
  assert.deepEqual([ok.ok, ok.resp.score, n, waits], [true, 7, 3, [800, 1600]]);
  n = 0;
  const no = await recordFinish(async () => { n++; const e = new Error('refused'); e.status = 422; throw e; }, { wait: async () => {} });
  assert.deepEqual([no.ok, n], [false, 1], 'a refusal is final');
  n = 0;
  const gone = await recordFinish(async () => { n++; return 1; }, { wait: async () => {}, alive: () => false });
  assert.deepEqual([gone.ok, n], [false, 0]);
  assert.equal(retryable({ status: 503 }), true); assert.equal(retryable({ status: 409 }), false); assert.equal(retryable({ code: 'offline' }), true);
});

test('ONE copy: neither game keeps its own judge plumbing, retries, countdown, share sender or look music', () => {
  for (const g of ['password', 'coastclear']) {
    const view = src(`js/games/${g}/view.js`), judge = src(`js/games/${g}/judge.js`), share = src(`js/games/${g}/share.js`), index = src(`js/games/${g}/index.js`);
    assert.match(judge, /createDailyJudge\(/, `${g}: the kit's judge`);
    assert.doesNotMatch(judge, /runDay\(|api\('daily'/, `${g}: no judge plumbing of its own`);
    assert.doesNotMatch(view, /const retryable|NOT RECORDED · NO SIGNAL|easternParts|setInterval\(\(\) => \{ if \(gone\) clearInterval\(clockT\)/, `${g}: no retries / countdown of its own`);
    assert.match(view, /recordFinish\(/); assert.match(view, /tickTurn\(/); assert.match(view, /endActions\(/); assert.match(view, /shareOrLine\(/);
    assert.doesNotMatch(share, /\.toBlob\(|navigator\.share\(|createLinearGradient\(0, 0, 0, H\)/,`${g}: the kit sends + frames the card`);
    assert.match(share, /sendShare\(/); assert.match(share, /shareFrame\(/); assert.match(share, /shareFoot\(/);
    assert.match(index, /lookMusic as musicFor/);
  }
});
