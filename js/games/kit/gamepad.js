// THE CONTROLLER (JT2 — the owner, Nov 22; docs/match-kit.md "THE CONTROLLER"): a SHARED kit piece any game plugs into with one line —
//   wirePad({ dir: d => …, a: () => …, b: () => …, say: text => … }) → off()
// Xbox · PlayStation · Switch Pro · Joy-Con · MFi (Backbone, Kishi) through the browser's Gamepad API. The D-pad + the left stick = 4-way moves
// ('u' 'd' 'l' 'r' — ONE per press: a deadzone 0.5, re-armed under 0.3, no auto-repeat); A / ✕ = confirm (a Nintendo pad: its own A, the
// right button) · B / ○ = back. A + B press the page's visible [data-pad="a" | "b"] control first (an end card's PLAY AGAIN / BACK), else the
// game's own a() / b(). The game's moves go through the SAME intents its touch + keys use — the proof sees ordinary hops.
// Safari shows a pad only after a button press → that FIRST press says "🎮 CONNECTED" (~2 s, the game's own quiet line) and does nothing
// else (the buttons it holds are learned, never a move); a quiet line on a disconnect. Polled once a frame ONLY while wired (a game on screen). Lazy: a game imports it on its first `gamepadconnected` (padReady).
// EXACT TIMING (HIGH RISE PAD + GO): a() / b() are handed the pad's own `timestamp` + the time of the poll BEFORE this one (the press lies
// between the two) — a game on a clock (HIGH RISE's drop) stamps the press itself, never the frame it was noticed; a game may ignore both.
export const DEADZONE = 0.5, REARM = 0.3, SAY_MS = 2000;
/** the standard mapping's buttons (W3C "standard gamepad"): the face buttons by POSITION, the D-pad 12–15 */
export const STD = Object.freeze({ bottom: 0, right: 1, up: 12, down: 13, left: 14, right2: 15 });

/** a Nintendo-labelled pad (its A on the RIGHT, B at the bottom): the confirm follows the label, never the position */
export const nintendo = id => /nintendo|pro controller|joy-?con|057e/i.test(String(id || ''));

/** PURE — one pad's frame → what changed: { dirs: ['u' …], a, b } given the last frame's memory `m` (mutated) */
export function readPad(gp, m) {
  const out = { dirs: [], a: false, b: false };
  if (!gp || !gp.buttons) return out;
  const on = i => { const b = gp.buttons[i]; return !!b && (b.pressed || b.value > 0.5); };
  const ax = i => (gp.axes && Number.isFinite(gp.axes[i]) ? gp.axes[i] : 0);
  // the D-pad: standard 12–15; a pad without the standard mapping may give a hat axis (9: −1 up … ≈ 0.43 left; > 1 = released)
  let pu = on(STD.up), pd = on(STD.down), pl = on(STD.left), pr = on(STD.right2);
  if (gp.mapping !== 'standard' && gp.axes && gp.axes.length > 9) {
    const h = ax(9);
    if (h >= -1.05 && h <= 1.05) { pu = pu || h < -0.85 || h > 0.85; pr = pr || (h > -0.65 && h < -0.2); pd = pd || (h > -0.1 && h < 0.3); pl = pl || (h > 0.35 && h < 0.8); }
  }
  for (const [d, now] of [['u', pu], ['d', pd], ['l', pl], ['r', pr]]) { if (now && !m[`p${d}`]) out.dirs.push(d); m[`p${d}`] = now; }
  // the left stick: ONE move as it leaves the deadzone along its stronger axis; re-armed once it is back near the middle
  const x = ax(0), y = ax(1), mag = Math.max(Math.abs(x), Math.abs(y));
  if (!m.stick && mag >= DEADZONE) { m.stick = true; out.dirs.push(Math.abs(x) > Math.abs(y) ? (x > 0 ? 'r' : 'l') : (y > 0 ? 'd' : 'u')); }
  else if (m.stick && mag < REARM) m.stick = false;
  const swap = nintendo(gp.id), A = on(swap ? STD.right : STD.bottom), B = on(swap ? STD.bottom : STD.right);
  if (A && !m.a) out.a = true;
  if (B && !m.b) out.b = true;
  m.a = A; m.b = B;
  return out;
}

const visible = el => !!el && el.isConnected && !el.disabled && !el.closest('[hidden]') && el.getClientRects().length > 0;
/** the page's own control for A / B (the newest visible one — an end card on top of the game) */
const padControl = k => { const all = [...document.querySelectorAll(`[data-pad="${k}"]`)].filter(visible); return all[all.length - 1] || null; };

let wired = 0;
const known = new Set();   // (the pads this page has said CONNECTED for — once a page, again only after a disconnect)
export const padsWired = () => wired;
/** wire the pads for one game screen → off(). `say` = the game's quiet line (else nothing is said) */
export function wirePad({ dir, a, b, say } = {}) {
  const mem = new Map();
  let raf = 0, off = false;
  wired++;
  let polled = 0;
  const frame = () => {
    if (off) return;
    raf = requestAnimationFrame(frame);
    const prev = polled;
    polled = performance.now();
    let pads = [];
    try { pads = navigator.getGamepads ? [...navigator.getGamepads()] : []; } catch { pads = []; }
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      let m = mem.get(gp.index);
      // (a pad's FIRST frame — Safari shows it only after a press: that press CONNECTS it (the line), it never acts: the held buttons are learned)
      if (!m || m.id !== gp.id) { m = { id: gp.id }; mem.set(gp.index, m); readPad(gp, m); if (!known.has(gp.id)) { known.add(gp.id); if (say) say('🎮 CONNECTED'); } continue; }
      const r = readPad(gp, m);
      if (!r.dirs.length && !r.a && !r.b) continue;
      if (document.visibilityState === 'hidden') continue;
      for (const d of r.dirs) if (dir) dir(d);
      if (r.a) { const el = padControl('a'); if (el) el.click(); else if (a) a(gp.timestamp, prev); }
      if (r.b) { const el = padControl('b'); if (el) el.click(); else if (b) b(gp.timestamp, prev); }
    }
  };
  const gone = e => { const gp = e && e.gamepad; if (!gp) return; mem.delete(gp.index); if (known.delete(gp.id) && say) say('CONTROLLER DISCONNECTED'); };
  addEventListener('gamepaddisconnected', gone);
  raf = requestAnimationFrame(frame);
  return () => { if (off) return; off = true; wired--; cancelAnimationFrame(raf); removeEventListener('gamepaddisconnected', gone); };
}
