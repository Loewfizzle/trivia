// THE BENCH OVER THE TAXI (Nov 12 night — the owner's friend: a taxi pulling up at THE CAB STAND drew UNDER the bench). The two benches' sharp
// overlays live on THE CRISP LAYER (scene.js "PROM — THE STILL PIECES SHARP"), above the city's canvas; they re-draw the PEOPLE in front of them
// (people.js#redrawOver) — never a vehicle. So every vehicle the city draws REPORTS its screen box + its depth here, this frame (motorcar.js — the
// cab stand's taxi, the front street's traffic, the raid's car; people.js — the back road's cars + the buses): no layout read, the box the drawer
// already worked out. A bench with a vehicle NEARER the camera over its box crossfades its overlay out (scene.js — ~0.25 s, the rain's wet9 way):
// the city's own bench under it — already in the right depth order — shows; it fades back once the car has passed.
const list = [];
/** a new frame (scene.js — after the crisp layer has read it) */
export function vehiclesReset() { list.length = 0; }
/** a vehicle drawn this frame: its screen box (pt) + its depth z (nearer = smaller) */
export function reportVehicle(x, y, w, h, z) { if (list.length < 64 && w > 0 && h > 0 && Number.isFinite(z)) list.push({ x, y, w, h, z }); }
const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/** PURE over this frame's list: is any vehicle nearer than z over box? */
export const vehicleInFront = (box, z) => list.some(v => v.z < z && hit(v, box));
/** (tests) this frame's vehicles */
export const vehiclesNow = () => list.map(v => ({ ...v }));
