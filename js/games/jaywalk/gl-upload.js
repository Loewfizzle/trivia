// JAYWALK FINAL — THE UPLOADS (Grok's review, Nov 24; docs/jaywalk.md "FINAL"): an instanced kind sends the GPU only the instances it uses,
// through three r160's own update ranges. PURE (no three import): tests/jaywalk-final.test.mjs drives it with a stand-in attribute.
/** `cnt` floats of attribute `a` from the start → the GPU at the next draw; nothing at all when the kind is empty (→ true = an upload asked) */
export function uploadRange(a, cnt) {
  if (!(cnt > 0)) return false;
  a.clearUpdateRanges(); a.addUpdateRange(0, cnt); a.needsUpdate = true;
  return true;
}
