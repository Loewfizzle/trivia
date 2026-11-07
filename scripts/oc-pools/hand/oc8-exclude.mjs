// OVERCLOCK POOLS (OC8 — THE FABLE REVIEW, Nov 7): THE FAME FILTER, TIGHTENED. Sitelinks alone let every UN member, every Wikidata bridge and
// every European roller coaster through ("Eswatini vs Togo", Gamla bron, Hiiumaa, Alpenexpress Enzian) — so, per stat, read by hand:
//   OC8_ONLY  — the stats where sitelinks fail (a whole class few Americans know): ONLY these items (by the English label — raw or cleaned);
//   OC8_OUT   — more items out of a stat (obscure / arguable / not all-ages), on top of OC6's STAT_EXCLUDE + OC7's CC_EXCLUDE_LABELS;
//   OC8_KEEP  — the stat's top-n by fame (smaller than OC6's);
//   OC8_CUT   — stats gone (coasters: their fame is a handful of Wikipedias each; airplanes: the famous ones are warplanes).
// Plus the people templates' rules (athletes + musicians by OCCUPATION, directors + inventors by their OWN fame) and THE COUNTRIES Americans
// know (the country stats + their comparisons). Everything here only ever REMOVES an item.

export const OC8_CUT = ['coaster-height', 'coaster-year', 'aircraft-year'];

// countries an American player knows by name (the country size / population / highest-point stats, their T/F + trivia comparisons)
export const FAMOUS_COUNTRIES = [
  'United States', 'United States of America', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Venezuela', 'Cuba',
  'Jamaica', 'Haiti', 'Dominican Republic', 'Ecuador', 'Bolivia', 'Uruguay', 'Paraguay', 'Costa Rica', 'Panama', 'Guatemala', 'Honduras',
  'United Kingdom', 'Ireland', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Kingdom of the Netherlands', 'Belgium',
  'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland', 'Poland', 'Greece', 'Turkey', 'Russia', 'Czech Republic',
  'Hungary', 'Romania', 'Egypt', 'South Africa', 'Nigeria', 'Kenya', 'Ethiopia', 'Ghana', 'Madagascar', 'Libya', 'Sudan', 'Algeria',
  'Saudi Arabia', 'Iran', 'Iraq', 'Afghanistan', 'Pakistan', 'India', 'Nepal', "People's Republic of China", 'China', 'Japan', 'South Korea',
  'North Korea', 'Vietnam', 'Thailand', 'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Australia', 'New Zealand', 'Mongolia',
  'Kazakhstan', 'Bangladesh', 'Sri Lanka', 'Jordan', 'Lebanon', 'Syria', 'Qatar', 'United Arab Emirates', 'Kuwait', 'Croatia', 'Monaco',
  'Vatican City', 'Luxembourg', 'Liechtenstein', 'Fiji', 'Somalia', 'Tanzania', 'Uganda', 'Zimbabwe', 'Democratic Republic of the Congo',
];

