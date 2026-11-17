// JAYWALK — THE PAINTED SKYLINES (H5C — docs/jaywalk.md "THE PAINTED SKYLINES"; the owner, Nov 16: the drawn day landmarks looked like
// clip-art). PURE (no DOM, no clock, no three.js): WHICH picture the skyline band shows at a lane, which one to fetch ahead, where the
// band rests so the landmark is on a phone's screen. The view (night.js) loads + cross-fades them.
//   · BY DAY: 8 PAINTED pictures (Grok) — the SAME picture as skyline-day with that area's landmark painted in (the same crop, horizon
//     + sea identical: a cross-fade moves nothing but the landmark). The opening (lanes 0–49) keeps skyline-day; the loop (lane 450 +)
//     repeats the 8. Only the CURRENT picture + the NEXT one (fetched quietly as the kid nears its gate) are ever held — never all 8,
//     nothing at the boot.
//   · BY NIGHT: the one night picture; the neon-outline landmarks (skymarks.js) stand on it as before.
// A VIEW's table: no rule, no replay, no server file reads it.
import { area } from './course.js';

/** the areas' ids, in the course's order (areas.js#LOOKS / skymarks.js#MARK_IDS) — a picture's file is named by it */
export const SKY_IDS = Object.freeze(['docks', 'fish', 'yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield']);
/** the next area's picture is fetched once the kid is within this many lanes of its gate */
export const SKY_AHEAD = 14;
/** the cross-fade at a gate (ms) */
export const SKY_FADE_MS = 2000;
/** the band = the top 24 % of the stage; its picture is 1280 × 432 and covers the band's height */
export const SKY_BAND = 0.24, SKY_ASPECT = 1280 / 432;
/**
 * WHERE THE LANDMARK STANDS: a phone shows the middle ≈ 65 % of the picture — the landmarks are painted in its left / right third (the
 * middle top is the lane count's). The band RESTS this many % of the picture's width off its centre while the kid is in the area (+ =
 * the picture's RIGHT side comes in), so the landmark is on the screen; the slide with the kid's column rides on top of it.
 */
export const SKY_BIAS = Object.freeze({ docks: 12, fish: 6, yard: 13, bridge: -13, downtown: 2, canal: 7, lighthouse: -13.5, airfield: 11 });

/** the area's id at a lane ('' = the opening: lanes 0–49) */
export const skyId = lane => { const a = area(Math.max(0, Math.floor(lane))); return a.index < 0 ? '' : SKY_IDS[a.index]; };
/** the picture's file for a look + an area's id */
export const skyFile = (look, id) => (look !== 'day' ? 'skyline-night.webp' : id ? `skyline-day-${id}.webp` : 'skyline-day.webp');
/**
 * what the band needs with the kid at `lane` in `look` → { now: the picture on the band, next: the one to fetch ahead (null = none),
 * bias: where the band rests (% of the picture's width) }. By night there is ONE picture: nothing to fetch ahead, no rest offset.
 */
export function skyPlan(lane, look) {
  const id = skyId(lane), now = skyFile(look, id);
  if (look !== 'day') return { now, next: null, bias: 0 };
  const nx = skyFile(look, skyId(lane + SKY_AHEAD));
  return { now, next: nx === now ? null : nx, bias: SKY_BIAS[id] || 0 };
}
/** the pictures to HOLD for a plan (the current + the next — never more than two) */
export const skyHeld = plan => (plan.next ? [plan.now, plan.next] : [plan.now]);
/** how far the picture may move off its centre (% of its own width) before the band's edge would show, on a w × h stage */
export const skyRoom = (w, h) => (w > 0 && h > 0 ? Math.max(0, (1 - w / (h * SKY_BAND * SKY_ASPECT)) * 50 - 0.25) : 0);
/** the band's offset: the rest + the slide, kept inside the room */
export const skyShift = (bias, slide, room) => { const v = bias + slide; return v > room ? room : v < -room ? -room : v; };
