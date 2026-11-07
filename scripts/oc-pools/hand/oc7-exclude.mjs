// OVERCLOCK POOLS (OC7) — the by-hand exclusions for the OC7 data-built pools, read item by item (Nov 6): what a casual American player has
// never heard of (OBSCURE), what two careful people could argue about (ARGUABLE), what isn't for the whole family (ALL AGES), a name two things
// share (AMBIGUOUS). By the English label the build shows (or a Q-id). OC6's lists (wd-exclude.mjs) still apply where the same stats are read.
export const CC_EXCLUDE_LABELS = {
  // OBSCURE peaks (the eight-thousanders past the famous four; national high points few Americans know)
  peak: ['Mount Athos', 'Baekdu Mountain', 'Puncak Jaya', 'Mount Aragats', 'Mount Parnassus', 'Triglav', 'Citlaltepetl', 'Khan Tengri', 'Mount Kazbek',
    'Mount Pelée', 'Hekla', 'Klyuchevskaya Sopka', 'Mount Nemrut', 'Mount Arafat', 'Terich Mir', 'Vulcano', 'Mount Tabor', 'Sněžka', 'Parícutin',
    'Noshaq', 'Rysy', 'Gerlachovský štít', 'Kebnekaise', 'Llullaillaco', 'Mount Apo', 'Mount Emei', 'Jengish Chokusu', "Adam's Peak", 'Shkhara',
    'Nevado del Ruiz', 'Monte Titano', 'Jbel Toubkal', 'Galdhøpiggen', 'Aneto', 'Mulhacén', 'Yushan Main Peak', 'Belukha Mountain', 'Dufourspitze',
    'Grímsvötn', 'Mont Ventoux', 'Tambora', 'Mount Tai', 'Mount Hermon', 'Gangkhar Puensum', 'Grossglockner', 'Hoverla', 'Ismoil Somoni Peak',
    'Île Saint-Paul', 'Musala', 'Aburaj', 'Mayon Volcano', 'Cho Oyu', 'Dhaulagiri', 'Manaslu', 'Nanga Parbat', 'Gasherbrum', 'Gasherbrum II',
    'Broad Peak', 'Shishapangma', 'Nanda Devi', 'Mount Kailash', 'Mount Cameroon', 'Mount Roraima', 'Mount Nyiragongo', 'Aoraki / Mount Cook',
    'Damavand', 'Mount Kinabalu', 'Zugspitze'],
  // OBSCURE towers + skyscrapers outside the U.S. few Americans know (+ "The Center" — a name that reads as no name)
  // (the Empire State Building: 1,250 ft to the roof, 1,454 ft to the tip — Wikidata's 457 m fits neither: ARGUABLE)
  tall: ['Empire State Building', 'Mirante do Vale', 'Abeno Harukas', 'Edifício Itália', 'Mercury City Tower', 'Shun Hing Square', 'Almas Tower', 'Tuntex Sky Tower',
    'Al Hamra Tower', 'Central Plaza', '23 Marina', 'Rose Tower', 'Princess Tower', 'Emirates Office Tower', 'Cayan Tower', 'Torre Moeve',
    'Triumph Palace', 'Bitexco Financial Tower', 'Edifício Copan', 'Avaz Twist Tower', 'Grand Lisboa', 'Shimao International Plaza', 'Kingkey 100',
    'Tour First', 'Baku TV Tower', 'Riga Radio and TV Tower', 'Shukhov Tower', 'Mode Gakuen Cocoon Tower', 'Edifício Altino Arantes', 'CITIC Plaza',
    'Kingdom Centre', 'Telekom Tower', 'Istanbul Sapphire', 'Maiden Tower', 'Mole Antonelliana', 'Kyiv TV Tower', 'Avala Tower', 'Gonbad-e Qabus',
    'Azadi Tower', 'Galata Tower', 'Torre Glòries', 'Messeturm', 'Q1 Tower', 'Landmark 81', 'Turning Torso', 'Palace of Culture and Science',
    'The Center', 'Plaza Hotel', 'Grande Arche', 'International Commerce Centre', 'Jin Mao Tower', 'Yokohama Landmark Tower', 'Lakhta Centre',
    'One Canada Square', 'Kuala Lumpur Tower', '875 North Michigan Avenue', '70 Pine Street', 'U.S. Bank Tower', 'Columbia Center',
    '2 World Trade Center', '3 World Trade Center', '4 World Trade Center', 'Shanghai World Financial Center', 'Ping An Finance Centre',
    'Montparnasse Tower', 'Oriental Pearl Tower', 'Abraj Al Bait'],
  // ARGUABLE (is it a country? — a political question)
  'country-area': ['Taiwan'],
  // OBSCURE islands
  'island-area': ['Montserrat', 'Christmas Island', 'Saint Helena', 'Ascension Island', 'Saint Martin', 'Saipan', 'Saaremaa', 'Rügen', 'Bornholm',
    'Zealand', 'Lesbos', 'Chios', 'Samos', 'New Britain', 'Elba', 'Stromboli', 'Socotra', 'Timor', 'Gotland', 'Anglesey', 'Réunion', 'Menorca',
    'Lanzarote', 'Corfu', 'Sakhalin', 'Shikoku', 'Kyushu', 'Sulawesi', 'Mindanao', 'Luzon', 'Rhodes', 'Gran Canaria', 'Ellesmere Island'],
  // OBSCURE lakes
  'lake-area': ['Lake Ladoga', 'Lake Balkhash', 'Issyk-Kul', 'Lake Onega', 'Lake Kivu', 'Lake Maggiore', 'Vänern', 'Saimaa', 'Lake Sevan',
    'Lake Edward', 'Lake Peipus', 'Lake Lugano', 'Mälaren', 'Lake Zurich', 'Lake Ohrid', 'Lake Lucerne', 'Lake Prespa', 'West Lake', 'Chiemsee',
    'Lake Athabasca', 'Lake Neuchâtel', 'Lake Bled', 'Dongting Lake', 'Poopó Lake', 'Lake Albert', 'Lake Mweru', 'Vättern', 'Lake Manasarovar',
    'Lake Inari', 'Lake Trasimeno', 'Khanka', 'Lake Balaton', 'Lake Maracaibo', 'Qinghai Lake'],
  'lake-depth': ['Lake Ladoga', 'Lake Balkhash', 'Issyk-Kul', 'Lake Onega', 'Lake Kivu', 'Lake Maggiore', 'Vänern', 'Saimaa', 'Lake Sevan',
    'Lake Edward', 'Lake Peipus', 'Lake Lugano', 'Mälaren', 'Lake Zurich', 'Lake Ohrid', 'Lake Lucerne', 'Lake Prespa', 'Chiemsee', 'Lake Athabasca',
    'Lake Neuchâtel', 'Lake Albert', 'Lake Mweru', 'Vättern', 'Lake Manasarovar', 'Lake Trasimeno', 'Khanka', 'Lake Balaton', 'Lake Maracaibo',
    'Qinghai Lake', 'Lake Garda'],
  // a park that no longer exists (folded into Kings Canyon) · a tiny urban park (0.1 sq mi — no estimate)
  'park-area': ['General Grant National Park', 'Gateway Arch National Park', 'National Park of American Samoa', 'Virgin Islands National Park'],
  // OBSCURE elements (an atomic number nobody estimates)
  atomic: ['gallium', 'radium', 'francium', 'scandium', 'strontium', 'cadmium', 'germanium', 'rubidium', 'antimony', 'cesium', 'bismuth', 'iridium',
    'palladium', 'tellurium', 'hafnium', 'tantalum', 'astatine', 'zirconium', 'vanadium', 'barium', 'polonium', 'niobium', 'osmium', 'molybdenum',
    'yttrium', 'technetium', 'selenium'],
  // OBSCURE bridges · ARGUABLE (the Crimean Bridge — a war's front line)
  // (Tower Bridge: 200 ft between the towers or 270 ft — which span is "main" is ARGUABLE)
  span: ['Tower Bridge', 'Crimean Bridge', 'Vizcaya Bridge', 'Széchenyi Chain Bridge', 'Rio-Antirrio bridge', 'Fatih Sultan Mehmet Bridge', 'Yavuz Sultan Selim Bridge',
    'Galata Bridge', 'Menai Suspension Bridge', "Ponte Sant'Angelo", 'Bridge of the Americas', 'Pont de Normandie', 'Danube Bridge', 'Hangzhou Bay Bridge',
    'Öland Bridge', 'Si-o-se Pol', 'Iron Bridge', 'Southwark Bridge', "pont de l'Alma", 'Rainbow Bridge', 'Pelješac Bridge', 'Huajiang Canyon Bridge',
    'Oberbaum Bridge', 'Vasco da Gama Bridge', 'Qingdao Jiaozhou Bay Bridge', '25 de Abril Bridge', 'Rio–Niterói Bridge', 'Albert Bridge',
    'Waterloo Bridge', 'Tacoma Narrows Bridge (2007)', 'Confederation Bridge'],
  runtime: ['Rock Dog'],
  // ALL AGES (mature dramas, adult cartoons) · OBSCURE in the U.S.
  episodes: ['Game of Thrones', 'Breaking Bad', 'The Walking Dead', 'The Sopranos', 'Dexter', 'Peaky Blinders', 'Twin Peaks', 'House of Cards',
    'Prison Break', 'Westworld', 'Better Call Saul', 'The Penthouse: War in Life', 'Family Guy', 'Two and a Half Men', 'Desperate Housewives',
    'Xena: Warrior Princess', 'Buffy the Vampire Slayer', 'Supernatural', 'CSI: Crime Scene Investigation', 'Gossip Girl', 'The Vampire Diaries',
    'Charmed', '24', 'Suits', 'Magnificent Century', 'Crash Landing on You', 'True Beauty', 'Guardian: The Lonely and Great God', 'Father of the Pride',
    'Winx Club', 'Oggy and the Cockroaches', 'Arrow', 'Heroes', 'The X-Files'],
};
export const CC_EXCLUDE = [];
// a famous person's "how old when they died" — ALL AGES: no one whose death is the story (an assassination, an accident, an overdose)
export const LIVED_EXCLUDE = ['Abraham Lincoln', 'John F. Kennedy', 'Martin Luther King Jr.', 'Diana, Princess of Wales', 'Princess Diana',
  'Elvis Presley', 'Michael Jackson', 'Whitney Houston', 'Amy Winehouse', 'Kurt Cobain', 'Jimi Hendrix', 'Janis Joplin', 'Jim Morrison',
  'Heath Ledger', 'Marilyn Monroe', 'James Dean', 'Bruce Lee', 'Paul Walker', 'Kobe Bryant', 'John Lennon', 'Bob Marley', 'Prince', 'Freddie Mercury',
  'Steve Irwin', 'Selena', 'Tupac Shakur', 'The Notorious B.I.G.', 'Avicii', 'Chester Bennington', 'Robin Williams', 'Philip Seymour Hoffman',
  'Anne Frank', 'Vincent van Gogh', 'Ernest Hemingway', 'Virginia Woolf', 'Sylvia Plath', 'Alan Turing',
  'Buddy Holly', 'Ritchie Valens', 'Amelia Earhart', 'Yuri Gagarin', 'Christa McAuliffe', 'Matthew Perry', 'Mac Miller', 'Juice Wrld', 'XXXTentacion',
  'Brittany Murphy', 'River Phoenix', 'John Belushi', 'Chris Farley', 'Cameron Boyce', 'Lisa Lopes', 'Aaliyah', 'Lil Peep', 'Brandon Lee',
  // WRONG in Wikidata (alive — a death date on file anyway) · UNSURE (a recent death the build can't confirm) · clerics (OC6's rule)
  'Dolly Parton', 'Brigitte Bardot', 'Alain Delon', 'John Paul I', 'Swami Vivekananda', 'Mother Teresa', 'Chuck Norris', 'Leo XIII',
  // politics (OC6's rule) · views a party game shouldn't spotlight
  'Liu Xiaobo', 'Friedrich Hayek', 'Ezra Pound',
  // OBSCURE in the U.S. — the OC7 look review (Group 3)
  'Sigrid Undset', 'Wisława Szymborska', 'Jean Cocteau', 'John Galsworthy', 'André-Marie Ampère', 'Heinrich Böll', 'Max Born', 'Jean Racine',
  'Mikhail Bulgakov', 'François Mauriac', 'Vladimir Vysotsky', 'Hendrik Lorentz', 'Chandrasekhara Venkata Raman', 'John Ruskin',
  'Franz Beckenbauer', 'Novalis', 'Isaac Bashevis Singer', 'Giacomo Leopardi', 'Elias Canetti', 'Antoine Henri Becquerel', 'John Dewey',
  'V. S. Naipaul', 'Jean-Paul Belmondo', 'Karel Čapek', 'Thomas Henry Huxley', 'Thomas Carlyle', 'Georg Cantor', 'Pierre de Fermat',
  'Max Planck', 'Erwin Schrödinger', 'James Clerk Maxwell', 'Edvard Grieg', 'Robert Schumann', 'Felix Mendelssohn', 'Percy Bysshe Shelley',
  'John Dalton', 'Linus Pauling', 'Heinrich Hertz', 'Srinivasa Ramanujan', 'Samuel Beckett', 'Thomas Hardy', 'Saul Bellow', 'Sinclair Lewis',
  // OBSCURE in the U.S. (writers, thinkers + stars a casual American player has never heard of) · Knut Hamsun (a Nazi sympathizer)
  'Hebe Camargo', 'Octave Mirbeau', 'Sully Prudhomme', 'Frédéric Mistral', 'Gerhart Hauptmann', 'Henryk Sienkiewicz', 'Taras Shevchenko',
  'Adam Mickiewicz', 'Lu Xun', 'Ivan Bunin', 'Selma Lagerlöf', 'Romain Rolland', 'Anatole France', 'Maurice Maeterlinck', 'Knut Hamsun',
  'L. L. Zamenhof', 'Satyajit Ray', 'Naguib Mahfouz', 'Luigi Pirandello', 'Toshirō Mifune', 'Anna Akhmatova', 'Joseph Brodsky', 'Henri Bergson',
  'Auguste Comte', 'Heinrich Heine', 'Friedrich Schiller', 'Charles Baudelaire', 'Nikolai Gogol', 'Guy de Maupassant', 'Ivan Turgenev',
  'Gustave Flaubert', 'Émile Zola', 'Henrik Ibsen', 'Thomas Mann', 'Bertolt Brecht', 'Günter Grass', 'Nadine Gordimer', 'Doris Lessing',
  'Alice Munro', 'Boris Pasternak', 'Sergei Eisenstein', 'Ingmar Bergman', 'Federico Fellini', 'Marlene Dietrich', 'Sarah Bernhardt', 'Édith Piaf',
  'Rainer Maria Rilke', 'Le Corbusier', 'Ludwig Wittgenstein', 'Karl Popper', 'Georg Wilhelm Friedrich Hegel', 'Arthur Schopenhauer',
  'Jean de La Fontaine', 'Hannah Arendt', 'Ayn Rand', 'Milton Friedman', 'Simone de Beauvoir', 'Jean-Paul Sartre', 'Albert Camus', 'David Hilbert',
  'Joseph Fourier', 'Henri Poincaré', 'Denis Diderot', 'Jean-Jacques Rousseau', 'Immanuel Kant', 'Friedrich Nietzsche', 'David Hume',
  'Kahlil Gibran', 'Erich Maria Remarque', 'Alexander Pushkin', 'Federico García Lorca', 'Gabriel García Márquez', 'Jorge Luis Borges',
  'Umberto Eco', 'Hermann Hesse', 'Anton Chekhov', 'Marcel Proust', 'Auguste Rodin', 'Antonín Dvořák', 'Gustav Mahler', 'Hector Berlioz',
  'Eugène Delacroix', 'James Prescott Joule', 'Paul Dirac', 'Alexander von Humboldt', 'Rabindranath Tagore', 'Pearl S. Buck', 'Akira Kurosawa',
  'Katsushika Hokusai', 'George Sand', 'Walter Scott', 'Antoine de Saint-Exupéry', 'Robert Koch', 'Carl Friedrich Gauss', 'Leonhard Euler',
  'William James', 'Diego Maradona', 'Adam Smith'];
