// RUMRUNNER — every line of flavour text: goods, districts, weather, upgrades, the news, rumours, event scenes and their
// outcomes, Mr. Vale, and the newspaper at the end. Pure and deterministic: every "pick a variation" goes through the rng
// `r()` the caller passes (seeded per match/day/player), so every phone shows the same line. Each picker calls r() exactly
// once, and only picks among the variations that fit the length limit with these particular names and numbers.
//
// Voice: a 1920s newspaper and a hard-boiled narrator — witty, warm, PG. Smuggling, bribes, escapes and deals only.
import { GARAGE_DISCOUNT, START_DEBT, HIJACK, FEDS, EVENTS } from './tuning.js';

// ---------------------------------------------------------------- helpers
/** '$12,345'; negatives as '−$1,200' (a real minus sign). */
export const fmt$ = n => {
  const v = Math.round(Number(n) || 0);
  const s = '$' + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return v < 0 ? '−' + s : s;
};
const num = n => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const pct = x => `${Math.round((Number(x) || 0) * 100)}%`;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));
/** Fills every template, keeps those within max, picks one with a single r() call (the shortest when none fits). */
function fit(r, templates, v, max = Infinity) {
  const all = templates.map(t => (typeof t === 'function' ? t(v) : fill(t, v)));
  const ok = all.filter(s => s.length <= max);
  const x = r();
  if (!ok.length) return all.reduce((a, b) => (b.length < a.length ? b : a));
  return ok[Math.floor(x * ok.length)];
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// ---------------------------------------------------------------- the catalogue
// g: the good in running prose (lowercase), it: its pronoun, one: the unit's singular
export const GOOD_TEXT = {
  shine: { name: 'MOONSHINE', short: 'SHINE', unit: 'jars', one: 'jar', g: 'moonshine', it: 'it', blurb: 'Bathtub hooch in mason jars. Cheap, strong, everywhere.' },
  rum: { name: 'RUM', short: 'RUM', unit: 'bottles', one: 'bottle', g: 'rum', it: 'it', blurb: 'Caribbean rum, off the boats at midnight.' },
  gin: { name: 'GIN', short: 'GIN', unit: 'crates', one: 'crate', g: 'gin', it: 'it', blurb: 'The cocktail crowd’s favorite. Every club pours it.' },
  whiskey: { name: 'WHISKEY', short: 'WHISKEY', unit: 'barrels', one: 'barrel', g: 'whiskey', it: 'it', blurb: 'Real Canadian rye, smuggled over the border.' },
  cigars: { name: 'CIGARS', short: 'CIGARS', unit: 'boxes', one: 'box', g: 'cigars', it: 'them', blurb: 'Hand-rolled Havanas. The big shots pay big.' },
  champ: { name: 'CHAMPAGNE', short: 'CHAMP', unit: 'cases', one: 'case', g: 'champagne', it: 'it', blurb: 'French bubbly for the rich. A fortune per case.' },
};

// the: the district in prose, at: where something happens there ("Uptown", "on the Strip")
export const DISTRICT_TEXT = {
  docks: { name: 'THE DOCKS', the: 'the Docks', at: 'at the Docks', tagline: 'Fog, freighters, fed boats', blurb: 'Rum and cigars come in cheap off the boats. Federal patrols watch the piers closely.' },
  uptown: { name: 'UPTOWN', the: 'Uptown', at: 'Uptown', tagline: 'Old money, thirsty parties', blurb: 'Rich buyers pay well for whiskey and champagne. The feds keep a close eye on the avenues.' },
  strip: { name: 'THE STRIP', the: 'the Strip', at: 'on the Strip', tagline: 'Jazz, neon and wild prices', blurb: 'Nightclubs want everything, and prices swing wildly night to night. Fewer feds; anything goes.' },
  quarter: { name: 'OLD QUARTER', the: 'the Old Quarter', at: 'in the Old Quarter', tagline: 'Mr. Vale’s side of town', blurb: 'Vale’s office and your safe stash. The cheapest moonshine in town; few feds, some hijackers.' },
  rail: { name: 'RAIL YARD', the: 'the Rail Yard', at: 'at the Rail Yard', tagline: 'Bulk deals by the boxcar', blurb: 'Gin and whiskey cheap by the boxcar, and the place to buy trucks. Hijackers love the dark.' },
  heights: { name: 'HARBOR HEIGHTS', the: 'Harbor Heights', at: 'in Harbor Heights', tagline: 'Mansions on the hill', blurb: 'The best prices for cigars and champagne, almost no feds. The drive up costs a $450 fee.' },
};

export const WEATHER_TEXT = {
  clear: { name: 'CLEAR NIGHT', effect: 'Patrols see far — raids more likely, harder to run.' },
  rain: { name: 'RAIN', effect: 'Slick streets. A slightly better chance to outrun a tail.' },
  fog: { name: 'HEAVY FOG', effect: 'Fewer patrols, and easier to lose a tail.' },
  storm: { name: 'THUNDERSTORM', effect: 'Shipments delayed — imports cost more at the Docks and Rail Yard.' },
  dawn: { name: 'DAWN', effect: 'The last morning. Unsold cargo is worth nothing.' },
};

export const UPGRADE_TEXT = {
  truck1: { name: 'BIGGER TRUCK', blurb: 'Room for 50 more units of cargo.' },
  truck2: { name: 'FREIGHT TRUCK', blurb: 'Room for 100 more units. Needs the bigger truck first.' },
  armor: { name: 'ARMORED TRUCK', blurb: 'Better odds when you run from the feds or floor it past hijackers.' },
  hidden: { name: 'HIDDEN COMPARTMENTS', blurb: 'When cargo is seized or stolen, you keep half of what you’d lose.' },
  warehouse: { name: 'HIDDEN WAREHOUSE', blurb: 'Stash cash from any district, not just the Old Quarter.' },
  cop: { name: 'CROOKED COP', blurb: 'Halves your chance of a federal tail. Costs $250 a day.' },
};

const G = g => GOOD_TEXT[g] || GOOD_TEXT.shine;
const D = d => DISTRICT_TEXT[d] || DISTRICT_TEXT.quarter;
const gv = (good, dist) => {
  const g = G(good), d = D(dist);
  return { g: g.g, Gg: cap(g.g), it: g.it, unit: g.unit, the: d.the, The: cap(d.the), at: d.at, GOOD: g.name, DIST: d.name };
};

// ---------------------------------------------------------------- the morning paper's price news
const NEWS_SPIKE = [
  'Big party {at} tonight — {g} prices soar!',
  '{Gg} shortage {at} — prices go through the roof!',
  'Thirsty crowds {at}: buyers pay top dollar for {g}!',
  'Society wedding {at}! Anyone holding {g} is grinning.',
  '{The} runs dry — {g} fetches a small fortune!',
  'Feds bust a {g} supplier; {the} pays double for the rest!',
];
const NEWS_CRASH = [
  'A shipment of {g} floods {the} — prices crash!',
  '{Gg} glut {at}! Dealers can’t give {it} away.',
  'Nobody’s buying {g} {at} tonight — prices tumble!',
  'Warehouses bursting with {g} {at}: sellers slash prices!',
  'Bootleggers dump cheap {g} on {the} — prices hit the floor!',
  'Bargain night {at}: {g} going for pennies on the dollar!',
];
/** item { dist, good, k: 'spike'|'crash', m } → one headline ≤ 90 chars. */
export function newsLine(item, r) {
  return fit(r, item && item.k === 'crash' ? NEWS_CRASH : NEWS_SPIKE, gv(item && item.good, item && item.dist), 90);
}

// ---------------------------------------------------------------- rumours (about tomorrow; never says whether they're true)
const RUMOR_SPIKE = [
  'Word is {the} will be crying out for {g} tomorrow.',
  'A barman swears {g} goes sky-high {at} tomorrow. Then again, barmen swear a lot.',
  'Word on the street: tomorrow, {g} sells for a king’s ransom {at}.',
  'A doorman {at} says a big bash is coming tomorrow. They’ll want {g}. Lots of it.',
  'Overheard at the bar: {g} will be scarce {at} tomorrow.',
  'A cabbie taps his nose: “Tomorrow, pal — {g}, {the}. Top dollar.”',
  'A cigarette girl winks: “Hold on to your {g}, sugar. {The} pays big tomorrow.”',
];
const RUMOR_CRASH = [
  'Word is a load of {g} lands {at} tomorrow. Prices could tumble.',
  'A dockhand whispers: {the} will be drowning in {g} tomorrow.',
  'Rumor has it {g} will go for pennies {at} tomorrow.',
  'The shoeshine kid says {g} sellers {at} are desperate. Tomorrow, they’ll slash prices.',
  'Overheard in a phone booth: tomorrow, {the} gets flooded with cheap {g}.',
  'A cigarette girl winks: “Don’t sell {g} {at} tomorrow, sugar. Nobody’ll pay.”',
  'Word is somebody’s unloading a mountain of {g} {at} tomorrow.',
];
/** ev { dist, good, k } → a "word is…" tip about tomorrow, ≤ 110 chars. */
export function rumorLine(ev, r) {
  return fit(r, ev && ev.k === 'crash' ? RUMOR_CRASH : RUMOR_SPIKE, gv(ev && ev.good, ev && ev.dist), 110);
}

// ---------------------------------------------------------------- event scenes
const WEATHER_TAIL = {
  clear: ['Clear skies. They can see a long way tonight.', 'Not a cloud. Nowhere to hide.'],
  rain: ['Rain streaks the windshield. The streets are slick.', 'It’s pouring. Bad for them, maybe good for you.'],
  fog: ['The fog is thick. You could lose them in it.', 'Fog rolls in off the water. A good night to vanish.'],
  storm: ['Thunder rolls overhead. The roads are a mess.', 'Lightning flashes. Rain hammers the roof.'],
  dawn: ['First light is breaking. No shadows left.', 'The sun’s coming up. Make it quick.'],
};
const SCENES = {
  feds: {
    title: ['FEDERAL AGENTS', 'THE FEDS', 'PROHIBITION AGENTS', 'A FEDERAL TAIL'],
    kicker: ['A black sedan in the mirror', 'Headlights, and a siren', 'Badges at the corner', 'The G-men are on your tail'],
    body: [
      'Two Prohibition agents in a black sedan pull out behind you {at}. The crates rattle in the back. Decide fast.',
      'A whistle shrieks. An agent waves you over, notebook out, hat brim low. Your cargo suddenly sounds very loud.',
      'Headlights swing in behind you and stay there. Every turn you take, they take. The feds have your number.',
      'Sawhorses and badges across the road {at}. Somebody talked. The agent in front is eyeing your tarp.',
      'A federal man steps off the curb with a flashlight and a smile you don’t like. “Evening. What’s in the truck?”',
    ],
  },
  hijack: {
    title: ['HIJACKERS', 'ROAD PIRATES', 'A STICK-UP', 'AMBUSH'],
    kicker: ['A truck blocks the road', 'Somebody wants your load', 'Flat caps in the headlights', 'A rival crew, out of the dark'],
    body: [
      'A stolen milk truck slews across the road {at}. Three fellows in flat caps step out, cracking their knuckles.',
      'A rival crew waves you down with a lantern. “Nice cargo, friend. Be a shame if it got lost. Share some?”',
      'Two cars box you in on a back street {at}. A big man taps your window. He’d like to discuss your load.',
      'Somebody’s rolled a barrel into the road. Then the somebodies appear. They want your cargo, and they mean it.',
    ],
  },
  vale: {
    title: ['MR. VALE’S MEN', 'A FRIENDLY VISIT', 'COLLECTION DAY', 'VALE SENDS REGARDS'],
    kicker: ['Two big men in good suits', 'Mr. Vale is a patient man', 'Somebody’s leaning on your truck', 'The debt has come calling'],
    body: [
      'Two very large gentlemen in very good suits lean on your truck {at}. Mr. Vale sends his regards{debtNote}.',
      'A sedan pulls up beside you. The window rolls down. “Mr. Vale was wondering about his money{debtNote}.”',
      'They find you {at}, as they always do. “Nothing personal. Mr. Vale just likes his books balanced{debtNote}.”',
      'A man with no neck and a gentle voice blocks your way. “The boss is patient. Not that patient{debtNote}.”',
    ],
  },
  find: {
    title: ['A LUCKY FIND', 'FINDERS KEEPERS', 'ABANDONED CARGO', 'NOBODY’S LOOKING'],
    kicker: ['Somebody left in a hurry', 'Fortune smiles, for once', 'Under a tarp in an alley', 'Is that what you think it is?'],
    body: [
      'Behind a shuttered warehouse {at}: {n} {unit} of {g}, left by some careless crew. Nobody’s watching.',
      'A crew dumped their load {at} and ran. {N} {unit} of {g} sit in the gutter, free to a good home.',
      'Under a tarp in a dead-end alley: {n} {unit} of {g}. No name on it. Now there is — yours.',
      'A delivery boy with cold feet hands you {n} {unit} of {g}. “Take ’em, mister. I quit.”',
    ],
  },
  rumor: {
    title: ['A HOT TIP', 'WORD ON THE STREET', 'WHISPERS', 'OVERHEARD'],
    kicker: ['Somebody’s talking', 'For what it’s worth…', 'A tip, free of charge', 'Lean in close'],
    tail: ['Could be gold. Could be a setup.', 'Tips are cheap. So is talk.', 'Take it or leave it.', 'Rumors have been wrong before.'],
  },
  garage: {
    title: ['A GARAGE DEAL', 'BACK-ALLEY GARAGE', 'NO QUESTIONS ASKED', 'A MECHANIC’S OFFER'],
    kicker: ['Grease to the elbows', 'It fell off another truck', 'A deal, this once only', 'Cash only, and quick'],
    body: [
      'A mechanic {at} waves you into his garage. {UPG}, {price} cash, {off} off — no questions asked.',
      'A fellow in overalls has {UPG} going cheap: {price}. “Don’t ask where it came from.”',
      '“Got a deal for you, pal.” {UPG} for {price} — {off} under the usual. Tonight only.',
      'Behind a roll-up door {at}: {UPG}, priced to move at {price}. The mechanic just shrugs.',
    ],
  },
};
const CHOICES = {
  vale: ['pay', 'stall'], feds: ['run', 'bribe', 'dump'], hijack: ['hand', 'floor'],
  find: ['take'], rumor: ['noted'], garage: ['buy', 'pass'],
};
function choiceText(t, c, ctx) {
  const odds = pct(ctx.odds);
  switch (`${t}.${c}`) {
    case 'feds.run': return { label: 'RUN FOR IT', hint: `${odds} to lose them. Caught: fine + most cargo.` };
    case 'feds.bribe': return { label: 'BRIBE', hint: `Costs ${fmt$(ctx.bribe)}. Works 9 times in 10.` };
    case 'feds.dump': return { label: 'DUMP THE LOAD', hint: 'Lose all your cargo, but walk away free.' };
    case 'hijack.hand': return { label: 'HAND IT OVER', hint: `Give up ${pct(HIJACK.share * (ctx.keep || 1))} of your load. No trouble.` };
    case 'hijack.floor': return { label: 'FLOOR IT', hint: `${odds} to keep it all, else lose ${pct(HIJACK.share * 2 * (ctx.keep || 1))}.` };
    case 'vale.pay': return { label: 'PAY UP', hint: 'Pay him all the cash you can, right now.' };
    case 'vale.stall': return { label: 'STALL', hint: `50/50: he waits, or −${pct(EVENTS.vale.take)} cash and +10% debt.` };
    case 'find.take': return { label: 'LOAD IT UP', hint: 'Free cargo, as much as the truck can hold.' };
    case 'rumor.noted': return { label: 'NOTED', hint: 'It might be true. It might not.' };
    case 'garage.buy': return { label: 'BUY IT', hint: `Pay ${fmt$(ctx.price)} for the ${ctx.upgradeName}.` };
    case 'garage.pass': return { label: 'PASS', hint: 'Keep your cash. He’ll find another buyer.' };
    default: return { label: 'OK', hint: 'Carry on.' };
  }
}

/** ev + ctx → { title, kicker, body, choices: { id: { label, hint } } } for the event card. */
export function eventScene(ev, ctx = {}, r) {
  const t = ev && SCENES[ev.t] ? ev.t : 'rumor';
  const S = SCENES[t];
  const upg = UPGRADE_TEXT[ev && ev.id] || UPGRADE_TEXT.truck1;
  const c = {
    ...ctx,
    odds: ctx.odds == null ? FEDS.run : ctx.odds,
    bribe: ctx.bribe == null ? FEDS.bribeMin : ctx.bribe,
    price: ctx.price == null ? 0 : ctx.price,
    upgradeName: ctx.upgradeName || upg.name,
  };
  const g = G(ev && ev.good), d = D(ctx.dist);
  const v = {
    at: d.at, the: d.the, g: g.g, unit: (ev && ev.n === 1) ? g.one : g.unit, n: num(ev && ev.n), N: num(ev && ev.n),
    UPG: c.upgradeName, price: fmt$(c.price), off: pct(GARAGE_DISCOUNT),
    debtNote: ctx.debt > 0 ? ` — about the ${fmt$(ctx.debt)}` : '',
  };
  const title = pick(r, S.title);
  const kicker = pick(r, S.kicker);
  let body;
  if (t === 'rumor') {
    const line = rumorLine(ev, r);
    body = `${line} ${pick(r, S.tail)}`;
  } else if (t === 'feds') {
    const base = fit(r, S.body, v, 130);
    const tails = WEATHER_TAIL[ctx.weather] || WEATHER_TAIL.clear;
    body = `${base} ${pick(r, tails)}`;
  } else {
    body = fit(r, S.body, v, 180);
  }
  const ids = Array.isArray(ctx.choices) && ctx.choices.length ? ctx.choices : CHOICES[t];
  const choices = Object.fromEntries(ids.map(id => [id, choiceText(t, id, c)]));
  return { title, kicker, body, choices };
}

// ---------------------------------------------------------------- outcomes
function cargoList(lost, goodNames) {
  const rows = Object.entries(lost || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return 'nothing much';
  const one = ([g, n]) => `${num(n)} ${n === 1 ? G(g).one : G(g).unit} of ${String((goodNames && goodNames[g]) || G(g).name).toLowerCase()}`;
  if (rows.length === 1) return one(rows[0]);
  if (rows.length === 2) return `${one(rows[0])} and ${one(rows[1])}`;
  return `${one(rows[0])}, plus ${rows.length - 1} other goods`;
}
const OUT = {
  'feds.run.ok': {
    title: ['CLEAN GETAWAY', 'LOST THEM!', 'LONG GONE', 'NOT TONIGHT, BOYS'],
    body: [
      'A hard left, a harder right, and an alley they don’t know. The sedan sails past. Your cargo’s safe.',
      'You cut the lights and coast into a garage. The feds roar by. You let out a breath you didn’t know you held.',
      'Through a laundry line, across a lot, out the far side. The siren fades. Not bad, driver.',
      'They had you — then a streetcar didn’t. By the time it passes, you’re three blocks gone.',
    ],
  },
  'feds.run.caught': {
    title: ['PINCHED!', 'CAUGHT', 'END OF THE ROAD', 'DEAD END'],
    body: [
      'A dead-end street. A fine of {fine}, and the feds haul off {lost}.',
      'They box you in at the corner. You pay {fine} on the spot. They take {lost}.',
      'So close. The agent writes you up for {fine} and confiscates {lost}.',
      'Pinched. {fine} lighter, and the government is now the proud owner of {lost}.',
    ],
  },
  'feds.bribe.ok': {
    title: ['MONEY TALKS', 'A FRIEND IN BLUE', 'PALMS GREASED', 'NO HARM DONE'],
    body: [
      'An envelope with {bribe} changes hands. The agent suddenly remembers he’s late for dinner.',
      '{bribe} in a folded newspaper. “Must have the wrong truck,” the agent says. “Drive safe.”',
      'The agent counts {bribe}, tips his hat and looks the other way. Everybody has a price.',
      'For {bribe}, the feds agree your truck is full of hymnbooks. Off you go.',
    ],
  },
  'feds.bribe.caught': {
    title: ['AN HONEST MAN', 'BRIBE REFUSED', 'WRONG AGENT', 'NO DEAL'],
    body: [
      'Rotten luck: an honest agent. He keeps your {bribe} as “evidence” and seizes {lost}.',
      'He takes the {bribe} — then takes {lost} too. Some men can’t be bought. This one rents.',
      'The agent pockets {bribe} and seizes {lost} anyway. You can’t trust anybody these days.',
    ],
  },
  'feds.dump': {
    title: ['OVERBOARD', 'NOTHING TO SEE', 'CLEAN AS A WHISTLE', 'EMPTY TRUCK'],
    body: [
      'Out the back go {lost}. By the time they search the truck, it’s empty. “Have a nice night, officer.”',
      'You ditch {lost} in a storm drain. The feds find nothing but a very innocent driver.',
      'Gone: {lost}. The agent sniffs the air, frowns, and lets you go. Painful, but you’re free.',
      'A heartbreaking minute: {lost} into the river. The truck’s clean when they wave you over.',
    ],
  },
  'hijack.hand': {
    title: ['A TOLL PAID', 'SHARE AND SHARE ALIKE', 'LET IT GO', 'NO HARD FEELINGS'],
    body: [
      'You hand over {lost}. They tip their caps. “Pleasure doing business.” The road clears.',
      'Off go {lost}. It stings, but you keep your truck, your teeth and the rest of the load.',
      'They help themselves to {lost} and wave you on. Cheaper than getting roughed up.',
      'You give them {lost}, a nod and nothing else. Some nights you pay the toll.',
    ],
  },
  'hijack.floor.ok': {
    title: ['FLOORED IT!', 'RIGHT THROUGH', 'TOO FAST FOR THEM', 'SO LONG, SUCKERS'],
    body: [
      'You stomp the pedal. Flat caps scatter, a fender scrapes, and you’re through — every crate intact.',
      'The engine roars, the barricade wobbles, and you’re gone into the night. Not one bottle lost.',
      'Up the curb, past the truck and away. In the mirror, they’re shaking their fists. All yours.',
      'They didn’t expect you to go for it. Neither did you. The whole load’s still in the back.',
    ],
  },
  'hijack.floor.caught': {
    title: ['BOXED IN', 'NOT FAST ENOUGH', 'STALLED OUT', 'A ROUGH NIGHT'],
    body: [
      'The engine coughs at the worst moment. They pull you out and help themselves to {lost}.',
      'They were ready for that. You get roughed up a little, and they get {lost}.',
      'A second car cuts you off. When the dust clears, so has {lost}.',
      'Floored it — into a ditch. The crew empties your truck of {lost} and leaves you to dig out.',
    ],
  },
  'vale.pay': {
    title: ['PAID UP', 'SQUARED AWAY', 'VALE IS PLEASED', 'GOOD FAITH'],
    body: [
      'You hand over {paid}. The big men count it twice, nod once and leave. Mr. Vale will be pleased.',
      '{paid} goes into an envelope with Mr. Vale’s name on it. “See? Nobody needs to get upset.”',
      'You pay {paid}. One of them straightens your collar. “Mr. Vale appreciates a reliable man.”',
      '{paid} to Mr. Vale, with your compliments. They tip their hats and melt into the dark.',
    ],
  },
  'vale.pay.none': {
    title: ['EMPTY POCKETS', 'NOTHING TO GIVE', 'TOUGH LUCK'],
    body: [
      'You turn out your pockets. Lint. They exchange a look. “Mr. Vale will hear about this.”',
      'Not a cent to give. They sigh and leave. You get the feeling they’ll be back.',
      'You show them your empty wallet. “Next time,” one says. It doesn’t sound like a promise.',
    ],
  },
  'vale.stall.slide': {
    title: ['A REPRIEVE', 'LET IT SLIDE', 'BORROWED TIME', 'MR. VALE IS PATIENT'],
    body: [
      'You talk fast and smile wide. They glance at each other. “The boss says one more day.”',
      '“Tomorrow, I swear.” For reasons of his own, Mr. Vale lets it slide. This time.',
      'A long silence. Then: “Mr. Vale is in a generous mood.” They leave. You breathe again.',
      'You spin a fine tale about a big deal coming. They buy it. Mr. Vale will want to see it, though.',
    ],
  },
  'vale.stall.took': {
    title: ['LEANED ON', 'A LESSON IN MANNERS', 'VALE’S PATIENCE ENDS', 'COLLECTED'],
    body: [
      'They don’t buy it. They take {took} from your wallet, and Mr. Vale adds 10% to the debt for the trouble.',
      'Wrong answer. You’re leaned on, gently, and {took} lighter. The debt grows 10% as a lesson.',
      '“The boss doesn’t like excuses.” They help themselves to {took}, and the debt climbs 10%.',
      'They empty {took} from your pockets and smooth your lapels. Mr. Vale tacks on 10% interest.',
    ],
  },
  'find.got': {
    title: ['FINDERS KEEPERS', 'FREE CARGO', 'A LUCKY NIGHT', 'NOBODY SAW A THING'],
    body: [
      'You load {got} of {g} into the truck. Free goods, and nobody the wiser.',
      '{Got} of {g}, on the house. Lady Luck sends her regards.',
      'In the back they go: {got} of {g}. The best price is no price at all.',
      'You stack {got} of {g} under the tarp and whistle all the way home.',
    ],
  },
  'find.full': {
    title: ['NO ROOM', 'TRUCK’S FULL', 'SO CLOSE'],
    body: [
      'Your truck’s packed to the roof. You leave the {g} behind for some other lucky soul.',
      'Not an inch to spare in the back. You drive off, mourning the {g}.',
      'Full truck, free {g}, no room. Somewhere a rival is having a better night.',
    ],
  },
  'rumor.noted': {
    title: ['NOTED', 'FILED AWAY', 'FOOD FOR THOUGHT'],
    body: [
      'You tuck the tip away. Tomorrow will tell whether it was gold or a setup.',
      'Maybe it’s true. Maybe somebody wants you in the wrong place tomorrow.',
      'You file it under “maybe.” In this town, that’s where most things go.',
    ],
  },
  'garage.buy': {
    title: ['SOLD!', 'A FINE PURCHASE', 'NEW WHEELS', 'DEAL DONE'],
    body: [
      '{price} later, you own the {UPG}. The mechanic counts the cash and forgets your face.',
      'Bought: the {UPG}, for {price}. A handshake, and the garage door rolls down behind you.',
      'The {UPG} is yours for {price}. Best deal in town, and nobody needs to know.',
    ],
  },
  'garage.pass': {
    title: ['NO SALE', 'PASSED', 'MAYBE NEXT TIME'],
    body: [
      'You keep your cash. The mechanic shrugs and goes back to his crossword.',
      'Not tonight. You leave him wiping his hands on a rag, unbothered.',
      '“Suit yourself, pal.” The garage door rattles down. Your wallet stays fat.',
    ],
  },
};
function outKey(out) {
  const t = out && out.t;
  if (t === 'feds') {
    if (out.choice === 'dump') return 'feds.dump';
    if (out.choice === 'bribe') return out.ok ? 'feds.bribe.ok' : 'feds.bribe.caught';
    return out.ok ? 'feds.run.ok' : 'feds.run.caught';
  }
  if (t === 'hijack') return out.choice === 'hand' ? 'hijack.hand' : out.ok ? 'hijack.floor.ok' : 'hijack.floor.caught';
  if (t === 'vale') return out.choice === 'pay' ? (out.paid > 0 ? 'vale.pay' : 'vale.pay.none') : out.slide ? 'vale.stall.slide' : 'vale.stall.took';
  if (t === 'find') return out.full || !out.got ? 'find.full' : 'find.got';
  if (t === 'garage') return out.bought ? 'garage.buy' : 'garage.pass';
  return 'rumor.noted';
}
/** applyEvent's result → { title ≤ 22, body ≤ 140 }. ctx: { goodNames, upgradeNames } */
export function outcomeLine(out, ctx = {}, r) {
  const k = outKey(out || {});
  const O = OUT[k];
  const good = (out && (out.good || (out.ev && out.ev.good))) || 'shine';
  const g = String((ctx.goodNames && ctx.goodNames[good]) || G(good).name).toLowerCase();
  const got = out && out.got ? `${num(out.got)} ${out.got === 1 ? G(good).one : G(good).unit}` : '';
  const upgName = (ctx.upgradeNames && ctx.upgradeNames[out && out.bought]) || (UPGRADE_TEXT[out && out.bought] || {}).name || 'upgrade';
  const v = {
    fine: fmt$(out && out.fine), bribe: fmt$(out && out.bribe), lost: cargoList(out && out.lost, ctx.goodNames),
    paid: fmt$(out && out.paid), took: fmt$(out && out.took), price: fmt$(out && out.price),
    g, got, Got: cap(got), UPG: upgName,
  };
  return { title: pick(r, O.title), body: fit(r, O.body, v, 140) };
}

// ---------------------------------------------------------------- Mr. Vale (typed out line by line)
const VALE = {
  intro: [
    ['Sit down, kid. I lent you {debt} to start your little enterprise.', 'Interest runs daily. I’m in the Old Quarter when you want to pay.', 'Don’t make me come looking.'],
    ['A friendly loan at a friendly rate: {debt}, to be precise.', 'Bring it to my office in the Old Quarter. Sooner is cheaper.'],
    ['Every empire starts with a loan. Yours started with mine: {debt}.', 'My office is in the Old Quarter. The door is always open.', 'The interest never sleeps. Neither do I.'],
    ['You owe me {debt}. Today, a debt. Wait too long, a grudge.', 'Pay me at my office in the Old Quarter. Off you go.'],
  ],
  office: [
    ['Ah. My favorite debtor. You still owe me {debt}.', 'Pay what you can. The rest grows overnight, like ivy.'],
    ['Come in, come in. The ledger says {debt}.', 'I do so enjoy a visit that ends with an envelope.'],
    ['{debt}. I don’t have to look it up. I never forget a number.', 'A partial payment shows good character.'],
    ['Pull up a chair. Cigar? No? Then let’s talk about {debt}.', 'Interest is a patient creature. I am less so.', 'Pay what you can.'],
  ],
  cleared: [
    ['Paid in full. I’m almost sorry to see it.', 'Consider us square, kid. My door stays open.'],
    ['The ledger is clean. You surprise me.', 'From here on, every dollar you make is yours.'],
    ['Square. Not many walk out of this office square.', 'Go on. Make yourself a fortune.'],
    ['Well, well. Every cent, on the table.', 'You have my respect. Don’t waste it.', 'Now get out there and make some money.'],
  ],
  collect: [
    ['Mr. Vale sends his regards.', 'He’s been patient. Patience costs money.'],
    ['Don’t get up. This won’t take long.', 'The boss wants what’s his.'],
    ['Nice truck. Shame if it went missing.', 'Mr. Vale would like a word about his money.'],
    ['Evening. We were in the neighborhood.', 'Funny thing. So is your debt.', 'Let’s settle up.'],
  ],
  last: [
    ['The last morning, and you still owe me {debt}.', 'Whatever isn’t paid by tonight comes off your fortune.'],
    ['Dawn on the final day. The ledger says {debt}.', 'Settle up, or the town will know you couldn’t.'],
    ['{debt}, kid. Today is the day the music stops.', 'Make me proud. Or at least make me whole.'],
    ['Last call. You owe {debt}.', 'I’ll be at my desk in the Old Quarter, waiting.', 'I always am.'],
  ],
};
/** kind ∈ intro|office|cleared|collect|last → 2–3 short lines (≤ 70 chars each). ctx: { debt } */
export function valeLines(kind, ctx = {}, r) {
  const set = VALE[kind] || VALE.office;
  const v = { debt: fmt$(ctx.debt == null ? START_DEBT : ctx.debt) };
  return pick(r, set).map(l => fill(l, v));
}

// ---------------------------------------------------------------- the newspaper
const MAIN = {
  win: {
    head: ['{W} RUNS THE TOWN', '{W} IS THE TOAST OF THE CITY', 'BOOTLEG BARON {W} TAKES THE CROWN', '{W} CORNERS THE MARKET', 'RUMRUNNER {W} STRIKES IT RICH', '{W}: KING OF THE NIGHT'],
    deck: [
      'After {days} nights on the road, {W} ends with a fortune of {nw} — the biggest bankroll in the city.',
      'Rivals left in the dust as {W} closes the books on {nw}. {best}',
      'Police baffled, Mr. Vale impressed: {W} finishes on top with {nw} to the good.',
      '{W} rolls into dawn {nw} richer than the day Mr. Vale lent the money. {best}',
    ],
  },
  broke: {
    head: ['NOBODY GETS RICH; {W} LOSES LEAST', '{W} LEAST BROKE IN BROKE TOWN', 'HARD TIMES: {W} SCRAPES BY', '{W} OWES VALE THE LEAST'],
    deck: [
      'A grim season for rumrunners. {W} finishes on {nw}, which counts as winning this year.',
      'Every crew in town ends in the red. {W}, at {nw}, ends in it least.',
      'Mr. Vale collects from everyone. {W} gets off lightest, finishing on {nw}.',
      'Not a dollar made in the whole city, but {W} lost fewer of them: {nw}.',
    ],
  },
};
const ITEMS = {
  flee: {
    head: ['{N} FLEES TOWN OWING VALE {debt}', '{N} SKIPS TOWN ON THE MIDNIGHT TRAIN', 'WHERE IS {N}? VALE WANTS TO KNOW', '{N} LAST SEEN HEADED FOR CANADA', '{N} LEAVES TOWN IN A HURRY'],
    body: [
      'Neighbors report a packed suitcase and a hasty exit. Mr. Vale is owed {debt} and is said to be “disappointed.”',
      'A ticket bought under a false name, a truck left at the station. Mr. Vale’s ledger still reads {debt}.',
      'Last seen leaving with a hat pulled low. Fortune at the finish: {nw}. Mr. Vale’s men are asking around.',
      'The rent is unpaid, the truck abandoned and Mr. Vale is still owed {debt}. Sources expect a long vacation.',
    ],
  },
  tipster: {
    head: ['WHO TIPPED OFF THE FEDS? SOURCES NAME {N}', '{N} SINGS TO THE FEDS', 'ANONYMOUS TIP? NOT SO ANONYMOUS, {N}', 'STOOL PIGEON {N} EXPOSED', '{N} CALLS THE FEDS ON {T}'],
    body: [
      'Agents say a phone call on day {d} pointed them at {T}. The caller paid {cost} for the privilege.',
      'A well-placed tip on day {d} sent federal agents after {T}. Fingerprints on the phone booth say {N}. {more}',
      'Word is {N} spent {cost} making sure the feds knew where {T} would be. Some call it business. {T} calls it rude.',
      '{T} had company on day {d}, courtesy of a certain someone. Our sources point to {N}. {more}',
    ],
  },
  king: {
    head: ['{N}, KING OF {DIST}', '{N} NEVER LEAVES {DIST}', '{DIST} CLAIMS {N} FOR LIFE', '{N} RULES {DIST}', 'HOMEBODY {N} STAYS PUT'],
    body: [
      '{days} days, one district. {N} never once drove out of {the}, and ends on {nw}.',
      'Why wander? {N} spent every single day {at}, and the locals now set their watches by the truck. Final tally: {nw}.',
      'Not a mile traveled. {N} stayed {at} from first day to last and finished on {nw}.',
      'Some see the world. {N} saw {the}, every day, and closed the books on {nw}.',
    ],
  },
  leftover: {
    head: ['{N} LEFT HOLDING {units} CRATES', '{N} STUCK WITH UNSOLD CARGO', 'DAWN FINDS {N}’S TRUCK STILL FULL', '{N}: {units} CRATES, NO BUYERS'],
    body: [
      'Dawn broke on {units} pieces of unsold cargo in the back of {N}’s truck. Come morning, worth exactly nothing.',
      'Sell high, they say. {N} forgot the “sell” part: {units} units still on the truck when the season ended.',
      'Hindsight is a cruel bartender. {N} finished with {units} units unsold and a fortune of {nw}.',
      '{units} units of contraband, and not a buyer in sight at sunrise. {N} ends on {nw}.',
    ],
  },
  raided: {
    head: ['{N}: THE CITY’S MOST WANTED', 'FEDS CAN’T GET ENOUGH OF {N}', '{N} STOPPED {k} TIMES BY AGENTS', 'AGENTS ON FIRST-NAME TERMS WITH {N}'],
    body: [
      'Federal agents pulled {N} over {k} times this season. One reportedly asked about the family.',
      '{k} federal stops, and {N} has learned every agent’s name. Escaped {esc} of them.',
      'No rumrunner drew more federal attention: {k} stops in all. {N} got away from {esc}.',
      'The Prohibition Bureau has a whole drawer marked “{N}.” {k} stops this season and counting.',
    ],
  },
  caught: {
    head: ['{N} PINCHED {k} TIMES', 'FEDS NAB {N} AGAIN', '{N}’S BAD LUCK WITH THE LAW', 'GOVERNMENT THANKS {N} FOR CARGO'],
    body: [
      '{N} was caught red-handed {k} times. The federal warehouse is fuller for it.',
      'The fastest truck in town it was not. {N} got pinched {k} times and ends on {nw}.',
      'Agents seized cargo from {N} on {k} separate occasions. “A real pleasure,” one said.',
      '{k} times caught, {k} times fined. {N} may want to reconsider the getaway driving.',
    ],
  },
  fall: {
    head: ['{N}’S EMPIRE CRUMBLES', '{N} LOSES {drop} FROM THE TOP', 'HIGH TIMES OVER FOR {N}', 'WHAT GOES UP: THE FALL OF {N}'],
    body: [
      'Worth {peak} at the high-water mark, {N} ends on {nw}. Easy come, easy go.',
      'At one point {N} was sitting on {peak}. By dawn, {drop} of it had walked out the door.',
      'A dazzling rise to {peak}, then a long slide. {N} finishes {drop} below the peak.',
      'Friends recall {N} at {peak}, buying rounds. Today: {nw}, and buying nothing.',
    ],
  },
  cleared: {
    head: ['{N} SQUARES UP WITH VALE', '{N} PAYS VALE IN FULL', 'VALE TIPS HIS HAT TO {N}', 'DEBT-FREE {N} SLEEPS SOUNDLY'],
    body: [
      '{paid} handed over to Mr. Vale, every cent. {N} walks the streets debt-free with {nw}.',
      'Mr. Vale confirms the account is closed. {N} paid {paid} in all and ends on {nw}.',
      'Not a dollar owed in the Old Quarter: {N} paid {paid} to Mr. Vale and kept {nw}.',
      'The ledger is clean. {N} settled {paid} of debt, and the big men are all smiles.',
    ],
  },
  best: {
    head: ['{N}’S {GOOD} GAMBLE PAYS OFF', '{N} CLEANS UP ON {GOOD}', '{GOOD} MAKES {N} A BUNDLE', '{N} SELLS {GOOD} HIGH'],
    body: [
      '{units} {unit} of {g} sold {at} on day {d} for a {profit} profit. Not bad for one night.',
      'On day {d}, {N} unloaded {units} {unit} of {g} {at} and pocketed {profit} clear.',
      'The deal of the season: {g} {at}, day {d}. {N} walked away {profit} richer.',
      'Buy low, sell high: {N} turned {units} {unit} of {g} into {profit} profit on day {d}.',
    ],
  },
  finds: {
    head: ['{N} FINDS FORTUNE IN BACK ALLEYS', 'LADY LUCK SMILES ON {N}', '{N}: FINDERS KEEPERS', 'FREE CARGO FOLLOWS {N}'],
    body: [
      '{k} loads of abandoned cargo found and kept. {N} ends on {nw} and swears it’s all talent.',
      'Some crews buy their goods. {N} found {k} loads lying around and called it a bargain.',
      'Abandoned crates have a way of finding {N}: {k} lucky finds this season. Final tally: {nw}.',
      'Nobody knows how {N} keeps stumbling onto free cargo. {k} times! Ends on {nw}.',
    ],
  },
  bribes: {
    head: ['{N} GREASES EVERY PALM IN TOWN', '{N}: A FRIEND TO EVERY AGENT', '{N} PAYS THE LAW TO LOOK AWAY', '{N} BUYS OFF THE LAW'],
    body: [
      '{k} bribes this season. Several agents are reportedly shopping for new suits.',
      'When the feds come calling, {N} pays. {k} envelopes handed over; ends on {nw}.',
      'The Prohibition Bureau’s favorite donor: {N}, with {k} bribes paid.',
      '{N} never met a federal agent who couldn’t be reasoned with. {k} times, in fact.',
    ],
  },
  plain: {
    head: ['{N} KEEPS HEAD DOWN', '{N} FINISHES ON {nw}', 'QUIET SEASON FOR {N}', '{N} LIVES TO RUN ANOTHER DAY'],
    body: [
      'No scandals, no headlines, just {trades} trades and a fortune of {nw}. {N} likes it that way.',
      '{N} worked the city quietly and closes the season on {nw}. Mr. Vale has no complaints.',
      'A steady hand: {trades} deals made, no trouble worth printing. Final fortune: {nw}.',
      'Ask around about {N} and folks shrug. That’s the mark of a pro. Ends on {nw}.',
    ],
  },
};
const UNIQUE = new Set(['raided', 'caught', 'fall', 'finds', 'bribes']);

/** The end-of-game NEWSPAPER: { masthead, dateline, main: { head, deck }, items: [{ uid, head, body }], stats: [...] } */
export function headlines(story, names, game, r) {
  const days = (game && game.settings && game.settings.days) || 20;
  const final = (game && game.final) || Object.keys(story || {}).map((uid, i) => ({ uid, rank: i + 1, nw: story[uid].fortune }));
  const S = uid => story[uid] || { fortune: 0, debt: 0, visited: {}, tipsSent: [], raids: 0, caught: 0, finds: 0, bribes: 0, paid: 0, leftover: 0, trades: 0, peak: 0 };
  const nm = uid => String((names && names[uid]) || 'SOMEBODY').toUpperCase();
  const uids = final.map(f => f.uid);
  const leader = (key, min = 1) => {
    let best = null;
    for (const u of uids) { const v = key(S(u)); if (v >= min && (!best || v > best.v)) best = { u, v }; }
    return best;
  };
  const most = {
    raided: leader(s => s.raids, 2), caught: leader(s => s.caught, 1), fall: leader(s => (Number.isFinite(s.peak) ? s.peak - s.fortune : 0), 3000),
    finds: leader(s => s.finds, 2), bribes: leader(s => s.bribes, 2),
  };
  const facts = (uid, s) => {
    const out = [];
    if (s.fortune < 0 && s.debt > 0) out.push('flee');
    if (s.tipsSent && s.tipsSent.length) out.push('tipster');
    const places = Object.keys(s.visited || {});
    if (places.length === 1 && days > 1) out.push('king');
    for (const k of ['raided', 'caught', 'fall']) if (most[k] && most[k].u === uid) out.push(k);
    if (s.leftover >= 10) out.push('leftover');
    if (s.debt === 0 && s.paid > 0) out.push('cleared');
    if (s.best && s.best.profit > 0) out.push('best');
    for (const k of ['finds', 'bribes']) if (most[k] && most[k].u === uid) out.push(k);
    out.push('plain');
    return out;
  };
  const used = new Set();
  const items = final.map(({ uid, nw }) => {
    const s = S(uid);
    const type = facts(uid, s).find(t => !(UNIQUE.has(t) && used.has(t)));
    used.add(type);
    const tips = s.tipsSent || [];
    const t0 = tips[0] || {};
    const best = s.best || {};
    const place = Object.keys(s.visited || {})[0];
    const v = {
      N: nm(uid), nw: fmt$(nw), debt: fmt$(s.debt), days, the: D(place).the, at: D(place).at, DIST: D(place).name,
      T: nm(t0.to), d: t0.d != null ? t0.d : best.d, cost: fmt$(t0.cost),
      more: tips.length > 1 ? `And ${tips.length - 1} more call${tips.length > 2 ? 's' : ''} like it.` : 'The feds thank the public.',
      units: num(type === 'leftover' ? s.leftover : best.units), unit: best.units === 1 ? G(best.good).one : G(best.good).unit,
      g: G(best.good).g, GOOD: G(best.good).name, profit: fmt$(best.profit),
      k: num(type === 'raided' ? s.raids : type === 'caught' ? s.caught : type === 'finds' ? s.finds : s.bribes),
      esc: num((s.raids || 0) - (s.caught || 0)), peak: fmt$(s.peak), drop: fmt$((s.peak || 0) - s.fortune), paid: fmt$(s.paid), trades: num(s.trades),
    };
    if (type === 'best') { v.at = D(best.dist).at; v.d = best.d; }
    return { uid, type, head: fit(r, ITEMS[type].head, v, 40), body: fit(r, ITEMS[type].body, v, 150) };
  });

  // the main story: the winner
  const w = final[0] || { uid: null, nw: 0 };
  const ws = S(w.uid);
  const wb = ws.best && ws.best.profit > 0
    ? `Best haul: ${G(ws.best.good).g} ${D(ws.best.dist).at}, ${fmt$(ws.best.profit)} profit.`
    : 'A steady hand, start to finish.';
  const mv = { W: nm(w.uid), nw: fmt$(w.nw), days, best: wb };
  const M = w.nw >= 0 ? MAIN.win : MAIN.broke;
  const main = { head: fit(r, M.head, mv, 44), deck: fit(r, M.deck, mv, 120) };

  // the box scores
  const stats = [];
  const bestTrade = leader(s => (s.best ? s.best.profit : 0), 1);
  if (bestTrade) stats.push({ label: 'BEST TRADE', value: fmt$(bestTrade.v), uid: bestTrade.u });
  if (most.raided || leader(s => s.raids, 1)) { const x = most.raided || leader(s => s.raids, 1); stats.push({ label: 'MOST RAIDED', value: `${num(x.v)}×`, uid: x.u }); }
  const paid = leader(s => s.paid, 1);
  if (paid) stats.push({ label: 'MOST DEBT PAID', value: fmt$(paid.v), uid: paid.u });
  const bribes = leader(s => s.bribes, 1);
  if (bribes) stats.push({ label: 'MOST BRIBES', value: `${num(bribes.v)}`, uid: bribes.u });
  const tips = [];
  for (const u of uids) for (const t of S(u).tipsSent || []) tips.push({ from: u, ...t });
  if (tips.length) {
    tips.sort((a, b) => a.d - b.d);
    const list = tips.slice(0, 3).map(t => `${nm(t.from)} → ${nm(t.to)} (day ${t.d})`).join(' · ') + (tips.length > 3 ? ` · +${tips.length - 3} more` : '');
    stats.push({ label: 'TIP-OFFS', value: list });
  }
  const finds = leader(s => s.finds, 1);
  if (finds) stats.push({ label: 'LUCKY FINDS', value: `${num(finds.v)}`, uid: finds.u });
  const fillers = [
    () => { const x = leader(s => s.trades, 1); return x && { label: 'MOST TRADES', value: num(x.v), uid: x.u }; },
    () => { const x = leader(s => (Number.isFinite(s.peak) ? s.peak : -Infinity), -Infinity); return x && { label: 'HIGHEST PEAK', value: fmt$(x.v), uid: x.u }; },
    () => { const x = leader(s => s.caught, 1); return x && { label: 'MOST PINCHED', value: `${num(x.v)}×`, uid: x.u }; },
    () => w.uid && { label: 'TOP FORTUNE', value: fmt$(w.nw), uid: w.uid },
  ];
  for (const f of fillers) { if (stats.length >= 4) break; const x = f(); if (x) stats.push(x); }

  return {
    masthead: 'THE NEON GAZETTE',
    dateline: `${pick(r, ['MORNING EDITION', 'LATE CITY EDITION', 'EXTRA! EXTRA!', 'FINAL EDITION'])} · DAY ${days} · ${pick(r, ['FIVE CENTS', 'TWO CENTS', 'THREE CENTS'])}`,
    main, items, stats: stats.slice(0, 6),
  };
}
