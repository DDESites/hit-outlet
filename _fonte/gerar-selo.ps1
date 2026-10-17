# Recorta o selo circular da HiT Outlet a partir da captura enviada e gera
# assets/img/marca/selo.png (mascara circular) + favicon.png.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$origem = "C:\Users\Bruno\Pictures\Screenshots\Captura de tela 2026-10-17 104458.png"
$pasta = "C:\Users\Bruno\Desktop\hit-outlet\assets\img\marca"
New-Item -ItemType Directory -Force -Path $pasta | Out-Null

$src = [System.Drawing.Bitmap]::FromFile($origem)
Write-Output "Dimensoes: $($src.Width)x$($src.Height)"

# O disco do selo foi medido na captura (908x895): centro e raio fixos.
$cx = 442
$cy = 419
$raio = 389

$tam = 720
$selo = New-Object System.Drawing.Bitmap -ArgumentList $tam, $tam
$g = [System.Drawing.Graphics]::FromImage($selo)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# recorte quadrado centralizado no selo
$g.DrawImage($src, (New-Object System.Drawing.Rectangle -ArgumentList 0, 0, $tam, $tam),
  (New-Object System.Drawing.Rectangle -ArgumentList ($cx - $raio), ($cy - $raio), ($raio * 2), ($raio * 2)),
  [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

# mascara circular com borda suave
$mascara = New-Object System.Drawing.Bitmap -ArgumentList $tam, $tam
$mg = [System.Drawing.Graphics]::FromImage($mascara)
$mg.Clear([System.Drawing.Color]::Black)
$mg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$pincel = New-Object System.Drawing.SolidBrush -ArgumentList ([System.Drawing.Color]::White)
$mg.FillEllipse($pincel, 1, 1, ($tam - 2), ($tam - 2))
$mg.Dispose()

$alvo = [System.Drawing.Imaging.ImageLockMode]::ReadWrite
$fmt = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
$r1 = $mascara.LockBits((New-Object System.Drawing.Rectangle -ArgumentList 0, 0, $tam, $tam), $alvo, $fmt)
$r2 = $selo.LockBits((New-Object System.Drawing.Rectangle -ArgumentList 0, 0, $tam, $tam), $alvo, $fmt)
$bytesM = New-Object byte[] ($r1.Stride * $tam)
$bytesS = New-Object byte[] ($r2.Stride * $tam)
[System.Runtime.InteropServices.Marshal]::Copy($r1.Scan0, $bytesM, 0, $bytesM.Length)
[System.Runtime.InteropServices.Marshal]::Copy($r2.Scan0, $bytesS, 0, $bytesS.Length)
for ($i = 0; $i -lt $bytesS.Length; $i += 4) {
  $alfa = [int]($bytesM[$i])   # 255 dentro do circulo
  if ($alfa -lt $bytesS[$i + 3]) { $bytesS[$i + 3] = $alfa }
}
[System.Runtime.InteropServices.Marshal]::Copy($bytesS, 0, $r2.Scan0, $bytesS.Length)
$selo.UnlockBits($r2)
$mascara.UnlockBits($r1)
$mascara.Dispose()

$selo.Save("$pasta\selo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$selo.Dispose()

# favicon: mesma imagem em 128 px
$selo2 = [System.Drawing.Bitmap]::FromFile("$pasta\selo.png")
$fav = New-Object System.Drawing.Bitmap -ArgumentList 128, 128
$fg = [System.Drawing.Graphics]::FromImage($fav)
$fg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$fg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$fg.DrawImage($selo2, 0, 0, 128, 128)
$fg.Dispose()
$fav.Save("$pasta\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$fav.Dispose(); $selo2.Dispose(); $src.Dispose()
Write-Output "OK selo.png e favicon.png gerados em $pasta"