export const TV_EXCLUDE = [];
// TRIVIA's data half: a RIGHT ANSWER (by its label) that's out — read by hand after each build
export const TV_EXCLUDE_LABELS = [];
// OC7 TRIVIA rows dropped by a Wikidata id (the spot-check read, Group 4): Efteling (a Dutch theme park — obscure in the U.S.)
export const TV_EXCLUDE_IDS = ['Q733234'];
// US-FIRST: the title an American knows (Wikidata keeps the original / British one)
export const TITLE_FIX = {
  "Harry Potter and the Philosopher's Stone": "Harry Potter and the Sorcerer's Stone",
};
// a name as players say it (the country names too)
export const NAME_FIX = {
  "People's Republic of China": 'China', 'Kingdom of the Netherlands': 'Netherlands', 'Federated States of Micronesia': 'Micronesia',
  'Eagles': 'the Eagles', 'Mona Lisa': 'the Mona Lisa',
};
// countries that no longer exist (the UN list keeps former members) — never asked, never a wrong answer
export const DISSOLVED = ['West Germany', 'East Germany', 'Soviet Union', 'Yugoslavia', 'Czechoslovakia', 'United Arab Republic', 'Commonwealth of the Philippines',
  'Serbia and Montenegro', 'Zanzibar', 'Socialist Federal Republic of Yugoslavia', 'Federal Republic of Yugoslavia', 'Tanganyika', 'South Yemen', 'North Yemen',
  'Republic of China (1912–1949)', 'Byelorussian Soviet Socialist Republic', 'Ukrainian Soviet Socialist Republic', 'Taiwan', 'Republic of China'];
