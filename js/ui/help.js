// "How to play" sheet: rules for every game, one tab each. Opened from the title screen,
// the lobby (game cards + options sheet) and the settings sheet (any screen, mid-game too).
import { gameArtSvg } from './game-art.js';
import { h } from './dom.js';
import { openSheet } from './sheet.js';
import { GAMES } from '../config.js';
import { lazyImport } from './lazy-import.js';

// Each game: a one-line goal, then short scannable sections. Keep them phone-sized.
const RULES = {
  rum: {
    goal: 'Fifteen, twenty or thirty days in a neon-lit Prohibition city. Buy contraband cheap, sell it dear, dodge the feds, pay Mr. Balboni. The biggest fortune at dawn wins.',
    sections: [
      ['YOUR FIRST DAY (QUICK START)', [
        'You wake up in the Old Quarter with a little cash, an empty truck and a debt to Mr. Balboni.',
        'MARKET: buy what’s cheap here (moonshine). TRAVEL: pick a district where it sells higher. Tap DONE.',
        'Next dawn you arrive; SELL, buy whatever is cheap there, drive on. Every few days, pay Balboni at his office in the Old Quarter.',
        'Prices in each district lean a certain way (listed under THE CITY). News and rumours tell you where the money is today and tomorrow.',
      ]],
      ['EVERY DAY', [
        'Dawn: the weather turns, and everyone’s truck arrives in the district they chose. Who’s in your district is your competition in that market.',
        'Events may find you first — federal agents, hijackers, a lucky crate, a rumour, Balboni’s men. One tap decides.',
        'Trade in your district’s market, pay Balboni (Old Quarter), use your stash, buy upgrades, tip off the feds.',
        'Pick where you drive tomorrow (secret until dawn) and tap DONE. The day ends early when everyone’s done; run out of time and what you’d set still counts — no destination means you stay put.',
      ]],
      ['THE CITY', [
        'THE DOCKS: cheap imports, fog, fed patrols. UPTOWN: rich buyers, watched. THE STRIP: big demand, wild prices.',
        'OLD QUARTER: Balboni’s office, cheap moonshine, gangland. RAIL YARD: bulk deals, hijackers. HARBOR HEIGHTS: the best luxury prices, a fee to get there.',
        'Prices swing every day; news spikes them (×3–5) or crashes them (down to a quarter). Heavy buying or selling by players moves tomorrow’s price in that district.',
      ]],
      ['THE MONEY', [
        'You start with a little cash, a truck for 100 units and a debt to Mr. Balboni that grows every night. Pay any amount at his office.',
        'Let the debt run too high or too late and his men collect. The stash keeps cash safe from fines (Old Quarter, or anywhere with the Hidden Warehouse).',
        'Feds: RUN (fog helps, an armored truck helps), BRIBE (a cut of your cargo’s value, nearly always works) or DUMP THE CARGO.',
        'Unsold cargo at the end is worth nothing. Final fortune = cash + stash − debt.',
      ]],
      ['UPGRADES & RIVALS', [
        'Bigger trucks (Rail Yard), armour, hidden compartments, a hidden warehouse, a crooked cop on the payroll — meaningful, never automatic.',
        'TIP OFF THE FEDS on a rival for a price: their raid odds jump tomorrow. They get a hint; your name only comes out in the morning paper.',
      ]],
    ],
  },
  stakes: {
    goal: 'Wager trivia in the back room. You see the category first — bet on what you know, then answer.',
    sections: [
      ['EACH ROUND', [
        'A card turns over: the category and how hard it is (MEDIUM or HARD).',
        'Bet chips in secret (15 s): at least 10 % of your stack, up to ALL IN. Nobody sees your bet until the showdown.',
        'Then the question (20 s): four answers, one tap. No time bonus — take a breath.',
        'Showdown: the right answer lights up and every bet turns over, one by one.',
      ]],
      ['THE MONEY', [
        'Everyone starts with 1,000 chips.',
        'Right on MEDIUM wins your bet. Right on HARD wins twice your bet. Wrong (or no answer) loses it.',
        'DOUBLE DOWN (rounds 4 and 8): every payout is doubled.',
        'Run out of time to bet? You bet the minimum.',
      ]],
      ['THE HOUSE', [
        'Hit zero and the house loans you 200 so you stay in (as often as you need).',
        'Loans come off your final total — you can’t win on borrowed money.',
      ]],
      ['ALL IN', [
        'After 10 rounds, the final: always HARD, bet up to everything you have.',
        'The showdown goes from last place to first. Most chips (minus loans) wins; a tie goes to whoever answered faster overall.',
      ]],
    ],
  },
  cipher: {
    goal: 'Everyone gets the same secret word. Crack it before your friends do.',
    sections: [
      ['HOW A ROUND WORKS', [
        'Type a real word with the keyboard and press ENTER.',
        'Each letter flips to show how close you are (see the colors below).',
        'You get 6 guesses. Words get longer as the rounds go on (5 → 7 letters).',
        'The round ends when everyone is done or the timer runs out.',
      ]],
      ['THE COLORS', 'legend'],
      ['WATCH YOUR RIVALS', [
        'The small boards at the top are your opponents, live — colors only, no letters.',
      ]],
      ['SCORING', [
        'Solve it: 100 points, +25 for each letter over 5.',
        'Speed bonus: up to +100 the faster you solve.',
        'Efficiency: +20 for every guess you didn’t need.',
        'Didn’t solve it? 0 for that round.',
      ]],
    ],
  },
  signal: {
    goal: 'A trivia battle royale. Answer fast, hit your rivals, be the last one standing.',
    sections: [
      ['THE BASICS', [
        'Everyone starts with the same HP (75 / 100 / 150) and 2 shields.',
        'A multiple-choice question appears — you have 15 seconds.',
        'Tap a rival’s card any time to make them your target (⌖).',
      ]],
      ['EACH QUESTION', [
        'Right answer: you strike your target for 10–30 damage. The faster you answer, the harder you hit.',
        'Wrong answer or no answer: you lose a shield. Out of shields? You take 10 damage instead.',
        'Damage goes up every 5 questions (×1.25, ×1.5 …), so things get tense fast.',
      ]],
      ['WINNING', [
        'Hit 0 HP and you’re out — you keep watching as a spectator.',
        'Last player standing wins. After 35 questions, the most HP wins.',
      ]],
      ['TIPS', [
        '“LOCKED ON YOU” shows how many players are targeting you.',
        'Speed matters more than you think — a fast hit does triple a slow one.',
      ]],
    ],
  },
  overclock: {
    goal: 'A gauntlet of 30-second brain challenges. Everyone gets the exact same puzzle.',
    sections: [
      ['THE CHALLENGES', [
        'UNSCRAMBLE — tap the letters in order to rebuild the word.',
        'MEMORY SEQUENCE — watch the nodes light up, then repeat the pattern.',
        'ODD ONE OUT — find the one symbol that’s different, three grids in a row.',
        'QUICK MATH — four quick calculations, normal order of operations.',
        'PATTERN LOCK — type the next number in each sequence.',
        'TRIVIA LIGHTNING — three fast multiple-choice questions.',
        'COLOR CLASH — tap the color of the TEXT, not the color the word spells.',
        'SIGNAL LOCK — wait for the flash, then tap as fast as you can. Too early is a miss.',
        'QUICK COUNT — shapes flash, then vanish. How many of one kind? Off by one earns half.',
        'TRUE OR FALSE — rapid math and facts. Wrong answers cost points.',
        'TIMELINE — tap four items into order (oldest → newest, smallest → biggest…).',
        'CLOSEST CALL — estimate a number. Closer = more points; the closest player gets +60.',
        'REWIRE — rotate tiles to route power from the source to the core. Two circuits.',
        'MISSING LINK — three words share one hidden word (COTTAGE · SWISS · CAKE → CHEESE). Two puzzles.',
        'SPELLCHECK — four spellings, one is right. Five words, one tap each.',
        'COMPASS — follow the turns in your head, then tap the way you face. Five rounds, each longer.',
        'SORT IT — swipe each card to the side it belongs on. They come faster and faster.',
        'HIGHER OR LOWER — one number is shown: is the hidden one HIGHER or LOWER? One wrong call ends your streak.',
        'DUMB LUCK — a horse race: pick one of six horses before the gate closes. Back the winner and get paid — 2-1 pays 60, 12-1 pays 260. Two or more players only.',
      ]],
      ['SCORING', [
        'Up to 100 points for accuracy (partial credit counts).',
        'Signal Lock is pure speed: faster reactions score more.',
        'Closest Call has no speed bonus — the +60 goes to whoever guessed closest.',
        'Sort It: a wrong or missed card costs half a point; 10 net right already makes 100.',
        'Compass: the speed bonus only counts your answering time, not the turns playing out.',
        'Get everything right and earn up to +60 for speed.',
        'Dumb Luck is pure chance with honest odds: every horse pays the same on average — the long shots just pay more, less often.',
        'The final challenge is worth DOUBLE.',
      ]],
      ['GOOD TO KNOW', [
        'Each challenge type explains itself the first time it shows up.',
        'No challenge type repeats within a match (Marathon: at most twice, never back to back).',
        'Quick mode is 6 challenges, Standard 12, Marathon 24.',
        'The leaderboard updates between every challenge.',
      ]],
    ],
  },
  bluff: {
    goal: 'Fool your friends with fake answers — and spot the truth hiding among the lies.',
    sections: [
      ['1 · WRITE A LIE (60 s)', [
        'A strange-but-true fact appears with a blank.',
        'Make up a fake answer believable enough to fool everyone.',
        'If you accidentally type the real answer, you’ll be asked to try another lie.',
      ]],
      ['2 · FIND THE TRUTH (30 s)', [
        'Everyone’s lies and the real answer are shuffled together.',
        'Tap the one you think is true. You can’t pick your own lie.',
        'Tap ♥ on the lie you found funniest.',
      ]],
      ['3 · THE REVEAL', [
        'Each lie is unmasked: who fell for it, then who wrote it.',
        'The real answer comes last — TRUTH VERIFIED.',
      ]],
      ['SCORING', [
        'Find the truth: 1,000 points.',
        'Every player fooled by your lie: 500 points.',
        'Every ♥ your lie gets: 100 points.',
        'The final round is worth TRIPLE.',
      ]],
    ],
  },
};

