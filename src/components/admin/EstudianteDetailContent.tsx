import React from 'react';
import { BookOpen, Check, Minus, RotateCcw, X, History, ArrowRight } from "lucide-react";
import { AREAS, AREA_ORDER, INTERESES_GRID, APTITUDES_GRID } from "../../data/chaside";
import { TYPES } from "../../data/personalidad";
import { KUDER_AREAS, KUDER_ORDER } from "../../data/kuder";
import { LucideIcon } from "../../lib/icons";
import { deriveIdentity } from "../../data/mbti/identity";
import { MBTI_PROFILES } from "../../data/mbti";

/** ¿El reintento está dentro de su ventana de fechas (si tiene)? — versión cliente, sin imports de servidor. */
function enVentana(row: any): boolean {
  if (!row) return true;
  const now = Math.floor(Date.now() / 1000);
  if (row.ventana_desde_unix && now < Number(row.ventana_desde_unix)) return false;
  if (row.ventana_hasta_unix && now > Number(row.ventana_hasta_unix)) return false;
  return true;
}

type TestCodigoUI = "CHASIDE" | "PERSONALIDAD" | "KUDER";

/** Bloque compacto de comparación entre el intento actual y el anterior. */
function DiffResumen({ diff }: { diff: any }) {
  if (!diff) return null;
  const esPersonalidad = diff.tipoAnterior !== undefined;
  const esKuder = diff.topAnterior !== undefined && !esPersonalidad;
  return (
    <div className="mt-3 bg-white border rounded-xl p-3">
      <p className="text-xs font-black uppercase tracking-wider text-[#001d62] flex items-center gap-1"><History size={13} />Comparación con intento anterior</p>
      {esPersonalidad && (
        <p className="text-xs mt-2 flex items-center gap-1 flex-wrap">
          <b>{diff.tipoAnterior}</b><ArrowRight size={12} className="text-slate-400" /><b style={{ color: diff.tipoCambio ? "#d8215d" : undefined }}>{diff.tipoActual}</b>
          {diff.tipoCambio && <span className="bg-[#d8215d]/10 text-[#d8215d] px-2 py-0.5 rounded-full font-bold">cambió de tipo</span>}
          <span className="ml-auto text-[10px] text-slate-400">{diff.dimensiones.filter((d: any) => d.cambioSignificativo).length}/4 dimensiones con cambio ≥15%</span>
        </p>
      )}
      {esKuder && (
        <p className="text-xs mt-2 flex items-center gap-1 flex-wrap">
          <b>{diff.topAnterior}</b><ArrowRight size={12} className="text-slate-400" /><b style={{ color: diff.topAnterior !== diff.topActual ? "#d8215d" : undefined }}>{diff.topActual}</b>
          {diff.topAnterior !== diff.topActual && <span className="bg-[#d8215d]/10 text-[#d8215d] px-2 py-0.5 rounded-full font-bold">cambió de área principal</span>}
          <span className="ml-auto text-[10px] text-slate-400">{diff.scores.filter((d: any) => d.cambioSignificativo).length}/10 áreas con cambio ≥15 pts</span>
        </p>
      )}
      {!esPersonalidad && !esKuder && (
        <p className="text-xs mt-2 flex items-center gap-1 flex-wrap">
          Interés <b>{diff.topInteresAnterior}</b><ArrowRight size={12} className="text-slate-400" /><b style={{ color: diff.topInteresAnterior !== diff.topInteresActual ? "#d8215d" : undefined }}>{diff.topInteresActual}</b>
          {" "}· Aptitud <b>{diff.topAptitudAnterior}</b><ArrowRight size={12} className="text-slate-400" /><b style={{ color: diff.topAptitudAnterior !== diff.topAptitudActual ? "#d8215d" : undefined }}>{diff.topAptitudActual}</b>
          <span className="ml-auto text-[10px] text-slate-400">{diff.intereses.filter((d: any) => d.cambioSignificativo).length + diff.aptitudes.filter((d: any) => d.cambioSignificativo).length} áreas con cambio ≥15%</span>
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {(esPersonalidad ? diff.dimensiones : esKuder ? diff.scores : [...diff.intereses, ...diff.aptitudes])
          .filter((d: any) => d.cambioSignificativo)
          .map((d: any) => (
            <span key={d.clave} className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ borderColor: d.delta > 0 ? "#16a34a" : "#d8215d", color: d.delta > 0 ? "#16a34a" : "#d8215d" }}>
              {d.clave} {d.delta > 0 ? "+" : ""}{d.delta}
            </span>
          ))}
      </div>
    </div>
  );
}

