# Especificación de Base de Datos — Test Vocacional TeamGGM

> Volumen objetivo: **600 estudiantes cada 6 meses durante 10 años = 12.000 estudiantes**  
> Motores: **PostgreSQL 15+ / SQLite 3.45+** — únicos soportados.  
> PK estudiante: **UUIDv4 (TEXT 36 / BLOB 16)**.  
> Fecha encuesta: **UNIX timestamp (INTEGER)**.  
> Cédulas: **opcionales** (estudiante y representante).  
> **Modelo vigente (2026-02):** persona única + resultados JSON versionados. Ver `src/lib/db.ts:17`.

---

## 1. Modelo vigente

### 1.1 Entidades

```
estudiantes 1 ──< chaside_resultados
            1 ──< personalidad_resultados
            1 ──< kuder_resultados
            1 ──< preguntas (catálogo versionado)
test_versiones 1 ──< preguntas
users 1 ──< knox_authtoken
```

- `estudiantes`: **persona única** (no 1 fila por aplicación). PK = UUIDv4. Datos personales + cédulas opcionales. Sin `fecha_unix` por test; cada test tiene su `fecha_unix` en su tabla de resultados.
- `preguntas`: catálogo **versionado** PK `(test_codigo, version, pregunta_id)`. 98 CHASIDE + 60 Personalidad + 60 Kuder por versión. Se carga una vez en `initDb()`.
- `test_versiones`: `(codigo, version)` con `vigencia_desde` y `activo`. Inserta `CHASIDE v1`, `PERSONALIDAD v1`, `KUDER v1` al iniciar.
- `chaside_resultados` / `personalidad_resultados` / `kuder_resultados`: **1 fila JSON por aplicación** (no 98 filas). Guarda `respuestas_json` + scores serializados + `top_*` + `fecha_unix` + `version`.
- `users` + `knox_authtoken`: auth Knox SHA512 (token 64 chars, TTL 10h) — ver `src/lib/auth.ts`.

Este modelo reemplaza al **legado normalizado** `respuestas(estudiante_id, pregunta_id, respuesta)` con PK compuesta y 98 filas por estudiante. El legado se documenta en §8 como apéndice y fue migrado en `src/lib/db.ts:22` (DROP si `test_codigo` legacy detectado).

### 1.2 Diagrama vigente

```
┌──────────────────┐       ┌─────────────────────────┐
│ test_versiones   │       │ preguntas               │
├──────────────────┤       ├─────────────────────────┤
│ PK id            │  ┌───>│ PK (test_codigo,        │
│ codigo CHASIDE/  │  │    │     version, pregunta_id)│
│   PERSONALIDAD/  │──┘    │ texto TEXT              │
│   KUDER          │       └─────────────────────────┘
│ version INT      │
│ vigencia_desde   │
│ activo BOOL      │
└──────────────────┘

┌──────────────────┐       ┌─────────────────────────┐       ┌──────────────────────┐
│ estudiantes      │       │ chaside_resultados      │       │ personalidad_result. │
├──────────────────┤       ├─────────────────────────┤       ├──────────────────────┤
│ PK id UUID       │<──────│ FK estudiante_id        │       │ FK estudiante_id     │
│ nombre_est TEXT  │       │ fecha_unix INT          │       │ fecha_unix INT       │
│ nombre_padre TEXT│       │ version INT             │       │ version INT          │
│ correo_est TEXT  │       │ top_interes TEXT        │       │ tipo TEXT (INTJ…)   │
│ correo_padre TEXT│       │ segundo_interes TEXT    │       │ dimensiones_json TEXT│
│ cedula_est NULL  │       │ top_aptitud TEXT        │       │ percentages_json TEXT│
│ cedula_repr NULL │       │ intereses_json TEXT     │       │ respuestas_json TEXT │
│ created_at INT   │       │ aptitudes_json TEXT     │       └──────────────────────┘
└──────────────────┘       │ respuestas_json TEXT    │       ┌──────────────────────┐
                           └─────────────────────────┘       │ kuder_resultados     │
┌──────────────┐           ┌──────────────────────┐          ├──────────────────────┤
│ users        │           │ knox_authtoken       │          │ FK estudiante_id     │
├──────────────┤           ├──────────────────────┤          │ fecha_unix INT       │
│ PK id UUID   │<──────────│ FK user_id           │          │ version INT          │
│ email UNIQUE │           │ digest PK (SHA512)   │          │ top TEXT             │
│ password_hash│           │ token_key TEXT(8)    │          │ ranking_json TEXT    │
│ first_name   │           │ created INT          │          │ scores_json TEXT     │
│ last_name    │           │ expiry INT           │          │ respuestas_json TEXT │
│ is_active    │           └──────────────────────┘          │ verificacion TEXT    │
│ created_at   │                                             └──────────────────────┘
└──────────────┘
```

