// FIXES R1 (THE REVIEW A4) — A CARD UPLOADS ONCE: the phone remembers { pid, day, h, url } (js/daily/share.js) and shares the remembered link
// for the same picture — a reload or a reopened screen uploads nothing; another player, another day or a changed picture uploads again.
// (the reopen in a browser: tests/integration/wk-share-standalone.mjs — 0 uploads over two reloads)
import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberedLink, blobHash } from '../js/daily/share.js';

test('the remembered link: the same pid + day + picture only', () => {
  const kept = { pid: 'p1', day: 'd20261115', h: 'abc', url: 'https://www.neonspeakeasy.com/api/daily?s=CODEcode0001' };
  assert.equal(rememberedLink(kept, { pid: 'p1', day: 'd20261115', h: 'abc' }), kept.url);
  assert.equal(rememberedLink(kept, { pid: 'p2', day: 'd20261115', h: 'abc' }), '', 'another player on this phone');
  assert.equal(rememberedLink(kept, { pid: 'p1', day: 'd20261116', h: 'abc' }), '', 'another day');
  assert.equal(rememberedLink(kept, { pid: 'p1', day: 'd20261115', h: 'abd' }), '', 'a changed card');
  assert.equal(rememberedLink(null, { pid: 'p1', day: 'd20261115', h: 'abc' }), '');
  assert.equal(rememberedLink({ ...kept, url: 5 }, { pid: 'p1', day: 'd20261115', h: 'abc' }), '');
});

test('the picture fingerprint: the same bytes → the same hash, other bytes → another', async () => {
  const a = await blobHash(new Blob([new Uint8Array([1, 2, 3, 4])])), b = await blobHash(new Blob([new Uint8Array([1, 2, 3, 4])])), c = await blobHash(new Blob([new Uint8Array([1, 2, 3, 5])]));
  assert.equal(a, b); assert.notEqual(a, c); assert.ok(a.length >= 8);
});
