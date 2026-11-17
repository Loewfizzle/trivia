// CITY F — THE WEAK DEVICE (core/harbor-tiers.js#weakDevice + #weakDpr): the owner's nephew's Chromebook (1 core, 4 GB, 1600 × 1200 @ 1)
// starts the city on the lowest tier before the first bake; an iPhone / iPad never does (its tier choice untouched); the backing store
// of a big screen at the lowest tier is capped (≈ 0.6–0.75 ×). The browser half: the harbor `weakstart` group.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weakDevice, weakDpr, WEAK_FLOOR } from '../js/core/harbor-tiers.js';

const CROS = 'Mozilla/5.0 (X11; CrOS aarch64 15917.71.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Safari/605.1.15';
const PIXEL = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

test('THE WEAK DEVICE: the Chromebook (1 core, 4 GB) is weak; ≤ 2 cores alone or ≤ 4 GB alone is weak', () => {
  assert.equal(weakDevice({ userAgent: CROS, hardwareConcurrency: 1, deviceMemory: 4 }), true);
  assert.equal(weakDevice({ userAgent: CROS, hardwareConcurrency: 2, deviceMemory: 8 }), true);
  assert.equal(weakDevice({ userAgent: PIXEL, hardwareConcurrency: 8, deviceMemory: 4 }), true);
  assert.equal(weakDevice({ userAgent: PIXEL, hardwareConcurrency: 8, deviceMemory: 2 }), true);
});

test('THE WEAK DEVICE: a strong phone / desktop is not; nothing reported = not weak', () => {
  assert.equal(weakDevice({ userAgent: PIXEL, hardwareConcurrency: 8, deviceMemory: 8 }), false);
  assert.equal(weakDevice({ userAgent: CROS, hardwareConcurrency: 16, deviceMemory: 8 }), false);
  assert.equal(weakDevice({ userAgent: CROS }), false);
  assert.equal(weakDevice(null), false);
});

test('THE WEAK DEVICE: NEVER an iPhone / iPad — whatever it reports (their tier choice is untouched)', () => {
  assert.equal(weakDevice({ userAgent: IPHONE, hardwareConcurrency: 2 }), false);
  assert.equal(weakDevice({ userAgent: IPHONE, hardwareConcurrency: 1, deviceMemory: 2 }), false);
  assert.equal(weakDevice({ userAgent: IPAD_DESKTOP, hardwareConcurrency: 2, maxTouchPoints: 5 }), false);
  // (a real Mac — no touch points — is judged like any desktop)
  assert.equal(weakDevice({ userAgent: IPAD_DESKTOP, hardwareConcurrency: 2, maxTouchPoints: 0 }), true);
});

test('THE WEAK DEVICE: the backing store — 1600 × 1200 at ≈ 0.72 ×, a 1366 × 768 at ≈ 0.98 ×, a phone at its own 1 ×, never under the floor', () => {
  const big = weakDpr(1600, 1200, 1);
  assert.ok(big >= 0.6 && big <= 0.75, `1600 × 1200 → ${big}`);
  const cb = weakDpr(1366, 768, 1);
  assert.ok(cb > 0.95 && cb <= 1, `1366 × 768 → ${cb}`);
  assert.equal(weakDpr(412, 915, 1), 1);
  assert.equal(weakDpr(3840, 2160, 1), WEAK_FLOOR);
});
