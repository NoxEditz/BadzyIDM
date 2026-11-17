<#
.SYNOPSIS
  Times the same download in Badzy and in Mister Download Manager (MDM),
  one at a time, and says which finished first.

.DESCRIPTION
  Both programs must already be installed and RUNNING (MDM can be minimised to
  the tray). The script hands the download to each one the way a browser would,
  starts a stopwatch, and stops it when the finished file is complete and no
  longer in use by the program. The file is deleted afterwards. Runs alternate
  (Badzy, MDM, MDM, Badzy, ...) so neither gets the "warm" connection every time.

  Before you start:
   1. Badzy: Options > turn OFF "Show the Download File Info window for
      downloads from the browser" (otherwise Badzy waits for you to press Start).
   2. Use a big file (500 MB+) on a fast server that reports its size and
      allows resuming. Each program is left at its DEFAULT settings.
   3. Pause other downloads and do not use the connection while it runs.

.EXAMPLE
  .\compare-speed.ps1 -Url "https://example.com/big.zip" -Runs 3

.EXAMPLE
  .\compare-speed.ps1 -Url "https://example.com/big.zip" -MdmExe "C:\Apps\MDM\misterdownloadmanager.exe" -NoQuery
#>
param(
    [Parameter(Mandatory = $true)][string]$Url,
    # how many times each program downloads the file
    [int]$Runs = 3,
    # path of misterdownloadmanager.exe (looked for in the usual places if left out)
    [string]$MdmExe = "",
    # Badzy's local port (Options of the browser extension shows it; default 9614)
    [int]$BadzyPort = 9614,
    # where Badzy saves (its category folders are searched inside it)
    [string]$BadzyFolder = (Join-Path $env:USERPROFILE "Downloads"),
    # where MDM is told to save
    [string]$MdmFolder = (Join-Path $env:USERPROFILE "Downloads\bench-mdm"),
    # give up on one download after this many seconds
    [int]$TimeoutSec = 900,
    # rest between downloads
    [int]$PauseSec = 5,
    # by default "?bench=<id>" is added to the address so each run is a new link
    # (Badzy and MDM refuse the same link twice). Use -NoQuery for signed links.
    [switch]$NoQuery
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Find-Mdm {
    if ($MdmExe -and (Test-Path -LiteralPath $MdmExe)) { return (Resolve-Path -LiteralPath $MdmExe).Path }
    $names = @("misterdownloadmanager.exe")
    $dirs = @(
        (Join-Path $env:LOCALAPPDATA "Programs"),
        $env:ProgramFiles,
        ${env:ProgramFiles(x86)},
        $env:LOCALAPPDATA
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
    foreach ($d in $dirs) {
        $hit = Get-ChildItem -LiteralPath $d -Recurse -Filter $names[0] -File -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($hit) { return $hit.FullName }
    }
    $cmd = Get-Command $names[0] -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    throw "Could not find misterdownloadmanager.exe. Run again with -MdmExe ""C:\path\to\misterdownloadmanager.exe""."
}

function Get-ExpectedSize([string]$Address) {
    try {
        $r = Invoke-WebRequest -Uri $Address -Method Head -UseBasicParsing -TimeoutSec 30
        $v = $r.Headers["Content-Length"]
        if ($v -is [array]) { $v = $v[0] }
        $n = [int64]$v
        if ($n -gt 0) { return $n }
    } catch { }
    return 0
}

# true when the file is complete and the program that wrote it has let go of it
function Test-FileDone([string]$Path, [int64]$Size) {
    try {
        $fs = [System.IO.File]::Open($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
        try { $len = $fs.Length } finally { $fs.Dispose() }
        return ($len -eq $Size)
    } catch {
        return $false   # missing, or still open in the program
    }
}

# waits for the finished file; the stopwatch stops the moment it is complete
function Wait-Download([string]$Name, [string]$Root, [int64]$Size, [System.Diagnostics.Stopwatch]$Clock) {
    $path = $null
    while ($Clock.Elapsed.TotalSeconds -lt $TimeoutSec) {
        if (-not $path) {
            $f = Get-ChildItem -LiteralPath $Root -Recurse -Filter $Name -File -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($f) { $path = $f.FullName }
        }
        if ($path -and (Test-FileDone $path $Size)) {
            $Clock.Stop()
            return $path
        }
        Start-Sleep -Milliseconds 200
    }
    $Clock.Stop()
    return $null
}

function Send-ToBadzy([string]$Address, [string]$Name) {
    $body = @{ url = $Address; fileName = $Name } | ConvertTo-Json -Compress
    Invoke-RestMethod -Uri "http://127.0.0.1:$BadzyPort/add" -Method Post -Headers @{ "X-SwiftGet" = "1" } `
        -ContentType "application/json" -Body $body -TimeoutSec 10 | Out-Null
}

function Send-ToMdm([string]$Exe, [string]$Address, [string]$Name) {
    # IDM-style switches: /d address  /p folder  /f name  /n = start now, no questions
    $argLine = '/d "{0}" /p "{1}" /f "{2}" /n' -f $Address, $MdmFolder, $Name
    Start-Process -FilePath $Exe -ArgumentList $argLine | Out-Null
}

# ---------------------------------------------------------------- checks

$mdm = Find-Mdm
Write-Host "MDM:   $mdm"
try {
    $ping = Invoke-RestMethod -Uri "http://127.0.0.1:$BadzyPort/ping" -Headers @{ "X-SwiftGet" = "1" } -TimeoutSec 5
    Write-Host "Badzy: running (version $($ping.version)) on port $BadzyPort"
} catch {
    throw "Badzy does not answer on port $BadzyPort. Start Badzy first (or pass -BadzyPort)."
}
New-Item -ItemType Directory -Force -Path $MdmFolder | Out-Null

$size = Get-ExpectedSize $Url
if ($size -le 0) {
    throw "The server does not say how big the file is, so the end of the download cannot be told. Use another file (a big .zip / .iso from a fast host)."
}
Write-Host ("File:  {0:N0} bytes ({1:N1} MB)" -f $size, ($size / 1MB))
Write-Host "Runs:  $Runs each, alternating. Do not use the connection meanwhile.`n"

# ---------------------------------------------------------------- the runs

$results = New-Object System.Collections.Generic.List[object]
$stamp = Get-Date -Format "yyyyMMddHHmmss"

for ($i = 1; $i -le $Runs; $i++) {
    # Badzy first on odd runs, MDM first on even ones
    $order = if ($i % 2 -eq 1) { @("Badzy", "MDM") } else { @("MDM", "Badzy") }
    foreach ($who in $order) {
        $name = "bench-$who-$stamp-$i.bin"
        $address = $Url
        if (-not $NoQuery) {
            $sep = if ($Url.Contains("?")) { "&" } else { "?" }
            $address = "$Url${sep}bench=$who$stamp$i"
        }
        Start-Sleep -Seconds $PauseSec
        $clock = [System.Diagnostics.Stopwatch]::StartNew()
        if ($who -eq "Badzy") { Send-ToBadzy $address $name; $root = $BadzyFolder }
        else { Send-ToMdm $mdm $address $name; $root = $MdmFolder }
        $file = Wait-Download $name $root $size $clock
        if (-not $file) {
            Write-Host ("  run {0} {1,-5}: NOT FINISHED in {2}s" -f $i, $who, $TimeoutSec) -ForegroundColor Red
            if ($who -eq "Badzy") { Write-Host "    (is ""Show the Download File Info window"" still ON in Badzy's Options? Then it waits for Start.)" -ForegroundColor Yellow }
            continue
        }
        $sec = $clock.Elapsed.TotalSeconds
        $mbps = ($size / 1MB) / $sec
        Write-Host ("  run {0} {1,-5}: {2,7:N1} s   {3,6:N1} MB/s" -f $i, $who, $sec, $mbps)
        $results.Add([pscustomobject]@{ Run = $i; Program = $who; Seconds = [math]::Round($sec, 2); MBps = [math]::Round($mbps, 2) })
        Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue
    }
}

# ---------------------------------------------------------------- result

Write-Host "`n=== Result ($Runs runs each) ==="
$summary = @()
foreach ($who in @("Badzy", "MDM")) {
    $mine = @($results | Where-Object { $_.Program -eq $who })
    if ($mine.Count -eq 0) { continue }
    $avg = ($mine | Measure-Object -Property Seconds -Average).Average
    $best = ($mine | Measure-Object -Property Seconds -Minimum).Minimum
    $summary += [pscustomobject]@{ Program = $who; Finished = $mine.Count; AvgSeconds = [math]::Round($avg, 2); BestSeconds = $best; AvgMBps = [math]::Round(($size / 1MB) / $avg, 2) }
}
$summary | Format-Table -AutoSize

if ($summary.Count -eq 2) {
    $fast = $summary | Sort-Object AvgSeconds | Select-Object -First 1
    $slow = $summary | Sort-Object AvgSeconds | Select-Object -Last 1
    $gap = (($slow.AvgSeconds - $fast.AvgSeconds) / $slow.AvgSeconds) * 100
    Write-Host ("{0} finished first on average, {1:N1}% faster." -f $fast.Program, $gap) -ForegroundColor Green
    if ($gap -lt 5) { Write-Host "That is within normal run-to-run noise: treat it as a tie." -ForegroundColor Yellow }
}
$csv = Join-Path $env:USERPROFILE "Desktop\badzy-vs-mdm-$stamp.csv"
try { $results | Export-Csv -Path $csv -NoTypeInformation; Write-Host "Every run saved to $csv" } catch { }
Write-Host "`nNote: Badzy saves into its own folders (default settings) and MDM into $MdmFolder, so both should be on the same drive."
