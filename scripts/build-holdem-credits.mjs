// HOLD'EM (HE10 — the Fable review's A47): THE LICENCE RECORD IN THE REPO. assets/holdem/CREDITS.md = what ships + where it came from, built
// from Ben's own notes (Downloads\grok\holdem\credits.txt · chips\credits.txt · sfx\credits.txt · sfx2\credits.txt — kept VERBATIM below a short
// summary) + the deck's source note (Downloads\neon\holdem\cards-src\SOURCE.txt, when present). The in-game list is js/ui/credits.js.
//   node scripts/build-holdem-credits.mjs [<grok holdem folder>]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SRC = process.argv[2] || join(homedir(), 'Downloads', 'grok', 'holdem');
const CARDS = join(homedir(), 'Downloads', 'neon', 'holdem', 'cards-src', 'SOURCE.txt');
const NOTES = [['credits.txt', 'THE ART (felts, rails, backdrops, card backs)'], ['chips/credits.txt', 'THE CHIPS'], ['sfx/credits.txt', 'THE SOUNDS — the first set (the kept stings)'], ['sfx2/credits.txt', 'THE SOUNDS — the real-recording set']];

const out = [`# HOLD'EM — CREDITS + LICENCES

Built by \`node scripts/build-holdem-credits.mjs\` from the owner's source notes (kept verbatim below). The in-game list: ☰ → CREDITS
(\`js/ui/credits.js\`). Only compressed copies ship (\`scripts/build-holdem-skin.py\` bakes every image here from the originals — the rows
casino · cabin · apartment · chips).

## What ships, in short
- **Felts** (all three skins): ambientCG **Fabric030** — CC0 1.0 (recoloured green / teal; credited as a courtesy).
- **Rails:** ambientCG **Leather026** (NEON CASINO) · Poly Haven **american_walnut_veneer** by Jenelle van Heerden (COZY CABIN) · ambientCG
  **Metal009** (CYBERPUNK APARTMENT) — CC0 1.0.
- **Backdrops, card backs, the clay chips:** AI-generated with Grok (xAI's terms: the user owns the outputs; no CC licence claimed).
- **Card faces:** Byron Knoll's *Vector Playing Cards* — public domain (pips + court figures, recoloured; his ace of spades is NOT used —
  ours is drawn in code).
- **Card indexes:** Libre Baskerville's glyphs as path data — Copyright 2012 The Libre Baskerville Project Authors
  (https://github.com/impallari/Libre-Baskerville), licensed under the SIL Open Font License, Version 1.1 (https://openfontlicense.org).
- **Sounds:** CC0 1.0 recordings + Grok's procedural sound design (CC0), and THREE CC BY sounds whose attribution is REQUIRED (credits.js
  carries them exactly): "Clay Chips.flac" by ArtOrDie (CC BY 4.0) · "Poker Chips landing on a wooden Table" + "Poker Chips stacking" by
  Benjamin152 (CC BY 3.0).
`];
for (const [f, title] of NOTES) {
  const p = join(SRC, f);
  if (!existsSync(p)) { console.warn(`missing ${p}`); continue; }
  out.push(`\n## ${title} — \`${f}\` (verbatim)\n\n\`\`\`text\n${readFileSync(p, 'utf8').replace(/\r\n/g, '\n').trim()}\n\`\`\`\n`);
}
if (existsSync(CARDS)) out.push(`\n## THE CARD FACES — \`cards-src/SOURCE.txt\` (verbatim)\n\n\`\`\`text\n${readFileSync(CARDS, 'utf8').replace(/\r\n/g, '\n').trim()}\n\`\`\`\n`);
const file = new URL('../assets/holdem/CREDITS.md', import.meta.url);
writeFileSync(file, out.join(''));
console.log(`wrote assets/holdem/CREDITS.md (${out.join('').length} chars)`);
