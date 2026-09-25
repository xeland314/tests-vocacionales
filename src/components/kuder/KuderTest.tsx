import React from 'react';
import { useKuder } from "./useKuder";
import { KUDER_DIADAS, KUDER_AREAS } from "../../data/kuder";
import { LucideIcon } from "../../lib/icons";
import { Printer } from "lucide-react";
import InformeKuder from "../../templates/kuder/InformeKuder";

export default function KuderTest() {
  const { answers, showResult, error, saving, alreadyCompleted, loadingExisting, gateChecked, gateReady, isMoodle, total, progress, missing, result, maxScore, handle, submit, reset, handlePrint } = useKuder();
  if (loadingExisting) return <div className="min-h-screen bg-[#EFF6FF] flex items-center justify-center p-8"><p className="text-sm text-slate-500">Cargando resultado guardado...</p></div>;
  if (!gateChecked) return <div className="min-h-screen bg-[#EFF6FF] flex items-center justify-center p-8"><p className="text-sm text-slate-500">Detectando entorno...</p></div>;
  if (!isMoodle) return <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4"><div className="max-w-md w-full bg-[#fcfcfc] border border-[#0f2b6b]/10 rounded-2xl p-8 text-center"><img src="/logo-fucsia.png" alt="TEAM GGM" className="h-10 mx-auto mb-4" /><h1 className="text-6xl font-black text-[#001d62]" style={{ fontFamily: "Poppins" }}>404</h1><p className="text-sm text-[#0f2b6b] mt-2">Página no encontrada.</p><a href="/" className="mt-4 inline-block bg-[#001d62] hover:bg-[#0f2b6b] text-white px-6 py-2.5 rounded-full font-bold">Ir al inicio</a></div></div>;
  if (showResult) {
    const topInfo = KUDER_AREAS[result.top];
    return (
      <div className="min-h-screen bg-[#F9F9FB] print:bg-white">
        {alreadyCompleted && <div className="no-print bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">Ya completaste este test. Mostrando resultado guardado.</div>}
        <div className="no-print bg-white border-b sticky top-0 z-20"><div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3"><span className="text-sm font-extrabold flex items-center gap-2" style={{ color: topInfo.color }}><LucideIcon name={topInfo.icono} size={16} />{topInfo.nombre} · Kuder</span><div className="ml-auto flex gap-2"><button onClick={handlePrint} className="text-sm bg-[#001d62] text-white px-4 py-1.5 rounded-full font-bold inline-flex items-center gap-1"><Printer size={14} />Imprimir / PDF</button></div></div></div>
        <div className="max-w-4xl mx-auto px-4 py-6 print-page">
          {error && <p className="no-print text-xs text-red-600 font-bold mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {saving && <p className="no-print text-xs text-[#0f2b6b] mb-4">Guardando...</p>}
          <div className="mt-6">
            <InformeKuder result={result} maxScore={maxScore} footerNote="Para volver a rendir, solicita habilitación al administrador." />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      <div className="bg-[#001d62] text-white border-b sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo-teamggm-horizontal-con-transparencia.webp" alt="TEAM GGM" className="h-6 sm:h-7 w-auto shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-white/80"><span>{total}/45 diadas</span><span className="text-[#fcfcfc]">{progress}%</span></div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-1"><div className="h-full bg-[#d8215d] transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
            <button onClick={submit} className="hidden sm:inline-flex bg-[#d8215d] text-white font-bold px-5 py-2 rounded-full text-sm">Ver resultado</button>
          </div>
          {error && <p className="text-xs text-red-600 font-bold mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-black">Test Kuder — 45 diadas</h1>
          <p className="text-sm text-slate-600 mt-1">Elige en cada par la actividad que <b>más te gusta</b>. Banco Excel <code>Test_Kuder_Completo.xlsx</code></p>
        </div>
        <div className="mt-4 space-y-3">
          {KUDER_DIADAS.map((d) => {
            const v = answers[d.id];
            const miss = error && missing[0] === d.id;
            return (
              <div key={d.id} id={`k-${d.id}`} className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch ${miss ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
                <div className="flex items-center gap-2 shrink-0"><span className="w-7 h-7 rounded-full bg-[#001d62] text-white text-xs font-black flex items-center justify-center">{d.id}</span></div>
                <div className="flex-1 grid sm:grid-cols-2 gap-2">
                  {(["a", "b"] as const).map((ch) => {
                    const opt = ch === "a" ? d.a : d.b;
                    const active = v === ch;
                    return (
                      <button key={ch} onClick={() => handle(d.id, ch)} className={`text-left p-3 rounded-xl border-2 flex items-center transition ${active ? "border-[#001d62] bg-[#001d62] text-white shadow" : "bg-white border-slate-300 hover:border-slate-400 hover:bg-[#fcfcfc]"}`}>
                        <div className="flex-1"><p className={`text-sm font-bold leading-tight ${active ? "text-white" : "text-[#001d62]"}`}>{opt.texto}</p></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={submit} className="bg-[#d8215d] text-white font-black px-8 py-4 rounded-full shadow text-lg">Ver mi resultado Kuder →</button>
          <button onClick={reset} className="bg-white border-2 border-slate-200 font-bold px-6 py-3 rounded-full">Reiniciar</button>
        </div>
      </div>
    </div>
  );
}
