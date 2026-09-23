import React from 'react';
import { BookOpen, Check, Minus, X } from "lucide-react";
import { AREAS, AREA_ORDER, INTERESES_GRID, APTITUDES_GRID } from "../../data/chaside";
import { TYPES } from "../../data/personalidad";
import { KUDER_AREAS, KUDER_ORDER } from "../../data/kuder";
import { LucideIcon } from "../../lib/icons";

export function EstudianteDetailModal({ selected, setSelected, authHeader, load, isAdmin }: any) {
  if (!selected) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-black text-lg">{selected.estudiante.moodle_user_name || selected.estudiante.nombre_estudiante || "—"}</h3>
            <p className="text-xs text-slate-500">ID {selected.estudiante.id} · Moodle {selected.estudiante.moodle_user_id ?? "—"} · Creado {new Date((selected.estudiante.created_at || 0) * 1000).toLocaleString()}</p>
            <p className="text-xs mt-1">Email: {selected.estudiante.moodle_user_email || "—"} · Curso: {selected.estudiante.moodle_course_id ?? "—"}</p>
          </div>
          <button onClick={() => setSelected(null)} className="bg-slate-100 border rounded-full w-8 h-8 flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="mt-3 bg-[#fcfcfc] border border-[#001d62]/10 rounded-xl p-3 text-xs">
          <p className="font-black flex items-center gap-1"><BookOpen size={14} />Cómo leer (igual que ve el estudiante):</p>
          <p className="text-slate-600 mt-1"><b>CHASIDE</b> 7 áreas C/H/A/S/I/D/E — Intereses 0–10, Aptitudes 0–4. <b>MBTI</b> 4 dicotomías con leyenda abajo. <b>Kuder</b> 10 áreas 0–60 con leyenda.</p>
        </div>

        {/* CHASIDE — como lo ve el estudiante */}
        <div className={`mt-4 border rounded-2xl p-4 ${selected.chaside ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <h4 className="font-black text-sm flex items-center gap-1">CHASIDE {selected.chaside ? <><Check size={14} className="text-green-600" />{selected.chaside.topInteres} · {(AREAS as any)[selected.chaside.topInteres]?.nombre}</> : <><Minus size={14} className="text-red-500" />faltante</>}</h4>
          {selected.chaside ? <>
            <div className="mt-3 bg-white border border-[#001d62]/10 rounded-xl p-3">
              <p className="text-xs font-black uppercase tracking-wider text-[#001d62]">Leyenda CHASIDE — 7 áreas</p>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                {AREA_ORDER.map((k: any) => { const info = (AREAS as any)[k]; return <div key={k} className="flex gap-2 items-center bg-[#fcfcfc] border border-[#001d62]/10 rounded-xl px-2 py-2"><span className="w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0" style={{ background: info.color }}>{k}</span><div><p className="font-bold leading-none text-[#001d62] text-xs">{info.nombre}</p><p className="text-[10px] text-[#0f2b6b]/60">{info.nombreCorto}</p></div></div>; })}
              </div>
            </div>
            <div className="mt-4 bg-white border rounded-xl p-3">
              <h5 className="font-bold text-[#001d62] text-sm">Lo que más le interesa</h5>
              <p className="text-sm text-[#0f2b6b] mt-1">Obtuvo <b>{selected.chaside.intereses[selected.chaside.topInteres]}/10</b> en <b>{(AREAS as any)[selected.chaside.topInteres]?.nombre} ({selected.chaside.topInteres})</b></p>
              <p className="text-xs text-[#0f2b6b] mt-2 leading-relaxed">{(AREAS as any)[selected.chaside.topInteres]?.interesesDesc} Aptitudes: {(AREAS as any)[selected.chaside.topInteres]?.aptitudesTraits}.</p>
              <p className="text-xs mt-2"><b>Carreras:</b> {(AREAS as any)[selected.chaside.topInteres]?.carreras}</p>
              {selected.chaside.segundoInteres && selected.chaside.intereses[selected.chaside.segundoInteres] > 0 && <>
                <h5 className="font-bold text-[#001d62] text-sm mt-4">También le interesa</h5>
                <p className="text-sm text-[#0f2b6b] mt-1">Obtuvo <b>{selected.chaside.intereses[selected.chaside.segundoInteres]}/10</b> en <b>{(AREAS as any)[selected.chaside.segundoInteres]?.nombre} ({selected.chaside.segundoInteres})</b></p>
                <p className="text-xs text-[#0f2b6b] mt-2 leading-relaxed">{(AREAS as any)[selected.chaside.segundoInteres]?.interesesDesc}</p>
                <p className="text-xs mt-2"><b>Carreras:</b> {(AREAS as any)[selected.chaside.segundoInteres]?.carreras}</p>
              </>}
              <h5 className="font-bold text-[#001d62] text-sm mt-4">Tiene aptitudes para</h5>
              <p className="text-sm text-[#0f2b6b] mt-1">Obtuvo <b>{selected.chaside.aptitudes[selected.chaside.topAptitud]}/4</b> en <b>{(AREAS as any)[selected.chaside.topAptitud]?.nombre} ({selected.chaside.topAptitud})</b></p>
              <p className="text-xs text-[#0f2b6b] mt-2 leading-relaxed">Aptitudes: {(AREAS as any)[selected.chaside.topAptitud]?.aptitudesTraits}.</p>
              <p className="text-xs mt-2"><b>Carreras:</b> {(AREAS as any)[selected.chaside.topAptitud]?.carreras}</p>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#001d62]">Test CHASIDE Intereses — como ve el estudiante</p>
                <div className="overflow-x-auto mt-1 border border-[#001d62]/20 rounded-xl">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead><tr className="bg-[#001d62] text-white">{AREA_ORDER.map((k: any) => <th key={k} className="px-2 py-1.5 font-black">{k}</th>)}</tr></thead>
                    <tbody>
                      {INTERESES_GRID.map((row: any, i: number) => <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#fcfcfc]"}>{row.map((n: number, j: number) => <td key={j} className="px-2 py-1.5 border border-[#001d62]/10 text-[#001d62]">{n}</td>)}</tr>)}
                      <tr className="bg-[#d8215d] text-white font-black">{AREA_ORDER.map((k: any) => <td key={k} className="px-2 py-1.5 border border-[#001d62]/10">{selected.chaside.intereses[k]}</td>)}</tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#001d62]">Test CHASIDE Aptitudes — como ve el estudiante</p>
                <div className="overflow-x-auto mt-1 border border-[#001d62]/20 rounded-xl">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead><tr className="bg-[#001d62] text-white">{AREA_ORDER.map((k: any) => <th key={k} className="px-2 py-1.5 font-black">{k}</th>)}</tr></thead>
                    <tbody>
                      {APTITUDES_GRID.map((row: any, i: number) => <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#fcfcfc]"}>{row.map((n: number) => <td key={n} className="px-2 py-1.5 border border-[#001d62]/10 text-[#001d62]">{n}</td>)}</tr>)}
                      <tr className="bg-[#d8215d] text-white font-black">{AREA_ORDER.map((k: any) => <td key={k} className="px-2 py-1.5 border border-[#001d62]/10">{selected.chaside.aptitudes[k]}</td>)}</tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{new Date(selected.chaside.fecha_unix * 1000).toLocaleString()} · Top {selected.chaside.topInteres} · 2do {selected.chaside.segundoInteres || "—"} · Apt {selected.chaside.topAptitud}</p>
          </> : <p className="text-xs text-slate-600 mt-2">Pendiente de rendir (98 SÍ/NO).</p>}
        </div>

        {/* MBTI — con leyenda de cada letra */}
        <div className={`mt-4 border rounded-2xl p-4 ${selected.personalidad ? "bg-purple-50 border-purple-200" : "bg-red-50 border-red-200"}`}>
          <h4 className="font-black text-sm flex items-center gap-1">MBTI Personalidad {selected.personalidad ? <><Check size={14} className="text-green-600" />{selected.personalidad.tipo} · {(TYPES as any)[selected.personalidad.tipo]?.name}</> : <><Minus size={14} className="text-red-500" />faltante</>}</h4>
          {selected.personalidad ? (() => { const t = (TYPES as any)[selected.personalidad.tipo]; return <>
            <div className="mt-3 bg-white border rounded-xl p-3">
              <p className="text-xs font-black uppercase tracking-wider text-[#001d62]">Leyenda MBTI — qué significa cada letra</p>
              <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs">
                <div><b>E</b> Extravertido (energía con gente) vs <b>I</b> Introvertido (energía a solas)</div>
                <div><b>S</b> Observador/Sensorial (concreto, presente) vs <b>N</b> Intuitivo (posibilidades, futuro)</div>
                <div><b>N</b> Nat. Intuitivo vs <b>S</b> Sensorial — ver arriba</div>
                <div><b>T</b> Pensamiento (lógica, verdad) vs <b>F</b> Sentimiento (empatía, armonía)</div>
                <div><b>J</b> Juzgador (orden, planes) vs <b>P</b> Prospección (flexible, improvisas)</div>
                <div><b>50%</b> neutral, <b>&gt;60%</b> ligera, <b>&gt;75%</b> marcada</div>
              </div>
            </div>
            <div className="mt-3 bg-white border rounded-xl p-3 text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t.role}</p>
              <p className="mt-1 text-lg font-black" style={{ color: t.color }}>{t.code} — {t.name}</p>
              <p className="text-xs text-slate-700 mt-1">{t.tagline} — {t.description}</p>
              <div className="mt-2 flex flex-wrap gap-1 justify-center">{t.strengths.map((s: string) => <span key={s} className="text-[10px] font-bold px-2 py-1 rounded-full border bg-[#fcfcfc]">{s}</span>)}</div>
            </div>
            <div className="mt-3 space-y-2">{Object.entries(selected.personalidad.dimensiones as any).map(([k, v]: any) => {
              const label = k === "EI" ? "Mente E/I" : k === "SN" ? "Energía S/N" : k === "TF" ? "Naturaleza T/F" : "Táctica J/P";
              const left = k === "EI" ? "I Introvertido" : k === "SN" ? "N Intuitivo" : k === "TF" ? "F Sentimiento" : "P Prospección";
              const right = k === "EI" ? "E Extravertido" : k === "SN" ? "S Observador" : k === "TF" ? "T Pensamiento" : "J Juzgador";
              return <div key={k} className="bg-white border rounded-lg p-2"><p className="text-[10px] font-black uppercase">{label}: {v.letter} {v.percent}% · {v.raw > 0 ? `+${v.raw}` : v.raw}/45</p><div className="mt-1 h-2 bg-slate-200 rounded-full overflow-hidden flex"><div className="h-full" style={{ background: t.color, width: `${v.percent}%` }} /><div className="h-full bg-slate-200" style={{ width: `${100 - v.percent}%` }} /></div><p className="text-[10px] flex justify-between mt-1"><span>{left}</span><span>{right}</span></p></div>;
            })}</div>
            <p className="text-xs text-slate-500 mt-2">{new Date(selected.personalidad.fecha_unix * 1000).toLocaleString()} · {selected.personalidad.tipo}</p>
          </>; })() : <p className="text-xs text-slate-600 mt-2">Pendiente (60 Likert -3..+3).</p>}
        </div>

        {/* KUDER — con leyenda de cada abreviatura */}
        <div className={`mt-4 border rounded-2xl p-4 ${selected.kuder ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
          <h4 className="font-black text-sm flex items-center gap-1">Kuder {selected.kuder ? <><Check size={14} className="text-green-600" />{selected.kuder.top} · {(KUDER_AREAS as any)[selected.kuder.top]?.nombre}</> : <><Minus size={14} className="text-red-500" />faltante</>}</h4>
          {selected.kuder ? (() => { const topInfo = (KUDER_AREAS as any)[selected.kuder.top]; return <>
            <div className="mt-3 bg-white border rounded-xl p-3">
              <p className="text-xs font-black uppercase tracking-wider text-[#001d62]">Leyenda Kuder — 10 áreas</p>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {KUDER_ORDER.map((k: any) => { const info = (KUDER_AREAS as any)[k]; const isTop = k === selected.kuder.top; return <div key={k} className={`flex gap-2 items-center border rounded-xl px-2 py-2 ${isTop ? "bg-[#001d62] text-white border-[#001d62]" : "bg-[#fcfcfc] border-[#001d62]/10"}`}><LucideIcon name={info.icono} size={14} style={{ color: isTop ? "white" : info.color }} /><div><p className="font-black leading-none text-xs">{k}</p><p className="font-bold text-[10px] leading-none">{info.nombre}</p><p className="text-[9px] opacity-70">{info.nombreCorto}</p></div></div>; })}
              </div>
            </div>
            <div className="mt-3 bg-white border rounded-xl p-3">
              <p className="text-sm font-black flex items-center gap-1" style={{ color: topInfo.color }}><LucideIcon name={topInfo.icono} size={16} style={{ color: topInfo.color }} />{topInfo.nombre} ({selected.kuder.top}) — {selected.kuder.scores[selected.kuder.top]}/60</p>
              <p className="text-xs text-slate-700 mt-1">{topInfo.descripcion}</p>
              <p className="text-xs mt-1"><b>Carreras:</b> {topInfo.carreras}</p>
              <p className="text-xs mt-2"><b>Ranking:</b> {selected.kuder.ranking.join(" > ")}</p>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1 text-xs text-center">
              {KUDER_ORDER.map((k: any) => { const v = selected.kuder.scores[k]; const isTop = k === selected.kuder.top; return <div key={k} className={`border rounded p-1.5 ${isTop ? "bg-[#d8215d] text-white font-black border-[#d8215d]" : "bg-white"}`}><span className="font-black">{k}</span><br />{v}</div>; })}
            </div>
            <p className="text-xs text-slate-500 mt-2">{new Date(selected.kuder.fecha_unix * 1000).toLocaleString()} · Verif: {selected.kuder.verificacion}</p>
          </>; })() : <p className="text-xs text-slate-600 mt-2">Pendiente (60 diadas).</p>}
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.chaside ? "bg-green-600 text-white" : "bg-red-100 text-red-700"}`}>CHASIDE {selected.chaside ? "rendido" : "pendiente"}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.personalidad ? "bg-purple-600 text-white" : "bg-red-100 text-red-700"}`}>MBTI {selected.personalidad ? "rendido" : "pendiente"}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.kuder ? "bg-blue-600 text-white" : "bg-red-100 text-red-700"}`}>Kuder {selected.kuder ? "rendido" : "pendiente"}</span>
          <span className="ml-auto text-xs font-bold">Faltan {3 - [selected.chaside, selected.personalidad, selected.kuder].filter(Boolean).length} test(s)</span>
        </div>
        {isAdmin && selected.estudiante.moodle_user_id && (
          <div className="mt-4 border rounded-xl p-3 bg-[#fcfcfc]">
            <p className="text-xs font-black">Moodle — marcado manual de completado</p>
            <p className="text-[11px] text-slate-500 mt-1">Si el check no se marcó automático (ej. cmid mal configurado o WS deshabilitado), usa estos botones. Llama a <code>core_completion_update_activity_completion_status_manually</code> con el cmid de Admin &gt; Moodle.</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              {selected.chaside && <button onClick={async () => { const r = await fetch("/api/admin/moodle/complete", { method: "POST", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify({ moodle_user_id: selected.estudiante.moodle_user_id, test: "CHASIDE" }) }); const j = await r.json(); if (j.success) alert(`CHASIDE cmid ${j.cmid} marcado ✓`); else alert(`No se pudo marcar en Moodle: ${j.warning || j.error || (j.moodleData as any)?.exception || (j.moodleData as any)?.message || JSON.stringify(j).slice(0,300)}\n\nVerifica: 1) Túnel trycloudflare activo y MOODLE_URL correcta, 2) cmid ${j.cmid} existe y tiene Completion tracking = Students must manually mark, 3) Usuario ${selected.estudiante.moodle_user_id} está matriculado.`); }} className="bg-[#001d62] text-white px-3 py-1.5 rounded-full text-xs font-bold">Marcar CHASIDE (id 9) en Moodle</button>}
              {selected.personalidad && <button onClick={async () => { const r = await fetch("/api/admin/moodle/complete", { method: "POST", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify({ moodle_user_id: selected.estudiante.moodle_user_id, test: "MBTI" }) }); const j = await r.json(); if (j.success) alert(`MBTI cmid ${j.cmid} marcado ✓`); else alert(`No se pudo marcar en Moodle: ${j.warning || j.error || (j.moodleData as any)?.exception || (j.moodleData as any)?.message || JSON.stringify(j).slice(0,300)}\n\nVerifica cmid y matrícula.`); }} className="bg-[#7C3AED] text-white px-3 py-1.5 rounded-full text-xs font-bold">Marcar MBTI (id 10) en Moodle</button>}
              {selected.kuder && <button onClick={async () => { const r = await fetch("/api/admin/moodle/complete", { method: "POST", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify({ moodle_user_id: selected.estudiante.moodle_user_id, test: "KUDER" }) }); const j = await r.json(); if (j.success) alert(`Kuder cmid ${j.cmid} marcado ✓`); else alert(`No se pudo marcar en Moodle: ${j.warning || j.error || (j.moodleData as any)?.exception || (j.moodleData as any)?.message || JSON.stringify(j).slice(0,300)}`); }} className="bg-[#2563EB] text-white px-3 py-1.5 rounded-full text-xs font-bold">Marcar Kuder (id 11) en Moodle</button>}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Moodle: {selected.estudiante.moodle_user_id} · cmids actuales: CHASIDE 9 / MBTI 10 / Kuder 11 (configurables en Admin &gt; Moodle)</p>
          </div>
        )}
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
