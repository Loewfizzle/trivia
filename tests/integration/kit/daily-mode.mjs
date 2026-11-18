// CITY G — THE DAILIES' RED TESTS (the Nov 16 8:05 pm + Nov 17 2:50 pm inbox entries: e2e-daily "the DAILY button: Waiting failed", wk-press
// "the DAILY screen opened" ×2 + "SCORES → TODAY: the EVERYONE row … (no row)" — red in the evening AND at 2:34 pm, so never the day's
// clock). The cause: those runs used a server started WITHOUT DAILY_TEST=1. On fresh emulators the dailies' GO-LIVE SWITCH is off
// (api/daily.js 'today' → an empty list → no DAILY button, no DAILY screen); only DAILY_TEST=1 opens them (api/_lib/dailies.js#testingEnv) —
// `serve.mjs --emu` alone does not. Both tests now ask the server first and stop with the fix instead of a timeout.
export const DAILY_MODE_FIX = 'THE SERVER IS NOT IN THE DAILIES\' TEST MODE — on fresh emulators the dailies are switched off: start it with  DAILY_TEST=1 node scripts/serve.mjs <port> --emu  (docs/testing.md)';
/** → true when the server opens the dailies whatever the switch says (THE TEST DAILY is in today's list) — page: a puppeteer / playwright page
 *  on the app (any slot; the call works without a profile) */
export async function dailyTestMode(page) {
  try {
    const ids = await page.evaluate(() => import('/js/profile/api.js').then(m => m.api('daily', { action: 'today' })).then(r => (r && r.dailies ? r.dailies.map(d => d.id) : [])).catch(() => null));
    return Array.isArray(ids) && ids.includes('test');
  } catch { return false; }
}