// ARGUABLE continents (a country in two — or one people place in either): left out of "on which continent"
export const TRANSCONTINENTAL = ['Georgia', 'Armenia', 'Azerbaijan', 'Cyprus', 'Kazakhstan', 'Turkey', 'Russia', 'Egypt', 'Indonesia', 'Timor-Leste', 'East Timor',
  'Panama', 'Trinidad and Tobago', 'Papua New Guinea', 'Iceland', 'Greenland', 'Maldives', 'Seychelles', 'Mauritius', 'Cape Verde', 'Madagascar'];
// AMBIGUOUS U.S. city names (two well-known cities share them) — "In which state is …" would have two answers
export const US_AMBIGUOUS = ['Arlington', 'Springfield', 'Columbus', 'Portland', 'Kansas City', 'Aurora', 'Richmond', 'Jackson', 'Columbia', 'Charleston',
  'Rochester', 'Glendale', 'Pasadena', 'Wilmington', 'Albany', 'Lexington', 'Greenville', 'Fayetteville', 'Peoria', 'Burlington', 'Concord', 'Manchester',
  'Bloomington', 'Lafayette', 'Athens', 'Paris', 'Cambridge', 'Salem', 'Plymouth', 'Hollywood', 'Augusta', 'Lincoln', 'Vancouver', 'Birmingham',
  'Durham', 'Jacksonville', 'Independence', 'Cleveland', 'Dayton', 'Newport', 'Bristol', 'Franklin', 'Clinton', 'Marion', 'Washington', 'Kingston'];
