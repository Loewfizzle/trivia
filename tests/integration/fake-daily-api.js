// THE DAILY SCREENS' PREVIEW API (DM2 — daily-preview.html swaps js/profile/api.js for this through its import map): answers `daily today`
// from a scripted state (window.__dyToday) + the friends list (window.__dyFriends); every other call refuses quietly (status 0 — "offline").
export class ApiFail extends Error {
  constructor(status, code, message, body = {}) { super(message || code); this.status = status; this.code = code; this.body = body; }
}
export const calls = [];
export async function api(name, body = {}) {
  calls.push({ name, body });
  // (PFIX-3: `today { share }` — SHARE TODAY's tap — carries the preview's scripted share inputs for the dailies that are done: window.__dyShare)
  if (name === 'daily' && body.action === 'today') { const t = JSON.parse(JSON.stringify(window.__dyToday || { dailies: [] })); if (body.share) t.share = Object.fromEntries(Object.entries(window.__dyShare || {}).filter(([id]) => t.mine && t.mine[id] != null)); return t; }
  if (name === 'daily' && body.action === 'room') return { mid: window.__dyMid || [] };
  if (name === 'daily' && body.action === 'lesson') return { ok: true };
  if (name === 'daily' && body.action === 'points') { if (!window.__dyPoints) throw new ApiFail(0, 'offline', 'preview'); return JSON.parse(JSON.stringify(window.__dyPoints)); }
  if (name === 'profile' && body.action === 'player') { if (!window.__ppAnswer) throw new ApiFail(0, 'offline', 'preview'); await new Promise(r => setTimeout(r, window.__ppDelay || 200)); return JSON.parse(JSON.stringify(window.__ppAnswer(body))); }
  if (name === 'profile' && body.action === 'friends') return { friends: window.__dyFriends || [], in: [], out: [], blocked: [], recent: [], caps: {} };
  throw new ApiFail(0, 'offline', 'preview');
}
export async function board(b) { return { rows: ((window.__dyBoard || {})[b] || []).slice(0, 3) }; }
export const clearBoardCache = () => {};
export function reportRow() { return Promise.resolve(); }
export function activeGames() { return []; }
