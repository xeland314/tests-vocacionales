import { useEffect, useState } from "react";

export function MoodleTab({ authHeader, isAdmin }: { authHeader: string; isAdmin: boolean }) {
  const [cfg, setCfg] = useState<any>({ chaside_cmid: 9, mbti_cmid: 10, kuder_cmid: 11, course_id: 2 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/moodle-config", { headers: { Authorization: authHeader } });
      if (r.ok) setCfg(await r.json());
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
          chaside_cmid: cfg.chaside_cmid ? Number(cfg.chaside_cmid) : null,
          mbti_cmid: cfg.mbti_cmid ? Number(cfg.mbti_cmid) : null,
          kuder_cmid: cfg.kuder_cmid ? Number(cfg.kuder_cmid) : null,
          course_id: cfg.course_id ? Number(cfg.course_id) : null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setCfg(j);
      setMsg("Configuración guardada ✓ — los próximos tests marcarán el cmid correcto");
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mt-6 p-8 text-center text-slate-500">Cargando configuración Moodle...</div>;

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-white border rounded-2xl p-5">
        <h3 className="font-black text-sm">Moodle — IDs de módulos para completado automático</h3>
        <p className="text-xs text-slate-500 mt-1">Cuando un estudiante finaliza un test, el backend llama <code>core_completion_update_activity_completion_status_manually</code> con el <code>cmid</code> correspondiente. Configura aquí los IDs de cada actividad URL (<code>mod/url/view.php?id=</code>).</p>
        <div className="mt-3 bg-[#fcfcfc] border border-[#001d62]/10 rounded-xl p-3 text-xs">
          <p className="font-bold text-[#001d62]">Cómo obtener el cmid:</p>
          <ol className="list-decimal ml-4 mt-1 space-y-1 text-slate-600">
            <li>En Moodle, haz clic en la actividad del test (ej. Test CHASIDE).</li>
            <li>Mira la URL: <code>https://tu-moodle.com/mod/url/view.php?id=24</code> — el número tras <code>?id=</code> es el <code>cmid</code>.</li>
            <li>Anota 9 (CHASIDE), 10 (MBTI), 11 (Kuder) o los que uses.</li>
          </ol>
          <p className="mt-2 text-slate-500">Requisitos en Moodle: <b>Administración &gt; Características avanzadas &gt; Habilitar seguimiento del grado de finalización</b> + curso <b>Settings &gt; Completion tracking: Yes</b> + actividad URL <b>Completion tracking: Students must manually mark the activity as done</b>.</p>
        </div>
        {msg && <p className={`mt-3 text-xs font-bold px-3 py-2 rounded-lg border ${msg.includes("Error") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>{msg}</p>}
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase">CHASIDE cmid (mod/url/view.php?id=)</label>
            <input type="number" value={cfg.chaside_cmid ?? ""} onChange={e => setCfg((s: any) => ({ ...s, chaside_cmid: e.target.value === "" ? null : Number(e.target.value) }))} placeholder="9" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" disabled={!isAdmin} />
            <p className="text-[11px] text-slate-400">Ej: 9 — Test CHASIDE</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase">MBTI cmid</label>
            <input type="number" value={cfg.mbti_cmid ?? ""} onChange={e => setCfg((s: any) => ({ ...s, mbti_cmid: e.target.value === "" ? null : Number(e.target.value) }))} placeholder="10" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" disabled={!isAdmin} />
            <p className="text-[11px] text-slate-400">Ej: 10 — Test MBTI/Personalidad (mismo)</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Kuder cmid</label>
            <input type="number" value={cfg.kuder_cmid ?? ""} onChange={e => setCfg((s: any) => ({ ...s, kuder_cmid: e.target.value === "" ? null : Number(e.target.value) }))} placeholder="11" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" disabled={!isAdmin} />
            <p className="text-[11px] text-slate-400">Ej: 11 — Test Kuder</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Course ID</label>
            <input type="number" value={cfg.course_id ?? ""} onChange={e => setCfg((s: any) => ({ ...s, course_id: e.target.value === "" ? null : Number(e.target.value) }))} placeholder="2" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" disabled={!isAdmin} />
            <p className="text-[11px] text-slate-400">ID del curso Moodle (para calificaciones)</p>
          </div>
        </div>
        {isAdmin ? (
          <button onClick={save} disabled={saving} className="mt-4 bg-[#001d62] text-white px-6 py-2.5 rounded-full text-sm font-bold disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar configuración Moodle"}
          </button>
        ) : (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Solo <b>admin</b> puede modificar. Tu rol es docente (solo lectura).</p>
        )}
        <div className="mt-4 bg-slate-50 border rounded-xl p-3 text-xs">
          <p className="font-black">Verificación:</p>
          <ol className="list-decimal ml-4 mt-1 space-y-1 text-slate-600">
            <li>Ingresa a Moodle como <b>Estudiante</b> y realiza el test completo.</li>
            <li>Al finalizar (Ver mi resultado), vuelve al curso en Moodle.</li>
            <li>Verás el check verde ✓ junto a la actividad del test marcada como completada.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
