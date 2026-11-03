// THE CARD LAB's TEXT — SERVER ONLY (THE VAULT 1B — names only to owners): every lab item's NAME + what it does, keyed by id. The lab
// gets them with the marks (/api/admin labMarks — admins only); never in the site's code. A new lab item = its row here + its id in
// js/vault/catalog.js#LAB.
export const LAB_TEXT = {
 "emb-key": { "name": "THE KEY", "motion": "NEON — the house style: an amber key with a pink diamond in its bow, two tubes in the sign's own layers (glass, glow, body, white-hot core); still — its motion comes from the tube style you wear" },
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
  "motion": "Burnished bronze foil, flames licking up + golden embers lifting"
 },
 "full-card-century": {
  "name": "CENTURY · FULL CARD",
  "motion": "Burnished bronze foil, flames licking up + golden embers lifting, at full size"
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
  "motion": "The city at night far below a gold-framed window — its lights twinkling, traffic streaming along the avenues"
 },
 "full-card-penthouse": {
  "name": "PENTHOUSE · FULL CARD",
  "motion": "The city at night far below a gold-framed window — its lights twinkling, traffic streaming along the avenues, at full size"
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
  "motion": "The two ₿ balloons over the festival at sunset — burners flaring, a gold pulse on every new block, the other balloons drifting far off + THE BORDER LASER"
 },
 "full-card-sg-btc": {
  "name": "FIX THE MONEY, FIX THE WORLD · FULL CARD",
  "motion": "The two ₿ balloons over the festival at sunset — burners flaring, a gold pulse on every new block, the other balloons drifting far off, the title in neon + THE BORDER LASER"
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
 }
};
