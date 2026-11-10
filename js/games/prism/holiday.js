// PRISM DROP — THE HOLIDAY HOOK (PD-5B — the owner, PD-5's split: holiday TOUCHES are cut from the rework; only the HOOK is built, so a holiday
// variant of a look can come later in minutes). PURE (no DOM — tests/prism-pd5b.test.mjs). NOTHING VISIBLE CHANGES NOW: VARIANTS is empty.
//
// ONE small interface: a VARIANT NAME (the city's calendar — core/sky.js#holidayOf ids: halloween · thanksgiving · christmas · nye · valentine ·
// stpatrick · easter · july4) → that look's OVERRIDES, merged over what the look would draw anyway:
//   night: { palette: { edge, frame, well, sparks, flash } }   over neon.js#neonPalette(world) — never the pieces' colours (the families hold:
//                                                                a piece is known by its colour in every world, every holiday)
//   day:   { paper: { base, ink, … any PAPERS field }, world }   over the match's paper (crayon.js#paperOf) + the doodle's world (page.js)
// A NEW HOLIDAY = ONE row in VARIANTS (+ its doodle's drawing in page.js when `world` names a new one). The match picks its variant ONCE, when the
// view mounts (holidayNow — the full holiday days only; never a flip mid-match); the room's phones agree because the calendar is the same day.
import { holidayOf } from '../../core/sky.js';

/** the variants: name → { night?: { palette }, day?: { paper, world } } — EMPTY (no holiday art yet) */
export const VARIANTS = Object.freeze({});
/** the palette keys a holiday may change (never `piece` / `glow` — the colour families) */
export const NIGHT_KEYS = Object.freeze(['edge', 'frame', 'well', 'sparks', 'flash']);

/** today's variant name from the city's calendar (a FULL holiday day only), or null — `table` decides which names have a variant */
export function holidayNow(date = new Date(), table = VARIANTS) {
  const h = holidayOf(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return h && h.full && table[h.id] ? h.id : null;
}

/**
 * THE HOOK: a look's inputs with the holiday's overrides merged in.
 *   look 'night': base { palette } → { palette } (the palette's id gains `+name` so the board's sprite cache rebuilds)
 *   look 'day':   base { paper, world } → { paper, world }
 * No name / no variant / no row for this look → `base` ITSELF (the same object: nothing changes, nothing is rebuilt).
 */
export function withHoliday(look, base, name, table = VARIANTS) {
  const v = name && table[name] && table[name][look];
  if (!v) return base;
  if (look === 'night') {
    const ov = Object.fromEntries(NIGHT_KEYS.filter(k => v.palette && v.palette[k] != null).map(k => [k, v.palette[k]]));
    if (!Object.keys(ov).length) return base;
    return { ...base, palette: { ...base.palette, ...ov, id: `${base.palette.id}+${name}` } };
  }
  if (look === 'day') {
    return { ...base, paper: v.paper ? { ...base.paper, ...v.paper, id: `${base.paper.id}+${name}` } : base.paper, world: v.world || base.world };
  }
  return base;
}
