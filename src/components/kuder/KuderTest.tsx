import { useKuder } from "./useKuder";
import { KUDER_DIADAS, KUDER_AREAS, KUDER_ORDER } from "../../data/kuder";
import { LucideIcon } from "../../lib/icons";
import { BookOpen, Save, Printer, Check } from "lucide-react";

export default function KuderTest() {
  const { answers, showResult, savedAt, error, saving, alreadyCompleted, loadingExisting, gateChecked, gateReady, isMoodle, total, progress, missing, result, maxScore, handle, submit, save, reset } = useKuder();
  if (loadingExisting) return <div className="min-h-screen bg-[#EFF6FF] flex items-center justify-center p-8"><p className="text-sm text-slate-500">Cargando resultado guardado...</p></div>;
  if (!gateChecked) return <div className="min-h-screen bg-[#EFF6FF] flex items-center justify-center p-8"><p className="text-sm text-slate-500">Detectando entorno...</p></div>;
  if (!isMoodle) return <div className="min-h-screen bg-[#EFF6FF] flex items-center justify-center p-4"><div className="max-w-md w-full bg-white border rounded-2xl p-6 text-center"><h2 className="text-xl font-black">Accede desde Moodle</h2><p className="text-sm text-slate-600 mt-2">Solo Moodle guarda resultados.</p><a href="/" className="mt-4 inline-block bg-[#001d62] text-white px-6 py-2.5 rounded-full font-bold">← Volver</a></div></div>;
  if (showResult) {
    const topInfo = KUDER_AREAS[result.top];
    return (
      <div className="min-h-screen bg-[#F9F9FB]">
        {alreadyCompleted && <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">Ya completaste — mostrando resultado guardado.</div>}
        <div className="bg-white border-b sticky top-0 z-20"><div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3"><span className="text-sm font-extrabold flex items-center gap-2" style={{ color: topInfo.color }}><LucideIcon name={topInfo.icono} size={16} />{topInfo.nombre} · Kuder</span><div className="ml-auto flex gap-2"><button onClick={() => window.print()} className="text-sm bg-[#001d62] text-white px-4 py-1.5 rounded-full font-bold inline-flex items-center gap-1"><Printer size={14} />Imprimir / PDF</button></div></div></div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white border rounded-2xl p-4">
            <p className="text-xs font-black uppercase flex items-center gap-1"><Check size={14} className="text-green-600" />{alreadyCompleted ? "Tus respuestas se Guardaron correctamente." : "Datos ya registrados"}</p>
            {savedAt && <p className="text-xs text-slate-600 mt-2 flex items-center gap-1"><Check size={14} className="text-green-600" />{savedAt}</p>}
            {error && <p className="text-xs text-red-600 font-bold mt-2">{error}</p>}
            <button onClick={save} disabled={saving} className="mt-3 bg-[#1f3875] text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-60 inline-flex items-center gap-2"><Save size={16} />{saving ? "Guardando..." : "Guardar en BD"}</button>
          </div>
          <div className="mt-6 bg-white border border-slate-200 rounded-[20px] overflow-hidden">
            <div className="h-2" style={{ background: topInfo.color }} />
            <div className="p-8 text-center">
              <h1 className="mt-2 text-3xl font-black flex items-center justify-center gap-2" style={{ color: topInfo.color }}><LucideIcon name={topInfo.icono} size={32} style={{ color: topInfo.color }} />{topInfo.nombre}</h1>
              <p className="mt-2 text-slate-600 max-w-2xl mx-auto">{topInfo.descripcion}</p>
              <p className="mt-2 text-sm"><b>Carreras afines:</b> {topInfo.carreras}</p>
            </div>
            <div className="px-6 pb-6">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-500">Ranking 10 áreas</h3>
              <div className="mt-3 space-y-3">
                {result.ranking.map((k) => {
                  const info = KUDER_AREAS[k];
                  const w = Math.round(result.scores[k] / maxScore * 100);
                  return (
                    <div key={k} className="flex items-center gap-3">
                      <span className="w-10 text-xs font-black">{k}</span>
                      <span className="w-8 flex justify-center"><LucideIcon name={info.icono} size={16} style={{ color: info.color }} /></span>
                      <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden"><div className="h-full flex items-center justify-end pr-2 text-[10px] font-black text-white" style={{ width: `${w}%`, background: info.color, minWidth: result.scores[k] > 0 ? "32px" : "0" }}>{result.scores[k] > 0 ? result.scores[k] : ""}</div></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="mt-6 text-xs text-[#0f2b6b]/50 text-center">Para volver a rendir, solicita habilitación al administrador.</p>
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
              <div className="flex justify-between text-xs font-bold text-white/80"><span>{total}/60 diadas</span><span className="text-[#fcfcfc]">{progress}%</span></div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-1"><div className="h-full bg-[#d8215d] transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
            <button onClick={submit} className="hidden sm:inline-flex bg-[#d8215d] text-white font-bold px-5 py-2 rounded-full text-sm">Ver resultado</button>
          </div>
          {error && <p className="text-xs text-red-600 font-bold mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-black">Test Kuder — 60 diadas</h1>
          <p className="text-sm text-slate-600 mt-1">Elige en cada par la actividad que <b>más te gusta</b>.</p>
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
                    const info = KUDER_AREAS[opt.area];
                    return (
                      <button key={ch} onClick={() => handle(d.id, ch)} className={`text-left p-3 rounded-xl border-2 flex gap-3 items-center transition ${active ? "border-[#001d62] bg-[#001d62] text-white shadow" : "bg-white border-slate-300 hover:border-slate-400"}`}>
                        <LucideIcon name={info.icono} size={18} className={active ? "text-white" : ""} style={!active ? { color: info.color } : undefined} />
                        <div className="flex-1"><p className={`text-sm font-bold leading-tight ${active ? "text-white" : "text-[#001d62]"}`}>{opt.texto}</p><p className={`text-[10px] font-black uppercase tracking-wider ${active ? "text-white/70" : "text-slate-500"}`}>{opt.area} · {info.nombre}</p></div>
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
