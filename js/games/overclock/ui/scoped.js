// FR7 FIXES A — OC3 (PURE): a challenge screen's OWN api. Each screen (ui/*.js) gets one built for ITS challenge: its writes — part, progress,
// step, finish, fx, pick, sfx, the key handler — do nothing once that challenge is no longer the current one (`isLive()` false). SORT IT's
// removed screen kept dealing and locked the NEXT challenge with a zero: the view's step() guarded on the CURRENT challenge, not the one the
// screen was built for. Everything else (the room's reads: me, uids, boards, now, …) passes through unchanged.
export const GUARDED = Object.freeze(['part', 'progress', 'step', 'finish', 'fx', 'pick', 'sfx']);
export function scopedApi(api, own, isLive) {
  const out = Object.defineProperties({}, Object.getOwnPropertyDescriptors(api));
  for (const k of GUARDED) {
    if (typeof api[k] !== 'function') continue;
    const fn = api[k];
    Object.defineProperty(out, k, { value: (...a) => (isLive() ? fn.apply(api, a) : undefined), enumerable: true });
  }
  Object.defineProperty(out, 'chal', { get: () => own, enumerable: true });
  Object.defineProperty(out, 'key', { set(fn) { if (!fn || isLive()) api.key = fn; }, enumerable: true });
  Object.defineProperty(out, 'live', { value: () => !!isLive(), enumerable: true });
  return out;
}