RULES.agent = {
  goal: 'Everyone gets the same secret word — except the Double Agent, who only knows the category. Find the leak. 4–8 players.',
  sections: [
    ['1 · YOUR CLASSIFIED FILE', [
      'Press and hold your file to read it; let go and it hides again.',
      'You see the secret word — or YOU ARE THE DOUBLE AGENT and only the category.',
      'Tap READY when you have it.',
    ]],
    ['2 · CLUES', [
      'One at a time, everyone types ONE word linked to the secret word.',
      'Too obvious and the agent learns the word. Too vague and you look like the agent.',
      'You can’t say the word itself (or a word containing it), or repeat a clue. Run out of time and your clue is — NO SIGNAL —.',
    ]],
    ['3 · DEBATE & VOTE', [
      'REMOTE: argue it out in the debate chat. SAME ROOM: talk it out loud.',
      'Tap a player to pin them as suspicious — everyone sees your pin.',
      'Then vote for the agent (not yourself). Most votes is accused; a tie means the agent slips away.',
    ]],
    ['4 · THE UNMASKING', [
      'The accused is revealed: INNOCENT, or DOUBLE AGENT.',
      'A caught agent gets 20 seconds to name the secret word and steal the round.',
    ]],
    ['SCORING', [
      'Agent escapes: +200. Caught, but names the word: +150.',
      'Agent caught and misses: every innocent player +100.',
      'Every innocent who voted for the agent: +50 more.',
      'Each round has a new word and a new agent. Most points after the last round wins.',
    ]],
  ],
};

