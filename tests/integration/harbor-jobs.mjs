// THE HARBOR'S CLOUD JOBS (Oct 24, section 0 m — the owner's CI minutes): the e2e-harbor suite's groups split into PARALLEL GitHub jobs
// (.github/workflows/harbor.yml's matrix), so "Re-run failed jobs" re-runs one job's groups, not the whole suite.
//   JOB=street node e2e-harbor.mjs "<browser>" ./shots-harbor      runs that job's groups in order, in one process (what the cloud runs)
//
// ADDING A GROUP (a new G('…') in its job's file, harbor-e2e/<job>.mjs — NIGHT-B Group 0 split e2e-harbor.mjs into the entry + runner,
// harbor-e2e/kit.mjs and one file per job below): put its name in EXACTLY ONE job below — the lightest by SECONDS (and add its
// measured time to SECONDS). Until then e2e-harbor.mjs refuses to run (even with ONLY=…) and tests/harbor-jobs.test.mjs fails in the
// quick `tests` workflow, so a group can never be skipped by the cloud silently. ADDING A JOB: a new key here AND the same name in
// harbor.yml's matrix list (the unit test checks the two match).
//
// SERIAL groups go LAST in their job, in this order: panel writes the shared city2/live node every ?city=2 page listens to (nothing
// may run beside it); perf is CPU-throttled timing (nothing beside it either). Each cloud job has its own emulators, so two jobs never meet.

// each group's measured seconds on GitHub's 2-core machine — for balancing only. PERF-A (Nov 1) refreshed every row from the cloud's own
// per-group seconds (FR5 D1: harbor run 41269772550, PART 10's final; the old Oct 24 guesses under-read the suite 1.39× — legends 3.4×,
// workers 3.1×, windows 2.7× — so the local shards were 1,299 / 1,277 / 813 s apart) + the missing fireworks row. A NEW GROUP: its first
// cloud run's seconds here (the job log prints each group's time).
export const SECONDS = {
  windows: 300, perf: 200, workers: 229, music: 207, legends: 189, weather: 183, holiday: 174, people: 161, neon: 159, heli: 141,
  panel: 126, freeze: 120, snow: 98, panelrows: 97, boxer: 83, party: 75, sounds: 72, tower: 68, motion: 66, tape: 58, partysync: 57,
  load: 51, core: 46, life: 45, thanks: 45, streetparty: 40, wildlife: 39, quietbuilding: 39, promenade: 35, light: 35, mothman: 30,
  speakeasy: 30, fireworks: 30, stations: 29, blackbird: 27, bench: 25, roofcrisp: 25, blackout: 25, dock: 23, sky: 18, water: 18,
  citylife: 14, doors: 14, skyline: 8, speaker: 8, flags: 5, harbor: 4,
};

// 151–583 s of tests each by the cloud's own seconds (+ ~25 s of setup). PERF-B: windows 446 → ~300 (its pages 3 at a time — 280 s on the
// mini PC; refresh from this run's log), perf 270 → ~200 (the warnings-only pacing loop skipped on CI)
export const CI_JOBS = {
  audio: ['music', 'harbor', 'dock', 'tape', 'roofcrisp'],   // (NIGHT-C: roofcrisp — three pages at 3×; flags → perf for the room)   // (9a: tape moved here, legends → wild: room for the weather)
  show: ['neon', 'party', 'sky', 'life', 'quietbuilding'],   // (NIGHT-C: quietbuilding — the lightest)
  city: ['core', 'skyline', 'water', 'load', 'promenade', 'light', 'streetparty', 'panel'],   // (NIGHT-B: streetparty)   // (NIGHT-A: light — the lightest job)
  // (HOTFIX Oct 29: THE BASELINE GUARD put perf at ~140 s — every job was within ~25 s of its cap: perf + tower got their own job)
  perf: ['tower', 'partysync', 'flags', 'perf'],   // (SKY-B: heli → legend: its circle page)   // (NIGHT-C: partysync + heli + flags — before the serial perf)
  // (city's history: 9e — tower before the serial pair (now in perf); PEO — promenade moved here from street, motion took its room)
  street: ['speakeasy', 'sounds', 'people', 'motion', 'freeze'],   // (HOTFIX Oct 27: freeze — the lightest job)   // (PEO: motion — the owner asked for it in the street job; promenade → city for the room; WIN3: windows → its own job)
  // (WIN3: THE WINDOWS' own job — the boss's room, the quiet nights, the cash, the window party pushed the group to ~165 s)
  windows: ['windows', 'snow', 'doors', 'blackout'],   // (9d: doors)   // (9b: WINTER — the lightest job by its seconds)
  // (8b1: THE WILDLIFE's own job — every other job was within ~1 min of its 5-min cap; room here for 8b1's other new groups)
  wild: ['wildlife', 'workers', 'weather', 'stations'],   // (SKY-B: + the radio stations — the lightest job)
  // (SKY-A: THE LEGENDS' own job — the TR-3B + the F-22s, THE BLACKBIRD, the phone bench: wild was at its cap)
  legend: ['legends', 'blackbird', 'bench', 'heli'],   // (SKY-B: + the patrol's circle (heli, ~90 s) + the shadowboxer)
  models: ['mothman', 'boxer', 'speaker', 'fireworks'],   // (PART 10: the fireworks — the models job had the room)   // (THE MODELS PASS: a 10th job — every other job sat at its ~5-min cap: the Mothman + the shadowboxer's room)
  // (11a-1: THE HOLIDAYS' own job — every other job was within ~30 s of its cap; room for 11a-2 THANKSGIVING + 11b next)
  holiday: ['holiday', 'thanks', 'panelrows', 'citylife'],   // (9e: citylife — the lightest job)   // (9a: the weather + legends; tape → audio; WIN3: the panel's window rows — the lightest job)
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
  for (const g of new Set(all)) if (!groups.includes(g)) out.push(`cloud job group "${g}" has no G('${g}', …) in tests/integration/harbor-e2e/`);
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
