# Gera as fotos dos produtos do site HiT Outlet a partir dos candidatos baixados.
# Reexecutar somente se as fotos de origem (pasta temp) ainda existirem.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$base = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path "$base\assets")) { $base = "C:\Users\Bruno\Desktop\hit-outlet" }
$destino = "$base\assets\img\produtos"
New-Item -ItemType Directory -Force -Path $destino | Out-Null

function Save-Foto($src, $dest, $maxW, $q) {
  $img = [System.Drawing.Image]::FromFile($src)
  $w = $img.Width
  $h = $img.Height
  if ($img.Width -gt $maxW) {
    $ratio = $maxW / $img.Width
    $w = [int]$maxW
    $h = [int][math]::Round($img.Height * $ratio)
  }
  $bmp = New-Object System.Drawing.Bitmap -ArgumentList $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($img, 0, 0, $w, $h)
  $g.Dispose()
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
  $ps = New-Object System.Drawing.Imaging.EncoderParameters -ArgumentList 1
  $param = New-Object System.Drawing.Imaging.EncoderParameter -ArgumentList ([System.Drawing.Imaging.Encoder]::Quality), ([long]$q)
  $ps.Param[0] = $param
  $bmp.Save($dest, $enc, $ps)
  $bmp.Dispose()
  $img.Dispose()
}

$map = @{
  # Tênios
  "tenis-nike-free-run-vermelho" = @("$env:TEMP\hit-cand\00-1542291026.jpg")
  "tenis-nike-air-max-excee"     = @("$env:TEMP\hit-cand\01-1600185365.jpg")
  "tenis-casual-pastel"          = @("$env:TEMP\hit-cand\02-1595950653.jpg")
  "tenis-nike-downshifter"       = @("$env:TEMP\hit-cand\03-1606107557.jpg")
  "tenis-nike-air-force-crudo"   = @("$env:TEMP\hit-cand\04-1549298916.jpg")
  "tenis-jordan-1-mid"           = @("$env:TEMP\hit-cand\06-1552346154.jpg")
  "tenis-puma-rebound"           = @("$env:TEMP\hit-cand\07-1608231387.jpg")
  "tenis-cinza-rua"              = @("$env:TEMP\hit-cand\08-1491553895.jpg")
  "tenis-vans-ward-vinho"        = @("$env:TEMP\hit-cand\09-1525966222.jpg")
  "tenis-nike-air-force-branco"  = @("$env:TEMP\hit-cand\10-1600269452.jpg")
  "tenis-new-balance-530"        = @("$env:TEMP\hit-cand\11-1539185441.jpg")
  "tenis-nike-dunk-low"          = @("$env:TEMP\hit-cand\12-1584735175.jpg")
  "tenis-reebok-classic"         = @("$env:TEMP\hit-cand\13-1595341888.jpg")
  "tenis-new-balance-574"        = @("$env:TEMP\hit-cand\15-1465453869.jpg")
  "tenis-converse-chuck-70"      = @("$env:TEMP\hit-cand\16-1512374382.jpg")
  # Chinelos (origem: Unsplash, fotos rebaixadas para 1000px)
  #   nuvem: https://images.unsplash.com/photo-1704834310294-24c1694a7552
  #   preto: https://images.unsplash.com/photo-1724092130836-08579afc63a1
  "chinelo-slide-nuvem"        = @("$env:TEMP\hit-chinelo\h.jpg")
  "chinelo-slide-preto"        = @("$env:TEMP\hit-chinelo\f.jpg")
  # Camisetas
  "camiseta-basica-branca"       = @("$env:TEMP\hit-cand2\00-1521572163.jpg")
  "camiseta-grafica-preta"       = @("$env:TEMP\hit-cand2\01-1503341504.jpg")
  "camiseta-original-bege"       = @("$env:TEMP\hit-cand2\02-1576566588.jpg")
  "camiseta-preta-lisa"          = @("$env:TEMP\hit-cand2\03-1583743814.jpg")
  "camiseta-preta-basica"        = @("$env:TEMP\hit-cand2\04-1618354691.jpg")
  "camiseta-grafica-branca"      = @("$env:TEMP\hit-cand2\06-1527719327.jpg")
  "kit-camisetas-coloridas"      = @("$env:TEMP\hit-cand2\07-1562157873.jpg")
  "camiseta-branca-premium"      = @("$env:TEMP\hit-cand2\08-1586790170.jpg")
  "camiseta-branca-rua"          = @("$env:TEMP\hit-cand3\05-1571945153.jpg")
  # Calças e bermudas
  "calca-jeans-azul-claro"       = @("$env:TEMP\hit-cand2\15-1602293589.jpg")
  "calca-jeans-azul-escuro"      = @("$env:TEMP\hit-cand2\16-1624378439.jpg")
  "calca-jeans-retro"            = @("$env:TEMP\hit-cand3\07-1605518216.jpg")
  "chino-bege"                   = @("$env:TEMP\hit-cand2\13-1473966968.jpg")
  "calca-jeans-rasgada"          = @("$env:TEMP\hit-cand2\14-1541099649.jpg")
  "bermuda-jeans"                = @("$env:TEMP\hit-cand3\00-1591195853.jpg")
  "kit-jeans-classicos"          = @("$env:TEMP\hit-cand2\12-1542272604.jpg")
  "calca-jeans-retta-rua"        = @("$env:TEMP\hit-cand3\09-1516826957.jpg")
  # Jaquetas e moletons
  "jaqueta-couro-preta"          = @("$env:TEMP\hit-cand2\17-1551028719.jpg")
  "crewneck-branco"              = @("$env:TEMP\hit-cand2\19-1620799140.jpg")
  "moletom-capuz-laranja"        = @("$env:TEMP\hit-cand2\20-1509942774.jpg")
  "jaqueta-bomber-bege"          = @("$env:TEMP\hit-cand2\21-1591047139.jpg")
  "jaqueta-utilitaria-verde"     = @("$env:TEMP\hit-cand2\22-1544022613.jpg")
  "jaqueta-jeans"                = @("$env:TEMP\hit-cand2\23-1516257984.jpg")
  "moletom-preto-oversized"      = @("$env:TEMP\hit-cand2\18-1578681994.jpg")
  "jaqueta-jeans-escura"         = @("$env:TEMP\hit-cand3\17-1611312449.jpg")
  "jaqueta-bomber-preta"         = @("$env:TEMP\hit-cand3\12-1523398002.jpg")
}

$faltando = @()
foreach ($nome in $map.Keys) {
  foreach ($src in $map[$nome]) {
    if (-not (Test-Path $src)) { $faltando += $src; continue }
    Save-Foto $src "$destino\$nome.jpg" 1000 82
  }
}
if ($faltando.Count) { Write-Warning "Originais não encontrados: $($faltando -join ', ')" }

# Fotos maiores para banner e institucional
if (Test-Path "$env:TEMP\hit-cand3\16-1573612664.jpg") {
  Save-Foto "$env:TEMP\hit-cand3\16-1573612664.jpg" "$base\assets\img\loja.jpg" 1400 82
}
if (Test-Path "$env:TEMP\hit-cand3\10-1483721310.jpg") {
  Save-Foto "$env:TEMP\hit-cand3\10-1483721310.jpg" "$base\assets\img\campanha.jpg" 1400 82
}

Get-ChildItem $destino | Group-Object { $_.Name -replace '-\d+$','' } | Measure-Object | ForEach-Object { "Produtos com foto: $($_.Count)" }
