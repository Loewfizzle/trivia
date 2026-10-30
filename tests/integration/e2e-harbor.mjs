// CITY 2.0 — THE HARBOR end to end (docs/harbor.md). Needs the emulators + scripts/serve.mjs --emu.
//   node e2e-harbor.mjs "<browser path>" ./shots-harbor        (env SHOTS=0, CPU=4, GPU=1)
// ?city=2 loads the Harbor with no errors and with every title flag (&when &tz &at &wx &force &speed &grid &debug); a normal
// visit (no flag) gets today's city and never loads a harbor file; the flag is never saved (localStorage, sessionStorage,
// cookies) — a reload without it is today's city; the dock: HOST opens a room, JOIN by typing joins it, a knock on the
// speakeasy's door opens JOIN; frame pacing within the City 2.0 budget at 4× CPU; 20 title ↔ setup cycles leave one city, no
// growing heap and the same offscreen memory; a hidden tab stops rendering. Screens at the six review sizes. THE PREVIEW PANEL
// (JUST ME live + kept for the tab + CLEAR ALL; EVERYONE: city2/live on two phones in sync, a late arrival, until, clear) —
// ONLY=panel runs just that part.
//
// GROUPS (NEON PASS 5 — the suite had grown to ~90 checks and 3 ½ minutes): ONLY=core,flags,skyline,neon,water,harbor,sky,
// party,panel,dock,music,perf (comma-separated) runs those groups in this process. With no ONLY the independent groups run in PARALLEL
// shards (SHARDS=3 child processes, each its own browser — the same checks), then the two that must run alone: panel (it writes
// the shared city2/live node every ?city=2 page listens to) and perf (CPU-throttled timing). SHARDS=1: everything in this process.
// THE CLOUD JOBS (Oct 24): GitHub runs the groups as parallel jobs — JOB=audio|show|city|street runs one job's groups (harbor-jobs.mjs).
// A NEW GROUP goes in exactly one job there (this script refuses to run until it does).
// THE FILES (NIGHT-B Group 0 — the one 4,400-line file split): this file = the entry point + THE RUNNER (the same CLI + env);
// harbor-e2e/kit.mjs = the shared harness (ok / okT / okF, open, waitFor, tap, harborUp…, G() + GROUPS); harbor-e2e/<job>.mjs = each
// cloud job's groups. ADDING A GROUP: G('name', …) in its job's file (harbor-e2e/<job>.mjs) + the name in harbor-jobs.mjs (CI_JOBS).
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CI_JOBS, SERIAL, jobProblems, localShards } from './harbor-jobs.mjs';
import { BROWSER, OUT, log, sleep, checks, errors, warnings, browser, GROUPS, runGroup } from './harbor-e2e/kit.mjs';
// every job's groups (each file registers its G()s on import; jobProblems below needs them all)
import './harbor-e2e/audio.mjs';
import './harbor-e2e/show.mjs';
import './harbor-e2e/city.mjs';
import './harbor-e2e/perf.mjs';
import './harbor-e2e/street.mjs';
import './harbor-e2e/windows.mjs';
import './harbor-e2e/wild.mjs';
import './harbor-e2e/holiday.mjs';

