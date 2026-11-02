# DESKTOP — Nov 2 2026

The owner's WINDOWS review fixes + the test fixes + THE ONE-TIME DESKTOP PASS (plan.md "OWNER'S NOTES — NOV 1 (late) + NOV 2": the
desktop questions 1–8, "go with your recs"). One session, the groups in order, each committed + pushed; the final push carries the harbor tag.

## THE DESKTOP CAMERA — the feasibility check (Group 3)
The owner's rules on a wide screen: re-framed lower + closer (the skyline big), the sign bigger + centred, no repeats up to 2.2 : 1.
They pull against each other: the bigger sign lowers the tagline (less room for the skyline) while a closer camera makes the skyline
taller — the squeeze (core/harbor-layout.js#squeeze) has to flatten the crowns more. Measured on the real layout (1440×900):

| camera | squeeze s | word faces | person |
| --- | --- | --- | --- |
| before (the phone's scale + a 3.6× panorama) | 0.65 | full | ~20 pt |
| 1.65× closer, eye 7.5, near edge z 50 | 0.45 | −7 rows (two-line words → one) | ~38 pt |
| **1.4× closer, eye 8, near edge z 50 (shipped)** | **0.66** | **full** (one quay block trimmed ≤ 12 %) | ~33 pt |

The shipped camera keeps the phone's own skyline proportion and the word towers' faces, with the sign ~1.25× bigger.