// the composers players know (the classical + film masters) — a work's composer and its wrong answers come from this list only
export const COMPOSERS = ['Johann Sebastian Bach', 'Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'Frédéric Chopin', 'Pyotr Ilyich Tchaikovsky', 'Antonio Vivaldi',
  'Giuseppe Verdi', 'Giacomo Puccini', 'Richard Wagner', 'George Frideric Handel', 'Joseph Haydn', 'Franz Schubert', 'Johannes Brahms', 'Johann Strauss II',
  'Claude Debussy', 'Maurice Ravel', 'Gioachino Rossini', 'Georges Bizet', 'Edvard Grieg', 'Felix Mendelssohn', 'Antonín Dvořák', 'Igor Stravinsky',
  'George Gershwin', 'Gustav Holst', 'Edward Elgar', 'Modest Mussorgsky', 'Nikolai Rimsky-Korsakov', 'Camille Saint-Saëns', 'Carl Orff', 'Johann Pachelbel',
  'Franz Liszt', 'Gustav Mahler', 'Sergei Rachmaninoff', 'Sergei Prokofiev', 'Aaron Copland', 'Leonard Bernstein', 'John Williams', 'Hans Zimmer',
  'Robert Schumann', 'Richard Strauss', 'Erik Satie', 'Scott Joplin', 'John Philip Sousa', 'Jean Sibelius', 'Giuseppe Tartini', 'Hector Berlioz',
  'Jacques Offenbach', 'Léo Delibes', 'Andrew Lloyd Webber', 'Ennio Morricone', 'Philip Glass', 'Engelbert Humperdinck', 'Pietro Mascagni', 'Christoph Willibald Gluck'];
