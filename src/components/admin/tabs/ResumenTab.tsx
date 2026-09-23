import React from 'react';
import { Check, Minus } from "lucide-react";
import { PlotlyChart } from "../PlotlyChart";

export function ResumenTab({ overview, students }: { overview: any; students: any[] }) {
  if (!overview) return null;
  return (
    <div className="mt-6 space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total estudiantes</p><p className="text-3xl font-black mt-1">{overview.totalEstudiantes}</p><p className="text-xs text-slate-500 mt-1">{overview.completos} con 3 tests · {overview.solo2} con 2 · {overview.solo1} con 1 · {overview.ninguno} sin tests</p></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Completitud</p><p className="text-2xl font-black mt-1">{overview.totalEstudiantes ? Math.round(overview.completos / overview.totalEstudiantes * 100) : 0}% completos</p><div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden flex"><div className="bg-[#001d62] h-full" style={{ width: `${overview.totalEstudiantes ? (overview.completos / overview.totalEstudiantes * 100) : 0}%` }} /><div className="bg-[#1f3875] h-full" style={{ width: `${overview.totalEstudiantes ? (overview.solo2 / overview.totalEstudiantes * 100) : 0}%` }} /><div className="bg-amber-400 h-full" style={{ width: `${overview.totalEstudiantes ? (overview.solo1 / overview.totalEstudiantes * 100) : 0}%` }} /></div><p className="text-[10px] mt-1 text-slate-500">Azul oscuro 3 tests · Azul 2 · Amarillo 1</p></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Aplicaciones por test</p><div className="mt-2 space-y-1 text-sm"><div className="flex justify-between"><span className="font-bold">CHASIDE</span><span>{overview.totalChaside}</span></div><div className="flex justify-between"><span className="font-bold">Personalidad</span><span>{overview.totalPersonalidad}</span></div><div className="flex justify-between"><span className="font-bold">Kuder</span><span>{overview.totalKuder}</span></div></div></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Faltantes (muestra)</p><p className="text-xs mt-2 text-slate-600">{overview.faltantes.slice(0, 5).map((f: any) => `${f.id.slice(0, 6)}:${[f.hasC ? "C" : "–", f.hasP ? "P" : "–", f.hasK ? "K" : "–"].join("")}`).join(" · ") || "—"}</p><p className="text-xs text-slate-400 mt-2">{overview.ninguno} estudiantes sin ningún test.</p></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-4">
          <h3 className="font-black text-sm">Aplicaciones por test</h3>
          <PlotlyChart data={[{ x: ["CHASIDE", "Personalidad", "Kuder"], y: [overview.totalChaside, overview.totalPersonalidad, overview.totalKuder], type: "bar", marker: { color: ["#001d62", "#7C3AED", "#2563EB"] } }]} layout={{ title: "" }} />
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <h3 className="font-black text-sm">Completitud (pie)</h3>
          <PlotlyChart data={[{ values: [overview.completos, overview.solo2, overview.solo1, overview.ninguno], labels: ["3 tests", "2 tests", "1 test", "0 tests"], type: "pie", marker: { colors: ["#001d62", "#1f3875", "#d8215d", "#E5E7EB"] }, hole: 0.4 }]} layout={{ showlegend: true }} />
        </div>
      </div>
      <div className="bg-white border rounded-2xl p-4">
        <h3 className="font-black text-sm">Faltantes por estudiante (20)</h3>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs">
            <thead className="bg-slate-50"><tr><th className="px-2 py-2 text-left">Estudiante</th><th className="px-2 py-2">C</th><th className="px-2 py-2">P</th><th className="px-2 py-2">K</th><th className="px-2 py-2">Faltan</th></tr></thead>
            <tbody>{students.slice(0, 20).map((s: any) => <tr key={s.id} className="border-t"><td className="px-2 py-2 font-bold">{s.moodle_user_name || s.nombre_estudiante || "—"}</td><td className="px-2 py-2 text-center">{s.hasChaside ? <Check size={14} className="inline text-green-600" /> : <Minus size={14} className="inline text-slate-400" />}</td><td className="px-2 py-2 text-center">{s.hasPersonalidad ? <Check size={14} className="inline text-green-600" /> : <Minus size={14} className="inline text-slate-400" />}</td><td className="px-2 py-2 text-center">{s.hasKuder ? <Check size={14} className="inline text-green-600" /> : <Minus size={14} className="inline text-slate-400" />}</td><td className="px-2 py-2 text-center font-bold text-red-600">{3 - s.completados}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
