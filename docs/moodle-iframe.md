# Integración Moodle — Iframe + postMessage

> Objetivo: embeber los 3 tests sin que el estudiante rellene formulario manual si ya está logueado en Moodle, y notificar a Moodle la calificación/completado.

## 1. Páginas Astro (3 tests separados + index intacto)

- `src/pages/index.astro` — menú intacto con 3 cards (no se toca).
- `src/pages/chaside.astro` → `ChasideTest` (`/chaside`)
- `src/pages/kuder.astro` → `KuderTest` (`/kuder`)
- `src/pages/personalidad.astro` → `PersonalidadTest` (`/personalidad`)
- `src/pages/mbti.astro` — alias de personalidad para usar `/mbti` en Moodle (ver `src/pages/mbti.astro:1`).
- Cada page es solita, sin header compartido que pida datos. El gate de datos vive dentro del componente React (ver §4).

Usa URLs distintas por actividad Moodle para calificación separada.

## 2. Configuración en Moodle (Page)

1. **Moodle: Crear curso** → `Activar edición` → `Añadir actividad → Página`.
2. **Contenido HTML** → botón `HTML` → pegar **un iframe por página** (una página por test):

```html
<!-- CHASIDE -->
<iframe 
  id="astroIframe"
  src="https://tu-astro.trycloudflare.com/chaside"
  width="100%" height="900" style="border:none;"
  allow="fullscreen" loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin">
</iframe>

<!-- KUDER: src="https://tu-astro.trycloudflare.com/kuder" -->
<!-- MBTI:  src="https://tu-astro.trycloudflare.com/mbti"  (alias de /personalidad) -->
```

3. **Debajo del iframe**, en la misma Página (filtro HTML permite `<script>` si tienes permiso), pega el **bridge Moodle → Astro**:

```html
<script>
(function(){
  const astroOrigin = "https://tu-astro.trycloudflare.com"; // CAMBIA a tu dominio real
  const iframe = document.getElementById('astroIframe');
  if(!iframe) return;

  // Espera a que Astro avise que ya escucha
  window.addEventListener('message', function(e){
    if(e.origin !== astroOrigin) return;

    // 1) Astro listo -> envía moodleUserId
    if(e.data && e.data.astroReady){
      // M.cfg.userid solo si sesión Moodle válida (0 = invitado)
      const uid = (typeof M !== 'undefined' && M.cfg && M.cfg.userid) ? Number(M.cfg.userid) : 0;
      const user  = (typeof M !== 'undefined' && M.cfg && M.cfg.user) ? M.cfg.user : null; // si expones nombre/email
      if(uid){
        iframe.contentWindow.postMessage({ moodleUserId: uid, moodleUser: user }, astroOrigin);
      }
    }

    // 2) Astro notifica completado -> marca actividad / nota (COMPLETO)
    if(e.data && e.data.testCompleted){
      console.log("Test completado", e.data);
      const test = e.data.testCompleted; // "CHASIDE" | "KUDER" | "MBTI"
      const score = e.data.score;
      const top = e.data.top;
      const moodleUserId = e.data.moodleUserId;

      // Feedback visual inmediato
      const msg = document.createElement('div');
      msg.textContent = "✓ " + test + " completado — top " + top;
      msg.style.cssText = "background:#dcfce7;border:1px solid #86efac;padding:8px;border-radius:8px;margin-top:8px;font-size:13px";
      iframe.insertAdjacentElement('afterend', msg);

      // --- Calificación real vía WS (requiere ítems CHASIDE/KUDER/MBTI) ---
      // Crea 3 ítems manuales en Calificaciones > Añadir ítem (0-10)
      // Genera token en Administración > Servicios web > Gestionar tokens (usuario con core/grades:edit)
      const WS_TOKEN = "PEGA_AQUI_TOKEN_MOODLE"; // <-- CAMBIA
      const MOODLE_URL = "https://tu-moodle.com"; // sin barra final
      // Normaliza 0-10
      let grade10 = 5;
      if(test === "CHASIDE") grade10 = Math.round((score[top]||0)); // 0-10
      if(test === "KUDER") grade10 = Math.round(((score[top]||0)/60)*10); // 0-60 -> 0-10
      if(test === "MBTI" || test === "PERSONALIDAD") grade10 = 10; // completado = 10, o calcula %

      if(WS_TOKEN !== "PEGA_AQUI_TOKEN_MOODLE" && moodleUserId){
        fetch(`${MOODLE_URL}/webservice/rest/server.php?wstoken=${WS_TOKEN}&wsfunction=core_grades_update_grades&moodlewsrestformat=json`,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ grades:[{ studentid: moodleUserId, grade: grade10, itemname: test==="MBTI"?"MBTI":test, courseid: (M.cfg && M.cfg.courseId)||0 }] })
        }).then(r=>r.json()).then(j=>{
          console.log("Nota enviada", j);
          msg.textContent += " — nota "+grade10+"/10 guardada";
        }).catch(err=>{ console.error(err); msg.textContent += " — error nota (WS)"; });
      }

      // --- Marcar actividad completada (si Página tiene Rastreo=Manual) ---
      const CMID = 0; // <-- pon el ID del módulo Página (URL mod/page/view.php?id=123 -> 123), 0 desactiva
      if(CMID && WS_TOKEN !== "PEGA_AQUI_TOKEN_MOODLE" && moodleUserId){
        fetch(`${MOODLE_URL}/webservice/rest/server.php?wstoken=${WS_TOKEN}&wsfunction=core_completion_update_activity_completion_status_manually&moodlewsrestformat=json`,{
          method:"POST",
          headers:{"Content-Type":"application/x-www-form-urlencoded"},
          body: new URLSearchParams({ cmid: CMID, completed: 1, userid: moodleUserId })
        }).catch(()=>{});
      }
    }
  });
})();
</script>
```

