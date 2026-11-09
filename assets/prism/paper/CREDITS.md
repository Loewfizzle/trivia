# assets/prism/paper — credits (PRISM DROP's DAY LOOK, PD-4)

Every paper here is **CC0 1.0 (public domain)** — no attribution required; credited anyway (☰ → CREDITS, `js/ui/credits.js`, group ART).
Built by `scripts/build-prism-paper.py` (the grain only: a high-pass, made seamless, the paper's colour baked in, WebP q82). The rulings
(the notepad's lines + margin, the graph grid, the coloring page's frame) and the world doodles are DRAWN IN CODE (`js/games/prism/page.js`).

| file | source | licence (checked on the page, Nov 9 2026) |
|---|---|---|
| `notepad.webp`, `graph.webp` | "CC0 PBR Paper Textures" (`CC0-Texture-Paper01.zip` → `PaperAlbedo.png`) — https://opengameart.org/content/cc0-pbr-paper-textures | CC0 ("License(s): CC0") |
| `coloring.webp` | ambientCG **Paper001** (`Paper001_1K-JPG_Color.jpg`) — https://ambientcg.com/view?id=Paper001 | CC0 1.0 Universal (https://ambientcg.com/license) |
| `construction.webp` | ambientCG **Paper002** (`Paper002_1K-JPG_Color.jpg`) — https://ambientcg.com/view?id=Paper002 | CC0 1.0 Universal (https://ambientcg.com/license) |

## The font — `assets/fonts/prism/permanent-marker-latin-400.woff2`

**Permanent Marker** by Font Diner, Inc. — Copyright (c) 2010 by Font Diner, Inc. — **Apache License 2.0** (the full text beside it:
`assets/fonts/prism/LICENSE-PermanentMarker.txt`). The plan expected SIL OFL 1.1; Google Fonts lists this family under Apache 2.0
(https://github.com/google/fonts/tree/main/apache/permanentmarker — METADATA.pb `license: "APACHE2"`), equally free to self-host + ship.
The latin subset woff2 unchanged, from the `@fontsource/permanent-marker` 5.3.0 package (npm). It has no `→` glyph: the callouts' arrow
falls back to the UI font.
