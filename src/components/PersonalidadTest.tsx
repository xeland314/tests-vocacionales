import { useEffect, useMemo, useState } from "react";
import { PERSONALITY_QUESTIONS, TYPES, ROLE_COLOR, type AnswerValue } from "../data/personalidad";
import { calculatePersonality, type AnswersPers } from "../data/personalidadScoring";

const STORAGE = "pers_answers_v1";
const STORAGE_NAME = "pers_student_name";
const STORAGE_DATE = "pers_student_date";

function fmt(d: Date) {
  const pad = (n:number)=> String(n).padStart(2,"0");
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const SCALE = [
  { v: -3 as AnswerValue, label: "Muy en desacuerdo", color: "#7C3AED", size: 48 },
  { v: -2 as AnswerValue, label: "En desacuerdo", color: "#7C3AED", size: 40 },
  { v: -1 as AnswerValue, label: "Algo en desacuerdo", color: "#7C3AED", size: 32 },
  { v:  0 as AnswerValue, label: "Neutral", color: "#9CA3AF", size: 28 },
  { v:  1 as AnswerValue, label: "Algo de acuerdo", color: "#10B981", size: 32 },
  { v:  2 as AnswerValue, label: "De acuerdo", color: "#10B981", size: 40 },
  { v:  3 as AnswerValue, label: "Muy de acuerdo", color: "#10B981", size: 48 },
];

export default function PersonalidadTest() {
  const [answers, setAnswers] = useState<AnswersPers>({});
  const [showResult, setShowResult] = useState(false);
  const [name, setName] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [error, setError] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [extra, setExtra] = useState({ padre:"", correoEst:"", correoPadre:"", cedulaEst:"", cedulaRepr:"" });

  useEffect(()=>{
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setAnswers(JSON.parse(raw));
      const n = localStorage.getItem(STORAGE_NAME);
      if (n) setName(n);
      const d = localStorage.getItem(STORAGE_DATE);
      if (d) setSavedAt(d);
    } catch {}
  },[]);
  useEffect(()=>{ try{ localStorage.setItem(STORAGE, JSON.stringify(answers)); }catch{} },[answers]);

  const total = Object.keys(answers).length;
  const progress = Math.round(total/60*100);
  const missing = useMemo(()=>{ const m:number[]=[]; for(let i=1;i<=60;i++) if(answers[i]===undefined) m.push(i); return m; },[answers]);
  const result = useMemo(()=> calculatePersonality(answers),[answers]);

  const handle = (id:number, v:AnswerValue)=> { setAnswers(p=>({...p,[id]:v})); setError(null); };
  const submit = ()=>{
    if(missing.length){ setError(`Falta responder la pregunta ${missing[0]}. Responde las 60 para ver el resultado.`); document.getElementById(`q-${missing[0]}`)?.scrollIntoView({behavior:"smooth",block:"center"}); return;}
    setShowResult(true); window.scrollTo({top:0,behavior:"smooth"});
  };
  const save = async ()=>{
    if(!name.trim()){ setError("Ingresa el nombre del estudiante para guardar."); return;}
    const now=new Date(); const stamp=fmt(now); const fecha_unix=Math.floor(now.getTime()/1000);
    try{ localStorage.setItem(STORAGE_NAME,name.trim()); localStorage.setItem(STORAGE_DATE,stamp);}catch{}
    setSavedAt(stamp); setError(null); setSaving(true);
    try{
      const res=await fetch("/api/personalidad/submit",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ nombre_estudiante:name.trim(), nombre_padre:extra.padre||null, correo_estudiante:extra.correoEst||null, correo_padre:extra.correoPadre||null, cedula_estudiante:extra.cedulaEst||null, cedula_representante:extra.cedulaRepr||null, fecha_unix, respuestas:answers })});
      const j=await res.json(); if(!res.ok) throw new Error(j.error||"Error"); setSavedAt(stamp+" · guardado DB ✓");
    }catch(e:any){ setError("Guardado local OK, pero DB falló: "+e.message); } finally{ setSaving(false); }
  };
  const reset = ()=>{ setAnswers({}); setShowResult(false); setError(null); try{localStorage.removeItem(STORAGE);}catch{}; window.scrollTo({top:0,behavior:"smooth"}); };

  if(showResult){
    const info = TYPES[result.type];
    return (
      <div className="min-h-screen bg-[#F9F9FB]">
        <div className="bg-white border-b sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <a href="/" className="text-sm font-bold text-slate-600 hover:text-slate-900">← Menú</a>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-extrabold" style={{color:info.color}}>{result.type} · {info.name}</span>
            <div className="ml-auto flex gap-2">
              <button onClick={()=>window.print()} className="text-sm bg-[#0B1220] text-white px-4 py-1.5 rounded-full font-bold">Imprimir / PDF</button>
              <button onClick={reset} className="text-sm bg-white border px-4 py-1.5 rounded-full font-bold">Nuevo</button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Guardar */}
          <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-2xl p-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div><label className="text-xs font-black uppercase">Nombre estudiante *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Carlos Ruiz - 3ro BGU" className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#7C3AED] outline-none" /></div>
              <div><label className="text-xs font-bold uppercase text-slate-600">Padre / representante</label><input value={extra.padre} onChange={e=>setExtra(s=>({...s,padre:e.target.value}))} placeholder="Opcional" className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none text-sm" /></div>
              <div><label className="text-xs font-bold uppercase text-slate-600">Correo estudiante</label><input value={extra.correoEst} onChange={e=>setExtra(s=>({...s,correoEst:e.target.value}))} placeholder="opcional@correo.com" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none text-sm" /></div>
              <div><label className="text-xs font-bold uppercase text-slate-600">Correo padre</label><input value={extra.correoPadre} onChange={e=>setExtra(s=>({...s,correoPadre:e.target.value}))} placeholder="opcional@correo.com" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none text-sm" /></div>
              <div><label className="text-xs font-bold uppercase text-slate-600">Cédula estudiante</label><input value={extra.cedulaEst} onChange={e=>setExtra(s=>({...s,cedulaEst:e.target.value.replace(/\D/g,"").slice(0,10)}))} placeholder="10 dígitos" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none text-sm" /></div>
              <div><label className="text-xs font-bold uppercase text-slate-600">Cédula representante</label><input value={extra.cedulaRepr} onChange={e=>setExtra(s=>({...s,cedulaRepr:e.target.value.replace(/\D/g,"").slice(0,10)}))} placeholder="10 dígitos" className="mt-1 w-full px-4 py-2 rounded-xl border-2 border-slate-200 outline-none text-sm" /></div>
            </div>
            {savedAt && <p className="text-xs text-slate-600 mt-2">Guardado: <b>{name||"—"} · {savedAt}</b></p>}
            {error && <p className="text-xs text-red-600 font-bold mt-2">{error}</p>}
            <button onClick={save} disabled={saving} className="mt-3 bg-[#7C3AED] text-white font-bold px-6 py-2.5 rounded-full disabled:opacity-60">{saving?"Guardando...":"💾 Guardar en BD (nombre + fecha UNIX)"}</button>
          </div>

          {/* Hero tipo - estilo 16personalities */}
          <div className="mt-6 bg-white border border-slate-200 rounded-[20px] overflow-hidden">
            <div className="h-2" style={{background: info.color}} />
            <div className="p-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{info.role}</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight" style={{fontFamily:"Poppins, system-ui, sans-serif", color: info.color}}>{result.type} — {info.name}</h1>
              <p className="mt-2 text-slate-600 max-w-2xl mx-auto">{info.tagline} — {info.description}</p>
              <div className="mt-4 flex justify-center gap-2">
                {info.strengths.map(s=> <span key={s} className="text-xs font-bold px-3 py-1 rounded-full border bg-slate-50">{s}</span>)}
              </div>
            </div>
            {/* Barras 4 dimensiones - estilo 16personalities */}
            <div className="px-6 pb-8 grid gap-5">
              {(["EI","SN","TF","JP"] as const).map(d=>{
                const sc = result.dimensions[d];
                const left = d==="EI"?"Introvertido (I)": d==="SN"?"Intuitivo (N)": d==="TF"?"Sentimiento (F)":"Prospección (P)";
                const right = d==="EI"?"Extravertido (E)": d==="SN"?"Observador (S)": d==="TF"?"Pensamiento (T)":"Juzgador (J)";
                const isLeft = sc.percent<50;
                const pctLeft = isLeft? 100-sc.percent : sc.percent;
                const pctRight = isLeft? sc.percent : 100-sc.percent;
                return (
                  <div key={d} className="bg-[#F9F9FB] rounded-2xl p-4 border">
                    <div className="flex justify-between text-xs font-black uppercase tracking-wider">
                      <span className={sc.letter=== (d==="EI"?"I": d==="SN"?"N": d==="TF"?"F":"P") ? "text-[#0B1220]" : "text-slate-400"}>{left}</span>
                      <span className={sc.letter=== (d==="EI"?"E": d==="SN"?"S": d==="TF"?"T":"J") ? "text-[#0B1220]" : "text-slate-400"}>{right}</span>
                    </div>
                    <div className="mt-2 h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="h-full" style={{width:`${pctLeft}%`, background: isLeft? info.color : "#E5E7EB"}} />
                      <div className="h-full" style={{width:`${pctRight}%`, background: !isLeft? info.color : "#E5E7EB"}} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs font-bold">
                      <span>{isLeft? 100-sc.percent : sc.percent}%</span>
                      <span className="text-slate-500">{sc.letter} · {sc.raw>0?`+${sc.raw}`:sc.raw}/45</span>
                      <span>{isLeft? sc.percent : 100-sc.percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leyenda MBTI para nuevos */}
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-black text-xs uppercase tracking-wider text-[#0B1220]">📖 Cómo leer tu resultado — Leyenda MBTI</h3>
            <p className="text-sm text-slate-600 mt-2">Tu tipo son <b>4 letras</b> (ej: <b>INFP</b>). Cada letra es una preferencia con <b>0–100%</b> (50% = neutral). La barra muestra hacia dónde te inclinas.</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-[#F9F9FB] border rounded-xl p-3"><p className="font-black">Mente: <span className="text-[#7C3AED]">E</span> vs <span className="text-slate-600">I</span></p><p className="text-xs text-slate-600 mt-1"><b>E Extravertido</b>: te energiza la gente, hablas mucho. <b>I Introvertido</b>: te recarga la soledad, escuchas más.</p></div>
              <div className="bg-[#F9F9FB] border rounded-xl p-3"><p className="font-black">Energía: <span className="text-[#7C3AED]">S</span> vs <span className="text-slate-600">N</span></p><p className="text-xs text-slate-600 mt-1"><b>S Observador/Sensorial</b>: concreto, detalles, presente. <b>N Intuitivo</b>: abstracto, posibilidades, futuro.</p></div>
              <div className="bg-[#F9F9FB] border rounded-xl p-3"><p className="font-black">Naturaleza: <span className="text-[#7C3AED]">T</span> vs <span className="text-slate-600">F</span></p><p className="text-xs text-slate-600 mt-1"><b>T Pensamiento</b>: lógica, verdad &gt; armonía. <b>F Sentimiento</b>: empatía, armonía &gt; lógica.</p></div>
              <div className="bg-[#F9F9FB] border rounded-xl p-3"><p className="font-black">Táctica: <span className="text-[#7C3AED]">J</span> vs <span className="text-slate-600">P</span></p><p className="text-xs text-slate-600 mt-1"><b>J Juzgador</b>: orden, planes, plazos. <b>P Prospección/Percepción</b>: flexible, improvisas, opciones abiertas.</p></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="px-3 py-1 rounded-full text-white" style={{background:"#7C3AED"}}>Analistas (NT)</span>
              <span className="px-3 py-1 rounded-full text-white" style={{background:"#10B981"}}>Diplomáticos (NF)</span>
              <span className="px-3 py-1 rounded-full text-white" style={{background:"#0EA5E9"}}>Centinelas (SJ)</span>
              <span className="px-3 py-1 rounded-full text-white" style={{background:"#F59E0B"}}>Exploradores (SP)</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">% = (raw+45)/90*100. Ej: 70% E = 70% hacia Extravertido, 30% hacia Introvertido. &lt;60% = preferencia ligera, &gt;75% = marcada.</p>
          </div>

          {/* 16 tipos grid */}
          <div className="mt-8">
            <h3 className="font-black uppercase tracking-wider text-xs text-slate-500">Los 16 tipos</h3>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.values(TYPES).map(t=>(
                <div key={t.code} className={`p-4 rounded-2xl border-2 ${t.code===result.type?"border-[#0B1220] bg-white shadow":"border-slate-200 bg-white/60"}`}>
                  <p className="text-xs font-black" style={{color:t.color}}>{t.role}</p>
                  <p className="font-black">{t.code}</p>
                  <p className="text-xs text-slate-600">{t.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <a href="/" className="bg-white border-2 border-slate-200 font-bold px-6 py-2.5 rounded-full">← Menú</a>
            <button onClick={reset} className="bg-[#0B1220] text-white font-bold px-6 py-2.5 rounded-full">Repetir test</button>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">Test inspirado en NERIS Type Explorer® / 16Personalities · No afiliado. Solo con fines educativos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Header progreso estilo 16p */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm font-bold text-slate-500 hover:text-slate-800">← Menú</a>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>{total}/60</span><span className="text-[#7C3AED]">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#7C3AED] transition-all" style={{width:`${progress}%`}} />
              </div>
            </div>
            <button onClick={submit} className="hidden sm:inline-flex bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold px-5 py-2 rounded-full text-sm">Ver resultado</button>
          </div>
          {error && <p className="text-xs text-red-600 font-bold mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-black tracking-tight" style={{fontFamily:"Poppins, system-ui, sans-serif"}}>Test de Personalidad — 60 preguntas</h1>
          <p className="text-sm text-slate-600 mt-1">Responde con sinceridad. Escala de 7 puntos · Estilo 16Personalities · ~10 min</p>
          <div className="mt-3 flex justify-center gap-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#7C3AED] inline-block"></span> Desacuerdo</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span> Neutral</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#10B981] inline-block"></span> De acuerdo</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {PERSONALITY_QUESTIONS.map(q=>{
            const v = answers[q.id];
            const miss = error && missing[0]===q.id;
            return (
              <div key={q.id} id={`q-${q.id}`} className={`bg-white border rounded-2xl p-5 ${miss?"border-red-300 bg-red-50":"border-slate-200"}`}>
                <div className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-[#0B1220] text-white text-xs font-black flex items-center justify-center">{q.id}</span>
                  <p className="font-semibold text-[#0B1220] text-[15px] leading-snug flex-1">{q.text}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-1">
                  <span className="text-[11px] font-black uppercase text-[#7C3AED] hidden sm:block">Desacuerdo</span>
                  <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center">
                    {SCALE.map(s=>{
                      const active = v===s.v;
                      return (
                        <button
                          key={s.v}
                          onClick={()=>handle(q.id, s.v)}
                          aria-label={`${s.label} ${s.v}`}
                          className={`rounded-full border-2 flex items-center justify-center transition ${active ? "border-[#0B1220] shadow" : "border-slate-300 hover:border-slate-400 bg-white"}`}
                          style={{ width: s.size, height: s.size, background: active? s.color : "white", borderColor: active? "#0B1220" : undefined }}
                          title={s.label}
                        >
                          {active && <span className="w-2 h-2 bg-white rounded-full"></span>}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-black uppercase text-[#10B981] hidden sm:block">De acuerdo</span>
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400 sm:hidden">
                  <span>Desacuerdo</span><span>De acuerdo</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={submit} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black px-8 py-4 rounded-full shadow text-lg">Ver mi tipo →</button>
          <button onClick={reset} className="bg-white border-2 border-slate-200 font-bold px-6 py-3 rounded-full">Reiniciar</button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-3">Se guarda localmente. Podrás guardar nombre y fecha al ver el resultado.</p>
      </div>
    </div>
  );
}
