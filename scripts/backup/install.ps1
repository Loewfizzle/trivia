# CITY E - THE NIGHTLY BACKUP's installer for the mini PC (docs/backup.md). Public - no secret in it. Run ONCE (again any time: it keeps the token):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\backup\install.ps1
# (1) makes the BACKUP_TOKEN once - 32 random bytes, hex (a crypto RNG) - (2) saves it to C:\Users\benja\NeonBackups\token.txt, readable by
# this user only (the inherited permissions removed), (3) registers the Windows scheduled task "Neon Speakeasy nightly backup": daily ~4:45 am,
# "run as soon as possible after a missed start", only when the network is up -> scripts\backup\fetch.ps1. It never prints the token: paste it
# into Vercel + the private repo from the file (docs/backup.md "Ben's steps").
param([string]$Out = (Join-Path $env:USERPROFILE 'NeonBackups'), [string]$At = '4:45am')
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $Out | Out-Null
$tok = Join-Path $Out 'token.txt'
if (-not (Test-Path $tok)) {
  $b = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($b); $rng.Dispose()
  $hex = -join ($b | ForEach-Object { $_.ToString('x2') })
  [IO.File]::WriteAllText($tok, $hex)
  Write-Output "made a new token -> $tok"
} else { Write-Output "kept the token already at $tok" }
# readable by this user only (and SYSTEM, which the scheduler needs nothing from - left out)
& icacls $tok /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "icacls failed ($LASTEXITCODE)" }
$fetch = Join-Path $PSScriptRoot 'fetch.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$fetch`" -Out `"$Out`""
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 20) -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries
$name = 'Neon Speakeasy nightly backup'
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'CITY E: the second copy of the Neon Speakeasy database (docs/backup.md) - 14 days in NeonBackups' -Force | Out-Null
$t = Get-ScheduledTask -TaskName $name
Write-Output "scheduled: '$name' daily at $At (start when available, network only) -> $fetch [$($t.State)]"