4. **Filtros Moodle**: `Administración → Plugins → Filtros → Désactiva filtro que escape JS` o permite `<script>` via `HTML purificado` raw. Si no tienes permiso para `<script>` en Página, usa un `bloque HTML` con `script` o plugin `mod_page` con `Allow EMBED`.

5. **CORS/iframe**: Astro ya tiene `vite.server.allowedHosts=true` (`astro.config.mjs:15`) para `*.trycloudflare.com`. Asegura que Astro **no** envíe `X-Frame-Options: DENY` (Astro no lo envía por defecto). Si usas Cloudflare Tunnel, el iframe ya es accesible. Prueba `curl -I https://tu-astro/chaside` — no debe haber `X-Frame-Options`.

### 2.1 TinyMCE elimina `<script>` — soluciones sin exponer `WS_TOKEN`

El editor **TinyMCE borra `<script>` al guardar** por seguridad. Astro entonces nunca recibe `moodleUserId` y activa gate anónimo. Además por `Cross-Origin` Astro no puede leer `window.parent.M.cfg` solo.

**Solución desacoplada (recomendada): mover WS_TOKEN al servidor Astro** `src/pages/api/moodle/grade.ts:1` y pasar `moodleUserId` sin JS en la Página:

**Opción A — Wrapper PHP (más confiable, tu caso Debian):** crea `/var/www/html/moodle/chaside.php` (y `kuder.php`/`mbti.php` cambiando `src`):

```php
<?php
require_once(__DIR__ . '/config.php');
require_login();
global $USER, $COURSE;
$astro = "https://terrace-writer-dressed-roulette.trycloudflare.com/chaside?moodleUserId=".$USER->id
  ."&moodleUserName=".urlencode($USER->firstname." ".$USER->lastname)
  ."&moodleUserEmail=".urlencode($USER->email)
  ."&courseId=".$COURSE->id;
?>
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{margin:0;height:100vh;overflow:hidden}</style></head>
<body><iframe src="<?php echo $astro; ?>" width="100%" height="100%" style="border:none;" allow="fullscreen"></iframe></body></html>
```
En Moodle añade actividad **URL** → `http://192.168.1.16/chaside.php` (o tu dominio) → Astro lee `?moodleUserId=&moodleUserName=&moodleUserEmail=` vía `src/lib/moodle.ts:32` `URLSearchParams` sin necesidad de `postMessage`.

