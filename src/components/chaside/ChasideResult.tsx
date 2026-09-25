import React from 'react';
import type { Dispatch, SetStateAction } from "react";
import type { calculateScores } from "../../data/scoring";
import { Printer, Check } from "lucide-react";
import InformeChaside from "../../templates/chaside/InformeChaside";

type Props = {
  result: ReturnType<typeof calculateScores>;
  studentName: string;
  setStudentName: (s: string) => void;
  savedAt: string;
  onSave: () => void;
  onPrint: () => void;
  onDownload?: () => void;
  onReset?: () => void;
  onBack?: () => void;
  error: string | null;
  extra: { padre: string; correoEst: string; correoPadre: string; cedulaEst: string; cedulaRepr: string };
  setExtra: Dispatch<SetStateAction<{ padre: string; correoEst: string; correoPadre: string; cedulaEst: string; cedulaRepr: string }>>;
  saving: boolean;
};

export function ChasideResult({ result, studentName, savedAt, onPrint, error }: Props) {
  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <div id="print-area-chaside" className="max-w-5xl mx-auto px-4 py-6 print-page">
        <div className="flex items-center justify-between gap-4 mb-6 border-b border-[#0f2b6b]/10 pb-4 print:pb-2">
          <img src="/logo-fucsia.png" alt="TEAM GGM" className="h-10 w-auto print:h-8" />
          <button onClick={onPrint} data-html2canvas-ignore className="no-print bg-[#1f3875] hover:bg-[#001d62] text-white font-bold px-5 py-2.5 rounded-full transition text-sm inline-flex items-center gap-2"><Printer size={16} />Imprimir / PDF</button>
        </div>
        {savedAt && <p className="text-xs text-[#0f2b6b] flex items-center gap-1 print:mt-1">{savedAt.includes("guardado") && <Check size={14} className="text-green-600 print:hidden" />}Guardado: <span className="font-bold text-[#001d62]">{savedAt}</span></p>}
        {error && <p className="text-xs text-[#d8215d] font-bold mt-2 print:hidden">{error}</p>}
        <p className="text-sm text-[#0f2b6b]/60 mb-2">Test vocacional CHASIDE</p>
        <h1 className="text-2xl font-extrabold text-[#001d62] uppercase tracking-tight">Resultado del Test</h1>

        <InformeChaside result={result} studentName={studentName} fecha={savedAt} />

        <p className="mt-6 text-xs text-[#0f2b6b]/50 text-center print:hidden">Para volver a rendir, solicita habilitación al administrador.</p>
      </div>
      <style>{`@media print { .print\\:hidden { display:none !important; } }`}</style>
    </div>
  );
}
