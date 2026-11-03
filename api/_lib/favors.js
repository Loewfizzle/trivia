// CALL IN A FAVOR (PROGRESSION B) — POST /api/profile { action: 'favor', jack, room, text?, colour?, show? }: a player's earned FAVOR token
// (pstats/{pid}/fv — the 100-night streak's reward, PROGRESSION A) fires ONE of the crew's jacks for THE ROOM THEY'RE IN, through the
// radio's own path (api/_lib/radio.js#favorMoment: role 'favor' — in the room, the crew's per-night limits + cooldown, the words' filter,
// never a sighting). THE TOKEN IS SPENT ONLY WHEN THE SERVER ACCEPTS: reserved in a transaction, handed back if the radio refuses.
// Dormant until LOBBY 2.0 makes the lobby the live city (the room's copy is written now — its phones play it then); a JUST-ME preview
// plays it on the player's own city first (the phone: js/progress/favor.js — nothing spent).
import { ApiError } from './http.js';
import { ref } from './fb.js';
import { favorMoment } from './radio.js';

export async function callFavor(pid, uid, body, now = Date.now()) {
  let took = false;
  await ref(`pstats/${pid}/fv`).transaction(cur => { const n = Number(cur) || 0; if (n < 1) { took = false; return undefined; } took = true; return n - 1; });
  if (!took) throw new ApiError(409, 'no_favor', 'No favors to call in.');
  try {
    const r = await favorMoment(pid, uid, body, now);
    return { ...r, spent: true };
  } catch (e) {
    await ref(`pstats/${pid}/fv`).transaction(cur => (Number(cur) || 0) + 1).catch(() => {});
    throw e;
  }
}
