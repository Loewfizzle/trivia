// Local identity + session persistence.
//
// A "slot" is an independent local identity (own Firebase anonymous user, own
// saved room/profile). Phones always use slot 1. To test several players on one
// computer, open extra tabs with ?slot=2, ?slot=3 ... The slot sticks to the tab
// (sessionStorage) so refreshes keep it even after the URL is cleaned up.
const params = new URLSearchParams(location.search);

function resolveSlot() {
  const fromUrl = (params.get('slot') || '').replace(/[^a-z0-9]/gi, '').slice(0, 8);
  try {
    if (fromUrl) sessionStorage.setItem('na:slot', fromUrl);
    return fromUrl || sessionStorage.getItem('na:slot') || '1';
  } catch {
    return fromUrl || '1';
  }
}

export const slot = resolveSlot();

// ?emu = use local Firebase emulators. Only honored on localhost; sticky per tab.
export const useEmulator = (() => {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return false;
  try {
    if (params.has('emu')) sessionStorage.setItem('na:emu', '1');
    return sessionStorage.getItem('na:emu') === '1';
  } catch { return params.has('emu'); }
})();
const key = name => `na:${slot}:${name}`;

function read(name) {
  try { return JSON.parse(localStorage.getItem(key(name)) || 'null'); } catch { return null; }
}
function write(name, value) {
  try {
    if (value == null) localStorage.removeItem(key(name));
    else localStorage.setItem(key(name), JSON.stringify(value));
  } catch { /* private mode etc. — the game still works, just no auto-rejoin */ }
}

// { name, color, avatar }
export const loadProfile = () => read('profile');
export const saveProfile = p => write('profile', p);

// The global profile this device is linked to (server-made, see js/profile/me.js):
// { uid, pid, profile: { n, t, a, c, x, r, h }, at } — pid only counts for the uid it was made for.
export const loadMe = () => read('me');
export const saveMe = m => write('me', m);
// The profile restore key (NEON-XXXX-XXXX-XXXX): only ever on the player's own devices.
export const loadKey = () => read('pkey');
export const saveKey = k => write('pkey', k);
// small per-device notes for the profile UI: { saved (key saved), prompted (times asked), games (matches finished) }
export const loadNotes = () => read('pnotes') || {};
export const saveNotes = n => write('pnotes', n);
// the results queue (js/profile/queue.js)
export const loadQueue = () => read('rq') || [];
export const saveQueue = q => write('rq', q && q.length ? q : null);
export const loadDone = () => read('rdone') || [];
export const saveDone = d => write('rdone', d);

// { code, at }
export const loadSession = () => read('session');
export const saveSession = code => write('session', code ? { code, at: Date.now() } : null);

export const inviteCode = () => (params.get('room') || '').toUpperCase();

// Rewrites the address bar: keep ?slot for test tabs, show ?room while in a room.
export function setUrlRoom(code) {
  const p = new URLSearchParams();
  if (code) p.set('room', code);
  if (slot !== '1') p.set('slot', slot);
  if (useEmulator) p.set('emu', '');
  if (params.has('pdperf')) p.set('pdperf', ''); // PRISM DROP's on-screen performance readout
  if (params.get('city') === '2') p.set('city', '2'); // CITY 2.0 (dev flag): a refresh / rejoin stays on the Harbor; never saved
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''));
}

// Warn when the same slot is open in two tabs (they'd be the same player).
export function watchDuplicateTabs(onDuplicate) {
  if (!('BroadcastChannel' in window)) return;
  const ch = new BroadcastChannel(`na-slot-${slot}`);
  const id = Math.random().toString(36).slice(2);
  ch.onmessage = e => {
    if (e.data.id === id) return;
    if (e.data.t === 'hello') ch.postMessage({ t: 'here', id });
    if (e.data.t === 'here' || e.data.t === 'hello') onDuplicate();
  };
  ch.postMessage({ t: 'hello', id });
}
