// RUMRUNNER icons: inline SVG strings (goods, weather, districts), drawn with the deco gold line.
const S = (body, vb = '0 0 24 24') => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const GOOD_ICONS = {
  shine: S('<path d="M8 3h8v3l-1 1v2.5a4 4 0 0 1 .6 2.1V19a2 2 0 0 1-2 2h-3.2a2 2 0 0 1-2-2v-7.4a4 4 0 0 1 .6-2.1V7L8 6z"/><path d="M9.5 13h5"/><path d="M8 3h8"/>'),
  rum: S('<path d="M10 2h4v4.5l1.5 2V20a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V8.5L10 6.5z"/><path d="M9 12h6v4H9z"/><path d="M10 2h4"/>'),
  gin: S('<path d="M9 2h6v5l2 3v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V10l2-3z"/><path d="M8.5 12.5h7M8.5 16h7"/><circle cx="12" cy="5" r="0.6"/>'),
  whiskey: S('<path d="M6 7c0-2 2.7-3 6-3s6 1 6 3v10c0 2-2.7 3-6 3s-6-1-6-3z"/><path d="M6 10c0 1.6 2.7 2.5 6 2.5s6-.9 6-2.5M6 14c0 1.6 2.7 2.5 6 2.5s6-.9 6-2.5"/>'),
  cigars: S('<rect x="3" y="7" width="18" height="11" rx="1.5"/><path d="M3 11h18"/><path d="M7 14h2M11 14h2M15 14h2"/><path d="M8 7V5h8v2"/>'),
  champ: S('<path d="M10 2h4l.6 6a2.6 2.6 0 0 0 .4 1.3V19a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V9.3A2.6 2.6 0 0 0 9.4 8z"/><path d="M10 2h4"/><circle cx="18" cy="5" r="0.7"/><circle cx="20" cy="9" r="0.7"/><circle cx="17.5" cy="11.5" r="0.7"/>'),
};

export const WEATHER_ICONS = {
  clear: S('<path d="M15 3a7 7 0 1 0 6 10.5A8 8 0 0 1 15 3z"/><circle cx="6" cy="6" r="0.8"/><circle cx="9" cy="3.5" r="0.6"/>'),
  rain: S('<path d="M7 15a4.5 4.5 0 0 1 .6-9A6 6 0 0 1 19 8a3.5 3.5 0 0 1-.5 7z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>'),
  fog: S('<path d="M4 10h13M6 14h14M4 18h11"/><path d="M8 6h9"/>'),
  storm: S('<path d="M7 14a4.5 4.5 0 0 1 .6-9A6 6 0 0 1 19 7a3.5 3.5 0 0 1-.5 7z"/><path d="M13 12l-3 5h4l-3 5"/>'),
  dawn: S('<path d="M4 17h16"/><path d="M6.5 17a5.5 5.5 0 0 1 11 0"/><path d="M12 7V4M5 10l-2-2M19 10l2-2"/>'),
};

export const DISTRICT_ICONS = {
  docks: S('<circle cx="12" cy="4" r="1.5"/><path d="M12 5.5V21"/><path d="M5 12a7 7 0 0 0 14 0"/><path d="M8 11h8"/>'),
  uptown: S('<path d="M5 21V9l3-2v14M8 21h8M16 21V5l3 2v14M10 10h3M10 14h3M10 18h3"/>'),
  strip: S('<path d="M12 3l2.4 5 5.6.7-4 3.9.9 5.6L12 15.6 7.1 18.2l.9-5.6-4-3.9L9.6 8z"/>'),
  quarter: S('<path d="M12 3v3M9 6h6l-1 9h-4z"/><path d="M12 15v6M9 21h6"/><path d="M10.5 9h3"/>'),
  rail: S('<rect x="5" y="4" width="14" height="12" rx="2"/><path d="M5 10h14M9 16l-2 4M15 16l2 4M8 20h8"/><circle cx="9" cy="13" r="0.8"/><circle cx="15" cy="13" r="0.8"/>'),
  heights: S('<path d="M3 21l9-9 9 9"/><path d="M8 16v5h8v-5"/><path d="M10.5 21v-3h3v3"/><path d="M15 9V6h2v5"/>'),
};

// Mr. Vale: a backlit doorway, a fedora and shoulders in silhouette, the ember of his cigar
export const VALE_SVG = `<svg viewBox="0 0 54 64" aria-hidden="true"><defs>
  <linearGradient id="rrv-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c75e" stop-opacity="0.55"/><stop offset="0.6" stop-color="#8a4a2a" stop-opacity="0.35"/><stop offset="1" stop-color="#1a0a0e" stop-opacity="0.9"/></linearGradient>
  <radialGradient id="rrv-ember" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff0c0"/><stop offset="0.3" stop-color="#ff7a30"/><stop offset="1" stop-color="#ff7a30" stop-opacity="0"/></radialGradient>
  <linearGradient id="rrv-smoke" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<rect x="0" y="0" width="54" height="64" rx="8" fill="#140a0e"/>
<rect x="9" y="3" width="36" height="61" rx="2" fill="url(#rrv-door)"/>
<rect x="9" y="3" width="36" height="61" rx="2" fill="none" stroke="#f0c75e" stroke-opacity="0.35"/>
<path d="M4 64 C6 50 14 44 22 42 L32 42 C40 44 48 50 50 64 Z" fill="#0b0608"/>
<ellipse cx="27" cy="33" rx="7.5" ry="9" fill="#0b0608"/>
<path d="M19 24 C19 15 35 15 35 24 L35 26 L19 26 Z" fill="#0b0608"/>
<ellipse cx="27" cy="26.5" rx="13" ry="2.6" fill="#0b0608"/>
<path d="M33 37 L39 39" stroke="#0b0608" stroke-width="2" stroke-linecap="round"/>
<circle cx="39.5" cy="39" r="3.5" fill="url(#rrv-ember)"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite"/></circle>
<path d="M40 36 C42 32 38 30 40 26 C42 22 39 20 40 17" stroke="url(#rrv-smoke)" stroke-width="1.2" fill="none" stroke-linecap="round"/>
</svg>`;

export const svgEl = (str) => { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; };
