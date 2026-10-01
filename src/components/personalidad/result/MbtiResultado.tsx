import type { PersonalityResult } from "../../../data/personalidadScoring";
import type { IdentityScore } from "../../../data/mbti/identity";
import { Printer } from "lucide-react";
import InformeMbti from "../../../templates/mbti/InformeMbti";

type ResultadoConIdentidad = PersonalityResult & { identity: IdentityScore };

export default function MbtiResultado({
  result,
  savedAt,
  error,
  saving,
  alreadyCompleted,
  onPrint,
}: {
  result: ResultadoConIdentidad;
  savedAt: string;
  error: string | null;
  saving: boolean;
  alreadyCompleted: boolean;
  onPrint: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F9F9FB] print:bg-white">
      {alreadyCompleted && (
        <div className="no-print bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">
          Ya completaste este test. Mostrando resultado guardado.
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-6 print-page">
        <div className="flex items-center justify-between gap-4 mb-4">
          <img src="/logo-fucsia.png" alt="TEAM GGM" className="h-9 w-auto" />
          <button
            onClick={onPrint}
            className="no-print bg-[#1D60A9] hover:bg-[#164F8D] text-white font-bold px-5 py-2.5 rounded-full text-sm inline-flex items-center gap-2 transition"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
        <div className="print-only text-center mb-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E8356A]">TEAM GGM · Informe de Personalidad</p>
        </div>
        {savedAt && <p className="no-print text-xs text-[#164F8D] mb-2">Guardado: <span className="font-bold">{savedAt}</span></p>}
        {error && <p className="no-print text-xs text-red-600 font-bold mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        {saving && <p className="no-print text-xs text-[#164F8D] mb-3">Guardando...</p>}

        <InformeMbti
          result={result}
          footerNote="Para volver a rendir, solicita habilitación al administrador."
        />
      </div>
    </div>
  );
}
