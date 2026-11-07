// OVERCLOCK POOLS — what the Wikidata pools leave out BY HAND (OC6), after reading every built list: arguable values (a lake that keeps
// shrinking or floods each season, a "sea" that is a lake, a border two countries claim), not all-ages (nude paintings, adult cartoons, a
// death-themed ride, explicit bands, anthems of hate), names tied to tragedy or politics, a title that IS a year, Wikidata junk. By stat id
// → Q-ids or labels (either matches). One line of WHY per group.
export const STAT_EXCLUDE = {
  // a contested border makes the area arguable (Kosovo, Western Sahara, Abkhazia + S. Ossetia, Karabakh, Transnistria, N. Cyprus, Somaliland,
  // Crimea, the West Bank)
  'country-area': ['Serbia', 'Morocco', 'Georgia', 'Azerbaijan', 'Moldova', 'Cyprus', 'Somalia', 'Ukraine', 'Israel'],
  // seasonal / shrinking / a sea or a lake?
  'lake-area': ['Caspian Sea', 'Lake Chad', 'Kati Thanda–Lake Eyre', 'Tonle Sap', 'Poyang Lake', 'Aral Sea', 'Dead Sea'],
  'lake-depth': ['Caspian Sea', 'Lake Chad', 'Kati Thanda–Lake Eyre', 'Tonle Sap', 'Poyang Lake'],
  'mountain-height': ['Île Amsterdam', 'Mount of Olives'],
  'river-length': ['Río de la Plata'],
  'island-area': ['Taiwan Island', 'Navassa Island', 'Jarvis Island', 'Clipperton Island', 'Bouvet Island', 'Saba', 'Sint Eustatius', 'Jan Mayen', 'Howland Island', 'Baker Island',
    'Wake Island', 'Johnston Atoll', 'Midway Atoll', 'Kingman Reef', 'Palmyra Atoll'],
  'skyscraper-height': ['Trump Tower', '7 World Trade Center'],
  'skyscraper-year': ['Trump Tower', '7 World Trade Center'],
  'coaster-height': ['Euthanasia Coaster', 'G’sengte Sau', 'Dæmonen'],
  'film-year': ['2012'],
  'novel-year': ['Lolita', 'The Satanic Verses', 'A Game of Thrones', 'Uncle Tom\'s Cabin', 'Thus Spoke Zarathustra', 'The Plague', 'The Idiot'],
  'cartoon-year': ['American Dad!', 'Happy Tree Friends', 'Beavis and Butt-Head', 'The Cleveland Show', 'Rick and Morty', 'BoJack Horseman',
    'Father of the Pride', 'Disenchantment', 'Arcane', 'As Aventuras de Gui & Estopa', 'Futurama', 'Regular Show'],
  'painting-year': ['L\'Origine du monde', 'La maja desnuda', 'Olympia', 'Venus of Urbino', 'Grande Odalisque', 'Luncheon on the Grass',
    'Les Demoiselles d\'Avignon', 'The Death of Marat', 'The Raft of the Medusa', 'The Third of May 1808', 'Guernica', 'Salvator Mundi',
    'The Death of Socrates', 'Black Square (1915)', 'Liberty Leading the People'],
  'band-year': ['Pussy Riot', 'Rammstein', 'Slipknot', 'Korn', 'Nine Inch Nails', 'Lordi', 'Lacuna Coil', 'Motörhead', 'Judas Priest', 'The Prodigy',
    'System of a Down', 'Iron Maiden'],
  'company-year': ['TV Azteca', 'Grupo Televisa', 'WWE', 'OpenAI'],
  'themepark-year': ['Mobility Resort Motegi', 'City of Space', 'Ramoji Film City', 'Disney Adventure World'],
  'probe-year': [],
  'bridge-length': ['Aqueduct of Segovia'],
};
/** people never named: tied to politics, war crimes or hate (the PEOPLE stat also drops every politician / ruler / soldier / cleric by role) */
export const PEOPLE_EXCLUDE = ['Martin Heidegger', 'Wernher von Braun', 'Philipp Lenard', 'Bobby Fischer', 'Peter Kropotkin', 'Cecil John Rhodes',
  'Hernán Cortés', 'Saddam Hussein', 'Mao Zedong', 'Karl Marx'];
/** TRUE OR FALSE (data half): an id here keeps a whole statement out — countries whose capital is arguable (two seats of government, a
 *  disputed or a recently moved capital): the Netherlands, Israel, Ivory Coast, Tanzania, Sri Lanka, Malaysia, Benin, Eswatini, Chile,
 *  Montenegro, Bolivia, South Africa, Yemen, Switzerland ("federal city"), Burundi, Myanmar */
export const TF_EXCLUDE = ['Q55', 'Q801', 'Q1008', 'Q924', 'Q854', 'Q833', 'Q962', 'Q1050', 'Q298', 'Q236', 'Q750', 'Q258', 'Q805', 'Q39', 'Q967', 'Q836'];
/** a label as the phone shows it (US spelling, a capital letter, the common name) */
const RENAME = { "People's Republic of China": 'China', 'Kingdom of the Netherlands': 'Netherlands', 'aluminium': 'Aluminum', 'caesium': 'Cesium',
  'sulphur': 'Sulfur', 'Apple Inc.': 'Apple', 'Audi AG': 'Audi', 'Sony Group': 'Sony', 'Meta Platforms': 'Meta', 'Cassini−Huygens': 'Cassini–Huygens' };
export function cleanLabel(id, l) {
  let s = l.replace(/\s+/g, ' ').trim();
  if (RENAME[s]) s = RENAME[s];
  if (/^element-/.test(id)) s = s.charAt(0).toUpperCase() + s.slice(1);
  return s;
}
