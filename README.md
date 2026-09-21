# Test Vocacional CHASIDE + Personalidad 16 tipos + Kuder — TeamGGM

Stack: **Astro 7 + React 19 + Tailwind 4 + libSQL** (SQLite local `file:data/chaside.db` / Turso). Node `22.19.0` (ver `.nvmrc`, `engines >=22.12.0`).

## Requisitos

```sh
nvm use 22.19.0   # o nvm use
npm install
cp .env.example .env  # opcional, solo si usas Turso
```

## Comandos

| Comando | Acción |
|---|---|
| `npm run dev` | Dev server `http://localhost:4321` (`astro dev --background` en este repo) |
| `npm run build` | Build producción (`output: server` + `@astrojs/node` standalone) |
| `npm run preview` | Preview build |
| `npm run test` | `vitest run` (jsdom) |
| `npm run test:watch` | Vitest watch |
| `npm run check` | `astro check` (requiere `typescript@^5.9`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Siembra 95 estudiantes de prueba (`seed.mjs`) |
| `npm run astro -- --help` | CLI Astro |

Gestión dev server en background: `astro dev stop` / `status` / `logs`.

## Estructura

```
src/
  pages/  index.astro  chaside.astro  personalidad.astro  kuder.astro  admin.astro  admin/login.astro  api/...
  components/ ChasideTest.tsx  PersonalidadTest.tsx  KuderTest.tsx  AdminGeneral.tsx ...
  data/ chaside.ts (98 Q + tablas CUESA)  personalidad.ts (60 Q)  kuder.ts (60 diadas)  scoring.ts ...
  lib/ db.ts  auth.ts (Knox SHA512)  admin.ts  users.ts
  tests/ *.test.ts(x)
docs/ database.md  versionado-espacio.md  chaside.md  personalidad.md  kuder.md
data/chaside.db  (ignorado en git, WAL)
```

## Tests

- **CHASIDE** 98 preguntas SÍ/NO, 7 áreas C-H-A-S-I-D-E (intereses 10 pts, aptitudes 4 pts). Tablas en `src/data/chaside.ts:239`.
- **Personalidad** 60 ítems Likert -3..3, 4 dimensiones EI/SN/TF/JP → 16 tipos + roles.
- **Kuder Forma C** 60 diadas ipsativo → 10 áreas EXT/MEC/CAL/CIE/PER/ART/LIT/MUS/SOC/OFI + verificación V.

Scoring: `src/data/scoring.ts` y `*Scoring.ts`, tests `src/tests/*.test.ts`.

## Base de datos

Modelo actual (`src/lib/db.ts:17`): `estudiantes` (persona UUID) + `chaside_resultados`/`personalidad_resultados`/`kuder_resultados` (JSON) + `preguntas` versionadas + `test_versiones` + `users`/`knox_authtoken`. Ver `docs/database.md` y `docs/versionado-espacio.md` para estimación de volumen (12k estudiantes / 10 años ~62 MB PG).

Init automático vía `initDb()` en cada API route. Seed con `npm run seed`.

## Deploy

`astro.config.mjs` `output: server` + `adapter: node({mode:"standalone"})` (corregido de `static`). Requiere `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` en producción o fallback a SQLite local.

## Docs

- [Astro routing](https://docs.astro.build/en/guides/routing/) · [Astro components](https://docs.astro.build/en/basics/astro-components/) · [Framework components](https://docs.astro.build/en/guides/framework-components/) · [Styling/Tailwind](https://docs.astro.build/en/guides/styling/)
