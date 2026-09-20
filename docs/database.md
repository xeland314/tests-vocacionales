# Especificación de Base de Datos — Test CHASIDE TeamGGM

> Volumen objetivo: **600 estudiantes cada 6 meses durante 10 años = 12.000 estudiantes**  
> Motores: **PostgreSQL 15+ / SQLite 3.45+** — únicos soportados.  
> PK estudiante: **UUIDv4**.  
> Fecha encuesta: **UNIX timestamp (INTEGER)**.  
> Cédulas: **opcionales** (estudiante y representante).

---

## 1. Modelo

### 1.1 Entidades

```
estudiantes 1 ──< respuestas >── 1 preguntas
```

- `preguntas`: catálogo fijo de 98 preguntas (id 1..98), se carga una vez.
- `estudiantes`: 1 fila por aplicación del test. PK = UUIDv4.
- `respuestas`: 98 filas por estudiante (1 por pregunta). PK compuesta, sin surrogate.

### 1.2 Diagrama

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────────┐
│  preguntas   │       │  respuestas  │       │ estudiantes          │
├──────────────┤       ├──────────────┤       ├──────────────────────┤
│ PK id INTEGER│<──────│ FK pregunta  │       │ PK id UUID           │
│ texto TEXT   │       │ FK estudiante│──────>│ nombre_est  TEXT     │
└──────────────┘       │ respuesta INT│       │ nombre_padre TEXT    │
                       │ PK(est,preg) │       │ correo_est  TEXT     │
                       └──────────────┘       │ correo_padre TEXT    │
                                              │ cedula_est TEXT NULL │
                                              │ cedula_repr TEXT NULL│
                                              │ fecha_unix INTEGER   │
                                              └──────────────────────┘
```

- Cédulas opcionales → `NULL` permitido. Se valida en app (Ecuador: 10 dígitos), no `NOT NULL`.
- `fecha_unix` = `strftime('%s','now')` (SQLite) / `extract(epoch from now())` (Postgres).

---

## 2. DDL

### 2.1 PostgreSQL (recomendado producción)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

CREATE TABLE preguntas (
  id SMALLINT PRIMARY KEY CHECK (id BETWEEN 1 AND 98),
  texto VARCHAR(280) NOT NULL
);

CREATE TABLE estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 16 bytes binario
  nombre_estudiante VARCHAR(100) NOT NULL,
  nombre_padre      VARCHAR(100) NOT NULL,
  correo_estudiante VARCHAR(100) NOT NULL,
  correo_padre      VARCHAR(100) NOT NULL,
  cedula_estudiante VARCHAR(10) NULL CHECK (cedula_estudiante ~ '^[0-9]{10}$' OR cedula_estudiante IS NULL),
  cedula_representante VARCHAR(10) NULL CHECK (cedula_representante ~ '^[0-9]{10}$' OR cedula_representante IS NULL),
  fecha_unix        INTEGER NOT NULL, -- s desde 1970, hasta 2038/2106 con INT; usa BIGINT si necesitas ms
  created_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_estudiantes_fecha ON estudiantes (fecha_unix);
-- Opcional: índice parcial para cédulas no nulas
-- CREATE INDEX idx_est_cedula ON estudiantes (cedula_estudiante) WHERE cedula_estudiante IS NOT NULL;

CREATE TABLE respuestas (
  estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  pregunta_id   SMALLINT NOT NULL REFERENCES preguntas(id),
  respuesta     SMALLINT NOT NULL CHECK (respuesta IN (0,1)), -- 0=NO,1=SÍ
  PRIMARY KEY (estudiante_id, pregunta_id)
);
CREATE INDEX idx_respuestas_pregunta ON respuestas (pregunta_id);

-- FK estricta a dominio 0/1 (opcional, si se exige literal "foreing key de respuesta"):
-- CREATE TABLE dominio_respuesta (id SMALLINT PRIMARY KEY, label TEXT);
-- INSERT INTO dominio_respuesta VALUES (0,'NO'),(1,'SÍ');
-- ALTER TABLE respuestas ADD CONSTRAINT fk_resp_dom FOREIGN KEY (respuesta) REFERENCES dominio_respuesta(id);
```

### 2.2 SQLite (desarrollo / edge / offline)

