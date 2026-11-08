// THE DAILY SCREENS' PREVIEW API (DM2 — daily-preview.html swaps js/profile/api.js for this through its import map): answers `daily today`
// from a scripted state (window.__dyToday) + the friends list (window.__dyFriends); every other call refuses quietly (status 0 — "offline").
export class ApiFail extends Error {
  constructor(status, code, message, body = {}) { super(message || code); this.status = status; this.code = code; this.body = body; }
}
export const calls = [];
export async function api(name, body = {}) {
  calls.push({ name, body });
  if (name === 'daily' && body.action === 'today') return JSON.parse(JSON.stringify(window.__dyToday || { dailies: [] }));
  if (name === 'daily' && body.action === 'room') return { mid: window.__dyMid || [] };
  if (name === 'daily' && body.action === 'lesson') return { ok: true };
  if (name === 'profile' && body.action === 'friends') return { friends: window.__dyFriends || [], in: [], out: [], blocked: [], recent: [], caps: {} };
  throw new ApiFail(0, 'offline', 'preview');
}
export async function board() { return { rows: [] }; }
export const clearBoardCache = () => {};
export function reportRow() { return Promise.resolve(); }
export function activeGames() { return []; }