RULES.prism = {
  goal: 'A falling-block game set to music. Everyone gets the same pieces in the same order. 1–8 players.',
  // (PD-2: three short lines — the owner's "no walls of text")
  sections: [
    ['THE MODES', [
      'BATTLE — clear lines to attack your friends. Junk you’re sent rises from the bottom; clear lines to break it. Last one standing wins.',
      'SCORE RUSH — no attacks: one song, highest score wins. Solo too.',
      'SURVIVAL — junk rises for everyone, faster and faster. Last one standing wins; solo, last as long as you can.',
    ]],
    ['CONTROLS', [
      'Drag to move · tap a side to rotate · swipe up to hold · drag down to drop faster.',
      'SLAM drops the piece straight down (☰ → Settings moves it LEFT or switches to BUTTONS).',
    ]],
  ],
};

// HE3 — HOLD'EM: ONE short screen in plain words (the owner: no walls of text) + the rankings sheet a tap away
RULES.holdem = {
  goal: 'Texas Hold’em with play chips. You get two cards; five more land in the middle for everyone. The best five-card hand wins the pot — or the last player who didn’t fold. 2–8 players.',
  sections: [
    ['HOW A HAND GOES', [
      'Two players post the blinds, then everyone bets before the flop, after the flop (3 cards), after the turn (1) and after the river (1).',
      'On your turn: FOLD (give up the hand), CHECK or CALL (match the bet), or RAISE. The quick buttons bet a real amount in one tap.',
      'You get 20 seconds, then a 30-second time bank. If time runs out you check — or fold when there’s a bet to call.',
      'Not your turn yet? CHECK / FOLD or CALL ANY acts for you the moment it comes round.',
      'ALL IN = every chip you have. If someone is all in for less, the extra chips go into a SIDE POT they can’t win.',
    ]],
    ['THE MODES', [
      'TOURNAMENT — everyone starts even and the blinds climb; run out of chips and you’re out. Last one with chips wins.',
      'CASH — fixed blinds; REBUY 1,000 when you hit zero; LEAVE whenever you like (mid-hand: after it). The host’s END SESSION shows the ledger — who’s up, who’s down.',
      'Miss two turns in a row and you’re AWAY — tap I’M BACK (in CASH: SIT BACK IN) to play again.',
    ]],
    ['WHAT BEATS WHAT', 'holdem-rankings'],
  ],
};

