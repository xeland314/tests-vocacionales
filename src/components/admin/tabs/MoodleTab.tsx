import React from 'react';
import { useEffect, useState } from "react";

const TESTS = [
  { key: "CHASIDE", label: "CHASIDE" },
  { key: "PERSONALIDAD", label: "MBTI / Personalidad" },
  { key: "KUDER", label: "Kuder" },
] as const;

export function MoodleTab({ authHeader, isAdmin }: { authHeader: string; isAdmin: boolean }) {
  const [cfg, setCfg] = useState<any>({ moodle_domains: [], course_ids: [], chaside_cmids: [9], mbti_cmids: [10], kuder_cmids: [11] });
  const [domainsText, setDomainsText] = useState("");
  const [coursesText, setCoursesText] = useState("");
  const [cmidsText, setCmidsText] = useState<Record<string, string>>({ CHASIDE: "9", PERSONALIDAD: "10", KUDER: "11" });
  const [requireReferer, setRequireReferer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [validateTest, setValidateTest] = useState<string>("CHASIDE");
  const [validateUrl, setValidateUrl] = useState("");
  const [validateResult, setValidateResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/moodle-config", { headers: { Authorization: authHeader } });
      if (r.ok) {
        const j = await r.json();
        setCfg(j);
        setDomainsText((j.moodle_domains ?? []).join("\n"));
        setCoursesText((j.course_ids ?? []).join(", "));
        setCmidsText({
          CHASIDE: (j.chaside_cmids ?? []).join(", "),
          PERSONALIDAD: (j.mbti_cmids ?? []).join(", "),
          KUDER: (j.kuder_cmids ?? []).join(", "),
        });
        setRequireReferer(!!j.referer_required);
      }
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!isAdmin) return;
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/moodle-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({
          moodle_domains: domainsText,
          course_ids: coursesText,
          chaside_cmids: cmidsText.CHASIDE,
          mbti_cmids: cmidsText.PERSONALIDAD,
          kuder_cmids: cmidsText.KUDER,
          referer_required: requireReferer,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setCfg(j);
      setDomainsText((j.moodle_domains ?? []).join("\n"));
      setCoursesText((j.course_ids ?? []).join(", "));
      setCmidsText({
        CHASIDE: (j.chaside_cmids ?? []).join(", "),
        PERSONALIDAD: (j.mbti_cmids ?? []).join(", "),
        KUDER: (j.kuder_cmids ?? []).join(", "),
      });
      setRequireReferer(!!j.referer_required);
      setMsg("Configuración guardada ✓ — el validador solo exige lo que esté configurado");
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const validar = async () => {
    setValidating(true);
    setValidateResult(null);
    try {
      const r = await fetch(`/api/admin/moodle-config?validate=${encodeURIComponent(validateTest)}&url=${encodeURIComponent(validateUrl)}`, {
        method: "POST",
        headers: { Authorization: authHeader },
      });
      const j = await r.json();
      setValidateResult(j);
    } catch (e: any) {
      setValidateResult({ error: e.message });
    } finally {
      setValidating(false);
    }
  };

  if (loading) return <div className="mt-6 p-8 text-center text-slate-500">Cargando configuración Moodle...</div>;

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-white border rounded-2xl p-5">
        <h3 className="font-black text-sm">Moodle — Validador de contexto (sin API REST)</h3>
        <p className="text-xs text-slate-500 mt-1">
          Configura <b>desde qué dominio, curso y actividad</b> debe abrirse cada test. La app NO escribe
          en Moodle (sin Web Services ni token). El panel <code>/admin</code> sigue siendo la fuente
          centralizada de quién rindió qué. En Moodle deja cada URL en <b>Completion tracking = Do not
          indicate activity completion</b>.
        </p>

        <div className="mt-3 bg-[#E1E3DA] border border-[#1D60A9]/10 rounded-xl p-3 text-xs">
          <p className="font-bold text-[#1D60A9]">Cómo obtener el cmid de cada actividad:</p>
          <ol className="list-decimal ml-4 mt-1 space-y-1 text-slate-600">
            <li>En Moodle, abre la actividad URL del test (ej. Test CHASIDE).</li>
            <li>Mira la URL del navegador: <code>https://tu-moodle.com/mod/url/view.php?id=24</code> — el número tras <code>?id=</code> es el <code>cmid</code>.</li>
            <li>En la configuración de la actividad, en <b>Parámetros de URL</b>, añade <code>courseId</code> (ID del curso) y <code>cmid</code> para que el validador los reciba.</li>
          </ol>
        </div>

        {msg && <p className={`mt-3 text-xs font-bold px-3 py-2 rounded-lg border ${msg.includes("Error") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>{msg}</p>}

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-bold uppercase">Dominios Moodle permitidos (uno por línea)</label>
            <textarea
              value={domainsText}
              onChange={(e) => setDomainsText(e.target.value)}
              placeholder={"https://campus.tu-colegio.edu.ec"}
              rows={3}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-mono"
              disabled={!isAdmin}
            />
            <p className="text-[11px] text-slate-400">Si queda vacío, el validador se salta la comprobación de dominio (modo permisivo) hasta que configures al menos uno.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {TESTS.map((t) => (
              <div key={t.key}>
                <label className="text-xs font-bold uppercase">{t.label} cmids (opcional — separados por coma)</label>
                <input
                  value={cmidsText[t.key] ?? ""}
                  onChange={(e) => setCmidsText((s) => ({ ...s, [t.key]: e.target.value }))}
                  placeholder={t.key === "CHASIDE" ? "9" : t.key === "PERSONALIDAD" ? "10" : "11"}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-mono"
                  disabled={!isAdmin}
                />
                <p className="text-[11px] text-slate-400">Opcional: vacío = no se valida la actividad.</p>
              </div>
            ))}
            <div className="flex items-start md:col-span-4 bg-slate-50 border rounded-xl p-3">
              <input
                id="require-referer"
                type="checkbox"
                checked={requireReferer}
                onChange={(e) => setRequireReferer(e.target.checked)}
                className="mt-0.5 mr-2"
                disabled={!isAdmin}
              />
              <div>
                <label htmlFor="require-referer" className="text-xs font-bold uppercase">Exigir apertura desde Moodle (Referer)</label>
                <p className="text-[11px] text-slate-500">
                  Activo (recomendado en producción): si el navegador no informa de dónde viene el usuario (acceso directo, o app en HTTP abierta desde Moodle HTTPS), da 404.
                  Desactívalo <b>solo para pruebas</b> cuando la app corra en <code>http://localhost</code> y Moodle en HTTPS (el navegador borra el Referer en ese caso).
                </p>
              </div>
            </div>
          <div>
            <label className="text-xs font-bold uppercase">Course IDs (opcional — separados por coma)</label>
            <input
              value={coursesText}
              onChange={(e) => setCoursesText(e.target.value)}
              placeholder="2, 3, 5"
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-mono"
              disabled={!isAdmin}
            />
            <p className="text-[11px] text-slate-400">Si queda vacío, el validador no comprueba el curso. Útil si los tests viven en varios cursos.</p>
          </div>
          </div>
        </div>

        {isAdmin ? (
          <button onClick={save} disabled={saving} className="mt-4 bg-[#1D60A9] text-white px-6 py-2.5 rounded-full text-sm font-bold disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        ) : (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Solo <b>admin</b> puede modificar. Tu rol es docente (solo lectura).</p>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-5">
        <h3 className="font-black text-sm">Probar el validador</h3>
        <p className="text-xs text-slate-500 mt-1">Pega la URL con la que el estudiante abriría el test (con sus parámetros) y comprueba si pasaría la validación.</p>
        <div className="mt-3 grid md:grid-cols-[140px_1fr_auto] gap-2 items-end">
          <select value={validateTest} onChange={(e) => setValidateTest(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            {TESTS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <input
            value={validateUrl}
            onChange={(e) => setValidateUrl(e.target.value)}
            placeholder="https://testvocacional.teamggm.com/chaside?moodleUserId=5&courseId=2&cmid=9"
            className="border rounded-lg px-3 py-2 text-sm font-mono"
          />
          <button onClick={validar} disabled={validating || !validateUrl} className="bg-slate-800 text-white px-5 py-2 rounded-full text-sm font-bold disabled:opacity-60">
            {validating ? "Validando..." : "Validar"}
          </button>
        </div>
        {validateResult && (
          <div className={`mt-3 text-xs rounded-lg px-3 py-2 border ${validateResult.error ? "bg-red-50 border-red-200 text-red-700" : validateResult.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {validateResult.error ? (
              <p>{validateResult.error}</p>
            ) : validateResult.ok ? (
              <p>✓ Válido: dominio, curso y actividad correctos para {validateTest}.</p>
            ) : (
              <>
                <p className="font-bold">✗ No válido:</p>
                <ul className="list-disc ml-4 mt-1">
                  {(validateResult.errores ?? []).map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
                {validateResult.hint && <p className="mt-1 text-slate-500">{validateResult.hint}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
