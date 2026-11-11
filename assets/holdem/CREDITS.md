# HOLD'EM — CREDITS + LICENCES

Built by `node scripts/build-holdem-credits.mjs` from the owner's source notes (kept verbatim below). The in-game list: ☰ → CREDITS
(`js/ui/credits.js`). Only compressed copies ship (`scripts/build-holdem-skin.py` bakes every image here from the originals — the rows
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

## THE ART (felts, rails, backdrops, card backs) — `credits.txt` (verbatim)

```text
HOLDEM ART CREDITS — 8 November 2026, America/Detroit (EST)

All material maps are genuine native 2048 x 2048 source maps, not generated or upscaled. Basecolor maps were used, never AO/roughness mistaken for color. Normals are unmodified OpenGL (+Y), RGB data, converted from source JPG to PNG. Use as non-color data; flip green only if your renderer expects DirectX. Felt normal files intentionally share the same source.

Material licence: CC0 1.0 Universal; commercial use, modification and redistribution allowed, attribution not required. Verified https://docs.ambientcg.com/license and https://polyhaven.com/license .

felt-green.jpg
  Source: https://ambientcg.com/a/Fabric030
  Download: https://ambientcg.com/get?file=Fabric030_2K-JPG.zip (map: Fabric030_2K-JPG_Color.jpg)
  Author: ambientCG (asset credited to ambientCG; individual artist not stated on asset page)
  Licence: CC0 1.0 Universal
  Modification: rich green fine weave; recolored basecolor, no print

felt-green-normal.png
  Source: https://ambientcg.com/a/Fabric030
  Download: https://ambientcg.com/get?file=Fabric030_2K-JPG.zip (map: Fabric030_2K-JPG_NormalGL.jpg)
  Author: ambientCG (asset credited to ambientCG; individual artist not stated on asset page)
  Licence: CC0 1.0 Universal
  Modification: none except lossless JPG-decoded to PNG export; OpenGL normal

felt-teal.jpg
  Source: https://ambientcg.com/a/Fabric030
  Download: https://ambientcg.com/get?file=Fabric030_2K-JPG.zip (map: Fabric030_2K-JPG_Color.jpg)
  Author: ambientCG (asset credited to ambientCG; individual artist not stated on asset page)
  Licence: CC0 1.0 Universal
  Modification: same fine weave in near-black teal; recolored

felt-teal-normal.png
  Source: https://ambientcg.com/a/Fabric030
  Download: https://ambientcg.com/get?file=Fabric030_2K-JPG.zip (map: Fabric030_2K-JPG_NormalGL.jpg)
  Author: ambientCG (asset credited to ambientCG; individual artist not stated on asset page)
  Licence: CC0 1.0 Universal
  Modification: none except lossless JPG-decoded to PNG export; OpenGL normal

rail-leather.jpg
  Source: https://ambientcg.com/a/Leather026
  Download: https://ambientcg.com/get?file=Leather026_2K-JPG.zip (map: Leather026_2K-JPG_Color.jpg)
  Author: ambientCG (asset credited to ambientCG; individual artist not stated on asset page)
  Licence: CC0 1.0 Universal
  Modification: subtle black leather grain; charcoal-black recolor

rail-leather-normal.png
  Source: https://ambientcg.com/a/Leather026
  Download: https://ambientcg.com/get?file=Leather026_2K-JPG.zip (map: Leather026_2K-JPG_NormalGL.jpg)
  Author: ambientCG (asset credited to ambientCG; individual artist not stated on asset page)
  Licence: CC0 1.0 Universal
  Modification: none except lossless JPG-decoded to PNG export; OpenGL normal

rail-walnut.jpg
  Source: https://polyhaven.com/a/american_walnut_veneer
  Download: https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/american_walnut_veneer/american_walnut_veneer_diff_2k.jpg
  Author: Jenelle van Heerden / Poly Haven
  Licence: CC0 1.0 Universal
  Modification: fine walnut veneer with warm brown stain recolor

rail-walnut-normal.png
  Source: https://polyhaven.com/a/american_walnut_veneer
  Download: https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/american_walnut_veneer/american_walnut_veneer_nor_gl_2k.jpg
  Author: Jenelle van Heerden / Poly Haven
  Licence: CC0 1.0 Universal
  Modification: none except lossless JPG-decoded to PNG export; OpenGL normal

rail-metal.jpg
  Source: https://ambientcg.com/a/Metal009
  Download: https://ambientcg.com/get?file=Metal009_2K-JPG.zip (map: Metal009_2K-JPG_Color.jpg)
  Author: ambientCG (asset credited to ambientCG; individual artist not stated on asset page)
  Licence: CC0 1.0 Universal
  Modification: horizontal brushed metal; dark gunmetal recolor

rail-metal-normal.png
  Source: https://ambientcg.com/a/Metal009
  Download: https://ambientcg.com/get?file=Metal009_2K-JPG.zip (map: Metal009_2K-JPG_NormalGL.jpg)
  Author: ambientCG (asset credited to ambientCG; individual artist not stated on asset page)
  Licence: CC0 1.0 Universal
  Modification: none except lossless JPG-decoded to PNG export; OpenGL normal

backdrop-casino.png
  Grok generated — built-in Grok Bot GenerateImage; no external stock author or CC licence claimed.
  Native 1024 x 1024, Lanczos upscaled to 2800 x 2800. This is NOT native 2.8K detail.

cardback-casino.png
  Grok generated — built-in Grok Bot GenerateImage; no external stock author or CC licence claimed.
  Native 864 x 1152, resized to 750 x 1050; upper-left quadrant mirrored horizontally and vertically for exact two-axis and 180-degree symmetry.

backdrop-cabin.png
  Grok generated — built-in Grok Bot GenerateImage; no external stock author or CC licence claimed.
  Native 1024 x 1024, Lanczos upscaled to 2800 x 2800. This is NOT native 2.8K detail.

cardback-cabin.png
  Grok generated — built-in Grok Bot GenerateImage; no external stock author or CC licence claimed.
  Native 864 x 1152, resized to 750 x 1050; upper-left quadrant mirrored horizontally and vertically for exact two-axis and 180-degree symmetry.

backdrop-apartment.png
  Grok generated — built-in Grok Bot GenerateImage; no external stock author or CC licence claimed.
  Native 1024 x 1024, Lanczos upscaled to 2800 x 2800. This is NOT native 2.8K detail.

cardback-apartment.png
  Grok generated — built-in Grok Bot GenerateImage; no external stock author or CC licence claimed.
  Native 864 x 1152, resized to 750 x 1050; upper-left quadrant mirrored horizontally and vertically for exact two-axis and 180-degree symmetry.

Generation usage: six calls, one per backdrop/card back; no backup generations or backups delivered. No payment, trial, login, account change or payment details used. Tool exposes no account-plan/free-tier label: verified free-tier status cannot be certified.
Official terms source checked 8 November 2026: https://x.ai/legal/faq says users own Inputs/Outputs and can use generated images commercially, and asks attribution to Grok under Brand Guidelines. Consumer terms: https://x.ai/legal/terms-of-service . This FAQ describes grok.com/mobile consumer use; the built-in tool exposes no independent account contract. AI images are NOT CC0 and not claimed human-made. Suggested credit: AI-generated with Grok.

Search-first selection: Poly Haven and ambientCG public asset catalogues/source pages checked; rejected stitched Fabric007 and seam-heavy leather, weathered Metal001. Native CC0 textures selected instead. Public CC0 background/card searches did not produce a coordinated premium set matching exact corner/empty-center and tiny-card constraints; remaining six were generated. No downloaded third-party stock image is used in generated art.

Documentation credits: credits.txt and HOLDEM-ART-REPORT.md authored for this task by Grok Bot; SHA256SUMS.txt is a computed integrity manifest.


PORTRAIT FOLLOW-UP — 8 November 2026, America/Detroit (EST)
backdrop-casino-portrait.png
  Grok generated; built-in GenerateImage. Style reference: previously generated backdrop-casino.png (unchanged).
  Actual returned native size 720 x 1280 (9:16); exported RGB PNG 1290 x 2796. This is upscaled, NOT native 1290 x 2796 detail. Tool exposes neither exact 9:19.5 nor a resolution selector; 9:16 was the closest supported portrait aspect.
  Processing: top source 0–40% remapped to final 0–12%; source 40–78% stretched through hidden middle 12–90%; source 78–100% mapped to final bottom 90–100%. Lanczos resampling, no top/bottom crop; hidden middle feather-dimmed 70%. No added drawn scene elements.
  Composition: ceiling strips ~1–3% down, slot-like bokeh in BOTH top corners ~4–11% down, pink/cyan bottom glow ~92–97%. All now remain visible with 12–90% covered. Top bokeh/architecture is vertically compressed compared with the native render.
backdrop-cabin-portrait.png
  Grok generated; built-in GenerateImage. Style reference: previously generated backdrop-cabin.png (unchanged).
  Actual returned native size 720 x 1280 (9:16); exported RGB PNG 1290 x 2796, upscaled, not native 1290 x 2796 detail.
  Processing: source 0–25% remapped to final 0–12%; source 25–87% stretched through hidden middle 12–90%; source 87–100% mapped to final 90–100%; Lanczos, no crop, hidden middle feather-dimmed 70%.
  Composition: small window x74–98%, y1–10%; warm lamp x1–9%, y1–4%; warm hearth glow spills at bottom-left y92–100%. Window/logs/lamp vertically compressed to fit the exposed band. Bottom shows warm spill and a stone hearth sliver, not a visible flame or full fireplace.
Exactly TWO generation calls in this follow-up; one selected image each; zero retries/backups. No payment, trials, account changes or payment information. Generator has no exposed verified free-tier label or higher-native-resolution control; no claim is made to either. AI images are not CC0. Previously cited official https://x.ai/legal/faq usage terms apply as described above; suggested attribution: AI-generated with Grok.
Square backdrops, apartment, card backs, materials and normals preserved unchanged. Preview is kept on work box only, not delivered as a backdrop.


========================================================================
SFX / CHIPS — 8 November 2026, America/Detroit (EST)
========================================================================
All filenames in this section are relative to the Hold’em root folder. Earlier approved-art and portrait credits above are preserved verbatim. Audio is provisional pending listening approval.

--- SFX ---
NEON SPEAKEASY — HOLD’EM AUDIO
Prepared 2026-11-08 (America/Detroit, EST). Free only; no payments, accounts, trials, or external paid generation used.
All source samples used are CC0 1.0. https://creativecommons.org/publicdomain/zero/1.0/
Kenney: the original pack License.txt explicitly authorizes personal/commercial projects. Source page was blocked; embedded licence and independent public CC0 collection corroborate it.
Freesound licences were read in the actual sound-page HTML and saved on the box. Public HQ MP3 previews were used where originals require an account; these are already lossy, and 192 kbps export does not restore lost information. Wind uses the existing original WAV.
All audio has been edited/trimmed, resampled, levelled, compressed as needed, and MP3-encoded. Ambient beds were layered and circularly crossfaded.
Original synthesis author/production: Grok Bot using procedural DSP scripts, NOT Grok Imagine, GenerateImage, or an external audio-generation service. Original synthesis is offered under CC0 1.0 to the extent any rights exist, for unrestricted commercial use; no exclusive copyright ownership or human authorship is asserted for AI-assisted output. Third-party sample layers retain their independently verified CC0 dedication.
No attribution is legally required by CC0; preserving these courtesy credits is recommended.

sfx/shuffle.mp3
Author/source/licence: ShuffleAndBridge.wav by BMacZero; https://freesound.org/people/BMacZero/sounds/96131/ ; CC0 1.0; public HQ MP3 derivative, trimmed only.
Edits/purpose: Author explicitly identifies a real shuffle and bridge; preserves the complete ~1.8 s gesture instead of cutting the bridge.

sfx/deal.mp3
Author/source/licence: Kenney Vleugels (Kenney), Casino Audio 1.1; https://kenney.nl/assets/casino-audio ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Original embedded License.txt verified; publisher web page blocked; licence corroborated by public CC0 collection https://cc0-sounds.exi.software/collection/kenney_casinoaudio/ . Source card-slide-1.ogg; trimmed.
Edits/purpose: One fixed papery slide, compact for repeated dealing.

sfx/flip.mp3
Author/source/licence: Kenney Vleugels (Kenney), Casino Audio 1.1; https://kenney.nl/assets/casino-audio ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Original embedded License.txt verified; publisher web page blocked; licence corroborated by public CC0 collection https://cc0-sounds.exi.software/collection/kenney_casinoaudio/ . Source card-place-2.ogg; trimmed.
Edits/purpose: Papery placement used as flip substitute; recording is not verified face-up flip.

sfx/fold.mp3
Author/source/licence: Kenney Vleugels (Kenney), Casino Audio 1.1; https://kenney.nl/assets/casino-audio ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Original embedded License.txt verified; publisher web page blocked; licence corroborated by public CC0 collection https://cc0-sounds.exi.software/collection/kenney_casinoaudio/ . Source card-shove-2.ogg; tail shortened.
Edits/purpose: Soft card-shove gesture for mucking.

sfx/check.mp3
Author/source/licence: Knocking by Rvgerxini; https://freesound.org/people/Rvgerxini/sounds/462317/ ; CC0 1.0. Public HQ MP3 derivative; two low-pass filtered excerpts.
Edits/purpose: Real table knock doubled and damped; wooden source, not actually a padded-felt recording.

sfx/chip-bet.mp3
Author/source/licence: Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Sources 201806, 201808.
Edits/purpose: Genuine clay/ceramic clinks in a short two-stage bet; landing on felt not verified.

sfx/chip-raise.mp3
Author/source/licence: Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Sources 201807, 201808, 201806.
Edits/purpose: Heavier clay/ceramic cluster than a bet; layered rather than a literal full-stack cut recording.

sfx/all-in.mp3
Author/source/licence: Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Source 201807. Kenney Vleugels (Kenney), Casino Audio 1.1; https://kenney.nl/assets/casino-audio ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Original embedded License.txt verified; publisher web page blocked; licence corroborated by public CC0 collection https://cc0-sounds.exi.software/collection/kenney_casinoaudio/ . Sources chips-handle-5, card-slide-4. Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Recorded chip handling with clay clack and low tension; paper slide stands in for friction, not a literal full clay-stack push recording.

sfx/pot-win.mp3
Author/source/licence: Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Source 201808. Kenney Vleugels (Kenney), Casino Audio 1.1; https://kenney.nl/assets/casino-audio ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Original embedded License.txt verified; publisher web page blocked; licence corroborated by public CC0 collection https://cc0-sounds.exi.software/collection/kenney_casinoaudio/ . Sources chips-handle-1, chips-handle-5.
Edits/purpose: Recorded chip-handling overlaps with a clay-clink finish; not an actual rake recording.

sfx/chip-stack.mp3
Author/source/licence: Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Sources 201806, 201808, 201807.
Edits/purpose: Fast recorded clay/ceramic clicks; edited stacking gesture, not verified riffling.

sfx/your-turn.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Soft major-third warm bell pair with restrained high harmonics.

sfx/timer-tick.mp3
Author/source/licence: Knocking by Rvgerxini; https://freesound.org/people/Rvgerxini/sounds/462317/ ; CC0 1.0; filtered small knock excerpt.
Edits/purpose: Subtle physical tick substitute (not a clock recording), attenuated to -25 LUFS padded; endpoints faded for clean repeat.

sfx/showdown.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Low close-interval suspense swell; late-night harmonic synth, no orchestra.

sfx/hand-win.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Warm major-triad glow with a muted upper sparkle.

sfx/knockout.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Low restrained impact and rounded harmonic tail; no aggressive crash.

sfx/blinds-up.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Small soft two-note signal distinct from the turn cue.

sfx/champion.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0. Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Sources 201806, 201808, 201807.
Edits/purpose: Layered warm extended chord, ascending rounded sparkle, recorded chip shower; deliberately not brass/8-bit. Premium perceptual quality REQUIRES listening approval.

sfx/bed-cabin.mp3
Author/source/licence: Fireplace (heavy).WAV by Makape https://freesound.org/people/Makape/sounds/414119/ CC0 1.0 (public HQ MP3 derivative). Wind Whistling Window Frame.wav by pavelvon https://freesound.org/people/pavelvon/sounds/396533/ CC0 1.0 (original WAV already on box). Both edited, filtered, mixed and circular crossfaded.
Edits/purpose: Close real fireplace with quiet exterior wind; actual crackle/pop recording, not a noise oscillator.

sfx/bed-apartment.mp3
Author/source/licence: Thunder, Rain, Next to window, -23LUFS by guidofm https://freesound.org/people/guidofm/sounds/592036/ CC0 1.0; public HQ MP3 derivative, excerpt 20–90 s, low-pass and circular crossfade. Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0. Original low nonmusical mechanical hum layer.
Edits/purpose: Real rain/window recording with a faint low hum; thunder exists in source and may remain; city hum is designed, not field recorded.

sfx/bed-casino.mp3
Author/source/licence: Casino.PalmDesert.CA.wav by fkunze https://freesound.org/people/fkunze/sounds/342309/ CC0 1.0; public HQ MP3 derivative, filtered, circular crossfaded. Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Source 201808 (sparse clatter layer).
Edits/purpose: Actual casino field recording; author says no recognizable voices; distant slot-machine atmosphere rather than invented music.

--- CHIPS ---
HOLD’EM CHIPS — 8 November 2026, America/Detroit (EST)

All 12 PNG files below: Grok generated (built-in GenerateImage), then extracted/recolored for this task. No third-party stock asset included. AI-generated, NOT CC0.

chips/chip-red-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored red while preserving white insert texture.

chips/chip-red-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored red while preserving white insert texture.

chips/chip-green-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored green while preserving white insert texture.

chips/chip-green-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored green while preserving white insert texture.

chips/chip-black-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored black while preserving white insert texture.

chips/chip-black-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored black while preserving white insert texture.

chips/chip-purple-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored purple while preserving white insert texture.

chips/chip-purple-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored purple while preserving white insert texture.

chips/chip-yellow-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored yellow while preserving white insert texture.

chips/chip-yellow-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored yellow while preserving white insert texture.

chips/chip-orange-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored orange while preserving white insert texture.

chips/chip-orange-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored orange while preserving white insert texture.

Tool/count: exactly TWO generation calls total (one top, one edge); no retries, backups, accounts, payment details, trials or payments. No generator free-tier label is exposed, so verified free-tier status cannot be certified. Native top source 1024×1024; native side source 1280×720. Deliverables are downsampled object extractions, not claimed native transparent renders.
Official FAQ checked during this session says users own Inputs/Outputs and may use generated images commercially; it asks attribution to Grok under its Brand Guidelines. The FAQ describes grok.com/mobile consumer use; the built-in tool does not expose a separate account contract. Suggested credit: AI-generated with Grok.

Source-first research (NOT used in delivered pixels):
https://opengameart.org/content/2d-poker-pack — Screaming Brain Studios, listed CC0; described as solid-color 2D/isometric sprites, not requested realistic textured clay. Page fetch returned 403; no download used.
https://opengameart.org/content/poker-chips — codeinfernogames, search listing CC0; small simple four-color 2D sprites, not premium requested material. No download used.
https://www.blendkit.com/asset-gallery-detail/c4367740-61b0-4575-a43a-8adb43edfede/ — Joachim Bornemann, actual source page states Creative Commons Zero; branded MINT Clay Smith set, not a ready unbranded transparent top/true-edge pair. No model or image used.
Generated instead to meet unbranded clay, exact camera and consistent recolor requirements.

Technical: straight RGBA PNG, real alpha, no checkerboard pixels, no external cast shadow. All six tops share identical alpha; all six sides share identical alpha. Top alpha bounds (4,4)–(508,508); side alpha bounds (4,28)–(508,68), right/bottom exclusive. For towers, visible side height is 40 px; overlap the padded 96px canvases (roughly 56px), or trim to alpha bounds. Do not stack full canvas heights with gaps.

Limitations: whites are warm off-white clay, not pure digital #fff; top inserts are slightly inset from perimeter while side inserts span the edge; top/side are separate render generations, not guaranteed exact 3D angular projection. Ring and clay grain are subtle at 48px. No denomination marks, numbers, logos or letters. No side top face visible. No root Hold’em docs, sounds, existing art, project code or deployment touched.

Documentation: credits.txt and HOLDEM-SFX-CHIPS-REPORT.md authored for this task by Grok Bot; SHA256SUMS.txt computed from delivered bytes.

Combined root HOLDEM-SFX-CHIPS-REPORT.md and appended credits authored by Grok Bot. Root SHA256SUMS.txt is an integrity manifest, not a creative asset licence. Subfolder documentation is authored by Grok Bot; subfolder SHA256SUMS.txt files are computed manifests.
```

## THE CHIPS — `chips/credits.txt` (verbatim)

```text
HOLD’EM CHIPS — 8 November 2026, America/Detroit (EST)

All 12 PNG files below: Grok generated (built-in GenerateImage), then extracted/recolored for this task. No third-party stock asset included. AI-generated, NOT CC0.

chip-red-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored red while preserving white insert texture.

chip-red-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored red while preserving white insert texture.

chip-green-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored green while preserving white insert texture.

chip-green-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored green while preserving white insert texture.

chip-black-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored black while preserving white insert texture.

chip-black-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored black while preserving white insert texture.

chip-purple-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored purple while preserving white insert texture.

chip-purple-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored purple while preserving white insert texture.

chip-yellow-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored yellow while preserving white insert texture.

chip-yellow-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored yellow while preserving white insert texture.

chip-orange-top.png
  Source/author: Grok generated; common red top-view source.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; normalized round top to 504×504 on 512×512 canvas; same design recolored orange while preserving white insert texture.

chip-orange-side.png
  Source/author: Grok generated; common red true-edge source, using top render as material reference.
  Licence: generated output, not a Creative Commons stock licence. Official output-use source https://x.ai/legal/faq ; terms https://x.ai/legal/terms-of-service .
  Processing: chroma-green removed into genuine antialiased alpha; slight edge inset and clean-inner-color extension prevent green fringe; uniformly scaled edge band to 504×40 on 512×96 canvas; same design recolored orange while preserving white insert texture.

Tool/count: exactly TWO generation calls total (one top, one edge); no retries, backups, accounts, payment details, trials or payments. No generator free-tier label is exposed, so verified free-tier status cannot be certified. Native top source 1024×1024; native side source 1280×720. Deliverables are downsampled object extractions, not claimed native transparent renders.
Official FAQ checked during this session says users own Inputs/Outputs and may use generated images commercially; it asks attribution to Grok under its Brand Guidelines. The FAQ describes grok.com/mobile consumer use; the built-in tool does not expose a separate account contract. Suggested credit: AI-generated with Grok.

Source-first research (NOT used in delivered pixels):
https://opengameart.org/content/2d-poker-pack — Screaming Brain Studios, listed CC0; described as solid-color 2D/isometric sprites, not requested realistic textured clay. Page fetch returned 403; no download used.
https://opengameart.org/content/poker-chips — codeinfernogames, search listing CC0; small simple four-color 2D sprites, not premium requested material. No download used.
https://www.blendkit.com/asset-gallery-detail/c4367740-61b0-4575-a43a-8adb43edfede/ — Joachim Bornemann, actual source page states Creative Commons Zero; branded MINT Clay Smith set, not a ready unbranded transparent top/true-edge pair. No model or image used.
Generated instead to meet unbranded clay, exact camera and consistent recolor requirements.

Technical: straight RGBA PNG, real alpha, no checkerboard pixels, no external cast shadow. All six tops share identical alpha; all six sides share identical alpha. Top alpha bounds (4,4)–(508,508); side alpha bounds (4,28)–(508,68), right/bottom exclusive. For towers, visible side height is 40 px; overlap the padded 96px canvases (roughly 56px), or trim to alpha bounds. Do not stack full canvas heights with gaps.

Limitations: whites are warm off-white clay, not pure digital #fff; top inserts are slightly inset from perimeter while side inserts span the edge; top/side are separate render generations, not guaranteed exact 3D angular projection. Ring and clay grain are subtle at 48px. No denomination marks, numbers, logos or letters. No side top face visible. No root Hold’em docs, sounds, existing art, project code or deployment touched.

Documentation: credits.txt and HOLDEM-SFX-CHIPS-REPORT.md authored for this task by Grok Bot; SHA256SUMS.txt computed from delivered bytes.
```

## THE SOUNDS — the first set (the kept stings) — `sfx/credits.txt` (verbatim)

```text
NEON SPEAKEASY — HOLD’EM AUDIO
Prepared 2026-11-08 (America/Detroit, EST). Free only; no payments, accounts, trials, or external paid generation used.
All source samples used are CC0 1.0. https://creativecommons.org/publicdomain/zero/1.0/
Kenney: the original pack License.txt explicitly authorizes personal/commercial projects. Source page was blocked; embedded licence and independent public CC0 collection corroborate it.
Freesound licences were read in the actual sound-page HTML and saved on the box. Public HQ MP3 previews were used where originals require an account; these are already lossy, and 192 kbps export does not restore lost information. Wind uses the existing original WAV.
All audio has been edited/trimmed, resampled, levelled, compressed as needed, and MP3-encoded. Ambient beds were layered and circularly crossfaded.
Grok generated here means original procedural synthesis created by Grok Bot, NOT an external music-generation service. Original synthesis dedicated CC0 1.0; commercial use permitted. Sample layers retain the listed CC0 dedication.
No attribution is legally required by CC0; preserving these courtesy credits is recommended.

shuffle.mp3
Author/source/licence: ShuffleAndBridge.wav by BMacZero; https://freesound.org/people/BMacZero/sounds/96131/ ; CC0 1.0; public HQ MP3 derivative, trimmed only.
Edits/purpose: Author explicitly identifies a real shuffle and bridge; preserves the complete ~1.8 s gesture instead of cutting the bridge.

deal.mp3
Author/source/licence: Kenney Vleugels (Kenney), Casino Audio 1.1; https://kenney.nl/assets/casino-audio ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Original embedded License.txt verified; publisher web page blocked; licence corroborated by public CC0 collection https://cc0-sounds.exi.software/collection/kenney_casinoaudio/ . Source card-slide-1.ogg; trimmed.
Edits/purpose: One fixed papery slide, compact for repeated dealing.

flip.mp3
Author/source/licence: Kenney Vleugels (Kenney), Casino Audio 1.1; https://kenney.nl/assets/casino-audio ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Original embedded License.txt verified; publisher web page blocked; licence corroborated by public CC0 collection https://cc0-sounds.exi.software/collection/kenney_casinoaudio/ . Source card-place-2.ogg; trimmed.
Edits/purpose: Papery placement used as flip substitute; recording is not verified face-up flip.

fold.mp3
Author/source/licence: Kenney Vleugels (Kenney), Casino Audio 1.1; https://kenney.nl/assets/casino-audio ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Original embedded License.txt verified; publisher web page blocked; licence corroborated by public CC0 collection https://cc0-sounds.exi.software/collection/kenney_casinoaudio/ . Source card-shove-2.ogg; tail shortened.
Edits/purpose: Soft card-shove gesture for mucking.

check.mp3
Author/source/licence: Knocking by Rvgerxini; https://freesound.org/people/Rvgerxini/sounds/462317/ ; CC0 1.0. Public HQ MP3 derivative; two low-pass filtered excerpts.
Edits/purpose: Real table knock doubled and damped; wooden source, not actually a padded-felt recording.

chip-bet.mp3
Author/source/licence: Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Sources 201806, 201808.
Edits/purpose: Genuine clay/ceramic clinks in a short two-stage bet; landing on felt not verified.

chip-raise.mp3
Author/source/licence: Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Sources 201807, 201808, 201806.
Edits/purpose: Heavier clay/ceramic cluster than a bet; layered rather than a literal full-stack cut recording.

all-in.mp3
Author/source/licence: Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Source 201807. Kenney Vleugels (Kenney), Casino Audio 1.1; https://kenney.nl/assets/casino-audio ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Original embedded License.txt verified; publisher web page blocked; licence corroborated by public CC0 collection https://cc0-sounds.exi.software/collection/kenney_casinoaudio/ . Sources chips-handle-5, card-slide-4. Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Recorded chip handling with clay clack and low tension; paper slide stands in for friction, not a literal full clay-stack push recording.

pot-win.mp3
Author/source/licence: Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Source 201808. Kenney Vleugels (Kenney), Casino Audio 1.1; https://kenney.nl/assets/casino-audio ; CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/ . Original embedded License.txt verified; publisher web page blocked; licence corroborated by public CC0 collection https://cc0-sounds.exi.software/collection/kenney_casinoaudio/ . Sources chips-handle-1, chips-handle-5.
Edits/purpose: Recorded chip-handling overlaps with a clay-clink finish; not an actual rake recording.

chip-stack.mp3
Author/source/licence: Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Sources 201806, 201808, 201807.
Edits/purpose: Fast recorded clay/ceramic clicks; edited stacking gesture, not verified riffling.

your-turn.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Soft major-third warm bell pair with restrained high harmonics.

timer-tick.mp3
Author/source/licence: Knocking by Rvgerxini; https://freesound.org/people/Rvgerxini/sounds/462317/ ; CC0 1.0; filtered small knock excerpt.
Edits/purpose: Subtle physical tick substitute (not a clock recording), attenuated to -25 LUFS padded; endpoints faded for clean repeat.

showdown.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Low close-interval suspense swell; late-night harmonic synth, no orchestra.

hand-win.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Warm major-triad glow with a muted upper sparkle.

knockout.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Low restrained impact and rounded harmonic tail; no aggressive crash.

blinds-up.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0.
Edits/purpose: Small soft two-note signal distinct from the turn cue.

champion.mp3
Author/source/licence: Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0. Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Sources 201806, 201808, 201807.
Edits/purpose: Layered warm extended chord, ascending rounded sparkle, recorded chip shower; deliberately not brass/8-bit. Premium perceptual quality REQUIRES listening approval.

bed-cabin.mp3
Author/source/licence: Fireplace (heavy).WAV by Makape https://freesound.org/people/Makape/sounds/414119/ CC0 1.0 (public HQ MP3 derivative). Wind Whistling Window Frame.wav by pavelvon https://freesound.org/people/pavelvon/sounds/396533/ CC0 1.0 (original WAV already on box). Both edited, filtered, mixed and circular crossfaded.
Edits/purpose: Close real fireplace with quiet exterior wind; actual crackle/pop recording, not a noise oscillator.

bed-apartment.mp3
Author/source/licence: Thunder, Rain, Next to window, -23LUFS by guidofm https://freesound.org/people/guidofm/sounds/592036/ CC0 1.0; public HQ MP3 derivative, excerpt 20–90 s, low-pass and circular crossfade. Grok generated — original procedural sound design (not an external AI audio service); warm harmonic/FM synthesis, filtered noise and short reverb; no external samples except where separately named. Original synthesis dedicated CC0 1.0. Original low nonmusical mechanical hum layer.
Edits/purpose: Real rain/window recording with a faint low hum; thunder exists in source and may remain; city hum is designed, not field recorded.

bed-casino.mp3
Author/source/licence: Casino.PalmDesert.CA.wav by fkunze https://freesound.org/people/fkunze/sounds/342309/ CC0 1.0; public HQ MP3 derivative, filtered, circular crossfaded. Clay/ceramic poker chips by fartheststar; CC0 1.0. poker_chips2.wav https://freesound.org/people/fartheststar/sounds/201806/ ; poker_chips6.wav https://freesound.org/people/fartheststar/sounds/201808/ ; poker_chips1.wav https://freesound.org/people/fartheststar/sounds/201807/ ; public HQ MP3 derivatives, trimmed and layered. Author specifies clay/ceramic, not cheap plastic; felt surface is not established. Source 201808 (sparse clatter layer).
Edits/purpose: Actual casino field recording; author says no recognizable voices; distant slot-machine atmosphere rather than invented music.
```

## THE SOUNDS — the real-recording set — `sfx2/credits.txt` (verbatim)

```text
HOLD'EM SFX2 - CREDITS
Every file is ONE contiguous excerpt of ONE real recording from Freesound.org. No synthesis, no layering, no stitching.
Source audio used: the ORIGINAL uploaded file of each sound (lossless WAV/AIFF/FLAC, downloaded with our free Freesound account) - not the lossy previews. Originals that are not 44.1 kHz were resampled to 44.1 kHz (SoXR); stereo originals were downmixed to mono.
Common edits on every file: resample to 44.1 kHz where needed, downmix to mono, 2nd-order high-pass filter (Hz given below), 2 ms fade-in starting 2 ms before the first transient, squared fade-out (ms below), one static gain change for level matching (no compression/limiting), encoded MP3 192 kbps CBR mono 44.1 kHz (LAME).

shuffle.mp3
  Source:  "Riffle Card Shuffle" by Kodack
  URL:     https://freesound.org/people/Kodack/sounds/256508/
  Licence: CC0 1.0 Universal (Public Domain Dedication) - https://creativecommons.org/publicdomain/zero/1.0/
  Used:    ORIGINAL file 256508__kodack__riffle-card-shuffle.wav (WAV, 16-bit PCM, 48 kHz, mono), excerpt 0.430s - 1.800s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 80 Hz, 2 ms fade-in, 80 ms fade-out, gain -1.7 dB, MP3 192k CBR

deal.mp3
  Source:  "Playing cards - Shuffling deck & deal" by Vrymaa
  URL:     https://freesound.org/people/Vrymaa/sounds/734631/
  Licence: CC0 1.0 Universal (Public Domain Dedication) - https://creativecommons.org/publicdomain/zero/1.0/
  Used:    ORIGINAL file 734631__vrymaa__playing-cards-shuffling-deck-deal.wav (WAV, 16-bit PCM, 44.1 kHz, mono), excerpt 22.263s - 22.480s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 80 Hz, 2 ms fade-in, 40 ms fade-out, gain +9.1 dB, MP3 192k CBR

deal-b.mp3
  Source:  "playing_cards.aif" by KevinHilt
  URL:     https://freesound.org/people/KevinHilt/sounds/196541/
  Licence: CC0 1.0 Universal (Public Domain Dedication) - https://creativecommons.org/publicdomain/zero/1.0/
  Used:    ORIGINAL file 196541__kevinhilt__playing_cards.aiff (AIFF, 24-bit PCM, 44.1 kHz, mono), excerpt 43.100s - 43.360s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 80 Hz, 2 ms fade-in, 40 ms fade-out, gain +16.3 dB, MP3 192k CBR

flip.mp3
  Source:  "GAMEMisc_Cards Dropping_HvD_OwSFX" by Hano_van_Dalen
  URL:     https://freesound.org/people/Hano_van_Dalen/sounds/767310/
  Licence: CC0 1.0 Universal (Public Domain Dedication) - https://creativecommons.org/publicdomain/zero/1.0/
  Used:    ORIGINAL file 767310__hano_van_dalen__gamemisc_cards-dropping_hvd_owsfx.wav (WAV, 24-bit PCM, 44.1 kHz, stereo), excerpt 0.436s - 0.680s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 80 Hz, 2 ms fade-in, 60 ms fade-out, gain +10.9 dB, MP3 192k CBR

fold.mp3
  Source:  "GAMEMisc_Cards Dropping_HvD_OwSFX" by Hano_van_Dalen
  URL:     https://freesound.org/people/Hano_van_Dalen/sounds/767310/
  Licence: CC0 1.0 Universal (Public Domain Dedication) - https://creativecommons.org/publicdomain/zero/1.0/
  Used:    ORIGINAL file 767310__hano_van_dalen__gamemisc_cards-dropping_hvd_owsfx.wav (WAV, 24-bit PCM, 44.1 kHz, stereo), excerpt 2.894s - 3.200s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 80 Hz, 2 ms fade-in, 60 ms fade-out, gain +15.1 dB, MP3 192k CBR

check.mp3
  Source:  "Tapping a finger on the table" by Pixel_Stick
  URL:     https://freesound.org/people/Pixel_Stick/sounds/838083/
  Licence: CC0 1.0 Universal (Public Domain Dedication) - https://creativecommons.org/publicdomain/zero/1.0/
  Used:    ORIGINAL file 838083__pixel_stick__tapping-a-finger-on-the-table.wav (WAV, 32-bit PCM, 48 kHz, mono), excerpt 0.263s - 0.575s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 60 Hz, 2 ms fade-in, 60 ms fade-out, gain -1.1 dB, MP3 192k CBR

chip-bet.mp3
  Source:  "Poker Chips landing on a wooden Table" by Benjamin152
  URL:     https://freesound.org/people/Benjamin152/sounds/445141/
  Licence: CC BY 3.0 (Attribution) - https://creativecommons.org/licenses/by/3.0/
  Used:    ORIGINAL file 445141__benjamin152__poker-chips-landing-on-a-wooden-table.wav (WAV, 24-bit PCM, 44.1 kHz, stereo), excerpt 0.534s - 0.975s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 80 Hz, 2 ms fade-in, 80 ms fade-out, gain +4.4 dB, MP3 192k CBR

chip-bet-b.mp3
  Source:  "poker_chips1.wav" by fartheststar
  URL:     https://freesound.org/people/fartheststar/sounds/201807/
  Licence: CC0 1.0 Universal (Public Domain Dedication) - https://creativecommons.org/publicdomain/zero/1.0/
  Used:    ORIGINAL file 201807__fartheststar__poker_chips1.wav (WAV, 16-bit PCM, 44.1 kHz, mono), excerpt 0.000s - 0.450s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 80 Hz, 2 ms fade-in, 80 ms fade-out, gain -5.6 dB, MP3 192k CBR

chip-raise.mp3
  Source:  "Clay Chips.flac" by ArtOrDie
  URL:     https://freesound.org/people/ArtOrDie/sounds/170295/
  Licence: CC BY 4.0 (Attribution) - https://creativecommons.org/licenses/by/4.0/
  Used:    ORIGINAL file 170295__artordie__clay-chips.flac (FLAC, 24-bit, 96 kHz, stereo), excerpt 151.581s - 152.150s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 120 Hz, 2 ms fade-in, 80 ms fade-out, gain +7.5 dB, MP3 192k CBR

chip-stack.mp3
  Source:  "Poker Chips stacking" by Benjamin152
  URL:     https://freesound.org/people/Benjamin152/sounds/445142/
  Licence: CC BY 3.0 (Attribution) - https://creativecommons.org/licenses/by/3.0/
  Used:    ORIGINAL file 445142__benjamin152__poker-chips-stacking.wav (WAV, 24-bit PCM, 44.1 kHz, stereo), excerpt 5.067s - 5.580s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 80 Hz, 2 ms fade-in, 60 ms fade-out, gain -0.9 dB, MP3 192k CBR

all-in.mp3
  Source:  "AllInPushChips.wav" by Joma86
  URL:     https://freesound.org/people/Joma86/sounds/532861/
  Licence: CC0 1.0 Universal (Public Domain Dedication) - https://creativecommons.org/publicdomain/zero/1.0/
  Used:    ORIGINAL file 532861__joma86__allinpushchips.wav (WAV, 16-bit PCM, 44.1 kHz, mono), excerpt 0.109s - 0.930s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 80 Hz, 2 ms fade-in, 120 ms fade-out, gain -8.8 dB, MP3 192k CBR

all-in-b.mp3
  Source:  "AllInPushChips2.wav" by Joma86
  URL:     https://freesound.org/people/Joma86/sounds/532860/
  Licence: CC0 1.0 Universal (Public Domain Dedication) - https://creativecommons.org/publicdomain/zero/1.0/
  Used:    ORIGINAL file 532860__joma86__allinpushchips2.wav (WAV, 16-bit PCM, 44.1 kHz, mono), excerpt 0.079s - 0.850s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 80 Hz, 2 ms fade-in, 120 ms fade-out, gain +0.2 dB, MP3 192k CBR

pot-win.mp3
  Source:  "Clay Chips.flac" by ArtOrDie
  URL:     https://freesound.org/people/ArtOrDie/sounds/170295/
  Licence: CC BY 4.0 (Attribution) - https://creativecommons.org/licenses/by/4.0/
  Used:    ORIGINAL file 170295__artordie__clay-chips.flac (FLAC, 24-bit, 96 kHz, stereo), excerpt 153.003s - 154.070s of the source (cut points matched to the previous preview-based cut by cross-correlation, offset 0 ms)
  Edits:   mono, high-pass 120 Hz, 2 ms fade-in, 120 ms fade-out, gain +10.3 dB, MP3 192k CBR

REQUIRED ATTRIBUTION (CC BY files - put these in the game's credits screen / repo credits):
  - "Clay Chips.flac" by ArtOrDie (https://freesound.org/people/ArtOrDie/sounds/170295/) - licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); excerpted, filtered, faded and level-adjusted.
  - "Poker Chips landing on a wooden Table" by Benjamin152 (https://freesound.org/people/Benjamin152/sounds/445141/) - licensed under CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/); excerpted, filtered, faded and level-adjusted.
  - "Poker Chips stacking" by Benjamin152 (https://freesound.org/people/Benjamin152/sounds/445142/) - licensed under CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/); excerpted, filtered, faded and level-adjusted.

CC0 sources need no attribution, but credit is given above anyway. Kenney Casino Audio (CC0) was downloaded but NOT used: its chip/card material and table surface are not documented, so it could not be shown to be clay chips or cards on felt.
```

## THE CARD FACES — `cards-src/SOURCE.txt` (verbatim)

```text
HOLD'EM's card faces (HE6) — the sources, never shipped at full size (scripts/build-holdem-cards.mjs bakes what ships).
cards-svg/  Byron Knoll, "Vector Playing Cards" — public domain in the author's own words ("I am releasing the images into the public
            domain", byronknoll.blogspot.com/2011/03/vector-playing-cards.html; Google Code project: "released into the public domain -
            attribution is appreciated but not required"). Downloaded Nov 10 2026 from the GitHub mirror github.com/notpeter/Vector-Playing-Cards
            (master.zip). NOT USED: AS.svg (Byron says its art is based on Suzanne Tyson's work, licence unknown) — HE6 draws its own ace of spades.
fonts/      Libre Baskerville (variable, used at weight 700) — SIL Open Font License 1.1 (fonts/OFL.txt), github.com/google/fonts ofl/librebaskerville.
            Only the corner-index glyphs (A K Q J 10 9 … 2) are converted to paths.
```
