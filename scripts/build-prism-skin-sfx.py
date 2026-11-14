"""PRISM DROP's SKIN SOUNDS (SKINS 2A — docs/prism.md "THE SKINS" → the sounds; docs/audio.md).

Grok's set sits in ~/Downloads/grok/PrismSkins/ (8 picks + 6 "-b" backups as *.wav + CREDITS.md + SHA256SUMS.txt). THE PICKS imported now =
the two DAY skins' sounds — watercolor-lock · watercolor-clear · paper-lock · paper-clear (pixel-* / galaxy-* wait for SKINS 2B). A "-b"
BACKUP is used ONLY IF ITS PICK FAILS (missing, a SHA-256 that does not match Grok's list, unreadable, too big) — and the script says so.
LICENCES (the owner's rule, Nov 14): the SOURCED parts are CC0 1.0; the other layers are GROK-GENERATED — fine to use (Ben checked Grok's
terms), credited as "generated (Grok)". The script lets through CC0 / CC BY sources and generated (Grok) layers only — anything else is
SKIPPED and said so.

For each pick (the ORIGINALS ARE NEVER MOVED OR EDITED — read only, decoded through ffmpeg; its SHA-256 checked against SHA256SUMS.txt first):
  * leading + trailing silence trimmed (below -55 dBFS),
  * its peak set to PEAK_DB (-8 dBFS — ONE stored level; how loud it PLAYS is the game's: js/games/prism/audio.js#SAMPLE_GAIN levels each
    skin's sounds with the others' and keeps them under the song),
  * mono, 44.1 kHz, 96 kbps mp3, no metadata (the house rule) — each must come out <= 30 KB.
Copies land in audio/sfx/prism/ + a CREDITS.md there with each file's credit line (from Grok's CREDITS.md). Run from the repo root:

    python -I scripts/build-prism-skin-sfx.py [<source dir>]

Needs ffmpeg: on PATH, or the imageio-ffmpeg package (the same one scripts/build-pw-sfx.py uses).
"""
import hashlib, os, re, shutil, subprocess, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.expanduser('~'), 'Downloads', 'grok', 'PrismSkins')
OUT = os.path.join('audio', 'sfx', 'prism')
BITRATE = '96k'
PEAK_DB = -8.0
MAX_BYTES = 30 * 1024
TINY = 'https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx'
PAPER = 'https://opengameart.org/content/various-paper-sound-effects'
# the shipped name -> its sources in order: the PICK, then its -b BACKUP if it has one. Each = (the source file, its licence, its credit
# line) — read from Grok's CREDITS.md on Nov 14 2026 and written out here, so the import never trusts the folder's text for what it ships
PICKS = {
    'watercolor-lock': [
        ('watercolor-lock.wav', 'CC0 1.0', f'"water-drop-01.wav" from "Fantasy Sound Effects (Tinysized SFX)" by Jan Schupke (Vehicle), CC0 1.0 — {TINY}'),
        ('watercolor-lock-b.wav', 'CC0 1.0', f'"water-drop-02.wav" from "Fantasy Sound Effects (Tinysized SFX)" by Jan Schupke (Vehicle), CC0 1.0 — {TINY}'),
    ],
    'watercolor-clear': [
        ('watercolor-clear.wav', 'generated (Grok) + CC0 1.0', f'a brush swish — generated (Grok) — with a drip excerpt from "water-drop-01.wav" by Jan Schupke (Vehicle), CC0 1.0 — {TINY}'),
    ],
    'paper-lock': [
        ('paper-lock.wav', 'CC0 1.0 + generated (Grok)', f'"Paper Sound - 1.wav" from "Various Paper Sound Effects" by Luckius, CC0 1.0 — {PAPER} — with a landing thup, generated (Grok)'),
        ('paper-lock-b.wav', 'CC0 1.0', f'"Paper Sound - 1.wav" (its opening) from "Various Paper Sound Effects" by Luckius, CC0 1.0 — {PAPER}'),
    ],
    'paper-clear': [
        ('paper-clear.wav', 'CC0 1.0 + generated (Grok)', f'"Paper Ripped - 1.wav" from "Various Paper Sound Effects" by Luckius, CC0 1.0 — {PAPER} — with a lift whoosh, generated (Grok)'),
        ('paper-clear-b.wav', 'CC0 1.0', f'"Paper Sound - 3.wav" from "Various Paper Sound Effects" by Luckius, CC0 1.0 — {PAPER}'),
    ],
}
ALLOWED = ('CC0 1.0', 'CC BY 4.0', 'CC BY 3.0', 'generated (Grok)')
def licence_ok(lic):
    return all(part.strip() in ALLOWED for part in lic.split('+'))


def ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    import imageio_ffmpeg  # noqa: E402
    return imageio_ffmpeg.get_ffmpeg_exe()


def sums(path):
    out = {}
    if os.path.isfile(path):
        with open(path, encoding='utf-8') as f:
            for line in f:
                m = re.match(r'^([0-9a-f]{64})\s+(\S+)\s*$', line)
                if m:
                    out[m.group(2)] = m.group(1)
    return out


def peak_db(exe, src, af):
    r = subprocess.run([exe, '-hide_banner', '-nostats', '-i', src, '-af', af + ',volumedetect', '-f', 'null', '-'], capture_output=True, text=True)
    m = re.search(r'max_volume:\s*(-?[0-9.]+) dB', r.stderr)
    return float(m.group(1)) if m else None


TRIM = 'silenceremove=start_periods=1:start_duration=0:start_threshold=-55dB,areverse,silenceremove=start_periods=1:start_duration=0:start_threshold=-55dB,areverse'


def take(exe, known, name, src_name, lic):
    """one source -> audio/sfx/prism/<name>.mp3; returns a line for the console, or raises ValueError(why it failed)"""
    src = os.path.join(SRC, src_name)
    if not licence_ok(lic):
        raise ValueError(f'licence "{lic}" is not CC0 / CC BY / generated (Grok)')
    if not os.path.isfile(src):
        raise ValueError('missing')
    with open(src, 'rb') as f:
        sha = hashlib.sha256(f.read()).hexdigest()
    if src_name in known and known[src_name] != sha:
        raise ValueError('its SHA-256 does not match SHA256SUMS.txt')
    pk = peak_db(exe, src, TRIM)
    if pk is None:
        raise ValueError('could not be read')
    gain = PEAK_DB - pk
    dst = os.path.join(OUT, name + '.mp3')
    subprocess.run([exe, '-v', 'error', '-y', '-i', src, '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '44100', '-af', f'{TRIM},volume={gain:.2f}dB',
                    '-c:a', 'libmp3lame', '-b:a', BITRATE, '-write_xing', '0', '-id3v2_version', '0', dst], check=True)
    size = os.path.getsize(dst)
    if size > MAX_BYTES:
        os.remove(dst)
        raise ValueError(f'{size} B > {MAX_BYTES} B')
    out_pk = peak_db(exe, dst, 'anull')
    r = subprocess.run([exe, '-hide_banner', '-i', dst], capture_output=True, text=True)
    dur = re.search(r'Duration: (\d+):(\d+):([0-9.]+)', r.stderr)
    secs = (int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3))) if dur else 0
    return f'{name}.mp3  <- {src_name}  {size} B  {secs:.3f} s  peak {out_pk} dBFS (source peak {pk} dB, gain {gain:+.2f} dB)  sha256 {sha[:12]}'


def main():
    if not os.path.isdir(SRC):
        sys.exit(f'no source folder: {SRC} - the code-made sounds stay')
    os.makedirs(OUT, exist_ok=True)
    exe = ffmpeg()
    known = sums(os.path.join(SRC, 'SHA256SUMS.txt'))
    done, lines = [], []
    for name, sources in PICKS.items():
        for i, (src_name, lic, credit) in enumerate(sources):
            try:
                print(take(exe, known, name, src_name, lic))
            except ValueError as e:
                print(f'{"PICK" if i == 0 else "BACKUP"} FAILED {src_name}: {e}' + (' - trying its backup' if i + 1 < len(sources) else f' - {name} keeps its code-made sound'))
                continue
            done.append(name)
            lines.append(f'- `{name}.mp3` — {credit}. Licence: {lic}.' + ('' if i == 0 else ' (THE BACKUP — its pick failed.)'))
            break
    with open(os.path.join(OUT, 'CREDITS.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('# PRISM DROP — the skins\' sounds (audio/sfx/prism/)\n\n')
        f.write('Grok\'s set (Nov 14 2026 — ~/Downloads/grok/PrismSkins/, its CREDITS.md), imported by `scripts/build-prism-skin-sfx.py` (copies: trimmed,\n')
        f.write('peak −8 dBFS, mono 44.1 kHz, 96 kbps mp3, no metadata). The SOURCED parts are CC0 1.0 (no credit is required — the courtesy credits\n')
        f.write('are kept anyway); the other layers are GENERATED by Grok — "generated (Grok)", no licence needed (the owner checked Grok\'s terms).\n')
        f.write('CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/\n\n')
        f.write('\n'.join(lines) + '\n')
    print(f'{len(done)} of {len(PICKS)} imported -> {OUT}')


if __name__ == '__main__':
    main()
