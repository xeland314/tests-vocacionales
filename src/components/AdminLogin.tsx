import React, { useEffect, useRef, useState } from "react";

export default function AdminLogin({ onLogin }: { onLogin?: () => void }){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [showPassword,setShowPassword]=useState(false);
  const timerRef=useRef<ReturnType<typeof setTimeout> | null>(null);

  // El ojo muestra la contraseña 10 segundos y luego la vuelve a ocultar
  const togglePassword=()=>{
    setShowPassword(true);
    if(timerRef.current) clearTimeout(timerRef.current);
    timerRef.current=setTimeout(()=>setShowPassword(false),10_000);
  };
  useEffect(()=>()=>{ if(timerRef.current) clearTimeout(timerRef.current); },[]);

  const submit=async(e: React.FormEvent<HTMLFormElement>)=>{
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
      <p className="text-xs text-slate-500 mt-1">Ingresa con tu email y contraseña.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-bold uppercase">Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-300 focus:border-[#1D60A9] outline-none" placeholder="admin@teamggm.com" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase">Contraseña</label>
          <div className="relative mt-1">
            <input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required className="w-full px-4 py-2 pr-12 rounded-xl border-2 border-slate-300 focus:border-[#1D60A9] outline-none" />
            <button
              type="button"
              onClick={togglePassword}
              title={showPassword?"Ocultar":"Mostrar 10 segundos"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#1D60A9] p-1"
            >
              {showPassword?(
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              ):(
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          {showPassword && <p className="text-[11px] text-amber-600 mt-1">La contraseña se ocultará en 10 segundos…</p>}
        </div>
        {error && <p className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <button disabled={loading} className="w-full bg-[#1D60A9] text-white font-bold py-2.5 rounded-full disabled:opacity-60">{loading?"Ingresando...":"Ingresar"}</button>
      </form>
      <p className="text-xs text-slate-400 mt-3">¿Sin acceso? Pide credenciales al administrador del sistema.</p>
    </div>
  );
}
