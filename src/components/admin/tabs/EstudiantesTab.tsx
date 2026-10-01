import React, { useMemo, useState } from 'react';
import { Check, Minus, Filter, X, ArrowUpDown } from "lucide-react";

type SortKey = "nombre" | "id" | "email" | "curso" | "faltan";
type SortDir = "asc" | "desc";

export function EstudiantesTab({ students, openDetail }: { students: any[]; openDetail: (id: string) => void }) {
  const [fNombre, setFNombre] = useState("");
  const [fId, setFId] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fCurso, setFCurso] = useState("");
  const [fC, setFC] = useState<"all" | "si" | "no">("all");
  const [fP, setFP] = useState<"all" | "si" | "no">("all");
  const [fK, setFK] = useState<"all" | "si" | "no">("all");
  const [fFaltan, setFFaltan] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let out = students.filter(s => {
      const nombre = (s.moodle_user_name || s.nombre_estudiante || "").toLowerCase();
      const email = (s.moodle_user_email || s.correo_estudiante || "").toLowerCase();
      const idStr = String(s.moodle_user_id ?? "");
      const cursoStr = String(s.moodle_course_id ?? "");
      const faltan = String(3 - (s.completados ?? 0));
      if (fNombre && !nombre.includes(fNombre.toLowerCase())) return false;
      if (fId && !idStr.includes(fId)) return false;
      if (fEmail && !email.includes(fEmail.toLowerCase())) return false;
      if (fCurso && !cursoStr.includes(fCurso)) return false;
      if (fC === "si" && !s.hasChaside) return false;
      if (fC === "no" && s.hasChaside) return false;
      if (fP === "si" && !s.hasPersonalidad) return false;
      if (fP === "no" && s.hasPersonalidad) return false;
      if (fK === "si" && !s.hasKuder) return false;
      if (fK === "no" && s.hasKuder) return false;
      if (fFaltan !== "all" && faltan !== fFaltan) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      let va: any, vb: any;
      if (sortKey === "nombre") { va = (a.moodle_user_name || a.nombre_estudiante || "").toLowerCase(); vb = (b.moodle_user_name || b.nombre_estudiante || "").toLowerCase(); }
      else if (sortKey === "id") { va = Number(a.moodle_user_id ?? 0); vb = Number(b.moodle_user_id ?? 0); }
      else if (sortKey === "email") { va = (a.moodle_user_email || "").toLowerCase(); vb = (b.moodle_user_email || "").toLowerCase(); }
      else if (sortKey === "curso") { va = Number(a.moodle_course_id ?? 0); vb = Number(b.moodle_course_id ?? 0); }
      else if (sortKey === "faltan") { va = 3 - (a.completados ?? 0); vb = 3 - (b.completados ?? 0); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [students, fNombre, fId, fEmail, fCurso, fC, fP, fK, fFaltan, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const hasFilters = fNombre || fId || fEmail || fCurso || fC !== "all" || fP !== "all" || fK !== "all" || fFaltan !== "all";
  const clear = () => { setFNombre(""); setFId(""); setFEmail(""); setFCurso(""); setFC("all"); setFP("all"); setFK("all"); setFFaltan("all"); };

  return (
    <div className="mt-6 space-y-3">
      <div className="bg-[#E1E3DA] border border-[#1D60A9]/10 rounded-2xl p-3 text-xs flex flex-wrap gap-3 items-center">
        <span className="inline-flex items-center gap-1"><b>C</b> = CHASIDE (<Check size={12} className="inline text-green-600" /> + letra)</span>
        <span className="inline-flex items-center gap-1"><b>P</b> = MBTI (<Check size={12} className="inline text-green-600" /> + tipo)</span>
        <span className="inline-flex items-center gap-1"><b>K</b> = Kuder (<Check size={12} className="inline text-green-600" /> + área)</span>
        <span><b>Faltan</b> = 3 - completados</span>
        <span><b>R</b> = reintento habilitado (sin usar) · <b>·I2</b> = intento 2</span>
        <span className="text-slate-500">Ver = detalle + habilitar retake (solo admin)</span>
      </div>

      <div className="bg-white border rounded-2xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-[#1D60A9]" />
          <span className="text-xs font-black uppercase tracking-wider text-[#1D60A9]">Filtros Excel</span>
          <span className="text-xs text-slate-500">{filtered.length} / {students.length}</span>
          {hasFilters && <button onClick={clear} className="ml-auto text-xs bg-slate-100 hover:bg-slate-200 border px-3 py-1 rounded-full inline-flex items-center gap-1"><X size={12} />Limpiar</button>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          <input value={fNombre} onChange={e => setFNombre(e.target.value)} placeholder="Filtrar nombre..." className="border rounded-lg px-2 py-1.5 text-xs" />
          <input value={fId} onChange={e => setFId(e.target.value)} placeholder="Filtrar ID..." className="border rounded-lg px-2 py-1.5 text-xs" />
          <input value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="Filtrar email..." className="border rounded-lg px-2 py-1.5 text-xs" />
          <input value={fCurso} onChange={e => setFCurso(e.target.value)} placeholder="Filtrar curso..." className="border rounded-lg px-2 py-1.5 text-xs" />
          <select value={fC} onChange={e => setFC(e.target.value as any)} className="border rounded-lg px-2 py-1.5 text-xs bg-white">
            <option value="all">C: Todos</option>
            <option value="si">C: Sí</option>
            <option value="no">C: No</option>
          </select>
          <select value={fP} onChange={e => setFP(e.target.value as any)} className="border rounded-lg px-2 py-1.5 text-xs bg-white">
            <option value="all">P: Todos</option>
            <option value="si">P: Sí</option>
            <option value="no">P: No</option>
          </select>
          <select value={fK} onChange={e => setFK(e.target.value as any)} className="border rounded-lg px-2 py-1.5 text-xs bg-white">
            <option value="all">K: Todos</option>
            <option value="si">K: Sí</option>
            <option value="no">K: No</option>
          </select>
          <select value={fFaltan} onChange={e => setFFaltan(e.target.value)} className="border rounded-lg px-2 py-1.5 text-xs bg-white">
            <option value="all">Faltan: Todos</option>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1D60A9] text-white text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => toggleSort("nombre")}>Moodle Nombre <ArrowUpDown size={12} className="inline ml-1 opacity-60" /></th>
                <th className="px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort("id")}>Moodle ID <ArrowUpDown size={12} className="inline ml-1 opacity-60" /></th>
                <th className="px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort("email")}>Email Moodle <ArrowUpDown size={12} className="inline ml-1 opacity-60" /></th>
                <th className="px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort("curso")}>Curso <ArrowUpDown size={12} className="inline ml-1 opacity-60" /></th>
                <th className="px-3 py-2">C</th>
                <th className="px-3 py-2">P</th>
                <th className="px-3 py-2">K</th>
                <th className="px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort("faltan")}>Faltan <ArrowUpDown size={12} className="inline ml-1 opacity-60" /></th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 font-bold">{s.moodle_user_name || s.nombre_estudiante || "—"}</td>
                  <td className="px-3 py-2 text-center text-xs font-mono">{s.moodle_user_id ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{s.moodle_user_email || s.correo_estudiante || "—"}</td>
                  <td className="px-3 py-2 text-xs text-center">{s.moodle_course_id ?? "—"}</td>
                  <td className="px-3 py-2 text-center">{s.hasChaside ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><Check size={12} />{s.chaside?.top_interes}{s.chaside?.intento_numero > 1 ? <span className="opacity-70">·I{s.chaside.intento_numero}</span> : null}</span> : <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs inline-flex items-center gap-1"><Minus size={12} /></span>}</td>
                  <td className="px-3 py-2 text-center">{s.hasPersonalidad ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">{s.personalidad?.tipo}{s.personalidad?.intento_numero > 1 ? <span className="opacity-70"> ·I{s.personalidad.intento_numero}</span> : null}</span> : <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs inline-flex items-center gap-1"><Minus size={12} /></span>}</td>
                  <td className="px-3 py-2 text-center">{s.hasKuder ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{s.kuder?.top}{s.kuder?.intento_numero > 1 ? <span className="opacity-70">·I{s.kuder.intento_numero}</span> : null}</span> : <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs inline-flex items-center gap-1"><Minus size={12} /></span>}</td>
                  <td className="px-3 py-2 text-center font-black text-red-600">{3 - s.completados}{(s.reintentosPendientes || []).length > 0 && <span className="ml-1 align-middle bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-1.5 py-0.5 text-[10px] font-black" title={`Reintento habilitado: ${s.reintentosPendientes.join(", ")}`}>R</span>}</td>
                  <td className="px-3 py-2"><button onClick={() => openDetail(s.id)} className="bg-[#1D60A9] text-white px-3 py-1 rounded-full text-xs font-bold">Ver</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Sin resultados con esos filtros. <button onClick={clear} className="underline">Limpiar</button></td></tr>}
              {students.length === 0 && filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Sin datos. Rinde tests con ?moodleUserId=</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
