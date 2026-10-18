// HIGH STAKES category emblems: line icons on a 48 grid, drawn in currentColor (gold foil on the cards).
const svg = body => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  science: svg('<ellipse cx="24" cy="24" rx="19" ry="7.5"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(-60 24 24)"/><circle cx="24" cy="24" r="3" fill="currentColor"/>'),
  history: svg('<path d="M8 40h32M10 36h28M12 36V18M20 36V18M28 36V18M36 36V18M8 18h32L24 7z"/><path d="M8 14.5h32" opacity=".5"/>'),
  geography: svg('<circle cx="24" cy="24" r="17"/><path d="M7 24h34M24 7c-7 7-7 27 0 34M24 7c7 7 7 27 0 34M10 15h28M10 33h28"/>'),
  film: svg('<rect x="7" y="17" width="34" height="23" rx="2"/><path d="M7 17l3-8 31 0-3 8M15 9l-3 8M23 9l-3 8M31 9l-3 8"/><circle cx="24" cy="28.5" r="5"/>'),
  music: svg('<path d="M18 35V11l20-4v24"/><circle cx="13" cy="35" r="5"/><circle cx="33" cy="31" r="5"/><path d="M18 17l20-4"/>'),
  sports: svg('<path d="M15 8h18v8a9 9 0 0 1-18 0z"/><path d="M15 11H9a6 6 0 0 0 6 7M33 11h6a6 6 0 0 1-6 7M24 25v7M17 40h14M19 32h10l2 8H17z"/>'),
  arts: svg('<path d="M38 8c-12 3-20 13-23 26l-3 6 6-3c13-3 23-11 26-23z"/><path d="M15 34l-4-4M24 25l-6-6M30 18l-4-4"/>'),
  tech: svg('<rect x="13" y="13" width="22" height="22" rx="2.5"/><rect x="19" y="19" width="10" height="10" rx="1"/><path d="M18 13V7M24 13V7M30 13V7M18 41v-6M24 41v-6M30 41v-6M13 18H7M13 24H7M13 30H7M41 18h-6M41 24h-6M41 30h-6"/>'),
  nature: svg('<path d="M24 42V22M24 30c-8 0-14-5-14-15 9 0 14 6 14 15zM24 25c0-9 6-16 15-16 0 10-6 16-15 16z"/>'),
  myth: svg('<path d="M24 42V12M12 10v6a12 12 0 0 0 24 0v-6M24 6l-3 6h6zM12 10l-3 5M12 10l3 5M36 10l-3 5M36 10l3 5M19 42h10"/>'),
  general: svg('<path d="M24 6l5.3 11 12.1 1.6-8.8 8.4 2.2 12L24 33.3 13.2 39l2.2-12-8.8-8.4L18.7 17z"/>'),
};
