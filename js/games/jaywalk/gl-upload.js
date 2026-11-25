// JAYWALK FINAL — THE UPLOADS (Grok's review, Nov 24; docs/jaywalk.md "FINAL"): an instanced kind sends the GPU only the instances it uses,
// through three r160's kept `_updateRange` record (the owner's correction: NEVER addUpdateRange / clearUpdateRanges — each call allocates a
// range record, every frame: garbage = stutter). The ONLY change from J4's write: an EMPTY kind asks for no upload at all (three resets the
// record's count to −1 after each upload, so an empty kind used to send its WHOLE array every frame). Zero garbage: no record, list or
// closure is made here. PURE (no three import): tests/jaywalk-final.test.mjs drives it with a stand-in attribute.
/** LAST MILE — THE VISIBILITY GUARD: an EMPTY kind is hidden by its own done(), and shown again by it ONLY while that hide is still its own —
 *  `hid` is dropped once its owner set the visibility (kind().show) or the mesh is found shown (someone showed it since). `n` = the instances
 *  this frame. → the new `hid`. Zero garbage. */
export function emptyHide(m, n, hid) { if (hid && m.visible) hid = false; if (n > 0) { if (hid) m.visible = true; return false; } if (m.visible) { m.visible = false; return true; } return hid; }
/** `cnt` floats of attribute `a` from the start → the GPU at the next draw; nothing at all when the kind is empty */
export const uploadRange = (a, cnt) => { if (!(cnt > 0)) return; const u = a._updateRange; if (u) { u.offset = 0; u.count = cnt; } a.needsUpdate = true; };
