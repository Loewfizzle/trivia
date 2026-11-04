// FR6 FIXES A (G7) — THE LIVE-SITE GUARD. LOBBY 2.0 B's repros ran on neonspeakeasy.com: three real rooms → real "A ROOM JUST OPENED"
// pushes on the owner's phone + watch, and five throwaway players got PROFILES + MEMBER NUMBERS (Nº 42–46). The owner's rule: tests +
// repros run on the EMULATORS (localhost). Every page a test browser opens goes through guardUrl() (kit/puppeteer.mjs patches page.goto;
// wk-room.mjs + scripts call it themselves): a non-local address is REFUSED unless LIVE=1 is set on purpose — and then &test=1 rides on
// every page (THE TEST FLAG: js/identity.js#testMode — no profile, no member number, the room push silent). docs/testing.md.

/** a local development host: localhost, 127.0.0.1, [::1], *.localhost, *.test */
export function isLocalUrl(u) {
  let x; try { x = new URL(String(u)); } catch { return true; }   // (not an address: about:blank, a relative path — nothing to guard)
  if (!/^https?:$/.test(x.protocol)) return true;                   // (about:, data:, file:, blob:)
  const h = x.hostname.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1' || h.endsWith('.localhost') || h.endsWith('.test');
}
export const liveAllowed = (env = process.env) => env.LIVE === '1';
/** the page's address with THE TEST FLAG on it */
export function withTestFlag(u) {
  const x = new URL(String(u));
  if (x.searchParams.get('test') !== '1') x.searchParams.set('test', '1');
  return x.toString();
}
/** u if it is local; the live site only with LIVE=1 (and then with &test=1); otherwise it throws */
export function guardUrl(u, who = 'a test', env = process.env) {
  if (isLocalUrl(u)) return u;
  if (!liveAllowed(env)) {
    const host = (() => { try { return new URL(String(u)).host; } catch { return String(u); } })();
    throw new Error(`LIVE-SITE GUARD: ${who} refused ${host} — tests + repros run on the emulators (localhost). Only on purpose: LIVE=1 (it adds &test=1 to every page: no profile, no member number, no push).`);
  }
  return withTestFlag(u);
}
