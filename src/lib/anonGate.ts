import { useEffect, useState } from "react";
import { useMoodleBridge } from "./moodle";

const STORAGE_PREFIX = "anon_contact_";

export function useAnonGate(testKey: string) {
  const { moodleUserId, moodleUserName, moodleUserEmail, isMoodle } = useMoodleBridge();
  const storageKey = `${STORAGE_PREFIX}${testKey}`;
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [gateReady, setGateReady] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // si es Moodle con userId, skip gate
    if (moodleUserId) {
      setGateReady(true);
      setChecked(true);
      return;
    }
    // si no es iframe, revisa localStorage anon
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const j = JSON.parse(raw);
        if (j.telefono && j.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(j.email) && /^[0-9+() \-]{7,20}$/.test(j.telefono)) {
          setTelefono(j.telefono);
          setEmail(j.email);
          setNombre(j.nombre || "");
          setGateReady(true);
          setChecked(true);
          return;
        }
      }
    } catch {}
    setChecked(true);
  }, [moodleUserId, storageKey]);

  // cuando moodleUserId llega tarde, auto-ready
  useEffect(() => {
    if (moodleUserId && !gateReady) setGateReady(true);
  }, [moodleUserId, gateReady]);

  const saveGate = () => {
    if (!telefono || !email) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (!/^[0-9+() \-]{7,20}$/.test(telefono)) return false;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ telefono, email, nombre }));
    } catch {}
    setGateReady(true);
    return true;
  };

  return {
    moodleUserId,
    moodleUserName,
    moodleUserEmail,
    isMoodle: !!moodleUserId,
    telefono,
    setTelefono,
    email,
    setEmail,
    nombre,
    setNombre,
    gateReady,
    checked,
    saveGate,
  };
}