```sql
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE preguntas (
  id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 98),
  texto TEXT NOT NULL
) STRICT;

CREATE TABLE estudiantes (
  id TEXT PRIMARY KEY, -- UUIDv4 texto 36 car "xxxxxxxx-xxxx-4xxx-..."; o BLOB 16 para ahorrar
  -- Recomendado generar en app (crypto.randomUUID()) y guardar como TEXT 36
  nombre_estudiante TEXT NOT NULL,
  nombre_padre      TEXT NOT NULL,
  correo_estudiante TEXT NOT NULL,
  correo_padre      TEXT NOT NULL,
  cedula_estudiante TEXT CHECK (cedula_estudiante IS NULL OR length(cedula_estudiante)=10),
  cedula_representante TEXT CHECK (cedula_representante IS NULL OR length(cedula_representante)=10),
  fecha_unix        INTEGER NOT NULL,
  created_at        INTEGER DEFAULT (unixepoch())
) STRICT;
CREATE INDEX idx_estudiantes_fecha ON estudiantes(fecha_unix);

CREATE TABLE respuestas (
  estudiante_id TEXT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  pregunta_id   INTEGER NOT NULL REFERENCES preguntas(id),
  respuesta     INTEGER NOT NULL CHECK (respuesta IN (0,1)),
  PRIMARY KEY (estudiante_id, pregunta_id)
) STRICT;
CREATE INDEX idx_respuestas_pregunta ON respuestas(pregunta_id);
```

> **Nota UUID en SQLite:** `TEXT 36` ocupa 36 B + overhead vs `BLOB 16` (20 B ahorro/fila respuestas = ~23 MB en 10 años). Si el disco importa, guarda `BLOB 16` (`randomblob(16)` con bits versión/variante) y convierte en app. Para simplicidad y debuggabilidad el ejemplo usa `TEXT 36`.

---

## 3. Tamaño por fila

### 3.1 Supuestos

| Campo | Tipo PG / SQLite | Long. promedio | Bytes datos |
|---|---|---|---|
| nombre_estudiante | VARCHAR(100)/TEXT | 22 car | 22+1 |
| nombre_padre | VARCHAR(100)/TEXT | 22 car | 22+1 |
| correo_estudiante | VARCHAR(100) | 24 car | 24+1 |
| correo_padre | VARCHAR(100) | 24 car | 24+1 |
| cedula_estudiante | VARCHAR(10) NULL | 10 car si se informa, NULL 60% casos | 10+1 si no NULL, 1 bitmap si NULL |
| cedula_representante | VARCHAR(10) NULL | idem | idem |
| id | UUID 16 B (PG) / TEXT 36 B (SQLite) | — | 16 / 36 |
| fecha_unix | INTEGER 4 B | — | 4 |
| pregunta_id | SMALLINT/INTEGER 1-2 B | — | 2 |
| respuesta | SMALLINT/INTEGER 1 B | — | 1 |

Overhead fila: PostgreSQL header 23 B + null bitmap + alineamiento ≈ **26 B**; SQLite B-Tree leaf ≈ **12-18 B** (sin TOAST). Se usa **27 B PG / 15 B SQLite** para cálculo.

### 3.2 Fila `estudiantes`

**PostgreSQL (UUID 16 B):**
- Sin cédula (NULL ambas): 16 +23+23+25+25 +4 +27 ≈ **143 B** (+ idx_fecha ~28 B) ⇒ **~171 B** con índice.
- Con 1 cédula (10 car): **+11 B** ⇒ **~182 B**.
- Con 2 cédulas: **+22 B** ⇒ **~193 B**.
- Promedio ponderado (50% estudiantes con ambas cédulas): **~182 B**.

**SQLite (UUID TEXT 36 B):**
- Sin cédula: 36 +23+23+25+25 +4 +15 ≈ **151 B** (+ idx 20 B) ⇒ **~171 B**.
- Con 2 cédulas (TEXT 10+10): **~193 B** → promedio **~182 B** también (UUID más grande compensa overhead menor).

> Pesimista nombres 50 car: **~252 B PG / ~250 B SQLite**.

### 3.3 Fila `respuestas`

- **PostgreSQL:** `estudiante_id` 16 + `pregunta_id` 2 + `respuesta` 1 + header 27 = **~46 B** (con PK cluster). Índice secundario `idx_pregunta` amortizado **+ ~8 B** ⇒ **46 / 54 B**.
- **SQLite TEXT 36:** 36 +2+1+15 = **54 B** / con índice **62 B**.
- **SQLite BLOB 16:** 16+2+1+15 = **34 B** / con índice **42 B** (recomendado si se optimiza).

### 3.4 `preguntas`

98 filas × ~200 B = **~20 KB** (despreciable).

---

## 4. Volumen total (600/semestre × 20 semestres = 12.000 est. ×1.176.000 respuestas)

### 4.1 PostgreSQL (UUID 16 B, promedio 1 cédula informada)

| Nivel | Estudiantes | Respuestas | Estudiantes (182 B) | Respuestas (46 B) | Subtotal | +Índices 25% | **Total disco** |
|---|---|---|---|---|---|---|---|
| 1 semestre (600) | 600 | 58.800 | 0,11 MB | 2,70 MB | 2,81 MB | 3,51 MB | **~3,5 MB** |
| 1 año (1.200) | 1.200 | 117.600 | 0,22 MB | 5,41 MB | 5,63 MB | 7,03 MB | **~7,0 MB** |
| **10 años (12.000)** | 12.000 | 1.176.000 | 2,18 MB | 54,10 MB | 56,28 MB | 70,35 MB | **~55-70 MB** |

