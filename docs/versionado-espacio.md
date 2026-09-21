# Espacio estimado por Test con Versionado — TeamGGM

> 600 estudiantes / semestre × 20 semestres = **12.000 aplicaciones por test en 10 años**  
> Si cada estudiante rinde los 3 tests → **36.000 aplicaciones totales** (12k ×3).  
> Motores: **PostgreSQL (UUID 16 B) / SQLite (TEXT 36 / BLOB 16)**.  
> Cédulas opcionales incluidas. Versionado: **3 versiones por test en 10 años** (v1 año 0, v2 año 4, v3 año 8).

---

## 1. Versionado

Para poder recalcular el baremo histórico, cada `pregunta` y cada `respuesta` debe quedar ligada a la versión del test vigente al momento de la aplicación.

### 1.1 Esquema (PostgreSQL)

```sql
CREATE TABLE test_versiones (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL CHECK (codigo IN ('CHASIDE','PERSONALIDAD','KUDER')),
  version INT NOT NULL, -- 1,2,3
  vigencia_desde TIMESTAMPTZ NOT NULL,
  activo BOOLEAN DEFAULT false,
  UNIQUE (codigo, version)
);

-- Preguntas versionadas (PK compuesta)
CREATE TABLE preguntas (
  test_codigo TEXT NOT NULL,
  version     INT NOT NULL REFERENCES test_versiones(version),
  pregunta_id SMALLINT NOT NULL, -- 1..98 / 1..60
  texto       TEXT NOT NULL,
  dimension   TEXT, -- EI/SN/TF/JP o area Kuder/CHASIDE
  direction   SMALLINT, -- solo personalidad
  PRIMARY KEY (test_codigo, version, pregunta_id)
);

-- Aplicación (cabecera por estudiante+test+versión)
CREATE TABLE aplicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES estudiantes(id),
  test_codigo TEXT NOT NULL,
  version INT NOT NULL,
  fecha_unix INTEGER NOT NULL,
  FOREIGN KEY (test_codigo, version) REFERENCES test_versiones(codigo, version)
);
-- Respuestas versionadas
CREATE TABLE respuestas (
  aplicacion_id UUID NOT NULL REFERENCES aplicaciones(id) ON DELETE CASCADE,
  pregunta_id SMALLINT NOT NULL,
  respuesta SMALLINT NOT NULL, -- CHASIDE/Kuder 0/1, Personalidad -3..3
  version INT NOT NULL,
  PRIMARY KEY (aplicacion_id, pregunta_id)
);
```

**SQLite** idéntico con `TEXT` para UUID y `STRICT`. Ventaja: `preguntas` conserva histórico; `respuestas` siempre apunta a la versión correcta.

> Alternativa simple sin tabla `aplicaciones`: añadir `version INT` a `estudiantes`/`respuestas` directamente. Se elige `aplicaciones` para desacoplar estudiante (persona) de cada rendición.

### 1.2 Overhead de versionado

- `preguntas`: 98/60 filas × versiones. 3 versiones × ~200 B = **~60 KB por test** (despreciable).
- `respuestas`: +2 B (`version SMALLINT`) por fila. **12k×98×2 B = 2,35 MB** extra solo para CHASIDE en 10 años.
- `aplicaciones`: 12k filas × ~48 B = **0,57 MB** por test.

---

## 2. Cálculo por Test (con UUIDv4 + cédulas opcionales)

Bases de la estimación previa (`docs/database.md:3`):
- Fila `aplicaciones` ≈ `estudiantes` ≈ **182 B** promedio (16 B UUID + nombres/correos + 1 cédula promedio + 27 B overhead + índice).
- Fila `respuestas` CHASIDE/Kuder (0/1) ≈ **46 B PG / 54 B SQLite-TEXT** (incluye UUID 16 B + pregunta 2 B + respuesta 1 B + header).
- Fila `respuestas` Personalidad (-3..3) = mismo 46 B (SMALLINT 2 B).
- Índice `idx_fecha` y `idx_pregunta` ≈ +25%.

### 2.1 CHASIDE — 98 preguntas / 98 respuestas por aplicación

| Nivel (por CHASIDE) | Aplicaciones | Respuestas | Aplicaciones (182 B) | Respuestas (46 B) | Subtotal | +Índ/versión (+2 B/resp) | **Total PG** | SQLite TEXT 36 (+8 B) |
|---|---|---|---|---|---|---|---|
| 1 semestre (600) | 600 | 58.800 | 0,11 MB | 2,70 MB | 2,81 MB | 2,92 MB | **~3,1 MB** | **~3,9 MB** |
| 1 año (1.200) | 1.200 | 117.600 | 0,22 MB | 5,41 MB | 5,63 MB | 5,85 MB | **~6,1 MB** | **~7,8 MB** |
| **10 años (12.000)** | 12.000 | 1.176.000 | 2,18 MB | 54,10 MB | 56,28 MB | 58,63 MB | **~62 MB** | **~78 MB** |
| + 3 versiones preguntas | — | — | — | — | +0,06 MB | — | **~62 MB** | **~78 MB** |

