// C4d — every docs link in the repo resolves (docs/harbor.md was split into docs/harbor/passes/: scripts/check-doc-links.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDocLinks } from '../scripts/check-doc-links.mjs';

test('C4d — THE DOCS\' LINKS: every `docs/….md(#anchor)` written in the repo names a file that exists + a heading its anchor starts', () => {
  assert.deepEqual(checkDocLinks(), []);
});
