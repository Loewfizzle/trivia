// JAYWALK — THE LAB's small memory (H2): what the owner picked on THIS phone — the camera's ZOOM (7 · 8 · 9) + ANGLE (H2B), a sound's A / B. localStorage only
// (`jw:lab:*`) — never a server call, never a profile key. A private window simply forgets.
const KEY = 'jw:lab:';
export const getPref = (k, d) => { try { const v = localStorage.getItem(KEY + k); return v == null ? d : v; } catch { return d; } };
export const setPref = (k, v) => { try { localStorage.setItem(KEY + k, String(v)); } catch { /* not remembered: fine */ } };
