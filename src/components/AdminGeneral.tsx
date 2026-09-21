import { useEffect, useState, useRef } from "react";

function PlotlyChart({ data, layout, style }: { data: any; layout: any; style?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    if (!ref.current) return;
    (async () => {
      const Plotly: any = await import("plotly.js-dist-min");
      if (cancelled || !ref.current) return;
      await Plotly.newPlot(ref.current, data, { ...layout, autosize: true, margin: { t: 30, l: 40, r: 20, b: 40 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent" }, { responsive: true, displayModeBar: false });
    })();
    return () => { cancelled = true; };
  }, [JSON.stringify(data), JSON.stringify(layout)]);
  return <div ref={ref} style={style || { width: "100%", height: "300px" }} />;
}

type Tab = "resumen" | "chaside" | "personalidad" | "kuder" | "estudiantes" | "usuarios";

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
  const [newUser, setNewUser] = useState({ email: "", password: "", first_name: "" });
  const [pwOld, setPwOld] = useState(""); const [pwNew, setPwNew] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const authHeader = token ? `Token ${token}` : "";

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("knox_token") : null;
    setToken(t);
    if (!t) { setNeedsLogin(true); setLoading(false); }
  }, []);

  const load = async () => {
    const t = token || (typeof window !== "undefined" ? localStorage.getItem("knox_token") : null);
    const hdr: any = t ? { Authorization: `Token ${t}` } : {};
    setLoading(true); setError(null);
    try {
      const [oRes, sRes, uRes] = await Promise.all([
        fetch("/api/admin/overview", { headers: hdr }),
        fetch("/api/admin/estudiantes", { headers: hdr }),
        fetch("/api/users", { headers: hdr })
      ]);
      if (oRes.status === 401 || sRes.status === 401) { setNeedsLogin(true); throw new Error("No autenticado — inicia sesión"); }
      if (!oRes.ok) throw new Error("No se pudo cargar overview");
      const o = await oRes.json();
      setOverview(o.overview); setChaside(o.chaside); setPers(o.personalidad); setKuder(o.kuder);
      if (sRes.ok) setStudents(await sRes.json());
      if (uRes.ok) setUsers(await uRes.json());
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [token]);

  const openDetail = async (id: string) => {
    const r = await fetch(`/api/admin/estudiante/${id}`, { headers: { Authorization: authHeader } });
    setSelected(await r.json());
  };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST", headers: { Authorization: authHeader } }); localStorage.removeItem("knox_token"); window.location.href = "/admin/login"; };
  const logoutAll = async () => { await fetch("/api/auth/logoutall", { method: "POST", headers: { Authorization: authHeader } }); localStorage.removeItem("knox_token"); window.location.href = "/admin/login"; };

  if (needsLogin) return <div className="max-w-md mx-auto mt-12 bg-white border rounded-2xl p-6 text-center"><p className="font-bold">Sesión requerida</p><p className="text-sm text-slate-500 mt-1">Debes iniciar sesión (Knox token).</p><a href="/admin/login" className="mt-4 inline-block bg-[#0B1220] text-white px-6 py-2 rounded-full font-bold">Ir a Login</a></div>;
  if (loading) return <div className="p-8 text-center text-slate-600">Cargando panel general libsql + plotly...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error} <button onClick={load} className="ml-2 underline">Reintentar</button> <a href="/admin/login" className="ml-2 underline">Login</a></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl font-black" style={{ fontFamily: "Poppins" }}>Panel Admin — General</h1>
        <span className="bg-[#0B1220] text-white text-xs font-bold px-3 py-1 rounded-full">{students.length} estudiantes</span>
        <span className="bg-[#0052FF] text-white text-xs font-bold px-3 py-1 rounded-full">CHASIDE {overview?.totalChaside ?? 0}</span>
        <span className="bg-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full">Personalidad {overview?.totalPersonalidad ?? 0}</span>
        <span className="bg-[#2563EB] text-white text-xs font-bold px-3 py-1 rounded-full">Kuder {overview?.totalKuder ?? 0}</span>
        <div className="ml-auto flex gap-2 flex-wrap">
          <a href="/" className="bg-white border-2 border-slate-300 font-bold px-4 py-2 rounded-full text-sm">← Menú</a>
          <button onClick={load} className="bg-[#0052FF] text-white font-bold px-4 py-2 rounded-full text-sm">↻ Actualizar</button>
          <button onClick={async () => { await fetch("/api/chaside/init", { headers: { Authorization: authHeader } }); load(); }} className="bg-slate-100 border font-bold px-4 py-2 rounded-full text-sm">Init DB</button>
          <button onClick={logout} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Logout</button>
          <button onClick={logoutAll} className="bg-red-50 border border-red-200 text-red-700 font-bold px-4 py-2 rounded-full text-sm">Logout All</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {([
          ["resumen", "Resumen"],
          ["chaside", "CHASIDE"],
          ["personalidad", "Personalidad"],
          ["kuder", "Kuder"],
          ["estudiantes", "Estudiantes"],
          ["usuarios", "Usuarios"],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k as Tab)} className={`px-5 py-2.5 rounded-full font-black text-sm whitespace-nowrap border-2 ${tab === k ? "bg-[#0B1220] text-white border-[#0B1220]" : "bg-white border-slate-200 hover:border-slate-300"}`}>{label}</button>
        ))}
      </div>

      {tab === "resumen" && overview && (
        <div className="mt-6 space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total estudiantes</p><p className="text-3xl font-black mt-1">{overview.totalEstudiantes}</p><p className="text-xs text-slate-500 mt-1">{overview.completos} con 3 tests · {overview.solo2} con 2 · {overview.solo1} con 1 · {overview.ninguno} sin tests</p></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Completitud</p><p className="text-2xl font-black mt-1">{overview.totalEstudiantes ? Math.round(overview.completos / overview.totalEstudiantes * 100) : 0}% completos</p><div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden flex"><div className="bg-[#0B1220] h-full" style={{ width: `${overview.totalEstudiantes ? (overview.completos / overview.totalEstudiantes * 100) : 0}%` }} /><div className="bg-[#0052FF] h-full" style={{ width: `${overview.totalEstudiantes ? (overview.solo2 / overview.totalEstudiantes * 100) : 0}%` }} /><div className="bg-amber-400 h-full" style={{ width: `${overview.totalEstudiantes ? (overview.solo1 / overview.totalEstudiantes * 100) : 0}%` }} /></div><p className="text-[10px] mt-1 text-slate-500">Negro 3 tests · Azul 2 · Amarillo 1</p></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Aplicaciones por test</p><div className="mt-2 space-y-1 text-sm"><div className="flex justify-between"><span className="font-bold">CHASIDE</span><span>{overview.totalChaside}</span></div><div className="flex justify-between"><span className="font-bold">Personalidad</span><span>{overview.totalPersonalidad}</span></div><div className="flex justify-between"><span className="font-bold">Kuder</span><span>{overview.totalKuder}</span></div></div></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Faltantes (muestra)</p><p className="text-xs mt-2 text-slate-600">{overview.faltantes.slice(0, 5).map((f: any) => `${f.id.slice(0, 6)}:${[f.hasC ? "C" : "–", f.hasP ? "P" : "–", f.hasK ? "K" : "–"].join("")}`).join(" · ") || "—"}</p><p className="text-xs text-slate-400 mt-2">{overview.ninguno} estudiantes sin ningún test.</p></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-black text-sm">Plotly — Aplicaciones por test</h3>
              <PlotlyChart data={[{ x: ["CHASIDE", "Personalidad", "Kuder"], y: [overview.totalChaside, overview.totalPersonalidad, overview.totalKuder], type: "bar", marker: { color: ["#0052FF", "#7C3AED", "#2563EB"] } }]} layout={{ title: "" }} />
            </div>
            <div className="bg-white border rounded-2xl p-4">
              <h3 className="font-black text-sm">Plotly — Completitud (pie)</h3>
              <PlotlyChart data={[{ values: [overview.completos, overview.solo2, overview.solo1, overview.ninguno], labels: ["3 tests", "2 tests", "1 test", "0 tests"], type: "pie", marker: { colors: ["#0B1220", "#0052FF", "#FFCC00", "#E5E7EB"] }, hole: 0.4 }]} layout={{ showlegend: true }} />
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4">
            <h3 className="font-black text-sm">Faltantes por estudiante (20)</h3>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs">
                <thead className="bg-slate-50"><tr><th className="px-2 py-2 text-left">Estudiante</th><th className="px-2 py-2">C</th><th className="px-2 py-2">P</th><th className="px-2 py-2">K</th><th className="px-2 py-2">Faltan</th></tr></thead>
                <tbody>{students.slice(0, 20).map((s: any) => <tr key={s.id} className="border-t"><td className="px-2 py-2 font-bold">{s.nombre_estudiante}</td><td className="px-2 py-2 text-center">{s.hasChaside ? "✓" : "—"}</td><td className="px-2 py-2 text-center">{s.hasPersonalidad ? "✓" : "—"}</td><td className="px-2 py-2 text-center">{s.hasKuder ? "✓" : "—"}</td><td className="px-2 py-2 text-center font-bold text-red-600">{3 - s.completados}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "chaside" && chaside && (
        <div className="mt-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Total CHASIDE</p><p className="text-3xl font-black">{chaside.total}</p></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Top intereses</p><div className="mt-2 space-y-1 text-sm">{Object.entries(chaside.topIntereses).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="font-bold">{k}</span><span>{String(v)}</span></div>)}</div></div>
            <div className="bg-white border rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Promedios intereses (0-10)</p><div className="mt-2 grid grid-cols-7 gap-1 text-xs text-center">{Object.entries(chaside.promediosIntereses).map(([k, v]: any) => <div key={k} className="bg-slate-50 border rounded-lg p-2"><p className="font-black">{k}</p><p>{v}</p></div>)}</div></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Top intereses CHASIDE</h3><PlotlyChart data={[{ x: Object.keys(chaside.topIntereses), y: Object.values(chaside.topIntereses), type: "bar", marker: { color: "#0052FF" } }]} layout={{ yaxis: { title: "Estudiantes" } }} /></div>
            <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Promedio aptitudes (0-4)</h3><PlotlyChart data={[{ x: Object.keys(chaside.promediosAptitudes), y: Object.values(chaside.promediosAptitudes), type: "bar", marker: { color: "#FF3B30" } }]} layout={{ yaxis: { title: "Promedio" } }} /></div>
          </div>
          <div className="bg-white border rounded-2xl p-4"><h3 className="font-black text-sm">Plotly — Radar promedios intereses</h3><PlotlyChart data={[{ type: "scatterpolar", r: [...Object.values(chaside.promediosIntereses) as number[], (Object.values(chaside.promediosIntereses) as number[])[0]], theta: [...Object.keys(chaside.promediosIntereses), Object.keys(chaside.promediosIntereses)[0]], fill: "toself", marker: { color: "#0052FF" } }]} layout={{ polar: { radialaxis: { visible: true, range: [0, 10] } } }} style={{ width: "100%", height: "400px" }} /></div>
        </div>
      )}

      {tab === "personalidad" && pers && (
        <div className="mt-6 space-y-4">
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
        <div className="mt-6">
          <div className="bg-white border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0B1220] text-white text-xs uppercase"><tr><th className="px-3 py-2 text-left">Estudiante</th><th className="px-3 py-2">Padre</th><th className="px-3 py-2">Correos</th><th className="px-3 py-2">Cédulas</th><th className="px-3 py-2">C</th><th className="px-3 py-2">P</th><th className="px-3 py-2">K</th><th className="px-3 py-2">Faltan</th><th className="px-3 py-2">Acción</th></tr></thead>
                <tbody>
                  {students.map((s: any) => (
                    <tr key={s.id} className="border-t hover:bg-slate-50">
                      <td className="px-3 py-2 font-bold">{s.nombre_estudiante}</td>
                      <td className="px-3 py-2">{s.nombre_padre || "—"}</td>
                      <td className="px-3 py-2 text-xs">{[s.correo_estudiante, s.correo_padre].filter(Boolean).join(" / ") || "—"}</td>
                      <td className="px-3 py-2 text-xs">{[s.cedula_estudiante, s.cedula_representante].filter(Boolean).join(" / ") || "—"}</td>
                      <td className="px-3 py-2 text-center">{s.hasChaside ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">✓ {s.chaside?.top_interes}</span> : <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">—</span>}</td>
                      <td className="px-3 py-2 text-center">{s.hasPersonalidad ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">{s.personalidad?.tipo}</span> : <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">—</span>}</td>
                      <td className="px-3 py-2 text-center">{s.hasKuder ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{s.kuder?.top}</span> : <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">—</span>}</td>
                      <td className="px-3 py-2 text-center font-black text-red-600">{3 - s.completados}</td>
                      <td className="px-3 py-2"><button onClick={() => openDetail(s.id)} className="bg-[#0B1220] text-white px-3 py-1 rounded-full text-xs font-bold">Ver</button></td>
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
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-2xl p-5">
            <h3 className="font-black text-sm">Usuarios (CRUD)</h3>
            <div className="mt-3 space-y-2 max-h-64 overflow-auto">
              {users.map((u: any) => <div key={u.id} className="flex justify-between items-center border-b py-2 text-sm"><span>{u.email} <span className="text-xs text-slate-500">({u.first_name || "—"})</span></span><button onClick={async () => { if (!confirm("Eliminar " + u.email + "?")) return; await fetch(`/api/users/${u.id}`, { method: "DELETE", headers: { Authorization: authHeader } }); load(); }} className="text-red-600 text-xs font-bold">Eliminar</button></div>)}
              {users.length === 0 && <p className="text-xs text-slate-500">Sin usuarios</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <input placeholder="email" value={newUser.email} onChange={e => setNewUser(s => ({ ...s, email: e.target.value }))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="password" type="password" value={newUser.password} onChange={e => setNewUser(s => ({ ...s, password: e.target.value }))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button onClick={async () => { const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify(newUser) }); if (r.ok) { setNewUser({ email: "", password: "", first_name: "" }); load(); } else alert((await r.json()).error); }} className="bg-[#0B1220] text-white px-4 py-2 rounded-full text-sm font-bold">Crear</button>
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-5">
            <h3 className="font-black text-sm">Cambiar mi contraseña (bcrypt)</h3>
            <div className="mt-3 space-y-2">
              <input placeholder="Contraseña actual" type="password" value={pwOld} onChange={e => setPwOld(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Nueva contraseña (≥8)" type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <button onClick={async () => { const r = await fetch("/api/users/change-password", { method: "POST", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify({ old_password: pwOld, new_password: pwNew }) }); const j = await r.json(); if (r.ok) { alert("Contraseña cambiada"); setPwOld(""); setPwNew(""); } else alert(j.error); }} className="w-full bg-[#0B1220] text-white py-2 rounded-full text-sm font-bold">Cambiar contraseña</button>
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
              <button onClick={() => setSelected(null)} className="bg-slate-100 border rounded-full w-8 h-8">✕</button>
            </div>
            <div className="mt-4 grid md:grid-cols-3 gap-3">
              <div className={`border rounded-xl p-4 ${selected.chaside ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <h4 className="font-black text-sm">CHASIDE {selected.chaside ? "✓" : "— faltante"}</h4>
                {selected.chaside && <>
                  <div className="mt-2 grid grid-cols-7 gap-1 text-[10px] text-center">{Object.entries(selected.chaside.intereses).map(([k, v]: any) => <div key={k} className="bg-[#FFCC00] font-black p-1 rounded">{k}<br />{String(v)}</div>)}</div>
                  <p className="text-xs mt-2"><b>Top:</b> {selected.chaside.topInteres} · <b>2do:</b> {selected.chaside.segundoInteres || "—"} · <b>Apt:</b> {selected.chaside.topAptitud}</p>
                  <p className="text-xs text-slate-500">{new Date(selected.chaside.fecha_unix * 1000).toLocaleString()}</p>
                </>}
              </div>
              <div className={`border rounded-xl p-4 ${selected.personalidad ? "bg-purple-50 border-purple-200" : "bg-red-50 border-red-200"}`}>
                <h4 className="font-black text-sm">Personalidad {selected.personalidad ? `✓ ${selected.personalidad.tipo}` : "— faltante"}</h4>
                {selected.personalidad && <>
                  <p className="text-xs mt-2 font-bold">{selected.personalidad.tipo}</p>
                  <div className="mt-1 text-xs space-y-1">{Object.entries(selected.personalidad.dimensiones as any).map(([k, v]: any) => <div key={k} className="flex justify-between"><span>{k}</span><span>{v.letter} {v.percent}%</span></div>)}</div>
                  <p className="text-xs text-slate-500">{new Date(selected.personalidad.fecha_unix * 1000).toLocaleString()}</p>
                </>}
              </div>
              <div className={`border rounded-xl p-4 ${selected.kuder ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
                <h4 className="font-black text-sm">Kuder {selected.kuder ? `✓ ${selected.kuder.top}` : "— faltante"}</h4>
                {selected.kuder && <>
                  <p className="text-xs mt-2"><b>Top:</b> {selected.kuder.top} · <b>Ranking:</b> {selected.kuder.ranking.slice(0, 3).join(" > ")}</p>
                  <div className="mt-1 grid grid-cols-5 gap-1 text-[10px] text-center">{Object.entries(selected.kuder.scores).map(([k, v]: any) => <div key={k} className="bg-slate-100 border rounded p-1"><b>{k}</b><br />{String(v)}</div>)}</div>
                  <p className="text-xs text-slate-500">{new Date(selected.kuder.fecha_unix * 1000).toLocaleString()}</p>
                </>}
              </div>
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.chaside ? "bg-green-600 text-white" : "bg-red-100 text-red-700"}`}>CHASIDE {selected.chaside ? "rendido" : "pendiente"}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.personalidad ? "bg-purple-600 text-white" : "bg-red-100 text-red-700"}`}>Personalidad {selected.personalidad ? "rendido" : "pendiente"}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.kuder ? "bg-blue-600 text-white" : "bg-red-100 text-red-700"}`}>Kuder {selected.kuder ? "rendido" : "pendiente"}</span>
              <span className="ml-auto text-xs font-bold">Faltan {3 - [selected.chaside, selected.personalidad, selected.kuder].filter(Boolean).length} test(s)</span>
            </div>
            <button onClick={() => setSelected(null)} className="mt-6 w-full bg-[#0B1220] text-white font-bold py-2 rounded-full">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
