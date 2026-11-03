// THE VAULT 2B — MEMBER NUMBERS (PURE, server + client): a profile's member number (profiles/{pid}/mn — server-assigned, sequential, never
// reused; the owner Nº 1: api/_lib/members.js) as the card shows it. Never the name tag's four digits.
/** 7 → '0007' (past 9999: just the number); none → null */
export const memberLabel = n => (Number.isFinite(+n) && +n > 0 ? String(Math.floor(+n)).padStart(4, '0') : null);
