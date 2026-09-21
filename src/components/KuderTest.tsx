import { useEffect, useMemo, useState } from "react";
import { KUDER_DIADAS, KUDER_AREAS, KUDER_ORDER } from "../data/kuder";
import { calculateKuder, type KuderAnswers } from "../data/kuderScoring";

const STORAGE = "kuder_answers_v1";
const STORAGE_NAME = "kuder_student_name";
const STORAGE_DATE = "kuder_student_date";

function fmt(d: Date){
  const pad=(n:number)=>String(n).padStart(2,"0");
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function KuderTest(){
  const [answers, setAnswers]=useState<KuderAnswers>({});
  const [showResult, setShowResult]=useState(false);
  const [name,setName]=useState("");
  const [savedAt,setSavedAt]=useState("");
  const [error,setError]=useState<string|null>(null);
  const [saving,setSaving]=useState(false);
  const [extra,setExtra]=useState({ padre:"", correoEst:"", correoPadre:"", cedulaEst:"", cedulaRepr:"" });

  useEffect(()=>{
    try{
      const raw=localStorage.getItem(STORAGE);
      if(raw) setAnswers(JSON.parse(raw));
      const n=localStorage.getItem(STORAGE_NAME);
      if(n) setName(n);
      const d=localStorage.getItem(STORAGE_DATE);
      if(d) setSavedAt(d);
    }catch{}
  },[]);
  useEffect(()=>{ try{ localStorage.setItem(STORAGE, JSON.stringify(answers)); }catch{} },[answers]);

  const total = Object.keys(answers).length;
  const progress = Math.round(total/60*100);
  const missing = useMemo(()=>{ const m:number[]=[]; for(let i=1;i<=60;i++) if(!answers[i]) m.push(i); return m; },[answers]);
  const result = useMemo(()=> calculateKuder(answers),[answers]);
  const maxScore = Math.max(...KUDER_ORDER.map(k=>result.scores[k]),1);

  const handle=(id:number, ch:"a"|"b")=>{ setAnswers(p=>({...p,[id]:ch})); setError(null); };
  const submit=()=>{
    if(missing.length){ setError(`Falta elegir en la diada ${missing[0]}. Debes responder las 60 diadas.`); document.getElementById(`k-${missing[0]}`)?.scrollIntoView({behavior:"smooth",block:"center"}); return;}
    setShowResult(true); window.scrollTo({top:0,behavior:"smooth"});
  };
  const save=async()=>{
    if(!name.trim()){ setError("Ingresa el nombre del estudiante para guardar."); return;}
    const now=new Date(); const stamp=fmt(now); const fecha_unix=Math.floor(now.getTime()/1000);
    try{ localStorage.setItem(STORAGE_NAME,name.trim()); localStorage.setItem(STORAGE_DATE,stamp);}catch{}
    setSavedAt(stamp); setError(null); setSaving(true);
    try{
      const res=await fetch("/api/kuder/submit",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ nombre_estudiante:name.trim(), nombre_padre:extra.padre||null, correo_estudiante:extra.correoEst||null, correo_padre:extra.correoPadre||null, cedula_estudiante:extra.cedulaEst||null, cedula_representante:extra.cedulaRepr||null, fecha_unix, respuestas:answers })});
      const j=await res.json(); if(!res.ok) throw new Error(j.error||"Error"); setSavedAt(stamp+" · guardado DB ✓");
    }catch(e:any){ setError("Guardado local OK, pero DB falló: "+e.message); } finally{ setSaving(false); }
  };
  const reset=()=>{ setAnswers({}); setShowResult(false); setError(null); try{localStorage.removeItem(STORAGE);}catch{}; window.scrollTo({top:0,behavior:"smooth"}); };

  if(showResult){
    const topInfo = KUDER_AREAS[result.top];
    return (
      <div className="min-h-screen bg-[#F9F9FB]">
        <div className="bg-white border-b sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <a href="/" className="text-sm font-bold text-slate-600 hover:text-slate-900">← Menú</a>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-black" style={{color:topInfo.color}}>{topInfo.nombre} · Kuder</span>
            <div className="ml-auto flex gap-2">
              <button onClick={()=>window.print()} className="text-sm bg-[#0B1220] text-white px-4 py-1.5 rounded-full font-bold">Imprimir / PDF</button>
              <button onClick={reset} className="text-sm bg-white border px-4 py-1.5 rounded-full font-bold">Nuevo</button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-2xl p-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div><label className="text-xs font-black uppercase">Nombre estudiante *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: María López - 3ro BGU" className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#2563EB] outline-none" /></div>
              <div><label className="text-xs font-bold uppercase text-slate-600">Padre / representante</label><input value={extra.padre} onChange={e=>setExtra(s=>({...s,padre:e.target.value}))} placeholder="Opcional" className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none text-sm" /></div>
              <div><label className="text-xs font-bold uppercase text-slate-600">Correo estudiante</label><input value={extra.correoEst} onChange={e=>setExtra(s=>({...s,correoEst:e.target.value}))} placeholder="opcional@correo.com" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none text-sm" /></div>
              <div><label className="text-xs font-bold uppercase text-slate-600">Correo padre</label><input value={extra.correoPadre} onChange={e=>setExtra(s=>({...s,correoPadre:e.target.value}))} placeholder="opcional@correo.com" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none text-sm" /></div>
              <div><label className="text-xs font-bold uppercase text-slate-600">Cédula estudiante</label><input value={extra.cedulaEst} onChange={e=>setExtra(s=>({...s,cedulaEst:e.target.value.replace(/\D/g,"").slice(0,10)}))} placeholder="10 dígitos" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none text-sm" /></div>
              <div><label className="text-xs font-bold uppercase text-slate-600">Cédula representante</label><input value={extra.cedulaRepr} onChange={e=>setExtra(s=>({...s,cedulaRepr:e.target.value.replace(/\D/g,"").slice(0,10)}))} placeholder="10 dígitos" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none text-sm" /></div>
            </div>
            {savedAt && <p className="text-xs text-slate-600 mt-2">Guardado: <b>{name||"—"} · {savedAt}</b></p>}
            {error && <p className="text-xs text-red-600 font-bold mt-2">{error}</p>}
            <button onClick={save} disabled={saving} className="mt-3 bg-[#2563EB] text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-60">{saving?"Guardando...":"💾 Guardar en BD (nombre + fecha UNIX)"}</button>
          </div>

          <div className="mt-6 bg-white border border-slate-200 rounded-[20px] overflow-hidden">
            <div className="h-2" style={{background:topInfo.color}}/>
            <div className="p-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Kuder Forma C · 10 áreas · Escala V: {result.verificacion}</p>
              <h1 className="mt-2 text-3xl font-black" style={{fontFamily:"Poppins, system-ui, sans-serif", color:topInfo.color}}>{topInfo.icono} {topInfo.nombre}</h1>
              <p className="mt-2 text-slate-600 max-w-2xl mx-auto">{topInfo.descripcion}</p>
              <p className="mt-2 text-sm"><b>Carreras afines:</b> {topInfo.carreras}</p>
              <p className="mt-3 text-xs font-bold text-slate-500">Puntaje {result.scores[result.top]}/60 · {Math.round(result.scores[result.top]/60*100)}% de elecciones</p>
            </div>

            {/* Leyenda Kuder para nuevos */}
            <div className="mx-6 mt-2 bg-[#EFF6FF] border border-[#2563EB]/20 rounded-2xl p-4">
              <h3 className="font-black text-xs uppercase tracking-wider text-[#0B1220]">📖 Leyenda — Cómo leer Kuder</h3>
              <p className="text-sm text-slate-700 mt-1">Kuder es <b>ipsativo</b>: en cada diada eliges 1, esa área suma <b>+1</b>. Total <b>60 elecciones</b>. Tu puntaje por área = cuántas veces la preferiste. <b>Top = área con más elecciones</b>. No hay respuestas correctas.</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {KUDER_ORDER.map(k=>{ const info=KUDER_AREAS[k]; return <div key={k} className="bg-white border rounded-xl px-2 py-2 flex gap-2 items-center"><span className="text-base">{info.icono}</span><div><p className="font-black leading-none">{k}</p><p className="font-bold text-[11px] leading-none">{info.nombreCorto}</p><p className="text-[10px] text-slate-500 leading-none">{info.nombre}</p></div></div>; })}
              </div>
              <p className="text-xs text-slate-500 mt-2">Ej: si tu top es <b>PER 12</b>, elegiste lo persuasivo 12/60 veces (20%). Ranking ordena de mayor a menor.</p>
            </div>

            <div className="px-6 pb-6">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-500">Ranking 10 áreas</h3>
              <div className="mt-3 space-y-3">
                {result.ranking.map(k=>{
                  const info=KUDER_AREAS[k];
                  const pct = Math.round(result.scores[k]/60*100);
                  const w = Math.round(result.scores[k]/maxScore*100);
                  return (
                    <div key={k} className="flex items-center gap-3">
                      <span className="w-10 text-xs font-black">{k}</span>
                      <span className="w-8 text-center">{info.icono}</span>
                      <span className="w-28 text-sm font-bold hidden sm:block">{info.nombreCorto}</span>
                      <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full flex items-center justify-end pr-2 text-[10px] font-black text-white" style={{width:`${w}%`, background: info.color, minWidth: result.scores[k]>0 ? "32px":"0"}}>
                          {result.scores[k]>0 ? result.scores[k] : ""}
                        </div>
                      </div>
                      <span className="w-10 text-xs font-bold text-slate-600">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 overflow-x-auto border rounded-xl">
                <table className="w-full text-xs text-center border-collapse">
                  <thead><tr className="bg-[#0B1220] text-white">{KUDER_ORDER.map(k=><th key={k} className="px-2 py-2">{k}</th>)}</tr></thead>
                  <tbody><tr className="bg-[#FFCC00] font-black">{KUDER_ORDER.map(k=><td key={k} className="px-2 py-2 border">{result.scores[k]}</td>)}</tr></tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
            {KUDER_ORDER.map(k=>{
              const info=KUDER_AREAS[k];
              const isTop = k===result.top;
              return <div key={k} className={`p-4 rounded-2xl border-2 ${isTop?"border-[#0B1220] bg-white shadow":"border-slate-200 bg-white/60"}`}>
                <p className="text-lg">{info.icono}</p>
                <p className="font-black text-sm" style={{color:info.color}}>{k}</p>
                <p className="text-xs font-bold">{info.nombre}</p>
                <p className="text-xs text-slate-500">{result.scores[k]} pts</p>
              </div>;
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <a href="/" className="bg-white border-2 border-slate-200 font-bold px-6 py-2.5 rounded-full">← Menú</a>
            <button onClick={reset} className="bg-[#0B1220] text-white font-bold px-6 py-2.5 rounded-full">Repetir test</button>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">Kuder Forma C · 60 diadas · Baremo percentiles. No sustituye orientación profesional.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm font-bold text-slate-500 hover:text-slate-800">← Menú</a>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-slate-500"><span>{total}/60 diadas</span><span className="text-[#2563EB]">{progress}%</span></div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-1"><div className="h-full bg-[#2563EB] transition-all" style={{width:`${progress}%`}}/></div>
            </div>
            <button onClick={submit} className="hidden sm:inline-flex bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-5 py-2 rounded-full text-sm">Ver resultado</button>
          </div>
          {error && <p className="text-xs text-red-600 font-bold mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-black tracking-tight" style={{fontFamily:"Poppins, system-ui, sans-serif"}}>Test Kuder — 60 diadas</h1>
          <p className="text-sm text-slate-600 mt-1">Elige en cada par la actividad que <b>más te gusta</b>. 10 áreas: Aire Libre, Mecánico, Cálculo, Científico, Persuasivo, Artístico, Literario, Musical, Social, Oficina. Sin límite de tiempo.</p>
          <p className="text-xs text-slate-500 mt-2">Ejemplo: 1) Dibujar planos <i>vs</i> Cultivar semillas → marca la que prefieras.</p>
        </div>

        <div className="mt-4 space-y-3">
          {KUDER_DIADAS.map(d=>{
            const v=answers[d.id];
            const miss = error && missing[0]===d.id;
            return (
              <div key={d.id} id={`k-${d.id}`} className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch ${miss?"border-red-300 bg-red-50":"border-slate-200"}`}>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-7 h-7 rounded-full bg-[#0B1220] text-white text-xs font-black flex items-center justify-center">{d.id}</span>
                  <span className="text-xs font-bold text-slate-500">Diada {d.id}</span>
                </div>
                <div className="flex-1 grid sm:grid-cols-2 gap-2">
                  {(["a","b"] as const).map(ch=>{
                    const opt = ch==="a"? d.a : d.b;
                    const active = v===ch;
                    const info = KUDER_AREAS[opt.area];
                    return (
                      <button key={ch} onClick={()=>handle(d.id,ch)} className={`text-left p-3 rounded-xl border-2 flex gap-3 items-center transition ${active?"border-[#0B1220] bg-[#0B1220] text-white shadow":"bg-white border-slate-300 hover:border-slate-400"}`}>
                        <span className="text-lg">{info.icono}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-bold leading-tight ${active?"text-white":"text-[#0B1220]"}`}>{opt.texto}</p>
                          <p className={`text-[10px] font-black uppercase tracking-wider ${active?"text-white/70":"text-slate-500"}`}>{opt.area} · {info.nombre}</p>
                        </div>
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${active?"bg-white border-white":"border-slate-300"}`}>{active&&<span className="w-2 h-2 bg-[#0B1220] rounded-full"/>}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={submit} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black px-8 py-4 rounded-full shadow text-lg">Ver mi resultado Kuder →</button>
          <button onClick={reset} className="bg-white border-2 border-slate-200 font-bold px-6 py-3 rounded-full">Reiniciar</button>
        </div>
      </div>
    </div>
  );
}
