// LOBBY 2.0 A — THE SAVE-YOUR-KEY POP-UP's decision (PURE — profile/keypop.js shows it): a key on this device, not marked saved, at least one
// counted match → 'show' (once); after it was shown or LATER → 'dot' (on YOU, until saved); otherwise 'none'.
export function keyPopDecide({ key = null, saved = false, kp = null, matches = 0 } = {}) {
  if (!key || saved) return 'none';
  if (kp === 'later' || kp === 'shown') return 'dot';
  return matches >= 1 ? 'show' : 'none';
}
