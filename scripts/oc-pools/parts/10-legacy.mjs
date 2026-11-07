// OVERCLOCK POOLS — SORT IT's sets kept from OC1–OC5 (hand/sortit-legacy.json: migrated by OC6 with stable ids), each with the article it was
// checked against. (OC1–OC5's HIGHER OR LOWER + TIMELINE hand lists are replaced: Wikidata + hand/checked.json.) OUT on the all-ages rule:
// COFFEE DRINK / COCKTAIL (alcohol), CHESS / POKER (gambling), WON BEST PICTURE (many R-rated films; the OSCARS stat covers it).
import { join } from 'node:path';
import { HERE, readJSON } from '../lib.mjs';

const W = t => `https://en.wikipedia.org/wiki/${t}`;
const SRC = {
  'mammal-not-a-mammal': W('Mammal'), 'insect-not-an-insect': W('Insect'), 'bird-not-a-bird': W('Bird'), 'planet-moon': W('List_of_natural_satellites'),
  'chemical-element-not-an-element': W('Chemical_element'), 'dinosaur-not-a-dinosaur': W('Dinosaur'), 'greek-god-roman-god': W('Roman_mythology'),
  'painter-composer': W('List_of_painters_by_name'), 'pasta-cheese': W('List_of_pasta'), 'dog-breed-cat-breed': W('List_of_cat_breeds'),
  'in-europe-in-asia': W('List_of_sovereign_states_and_dependent_territories_in_Asia'), 'in-africa-in-south-america': W('List_of_sovereign_states_and_dependent_territories_in_Africa'),
  'landlocked-has-a-coastline': W('Landlocked_country'), 'national-capital-not-the-capital': W('List_of_national_capitals'),
  'us-state-capital-not-a-state-capital': W('List_of_capitals_in_the_United_States'), 'shakespeare-not-shakespeare': W('Shakespeare%27s_plays'),
  'the-beatles-not-the-beatles': W('List_of_songs_recorded_by_the_Beatles'), 'disney-animated-not-disney': W('List_of_Walt_Disney_Animation_Studios_films'),
  'apple-microsoft': W('List_of_Microsoft_software'), 'japanese-brand-korean-brand': W('List_of_companies_of_South_Korea'),
  'string-instrument-woodwind': W('Woodwind_instrument'), 'bone-muscle': W('List_of_skeletal_muscles_of_the_human_body'), 'fish-not-a-fish': W('Fish'),
  'reptile-amphibian': W('Amphibian'), 'marsupial-not-a-marsupial': W('Marsupial'), 'bird-that-flies-flightless-bird': W('Flightless_bird'),
  'river-mountain': W('List_of_rivers_by_length'), 'winter-olympics-summer-olympics': W('Olympic_sports'), 'greek-myth-norse-myth': W('Norse_mythology'),
  'means-happy-means-sad': W('Synonym'), 'means-big-means-small': W('Synonym'), 'real-word-fake-word': 'https://www.merriam-webster.com/',
  'prime-not-prime': 'computed', 'multiple-of-7-not-a-multiple-of-7': 'computed', 'more-than-50-less-than-50': 'computed', 'more-than-less-than': 'computed',
  'palindrome-not-a-palindrome': 'computed', 'letters-in-a-z-order-not-in-order': 'computed', 'before-1950-after-1950': W('Timeline_of_historic_inventions'),
  'before-1776-after-1776': W('Timeline_of_historic_inventions'), 'constellation-star': W('IAU_designated_constellations'), 'nobel-winner-never-won-a-nobel': W('List_of_Nobel_laureates'),
  'sovereign-country-not-a-country': W('List_of_sovereign_states'), 'real-place-fictional-place': W('List_of_fictional_countries'), 'golf-term-tennis-term': W('Glossary_of_golf'),
};
const OUT = ['coffee-drink-cocktail', 'chess-poker', 'won-best-picture-never-won'];
const CARDS_OUT = { 'before-1776-after-1776': ['Salem witch trials'] };

export default async function legacy(ctx) {
  for (const s of readJSON(join(HERE, 'hand', 'sortit-legacy.json')).sets) {
    if (OUT.includes(s.id)) { ctx.drop('so', 'legacy set out (all-ages)', s.id); continue; }
    if (!SRC[s.id]) { ctx.drop('so', 'legacy set without a source', s.id); continue; }
    const out = CARDS_OUT[s.id] || [];
    ctx.so.push({ ...s, L: s.L.filter(x => !out.includes(x)), R: s.R.filter(x => !out.includes(x)), src: SRC[s.id] });
  }
}
