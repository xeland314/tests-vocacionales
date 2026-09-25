import { useEffect, useState, useMemo } from "react";
import { calculateScores, type Answers } from "../../data/scoring";
import { useAnonGate } from "../../lib/anonGate";
import { notifyMoodleCompletion } from "../../lib/moodle";
import { generateCrispPdf } from "../../lib/pdf";

const STORAGE_KEY = "chaside_answers_v1";
const STORAGE_NAME = "chaside_student_name";
const STORAGE_DATE = "chaside_student_date";

export function formatDateTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fecha = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${fecha} ${hora}`;
}

/** Controller hook — toda la lógica de negocio del test CHASIDE, testeable con Vitest */
export function useChaside() {
  const [answers, setAnswers] = useState<Answers>({});
  const [showResult, setShowResult] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [savedAt, setSavedAt] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [extra, setExtra] = useState({ padre: "", correoEst: "", correoPadre: "", cedulaEst: "", cedulaRepr: "" });
  const [reintentoPendiente, setReintentoPendiente] = useState(false);
  const { moodleUserId, moodleUserName, moodleUserEmail, isMoodle, gateReady, checked: gateChecked } = useAnonGate("chaside");

  // persistencia local
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

  // idempotencia Moodle: si ya existe resultado, cargarlo
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  useEffect(() => {
    if (!gateChecked || !isMoodle || !moodleUserId) return;
    if (Object.keys(answers).length === 98 && showResult) return;
    setLoadingExisting(true);
    (async () => {
      try {
        const r = await fetch(`/api/chaside/result?moodle_user_id=${moodleUserId}`);
        if (r.ok) {
          const j = await r.json();
          if (j.found && j.respuestas) {
            if (j.reintentoPendiente) {
              // Reintento habilitado: NO se carga el intento anterior; el estudiante
              // responde de nuevo y al enviar se guarda como intento_numero+1.
              setReintentoPendiente(true);
              setAlreadyCompleted(true);
              try { localStorage.removeItem(STORAGE_KEY); } catch {}
            } else {
              setAnswers(j.respuestas);
              try { localStorage.setItem(STORAGE_KEY, JSON.stringify(j.respuestas)); } catch {}
              const d = j.fecha_unix ? new Date(j.fecha_unix * 1000).toLocaleString() : formatDateTime(new Date());
              setSavedAt(d + " · ya guardado");
              setAlreadyCompleted(true);
              setShowResult(true);
            }
          }
        }
      } catch {} finally { setLoadingExisting(false); }
    })();
  }, [gateChecked, isMoodle, moodleUserId]);

  const total = Object.keys(answers).length;
  const siCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const missing = useMemo(() => {
    const m: number[] = [];
    for (let i = 1; i <= 98; i++) if (answers[i] === undefined) m.push(i);
    return m;
  }, [answers]);
  const result = useMemo(() => calculateScores(answers), [answers]);
  const progress = Math.round((total / 98) * 100);

  const handleAnswer = (id: number, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
    setError(null);
  };

  const getCourseId = () => {
    try {
      const p = new URLSearchParams(window.location.search);
      const raw = p.get("courseId") || p.get("course_id") || p.get("cid") || p.get("course") || p.get("moodle_course_id");
      return raw ? Number(raw) : null;
    } catch { return null; }
  };

  const handleSubmit = async () => {
    if (missing.length > 0) {
      setError(`Falta responder la pregunta ${missing[0]}. Debe responder todas las preguntas para que el test sea válido`);
      document.getElementById(`q-${missing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!moodleUserId) {
      setError("Solo usuarios de Moodle pueden guardar. Accede desde Moodle (iframe con ?moodleUserId= tu ID). Prueba con ?moodleUserId=123&moodleUserName=Test&moodleUserEmail=test@test.com");
      return;
    }
    setShowResult(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const now = new Date();
    const stamp = formatDateTime(now);
    const fecha_unix = Math.floor(now.getTime() / 1000);
    try { localStorage.setItem(STORAGE_NAME, moodleUserName ?? `moodle_${moodleUserId}`); localStorage.setItem(STORAGE_DATE, stamp); } catch {}
    setSavedAt(stamp);
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/chaside/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodle_user_id: moodleUserId,
          moodle_user_name: moodleUserName ?? null,
          moodle_user_email: moodleUserEmail ?? null,
          moodle_course_id: getCourseId(),
          fecha_unix,
          respuestas: answers,
          version: 1,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Error ${res.status} al guardar`);
      setSavedAt(stamp + " · ya guardado");
      notifyMoodleCompletion({ test: "CHASIDE", moodleUserId, score: result.intereses, top: result.topInteres });
    } catch (e: any) {
      setError("Guardado automático falló (puedes reintentar con Guardar en BD): " + e.message);
    } finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!moodleUserId) {
      setError("Solo usuarios de Moodle pueden guardar.");
      return;
    }
    const now = new Date();
    const stamp = formatDateTime(now);
    const fecha_unix = Math.floor(now.getTime() / 1000);
    try {
      localStorage.setItem(STORAGE_NAME, moodleUserName ?? `moodle_${moodleUserId}`);
      localStorage.setItem(STORAGE_DATE, stamp);
    } catch {}
    setSavedAt(stamp);
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/chaside/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodle_user_id: moodleUserId,
          moodle_user_name: moodleUserName ?? null,
          moodle_user_email: moodleUserEmail ?? null,
          moodle_course_id: getCourseId(),
          fecha_unix,
          respuestas: answers,
          version: 1,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `Error ${res.status} al guardar`);
      setSavedAt(stamp + " · ya guardado");
      notifyMoodleCompletion({ test: "CHASIDE", moodleUserId, score: result.intereses, top: result.topInteres });
    } catch (e: any) {
      setError("Guardado local OK, pero DB falló: " + e.message);
    } finally { setSaving(false); }
  };

  const handlePrint = async () => {
    try {
      const date = savedAt || formatDateTime(new Date());
      const name = (moodleUserName?.trim() || "resultado").trim();
      const { generateChasideStudentPdf } = await import("../../lib/pdf/chaside");
      await generateChasideStudentPdf(result as any, name, date);
    } catch {
      const rawName = (moodleUserName?.trim() || "resultado").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ]/g, "");
      const safeName = rawName || "resultado";
      const filename = `CHASIDE_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      generateCrispPdf("print-area-chaside", filename);
    }
  };

  const handleDownload = () => {
    const nombreFinal = (moodleUserName?.trim() || "resultado").trim();
    const payload = {
      estudiante: nombreFinal,
      moodleUserId: moodleUserId ?? null,
      moodleUserName: moodleUserName ?? null,
      moodleUserEmail: moodleUserEmail ?? null,
      fecha: savedAt || formatDateTime(new Date()),
      respuestas: answers,
      puntajes: { intereses: result.intereses, aptitudes: result.aptitudes },
      topInteres: result.topInteres,
      segundoInteres: result.segundoInteres,
      topAptitud: result.topAptitud,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = nombreFinal.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ]/g, "") || "resultado";
    a.download = `CHASIDE_${safe}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setAnswers({});
    setShowResult(false);
    setAlreadyCompleted(false);
    setError(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    // state
    answers, setAnswers, showResult, setShowResult, studentName, setStudentName, savedAt, error, saving, extra, setExtra,
    alreadyCompleted, setAlreadyCompleted, loadingExisting, reintentoPendiente,
    // gate
    moodleUserId, moodleUserName, moodleUserEmail, isMoodle, gateChecked,
    // derived
    total, siCount, missing, result, progress,
    // handlers
    handleAnswer, handleSubmit, handleSave, handlePrint, handleDownload, handleReset, setError,
  };
}
