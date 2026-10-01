import React from 'react';
import { Rocket } from "lucide-react";
import { QUESTIONS } from "../../data/chaside";
import type { Answers } from "../../data/scoring";

type Props = {
  answers: Answers;
  error: string | null;
  missing: number[];
  onAnswer: (id: number, val: boolean) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function ChasideQuestions({ answers, error, missing, onAnswer, onSubmit, onReset }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-[#E1E3DA] rounded-2xl border border-[#164F8D]/10 overflow-hidden">
        <div className="divide-y divide-[#164F8D]/10">
          {QUESTIONS.map((q) => {
            const val = answers[q.id];
            const isMissing = error && missing[0] === q.id;
            return (
              <div key={q.id} id={`q-${q.id}`} className={`flex flex-col md:flex-row md:items-center gap-3 px-4 py-4 transition ${isMissing ? "bg-[#E8356A]/10 border-l-4 border-l-[#E8356A]" : val !== undefined ? "bg-[#ffffff]" : "bg-[#E1E3DA] hover:bg-[#ffffff]"}`}>
                <div className="flex gap-3 flex-1 min-w-0">
                  <span className="shrink-0 bg-[#1D60A9] text-white text-xs font-extrabold px-2.5 py-1 rounded-full h-fit mt-0.5">{String(q.id).padStart(2, "0")}</span>
                  <p className="text-[15px] leading-snug text-[#1D60A9] flex-1 font-medium">{q.text}</p>
                </div>
                <div className="flex gap-2 shrink-0 ml-10 md:ml-0">
                  <label className={`flex items-center gap-2 px-5 py-2 rounded-full border-2 cursor-pointer font-bold text-sm transition ${val === true ? "bg-[#E8356A] text-white border-[#E8356A] shadow-[0_4px_15px_rgba(232,53,106,0.4)]" : "bg-[#ffffff] border-[#1D60A9]/30 hover:border-[#E8356A] hover:text-[#E8356A] text-[#164F8D]"}`}>
                    <input type="radio" name={`q-${q.id}`} className="sr-only" checked={val === true} onChange={() => onAnswer(q.id, true)} />
                    SÍ
                  </label>
                  <label className={`flex items-center gap-2 px-5 py-2 rounded-full border-2 cursor-pointer font-bold text-sm transition ${val === false ? "bg-[#1D60A9] text-white border-[#1D60A9] shadow-[0_4px_12px_rgba(31,56,117,0.3)]" : "bg-[#ffffff] border-[#1D60A9]/30 hover:border-[#1D60A9] hover:text-[#1D60A9] text-[#164F8D]"}`}>
                    <input type="radio" name={`q-${q.id}`} className="sr-only" checked={val === false} onChange={() => onAnswer(q.id, false)} />
                    NO
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onSubmit} className="bg-[#E8356A] hover:bg-[#164F8D] text-white font-extrabold px-8 py-4 rounded-full shadow-[0_4px_15px_rgba(232,53,106,0.4)] text-lg transition hover:-translate-y-0.5">
          <span className="inline-flex items-center gap-2"><Rocket size={18} /> Ver mi resultado CHASIDE</span>
        </button>
        <button onClick={onReset} className="bg-[#ffffff] border-2 border-[#1D60A9]/20 hover:border-[#1D60A9] text-[#1D60A9] font-bold px-6 py-3 rounded-full">Reiniciar</button>
      </div>
      <p className="text-center text-xs text-[#164F8D]/60 mt-3">Se guarda automáticamente en tu navegador. Podrás ver tu resultado al completar.</p>
    </div>
  );
}
