import { useEffect, useState, useRef } from "react";
import { AREAS, AREA_ORDER } from "../data/chaside";
import { TYPES } from "../data/personalidad";
import { KUDER_AREAS, KUDER_ORDER } from "../data/kuder";
import { LucideIcon } from "../lib/icons";
import { BookOpen, Check, Minus, X, UserPlus, Users } from "lucide-react";

function PlotlyChart({ data, layout, style }: { data: any; layout: any; style?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    if (!ref.current) return;
    (async () => {
      try {
        let Plotly: any = null;
        try {
          const mod: any = await import("plotly.js-dist-min");
          Plotly = mod.default || mod.Plotly || mod;
        } catch {}
        // UMD fallback: window.Plotly
        if (!Plotly?.newPlot && typeof window !== "undefined" && (window as any).Plotly?.newPlot) {
          Plotly = (window as any).Plotly;
        }
        // Si aún no está, cargar desde CDN
        if (!Plotly?.newPlot) {
          await new Promise<void>((resolve, reject) => {
            if (document.querySelector('script[data-plotly]')) {
              // esperar a que cargue
              const check = () => ((window as any).Plotly?.newPlot ? resolve() : setTimeout(check, 100));
              check();
              return;
            }
            const s = document.createElement("script");
            s.src = "https://cdn.plot.ly/plotly-2.32.0.min.js";
            s.setAttribute("data-plotly", "true");
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("CDN Plotly failed"));
            document.head.appendChild(s);
          });
          Plotly = (window as any).Plotly;
        }
        if (cancelled || !ref.current) return;
        if (!Plotly?.newPlot) {
          console.error("Plotly.newPlot no disponible", Plotly);
          if (ref.current) ref.current.innerHTML = '<p class="text-xs text-slate-500 p-4">Plotly no disponible — mostrando datos como tabla</p>';
          return;
        }
        await Plotly.newPlot(ref.current, data, { ...layout, autosize: true, margin: { t: 30, l: 40, r: 20, b: 40 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent" }, { responsive: true, displayModeBar: false });
      } catch (e) {
        console.error("Error cargando Plotly", e);
      }
    })();
    return () => { cancelled = true; };
  }, [JSON.stringify(data), JSON.stringify(layout)]);
  return <div ref={ref} style={style || { width: "100%", height: "300px" }} />;
}

type Tab = "resumen" | "chaside" | "personalidad" | "kuder" | "estudiantes" | "usuarios" | "cuenta";

export default function AdminGeneral() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [overview, setOverview] = useState<any>(null);
  const [chaside, setChaside] = useState<any>(null);
  const [pers, setPers] = useState<any>(null);
  const [kuder, setKuder] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ email: "", password: "", first_name: "", last_name: "", role: "docente" as "admin"|"docente" });
  const [pwOld, setPwOld] = useState(""); const [pwNew, setPwNew] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // Mi cuenta edición
  const [editEmail, setEditEmail] = useState("");
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const authHeader = token ? `Token ${token}` : "";
  const isAdmin = currentUser?.role === "admin";
  const isDocente = currentUser?.role === "docente";

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("knox_token") : null;
    const u = typeof window !== "undefined" ? localStorage.getItem("knox_user") : null;
    try { if (u) { const parsed=JSON.parse(u); setCurrentUser(parsed); setEditEmail(parsed.email||""); setEditFirst(parsed.first_name||""); setEditLast(parsed.last_name||""); } } catch {}
    setToken(t);
    if (!t) { setNeedsLogin(true); setLoading(false); return; }
    // Refresca rol desde servidor (evita stale knox_user sin role)
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { headers: { Authorization: `Token ${t}` } });
        if (r.ok) {
          const j = await r.json();
          if (j.user) {
            setCurrentUser(j.user);
            localStorage.setItem("knox_user", JSON.stringify(j.user));
            setEditEmail(j.user.email||"");
            setEditFirst(j.user.first_name||"");
            setEditLast(j.user.last_name||"");
          }
        } else if (r.status === 401) {
          setNeedsLogin(true); setLoading(false);
        }
      } catch {}
    })();
  }, []);

  const load = async () => {
    const t = token || (typeof window !== "undefined" ? localStorage.getItem("knox_token") : null);
    const hdr: any = t ? { Authorization: `Token ${t}` } : {};
    // actualizar currentUser desde servidor (fuente veraz para role)
    try {
      if (t) {
        const me = await fetch("/api/auth/me", { headers: hdr });
        if (me.ok) {
          const j = await me.json();
          if (j.user) {
            setCurrentUser(j.user);
            localStorage.setItem("knox_user", JSON.stringify(j.user));
            setEditEmail(j.user.email||"");
            setEditFirst(j.user.first_name||"");
            setEditLast(j.user.last_name||"");
          }
        }
      } else {
        const uRaw = typeof window !== "undefined" ? localStorage.getItem("knox_user") : null;
        if (uRaw) setCurrentUser(JSON.parse(uRaw));
      }
    } catch {}
    setLoading(true); setError(null);
    try {
      const [oRes, sRes] = await Promise.all([
        fetch("/api/admin/overview", { headers: hdr }),
        fetch("/api/admin/estudiantes", { headers: hdr }),
      ]);
      if (oRes.status === 401 || sRes.status === 401) { setNeedsLogin(true); throw new Error("No autenticado — inicia sesión"); }
      if (oRes.status === 403 || sRes.status === 403) throw new Error("No autorizado — rol insuficiente");
      if (!oRes.ok) throw new Error("No se pudo cargar overview");
      const o = await oRes.json();
      setOverview(o.overview); setChaside(o.chaside); setPers(o.personalidad); setKuder(o.kuder);
      if (sRes.ok) setStudents(await sRes.json());
      // Usuarios solo admin — docente recibe 403 y no falla el panel
      try {
        const uRes = await fetch("/api/users", { headers: hdr });
        if (uRes.ok) setUsers(await uRes.json());
        else if (uRes.status === 403) setUsers([]);
        else setUsers([]);
      } catch { setUsers([]); }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [token]);

  const openDetail = async (id: string) => {
    const r = await fetch(`/api/admin/estudiante/${id}`, { headers: { Authorization: authHeader } });
    setSelected(await r.json());
  };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST", headers: { Authorization: authHeader } }); localStorage.removeItem("knox_token"); localStorage.removeItem("knox_user"); localStorage.removeItem("knox_expiry"); window.location.href = "/admin/login"; };
  const logoutAll = async () => { await fetch("/api/auth/logoutall", { method: "POST", headers: { Authorization: authHeader } }); localStorage.removeItem("knox_token"); localStorage.removeItem("knox_user"); localStorage.removeItem("knox_expiry"); window.location.href = "/admin/login"; };

  if (needsLogin) return <div className="max-w-md mx-auto mt-12 bg-white border rounded-2xl p-6 text-center"><p className="font-bold">Sesión requerida</p><p className="text-sm text-slate-500 mt-1">Debes iniciar sesión (Knox token).</p><a href="/admin/login" className="mt-4 inline-block bg-[#001d62] text-white px-6 py-2 rounded-full font-bold">Ir a Login</a></div>;
  if (loading) return <div className="p-8 text-center text-slate-600">Cargando panel general libsql + plotly...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error} <button onClick={load} className="ml-2 underline">Reintentar</button> <a href="/admin/login" className="ml-2 underline">Login</a></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl font-black" style={{ fontFamily: "Poppins" }}>Panel {isDocente ? "Docente" : "Admin"} — General</h1>
        {currentUser && <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isAdmin ? "bg-[#001d62] text-white border-[#001d62]" : "bg-amber-100 text-amber-800 border-amber-200"}`}>{currentUser.email} · {currentUser.role}</span>}
        <span className="bg-[#001d62] text-white text-xs font-bold px-3 py-1 rounded-full">{students.length} estudiantes</span>
        <span className="bg-[#1f3875] text-white text-xs font-bold px-3 py-1 rounded-full">CHASIDE {overview?.totalChaside ?? 0}</span>
        <span className="bg-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full">Personalidad {overview?.totalPersonalidad ?? 0}</span>
        <span className="bg-[#2563EB] text-white text-xs font-bold px-3 py-1 rounded-full">Kuder {overview?.totalKuder ?? 0}</span>
        <div className="ml-auto flex gap-2 flex-wrap">
          <a href="/" className="bg-white border-2 border-slate-300 font-bold px-4 py-2 rounded-full text-sm">← Menú</a>
          <button onClick={load} className="bg-[#1f3875] text-white font-bold px-4 py-2 rounded-full text-sm">↻ Actualizar</button>
          {isAdmin && <button onClick={async () => { await fetch("/api/chaside/init", { headers: { Authorization: authHeader } }); load(); }} className="bg-slate-100 border font-bold px-4 py-2 rounded-full text-sm">Init DB</button>}
          <button onClick={logout} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Logout</button>
          <button onClick={logoutAll} className="bg-red-50 border border-red-200 text-red-700 font-bold px-4 py-2 rounded-full text-sm">Logout All</button>
        </div>
      </div>

      {/* Tabs — docente no ve Usuarios, todos ven Mi cuenta */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {([
          ["resumen", "Resumen"],
          ["chaside", "CHASIDE"],
          ["personalidad", "Personalidad"],
          ["kuder", "Kuder"],
          ["estudiantes", "Estudiantes"],
          ...(isAdmin ? [["usuarios", "Usuarios"] as const] : []),
          ["cuenta", "Mi cuenta"],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k as Tab)} className={`px-5 py-2.5 rounded-full font-black text-sm whitespace-nowrap border-2 ${tab === k ? "bg-[#001d62] text-white border-[#001d62]" : "bg-white border-slate-200 hover:border-slate-300"}`}>{label}</button>
        ))}
      </div>
      {isDocente && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">Rol <b>docente</b>: solo lectura de formularios y resultados. La gestión de usuarios es exclusiva de <b>admin</b>. Cambia tu usuario/contraseña en <b>Mi cuenta</b>.</p>}

      {tab === "resumen" && overview && (
        <div className="mt-6 space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total estudiantes</p><p className="text-3xl font-black mt-1">{overview.totalEstudiantes}</p><p className="text-xs text-slate-500 mt-1">{overview.completos} con 3 tests · {overview.solo2} con 2 · {overview.solo1} con 1 · {overview.ninguno} sin tests</p></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Completitud</p><p className="text-2xl font-black mt-1">{overview.totalEstudiantes ? Math.round(overview.completos / overview.totalEstudiantes * 100) : 0}% completos</p><div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden flex"><div className="bg-[#001d62] h-full" style={{ width: `${overview.totalEstudiantes ? (overview.completos / overview.totalEstudiantes * 100) : 0}%` }} /><div className="bg-[#1f3875] h-full" style={{ width: `${overview.totalEstudiantes ? (overview.solo2 / overview.totalEstudiantes * 100) : 0}%` }} /><div className="bg-amber-400 h-full" style={{ width: `${overview.totalEstudiantes ? (overview.solo1 / overview.totalEstudiantes * 100) : 0}%` }} /></div><p className="text-[10px] mt-1 text-slate-500">Negro 3 tests · Azul 2 · Amarillo 1</p></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Aplicaciones por test</p><div className="mt-2 space-y-1 text-sm"><div className="flex justify-between"><span className="font-bold">CHASIDE</span><span>{overview.totalChaside}</span></div><div className="flex justify-between"><span className="font-bold">Personalidad</span><span>{overview.totalPersonalidad}</span></div><div className="flex justify-between"><span className="font-bold">Kuder</span><span>{overview.totalKuder}</span></div></div></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Faltantes (muestra)</p><p className="text-xs mt-2 text-slate-600">{overview.faltantes.slice(0, 5).map((f: any) => `${f.id.slice(0, 6)}:${[f.hasC ? "C" : "–", f.hasP ? "P" : "–", f.hasK ? "K" : "–"].join("")}`).join(" · ") || "—"}</p><p className="text-xs text-slate-400 mt-2">{overview.ninguno} estudiantes sin ningún test.</p></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-black text-sm">Plotly — Aplicaciones por test</h3>
              <PlotlyChart data={[{ x: ["CHASIDE", "Personalidad", "Kuder"], y: [overview.totalChaside, overview.totalPersonalidad, overview.totalKuder], type: "bar", marker: { color: ["#1f3875", "#7C3AED", "#2563EB"] } }]} layout={{ title: "" }} />
            </div>
            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-black text-sm">Plotly — Completitud (pie)</h3>
              <PlotlyChart data={[{ values: [overview.completos, overview.solo2, overview.solo1, overview.ninguno], labels: ["3 tests", "2 tests", "1 test", "0 tests"], type: "pie", marker: { colors: ["#001d62", "#1f3875", "#d8215d", "#E5E7EB"] }, hole: 0.4 }]} layout={{ showlegend: true }} />
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4">
            <h3 className="font-black text-sm">Faltantes por estudiante (20)</h3>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs">
                <thead className="bg-slate-50"><tr><th className="px-2 py-2 text-left">Estudiante</th><th className="px-2 py-2">C</th><th className="px-2 py-2">P</th><th className="px-2 py-2">K</th><th className="px-2 py-2">Faltan</th></tr></thead>
                <tbody>{students.slice(0, 20).map((s: any) => <tr key={s.id} className="border-t"><td className="px-2 py-2 font-bold">{s.nombre_estudiante}</td><td className="px-2 py-2 text-center">{s.hasChaside ? <Check size={14} className="inline text-green-600" /> : <Minus size={14} className="inline text-slate-400" />}</td><td className="px-2 py-2 text-center">{s.hasPersonalidad ? <Check size={14} className="inline text-green-600" /> : <Minus size={14} className="inline text-slate-400" />}</td><td className="px-2 py-2 text-center">{s.hasKuder ? <Check size={14} className="inline text-green-600" /> : <Minus size={14} className="inline text-slate-400" />}</td><td className="px-2 py-2 text-center font-bold text-red-600">{3 - s.completados}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "chaside" && chaside && (
        <div className="mt-6 space-y-4">
          <div className="bg-[#F8FAFC] border rounded-2xl p-4">
            <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-1"><BookOpen size={14} />Leyenda CHASIDE</h3>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
              {AREA_ORDER.map(k=>{ const info=AREAS[k]; return <div key={k} className="bg-white border rounded-xl px-2 py-2 text-center"><span className="w-6 h-6 rounded-full text-white text-xs font-black inline-flex items-center justify-center" style={{background:info.color}}>{k}</span><p className="font-bold mt-1 leading-none">{info.nombreCorto}</p><p className="text-[10px] text-slate-500 leading-none">{info.nombre}</p></div>; })}
            </div>
            <p className="text-xs text-slate-600 mt-2">Intereses 0–10 (10 preguntas SÍ/NO por área), Aptitudes 0–4 (4 preguntas). Top = mayor puntaje. Fila amarilla en tablas = tu puntaje. Si ves solo resumen aquí, abre “Estudiantes → Ver” para ver el texto completo como lo ve el estudiante (interesesDesc, aptitudesTraits y carreras).</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total CHASIDE</p><p className="text-3xl font-black">{chaside.total}</p></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Top intereses</p><div className="mt-2 space-y-1 text-sm">{Object.entries(chaside.topIntereses).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="font-bold">{k}</span><span>{String(v)}</span></div>)}</div></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Promedios intereses (0-10)</p><div className="mt-2 grid grid-cols-7 gap-1 text-xs text-center">{Object.entries(chaside.promediosIntereses).map(([k, v]: any) => <div key={k} className="bg-slate-50 border rounded-lg p-2"><p className="font-black">{k}</p><p>{v}</p></div>)}</div></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Top intereses CHASIDE</h3><PlotlyChart data={[{ x: Object.keys(chaside.topIntereses), y: Object.values(chaside.topIntereses), type: "bar", marker: { color: "#1f3875" } }]} layout={{ yaxis: { title: "Estudiantes" } }} /></div>
            <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Promedio aptitudes (0-4)</h3><PlotlyChart data={[{ x: Object.keys(chaside.promediosAptitudes), y: Object.values(chaside.promediosAptitudes), type: "bar", marker: { color: "#d8215d" } }]} layout={{ yaxis: { title: "Promedio" } }} /></div>
          </div>
          <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Radar promedios intereses</h3><PlotlyChart data={[{ type: "scatterpolar", r: [...Object.values(chaside.promediosIntereses) as number[], (Object.values(chaside.promediosIntereses) as number[])[0]], theta: [...Object.keys(chaside.promediosIntereses), Object.keys(chaside.promediosIntereses)[0]], fill: "toself", marker: { color: "#1f3875" } }]} layout={{ polar: { radialaxis: { visible: true, range: [0, 10] } } }} style={{ width: "100%", height: "400px" }} /></div>
        </div>
      )}

      {tab === "personalidad" && pers && (
        <div className="mt-6 space-y-4">
          <div className="bg-[#F9F9FB] border border-[#7C3AED]/20 rounded-2xl p-4">
            <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-1"><BookOpen size={14} />Leyenda MBTI — Qué significa cada letra</h3>
            <div className="mt-2 grid sm:grid-cols-2 gap-3 text-xs">
              <div><b>Mente:</b> <b>E</b> Extravertido (energía con gente) vs <b>I</b> Introvertido (energía a solas)</div>
              <div><b>Energía:</b> <b>S</b> Observador/Sensorial (concreto, presente) vs <b>N</b> Intuitivo (posibilidades, futuro)</div>
              <div><b>Naturaleza:</b> <b>T</b> Pensamiento (lógica, verdad) vs <b>F</b> Sentimiento (empatía, armonía)</div>
              <div><b>Táctica:</b> <b>J</b> Juzgador (orden, planes) vs <b>P</b> Prospección (flexible, improvisas)</div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Tipo = 4 letras (ej: INFP = I+N+F+P). % = fuerza (50% neutral, &gt;75% marcada). Roles: Analistas (NT, morado), Diplomáticos (NF, verde), Centinelas (SJ, celeste), Exploradores (SP, ámbar).</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total Personalidad</p><p className="text-3xl font-black">{pers.total}</p></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Top tipos (16)</p><div className="mt-2 space-y-1 text-sm">{Object.entries(pers.byType).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="font-bold">{k}</span><span>{String(v)}</span></div>)}</div></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Roles</p><div className="mt-2 space-y-1 text-sm">{Object.entries(pers.byRole).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="font-bold">{k}</span><span>{String(v)}</span></div>)}</div></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Distribución 16 tipos</h3><PlotlyChart data={[{ x: Object.keys(pers.byType), y: Object.values(pers.byType), type: "bar", marker: { color: "#7C3AED" } }]} layout={{ xaxis: { tickangle: -30 } }} /></div>
            <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Roles (pie)</h3><PlotlyChart data={[{ values: Object.values(pers.byRole), labels: Object.keys(pers.byRole), type: "pie", marker: { colors: ["#7C3AED", "#10B981", "#0EA5E9", "#F59E0B"] } }]} layout={{}} /></div>
          </div>
          <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Promedio dimensiones (0-100% hacia E/S/T/J)</h3><PlotlyChart data={[{ x: Object.keys(pers.dimAvg), y: Object.values(pers.dimAvg), type: "bar", marker: { color: "#10B981" } }]} layout={{ yaxis: { range: [0, 100], title: "%" } }} /></div>
        </div>
      )}

      {tab === "kuder" && kuder && (
        <div className="mt-6 space-y-4">
          <div className="bg-[#EFF6FF] border border-[#2563EB]/20 rounded-2xl p-4">
            <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-1"><BookOpen size={14} />Leyenda Kuder — Nomenclatura</h3>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {KUDER_ORDER.map(k=>{ const info=KUDER_AREAS[k]; return <div key={k} className="bg-white border rounded-xl px-2 py-2 flex gap-2 items-center"><LucideIcon name={info.icono} size={16} style={{color:info.color}} /><div><p className="font-black leading-none">{k}</p><p className="font-bold text-[11px] leading-none">{info.nombre}</p><p className="text-[10px] text-slate-500 leading-none">{info.nombreCorto}</p></div></div>; })}
            </div>
            <p className="text-xs text-slate-600 mt-2">10 áreas, 60 diadas (eliges A o B), cada elección suma +1. Puntaje 0–60, Top = área más elegida, Ranking ordena mayor a menor. Verificación = válido si 60 respuestas.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total Kuder</p><p className="text-3xl font-black">{kuder.total}</p></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Top áreas</p><div className="mt-2 space-y-1 text-sm">{Object.entries(kuder.byTop).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="font-bold">{k}</span><span>{String(v)}</span></div>)}</div></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Promedios (0-60)</p><div className="mt-2 grid grid-cols-5 gap-1 text-xs text-center">{Object.entries(kuder.avgScores).map(([k, v]: any) => <div key={k} className="bg-slate-50 border rounded-lg p-2"><p className="font-black">{k}</p><p>{v}</p></div>)}</div></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Top áreas Kuder</h3><PlotlyChart data={[{ x: Object.keys(kuder.byTop), y: Object.values(kuder.byTop), type: "bar", marker: { color: "#2563EB" } }]} layout={{}} /></div>
            <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Promedio puntajes por área</h3><PlotlyChart data={[{ x: Object.keys(kuder.avgScores), y: Object.values(kuder.avgScores), type: "bar", marker: { color: "#EA580C" } }]} layout={{}} /></div>
          </div>
        </div>
      )}

      {tab === "estudiantes" && (
        <div className="mt-6 space-y-3">
          <div className="bg-[#F8FAFC] border rounded-2xl p-3 text-xs flex flex-wrap gap-3 items-center">
            <span className="inline-flex items-center gap-1"><b>C</b> = CHASIDE (<Check size={12} className="inline text-green-600" /> + letra = top interés, ej: C=I)</span>
            <span className="inline-flex items-center gap-1"><b>P</b> = Personalidad MBTI (<Check size={12} className="inline text-green-600" /> + tipo, ej: P=INFP)</span>
            <span className="inline-flex items-center gap-1"><b>K</b> = Kuder (<Check size={12} className="inline text-green-600" /> + área, ej: K=PER)</span>
            <span><b>Faltan</b> = 3 - completados</span>
            <span className="text-slate-500">Ver = abre el resultado completo como lo ve el estudiante</span>
          </div>
          <div className="bg-white border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#001d62] text-white text-xs uppercase"><tr><th className="px-3 py-2 text-left">Moodle Nombre</th><th className="px-3 py-2">Moodle ID</th><th className="px-3 py-2">Email Moodle</th><th className="px-3 py-2">Curso</th><th className="px-3 py-2">C</th><th className="px-3 py-2">P</th><th className="px-3 py-2">K</th><th className="px-3 py-2">Faltan</th><th className="px-3 py-2">Acción</th></tr></thead>
                <tbody>
                  {students.map((s: any) => (
                    <tr key={s.id} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2 font-bold">{s.moodle_user_name || s.nombre_estudiante || "—"}</td>
                      <td className="px-3 py-2 text-center text-xs font-mono">{s.moodle_user_id ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">{s.moodle_user_email || s.correo_estudiante || "—"}</td>
                      <td className="px-3 py-2 text-xs text-center">{s.moodle_course_id ?? "—"}</td>
                      <td className="px-3 py-2 text-center">{s.hasChaside ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><Check size={12} />{s.chaside?.top_interes}</span> : <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs inline-flex items-center gap-1"><Minus size={12} /></span>}</td>
                      <td className="px-3 py-2 text-center">{s.hasPersonalidad ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">{s.personalidad?.tipo}</span> : <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs inline-flex items-center gap-1"><Minus size={12} /></span>}</td>
                      <td className="px-3 py-2 text-center">{s.hasKuder ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{s.kuder?.top}</span> : <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs inline-flex items-center gap-1"><Minus size={12} /></span>}</td>
                      <td className="px-3 py-2 text-center font-black text-red-600">{3 - s.completados}</td>
                      <td className="px-3 py-2"><button onClick={() => openDetail(s.id)} className="bg-[#001d62] text-white px-3 py-1 rounded-full text-xs font-bold">Ver</button></td>
                    </tr>
                  ))}
                  {students.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Sin datos. Simula con npm run seed o rinde tests.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "usuarios" && (
        isAdmin ? (
        <div className="mt-6 space-y-4">
          <div className="bg-white border rounded-2xl p-5">
            <h3 className="font-black text-sm flex items-center gap-2"><Users size={16} />Usuarios — Admin crea múltiples</h3>
            <p className="text-xs text-slate-500 mt-1">Este es el <b>módulo de creación</b>. Crea docentes o más admins. Usa email como usuario. Contraseña ≥8.</p>
            {/* Módulo crear - destacado */}
            <div className="mt-4 bg-[#1f3875]/5 border-2 border-dashed border-[#1f3875]/30 rounded-2xl p-4">
              <h4 className="font-black text-sm flex items-center gap-2"><UserPlus size={16} className="text-[#1f3875]" />Crear nuevo usuario</h4>
              <p className="text-xs text-slate-500">Completa y pulsa Crear. El nuevo usuario podrá loguearse inmediatamente.</p>
              <div className="mt-3 grid md:grid-cols-2 gap-2">
                <input placeholder="email (usuario) *" value={newUser.email} onChange={e => setNewUser(s => ({ ...s, email: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="contraseña ≥8 *" type="password" value={newUser.password} onChange={e => setNewUser(s => ({ ...s, password: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="nombre" value={newUser.first_name} onChange={e => setNewUser(s => ({ ...s, first_name: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="apellido" value={newUser.last_name} onChange={e => setNewUser(s => ({ ...s, last_name: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
                <select value={newUser.role} onChange={e => setNewUser(s=>({...s, role:e.target.value as any}))} className="border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="docente">docente — solo revisa formularios</option>
                  <option value="admin">admin — gestiona usuarios y datos</option>
                </select>
                <button onClick={async () => { if(!newUser.email || !newUser.password) {alert("email y contraseña requeridos"); return;} const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify(newUser) }); if (r.ok) { setNewUser({ email: "", password: "", first_name: "", last_name: "", role: "docente" }); load(); } else alert((await r.json()).error); }} className="bg-[#001d62] text-white px-4 py-2 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2"><UserPlus size={16} />Crear usuario</button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">* requerido. Tip: usa <code>docente.matematicas@colegio.edu.ec</code> + clave temporal.</p>
            </div>
            <div className="mt-4">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-500">Lista de usuarios ({users.length})</h4>
              <div className="mt-2 space-y-2 max-h-80 overflow-auto">
                {users.map((u: any) => (
                  <div key={u.id} className="flex justify-between items-center border-b py-2 text-sm gap-2">
                    <span className="flex-1"><span className="font-bold">{u.email}</span> <span className={`ml-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${u.role==='admin' ? 'bg-[#001d62] text-white border-[#001d62]' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>{u.role}</span> <span className="text-xs text-slate-500">({[u.first_name,u.last_name].filter(Boolean).join(" ") || "—"})</span></span>
                    <div className="flex gap-1 items-center">
                      <select value={u.role} onChange={async e => { const newRole=e.target.value; if(!confirm(`Cambiar ${u.email} a ${newRole}?`)) return; const r=await fetch(`/api/users/${u.id}`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:authHeader},body:JSON.stringify({role:newRole})}); if(!r.ok) alert((await r.json()).error); else load(); }} className="text-xs border rounded-full px-2 py-1 bg-white">
                        <option value="admin">admin</option>
                        <option value="docente">docente</option>
                      </select>
                      <button onClick={async () => { if (!confirm("Eliminar " + u.email + "?")) return; const r=await fetch(`/api/users/${u.id}`, { method: "DELETE", headers: { Authorization: authHeader } }); if(!r.ok) alert((await r.json()).error); else load(); }} className="text-red-600 text-xs font-bold">Eliminar</button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className="text-xs text-slate-500">Sin usuarios</p>}
              </div>
            </div>
            <div className="mt-3 bg-slate-50 border rounded-xl p-3 text-xs">
              <p className="font-black">Ideas para tu caso:</p>
              <ul className="list-disc ml-4 mt-1 space-y-1 text-slate-600">
                <li><b>1 docente por curso</b>: crea <code>docente.curso@colegio.edu.ec</code> rol docente, pásales la clave temporal y que la cambien en <b>Mi cuenta</b>.</li>
                <li><b>Admin extra</b>: crea <code>coordinador@teamggm.com</code> rol admin para que también gestione usuarios.</li>
                <li><b>Bloqueo</b>: usa <i>Eliminar</i> para revocar acceso inmediato (borra tokens Knox).</li>
              </ul>
            </div>
          </div>
        </div>
        ) : (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center"><p className="font-black text-amber-800">Acceso restringido</p><p className="text-sm text-amber-700 mt-1">Solo <b>admin</b> puede gestionar usuarios. Tu rol es <b>docente</b> (solo lectura de formularios). Ve a <b>Mi cuenta</b> para cambiar tu usuario/contraseña.</p></div>
        )
      )}

      {tab === "cuenta" && (
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-2xl p-5">
            <h3 className="font-black text-sm">Mi cuenta — Cambiar usuario</h3>
            <p className="text-xs text-slate-500">Tu rol: <span className={`font-black px-2 py-0.5 rounded-full text-xs ${isAdmin?"bg-[#001d62] text-white":"bg-amber-100 text-amber-800"}`}>{currentUser?.role}</span> {isAdmin ? "(puedes crear usuarios en pestaña Usuarios)" : "(solo lectura)"}</p>
            {editMsg && <p className="mt-2 text-xs font-bold px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700">{editMsg}</p>}
            <div className="mt-3 space-y-2">
              <div><label className="text-xs font-bold uppercase">Email (usuario)</label><input value={editEmail} onChange={e=>setEditEmail(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-bold uppercase">Nombre</label><input value={editFirst} onChange={e=>setEditFirst(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-bold uppercase">Apellido</label><input value={editLast} onChange={e=>setEditLast(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <button disabled={editSaving} onClick={async()=>{ setEditSaving(true); setEditMsg(null); try{ const r=await fetch(`/api/users/${currentUser.id}`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:authHeader},body:JSON.stringify({email:editEmail, first_name:editFirst, last_name:editLast})}); const j=await r.json(); if(!r.ok) throw new Error(j.error); setCurrentUser(j); localStorage.setItem("knox_user", JSON.stringify(j)); setEditMsg("Usuario actualizado ✓"); load(); }catch(e:any){ alert(e.message); } finally{ setEditSaving(false); } }} className="w-full bg-[#001d62] text-white py-2 rounded-full text-sm font-bold disabled:opacity-60">{editSaving?"Guardando...":"Guardar cambios"}</button>
              <p className="text-[11px] text-slate-400">El email es tu usuario para login. Se guarda en minúsculas.</p>
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-5">
            <h3 className="font-black text-sm">Cambiar mi contraseña</h3>
            <p className="text-xs text-slate-500">Requiere tu contraseña actual. Mínimo 8 caracteres. Usa bcrypt.</p>
            <div className="mt-3 space-y-2">
              <input placeholder="Contraseña actual" type="password" value={pwOld} onChange={e => setPwOld(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Nueva contraseña (≥8)" type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <button onClick={async () => { const r = await fetch("/api/users/change-password", { method: "POST", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify({ old_password: pwOld, new_password: pwNew }) }); const j = await r.json(); if (r.ok) { alert("Contraseña cambiada ✓"); setPwOld(""); setPwNew(""); } else alert(j.error); }} className="w-full bg-[#001d62] text-white py-2 rounded-full text-sm font-bold">Cambiar contraseña</button>
              {isAdmin && <p className="text-[11px] text-slate-400">Admin: para resetear clave de otro usuario sin saber la actual, usa la lista de Usuarios → contacta al admin o usa PATCH /api/users/:id/change-password.</p>}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg">{selected.estudiante.nombre_estudiante}</h3>
                <p className="text-xs text-slate-500">ID {selected.estudiante.id} · Creado {new Date((selected.estudiante.created_at || 0) * 1000).toLocaleString()}</p>
                <p className="text-xs mt-1">Padre: {selected.estudiante.nombre_padre || "—"} | Correos: {selected.estudiante.correo_estudiante || "—"} / {selected.estudiante.correo_padre || "—"} | Cédulas: {selected.estudiante.cedula_estudiante || "—"} / {selected.estudiante.cedula_representante || "—"}</p>
              </div>
              <button onClick={() => setSelected(null)} className="bg-slate-100 border rounded-full w-8 h-8 flex items-center justify-center"><X size={16} /></button>
            </div>
            {/* Leyenda general para quien ve el detalle por primera vez */}
            <div className="mt-3 bg-[#F8FAFC] border rounded-xl p-3 text-xs">
              <p className="font-black flex items-center gap-1"><BookOpen size={14} />Cómo leer:</p>
              <p className="text-slate-600 mt-1 flex flex-wrap gap-1 items-center"><b>CHASIDE</b> C=Administrativa, H=Humanística, A=Artística, S=Salud, I=Ingeniería, D=Defensa, E=Exactas — Intereses 0–10, Aptitudes 0–4. <b>MBTI</b> E/I (Mente), S/N (Energía), T/F (Naturaleza), J/P (Táctica) — 50% neutral, 4 letras = tipo. <b>Kuder</b> <span className="inline-flex items-center gap-1"><LucideIcon name="Trees" size={12} />EXT</span> <span className="inline-flex items-center gap-1"><LucideIcon name="Wrench" size={12} />MEC</span> <span className="inline-flex items-center gap-1"><LucideIcon name="Calculator" size={12} />CAL</span> <span className="inline-flex items-center gap-1"><LucideIcon name="FlaskConical" size={12} />CIE</span> <span className="inline-flex items-center gap-1"><LucideIcon name="Handshake" size={12} />PER</span> <span className="inline-flex items-center gap-1"><LucideIcon name="Palette" size={12} />ART</span> <span className="inline-flex items-center gap-1"><LucideIcon name="BookOpen" size={12} />LIT</span> <span className="inline-flex items-center gap-1"><LucideIcon name="Music" size={12} />MUS</span> <span className="inline-flex items-center gap-1"><LucideIcon name="HeartHandshake" size={12} />SOC</span> <span className="inline-flex items-center gap-1"><LucideIcon name="Building2" size={12} />OFI</span> — 60 elecciones, puntaje = veces elegido.</p>
            </div>
            <div className="mt-4 grid lg:grid-cols-3 gap-3">
              <div className={`border rounded-xl p-4 ${selected.chaside ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <h4 className="font-black text-sm flex items-center gap-1">CHASIDE {selected.chaside ? <><Check size={14} className="text-green-600" /></> : <><Minus size={14} className="text-red-500" />faltante</>}</h4>
                {selected.chaside ? <>
                  <div className="mt-2 grid grid-cols-7 gap-1 text-[10px] text-center">{Object.entries(selected.chaside.intereses).map(([k, v]: any) => <div key={k} className={`font-black p-1 rounded border ${k===selected.chaside.topInteres ? "bg-[#001d62] text-white" : "bg-[#d8215d]"}`}>{k}<br />{String(v)}</div>)}</div>
                  <div className="mt-2 grid grid-cols-7 gap-1 text-[10px] text-center">{Object.entries(selected.chaside.aptitudes).map(([k, v]: any) => <div key={k} className={`p-1 rounded border text-xs ${k===selected.chaside.topAptitud ? "bg-[#001d62] text-white font-black" : "bg-white"}`}>{k}<br />{String(v)}</div>)}</div>
                  <p className="text-[11px] text-slate-500 mt-1">Amarillo/Negro = top. Intereses 0–10 (10 preguntas), Aptitudes 0–4.</p>
                  {/* Contexto completo como ve el estudiante */}
                  <div className="mt-3 bg-white border rounded-xl p-3">
                    <p className="text-xs font-black">Lo que más le interesa: {AREAS[selected.chaside.topInteres as keyof typeof AREAS]?.nombre} ({selected.chaside.topInteres}) — {selected.chaside.intereses[selected.chaside.topInteres]}/10</p>
                    <p className="text-xs text-slate-700 mt-1">{AREAS[selected.chaside.topInteres as keyof typeof AREAS]?.interesesDesc} Aptitudes: {AREAS[selected.chaside.topInteres as keyof typeof AREAS]?.aptitudesTraits}.</p>
                    <p className="text-xs mt-1"><b>Carreras:</b> {AREAS[selected.chaside.topInteres as keyof typeof AREAS]?.carreras}</p>
                    {selected.chaside.segundoInteres && selected.chaside.intereses[selected.chaside.segundoInteres] > 0 && <>
                      <p className="text-xs font-black mt-2">También le interesa: {AREAS[selected.chaside.segundoInteres as keyof typeof AREAS]?.nombre} ({selected.chaside.segundoInteres}) — {selected.chaside.intereses[selected.chaside.segundoInteres]}/10</p>
                      <p className="text-xs text-slate-700 mt-1">{AREAS[selected.chaside.segundoInteres as keyof typeof AREAS]?.interesesDesc} Aptitudes: {AREAS[selected.chaside.segundoInteres as keyof typeof AREAS]?.aptitudesTraits}.</p>
                      <p className="text-xs mt-1"><b>Carreras:</b> {AREAS[selected.chaside.segundoInteres as keyof typeof AREAS]?.carreras}</p>
                    </>}
                    <p className="text-xs font-black mt-2">Tiene aptitudes para: {AREAS[selected.chaside.topAptitud as keyof typeof AREAS]?.nombre} ({selected.chaside.topAptitud}) — {selected.chaside.aptitudes[selected.chaside.topAptitud]}/4</p>
                    <p className="text-xs text-slate-700 mt-1">Aptitudes: {AREAS[selected.chaside.topAptitud as keyof typeof AREAS]?.aptitudesTraits}. Le gustan: {AREAS[selected.chaside.topAptitud as keyof typeof AREAS]?.interesesTraits}.</p>
                    <p className="text-xs mt-1"><b>Carreras:</b> {AREAS[selected.chaside.topAptitud as keyof typeof AREAS]?.carreras}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{new Date(selected.chaside.fecha_unix * 1000).toLocaleString()} · {selected.chaside.segundoInteres ? `2do ${selected.chaside.segundoInteres}` : "sin 2do"} · Apt {selected.chaside.topAptitud}</p>
                </> : <p className="text-xs text-slate-600 mt-2">Pendiente de rendir. El estudiante aún no completó las 98 preguntas SÍ/NO. Intereses 0–10, Aptitudes 0–4.</p>}
              </div>
              <div className={`border rounded-xl p-4 ${selected.personalidad ? "bg-purple-50 border-purple-200" : "bg-red-50 border-red-200"}`}>
                <h4 className="font-black text-sm flex items-center gap-1">Personalidad {selected.personalidad ? <><Check size={14} className="text-green-600" />{selected.personalidad.tipo}</> : <><Minus size={14} className="text-red-500" />faltante</>}</h4>
                {selected.personalidad ? (()=>{ const t=TYPES[selected.personalidad.tipo as keyof typeof TYPES]; return <>
                  <p className="text-xs font-black mt-2" style={{color:t.color}}>{t.code} — {t.name} <span className="text-slate-500">({t.role})</span></p>
                  <p className="text-xs text-slate-700 mt-1">{t.tagline} — {t.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{t.strengths.map((s:string)=><span key={s} className="text-[10px] font-bold px-2 py-1 rounded-full border bg-white">{s}</span>)}</div>
                  <div className="mt-3 space-y-2">{Object.entries(selected.personalidad.dimensiones as any).map(([k, v]: any) => {
                    const label = k==="EI" ? "Mente E/I" : k==="SN" ? "Energía S/N" : k==="TF" ? "Naturaleza T/F" : "Táctica J/P";
                    const left = k==="EI" ? "I Introvertido" : k==="SN" ? "N Intuitivo" : k==="TF" ? "F Sentimiento" : "P Prospección";
                    const right = k==="EI" ? "E Extravertido" : k==="SN" ? "S Observador" : k==="TF" ? "T Pensamiento" : "J Juzgador";
                    return <div key={k} className="bg-white border rounded-lg p-2"><p className="text-[10px] font-black uppercase tracking-wider">{label}: {v.letter} {v.percent}%</p><div className="mt-1 h-2 bg-slate-200 rounded-full overflow-hidden flex"><div className="h-full bg-[#001d62]" style={{width:`${v.percent}%`}} /><div className="h-full bg-slate-300" style={{width:`${100-v.percent}%`}} /></div><p className="text-[10px] flex justify-between mt-1"><span>{left}</span><span>{right}</span></p></div>;
                  })}</div>
                  <p className="text-xs text-slate-500 mt-2">{new Date(selected.personalidad.fecha_unix * 1000).toLocaleString()} · 50% neutral, &gt;60% ligera, &gt;75% marcada</p>
                </>; })() : <p className="text-xs text-slate-600 mt-2">Pendiente. 60 preguntas Likert -3..+3 → 4 dicotomías → tipo 4 letras (ej: INFP). Ver leyenda MBTI.</p>}
              </div>
              <div className={`border rounded-xl p-4 ${selected.kuder ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
                <h4 className="font-black text-sm flex items-center gap-1">Kuder {selected.kuder ? <><Check size={14} className="text-green-600" />{selected.kuder.top}</> : <><Minus size={14} className="text-red-500" />faltante</>}</h4>
                {selected.kuder ? (()=>{ const topInfo=KUDER_AREAS[selected.kuder.top as keyof typeof KUDER_AREAS]; return <>
                  <p className="text-xs font-black mt-2 flex items-center gap-1" style={{color:topInfo.color}}><LucideIcon name={topInfo.icono} size={14} style={{color:topInfo.color}} />{topInfo.nombre} ({selected.kuder.top}) — {selected.kuder.scores[selected.kuder.top]}/60 ({Math.round(selected.kuder.scores[selected.kuder.top]/60*100)}%)</p>
                  <p className="text-xs text-slate-700 mt-1">{topInfo.descripcion}</p>
                  <p className="text-xs mt-1"><b>Carreras:</b> {topInfo.carreras}</p>
                  <p className="text-xs mt-2"><b>Ranking:</b> {selected.kuder.ranking.map((k:string, i:number)=> <span key={k} className="inline-flex items-center gap-1">{i>0 && " > "}<LucideIcon name={KUDER_AREAS[k as keyof typeof KUDER_AREAS].icono} size={12} />{k} {selected.kuder.scores[k]}</span>)}</p>
                  <div className="mt-2 grid grid-cols-5 gap-1 text-[10px] text-center">{Object.entries(selected.kuder.scores).map(([k, v]: any) => { const info=KUDER_AREAS[k as keyof typeof KUDER_AREAS]; const isTop=k===selected.kuder.top; return <div key={k} className={`border rounded p-1 flex flex-col items-center gap-0.5 ${isTop?"bg-[#001d62] text-white font-black":"bg-white"}`}><LucideIcon name={info.icono} size={14} style={isTop ? {color:"white"} : {color:info.color}} /><b>{k}</b><div className="text-[9px]">{info.nombreCorto}</div><div>{String(v)}</div></div>; })}</div>
                  <p className="text-xs text-slate-500 mt-2">{new Date(selected.kuder.fecha_unix * 1000).toLocaleString()} · Verif: {selected.kuder.verificacion} · 60 diadas, cada elección +1</p>
                </>; })() : <p className="text-xs text-slate-600 mt-2">Pendiente. 60 diadas (elige A o B), cada área puntúa 0–60.</p>}
              </div>
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.chaside ? "bg-green-600 text-white" : "bg-red-100 text-red-700"}`}>CHASIDE {selected.chaside ? "rendido" : "pendiente"}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.personalidad ? "bg-purple-600 text-white" : "bg-red-100 text-red-700"}`}>Personalidad {selected.personalidad ? "rendido" : "pendiente"}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.kuder ? "bg-blue-600 text-white" : "bg-red-100 text-red-700"}`}>Kuder {selected.kuder ? "rendido" : "pendiente"}</span>
              <span className="ml-auto text-xs font-bold">Faltan {3 - [selected.chaside, selected.personalidad, selected.kuder].filter(Boolean).length} test(s)</span>
            </div>
            {isAdmin && (
              <div className="mt-4 border-t pt-4 flex gap-2 flex-wrap">
                <button onClick={async () => { if (!confirm(`¿Habilitar retake para ${selected.estudiante.moodle_user_name || selected.estudiante.id}? Borrará todos los resultados.`)) return; await fetch(`/api/admin/estudiante/${selected.estudiante.id}`, { method: "DELETE", headers: { Authorization: authHeader } }); setSelected(null); load(); }} className="bg-[#d8215d] text-white font-bold px-4 py-2 rounded-full text-sm">Habilitar retake (borrar resultados)</button>
                <button onClick={async () => { if (!confirm("¿Borrar solo CHASIDE?")) return; await fetch(`/api/admin/estudiante/${selected.estudiante.id}?test=chaside`, { method: "DELETE", headers: { Authorization: authHeader } }); setSelected(null); load(); }} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Borrar solo CHASIDE</button>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="mt-6 w-full bg-[#001d62] text-white font-bold py-2 rounded-full">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