export const OC8_ONLY = {
  'river-length': ['Nile', 'Amazon River', 'Danube', 'Rhine', 'Volga', 'Ganges', 'Mississippi River', 'Yangtze River', 'Congo River', 'Yellow River',
    'Euphrates', 'River Thames', 'Seine', 'Tigris', 'Jordan River', 'Mekong River', 'Missouri River', 'St. Lawrence River', 'Tiber', 'Colorado River',
    'Yukon River', 'Rio Grande', 'Columbia River', 'Hudson River', 'Ohio River', 'Zambezi', 'Niger River', 'Indus River', 'Loire', 'Elbe',
    'Snake River', 'Arkansas River', 'Tennessee River', 'Mackenzie River', 'Murray River', 'Orinoco River', 'Potomac River', 'Delaware River'],
  'bridge-length': ['Golden Gate Bridge', 'Tower Bridge', 'Brooklyn Bridge', 'Millau Viaduct', 'Akashi Kaikyō Bridge', 'Charles Bridge', 'Pont du Gard',
    'Forth Bridge', 'Verrazzano-Narrows Bridge', 'Rialto Bridge', 'George Washington Bridge', 'Ponte Vecchio', 'Westminster Bridge', 'Millennium Bridge',
    'Manhattan Bridge', 'Lake Pontchartrain Causeway', 'Williamsburg Bridge', 'Queensboro Bridge', 'Sydney Harbour Bridge', 'Mackinac Bridge',
    'Chesapeake Bay Bridge', 'San Francisco–Oakland Bay Bridge', 'Sunshine Skyway Bridge', 'Hangzhou Bay Bridge', 'Confederation Bridge', 'Bosphorus Bridge'],
  'island-area': ['Great Britain', 'Ireland', 'Easter Island', 'Crete', 'Borneo', 'New Guinea', 'Mallorca', 'Hispaniola', 'Tahiti', 'Ibiza', 'Newfoundland',
    'Bali Island', 'Bali', 'Isle of Wight', 'North Island', 'South Island', 'Baffin Island', 'Capri', 'Santorini', 'Okinawa', 'Long Island', 'Vancouver Island',
    'Oahu', 'Greenland', 'Madagascar', 'Sicily', 'Sardinia', 'Cuba', 'Iceland', 'Jamaica', 'Puerto Rico', 'Honshu', 'Hokkaido', 'Tasmania', 'Sri Lanka',
    'Java', 'Sumatra', 'Manhattan', 'Maui', 'Hawaii', 'Hawaiʻi', 'Kauai', "Martha's Vineyard", 'Nantucket', 'Kodiak Island', 'Corsica', 'Cyprus', 'Malta',
    'Bermuda', 'Victoria Island'],
  'lake-area': ['Lake Baikal', 'Lake Victoria', 'Lake Tanganyika', 'Titicaca', 'Lake Titicaca', 'Lake Superior', 'Lake Ontario', 'Lake Michigan',
    'Lake Erie', 'Lake Huron', 'Lake Malawi', 'Loch Ness', 'Lake Nicaragua', 'Lake Winnipeg', 'Great Bear Lake', 'Great Slave Lake', 'Great Salt Lake',
    'Lake Tahoe', 'Crater Lake', 'Lake Geneva', 'Lake Como', 'Lake Garda', 'Lake Okeechobee', 'Lake Champlain', 'Lake Mead', 'Lake Powell', 'Loch Lomond'],
  'console-year': ['PlayStation 3', 'Game & Watch series', 'Atari 7800', 'Game Boy Advance SP', 'Intellivision', 'Nintendo DS Lite', 'TurboGrafx-16',
    'Nintendo 2DS', 'Nintendo Switch Lite', 'NES Classic Edition', 'Super NES Classic Edition', 'Xbox Series X'],
  'zoo-year': ['London Zoo', 'Bronx Zoo', 'San Diego Zoo', 'Berlin Zoological Garden', 'Singapore Zoo', 'National Zoological Park', 'Georgia Aquarium',
    'Taronga Zoo', 'Cincinnati Zoo and Botanical Garden', 'Central Park Zoo', 'Beijing Zoo'],
  'themepark-year': ['Disneyland', 'Walt Disney World Resort', 'Tokyo Disneyland', 'Hong Kong Disneyland', 'Universal Studios Japan', 'Magic Kingdom',
    'Epcot', "Disney's Animal Kingdom", "Disney's Hollywood Studios", 'Shanghai Disneyland Park', 'Tokyo DisneySea', 'Disney California Adventure',
    'Universal Studios Hollywood', 'Universal Studios Florida', 'Legoland Billund', 'Ferrari World Abu Dhabi'],
  'boardgame-year': ['Monopoly', 'The Settlers of Catan', 'Battleship', 'Risk', 'Ticket to Ride', 'Mastermind', 'Trivial Pursuit', 'Pandemic', 'Twister',
    'Codenames', 'Blokus', 'Scrabble', 'Clue', 'Cluedo', 'Candy Land', 'Chutes and Ladders', 'Connect Four', 'Operation', 'Sorry!', 'The Game of Life', 'Jenga'],
  'car-year': ['Ford Model T', 'Tesla Cybertruck', 'Mini', 'Tesla Roadster', 'Benz Patent-Motorwagen', 'Lamborghini Gallardo', 'Audi A8', 'Ferrari 458',
    'Tesla Model X', 'Tesla Model S', 'Tesla Model 3', 'Volkswagen Beetle', 'Ford Mustang', 'Chevrolet Corvette', 'Toyota Prius', 'Jeep Wrangler'],
  'probe-year': ['Cassini−Huygens', 'Cassini–Huygens', 'Juno', 'Dawn', 'Mars Reconnaissance Orbiter', 'Ingenuity', 'Mars Science Laboratory', 'OSIRIS-REx',
    'Viking 1', 'Viking 2', 'Mars 2020', 'Double Asteroid Redirection Test', 'Deep Impact', 'NEAR Shoemaker', 'New Horizons', 'Voyager 1', 'Voyager 2',
    'Pioneer 10', 'Pioneer 11', 'Galileo', 'Mars Pathfinder', 'Spirit', 'Opportunity', 'Magellan', 'Rosetta', 'Parker Solar Probe'],
  'tower-height': ['Eiffel Tower', 'CN Tower', 'Tokyo Skytree', 'Tokyo Tower', 'Space Needle', 'Fernsehturm Berlin', 'Canton Tower', 'Sky Tower',
    'Ostankino Tower', 'Stratosphere', 'Namsan Seoul Tower', 'Reunion Tower', 'Tower of the Americas', 'Blackpool Tower', 'Leaning Tower of Pisa', 'Big Ben'],
};
OC8_ONLY['lake-depth'] = OC8_ONLY['lake-area'];
OC8_ONLY['bridge-year'] = OC8_ONLY['bridge-length'];

