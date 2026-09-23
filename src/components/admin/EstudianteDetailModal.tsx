import { BookOpen, Check, Minus, X } from "lucide-react";
import { AREAS } from "../../data/chaside";
import { TYPES } from "../../data/personalidad";
import { KUDER_AREAS } from "../../data/kuder";
import { LucideIcon } from "../../lib/icons";

export function EstudianteDetailModal({ selected, setSelected, authHeader, load, isAdmin }: any) {
  if (!selected) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-black text-lg">{selected.estudiante.moodle_user_name || selected.estudiante.nombre_estudiante || "—"}</h3>
            <p className="text-xs text-slate-500">ID {selected.estudiante.id} · Moodle {selected.estudiante.moodle_user_id ?? "—"} · Creado {new Date((selected.estudiante.created_at || 0) * 1000).toLocaleString()}</p>
            <p className="text-xs mt-1">Email: {selected.estudiante.moodle_user_email || "—"} · Curso: {selected.estudiante.moodle_course_id ?? "—"}</p>
          </div>
          <button onClick={() => setSelected(null)} className="bg-slate-100 border rounded-full w-8 h-8 flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="mt-3 bg-[#fcfcfc] border rounded-xl p-3 text-xs">
          <p className="font-black flex items-center gap-1"><BookOpen size={14} />Cómo leer:</p>
          <p className="text-slate-600 mt-1"><b>CHASIDE</b> C/H/A/S/I/D/E — Intereses 0–10, Aptitudes 0–4. <b>MBTI</b> E/I, S/N, T/F, J/P. <b>Kuder</b> 10 áreas 0–60.</p>
        </div>
        <div className="mt-4 grid lg:grid-cols-3 gap-3">
          <div className={`border rounded-xl p-4 ${selected.chaside ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <h4 className="font-black text-sm flex items-center gap-1">CHASIDE {selected.chaside ? <><Check size={14} className="text-green-600" /></> : <><Minus size={14} className="text-red-500" />faltante</>}</h4>
            {selected.chaside ? <>
              <div className="mt-2 grid grid-cols-7 gap-1 text-[10px] text-center">{Object.entries(selected.chaside.intereses).map(([k, v]: any) => <div key={k} className={`font-black p-1 rounded border ${k === selected.chaside.topInteres ? "bg-[#001d62] text-white" : "bg-[#d8215d] text-white"}`}>{k}<br />{String(v)}</div>)}</div>
              <div className="mt-2 grid grid-cols-7 gap-1 text-[10px] text-center">{Object.entries(selected.chaside.aptitudes).map(([k, v]: any) => <div key={k} className={`p-1 rounded border text-xs ${k === selected.chaside.topAptitud ? "bg-[#001d62] text-white font-black" : "bg-white"}`}>{k}<br />{String(v)}</div>)}</div>
              <div className="mt-3 bg-white border rounded-xl p-3">
                <p className="text-xs font-black">Top: {(AREAS as any)[selected.chaside.topInteres]?.nombre} ({selected.chaside.topInteres}) — {selected.chaside.intereses[selected.chaside.topInteres]}/10</p>
                <p className="text-xs text-slate-700 mt-1">{(AREAS as any)[selected.chaside.topInteres]?.interesesDesc}</p>
                <p className="text-xs mt-1"><b>Carreras:</b> {(AREAS as any)[selected.chaside.topInteres]?.carreras}</p>
                <p className="text-xs font-black mt-2">Apt: {(AREAS as any)[selected.chaside.topAptitud]?.nombre} — {selected.chaside.aptitudes[selected.chaside.topAptitud]}/4</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">{new Date(selected.chaside.fecha_unix * 1000).toLocaleString()}</p>
            </> : <p className="text-xs text-slate-600 mt-2">Pendiente de rendir (98 SÍ/NO).</p>}
          </div>
          <div className={`border rounded-xl p-4 ${selected.personalidad ? "bg-purple-50 border-purple-200" : "bg-red-50 border-red-200"}`}>
            <h4 className="font-black text-sm flex items-center gap-1">Personalidad {selected.personalidad ? <><Check size={14} className="text-green-600" />{selected.personalidad.tipo}</> : <><Minus size={14} className="text-red-500" />faltante</>}</h4>
            {selected.personalidad ? (() => { const t = (TYPES as any)[selected.personalidad.tipo]; return <>
              <p className="text-xs font-black mt-2" style={{ color: t.color }}>{t.code} — {t.name}</p>
              <p className="text-xs text-slate-700 mt-1">{t.tagline}</p>
              <div className="mt-3 space-y-2">{Object.entries(selected.personalidad.dimensiones as any).map(([k, v]: any) => <div key={k} className="bg-white border rounded-lg p-2"><p className="text-[10px] font-black uppercase">{k}: {v.letter} {v.percent}%</p><div className="mt-1 h-2 bg-slate-200 rounded-full overflow-hidden flex"><div className="h-full bg-[#001d62]" style={{ width: `${v.percent}%` }} /></div></div>)}</div>
            </>; })() : <p className="text-xs text-slate-600 mt-2">Pendiente (60 Likert).</p>}
          </div>
          <div className={`border rounded-xl p-4 ${selected.kuder ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
            <h4 className="font-black text-sm flex items-center gap-1">Kuder {selected.kuder ? <><Check size={14} className="text-green-600" />{selected.kuder.top}</> : <><Minus size={14} className="text-red-500" />faltante</>}</h4>
            {selected.kuder ? (() => { const topInfo = (KUDER_AREAS as any)[selected.kuder.top]; return <>
              <p className="text-xs font-black mt-2 flex items-center gap-1" style={{ color: topInfo.color }}><LucideIcon name={topInfo.icono} size={14} style={{ color: topInfo.color }} />{topInfo.nombre} — {selected.kuder.scores[selected.kuder.top]}/60</p>
              <p className="text-xs text-slate-700 mt-1">{topInfo.descripcion}</p>
              <div className="mt-2 grid grid-cols-5 gap-1 text-[10px] text-center">{Object.entries(selected.kuder.scores).map(([k, v]: any) => { const info = (KUDER_AREAS as any)[k]; const isTop = k === selected.kuder.top; return <div key={k} className={`border rounded p-1 ${isTop ? "bg-[#001d62] text-white" : "bg-white"}`}>{k}<br />{String(v)}</div>; })}</div>
            </>; })() : <p className="text-xs text-slate-600 mt-2">Pendiente (60 diadas).</p>}
          </div>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.chaside ? "bg-green-600 text-white" : "bg-red-100 text-red-700"}`}>CHASIDE {selected.chaside ? "rendido" : "pendiente"}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.personalidad ? "bg-purple-600 text-white" : "bg-red-100 text-red-700"}`}>MBTI {selected.personalidad ? "rendido" : "pendiente"}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.kuder ? "bg-blue-600 text-white" : "bg-red-100 text-red-700"}`}>Kuder {selected.kuder ? "rendido" : "pendiente"}</span>
          <span className="ml-auto text-xs font-bold">Faltan {3 - [selected.chaside, selected.personalidad, selected.kuder].filter(Boolean).length} test(s)</span>
        </div>
        {isAdmin && (
          <div className="mt-4 border-t pt-4 flex gap-2 flex-wrap">
            <button onClick={async () => { if (!confirm(`¿Habilitar retake para ${selected.estudiante.moodle_user_name || selected.estudiante.id}? Borrará TODOS los resultados.`)) return; await fetch(`/api/admin/estudiante/${selected.estudiante.id}`, { method: "DELETE", headers: { Authorization: authHeader } }); setSelected(null); load(); }} className="bg-[#d8215d] text-white font-bold px-4 py-2 rounded-full text-sm">Habilitar retake (borrar todo)</button>
            <button onClick={async () => { if (!confirm("¿Borrar solo CHASIDE?")) return; await fetch(`/api/admin/estudiante/${selected.estudiante.id}?test=chaside`, { method: "DELETE", headers: { Authorization: authHeader } }); setSelected(null); load(); }} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Borrar solo CHASIDE</button>
            <button onClick={async () => { if (!confirm("¿Borrar solo MBTI?")) return; await fetch(`/api/admin/estudiante/${selected.estudiante.id}?test=personalidad`, { method: "DELETE", headers: { Authorization: authHeader } }); setSelected(null); load(); }} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Borrar solo MBTI</button>
            <button onClick={async () => { if (!confirm("¿Borrar solo Kuder?")) return; await fetch(`/api/admin/estudiante/${selected.estudiante.id}?test=kuder`, { method: "DELETE", headers: { Authorization: authHeader } }); setSelected(null); load(); }} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Borrar solo Kuder</button>
          </div>
        )}
        <button onClick={() => setSelected(null)} className="mt-6 w-full bg-[#001d62] text-white font-bold py-2 rounded-full">Cerrar</button>
      </div>
    </div>
  );
}
