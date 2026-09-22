# Moodle — Páginas por Test (course=2)

> Moodle: `https://auckland-off-inventory-springfield.trycloudflare.com`  
> Astro: `https://terrace-writer-dressed-roulette.trycloudflare.com`  
> WS Token: `b29c308be39b358504766e482dd740f5`  
> Curso 2 — `modedit.php?add=page&course=2&sectionid=1`  
> Astro `vite.server.allowedHosts=true` `astro.config.mjs:15` permite `*.trycloudflare.com`  
> Alias MBTI: `src/pages/mbti.astro:1` → `/mbti` (misma que `/personalidad`)

Crea **3 Páginas** (una por test). Misma plantilla, cambia solo `src` y `itemname`. Si dejas `CMID=0` no marca completado, solo nota.

---

## 1. CHASIDE — `/chaside` (98 SÍ/NO)

**Página Moodle:** `Añadir actividad → Página` → `HTML` → pega:

```html
<iframe id="astroIframe" src="https://terrace-writer-dressed-roulette.trycloudflare.com/chaside" width="100%" height="900" style="border:none;" allow="fullscreen" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
<script>
(function(){
  const astroOrigin="https://terrace-writer-dressed-roulette.trycloudflare.com";
  const MOODLE_URL="https://auckland-off-inventory-springfield.trycloudflare.com";
  const WS_TOKEN="b29c308be39b358504766e482dd740f5";
  const iframe=document.getElementById('astroIframe');
  window.addEventListener('message',function(e){
    if(e.origin!==astroOrigin) return;
    if(e.data&&e.data.astroReady){
      const uid=(typeof M!=='undefined'&&M.cfg&&(M.cfg.userid||M.cfg.user))?Number(M.cfg.userid||M.cfg.user):0;
      if(uid) iframe.contentWindow.postMessage({moodleUserId:uid}, astroOrigin);
    }
    if(e.data&&e.data.testCompleted){
      const test=e.data.testCompleted, score=e.data.score, top=e.data.top, moodleUserId=e.data.moodleUserId;
      const msg=document.createElement('div'); msg.textContent="✓ "+test+" completado — top "+top; msg.style.cssText="background:#dcfce7;border:1px solid #86efac;padding:8px;border-radius:8px;margin-top:8px;font-size:13px"; iframe.insertAdjacentElement('afterend',msg);
      let grade10=Math.round(score[top]||0); // CHASIDE 0-10
      fetch(`${MOODLE_URL}/webservice/rest/server.php?wstoken=${WS_TOKEN}&wsfunction=core_grades_update_grades&moodlewsrestformat=json`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grades:[{studentid:moodleUserId,grade:grade10,itemname:"CHASIDE",courseid:(M.cfg&&M.cfg.courseId)||2}]})}).then(r=>r.json()).then(j=>{msg.textContent+=" — nota "+grade10+"/10 guardada"; console.log(j);});
      const CMID=0; if(CMID) fetch(`${MOODLE_URL}/webservice/rest/server.php?wstoken=${WS_TOKEN}&wsfunction=core_completion_update_activity_completion_status_manually&moodlewsrestformat=json`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({cmid:CMID,completed:1,userid:moodleUserId})});
    }
  });
})();
</script>
```

**Calificación:** Ítem manual `CHASIDE` 0-10 en `Calificaciones > Añadir ítem`. Astro envía `score[top]` (intereses 0-10). `moodle_user_id` guarda en `estudiantes.moodle_user_id` `src/lib/db.ts:50` + gate anon (teléfono+correo) se omite si hay `uid`.

---

## 2. KUDER — `/kuder` (60 diadas)

**Página Moodle:** Duplica la anterior, cambia solo `src`:

```html
<iframe id="astroIframe" src="https://terrace-writer-dressed-roulette.trycloudflare.com/kuder" width="100%" height="900" style="border:none;" allow="fullscreen" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
<!-- mismo <script> pero grade10 para KUDER: -->
<script>
(function(){
  const astroOrigin="https://terrace-writer-dressed-roulette.trycloudflare.com";
  const MOODLE_URL="https://auckland-off-inventory-springfield.trycloudflare.com";
  const WS_TOKEN="b29c308be39b358504766e482dd740f5";
  const iframe=document.getElementById('astroIframe');
  window.addEventListener('message',function(e){
    if(e.origin!==astroOrigin) return;
    if(e.data&&e.data.astroReady){
      const uid=(typeof M!=='undefined'&&M.cfg&&(M.cfg.userid||M.cfg.user))?Number(M.cfg.userid||M.cfg.user):0;
      if(uid) iframe.contentWindow.postMessage({moodleUserId:uid}, astroOrigin);
    }
    if(e.data&&e.data.testCompleted){
      const test=e.data.testCompleted, score=e.data.score, top=e.data.top, moodleUserId=e.data.moodleUserId;
      const msg=document.createElement('div'); msg.textContent="✓ "+test+" — "+top; msg.style.cssText="background:#dcfce7;border:1px solid #86efac;padding:8px;border-radius:8px;margin-top:8px;font-size:13px"; iframe.insertAdjacentElement('afterend',msg);
      let grade10=Math.round(((score[top]||0)/60)*10); // KUDER 0-60 -> 0-10
      fetch(`${MOODLE_URL}/webservice/rest/server.php?wstoken=${WS_TOKEN}&wsfunction=core_grades_update_grades&moodlewsrestformat=json`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grades:[{studentid:moodleUserId,grade:grade10,itemname:"KUDER",courseid:(M.cfg&&M.cfg.courseId)||2}]})}).then(r=>r.json()).then(j=>{msg.textContent+=" — nota "+grade10+"/10";});
      const CMID=0; if(CMID) fetch(`${MOODLE_URL}/webservice/rest/server.php?wstoken=${WS_TOKEN}&wsfunction=core_completion_update_activity_completion_status_manually&moodlewsrestformat=json`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({cmid:CMID,completed:1,userid:moodleUserId})});
    }
  });
})();
</script>
```

