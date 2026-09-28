$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$dest = Join-Path $PSScriptRoot "..\public\images\p"
$dest = [IO.Path]::GetFullPath($dest)
if (-not (Test-Path -LiteralPath $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }

$ids = Get-Content -LiteralPath (Join-Path $PSScriptRoot "image-ids.txt") | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }

[Net.ServicePointManager]::DefaultConnectionLimit = 16
$ok = 0; $fail = @()

foreach ($id in $ids) {
  $out = Join-Path $dest "$id.jpg"
  if ((Test-Path -LiteralPath $out) -and ((Get-Item -LiteralPath $out).Length -gt 20000)) { $ok++; continue }
  $url = "https://images.unsplash.com/$id`?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=74"
  try {
    $wc = New-Object Net.WebClient
    $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    $bytes = $wc.DownloadData($url)
    [IO.File]::WriteAllBytes($out, $bytes)
    $ok++
  } catch { $fail += $id }
}

"DOWNLOADED=$ok FAILED=$($fail.Count)"
if ($fail.Count -gt 0) { "FAILED_IDS:"; $fail -join "," }
