// Regression test: iOS-style audio interruption (context suspended + music element paused behind our back).
// Needs scripts/serve.mjs on 5173 + emulators. Usage: node audio-resume.mjs
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/benja/Documents/trivia/tests/integration/package.json');
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--autoplay-policy=user-gesture-required'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => { window.__els = new Set(); const o = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__els.add(this); return o.call(this); }; });
await p.goto('http://localhost:5173/?emu&slot=resumetest');
await p.waitForSelector('.title-help');
await sleep(1500);
const dbg = () => p.evaluate(async () => { const e = await import('/js/audio/engine.js'); const d = window.__arcade.musicDebug(); const v = d.voices.find(x => x.id === d.playing); return { ctx: e.getContext() && e.getContext().state, playing: d.playing, paused: v && v.paused, t: v && v.t }; });
await p.mouse.click(195, 300); // first gesture: unlock
await sleep(2500);
console.log('after unlock     ', JSON.stringify(await dbg()));

// iOS-style: context suspended + track paused behind our back, while the page stays visible
await p.evaluate(async () => { const e = await import('/js/audio/engine.js'); await e.getContext().suspend(); [...window.__els].forEach(a => a.pause()); });
await sleep(800);
console.log('after OS pause   ', JSON.stringify(await dbg()));
await p.mouse.click(195, 300); // one tap
await sleep(2500);
const a = await dbg();
console.log('after one tap    ', JSON.stringify(a));

// track paused alone (context still running): the watchdog should restart it with no tap at all
await p.evaluate(() => [...window.__els].forEach(x => x.pause()));
await sleep(2500);
const c = await dbg();
console.log('watchdog, no tap ', JSON.stringify(c));
await b.close();
const ok = a.ctx === 'running' && a.paused === false && c.paused === false && c.ctx === 'running';
console.log(ok ? 'RESUME TEST PASSED' : 'RESUME TEST FAILED');
