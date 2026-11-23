// JAYWALK — THE PAINTED SKYLINES (H5C · H6B — docs/jaywalk.md "THE PAINTED SKYLINES"). PURE: WHICH picture the band shows at a lane
// The long notes: docs/games/jaywalk-notes.md
import { area } from './course.js';

/** the areas' ids, in the course's order (areas.js#LOOKS) — a picture's file is named by it */
export const SKY_IDS = Object.freeze(['docks', 'fish', 'yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield']);
/** the next area's picture is fetched once the kid is within this many lanes of its gate */
export const SKY_AHEAD = 14;
/** the cross-fade at a gate (ms) · THE LOOK SWITCH's (H6B — day ↔ night: the whole band, never a jump) */
export const SKY_FADE_MS = 2000, SKY_LOOK_MS = 1500;
/** the band = the top 24 % of the stage; its picture is 1280 × 432 and covers the band's height */
export const SKY_BAND = 0.24, SKY_ASPECT = 1280 / 432;
/** … */
export const SKY_BIAS = Object.freeze({ docks: 14.5, fish: 11, yard: 17, bridge: -17, downtown: 4.25, canal: 7, lighthouse: -16.5, airfield: 13 });
export const SKY_BIAS_NIGHT = Object.freeze({ docks: 7.5, fish: 15, yard: 15, bridge: -14, downtown: 5.25, canal: 12, lighthouse: -17, airfield: 10.5 });
/** … */
export const SKY_MAX = Object.freeze({
  day: Object.freeze({ docks: 14.75, downtown: 5, airfield: 13.5 }),
  night: Object.freeze({ docks: 7.5, downtown: 5.5, airfield: 10.75 }),
});
/** … */
export const SKY_OPEN_DAY = Object.freeze({ bias: 6.5, min: 5.5 });
/** … */
export const SKY_PIN = -17.25, SKY_MATCH_PIN = Object.freeze(['bridge', 'lighthouse']);
/** THE NIGHT's LIFE, in % of the picture: [x, y, delay s] the red aviation lights · [x, y, w, h, delay s] the windows that flicker — … */
export const SKY_LIGHTS = Object.freeze([[31.7, 51.4, 0], [62.6, 64.8, 1.7], [64.2, 65, 1.7], [66.4, 56, 0.9], [67.7, 56.2, 0.9], [88.8, 53.2, 0.4], [93.8, 64.1, 1.3], [10.9, 56.5, 2.1]]);
export const SKY_NEON = Object.freeze([[24, 72, 2.5, 5.8, 0], [33.6, 66.9, 1.8, 8.3, 2.2], [80.2, 75.9, 2.6, 3.5, 3.7], [8.5, 77.1, 2.3, 3, 1.1], [75.3, 72.2, 1.8, 4.6, 4.4]]);
export const SKY_OFF = Object.freeze({
  docks: { l: [1, 3, 4, 5], n: [2, 4] }, fish: { l: [], n: [2, 4] }, yard: { l: [1, 3, 4, 6], n: [2, 4] }, bridge: { l: [], n: [0, 1, 3] },
  downtown: { l: [1, 2, 3, 4], n: [2, 4] }, canal: { l: [1, 2, 3, 4, 5, 6], n: [2, 4] }, lighthouse: { l: [], n: [0, 3] }, airfield: { l: [1], n: [2, 4] },
});
const NONE = Object.freeze({ l: Object.freeze([]), n: Object.freeze([]) });
/** the lights + windows that are OFF while this picture is on the band ('' / a day picture = none) */
export const skyOff = file => { const m = /^skyline-night-([a-z]+)\.webp$/.exec(file || ''); return (m && SKY_OFF[m[1]]) || NONE; };

/** the area's id at a lane ('' = the opening: lanes 0–49) */
export const skyId = lane => { const a = area(Math.max(0, Math.floor(lane))); return a.index < 0 ? '' : SKY_IDS[a.index]; };
/** the picture's file for a look + an area's id */
export const skyFile = (look, id) => { const l = look === 'day' ? 'day' : 'night'; return id ? `skyline-${l}-${id}.webp` : `skyline-${l}.webp`; };
/** … */
export function skyPlan(lane, look, match = false) {
  const id = skyId(lane), now = skyFile(look, id), nx = skyFile(look, skyId(lane + SKY_AHEAD)), day = look === 'day';
  const pin = match && SKY_MATCH_PIN.includes(id), max = pin ? SKY_PIN : (day ? SKY_MAX.day : SKY_MAX.night)[id], open = !id && day;
  return { now, next: nx === now ? null : nx, bias: pin ? SKY_PIN : open ? SKY_OPEN_DAY.bias : (day ? SKY_BIAS : SKY_BIAS_NIGHT)[id] || 0, max: max == null ? 99 : max, min: open ? SKY_OPEN_DAY.min : -99 };
}
/** the pictures to HOLD for a plan (the current + the next — never more than two) */
export const skyHeld = plan => (plan.next ? [plan.now, plan.next] : [plan.now]);
/** how far the picture may move off its centre (% of its own width) before the band's edge would show, on a w × h stage */
export const skyRoom = (w, h) => (w > 0 && h > 0 ? Math.max(0, (1 - w / (h * SKY_BAND * SKY_ASPECT)) * 50 - 0.25) : 0);
/** the band's offset: the rest + the slide, kept inside the room — and never past `max` (the plan's: the count stays clear, a match's pin) */
export const skyShift = (bias, slide, room, max = 99, min = -99) => { const v = bias + slide, hi = Math.max(-room, Math.min(room, max)), lo = Math.min(hi, Math.max(-room, min)); return v > hi ? hi : v < lo ? lo : v; };
