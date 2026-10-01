import React from 'react';
import { usePersonalidad } from "./usePersonalidad";
import { PERSONALITY_QUESTIONS } from "../../data/personalidad";
import MbtiResultado from "./result/MbtiResultado";


const SCALE = [
  { v: -3 as any, label: "Muy en desacuerdo", color: "#E8356A", size: 48 },
  { v: -2 as any, label: "En desacuerdo", color: "#E8356A", size: 40 },
  { v: -1 as any, label: "Algo en desacuerdo", color: "#E8356A", size: 32 },
  { v: 0 as any, label: "Neutral", color: "#E1E3DA", size: 28 },
  { v: 1 as any, label: "Algo de acuerdo", color: "#1D60A9", size: 32 },
  { v: 2 as any, label: "De acuerdo", color: "#1D60A9", size: 40 },
  { v: 3 as any, label: "Muy de acuerdo", color: "#1D60A9", size: 48 },
];

export default function PersonalidadTest() {
  const { answers, showResult, savedAt, error, saving, alreadyCompleted, reintentoPendiente, loadingExisting, gateChecked, gateReady, isMoodle, total, progress, missing, result, handle, submit, save, handlePrint, reset } = usePersonalidad();
  if (loadingExisting) return <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-8"><p className="text-sm text-slate-500">Cargando resultado guardado...</p></div>;
  if (!gateChecked) return <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-8"><p className="text-sm text-slate-500">Detectando entorno...</p></div>;
  if (!isMoodle) return <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4"><div className="max-w-md w-full bg-[#E1E3DA] border border-[#164F8D]/10 rounded-2xl p-8 text-center"><img src="/logo-fucsia.png" alt="TEAM GGM" className="h-10 mx-auto mb-4" /><h1 className="text-6xl font-black text-[#1D60A9]" style={{ fontFamily: "Poppins" }}>404</h1><p className="text-sm text-[#164F8D] mt-2">Página no encontrada.</p><a href="/" className="mt-4 inline-block bg-[#1D60A9] hover:bg-[#164F8D] text-white px-6 py-2.5 rounded-full font-bold">Ir al inicio</a></div></div>;
  if (showResult) {
    return (
      <MbtiResultado
        result={result}
        savedAt={savedAt}
        error={error}
        saving={saving}
        alreadyCompleted={alreadyCompleted}
        onPrint={handlePrint}
      />
    );
  }
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="bg-[#1D60A9] text-white border-b sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo-teamggm-horizontal-con-transparencia.webp" alt="TEAM GGM" className="h-7 w-auto" />
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-white/80"><span>{total}/60</span><span className="text-[#E1E3DA]">{progress}%</span></div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-1"><div className="h-full bg-[#E8356A] transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
            <button onClick={submit} className="hidden sm:inline-flex bg-[#E8356A] text-white font-bold px-5 py-2 rounded-full text-sm">Ver resultado</button>
          </div>
          {error && <p className="text-xs text-red-600 font-bold mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {reintentoPendiente && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-800">
            <b>Tienes un reintento habilitado.</b> Tu intento anterior queda guardado en el historial: responde de nuevo y al enviar se registrará como un intento adicional.
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-black">Test de Personalidad — 60 preguntas</h1>
          <p className="text-sm text-slate-600 mt-1">Responde con sinceridad. Escala de 7 puntos · ~10 min</p>
          <div className="mt-3 flex justify-center gap-4 text-[10px] font-black uppercase tracking-wider text-[#164F8D]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#E8356A] inline-block border border-[#E8356A]"></span> Desacuerdo</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#E1E3DA] inline-block border border-[#164F8D]/30"></span> Neutral</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#1D60A9] inline-block border border-[#1D60A9]"></span> De acuerdo</span>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {PERSONALITY_QUESTIONS.map((q) => {
            const v = answers[q.id];
            const miss = error && missing[0] === q.id;
            return (
              <div key={q.id} id={`q-${q.id}`} className={`bg-white border rounded-2xl p-5 ${miss ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
                <div className="flex gap-3"><span className="shrink-0 w-7 h-7 rounded-full bg-[#1D60A9] text-white text-xs font-black flex items-center justify-center">{q.id}</span><p className="font-semibold text-[#1D60A9] text-[15px] leading-snug flex-1">{q.text}</p></div>
                <div className="mt-4 flex items-center justify-between gap-1">
                  <span className="text-[11px] font-black uppercase text-[#E8356A] hidden sm:block">Desacuerdo</span>
                  <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center">
                    {SCALE.map((s) => {
                      const active = v === s.v;
                      const isNeutral = s.v === 0;
                      return (
                        <button key={s.v} onClick={() => handle(q.id, s.v)} aria-label={`${s.label} ${s.v}`} className={`rounded-full border-2 flex items-center justify-center transition ${active ? "border-[#1D60A9] shadow" : "border-slate-300 hover:border-slate-400 bg-white"}`} style={{ width: s.size, height: s.size, background: active ? s.color : "white", borderColor: active ? "#1D60A9" : undefined }} title={s.label}>
                          {active && <span className={`w-2 h-2 rounded-full ${isNeutral ? "bg-[#1D60A9]" : "bg-white"}`}></span>}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-black uppercase text-[#1D60A9] hidden sm:block">De acuerdo</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={submit} className="bg-[#E8356A] text-white font-black px-8 py-4 rounded-full shadow text-lg">Ver mi tipo →</button>
          <button onClick={reset} className="bg-white border-2 border-slate-200 font-bold px-6 py-3 rounded-full">Reiniciar</button>
        </div>
      </div>
    </div>
  );
}
