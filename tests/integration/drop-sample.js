// THE DROP B add-on (Ben, Nov 13 10:23 pm — "the day DROP card preview looked broken": it drew hand-made sample data) — A REAL FINISHED RUN for the
// share-card previews (daily-preview.html, share-same.html): THE DROP's own engine (js/games/prism/drop.js) on a seed, the test bot (bot.js#dropKey)
// playing it at a human pace until it TOPS OUT (or THE END at 8:00), then the log REPLAYED through drop.js#replay exactly as the server's finish
// does (api/_lib/drop.js) → the card's inputs from the replay (share.js#dropInputs — the junk rows solid): the board stacked to the top, the junk
// at the BOTTOM where it rises from, the time + the lines that run's. PURE (no DOM) — node or a page. Deterministic: the same seed = the same run.
import { createDropRun, input, stepTo, replay, tickTime, scoreOf, ticksOf } from '../../js/games/prism/drop.js';
import { boardString } from '../../js/games/prism/engine.js';
import { dropKey } from '../../js/games/prism/bot.js';
import { rngFrom } from '../../js/core/rng.js';
import { dropInputs } from '../../js/games/drop/share.js';

/** play `seed` to its top-out: a key every `everyMs`, the bot's `skill` (1 = its best) → { inputs, score, t, ln, k, log, over, why, raw } */
export function sampleDropRun(seed = '20261108', { everyMs = 150, skill = 1, day = 'd20261108' } = {}) {   // (the default: a 2:38.8 run, 101 lines — topped out)
  const run = createDropRun(String(seed));
  const rnd = rngFrom(`drop-sample:${seed}`);
  const every = Math.max(1, ticksOf(everyMs));
  let plan = null, next = 0;
  for (let k = 0; !run.over && k < 60 * 8 * 120 + 10; k += 2) {
    stepTo(run, k);
    if (run.over) break;
    if (k >= next) { next = k + every; const r = dropKey(run.eng, plan, { skill, rnd }); plan = r.plan; if (r.code) input(run, r.code); }
  }
  // the server's own check: the WHOLE log replayed from the seed to the run's last tick (a top-out must be over there)
  const R = replay(run.log, String(seed), { to: run.k, final: run.over });
  if (!R.ok) throw new Error(`the sample run didn't replay: ${R.refused}`);
  const t = tickTime(R.k), ln = R.lines;
  return { inputs: dropInputs({ t, ln, b: boardString(R.run.eng, 20), day }), score: scoreOf(t, ln), t, ln, k: R.k, log: run.log, over: R.over, why: R.why, raw: boardString(R.run.eng, 20) };
}
