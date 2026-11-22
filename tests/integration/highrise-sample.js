// HIGH RISE DAILY B — a REAL daily run for the previews (never hand-made data): HIGH RISE's engine in its daily mode on a seed, the house bot
// tapping (js/games/highrise/bot.js#gaussBot), stopped at `floors` — then the SERVER's own share inputs from that log (held.js#shareOf: the
// floors, the perfects, each floor's slab width + centre + perfect mark) and the day's score (held.js#hrScore). Used by daily-preview.html
// (&hr=…) + the share checks.
import { createRun, tap, stepTo, isOver } from '/js/games/highrise/engine.js';
import { gaussBot } from '/js/games/highrise/bot.js';
import { shareOf, hrScore } from '/js/games/highrise/held.js';

export function sampleHrRun(seed = 'h20261121', floors = 84, sigmaMs = 14) {
  const run = createRun({ seed, mode: 'daily' }), bot = gaussBot({ sigmaMs, seed });
  const events = [];
  let guard = 0;
  while (!isOver(run) && run.floor < floors && guard++ < 2000) {
    stepTo(run, run.s0);
    if (run.st !== 'slide') break;
    const t = bot(run);
    if (!tap(run, t)) break;
    events.push(t);
  }
  const inputs = shareOf(seed, events);
  return { events, inputs: { ...inputs, day: 'd20261121', nb: 0 }, score: hrScore(inputs.f, inputs.p, events.length ? events[events.length - 1] : 0) };
}
