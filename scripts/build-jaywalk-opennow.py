# CITY F — THE OPEN NOW BILLBOARD: the owner's poster (Downloads\NEON\jaywalk-billboard-open-now.png, 1696 × 896 — his pick, Nov 17; COPIED,
# never moved / edited) → assets/city/jaywalk/open-now.webp at the tri-vision's own poster box (848 × 448 — holdem-art.js#POSTER_ASPECT: the
# original's exact half), a WebP a sign on a phone needs (≤ ~200 KB). The words are baked in: the board draws no lettering over it.
#   python -I scripts/build-jaywalk-opennow.py [<the png>]
import sys, os
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.expanduser('~'), 'Downloads', 'NEON', 'jaywalk-billboard-open-now.png')
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'city', 'jaywalk', 'open-now.webp')
im = Image.open(src).convert('RGB')
W, H = 848, 448
im = im.resize((W, H), Image.LANCZOS)
im.save(out, 'WEBP', quality=86, method=6)
print(f'open-now.webp {W} x {H}  {os.path.getsize(out) / 1024:.1f} KB')
