$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataPath = Join-Path $projectRoot "data.js"

# Unicode escapes keep this Windows PowerShell 5.1 script readable without a BOM.
$professions = @(
  [regex]::Unescape('\u5148\u950b'), # Vanguard
  [regex]::Unescape('\u8fd1\u536b'), # Guard
  [regex]::Unescape('\u91cd\u88c5'), # Defender
  [regex]::Unescape('\u72d9\u51fb'), # Sniper
  [regex]::Unescape('\u672f\u5e08'), # Caster
  [regex]::Unescape('\u533b\u7597'), # Medic
  [regex]::Unescape('\u8f85\u52a9'), # Supporter
  [regex]::Unescape('\u7279\u79cd')  # Specialist
)

$headers = @{
  "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36"
  "Accept" = "application/json"
  "Accept-Language" = "zh-CN,zh;q=0.9"
  "Referer" = "https://prts.wiki/w/%E5%B9%B2%E5%91%98%E4%B8%80%E8%A7%88"
}

$api = "https://prts.wiki/api.php?action=cargoquery&format=json"
$api += "&tables=chara"
$api += "&fields=chara._pageName%3Dname%2Cchara.profession%3Dprofession%2Cchara.rarity%3Drarity%2Cchara.charIndex%3DcharIndex"
$api += "&where=chara.charIndex%3E0"
$api += "&order_by=chara.charIndex&limit=500"

$response = $null
for ($attempt = 1; $attempt -le 6; $attempt += 1) {
  try {
    $response = Invoke-RestMethod -Uri $api -Headers $headers -TimeoutSec 30
    if ($response.cargoquery.Count -gt 0) {
      break
    }
  } catch {
    if ($attempt -eq 6) {
      throw "Unable to read PRTS operator data: $($_.Exception.Message)"
    }
  }
  Start-Sleep -Seconds 2
}

if (-not $response -or $response.cargoquery.Count -eq 0) {
  throw "PRTS returned an empty operator list."
}

$groups = [ordered]@{}
foreach ($profession in $professions) {
  $groups[$profession] = @()
}

foreach ($entry in $response.cargoquery) {
  $title = $entry.title
  if (-not $groups.Contains($title.profession)) {
    throw "Unknown profession in PRTS data."
  }
  $groups[$title.profession] += ,@($title.name, [int]$title.rarity)
}

$encodedGroups = @()
foreach ($profession in $professions) {
  $items = $groups[$profession] | ForEach-Object {
    "[" + (ConvertTo-Json -InputObject $_ -Compress) + "]"
  }
  $encodedGroups += '    "' + $profession + '": [' + "`n      " +
    ($items -join ", ") + "`n    ]"
}

$today = Get-Date -Format "yyyy-MM-dd"
$professionJson = $professions | ForEach-Object { '"' + $_ + '"' }
$content = @"
/*
 * Operator names, professions and rarities are sourced from PRTS.
 * Synced: $today
 * Group format: [operator name, rarity]. Rarity 0 means special.
 */
window.OPERATOR_DATA = {
  source: "https://prts.wiki/w/%E5%B9%B2%E5%91%98%E4%B8%80%E8%A7%88",
  syncedAt: "$today",
  professions: [$($professionJson -join ", ")],
  operators: {
$($encodedGroups -join ",`n")
  }
};
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($dataPath, $content, $utf8NoBom)
Write-Host "Synced $($response.cargoquery.Count) operators -> $dataPath"
