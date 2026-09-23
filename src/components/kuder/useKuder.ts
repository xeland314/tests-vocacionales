import { useEffect, useMemo, useState } from "react";
import { calculateKuder, type KuderAnswers } from "../../data/kuderScoring";
import { useAnonGate } from "../../lib/anonGate";
import { notifyMoodleCompletion } from "../../lib/moodle";
import { KUDER_ORDER } from "../../data/kuder";

const STORAGE = "kuder_answers_v1";
const STORAGE_NAME = "kuder_student_name";
const STORAGE_DATE = "kuder_student_date";
function fmt(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
export function useKuder() {
  const [answers, setAnswers] = useState<KuderAnswers>({});
  const [showResult, setShowResult] = useState(false);
  const [name, setName] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { moodleUserId, moodleUserName, moodleUserEmail, isMoodle, gateReady, checked: gateChecked } = useAnonGate("kuder");
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setAnswers(JSON.parse(raw));
      const n = localStorage.getItem(STORAGE_NAME);
      if (n) setName(n);
      const d = localStorage.getItem(STORAGE_DATE);
      if (d) setSavedAt(d);
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(answers)); } catch {} }, [answers]);
  useEffect(() => {
    if (!gateChecked || !isMoodle || !moodleUserId) return;
    setLoadingExisting(true);
    (async () => {
      try {
        const r = await fetch(`/api/kuder/result?moodle_user_id=${moodleUserId}`);
        if (r.ok) {
          const j = await r.json();
          if (j.found && j.respuestas) {
            setAnswers(j.respuestas);
            try { localStorage.setItem(STORAGE, JSON.stringify(j.respuestas)); } catch {}
            const d = j.fecha_unix ? new Date(j.fecha_unix * 1000).toLocaleString() : fmt(new Date());
            setSavedAt(d + " · ya guardado");
            setAlreadyCompleted(true);
            setShowResult(true);
          }
        }
      } catch {} finally { setLoadingExisting(false); }
    })();
  }, [gateChecked, isMoodle, moodleUserId]);

  const total = Object.keys(answers).length;
  const progress = Math.round((total / 60) * 100);
  const missing = useMemo(() => { const m: number[] = []; for (let i = 1; i <= 60; i++) if (!answers[i]) m.push(i); return m; }, [answers]);
  const result = useMemo(() => calculateKuder(answers), [answers]);
  const maxScore = Math.max(...KUDER_ORDER.map((k) => result.scores[k]), 1);

  const getCourseId = () => {
    try {
      const p = new URLSearchParams(window.location.search);
      const raw = p.get("courseId") || p.get("course_id") || p.get("cid") || p.get("course") || p.get("moodle_course_id");
      return raw ? Number(raw) : null;
    } catch { return null; }
  };
  const handle = (id: number, ch: "a" | "b") => { setAnswers((p) => ({ ...p, [id]: ch })); setError(null); };
  const submit = async () => {
    if (missing.length) { setError(`Falta elegir en la diada ${missing[0]}.`); document.getElementById(`k-${missing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (!moodleUserId) { setError("Solo Moodle puede guardar. Accede desde Moodle (?moodleUserId=...)"); return; }
    setShowResult(true); window.scrollTo({ top: 0, behavior: "smooth" });
    const now = new Date(); const stamp = fmt(now); const fecha_unix = Math.floor(now.getTime() / 1000);
    try { localStorage.setItem(STORAGE_NAME, moodleUserName ?? `moodle_${moodleUserId}`); localStorage.setItem(STORAGE_DATE, stamp); } catch {}
    setSavedAt(stamp); setError(null); setSaving(true);
    try {
      const res = await fetch("/api/kuder/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moodle_user_id: moodleUserId, moodle_user_name: moodleUserName ?? null, moodle_user_email: moodleUserEmail ?? null, moodle_course_id: getCourseId(), fecha_unix, respuestas: answers }) });
      const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error(j.error || `Error ${res.status} al guardar`); setSavedAt(stamp + " · ya guardado"); notifyMoodleCompletion({ test: "KUDER", moodleUserId, score: result.scores, top: result.top });
    } catch (e: any) { setError("Guardado falló: " + e.message); } finally { setSaving(false); }
  };
  const save = async () => {
    if (!moodleUserId) { setError("Solo Moodle puede guardar."); return; }
    const now = new Date(); const stamp = fmt(now); const fecha_unix = Math.floor(now.getTime() / 1000);
    try { localStorage.setItem(STORAGE_NAME, moodleUserName ?? `moodle_${moodleUserId}`); localStorage.setItem(STORAGE_DATE, stamp); } catch {}
    setSavedAt(stamp); setSaving(true);
    try {
      const res = await fetch("/api/kuder/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moodle_user_id: moodleUserId, moodle_user_name: moodleUserName ?? null, moodle_user_email: moodleUserEmail ?? null, moodle_course_id: getCourseId(), fecha_unix, respuestas: answers }) });
      const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error(j.error || `Error ${res.status} al guardar`); setSavedAt(stamp + " · ya guardado"); notifyMoodleCompletion({ test: "KUDER", moodleUserId, score: result.scores, top: result.top });
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const handlePrint = async () => {
    try {
      const date = savedAt || fmt(new Date());
      const name = (moodleUserName?.trim() || "resultado").trim();
      const { generateKuderStudentPdf } = await import("../../lib/pdf/kuder");
      await generateKuderStudentPdf(result as any, name, date);
    } catch {
      window.print();
    }
  };
  const reset = () => { setAnswers({}); setShowResult(false); setAlreadyCompleted(false); setError(null); try { localStorage.removeItem(STORAGE); } catch {} window.scrollTo({ top: 0, behavior: "smooth" }); };

  return { answers, setAnswers, showResult, setShowResult, name, setName, savedAt, error, saving, alreadyCompleted, loadingExisting, gateChecked, gateReady, isMoodle, moodleUserId, moodleUserName, total, progress, missing, result, maxScore, handle, submit, save, handlePrint, reset, setError };
}
