"""RAW ART OFF GIT (the inbox, Nov 26 2026 — the owner; built in FREEFALL F3B) — the Python half of scripts/art-src.mjs (the same rule):
RAW SOURCES (3D models, texture masters, .psd / .kra, audio masters) live OUTSIDE the repo in ONE folder — NS_ART_SRC, default
C:\\Users\\benja\\Downloads\\NEON\\art-src, one sub-folder an area — and ONLY the baked outputs the site loads go into git
(tests/repo-growth.test.mjs). An asset builder finds its sources through here and FAILS WITH A CLEAR MESSAGE when one is missing.

A builder is run with `python -P -E` (nothing is imported from the script's folder), so it loads this file by its path:

    import importlib.util, os
    _s = importlib.util.spec_from_file_location('art_src', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'art_src.py'))
    art_src = importlib.util.module_from_spec(_s); _s.loader.exec_module(art_src)
"""
import os
import sys

# (-E hides the environment from Python's own start-up, not from os.environ)
ART_SRC = os.environ.get('NS_ART_SRC') or r'C:\Users\benja\Downloads\NEON\art-src'


def source_dir(area, delivered):
    """an area's sources: <NS_ART_SRC>\\<area> when it is there — else the folder the owner's delivery has always been read from
    (`delivered`: sources that arrived before the rule stay where they are). Neither there: the build stops, saying where it looked."""
    outside = os.path.join(ART_SRC, area)
    if os.path.isdir(outside):
        return outside
    if delivered and os.path.isdir(delivered):
        return delivered
    sys.exit(f'RAW ART OFF GIT — the sources of "{area}" are missing: looked in {outside} (NS_ART_SRC = {ART_SRC})'
             + (f' and in {delivered}' if delivered else '') + '. Put the raw files under NS_ART_SRC — only the baked outputs go into git.')


def need(path):
    """a source file that must be there → its path; missing: the build stops with its name (never a silent skip)"""
    if not os.path.exists(path):
        sys.exit(f'RAW ART OFF GIT — a source is missing: {path} (NS_ART_SRC = {ART_SRC}). Nothing was written for it.')
    return path