> Sin versionado: ~60 MB PG (cap. anterior). Con versionado +2 B: **~62 MB**.

### 2.2 Personalidad 16 tipos — 60 preguntas / 60 respuestas (Likert -3..3)

Más liviano: 60 vs 98 (-38%).

| Nivel | Aplicaciones | Respuestas | Respuestas (46 B) | **Total PG** | **SQLite TEXT** |
|---|---|---|---|---|---|
| 1 semestre (600) | 600 | 36.000 | 1,66 MB | **~2,0 MB** | **~2,6 MB** |
| 10 años (12.000) | 12.000 | 720.000 | 33,11 MB | **~38 MB** | **~48 MB** |

Versión +2 B/resp: +1,44 MB en 10 años → **~39,5 MB PG**.

### 2.3 Kuder Forma C — 60 diadas / 60 respuestas (a/b → 0/1)

Idéntico a Personalidad en volumen (60 respuestas).

| Nivel | Respuestas | **Total PG** | **SQLite TEXT** |
|---|---|---|---|
| 1 semestre (600) | 36.000 | **~2,0 MB** | **~2,6 MB** |
| **10 años (12.000)** | 720.000 | **~38 MB** | **~48 MB** |

### 2.4 Resumen por test (10 años, PG UUID 16 B, con versionado)

| Test | Preguntas (3 vers.) | Respuestas | Aplicaciones | **Total 10 años PG** | **Total SQLite TEXT 36** | **Total SQLite BLOB 16** |
|---|---|---|---|---|---|---|
| **CHASIDE** (98) | 0,06 MB | 56,45 MB | 2,18 MB | **~62 MB** | **~78 MB** | **~53 MB** |
| **Personalidad** (60) | 0,04 MB | 34,55 MB | 2,18 MB | **~39,5 MB** | **~50 MB** | **~34 MB** |
| **Kuder** (60) | 0,04 MB | 34,55 MB | 2,18 MB | **~39,5 MB** | **~50 MB** | **~34 MB** |

---

## 3. Total combinado (si cada estudiante rinde los 3 tests)

Asumiendo mismos 12.000 estudiantes rinden **los 3 tests** (36.000 aplicaciones, 2.616.000 respuestas):

- **PostgreSQL UUID 16 B con versionado:** 62 + 39,5 + 39,5 = **~141 MB datos + índices → ~175 MB en disco con WAL**.
- **SQLite TEXT 36:** ~78+50+50 = **~178 MB → ~220 MB con WAL**.
- **SQLite BLOB 16 optimizado:** ~53+34+34 = **~121 MB → ~150 MB**.

Si **solo CHASIDE** se usa (caso actual): **~62 MB PG / ~78 MB SQLite** en 10 años (menos que un video de 2 min).

Sin versionado (sin columna `version`): **-3,8 MB** (2 B ×2,6M filas) — ahorro <3%.

Si 600/año (300/semestre) en vez de 600/semestre → **mitad**: CHASIDE ~31 MB, 3 tests ~70 MB PG.

---

## 4. Recomendación

- **Provisionar por test:**
  - CHASIDE solo: **200 MB** (3× holgura para binlogs/backups).
  - 3 tests con versionado: **500 MB PG / 700 MB SQLite-TEXT** (incluye backups, índices y 3 versiones).
- **Para 20 GB de VPS:** 3 tests en 10 años ocupan **<1%** (PG) / **<1,1%** (SQLite).
- **Estrategia versionado:** mantener `test_versiones` + `preguntas` PK `(codigo, version, id)` y `respuestas` con `version`. Al cambiar un test, insertar nueva versión y clonar preguntas modificadas; nunca `UPDATE` histórico. Consultas históricas filtran por `version`.
- **Cédulas opcionales:** impacto <5% (11 B por cédula). No afecta dimensionamiento.
- **SQLite producción:** usar `BLOB 16` para UUID si se superan 50k aplicaciones; si no, `TEXT 36` por simplicidad.

*Fuente preguntas: `src/data/chaside.ts` (98), `src/data/personalidad.ts` (60), `src/data/kuder.ts` (60 diadas). Baremo en `*Scoring.ts`.*
