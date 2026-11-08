// THE CITY HOLD (DM2): anything full-screen over the title (a full card — vault/full.js; THE DAILY SCREEN + a daily run — screens/daily.js)
// holds the city's frames underneath (harbor/scene.js listens for 'vl-cover'). Holds COUNT, so one closing never wakes the city while another
// is still on top. → release()
let n = 0;
const tell = on => { try { window.dispatchEvent(new CustomEvent('vl-cover', { detail: on })); } catch { /* not a browser */ } };
export function holdCity() {
  if (!n++) tell(true);
  let done = false;
  return () => { if (done) return; done = true; if (!--n) tell(false); };
}
export const cityHeld = () => n > 0;