// THE WHITELISTS (read by hand, Nov 6): the data-built templates whose raw Wikidata answer mixes the famous + the arguable + the not-for-
// the-family keep ONLY these (an invention credited to ONE person every encyclopedia agrees on; a character from a story a player knows; a
// landmark / an island a casual American knows, outside the U.S.)
export const INVENTIONS_OK = ['periodic table', 'piano', 'email', 'volleyball', 'web browser', 'judo', 'computer mouse', 'dishwasher', 'basketball',
  'saxophone', 'sudoku', 'barometer', 'battery', 'zipper', 'diesel engine', 'phonograph', 'printing press', 'lightning rod', 'synthesizer', 'logarithm',
  'emoji', 'aikido', 'pasteurization', 'gyroscope', 'vaccine', 'degree Fahrenheit', 'blood type', 'radiocarbon dating', 'electron microscope'];
export const STORIES_OK = ['Pirates of the Caribbean', 'The Lord of the Rings', 'Star Wars', 'Harry Potter', 'Nineteen Eighty-Four', 'Transformers', 'Dracula',
  'Friends', 'The Adventures of Tintin', 'One Thousand and One Nights', 'The Hobbit', 'Looney Tunes', 'Pokémon', 'Beowulf'];
export const SITES_OK = ['Taj Mahal', 'Lake Baikal', 'Great Barrier Reef', 'Stonehenge', 'Galapagos Islands', 'Timbuktu', 'Troy', 'Chichen Itza',
  'Persepolis', 'Sydney Opera House', 'Olympia', 'Tower of London', 'Ha Long Bay', "Hadrian's Wall", 'Teotihuacan', 'Agra Fort', 'Cave of Altamira',
  "Giant's Causeway", 'Great Zimbabwe', 'Plitvice Lakes National Park', 'Petra', 'Palace of Versailles', 'Acropolis of Athens', 'Himeji Castle',
  'Red Fort', 'Meteora', 'Grand Canal', 'Machu Picchu', 'Angkor Wat', 'Great Wall of China', 'Forbidden City', 'Alhambra', 'Pompeii', 'Mount Fuji',
  'Kilimanjaro National Park', 'Serengeti National Park', 'Victoria Falls', 'Iguazu National Park', 'Easter Island', 'Rapa Nui National Park',
  'Colosseum', 'Historic Centre of Rome', 'Neuschwanstein Castle', 'Kremlin', 'Moscow Kremlin', 'Pyramids of Giza', 'Giza pyramid complex', 'Uluru',
  'Uluṟu-Kata Tjuṯa National Park', 'Banff National Park', 'Abu Simbel', 'Valley of the Kings', 'Terracotta Army', 'Potala Palace', 'Borobudur',
  'Mont-Saint-Michel', 'Kew Gardens', 'Westminster', 'Venice', 'Dubrovnik', 'Cappadocia', 'Göreme National Park'];
