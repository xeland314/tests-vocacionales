import { usePersonalidad } from "./usePersonalidad";
import { TYPES } from "../../data/personalidad";
import { PERSONALITY_QUESTIONS } from "../../data/personalidad";
import { BookOpen, Save, Printer, Check } from "lucide-react";

const SCALE = [
  { v: -3 as any, label: "Muy en desacuerdo", color: "#d8215d", size: 48 },
  { v: -2 as any, label: "En desacuerdo", color: "#d8215d", size: 40 },
  { v: -1 as any, label: "Algo en desacuerdo", color: "#d8215d", size: 32 },
  { v: 0 as any, label: "Neutral", color: "#fcfcfc", size: 28 },
  { v: 1 as any, label: "Algo de acuerdo", color: "#1f3875", size: 32 },
  { v: 2 as any, label: "De acuerdo", color: "#1f3875", size: 40 },
  { v: 3 as any, label: "Muy de acuerdo", color: "#1f3875", size: 48 },
];

export default function PersonalidadTest() {
  const { answers, showResult, savedAt, error, saving, alreadyCompleted, loadingExisting, gateChecked, gateReady, isMoodle, total, progress, missing, result, handle, submit, save, reset } = usePersonalidad();
  if (loadingExisting) return <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-8"><p className="text-sm text-slate-500">Cargando resultado guardado...</p></div>;
  if (!gateChecked) return <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-8"><p className="text-sm text-slate-500">Detectando entorno...</p></div>;
  if (!isMoodle) return <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4"><div className="max-w-md w-full bg-white border rounded-2xl p-6 text-center"><h2 className="text-xl font-black">Accede desde Moodle</h2><p className="text-sm text-slate-600 mt-2">Solo Moodle.</p><a href="/" className="mt-4 inline-block bg-[#001d62] text-white px-6 py-2.5 rounded-full font-bold">← Volver</a></div></div>;
  if (showResult) {
    const info = TYPES[result.type];
    return (
      <div className="min-h-screen bg-[#F9F9FB]">
        {alreadyCompleted && <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">Ya completaste — mostrando resultado guardado.</div>}
        <div className="bg-[#001d62] text-white border-b sticky top-0 z-20"><div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3"><span className="text-sm font-extrabold" style={{ color: info.color }}>{result.type} · {info.name}</span><div className="ml-auto flex gap-2"><button onClick={() => window.print()} className="text-sm bg-[#0B1220] text-white px-4 py-1.5 rounded-full font-bold inline-flex items-center gap-1"><Printer size={14} />Imprimir / PDF</button></div></div></div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-xs font-black uppercase flex items-center gap-1"><Check size={14} className="text-green-600" />{alreadyCompleted ? "Tus respuestas se Guardaron correctamente." : "Datos ya registrados"}</p>
            {savedAt && <p className="text-xs text-green-700 mt-2 flex items-center gap-1 font-bold"><Check size={14} className="text-green-600" />{alreadyCompleted ? "Tus respuestas se Guardaron correctamente." : `Guardado: ${savedAt}`}</p>}
            {error && <p className="text-xs text-red-600 font-bold mt-2">{error}</p>}
            <button onClick={save} disabled={saving} className="mt-3 bg-[#d8215d] text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-60 inline-flex items-center gap-2"><Save size={16} />{saving ? "Guardando..." : "Guardar en BD"}</button>
          </div>
          <div className="mt-6 bg-white border border-slate-200 rounded-[20px] overflow-hidden">
            <div className="h-2" style={{ background: info.color }} />
            <div className="p-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{info.role}</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight" style={{ color: info.color }}>{result.type} — {info.name}</h1>
              <p className="mt-2 text-slate-600 max-w-2xl mx-auto">{info.tagline} — {info.description}</p>
            </div>
            <div className="px-6 pb-8 grid gap-5">
              {(["EI", "SN", "TF", "JP"] as const).map((d) => {
                const sc = result.dimensions[d];
                const isLeft = sc.percent < 50;
                return (
                  <div key={d} className="bg-[#F9F9FB] rounded-2xl p-4 border">
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="h-full" style={{ width: `${isLeft ? 100 - sc.percent : sc.percent}%`, background: isLeft ? info.color : "#E5E7EB" }} />
                      <div className="h-full" style={{ width: `${isLeft ? sc.percent : 100 - sc.percent}%`, background: !isLeft ? info.color : "#E5E7EB" }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs font-bold"><span>{isLeft ? 100 - sc.percent : sc.percent}%</span><span>{sc.letter} · {sc.raw > 0 ? `+${sc.raw}` : sc.raw}/45</span><span>{isLeft ? sc.percent : 100 - sc.percent}%</span></div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-6 text-xs text-[#0f2b6b]/50 text-center">Para volver a rendir, solicita habilitación al administrador.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="bg-[#001d62] text-white border-b sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo-teamggm-horizontal-con-transparencia.webp" alt="TEAM GGM" className="h-7 w-auto" />
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-white/80"><span>{total}/60</span><span className="text-[#fcfcfc]">{progress}%</span></div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-1"><div className="h-full bg-[#d8215d] transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
            <button onClick={submit} className="hidden sm:inline-flex bg-[#d8215d] text-white font-bold px-5 py-2 rounded-full text-sm">Ver resultado</button>
          </div>
          {error && <p className="text-xs text-red-600 font-bold mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-black">Test de Personalidad — 60 preguntas</h1>
          <p className="text-sm text-slate-600 mt-1">Responde con sinceridad. Escala de 7 puntos · ~10 min</p>
          <div className="mt-3 flex justify-center gap-4 text-[10px] font-black uppercase tracking-wider text-[#0f2b6b]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#d8215d] inline-block border border-[#d8215d]"></span> Desacuerdo</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#fcfcfc] inline-block border border-[#0f2b6b]/30"></span> Neutral</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#1f3875] inline-block border border-[#1f3875]"></span> De acuerdo</span>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {PERSONALITY_QUESTIONS.map((q) => {
            const v = answers[q.id];
            const miss = error && missing[0] === q.id;
            return (
              <div key={q.id} id={`q-${q.id}`} className={`bg-white border rounded-2xl p-5 ${miss ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
                <div className="flex gap-3"><span className="shrink-0 w-7 h-7 rounded-full bg-[#001d62] text-white text-xs font-black flex items-center justify-center">{q.id}</span><p className="font-semibold text-[#001d62] text-[15px] leading-snug flex-1">{q.text}</p></div>
                <div className="mt-4 flex items-center justify-between gap-1">
                  <span className="text-[11px] font-black uppercase text-[#d8215d] hidden sm:block">Desacuerdo</span>
                  <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center">
                    {SCALE.map((s) => {
                      const active = v === s.v;
                      const isNeutral = s.v === 0;
                      return (
                        <button key={s.v} onClick={() => handle(q.id, s.v)} aria-label={`${s.label} ${s.v}`} className={`rounded-full border-2 flex items-center justify-center transition ${active ? "border-[#001d62] shadow" : "border-slate-300 hover:border-slate-400 bg-white"}`} style={{ width: s.size, height: s.size, background: active ? s.color : "white", borderColor: active ? "#001d62" : undefined }} title={s.label}>
                          {active && <span className={`w-2 h-2 rounded-full ${isNeutral ? "bg-[#001d62]" : "bg-white"}`}></span>}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-black uppercase text-[#1f3875] hidden sm:block">De acuerdo</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={submit} className="bg-[#d8215d] text-white font-black px-8 py-4 rounded-full shadow text-lg">Ver mi tipo →</button>
          <button onClick={reset} className="bg-white border-2 border-slate-200 font-bold px-6 py-3 rounded-full">Reiniciar</button>
        </div>
      </div>
    </div>
  );
}
