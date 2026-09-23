import { useEffect, useState } from "react";
import { useMoodleBridge } from "./moodle";

// BD solo Moodle: gate simplificado, sin anon telefono/email
export function useAnonGate(_testKey: string) {
  const { moodleUserId, moodleUserName, moodleUserEmail } = useMoodleBridge();
  const [gateReady, setGateReady] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Solo Moodle con userId pasa directo; si no, queda en espera de URL/postMessage
    if (moodleUserId) {
      setGateReady(true);
      setChecked(true);
      return;
    }
    // Sin Moodle, marcamos checked para mostrar mensaje "Accede desde Moodle"
    setChecked(true);
    setGateReady(false);
  }, [moodleUserId]);

  // cuando moodleUserId llega tarde (postMessage), auto-ready
  useEffect(() => {
    if (moodleUserId && !gateReady) {
      setGateReady(true);
      if (!checked) setChecked(true);
    }
  }, [moodleUserId, gateReady, checked]);

  return {
    moodleUserId,
    moodleUserName,
    moodleUserEmail,
    isMoodle: !!moodleUserId,
    // compat: anonGate legacy fields (ya no se usan, pero mantienen API)
    telefono: "",
    setTelefono: (() => {}) as any,
    email: "",
    setEmail: (() => {}) as any,
    nombre: "",
    setNombre: (() => {}) as any,
    gateReady: gateReady && !!moodleUserId,
    checked,
    saveGate: () => false,
  };
}
