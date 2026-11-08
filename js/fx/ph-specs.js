// PENTHOUSE's dial (DM2 — design "A · THE DIAL", drawn in code by js/fx/ph-dial.js) as data (PURE — no imports; vault/hero.js + vault/layout.js
// read the hero boxes). The scene is 1000 × 630 units (a full card): the pivot at (740, 400) — the hero ~74 % across, the left 42 % dark for the
// name. A full card COVERS (centred); the SLIM strip has its OWN band (20–52 % down — the upper floors, the arch + PH) at the strip's height, the
// pivot ~0.80 across (THE SLIM-CARD LONG-NAME STANDARD); PH clear of the gem corner on both.
export const SW = 1000, SH = 630, C = Object.freeze({ x: 740, y: 400 });
export const R_OUT = 190, R_IN = 172, R_NUM = 240, R_WEDGE = 160, R_HUB = 46;
export const DEG = Math.PI / 180;
/** the floors: 1 … 9 then PH, from 188° (left, just under the horizontal) up to ~74° (PH — up and right of the top) */
export const FLOORS = Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'PH']);
export const ANG = Object.freeze(FLOORS.map((_, i) => (188 - 12.7 * i) * DEG));
export const PH = FLOORS.length - 1;
export const PH_BAND = Object.freeze([0.2, 0.52]);
/** a point at math angle a (radians, counter-clockwise from +x) and radius r round the pivot, in scene units (y down) */
export const pt = (a, r) => [C.x + Math.cos(a) * r, C.y - Math.sin(a) * r];
/** the scene → slot mapping: { k, ox, oy } */
export function phMap(w, h, full) {
  if (full) { const k = Math.max(w / SW, h / SH); return { k, ox: (w - SW * k) / 2, oy: (h - SH * k) / 2 }; }
  const k = h / ((PH_BAND[1] - PH_BAND[0]) * SH);
  return { k, ox: w * 0.8 - C.x * k, oy: -PH_BAND[0] * SH * k };
}
/** the strip's hero: the arch + its floors up to PH (scene units); the full card's: the dial + the doors' top */
export const PH_HERO = Object.freeze([C.x - 150, C.y - R_NUM - 30, 235, R_NUM - 80]);   // (the upper arch, the needle's tip + PH — clear of the gem's bottom-right corner)
export const PH_HERO_FULL = Object.freeze([C.x - R_NUM - 30, C.y - R_NUM - 40, (R_NUM + 30) * 2, R_NUM + 40 + 160]);
