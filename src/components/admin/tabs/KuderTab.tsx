import React from 'react';
import { BookOpen } from "lucide-react";
import { KUDER_AREAS, KUDER_ORDER } from "../../../data/kuder";
import { LucideIcon } from "../../../lib/icons";
import { PlotlyChart } from "../PlotlyChart";

export function KuderTab({ kuder }: { kuder: any }) {
  if (!kuder) return null;
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-[#fcfcfc] border border-[#2563EB]/20 rounded-2xl p-4">
        <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-1"><BookOpen size={14} />Leyenda Kuder — 10 áreas</h3>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {KUDER_ORDER.map((k: any) => { const info = (KUDER_AREAS as any)[k]; return <div key={k} className="bg-white border rounded-xl px-2 py-2 flex gap-2 items-center"><LucideIcon name={info.icono} size={16} style={{ color: info.color }} /><div><p className="font-black leading-none">{k}</p><p className="font-bold text-[11px] leading-none">{info.nombre}</p></div></div>; })}
        </div>
        <p className="text-xs text-slate-600 mt-2">60 diadas, puntaje 0–60, Top = más elegida.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total Kuder</p><p className="text-3xl font-black">{kuder.total}</p></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Top áreas</p><div className="mt-2 space-y-1 text-sm">{Object.entries(kuder.byTop).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="font-bold">{k}</span><span>{String(v)}</span></div>)}</div></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Promedios (0-60)</p><div className="mt-2 grid grid-cols-5 gap-1 text-xs text-center">{Object.entries(kuder.avgScores).map(([k, v]: any) => <div key={k} className="bg-slate-50 border rounded-lg p-2"><p className="font-black">{k}</p><p>{String(v)}</p></div>)}</div></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Top áreas Kuder</h3><PlotlyChart data={[{ x: Object.keys(kuder.byTop), y: Object.values(kuder.byTop), type: "bar", marker: { color: "#2563EB" } }]} layout={{}} /></div>
        <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Promedio puntajes</h3><PlotlyChart data={[{ x: Object.keys(kuder.avgScores), y: Object.values(kuder.avgScores), type: "bar", marker: { color: "#EA580C" } }]} layout={{}} /></div>
      </div>
    </div>
  );
}
