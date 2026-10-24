// THE DEBUG TOOLS (FP — the owner couldn't find the AUDIO panel without the &debug=1 link): the frame-time READOUT (City 2.0's
// strip at the top, screens/harbor/scene.js#readout + ui/debug-strip.js) and THE AUDIO PANEL (audio/diag.js), switched on / off LIVE from THE PREVIEW
// PANEL → TOOLS on THIS device and remembered there (localStorage `na:dbgtools`) — JUST ME only, never sent to EVERYONE, no special
// link needed. &debug=1 in a link still shows both; a switch flipped during the visit wins over the link for the rest of it.
const KEY = 'na:dbgtools';
export const DEBUG_TOOLS = ['readout', 'audio'];
const URL_DEBUG = typeof location !== 'undefined' && /[?&]debug=1(?:&|$)/.test(location.search || '');
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { saved = {}; }
const flipped = new Map();
const subs = new Set();
/** is this tool on? `url` = the page's own debug flag (the scene passes its live one: the remote may set &debug=1) */
export function debugTool(id, url = URL_DEBUG) {
  return flipped.has(id) ? flipped.get(id) : !!(url || saved[id]);
}
/** switch a tool on / off now (this visit) + remember it on this device */
export function setDebugTool(id, on) {
  if (!DEBUG_TOOLS.includes(id)) return;
  flipped.set(id, !!on);
  saved = { ...saved, [id]: !!on };
  try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* private mode: this visit only */ }
  for (const f of subs) { try { f(id, !!on); } catch { /* a listener's problem */ } }
}
/** called with (id, on) whenever a tool is switched → an unsubscribe */
export function onDebugTools(fn) { subs.add(fn); return () => subs.delete(fn); }
/** FP3a: is this tool's strip folded to one line? (ui/debug-strip.js — remembered on this device, beside the switches) */
export const debugFold = id => !!saved[`fold:${id}`];
export function setDebugFold(id, folded) {
  saved = { ...saved, [`fold:${id}`]: !!folded };
  try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* private mode: this visit only */ }
}
