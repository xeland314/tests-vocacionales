# Despliegue en SiteGround con MySQL

## 1. Crear la base de datos en SiteGround

1. **Site Tools → Site → MySQL Manager → Databases**: crea la base (p. ej. `sguser_chaside`).
2. **→ Users**: crea un usuario y asígnalo a la base con **ALL PRIVILEGES**.
3. Anota host ( normalmente `localhost` dentro de SiteGround), usuario (`sguser_xxx`), password y nombre de BD.

SiteGround solo da acceso remoto por SSH; la app Node corrige el resto por variables de entorno.

## 2. Variables de entorno (`.env` en producción)

```
MYSQL_HOST=localhost            # o remote.mysql.host si el Node corre fuera de SiteGround
MYSQL_PORT=3306
MYSQL_USER=sguser_chaside
MYSQL_PASSWORD=••••••
MYSQL_DATABASE=sguser_chaside
# o todo en uno:
# MYSQL_URL=mysql://sguser_chaside:password@localhost:3306/sguser_chaside
```

## 3. Esquema

El esquema se crea automáticamente al arrancar la app (`initDb()` idempotente,
en `src/server/db/`). Alternativa manual: ejecutar el SQL de
`src/server/db/schema.ts` (DDL_STATEMENTS) desde phpMyAdmin.

## 4. Migrar datos existentes de SQLite (opcional)

```
npm run build
node scripts/migrate-sqlite-to-mysql.mjs data/chaside.db
```

Idempotente: re-ejecutar no duplica filas (INSERT IGNORE por PK).

## 5. Arquitectura (DDD)

```
src/
├── server/                     ← backend (DDD)
│   ├── db/                     ← infraestructura: pool mysql2, esquema, init
│   │   ├── mysql.ts            (adaptador API-compatible con libsql)
│   │   ├── schema.ts           (DDL MySQL)
│   │   ├── index.ts            (initDb, db, seed preguntas, bootstrap admin)
│   │   └── questionsLoader.ts  (puente al banco de preguntas)
│   └── modules/                ← bounded contexts
│       ├── identity/           ( usuarios, roles, tokens Knox )
│       ├── testing/            ( estudiantes, resultados, reintentos, diffs )
│       ├── admin-panel/        ( reportes/overview, respaldo )
│       └── moodle-integration/ ( config cmids/course_id )
├── client/                     ← utilidades de navegador (pdf, moodle bridge, icons, seo)
├── pages/api/                  ← endpoints HTTP: solo orquestan módulos
└── data/                       ← dominio puro del contenido (preguntas, scoring)
```

Los antiguos `src/lib/{db,auth,users,admin,reintentos,adminViewTokens,moodleConfig}.ts`
fueron absorbidos por `src/server`. `src/lib/{icons,seo,pdf,anonGate,moodle}.ts`
(cliente) ahora viven en `src/client/`.

## 6. Comandos

- `npm run dev` — desarrollo
- `npm run build && node dist/server/entry.mjs` — producción (adapter node standalone)
- `npm run seed` — crear admin inicial
- `npm test` — vitest
- `npm run typecheck` — tsc --noEmit

### Nota sobre SSH en SiteGround

SiteGround ejecuta Node apps con Passenger. Configure el `Application startup file`
al entry de Astro (`dist/server/entry.mjs`) y exponga `PORT` si Passenger lo exige.
La BD MySQL es interna (localhost) — no requiere SSL.
