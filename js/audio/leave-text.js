// FIXES R3 — THE AUDIO LEAVE row's text (PURE; loaded only when a row is sent — out of the boot's bytes). docs/audio.md "FIXES R3".
import { LEAVE_MODES, leaveModeOf } from './leave-report.js';

const f3 = v => (v == null ? '?' : (+v).toFixed(3));
/** what was sounding (engine.js#soundingNow) → one line */
export function soundingLine(o = {}) {
  const parts = [`ctx ${o.ctx || '?'}`, `master ${f3(o.master)}`, `effects bus ${f3(o.fx)}`, `music bus ${f3(o.music)}`, `beds ${o.beds ?? '?'}`,
    `idle-asleep ${o.idle ? 'yes' : 'no'}`, `music resting ${o.rest ? 'yes' : 'no'}`, `hushed ${o.hushed ? 'yes' : 'no'}`];
  for (const [k, v] of Object.entries(o)) if (!['ctx', 'master', 'fx', 'music', 'beds', 'idle', 'rest', 'hushed'].includes(k)) parts.push(`${k}: ${v}`);
  return parts.join(' · ');
}
/** PURE (tests): a recorded leave → the AUDIO LEAVE row's text */
export function leaveReportText(e) {
  const m = leaveModeOf(e.mode), sig = Array.isArray(e.sig) ? e.sig : [];
  const order = sig.map((x, i) => (i ? `${x.s} +${x.ms} ms` : x.s)).join(' → ') || 'no signal';
  const back = e.back ? `back after ${(e.back.ms / 1000).toFixed(1)} s (${e.back.why} · ctx ${e.back.st})` : 'NEVER CAME BACK (frozen or killed — sent at the next load)';
  const head = `AUDIO LEAVE · mode ${m} (${LEAVE_MODES[m].name}) · ${order} · ${back}`;
  const first = `at the first signal: ${soundingLine(e.first)} · session ${e.session || 'n/a'} · ${e.vis || '?'} · ${e.dev || ''}`;
  const each = `signals: ${sig.map(x => `${x.s} +${x.ms} (ctx ${x.st}, m ${f3(x.m)})`).join(' · ')}`;
  return `${head}\n${first}\n${each}`.slice(0, 1500);
}
