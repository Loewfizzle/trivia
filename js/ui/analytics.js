// VERCEL WEB ANALYTICS (Nov 12 night — the owner enabled it on the project; docs/harbor.md "THE CDN HOTFIX" counts its requests): Vercel's PLAIN
// script (never the npm package — no build step), injected by this small loader AFTER the page is up — never a tag in the head, never in THE
// BOOT BUDGET or the GENERATED boot preload: the title calls it after THE CITY's reveal (title.js#reveal), THE BOARD after its first paint
// (board/public.js), the 404 page on load. Only those three pages (never /admin, /lab, /daychart or a preview page). Skipped on localhost, the
// emulators (?emu), &test=1, every tests/ page, and robots (navigator.webdriver, a bot UA — core/bot-ua.js). A single-page app: one page view per
// load (no custom events). ~2 requests a visit (the script + its beacon) — the CDN budget (docs/harbor.md).
//   <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
//   <script defer src="/_vercel/insights/script.js"></script>
import { isBotUA } from '../core/bot-ua.js';

export const VA_SRC = '/_vercel/insights/script.js';
/** PURE: may this page load the analytics? { host, search, path, webdriver, ua } */
export function analyticsAllowed({ host = '', search = '', path = '/', webdriver = false, ua = '' } = {}) {
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) || /\.(localhost|test)$/.test(host)) return false;
  const q = new URLSearchParams(search);
  if (q.has('emu') || q.get('test') === '1') return false;
  if (/^\/tests\//.test(path) || /(?:^|\/)(admin|lab|daychart)(?:\.html)?\/?$/.test(path) || /-preview\.html$/.test(path)) return false;
  if (webdriver || isBotUA(ua)) return false;
  return true;
}
let loaded = false;
/** inject Vercel's script once (a page that isn't allowed — nothing) */
export function loadAnalytics() {
  try {
    if (loaded || typeof window === 'undefined') return false;
    if (!analyticsAllowed({ host: location.hostname, search: location.search, path: location.pathname, webdriver: !!navigator.webdriver, ua: navigator.userAgent })) return false;
    loaded = true;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    const s = document.createElement('script'); s.defer = true; s.src = VA_SRC; document.head.appendChild(s);
    return true;
  } catch { return false; }
}
