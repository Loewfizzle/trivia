// THE CARD LAB's TEXT — SERVER ONLY (THE VAULT 1B — names only to owners): every lab item's NAME + what it does, keyed by id. The lab
// gets them with the marks (/api/admin labMarks — admins only); never in the site's code. A new lab item = its row here + its id in
// js/vault/catalog.js#LAB.
export const LAB_TEXT = {
 "emb-cocktail": { "name": "LAST CALL", "motion": "NEON (common) — a martini glass in cyan, its olive on a pick in green; still — its motion comes from the tube style you equip" },
 "emb-diamond": { "name": "DIAMOND", "motion": "NEON (common) — a brilliant-cut gem: its outline in sky blue, its facets in ice white" },
 "emb-glasses": { "name": "THE CREW", "motion": "NEON (uncommon) — two glasses raised together (gold + pink), a CLINK flashing between the rims" },
 "emb-sunrise": { "name": "EARLY BIRD", "motion": "NEON (uncommon) — the sun half up over the horizon in gold, its rays pulsing out one by one" },
 "emb-bullseye": { "name": "DEAD ON", "motion": "NEON (uncommon) — a target in pink rings + a white bull, a HIT rippling out from the centre" },
 "emb-crescent": { "name": "CRESCENT", "motion": "NEON (uncommon) — a violet crescent moon, a small cyan star beside it twinkling" },
 "emb-butterfly": { "name": "BUTTERFLY", "motion": "NEON (uncommon, level 9) — purple wings with pink accents (the antennae, a dot on each wing), its wings slowly opening + closing" },
 "emb-peephole": { "name": "KNOCK KNOCK", "motion": "NEON (rare) — the speakeasy's arched door in amber, its peephole SLIDING OPEN: warm light, two eyes looking out, a blink, it shuts" },
 "emb-stars": { "name": "THE SWEEP", "motion": "NEON (rare) — three stars (gold, pink, cyan), the light hopping from star to star" },
 "emb-wings": { "name": "WINGS", "motion": "METAL (epic) — aviator's wings in polished silver, three feather tiers each side, a gold roundel + star; a shine gliding across, the feather tips catching the light" },
 "emb-bitcoin": { "name": "HODL", "motion": "COIN (epic) — a struck gold coin, the ₿ embossed on its face; now + then it spins on its edge, a shine across it, a glint off the rim" },
 "emb-sunburst": { "name": "SUNBURST", "motion": "METAL (epic) — an Art Deco sunburst in gold (the Chrysler's fan), its rays catching the light one after another, a glint at its crown" },
 "emb-ace": { "name": "THE ACE", "motion": "METAL (legendary) — the ace of spades in black obsidian glass, a gold edge with light running round it, a deep red glow breathing inside" },
 "emb-sg-blackbird": { "name": "SKY KING", "motion": "METAL (legendary) — the city's real Blackbird from above (the long chined fuselage, the delta, both nacelles) in black chrome, its two afterburners flickering orange" },
 "emb-sg-f22": { "name": "AFTERBURNER", "motion": "METAL (legendary) — the city's real F-22 from above (the diamond wing, the canted tails) in grey chrome, twin flames with their shock diamonds pulsing" },
 "emb-sg-ghostship": { "name": "THE FLYING DUTCHMAN", "motion": "SPECTRAL (legendary) — the city's ghost ship (the high stern, three masts, the torn sails) in pale green glass you see through, its lanterns flickering, mist drifting along the waterline, the whole ghost breathing" },
 "emb-sg-aurora": { "name": "SKY DANCER", "motion": "AURORA (legendary) — a round badge of night sky over a mountain line, the northern lights' curtains drifting through it, stars" },
 "emb-sg-fireball": { "name": "MAKE A WISH", "motion": "COMET (legendary) — the fireball breaking up: its white-green head blazing, the tail streaming back, fragments peeling off one after another" },
 "emb-sg-skull": { "name": "HOT AIR, COLD BLOOD", "motion": "BALLOON (legendary) — the city's skull balloon in bone white, its eyes glowing orange, the burner's flame puffing under it" },
 "emb-sg-btc": { "name": "FIX THE MONEY, FIX THE WORLD", "motion": "BALLOON (legendary) — the city's ₿ balloon in orange gores, the ₿ in white, a gold pulse ringing out once a block, the burner's flame" },
 "emb-hw": { "name": "THE LANTERN", "motion": "NEON (epic, SEASONAL — Halloween) — a jack-o'-lantern in orange neon, its carved face lit by a flickering candle inside, a bat crossing" },
 "emb-tg": { "name": "HARVEST", "motion": "AUTUMN (epic, SEASONAL — Thanksgiving) — a maple leaf in amber turning crimson + back, its veins, a small leaf drifting down beside it" },
 "emb-xmas": { "name": "DECK THE HALLS", "motion": "NEON (epic, SEASONAL — Christmas) — a tree in green neon zig-zags, a gold star glinting on top, its bulbs chasing in colour" },
 "emb-nye": { "name": "AULD LANG SYNE", "motion": "NEON (epic, SEASONAL — New Year's) — a champagne coupe in gold, bubbles rising in it, a firework bursting over it" },
 "tube-gold": { "name": "GOLD TUBE", "motion": "A TUBE STYLE (rare, any neon emblem): the neon in gold glass — a warm gold body, a cream core — and one slow run of white-gold light round it" },
 "tube-flicker": { "name": "OLD SIGN", "motion": "A TUBE STYLE (rare): the flicker of an old sign — steady, a dip, a stutter now + then; the dark glass stays" },
 "tube-ember": { "name": "SLOW BURN", "motion": "A TUBE STYLE (uncommon, a 14-night streak): the tube smoulders — its glow in ember red, breathing slow + deep, two embers drifting up off it" },
 "tube-burnt": { "name": "BURNT OUT", "motion": "A TUBE STYLE (rare, level 53): one tube half dead — dark mostly, catching for a moment, dying again; the rest burns steady" },
 "tube-beat": { "name": "ON THE BEAT", "motion": "A TUBE STYLE (epic): a slow steady glow — and on a party night (Fri + Sat, 8 pm – 2 am) the glows + the core pulse on the song's own beat" },
 "glow-afterglow": { "name": "AFTERGLOW", "motion": "A NAME GLOW (common, still): a sunset's last pink + amber round the letters" },
 "glow-ice": { "name": "ICE", "motion": "A NAME GLOW (common, still): cold blue light round the letters" },
 "glow-neon": { "name": "NEON", "motion": "A NAME GLOW (uncommon): pink tube light with a cyan halo, the tube buzzing hotter now + then" },
 "glow-candle": { "name": "CANDLELIGHT", "motion": "A NAME GLOW (uncommon): warm amber, a candle's flicker in it" },
 "glow-frost": { "name": "FROST", "motion": "A NAME GLOW (uncommon, level 23): icy white letters, frost crystals creeping onto their top edge one after another" },
 "glow-fire": { "name": "FIRE", "motion": "A NAME GLOW (rare, level 38): the letters burning white-hot into orange, flame tongues licking off their top edge in turn" },
 "glow-starlight": { "name": "STARLIGHT", "motion": "A NAME GLOW (rare): pale starlight on the letters, small stars twinkling round the name" },
 "glow-tinsel": { "name": "TINSEL", "motion": "A NAME GLOW (rare): silver into gold leaf, specks of tinsel (red, green, gold) twinkling on the letters' edges" },
 "glow-champagne": { "name": "CHAMPAGNE", "motion": "A NAME GLOW (rare): pale champagne gold, bubbles of light rising off the letters + popping" },
 "glow-prism": { "name": "PRISM", "motion": "A NAME GLOW (epic): every colour through the letters, a white shine breathing over them, rainbow glints popping" },
 "glow-glitch": { "name": "GLITCH", "motion": "A NAME GLOW (epic, level 63): white letters; now + then the signal tears — a red + a cyan copy jumping off them, snapping back" },
 "card-dev-switchboard": { "name": "THE SWITCHBOARD", "motion": "1 OF 1 (yours only) — the brass radio desk in warm lamplight: glowing patch cables snake in + plug (a spark at each), their jacks' lamps light, light runs along them on the beat; ON AIR buzzes on; a VU needle + level lamps dance; dust in the lamp's beam, a glint across the brass; the gold-into-red laser" },
 "full-card-dev-switchboard": { "name": "THE SWITCHBOARD · FULL CARD", "motion": "The whole desk: four rows of jacks, five cables plugging in turn, ON AIR in its brass box, the VU meter + its lamps, the beam + its dust; THE DEVELOPER · № 0001 on your plate" },
 "card-gift-playerone": {"name": "PLAYER ONE", "motion": "GIFT · 1 OF 1 (the nephew) — the 16-bit hero on a pixel starfield: CRT scanlines + a soft flicker, pixel sparkles popping around him."},
 "full-card-gift-playerone": {"name": "PLAYER ONE · FULL CARD", "motion": "The whole cabinet: the scanlines + the CRT flicker, pixel sparkles popping around him, PRESS START blinking."},
 "card-gift-halloffame": {"name": "HALL OF FAME", "motion": "GIFT · 1 OF 1 (the nephew) — the bronze bust: a bronze GLEAM sweeping across the metal, the warm spotlight breathing."},
 "full-card-gift-halloffame": {"name": "HALL OF FAME · FULL CARD", "motion": "The bust on its plinth under a museum spotlight: the gleam sweeps the bronze every few seconds, the light breathes, dust in the beam."},
 "card-gift-enforcer": {"name": "THE ENFORCER", "motion": "GIFT · 1 OF 1 (the nephew) — charcoal on dark paper: dust drifting like embers, a slow gold light sweep, the 25 flickering like a stadium light."},
 "full-card-gift-enforcer": {"name": "THE ENFORCER · FULL CARD", "motion": "The full drawing + the giant smudged 25 behind him: charcoal dust drifting up like embers, the gold sweep, the 25 flickering."},
 "card-gift-linebacker": {"name": "THE LINEBACKER", "motion": "GIFT · 1 OF 1 (the nephew) — cel-shaded comic in navy + gold: speed rays turning slowly, the halftone shimmering, flash-bulb pops."},
 "full-card-gift-linebacker": {"name": "THE LINEBACKER · FULL CARD", "motion": "The comic panel: the rays turning, the halftone shimmering, \"HIT HARD.\" punching in, flash-bulb pops."},
 "card-gift-underlights": {"name": "UNDER THE LIGHTS", "motion": "GIFT · 1 OF 1 (the nephew) — neon duotone: the stadium flares breathing + flickering, the yard-line grid scrolling toward you, the neon edge pulsing."},
 "full-card-gift-underlights": {"name": "UNDER THE LIGHTS · FULL CARD", "motion": "The whole stadium night: the flares, the synthwave grid rolling toward you, the pink-neon edge pulsing."},
 "card-gift-sunsetstrip": {"name": "SUNSET STRIP", "motion": "GIFT · 1 OF 1 (Cambria) — the striped 80s sun shimmering in the heat, the palms swaying, a glint sweeping the aviators, warm sparkles drifting up."},
 "full-card-gift-sunsetstrip": {"name": "SUNSET STRIP · FULL CARD", "motion": "The whole SoCal sunset: the heat shimmer on the sun, both palms swaying, the aviators’ glint every few seconds, sparkles rising."},
 "card-gift-goldenhour": {"name": "GOLDEN HOUR", "motion": "GIFT · 1 OF 1 (Cambria) — the scrapbook: golden dust motes, the polaroid bobbing, the stickers twinkling, the heart pulsing, a glint on the gold shades."},
 "full-card-gift-goldenhour": {"name": "GOLDEN HOUR · FULL CARD", "motion": "The whole scrapbook page: the polaroid bobbing, the heart pulsing, the stickers twinkling, golden dust, the shades’ glint."},
 "card-gift-goldenboot": {"name": "GOLDEN BOOT", "motion": "GIFT · 1 OF 1 (Liam) — the floodlight beams breathing, gold dust drifting, the ball spinning with its gold trail pulsing, the crowd’s phone lights twinkling, the speed streaks shimmering."},
 "full-card-gift-goldenboot": {"name": "GOLDEN BOOT · FULL CARD", "motion": "The whole pitch under the floodlights: the beams, the gold dust, the spinning ball, the crowd’s lights, the speed streaks."},
 "card-gift-youngbuck": {"name": "BRUH", "motion": "GIFT · 1 OF 1 (Liam) — BRUH: his face in black-and-white photocopy on a torn split, the red punk wall, the duct tape reading BRUH; its own strip picture (eyebrows → chin): the red neon halo buzzing, the rays turning, the tape's corner lifting, sparkles + a flash off his face, the drips (calmer than the full card)."},
 "full-card-gift-youngbuck": {"name": "BRUH · FULL CARD", "motion": "The whole wall: the red neon halo round his outline buzzing + flickering like real neon, the rays turning slowly, sparkles (never on his face), camera flashes popping one at a time, the tape's corner lifting + settling, a chalk scribble drawing itself once as the card appears, the drips crawling; BRUH printed big in gold."},
 "card-gift-icecold": {"name": "ICE COLD", "motion": "GIFT · 1 OF 1 (Liam) — snow falling, the aurora flowing behind him, the frost creeping in from the edges + easing back, his breath puffing, a cold glint along his outline."},
 "full-card-gift-icecold": {"name": "ICE COLD · FULL CARD", "motion": "The whole frozen night: snow, the flowing aurora, the frost at the edges, his breath, the cold glint."},
 "card-gift-anarchist": {"name": "THE ANARCHIST", "motion": "YOURS · 1 OF 1 (the owner’s own — never in GIFTS) — the red circle-A buzzing like a neon tube, the paint drips crawling, glitter twinkling, embers rising, a star flare across the aviators."},
 "full-card-gift-anarchist": {"name": "THE ANARCHIST · FULL CARD", "motion": "The whole wall: the circle-A buzzing (a quick flicker now and then), drips crawling down, glitter, embers, the aviators’ star flare, the gold + pink beams swaying, smoke drifting."},
 "card-gift-buzzed": {"name": "BUZZED LIGHTYEAR", "motion": "GIFT · 1 OF 1 (your friend — give it in /admin → GIFTS) — its own strip picture (his eyebrows → his chin): the pink + yellow spiral turning slowly behind him, the halftone dots shimmering, a sparkle or two (calmer than the full card)."},
 "full-card-gift-buzzed": {"name": "BUZZED LIGHTYEAR · FULL CARD", "motion": "Pop art, seeing stars: the dizzy pink + yellow spiral TURNS slowly behind him (he never moves — cut out of the picture, the spiral redrawn under him), the halftone dots shimmer in a wave, five stars ORBIT his cap on the white ring (behind his head on the far side, smaller + dimmer; in front on the near side, twinkling, a sparkle popping off each), the HIC! burst pops with a hiccup + a wobble every few seconds, sparkles round the spiral; BUZZED LIGHTYEAR printed bold bottom-right. Reduced motion = the approved picture."},
 "card-redline": {"name": "REDLINE", "motion": "LEGENDARY (OVERCLOCK — every challenge of a Quick match, 2+ players): Grok’s tachometer + the game’s NEEDLE — it sweeps up from rest when the card appears, SLAMS into the red, overshoots, then shakes like a pegged engine (a hard judder settling into a fine tremble that never stops, a rev now and then); the red zone’s heat pulsing with it; sparks pouring off the needle’s tip; the border laser in molten orange. The gem has a dark backing (it sat on the gauge’s hot red edge)."},
 "full-card-redline": {"name": "REDLINE · FULL CARD", "motion": "The whole dial: the needle sweeps up from 7:30 + slams into the red (≈ 3:30), overshoots, shakes; the heat glowing along the red zone’s arc in time with the shake; the sparks pouring off the tip up + right; the chrome cap over the needle’s root; the border laser."},
 "card-photofinish": {"name": "PHOTO FINISH", "motion": "RARE (OVERCLOCK — a win by exactly one point, 2+ players): Grok’s top-down finish — two neon cars, orange + blue, noses dead even on the line; the game’s red LASER on the finish line, a bright point scanning top → bottom + back; as it crosses the noses a white FLASH pops + orange / blue sparks crackle between them; the light trails shimmer; glowing blue edges."},
 "full-card-photofinish": {"name": "PHOTO FINISH · FULL CARD", "motion": "The whole finish: the laser line + its scanning point, the flash (~¼ s) + the sparks crackling between the two noses each time it crosses, a sheen sliding back along both cars’ light trails."},
 "card-dev-source": { "name": "THE SOURCE", "motion": "1 OF 1 (yours only) — the city's real code streaming in columns (far dim + soft, near bright + sharp), lines running gold; the NEON sign igniting letter by letter with sparks, a power surge, glitches, CRT scanlines; the green-into-magenta laser" },
 "full-card-dev-source": { "name": "THE SOURCE · FULL CARD", "motion": "The cursor types city.build({ by: 'LOEWFIZZLE' }) → ENTER → every column runs gold → NEON ignites letter by letter → THE SURGE; glitch passes, the rolling refresh band, the sign collapsing to a line at the end; THE DEVELOPER · № 0001" },
 "emb-crown": { "name": "THE CROWN", "motion": "NEON (rare) — its OWN shape now (no second three-spike crown beside THE HOUSE's): an imperial crown, its two violet arches sweeping up to the gold orb + cross, the band's three gems twinkling in turn, a glint off the cross" },
 "card-safecracker": { "name": "SAFECRACKER", "motion": "RARE (THE PASSWORD — both doors in six guesses or fewer): Grok’s chrome vault door swung open, magenta rim left, cyan on the hinge side, the gold blaze inside; the game’s layers: GOLD DUST drifting out of the vault to the right (two staggered drifts, flickering), the blaze BREATHING slowly, a glint running round the wheel’s rim now and then. The strip shows the wheel + the gold; the plate sits on the dark vault wall." },
 "full-card-safecracker": { "name": "SAFECRACKER · FULL CARD", "motion": "The whole door: the dust pouring out to the right, the blaze breathing, the glint on the wheel; the plate keeps to the dark wall on the left." },
 "card-ghost-run": { "name": "GHOST RUN", "motion": "RARE (COAST CLEAR — a clear with no light finding you, in 50 seconds or less): Grok’s glossy black speedboat racing right in a burst of white + cyan spray, two searchlight beams crossing behind it, a lighthouse on the pink horizon; the game’s layers: the SPRAY thrown back off the bow (droplets arcing + flickering out), the lighthouse’s lamp BREATHING with a short beam sweeping round now and then, a soft shimmer where the searchlights cross (they never find you), a light running along the hull’s cyan trim. The strip sits ~10 % lower than centre (the boat sits low); the left stays clear for a long name." },
 "full-card-ghost-run": { "name": "GHOST RUN · FULL CARD", "motion": "The whole run: the boat + its spray, the crossing searchlights above, the lighthouse on the horizon; the plate keeps to the dark water + sky on the left." },
 "card-perfect-week": { "name": "PERFECT WEEK", "motion": "EPIC (THE DAILIES — THE SWEEP seven days in a row): Grok’s fan of neon-tube tickets (pink · violet · blue · white · blue · orange) round a white-hot starburst, reflected on black glass; the reward’s layers: A LIGHT RUNS ALONG THE FAN one ticket a beat (the days), then the whole fan flares together and settles; the burst BREATHES, sparks drift up out of it. The strip zoomed out + set right (the fan ≈ 0.80 across)." },
 "full-card-perfect-week": { "name": "PERFECT WEEK · FULL CARD", "motion": "The whole fan + its reflection: the light running ticket to ticket, the flare, the breathing burst, the sparks; the plate keeps to the dark glass on the left." },
 "emb-lighthouse": { "name": "LIGHTHOUSE", "motion": "NEON (uncommon — any clear of COAST CLEAR): a lighthouse in tubes — the white tapered tower with its stripe, the gold lamp room + cap, a cyan wave at its foot; its BEAM swinging round on the lamp (the lens turning) while the lamp’s glow breathes" },
 "emb-keyhole": { "name": "KEYHOLE", "motion": "NEON (uncommon — any full crack of THE PASSWORD): a keyhole in amber — the round eye and the slot below it — with a pink key’s tip at the eye; a warm light GLOWING through the hole, swelling + fading slowly (the room behind the door)" },
 "emb-key": { "name": "THE KEY", "motion": "NEON — the house style: an amber key with a pink diamond in its bow, two tubes in the sign's own layers (glass, glow, body, white-hot core); still — its motion comes from the tube style you equip" },
 "emb-sweetheart": { "name": "SWEETHEART", "motion": "NEON — a pink neon heart done properly (full round lobes, a long point, a reflection arc) with a little purple heart tucked over its shoulder" },
 "emb-owl": { "name": "THE OWL", "motion": "NEON — an Art Deco owl, no cartoon: a stepped totem in violet, sharp ear tufts, a chevron brow, two narrow almond eyes in gold" },
 "emb-prism": { "name": "FOUR ON THE FLOOR", "motion": "PRISM — a glass prism: a rainbow sweeping through it, a sheen, a glint off its peak; the white beam in, the four lines out pulsing in turn" },
 "emb-house": { "name": "THE HOUSE", "motion": "GOLD — a struck-gold crown with its gems, a dark edge + a bright bevel; a slow shine crossing it + a glint off its peak" },
 "emb-snowflake": { "name": "SNOWED IN", "motion": "ICE CRYSTAL — a cut-ice snowflake: frost growing out at each tip in turn, a glint as each one finishes" },
 "emb-torch": { "name": "THE FLAME", "motion": "MOLTEN — the flame as lava: a black crust, glowing cracks pulsing, the hot core breathing, a drop of lava falling off its foot, embers rising beside it" },
 "emb-lightning": { "name": "RAINMAKER", "motion": "GLITCH — the bolt in white with red + cyan ghosts; now and then it jumps, two slices tear sideways, it snaps back" },
 "emb-sg-tr3b": { "name": "LIGHTS OUT", "motion": "CHROME — the city's REAL TR-3B from below in black chrome: a light gliding across it, its WHITE corner lights pulsing in turn, the RED centre's slow heartbeat" },
 "emb-sg-ufo": { "name": "I WANT TO BELIEVE", "motion": "GALAXY — the city's saucer filled with deep space: a nebula drifting through it, stars twinkling inside, its rim ports chasing, the beam's rays pulsing below" },
 "emb-signup": { "name": "THE 12 SIGN-UP SHAPES", "motion": "Today's 12 emblems (the ones you pick when you join) as commons on the NEON renderer — the frame + the icon as two tubes in your colour, crisp at 3×" },
 "tube-twotone": { "name": "TWO-TONE", "motion": "A TUBE STYLE (any neon emblem): two colours in one tube — your colour into its partner across the wheel" },
 "tube-breath": { "name": "BREATHING", "motion": "A TUBE STYLE (any neon emblem): the glow breathes slowly in and out" },
 "tube-chase": { "name": "A CHASING LIGHT", "motion": "A TUBE STYLE (any neon emblem): a white-hot light running round and round the tube" },
 "glow-ember": { "name": "EMBER", "motion": "A NAME GLOW (common, still): warm coal light round the letters — the name only, never the level" },
 "glow-gold": { "name": "GOLD LEAF", "motion": "A NAME GLOW (rare): the name in struck gold leaf, a glint popping on its letters one place after another" },
 "glow-spark": { "name": "ELECTRIC", "motion": "A NAME GLOW (rare): cold electric light, small arcs crackling along the top + the foot of the letters in turn" },
 "card-founder": {
  "name": "FOUNDING MEMBER",
  "motion": "OPENING NIGHT — the big NEON SPEAKEASY sign on the speakeasy's roof lighting letter by letter over the city (the title's own NEON tubes, then SPEAKEASY), searchlights once it all burns; your member № stamped in gold; THE BORDER LASER"
 },
 "full-card-founder": {
  "name": "FOUNDING MEMBER · FULL CARD",
  "motion": "OPENING NIGHT at full size — the sign switching on letter by letter, the EST. 1924 date stone in the parapet, the searchlights, your № + MEMBER SINCE in a gold first-edition stamp; THE BORDER LASER"
 },
 "card-house": {
  "name": "THE HOUSE",
  "motion": "THE SPEAKEASY IN FULL BLAZE — every sign lit (the blade's bulbs chasing), a neon crown over the door, the finale's gold willows falling behind it; THE BORDER LASER"
 },
 "full-card-house": {
  "name": "THE HOUSE · FULL CARD",
  "motion": "THE SPEAKEASY IN FULL BLAZE at full size — the whole front lit, the blade + its chasing bulbs, the crown over the door, gold willows raining behind the roof; THE BORDER LASER"
 },
 "card-platinum": {
  "name": "PLATINUM",
  "motion": "THE METAL CARD — a solid brushed-platinum plate, a diamond-cut bevelled edge, a cold white light sliding across it + catching the bevel"
 },
 "full-card-platinum": {
  "name": "PLATINUM · FULL CARD",
  "motion": "THE METAL CARD at full size — brushed platinum, the diamond-cut bevel, the cold light sliding across + a glint off the cut corner"
 },
 "card-zebra": {
  "name": "ZEBRA",
  "motion": "Real zebra hide, black and white — a hot pink shine sweeping across it"
 },
 "full-card-zebra": {
  "name": "ZEBRA · FULL CARD",
  "motion": "Real zebra hide, black and white — a hot pink shine sweeping across it, at full size"
 },
 "card-camo": {
  "name": "CAMO",
  "motion": "Woodland camo, a night-vision scan line sweeping through it + a reticle locking onto you"
 },
 "full-card-camo": {
  "name": "CAMO · FULL CARD",
  "motion": "Woodland camo, a night-vision scan line sweeping through it + a reticle locking onto you, at full size"
 },
 "card-velvet": {
  "name": "VELVET ROOM",
  "motion": "Oxblood velvet with cream + gold piping, a warm stage spotlight drifting across it, dust in the beam, glowing edges"
 },
 "full-card-velvet": {
  "name": "VELVET ROOM · FULL CARD",
  "motion": "Oxblood velvet with cream + gold piping, a warm stage spotlight drifting across it, dust in the beam, glowing edges, at full size"
 },
 "card-aurora": {
  "name": "AURORA",
  "motion": "The northern lights rippling under glass — the city’s own aurora strands, glowing edges"
 },
 "full-card-aurora": {
  "name": "AURORA · FULL CARD",
  "motion": "The northern lights rippling under glass — the city’s own aurora strands, glowing edges, at full size"
 },
 "card-rosegold": {
  "name": "ONYX & ROSE GOLD",
  "motion": "Black onyx with pale veins under a rose-gold diamond lattice, a rose-gold shine, glowing edges"
 },
 "full-card-rosegold": {
  "name": "ONYX & ROSE GOLD · FULL CARD",
  "motion": "Black onyx with pale veins under a rose-gold diamond lattice, a rose-gold shine, glowing edges, at full size"
 },
 "card-gold": {
  "name": "GOLD FOIL",
  "motion": "Hammered gold foil, a deco sunburst whose rays catch the light in turn + glint, glowing edges"
 },
 "full-card-gold": {
  "name": "GOLD FOIL · FULL CARD",
  "motion": "Hammered gold foil, a deco sunburst whose rays catch the light in turn + glint, glowing edges, at full size"
 },
 "card-flame30": {
  "name": "THE 30-NIGHT FLAME",
  "motion": "Charcoal with a bed of embers breathing along the foot, low flames, sparks lifting off, glowing edges"
 },
 "full-card-flame30": {
  "name": "THE 30-NIGHT FLAME · FULL CARD",
  "motion": "Charcoal with a bed of embers breathing along the foot, low flames, sparks lifting off, glowing edges, at full size"
 },
 "card-marble": {
  "name": "MARBLE & GOLD",
  "motion": "White marble with real gold veins, glints catching along them, glowing edges"
 },
 "full-card-marble": {
  "name": "MARBLE & GOLD · FULL CARD",
  "motion": "White marble with real gold veins, glints catching along them, glowing edges, at full size"
 },
 "card-neoncamo": {
  "name": "NEON CAMO",
  "motion": "Night camo whose patches are traced in neon, a wave of power running through the outlines, glowing edges"
 },
 "full-card-neoncamo": {
  "name": "NEON CAMO · FULL CARD",
  "motion": "Night camo whose patches are traced in neon, a wave of power running through the outlines, glowing edges, at full size"
 },
 "card-carbon": {
  "name": "CARBON",
  "motion": "Woven carbon fibre, a cold blue shine running across the weave, glowing edges"
 },
 "full-card-carbon": {
  "name": "CARBON · FULL CARD",
  "motion": "Woven carbon fibre, a cold blue shine running across the weave, glowing edges, at full size"
 },
 "card-confetti": {
  "name": "CONFETTI",
  "motion": "Party violet, paper confetti + curls tumbling down, flashing as they turn, glowing edges"
 },
 "full-card-confetti": {
  "name": "CONFETTI · FULL CARD",
  "motion": "Party violet, paper confetti + curls tumbling down, flashing as they turn, glowing edges, at full size"
 },
 "card-circuit": {
  "name": "CIRCUIT",
  "motion": "A dark green board, copper traces + vias, signals racing along them, an overclocked burst now and then, glowing edges"
 },
 "full-card-circuit": {
  "name": "CIRCUIT · FULL CARD",
  "motion": "A dark green board, copper traces + vias, signals racing along them, an overclocked burst now and then, glowing edges, at full size"
 },
 "card-noir": {
  "name": "VELVET NOIR",
  "motion": "Black velvet, a crimson neon tube inside the edge flickering on, smoke drifting through"
 },
 "full-card-noir": {
  "name": "VELVET NOIR · FULL CARD",
  "motion": "Black velvet, a crimson neon tube inside the edge flickering on, smoke drifting through, at full size"
 },
 "card-sapphire": {
  "name": "SAPPHIRE & SILVER",
  "motion": "Deep sapphire stone with pale veins, a silver shine + silver-leaf glints"
 },
 "full-card-sapphire": {
  "name": "SAPPHIRE & SILVER · FULL CARD",
  "motion": "Deep sapphire stone with pale veins, a silver shine + silver-leaf glints, at full size"
 },
 "card-legend": {
  "name": "PRISM LEGEND",
  "motion": "Black holographic foil, the whole spectrum sliding across it in a band, white glints"
 },
 "full-card-legend": {
  "name": "PRISM LEGEND · FULL CARD",
  "motion": "Black holographic foil, the whole spectrum sliding across it in a band, white glints, at full size"
 },
 "card-century": {
  "name": "CENTURY",
  "motion": "Burnished bronze foil, an Art Deco sunburst pressed into it, its sun middle-right, a slow light sweep across the metal + golden embers lifting"
 },
 "full-card-century": {
  "name": "CENTURY · FULL CARD",
  "motion": "Burnished bronze foil, an Art Deco sunburst pressed into it from behind the name, a slow light sweep across the metal + golden embers lifting, at full size"
 },
 "card-marquee-gold": {
  "name": "THE MARQUEE · GOLD BULBS",
  "motion": "Black velvet ringed by a double row of gold bulbs chasing, two searchlights crossing behind"
 },
 "full-card-marquee-gold": {
  "name": "THE MARQUEE · GOLD BULBS · FULL CARD",
  "motion": "Black velvet ringed by a double row of gold bulbs chasing, two searchlights crossing behind, at full size"
 },
 "card-penthouse": {
  "name": "PENTHOUSE",
  "motion": "EPIC (THE DAILIES — the top 1 % of a daily's counting finishers, from 50): design A · THE DIAL, DRAWN IN CODE — an Art Deco elevator floor dial (1 → 9 → PH, gold on black lacquer, sunburst rays behind) over gold doors with chevrons + Deco pilasters. The needle sweeps up from 1 and lands on PH, PH + its label blaze warm gold, then a line of light opens between the doors. The slim strip shows the dial + PH (its own band), PH clear of the gem corner."
 },
 "full-card-penthouse": {
  "name": "PENTHOUSE · FULL CARD",
  "motion": "THE DIAL at full size: the floor numbers round the arch, the needle's climb to PH, PH's warm blaze + bloom, the light opening between the gold doors; the left 42 % dark lacquer for the name."
 },
 "card-wildfire": {
  "name": "WILDFIRE",
  "motion": "A ridge on fire at night: pines against a wall of flame, smoke lit orange from below, embers whirled up + THE BORDER LASER"
 },
 "full-card-wildfire": {
  "name": "WILDFIRE · FULL CARD",
  "motion": "A ridge on fire at night: pines against a wall of flame, smoke lit orange from below, embers whirled up, at full size + THE BORDER LASER"
 },
 "card-eternal": {
  "name": "ETERNAL FLAME",
  "motion": "A bronze brazier holding one slow violet-into-gold flame, sparks spiralling up + THE BORDER LASER"
 },
 "full-card-eternal": {
  "name": "ETERNAL FLAME · FULL CARD",
  "motion": "A bronze brazier holding one slow violet-into-gold flame, sparks spiralling up, at full size + THE BORDER LASER"
 },
 "card-witness": {
  "name": "THE WITNESS",
  "motion": "A gold star chart: every legend over the harbor as a constellation, lighting up one after another + THE BORDER LASER"
 },
 "full-card-witness": {
  "name": "THE WITNESS · FULL CARD",
  "motion": "A gold star chart: every legend over the harbor as a constellation, lighting up one after another, at full size + THE BORDER LASER"
 },
 "card-sg-tr3b": {
  "name": "LIGHTS OUT",
  "motion": "The TR-3B over a city going dark: its white corner lights + red heart pulsing, energy racing its circuitry, the windows dying in a wave from under it, the quay lamps sputtering out, the power stuttering back + THE BORDER LASER"
 },
 "full-card-sg-tr3b": {
  "name": "LIGHTS OUT · FULL CARD",
  "motion": "The TR-3B over a city going dark: its white corner lights + red heart pulsing, energy racing its circuitry, the windows dying in a wave from under it, the quay lamps sputtering out, the power stuttering back, the title in neon + THE BORDER LASER"
 },
 "card-sg-blackbird": {
  "name": "SKY KING",
  "motion": "The real SR-71 flat out at dusk over a sea of cloud: twin afterburners + shock diamonds, the contrails catching the sunset, the cloud deck racing under it + THE BORDER LASER"
 },
 "full-card-sg-blackbird": {
  "name": "SKY KING · FULL CARD",
  "motion": "The real SR-71 flat out at dusk over a sea of cloud: twin afterburners + shock diamonds, the contrails catching the sunset, the cloud deck racing under it, the title in neon + THE BORDER LASER"
 },
 "card-sg-f22": {
  "name": "AFTERBURNER",
  "motion": "Three real F-22s in a tight vic high over the clouds: afterburners + shock diamonds, vapour cones blooming + snapping off, the sun on their skins + THE BORDER LASER"
 },
 "full-card-sg-f22": {
  "name": "AFTERBURNER · FULL CARD",
  "motion": "Three real F-22s in a tight vic high over the clouds: afterburners + shock diamonds, vapour cones blooming + snapping off, the sun on their skins, the title in neon + THE BORDER LASER"
 },
 "card-sg-ghostship": {
  "name": "THE FLYING DUTCHMAN",
  "motion": "The ghost ship under sail on Halloween night: its green lanterns flickering, fog rolling off the hull + across the water, its reflection, bats across the moon + THE BORDER LASER"
 },
 "full-card-sg-ghostship": {
  "name": "THE FLYING DUTCHMAN · FULL CARD",
  "motion": "The ghost ship under sail on Halloween night: its green lanterns flickering, fog rolling off the hull + across the water, its reflection, bats across the moon, the title in neon + THE BORDER LASER"
 },
 "card-sg-aurora": {
  "name": "SKY DANCER",
  "motion": "The northern lights rippling over the harbor — green, a pink hem, crimson on top — their reflection on the water + THE BORDER LASER"
 },
 "full-card-sg-aurora": {
  "name": "SKY DANCER · FULL CARD",
  "motion": "The northern lights rippling over the harbor — green, a pink hem, crimson on top — their reflection on the water, the title in neon + THE BORDER LASER"
 },
 "card-sg-fireball": {
  "name": "MAKE A WISH",
  "motion": "A green fireball streaking across the night, flaring + breaking apart, its glowing train lingering, the harbor lit by the flash + THE BORDER LASER"
 },
 "full-card-sg-fireball": {
  "name": "MAKE A WISH · FULL CARD",
  "motion": "A green fireball streaking across the night, flaring + breaking apart, its glowing train lingering, the harbor lit by the flash, the title in neon + THE BORDER LASER"
 },
 "card-sg-skull": {
  "name": "HOT AIR, COLD BLOOD",
  "motion": "The skull balloon drifting over the rooftops at night — its burner roaring, lighting the skull from below, embers rising + THE BORDER LASER"
 },
 "full-card-sg-skull": {
  "name": "HOT AIR, COLD BLOOD · FULL CARD",
  "motion": "The skull balloon drifting over the rooftops at night — its burner roaring, lighting the skull from below, embers rising, the title in neon + THE BORDER LASER"
 },
 "card-sg-btc": {
  "name": "FIX THE MONEY, FIX THE WORLD",
  "motion": "LEGENDARY — Grok’s ₿ balloon over the neon harbor at dusk (its own strip band: the ₿ + the coins). THE FLARE: the burner fires in bursts a few seconds apart and the whole envelope lights up from inside, hottest at the mouth, the ₿ blazing; every 10 s a BLOCK burn + a gold ring pulsing out from the ₿; the coins rise + spin with glints; a gold sheen across the ₿; the balloon sways gently + THE BORDER LASER in gold"
 },
 "full-card-sg-btc": {
  "name": "FIX THE MONEY, FIX THE WORLD · FULL CARD",
  "motion": "The whole picture (the left + the foot darkened for the plate + MEMBER SINCE): the balloon RISES into the card, then a big first burn lights it; then the burner fires every few seconds — the envelope lit from inside, a soft bloom round it, the flame flaring on the real burner, the harbor water catching the flicker; the block ring every 10 s; the coins rise + spin; the reflections shimmer + THE BORDER LASER. Reduced motion = the lit frame"
 },
 "card-brushed": {
  "name": "BRUSHED GOLD",
  "motion": "Still — real brushed gold, a bevelled edge; its emblem leads"
 },
 "card-smoke": {
  "name": "SMOKE ROOM",
  "motion": "Smoke drifting across + curling off the edge, lit by a warm lamp"
 },
 "card-frostbite": {
  "name": "FROSTBITE",
  "motion": "Frost creeping in from the edges, a crack running + glinting"
 },
 "card-inferno": {
  "name": "INFERNO",
  "motion": "Flames licking up, embers rising, the edge glowing + pulsing"
 },
 "card-prism": {
  "name": "PRISM",
  "motion": "A white beam splitting into a sweeping rainbow + a holo sheen"
 },
 "card-marquee": {
  "name": "THE MARQUEE",
  "motion": "Theatre bulbs chasing round the edge + a neon tube flickering on"
 },
 "card-glitter": {
  "name": "GLITTER BOMB",
  "motion": "Pink glitter bursting from the middle, hearts tumbling, sparkles popping"
 },
 "card-sg-ufo": {
  "name": "I WANT TO BELIEVE",
  "motion": "The real UFO over the harbor, its beam pulsing, motes rising, ports chasing + THE BORDER LASER"
 },
 "emb-test-neon": {
  "name": "BOLT · NEON",
  "motion": "The house tube: its glow, an ignition flicker (quiet on a legendary)"
 },
 "emb-test-prism": {
  "name": "BOLT · PRISM",
  "motion": "A rainbow sweeping through the shape, a white edge, a glint (leads on a still card)"
 },
 "card-gilded": {
  "name": "GILDED",
  "motion": "Still — black lacquer, the brass fan over the door, a brass double frame (everyone owns it; its full card is the Gilded membership card)"
 },
 "card-midnight": {
  "name": "MIDNIGHT",
  "motion": "Still — ink + starlight: a deep blue night, a faint band of the galaxy, stars at three sizes"
 },
 "card-heartbreaker": {
  "name": "HEARTBREAKER",
  "motion": "Pink + lilac hearts drifting up through violet, swaying + turning, calmer behind the name"
 },
 "card-brass": {
  "name": "BRASS DECO",
  "motion": "Still — warm brass engraved like the bar rail: a deco lattice cut in, a polished crown"
 },
 "card-emerald": {
  "name": "EMERALD & BRASS",
  "motion": "Green-black lacquer, a stepped deco crown in brass + emerald; a shine sweeps the foil + a glint"
 },
 "card-neonglass": {
  "name": "NEON GLASS",
  "motion": "Smoked glass, a cyan tube bent round inside the edge — breathing, now + then it stutters"
 },
 "card-chrome": {
  "name": "SILVER CHROME",
  "motion": "Mirror chrome, a prism running the rim; a cold shine sweeps across + a glint"
 },
 "card-champagne": {
  "name": "MIDNIGHT & CHAMPAGNE",
  "motion": "Navy lacquer, Chrysler arches in champagne silver; a warm shine sweeps the foil"
 },
 "full-card-brushed": {
  "name": "BRUSHED GOLD · FULL CARD",
  "motion": "Still — the brushed gold at full size, its bevel + a bar-rail sheen; the emblem leads"
 },
 "full-card-smoke": {
  "name": "SMOKE ROOM · FULL CARD",
  "motion": "Banks of smoke drifting through the lounge in two depths, curling up off the card, the lamp warming them"
 },
 "full-card-frostbite": {
  "name": "FROSTBITE · FULL CARD",
  "motion": "Frost growing in from every edge, the crack running across the ice + its glint, then easing back"
 },
 "full-card-inferno": {
  "name": "INFERNO · FULL CARD",
  "motion": "A wall of flame up the card, embers + sparks rising, the edge burning + breathing, a foil sheen"
 },
 "full-card-prism": {
  "name": "PRISM · FULL CARD",
  "motion": "The white beam into the glass prism, the rainbow fanning out + sweeping, the holo sheen, a glinting edge"
 },
 "full-card-marquee": {
  "name": "THE MARQUEE · FULL CARD",
  "motion": "A full ring of theatre bulbs chasing (+ the ring flash) round red velvet, the neon arrow flickering on"
 },
 "full-card-glitter": {
  "name": "GLITTER BOMB · FULL CARD",
  "motion": "Pink glitter bursting with a shockwave, foil flakes flashing, hearts tumbling, sparkles popping"
 },
 "full-card-midnight": {
  "name": "MIDNIGHT · FULL CARD",
  "motion": "Still — the night + its stars at full size"
 },
 "full-card-heartbreaker": {
  "name": "HEARTBREAKER · FULL CARD",
  "motion": "Hearts drifting up the whole card, a pink haze breathing at the foot"
 },
 "full-card-brass": {
  "name": "BRASS DECO · FULL CARD",
  "motion": "Still — the engraved brass at full size"
 },
 "full-card-emerald": {
  "name": "EMERALD & BRASS · FULL CARD",
  "motion": "The stepped crown, the shine pass + its glint"
 },
 "full-card-neonglass": {
  "name": "NEON GLASS · FULL CARD",
  "motion": "The tube round the whole card, breathing + stuttering"
 },
 "full-card-chrome": {
  "name": "SILVER CHROME · FULL CARD",
  "motion": "Mirror chrome, the prism rim, the shine pass"
 },
 "full-card-champagne": {
  "name": "MIDNIGHT & CHAMPAGNE · FULL CARD",
  "motion": "The arches, the warm shine pass"
 },
 "full-card-sg-ufo": {
  "name": "I WANT TO BELIEVE · FULL CARD",
  "motion": "The real UFO over the harbor, ports chasing, the beam pulsing to the skyline + motes rising, the title in neon, THE BORDER LASER"
 },
 "card-gift-dispatcher": {"name": "THE DISPATCHER", "motion": "GIFT · 1 OF 1 (give it in /admin → GIFTS) — its own strip picture (his face far right, the left free for a long name): the blinds' shadows drifting across his face, a car's lights sweeping through the slats now + then, the squad car's red + blue flashing at his cheek, film grain."},
 "full-card-gift-dispatcher": {"name": "THE DISPATCHER · FULL CARD", "motion": "Noir: the venetian blinds' shadows drift slowly across his face (as if the blinds tilt), a car's headlights sweep through the slats every ~9 s, a red + blue emergency glow pulses along the sides of his face (a squad car outside), faint cigarette smoke, film grain; THE DISPATCHER printed in red neon that flickers now + then. Reduced motion = the approved picture."},
 "card-gift-outoforder": {"name": "OUT OF ORDER", "motion": "GIFT · 1 OF 1 (the lawyer — give it in /admin → GIFTS) — its own strip picture (the stencil + his face far right): the pink halo breathing, sparkles popping, a glint along the safety pin."},
 "full-card-gift-outoforder": {"name": "OUT OF ORDER · FULL CARD", "motion": "Punk: the pink spray halo breathes behind him, the torn pink + acid-green paper edges flutter, the stencil's drips + the lime splatter run slowly, the chrome safety pin + the sparkles glint, a photocopier's light bar passes + the print flickers now + then, print grain. No gavel. Reduced motion = the approved picture."},
 "card-gift-notguilty": {"name": "NOT GUILTY", "motion": "GIFT · 1 OF 1 (the lawyer — give it in /admin → GIFTS) — its own strip picture (his sticker cut-out far right): the red marker going round his circle now + then. A LIGHT card: dark ink on a light wash."},
 "full-card-gift-notguilty": {"name": "NOT GUILTY · FULL CARD", "motion": "The gig poster on white: the ransom letters N-O-T G-U-I-L-T-Y jiggle one by one, the red marker draws round his circle (a fresh-ink line on the art's own circle, then it fades), the red tape strips flutter, the scribbled stars wobble. A LIGHT card: dark ink on a light wash (THE CARD TEXT STANDARD). Reduced motion = the approved picture."},
 "card-gift-wastelander": {"name": "WASTELANDER", "motion": "GIFT · 1 OF 1 (your buddy — give it in /admin → GIFTS; card art generated with Grok Imagine) — its own strip picture (the screen far right): the lines typing on the CRT, the cursor blinking, the glow flickering, a spark at the screen's edge now + then."},
 "full-card-gift-wastelander": {"name": "WASTELANDER · FULL CARD", "motion": "Grok's bunker terminal: THE GAME TYPES on the blank green screen, line by line — > SURVIVOR FILE · > RADS ...... 0 · > CAPS .. 1,024 · > STATUS LEGEND · > _ (dark phosphor green; the words are yours to change) — the block cursor blinks, the CRT's glow flickers, sparks crackle at the screen's edge now + then, dust drifts. Nothing of any game's trademarks. Reduced motion = the typed screen."},
 "card-gift-survivor": {"name": "SOLE SURVIVOR", "motion": "GIFT · 1 OF 1 (your buddy — give it in /admin → GIFTS; card art generated with Grok Imagine) — its own strip picture (the radiation sign far right): the haze breathing on the sun, embers drifting up, the sign creaking a hair."},
 "full-card-gift-survivor": {"name": "SOLE SURVIVOR · FULL CARD", "motion": "Grok's ruined city at a radioactive sunset: embers drift up across the card, the haze breathes on the sun, heat shimmer over the skyline, the rusted radiation sign creaks a hair on its stand. Nothing of any game's trademarks. Reduced motion = the approved picture."},
 "card-gift-zadomovinu": {"name": "ZA DOMOVINU", "motion": "GIFT · 1 OF 1 (the Mostar friend — give it in /admin → GIFTS) — THE FLAG STRIP (shared with STARI MOST; his face far right): the stars twinkling in turn, a sparkle or two."},
 "full-card-gift-zadomovinu": {"name": "ZA DOMOVINU · FULL CARD", "motion": "Bosnia's flag: the chequered race flag ripples bottom-right (a light band rolling along it), the white stars twinkle in turn, the speed lines rush out from behind him, sparkles on the gold. Reduced motion = the approved picture."},
 "card-gift-starimost": {"name": "STARI MOST", "motion": "GIFT · 1 OF 1 (the Mostar friend — give it in /admin → GIFTS; background art generated with Grok Imagine) — THE FLAG STRIP (shared with ZA DOMOVINU): the stars twinkling in turn, a sparkle or two."},
 "full-card-gift-starimost": {"name": "STARI MOST · FULL CARD", "motion": "Golden hour on the Old Bridge: the sun's flare breathes right behind his head, sparks spray off the red race car on the river road, the river shimmers; his shirt's lower edge blended into the water (no soft box). Reduced motion = the approved picture."},
 "emb-horseshoe": {"name": "HORSESHOE", "motion": "NEON (uncommon — OVERCLOCK: back the winning horse in DUMB LUCK): a lucky GOLD horseshoe in neon tubes, opening up (it holds the luck), its six nail holes as pale gold dots; a soft warm glow breathing behind it + a glint twinkling on its right heel. Reads at the plate's 24 pt size. (Was a placeholder glyph since OC5.)"}
};