/** Tabla de evolución: comparación entre TODOS los intentos consecutivos de un test. */
function EvolucionIntentos({ titulo, serie, resumen }: { titulo: string; serie: any[]; resumen: (row: any) => React.ReactNode }) {
  if (!serie?.length) return null;
  return (
    <div className="mt-3 bg-white border rounded-xl p-3">
      <p className="text-xs font-black uppercase tracking-wider text-[#001d62] flex items-center gap-1"><History size={13} />{titulo} — todos los intentos</p>
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="border-b-2 border-[#001d62]/20"><th className="text-left px-1 py-1">Intento</th><th className="text-left px-1 py-1">Fecha</th><th className="text-left px-1 py-1">Resultado</th><th className="text-left px-1 py-1">vs anterior</th></tr></thead>
          <tbody>
            {serie.map((s: any, i: number) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-1 py-1 font-black">#{s.intento}</td>
                <td className="px-1 py-1 text-slate-500">{new Date(s.fecha_unix * 1000).toLocaleDateString()}</td>
                <td className="px-1 py-1">{resumen(s.diff)}</td>
                <td className="px-1 py-1">
                  {s.diff.cambioSignificativo
                    ? <span className="bg-[#d8215d]/10 text-[#d8215d] px-2 py-0.5 rounded-full font-bold text-[10px]">cambio significativo</span>
                    : <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold text-[10px]">estable</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EstudianteDetailContent({ selected, authHeader, isAdmin, onDeleted }: {
  selected: any;
  authHeader: string;
  isAdmin: boolean;
  onDeleted?: () => void;
}) {
  if (!selected) return null;
  const estudiante = selected.estudiante;

  const habilitar = async (test: TestCodigoUI, nombre: string) => {
    const motivo = prompt(`Motivo para habilitar reintento de ${nombre} (queda auditado):`);
    if (motivo === null) return; // cancelado
    let ventana_desde: string | undefined;
    let ventana_hasta: string | undefined;
    if (confirm(`¿Acotar el reintento a un intervalo de fechas?\n(Aceptar = pedir fechas; Cancelar = disponible de inmediato, sin límite)`)) {
      const desde = prompt("Fecha DESDE (formato AAAA-MM-DD, vacío = desde ahora):");
      if (desde === null) return;
      const hasta = prompt("Fecha HASTA (formato AAAA-MM-DD, vacío = sin límite):");
      if (hasta === null) return;
      ventana_desde = desde.trim() || undefined;
      ventana_hasta = hasta.trim() || undefined;
    }
    const r = await fetch("/api/admin/estudiante/retake", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ estudiante_id: estudiante.id, test_codigo: test, motivo, ventana_desde, ventana_hasta }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { alert(j.error || "No se pudo habilitar el reintento"); return; }
    onDeleted?.();
  };

  const revocar = async (test: TestCodigoUI) => {
    if (!confirm("¿Revocar el reintento pendiente? El estudiante no podrá volver a rendir hasta que se habilite de nuevo.")) return;
    await fetch(`/api/admin/estudiante/retake?estudiante_id=${estudiante.id}&test_codigo=${test}`, { method: "DELETE", headers: { Authorization: authHeader } });
    onDeleted?.();
  };

  const pendientes: TestCodigoUI[] = selected.reintentosPendientes || [];
  const btnReintento = (test: TestCodigoUI, nombre: string, color: string) => (
    <span className="no-print inline-flex gap-1 ml-2 align-middle">
      {pendientes.includes(test) ? (
        <>
          {(() => {
            const row = (selected.historialReintentos?.[test === "CHASIDE" ? "chaside" : test === "PERSONALIDAD" ? "personalidad" : "kuder"] || [])[0];
            const vigente = enVentana(row);
            return <span className={`border px-2 py-0.5 rounded-full text-[10px] font-black ${vigente ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-300"}`}>{vigente ? "REINTENTO HABILITADO" : "REINTENTO FUERA DE VENTANA"}</span>;
          })()}
          <button onClick={() => revocar(test)} title="Revocar reintento pendiente" className="border rounded-full w-5 h-5 flex items-center justify-center text-slate-500 hover:bg-slate-100"><X size={11} /></button>
        </>
      ) : isAdmin ? (
        <button onClick={() => habilitar(test, nombre)} className="border rounded-full px-2 py-0.5 text-[10px] font-bold inline-flex items-center gap-1 hover:bg-slate-50" style={{ color }}><RotateCcw size={10} />Habilitar reintento</button>
      ) : null}
    </span>
  );

  return (
    <>
      <div className="print-block bg-[#fcfcfc] border border-[#001d62]/10 rounded-xl p-3 text-xs">
        <p className="font-black flex items-center gap-1"><BookOpen size={14} />Cómo leer (igual que ve el estudiante):</p>
        <p className="text-slate-600 mt-1"><b>CHASIDE</b> 7 áreas C/H/A/S/I/D/E — Intereses 0–10, Aptitudes 0–4. <b>MBTI</b> 4 dicotomías con leyenda abajo. <b>Kuder</b> 10 áreas 0–45 con leyenda (Excel).</p>
      </div>

      {/* CHASIDE — como lo ve el estudiante */}
      <div className={`print-block mt-4 border rounded-2xl p-4 ${selected.chaside ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <h4 className="font-black text-sm flex items-center gap-1 flex-wrap">CHASIDE {selected.chaside ? <><Check size={14} className="text-green-600" />{selected.chaside.topInteres} · {(AREAS as any)[selected.chaside.topInteres]?.nombre}<span className="text-[10px] font-bold text-slate-500">Intento {selected.historial?.chaside?.length || 1}</span></> : <><Minus size={14} className="text-red-500" />faltante</>}{btnReintento("CHASIDE", "CHASIDE", "#001d62")}</h4>
        {selected.chaside && selected.diffs?.chaside && <DiffResumen diff={selected.diffs.chaside} />}
        {selected.chaside && <EvolucionIntentos titulo="CHASIDE" serie={selected.evolucion?.chaside} resumen={(d: any) => <>Interés {d.topInteresAnterior}→<b>{d.topInteresActual}</b> · Apt {d.topAptitudAnterior}→<b>{d.topAptitudActual}</b></>} />}
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
      <div className={`print-block mt-4 border rounded-2xl p-4 ${selected.personalidad ? "bg-purple-50 border-purple-200" : "bg-red-50 border-red-200"}`}>
        <h4 className="font-black text-sm flex items-center gap-1 flex-wrap">MBTI Personalidad {selected.personalidad ? <><Check size={14} className="text-green-600" />{selected.personalidad.tipo}{selected.personalidad.respuestas ? `-${deriveIdentity(selected.personalidad.respuestas).letter}` : ""} · {(TYPES as any)[selected.personalidad.tipo]?.name}<span className="text-[10px] font-bold text-slate-500">Intento {selected.historial?.personalidad?.length || 1}</span></> : <><Minus size={14} className="text-red-500" />faltante</>}{btnReintento("PERSONALIDAD", "MBTI", "#7C3AED")}</h4>
        {selected.personalidad && selected.diffs?.personalidad && <DiffResumen diff={selected.diffs.personalidad} />}
        {selected.personalidad && <EvolucionIntentos titulo="MBTI" serie={selected.evolucion?.personalidad} resumen={(d: any) => <>{d.tipoAnterior}→<b style={{ color: d.tipoCambio ? "#d8215d" : undefined }}>{d.tipoActual}</b></>} />}
        {selected.personalidad ? (() => { const t = (TYPES as any)[selected.personalidad.tipo]; const profile = (MBTI_PROFILES as any)[selected.personalidad.tipo]; return <>
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
            {profile && <p className="text-[11px] text-slate-500 mt-2 italic">{(profile.career?.paragraphs?.[0] || "").slice(0, 220)}{profile.career?.paragraphs?.[0]?.length > 220 ? "…" : ""}</p>}
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
      <div className={`print-block mt-4 border rounded-2xl p-4 ${selected.kuder ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
        <h4 className="font-black text-sm flex items-center gap-1 flex-wrap">Kuder {selected.kuder ? <><Check size={14} className="text-green-600" />{selected.kuder.top} · {(KUDER_AREAS as any)[selected.kuder.top]?.nombre}<span className="text-[10px] font-bold text-slate-500">Intento {selected.historial?.kuder?.length || 1}</span></> : <><Minus size={14} className="text-red-500" />faltante</>}{btnReintento("KUDER", "Kuder", "#2563EB")}</h4>
        {selected.kuder && selected.diffs?.kuder && <DiffResumen diff={selected.diffs.kuder} />}
        {selected.kuder && <EvolucionIntentos titulo="Kuder" serie={selected.evolucion?.kuder} resumen={(d: any) => <>{d.topAnterior}→<b style={{ color: d.topAnterior !== d.topActual ? "#d8215d" : undefined }}>{d.topActual}</b></>} />}
        {selected.kuder ? (() => { const topInfo = (KUDER_AREAS as any)[selected.kuder.top]; return <>
          <div className="mt-3 bg-white border rounded-xl p-3">
            <p className="text-xs font-black uppercase tracking-wider text-[#001d62]">Leyenda Kuder — 10 áreas</p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {KUDER_ORDER.map((k: any) => { const info = (KUDER_AREAS as any)[k]; const isTop = k === selected.kuder.top; return <div key={k} className={`flex gap-2 items-center border rounded-xl px-2 py-2 ${isTop ? "bg-[#001d62] text-white border-[#001d62]" : "bg-[#fcfcfc] border-[#001d62]/10"}`}><LucideIcon name={info.icono} size={14} style={{ color: isTop ? "white" : info.color }} /><div><p className="font-black leading-none text-xs">{k}</p><p className="font-bold text-[10px] leading-none">{info.nombre}</p><p className="text-[9px] opacity-70">{info.nombreCorto}</p></div></div>; })}
            </div>
          </div>
          <div className="mt-3 bg-white border rounded-xl p-3">
            <p className="text-sm font-black flex items-center gap-1" style={{ color: topInfo.color }}><LucideIcon name={topInfo.icono} size={16} style={{ color: topInfo.color }} />{topInfo.nombre} ({selected.kuder.top}) — {selected.kuder.scores[selected.kuder.top]}/45</p>
            <p className="text-xs text-slate-700 mt-1">{topInfo.descripcion}</p>
            <p className="text-xs mt-1"><b>Carreras:</b> {topInfo.carreras}</p>
            <p className="text-xs mt-2"><b>Ranking:</b> {selected.kuder.ranking.join(" > ")}</p>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1 text-xs text-center">
            {KUDER_ORDER.map((k: any) => { const v = selected.kuder.scores[k]; const isTop = k === selected.kuder.top; return <div key={k} className={`border rounded p-1.5 ${isTop ? "bg-[#d8215d] text-white font-black border-[#d8215d]" : "bg-white"}`}><span className="font-black">{k}</span><br />{v}</div>; })}
          </div>
          <p className="text-xs text-slate-500 mt-2">{new Date(selected.kuder.fecha_unix * 1000).toLocaleString()} · Verif: {selected.kuder.verificacion}</p>
        </>; })() : <p className="text-xs text-slate-600 mt-2">Pendiente (45 diadas Excel).</p>}
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.chaside ? "bg-green-600 text-white" : "bg-red-100 text-red-700"}`}>CHASIDE {selected.chaside ? "rendido" : "pendiente"}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.personalidad ? "bg-purple-600 text-white" : "bg-red-100 text-red-700"}`}>MBTI {selected.personalidad ? "rendido" : "pendiente"}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.kuder ? "bg-blue-600 text-white" : "bg-red-100 text-red-700"}`}>Kuder {selected.kuder ? "rendido" : "pendiente"}</span>
        <span className="ml-auto text-xs font-bold">Faltan {3 - [selected.chaside, selected.personalidad, selected.kuder].filter(Boolean).length} test(s)</span>
      </div>

      {isAdmin && (
        <div className="no-print mt-4 border-t pt-4">
          <p className="text-xs font-black uppercase tracking-wider text-[#001d62] mb-2">Auditoría de reintentos</p>
          {(() => {
            const hr = selected.historialReintentos || {};
            const rows: any[] = [...(hr.chaside || []), ...(hr.personalidad || []), ...(hr.kuder || [])];
            if (!rows.length) return <p className="text-xs text-slate-500">Sin habilitaciones registradas. Los intentos previos nunca se borran: habilitar un reintento crea un intento nuevo auditable (quién, cuándo, motivo).</p>;
            return (
              <div className="space-y-1">
                {rows.sort((a: any, b: any) => b.habilitado_en - a.habilitado_en).map((r: any) => (
                  <div key={r.id} className="text-xs flex gap-2 items-center flex-wrap bg-white border rounded-lg px-2 py-1.5">
                    <span className="font-black">{r.test_codigo}</span>
                    <span className={r.usado ? "bg-green-100 text-green-700 px-2 rounded-full font-bold" : "bg-amber-100 text-amber-800 px-2 rounded-full font-bold"}>{r.usado ? "usado" : "pendiente"}</span>
                    <span className="text-slate-500">{new Date(r.habilitado_en * 1000).toLocaleString()} · por {String(r.habilitado_por).slice(0, 8)}</span>
                    {r.motivo && <span className="italic text-slate-600">"{r.motivo}"</span>}
                    {r.resultado_id && <span className="text-[10px] text-slate-400 font-mono">→ {String(r.resultado_id).slice(0, 8)}</span>}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