**Opción B — HTML adicional global:** deja en la Página solo el `<iframe>` y pega el `postMessage` en `Administración → Apariencia → HTML adicional → Antes de cerrar BODY`:

```html
<script>
document.addEventListener('DOMContentLoaded',()=>{
  const iframe=document.getElementById('astroIframe');
  if(iframe && typeof M!=='undefined' && M.cfg){
    const uid=M.cfg.userid||M.cfg.user;
    iframe.onload=()=> iframe.contentWindow.postMessage({moodleUserId:uid}, 'https://terrace-writer-dressed-roulette.trycloudflare.com');
  }
});
</script>
```
Así TinyMCE no lo borra.

**Servidor seguro:** Astro ya no hace `fetch` directo a Moodle desde el navegador. `src/lib/moodle.ts:95` `notifyMoodleCompletion` hace `POST /api/moodle/grade` (proxy server-side `src/pages/api/moodle/grade.ts:13` lee `MOODLE_URL`/`MOODLE_WS_TOKEN` de `.env` sin prefijo `PUBLIC_`). Configura en `.env` `MOODLE_URL=https://auckland-off-inventory-springfield.trycloudflare.com` + `MOODLE_WS_TOKEN=b29c...` (ver `.env.example:8`). El token nunca llega al HTML de Moodle. Asegura `astro.config.mjs:11` `output: "server"` (ya lo tienes).

## 3. Flujo postMessage seguro

```
Moodle Page load
  └─> Astro iframe load -> postMessage {astroReady:true} a parent (*)
        └─> Moodle listener (origen validado) -> postMessage {moodleUserId} a astroOrigin (no '*')
              └─> Astro lib/moodle.ts valida origin y guarda moodleUserId, auto-inicia test
Astro guardar resultado
  └─> postMessage {testCompleted:'CHASIDE', moodleUserId, score, top} a parent (origen Moodle)
        └─> Moodle listener marca completado / WS grade
```

- Siempre validar `e.origin === astroOrigin` en Moodle y `e.origin` contiene `moodle` en Astro (ver `src/lib/moodle.ts:10`).
- No usar `'*'` como targetOrigin al enviar (usa `astroOrigin` / `moodleOrigin`).

## 4. Datos reducidos (gate al inicio, no al final)

- **Antes pedía** al final del test `nombre_padre / correo_padre / cédulas` (6 campos). **Ahora** el formulario final de `ChasideTest.tsx:276`/`KuderTest.tsx:93`/`PersonalidadTest.tsx:92` fue removido — solo muestra `Datos ya registrados al inicio` + `Guardar en BD`. No se vuelve a pedir nada al final.
- **Si `moodleUserId` existe (iframe):** Astro **no pide formulario**. Via URL ya trae `moodleUserId + name (fullname) + email` (ver `src/lib/moodle.ts:32` `URLSearchParams` + `URL` con Parámetros). Guarda `estudiantes.moodle_user_id / moodle_user_name / moodle_user_email / moodle_course_id` + `telefono/email` quedan `NULL`. Inicia test automáticamente.
- **Si no hay moodle (anónimo / acceso directo `index` → test):** muestra **gate obligatorio** antes del test pidiendo **solo teléfono real + correo electrónico** (+ nombre opcional, ver `src/components/ChasideTest.tsx:68` + `useAnonGate.ts:7`). Sin esos dos no deja `Ver resultado` ni `Guardar`. Padre/cédulas se eliminaron del flujo (siguen en DB como `NULL` para compat).

Ver `src/lib/db.ts:46` esquema reducido: `telefono TEXT, email TEXT, moodle_user_id INTEGER, moodle_user_name TEXT, moodle_user_email TEXT, moodle_course_id INTEGER, moodle_extra_json TEXT` + índices.

### 4.1 ¿Qué más de Moodle vale para estadísticas?

Ya tienes por URL `moodleUserId + name (fullname) + email`. Para segmentar resultados CHASIDE/KUDER/MBTI en `src/lib/admin.ts` (por colegio/curso/ciudad) añade como **Parámetros URL** en la actividad `URL` (recomendado limpio):

