"""PRISM DROP — THE DAY LOOK's PAPERS (PD-4). Builds assets/prism/paper/{notepad,graph,construction,coloring}.webp from CC0 sources.

The rulings (notepad lines + margin, the graph grid, the coloring page's frame) are DRAWN IN CODE over the grain (js/games/prism/page.js) —
these files are the GRAIN only: tileable, the paper's colour baked in, the grain's contrast lifted a little so it reads on a phone.

Sources (CC0 — see assets/prism/paper/CREDITS.md; not committed, download them first):
  OGA   https://opengameart.org/content/cc0-pbr-paper-textures        CC0-Texture-Paper01.zip → PaperAlbedo.png (2048², tileable)
  ACG1  https://ambientcg.com/view?id=Paper001                         Paper001_1K-JPG.zip → Paper001_1K-JPG_Color.jpg
  ACG2  https://ambientcg.com/view?id=Paper002                         Paper002_1K-JPG.zip → Paper002_1K-JPG_Color.jpg

  python scripts/build-prism-paper.py --oga <PaperAlbedo.png> --acg1 <Paper001 color> --acg2 <Paper002 color> [--check <dir for seam previews>]
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'prism', 'paper')

# id: (source, tile size, paper colour, grain gain, high-pass radius px) — the colours are crayon.js#PAPERS' `base` (keep them in step)
PAPERS = {
    'notepad': ('oga', 512, (251, 247, 234), 2.0, 2.5),
    'graph': ('oga', 512, (243, 247, 245), 1.8, 2.5),
    'construction': ('acg2', 512, (205, 214, 222), 1.4, 10),
    'coloring': ('acg1', 512, (248, 246, 241), 1.7, 6),
}


def grain(img, size, radius):
    """the source → a tile of size² (the whole texture scaled, so it still tiles), its luminance detail around 0 (−1..1-ish)"""
    g = img.convert('L').resize((size, int(round(size * img.height / img.width))), Image.LANCZOS)
    a = np.asarray(g, dtype=np.float32) / 255.0
    # keep the fine tooth + the fibres, drop the blotches + the OGA map's soft plaid (a high-pass at `radius` px)
    big = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32) / 255.0
    return seamless(a - big)


def seamless(d):
    """the tile blended with itself rolled by half: at the edges the rolled copy (whose edges are the original's middle) takes over — no seam"""
    h, w = d.shape
    wy = np.sin(np.linspace(0, np.pi, h)) ** 2
    wx = np.sin(np.linspace(0, np.pi, w)) ** 2
    m = np.outer(wy, wx)
    r = np.roll(np.roll(d, h // 2, 0), w // 2, 1)
    # (the blend lowers the grain where both mix — rescale by the blend's own variance so the tooth stays even)
    return (d * m + r * (1 - m)) / np.sqrt(m ** 2 + (1 - m) ** 2)


def build(src, size, base, gain, radius):
    d = grain(src, size, radius)
    d = d / (np.abs(d).mean() * 8 + 1e-6)          # a common scale for every source
    rgb = np.empty(d.shape + (3,), np.float32)
    for i, c in enumerate(base):
        rgb[..., i] = c * (1 + 0.06 * gain * d) + 255 * 0.012 * gain * d
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--oga', required=True)
    ap.add_argument('--acg1', required=True)
    ap.add_argument('--acg2', required=True)
    ap.add_argument('--check', default=None)
    a = ap.parse_args()
    srcs = {'oga': Image.open(a.oga), 'acg1': Image.open(a.acg1), 'acg2': Image.open(a.acg2)}
    os.makedirs(OUT, exist_ok=True)
    for pid, (s, size, base, gain, radius) in PAPERS.items():
        im = build(srcs[s], size, base, gain, radius)
        path = os.path.join(OUT, f'{pid}.webp')
        im.save(path, 'WEBP', quality=82, method=6)
        print(f'{pid:13s} {im.size[0]}x{im.size[1]}  {os.path.getsize(path) / 1024:.1f} KB  mean {np.asarray(im).reshape(-1, 3).mean(0).round(1)}')
        if a.check:
            os.makedirs(a.check, exist_ok=True)
            w, h = im.size
            sheet = Image.new('RGB', (w * 2, h * 2))
            for x in (0, w):
                for y in (0, h):
                    sheet.paste(im, (x, y))
            sheet.save(os.path.join(a.check, f'{pid}-2x2.png'))


if __name__ == '__main__':
    main()