Pesimista nombres 50 car + respuestas 54 B: **~63,5 MB datos → ~80 MB con índices**.

### 4.2 SQLite TEXT 36 (sin optimizar)

| Nivel | Respuestas (54 B) | + Estudiantes (182 B) | **Total** |
|---|---|---|---|
| 1 semestre | 3,18 MB | 0,11 MB | **~3,3 MB + WAL** |
| 10 años | 63,50 MB | 2,18 MB | **~65,7 MB → ~82 MB con índices/WAL** |

### 4.3 SQLite BLOB 16 (optimizado)

10 años: 12.000×182 B=2,18 MB + 1.176.000×34 B=40,0 MB ⇒ **~42 MB → ~53 MB con índices** (igual que ex-INT, + solo 2 MB por UUID vs INT).

> **Conclusión sin cédulas:** Si no se informa ninguna cédula (NULL), se ahorra ~11-22 B/fila ⇒ total 10 años **~52-66 MB PG** (vs 55-70 MB). Con ambas cédulas siempre informadas, **~58-73 MB**. Diferencia **<10%** — despreciable.
>
> Si se interpreta 600/año (300/semestre) ⇒ mitad: **~27-35 MB PG en 10 años**.
>
> Un semestre cabe en **~4 MB** (menos que una foto). **Provisionar 300 MB** (5×) cubre 10 años + WAL + backups + VACUUM.

---

## 5. Optimizaciones

1. **Tipos mínimos:** `pregunta_id SMALLINT` (SQLite INTEGER), `respuesta SMALLINT CHECK 0/1`. No `VARCHAR`.
2. **UUID:** PG `uuid` (16 B) + `pgcrypto`. SQLite `TEXT 36` para simplicidad o `BLOB 16` para ahorrar 20 B/fila respuestas (~23 MB en 10 años).
3. **Cédulas opcionales:** `NULL` no ocupa espacio TOAST; índice parcial `WHERE cedula IS NOT NULL` evita indexar NULLs.
4. **Sin surrogate en respuestas:** PK `(estudiante_id, pregunta_id)` ahorra 12 B×1,1M = ~13 MB.
5. **Particionamiento:** PG declarativo por `fecha_unix` semestral; SQLite sin partición nativa → sharding por archivo `chaside_2026s1.db` o `ATTACH`.
   ```sql
   -- PG
   CREATE TABLE estudiantes_2026s1 PARTITION OF estudiantes
     FOR VALUES FROM (to_timestamp('2026-01-01')) TO (to_timestamp('2026-07-01'));
   ```
6. **Índices esenciales solo:** `idx_fecha` y `idx_pregunta`. No indexar correos salvo búsqueda.
7. **Bulk insert:** 98 respuestas por estudiante en una transacción `BEGIN; INSERT ... VALUES (...),(... ) 98; COMMIT;` (PG `COPY`, SQLite `executemany`).
8. **Vacuum/WAL:** PG `autovacuum`; SQLite `PRAGMA journal_mode=WAL; PRAGMA auto_vacuum=INCREMENTAL;`.
9. **Archivo frío:** >3 años mover a `chaside_archive` o Parquet en S3.

### 5.1 Alternativa ultra-compacta

`estudiantes.respuestas_bits BLOB(13)` (98 bits). Elimina `respuestas` (1,1M filas). 12.000×13 B=156 KB vs 54 MB → **350× menos**. Pierde FK por pregunta; solo para archivo.

---

## 6. Consultas

```sql
-- Baremo idéntico a src/data/scoring.ts (Intereses C=98,12... y Aptitudes C=15,51...)
SELECT
  SUM(CASE WHEN r.pregunta_id IN (98,12,64,53,85,1,78,20,71,91) THEN r.respuesta ELSE 0 END) AS c_intereses,
  SUM(CASE WHEN r.pregunta_id IN (15,51,2,46) THEN r.respuesta ELSE 0 END) AS c_aptitudes,
  e.cedula_estudiante -- opcional
FROM respuestas r
JOIN estudiantes e ON e.id=r.estudiante_id
WHERE e.id = :uuid;

-- Cohorte semestral
SELECT date(fecha_unix,'unixepoch','start of month') AS mes, COUNT(*) 
FROM estudiantes GROUP BY mes ORDER BY mes;
```

---

## 7. Recomendación final

- **Motor:** PostgreSQL si hay concurrencia (>50 escrituras/semestre) o SQLite si es despliegue single-file/offline. Ambos <100 MB en 10 años.
- **Provisionar:** **300 MB** (PG) / **150 MB** (SQLite BLOB) con holgura para WAL/backups.
- **Esquema:** 3 tablas normalizadas + cédulas `NULL` + UUIDv4 + partición semestral. No se requiere sharding.

*Fuente preguntas/baremo: `src/data/chaside.ts` (CUESA 1998).*
