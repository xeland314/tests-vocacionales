import React, { useState, type FormEvent } from "react";

export default function AdminLogin({ onLogin }: { onLogin?: () => void }){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  const submit=async(e: FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    setError(null); setLoading(true);
    try{
      const r=await fetch("/api/auth/login",{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ email, password })});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||"Credenciales inválidas");
      localStorage.setItem("knox_token", j.token);
      localStorage.setItem("knox_expiry", j.expiry);
      localStorage.setItem("knox_user", JSON.stringify(j.user));
      if(onLogin) onLogin();
      else window.location.href="/admin";
    }catch(err:any){ setError(err.message); }
    finally{ setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white border rounded-2xl p-6">
      <h1 className="text-xl font-black" style={{fontFamily:"Poppins"}}>Admin Login</h1>
      <p className="text-xs text-slate-500 mt-1">Usa email y contraseña (bcrypt). Token Knox TTL 10h.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-bold uppercase">Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-300 focus:border-[#001d62] outline-none" placeholder="admin@teamggm.com" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase">Contraseña</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-300 focus:border-[#001d62] outline-none" />
        </div>
        {error && <p className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <button disabled={loading} className="w-full bg-[#001d62] text-white font-bold py-2.5 rounded-full disabled:opacity-60">{loading?"Ingresando...":"Ingresar"}</button>
      </form>
      <p className="text-xs text-slate-400 mt-3">Primer usuario: crea vía <code>POST /api/users</code> sin token (bootstrap).</p>
    </div>
  );
}