// ================================================================ THE RUNNER: ONLY=… in this process, else parallel shards + the two serial groups
// THE CLOUD JOBS (harbor-jobs.mjs): every group in exactly one job — checked before anything runs, so a new group can't be skipped silently
{ const bad = jobProblems([...GROUPS.keys()]); if (bad.length) { console.error(`THE CLOUD JOBS (tests/integration/harbor-jobs.mjs):\n  ${bad.join('\n  ')}`); process.exit(1); } }
const JOB = process.env.JOB || '';
if (JOB && !CI_JOBS[JOB]) { console.error(`unknown JOB ${JOB} (the cloud jobs: ${Object.keys(CI_JOBS).join(', ')})`); process.exit(1); }
const ONLY = JOB ? CI_JOBS[JOB] : (process.env.ONLY || '').split(',').map(x => x.trim()).filter(Boolean), TAG = process.env.SHARD_TAG || '';
const SHARDS = Number(process.env.SHARDS || 3);
if (ONLY.length) { if (JOB) log(`JOB ${JOB}: ${ONLY.join(', ')}`); for (const g of ONLY) await runGroup(g); }
else if (SHARDS > 1) {
  // (the laptop's parallel run: the independent groups spread over the shards by their measured times — harbor-jobs.mjs#localShards)
  const plan = localShards([...GROUPS.keys()], SHARDS), me = fileURLToPath(import.meta.url);
  await Promise.all(plan.map((groups, i) => new Promise(res => {
    const ch = spawn(process.execPath, [me, BROWSER, OUT], { env: { ...process.env, ONLY: groups.join(','), SHARD_TAG: `s${i + 1}` }, stdio: ['ignore', 'pipe', 'pipe'] });
    const pre = `[s${i + 1}]`;
    for (const st of [ch.stdout, ch.stderr]) { let buf = ''; st.on('data', d => { buf += d; let k; while ((k = buf.indexOf('\n')) >= 0) { console.log(pre, buf.slice(0, k)); buf = buf.slice(k + 1); } }); }
    // ('exit', not 'close': the headless browsers a shard spawned hold its stdout pipe open for a while after it ends)
    ch.on('exit', () => {
      const rf = `${OUT}result-s${i + 1}.json`;
      if (existsSync(rf)) { const r = JSON.parse(readFileSync(rf, 'utf8')); checks.push(...r.checks); errors.push(...r.errors); warnings.push(...(r.warnings || [])); }
      else errors.push(`shard s${i + 1} wrote no result`);
      res();
    });
  })));
  for (const g of SERIAL) await runGroup(g);
} else { for (const g of [...GROUPS.keys()].filter(g => !SERIAL.includes(g)).concat(SERIAL)) await runGroup(g); }
const passed = checks.filter(c => c.ok).length;
log(`checks ${passed}/${checks.length} passed${warnings.length ? ` · warnings ${warnings.length}:\n${warnings.map(w => `  ~ ${w}`).join('\n')}` : ''}`);
log(errors.length ? `errors:\n${errors.join('\n')}` : 'errors none');
writeFileSync(`${OUT}result${TAG ? '-' + TAG : ''}.json`, JSON.stringify({ checks, errors, warnings }, null, 1));
// on GitHub (the top process only): each warning + error as an annotation on the run, and a table in the job's summary page
if (!TAG && process.env.GITHUB_ACTIONS) {
  const esc = t => String(t).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  for (const w of warnings) console.log(`::warning title=e2e-harbor${JOB ? ' · ' + JOB : ''}::${esc(w)}`);
  for (const e of errors) console.log(`::error title=e2e-harbor${JOB ? ' · ' + JOB : ''}::${esc(e)}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const cell = t => String(t).replace(/\|/g, '\|').replace(/\n/g, ' ').slice(0, 400);
    const md = [`### e2e-harbor${JOB ? ` · ${JOB} (${ONLY.join(', ')})` : ''}: ${errors.length ? `❌ ${errors.length} failed` : '✅ passed'} — ${passed}/${checks.length} checks, ${warnings.length} warnings`, ''];
    if (errors.length) md.push('**Failed**', '', ...errors.map(e => `- ${cell(e)}`), '');
    if (warnings.length) md.push('**Warnings** (timing / known-flaky checks: never red on CI — a repeat in two passes is worth a look)', '', '| kind | check |', '| --- | --- |', ...warnings.map(w => { const m = /^\[(\w+)\] (.*)$/s.exec(w); return `| ${m ? m[1] : 'timing'} | ${cell(m ? m[2] : w)} |`; }), '');
    try { writeFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n') + '\n', { flag: 'a' }); } catch { /* the summary is polish */ }
  }
}
if (browser) await Promise.race([browser.close(), sleep(5000)]);
process.exit(errors.length ? 1 : 0);
