import React, { useEffect, useState } from "react";
import { ArrowLeft, Printer, AlertTriangle, Minus, Download } from "lucide-react";
import InformeMbti from "../../templates/mbti/InformeMbti";
import InformeChaside from "../../templates/chaside/InformeChaside";
import InformeKuder from "../../templates/kuder/InformeKuder";
import { deriveIdentity } from "../../data/mbti/identity";

function PdfDocenteButton({ label, className, onClick }: { label: string; className: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`no-print mt-4 text-white px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1 ${className}`}>
      <Download size={14} />{label}
    </button>
  );
}

function SeccionInforme({ numero, titulo, fecha, children }: { numero: number; titulo: string; fecha?: string | null; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="w-7 h-7 rounded-full bg-[#001d62] text-white text-xs font-black flex items-center justify-center shrink-0">{numero}</span>
        <h2 className="text-xl font-black text-[#001d62]">{titulo}</h2>
        {fecha && <span className="text-xs text-slate-500">{fecha}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Pendiente({ texto }: { texto: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
      <p className="font-black text-sm flex items-center gap-1 text-red-700"><Minus size={14} />{texto}</p>
    </div>
  );
}

export default function EstudianteDetailPage({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authHeader, setAuthHeader] = useState("");
  const [state, setState] = useState<"loading" | "ok" | "login" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const knox = typeof window !== "undefined" ? localStorage.getItem("knox_token") : null;
    const userRaw = typeof window !== "undefined" ? localStorage.getItem("knox_user") : null;
    if (!knox) {
      setState("login");
      return;
    }
    setAuthHeader(`Token ${knox}`);
    try {
      if (userRaw) setIsAdmin(JSON.parse(userRaw)?.role === "admin");
    } catch {}
    (async () => {
      try {
        const r = await fetch(`/api/admin/estudiante/view?token=${encodeURIComponent(token)}`, {
          headers: { Authorization: `Token ${knox}` },
        });
        const j = await r.json().catch(() => ({}));
        if (r.status === 401) { setState("login"); return; }
        if (!r.ok) { setError(j.error || `Error ${r.status}`); setState("error"); return; }
        setData(j);
        setState("ok");
      } catch (e: any) {
        setError(e.message);
        setState("error");
      }
    })();
  }, [token]);

  const habilitar = async (test: string, nombre: string) => {
    if (!data) return;
    const motivo = prompt(`Motivo para habilitar reintento de ${nombre} (queda auditado):`);
    if (motivo === null) return;
    const r = await fetch("/api/admin/estudiante/retake", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ estudiante_id: data.estudiante.id, test_codigo: test, motivo }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { alert(j.error || "No se pudo habilitar el reintento"); return; }
    window.location.reload();
  };

  const revocar = async (test: string) => {
    if (!data) return;
    if (!confirm("¿Revocar el reintento pendiente?")) return;
    await fetch(`/api/admin/estudiante/retake?estudiante_id=${data.estudiante.id}&test_codigo=${test}`, { method: "DELETE", headers: { Authorization: authHeader } });
    window.location.reload();
  };

  if (state === "loading") return <div className="p-10 text-center text-slate-600">Cargando informe del estudiante…</div>;

  if (state === "login") {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border rounded-2xl p-6 text-center">
        <p className="font-bold">Sesión requerida</p>
        <p className="text-sm text-slate-500 mt-1">Inicia sesión para ver este informe.</p>
        <a href="/admin/login" className="mt-4 inline-block bg-[#001d62] text-white px-6 py-2 rounded-full font-bold">Ir a Login</a>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border border-red-200 rounded-2xl p-6 text-center">
        <AlertTriangle className="mx-auto text-red-500" />
        <p className="font-bold mt-2">Enlace no disponible</p>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <a href="/admin" className="mt-4 inline-block bg-[#001d62] text-white px-6 py-2 rounded-full font-bold">Volver al panel</a>
      </div>
    );
  }

  const estudiante = data.estudiante;
  const nombre = estudiante?.moodle_user_name || "Estudiante";
  const fmt = (unix?: number) => (unix ? new Date(unix * 1000).toLocaleString() : null);
  const identidad = data.personalidad?.respuestas ? deriveIdentity(data.personalidad.respuestas) : null;

  return (
    <div className="min-h-screen bg-[#F9F9FB] print:bg-white">
      <div className="bg-[#001d62] text-white border-b no-print">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/logo-teamggm-horizontal-con-transparencia.webp" alt="TEAM GGM Preuniversitario" className="h-7 w-auto shrink-0" />
          <span className="text-sm font-extrabold">Informe Vocacional del Estudiante</span>
          <button onClick={() => window.print()} className="ml-auto bg-[#d8215d] hover:bg-[#a91a49] text-white font-bold px-4 py-2 rounded-full text-sm inline-flex items-center gap-1">
            <Printer size={15} /> Imprimir / PDF
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 print-page">
        <div className="no-print flex items-center gap-3 mb-4 flex-wrap">
          <a href="/admin" className="bg-white border-2 border-slate-300 font-bold px-4 py-2 rounded-full text-sm inline-flex items-center gap-1">
            <ArrowLeft size={15} /> Volver al panel
          </a>
        </div>

        <div className="print-only text-center mb-4">
          <img src="/logo-teamggm-horizontal-con-transparencia.webp" alt="TEAM GGM Preuniversitario" className="h-10 mx-auto mb-2" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d8215d]">Informe Vocacional · TEAM GGM Preuniversitario</p>
        </div>

        <div className="print-block mb-2">
          <h1 className="text-2xl font-black text-[#001d62]">{nombre}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Moodle {estudiante?.moodle_user_id ?? "—"} · Email {estudiante?.moodle_user_email || "—"} · Curso {estudiante?.moodle_course_id ?? "—"} · Registrado {new Date((estudiante?.created_at || 0) * 1000).toLocaleString()}
          </p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${data.chaside ? "bg-green-600 text-white" : "bg-red-100 text-red-700"}`}>CHASIDE {data.chaside ? "rendido" : "pendiente"}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${data.personalidad ? "bg-purple-600 text-white" : "bg-red-100 text-red-700"}`}>MBTI {data.personalidad ? "rendido" : "pendiente"}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${data.kuder ? "bg-blue-600 text-white" : "bg-red-100 text-red-700"}`}>Kuder {data.kuder ? "rendido" : "pendiente"}</span>
          </div>
        </div>

        <SeccionInforme numero={1} titulo="CHASIDE — Intereses y Aptitudes" fecha={fmt(data.chaside?.fecha_unix)}>
          {data.chaside ? (
            <>
              <InformeChaside
                result={{
                  intereses: data.chaside.intereses,
                  aptitudes: data.chaside.aptitudes,
                  topInteres: data.chaside.topInteres,
                  segundoInteres: data.chaside.segundoInteres,
                  topAptitud: data.chaside.topAptitud,
                }}
                studentName={nombre}
                fecha={fmt(data.chaside?.fecha_unix)}
              />
              <PdfDocenteButton
                label="PDF docente CHASIDE"
                className="bg-[#001d62]"
                onClick={async () => {
                  try {
                    const { generateChasideTeacherPdf } = await import("../../lib/pdf/chaside");
                    await generateChasideTeacherPdf({
                      topInteres: data.chaside.topInteres,
                      segundoInteres: data.chaside.segundoInteres,
                      topAptitud: data.chaside.topAptitud,
                      intereses: data.chaside.intereses,
                      aptitudes: data.chaside.aptitudes,
                    } as any, nombre, fmt(data.chaside.fecha_unix) || "");
                  } catch (e) { console.warn(e); window.print(); }
                }}
              />
            </>
          ) : <Pendiente texto="CHASIDE pendiente de rendir (98 SÍ/NO)." />}
        </SeccionInforme>

        <SeccionInforme numero={2} titulo={`MBTI — Personalidad${identidad ? ` · ${data.personalidad.tipo}-${identidad.letter}` : ""}`} fecha={fmt(data.personalidad?.fecha_unix)}>
          {data.personalidad ? (
            <>
              <InformeMbti
                result={{
                  type: data.personalidad.tipo,
                  dimensions: data.personalidad.dimensiones,
                  percentages: data.personalidad.percentages,
                  identity: identidad!,
                }}
              />
              <PdfDocenteButton
                label="PDF docente MBTI"
                className="bg-[#7C3AED]"
                onClick={async () => {
                  try {
                    const { generateMbtiTeacherPdf } = await import("../../lib/pdf/mbti");
                    await generateMbtiTeacherPdf({
                      type: data.personalidad.tipo,
                      dimensions: data.personalidad.dimensiones,
                      percentages: data.personalidad.percentages,
                    }, nombre, fmt(data.personalidad.fecha_unix) || "");
                  } catch (e) { console.warn(e); window.print(); }
                }}
              />
            </>
          ) : <Pendiente texto="MBTI pendiente de rendir (60 Likert -3..+3)." />}
        </SeccionInforme>

        <SeccionInforme numero={3} titulo="Kuder — Preferencias Vocacionales" fecha={fmt(data.kuder?.fecha_unix)}>
          {data.kuder ? (
            <>
              <InformeKuder result={{ top: data.kuder.top, ranking: data.kuder.ranking, scores: data.kuder.scores }} />
              <PdfDocenteButton
                label="PDF docente Kuder"
                className="bg-[#2563EB]"
                onClick={async () => {
                  try {
                    const { generateKuderTeacherPdf } = await import("../../lib/pdf/kuder");
                    await generateKuderTeacherPdf({
                      top: data.kuder.top,
                      ranking: data.kuder.ranking,
                      scores: data.kuder.scores,
                      verificacion: data.kuder.verificacion,
                    } as any, nombre, fmt(data.kuder.fecha_unix) || "");
                  } catch (e) { console.warn(e); window.print(); }
                }}
              />
            </>
          ) : <Pendiente texto="Kuder pendiente de rendir (45 diadas)." />}
        </SeccionInforme>

        {isAdmin && (
          <div className="no-print mt-10 border-t pt-4 flex gap-2 flex-wrap items-center">
            <span className="text-xs font-black uppercase tracking-wider text-[#001d62]">Reintentos:</span>
            {(data.reintentosPendientes || []).length > 0 && <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded-full text-xs font-black">{data.reintentosPendientes.join(", ")} habilitado(s)</span>}
            {data.chaside && !(data.reintentosPendientes || []).includes("CHASIDE") && <button onClick={() => habilitar("CHASIDE", "CHASIDE")} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Habilitar CHASIDE</button>}
            {data.personalidad && !(data.reintentosPendientes || []).includes("PERSONALIDAD") && <button onClick={() => habilitar("PERSONALIDAD", "MBTI")} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Habilitar MBTI</button>}
            {data.kuder && !(data.reintentosPendientes || []).includes("KUDER") && <button onClick={() => habilitar("KUDER", "Kuder")} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Habilitar Kuder</button>}
            {(data.reintentosPendientes || []).map((t: string) => <button key={t} onClick={() => revocar(t)} className="bg-red-50 border border-red-200 text-red-700 font-bold px-4 py-2 rounded-full text-sm">Revocar {t}</button>)}
            <span className="text-[11px] text-slate-500 w-full">Los intentos previos nunca se borran; cada habilitación queda auditada con motivo y autor.</span>
          </div>
        )}
      </div>
    </div>
  );
}
