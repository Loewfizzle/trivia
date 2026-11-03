// EVERY BOTTOM SHEET ABOVE SAFARI's TOOLBAR (THE VAULT 1B — the owner's BRING YOUR CARD sheet had its bottom border cut off under iOS
// Safari's bottom toolbar). Sheets float now (components.css "EVERY BOTTOM SHEET FLOATS": their whole rounded border, a gap above the
// safe area); this keeps --vv-ob on <html> = how much of the layout viewport's bottom the VISUAL viewport doesn't show right now (Safari's
// bars collapsing / expanding), so a sheet rides above whatever covers the bottom. A keyboard is the chat's own business (--kb, chat/ui.js):
// anything over 140 px counts as a keyboard, not a toolbar, and is left out. Sizes from visualViewport events only (never a frame loop).
export function installVV() {
  const vv = typeof window !== 'undefined' && window.visualViewport;
  if (!vv || installVV.done) return;
  installVV.done = true;
  let last = -1;
  const set = () => {
    const ob = Math.max(0, Math.round(window.innerHeight - (vv.offsetTop + vv.height)));
    const v = ob > 140 ? 0 : ob;
    if (v !== last) { last = v; document.documentElement.style.setProperty('--vv-ob', `${v}px`); }
  };
  vv.addEventListener('resize', set); vv.addEventListener('scroll', set); window.addEventListener('resize', set);
  set();
}
installVV();
