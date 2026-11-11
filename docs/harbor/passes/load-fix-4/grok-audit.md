NEON SPEAKEASY — BOOT AUDIT (read-only)
Commit audited: 81a39efcad1baf7520c500ce6641ebeb53c05f75 (main, Nov 10 2026 4:03 PM ET). The live www.neonspeakeasy.com files match this commit byte for byte (index.html, sw.js, app.js, title.js, scene.js, clouds.js, party-music.js, synced-songs.js, harbor-loadlog.js all checked).

1. A returning player whose room reconnect stalls never gets past the boot screen
SEVERITY: must-fix · CONFIDENCE: sure (no timeout); likely (the loop it causes)
CODE: js/app.js:437 "const resumed = await resumeSession();" plus js/room.js:66 "await Promise.all(['meta', 'players', `kicked/${state.uid}`].map(k => get(dbRef(...))))". Also js/firebase.js:86-106: the gstatic SDK import, authStateReady() and signInAnonymously() have no timeout either.
WHAT HAPPENS: Someone refreshes during a game, or comes back to the tab, with a saved room. js/app.js:60 keeps the route on 'boot' until ready. Firebase's get() just waits in a queue until the socket connects; I checked SDK 11.10's sendGet_ and it has no timer. So on a weak or captive Wi-Fi the page sits on REJOINING YOUR ROOM. After 12 s the watchdog can't reveal anything (js/app.js:363 "current.key === 'boot') return false"), so it reloads once. The second load repeats this and ends at TAP TO TRY AGAIN, and each tap starts the loop again. The REJOIN button that already exists for this case (js/app.js:443 "resumed === 'error'") is never reached, because get() never rejects.
THE FIX: Race initFirebase plus resumeSession against about 6–8 s. On timeout, set { rejoin: saved.code, ready: true } so the title and its REJOIN button show while the socket keeps trying.

2. Firebase (about 118 KB gzipped, 458 KB of JS) and the profile call run before the reveal on every visit
SEVERITY: should-fix · CONFIDENCE: sure (the order); the cost on an iPhone needs measuring
CODE: js/app.js:356 "if (current && current.key === 'title') { holdBoot(el); return; }" then js/app.js:421 "await dismissBoot(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));"
WHAT HAPPENS: The comment says Firebase starts "once [the title] has painted". Since the LOAD FIX, though, dismissBoot returns as soon as the title is mounted under the boot screen, so initFirebase starts while the city is still baking in the dark. That means the three gstatic modules (app 103 KB, auth 163 KB, database 192 KB raw), the auth restore, a token refresh if the ID token is over an hour old, and the /api/profile 'ensure' call (js/profile/me.js:65) all compete with the bake. A first-time visitor needs none of this until HOST or JOIN.
THE FIX: For players who aren't resuming, wait for cityShown() and then an idle moment (or the first tap) before calling initFirebase.

