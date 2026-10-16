// Builds data/oc/timeline.json — the sets for OVERCLOCK's TIMELINE challenge — from the verified fact
// pools below. Each set = 4 items from ONE pool, ordered ascending by value (the pool says what that means:
// earliest → latest, shortest → tallest …). Fairness: years at least 5 apart, quantities at least 1.3×
// apart, so no set hinges on a coin-flip. Reproducible (seeded).
//
//   node scripts/build-timeline.mjs
//
// Adding facts: add [label, value, shown] to a pool (or a new pool) — use widely documented, stable
// values only (no records that change, nothing disputed) — then rebuild and run node --test tests/overclock.test.mjs.
// `shown` is what the reveal prints next to the item.
import { writeFileSync, mkdirSync } from 'node:fs';

const Y = (label, year) => [label, year, String(year)];
const POOLS = [
  {
    id: 'inventions', title: 'INVENTIONS', ask: 'Put these inventions in order', dir: 'EARLIEST → LATEST', years: true, sets: 14, items: [
      Y('Gutenberg’s printing press', 1440), Y('The telescope', 1608), Y('Newcomen’s steam engine', 1712), Y('Mercury thermometer', 1714),
      Y('Spinning jenny', 1764), Y('Hot-air balloon flight', 1783), Y('Cotton gin', 1793), Y('Smallpox vaccine', 1796),
      Y('Volta’s battery', 1800), Y('Steam locomotive', 1804), Y('Stethoscope', 1816), Y('The bicycle (Drais’s running machine)', 1817),
      Y('Lawn mower', 1830), Y('Colt revolver', 1836), Y('Singer sewing machine', 1851),
      Y('Dynamite', 1867), Y('Typewriter (Sholes)', 1868), Y('Telephone', 1876), Y('Phonograph', 1877), Y('Edison’s light bulb', 1879),
      Y('Benz motor car', 1886), Y('Marconi’s radio', 1895), Y('Wright brothers’ airplane', 1903), Y('Modern zipper', 1913),
      Y('Television (Baird’s demo)', 1926), Y('Penicillin', 1928), Y('Ballpoint pen (Bíró’s patent)', 1938), Y('First jet aircraft flight', 1939),
      Y('Microwave oven', 1945), Y('Transistor', 1947), Y('Polaroid instant camera', 1948), Y('Pong (arcade)', 1972),
      Y('First handheld mobile phone call', 1973), Y('Barcode first scanned in a shop', 1974), Y('Sony Walkman', 1979),
      Y('Compact disc', 1982), Y('World Wide Web', 1989), Y('iPhone', 2007),
    ],
  },
  {
    id: 'history', title: 'HISTORY', ask: 'Put these events in order', dir: 'EARLIEST → LATEST', years: true, sets: 14, items: [
      Y('Norman Conquest of England', 1066), Y('Magna Carta sealed', 1215), Y('Black Death reaches Europe', 1347),
      Y('Fall of Constantinople', 1453), Y('Columbus reaches the Americas', 1492), Y('Luther’s 95 Theses', 1517),
      Y('Defeat of the Spanish Armada', 1588), Y('Mayflower lands at Plymouth', 1620), Y('Great Fire of London', 1666),
      Y('US Declaration of Independence', 1776), Y('Storming of the Bastille', 1789), Y('Battle of Waterloo', 1815),
      Y('California Gold Rush begins', 1848), Y('American Civil War begins', 1861), Y('Suez Canal opens', 1869),
      Y('Eiffel Tower completed', 1889), Y('Titanic sinks', 1912), Y('World War I begins', 1914), Y('Russian Revolution', 1917),
      Y('Wall Street Crash', 1929), Y('Attack on Pearl Harbor', 1941), Y('World War II ends', 1945), Y('India’s independence', 1947),
      Y('Sputnik launched', 1957), Y('First Moon landing', 1969), Y('Chernobyl disaster', 1986), Y('Fall of the Berlin Wall', 1989),
      Y('Soviet Union dissolves', 1991), Y('Channel Tunnel opens', 1994), Y('Euro notes and coins arrive', 2002),
    ],
  },
  {
    id: 'movies', title: 'MOVIES', ask: 'Put these films in order of release', dir: 'EARLIEST → LATEST', years: true, sets: 16, items: [
      Y('Snow White and the Seven Dwarfs', 1937), Y('The Wizard of Oz', 1939), Y('Casablanca', 1942), Y('Singin’ in the Rain', 1952),
      Y('Psycho', 1960), Y('Mary Poppins', 1964), Y('2001: A Space Odyssey', 1968), Y('The Godfather', 1972), Y('Jaws', 1975),
      Y('Star Wars', 1977), Y('Alien', 1979), Y('Raiders of the Lost Ark', 1981), Y('Ghostbusters', 1984), Y('Back to the Future', 1985),
      Y('Die Hard', 1988), Y('Home Alone', 1990), Y('Jurassic Park', 1993), Y('Toy Story', 1995), Y('Titanic', 1997), Y('The Matrix', 1999),
      Y('Shrek', 2001), Y('Finding Nemo', 2003), Y('The Dark Knight', 2008), Y('Inception', 2010), Y('Frozen', 2013),
      Y('Black Panther', 2018), Y('Oppenheimer', 2023),
    ],
  },
  {
    id: 'albums', title: 'ALBUMS', ask: 'Put these albums in order of release', dir: 'EARLIEST → LATEST', years: true, sets: 12, items: [
      Y('Kind of Blue — Miles Davis', 1959), Y('Pet Sounds — The Beach Boys', 1966), Y('Abbey Road — The Beatles', 1969),
      Y('The Dark Side of the Moon — Pink Floyd', 1973), Y('Rumours — Fleetwood Mac', 1977), Y('Back in Black — AC/DC', 1980),
      Y('Thriller — Michael Jackson', 1982), Y('Purple Rain — Prince', 1984), Y('The Joshua Tree — U2', 1987), Y('Nevermind — Nirvana', 1991),
      Y('Jagged Little Pill — Alanis Morissette', 1995), Y('…Baby One More Time — Britney Spears', 1999),
      Y('American Idiot — Green Day', 2004), Y('Back to Black — Amy Winehouse', 2006), Y('21 — Adele', 2011),
      Y('1989 — Taylor Swift', 2014), Y('Future Nostalgia — Dua Lipa', 2020),
    ],
  },
  {
    id: 'tv', title: 'TV', ask: 'Put these TV shows in order of their first episode', dir: 'EARLIEST → LATEST', years: true, sets: 12, items: [
      Y('I Love Lucy', 1951), Y('Doctor Who', 1963), Y('Star Trek', 1966), Y('Sesame Street', 1969), Y('M*A*S*H', 1972), Y('Cheers', 1982),
      Y('The Simpsons', 1989), Y('The X-Files', 1993), Y('Friends', 1994), Y('The Sopranos', 1999), Y('Lost', 2004), Y('Mad Men', 2007),
      Y('Game of Thrones', 2011), Y('Stranger Things', 2016), Y('Squid Game', 2021),
    ],
  },
  {
    id: 'companies', title: 'BRANDS', ask: 'Put these companies in order of founding', dir: 'EARLIEST → LATEST', years: true, sets: 12, items: [
      Y('Levi Strauss & Co.', 1853), Y('Heinz', 1869), Y('Coca-Cola (the drink)', 1886), Y('Nintendo', 1889), Y('Ford Motor Company', 1903),
      Y('Kellogg’s', 1906), Y('Disney', 1923), Y('LEGO', 1932), Y('IKEA', 1943), Y('Sony', 1946), Y('Starbucks', 1971), Y('Microsoft', 1975),
      Y('Amazon', 1994), Y('Google', 1998), Y('Tesla', 2003), Y('YouTube', 2005), Y('Instagram', 2010),
    ],
  },
  {
    id: 'gadgets', title: 'GADGETS', ask: 'Put these launches in order', dir: 'EARLIEST → LATEST', years: true, sets: 10, items: [
      Y('Atari 2600', 1977), Y('Commodore 64', 1982), Y('Apple Macintosh', 1984), Y('Nintendo Game Boy', 1989), Y('Sony PlayStation', 1994),
      Y('Tamagotchi', 1996), Y('Nokia 3310', 2000), Y('Apple iPod', 2001), Y('Nintendo Wii', 2006), Y('Apple iPad', 2010),
      Y('Apple Watch', 2015), Y('Nintendo Switch', 2017), Y('PlayStation 5', 2020),
    ],
  },
  {
    id: 'births', title: 'BIRTHDAYS', ask: 'Put these people in order of birth', dir: 'EARLIEST → LATEST', years: true, sets: 12, items: [
      Y('Leonardo da Vinci', 1452), Y('William Shakespeare', 1564), Y('Wolfgang Amadeus Mozart', 1756), Y('Napoleon Bonaparte', 1769),
      Y('Jane Austen', 1775), Y('Abraham Lincoln', 1809), Y('Charles Dickens', 1812), Y('Queen Victoria', 1819), Y('Marie Curie', 1867),
      Y('Albert Einstein', 1879), Y('Pablo Picasso', 1881), Y('Frida Kahlo', 1907), Y('Nelson Mandela', 1918), Y('Marilyn Monroe', 1926),
      Y('Elvis Presley', 1935), Y('Bill Gates', 1955), Y('Barack Obama', 1961), Y('Beyoncé', 1981), Y('Taylor Swift', 1989),
    ],
  },
  {
    id: 'sports', title: 'SPORTS FIRSTS', ask: 'Put these firsts in order', dir: 'EARLIEST → LATEST', years: true, sets: 10, items: [
      Y('First Kentucky Derby', 1875), Y('First Wimbledon', 1877), Y('First modern Olympics', 1896), Y('First Tour de France', 1903),
      Y('First Winter Olympics', 1924), Y('First FIFA World Cup', 1930), Y('First Formula One World Championship', 1950),
      Y('First Super Bowl', 1967), Y('First Cricket World Cup', 1975), Y('First Rugby World Cup', 1987), Y('First Premier League season', 1992),
    ],
  },
  {
    id: 'buildings', title: 'LANDMARKS', ask: 'Order these by height', dir: 'SHORTEST → TALLEST', sets: 12, items: [
      ['Brandenburg Gate', 26, '26 m'], ['Christ the Redeemer (with pedestal)', 38, '38 m'], ['Colosseum', 48, '48 m'],
      ['Leaning Tower of Pisa', 56, '56 m'], ['Taj Mahal', 73, '73 m'], ['Statue of Liberty (ground to torch)', 93, '93 m'],
      ['St Paul’s Cathedral', 111, '111 m'], ['London Eye', 135, '135 m'], ['Washington Monument', 169, '169 m'],
      ['Gateway Arch', 192, '192 m'], ['Golden Gate Bridge towers', 227, '227 m'], ['Empire State Building (to the tip)', 443, '443 m'],
      ['Taipei 101', 508, '508 m'], ['CN Tower', 553, '553 m'], ['Burj Khalifa', 828, '828 m'],
    ],
  },
  {
    id: 'mountains', title: 'MOUNTAINS', ask: 'Order these peaks by height', dir: 'LOWEST → HIGHEST', sets: 10, items: [
      ['Snowdon', 1085, '1,085 m'], ['Ben Nevis', 1345, '1,345 m'], ['Mount Kosciuszko', 2228, '2,228 m'], ['Mount Olympus (Greece)', 2918, '2,918 m'],
      ['Mount Fuji', 3776, '3,776 m'], ['Matterhorn', 4478, '4,478 m'], ['Mont Blanc', 4806, '4,806 m'], ['Kilimanjaro', 5895, '5,895 m'],
      ['Denali', 6190, '6,190 m'], ['Aconcagua', 6961, '6,961 m'], ['Mount Everest', 8849, '8,849 m'],
    ],
  },
  {
    id: 'rivers', title: 'RIVERS', ask: 'Order these rivers by length', dir: 'SHORTEST → LONGEST', sets: 8, items: [
      ['Thames', 346, '346 km'], ['Seine', 777, '777 km'], ['Rhine', 1230, '1,230 km'], ['Colorado', 2330, '2,330 km'], ['Danube', 2850, '2,850 km'],
      ['Volga', 3530, '3,530 km'], ['Mississippi', 3730, '3,730 km'], ['Mekong', 4350, '4,350 km'], ['Yangtze', 6300, '6,300 km'], ['Nile', 6650, '6,650 km'],
    ],
  },
  {
    id: 'planets', title: 'SPACE', ask: 'Order these worlds by diameter', dir: 'SMALLEST → LARGEST', sets: 8, items: [
      ['Pluto', 2377, '2,377 km'], ['The Moon', 3474, '3,474 km'], ['Mercury', 4879, '4,879 km'], ['Mars', 6779, '6,779 km'],
      ['Earth', 12742, '12,742 km'], ['Neptune', 49244, '49,244 km'], ['Saturn', 116460, '116,460 km'], ['Jupiter', 139820, '139,820 km'],
    ],
  },
  {
    id: 'speeds', title: 'ANIMALS', ask: 'Order these animals by top speed', dir: 'SLOWEST → FASTEST', sets: 8, items: [
      ['Garden snail', 0.05, '≈ 0.05 km/h'], ['Three-toed sloth', 0.25, '≈ 0.25 km/h'], ['Chicken', 14, '≈ 14 km/h'],
      ['Usain Bolt (top speed)', 44, '≈ 44 km/h'], ['Grizzly bear', 56, '≈ 56 km/h'], ['Lion', 80, '≈ 80 km/h'],
      ['Cheetah', 110, '≈ 110 km/h'], ['Peregrine falcon (diving)', 390, '≈ 390 km/h'],
    ],
  },
  {
    id: 'weights', title: 'ANIMALS', ask: 'Order these by typical adult weight', dir: 'LIGHTEST → HEAVIEST', sets: 8, items: [
      ['Hummingbird', 0.003, '≈ 3 g'], ['Hamster', 0.14, '≈ 140 g'], ['House cat', 4.5, '≈ 4.5 kg'], ['Golden retriever', 30, '≈ 30 kg'],
      ['Grizzly bear', 300, '≈ 300 kg'], ['Giraffe', 1000, '≈ 1 tonne'], ['African elephant', 6000, '≈ 6 tonnes'], ['Blue whale', 140000, '≈ 140 tonnes'],
    ],
  },
  {
    id: 'lifespans', title: 'ANIMALS', ask: 'Order these by typical lifespan', dir: 'SHORTEST → LONGEST', sets: 6, items: [
      ['House mouse', 1.5, '≈ 1–2 years'], ['Rabbit', 9, '≈ 9 years'], ['Domestic cat', 15, '≈ 15 years'], ['Horse', 28, '≈ 28 years'],
      ['African elephant', 65, '≈ 65 years'], ['Galápagos tortoise', 120, '100+ years'], ['Bowhead whale', 200, '200+ years'],
    ],
  },
  {
    id: 'areas', title: 'GEOGRAPHY', ask: 'Order these countries by area', dir: 'SMALLEST → LARGEST', sets: 12, items: [
      ['Vatican City', 0.44, '0.44 km²'], ['Monaco', 2, '2 km²'], ['Malta', 316, '316 km²'], ['Luxembourg', 2586, '2,586 km²'],
      ['Jamaica', 10991, '10,991 km²'], ['Switzerland', 41285, '41,285 km²'], ['Ireland', 70273, '70,273 km²'], ['United Kingdom', 243610, '243,610 km²'],
      ['Germany', 357022, '357,022 km²'], ['Spain', 505990, '505,990 km²'], ['Mexico', 1964375, '1.96 million km²'], ['India', 3287263, '3.29 million km²'],
      ['Australia', 7692024, '7.69 million km²'], ['Canada', 9984670, '9.98 million km²'], ['Russia', 17098246, '17.1 million km²'],
    ],
  },
  {
    id: 'populations', title: 'GEOGRAPHY', ask: 'Order these countries by population', dir: 'FEWEST → MOST PEOPLE', sets: 6, items: [
      ['Vatican City', 800, '≈ 800'], ['Iceland', 380000, '≈ 0.4 million'], ['New Zealand', 5200000, '≈ 5 million'],
      ['Australia', 27000000, '≈ 27 million'], ['Japan', 124000000, '≈ 124 million'], ['United States', 335000000, '≈ 335 million'],
      ['India', 1430000000, '≈ 1.4 billion'],
    ],
  },
];

