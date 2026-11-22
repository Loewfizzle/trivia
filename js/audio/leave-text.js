// FIXES R3 — THE AUDIO LEAVE row's text (PURE; loaded only when a row is sent — out of the boot's bytes). docs/audio.md "FIXES R3" + CITY G
// (the modes gone: the row names the SESSION the state chose + "media after" — every media element after the cut).
const f3 = v => (v == null ? '?' : (+v).toFixed(3));
/** what was sounding (engine.js#soundingNow) → one line */
export function soundingLine(o = {}) {
  const parts = [`ctx ${o.ctx || '?'}`, `master ${f3(o.master)}`, `effects bus ${f3(o.fx)}`, `music bus ${f3(o.music)}`, `beds ${o.beds ?? '?'}`, `hushed ${o.hushed ? 'yes' : 'no'}`];
  for (const [k, v] of Object.entries(o)) if (!['ctx', 'master', 'fx', 'music', 'beds', 'hushed', 'napping'].includes(k)) parts.push(`${k}: ${v}`);
  return parts.join(' · ');
}
/** PURE (tests): a recorded leave → the AUDIO LEAVE row's text */
export function leaveReportText(e) {
  const sig = Array.isArray(e.sig) ? e.sig : [];
  const order = sig.filter(x => !/^media after|^cut:/.test(x.s)).map((x, i) => (i ? `${x.s} +${x.ms} ms` : x.s)).join(' → ') || 'no signal';
  const back = e.back ? `back after ${(e.back.ms / 1000).toFixed(1)} s (${e.back.why} · ctx ${e.back.st})` : 'NEVER CAME BACK (frozen or killed — sent at the next load)';
  const media = sig.find(x => /^media after/.test(x.s));
  // (CITY I: the context's state at the FIRST signal up front — the owner's phone test reads it at a glance; THE GARDEN PARTY PASS: + the sound
  //  state's name — MUSIC ON · HEAR THE HARBOR · ALL OFF, sound-state.js#SOUND_TABLE)
  const at = e.first && e.first.ctx ? String(e.first.ctx) : '?';
  const head = `AUDIO LEAVE · ctx at the leave: ${at.toUpperCase()} · ${e.sound || 'state ?'} · session ${e.sess || '?'} · ${order} · ${back} · ${media ? media.s : 'media after: (no cut seen)'}`;
  const first = `at the first signal: ${soundingLine(e.first)} · session ${e.session || 'n/a'} · ${e.vis || '?'} · ${e.dev || ''}`;
  const each = `signals: ${sig.map(x => `${x.s} +${x.ms} (ctx ${x.st}, m ${f3(x.m)})`).join(' · ')}`;
  return `${head}\n${first}\n${each}`.slice(0, 1500);
}