---

## 2. DDL vigente (`src/lib/db.ts`)

### 2.1 PostgreSQL (producción)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE test_versiones (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL CHECK (codigo IN ('CHASIDE','PERSONALIDAD','KUDER')),
  version INT NOT NULL,
  vigencia_desde TIMESTAMPTZ NOT NULL,
  activo BOOLEAN DEFAULT false,
  UNIQUE (codigo, version)
);
INSERT INTO test_versiones (codigo, version, vigencia_desde, activo) VALUES
  ('CHASIDE',1,'2026-01-01',true), ('PERSONALIDAD',1,'2026-01-01',true), ('KUDER',1,'2026-01-01',true);

CREATE TABLE estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_estudiante VARCHAR(100) NOT NULL,
  nombre_padre VARCHAR(100),
  correo_estudiante VARCHAR(100),
  correo_padre VARCHAR(100),
  cedula_estudiante VARCHAR(10) NULL CHECK (cedula_estudiante ~ '^[0-9]{10}$' OR cedula_estudiante IS NULL),
  cedula_representante VARCHAR(10) NULL CHECK (cedula_representante ~ '^[0-9]{10}$' OR cedula_representante IS NULL),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_estudiantes_created ON estudiantes(created_at);

CREATE TABLE preguntas (
  test_codigo TEXT NOT NULL,
  version INT NOT NULL,
  pregunta_id SMALLINT NOT NULL,
  texto VARCHAR(280) NOT NULL,
  PRIMARY KEY (test_codigo, version, pregunta_id),
  FOREIGN KEY (test_codigo, version) REFERENCES test_versiones(codigo, version)
);

CREATE TABLE chaside_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  fecha_unix INTEGER NOT NULL,
  version INT NOT NULL DEFAULT 1,
  top_interes TEXT NOT NULL,
  segundo_interes TEXT,
  top_aptitud TEXT NOT NULL,
  intereses_json TEXT NOT NULL,   -- {"C":7,"H":2,...}
  aptitudes_json TEXT NOT NULL,   -- {"C":3,"H":1,...}
  respuestas_json TEXT NOT NULL,  -- {"1":true,"2":false,...98}
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_chaside_est ON chaside_resultados(estudiante_id);
CREATE INDEX idx_chaside_fecha ON chaside_resultados(fecha_unix);

CREATE TABLE personalidad_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  fecha_unix INTEGER NOT NULL,
  version INT NOT NULL DEFAULT 1,
  tipo TEXT NOT NULL, -- INTJ..ESFP
  dimensiones_json TEXT NOT NULL, -- {EI:{raw,percent,letter}...}
  percentages_json TEXT NOT NULL,
  respuestas_json TEXT NOT NULL,  -- {"1":-3,..."60":3}
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_pers_est ON personalidad_resultados(estudiante_id);
CREATE INDEX idx_pers_tipo ON personalidad_resultados(tipo);

CREATE TABLE kuder_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  fecha_unix INTEGER NOT NULL,
  version INT NOT NULL DEFAULT 1,
  top TEXT NOT NULL, -- EXT..OFI
  ranking_json TEXT NOT NULL,
  scores_json TEXT NOT NULL,
  respuestas_json TEXT NOT NULL, -- {"1":"a","2":"b"...}
  verificacion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_kuder_est ON kuder_resultados(estudiante_id);
CREATE INDEX idx_kuder_top ON kuder_resultados(top);

