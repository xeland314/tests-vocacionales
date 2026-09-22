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

    // 2) Astro notifica completado -> marca actividad / nota
    if(e.data && e.data.testCompleted){
      console.log("Test completado", e.data);
      // Opción A: marcar completado manual (si actividad tiene rastreo)
      // Opción B: WS grades (ver §5)
      // Ej. disparar evento Moodle:
      if(typeof M !== 'undefined' && M.util && M.util.js_pending) {
        // tu lógica de completado
      }
      // Feedback visual
      const msg = document.createElement('div');
      msg.textContent = "✓ " + e.data.testCompleted + " completado (" + e.data.score + ")";
      msg.style.cssText = "background:#dcfce7;border:1px solid #86efac;padding:8px;border-radius:8px;margin-top:8px;font-size:13px";
      iframe.insertAdjacentElement('afterend', msg);
    }
  });
})();
</script>
```

4. **Filtros Moodle**: `Administración → Plugins → Filtros → Désactiva filtro que escape JS` o permite `<script>` via `HTML purificado` raw. Si no tienes permiso para `<script>` en Página, usa un `bloque HTML` con `script` o plugin `mod_page` con `Allow EMBED`.

5. **CORS/iframe**: Astro ya tiene `vite.server.allowedHosts=true` (`astro.config.mjs:15`) para `*.trycloudflare.com`. Asegura que Astro **no** envíe `X-Frame-Options: DENY` (Astro no lo envía por defecto). Si usas Cloudflare Tunnel, el iframe ya es accesible. Prueba `curl -I https://tu-astro/ chaside` — no debe haber `X-Frame-Options`.

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

## 4. Datos reducidos

- **Si `moodleUserId` existe (iframe):** Astro **no pide formulario**. Guarda `estudiantes.moodle_user_id = moodleUserId` + `telefono/email` opcionales. Inicia test automáticamente.
- **Si no hay moodle (anónimo / acceso directo):** Astro muestra **gate obligatorio** antes del test pidiendo **teléfono real + correo electrónico** (validados, ver `src/components/ChasideTest.tsx:68`). Sin esos dos no deja `Ver resultado`. Reduce el formulario viejo (padre, cédulas, etc. ahora opcionales en resultado, no en gate).

Ver `src/lib/db.ts:46` esquema: `telefono TEXT`, `email TEXT`, `moodle_user_id INTEGER`, índices.

## 5. Notificar calificación en Moodle

Crea en Moodle **3 ítems de calificación** `CHASIDE`, `KUDER`, `MBTI` en `Calificaciones → Configuración → Añadir ítem`.

**Opción simple (solo completado visual):** el `postMessage` de §2 ya muestra “completado”. No escribe nota.

**Opción nota real (WS):** en `src/pages/api/*/submit.ts` tras `db.execute`, llama Moodle WS:

```
POST https://tu-moodle/webservice/rest/server.php?wstoken=TOKEN&wsfunction=core_grades_update_grades&moodlewsrestformat=json
body: { grades: [{ studentid: moodleUserId, grade: scoreNormalizado, itemname: "CHASIDE" }] }
```

Requiere en Moodle: `Servicios web → Token` y `Habilitar WS`. Alternativa LTI 1.3 `mod_lti` hace lo mismo sin token si publicas Astro como Tool.

## 6. Pruebas

- Fuera de Moodle: abre `https://tu-astro/chaside` directo → debe pedir teléfono+email antes de iniciar.
- Dentro de Moodle Page iframe → debe auto-iniciar sin pedir nada, y al guardar log en Astro `moodle_user_id` y `postMessage` de completado visible en consola Moodle.
- Revisa `data/chaside.db` `SELECT moodle_user_id, telefono, email FROM estudiantes LIMIT 5;`