**Nota:** `src/components/KuderTest.tsx:23` `useAnonGate("kuder")` + `src/pages/api/kuder/submit.ts:15` `moodle_user_id`.

---

## 3. MBTI / Personalidad — `/mbti` (60 Likert) alias `/personalidad`

**Página Moodle:** `src=".../mbti"` (no `.../personalidad`, aunque ambos funcionan):

```html
<iframe id="astroIframe" src="https://terrace-writer-dressed-roulette.trycloudflare.com/mbti" width="100%" height="900" style="border:none;" allow="fullscreen" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
<script>
(function(){
  const astroOrigin="https://terrace-writer-dressed-roulette.trycloudflare.com";
  const MOODLE_URL="https://auckland-off-inventory-springfield.trycloudflare.com";
  const WS_TOKEN="b29c308be39b358504766e482dd740f5";
  const iframe=document.getElementById('astroIframe');
  window.addEventListener('message',function(e){
    if(e.origin!==astroOrigin) return;
    if(e.data&&e.data.astroReady){
      const uid=(typeof M!=='undefined'&&M.cfg&&(M.cfg.userid||M.cfg.user))?Number(M.cfg.userid||M.cfg.user):0;
      if(uid) iframe.contentWindow.postMessage({moodleUserId:uid}, astroOrigin);
    }
    if(e.data&&e.data.testCompleted){
      const test=e.data.testCompleted, top=e.data.top, moodleUserId=e.data.moodleUserId;
      const msg=document.createElement('div'); msg.textContent="✓ "+test+" — "+top+" completado"; msg.style.cssText="background:#dcfce7;border:1px solid #86efac;padding:8px;border-radius:8px;margin-top:8px;font-size:13px"; iframe.insertAdjacentElement('afterend',msg);
      let grade10=10; // MBTI completado = 10 (o usa % dimensiones)
      fetch(`${MOODLE_URL}/webservice/rest/server.php?wstoken=${WS_TOKEN}&wsfunction=core_grades_update_grades&moodlewsrestformat=json`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grades:[{studentid:moodleUserId,grade:grade10,itemname:"MBTI",courseid:(M.cfg&&M.cfg.courseId)||2}]})}).then(r=>r.json()).then(j=>{msg.textContent+=" — nota 10/10";});
      const CMID=0; if(CMID) fetch(`${MOODLE_URL}/webservice/rest/server.php?wstoken=${WS_TOKEN}&wsfunction=core_completion_update_activity_completion_status_manually&moodlewsrestformat=json`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({cmid:CMID,completed:1,userid:moodleUserId})});
    }
  });
})();
</script>
```

**Ítem:** `MBTI` 0-10. Gate y bridge: `src/components/PersonalidadTest.tsx:33` `useAnonGate("personalidad")` + `notifyMoodleCompletion({test:"MBTI"})`.

---

## Notas comunes

- **Token en cliente:** expuesto; para prod mover WS a `src/pages/api/*/submit.ts` con `MOODLE_WS_TOKEN` en `.env` (server-side).
- **CMID:** tras crear cada Página, copia su `id` (`mod/page/view.php?id=XXX`) y pégalo en `const CMID=XXX` para autocheck. Deja `0` si solo quieres nota.
- **Prueba:** fuera Moodle abre `https://terrace.../chaside` → pide teléfono+correo (gate anon). Dentro Moodle iframe → auto-inicia, guarda `moodle_user_id` en `estudiantes` y ves `✓` + nota en consola/gradebook.
- **Origen estricto:** si endureces `src/lib/moodle.ts:8` `ALLOWED_MOODLE_ORIGINS=["https://auckland-off-inventory-springfield.trycloudflare.com"]`, cambia `if(ALLOWED.length===0) return true` logic.
