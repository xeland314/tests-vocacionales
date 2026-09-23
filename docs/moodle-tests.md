# Moodle — 3 Tests Limpios (sin tocar servidor)

> **Método recomendado para migrar sin cambios manuales:** `Actividad URL` con `Parámetros` (no `Página` con `<script>` — TinyMCE lo borra).  
> Moodle: `https://symbols-companion-duplicate-audit.trycloudflare.com` (course=2)  
> Astro: `https://terrace-writer-dressed-roulette.trycloudflare.com`  
> WS Token solo en servidor Astro: `MOODLE_WS_TOKEN=b29c308be39b358504766e482dd740f5` en `.env` (`src/pages/api/moodle/grade.ts:13` proxy, nunca en HTML)  
> Alias MBTI: `src/pages/mbti.astro:1` → `/mbti` (misma que `/personalidad`)  
> `vite.server.allowedHosts=true` `astro.config.mjs:15`

`index.astro` queda intacto. Cada test es una URL solita (`/chaside`, `/kuder`, `/mbti`). `src/lib/moodle.ts:32` lee `?moodleUserId=&moodleUserName=&moodleUserEmail=&courseId=` de la URL y `src/lib/anonGate.ts:7` omite gate teléfono+correo si viene de Moodle; fuera de Moodle pide `teléfono+correo` obligatorios `ChasideTest.tsx:68` antes de iniciar. **El formulario final de cada test fue removido** (`ChasideTest.tsx:276` ahora solo `Datos ya registrados al inicio` + `Guardar en BD`) — no se vuelve a pedir nada al final. Nota se envía server-side vía `POST /api/moodle/grade` `src/lib/moodle.ts:95` → `core_grades_update_grades` 0-10.

Borra tu `Página id=8` actual (`view.php?id=8` con gate `telefono+correo`) — era el modo anónimo porque el `<script>` fue eliminado.

---

## Setup único en Moodle (3 ítems)

1. `Calificaciones > Añadir ítem manual` → `CHASIDE` 0-10, `KUDER` 0-10, `MBTI` 0-10 (tipo `Manual`)
2. `Servicios web > Tokens` ya tienes `b29c...` con `core_grades_update_grades` + `core_completion_update_activity_completion_status_manually`. No hace falta exponerlo en la URL.

---

## 1. CHASIDE — `/chaside` (98 SÍ/NO)

**Moodle:** `Activar edición > Añadir actividad > URL` (¡no Página!)

- `URL externa:` `https://terrace-writer-dressed-roulette.trycloudflare.com/chaside`
- `Apariencia > Mostrar:` `Incrustar`
- `Parámetros URL` > `Añadir` 4 filas:
  - `moodleUserId = ID de usuario`
  - `moodleUserName = Nombre completo del usuario`
  - `moodleUserEmail = Dirección de correo`
  - `courseId = ID del curso` (para `moodle_course_id` estadística)

Guarda. Moodle genera `.../chaside?moodleUserId=5&moodleUserName=Ana%20Perez&moodleUserEmail=ana@colegio.edu.ec&courseId=2` y Astro lo lee sin JS.

No añadas `<script>` ni token. Astro guarda `estudiantes.moodle_user_id / moodle_user_name / moodle_user_email / moodle_course_id` `src/lib/db.ts:50` + `telefono/email` quedan `NULL` (reducido).

**Verificación:** entra como estudiante → `URL CHASIDE` → no ves `Antes de iniciar — CHASIDE`, inicia directo. Revisa `SELECT moodle_user_id,mood_le_user_name,email FROM estudiantes` y `Calificaciones` → `CHASIDE 7/10`.

---

## 2. KUDER — `/kuder` (60 diadas)

Repite **URL**:

- `URL externa:` `https://terrace-writer-dressed-roulette.trycloudflare.com/kuder`
- `Parámetros URL:` mismos 4 (`moodleUserId`, `moodleUserName`, `moodleUserEmail`, `courseId`)

Mismo gate `useAnonGate("kuder")` `src/components/KuderTest.tsx:23`, `submit.ts:15`. Nota `KUDER` = `Math.round((score[top]/60)*10)`.

---

## 3. MBTI / Personalidad — `/mbti` (60 Likert) alias `/personalidad`

Repite **URL**:

- `URL externa:` `https://terrace-writer-dressed-roulette.trycloudflare.com/mbti`
- `Parámetros URL:` mismos 4

`PersonalidadTest.tsx:33` `useAnonGate("personalidad")`, `notify MBTI 10/10`.

---

## ¿Qué más de Moodle vale para estadísticas?

Ya tienes `moodleUserId + name + email + courseId`. Para segmentar `src/lib/admin.ts` añade:

| Variable Moodle (Parámetros URL) | Campo DB | Uso |
|---|---|---|
| `ID de usuario` | `moodle_user_id` | PK, nota |
| `Nombre completo` | `moodle_user_name` | Display |
| `Correo` | `moodle_user_email` | Contacto |
| `ID del curso` | `moodle_course_id` | Por curso 2 vs otros |
| `Nombre de usuario` | `moodle_extra_json.username` | Auditoría |
| `Institución` | `moodle_extra_json.institution` | Colegio/sede |
| `Departamento` | `moodle_extra_json.department` | Paralelo |
| `Ciudad`/`País` | `moodle_extra_json.city/country` | Geografía |
| `Cohorte` | `moodle_extra_json.cohort` | Grupo docente |

**Recomendado mínimo:** `moodleUserId + name + email + courseId` ya cubre quién y de qué curso sin gate. Añade `institution`/`city` si quieres baremo por colegio. Configura en `URL > Parámetros` y `moodle.ts:32` + `submit` ya lo guardan en `moodle_extra_json`.

---

## Notas

- **Token en cliente:** ya no, va `POST /api/moodle/grade` server-side con `MOODLE_WS_TOKEN` en `.env`.
- **CMID:** tras crear cada URL, copia su `id` (`mod/url/view.php?id=XXX`) y ponlo en `const CMID=XXX` si usas `Pagina` legacy con `postMessage`; con `URL` deja `0` solo nota.
- **Prueba limpia:** fuera Moodle `https://terrace.../kuder` pide teléfono+correo; dentro `URL` con `?moodleUserId` no pide nada.
