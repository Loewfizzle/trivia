// THE AUDIO DIAGNOSTIC (&debug=1, both cities, every screen — M3, the owner's iPhone: "the music still doesn't come back").
// This machine can't run WebKit, so the phone tells us: one screenshot after the bug shows where the music died —
//   ctx   the AudioContext: state (running / suspended / interrupted / closed), its clock moving (▲) or not (■), rebuilds,
//         contexts alive (made − closed), navigator.audioSession (iOS 17+: type/state — n/a when Safari has no `state`)
//   set   (M4) the session type this page asked for, when and why ('playback' with the music on, 'ambient' effects-only)
//   el    the song's <audio> element: playing / paused, readyState, networkState, error code, its clock ▲ / ■, its gain, the file
//   out   (M4) the path the music is on: WEB AUDIO (a voice through the graph) or DIRECT ELEMENT (iOS's own pipeline), the direct
//         element armed or not, the voices, the probe's level
//   want  what should be playing (+ music off / muted), the panel's ONE status (the header's too: sounding / sounding DIRECT / silent (why) / LOCKED / NEEDS TAP / DEAD VOICE / NOT SOUNDING), the last heal
//   then  the last 8 events with times: visibility, pagehide / pageshow (persisted), blur / focus, each tap (+ the context's state
//         then), every resume() and play() with its result or the error's name, rebuilds, frozen clocks, rescues, the direct path.
// Tap the AUDIO title to fold it to one line (remembered for the visit). Pointer events pass through everything else; the right
// 64 px stay clear (the corner buttons: gear, music, menu). It repaints only when its text changed (a fixed layer over the canvas).
import { musicDiag } from './music.js';

const CSS = `
.ad-diag { position: fixed; z-index: 2147483000; left: 8px; right: 64px; top: calc(env(safe-area-inset-top, 0px) + 58px); max-width: 440px;
  background: rgba(0, 0, 0, 0.82); color: #c9f7de; border-radius: 8px; padding: 4px 8px 6px; pointer-events: none;
  font: 600 10px/13px ui-monospace, "JetBrains Mono", monospace; white-space: pre-wrap; word-break: break-all; }
.ad-diag .ad-h { pointer-events: auto; display: block; width: 100%; text-align: left; background: none; border: 0; padding: 2px 0; color: #fff;
  font: inherit; cursor: pointer; }
.ad-diag .ad-bad { color: #ffb0b0; }
.ad-diag .ad-ok { color: #9ff0c8; }
.ad-diag .ad-ev { color: #d6dbe6; }
.ad-diag.ad-fold .ad-body { display: none; }
`;

