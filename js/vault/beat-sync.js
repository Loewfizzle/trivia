// THE VAULT 2B — ON THE BEAT's clock (tube-beat: "pulses with the party on Friday + Saturday nights"). Emblems are CSS layers (the
// compositor moves them — emblem-art.js), so the beat reaches them as --beat on <html> (seconds a beat), the class `ve-beat-on`, and each
// pulse layer's CSS animation set ONTO the beat through its own clock (getAnimations().currentTime) — while it applies: a PARTY NIGHT
// (core/party.js: Fri + Sat, 8 pm – 2 am, this phone's time) with a song whose beat the city knows (audio/beat.js — a trusted grid, or
// the song's tempo). Any other time the style glows slowly + steadily. It runs only while an emblem wears the style (a check every 1.5 s;
// it stops itself when none is on the page) and only moves an animation that has drifted past 25 ms.
let timer = 0, mods = null, last = { per: 0, on: false };

export function beatSync() {
  if (timer || typeof document === 'undefined') return;
  if (!mods) mods = Promise.all([import('../audio/beat.js'), import('../core/party.js')]).catch(() => null);
  timer = setInterval(tick, 1500);
  setTimeout(tick, 60);
}

async function tick() {
  const root = document.documentElement;
  if (!document.querySelector('.ve-t-beat')) { clearInterval(timer); timer = 0; root.classList.remove('ve-beat-on'); last.on = false; return; }
  const M = await mods; if (!M) return;
  const [B, P] = M, d = new Date();
  const party = P.inPartyWindow({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), dow: d.getDay(), h: d.getHours(), mi: d.getMinutes(), s: d.getSeconds() });
  let src = null; try { src = party ? B.beatSource() : null; } catch { src = null; }
  if (!src || !(src.bpm > 0)) { if (last.on) { root.classList.remove('ve-beat-on'); last.on = false; } return; }
  const bpm = src.grid ? src.grid.bpm : src.bpm, per = 60 / bpm, phase = (((src.pos - ((src.grid && src.grid.t0) || 0)) / per) % 1 + 1) % 1;
  if (!last.on || Math.abs(per - last.per) > 0.002) { root.style.setProperty('--beat', `${per.toFixed(4)}s`); root.classList.add('ve-beat-on'); last = { per, on: true }; }
  const P1 = per * 1000, want = phase * P1;
  for (const el of document.querySelectorAll('.ve-t-beat .ve-bt')) for (const a of el.getAnimations ? el.getAnimations() : []) {
    const cur = (((a.currentTime || 0) % P1) + P1) % P1, drift = Math.min(Math.abs(cur - want), P1 - Math.abs(cur - want));
    if (drift > 25) a.currentTime = want;
  }
}