3. The pre-tap music warm-up downloads up to about 9 MB and holds about 140 MB of decoded audio when nobody has tapped
SEVERITY: should-fix · CONFIDENCE: sure (the math); likely (the memory pressure)
CODE: js/audio/synced-songs.js:72 "const c = new AC(2, 1, 44100);", js/audio/party-music.js:188 "const WARM_MAX = 3, WARM_NEXT_S = 25;", js/audio/synced-songs.js:34 "const KEEP_N = 1, KEEP_MS = 4 * 60_000;"
WHAT HAPPENS: The station songs run about 190–220 s and 2–4 MB each. A full decode is stereo Float32 at 44.1 kHz, about 70 MB of PCM per song. A phone that only looks at the city fetches up to 3 songs. The song currently warmed is held, and the previous one stays in the cache for 4 minutes, so about 140 MB of PCM sits on top of the city's canvas budget. This is the biggest pre-tap data cost on the page, and on 3–4 GB iPhones it raises the chance of a tab reload from memory pressure.
THE FIX: Warm only a slice around where the station will be at the tap (quickDecode's first step, about 12–30 s, is roughly 4–10 MB of PCM), or keep just the compressed bytes and decode at the tap. Don't keep a cooled warm song in the KEEP_N slot.

4. "Music off" and "muted" do not stop the warm-up (the docs say they do)
SEVERITY: should-fix · CONFIDENCE: sure
CODE: js/audio/party-music.js:145 "if (!audioUnlocked()) { warmAhead(T, warm); return false; }". The gate is js/app.js:194 "const warm = !!cityUpAt && ... && !state.code;" and partyMusicTick's 'active' is moodOn(), which is only menuMusic !== 'classic'.
WHAT HAPPENS: Nothing in timeline(), warmAhead() or the app's gate reads settings.musicOff or settings.muted. A player who turned the music off still downloads and decodes up to 3 songs on every visit. docs/audio.md:45 and load-fix-3.md say "never with the music off". After a tap, the synced player is probably still built and fed songs at gain 0 (not traced to the end).
THE FIX: Gate warmAhead, and the creation of the synced player, on !settings.musicOff && !settings.muted.

5. iOS 16.0–16.3 can't load the city at all (a regex lookbehind in the harbor graph)
SEVERITY: should-fix · CONFIDENCE: sure (code); confirm on an iOS 16.3 simulator
CODE: js/chat/logic.js:101 "const RE = new RegExp(`(?<![\\p{L}\\p{N}_'’-])(?:${WORDS.join('|')})...`, 'giu');"
WHAT HAPPENS: Safari only got lookbehind in 16.4. This regex is built at the module's top level and is pulled into scene.js's graph (through core/harbor-radio.js), so the city module throws when it evaluates. title.js tries 3 times (evaluation errors are cached, so every try fails), then the one reload, then THE CITY COULDN'T LOAD on every visit. docs/harbor.md says the Harbor's floor is iOS 16, and tests/safari-floor.test.mjs only checks for top-level await.
THE FIX: Build the regex lazily inside hasProfanity with a try/catch fallback, or use a boundary without lookbehind. Add lookbehind to the Safari-floor test.

6. Locking the phone or switching apps mid-load makes every reveal gate expire, so the city is revealed unfinished
SEVERITY: should-fix · CONFIDENCE: likely; confirm on an iPhone
CODE: js/screens/harbor/scene.js:2903 "const late = now - t0 > REVEAL_MAX && !(baker.bakes >= 1 && ...)" plus js/screens/title.js:417 "els.holdT = setTimeout(reveal, 7500)" plus js/app.js:372 "new Promise(r => setTimeout(r, 9000))"
WHAT HAPPENS: The scene stops its loop while hidden, so no baking happens, but REVEAL_MAX, WX_WAIT and FONT_WAIT are measured from t0 on the clock. Say someone taps the iMessage link, flips back to Messages for 5 s and returns. The first frame back sees late = true even with baker.bakes === 0. title.js's 7.5 s timer, which iOS held while the page was hidden, fires at once too. The boot screen fades within two frames onto a half-built city, which then pops in. Only the watchdog counts time while the page is visible.
THE FIX: Measure the scene's REVEAL_MAX, WX_WAIT and FONT_WAIT and the title's and app's safety timers in visible time, pausing them while hidden, the way the watchdog already does.

7. A mismatch inside the city's graph (a deploy mid-load) skips the re-fetch that the app's graph gets
SEVERITY: should-fix · CONFIDENCE: likely
CODE: js/screens/title.js:59 "const tryHarbor = n => loadHarbor().catch(e => { ... return new Promise(r => setTimeout(r, 1500 * n)).then(() => tryHarbor(n + 1)); });" then js/screens/title.js:61 "window.__boot.reload('the city’s module failed 3 times')". Compare index.html:128 "if (skew && !prevReload()) { ... refresh().then(reloadOnce); }".
WHAT HAPPENS: 237 of the 300 preloaded modules belong to scene.js's graph, which loads after stage 'app', so the watchdog's skew check (stage === 'html', index.html:138) never sees its link errors. A SyntaxError from mixing two deploys' files is cached in the module map, so the 3 tries just cost 4.5 s. Then __boot.reload calls reloadOnce directly, without the cache:'reload' re-fetch that your own comment says WebKit needs. If WebKit serves the stale copy again, the second load ends at THE CITY COULDN'T LOAD. (Retrying after network failures does work in Safari; this applies only to link, parse and evaluation errors.)
THE FIX: In tryHarbor, treat a SyntaxError as skew: skip the retries, run the watchdog's refresh() for the city's modules, then the one reload. Expose that as __boot.reload(why, { skew: true }).

8. No recovery from a deploy for modules loaded after the boot (the first-10-s imports and the first taps after hours)
SEVERITY: should-fix · CONFIDENCE: likely; reproduce with your line-proxy "deploy switch"
CODE: js/app.js:454 "setTimeout(() => import('./screens/harbor/radio-gate.js')...catch(e => console.warn('radio', e)), 2500);", js/screens/title.js:374 ".catch(e => { roomLoading = false; console.warn('room', e); });", js/games/lazy-view.js:50 ".catch(e => { console.warn('game view', e); reportError(e, 'view load'); });"
WHAT HAPPENS: radio-gate, keypop, room-banner, invites/friends, gift-reveal, idle, room-city and the games are not in the boot preload. They're fetched later from whichever deploy is live and linked against the old deploy's modules already in memory. After a deploy, a new file that imports a new export fails to link. Nothing reloads: the radio is silently gone for the session, or after hours HOST or JOIN gives a room with no room UI, or a game screen stays blank. Retrying never helps because link errors are cached.
THE FIX: Give every lazy import one shared wrapper. On a SyntaxError or TypeError, check a tiny version file (for example /version.json with the commit SHA) against the boot's and reload once if it changed. Vercel Skew Protection is the alternative, if your plan has it.

9. Every shared link costs an extra redirect and a second TLS handshake
SEVERITY: nice-to-have · CONFIDENCE: sure (checked live)
CODE: index.html:20 '<meta property="og:url" content="https://neonspeakeasy.com/">'. The live https://neonspeakeasy.com/ answers "HTTP/2 308 location: https://www.neonspeakeasy.com/".
WHAT HAPPENS: Links tapped in iMessage on the bare domain pay a full round trip plus a new connection to www before the HTML even starts. That's roughly 100–300 ms on Wi-Fi, on the first paint of every invite. The service worker also only covers www.
THE FIX: Make one host the primary and use it everywhere: point og:url, the invite links and the domain you hand out at www, or make the bare domain primary in Vercel.

10. The hang watch rebuilds the city's full debug report every second for the whole session
SEVERITY: nice-to-have · CONFIDENCE: sure (it runs); guess (the cost). Measure in Safari's Timelines.
CODE: index.html:159 "s = snapFn ? snapFn('hang') : bootSnap('THE BOOT (no city yet)'); ... hw.postMessage({ t: 'beat', vis: D.visibilityState, snap: s })". snapFn is scene.js's reportText (js/screens/harbor/scene.js:1696), set through js/screens/harbor/report.js:57.
WHAT HAPPENS: Once a second, on the main thread, it runs memAll(), people.debug() (many filter and map passes), sorts the frame arrays, JSON.stringify(snd.debug()), querySelectorAll('canvas') and 40 load-log lines. It then structured-clones a multi-KB string to the worker. Before the reveal it does bootSnap's loop over about 400 resource entries instead. That's a small, regular hitch during the fade and the power-on.
THE FIX: Send the worker a cheap heartbeat each second, and build the full snapshot only every 5 s (or only after a frame took more than 1.5 s), since the report only has to be recent to within a few seconds.

11. The service worker rewrites about 300 files (about 6 MB) to Cache Storage on every load
SEVERITY: nice-to-have · CONFIDENCE: likely
CODE: sw.js:26-28 "if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)) ... }"
WHAT HAPPENS: Network-first with 'no-cache' revalidates every module. Each revalidated 200 is then cloned and written to disk again, even though nothing changed. That's flash writes and I/O on the service-worker side during the boot, on every visit. Unique query URLs (for example the CSS '?again=') also pile up, because nothing trims the cache.
THE FIX: Skip the put when the cached copy's ETag matches the new one, and don't cache URLs with throwaway query strings.

12. A core stylesheet that fails twice still counts as loaded
SEVERITY: nice-to-have · CONFIDENCE: sure (logic); rare
CODE: index.html:194 "n.onerror = function () { __cssDone(n); };"
WHAT HAPPENS: On a first visit (no service worker yet), two failures of title.css or base.css set css-ready with a sheet missing. The boot screen then lifts onto the unstyled, untappable title that LOAD FIX 3 meant to prevent. The watchdog doesn't step in, because the page has revealed.
THE FIX: After the second failure, don't count the sheet. Let the watchdog's reload handle it, as it does for a sheet that never answers.

13. The load log can go blind after the reveal on a slow load
SEVERITY: nice-to-have · CONFIDENCE: sure (logic)
CODE: js/core/harbor-loadlog.js:52 "if (rows.length >= max) { dropped++; return null; }" (max 90)
WHAT HAPPENS: Rows from before the reveal (resizes, holds, held-by notes, tier notes) count toward the same 90-row cap. A slow iPhone load that logs a lot in the dark drops exactly the post-reveal rows the load check exists to catch.
THE FIX: Give the post-reveal window its own allowance, for example 60 rows before and 60 after.

VERDICT
Overall: solid for a first-time visitor on home Wi-Fi. The watchdog, the counting of each core sheet once, the visible-time watchdog, the time-boxed reveal gates, the single fade and the tap/audio unlock are careful and I found no hang there. What's left are the edge paths (a resume, being hidden mid-load, deploy skew) plus pre-tap waste.
Biggest risk left: #1, a returning player in a room on a flaky line, stuck between REJOINING YOUR ROOM, a reload and TAP TO TRY AGAIN, because Firebase's get() never times out.
On a real iPhone: (a) refresh inside a room with Network Link Conditioner at 100% loss, then restore it after 20 s; (b) open the link, switch apps for 5 s during the boot screen, and watch the reveal; (c) Safari's Timelines memory track for 3 minutes on the title with no tap (warm-up PCM), with the music on and then off; (d) an iOS 16.3 simulator loading the city.