let s = 0x7111e;
const rand = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const fair = (pool, items) => {
  const v = items.map(i => i[1]).sort((a, b) => a - b);
  for (let k = 1; k < v.length; k++) {
    if (pool.years ? v[k] - v[k - 1] < 5 : v[k] / v[k - 1] < 1.3) return false;
  }
  return true;
};

const sets = [];
for (const pool of POOLS) {
  const seen = new Set();
  const uses = new Map();
  let made = 0;
  for (let attempt = 0; attempt < 20000 && made < pool.sets; attempt++) {
    // favour items used least so every fact gets aired
    const ranked = [...pool.items].sort((a, b) => (uses.get(a[0]) || 0) - (uses.get(b[0]) || 0) || rand() - 0.5);
    const pickFrom = ranked.slice(0, Math.max(8, Math.ceil(ranked.length * 0.6)));
    const items = [];
    while (items.length < 4) { const it = pickFrom[Math.floor(rand() * pickFrom.length)]; if (!items.includes(it)) items.push(it); }
    if (!fair(pool, items)) continue;
    const key = items.map(i => i[0]).sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    items.forEach(i => uses.set(i[0], (uses.get(i[0]) || 0) + 1));
    sets.push([pool.title, pool.ask, pool.dir, items.slice().sort((a, b) => a[1] - b[1]).map(i => [i[0], i[2]])]);
    made++;
  }
  if (made < pool.sets) console.warn(`${pool.id}: only ${made}/${pool.sets} fair sets`);
}
mkdirSync('data/oc', { recursive: true });
writeFileSync('data/oc/timeline.json', JSON.stringify({ format: '[title, ask, direction, [[item, shown value] × 4 in the correct order]]', sets }, null, 0).replace(/\],\["(?=[A-Z ]+","(Put|Order))/g, '],\n["'));
console.log(`${sets.length} timeline sets from ${POOLS.length} pools`);
