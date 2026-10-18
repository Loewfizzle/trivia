// Match kit — Call the Winner: an eliminated player gets CALL_MS to pick who wins (one locked pick, a right call earns
// game-night points through `nightBonus`). Refresh-safe: an existing call (st.live.calls) or a closed window just sets
// the state line.
//
//   showCall({ overlay, prefix: 'gl', game, st, me, player, candidates, path, line, intro, ended, onState, sfx })
//     candidates: uids still in (not me) — needs ≥ 2;  path: `rooms/${code}/glcall/${matchId}/${me}`
//     line(uid) → the small text under a name;  intro(n) → the sentence;  ended() → true once the match is over
//     onState(msg) → 'YOUR CALL · NAME' | 'NO CALL' (the HUD shows it);  sfx() on a pick
import { h } from '../../ui/dom.js';
import { avatar } from '../../ui/components.js';
import { toast } from '../../ui/toast.js';
import { colorHex } from '../../config.js';
import { dbRef, update as dbUpdate, serverTimestamp, serverNow } from '../../firebase.js';
import { vibrate } from '../../ui/dom.js';
import { CALL_MS } from '../../core/playlist.js';

const cls = (prefix, name) => (prefix && prefix !== 'mk' ? `${prefix}-${name}` : `mk-${name}`);

export function showCall({ overlay, prefix = 'mk', game, st, me, player, candidates, path, line, intro, ended, onState, sfx, avatarSize = 40, isDestroyed }) {
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
    return h(`button.${cls(prefix, 'call-pick')}`, { type: 'button', style: { '--c': colorHex(p.color) }, onclick: () => pick(uid) },
      avatar(p.avatar, p.color, avatarSize), h('b', p.name), line ? h('small', line(uid)) : null);
  }));
  const el = h(`div.${cls(prefix, 'call')}`, { 'data-nogesture': '' }, h(`div.${cls(prefix, 'kicker')}`, 'CALL THE WINNER'),
    h('p', intro ? intro(alive.length) : `${alive.length} left — a right call earns game-night points.`), grid, h(`div.${cls(prefix, 'call-bar')}`, bar));
  overlay.append(el);
  function pick(uid) {
    if (picked || serverNow() > endsAt) return;
    picked = uid;
    if (sfx) sfx();
    vibrate(12);
    dbUpdate(dbRef(path), { w: uid, at: serverTimestamp() }).catch(e => toast(String(e.message || e).toUpperCase(), 'err'));
    close(`YOUR CALL · ${player(uid).name}`);
  }
  function close(msg) {
    el.classList.add('is-done');
    setTimeout(() => el.remove(), 300);
    onState(msg || 'NO CALL');
  }
  const iv = setInterval(() => {
    const left = endsAt - serverNow();
    bar.style.transform = `scaleX(${Math.max(0, left / CALL_MS)})`;
    if (left <= 0 || picked || (isDestroyed && isDestroyed()) || (ended && ended())) { clearInterval(iv); if (!picked) close('NO CALL'); }
  }, 100);
  return el;
}
