# HiT Outlet - servidor local para desenvolvimento
# Uso: powershell -ExecutionPolicy Bypass -File .\server.ps1  [porta]  (padrao 8080)
param([int]$Porta = 8080)

$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $raiz) { $raiz = (Get-Location).Path }

Write-Host ("HiT Outlet - servindo " + $raiz + " em http://localhost:" + $Porta) -ForegroundColor Red
Write-Host "Pressione Ctrl+C para parar."

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
  '.ttf'  = 'font/ttf'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:" + $Porta + "/")
$listener.Start()

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $caminho = [Uri]::UnescapeDataString($ctx.Request.Url.LocalPath).TrimStart('/')
    if (-not $caminho) { $caminho = 'index.html' }
    $arquivo = Join-Path $raiz $caminho
    if (Test-Path $arquivo -PathType Container) { $arquivo = Join-Path $arquivo 'index.html' }

    if (Test-Path $arquivo -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($arquivo).ToLower()
      if ($mime.ContainsKey($ext)) { $tipo = $mime[$ext] } else { $tipo = 'application/octet-stream' }
      $bytes = [IO.File]::ReadAllBytes($arquivo)
      $ctx.Response.StatusCode = 200
      $ctx.Response.ContentType = $tipo
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $msg = [Text.Encoding]::UTF8.GetBytes('<h1>404 - nao encontrado</h1>')
      $ctx.Response.StatusCode = 404
      $ctx.Response.ContentType = 'text/html; charset=utf-8'
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $ctx.Response.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
