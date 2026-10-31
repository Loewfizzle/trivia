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
