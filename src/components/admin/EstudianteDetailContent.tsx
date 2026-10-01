import React, { useState } from 'react';
import { BookOpen, Check, Minus, RotateCcw, X, History, ArrowRight, Clock } from "lucide-react";
import { AREAS, AREA_ORDER, INTERESES_GRID, APTITUDES_GRID } from "../../data/chaside";
import { TYPES } from "../../data/personalidad";
import { KUDER_AREAS, KUDER_ORDER } from "../../data/kuder";
import { LucideIcon } from "../../client/icons";
import { deriveIdentity } from "../../data/mbti/identity";
import { MBTI_PROFILES } from "../../data/mbti";
import { RetakeModal, type RetakeTest } from "./RetakeModal";

/** ¿El reintento está dentro de su ventana de fechas (si tiene)? — versión cliente, sin imports de servidor. */
function enVentana(row: any): boolean {
  if (!row) return true;
  const now = Math.floor(Date.now() / 1000);
  if (row.ventana_desde_unix && now < Number(row.ventana_desde_unix)) return false;
  if (row.ventana_hasta_unix && now > Number(row.ventana_hasta_unix)) return false;
  return true;
}

type TestCodigoUI = "CHASIDE" | "PERSONALIDAD" | "KUDER";

// ---------------------------------------------------------------------------
// Tiempo entre intentos — delta y lectura pedagógica del intervalo
// ---------------------------------------------------------------------------

/** Segundos entre los dos últimos intentos de un historial (null si no hay ≥2). */
function deltaEntreIntentos(historial: any[] | undefined | null): number | null {
  if (!Array.isArray(historial) || historial.length < 2) return null;
  const curr = Number(historial[historial.length - 1]?.fecha_unix);
  const prev = Number(historial[historial.length - 2]?.fecha_unix);
  if (!Number.isFinite(curr) || !Number.isFinite(prev)) return null;
  return Math.max(0, curr - prev);
}

/** Duración en texto humano: "45 min", "3 h 20 min", "5 días 3 h", "1 mes 4 d". */
function formatearDuracion(seg: number): string {
  if (!Number.isFinite(seg) || seg < 0) return "—";
  const min = Math.floor(seg / 60);
  const horas = Math.floor(min / 60);
  const dias = Math.floor(horas / 24);
  const meses = Math.floor(dias / 30);
  if (min < 1) return "menos de 1 min";
  if (min < 60) return `${min} min`;
  if (horas < 24) {
    const m = min % 60;
    return m ? `${horas} h ${m} min` : `${horas} h`;
  }
  if (meses >= 1) {
    const d = dias % 30;
    return d ? `${meses} ${meses === 1 ? "mes" : "meses"} ${d} d` : `${meses} ${meses === 1 ? "mes" : "meses"}`;
  }
  const h = horas % 24;
  return h ? `${dias} días ${h} h` : `${dias} días`;
}

/** Qué implica el intervalo entre intentos para leer la diferencia. */
function implicacionTiempo(seg: number): { texto: string; color: string; bg: string } {
  const horas = seg / 3600;
  const dias = horas / 24;
  if (horas < 1) {
    return {
      texto: "Reintento casi inmediato (menos de 1 hora): puede reflejar memoria de las respuestas más que un cambio real. Interpretar con cautela.",
      color: "#b45309", bg: "#fffbeb",
    };
  }
  if (horas < 24) {
    return {
      texto: "Reintento el mismo día: coincidir en poco tiempo sugiere memoria del test más que un cambio genuino de perfil.",
      color: "#b45309", bg: "#fffbeb",
    };
  }
  if (dias < 7) {
    return {
      texto: "Reintento dentro de la misma semana: la diferencia puede estar influida por el contexto reciente (exámenes, ánimo, novedad).",
      color: "#1d4ed8", bg: "#eff6ff",
    };
  }
  if (dias < 30) {
    return {
      texto: "Reintento tras más de una semana: el intervalo da razonable confiabilidad a la diferencia observada.",
      color: "#15803d", bg: "#f0fdf4",
    };
  }
  return {
    texto: "Reintento tras más de un mes: con este intervalo, las diferencias tienden a reflejar una evolución real del perfil.",
    color: "#15803d", bg: "#f0fdf4",
  };
}

