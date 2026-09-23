import React from 'react';
import { BookOpen } from "lucide-react";
import { PlotlyChart } from "../PlotlyChart";

export function PersonalidadTab({ pers }: { pers: any }) {
  if (!pers) return null;
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-[#fcfcfc] border border-[#7C3AED]/20 rounded-2xl p-4">
        <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-1"><BookOpen size={14} />Leyenda MBTI</h3>
        <div className="mt-2 grid sm:grid-cols-2 gap-3 text-xs">
          <div><b>Mente:</b> <b>E</b> Extravertido vs <b>I</b> Introvertido</div>
          <div><b>Energía:</b> <b>S</b> Sensorial vs <b>N</b> Intuitivo</div>
          <div><b>Naturaleza:</b> <b>T</b> Pensamiento vs <b>F</b> Sentimiento</div>
          <div><b>Táctica:</b> <b>J</b> Juzgador vs <b>P</b> Prospección</div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total Personalidad</p><p className="text-3xl font-black">{pers.total}</p></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Top tipos (16)</p><div className="mt-2 space-y-1 text-sm">{Object.entries(pers.byType).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="font-bold">{k}</span><span>{String(v)}</span></div>)}</div></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Roles</p><div className="mt-2 space-y-1 text-sm">{Object.entries(pers.byRole).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="font-bold">{k}</span><span>{String(v)}</span></div>)}</div></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Distribución 16 tipos</h3><PlotlyChart data={[{ x: Object.keys(pers.byType), y: Object.values(pers.byType), type: "bar", marker: { color: "#7C3AED" } }]} layout={{ xaxis: { tickangle: -30 } }} /></div>
        <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Roles (pie)</h3><PlotlyChart data={[{ values: Object.values(pers.byRole), labels: Object.keys(pers.byRole), type: "pie", marker: { colors: ["#7C3AED", "#10B981", "#0EA5E9", "#F59E0B"] } }]} layout={{}} /></div>
      </div>
      <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Promedio dimensiones (0-100% hacia E/S/T/J)</h3><PlotlyChart data={[{ x: Object.keys(pers.dimAvg), y: Object.values(pers.dimAvg), type: "bar", marker: { color: "#10B981" } }]} layout={{ yaxis: { range: [0, 100], title: "%" } }} /></div>
    </div>
  );
}
