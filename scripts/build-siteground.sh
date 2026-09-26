#!/usr/bin/env bash
# Empaqueta el build de Astro para desplegar en SiteGround (Node.js App).
# Contenido del zip: dist/ completo + package.json + package-lock.json + .env.example
# Uso: bash scripts/build-siteground.sh [--skip-build]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEPLOY_DIR="$ROOT/siteground-deploy"
ZIP_PATH="$ROOT/deploy-siteground.zip"
SKIP_BUILD=false
[[ "${1:-}" == "--skip-build" ]] && SKIP_BUILD=true

echo "==> Raiz del proyecto: $ROOT"

if [ "$SKIP_BUILD" != true ]; then
  echo "==> Ejecutando: npm run build"
  npm run build
fi

if [ ! -d "$ROOT/dist" ]; then
  echo "ERROR: no existe dist/. Ejecuta el build primero (o sin --skip-build)." >&2
  exit 1
fi

rm -f "$ZIP_PATH"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

echo "==> Copiando dist/ + manifest de npm al staging"
cp -R "$ROOT/dist" "$DEPLOY_DIR/dist"
cp "$ROOT/package.json" "$DEPLOY_DIR/package.json"
[ -f "$ROOT/package-lock.json" ] && cp "$ROOT/package-lock.json" "$DEPLOY_DIR/package-lock.json"
[ -f "$ROOT/.env.example" ] && cp "$ROOT/.env.example" "$DEPLOY_DIR/.env.example"

echo "==> Comprimiendo en deploy-siteground.zip"
if command -v zip >/dev/null 2>&1; then
  (cd "$DEPLOY_DIR" && zip -qr "$ZIP_PATH" .)
else
  echo "    'zip' no esta instalado, usando tar.gz como alternativa." >&2
  tar -czf "${ZIP_PATH%.zip}.tar.gz" -C "$DEPLOY_DIR" .
fi

echo "==> Eliminando staging temporal"
rm -rf "$DEPLOY_DIR"

echo "==> Listo: $ZIP_PATH ($(du -h "$ZIP_PATH" 2>/dev/null | cut -f1))"
echo "    En SiteGround: subir el zip, descomprimir, ejecutar 'npm ci --omit=dev' y arrancar 'node dist/server/entry.mjs'."