export const ISLANDS_OK = ['Java', 'Crete', 'Mallorca', 'Ibiza', 'Bali', 'Newfoundland', 'Isle of Wight', 'South Island', 'North Island', 'Capri',
  'Santorini', 'Okinawa', 'Vancouver Island', 'Jeju Island', 'Sumatra', 'Tahiti', 'Baffin Island', 'Sicily', 'Sardinia', 'Corsica', 'Tasmania',
  'Madagascar', 'Borneo', 'Greenland', 'Iceland', 'Honshu', 'Hokkaido', 'Mykonos', 'Rhodes', 'Malta', 'Prince Edward Island', 'Zanzibar', 'Phuket',
  'Gozo', 'Corfu', 'Tenerife'];
// the athletes + musicians a player knows: famous (sitelinks) + one sport / one instrument on record; never a career the news ended
export const ATHLETES_OUT = ['O. J. Simpson', 'Oscar Pistorius', 'Lance Armstrong', 'Aaron Hernandez', 'Mike Tyson', 'Ray Rice', 'Pete Rose', 'Ben Johnson',
  'Marion Jones', 'Tonya Harding', 'Bobby Fischer', 'Hope Solo', 'Kobe Bryant', 'Paul Walker', 'Sergey Bubka', 'Diego Maradona'];
