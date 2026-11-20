// THE PROOF PASS — THE SWITCH-OVER's tool: load a rules file into the RUNNING database emulator (the app's own namespace), so an E2E can run
// the new phone code on the rules as published before a pass — and put the repo's rules back.
//   node tests/integration/kit/swap-rules.mjs tests/fixtures/rules-before-proof.json     (the old rules)
//   node tests/integration/kit/swap-rules.mjs                                            (back to database.rules.json)
// NEVER THE LIVE SITE: it talks to 127.0.0.1:9000 only.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const file = process.argv[2] ? process.argv[2] : fileURLToPath(new URL('../../../database.rules.json', import.meta.url));
const text = readFileSync(file, 'utf8');
const res = await fetch('http://127.0.0.1:9000/.settings/rules.json?ns=demo-arcade-default-rtdb', { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: text });
if (!res.ok) { console.error(`the emulator refused the rules (${res.status}): ${await res.text()}`); process.exit(1); }
console.log(`rules loaded: ${file} (${text.length} bytes${/"t0"/.test(text) ? ' — WITH the stamp t0' : ' — no t0: the rules before THE PROOF PASS'})`);
