#!/usr/bin/env powershell
# Empaqueta el build de Astro para desplegar en SiteGround (Node.js App).
# Contenido del zip: dist/ completo + package.json + package-lock.json + .env.example
# Uso: powershell -ExecutionPolicy Bypass -File scripts\build-siteground.ps1
#      powershell -ExecutionPolicy Bypass -File scripts\build-siteground.ps1 -SkipBuild

param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$deployDir = Join-Path $root "siteground-deploy"
$zipPath = Join-Path $root "deploy-siteground.zip"

Write-Host "==> Raiz del proyecto: $root"

if (-not $SkipBuild) {
  Write-Host "==> Ejecutando: npm run build"
  & npm run build
  if ($LASTEXITCODE -ne 0) { throw "El build fallo (exit $LASTEXITCODE)" }
}

if (-not (Test-Path (Join-Path $root "dist"))) {
  throw "No existe dist/. Ejecuta el build primero (o sin -SkipBuild)."
}

# Limpieza de empaquetados anteriores
if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
if (Test-Path $deployDir) { Remove-Item -LiteralPath $deployDir -Recurse -Force }
New-Item -ItemType Directory -Path $deployDir | Out-Null

Write-Host "==> Copiando dist/ + manifest de npm al staging"
Copy-Item -LiteralPath (Join-Path $root "dist") -Destination (Join-Path $deployDir "dist") -Recurse
Copy-Item -LiteralPath (Join-Path $root "package.json") -Destination (Join-Path $deployDir "package.json")
if (Test-Path (Join-Path $root "package-lock.json")) {
  Copy-Item -LiteralPath (Join-Path $root "package-lock.json") -Destination (Join-Path $deployDir "package-lock.json")
}
if (Test-Path (Join-Path $root ".env.example")) {
  Copy-Item -LiteralPath (Join-Path $root ".env.example") -Destination (Join-Path $deployDir ".env.example")
}

Write-Host "==> Comprimiendo en deploy-siteground.zip (Compress-Archive)"
Compress-Archive -Path (Join-Path $deployDir "*") -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "==> Eliminando staging temporal"
Remove-Item -LiteralPath $deployDir -Recurse -Force

$size = "{0:N1} MB" -f ((Get-Item $zipPath).Length / 1MB)
Write-Host "==> Listo: $zipPath ($size)"
Write-Host "    En SiteGround: subir el zip, descomprimir, ejecutar 'npm ci --omit=dev' y arrancar 'node dist/server/entry.mjs'."
