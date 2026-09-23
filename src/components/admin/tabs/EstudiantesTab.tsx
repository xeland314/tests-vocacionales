import React from 'react';
import { Check, Minus } from "lucide-react";

export function EstudiantesTab({ students, openDetail }: { students: any[]; openDetail: (id: string) => void }) {
  return (
    <div className="mt-6 space-y-3">
      <div className="bg-[#fcfcfc] border border-[#001d62]/10 rounded-2xl p-3 text-xs flex flex-wrap gap-3 items-center">
        <span className="inline-flex items-center gap-1"><b>C</b> = CHASIDE (<Check size={12} className="inline text-green-600" /> + letra)</span>
        <span className="inline-flex items-center gap-1"><b>P</b> = MBTI (<Check size={12} className="inline text-green-600" /> + tipo)</span>
        <span className="inline-flex items-center gap-1"><b>K</b> = Kuder (<Check size={12} className="inline text-green-600" /> + área)</span>
        <span><b>Faltan</b> = 3 - completados</span>
        <span className="text-slate-500">Ver = detalle + habilitar retake (solo admin)</span>
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
              {students.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Sin datos. Rinde tests con ?moodleUserId=</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
