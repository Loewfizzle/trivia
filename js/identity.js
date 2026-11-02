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
  if (params.get('city') === '1' || params.get('city') === '2') p.set('city', params.get('city')); // the city flag (City 2.0 is the default; ?city=1 = City 1.0): a refresh / rejoin stays on it; never saved
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''));
}

// THE SECOND TAB (PERF-A — Grok 5.4 + FR5 E1: the old toast told a PHONE to add ?slot=2 — an empty login — and both tabs ran the host
// loop): the same slot open in two tabs → ONE stays the player, the other YIELDS (onChange(true): a banner "ALREADY OPEN IN ANOTHER TAB —
// USE THAT ONE" that stays, its host loop stopped) until the other tab closes, freezes or the player taps USE THIS TAB (take()).
// The handshake (BroadcastChannel na-slot-<slot>): a tab says hello (born, active); an ACTIVE tab answers here; between two actives the
// OLDER wins (born, then id); a yielded tab re-asks every 3 s and takes over once nobody has answered for 9 s (the other tab closed, or
// is frozen in the background — it can't be used then anyway); a closing tab says bye. No lock, nothing stored: a refresh starts clean.
export function watchDuplicateTabs(onChange) {
  const none = { take() {}, yielded: () => false };
  if (!('BroadcastChannel' in window)) return none;
  let ch; try { ch = new BroadcastChannel(`na-slot-${slot}`); } catch { return none; }
  const id = Math.random().toString(36).slice(2);
  let born = Date.now(), yielded = false, lastHere = 0;
  const older = m => m.born < born || (m.born === born && m.id < id);
  const set = y => { if (y === yielded) return; yielded = y; try { onChange(y); } catch { /* fine */ } };
  const probe = () => { try { ch.postMessage({ t: 'hello', id, born, active: !yielded }); } catch { /* closed */ } };
  ch.onmessage = e => {
    const m = e.data || {};
    if (!m.id || m.id === id) return;
    if (m.t === 'hello') {
      if (yielded) return;
      ch.postMessage({ t: 'here', id, born });
      if (m.active && older(m)) set(true);                 // (two actives: the younger yields)
    } else if (m.t === 'here') {
      lastHere = Date.now();
      if (!yielded && older(m)) set(true);
    } else if (m.t === 'take') {
      born = Date.now(); lastHere = Date.now(); set(true);  // (the player picked the other tab)
    } else if (m.t === 'bye') { lastHere = 0; if (yielded) setTimeout(probe, 120 + Math.random() * 300); }
  };
  probe();
  setInterval(() => {
    if (yielded) { if (Date.now() - lastHere > 9000) { set(false); probe(); } else probe(); }
    else probe();                                            // (an active tab checks now and then: two actives settle on one)
  }, 3000);
  window.addEventListener('pagehide', () => { try { ch.postMessage({ t: 'bye', id }); } catch { /* fine */ } });
  return {
    /** USE THIS TAB: this tab becomes the player, every other tab of the slot yields */
    take() { born = -Date.now(); set(false); try { ch.postMessage({ t: 'take', id }); } catch { /* fine */ } },
    yielded: () => yielded,
  };
}
