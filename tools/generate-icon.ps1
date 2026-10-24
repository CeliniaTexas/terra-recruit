$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$assetDir = Join-Path $root "assets"
$pngPath = Join-Path $assetDir "icon.png"
$icoPath = Join-Path $assetDir "icon.ico"

New-Item -ItemType Directory -Path $assetDir -Force | Out-Null

$bitmap = New-Object System.Drawing.Bitmap 512, 512
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.Color]::FromArgb(16, 16, 14))

$gold = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(240, 174, 53)), 8
$paper = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(238, 232, 216)), 7
$faint = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(55, 239, 230, 207)), 2

for ($offset = 64; $offset -le 448; $offset += 64) {
  $graphics.DrawLine($faint, $offset, 0, $offset, 512)
  $graphics.DrawLine($faint, 0, $offset, 512, $offset)
}

$diamond = New-Object System.Drawing.Drawing2D.GraphicsPath
$diamond.AddPolygon([System.Drawing.Point[]]@(
  (New-Object System.Drawing.Point 256, 62),
  (New-Object System.Drawing.Point 450, 256),
  (New-Object System.Drawing.Point 256, 450),
  (New-Object System.Drawing.Point 62, 256)
))
$graphics.DrawPath($gold, $diamond)

$inner = New-Object System.Drawing.Drawing2D.GraphicsPath
$inner.AddPolygon([System.Drawing.Point[]]@(
  (New-Object System.Drawing.Point 256, 105),
  (New-Object System.Drawing.Point 407, 256),
  (New-Object System.Drawing.Point 256, 407),
  (New-Object System.Drawing.Point 105, 256)
))
$graphics.DrawPath($faint, $inner)

$accentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 174, 53))
$paperBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(238, 232, 216))
$smallFont = New-Object System.Drawing.Font "Bahnschrift", 27, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$titleFont = New-Object System.Drawing.Font "Bahnschrift SemiCondensed", 142, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$center = New-Object System.Drawing.StringFormat
$center.Alignment = [System.Drawing.StringAlignment]::Center
$center.LineAlignment = [System.Drawing.StringAlignment]::Center

$graphics.DrawString("RI", $titleFont, $paperBrush, (New-Object System.Drawing.RectangleF 0, 192, 512, 170), $center)
$graphics.DrawString("FIELD DRAFT", $smallFont, $accentBrush, (New-Object System.Drawing.RectangleF 0, 333, 512, 60), $center)

$markPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(240, 174, 53)), 12
$graphics.DrawLine($markPen, 221, 256, 291, 256)
$graphics.DrawLine($markPen, 256, 221, 256, 291)

$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$iconHandle = $bitmap.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = [System.IO.File]::Open($icoPath, [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()
$icon.Dispose()

foreach ($size in @(192, 512)) {
  $webBitmap = New-Object System.Drawing.Bitmap $size, $size
  $webGraphics = [System.Drawing.Graphics]::FromImage($webBitmap)
  $webGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $webGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $webGraphics.DrawImage($bitmap, 0, 0, $size, $size)
  $webPath = Join-Path $root "icon-$size.png"
  $webBitmap.Save($webPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $webGraphics.Dispose()
  $webBitmap.Dispose()
}

$inner.Dispose()
$diamond.Dispose()
$markPen.Dispose()
$faint.Dispose()
$paper.Dispose()
$gold.Dispose()
$accentBrush.Dispose()
$paperBrush.Dispose()
$smallFont.Dispose()
$titleFont.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Generated application and web icons"
