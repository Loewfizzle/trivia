# CITY E - THE NIGHTLY BACKUP, the SECOND copy: the mini PC (docs/backup.md). Public - no secret in it: the token is read from TokenFile
# (made once by install.ps1, readable by Ben's user only). Windows PowerShell 5.1.
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\backup\fetch.ps1 [-Base https://www.neonspeakeasy.com] [-Out C:\Users\benja\NeonBackups] [-Keep 14]
# The index -> every part (a 409 { split: k } -> its k slices), each checked against its own x-backup-sha256 header, into Out\<date>\ (+ index.json
# + checksums.sha256); ?backup=done records the pickup (progress/backup/pc - /admin's BACKUPS row); the newest Keep dated folders kept.
# A line per run in Out\backup.log. Any failure -> the half-written folder removed, exit 1.
param(
  [string]$Base = 'https://www.neonspeakeasy.com',
  [string]$Out = (Join-Path $env:USERPROFILE 'NeonBackups'),
  [string]$TokenFile = '',
  [int]$Keep = 14
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
if (-not $TokenFile) { $TokenFile = Join-Path $Out 'token.txt' }
$log = Join-Path $Out 'backup.log'
function Log($m) { $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $m"; Add-Content -Path $log -Value $line -Encoding utf8; Write-Output $line }
if (-not (Test-Path $TokenFile)) { Log "FAILED: no token at $TokenFile (run install.ps1)"; exit 1 }
$token = (Get-Content -Path $TokenFile -Raw).Trim()
$day = Get-Date -Format 'yyyy-MM-dd'
$dir = Join-Path $Out $day
$tmp = "$dir.part"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory -Force $tmp | Out-Null
$H = @{ 'x-backup-token' = $token; 'x-backup-who' = 'pc' }
$sums = New-Object System.Collections.Generic.List[string]
$script:bytes = 0; $script:n = 0

# one GET -> @{ code; file; sha } (a 409's body read from the error response)
function Fetch($qs, $file) {
  $path = Join-Path $tmp $file
  try {
    $r = Invoke-WebRequest -Uri "$Base/api/admin?$qs" -Headers $H -UseBasicParsing -OutFile $path -PassThru -TimeoutSec 120
    return @{ code = [int]$r.StatusCode; file = $path; sha = [string]$r.Headers['x-backup-sha256'] }
  } catch [System.Net.WebException] {
    $resp = $_.Exception.Response
    if ($resp -and [int]$resp.StatusCode -eq 409) {
      # (PS 5.1: the error body is in ErrorDetails; the response stream may already be read)
      $body = if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $_.ErrorDetails.Message } else { (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() }
      $k = [int](($body | ConvertFrom-Json).split)
      if ($k -lt 2) { throw "part ${file}: a split answer without its count ($body)" }
      return @{ code = 409; split = $k }
    }
    throw
  }
}
function Keep-Part($r, $name) {
  if ($r.code -ne 200) { throw "part ${name}: HTTP $($r.code)" }
  $got = (Get-FileHash -Algorithm SHA256 -Path $r.file).Hash.ToLower()
  if (-not $r.sha -or $got -ne $r.sha.ToLower()) { throw "part ${name}: checksum mismatch ($got vs $($r.sha))" }
  $sums.Add("$got  $name")
  $script:bytes += (Get-Item $r.file).Length; $script:n++
}
try {
  $idx = Invoke-WebRequest -Uri "$Base/api/admin?backup=index" -Headers $H -UseBasicParsing -TimeoutSec 60
  [IO.File]::WriteAllText((Join-Path $tmp 'index.json'), $idx.Content)
  $parts = ($idx.Content | ConvertFrom-Json).parts
  foreach ($p in $parts) {
    $r = Fetch "backup=$p" "$p.json.gz"
    if ($r.code -eq 409) {
      for ($i = 0; $i -lt $r.split; $i++) { $name = "$p@$($i)of$($r.split).json.gz"; Keep-Part (Fetch "backup=$p&slice=$i/$($r.split)" $name) $name }
    } else { Keep-Part $r "$p.json.gz" }
  }
  [IO.File]::WriteAllLines((Join-Path $tmp 'checksums.sha256'), $sums)
  if (Test-Path $dir) { Remove-Item -Recurse -Force $dir }
  Rename-Item -Path $tmp -NewName (Split-Path $dir -Leaf)
  $H2 = $H.Clone(); $H2['x-backup-bytes'] = "$($script:bytes)"; $H2['x-backup-parts'] = "$($script:n)"
  Invoke-WebRequest -Uri "$Base/api/admin?backup=done" -Headers $H2 -UseBasicParsing -TimeoutSec 60 | Out-Null
  # keep the newest $Keep dated folders
  Get-ChildItem -Path $Out -Directory | Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}$' } | Sort-Object Name -Descending | Select-Object -Skip $Keep | ForEach-Object { Remove-Item -Recurse -Force $_.FullName }
  Log "OK $day - $($script:n) parts, $($script:bytes) bytes, every checksum OK"
  exit 0
} catch {
  if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
  Log "FAILED $day - $($_.Exception.Message)"
  exit 1
}
