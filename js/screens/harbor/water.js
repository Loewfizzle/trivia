// CITY 2.0 — THE HARBOR: the water between the far quay (z 230) and the railing (z 64). Part 1: a flat band, darker toward
// us, with the horizon's light on it. Part 4 builds the real harbor: reflections in perspective, ripples, the lights' smears.
import { rgb, mix } from './shapes.js';
import { groundY } from '../../core/harbor-layout.js';

export function waterSteps(L, T) {
  const cam = L.cam;
  return [x => {
    const y0 = groundY(cam, L.water.z1) - 1, y1 = groundY(cam, L.water.z0) + 1;
    const g = x.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rgb(mix(T.water, T.haze, 0.35))); g.addColorStop(0.25, rgb(T.water)); g.addColorStop(1, rgb(T.waterLo));
    x.fillStyle = g; x.fillRect(0, y0, cam.W, y1 - y0);
    // a few flat ripple lines (grey box): the water reads as water, not a floor
    x.fillStyle = rgb(mix(T.water, T.haze, 0.5), 0.35);
    for (let i = 0; i < 18; i++) { const f = i / 18, y = y0 + (y1 - y0) * f * f; x.fillRect((i * 97) % cam.W, y, 20 + 60 * f, 0.7 + f); }
  }];
}