RULES.gridlock = {
  goal: 'A fleet battle on a holographic war table. Hide your ships, call your shots, sink everyone else. The last fleet standing wins. 2–8 players.',
  sections: [
    ['DEPLOY (60 s)', [
      'Drag each ship from the tray onto your grid; tap a placed ship to turn it. Ships can touch but never overlap.',
      'AUTO-PLACE fills the rest for you. READY locks your fleet in. When the timer ends, anything unplaced is placed for you.',
      '10×10 with 5 ships for 2–3 players; 8×8 with 4 ships for 4 or more.',
    ]],
    ['CLASSIC (TURNS)', [
      'Players shoot in turn, one shot each. Pick an opponent (tap their chip or their board), tap a cell, then FIRE to confirm.',
      'Take too long and a shot is fired for you. Everyone watches every shot land.',
    ]],
    ['BATTLE ROYALE (EVERYONE AT ONCE)', [
      'Each round everyone secretly picks a target and a cell and LOCKS IN. All shots fire together in one cinematic volley.',
      'When someone locks onto your board you get a TARGET LOCK warning: who, never where.',
      'Points: 10 a hit, 30 a sink, 50 an elimination. With three or more fleets the points leader wears a BOUNTY — hits and sinks on them pay 1.5×.',
      'After 25 rounds the fleet with the most cells afloat wins (points break ties).',
    ]],
    ['SALVO', [
      'Simultaneous rounds like Battle Royale, but you get ONE SHOT PER SHIP YOU STILL HAVE AFLOAT. Lose ships and you lose firepower.',
      'Set a marker on each cell you want to hit, on any boards, then LOCK IN. Tap a marker to lift it. Two markers can’t share a cell.',
      'Every shot lands one by one in the volley. With two players this is classic Salvo, played at once.',
    ]],
    ['ARCADE (ABILITY CARDS)', [
      'Battle Royale plus a hand of ability cards: two to start, one more for every ship you sink, three at most.',
      'Each round you fire a normal shot OR play one card. Tap a card to arm it, aim it on the board, LOCK IN (or CANCEL to put it back).',
      'SONAR PING: pick a 3×3 on an enemy board and privately learn how many ship cells are in it. CLUSTER SHOT: hit a 2×2 at once. TORPEDO: pick a row or column and a direction; it hits the first ship in its path or runs off the edge.',
      'EMP SHIELD: protect a 3×3 of your own board this round — shots landing there are BLOCKED. RELOCATE: drag one undamaged ship to a new spot (nobody sees where). DOUBLE TAP: two normal shots this round.',
      'Shields and relocates resolve first, then every attack together.',
    ]],
    ['HITS, SINKS, ELIMINATIONS', [
      'Every hit and miss is public on every board, but nobody sees a ship until it is sunk.',
      'Hitting a ship’s last cell sinks it and reveals it. Lose every ship and you are out — then spectate and CALL THE WINNER within 10 seconds for game-night points.',
    ]],
  ],
};

