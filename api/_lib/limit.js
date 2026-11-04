// A fixed-window rate limit under rl/{bucket} (server-only, default-deny): take() → true if one more is allowed now (and counts it).
// Shared by THE BOARD's REPORT (board.js) and THE ROOM PUSH (radio.js#roomOpened — FR6 FIXES A, C4).
import { ref } from './fb.js';

export async function take(bucket, max, windowMs, now = Date.now()) {
  const r = await ref(`rl/${bucket}`).transaction(cur => {
    const x = cur && now - cur.t < windowMs ? cur : { n: 0, t: now };
    if (x.n >= max) return undefined;
    return { n: x.n + 1, t: x.t };
  });
  return r.committed;
}
