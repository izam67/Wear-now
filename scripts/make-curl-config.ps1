$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$dest = Join-Path $root "public\images\p"
if (-not (Test-Path -LiteralPath $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }

$ids = @(Get-Content -LiteralPath (Join-Path $PSScriptRoot "image-ids.txt") | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })
$cfg = Join-Path $PSScriptRoot "curl-images.cfg"

$lines = @(
  "silent",
  "show-error",
  "retry = 3",
  "retry-delay = 1",
  "connect-timeout = 20",
  "max-time = 120",
  'user-agent = "maison-atelier-catalog/1.0"'
)

foreach ($id in $ids) {
  $out = Join-Path $dest "$id.jpg"
  $url = "https://images.unsplash.com/$id`?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=74"
  $lines += "url = `"$url`""
  $lines += "output = `"$out`""
}

[IO.File]::WriteAllLines($cfg, $lines, (New-Object System.Text.UTF8Encoding($false)))
"cfg written: $cfg entries=$($ids.Count)"
