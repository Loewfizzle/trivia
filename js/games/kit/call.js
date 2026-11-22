// Match kit — Call the Winner: an eliminated player gets CALL_MS to pick who wins (one locked pick, a right call earns
// The long notes: docs/games/jaywalk-notes.md
import { h } from '../../ui/dom.js';
import { avatar } from '../../ui/components.js';
import { toast } from '../../ui/toast.js';
import { colorHex } from '../../config.js';
import { dbRef, update as dbUpdate, serverTimestamp, serverNow, expectRefusal } from '../../firebase.js';
import { vibrate } from '../../ui/dom.js';
import { CALL_MS } from '../../core/playlist.js';

const RING_TICKS = 20;
const cls = (prefix, name) => (prefix && prefix !== 'mk' ? `${prefix}-${name}` : `mk-${name}`);

export function showCall({ overlay, prefix = 'mk', game, st, me, player, candidates, path, line, intro, ended, onState, sfx, avatarSize = 40, isDestroyed, ring = false, canPick = null, expect = null }) {
  const alive = candidates;
  if (alive.length < 2) return null;
  const endsAt = ((game.out && game.out[me] && game.out[me].at) || serverNow()) + CALL_MS;
  const made = st.live && st.live.calls && st.live.calls[me];
  if (made) { onState(`YOUR CALL · ${player(made.w).name}`); return null; }
  if (serverNow() > endsAt - 1500) { onState('NO CALL'); return null; }
  let picked = null;
  const bar = h('i');
  const grid = h(`div.${cls(prefix, 'call-grid')}`, alive.map(uid => {
    const p = player(uid);
    return h(`button.${cls(prefix, 'call-pick')}`, { type: 'button', dataset: { uid }, style: { '--c': colorHex(p.color) }, onclick: () => pick(uid) },
      avatar(p.avatar, p.color, avatarSize), h('b', p.name), line ? h('small', line(uid)) : null);
  }));
  const ticks = ring ? Array.from({ length: RING_TICKS }, (_, i) => h('i', { style: { transform: `rotate(${(360 / RING_TICKS) * i}deg)` } })) : [];
  const secs = h('b');
  const ringEl = ring ? h(`div.${cls(prefix, 'call-ring')}`, { 'aria-hidden': 'true' }, ticks, secs) : null;
  const el = h(`div.${cls(prefix, 'call')}`, { 'data-nogesture': '', class: ring ? 'has-ring' : null },
    h(`div.${cls(prefix, 'call-top')}`, h(`div.${cls(prefix, 'kicker')}`, 'CALL THE WINNER'), ringEl),
    h('p', intro ? intro(alive.length) : `${alive.length} left — a right call earns game-night points.`), grid, ring ? null : h(`div.${cls(prefix, 'call-bar')}`, bar));
  overlay.append(el);
  function pick(uid) {
    if (picked || serverNow() > endsAt || (ended && ended()) || (canPick && !canPick(uid))) return;   // (never a write the rules must refuse)
    picked = uid;
    if (expect) expectRefusal(path, expect, 90000);
    if (sfx) sfx();
    vibrate(12);
    dbUpdate(dbRef(path), { w: uid, at: serverTimestamp() }).catch(() => toast('YOUR CALL DID NOT GO THROUGH', 'err'));
    close(`YOUR CALL · ${player(uid).name}`);
  }
  function close(msg) {
    el.classList.add('is-done');
    setTimeout(() => el.remove(), 300);
    onState(msg || 'NO CALL');
  }
  const iv = setInterval(() => {
    const left = endsAt - serverNow();
    if (ring) {
      const lit = Math.ceil(Math.max(0, left / CALL_MS) * RING_TICKS);
      ticks.forEach((t, i) => { const on = i < lit; if (t.classList.contains('is-off') === on) t.classList.toggle('is-off', !on); });
      const n = String(Math.max(0, Math.ceil(left / 1000)));
      if (secs.textContent !== n) secs.textContent = n;
    } else bar.style.transform = `scaleX(${Math.max(0, left / CALL_MS)})`;
    if (canPick) for (const b of grid.children) { const off = !canPick(b.dataset.uid); if (b.classList.contains('is-out') !== off) { b.classList.toggle('is-out', off); b.disabled = off; } }
    if (left <= 0 || picked || (isDestroyed && isDestroyed()) || (ended && ended())) { clearInterval(iv); if (!picked) close('NO CALL'); }
  }, 100);
  return el;
}
