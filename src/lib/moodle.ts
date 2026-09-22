/**
 * Moodle bridge via postMessage — handshake seguro
 * - Astro escucha moodleUserId del parent (Moodle Page iframe)
 * - Valida origin si se conoce (configurable), avisa astroReady
 * - Expone hook useMoodleBridge para componentes React
 */
import { useEffect, useState } from "react";

export type MoodleInfo = {
  moodleUserId: number | null;
  isMoodle: boolean;
  origin: string | null;
};

// orígenes permitidos para validar (ajusta a tu dominio Moodle real)
const ALLOWED_MOODLE_ORIGINS: string[] = [
  // añade tu Moodle: "https://campus.tu-colegio.edu.ec"
];

let _moodleUserId: number | null = null;
let _moodleOrigin: string | null = null;
let _listeners: Array<(id: number | null, origin: string | null) => void> = [];
let _readySent = false;

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_MOODLE_ORIGINS.length === 0) return true; // permissivo por defecto (trycloudflare dinámico)
  return ALLOWED_MOODLE_ORIGINS.some(o => origin === o || origin.endsWith(o.replace(/^https?:\/\//, "")));
}

if (typeof window !== "undefined") {
  // 1) Detecta moodleUserId por URL ?moodleUserId= (para wrapper PHP sin postMessage / TinyMCE bloquea script)
  try {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("moodleUserId");
    if (idFromUrl) {
      const id = Number(idFromUrl);
      if (Number.isFinite(id) && id > 0) {
        _moodleUserId = id;
        _moodleOrigin = window.location.origin;
        // notifica a listeners en próximo tick
        setTimeout(() => _listeners.forEach(fn => fn(_moodleUserId, _moodleOrigin)), 0);
      }
    }
  } catch {}

  window.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as any;
    if (!data) return;
    // solo acepta moodleUserId del parent
    if (data.moodleUserId !== undefined) {
      if (!isAllowedOrigin(event.origin)) {
        console.warn("[moodle] origin no permitido:", event.origin);
        return;
      }
      const id = Number(data.moodleUserId);
      if (!Number.isFinite(id) || id <= 0) return;
      _moodleUserId = id;
      _moodleOrigin = event.origin;
      // también puede venir moodleUser con más datos
      _listeners.forEach(fn => fn(_moodleUserId, _moodleOrigin));
    }
  });

  // avisa a parent que Astro ya escucha (handshake)
  const sendReady = () => {
    if (_readySent) return;
    _readySent = true;
    try {
      window.parent?.postMessage({ astroReady: true }, "*");
    } catch {}
  };
  if (document.readyState === "complete") sendReady();
  else window.addEventListener("load", sendReady, { once: true });
  // reintento por si el listener Moodle aún no está
  setTimeout(sendReady, 500);
  setTimeout(sendReady, 1500);
}

export function getMoodleUserId(): number | null {
  return _moodleUserId;
}

export function isMoodleEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch { return true; }
}

export function onMoodleUser(cb: (id: number | null, origin: string | null) => void) {
  _listeners.push(cb);
  if (_moodleUserId !== null) cb(_moodleUserId, _moodleOrigin);
  return () => { _listeners = _listeners.filter(f => f !== cb); };
}

// Hook React
export function useMoodleBridge() {
  const [info, setInfo] = useState<MoodleInfo>({
    moodleUserId: _moodleUserId,
    isMoodle: isMoodleEmbedded(),
    origin: _moodleOrigin,
  });
  useEffect(() => {
    setInfo({ moodleUserId: _moodleUserId, isMoodle: isMoodleEmbedded(), origin: _moodleOrigin });
    return onMoodleUser((id, origin) => setInfo({ moodleUserId: id, isMoodle: true, origin }));
  }, []);
  return info;
}

// Notifica a Moodle que el test completado (para calificación/completion)
// Usa servidor Astro como proxy para no exponer WS_TOKEN
export function notifyMoodleCompletion(payload: {
  test: "CHASIDE" | "KUDER" | "MBTI" | "PERSONALIDAD";
  moodleUserId: number | null;
  score?: any;
  top?: string;
}) {
  if (typeof window === "undefined") return;
  // 1) postMessage al parent (feedback visual)
  try {
    window.parent?.postMessage(
      { testCompleted: payload.test, moodleUserId: payload.moodleUserId, score: payload.score, top: payload.top, at: Date.now() },
      "*"
    );
  } catch {}
  window.dispatchEvent(new CustomEvent("moodle:testCompleted", { detail: payload }));
  // 2) llamada segura server-side (WS_TOKEN nunca sale al navegador)
  if (!payload.moodleUserId) return;
  // Normaliza 0-10 según test
  let grade10 = 5;
  const score = payload.score as any;
  const top = payload.top as string;
  if (payload.test === "CHASIDE") grade10 = Math.round((score?.[top] ?? 0)); // 0-10
  else if (payload.test === "KUDER") grade10 = Math.round(((score?.[top] ?? 0) / 60) * 10); // 0-60 -> 0-10
  else grade10 = 10; // MBTI completado
  fetch("/api/moodle/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moodleUserId: payload.moodleUserId, score: grade10, testType: payload.test, courseId: 2 }),
  }).catch(() => {});
}
