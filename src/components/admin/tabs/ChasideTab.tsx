import React from 'react';
import { BookOpen } from "lucide-react";
import { AREAS, AREA_ORDER } from "../../../data/chaside";
import { PlotlyChart } from "../PlotlyChart";

export function ChasideTab({ chaside }: { chaside: any }) {
  if (!chaside) return null;
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-[#E1E3DA] border border-[#1D60A9]/10 rounded-2xl p-4">
        <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-1"><BookOpen size={14} />Leyenda CHASIDE</h3>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {AREA_ORDER.map((k: any) => { const info = (AREAS as any)[k]; return <div key={k} className="bg-white border rounded-xl px-2 py-2 text-center"><span className="w-6 h-6 rounded-full text-white text-xs font-black inline-flex items-center justify-center" style={{ background: info.color }}>{k}</span><p className="font-bold mt-1 leading-none">{info.nombreCorto}</p><p className="text-[10px] text-slate-500 leading-none">{info.nombre}</p></div>; })}
        </div>
        <p className="text-xs text-slate-600 mt-2">Intereses 0–10, Aptitudes 0–4. Top = mayor puntaje. Ver “Estudiantes → Ver” para detalle completo.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total CHASIDE</p><p className="text-3xl font-black">{chaside.total}</p></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Top intereses</p><div className="mt-2 space-y-1 text-sm">{Object.entries(chaside.topIntereses).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="font-bold">{k}</span><span>{String(v)}</span></div>)}</div></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Promedios intereses (0-10)</p><div className="mt-2 grid grid-cols-7 gap-1 text-xs text-center">{Object.entries(chaside.promediosIntereses).map(([k, v]: any) => <div key={k} className="bg-slate-50 border rounded-lg p-2"><p className="font-black">{k}</p><p>{String(v)}</p></div>)}</div></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Top intereses</h3><PlotlyChart data={[{ x: Object.keys(chaside.topIntereses), y: Object.values(chaside.topIntereses), type: "bar", marker: { color: "#1D60A9" } }]} layout={{ yaxis: { title: "Estudiantes" } }} /></div>
        <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Promedio aptitudes (0-4)</h3><PlotlyChart data={[{ x: Object.keys(chaside.promediosAptitudes), y: Object.values(chaside.promediosAptitudes), type: "bar", marker: { color: "#E8356A" } }]} layout={{ yaxis: { title: "Promedio" } }} /></div>
      </div>
      <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Radar promedios intereses</h3><PlotlyChart data={[{ type: "scatterpolar", r: [...Object.values(chaside.promediosIntereses) as number[], (Object.values(chaside.promediosIntereses) as number[])[0]], theta: [...Object.keys(chaside.promediosIntereses), Object.keys(chaside.promediosIntereses)[0]], fill: "toself", marker: { color: "#1D60A9" } }]} layout={{ polar: { radialaxis: { visible: true, range: [0, 10] } } }} style={{ width: "100%", height: "400px" }} /></div>
    </div>
  );
}
