// CITY 2.0 — THE HARBOR: THE SIGN-DIM HOOK (cleanup C1.5; plan.md depth rule 2; docs/harbor/passes/cleanup-c15.md). PURE.
// The sky's MESSAGES (the drone show, skywriting, skytyping, the banner plane — Part 6b) fly IN FRONT of the logo, which dims while
// they play, and the tagline fades (the banner flies under SPEAKEASY through the tagline's band). Any piece asks with an id and
// lets go with the same id; several at once resolve to the dimmest; when the last one lets go the sign comes back. The scene owns
// one of these (harbor().dimSign / scene.signDim()), title.js turns the level into the sign's opacity (CSS, a smooth transition).
// Built + tested, not used yet: Part 6b's pieces call it.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
/** how a message dims the sign unless it asks otherwise: the logo to 35 %, the tagline gone, over 1.2 s */
export const SIGN_DIM_DEFAULT = Object.freeze({ logo: 0.35, tag: 0, ms: 1200 });
const REST = Object.freeze({ logo: 1, tag: 1 });

/**
 * @param {(d: { logo: number, tag: number, ms: number, by: string[] }) => void} [onChange] called whenever the resolved level changes
 * @returns {{ set(id: string, o?: { logo?: number, tag?: number, ms?: number } | null): void, clear(id: string): void, now(): object, ids(): string[] }}
 *   set(id, o)  ask (o: the logo's opacity 0..1, the tagline's 0..1, the fade's ms); set(id, null) = clear(id)
 *   now()       { logo, tag, ms, by } — the dimmest of the requests (logo + tag each), the fade time of the newest change; at rest 1 / 1
 */
export function createSignDim(onChange) {
  const asks = new Map();
  let key = '1|1', ms = SIGN_DIM_DEFAULT.ms;
  function now() {
    if (!asks.size) return { ...REST, ms, by: [] };
    let logo = 1, tag = 1;
    for (const a of asks.values()) { logo = Math.min(logo, a.logo); tag = Math.min(tag, a.tag); }
    return { logo, tag, ms, by: [...asks.keys()] };
  }
  function publish(fadeMs) {
    const d = now(), k = `${d.logo}|${d.tag}`;
    if (k === key) return;
    key = k; ms = fadeMs; d.ms = fadeMs;
    if (onChange) onChange(d);
  }
  function set(id, o) {
    if (!id) return;
    if (o == null) { clear(id); return; }
    const a = { logo: clamp01(o.logo ?? SIGN_DIM_DEFAULT.logo), tag: clamp01(o.tag ?? SIGN_DIM_DEFAULT.tag), ms: Math.max(0, +(o.ms ?? SIGN_DIM_DEFAULT.ms) || 0) };
    asks.set(String(id), a);
    publish(a.ms);
  }
  function clear(id) {
    const a = asks.get(String(id));
    if (!a) return;
    asks.delete(String(id));
    publish(a.ms);
  }
  return { set, clear, now, ids: () => [...asks.keys()] };
}
