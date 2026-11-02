// CITY CONTROLS A — THE RADIO's GATE: asks the server (radioWho — the role per profile: the owner = ADMIN_PIDS, THE CREW) once the app is
// up; ONLY a yes loads radio.js + css/radio.css and puts the corner button on the page — nobody else ever gets it, not even in the DOM.
// A yes is remembered for the tab (6 h — never a "no": a profile restored later asks again on 'nd:me'). City 2.0 only (app.js).
import { api } from '../../profile/api.js';
import { firebaseReady } from '../../firebase.js';

const KEY = 'nd:rd-role', KEEP_MS = 6 * 3600e3;
const ss = { get(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch { return null; } }, set(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* fine */ } } };

let radio = null, starting = null;
/** start the gate: { remote () → the title's preview remote (or null), roomCode () → the room this phone is in (or null) } */
export function startRadioGate(o) {
  const tryIt = async () => {
    if (radio || starting) return starting;
    starting = (async () => {
      let role = null;
      const c = ss.get(KEY);
      if (c && c.role && c.at > Date.now() - KEEP_MS) role = c.role;
      if (!role) {
        await firebaseReady;
        try { const r = await api('admin', { action: 'radioWho' }); role = r && r.role ? r.role : null; } catch { role = null; }
        if (role) ss.set(KEY, { role, at: Date.now() });
      }
      if (!role) return null;
      const css = new Promise(res => {
        if (document.querySelector('link[data-rd]')) { res(true); return; }
        const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/radio.css'; l.dataset.rd = '1';
        l.onload = l.onerror = () => res(true); setTimeout(() => res(true), 3000); document.head.append(l);
      });
      const m = await import('./radio.js');
      radio = m.createRadio({ role, remote: o.remote, roomCode: o.roomCode, sheetsReady: css });
      return radio;
    })().catch(e => { console.warn('[radio] gate', e); return null; }).finally(() => { starting = null; });
    return starting;
  };
  window.addEventListener('nd:me', () => { if (!radio) tryIt(); });
  tryIt();
  return { get: () => radio, retry: tryIt };
}