// THE LAB 2.0 (THE VAULT 2C) — WHAT CHANGED, per item + version (js/vault/catalog.js#LAB_V holds the numbers): the lab shows the newest
// line beside his old mark ("CHANGED Nov 3 — …"). A pass that edits an item's art / words bumps its LAB_V + adds its line here.
export const LAB_CHANGES = {
  'card-sg-btc': [{ v: 2, at: '2026-11-08', what: 'New premium art + the burner flare (THE BTC CARD — the approved mock): Grok’s big orange ₿ balloon over the neon harbor, its own strip band (the ₿ + the coins); the burner fires in bursts and the whole balloon lights up from inside, the ₿ blazes, a gold ring pulses out every block, the coins rise + spin, a sheen across the ₿.' }],
  'full-card-sg-btc': [{ v: 2, at: '2026-11-08', what: 'New premium art + the burner flare: the whole harbor picture, laid out like the other full cards (the plate mid-left, MEMBER SINCE + the name at the foot); the balloon rises into the card + a big first burn, then burns every few seconds — the envelope lit from inside, the bloom, the flame on the real burner, the water catching it; the block ring every 10 s.' }, { v: 3, at: '2026-11-09', what: 'The name on one line, the sighting line back, the rise-in fixed: a 12-letter name (MAXIMILIANOS) stays on ONE line at 390; the printed name in the sighting’s glow with “spotted over the harbor” under it, clear of the balloon; the faint warm column behind the balloon while it rises in is gone.' }],
  'card-penthouse': [{ v: 2, at: '2026-11-08', what: 'A NEW FACE (DM2 — the owner’s design A · THE DIAL): the gold-framed window over the city is gone; an Art Deco elevator floor dial, DRAWN IN CODE — the needle climbs 1 → PH, PH blazes, the doors’ seam lights. The strip has its own band (the dial + PH, clear of the gem).' }],
  'full-card-penthouse': [{ v: 2, at: '2026-11-08', what: 'A NEW FACE (DM2 — THE DIAL, drawn in code): the dial + the gold doors at full size, the left dark for the name.' }],
  'card-safecracker': [{ v: 2, at: '2026-11-07', what: 'The strip zoomed out + set further RIGHT (THE SLIM-CARD LONG-NAME STANDARD — the subject ≈ 0.77 across, the left free for a 12-letter name).' }],
  'card-ghost-run': [{ v: 2, at: '2026-11-07', what: 'The strip zoomed out + set further RIGHT (THE SLIM-CARD LONG-NAME STANDARD — the subject ≈ 0.77 across, the left free for a 12-letter name).' }],
  'card-gift-enforcer': [{ v: 2, at: '2026-11-07', what: 'The strip zoomed out a touch + set further RIGHT (THE SLIM-CARD LONG-NAME STANDARD — the face ≈ 0.76 across, the left free for a 12-letter name).' }],
  'card-gift-linebacker': [{ v: 2, at: '2026-11-07', what: 'The strip zoomed out a touch + set further RIGHT (THE SLIM-CARD LONG-NAME STANDARD — the face ≈ 0.76 across, the left free for a 12-letter name).' }],
  'card-gift-underlights': [{ v: 2, at: '2026-11-07', what: 'The strip zoomed out a touch + set further RIGHT (THE SLIM-CARD LONG-NAME STANDARD — the face ≈ 0.76 across, the left free for a 12-letter name).' }],
  'card-gift-goldenhour': [{ v: 2, at: '2026-11-07', what: 'The strip zoomed out a touch + set further RIGHT (THE SLIM-CARD LONG-NAME STANDARD — the face ≈ 0.76 across, the left free for a 12-letter name).' }],
  'card-gift-goldenboot': [{ v: 2, at: '2026-11-07', what: 'The strip zoomed out a touch + set further RIGHT (THE SLIM-CARD LONG-NAME STANDARD — the face ≈ 0.76 across, the left free for a 12-letter name).' }],
  'card-gift-buzzed': [{ v: 2, at: '2026-11-07', what: 'The strip zoomed out a touch + set further RIGHT (THE SLIM-CARD LONG-NAME STANDARD — the face ≈ 0.76 across, the left free for a 12-letter name).' }],
  'card-inferno': [{ v: 2, at: '2026-11-03', what: 'Real fire now — a baked field of flame (tongues splitting, merging, tearing off at the tips, white-hot at the root), two layers crossing, across the whole strip. The old teardrops are gone.' }],
  'full-card-inferno': [{ v: 2, at: '2026-11-03', what: 'The same real fire as the strip, filling the card’s lower half.' }],
  'card-century': [{ v: 2, at: '2026-11-03', what: 'Its flames are the new real fire (your FIX had no note — the teardrop flames were the likeliest reason; say so if it was something else).' }, { v: 3, at: '2026-11-04', what: 'NO FLAMES now (you: too close to INFERNO) — burnished bronze foil with an Art Deco SUNBURST pressed into it, fanning from behind the name plate; a slow light sweeps across the metal; golden embers drift up.' }, { v: 4, at: '2026-11-05', what: 'The sunburst’s heart moved out from behind your name plate to the middle-right of the strip (THE HERO-SPOT RULE) — its sun disc + rings now show.' }],
  'card-prism': [{ v: 2, at: '2026-11-05', what: 'The prism sits further right (middle-right) — a long name’s plate covered its left side (THE HERO-SPOT RULE).' }],
  'card-emerald': [{ v: 2, at: '2026-11-05', what: 'The deco crown moved right, out from beside your name plate (THE HERO-SPOT RULE).' }],
  'card-sg-ufo': [{ v: 2, at: '2026-11-05', what: 'The UFO hovers a little further right — a long name’s plate covered its left side (THE HERO-SPOT RULE).' }],
  'card-marquee': [{ v: 2, at: '2026-11-05', what: 'The neon arrow sits further right, so its head is never under a long name (THE HERO-SPOT RULE).' }],
  'card-camo': [{ v: 2, at: '2026-11-05', what: 'The scope’s reticle locks on in the middle-right now — it sat on top of the tier gem in the corner (THE HERO-SPOT RULE).' }],
  'card-sg-tr3b': [{ v: 2, at: '2026-11-05', what: 'The craft sits a little further left, in the middle-right — its right wing ran under the tier gem (THE HERO-SPOT RULE).' }],
  'full-card-century': [{ v: 2, at: '2026-11-03', what: 'The new real fire over the bronze.' }, { v: 3, at: '2026-11-04', what: 'The bronze DECO SUNBURST behind the name instead of the fire, the light sweep + the golden embers — the same as the strip.' }],
  'card-dev-switchboard': [{ v: 2, at: '2026-11-03', what: 'The pink cable lands in a TOP-row jack. The ONE OF ONE pill is gone — THE DEV GEM (prismatic, pulsing, sparkling) in the corner instead; no words on the strip (the decided rule).' }, { v: 3, at: '2026-11-05', what: 'The jacks moved a little right — THE DEV · № 0001 line’s plate reached them (THE HERO-SPOT RULE).' }, { v: 4, at: '2026-11-05', what: 'The plate’s dev line reads DEV · Nº 0001 (was THE DEV / THE DEVELOPER).' }],
  'card-dev-source': [{ v: 2, at: '2026-11-03', what: 'NEON brought down + centred in the strip. The pill → THE DEV GEM.' }, { v: 3, at: '2026-11-05', what: 'NEON a touch smaller, between your plate (THE DEV · № line) + the dev gem — it ran into both (THE HERO-SPOT RULE).' }, { v: 4, at: '2026-11-05', what: 'The plate’s dev line reads DEV · Nº 0001 (was THE DEV / THE DEVELOPER).' }],
  'full-card-dev-switchboard': [{ v: 2, at: '2026-11-03', what: '1 OF 1 · DEV in bold. The top row reads NEON SPEAKEASY · FOUNDER (its Nº dropped — it’s under your name); the badge never covers the VU meter.' }, { v: 3, at: '2026-11-04', what: 'The pill reads just 1 OF 1 (it cut off FOUNDER). The top line never clips now — its letters tighten first.' }, { v: 4, at: '2026-11-04', what: 'Your name plate now reaches past THE DEVELOPER · № 0001 (it was sized to the name and the line ran past its edge).' }, { v: 5, at: '2026-11-05', what: 'ON AIR moved up into the band under the top line, right of the level lamps — a long name’s plate ran over it. 1 OF 1 is back in the rainbow gradient (brighter colours, a dark edge, a touch bigger) with a clear gap before FOUNDER.' }, { v: 6, at: '2026-11-05', what: 'The plate’s dev line reads DEV · Nº 0001 (was THE DEV / THE DEVELOPER).' }],
  'full-card-dev-source': [{ v: 2, at: '2026-11-03', what: '1 OF 1 · DEV in bold.' }, { v: 3, at: '2026-11-04', what: 'The pill reads just 1 OF 1. The top line never clips now — its letters tighten first.' }, { v: 4, at: '2026-11-04', what: 'Your name plate now reaches past THE DEVELOPER · № 0001 (it ran past the plate’s edge).' }, { v: 5, at: '2026-11-05', what: '1 OF 1 is back in the rainbow gradient (brighter colours, a dark edge, a touch bigger) with a clear gap before FOUNDER.' }, { v: 6, at: '2026-11-05', what: 'The plate’s dev line reads DEV · Nº 0001 (was THE DEV / THE DEVELOPER).' }],
  'card-founder': [{ v: 2, at: '2026-11-03', what: 'NEON SPEAKEASY centred. The LEGENDARY + Nº pills are gone — a gold TIER GEM in the corner + your Nº in gold letters.' }],
  'full-card-founder': [{ v: 2, at: '2026-11-03', what: 'The card-game room is now THE SHADOWBOXER, live (the city’s own). The FOUNDER badge sits in a slot clear of anything moving.' }],
  'full-card-house': [{ v: 2, at: '2026-11-03', what: 'The card-game room is now THE SHADOWBOXER, live (no card game anywhere).' }],  // CARD FIXES (Nov 5 evening — the owner's LAB notes + THE CARD LAYOUT RULE)
  'card-gift-playerone': [{ v: 2, at: '2026-11-05', what: 'Your note “Show more of his face”: the strip shows his whole face now, forehead to chin (the art zoomed out a touch, sitting right).' }],
  'card-gift-halloffame': [{ v: 2, at: '2026-11-05', what: 'Your note “Show more of his face”: the strip shows his whole face, chin included (zoomed out a touch).' }],
  'card-gift-sunsetstrip': [{ v: 2, at: '2026-11-05', what: 'The glint now crosses the sunglasses ONLY (from the full card’s fix).' }, { v: 3, at: '2026-11-07', what: 'The strip zoomed out a touch + set further RIGHT (THE SLIM-CARD LONG-NAME STANDARD — the face ≈ 0.76 across, the left free for a 12-letter name).' }],
  'card-gift-youngbuck': [{ v: 2, at: '2026-11-05', what: 'The picture slid right with the full card’s fix.' }, { v: 3, at: '2026-11-05', what: 'YOUNG BUCK → BRUH (your ADD-ON): the new card, with its own strip picture — his eyebrows to his chin with the BRUH tape.' }, { v: 4, at: '2026-11-06', what: 'Its strip’s effects (the halo, the rays, the tape’s corner, the sparkles) now sit on their spots — they were thrown up off his face by a mapping bug (the card pass that added BUZZED LIGHTYEAR).' }],
  'card-gift-icecold': [{ v: 2, at: '2026-11-05', what: 'The picture slid right with the full card’s fix.' }],
  'card-gift-anarchist': [{ v: 2, at: '2026-11-05', what: 'THE ANARCHIST v2 (your approved picture): him right of the plate + higher, the cap inside the strip; every effect moved with him.' }],
  'full-card-gift-sunsetstrip': [{ v: 2, at: '2026-11-05', what: 'Your note: the glint is on the GLASSES ONLY now (clipped to the two lenses), brighter, a second thin streak, and a star twinkles on each lens rim as it leaves. No FOUNDER pill on a gift card any more; your name plate hugs its words (THE REVERSE STEP when the level line is the longer) and keeps off the face; nothing on the card overlaps (the top line shortens to “Nº 0001” before it would reach the 1 OF 1).' }],
  'full-card-gift-youngbuck': [{ v: 2, at: '2026-11-05', what: 'The picture slid right (your note) — his face clear of the plate.' }, { v: 3, at: '2026-11-05', what: 'YOUNG BUCK → BRUH (your ADD-ON): the torn split + the red punk wall, the BRUH tape, the red neon halo buzzing, the rays, sparkles off his face, camera flashes, the tape lifting, the chalk scribble drawing itself once, the drips; BRUH printed big in gold; no FOUNDER pill.' }],
  'full-card-gift-icecold': [{ v: 2, at: '2026-11-05', what: 'Your note “move him over to the right”: the picture slid right (his face ~66–86 % across), the plate clear of him. No FOUNDER pill on a gift card any more; your name plate hugs its words (THE REVERSE STEP when the level line is the longer) and keeps off the face; nothing on the card overlaps (the top line shortens to “Nº 0001” before it would reach the 1 OF 1).' }],
  'full-card-gift-anarchist': [{ v: 2, at: '2026-11-05', what: 'THE ANARCHIST v2: him right of the plate + higher, the full rifle clear of the card’s name, the circle-A + every effect moved with him. No FOUNDER pill on a gift card any more; your name plate hugs its words (THE REVERSE STEP when the level line is the longer) and keeps off the face; nothing on the card overlaps (the top line shortens to “Nº 0001” before it would reach the 1 OF 1).' }],
  'full-card-gift-playerone': [{ v: 2, at: '2026-11-05', what: 'PRESS START is big + blinking like an arcade screen now (it was too small to read on a phone). No FOUNDER pill on a gift card any more; your name plate hugs its words (THE REVERSE STEP when the level line is the longer) and keeps off the face; nothing on the card overlaps (the top line shortens to “Nº 0001” before it would reach the 1 OF 1).' }],
  'full-card-gift-halloffame': [{ v: 2, at: '2026-11-05', what: 'No FOUNDER pill on a gift card any more; your name plate hugs its words (THE REVERSE STEP when the level line is the longer) and keeps off the face; nothing on the card overlaps (the top line shortens to “Nº 0001” before it would reach the 1 OF 1).' }],
  'full-card-gift-enforcer': [{ v: 2, at: '2026-11-05', what: 'No FOUNDER pill on a gift card any more; your name plate hugs its words (THE REVERSE STEP when the level line is the longer) and keeps off the face; nothing on the card overlaps (the top line shortens to “Nº 0001” before it would reach the 1 OF 1).' }],
  'full-card-gift-linebacker': [{ v: 2, at: '2026-11-05', what: 'No FOUNDER pill on a gift card any more; your name plate hugs its words (THE REVERSE STEP when the level line is the longer) and keeps off the face; nothing on the card overlaps (the top line shortens to “Nº 0001” before it would reach the 1 OF 1).' }],
  'full-card-gift-underlights': [{ v: 2, at: '2026-11-05', what: 'No FOUNDER pill on a gift card any more; your name plate hugs its words (THE REVERSE STEP when the level line is the longer) and keeps off the face; nothing on the card overlaps (the top line shortens to “Nº 0001” before it would reach the 1 OF 1).' }],
  'full-card-gift-goldenhour': [{ v: 2, at: '2026-11-05', what: 'No FOUNDER pill on a gift card any more; your name plate hugs its words (THE REVERSE STEP when the level line is the longer) and keeps off the face; nothing on the card overlaps (the top line shortens to “Nº 0001” before it would reach the 1 OF 1).' }],
  'full-card-gift-goldenboot': [{ v: 2, at: '2026-11-05', what: 'No FOUNDER pill on a gift card any more; your name plate hugs its words (THE REVERSE STEP when the level line is the longer) and keeps off the face; nothing on the card overlaps (the top line shortens to “Nº 0001” before it would reach the 1 OF 1).' }],
};
