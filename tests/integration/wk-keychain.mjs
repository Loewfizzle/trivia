// FRIENDS A — THE KEY IN THE PHONE'S PASSWORDS, in Safari's own engine (Playwright's WebKit — ~/wk/node_modules/playwright, or WK_PLAYWRIGHT),
// at 402×874 @3: SAVE TO PASSWORDS beside YOUR KEY is a PROPER CREDENTIAL FORM (a <form>, a username field = NAME#1234 with autocomplete
// "username", a password field = the key with "current-password", a real submit button; posting nowhere — method POST, never the key in a URL);
// its submit leaves the page (the signal Safari's "Save Password" reads) and nothing is sent; RESTORE YOUR ACCOUNT's key field is a
// "current-password" field in a form with a username field (a new phone's AutoFill fills it). The real Save prompt = the owner's iPhone.
// Also shoots the profile's FRIENDS section + the key block in WebKit (the look review).
//   node tests/integration/wk-keychain.mjs [./shots-friends]     (on the emulators + serve.mjs --emu)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173', OUT = (process.argv[2] || './shots-friends').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const browser = await webkit.launch();
const errors = [], checks = [];
const ok = (c, what) => { checks.push(!!c); console.log(c ? 'OK  ' : 'FAIL', what); if (!c) errors.push(what); };
const wf = (p, js, ms = 25000) => p.waitForFunction(js, null, { timeout: ms }).then(() => true, () => false);
try {
  const slot = 'wkk';
  // (FRIENDS B: an iPhone's user agent — the passkey buttons say FACE ID as on the owner's phone)
  const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1' });
  // (FRIENDS B: Playwright's Windows WebKit build has PublicKeyCredential but NO navigator.credentials — a real iPhone has both. An INERT
  //  stand-in (it never makes a passkey) lets the page draw the passkey buttons for the look review; the real Face ID = the owner's iPhone)
  await ctx.addInitScript(() => { try { if (window.PublicKeyCredential && !navigator.credentials) Object.defineProperty(navigator, 'credentials', { value: { create: () => Promise.reject(Object.assign(new Error('stub'), { name: 'NotAllowedError' })), get: () => Promise.reject(Object.assign(new Error('stub'), { name: 'NotAllowedError' })) }, configurable: true }); } catch { /* fine */ } });
  await ctx.addInitScript(([s]) => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('nd:byc', 'test'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'KEYCHAIN', color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } }, [slot]);
  const p = await ctx.newPage();
  const sent = [];
  p.on('pageerror', e => { console.log('PAGEERROR', e.message); errors.push(e.message); });
  p.on('request', r => { const b = r.postData() || ''; if (/NEON-[A-Z2-9]{4}-/.test(b + r.url())) sent.push(`${r.method()} ${r.url()}`); });
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}`, 'wk-keychain.mjs'));
  ok(await wf(p, `!!localStorage.getItem('na:${slot}:pkey') && !!localStorage.getItem('na:${slot}:me')`, 40000), 'a profile + its key on this phone');
  const key = await p.evaluate(s => { const v = localStorage.getItem(`na:${s}:pkey`); try { return JSON.parse(v); } catch { return v; } }, slot);
  const tag = await p.evaluate(s => JSON.parse(localStorage.getItem(`na:${s}:me`)).profile.t, slot);
  await wf(p, '!!document.querySelector(".nd-tab-you")', 30000);
  await p.evaluate(() => document.querySelector('.nd-tab-you').click());
  ok(await wf(p, '!!document.querySelector("form.pf-kc")'), 'SAVE TO PASSWORDS on the ACCOUNT block');
  const f = await p.evaluate(() => {
    const form = document.querySelector('form.pf-kc'), u = form.querySelector('input[autocomplete="username"]'), pw = form.querySelector('input[type="password"][autocomplete="current-password"]'), b = form.querySelector('button[type="submit"]');
    const vis = el => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
    return { method: form.method, action: form.getAttribute('action'), user: u && u.value, userName: u && u.name, pass: pw && pw.value, passName: pw && pw.name, pwVis: pw && vis(pw), uVis: u && vis(u), submit: b && b.textContent, n: form.elements.length };
  });
  ok(f.method === 'post' && f.action === '#', `the form posts nowhere (method ${f.method}, action ${f.action}) — the key never lands in a URL`);
  ok(f.user === `KEYCHAIN#${tag}` && f.userName === 'username' && f.uVis, `username field = the name tag (${f.user}), autocomplete="username"`);
  ok(f.pass === key && f.passName === 'password' && f.pwVis, 'password field = the restore key, type=password, autocomplete="current-password" (rendered — never display:none)');
  ok(/SAVE TO PASSWORDS/.test(f.submit || ''), 'a real submit button (SAVE TO PASSWORDS)');
  await p.evaluate(() => document.querySelector('.pf-kb').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}wk-keychain-form.png` });
  // the submit: handled on the page, the form leaves (Safari's signal), nothing sent anywhere
  await p.evaluate(() => document.querySelector('form.pf-kc button[type="submit"]').click());
  ok(await wf(p, '!document.querySelector("form.pf-kc") && !!document.querySelector(".pf-kc-done")', 5000), 'the submit: the form leaves the page → "If it asked, tap Save Password"');
  await p.waitForTimeout(800);
  ok(sent.length === 0 && !/NEON-/.test(p.url()), `the key sent NOWHERE (${sent.length ? sent.join(', ') : 'no request carried it'}; the URL clean)`);
  await p.screenshot({ path: `${OUT}wk-keychain-saved.png` });
  // FRIENDS B — FACE ID SIGN-IN in Safari's engine: ACCOUNT's block + ADD (where WebAuthn exists — Playwright's WebKit build may lack it: then the
  //  block says so and no ADD is drawn; the real Face ID prompt = the owner's iPhone)
  ok(await wf(p, '!!document.querySelector(".pk-box")', 15000), 'FACE ID SIGN-IN: ACCOUNT has the passkey block');
  const wa = await p.evaluate(() => ({ api: !!window.PublicKeyCredential && !!navigator.credentials, add: !!document.querySelector('.pk-box .pk-add'), txt: (document.querySelector('.pk-box') || {}).textContent || '' }));
  ok(wa.api ? wa.add && /FACE ID SIGN-IN/.test(wa.txt) : /can’t save a passkey/.test(wa.txt), `the block in WebKit: WebAuthn ${wa.api ? 'present → ADD … SIGN-IN drawn' : 'absent → "can’t save a passkey" (no button)'} ("${wa.txt.slice(0, 80)}")`);
  await p.evaluate(() => document.querySelector('.pk-box').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}wk-faceid-account.png` });
  // the FRIENDS section in WebKit (the look review)
  await p.evaluate(() => { const s = document.querySelector('.fr-sec'); if (s) s.scrollIntoView({ block: 'start' }); });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}wk-friends-section.png` });
  // RESTORE YOUR ACCOUNT: a "current-password" field in a form, a username field beside it (AutoFill's pair)
  await p.evaluate(() => document.querySelector('.pf-restore').click());
  ok(await wf(p, '!!document.querySelector(".pf-restore-sheet form.pf-kc-form")', 8000), 'RESTORE YOUR ACCOUNT opens its form');
  const r = await p.evaluate(() => { const fm = document.querySelector('.pf-restore-sheet form.pf-kc-form'); const k = fm.querySelector('input.pf-key-in'); return { ac: k.autocomplete, type: k.type, user: !!fm.querySelector('input[autocomplete="username"]'), submit: !!fm.querySelector('button[type="submit"]') }; });
  ok(r.ac === 'current-password' && r.type === 'password' && r.user && r.submit, `the restore key field: autocomplete="${r.ac}", type ${r.type}, a username field + a submit in its form — a new phone AUTOFILLS it`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}wk-keychain-restore.png` });
  const ps = await p.evaluate(() => ({ api: !!window.PublicKeyCredential && !!navigator.credentials, btn: !!document.querySelector('.pf-restore-sheet .pk-signin') && /SIGN IN WITH FACE ID/.test(document.querySelector('.pf-restore-sheet .pk-signin').textContent) }));
  ok(ps.api ? ps.btn : !ps.btn, `RESTORE YOUR ACCOUNT: SIGN IN WITH FACE ID ${ps.api ? 'drawn above the key' : 'not drawn (no WebAuthn in this build)'}`);
} catch (e) { errors.push(`FATAL ${e.message}`); console.log('FATAL', e); }
await browser.close();
console.log(`checks ${checks.filter(Boolean).length}/${checks.length} passed`);
console.log(errors.length ? `errors:\n  ${errors.join('\n  ')}` : 'errors none');
process.exit(errors.length ? 1 : 0);
