$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nativeDir = Join-Path $projectRoot "native"
$distDir = Join-Path $projectRoot "dist"
$vsDevCmd = "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat"
$outputExe = Join-Path $distDir "Terra-Recruit-1.0.0.exe"
$resourceFile = Join-Path $nativeDir "resources.res"
$objectFile = Join-Path $nativeDir "TerraRecruit.obj"

if (-not (Test-Path $vsDevCmd)) {
  throw "Visual Studio C++ build tools were not found."
}

New-Item -ItemType Directory -Path $distDir -Force | Out-Null

$buildCommand = (
  "call `"$vsDevCmd`" -arch=x64 -host_arch=x64 >nul && " +
  "cd /d `"$projectRoot`" && " +
  "rc.exe /nologo /fo `"$resourceFile`" `"$($nativeDir)\resources.rc`" && " +
  "cl.exe /nologo /std:c++17 /EHsc /O2 /MT /DUNICODE /D_UNICODE " +
  "/Fo:`"$objectFile`" `"$($nativeDir)\TerraRecruit.cpp`" `"$resourceFile`" " +
  "/Fe:`"$outputExe`" /link /MANIFEST:NO /SUBSYSTEM:WINDOWS " +
  "/ENTRY:wWinMainCRTStartup shell32.lib shlwapi.lib ole32.lib user32.lib advapi32.lib"
)

& cmd.exe /d /s /c $buildCommand
if ($LASTEXITCODE -ne 0) {
  throw "EXE compilation failed with exit code $LASTEXITCODE."
}

Remove-Item -LiteralPath $resourceFile, $objectFile -Force -ErrorAction SilentlyContinue

$exe = Get-Item $outputExe
Write-Host "Built $($exe.FullName) ($([Math]::Round($exe.Length / 1KB, 1)) KB)"
