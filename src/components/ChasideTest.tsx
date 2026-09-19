import React, { useEffect, useState, useMemo } from "react";
import { QUESTIONS, AREAS, AREA_ORDER, INTERESES_GRID, APTITUDES_GRID } from "../data/chaside";
import { calculateScores, type Answers } from "../data/scoring";

const STORAGE_KEY = "chaside_answers_v1";
const STORAGE_NAME = "chaside_student_name";
const STORAGE_DATE = "chaside_student_date";

function formatDateTime(d: Date) {
  // Formato local: YYYY-MM-DD HH:mm + locale largo
  const pad = (n: number) => String(n).padStart(2, "0");
  const fecha = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${fecha} ${hora}`;
}

export default function ChasideTest() {
  const [answers, setAnswers] = useState<Answers>({});
  const [showResult, setShowResult] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [savedAt, setSavedAt] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState(false);

  // cargar persistencia
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAnswers(JSON.parse(raw));
      const n = localStorage.getItem(STORAGE_NAME);
      if (n) setStudentName(n);
      const d = localStorage.getItem(STORAGE_DATE);
      if (d) setSavedAt(d);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); } catch {}
  }, [answers]);

  const total = Object.keys(answers).length;
  const siCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const missing = useMemo(() => {
    const m: number[] = [];
    for (let i = 1; i <= 98; i++) if (answers[i] === undefined) m.push(i);
    return m;
  }, [answers]);

  const result = useMemo(() => calculateScores(answers), [answers]);

  const handleAnswer = (id: number, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
    setError(null);
  };

  const handleSubmit = () => {
    if (missing.length > 0) {
      setError(`Falta responder la pregunta ${missing[0]}. Debe responder todas las preguntas para que el test sea válido`);
      const el = document.getElementById(`q-${missing[0]}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setShowResult(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = () => {
    if (!studentName.trim()) {
      setError("Debe ingresar el nombre del estudiante para guardar el resultado.");
      return;
    }
    const now = new Date();
    const stamp = formatDateTime(now);
    // guardar nombre + fecha con hora en localStorage
    try {
      localStorage.setItem(STORAGE_NAME, studentName.trim());
      localStorage.setItem(STORAGE_DATE, stamp);
    } catch {}
    setSavedAt(stamp);
    setError(null);
    // opcional: trigger descarga JSON + imprimir
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setAnswers({});
    setShowResult(false);
    setError(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownload = () => {
    if (!studentName.trim()) {
      setError("Ingrese el nombre del estudiante antes de descargar.");
      return;
    }
    const payload = {
      estudiante: studentName.trim(),
      fecha: savedAt || formatDateTime(new Date()),
      respuestas: answers,
      puntajes: {
        intereses: result.intereses,
        aptitudes: result.aptitudes,
      },
      topInteres: result.topInteres,
      segundoInteres: result.segundoInteres,
      topAptitud: result.topAptitud,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CHASIDE_${studentName.trim().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // agrupación para progreso
  const progress = Math.round((total / 98) * 100);

  if (showResult) {
    return <ResultadoView
      result={result}
      studentName={studentName}
      setStudentName={setStudentName}
      savedAt={savedAt}
      onSave={handleSave}
      onPrint={handlePrint}
      onDownload={handleDownload}
      onReset={handleReset}
      onBack={() => setShowResult(false)}
      error={error}
    />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero TeamGGM */}
      <section className="bg-[#0B1220] text-white px-6 py-10 text-center border-b border-white/10">
        <div className="max-w-4xl mx-auto space-y-4">
          <span className="bg-[#0052FF] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
            ⚡ TeamGGM · Orientación Vocacional
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight leading-tight" style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
            Test vocacional <span className="text-[#FFCC00]">CHASIDE</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            El test le mostrará las áreas en las que tiene interés y las áreas en las que, según el test, tiene más aptitudes para desempeñarse. Puede que le gusten las carreras de una área determinada pero que tenga mejores aptitudes para otra.
          </p>
          <p className="text-[#FFCC00] font-semibold">Debes responder todas las preguntas (98). No hay respuestas correctas o incorrectas.</p>
        </div>
      </section>

      {/* Progress */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Progreso: {total}/98</span>
              <span className="text-[#0052FF]">{progress}% · {siCount} SÍ</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#0052FF] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="hidden sm:inline-flex bg-[#FF3B30] hover:bg-[#E02D23] text-white font-bold px-6 py-2.5 rounded-full shadow-[0_4px_15px_rgba(255,59,48,0.4)] transition shrink-0"
          >
            Ver resultado →
          </button>
        </div>
        {error && (
          <div className="max-w-5xl mx-auto px-4 pb-3">
            <p className="text-[#FF3B30] font-bold text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {QUESTIONS.map((q) => {
              const val = answers[q.id];
              const isMissing = error && missing[0] === q.id;
              return (
                <div
                  key={q.id}
                  id={`q-${q.id}`}
                  className={`flex flex-col md:flex-row md:items-center gap-3 px-4 py-4 hover:bg-slate-50 transition ${isMissing ? "bg-red-50" : ""} ${val !== undefined ? "bg-[#F8FAFC]" : ""}`}
                >
                  <div className="flex gap-3 flex-1 min-w-0">
                    <span className="shrink-0 bg-[#0052FF] text-white text-xs font-extrabold px-2.5 py-1 rounded-full h-fit mt-0.5">
                      {String(q.id).padStart(2, "0")}
                    </span>
                    <p className="text-[15px] leading-snug text-slate-800 flex-1">{q.text}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-10 md:ml-0">
                    <label className={`flex items-center gap-2 px-5 py-2 rounded-full border-2 cursor-pointer font-bold text-sm transition ${val === true ? "bg-[#0B1220] text-white border-[#0B1220] shadow" : "bg-white border-slate-300 hover:border-[#0052FF] text-slate-700"}`}>
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        className="sr-only"
                        checked={val === true}
                        onChange={() => handleAnswer(q.id, true)}
                      />
                      SÍ
                    </label>
                    <label className={`flex items-center gap-2 px-5 py-2 rounded-full border-2 cursor-pointer font-bold text-sm transition ${val === false ? "bg-white text-[#0B1220] border-[#0B1220] shadow" : "bg-white border-slate-300 hover:border-slate-400 text-slate-700"}`}>
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        className="sr-only"
                        checked={val === false}
                        onChange={() => handleAnswer(q.id, false)}
                      />
                      NO
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleSubmit}
            className="bg-[#FF3B30] hover:bg-[#E02D23] text-white font-extrabold px-8 py-4 rounded-full shadow-[0_4px_20px_rgba(255,59,48,0.5)] text-lg transition hover:-translate-y-0.5"
          >
            🚀 Ver mi resultado CHASIDE
          </button>
          <button onClick={handleReset} className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-6 py-3 rounded-full">
            Reiniciar
          </button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-3">Se guarda automáticamente en tu navegador. Podrás ingresar tu nombre y fecha al ver el resultado.</p>
      </div>
    </div>
  );
}

function ResultadoView({
  result,
  studentName,
  setStudentName,
  savedAt,
  onSave,
  onPrint,
  onDownload,
  onReset,
  onBack,
  error,
}: {
  result: ReturnType<typeof calculateScores>;
  studentName: string;
  setStudentName: (s: string) => void;
  savedAt: string;
  onSave: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onReset: () => void;
  onBack: () => void;
  error: string | null;
}) {
  const topI = result.topInteres;
  const secondI = result.segundoInteres;
  const topA = result.topAptitud;

  return (
    <div className="min-h-screen bg-white">
      {/* Card guardar nombre/fecha hora */}
      <div className="bg-[#FFCC00]/20 border-y border-[#FFCC00]/30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#0B1220]">Nombre del estudiante</label>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Ej: Ana Pérez - 3ro BGU"
              className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#0052FF] outline-none font-medium"
            />
            {savedAt && <p className="text-xs text-slate-600 mt-1">Guardado: <span className="font-bold text-[#0B1220]">{studentName || "—"} · {savedAt}</span></p>}
            {error && <p className="text-xs text-[#FF3B30] font-bold mt-1">{error}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={onSave} className="bg-[#0B1220] text-white font-bold px-5 py-2.5 rounded-full hover:bg-black transition text-sm">
              💾 Guardar nombre y fecha
            </button>
            <button onClick={onPrint} className="bg-[#0052FF] text-white font-bold px-5 py-2.5 rounded-full hover:bg-[#0040CC] transition text-sm">
              🖨️ Imprimir / PDF
            </button>
            <button onClick={onDownload} className="bg-white border-2 border-slate-300 font-bold px-5 py-2.5 rounded-full hover:border-slate-400 text-sm">
              ⬇️ Descargar JSON
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 print:px-0">
        {/* Breadcrumb resultado */}
        <p className="text-sm text-slate-500 mb-2">Test vocacional CHASIDE</p>
        <h1 className="text-2xl font-extrabold text-[#0B1220] uppercase tracking-tight">Resultado del Test</h1>

        {/* Intereses */}
        <section className="mt-6">
          <h2 className="text-xl font-extrabold text-[#0B1220]">Intereses</h2>

          {result.intereses[topI] === 0 ? (
            <p className="mt-2 text-slate-600 italic">No se detectaron intereses predominantes (todas las respuestas fueron NO).</p>
          ) : (
            <>
              <h3 className="mt-4 font-bold text-[#0B1220]">Lo que más le interesa</h3>
              <p className="mt-1 text-sm">
                Obtuvo una puntuación de <span className="font-extrabold">{result.intereses[topI]}</span> de un máximo de 10 en áreas relativas a carreras <span className="font-bold">{AREAS[topI].nombre}</span>
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-800">
                {AREAS[topI].interesesDesc} Estas carreras requieren de aptitudes tales como: {AREAS[topI].aptitudesTraits}.
              </p>
              <p className="mt-2 text-[15px] text-slate-800">
                <span className="font-bold">Posibles carreras a seguir:</span> {AREAS[topI].carreras}
              </p>

              {secondI && result.intereses[secondI] > 0 && (
                <>
                  <h3 className="mt-6 font-bold text-[#0B1220]">También le interesa</h3>
                  <p className="mt-1 text-sm">
                    Obtuvo una puntuación de <span className="font-extrabold">{result.intereses[secondI]}</span> de un máximo de 10 en áreas relativas a carreras <span className="font-bold">{AREAS[secondI].nombre}</span>
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-800">
                    {AREAS[secondI].interesesDesc} Las aptitudes para las carreras de esta área requieren ser: {AREAS[secondI].aptitudesTraits}.
                  </p>
                  <p className="mt-2 text-[15px] text-slate-800">
                    <span className="font-bold">Carreras afines:</span> {AREAS[secondI].carreras}
                  </p>
                </>
              )}
            </>
          )}
        </section>

        {/* Aptitudes */}
        <section className="mt-8">
          <h2 className="text-xl font-extrabold text-[#0B1220]">Sus aptitudes</h2>
          {result.aptitudes[topA] === 0 ? (
            <p className="mt-2 text-slate-600 italic">No se detectaron aptitudes predominantes.</p>
          ) : (
            <>
              <h3 className="mt-4 font-bold text-[#0B1220]">Tiene aptitudes para</h3>
              <p className="mt-1 text-sm">
                Obtuvo una puntuación de <span className="font-extrabold">{result.aptitudes[topA]}</span> de un máximo de 5 en áreas relativas a carreras <span className="font-bold">{AREAS[topA].nombre}</span>
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-800">
                Aptitudes: {AREAS[topA].aptitudesTraits}. Se le dan bien actividades relacionadas con: {AREAS[topA].interesesTraits}.
              </p>
              <p className="mt-2 text-[15px] text-slate-800">
                <span className="font-bold">Carreras afines:</span> {AREAS[topA].carreras}
              </p>

              {result.segundoAptitud && result.aptitudes[result.segundoAptitud] > 0 && result.aptitudes[result.segundoAptitud] === result.aptitudes[topA] && (
                <>
                  <h3 className="mt-4 font-bold text-[#0B1220]">También tiene aptitudes para</h3>
                  <p className="mt-1 text-sm">
                    Obtuvo una puntuación de {result.aptitudes[result.segundoAptitud]} de un máximo de 5 en áreas relativas a carreras {AREAS[result.segundoAptitud].nombre}
                  </p>
                  <p className="mt-1 text-[15px] text-slate-800"><span className="font-bold">Carreras afines:</span> {AREAS[result.segundoAptitud].carreras}</p>
                </>
              )}
            </>
          )}
        </section>

        {/* Tablas */}
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-[#0B1220]">Tablas puntuación CHASIDE</h2>

          <h3 className="mt-4 font-bold text-sm uppercase tracking-wider text-slate-700">Test CHASIDE Intereses</h3>
          <div className="overflow-x-auto mt-2 border border-slate-300 rounded-xl">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-[#0B1220] text-white">
                  {AREA_ORDER.map((k) => <th key={k} className="px-2 py-2 font-extrabold">{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {INTERESES_GRID.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((n, j) => {
                      const area = AREA_ORDER[j] as any;
                      const isYes = false; // se marca con punto si la respuesta fue SI? La referencia marca celdas con puntaje, pero aquí mostramos tabla base
                      // Para trazabilidad, coloreamos si ese número fue respondido SI
                      // Necesitamos answers: lo pasamos? Por simplicidad, acceso via result? No, necesitamos mapa.
                      // Lo hacemos via cálculo: si INTERESES_TABLE[area] incluye n y answers[n] => highlight
                      // Pero no tenemos answers aquí; mejor pasar por props. Por ahora solo tabla estática + última fila puntajes.
                      return <td key={j} className="px-2 py-1.5 border border-slate-200">{n}</td>;
                    })}
                  </tr>
                ))}
                <tr className="bg-[#FFCC00] font-extrabold">
                  {AREA_ORDER.map((k) => (
                    <td key={k} className="px-2 py-2 border border-slate-300">{result.intereses[k]}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 font-bold text-sm uppercase tracking-wider text-slate-700">Test CHASIDE Aptitudes</h3>
          <div className="overflow-x-auto mt-2 border border-slate-300 rounded-xl">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-[#0B1220] text-white">
                  {AREA_ORDER.map((k) => <th key={k} className="px-2 py-2 font-extrabold">{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {APTITUDES_GRID.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((n) => <td key={n} className="px-2 py-1.5 border border-slate-200">{n}</td>)}
                  </tr>
                ))}
                <tr className="bg-[#FFCC00] font-extrabold">
                  {AREA_ORDER.map((k) => (
                    <td key={k} className="px-2 py-2 border border-slate-300">{result.aptitudes[k]}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {savedAt && studentName && (
          <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm">
            <p className="text-xs">
              Estudiante: <span className="font-bold">{studentName}</span> · Fecha: <span className="font-bold">{savedAt}</span>
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <button onClick={onBack} className="bg-white border-2 border-slate-300 font-bold px-6 py-2.5 rounded-full hover:border-slate-400">← Volver al test</button>
          <button onClick={onReset} className="bg-[#0B1220] text-white font-bold px-6 py-2.5 rounded-full hover:bg-black">🔄 Nuevo test</button>
        </div>
      </div>

      <style>{`@media print { .print\\:hidden { display:none !important; } }`}</style>
    </div>
  );
}
