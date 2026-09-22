import { useEffect, useState, useMemo, type Dispatch, type SetStateAction } from "react";
import { QUESTIONS, AREAS, AREA_ORDER, INTERESES_GRID, APTITUDES_GRID } from "../data/chaside";
import { calculateScores, type Answers } from "../data/scoring";
import { Zap, Rocket, Save, Printer, BookOpen, RotateCcw, Download, Check, Phone, Mail } from "lucide-react";
import { useAnonGate } from "../lib/anonGate";
import { notifyMoodleCompletion } from "../lib/moodle";

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
  const { moodleUserId, isMoodle, telefono: gateTelefono, setTelefono: setGateTelefono, email: gateEmail, setEmail: setGateEmail, nombre: gateNombre, setNombre: setGateNombre, gateReady, checked: gateChecked, saveGate } = useAnonGate("chaside");
  const [gateError, setGateError] = useState<string | null>(null);

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

  const [saving, setSaving] = useState(false);
  const [extra, setExtra] = useState({ padre:"", correoEst:"", correoPadre:"", cedulaEst:"", cedulaRepr:"" });

  const handleSave = async () => {
    // nombre puede venir del gate anon o del input resultado
    const nombreFinal = (studentName.trim() || gateNombre.trim() || gateEmail.split("@")[0] || (moodleUserId ? `moodle_${moodleUserId}` : "")).trim();
    if (!nombreFinal) {
      setError("Debe ingresar el nombre del estudiante para guardar el resultado.");
      return;
    }
    if (!moodleUserId && (!gateTelefono || !gateEmail)) {
      setError("Falta teléfono/email del gate anónimo. Recarga y completa el formulario inicial.");
      return;
    }
    const now = new Date();
    const stamp = formatDateTime(now);
    const fecha_unix = Math.floor(now.getTime()/1000);
    try {
      localStorage.setItem(STORAGE_NAME, nombreFinal);
      localStorage.setItem(STORAGE_DATE, stamp);
    } catch {}
    setSavedAt(stamp);
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/chaside/submit", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          nombre_estudiante: nombreFinal,
          nombre_padre: extra.padre || null,
          correo_estudiante: extra.correoEst || null,
          correo_padre: extra.correoPadre || null,
          cedula_estudiante: extra.cedulaEst || null,
          cedula_representante: extra.cedulaRepr || null,
          telefono: isMoodle ? null : gateTelefono,
          email: isMoodle ? null : gateEmail,
          moodle_user_id: moodleUserId ?? null,
          fecha_unix,
          respuestas: answers,
          version: 1,
        }),
      });
      const j = await res.json();
      if(!res.ok) throw new Error(j.error||"Error al guardar");
      setSavedAt(stamp + ` · guardado DB`);
      // notifica a Moodle (para calificación/completion)
      notifyMoodleCompletion({ test: "CHASIDE", moodleUserId, score: result.intereses, top: result.topInteres });
    } catch(e:any){
      setError("Guardado local OK, pero DB falló: " + e.message);
    } finally { setSaving(false); }
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

  // Gate: si es Moodle auto, si es anon pide telefono+email obligatorio
  if (!gateChecked) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8"><p className="text-sm text-slate-500">Detectando entorno...</p></div>;
  }
  if (!gateReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border rounded-2xl p-6">
          <h2 className="text-xl font-black" style={{fontFamily:"Poppins"}}>Antes de iniciar — CHASIDE</h2>
          <p className="text-sm text-slate-600 mt-1">Estás accediendo fuera de Moodle (anónimo). Por favor ingresa <b>teléfono real</b> y <b>correo electrónico</b> obligatorios para asociar tu resultado. Si estás dentro de Moodle vía iframe, este paso se omite automáticamente.</p>
          <div className="mt-4 space-y-3">
            <div><label className="text-xs font-bold uppercase flex items-center gap-1"><Mail size={12} />Correo electrónico *</label><input type="email" value={gateEmail} onChange={e=>setGateEmail(e.target.value)} placeholder="tu@correo.com" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-bold uppercase flex items-center gap-1"><Phone size={12} />Teléfono *</label><input value={gateTelefono} onChange={e=>setGateTelefono(e.target.value.replace(/[^0-9+()\-\s]/g,"").slice(0,20))} placeholder="+593 99 123 4567" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-bold uppercase">Nombre (opcional)</label><input value={gateNombre} onChange={e=>setGateNombre(e.target.value)} placeholder="Ana Pérez" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            {gateError && <p className="text-xs text-red-600 font-bold">{gateError}</p>}
            <button onClick={()=>{ if(!gateEmail || !gateTelefono){ setGateError("Teléfono y correo son obligatorios"); return; } if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gateEmail)){ setGateError("Correo inválido"); return;} if(!/^[0-9+() \-]{7,20}$/.test(gateTelefono)){ setGateError("Teléfono inválido (7-20 dígitos)"); return;} setGateError(null); saveGate(); }} className="w-full bg-[#0B1220] text-white py-2.5 rounded-full font-bold">Continuar al test →</button>
            <p className="text-[11px] text-slate-400 text-center">Dentro de Moodle este formulario no aparece (se usa tu ID Moodle).</p>
          </div>
        </div>
      </div>
    );
  }

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
      extra={extra}
      setExtra={setExtra}
      saving={saving}
    />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero TeamGGM */}
      <section className="bg-[#0B1220] text-white px-6 py-10 text-center border-b border-white/10">
        <div className="max-w-4xl mx-auto space-y-4">
          <span className="bg-[#0052FF] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <Zap size={14} /> TeamGGM · Orientación Vocacional
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
            <span className="inline-flex items-center gap-2"><Rocket size={18} /> Ver mi resultado CHASIDE</span>
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
  extra,
  setExtra,
  saving,
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
  extra: { padre:string, correoEst:string, correoPadre:string, cedulaEst:string, cedulaRepr:string };
  setExtra: Dispatch<SetStateAction<{ padre:string, correoEst:string, correoPadre:string, cedulaEst:string, cedulaRepr:string }>>;
  saving: boolean;
}) {
  const topI = result.topInteres;
  const secondI = result.segundoInteres;
  const topA = result.topAptitud;

  return (
    <div className="min-h-screen bg-white">
      {/* Card guardar nombre/fecha hora */}
      <div className="bg-[#FFCC00]/20 border-y border-[#FFCC00]/30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#0B1220]">Nombre del estudiante *</label>
              <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Ej: Ana Pérez - 3ro BGU" className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#0052FF] outline-none font-medium" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nombre del padre / representante</label>
              <input value={extra.padre} onChange={(e)=> setExtra(s=>({...s, padre:e.target.value}))} placeholder="Opcional" className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-[#0052FF] outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Correo estudiante</label>
              <input type="email" value={extra.correoEst} onChange={(e)=> setExtra(s=>({...s, correoEst:e.target.value}))} placeholder="opcional@correo.com" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-[#0052FF] outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Correo padre</label>
              <input type="email" value={extra.correoPadre} onChange={(e)=> setExtra(s=>({...s, correoPadre:e.target.value}))} placeholder="opcional@correo.com" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-[#0052FF] outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Cédula estudiante (opcional)</label>
              <input value={extra.cedulaEst} onChange={(e)=> setExtra(s=>({...s, cedulaEst:e.target.value.replace(/\D/g,"").slice(0,10)}))} placeholder="10 dígitos" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-[#0052FF] outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Cédula representante (opcional)</label>
              <input value={extra.cedulaRepr} onChange={(e)=> setExtra(s=>({...s, cedulaRepr:e.target.value.replace(/\D/g,"").slice(0,10)}))} placeholder="10 dígitos" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-[#0052FF] outline-none text-sm" />
            </div>
          </div>
          {savedAt && <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">{savedAt.includes("guardado") && <Check size={14} className="text-green-600" />}Guardado: <span className="font-bold text-[#0B1220]">{studentName || "—"} · {savedAt}</span></p>}
          {error && <p className="text-xs text-[#FF3B30] font-bold mt-2">{error}</p>}
          <div className="mt-3 flex gap-2 flex-wrap">
            <button onClick={onSave} disabled={saving} className="bg-[#0B1220] text-white font-bold px-5 py-2.5 rounded-full hover:bg-black transition text-sm disabled:opacity-60 inline-flex items-center gap-2">
              <Save size={16} />{saving?"Guardando...":"Guardar en BD (nombre + fecha UNIX)"}
            </button>
            <button onClick={onPrint} className="bg-[#0052FF] text-white font-bold px-5 py-2.5 rounded-full hover:bg-[#0040CC] transition text-sm inline-flex items-center gap-2"><Printer size={16} />Imprimir / PDF</button>
            <button onClick={onDownload} className="bg-white border-2 border-slate-300 font-bold px-5 py-2.5 rounded-full hover:border-slate-400 text-sm inline-flex items-center gap-2"><Download size={16} />Descargar JSON</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 print:px-0">
        {/* Breadcrumb resultado */}
        <p className="text-sm text-slate-500 mb-2">Test vocacional CHASIDE</p>
        <h1 className="text-2xl font-extrabold text-[#0B1220] uppercase tracking-tight">Resultado del Test</h1>

        {/* Leyenda para nuevos — cómo interpretar */}
        <div className="mt-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4">
          <h3 className="font-black text-xs uppercase tracking-wider text-[#0B1220] flex items-center gap-1"><BookOpen size={14} />Cómo leer tu resultado</h3>
          <p className="text-sm text-slate-700 mt-2"><b>CHASIDE</b> mide 7 áreas vocacionales. Cada letra es un área:</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {AREA_ORDER.map(k=> (
              <div key={k} className="flex gap-2 items-center bg-white border rounded-xl px-3 py-2"><span className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0" style={{background: AREAS[k].color}}>{k}</span><div><p className="font-bold leading-none">{AREAS[k].nombre}</p><p className="text-xs text-slate-500">{AREAS[k].nombreCorto}</p></div></div>
            ))}
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#FFCC00]/30 border border-[#FFCC00]/50 rounded-xl p-3"><p className="font-black">Intereses (0–10)</p><p className="text-slate-700 mt-1">10 preguntas por área. Si marcaste <b>SÍ</b> en 7 de esas 10, tu puntaje es 7/10. <b>Top = mayor puntaje</b> (tus intereses más marcados).</p></div>
            <div className="bg-white border rounded-xl p-3"><p className="font-black">Aptitudes (0–4)</p><p className="text-slate-700 mt-1">4 preguntas por área (mostrado como máx. 5 por compatibilidad con referencia impresa). Mide facilidad natural. Puede no coincidir con intereses: te puede gustar algo donde aún no eres fuerte.</p></div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Fila amarilla = tu puntaje. Tablas base = números de pregunta por área (ver grids oficiales).</p>
        </div>

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
          <button onClick={onReset} className="bg-[#0B1220] text-white font-bold px-6 py-2.5 rounded-full hover:bg-black inline-flex items-center gap-2"><RotateCcw size={16} />Nuevo test</button>
        </div>
      </div>

      <style>{`@media print { .print\\:hidden { display:none !important; } }`}</style>
    </div>
  );
}
