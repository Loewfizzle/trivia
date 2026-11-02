// CITY CONTROLS B — "A ROOM JUST OPENED" on THE LEDGER (the owner's): ON / OFF for THIS phone + SEND A TEST. Web Push (api/_lib/push.js):
// on an iPhone only once the site is ADDED TO THE HOME SCREEN (iOS 16.4+) and opened from there, with notifications allowed — the paper
// says exactly that when it can't. Nothing here is needed for anything else to work.
import { h } from '../../ui/dom.js';

const supported = () => { try { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; } catch { return false; } };
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const installed = () => { try { return !!navigator.standalone || matchMedia('(display-mode: standalone)').matches; } catch { return false; } };
const keyBytes = b64u => { const s = atob(b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4)); return Uint8Array.from(s, c => c.charCodeAt(0)); };
async function reg() { const r = await navigator.serviceWorker.getRegistration('/'); return r || navigator.serviceWorker.register('/sw.js'); }
async function mySub() { try { if (!supported()) return null; const r = await navigator.serviceWorker.getRegistration('/'); return r && r.pushManager ? await r.pushManager.getSubscription() : null; } catch { return null; } }

/** the paper: { api } → an element that fills itself */
export function pushPaper({ api }) {
  const box = h('section.rd-paper.rd-push', h('h4', 'A ROOM JUST OPENED', h('em', 'a push to this phone')), h('p.rd-hint', 'Checking this phone…'));
  let S = null, busy = false, msg = '', err = '';
  const paint = () => {
    const kids = [h('h4', 'A ROOM JUST OPENED', h('em', 'a push to this phone'))];
    if (!supported() || (isIOS() && !installed())) {
      kids.push(h('p', isIOS() ? 'On an iPhone the notification needs the site on your Home Screen: in Safari tap Share → Add to Home Screen, open NEON SPEAKEASY from that icon, then come back here and turn it on.' : 'This browser can’t take push notifications.'));
    } else if (S && !S.key) {
      kids.push(h('p', 'The server has no push keys yet — add VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in Vercel (Settings → Environment Variables), redeploy, then turn it on.'));
    } else {
      const on = !!(S && S.mine);
      kids.push(h('div.rd-lg', h('span', 'This phone', h('small', on ? 'gets a notification when anyone opens a room' : 'off')),
        h('button.rd-lever', { type: 'button', role: 'switch', 'aria-checked': String(on), class: on ? 'is-on' : '', disabled: busy, 'aria-label': 'A room just opened — this phone', onclick: () => (on ? turnOff() : turnOn()) }, h('i.rd-lever-arm'), h('span', on ? 'ON' : 'OFF'))));
      kids.push(h('div.rd-lg', h('span', 'Phones it goes to'), h('b', String(S ? S.subs : 0))));
      if (S && S.subs) kids.push(h('button.rd-done.rd-ptest', { type: 'button', disabled: busy, onclick: test }, 'SEND A TEST'));
    }
    if (msg) kids.push(h('p.rd-hint', msg));
    if (err) kids.push(h('p.rd-err', { role: 'alert' }, err));
    box.replaceChildren(...kids);
  };
  const load = async () => { try { const s = await mySub(); S = await api('admin', { action: 'radioPush', op: 'state', endpoint: s ? s.endpoint : undefined }); } catch (e) { err = e.message; } paint(); };
  async function turnOn() {
    busy = true; err = ''; msg = ''; paint();
    try {
      const perm = await Notification.requestPermission();   // (inside the tap — iOS asks only from a gesture)
      if (perm !== 'granted') throw new Error('Notifications are blocked for this site — allow them in the phone’s settings.');
      const r = await reg(); await navigator.serviceWorker.ready;
      const sub = (await r.pushManager.getSubscription()) || await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(S.key) });
      S = await api('admin', { action: 'radioPush', op: 'sub', sub: sub.toJSON(), ua: navigator.userAgent.slice(0, 80) });
      S.mine = true; msg = 'ON — tap SEND A TEST to see one.';
    } catch (e) { err = (e && e.message) || 'Couldn’t turn it on.'; }
    busy = false; paint();
  }
  async function turnOff() {
    busy = true; err = ''; msg = ''; paint();
    try { const s = await mySub(); const ep = s ? s.endpoint : null; if (s) await s.unsubscribe(); S = await api('admin', { action: 'radioPush', op: 'unsub', endpoint: ep || undefined }); S.mine = false; msg = 'OFF on this phone.'; }
    catch (e) { err = (e && e.message) || 'Couldn’t turn it off.'; }
    busy = false; paint();
  }
  async function test() {
    busy = true; err = ''; paint();
    try { const r = await api('admin', { action: 'radioPush', op: 'test' }); msg = r.sent ? `SENT TO ${r.sent} PHONE${r.sent > 1 ? 'S' : ''} — it lands in a few seconds.` : 'Nothing sent — the phone may have turned it off (turn it on again).'; }
    catch (e) { err = e.message; }
    busy = false; paint();
  }
  load();
  return box;
}
