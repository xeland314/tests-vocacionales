# Moodle — 3 Tests Limpios (sin tocar servidor)

> **Método recomendado para migrar sin cambios manuales:** `Actividad URL` con `Parámetros` (no `Página` con `<script>` — TinyMCE lo borra).  
> Moodle: `https://auckland-off-inventory-springfield.trycloudflare.com` (course=2)  
> Astro: `https://terrace-writer-dressed-roulette.trycloudflare.com`  
> WS Token solo en servidor Astro: `MOODLE_WS_TOKEN=b29c308be39b358504766e482dd740f5` en `.env` (`src/pages/api/moodle/grade.ts:13` proxy, nunca en HTML)  
> Alias MBTI: `src/pages/mbti.astro:1` → `/mbti` (misma que `/personalidad`)  
> `vite.server.allowedHosts=true` `astro.config.mjs:15`

`index.astro` queda intacto. Cada test es una URL solita (`/chaside`, `/kuder`, `/mbti`). `src/lib/moodle.ts:32` lee `?moodleUserId=` de la URL y `src/lib/anonGate.ts:7` omite gate teléfono+correo si viene de Moodle; fuera de Moodle pide `teléfono+correo` obligatorios `ChasideTest.tsx:68`. Nota se envía server-side vía `POST /api/moodle/grade` `src/lib/moodle.ts:95` → `core_grades_update_grades` 0-10.

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
- `Parámetros URL` > `Añadir` > `Nombre: moodleUserId` > `Variable: ID de usuario` (Moodle autocompleta `?moodleUserId=5`)
- Guarda. Moodle genera `.../chaside?moodleUserId=5` y Astro lo lee sin JS.

No añadas `<script>` ni token. Astro guarda `estudiantes.moodle_user_id` `src/lib/db.ts:50` + `estudiantes.telefono/email` quedan `NULL` (reducido), y al `Guardar DB` notifica `CHASIDE 0-10 = score[top]` vía `POST /api/moodle/grade` server-side.

**Verificación:** entra como estudiante → `URL CHASIDE` → no ves `Antes de iniciar — CHASIDE`, inicia directo. Revisa `SELECT moodle_user_id,email FROM estudiantes` y `Calificaciones` → `CHASIDE 7/10`.

---

## 2. KUDER — `/kuder` (60 diadas)

Repite **URL**:

- `URL externa:` `https://terrace-writer-dressed-roulette.trycloudflare.com/kuder`
- `Parámetros URL:` `moodleUserId = ID de usuario`

Mismo gate `useAnonGate("kuder")` `src/components/KuderTest.tsx:23`, `submit.ts:15`. Nota `KUDER` = `Math.round((score[top]/60)*10)`.

---

## 3. MBTI / Personalidad — `/mbti` (60 Likert) alias `/personalidad`

Repite **URL**:

- `URL externa:` `https://terrace-writer-dressed-roulette.trycloudflare.com/mbti`
- `Parámetros URL:` `moodleUserId = ID de usuario`

`PersonalidadTest.tsx:33` `useAnonGate("personalidad")`, `notify MBTI 10/10` (completado).

---

## ¿Por qué no Página + `<script>`?

Tu `view.php?id=8` usaba `Página` con `<iframe><script>postMessage M.cfg.userid</script>` — TinyMCE lo **elimina al guardar** y por `Cross-Origin` Astro no puede leer `window.parent.M.cfg` solo. El `postMessage` nunca llegaba y veías gate anónimo. Las alternativas `chaside.php` wrapper o `HTML adicional` funcionan pero requieren tocar `/var/www/html/moodle/` y no viajan en backup del curso.

`URL + Parámetros` es nativo Moodle, viaja en `.mbz` al migrar, no expone `WS_TOKEN` y no necesita `postMessage`. Si aún quieres `Página`, usa el wrapper `docs/moodle-iframe.md:2.1` pero no es limpio para migrar.

**Para completado:** añade `CMID` de cada URL (`mod/url/view.php?id=XXX`) en el body del `POST /api/moodle/grade` con `cmid` si quieres `core_completion_update_activity_completion_status_manually`, o deja `0` solo nota.

**Prueba limpia:** fuera Moodle `https://terrace.../kuder` pide teléfono+correo; dentro `URL` con `?moodleUserId` no pide nada.