// the chemical elements a player meets (the symbol + the atomic number templates ask only these)
export const EVERYDAY_ELEMENTS = ['hydrogen', 'helium', 'lithium', 'beryllium', 'boron', 'carbon', 'nitrogen', 'oxygen', 'fluorine', 'neon', 'sodium', 'magnesium',
  'aluminum', 'aluminium', 'silicon', 'phosphorus', 'sulfur', 'chlorine', 'argon', 'potassium', 'calcium', 'titanium', 'chromium', 'manganese', 'iron', 'cobalt',
  'nickel', 'copper', 'zinc', 'arsenic', 'bromine', 'krypton', 'silver', 'tin', 'iodine', 'xenon', 'tungsten', 'platinum', 'gold', 'mercury', 'lead',
  'radon', 'radium', 'uranium', 'plutonium', 'cesium', 'caesium'];
// the cities the straight-line distances use (Q-id → the name the question says): the famous ones only — every label is checked against
// Wikidata's own at the build (a mismatch = a wrong Q-id → that city is skipped)
export const DIST_US = {
  Q60: 'New York City', Q65: 'Los Angeles', Q1297: 'Chicago', Q16555: 'Houston', Q16556: 'Phoenix', Q1345: 'Philadelphia', Q16552: 'San Diego',
  Q16557: 'Dallas', Q62: 'San Francisco', Q5083: 'Seattle', Q100: 'Boston', Q8652: 'Miami', Q23556: 'Atlanta', Q16554: 'Denver', Q23768: 'Las Vegas',
  Q61: 'Washington, D.C.', Q34404: 'New Orleans', Q12439: 'Detroit', Q36091: 'Minneapolis', Q23197: 'Nashville', Q6106: 'Portland',
  Q23337: 'Salt Lake City', Q18094: 'Honolulu', Q39450: 'Anchorage', Q38022: 'St. Louis', Q49233: 'Orlando', Q37320: 'Cleveland', Q1342: 'Pittsburgh',
};
export const DIST_WORLD = {
  Q84: 'London', Q90: 'Paris', Q220: 'Rome', Q649: 'Moscow', Q1490: 'Tokyo', Q956: 'Beijing', Q8686: 'Shanghai', Q8646: 'Hong Kong',
  Q334: 'Singapore', Q3130: 'Sydney', Q85: 'Cairo', Q406: 'Istanbul', Q612: 'Dubai', Q1156: 'Mumbai', Q1353: 'Delhi', Q1861: 'Bangkok', Q8684: 'Seoul',
  Q8678: 'Rio de Janeiro', Q174: 'São Paulo', Q1486: 'Buenos Aires', Q1489: 'Mexico City', Q172: 'Toronto', Q64: 'Berlin', Q2807: 'Madrid',
  Q1524: 'Athens', Q3870: 'Nairobi', Q5465: 'Cape Town', Q2868: 'Lima', Q597: 'Lisbon', Q1761: 'Dublin', Q1754: 'Stockholm', Q585: 'Oslo',
  Q1741: 'Vienna', Q1085: 'Prague', Q727: 'Amsterdam', Q24639: 'Vancouver', Q340: 'Montreal', Q1563: 'Havana', Q1764: 'Reykjavík', Q1726: 'Munich',
  Q1748: 'Copenhagen', Q60: 'New York City', Q65: 'Los Angeles', Q1297: 'Chicago', Q18094: 'Honolulu',
};
