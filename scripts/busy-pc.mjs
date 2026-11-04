// THE BUSY-PC CHECK (LOBBY 2.0 A — the owner, Nov 3 8:49 pm): before EVERY FULL local test run, measure the machine's real LOAD — the CPU
// over ~30 s — not whether a program (Grok's browser bot) is merely open. An idle window = carry on; a genuinely busy machine = ping Ben
// "Pause Grok — the full test run is next" and wait for his go. A failure that only happened on a busy PC is a load problem, not a flake
// to patch (docs/testing.md "THE BUSY-PC CHECK").
//   node scripts/busy-pc.mjs [seconds=30] [--limit 30]   → prints the average + peak busy %, the busiest processes (Windows); exit 0 = quiet,
//   exit 2 = BUSY (average above the limit, % of all cores)
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const secs = Number(args.find(a => /^\d+$/.test(a)) || 30);
const li = args.indexOf('--limit'), LIMIT = li >= 0 ? Number(args[li + 1]) : 30;
const snap = () => os.cpus().map(c => { const t = c.times; return { idle: t.idle, total: t.user + t.nice + t.sys + t.idle + t.irq }; });
const busyOf = (a, b) => { let idle = 0, total = 0; for (let i = 0; i < a.length; i++) { idle += b[i].idle - a[i].idle; total += b[i].total - a[i].total; } return total > 0 ? 100 * (1 - idle / total) : 0; };

const samples = [];
let prev = snap();
for (let i = 0; i < secs; i++) {
  await new Promise(r => setTimeout(r, 1000));
  const cur = snap(); samples.push(busyOf(prev, cur)); prev = cur;
}
const avg = samples.reduce((a, b) => a + b, 0) / samples.length, peak = Math.max(...samples);
let top = '';
if (process.platform === 'win32') {
  try {
    // (the busiest processes right now — a hint at WHAT is busy; % of all cores over a 1-s sample)
    top = execFileSync('powershell.exe', ['-NoProfile', '-Command',
      "Get-Counter '\\Process(*)\\% Processor Time' -SampleInterval 1 -MaxSamples 1 | % { $_.CounterSamples } | ? { $_.InstanceName -notin @('_total','idle') } | sort CookedValue -Descending | select -First 5 | % { '{0} {1:N0}%' -f $_.InstanceName, ($_.CookedValue / [Environment]::ProcessorCount) }"],
    { encoding: 'utf8', timeout: 15000 }).trim().split(/\r?\n/).join(' · ');
  } catch { top = ''; }
}
const busy = avg > LIMIT;
console.log(`THE BUSY-PC CHECK: ${secs} s on ${os.cpus().length} threads — average ${avg.toFixed(1)} % busy, peak ${peak.toFixed(1)} % (limit ${LIMIT} %) → ${busy ? 'BUSY — pause the other work (Grok?) before the full run' : 'quiet — carry on'}${top ? `\n  busiest now: ${top}` : ''}`);
process.exit(busy ? 2 : 0);