/** Bloque visual con el tiempo entre los dos últimos intentos y su interpretación. */
function TiempoEntreIntentos({ historial }: { historial: any[] | undefined | null }) {
  const delta = deltaEntreIntentos(historial);
  if (delta == null) return null;
  const imp = implicacionTiempo(delta);
  const prev = historial![historial!.length - 2];
  const curr = historial![historial!.length - 1];
  return (
    <div className="mt-2 rounded-xl px-3 py-2 text-[11px] leading-relaxed" style={{ background: imp.bg, color: imp.color }}>
      <p className="font-black flex items-center gap-1">
        <Clock size={12} /> Tiempo entre intentos: {formatearDuracion(delta)}
        <span className="font-normal opacity-75">
          ({new Date(prev.fecha_unix * 1000).toLocaleDateString()} → {new Date(curr.fecha_unix * 1000).toLocaleDateString()})
        </span>
      </p>
      <p className="mt-0.5">{imp.texto}</p>
    </div>
  );
}

/** Bloque compacto de comparación entre el intento actual y el anterior. */
function DiffResumen({ diff, historial }: { diff: any; historial?: any[] }) {
  if (!diff) return null;
  const esPersonalidad = diff.tipoAnterior !== undefined;
  const esKuder = diff.topAnterior !== undefined && !esPersonalidad;
  return (
    <div className="mt-3 bg-white border rounded-xl p-3">
      <p className="text-xs font-black uppercase tracking-wider text-[#1D60A9] flex items-center gap-1"><History size={13} />Comparación con intento anterior</p>
      {esPersonalidad && (
        <p className="text-xs mt-2 flex items-center gap-1 flex-wrap">
          <b>{diff.tipoAnterior}</b><ArrowRight size={12} className="text-slate-400" /><b style={{ color: diff.tipoCambio ? "#E8356A" : undefined }}>{diff.tipoActual}</b>
          {diff.tipoCambio && <span className="bg-[#E8356A]/10 text-[#E8356A] px-2 py-0.5 rounded-full font-bold">cambió de tipo</span>}
          <span className="ml-auto text-[10px] text-slate-400">{diff.dimensiones.filter((d: any) => d.cambioSignificativo).length}/4 dimensiones con cambio ≥15%</span>
        </p>
      )}
      {esKuder && (
        <p className="text-xs mt-2 flex items-center gap-1 flex-wrap">
          <b>{diff.topAnterior}</b><ArrowRight size={12} className="text-slate-400" /><b style={{ color: diff.topAnterior !== diff.topActual ? "#E8356A" : undefined }}>{diff.topActual}</b>
          {diff.topAnterior !== diff.topActual && <span className="bg-[#E8356A]/10 text-[#E8356A] px-2 py-0.5 rounded-full font-bold">cambió de área principal</span>}
          <span className="ml-auto text-[10px] text-slate-400">{diff.scores.filter((d: any) => d.cambioSignificativo).length}/10 áreas con cambio ≥15 pts</span>
        </p>
      )}
      {!esPersonalidad && !esKuder && (
        <p className="text-xs mt-2 flex items-center gap-1 flex-wrap">
          Interés <b>{diff.topInteresAnterior}</b><ArrowRight size={12} className="text-slate-400" /><b style={{ color: diff.topInteresAnterior !== diff.topInteresActual ? "#E8356A" : undefined }}>{diff.topInteresActual}</b>
          {" "}· Aptitud <b>{diff.topAptitudAnterior}</b><ArrowRight size={12} className="text-slate-400" /><b style={{ color: diff.topAptitudAnterior !== diff.topAptitudActual ? "#E8356A" : undefined }}>{diff.topAptitudActual}</b>
          <span className="ml-auto text-[10px] text-slate-400">{diff.intereses.filter((d: any) => d.cambioSignificativo).length + diff.aptitudes.filter((d: any) => d.cambioSignificativo).length} áreas con cambio ≥15%</span>
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {(esPersonalidad ? diff.dimensiones : esKuder ? diff.scores : [...diff.intereses, ...diff.aptitudes])
          .filter((d: any) => d.cambioSignificativo)
          .map((d: any) => (
            <span key={d.clave} className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ borderColor: d.delta > 0 ? "#16a34a" : "#E8356A", color: d.delta > 0 ? "#16a34a" : "#E8356A" }}>
              {d.clave} {d.delta > 0 ? "+" : ""}{d.delta}
            </span>
          ))}
      </div>
      <TiempoEntreIntentos historial={historial} />
    </div>
  );
}