export const OC8_OUT = {
  'skyscraper-height': ['Ryugyong Hotel', 'China Media Group Guanghua Road Office Area', 'Zifeng Tower', 'Merdeka 118', 'Lotte World Tower',
    'Guangzhou International Finance Center', 'Edifício Altino Arantes', 'Commerzbank Tower', 'Bank of China Tower', 'Messeturm', 'Kingdom Centre'],
  'cartoon-year': ['As Aventuras de Gui & Estopa', 'Oggy and the Cockroaches', 'Father of the Pride', 'Super Wings', 'KikoRiki', 'Winx Club', 'Family Guy',
    'Postman Pat', 'Fireman Sam', 'Code Lyoko', 'Masha and the Bear', 'Disenchantment', 'Monsters at Work'],
  'company-year': ['Juventus FC', 'AFC Ajax', 'VfL Wolfsburg', 'Turkish Airlines', 'Škoda Auto', 'Lufthansa', 'Reuters', 'Grupo Televisa', 'Huawei',
    'Xiaomi', 'Lenovo', 'Suzuki Motor Corporation', 'Mazda', 'Yamaha Motor Company', 'British Airways', 'Fiat', 'Kia'],
  'game-year': ['War Thunder', 'World of Tanks'],
};
OC8_OUT['skyscraper-year'] = OC8_OUT['skyscraper-height'];

export const OC8_KEEP = {
  'mountain-height': 45, 'skyscraper-height': 32, 'skyscraper-year': 32, 'river-length': 40, 'bridge-length': 30, 'bridge-year': 30,
  'island-area': 50, 'lake-area': 30, 'lake-depth': 25, 'country-area': 100, 'country-pop': 100, 'country-highpoint': 100,
  'cartoon-year': 45, 'company-year': 55, 'stadium-year': 20,
};

