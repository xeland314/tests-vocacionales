import React, { useMemo, useState } from 'react';
import { Check, Filter, Minus, X, ArrowUpDown } from "lucide-react";
import { PlotlyChart } from "../PlotlyChart";

export function ResumenTab({ overview, students }: { overview: any; students: any[] }) {
  const [fEst, setFEst] = useState("");
  const [fFaltan, setFFaltan] = useState("all");
  const [sort, setSort] = useState<"est" | "faltan">("est");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const filt = useMemo(() => {
    let out = students.filter((s: any) => {
      const n = (s.moodle_user_name || s.nombre_estudiante || "").toLowerCase();
      if (fEst && !n.includes(fEst.toLowerCase())) return false;
      const faltan = String(3 - (s.completados ?? 0));
      if (fFaltan !== "all" && faltan !== fFaltan) return false;
      return true;
    });
    out = [...out].sort((a: any, b: any) => {
      let va: any, vb: any;
      if (sort === "est") { va = (a.moodle_user_name || "").toLowerCase(); vb = (b.moodle_user_name || "").toLowerCase(); }
      else { va = 3 - (a.completados ?? 0); vb = 3 - (b.completados ?? 0); }
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return out.slice(0, 20);
  }, [students, fEst, fFaltan, sort, dir]);
  const hasF = fEst || fFaltan !== "all";
  if (!overview) return null;
  return (
    <div className="mt-6 space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total estudiantes</p><p className="text-3xl font-black mt-1">{overview.totalEstudiantes}</p><p className="text-xs text-slate-500 mt-1">{overview.completos} con 3 tests · {overview.solo2} con 2 · {overview.solo1} con 1 · {overview.ninguno} sin tests</p></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Completitud</p><p className="text-2xl font-black mt-1">{overview.totalEstudiantes ? Math.round(overview.completos / overview.totalEstudiantes * 100) : 0}% completos</p><div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden flex"><div className="bg-[#1D60A9] h-full" style={{ width: `${overview.totalEstudiantes ? (overview.completos / overview.totalEstudiantes * 100) : 0}%` }} /><div className="bg-[#1D60A9] h-full" style={{ width: `${overview.totalEstudiantes ? (overview.solo2 / overview.totalEstudiantes * 100) : 0}%` }} /><div className="bg-amber-400 h-full" style={{ width: `${overview.totalEstudiantes ? (overview.solo1 / overview.totalEstudiantes * 100) : 0}%` }} /></div><p className="text-[10px] mt-1 text-slate-500">Azul oscuro 3 tests · Azul 2 · Amarillo 1</p></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Aplicaciones por test</p><div className="mt-2 space-y-1 text-sm"><div className="flex justify-between"><span className="font-bold">CHASIDE</span><span>{overview.totalChaside}</span></div><div className="flex justify-between"><span className="font-bold">Personalidad</span><span>{overview.totalPersonalidad}</span></div><div className="flex justify-between"><span className="font-bold">Kuder</span><span>{overview.totalKuder}</span></div></div></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Faltantes (muestra)</p><p className="text-xs mt-2 text-slate-600">{overview.faltantes.slice(0, 5).map((f: any) => `${f.id.slice(0, 6)}:${[f.hasC ? "C" : "–", f.hasP ? "P" : "–", f.hasK ? "K" : "–"].join("")}`).join(" · ") || "—"}</p><p className="text-xs text-slate-400 mt-2">{overview.ninguno} estudiantes sin ningún test.</p></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-4">
          <h3 className="font-black text-sm">Aplicaciones por test</h3>
          <PlotlyChart data={[{ x: ["CHASIDE", "Personalidad", "Kuder"], y: [overview.totalChaside, overview.totalPersonalidad, overview.totalKuder], type: "bar", marker: { color: ["#1D60A9", "#662483", "#2563EB"] } }]} layout={{ title: "" }} />
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <h3 className="font-black text-sm">Completitud (pie)</h3>
          <PlotlyChart data={[{ values: [overview.completos, overview.solo2, overview.solo1, overview.ninguno], labels: ["3 tests", "2 tests", "1 test", "0 tests"], type: "pie", marker: { colors: ["#1D60A9", "#1D60A9", "#E8356A", "#E5E7EB"] }, hole: 0.4 }]} layout={{ showlegend: true }} />
        </div>
      </div>
      <div className="bg-white border rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-sm">Faltantes por estudiante (20)</h3>
          <span className="text-xs text-slate-500">{filt.length} / {Math.min(students.length, 20)}</span>
          <Filter size={14} className="text-[#1D60A9] ml-1" />
          {hasF && <button onClick={() => { setFEst(""); setFFaltan("all"); }} className="ml-auto text-xs bg-slate-100 border px-2 py-1 rounded-full inline-flex items-center gap-1"><X size={12} />Limpiar</button>}
        </div>
        <div className="flex gap-2 mt-3">
          <input value={fEst} onChange={e => setFEst(e.target.value)} placeholder="Filtrar estudiante..." className="border rounded-lg px-2 py-1.5 text-xs flex-1" />
          <select value={fFaltan} onChange={e => setFFaltan(e.target.value)} className="border rounded-lg px-2 py-1.5 text-xs bg-white">
            <option value="all">Faltan: Todos</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>
          </select>
        </div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs">
            <thead className="bg-slate-50"><tr><th className="px-2 py-2 text-left cursor-pointer select-none" onClick={() => { if (sort === "est") setDir(d => d === "asc" ? "desc" : "asc"); else { setSort("est"); setDir("asc"); } }}>Estudiante <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th><th className="px-2 py-2">C</th><th className="px-2 py-2">P</th><th className="px-2 py-2">K</th><th className="px-2 py-2 cursor-pointer select-none" onClick={() => { if (sort === "faltan") setDir(d => d === "asc" ? "desc" : "asc"); else { setSort("faltan"); setDir("asc"); } }}>Faltan <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th></tr></thead>
            <tbody>{filt.map((s: any) => <tr key={s.id} className="border-t"><td className="px-2 py-2 font-bold">{s.moodle_user_name || s.nombre_estudiante || "—"}</td><td className="px-2 py-2 text-center">{s.hasChaside ? <Check size={14} className="inline text-green-600" /> : <Minus size={14} className="inline text-slate-400" />}</td><td className="px-2 py-2 text-center">{s.hasPersonalidad ? <Check size={14} className="inline text-green-600" /> : <Minus size={14} className="inline text-slate-400" />}</td><td className="px-2 py-2 text-center">{s.hasKuder ? <Check size={14} className="inline text-green-600" /> : <Minus size={14} className="inline text-slate-400" />}</td><td className="px-2 py-2 text-center font-bold text-red-600">{3 - s.completados}</td></tr>)}{filt.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Sin resultados. <button onClick={() => { setFEst(""); setFFaltan("all"); }} className="underline">Limpiar filtros</button></td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