/** Tabla de evolución: comparación entre TODOS los intentos consecutivos de un test. */
function EvolucionIntentos({ titulo, serie, historial, resumen }: { titulo: string; serie: any[]; historial?: any[]; resumen: (row: any) => React.ReactNode }) {
  if (!serie?.length) return null;
  // serie[i] corresponde al intento historial[i+1]; el tiempo entre intentos = serie[i].fecha_unix - historial[i].fecha_unix
  const tiempoDe = (i: number): number | null => {
    if (!Array.isArray(historial) || !historial[i]?.fecha_unix || !serie[i]?.fecha_unix) return null;
    return Math.max(0, Number(serie[i].fecha_unix) - Number(historial[i].fecha_unix));
  };
  return (
    <div className="mt-3 bg-white border rounded-xl p-3">
      <p className="text-xs font-black uppercase tracking-wider text-[#1D60A9] flex items-center gap-1"><History size={13} />{titulo} — todos los intentos</p>
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="border-b-2 border-[#1D60A9]/20"><th className="text-left px-1 py-1">Intento</th><th className="text-left px-1 py-1">Fecha</th><th className="text-left px-1 py-1">Tiempo desde anterior</th><th className="text-left px-1 py-1">Resultado</th><th className="text-left px-1 py-1">vs anterior</th></tr></thead>
          <tbody>
            {serie.map((s: any, i: number) => {
              const t = tiempoDe(i);
              const imp = t != null ? implicacionTiempo(t) : null;
              return (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-1 py-1 font-black">#{s.intento}</td>
                <td className="px-1 py-1 text-slate-500">{new Date(s.fecha_unix * 1000).toLocaleDateString()}</td>
                <td className="px-1 py-1" style={imp ? { color: imp.color } : undefined} title={imp?.texto}>
                  {t != null ? formatearDuracion(t) : "—"}
                </td>
                <td className="px-1 py-1">{resumen(s.diff)}</td>
                <td className="px-1 py-1">
                  {s.diff.cambioSignificativo
                    ? <span className="bg-[#E8356A]/10 text-[#E8356A] px-2 py-0.5 rounded-full font-bold text-[10px]">cambio significativo</span>
                    : <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold text-[10px]">estable</span>}
                </td>
              </tr>
              );
            })}
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
  // Modal de reintento (reemplaza prompt/confirm nativos). Hook antes del early-return.
  const [retakeModal, setRetakeModal] = useState<{ test: RetakeTest; nombre: string } | null>(null);
  if (!selected) return null;
  const estudiante = selected.estudiante;

  const habilitar = (test: RetakeTest, nombre: string) => setRetakeModal({ test, nombre });

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
      <div className="print-block bg-[#E1E3DA] border border-[#1D60A9]/10 rounded-xl p-3 text-xs">
        <p className="font-black flex items-center gap-1"><BookOpen size={14} />Cómo leer (igual que ve el estudiante):</p>
        <p className="text-slate-600 mt-1"><b>CHASIDE</b> 7 áreas C/H/A/S/I/D/E — Intereses 0–10, Aptitudes 0–4. <b>MBTI</b> 4 dicotomías con leyenda abajo. <b>Kuder</b> 10 áreas 0–45 con leyenda (Excel).</p>
      </div>

      {/* CHASIDE — como lo ve el estudiante */}
      <div className={`print-block mt-4 border rounded-2xl p-4 ${selected.chaside ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <h4 className="font-black text-sm flex items-center gap-1 flex-wrap">CHASIDE {selected.chaside ? <><Check size={14} className="text-green-600" />{selected.chaside.topInteres} · {(AREAS as any)[selected.chaside.topInteres]?.nombre}<span className="text-[10px] font-bold text-slate-500">Intento {selected.historial?.chaside?.length || 1}</span></> : <><Minus size={14} className="text-red-500" />faltante</>}{btnReintento("CHASIDE", "CHASIDE", "#1D60A9")}</h4>
        {selected.chaside && selected.diffs?.chaside && <DiffResumen diff={selected.diffs.chaside} historial={selected.historial?.chaside} />}
        {selected.chaside && <EvolucionIntentos titulo="CHASIDE" serie={selected.evolucion?.chaside} historial={selected.historial?.chaside} resumen={(d: any) => <>Interés {d.topInteresAnterior}→<b>{d.topInteresActual}</b> · Apt {d.topAptitudAnterior}→<b>{d.topAptitudActual}</b></>} />}
        {selected.chaside ? <>
          <div className="mt-3 bg-white border border-[#1D60A9]/10 rounded-xl p-3">
            <p className="text-xs font-black uppercase tracking-wider text-[#1D60A9]">Leyenda CHASIDE — 7 áreas</p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
              {AREA_ORDER.map((k: any) => { const info = (AREAS as any)[k]; return <div key={k} className="flex gap-2 items-center bg-[#E1E3DA] border border-[#1D60A9]/10 rounded-xl px-2 py-2"><span className="w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0" style={{ background: info.color }}>{k}</span><div><p className="font-bold leading-none text-[#1D60A9] text-xs">{info.nombre}</p><p className="text-[10px] text-[#164F8D]/60">{info.nombreCorto}</p></div></div>; })}
            </div>
          </div>
          <div className="mt-4 bg-white border rounded-xl p-3">
            <h5 className="font-bold text-[#1D60A9] text-sm">Lo que más le interesa</h5>
            <p className="text-sm text-[#164F8D] mt-1">Obtuvo <b>{selected.chaside.intereses[selected.chaside.topInteres]}/10</b> en <b>{(AREAS as any)[selected.chaside.topInteres]?.nombre} ({selected.chaside.topInteres})</b></p>
            <p className="text-xs text-[#164F8D] mt-2 leading-relaxed">{(AREAS as any)[selected.chaside.topInteres]?.interesesDesc} Aptitudes: {(AREAS as any)[selected.chaside.topInteres]?.aptitudesTraits}.</p>
            <p className="text-xs mt-2"><b>Carreras:</b> {(AREAS as any)[selected.chaside.topInteres]?.carreras}</p>
            {selected.chaside.segundoInteres && selected.chaside.intereses[selected.chaside.segundoInteres] > 0 && <>
              <h5 className="font-bold text-[#1D60A9] text-sm mt-4">También le interesa</h5>
              <p className="text-sm text-[#164F8D] mt-1">Obtuvo <b>{selected.chaside.intereses[selected.chaside.segundoInteres]}/10</b> en <b>{(AREAS as any)[selected.chaside.segundoInteres]?.nombre} ({selected.chaside.segundoInteres})</b></p>
              <p className="text-xs text-[#164F8D] mt-2 leading-relaxed">{(AREAS as any)[selected.chaside.segundoInteres]?.interesesDesc}</p>
              <p className="text-xs mt-2"><b>Carreras:</b> {(AREAS as any)[selected.chaside.segundoInteres]?.carreras}</p>
            </>}
            <h5 className="font-bold text-[#1D60A9] text-sm mt-4">Tiene aptitudes para</h5>
            <p className="text-sm text-[#164F8D] mt-1">Obtuvo <b>{selected.chaside.aptitudes[selected.chaside.topAptitud]}/4</b> en <b>{(AREAS as any)[selected.chaside.topAptitud]?.nombre} ({selected.chaside.topAptitud})</b></p>
            <p className="text-xs text-[#164F8D] mt-2 leading-relaxed">Aptitudes: {(AREAS as any)[selected.chaside.topAptitud]?.aptitudesTraits}.</p>
            <p className="text-xs mt-2"><b>Carreras:</b> {(AREAS as any)[selected.chaside.topAptitud]?.carreras}</p>
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#1D60A9]">Test CHASIDE Intereses — como ve el estudiante</p>
              <div className="overflow-x-auto mt-1 border border-[#1D60A9]/20 rounded-xl">
                <table className="w-full text-xs text-center border-collapse">
                  <thead><tr className="bg-[#1D60A9] text-white">{AREA_ORDER.map((k: any) => <th key={k} className="px-2 py-1.5 font-black">{k}</th>)}</tr></thead>
                  <tbody>
                    {INTERESES_GRID.map((row: any, i: number) => <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#E1E3DA]"}>{row.map((n: number, j: number) => <td key={j} className="px-2 py-1.5 border border-[#1D60A9]/10 text-[#1D60A9]">{n}</td>)}</tr>)}
                    <tr className="bg-[#E8356A] text-white font-black">{AREA_ORDER.map((k: any) => <td key={k} className="px-2 py-1.5 border border-[#1D60A9]/10">{selected.chaside.intereses[k]}</td>)}</tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#1D60A9]">Test CHASIDE Aptitudes — como ve el estudiante</p>
              <div className="overflow-x-auto mt-1 border border-[#1D60A9]/20 rounded-xl">
                <table className="w-full text-xs text-center border-collapse">
                  <thead><tr className="bg-[#1D60A9] text-white">{AREA_ORDER.map((k: any) => <th key={k} className="px-2 py-1.5 font-black">{k}</th>)}</tr></thead>
                  <tbody>
                    {APTITUDES_GRID.map((row: any, i: number) => <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#E1E3DA]"}>{row.map((n: number) => <td key={n} className="px-2 py-1.5 border border-[#1D60A9]/10 text-[#1D60A9]">{n}</td>)}</tr>)}
                    <tr className="bg-[#E8356A] text-white font-black">{AREA_ORDER.map((k: any) => <td key={k} className="px-2 py-1.5 border border-[#1D60A9]/10">{selected.chaside.aptitudes[k]}</td>)}</tr>
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
        <h4 className="font-black text-sm flex items-center gap-1 flex-wrap">MBTI Personalidad {selected.personalidad ? <><Check size={14} className="text-green-600" />{selected.personalidad.tipo}{selected.personalidad.respuestas ? `-${deriveIdentity(selected.personalidad.respuestas).letter}` : ""} · {(TYPES as any)[selected.personalidad.tipo]?.name}<span className="text-[10px] font-bold text-slate-500">Intento {selected.historial?.personalidad?.length || 1}</span></> : <><Minus size={14} className="text-red-500" />faltante</>}{btnReintento("PERSONALIDAD", "MBTI", "#662483")}</h4>
        {selected.personalidad && selected.diffs?.personalidad && <DiffResumen diff={selected.diffs.personalidad} historial={selected.historial?.personalidad} />}
        {selected.personalidad && <EvolucionIntentos titulo="MBTI" serie={selected.evolucion?.personalidad} historial={selected.historial?.personalidad} resumen={(d: any) => <>{d.tipoAnterior}→<b style={{ color: d.tipoCambio ? "#E8356A" : undefined }}>{d.tipoActual}</b></>} />}
        {selected.personalidad ? (() => { const t = (TYPES as any)[selected.personalidad.tipo]; const profile = (MBTI_PROFILES as any)[selected.personalidad.tipo]; return <>
          <div className="mt-3 bg-white border rounded-xl p-3">
            <p className="text-xs font-black uppercase tracking-wider text-[#1D60A9]">Leyenda MBTI — qué significa cada letra</p>
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
            <div className="mt-2 flex flex-wrap gap-1 justify-center">{t.strengths.map((s: string) => <span key={s} className="text-[10px] font-bold px-2 py-1 rounded-full border bg-[#E1E3DA]">{s}</span>)}</div>
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
        {selected.kuder && selected.diffs?.kuder && <DiffResumen diff={selected.diffs.kuder} historial={selected.historial?.kuder} />}
        {selected.kuder && <EvolucionIntentos titulo="Kuder" serie={selected.evolucion?.kuder} historial={selected.historial?.kuder} resumen={(d: any) => <>{d.topAnterior}→<b style={{ color: d.topAnterior !== d.topActual ? "#E8356A" : undefined }}>{d.topActual}</b></>} />}
        {selected.kuder ? (() => { const topInfo = (KUDER_AREAS as any)[selected.kuder.top]; return <>
          <div className="mt-3 bg-white border rounded-xl p-3">
            <p className="text-xs font-black uppercase tracking-wider text-[#1D60A9]">Leyenda Kuder — 10 áreas</p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {KUDER_ORDER.map((k: any) => { const info = (KUDER_AREAS as any)[k]; const isTop = k === selected.kuder.top; return <div key={k} className={`flex gap-2 items-center border rounded-xl px-2 py-2 ${isTop ? "bg-[#1D60A9] text-white border-[#1D60A9]" : "bg-[#E1E3DA] border-[#1D60A9]/10"}`}><LucideIcon name={info.icono} size={14} style={{ color: isTop ? "white" : info.color }} /><div><p className="font-black leading-none text-xs">{k}</p><p className="font-bold text-[10px] leading-none">{info.nombre}</p><p className="text-[9px] opacity-70">{info.nombreCorto}</p></div></div>; })}
            </div>
          </div>
          <div className="mt-3 bg-white border rounded-xl p-3">
            <p className="text-sm font-black flex items-center gap-1" style={{ color: topInfo.color }}><LucideIcon name={topInfo.icono} size={16} style={{ color: topInfo.color }} />{topInfo.nombre} ({selected.kuder.top}) — {selected.kuder.scores[selected.kuder.top]}/45</p>
            <p className="text-xs text-slate-700 mt-1">{topInfo.descripcion}</p>
            <p className="text-xs mt-1"><b>Carreras:</b> {topInfo.carreras}</p>
            <p className="text-xs mt-2"><b>Ranking:</b> {selected.kuder.ranking.join(" > ")}</p>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1 text-xs text-center">
            {KUDER_ORDER.map((k: any) => { const v = selected.kuder.scores[k]; const isTop = k === selected.kuder.top; return <div key={k} className={`border rounded p-1.5 ${isTop ? "bg-[#E8356A] text-white font-black border-[#E8356A]" : "bg-white"}`}><span className="font-black">{k}</span><br />{v}</div>; })}
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
          <p className="text-xs font-black uppercase tracking-wider text-[#1D60A9] mb-2">Auditoría de reintentos</p>
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

      {retakeModal && (
        <RetakeModal
          test={retakeModal.test}
          estudianteId={estudiante.id}
          estudianteNombre={String(estudiante.moodle_user_name || estudiante.id)}
          authHeader={authHeader}
          onClose={() => setRetakeModal(null)}
          onSuccess={() => { setRetakeModal(null); onDeleted?.(); }}
        />
      )}
    </>
  );
}
