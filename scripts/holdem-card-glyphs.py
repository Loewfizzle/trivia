"""HOLD'EM (HE6) — the corner-index glyphs for the real card faces: Libre Baskerville (SIL OFL 1.1) at weight 700, each glyph's outline as an
SVG path in a box where the CAP HEIGHT = 100 (y down, the baseline at y = 100, the top of a capital at y = 0). Printed as JSON on stdout for
scripts/build-holdem-cards.mjs (which writes js/games/holdem/card-data.js). Run through that script, never alone.
  python -P scripts/holdem-card-glyphs.py <LibreBaskerville[wght].ttf>
"""
import sys, json
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

font = TTFont(sys.argv[1])
if 'fvar' in font:
    axes = {a.axisTag: a for a in font['fvar'].axes}
    font = instancer.instantiateVariableFont(font, {t: (min(a.maxValue, 700) if t == 'wght' else a.defaultValue) for t, a in axes.items()})
gs, cmap = font.getGlyphSet(), font.getBestCmap()
cap = font['OS/2'].sCapHeight or 1400
k = 100.0 / cap

def fmt(cmds):
    # round the numbers to 0.1 (the box is 100 tall — finer is invisible at any size)
    out, num = [], ''
    for ch in cmds + ' ':
        if ch in '-.0123456789e':
            num += ch
        else:
            if num:
                out.append(('%.1f' % float(num)).rstrip('0').rstrip('.')); num = ''
            if ch.strip(): out.append(ch)
            elif out and out[-1] != ' ': out.append(' ')
    return ''.join(out).replace(' M', 'M').replace(' L', 'L').replace(' Q', 'Q').replace(' C', 'C').replace(' Z', 'Z').strip()

res = {}
for ch in 'AKQJ1023456789':
    g = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (k, 0, 0, -k, 0, 100)))
    bp = BoundsPen(gs); gs[g].draw(bp)
    x0, y0, x1, y1 = bp.bounds
    res[ch] = {'d': fmt(pen.getCommands()), 'adv': round(gs[g].width * k, 1), 'x0': round(x0 * k, 1), 'x1': round(x1 * k, 1),
               'top': round(100 - y1 * k, 1), 'bot': round(100 - y0 * k, 1)}
print(json.dumps(res))
