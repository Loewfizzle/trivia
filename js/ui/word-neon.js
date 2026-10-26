// CITY 2.0 — SP3: "SPEAKEASY" IN WHITE NEON (the owner, Oct 26: today's word is DOM text; build it as real white neon on the NEON logo's
// tube look). Single-stroke tube letterforms (rounded bends, tiny electrodes), squarish like the display face, at the word's
// own spacing: EACH character of the word's DOM stays (invisible — the layout, the screen reader, the dark halo's measure, the race's
// letter-by-letter writer and the beat punch keep working unchanged) and carries its tube letter as an inline SVG (vector: crisp at any
// dpr; its blur in the letter's own units, so it never scales). Layers: the glass (milky white phosphor glass by day — it reads unlit), a
// soft white glow, the body, the white-hot core, the glass highlight, the electrode caps. A cool white with a hint of warmth (it
// sits with the pink), calmer than NEON. The side rules + their diamonds: thin tubes (title.css .nd-wn::before / ::after).

/** the letters in a 12 × 10 box (y down), one or two strokes each; ends: the electrodes */
export const WORD_LETTERS = {
  S: { d: 'M11 1.3 Q11 0 9.7 0 H2.3 Q1 0 1 1.3 V3.7 Q1 5 2.3 5 H9.7 Q11 5 11 6.3 V8.7 Q11 10 9.7 10 H2.3 Q1 10 1 8.7', ends: [[11, 1.3], [1, 8.7]], clip: [6, 10] },
  P: { d: 'M1 10 V1.3 Q1 0 2.3 0 H9.7 Q11 0 11 1.3 V3.9 Q11 5.2 9.7 5.2 H1.2', ends: [[1, 10], [1.2, 5.2]], clip: [6, 0] },
  E: { d: 'M11 0 H2.3 Q1 0 1 1.3 V8.7 Q1 10 2.3 10 H11 M1.6 5 H8.8', ends: [[11, 0], [11, 10], [1.6, 5], [8.8, 5]], clip: [1, 3] },
  A: { d: 'M1 10 V2.6 Q1 0 3.6 0 H8.4 Q11 0 11 2.6 V10 M1.6 6 H10.4', ends: [[1, 10], [11, 10], [1.6, 6], [10.4, 6]], clip: [6, 0] },
  K: { d: 'M1 0 V10 M10.4 0.2 L4 5 H1.6 M4.8 5.4 L10.6 9.8', ends: [[1, 0], [1, 10], [10.4, 0.2], [1.6, 5], [4.8, 5.4], [10.6, 9.8]], clip: [1, 7.5] },
  Y: { d: 'M1 0 V2.6 Q1 5 3.6 5 H8.4 Q11 5 11 2.6 V0 M6 5.4 V10', ends: [[1, 0], [11, 0], [6, 5.4], [6, 10]], clip: [6, 8] },
};
const VB = '-1.8 -1.8 15.6 13.6';
/** the tube's widths (letter units): the glass, the glow, the body, the core, the highlight */
export const WORD_TUBE = Object.freeze({ glass: 2.15, glow: 3.1, body: 1.62, core: 0.72, hi: 0.3 });

/** the shared defs (one per document): the soft glow's blur, in the letter's own units */
export const wordNeonDefs = () => `<svg class="wn-defs" width="0" height="0" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><defs>
  <filter id="wn-b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.05"/></filter>
  <filter id="wn-b2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
</defs></svg>`;

/** one letter's tube (kind: 'lit' — the sign's letters; 'blaze' — the race's / the beat punch's light alone) */
export function wordLetterSvg(ch, kind = 'lit') {
  const L = WORD_LETTERS[ch];
  if (!L) return '';
  const T = WORD_TUBE;
  if (kind === 'blaze') return `<svg class="wn-l wn-blaze" viewBox="${VB}" aria-hidden="true" focusable="false"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path class="wn-bw" d="${L.d}" stroke-width="${T.glow * 1.6}" filter="url(#wn-b2)"/><path class="wn-bn" d="${L.d}" stroke-width="${T.glow}" filter="url(#wn-b)"/><path class="wn-bc" d="${L.d}" stroke-width="${T.core * 1.4}"/></g></svg>`;
  const caps = L.ends.map(([x, y]) => `<circle class="wn-cap" cx="${x}" cy="${y}" r="${(T.body * 0.22).toFixed(2)}"/>`).join('');
  return `<svg class="wn-l" viewBox="${VB}" aria-hidden="true" focusable="false"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path class="wn-edge" d="${L.d}" stroke-width="${T.glass + 0.7}"/>
<path class="wn-glass" d="${L.d}" stroke-width="${T.glass}"/>
<g class="wn-light"><path class="wn-glow" d="${L.d}" stroke-width="${T.glow}" filter="url(#wn-b)"/><path class="wn-body" d="${L.d}" stroke-width="${T.body}"/><path class="wn-core" d="${L.d}" stroke-width="${T.core}"/></g>
<path class="wn-hi" d="${L.d}" stroke-width="${T.hi}" transform="translate(-0.32 -0.38)"/>
${caps}</g></svg>`;   // (SP3 review: at ~13 pt the clips + big electrode caps read as breaks in the letters — the caps tiny, no clips)
}

/** the word's characters as spans, each carrying its tube letter (text stays: invisible, for layout + the screen reader) */
export const wordNeonChars = (word, kind = 'lit', tag = 'span') => [...word].map(ch => `<${tag} class="wn-c">${ch}${wordLetterSvg(ch, kind)}</${tag}>`).join('');
