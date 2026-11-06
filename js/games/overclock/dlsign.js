// OVERCLOCK — THE DUMB LUCK SIGN (OC5): the challenge's title as a CRAFTED NEON SIGN on the title slam — not styled text. Two words of glass
// tube (the city's tube alphabet, victory.js#neonSign): DUMB in hot pink over LUCK in amber, the unlit glass visible under each tube; the
// letters POWER UP one by one with a real neon stutter (each its own uneven flicker — opacity only, css/overclock.css .oc-dlsign), a
// pre-rendered glow; the hum (sfx.js#ocHum) plays with it. Reduced motion = the lit sign.
import { h } from '../../ui/dom.js';
import { neonSign } from './victory.js';

export const DL_SIGN_COLORS = Object.freeze({ dumb: '#ff3fa4', luck: '#ffc93a' });
/** the sign (an element) — `lit`: already on (a late mount) */
export function dumbLuckSign({ lit = false } = {}) {
  const sign = neonSign([{ text: 'DUMB', color: DL_SIGN_COLORS.dumb }, { text: 'LUCK', color: DL_SIGN_COLORS.luck }], { delay: 160, step: 70 });
  // each letter's own stutter: a seeded pattern (a, b, c …) so the sign never powers up in lock-step
  [...sign.querySelectorAll('.oc-sign-ch')].forEach((ch, i) => ch.classList.add(`is-fl${(i * 5 + 2) % 4}`));
  return h('div.oc-dlsign', { class: lit ? 'is-lit' : null }, sign);
}
