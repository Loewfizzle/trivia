// THE HARBOR'S CLOUD JOBS (Oct 24, section 0 m — the owner's CI minutes): the e2e-harbor suite's groups split into PARALLEL GitHub jobs
// (.github/workflows/harbor.yml's matrix), so "Re-run failed jobs" re-runs one job's groups, not the whole suite.
//   JOB=street node e2e-harbor.mjs "<browser>" ./shots-harbor      runs that job's groups in order, in one process (what the cloud runs)
//
// ADDING A GROUP (a new G('…') in e2e-harbor.mjs): put its name in EXACTLY ONE job below — the lightest by SECONDS (and add its
// measured time to SECONDS). Until then e2e-harbor.mjs refuses to run (even with ONLY=…) and tests/harbor-jobs.test.mjs fails in the
// quick `tests` workflow, so a group can never be skipped by the cloud silently. ADDING A JOB: a new key here AND the same name in
// harbor.yml's matrix list (the unit test checks the two match).
//
// SERIAL groups go LAST in their job, in this order: panel writes the shared city2/live node every ?city=2 page listens to (nothing
// may run beside it); perf is CPU-throttled timing (nothing beside it either). Each cloud job has its own emulators, so two jobs never meet.

// each group's measured seconds on GitHub's 2-core machine (run 40085807390, Oct 24; the first ten ran two shards side by side, so
// they're a little slow) — for balancing only
export const SECONDS = {
  core: 27, flags: 7, skyline: 12, water: 27, harbor: 8, speakeasy: 45, promenade: 30,
  neon: 95, dock: 15, sky: 27, party: 66, music: 161, sounds: 51, windows: 45,
  panel: 55, perf: 79,
  people: 70,          // (8P: measured on the laptop — refine from the first cloud run)
  life: 90,            // (FP3b: real doors + the dance circle — a circle forming ~40 s after the page opens)
  load: 30,            // (FP3a: the load gate — measured on the laptop)
  legends: 40,         // (6b: the legendary sky — three pages, a guess)
  workers: 75,         // (8b1: the workers — four pages, measured on the laptop)
  wildlife: 85,        // (8b1: the animals — eight pages incl. the panel rows; 81 s on the laptop)
  tape: 85,            // (Oct 25: THE TAPE STOP — one page, a whole TR-3B in real time + a second run; measured on the laptop)
  motion: 75,          // (PEO, Oct 25: THE PEOPLE'S MOTION — a 12-s trace of an afternoon + the dance circle (a wait for it); measured on the laptop)
  weather: 70,         // (9a: THE WEATHER — fourteen pages, joined at once; 66 s on the laptop)
};

// ~170–200 s of tests each (+ ~1 min of setup) — about 4 min of wall time a job
export const CI_JOBS = {
  audio: ['music', 'flags', 'harbor', 'dock', 'tape'],   // (9a: tape moved here, legends → wild: room for the weather)
  show: ['neon', 'party', 'sky', 'life'],
  city: ['core', 'skyline', 'water', 'load', 'promenade', 'panel', 'perf'],   // (PEO: promenade moved here from street — motion took its room)
  street: ['speakeasy', 'windows', 'sounds', 'people', 'motion'],   // (PEO: motion — the owner asked for it in the street job; promenade → city for the room)
  // (8b1: THE WILDLIFE's own job — every other job was within ~1 min of its 5-min cap; room here for 8b1's other new groups)
  wild: ['wildlife', 'workers', 'legends', 'weather'],   // (9a: the weather + legends; tape → audio)
};

export const SERIAL = ['panel', 'perf'];

/** every registered group in exactly one job, every job's group registered, the serial groups last → a list of problems ([] = fine) */
export function jobProblems(groups, jobs = CI_JOBS) {
  const out = [], all = Object.values(jobs).flat();
  for (const g of groups) {
    const n = all.filter(x => x === g).length;
    if (n === 0) out.push(`group "${g}" is in no cloud job — add it to the lightest job in tests/integration/harbor-jobs.mjs (CI_JOBS)`);
    if (n > 1) out.push(`group "${g}" is in ${n} cloud jobs — keep it in one (tests/integration/harbor-jobs.mjs)`);
  }
  for (const g of new Set(all)) if (!groups.includes(g)) out.push(`cloud job group "${g}" has no G('${g}', …) in e2e-harbor.mjs`);
  for (const [job, list] of Object.entries(jobs)) {
    const firstSerial = list.findIndex(g => SERIAL.includes(g));
    if (firstSerial >= 0 && list.slice(firstSerial).some(g => !SERIAL.includes(g))) out.push(`job "${job}": the serial groups (${SERIAL.join(', ')}) must run last`);
  }
  return out;
}

/** the laptop's parallel run (no ONLY, no JOB): the non-serial groups spread over n shards, heaviest first onto the lightest shard */
export function localShards(groups, n) {
  const shards = Array.from({ length: n }, () => ({ s: 0, list: [] }));
  for (const g of groups.filter(x => !SERIAL.includes(x)).sort((a, b) => (SECONDS[b] || 30) - (SECONDS[a] || 30))) {
    const lightest = shards.reduce((a, b) => (b.s < a.s ? b : a));
    lightest.list.push(g); lightest.s += SECONDS[g] || 30;
  }
  return shards.map(x => x.list).filter(l => l.length);
}