-- Auth Knox
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE knox_authtoken (
  digest TEXT PRIMARY KEY, -- SHA512 hex 128
  token_key VARCHAR(8) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created INTEGER NOT NULL,
  expiry INTEGER NOT NULL
);
CREATE INDEX idx_knox_user ON knox_authtoken(user_id);
CREATE INDEX idx_knox_expiry ON knox_authtoken(expiry);
```

### 2.2 SQLite (desarrollo / edge — `src/lib/db.ts:17`)

```sql
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE test_versiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL CHECK (codigo IN ('CHASIDE','PERSONALIDAD','KUDER')),
  version INTEGER NOT NULL,
  vigencia_desde INTEGER NOT NULL,
  activo INTEGER NOT NULL DEFAULT 0,
  UNIQUE(codigo, version)
) STRICT;

CREATE TABLE estudiantes (
  id TEXT PRIMARY KEY,
  nombre_estudiante TEXT NOT NULL,
  nombre_padre TEXT,
  correo_estudiante TEXT,
  correo_padre TEXT,
  cedula_estudiante TEXT CHECK (cedula_estudiante IS NULL OR length(cedula_estudiante)=10),
  cedula_representante TEXT CHECK (cedula_representante IS NULL OR length(cedula_representante)=10),
  created_at INTEGER DEFAULT (unixepoch())
) STRICT;

CREATE TABLE preguntas (
  test_codigo TEXT NOT NULL,
  version INTEGER NOT NULL,
  pregunta_id INTEGER NOT NULL,
  texto TEXT NOT NULL,
  PRIMARY KEY (test_codigo, version, pregunta_id)
) STRICT;

CREATE TABLE chaside_resultados (
  id TEXT PRIMARY KEY,
  estudiante_id TEXT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  fecha_unix INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  top_interes TEXT NOT NULL,
  segundo_interes TEXT,
  top_aptitud TEXT NOT NULL,
  intereses_json TEXT NOT NULL,
  aptitudes_json TEXT NOT NULL,
  respuestas_json TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
) STRICT;

-- personalidad_resultados y kuder_resultados idénticos a PG con TEXT
-- users / knox_authtoken idénticos a PG con TEXT
```

> UUID en SQLite: `TEXT 36` (debug-friendly) vs `BLOB 16` ahorra ~20 B/fila.

---

## 3. Tamaño por fila (modelo JSON vigente)

### 3.1 Estudiantes (igual que antes)

- Sin cédula: **~143 B PG / ~151 B SQLite** (+ índice ~28/20 B) → **~171 B**
- Con 2 cédulas: **~193 B**
- Promedio 1 cédula: **~182 B** — pesimista 50 car → **~252 B**

### 3.2 Resultados (1 fila JSON por aplicación, no 98)

| Tabla | Campos JSON | Tamaño estimado fila |
|---|---|---|
| `chaside_resultados` | `respuestas_json` ~800 B (98 bools) + `intereses/aptitudes` ~80 B + 5×UUID/text + header 27 B | **~1.1 KB PG / ~1.2 KB SQLite-TEXT** |
| `personalidad_resultados` | 60 ints -3..3 ~400 B + `dimensiones/percentages` ~300 B | **~0.9 KB** |
| `kuder_resultados` | 60 a/b ~300 B + `ranking/scores` ~200 B | **~0.8 KB** |
| `preguntas` | 98+60+60 filas × ~200 B | **~44 KB total** (despreciable) |

Vs legado `respuestas` 98 filas ×46 B = **~4.5 KB por CHASIDE** → JSON ahorra **~4×**.

### 3.3 Índices

Solo `idx_*_est` + `idx_*_fecha/tipo/top` + `idx_estudiantes_created`. Sin índice por pregunta (no hay tabla `respuestas`).

---

## 4. Volumen total vigente (600/semestre × 20 semestres = 12.000 estudiantes)

### 4.1 Solo CHASIDE (caso histórico)

| Nivel | Estudiantes (182 B) | chaside_resultados (~1.1 KB) | **Total PG** | **SQLite TEXT** |
|---|---|---|---|---|
| 1 semestre (600) | 0,11 MB | 0,66 MB | **~0,96 MB** (+25% índices → ~1,2 MB) | **~1,4 MB** |
| 1 año (1.200) | 0,22 MB | 1,32 MB | **~1,9 MB** | **~2,8 MB** |
| **10 años (12.000)** | 2,18 MB | 13,2 MB | **~15,4 MB → ~19 MB con índices/WAL** | **~22 MB** |

Legado `respuestas`: ~70 MB → **ahorro ~70%**.

### 4.2 Personalidad (60 Q) y Kuder (60 diadas)

| Test | 12.000 filas ×0.9/0.8 KB | 10 años PG |
|---|---|---|
| Personalidad | 10,8 MB | **~13,5 MB** |
| Kuder | 9,6 MB | **~12 MB** |

### 4.3 Los 3 tests combinados (12.000 estudiantes × 3 = 36.000 aplicaciones)

- **PG UUID 16 B:** 2,18 +13,2+10,8+9,6 = **35,8 MB → ~45 MB con índices/WAL**
- **SQLite TEXT 36:** **~50 MB → ~65 MB con WAL**
- **SQLite BLOB 16:** **~42 MB**

> Un semestre (600×3): **~2,1 MB PG**. **Provisionar 300 MB** cubre 10 años + backups + 3 versiones.

Ver `docs/versionado-espacio.md` para detalle con versionado (overhead +2 B por fila si se añade `version` — ya incluido en el esquema vigente).

---

## 5. Consultas vigentes

```sql
-- Top CHASIDE de un estudiante (ya agregado, sin baremo SQL)
SELECT top_interes, segundo_interes, top_aptitud, intereses_json, aptitudes_json
FROM chaside_resultados WHERE estudiante_id = :uuid ORDER BY fecha_unix DESC LIMIT 1;

