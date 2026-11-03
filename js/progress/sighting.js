// CITY SIGHTINGS — the phone's side of a tap on a legendary (PROGRESSION B). Lazy: loaded on the first tap. The reaction already started
// in the scene (screens/harbor/sight-react.js); here: the claim (js/profile/sightings.js — the server decides) and the moment on top.
import { claimSighting } from '../profile/sightings.js';

/** the last answer per sighting this page (tests + &debug) */
export const last = { tap: null, claim: null };

export async function onSighting(sg) {
  last.tap = { id: sg.id, live: sg.live, at: Date.now() };
  const res = await claimSighting({ id: sg.id, t: sg.t, tz: sg.tz, live: sg.live });
  last.claim = res;
  return res;
}
