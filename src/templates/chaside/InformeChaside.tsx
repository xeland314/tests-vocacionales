import { AREAS, AREA_ORDER, INTERESES_GRID, APTITUDES_GRID, type AreaKey } from "../../data/chaside";

interface ChasideReportData {
  intereses: Record<AreaKey, number>;
  aptitudes: Record<AreaKey, number>;
  topInteres: AreaKey;
  segundoInteres?: AreaKey | null;
  topAptitud: AreaKey;
}

export default function InformeChaside({
  result,
  studentName,
  fecha,
}: {
  result: ChasideReportData;
  studentName?: string | null;
  fecha?: string | null;
}) {
  const topI = result.topInteres;
  const secondI = result.segundoInteres;
  const topA = result.topAptitud;

  return (
    <>
      <div className="print-block bg-[#fcfcfc] border border-[#0f2b6b]/10 rounded-2xl p-4">
        <h3 className="font-black text-xs uppercase tracking-wider text-[#001d62]">Cómo leer tu resultado</h3>
        <p className="text-sm text-[#0f2b6b] mt-2"><b>CHASIDE</b> mide 7 áreas vocacionales. Cada letra es un área:</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {AREA_ORDER.map(k => (
            <div key={k} className="flex gap-2 items-center bg-[#ffffff] border border-[#0f2b6b]/10 rounded-xl px-3 py-2"><span className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0" style={{ background: AREAS[k].color }}>{k}</span><div><p className="font-bold leading-none text-[#001d62]">{AREAS[k].nombre}</p><p className="text-xs text-[#0f2b6b]/60">{AREAS[k].nombreCorto}</p></div></div>
          ))}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-xl font-extrabold text-[#001d62]">Intereses</h2>
        {result.intereses[topI] === 0 ? <p className="mt-2 text-[#0f2b6b]/60 italic">No se detectaron intereses predominantes.</p> : (
          <>
            <h3 className="mt-4 font-bold text-[#001d62]">Lo que más le interesa</h3>
            <p className="mt-1 text-sm text-[#0f2b6b]">Obtuvo <span className="font-extrabold text-[#001d62]">{result.intereses[topI]}</span>/10 en <span className="font-bold text-[#001d62]">{AREAS[topI].nombre}</span></p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#0f2b6b]">{AREAS[topI].interesesDesc} Aptitudes: {AREAS[topI].aptitudesTraits}.</p>
            <p className="mt-2 text-[15px] text-[#0f2b6b]"><span className="font-bold text-[#001d62]">Carreras:</span> {AREAS[topI].carreras}</p>
            {secondI && result.intereses[secondI] > 0 && (
              <>
                <h3 className="mt-6 font-bold text-[#001d62]">También le interesa</h3>
                <p className="mt-1 text-sm text-[#0f2b6b]">Obtuvo <span className="font-extrabold text-[#001d62]">{result.intereses[secondI]}</span>/10 en <span className="font-bold text-[#001d62]">{AREAS[secondI].nombre}</span></p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#0f2b6b]">{AREAS[secondI].interesesDesc}</p>
                <p className="mt-2 text-[15px] text-[#0f2b6b]"><span className="font-bold text-[#001d62]">Carreras:</span> {AREAS[secondI].carreras}</p>
              </>
            )}
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-[#001d62]">Sus aptitudes</h2>
        {result.aptitudes[topA] === 0 ? <p className="mt-2 text-[#0f2b6b]/60 italic">No se detectaron aptitudes.</p> : (
          <>
            <h3 className="mt-4 font-bold text-[#001d62]">Tiene aptitudes para</h3>
            <p className="mt-1 text-sm text-[#0f2b6b]">Obtuvo <span className="font-extrabold text-[#001d62]">{result.aptitudes[topA]}</span>/5 en <span className="font-bold text-[#001d62]">{AREAS[topA].nombre}</span></p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#0f2b6b]">Aptitudes: {AREAS[topA].aptitudesTraits}.</p>
            <p className="mt-2 text-[15px] text-[#0f2b6b]"><span className="font-bold text-[#001d62]">Carreras:</span> {AREAS[topA].carreras}</p>
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold text-[#001d62]">Tablas puntuación CHASIDE</h2>
        <h3 className="mt-4 font-bold text-sm uppercase tracking-wider text-[#0f2b6b]">Test CHASIDE Intereses</h3>
        <div className="overflow-x-auto mt-2 border border-[#0f2b6b]/20 rounded-xl">
          <table className="w-full text-sm text-center border-collapse">
            <thead><tr className="bg-[#001d62] text-white">{AREA_ORDER.map((k) => <th key={k} className="px-2 py-2 font-extrabold">{k}</th>)}</tr></thead>
            <tbody>
              {INTERESES_GRID.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[#ffffff]" : "bg-[#fcfcfc]"}>{row.map((n, j) => <td key={j} className="px-2 py-1.5 border border-[#0f2b6b]/10 text-[#001d62]">{n}</td>)}</tr>
              ))}
              <tr className="bg-[#d8215d] text-white font-extrabold">{AREA_ORDER.map((k) => <td key={k} className="px-2 py-2 border border-[#0f2b6b]/10">{result.intereses[k]}</td>)}</tr>
            </tbody>
          </table>
        </div>
        <h3 className="mt-6 font-bold text-sm uppercase tracking-wider text-[#0f2b6b]">Test CHASIDE Aptitudes</h3>
        <div className="overflow-x-auto mt-2 border border-[#0f2b6b]/20 rounded-xl">
          <table className="w-full text-sm text-center border-collapse">
            <thead><tr className="bg-[#001d62] text-white">{AREA_ORDER.map((k) => <th key={k} className="px-2 py-2 font-extrabold">{k}</th>)}</tr></thead>
            <tbody>
              {APTITUDES_GRID.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[#ffffff]" : "bg-[#fcfcfc]"}>{row.map((n) => <td key={n} className="px-2 py-1.5 border border-[#0f2b6b]/10 text-[#001d62]">{n}</td>)}</tr>
              ))}
              <tr className="bg-[#d8215d] text-white font-extrabold">{AREA_ORDER.map((k) => <td key={k} className="px-2 py-2 border border-[#0f2b6b]/10">{result.aptitudes[k]}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </section>

      {studentName && (
        <div className="mt-8 p-4 bg-[#fcfcfc] border border-[#0f2b6b]/10 rounded-xl text-sm print-block">
          <p className="text-xs text-[#0f2b6b]">Estudiante: <span className="font-bold text-[#001d62]">{studentName}</span>{fecha && <> · Fecha: <span className="font-bold text-[#001d62]">{fecha}</span></>}</p>
        </div>
      )}
    </>
  );
}
