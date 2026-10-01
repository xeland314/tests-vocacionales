import React, { useEffect, useState } from "react";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { EstudianteDetailContent } from "./EstudianteDetailContent";

export function EstudianteDetailPanel({ selected, setSelected, authHeader, load, isAdmin }: any) {
  const [opening, setOpening] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [selected, setSelected]);

  if (!selected) return null;
  const estudiante = selected.estudiante;

  const openInNewTab = async () => {
    setOpening(true);
    setTokenError(null);
    try {
      const r = await fetch("/api/admin/estudiante/view-token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ id: estudiante.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.token) throw new Error(j.error || "No se pudo generar el enlace");
      window.open(`/admin/estudiante/${j.token}`, "_blank", "noopener");
    } catch (e: any) {
      setTokenError(e.message);
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end print-static print:block">
      <div className="print-hidden absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
      <aside className="animate-panel-in print-static relative h-full w-full max-w-3xl bg-white shadow-2xl flex flex-col">
        <header className="border-b px-5 py-4 flex items-start gap-3">
          <div className="min-w-0">
            <h3 className="font-black text-lg truncate">{estudiante.moodle_user_name || estudiante.nombre_estudiante || "—"}</h3>
            <p className="text-xs text-slate-500">ID {estudiante.id} · Moodle {estudiante.moodle_user_id ?? "—"} · Creado {new Date((estudiante.created_at || 0) * 1000).toLocaleString()}</p>
            <p className="text-xs mt-1 text-slate-500">Email: {estudiante.moodle_user_email || "—"} · Curso: {estudiante.moodle_course_id ?? "—"}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              onClick={openInNewTab}
              disabled={opening}
              className="no-print bg-[#1D60A9] hover:bg-[#164F8D] disabled:opacity-60 text-white font-bold px-3 py-2 rounded-full text-xs inline-flex items-center gap-1"
              title="Abrir el informe completo en una pestaña nueva"
            >
              {opening ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />} Informe completo
            </button>
            <button onClick={() => setSelected(null)} className="bg-slate-100 border rounded-full w-8 h-8 flex items-center justify-center" title="Cerrar">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 print:overflow-visible print:max-h-none print:p-0">
          {tokenError && <p className="no-print text-xs text-red-600 font-bold mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{tokenError}</p>}
          <EstudianteDetailContent
            selected={selected}
            authHeader={authHeader}
            isAdmin={isAdmin}
            onDeleted={() => { setSelected(null); load(); }}
          />
        </div>
      </aside>
    </div>
  );
}
