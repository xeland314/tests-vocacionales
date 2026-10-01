import React, { useState } from "react";
import { RotateCcw, X, CalendarRange, ShieldCheck } from "lucide-react";

export type RetakeTest = "CHASIDE" | "PERSONALIDAD" | "KUDER";

const NOMBRE_TEST: Record<RetakeTest, string> = {
  CHASIDE: "CHASIDE",
  PERSONALIDAD: "MBTI / Personalidad",
  KUDER: "Kuder",
};

/**
 * Formulario modal para habilitar un reintento (reemplaza los prompt()/confirm()
 * nativos del navegador). Campos:
 *  - Motivo (opcional, queda auditado)
 *  - Ventana de fechas (opcional, con selector de calendario; vacío = disponible de inmediato)
 * Reglas de negocio recordadas en pantalla: ronda única por estudiante + auditoría.
 */
export function RetakeModal({ test, estudianteId, estudianteNombre, authHeader, onClose, onSuccess }: {
  test: RetakeTest;
  estudianteId: string;
  estudianteNombre: string;
  authHeader: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (desde && hasta && desde > hasta) {
      setError("La fecha 'desde' no puede ser posterior a la fecha 'hasta'.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/estudiante/retake", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({
          estudiante_id: estudianteId,
          test_codigo: test,
          motivo: motivo.trim() || undefined,
          ventana_desde: desde || undefined,
          ventana_hasta: hasta || undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Error ${r.status} al habilitar el reintento`);
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-[#1D60A9]/10 rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-[#1D60A9] flex items-center gap-2" style={{ fontFamily: "Poppins" }}>
              <RotateCcw size={16} /> Habilitar reintento
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {NOMBRE_TEST[test]} · <b>{estudianteNombre || estudianteId}</b>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1" title="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 bg-[#E1E3DA] border border-[#1D60A9]/10 rounded-xl p-3 text-[11px] text-slate-600 flex gap-2">
          <ShieldCheck size={14} className="shrink-0 text-[#1D60A9]" />
          <span>
            El intento anterior <b>no se borra</b>: el nuevo envío se registra como intento adicional.
            Se cierran los reintentos pendientes de los <b>otros</b> tests (ronda única). La habilitación
            queda <b>auditada</b> con tu usuario y fecha.
          </span>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-bold uppercase text-[#1D60A9]">Motivo (opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Ej: Rindió enfermo, error técnico en el aula, "
              className="mt-1 w-full border-2 border-slate-200 focus:border-[#1D60A9] rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="bg-slate-50 border rounded-xl p-3">
            <p className="text-xs font-bold uppercase text-[#1D60A9] flex items-center gap-1">
              <CalendarRange size={13} /> Ventana de fechas (opcional)
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500">Disponible desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="mt-1 w-full border-2 border-slate-200 focus:border-[#1D60A9] rounded-xl px-2 py-1.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="mt-1 w-full border-2 border-slate-200 focus:border-[#1D60A9] rounded-xl px-2 py-1.5 text-sm outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              En blanco = disponible de inmediato y sin fecha límite.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="border font-bold px-5 py-2 rounded-full text-sm text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1D60A9] text-white font-bold px-6 py-2 rounded-full text-sm disabled:opacity-60"
            >
              {saving ? "Habilitando..." : "Habilitar reintento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
