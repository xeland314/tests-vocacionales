import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Estudiante {
  id: string;
  nombre_estudiante: string;
  nombre_padre: string | null;
  correo_estudiante: string | null;
  correo_padre: string | null;
  cedula_estudiante: string | null;
  cedula_representante: string | null;
  fecha_unix: number;
  version: number;
}

export default function AdminChaside(){
  const [students, setStudents]=useState<Estudiante[]>([]);
  const [stats, setStats]=useState<any>(null);
  const [selected, setSelected]=useState<any>(null);
  const [loading, setLoading]=useState(true);
  const [error, setError]=useState<string|null>(null);
  const [needsLogin, setNeedsLogin]=useState(false);
  const [users, setUsers]=useState<any[]>([]);
  const [newUser, setNewUser]=useState({email:"", password:"", first_name:""});
  const [pwOld, setPwOld]=useState(""); const [pwNew, setPwNew]=useState("");

  const token = typeof window!=="undefined" ? localStorage.getItem("knox_token") : null;
  const authHeader = token ? `Token ${token}` : "";

  useEffect(()=>{
    if(!token){ setNeedsLogin(true); setLoading(false); return; }
  },[token]);

  const load=async()=>{
    setLoading(true);
    setError(null);
    try{
      const hdr:any = authHeader ? { Authorization: authHeader } : {};
      const [sRes, stRes, uRes]= await Promise.all([
        fetch("/api/chaside/estudiantes",{ headers: hdr }),
        fetch("/api/chaside/stats",{ headers: hdr }),
        fetch("/api/users",{ headers: hdr })
      ]);
      if(sRes.status===401 || stRes.status===401){ setNeedsLogin(true); throw new Error("No autenticado — inicia sesión"); }
      if(!sRes.ok) throw new Error("No se pudo cargar estudiantes");
      const s = await sRes.json();
      const st = stRes.ok ? await stRes.json() : null;
      setStudents(s);
      setStats(st);
      if(uRes.ok) setUsers(await uRes.json());
    }catch(e:any){ setError(e.message); }
    finally{ setLoading(false); }
  };
  useEffect(()=>{ if(token) load(); },[token]);

  const openDetail=async(id:string)=>{
    const r=await fetch(`/api/chaside/estudiante/${id}`,{ headers: { Authorization: authHeader }});
    const j=await r.json();
    setSelected(j);
  };

  const logout=async()=>{
    await fetch("/api/auth/logout",{ method:"POST", headers:{ Authorization: authHeader }});
    localStorage.removeItem("knox_token"); window.location.href="/admin/login";
  };
  const logoutAll=async()=>{
    await fetch("/api/auth/logoutall",{ method:"POST", headers:{ Authorization: authHeader }});
    localStorage.removeItem("knox_token"); window.location.href="/admin/login";
  };

  if(needsLogin) return <div className="max-w-md mx-auto mt-12 bg-white border rounded-2xl p-6 text-center"><p className="font-bold">Sesión requerida</p><p className="text-sm text-slate-500 mt-1">Debes iniciar sesión con email/contraseña (Knox token).</p><a href="/admin/login" className="mt-4 inline-block bg-[#001d62] text-white px-6 py-2 rounded-full font-bold">Ir a Login</a></div>;
  if(loading) return <div className="p-8 text-center text-slate-600">Cargando base libsql...</div>;
  if(error) return <div className="p-8 text-center text-red-600">Error: {error} <button onClick={load} className="ml-2 underline">Reintentar</button> <a href="/admin/login" className="ml-2 underline">Login</a></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-black" style={{fontFamily:"Poppins"}}>Panel Admin — CHASIDE</h1>
        <span className="bg-[#001d62] text-white text-xs font-bold px-3 py-1 rounded-full">{students.length} estudiantes</span>
        <div className="ml-auto flex gap-2 flex-wrap">
          <a href="/chaside" className="bg-white border-2 border-slate-300 font-bold px-4 py-2 rounded-full text-sm">← Test</a>
          <button onClick={load} className="bg-[#1f3875] text-white font-bold px-4 py-2 rounded-full text-sm">↻ Actualizar</button>
          <button onClick={async()=>{ await fetch("/api/chaside/init",{ headers:{ Authorization: authHeader }}); load(); }} className="bg-slate-100 border font-bold px-4 py-2 rounded-full text-sm">Init DB</button>
          <button onClick={logout} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Logout</button>
          <button onClick={logoutAll} className="bg-red-50 border border-red-200 text-red-700 font-bold px-4 py-2 rounded-full text-sm">Logout All</button>
        </div>
      </div>

      {/* CRUD Usuarios + cambio contraseña */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-2xl p-5">
          <h3 className="font-black text-sm">Usuarios (CRUD)</h3>
          <div className="mt-3 space-y-2 max-h-48 overflow-auto">
            {users.map((u:any)=><div key={u.id} className="flex justify-between items-center border-b py-2 text-sm"><span>{u.email} <span className="text-xs text-slate-500">({u.first_name||"—"})</span></span><button onClick={async()=>{ if(!confirm("Eliminar "+u.email+"?"))return; await fetch(`/api/users/${u.id}`,{ method:"DELETE", headers:{ Authorization: authHeader }}); load(); }} className="text-red-600 text-xs font-bold">Eliminar</button></div>)}
            {users.length===0 && <p className="text-xs text-slate-500">Sin usuarios</p>}
          </div>
          <div className="mt-4 flex gap-2">
            <input placeholder="email" value={newUser.email} onChange={e=>setNewUser(s=>({...s,email:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="password" type="password" value={newUser.password} onChange={e=>setNewUser(s=>({...s,password:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            <button onClick={async()=>{
              const r=await fetch("/api/users",{ method:"POST", headers:{ "Content-Type":"application/json", Authorization: authHeader }, body: JSON.stringify(newUser)});
              if(r.ok) { setNewUser({email:"",password:"",first_name:""}); load(); } else alert((await r.json()).error);
            }} className="bg-[#001d62] text-white px-4 py-2 rounded-full text-sm font-bold">Crear</button>
          </div>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <h3 className="font-black text-sm">Cambiar mi contraseña (bcrypt)</h3>
          <div className="mt-3 space-y-2">
            <input placeholder="Contraseña actual" type="password" value={pwOld} onChange={e=>setPwOld(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Nueva contraseña (≥8)" type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <button onClick={async()=>{
              const r=await fetch("/api/users/change-password",{ method:"POST", headers:{ "Content-Type":"application/json", Authorization: authHeader }, body: JSON.stringify({ old_password: pwOld, new_password: pwNew })});
              const j=await r.json(); if(r.ok) { alert("Contraseña cambiada"); setPwOld(""); setPwNew(""); } else alert(j.error);
            }} className="w-full bg-[#001d62] text-white py-2 rounded-full text-sm font-bold">Cambiar contraseña</button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Total aplicaciones</p>
            <p className="text-3xl font-black mt-1">{stats.totalEstudiantes}</p>
            <p className="text-xs text-slate-500 mt-1">12k estimados en 10 años → {Math.round(stats.totalEstudiantes/12000*100)}% del plan</p>
          </div>
          <div className="bg-white border rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Top intereses</p>
            <div className="mt-2 space-y-1 text-sm">
              {Object.entries(stats.topIntereses).sort((a:any,b:any)=>b[1]-a[1]).slice(0,3).map(([k,v]:any)=> <div key={k} className="flex justify-between"><span className="font-bold">{k}</span><span>{String(v)} est.</span></div>)}
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Promedio puntajes intereses (0-10)</p>
            <div className="mt-2 grid grid-cols-7 gap-1 text-xs text-center">
              {Object.entries(stats.promediosIntereses).map(([k,v]:any)=> <div key={k} className="bg-slate-50 border rounded-lg p-2"><p className="font-black">{k}</p><p>{v}</p></div>)}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#001d62] text-white text-xs uppercase">
              <tr><th className="px-3 py-2 text-left">Estudiante</th><th className="px-3 py-2">Padre</th><th className="px-3 py-2">Correos</th><th className="px-3 py-2">Cédulas</th><th className="px-3 py-2">Fecha UNIX</th><th className="px-3 py-2">Acción</th></tr>
            </thead>
            <tbody>
              {students.map(s=>(
                <tr key={s.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 font-bold">{s.nombre_estudiante}</td>
                  <td className="px-3 py-2">{s.nombre_padre||"—"}</td>
                  <td className="px-3 py-2 text-xs">{[s.correo_estudiante, s.correo_padre].filter(Boolean).join(" / ")||"—"}</td>
                  <td className="px-3 py-2 text-xs">{[s.cedula_estudiante, s.cedula_representante].filter(Boolean).join(" / ")||"—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.fecha_unix} <span className="text-slate-500">({new Date(s.fecha_unix*1000).toLocaleString()})</span></td>
                  <td className="px-3 py-2"><button onClick={()=>openDetail(s.id)} className="bg-[#001d62] text-white px-3 py-1 rounded-full text-xs font-bold">Ver</button></td>
                </tr>
              ))}
              {students.length===0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Sin datos aún. Rinde un test en /chaside y guarda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={()=>setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-auto p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg">{selected.estudiante.nombre_estudiante}</h3>
                <p className="text-xs text-slate-500">ID {selected.estudiante.id} · UNIX {selected.estudiante.fecha_unix} · {new Date(selected.estudiante.fecha_unix*1000).toLocaleString()}</p>
                <p className="text-xs mt-1">Padre: {selected.estudiante.nombre_padre||"—"} | Correos: {selected.estudiante.correo_estudiante||"—"} / {selected.estudiante.correo_padre||"—"} | Cédulas: {selected.estudiante.cedula_estudiante||"—"} / {selected.estudiante.cedula_representante||"—"}</p>
              </div>
              <button onClick={()=>setSelected(null)} className="bg-slate-100 border rounded-full w-8 h-8 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs">
              {Object.entries(selected.scores.intereses).map(([k,v]:any)=> <div key={k} className="bg-[#d8215d] font-black p-2 rounded-lg">{k}<br/>{String(v)}/10</div>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2 text-center text-xs">
              {Object.entries(selected.scores.aptitudes).map(([k,v]:any)=> <div key={k} className="bg-slate-100 border p-2 rounded-lg">{k}<br/>{String(v)}/4</div>)}
            </div>
            <p className="text-sm mt-3"><b>Top interés:</b> {selected.scores.topInteres} · <b>Segundo:</b> {selected.scores.segundoInteres||"—"} · <b>Top aptitud:</b> {selected.scores.topAptitud}</p>
            <div className="mt-4">
              <h4 className="font-bold text-sm">Respuestas (98)</h4>
              <div className="mt-2 grid grid-cols-7 sm:grid-cols-14 gap-1 text-[10px]">
                {(selected.respuestas as any[]).map((r:any)=> <span key={r.pregunta_id} className={`px-1 py-1 rounded text-center font-bold border ${r.respuesta? "bg-[#001d62] text-white":"bg-white"}`}>{r.pregunta_id}:{r.respuesta?"SÍ":"NO"}</span>)}
              </div>
            </div>
            <button onClick={()=>setSelected(null)} className="mt-6 w-full bg-[#001d62] text-white font-bold py-2 rounded-full">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
