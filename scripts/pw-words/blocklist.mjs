// THE PASSWORD's ANSWER LIST — the blocklists (PW1 — docs/password.md "The list build"). Node only (the build + the content test); never shipped.
// 1. scripts/build-words.mjs's lists, as they are (the house rule since the first word games); 2. a STRICTER KID-SAFE list for a daily everyone's
// family plays: nothing rude, adult, about alcohol / drugs / violence / death, nothing gloomy; 3. the words the build cuts as INFLECTIONS it
// can't tell apart by rule (names, -ing forms of a verb, comparatives). The REVIEWER's cuts live in cuts.json beside this file (a fresh pair
// of eyes over the whole list — the build applies them last).

// Substrings that disqualify a word anywhere it appears (build-words.mjs).
export const BLOCK_SUB = ['fuck', 'shit', 'cunt', 'nigg', 'porn', 'slut', 'whore', 'bitch', 'dildo', 'penis', 'vagin',
  'orgasm', 'masturb', 'sperm', 'semen', 'rapist', 'nazi', 'faggot', 'pussy', 'boob', 'jizz', 'wank', 'twat', 'cocks'];
// Whole words that are excluded (build-words.mjs: offensive, crude, or too grim for a party game).
export const BLOCK_WORD = `anal anus arse asses bastard bimbo blowjob bondage booty boner breast breasts butt butts
crap crappy damn damned dick dicks dyke erotic erotica escort fetish gonad groin hooker horny hussy incest kinky
lesbo lust lusty milf moron morons negro nipple nipples nude nudes nudity orgy panties piss pissed queer rape raped
rapes raping retard scrotum sexed sexes sexier sexily sexing sexism sexist sexual sexy slave slaves spank spanked
strip stripper tits titty vulva weiner wiener whores zits homo homos hooters jihad suicide murder killer killed
corpse dildos crotch thong thongs pimp pimps pervert perverts bigot bigots harlot gypsy gyp
hell bloody heroin cocaine opium pantie panty junkie homicide lymphoma tumor cancer fetus`.split(/\s+/);

// THE KID-SAFE LIST (PW1): alcohol · drugs · violence · death · illness · the adult + the rude + the gloomy — whole words, 5 letters
export const KIDSAFE = `
booze drunk drank vodka wines beers lager cider brews stout rummy drams toast binge sober
drugs dopey stash blunt dealt joint hashy toked snort tokes doped roach
knife knive blood bleed shoot shots stabs kills death dying grave tombs bombs rifle guns gunny armed wound bully choke slain slays
slash shank spear sword lance maims maced stake snipe sniper slay stabs brawl fists punch kicks bruise raped rapes
widow mourn grief weeps wails dirge wreck doomed curse cursed hexed demon devil satan hades ghoul ghost zombie
rabid leper plague virus germs fever cough sneeze vomit puked barfs feces urine poop poops pee pees fart farts
naked nudie nudes sexy raunchy horny kinky booty boobs chest bosom loins erect thigh thong undies panty bikini stripper
idiot moron dumbo fatso fatty dummy dunce loser twerp dweeb geeks nerds sucks suck sucky stink stank stunk butts fanny
bitch whore slut tramp bimbo hussy wench
nazis hitler jihad racist
dumps dumped crappy
`.split(/\s+/).filter(Boolean);

// -er words that are COMPARATIVES of these adjectives are cut (wider, nicer, lower …); "water", "paper", "cover" stay
export const COMPARE_STEMS = ['wide', 'nice', 'safe', 'late', 'low', 'old', 'new', 'ripe', 'fine', 'pure', 'true', 'few', 'fast', 'slow', 'deep',
  'high', 'rich', 'poor', 'dark', 'cool', 'warm', 'cold', 'hot', 'big', 'fat', 'wet', 'dry', 'sad', 'mad', 'bad', 'red', 'dim', 'odd', 'thin', 'fit',
  'tall', 'wild', 'mild', 'calm', 'rare', 'sore', 'sure', 'wise', 'free', 'loud', 'dear', 'near', 'fair', 'full', 'dull', 'cute', 'huge', 'lame',
  'pale', 'rude', 'tame', 'vast', 'bold', 'firm', 'grim', 'keen', 'lean', 'meek', 'neat', 'numb', 'pink', 'posh', 'rash', 'ripe', 'sick', 'slim', 'snug',
  'soft', 'tidy', 'vile', 'weak', 'cheap', 'brief', 'bland', 'blunt', 'close', 'cross', 'dense', 'fresh', 'grand', 'great', 'green', 'quick', 'quiet',
  'short', 'small', 'smart', 'stiff', 'sweet', 'tight', 'tough', 'young'];
// DFIX1 — THE ADULT-VOCABULARY CUT (FABLE REVIEW #1, the owner's call Nov 7: "everyday words" — a kid who plays with the family wouldn't know
// them). Applied by build.mjs AFTER the pick, with the reviewer's cuts (never in reject(): a word rejected there would pull an unreviewed
// candidate in at the tail), so a rebuild gives exactly this list. The MEAN words (taunt, snide, sneer …) + the GLOOMY ones (gaunt, eerie, dingy) STAY.
export const ADULT_VOCAB = `banal trite pithy terse tepid stoic acrid adage chide croon drawl elude ensue feign feint flout foray frond gaffe gamut gauzy gavel heady leery levee lurch mosey moxie parch plait preen primp qualm segue shirk shuck sidle skimp skulk splay spurn strew taupe tinge trope wield fjord`.split(/\s+/).filter(Boolean);

// words the plural rule would wrongly cut (an -s that isn't a plural)
export const KEEP_S = ['chaos', 'atlas', 'ethos', 'kudos', 'bonus', 'focus', 'virus', 'lotus', 'minus', 'genus', 'opus', 'basis', 'oasis', 'crisis',
  'tennis', 'canvas', 'chess', 'dress', 'press', 'cross', 'glass', 'grass', 'brass', 'class', 'bliss', 'floss', 'gloss', 'moss', 'guess', 'bless',
  'amiss', 'abyss', 'alias', 'arras'];