-- Si se necesitara baremo SQL puro (compatibilidad legado), usar json_extract:
SELECT json_extract(respuestas_json, '$.1') FROM chaside_resultados WHERE id=:id;

-- Cohorte mensual (por test)
SELECT date(fecha_unix,'unixepoch','start of month') AS mes, COUNT(*) 
FROM chaside_resultados GROUP BY mes ORDER BY mes;

-- Stats agregados (usadas en src/lib/admin.ts:56)
SELECT top_interes, COUNT(*) FROM chaside_resultados GROUP BY top_interes;
SELECT tipo, COUNT(*) FROM personalidad_resultados GROUP BY tipo;
```

---

## 6. Migración desde legado

`src/lib/db.ts:21` detecta `hasColumn("estudiantes","test_codigo")` (legado tenía `test_codigo + fecha_unix` por fila). Si existe, hace `DROP TABLE respuestas, estudiantes` y recrea. No hay migración de datos (entorno dev).

Si necesitas migrar datos reales: `INSERT INTO estudiantes (id, nombre...) SELECT DISTINCT estudiante_id,... FROM respuestas` + `INSERT INTO chaside_resultados SELECT ... json_group_object(pregunta_id, respuesta)`.

---

## 7. Optimizaciones vigentes

1. **1 fila JSON vs 98 filas:** -70% espacio + 1 INSERT vs 98.
2. **UUID TEXT 36** para debug; **BLOB 16** si >50k aplicaciones.
3. **Versionado** ya en `version INT` por resultado + `test_versiones` + `preguntas` PK compuesta. Alternativa `aplicaciones` tabla intermedia no necesaria (simplificado).
4. **Índices mínimos:** solo `estudiante_id` y `fecha/tipo`. No `pregunta_id`.
5. **WAL + foreign_keys ON** obligatorio.

---

## 8. Apéndice — Modelo legado deprecated (pre-2026-02)

> Se mantiene solo como referencia histórica para entender `docs/versionado-espacio.md:1.1` alternativa `aplicaciones/respuestas`.

```
estudiantes 1 ──< respuestas >── 1 preguntas   (98 filas por estudiante)
```

DDL legado y cálculos de 55–70 MB / 10 años se conservan en git history (`git show HEAD~1:docs/database.md`). No usar para nuevas implementaciones. Fuente preguntas/baremo: `src/data/chaside.ts` (CUESA 1998).
