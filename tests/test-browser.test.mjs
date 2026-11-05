// ATM-A Group 0 — THE TEST BROWSER: every browser script launches through tests/integration/kit/puppeteer.mjs (muted + the mini PC's
// 60 fps fix), never puppeteer-core directly (one helper, not 37 copies of the flags).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('./integration/', import.meta.url);
const files = d => readdirSync(new URL(d, ROOT)).filter(f => f.endsWith('.mjs')).map(f => join(d, f));

test('every test browser comes from kit/puppeteer.mjs (muted, 60 fps on the mini PC)', () => {
  const strays = ['.', 'harbor-e2e', 'kit'].flatMap(files).filter(f => !f.endsWith('puppeteer.mjs'))
    .filter(f => /['"]puppeteer-core['"]/.test(readFileSync(new URL(f.replace(/\\/g, '/'), ROOT), 'utf8')));
  assert.deepEqual(strays, []);
});

test('the test flags: muted always; software compositing only on Windows without the GPU asked for', async () => {
  const { testArgs } = await import('./integration/kit/puppeteer.mjs').catch(() => ({ testArgs: null }));
  if (!testArgs) return;   // (puppeteer-core not installed here: the unit job has no deps)
  assert.ok(testArgs([]).includes('--mute-audio'));
  assert.equal(testArgs(['--mute-audio']).filter(a => a === '--mute-audio').length, 1);
  if (process.platform === 'win32' && !process.env.GPU && process.env.VSYNC !== 'display') assert.ok(testArgs([]).includes('--disable-gpu-compositing'));
  assert.ok(!testArgs(['--enable-gpu']).includes('--disable-gpu-compositing'));
});

// SHELL 2.0 B1 Group 0 — THE GPU PIN: booted with no display, Windows lists the Basic Render Driver first (+ ACTIVE) and Chromium's GPU
// process crashes on it; the kit pins the first real adapter's LUID. The text is what chrome://gpu printed on the mini PC (Nov 5).
test('THE GPU PIN picks the real adapter when the Basic Render Driver is active, nothing when a real GPU is', async () => {
  const { pickAdapter } = await import('./integration/kit/puppeteer.mjs').catch(() => ({ pickAdapter: null }));
  if (!pickAdapter) return;
  const basic = 'GPU0                            :VENDOR= 0x1414, DEVICE=0x008c [Microsoft Basic Render Driver], LUID={0,59907}, DRIVER_VENDOR=Microsoft, DRIVER_VERSION=10.0.26100.9818 *ACTIVE*GPU1                            :VENDOR= 0x1002, DEVICE=0x1900 [AMD Radeon 780M Graphics], SUBSYS=0x00311f66, REV=179, LUID={0,60074}, DRIVER_VERSION=32.0.12019.1028GPU2                            :VENDOR= 0x1414, DEVICE=0x008c [Microsoft Basic Render Driver], LUID={0,59965}, DRIVER_VERSION=10.0.26100.9818Optimus                         :false';
  assert.equal(pickAdapter(basic), '0,60074');
  const amd = 'GPU0 :VENDOR= 0x1002, DEVICE=0x1900 [AMD Radeon 780M Graphics], LUID={0,61000}, DRIVER_VERSION=32.0 *ACTIVE*GPU1 :VENDOR= 0x1414, DEVICE=0x008c [Microsoft Basic Render Driver], LUID={0,59907}Optimus :false';
  assert.equal(pickAdapter(amd), null);
  assert.equal(pickAdapter('GPU0 :VENDOR= 0x1414, DEVICE=0x008c, LUID={0,1} *ACTIVE*Optimus :false'), null);
});
