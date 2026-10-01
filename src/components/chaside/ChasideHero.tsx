import React from 'react';
import { Zap } from "lucide-react";

export function ChasideHero() {
  return (
    <section className="bg-[#1D60A9] text-white px-6 py-10 text-center border-b border-white/10">
      <div className="max-w-4xl mx-auto space-y-4">
        <img src="/logo-teamggm-horizontal-con-transparencia.webp" alt="TEAM GGM" className="h-10 mx-auto" />
        <span className="bg-[#1D60A9] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
          <Zap size={14} /> TeamGGM · Orientación Vocacional
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight leading-tight" style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
          Test vocacional <span className="text-[#E8356A]">CHASIDE</span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">El test le mostrará las áreas en las que tiene interés y las áreas en las que tiene aptitudes.</p>
        <p className="text-[#E8356A] font-semibold">Debes responder todas las preguntas (98). No hay respuestas correctas o incorrectas.</p>
      </div>
    </section>
  );
}