RULES.slip = {
  goal: 'A survival ride: everyone rides the same course (new every match) at the same time. Calm at first, then faster and harder. The last rider still riding wins. 2–8 players.',
  sections: [
    ['ONE THUMB', [
      'HOLD to dive: you press into the ground and pick up speed on the downhills.',
      'RELEASE to fly: let go near the top of a hill and you launch off it.',
      'In the air, TAP for a full flip (tap again for another). HOLD in the air to come down faster.',
      'Land level with the slope: a clean landing after flips gives a speed boost, and flips in a row build a combo.',
      'Land badly and you crash. A plain jump with no flips always lands clean.',
    ]],
    ['HAZARDS (EACH ONE IS SHOWN BEFORE IT ARRIVES)', [
      'GAPS: you need speed — dive down the slope before them.',
      'LASER GATES: jump through the opening. Later on, the low beam blinks.',
      'LOW CEILINGS: stay low; the electric line above you zaps you.',
      'CRUMBLING GROUND: keep moving, it falls away behind you.',
      'GRAVITY FLIP: the world turns over for a few seconds and you ride the ceiling.',
      'BOOST RINGS: fly through them for speed.',
    ]],
    ['LIVES', [
      'The host picks 1, 2 or 3 lives (2 by default). A crash rewinds you a little and you ride on, shimmering and safe for 2 seconds.',
      'Out of lives = out. If the last riders crash at the same moment, the one who got farther wins.',
      'After about 6 minutes: SUDDEN DEATH — faster and denser until someone wins. At 9 minutes the farthest rider wins.',
    ]],
    ['WHILE YOU WATCH', [
      'Out? Follow any rider (‹ ›) and call the winner within 10 seconds — a right call earns game-night points.',
      'Pick your ride (HOVERBOARD or LIGHT-CYCLE) and trail before the start. They handle exactly the same.',
      'Landscape gives the widest view, but everyone sees the same distance ahead.',
    ]],
  ],
};

RULES.pulse = {
  goal: 'A rhythm race down a neon highway. Everyone plays the same song at the same moment — hit the notes on the beat.',
  sections: [
    ['HOW TO PLAY', [
      'Notes ride the three lanes toward you. Tap a lane the moment its note crosses the glowing line.',
      'Two notes side by side (Hard): tap both lanes together.',
      'The first time on a new phone, a 10-second “tap along” check syncs your audio. Switched headphones? Recalibrate in ⚙ settings.',
    ]],
    ['TIMING', [
      'PERFECT within 45 ms, GREAT 90 ms, GOOD 135 ms — later than that is a MISS.',
      'Random taps with no note nearby cost a few points.',
    ]],
    ['SCORING', [
      'PERFECT 100 · GREAT 70 · GOOD 40 points, times your combo multiplier.',
      'Every 10 notes in a row raises the multiplier, up to ×4. A miss resets it.',
    ]],
    ['ECHO BONUS', [
      'After each song: the game plays a short rhythm on the lanes. Listen, then play it back from memory.',
      'Three rounds, each one longer. Right lane + right timing = points.',
    ]],
  ],
};

