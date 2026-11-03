// css/vault.css, loaded once by whatever shows a strip, an emblem or a glow (THE VAULT 2A: its own tiny module — the name glows + the
// Gilded card need it without the effect library).
/** css/vault.css on any page that shows a strip (the app loads it with the profile's sheet; a page that didn't gets it here) */
let sheetP = null;
export function vaultSheet() {
  if (sheetP) return sheetP;
  sheetP = new Promise(res => {
    if (typeof document === 'undefined' || document.querySelector('link[data-vl]') || [...document.styleSheets].some(x => x.href && x.href.endsWith('/css/vault.css'))) { res(); return; }
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/vault.css'; l.dataset.vl = '1';
    l.onload = () => res(); l.onerror = () => res(); document.head.append(l); setTimeout(res, 2500);
  });
  return sheetP;
}
