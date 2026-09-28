param(
  [Parameter(Mandatory = $true)][int]$Shard,
  [Parameter(Mandatory = $true)][int]$Shards
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$dest = Join-Path $root "public\images\p"
if (-not (Test-Path -LiteralPath $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }

$ids = @(Get-Content -LiteralPath (Join-Path $PSScriptRoot "image-ids.txt") | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })
$mine = @()
for ($i = 0; $i -lt $ids.Count; $i++) {
  if (($i % $Shards) -eq $Shard) { $mine += $ids[$i] }
}

$ok = 0; $fail = @()
foreach ($id in $mine) {
  $out = Join-Path $dest "$id.jpg"
  if ((Test-Path -LiteralPath $out) -and ((Get-Item -LiteralPath $out).Length -gt 20000)) { $ok++; continue }
  $url = "https://images.unsplash.com/$id`?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=74"
  for ($try = 1; $try -le 3; $try++) {
    try {
      $req = [Net.HttpWebRequest]::Create($url)
      $req.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      $req.Timeout = 45000
      $req.ReadWriteTimeout = 45000
      $resp = $req.GetResponse()
      $ms = New-Object IO.MemoryStream
      $resp.GetResponseStream().CopyTo($ms)
      [IO.File]::WriteAllBytes($out, $ms.ToArray())
      $ms.Dispose(); $resp.Close()
      $ok++
      break
    } catch {
      if ($try -eq 3) { $fail += $id }
      Start-Sleep -Milliseconds 800
    }
  }
}

"SHARD $Shard/$Shards DOWNLOADED=$ok FAILED=$($fail.Count)"
if ($fail.Count -gt 0) { "FAILED: " + ($fail -join ",") }
