// "How to play" sheet: rules for every game, one tab each. Opened from the title screen,
// the lobby (game cards + options sheet) and the settings sheet (any screen, mid-game too).
import { h } from './dom.js';
import { GAMES } from '../config.js';

// Each game: a one-line goal, then short scannable sections. Keep them phone-sized.
const RULES = {
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
      ]],
      ['SCORING', [
        'Up to 100 points for accuracy (partial credit counts).',
        'Get everything right and earn up to +60 for speed.',
        'The final challenge is worth DOUBLE.',
      ]],
      ['GOOD TO KNOW', [
        'Each challenge type explains itself the first time it shows up.',
        'Standard mode is 12 challenges; Marathon is 24.',
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

const LEGEND = [
  ['2', 'A', 'Right letter, right spot'],
  ['1', 'B', 'In the word, wrong spot'],
  ['0', 'C', 'Not in the word'],
];

const TAB = { cipher: 'CB', signal: 'LS', bluff: 'NB', overclock: 'OC' };

let sheet = null;

function body(id) {
  const r = RULES[id];
  return [
    h('p.help-goal', r.goal),
    ...r.sections.map(([title, items]) => h('section.help-section',
      h('h3.help-h', title),
      items === 'legend'
        ? h('ul.help-legend', LEGEND.map(([s, ch, label]) => h('li', h('span.help-tile', { dataset: { s } }, ch), h('span', label))))
        : h('ul.help-list', items.map(t => h('li', t))))),
  ];
}

export function openHelp(gameId = 'cipher') {
  closeHelp();
  let current = RULES[gameId] ? gameId : 'cipher';
  const content = h('div.help-body');
  const tabs = h('div.help-tabs', { role: 'tablist' });
  const name = h('h2.sheet-title');
  const show = id => {
    current = id;
    const g = GAMES.find(x => x.id === id);
    sheet.dataset.theme = g.theme;
    name.textContent = g.name;
    [...tabs.children].forEach(b => b.setAttribute('aria-selected', String(b.dataset.id === id)));
    content.replaceChildren(...body(id));
    content.scrollTop = 0;
  };
  for (const g of GAMES) {
    tabs.append(h('button.help-tab', { type: 'button', role: 'tab', dataset: { id: g.id }, onclick: () => show(g.id), 'aria-label': g.name }, TAB[g.id]));
  }
  sheet = h('div.modal.help-modal', { onclick: e => { if (e.target === sheet) closeHelp(); } },
    h('div.sheet.help', { role: 'dialog', 'aria-label': 'How to play' },
      h('div.sheet-grip'),
      h('div.set-head', h('div', h('div.sheet-kicker', 'HOW TO PLAY'), name),
        h('button.icon-btn', { type: 'button', 'aria-label': 'Close', onclick: closeHelp }, '×')),
      tabs,
      content,
      h('button.btn.btn-primary.btn-block', { type: 'button', onclick: closeHelp }, h('span', 'GOT IT'))));
  document.body.append(sheet);
  show(current);
}

export function closeHelp() {
  if (!sheet) return;
  const s = sheet;
  sheet = null;
  s.classList.add('out');
  setTimeout(() => s.remove(), 260);
}