// THE PEOPLE TEMPLATES (trivia): "Which sport is X famous for?" took Wikidata's `sport` on anyone who had one (George W. Bush → Cricket, Hugo
// Chávez → Baseball) — now ATHLETES ONLY: the person's own occupation must be the sport's player (by its English label), and anyone who is
// ALSO famous for something else (an actor, a politician, a royal, a writer …) is out. The same for the instrument a musician is famous for.
export const SPORT_PLAYER = {
  Soccer: ['association football player'], Basketball: ['basketball player'], Baseball: ['baseball player'], Football: ['American football player'],
  'Ice hockey': ['ice hockey player'], Tennis: ['tennis player'], Golf: ['golfer'], Boxing: ['boxer'],
  'Track and field': ['athletics competitor', 'sprinter', 'long-distance runner', 'middle-distance runner', 'hurdler', 'long jumper', 'high jumper', 'marathon runner'],
  Swimming: ['swimmer'], Gymnastics: ['artistic gymnast', 'gymnast'], Cycling: ['racing cyclist', 'cyclist', 'track cyclist', 'sport cyclist'],
  Cricket: ['cricketer'], Rugby: ['rugby union player', 'rugby league player', 'rugby player'],
};
export const INSTRUMENT_PLAYER = {
  Guitar: ['guitarist'], Piano: ['pianist'], Violin: ['violinist'], Drums: ['drummer'], Trumpet: ['trumpeter'], Saxophone: ['saxophonist'],
  Cello: ['cellist'], 'Bass guitar': ['bassist', 'bass guitarist'],
};
// famous for something ELSE (an athlete or a musician who is also one of these is better known as that)
export const ALSO_FAMOUS_AS = ['politician', 'actor', 'film actor', 'television actor', 'stage actor', 'voice actor', 'writer', 'novelist', 'poet',
  'philosopher', 'physicist', 'mathematician', 'monarch', 'aristocrat', 'military officer', 'soldier', 'professional wrestler', 'martial artist',
  'astronaut', 'statesperson', 'diplomat', 'judge', 'lawyer', 'journalist', 'television presenter', 'film director', 'screenwriter', 'model',
  'royalty', 'sovereign', 'emperor', 'king', 'queen', 'prince', 'princess', 'head of state', 'head of government', 'revolutionary', 'military personnel'];
// an ATHLETE may also be a plain "actor" / "writer" / "model" (a cameo, a memoir, an ad — Serena Williams, David Beckham); a FILM actor, a
// politician, a royal, a novelist … is better known as that (John Wayne, Sylvester Stallone, Albert Camus)
export const ATHLETE_ALSO = [...ALSO_FAMOUS_AS.filter(o => !['actor', 'writer', 'model'].includes(o)), 'singer', 'rapper', 'musician'];
// THE INSTRUMENT TEMPLATE is CUT: "famous for playing" only ever found composers (Tchaikovsky → Piano) or politicians (Jefferson → Violin) —
// a rock guitarist plays more than one instrument on record, so the one-instrument rule leaves nobody right
export const INSTRUMENT_CUT = true;
// INVENTORS: only the INVENTIONS (never a sport, a martial art, a unit, a method) — and the wrong answers from the same inventors
export const INVENTION_OUT = ['judo', 'aikido', 'blood type', 'degree Fahrenheit', 'radiocarbon dating', 'logarithm', 'periodic table'];
export const NO_THE = ['basketball', 'pasteurization'];

// directors + inventors people know: their OWN Wikipedia count (not their film's / invention's) — the right answer AND the three wrong ones
export const DIRECTOR_FAME = 60;
export const INVENTOR_FAME = 55;

// by id (the review's OBSCURE + ARGUABLE lists): The Wonderful Adventures of Nils · Kafka's The Castle · Fleetwood Mac (British-American)
export const OC8_TV_IDS = ['Q726254', 'Q682733', 'Q106648'];
// the World Cups before 1966 (1930 · 1934 · 1938 · 1950 · 1954 · 1958 · 1962) — history few players know
export const CUP_SINCE = 1966;
// a mountain in a TRUE OR FALSE statement: a famous one (its own Wikipedia count)
export const TF_MOUNTAIN_FAME = 70;
// the makers' names as people say them
export const MAKER_FIX = { 'Sony Interactive Entertainment': 'Sony', 'Sony Computer Entertainment': 'Sony', 'Sony Group': 'Sony', 'Sony Corporation': 'Sony',
  'Nintendo Co., Ltd.': 'Nintendo', 'Microsoft Corporation': 'Microsoft', 'Sega Corporation': 'Sega', 'Sega Games': 'Sega', 'Atari, Inc.': 'Atari' };
// CLOSEST CALL — the main span: the London Bridge (which one? Americans picture Tower Bridge — or the Arizona one) · the Rialto (104 ft: arguable)
export const OC8_SPAN_OUT = ['London Bridge', 'Rialto Bridge'];
export const OC8_SPAN_KEEP = 18;