RULES.golf = {
  goal: 'Neon mini golf: everyone plays the same hole at the same time. Fewest strokes over the course wins.',
  sections: [
    ['HOW TO PUTT', [
      'Touch your ball and drag back, like a slingshot. The dotted line shows where it goes; the ring shows the power.',
      'Let go to putt. Drag back onto the ball to cancel.',
      'Drag anywhere else to look around; pinch to zoom. The camera snaps back when you aim.',
    ]],
    ['THE RULES', [
      'At most 6 strokes per hole. Not in by then = 7.',
      'Off the edge: +1 stroke, and you’re back where you putted from.',
      'Once more than half the players are in the cup, everyone else gets 30 seconds.',
      'The other balls are ghosts: you see them, but they never touch yours.',
    ]],
    ['POWER-UPS (ZONE 2+)', [
      'Roll over one to pick it up. You hold one at a time; tap it to arm it for your next shot.',
      'GHOST: through walls (not over the edge). STICKY: stops dead at the first wall. MAGNET: the cup pulls the ball in.',
    ]],
    ['SABOTAGE', [
      'Birdie or better, or the best score on a hole, earns one sabotage on the next hole.',
      'FOG, WOBBLE (their aim drifts) or SHAKE. It lasts until their next shot ends (8 seconds at most).',
    ]],
    ['YOUR BALL', [
      'Pick a color, finish and trail from the lobby or the ball button during a hole. It’s saved on your phone.',
    ]],
  ],
};

const LEGEND = [
  ['2', 'A', 'Right letter, right spot'],
  ['1', 'B', 'In the word, wrong spot'],
  ['0', 'C', 'Not in the word'],
];

const TAB = { holdem: 'HE', rum: 'RR', stakes: 'HS', gridlock: 'GL', slip: 'SS', prism: 'PD', cipher: 'CB', signal: 'LS', bluff: 'NB', overclock: 'OC', pulse: 'PU', golf: 'NP', agent: 'DA' };

let sheet = null;

function body(id) {
  const r = RULES[id];
  return [
    h('p.help-goal', r.goal),
    ...r.sections.map(([title, items]) => h('section.help-section',
      h('h3.help-h', title),
      items === 'legend'
        ? h('ul.help-legend', LEGEND.map(([s, ch, label]) => h('li', h('span.help-tile', { dataset: { s } }, ch), h('span', label))))
        : items === 'holdem-rankings'
          // (HE3 — the 10 hands best → worst, each with a tiny example: the cartridge's own sheet, loaded on the tap)
          ? h('button.btn.btn-ghost.btn-sm.help-more', { type: 'button', onclick: () => lazyImport(import('../games/holdem/rankings.js'), '../games/holdem/rankings.js').then(m => m.openRankings()).catch(() => {}) }, 'SEE THE HAND RANKINGS')
          : h('ul.help-list', items.map(t => h('li', t))))),
  ];
}

export function openHelp(gameId) {
  closeHelp();
  // (WINDOWS: only the PLAYABLE games' tabs — + a hidden game's own, when its match is the one on screen (the in-game menu))
  const first = (GAMES.find(g => g.playable) || GAMES[0]).id;
  let current = gameId && RULES[gameId] ? gameId : first;
  const content = h('div.help-body');
  const tabs = h('div.help-tabs', { role: 'tablist' });
  const name = h('small.help-name');
  const show = id => {
    current = id;
    const g = GAMES.find(x => x.id === id);
    sheet.el.dataset.theme = g.theme;
    name.textContent = g.name;
    [...tabs.children].forEach(b => b.setAttribute('aria-selected', String(b.dataset.id === id)));
    content.replaceChildren(...body(id));
    content.scrollTop = 0;
  };
  for (const g of GAMES.filter(x => x.playable || x.id === current)) {
    tabs.append(h('button.help-tab', { type: 'button', role: 'tab', dataset: { id: g.id, theme: g.theme }, onclick: () => show(g.id), 'aria-label': g.name, title: g.name }, gameArtSvg(g.id) || TAB[g.id]));
  }
  // (SHELL 2.0 A: THE SHEET — ui/sheet.js; the game's name is the sheet's small line under HOW TO PLAY)
  sheet = openSheet({ title: 'HOW TO PLAY', kicker: ' ', cls: 'help-sheet', label: 'How to play', body: [tabs, content], onClose: () => { sheet = null; document.body.classList.remove('help-open'); } });
  const kick = sheet.head.querySelector('.sh-t small');
  name.remove(); if (kick) kick.replaceWith(name);
  document.body.classList.add('help-open');
  show(current);
}

export function closeHelp() { if (sheet) sheet.close(); }
