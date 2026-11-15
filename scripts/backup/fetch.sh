#!/usr/bin/env bash
# CITY E — THE NIGHTLY BACKUP's fetcher (bash + curl + jq + sha256sum — the GitHub runner's; docs/backup.md). Public: no secret in it.
#   BACKUP_TOKEN=… BASE=https://www.neonspeakeasy.com WHO=gh OUT=out bash fetch.sh
# The index → every part (a 409 { split: k } → its k slices), each checked against its own x-backup-sha256 header; then index.json +
# checksums.sha256 in OUT, and ?backup=done records the pickup (progress/backup/$WHO — /admin's BACKUPS row). Any failure → exit 1.
set -euo pipefail
: "${BACKUP_TOKEN:?BACKUP_TOKEN is missing}"
BASE="${BASE:-https://www.neonspeakeasy.com}"; WHO="${WHO:-gh}"; OUT="${OUT:-out}"
mkdir -p "$OUT"
H=(-H "x-backup-token: ${BACKUP_TOKEN}" -H "x-backup-who: ${WHO}")
curl -sS --fail --retry 3 --retry-delay 5 "${H[@]}" "$BASE/api/admin?backup=index" -o "$OUT/index.json"
bytes=0; n=0
get() {   # $1 = the query, $2 = the file name → 0 ok · 2 = split (its k in $OUT/.split)
  local code sum want
  code=$(curl -sS --retry 3 --retry-delay 5 -D "$OUT/.h" -o "$OUT/$2" -w '%{http_code}' "${H[@]}" "$BASE/api/admin?$1")
  if [ "$code" = "409" ]; then jq -r .split "$OUT/$2" > "$OUT/.split"; rm -f "$OUT/$2"; return 2; fi
  [ "$code" = "200" ] || { echo "part $2: HTTP $code" >&2; exit 1; }
  want=$(grep -i '^x-backup-sha256:' "$OUT/.h" | tr -d '\r' | awk '{print $2}')
  sum=$(sha256sum "$OUT/$2" | awk '{print $1}')
  [ -n "$want" ] && [ "$sum" = "$want" ] || { echo "part $2: checksum mismatch ($sum vs $want)" >&2; exit 1; }
  echo "$sum  $2" >> "$OUT/checksums.sha256"
  bytes=$((bytes + $(stat -c %s "$OUT/$2"))); n=$((n + 1))
}
: > "$OUT/checksums.sha256"
for p in $(jq -r '.parts[]' "$OUT/index.json"); do
  if get "backup=$p" "$p.json.gz"; then continue; else rc=$?; fi
  [ "$rc" = "2" ] || exit 1
  k=$(cat "$OUT/.split")
  for ((i = 0; i < k; i++)); do get "backup=$p&slice=$i/$k" "$p@${i}of$k.json.gz" || { echo "slice $p $i/$k split again" >&2; exit 1; }; done
done
rm -f "$OUT/.h" "$OUT/.split"
curl -sS --fail "${H[@]}" -H "x-backup-bytes: $bytes" -H "x-backup-parts: $n" "$BASE/api/admin?backup=done" > /dev/null
echo "THE NIGHTLY BACKUP: $n parts, $bytes bytes gzipped — every checksum OK"
