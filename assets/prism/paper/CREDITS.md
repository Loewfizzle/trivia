# assets/prism/paper — credits (PRISM DROP's DAY LOOK, PD-4)

Every paper here is **CC0 1.0 (public domain)** — no attribution required; credited anyway (☰ → CREDITS, `js/ui/credits.js`, group ART).
Built by `scripts/build-prism-paper.py` (the grain only: a high-pass, made seamless, the paper's colour baked in, WebP q82). The rulings
(the notepad's lines + margin, the graph grid, the coloring page's frame) and the world doodles are DRAWN IN CODE (`js/games/prism/page.js`).

| file | source | licence (checked on the page, Nov 9 2026) |
|---|---|---|
| `notepad.webp`, `graph.webp` | "CC0 PBR Paper Textures" (`CC0-Texture-Paper01.zip` → `PaperAlbedo.png`) — https://opengameart.org/content/cc0-pbr-paper-textures | CC0 ("License(s): CC0") |
| `coloring.webp` | ambientCG **Paper001** (`Paper001_1K-JPG_Color.jpg`) — https://ambientcg.com/view?id=Paper001 | CC0 1.0 Universal (https://ambientcg.com/license) |
| `construction.webp` | ambientCG **Paper002** (`Paper002_1K-JPG_Color.jpg`) — https://ambientcg.com/view?id=Paper002 | CC0 1.0 Universal (https://ambientcg.com/license) |
| `watercolor.webp` (THE WATERCOLOR skin's cold-press sheet), `kraft.webp` (THE PAPER CUT-OUT skin's kraft board) — SKINS 1 | ambientCG **Paper001** (`Paper001_2K-JPG_Color.jpg`, its clean left square — the high-pass grain only, tinted `#f6f0e2` / `#c6a576`, the tooth lifted: `--only watercolor,kraft`) — https://ambientcg.com/view?id=Paper001 | CC0 1.0 Universal (https://ambientcg.com/license) |

## The font — `assets/fonts/prism/permanent-marker-latin-400.woff2`

**Permanent Marker** by Font Diner, Inc. — Copyright (c) 2010 by Font Diner, Inc. — **Apache License 2.0** (the full text beside it:
`assets/fonts/prism/LICENSE-PermanentMarker.txt`). The plan expected SIL OFL 1.1; Google Fonts lists this family under Apache 2.0
(https://github.com/google/fonts/tree/main/apache/permanentmarker — METADATA.pb `license: "APACHE2"`), equally free to self-host + ship.
The latin subset woff2 unchanged, from the `@fontsource/permanent-marker` 5.3.0 package (npm). It has no `→` glyph: the callouts' arrow
falls back to the UI font.

## The pixel font — `assets/fonts/prism/press-start-2p-latin-400.woff2` (SKINS 2B — THE ARCADE PIXEL skin's lettering)

**Press Start 2P** — Copyright 2012 The Press Start 2P Project Authors (cody@zone38.net), with Reserved Font Name "Press Start 2P" —
**SIL Open Font License 1.1** (the full text beside it: `assets/fonts/prism/LICENSE-PressStart2P.txt`;
https://github.com/google/fonts/tree/main/ofl/pressstart2p). The latin subset woff2 unchanged (12.5 KB), from the
`@fontsource/press-start-2p` 5.2.7 package (npm) — never renamed as a font file, never sold on its own (the OFL's terms); loaded in the
page under the family name 'PD Pixel' only when THE ARCADE PIXEL skin shows (`js/games/prism/pixel-art.js#loadPixelFont`). It has no `→`
glyph: a callout's arrow falls back to the UI font.
