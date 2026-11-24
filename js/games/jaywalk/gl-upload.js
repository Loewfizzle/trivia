// JAYWALK FINAL — THE UPLOADS (Grok's review, Nov 24; docs/jaywalk.md "FINAL"): an instanced kind sends the GPU only the instances it uses,
// through three r160's kept `_updateRange` record (the owner's correction: NEVER addUpdateRange / clearUpdateRanges — each call allocates a
// range record, every frame: garbage = stutter). The ONLY change from J4's write: an EMPTY kind asks for no upload at all (three resets the
// record's count to −1 after each upload, so an empty kind used to send its WHOLE array every frame). Zero garbage: no record, list or
// closure is made here. PURE (no three import): tests/jaywalk-final.test.mjs drives it with a stand-in attribute.
/** `cnt` floats of attribute `a` from the start → the GPU at the next draw; nothing at all when the kind is empty */
export const uploadRange = (a, cnt) => { if (!(cnt > 0)) return; const u = a._updateRange; if (u) { u.offset = 0; u.count = cnt; } a.needsUpdate = true; };