const KEY = 'ad:fold';
const hhmmss = at => { const d = new Date(at); const p = n => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${Math.floor(d.getMilliseconds() / 100)}`; };

export function mountAudioDiag() {
  if (document.querySelector('.ad-diag')) return;
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  const box = document.createElement('div'); box.className = 'ad-diag';
  const head = document.createElement('button'); head.type = 'button'; head.className = 'ad-h';
  const body = document.createElement('div'); body.className = 'ad-body';
  box.append(head, body);
  document.body.append(box);
  let fold = false;
  try { fold = sessionStorage.getItem(KEY) === '1'; } catch { /* private mode */ }
  box.classList.toggle('ad-fold', fold);
  head.addEventListener('click', () => { fold = !fold; box.classList.toggle('ad-fold', fold); try { sessionStorage.setItem(KEY, fold ? '1' : '0'); } catch { /* fine */ } paint(); });
  let prevCtx = null, prevEl = null, lastText = '', lastHead = '';
  /** the panel's one verdict on the music: { key, text, ok } — the header and the want row both print `text` */
  function audioStatus(d, E, should) {
    if (d.sounding) return { key: 'on', text: d.out === 'direct' ? 'sounding DIRECT' : 'sounding', ok: true };
    if (d.off) return { key: 'off', text: `silent (${d.off})`, ok: true };
    if (!E.unlocked) return { key: 'locked', text: 'LOCKED (no tap yet)', ok: !should };
    if (d.needTap) return { key: 'tap', text: 'NEEDS TAP', ok: false };
    if (d.dead) return { key: 'dead', text: 'DEAD VOICE', ok: false };
    if (!should) return { key: 'idle', text: 'silent (nothing to play)', ok: true };
    return { key: 'no', text: 'NOT SOUNDING', ok: false };
  }
  const line = (cls, text) => [cls, text];
  function cityRow() {
    let L = null;
    try { L = window.__district && window.__district.loop ? window.__district.loop() : null; } catch { /* no city */ }
    if (!L) return [];
    const ok = L.running && L.ago < 1500;
    return [line(ok ? 'ad-ok' : 'ad-bad', `city ${L.running ? (ok ? 'running' : 'STALLED') : 'STOPPED'} · last frame ${(Math.round(L.ago / 500) / 2).toFixed(1)} s ago · restarts ${L.restarts}${L.why ? ` (last: ${L.why})` : ''}${L.stalls ? ` · stalls ${L.stalls}` : ''}${L.failStop ? ' · FAIL-STOP' : ''}`)];
  }
  function paint() {
    let d;
    try { d = musicDiag(); } catch (e) { head.textContent = 'AUDIO — ' + (e && e.message); return; }
    const E = d.engine;
    const ctxMoves = prevCtx == null ? null : E.time > prevCtx + 0.01;
    const elMoves = !d.el || prevEl == null ? null : d.el.t > prevEl + 0.01;
    prevCtx = E.time; prevEl = d.el ? d.el.t : null;
    const arrow = m => m == null ? '·' : m ? '▲' : '■';
    const ctxOk = E.state === 'running' && !E.frozen && ctxMoves !== false;
    const elOk = !!d.el && !d.el.paused && !d.el.err && elMoves !== false;
    const should = !!d.want && !d.off;
    // 7a (the owner: the header said "sounding" over a detail row saying "sounding NO · locked (no tap yet)"): ONE status, read by the
    // header AND the want row — sounding / SOUNDING DIRECT / silent (music off · muted · nothing to play) / LOCKED (no tap yet) /
    // NEEDS TAP / DEAD VOICE / NOT SOUNDING
    const st = audioStatus(d, E, should);
    const okAll = st.ok;
    // (the title carries the clock: it changes every half second — the body only when something happened)
    const h = `AUDIO ${fold ? '▸' : '▾'} ${st.text} · ctx ${E.state} · el ${d.el ? (d.el.paused ? 'paused' : 'playing') : 'none'} · ${hhmmss(Date.now())}`;
    if (h !== lastHead) { lastHead = h; head.textContent = h; head.className = 'ad-h ' + (okAll ? 'ad-ok' : 'ad-bad'); }
    if (fold) return;
    const rows = [
      line(ctxOk ? 'ad-ok' : 'ad-bad', `ctx ${E.state}${E.frozen ? ' FROZEN' : ''} · t ${E.time.toFixed(2)} ${arrow(ctxMoves)} · rebuilds ${E.rebuilds}${E.why ? ` (${E.why})` : ''}${E.stuck ? ' · STUCK' : ''}${E.unlocked ? '' : ' · locked (no tap yet)'} · alive ${E.alive} (made ${E.made}, closed ${E.closed})${E.session ? ` · session ${E.session}` : ''}`),
      line('ad-ok', `set ${E.sessionSet && E.sessionSet.type ? `${E.sessionSet.type} at ${hhmmss(E.sessionSet.at)} (${E.sessionSet.why})` : E.session ? 'nothing yet' : 'no audioSession API'}`),
      line(elOk || !should ? 'ad-ok' : 'ad-bad', d.el
        ? `el ${d.playing} ${d.el.paused ? 'PAUSED' : 'playing'} · ready ${d.el.ready} · net ${d.el.net} · err ${d.el.err || '–'} · t ${d.el.t.toFixed(1)} ${arrow(elMoves)} · gain ${d.el.gain.toFixed(2)}${d.el.broken ? ' · BROKEN' : ''}${d.still ? ' · STILL' : ''}`
        : `el none${d.carry ? ` (carrying ${d.carry} to new voices)` : ''} · voices ${d.voices}`),
      line(d.out === 'direct' ? 'ad-ok' : 'ad-ok', `out ${d.out === 'direct' ? 'DIRECT ELEMENT' : 'WEB AUDIO'} · direct ${d.direct} · src ${d.el ? d.el.src : '–'} · voices ${d.voices} (${d.armed} armed) · probe ${d.peak < 0 ? '?' : d.peak.toFixed(3)}`),
      line(okAll ? 'ad-ok' : 'ad-bad', `want ${d.want || 'nothing'}${d.off ? ` (${d.off})` : ''} · ${st.text}${d.needTap && st.key !== 'tap' ? ' · NEEDS TAP' : ''}${d.dead && st.key !== 'dead' ? ' · DEAD VOICE' : ''}${d.ended ? ' · ended' : ''} · heals ${d.heals}${d.last ? ` (${d.last})` : ''}`),
      // 8a (City 2.0): THE CITY'S FRAME LOOP — the &debug readout's beat line is drawn BY it, so a stopped loop freezes that line on
      // its last frame while this panel (the DOM) stays live: 'city STOPPED' / a growing 'last frame' = the lights can't pulse
      ...cityRow(),
      ...d.events.slice(-8).map(e => line('ad-ev', `${hhmmss(e.at)} ${e.m}`)),
    ];
    const text = rows.map(r => r.join('\u0001')).join('\n');
    if (text === lastText) return;
    lastText = text;
    body.replaceChildren(...rows.map(([cls, t]) => { const s = document.createElement('div'); s.className = cls; s.textContent = t; return s; }));
  }
  paint();
  setInterval(() => { if (document.visibilityState === 'visible') paint(); }, 500);
  document.addEventListener('visibilitychange', () => paint());
}
