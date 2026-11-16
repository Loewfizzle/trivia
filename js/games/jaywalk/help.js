// JAYWALK — HOW TO PLAY (H3 — docs/jaywalk.md "HOW TO PLAY"): its RULES + its tab, BUILT HERE (never a boot file — THE BOOT BUDGET is full;
// ui/help.js is in the boot) and READY TO MOVE IN: at go-live `RULES` goes into ui/help.js as `RULES.jaywalk` and `TAB` into its TAB table
// (tests/registration.test.mjs#JAYWALK_WAITS.help). Until then a JAYWALK run (☰ → HOW TO PLAY) and its card show it through the help's
// hub — globalThis.__nsHelp[id] → the sheet's body (the cartridge registers it: index.js). Short, PICTURE-LED, readable by a kid: one
// small drawing + one line each. PURE data + a DOM builder; no pills, no emoji.
import { h } from '../../ui/dom.js';
import { preloadSheets } from '../lazy-view.js';

/** the shared help's shape (ui/help.js RULES[id]): a one-line goal, then short sections */
export const RULES = Object.freeze({
  goal: 'Hop across the night harbor. One life. How far can you get?',
  sections: [
    ['HOW TO MOVE', [
      'TAP to hop forward.',
      'SWIPE left or right to step sideways.',
      'SWIPE down to step back.',
    ]],
    ['WATCH OUT', [
      'ROADS: wait for a gap in the cars.',
      'WATER: ride the logs. Never touch the water.',
      'RAILS: the red lights flash, then the train comes.',
      'THE LIGHTS go out behind you. Keep moving.',
    ]],
  ],
});
/** its tab's two letters (until its tile's art is in ui/game-art.js) */
export const TAB = 'JW';

// one small drawing a line (a 24 × 24 stroke icon, the line's own colour)
const svg = (d, c) => `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const PICS = [
  [svg('<circle cx="12" cy="17" r="3"/><path d="M12 12V3M8 7l4-4 4 4"/>', '#ff7fd6'),                                             // tap: a finger's dot + an arrow up
    svg('<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>', '#8ff0ff'),                                                               // swipe sideways
    svg('<path d="M12 4v15M8 15l4 4 4-4"/>', '#8ff0ff')],                                                                           // swipe down
  [svg('<path d="M3 15h18M5 15l1.6-4.5h8.2L17.6 15M19 15v-2.5l-1.4-2"/><circle cx="7.5" cy="16.5" r="1.7"/><circle cx="16" cy="16.5" r="1.7"/>', '#ffd36a'),   // a car
    svg('<rect x="4" y="8" width="16" height="6" rx="3"/><path d="M2 18c2-1.6 3.5-1.6 5 0s3 1.6 5 0 3-1.6 5 0 3 1.6 5 0"/>', '#7fb8ff'),                      // a log on the water
    svg('<path d="M12 21V11"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="7" r="3"/><path d="M5 21h14"/>', '#ff5a5a'),                                    // the signal's two red lights
    svg('<path d="M3 20h18M3 15h18"/><path d="M5 10h14" opacity=".55"/><path d="M8 5h8" opacity=".25"/>', '#b8a6ff')],                                         // the lights going out
];

/** the sheet's body for the help's hub → [nodes] (the same classes the shared help draws with + one drawing a line) */
export function helpBody() {
  preloadSheets('jaywalk');
  return [
    h('p.help-goal', RULES.goal),
    ...RULES.sections.map(([title, items], s) => h('section.help-section',
      h('h3.help-h', title),
      h('ul.help-list.jw-help', items.map((t, i) => h('li', h('span.jw-help-pic', { html: PICS[s][i] }), h('span', t)))))),
  ];
}
/** the cartridge registers its rules with the shared help (THE STALE-MODULE RULE's hub — a lazy chunk never needs a new export of a boot file) */
export function registerHelp() { (globalThis.__nsHelp ||= {}).jaywalk = helpBody; }
