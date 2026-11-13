// THE ERRORS GROUP (Nov 12 night — the owner's /admin: "Linux" stalls + BOOT HANGs from HeadlessChrome, Vercel's screenshot robot, Lighthouse) —
// BOTS OUT OF /admin. PURE (the phone: js/errlog.js skips sending; the server: api/log.js drops a bot's error or report — an old cached page
// can't send one either). A real iPhone / Android / desktop browser is NEVER a bot here (tests/errors-group.test.mjs — real UA strings).
const BOT_RE = /HeadlessChrome|\bHeadless\b|Lighthouse|PageSpeed|PTST|GTmetrix|Pingdom|UptimeRobot|vercel(?:bot|-screenshot|-favicon)|\bVercelbot\b|\bbot\b|bot\/|crawler|spider|puppeteer|playwright|PhantomJS|Googlebot|bingbot|facebookexternalhit|Slackbot|Twitterbot|Discordbot/i;
/** PURE: a user-agent string → a bot / a headless robot? */
export const isBotUA = ua => !!ua && BOT_RE.test(String(ua));
/** PURE — the server's rule (api/log.js): a bot's report is dropped on a DEPLOYED server (Vercel sets VERCEL_ENV; BOTS_OUT=1 forces it — the
 *  tests); a local server (scripts/serve.mjs) keeps every report, so the test browsers' own reports still land on the emulators */
export const dropAsBot = (ua, env = {}) => !!(env.VERCEL_ENV || env.BOTS_OUT === '1') && isBotUA(ua);
/** PURE — the phone's rule (js/errlog.js): a robot browser (navigator.webdriver, a bot UA) sends nothing — except on a local / emulator page */
export const quietBot = ({ ua = '', webdriver = false, host = '', search = '' } = {}) => !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) && !/[?&]emu\b/.test(search) && (!!webdriver || isBotUA(ua));
