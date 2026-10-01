/**
 * Moodle bridge via postMessage — handshake seguro
 * - Astro escucha moodleUserId del parent (Moodle Page iframe)
 * - Valida origin si se conoce (configurable), avisa astroReady
 * - Expone hook useMoodleBridge para componentes React
 */
import { useEffect, useState } from "react";

export type MoodleInfo = {
  moodleUserId: number | null;
  moodleUserName: string | null;
  moodleUserEmail: string | null;
  isMoodle: boolean;
  origin: string | null;
};

// orígenes permitidos para validar (ajusta a tu dominio Moodle real)
const ALLOWED_MOODLE_ORIGINS: string[] = [
  // añade tu Moodle: "https://campus.tu-colegio.edu.ec"
];

let _moodleUserId: number | null = null;
let _moodleUserName: string | null = null;
let _moodleUserEmail: string | null = null;
let _moodleOrigin: string | null = null;
let _listeners: Array<(id: number | null, origin: string | null) => void> = [];
let _readySent = false;

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_MOODLE_ORIGINS.length === 0) return true; // permissivo por defecto (trycloudflare dinámico)
  return ALLOWED_MOODLE_ORIGINS.some(o => origin === o || origin.endsWith(o.replace(/^https?:\/\//, "")));
}

if (typeof window !== "undefined") {
  // 1) Detecta moodleUserId por URL ?moodleUserId= (para URL con Parámetros sin postMessage / TinyMCE bloquea script)
  // Soporta camelCase y snake_case para compatibilidad Moodle/URL manual
  try {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("moodleUserId") || params.get("moodle_user_id") || params.get("userId") || params.get("uid") || params.get("id");
    const nameFromUrl = params.get("moodleUserName") || params.get("moodle_user_name") || params.get("name") || params.get("fullname");
    const emailFromUrl = params.get("moodleUserEmail") || params.get("moodle_user_email") || params.get("email");
    if (idFromUrl) {
      const id = Number(idFromUrl);
      if (Number.isFinite(id) && id > 0) {
        _moodleUserId = id;
        _moodleUserName = nameFromUrl ? decodeURIComponent(nameFromUrl) : null;
        _moodleUserEmail = emailFromUrl ? decodeURIComponent(emailFromUrl) : null;
        _moodleOrigin = window.location.origin;
        // notifica a listeners en próximo tick
        setTimeout(() => _listeners.forEach(fn => fn(_moodleUserId, _moodleOrigin)), 0);
      }
    }
    // si no vino id pero vino name/email solos (fallback), igual guarda
    if (!_moodleUserId && nameFromUrl) _moodleUserName = decodeURIComponent(nameFromUrl);
    if (!_moodleUserEmail && emailFromUrl) _moodleUserEmail = decodeURIComponent(emailFromUrl);
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
      if (data.moodleUserName) _moodleUserName = String(data.moodleUserName);
      else if (data.moodleUser?.fullname) _moodleUserName = String(data.moodleUser.fullname);
      if (data.moodleUserEmail) _moodleUserEmail = String(data.moodleUserEmail);
      else if (data.moodleUser?.email) _moodleUserEmail = String(data.moodleUser.email);
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
export function getMoodleUserName(): string | null { return _moodleUserName; }
export function getMoodleUserEmail(): string | null { return _moodleUserEmail; }

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
    moodleUserName: _moodleUserName,
    moodleUserEmail: _moodleUserEmail,
    isMoodle: !!_moodleUserId || isMoodleEmbedded(),
    origin: _moodleOrigin,
  });
  useEffect(() => {
    // Sincroniza estado inicial por si _moodleUserId se seteo tras el primer render (postMessage tardío)
    setInfo({ moodleUserId: _moodleUserId, moodleUserName: _moodleUserName, moodleUserEmail: _moodleUserEmail, isMoodle: !!_moodleUserId || isMoodleEmbedded(), origin: _moodleOrigin });
    return onMoodleUser((_id, origin) => setInfo({ moodleUserId: _moodleUserId, moodleUserName: _moodleUserName, moodleUserEmail: _moodleUserEmail, isMoodle: !!_moodleUserId || true, origin }));
  }, []);
  return info;
}

// Notifica al parent (Moodle) que el test se completó — solo feedback visual vía
// postMessage. NO escribe en Moodle: la nota/completado se gestiona en el panel /admin
// y Moodle debe estar en Completion tracking = "Do not indicate".
export function notifyMoodleCompletion(payload: {
  test: "CHASIDE" | "KUDER" | "MBTI" | "PERSONALIDAD";
  moodleUserId: number | null;
  score?: any;
  top?: string;
}) {
  if (typeof window === "undefined") return;
  try {
    window.parent?.postMessage(
      { testCompleted: payload.test, moodleUserId: payload.moodleUserId, score: payload.score, top: payload.top, at: Date.now() },
      "*"
    );
  } catch {}
  window.dispatchEvent(new CustomEvent("moodle:testCompleted", { detail: payload }));
}
