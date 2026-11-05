// THE PROFILE's POP-UPS (LOBBY 2.0 A) — since SHELL 2.0 A they ARE THE SHEET (ui/sheet.js): one builder for every pop-up in the app.
// This file only loads the progression stylesheet first (a sheet's body may hold the profile's cards — the room opens them without the
// profile having loaded it) and keeps the old names for its callers.
//   const s = openPfSheet({ title, kicker?, body: [nodes] | node, cls?, onClose? })  → { el, close(), body }
import { pgSheet } from '../progress/look.js';
import { openSheet, closeAllSheets, sheetDepth } from '../ui/sheet.js';

export function openPfSheet(o = {}) {
  pgSheet();
  return openSheet(o);
}
export const pfSheetDepth = sheetDepth;
export const closeAllPfSheets = closeAllSheets;