| Variable Moodle (Parámetros URL) | Campo DB `estudiantes` | Uso estadístico |
|---|---|---|
| `ID de usuario` → `moodleUserId` | `moodle_user_id` | PK, evita duplicados, nota |
| `Nombre completo` → `moodleUserName` | `moodle_user_name` | Display, sin gate |
| `Correo` → `moodleUserEmail` | `moodle_user_email` | Contacto, sin gate |
| `ID del curso` → `courseId` | `moodle_course_id` | Agrupa por `course=2` vs otros cursos, cohorte 2026 |
| `Nombre de usuario` → `username` | `moodle_extra_json.username` | Login, auditoría |
| `Institución` / `Departamento` | `moodle_extra_json.institution/department` | Colegio/sede, segmenta por institución |
| `Ciudad` / `País` | `moodle_extra_json.city/country` | Geografía, baremo regional |
| `Cohorte` / `Grupo` | `moodle_extra_json.cohort` | Paralelo A/B, docente |

**Cómo añadirlo:** en `URL` > `Parámetros` añade filas: `moodleUserName = Nombre completo del usuario`, `moodleUserEmail = Dirección de correo`, `courseId = ID del curso`, etc. Moodle los anexa `?moodleUserId=5&moodleUserName=Ana%20Perez&moodleUserEmail=...&courseId=2`. `src/lib/moodle.ts:32` ya los lee y `src/pages/api/*/submit.ts:15` los guarda. En `src/lib/admin.ts` puedes luego hacer `GROUP BY moodle_course_id / moodle_extra_json` para dashboards.

**Mínimo recomendado para tu caso:** `moodleUserId + moodleUserName + moodleUserEmail + courseId`. Con eso ya tienes `quién`, `de qué curso` y `contacto` sin pedir teléfono (Moodle) vs anónimo `teléfono+correo`. Si quieres granularidad, añade `institution` (colegio) y `city`.

## 5. Notificar calificación en Moodle

Crea en Moodle **3 ítems de calificación** `CHASIDE`, `KUDER`, `MBTI` en `Calificaciones → Configuración → Añadir ítem` (0-10).

**Opción A — Solo visual (sin nota):** el `postMessage` de §2 ya muestra “✓ completado”. No escribe en libro. Útil si solo quieres que docente vea que terminó.

**Opción B — Nota real vía WS (recomendada):** el bloque `// 2)` de §2 ya hace `fetch core_grades_update_grades` + `core_completion_update_activity_completion_status_manually`. Requiere:

1. Moodle: `Administración → Servicios web → Habilitar`
2. `Crear servicio externo` con funciones `core_grades_update_grades` + `core_completion_update_activity_completion_status_manually` + `core_user_get_users` (opcional), asignar a usuario con `moodle/grade:edit`, `moodle/course:markcomplete`
3. `Gestionar tokens` → genera `WS_TOKEN` y pégalo en el script
4. Ajusta `MOODLE_URL` y `CMID` (id de la Página, para marcar completado). Si dejas `WS_TOKEN` como placeholder no envía nota (solo visual).

Alternativa sin token: publica Astro como **Tool LTI 1.3** (`mod_lti`) y usa `LTI Advantage Grade Service` — no necesita WS manual.

Si usas `src/pages/api/*/submit.ts` desde servidor Astro, puedes llamar el WS desde Astro en vez de desde navegador (más seguro, token no expuesto). Añade `MOODLE_WS_TOKEN` en `.env` y `fetch` server-side tras `db.execute`.

## 6. Pruebas

- Fuera de Moodle: abre `https://tu-astro/chaside` directo → debe pedir teléfono+email antes de iniciar.
- Dentro de Moodle Page iframe → debe auto-iniciar sin pedir nada, y al guardar log en Astro `moodle_user_id` y `postMessage` de completado visible en consola Moodle.
- Revisa `data/chaside.db` `SELECT moodle_user_id, telefono, email FROM estudiantes LIMIT 5;`
