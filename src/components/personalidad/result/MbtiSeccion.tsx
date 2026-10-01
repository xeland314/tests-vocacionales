import type { ItemTituloDesc, RasgoInfluyente } from "../../../data/mbti/types";
import { MbtiLista } from "./MbtiLista";
import { Lightbulb } from "lucide-react";

interface ListaExtra {
  titulo: string;
  items: ItemTituloDesc[];
}

export function MbtiSeccion({
  numero,
  titulo,
  imagen,
  caption,
  paragraphs,
  influential,
  strengths,
  weaknesses,
  listas,
  color,
}: {
  numero: number;
  titulo: string;
  imagen: string;
  caption: string;
  paragraphs: string[];
  influential: RasgoInfluyente[];
  strengths: ItemTituloDesc[];
  weaknesses: ItemTituloDesc[];
  listas: ListaExtra[];
  color: string;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-[#1D60A9] text-white text-xs font-black flex items-center justify-center">{numero}</span>
        <h2 className="text-xl font-black text-[#1D60A9]">{titulo}</h2>
      </div>

      <div className="mt-4 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="h-1" style={{ background: color }} />
        <div className="p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-[200px_1fr] sm:items-start">
            <figure>
              <img
                src={imagen}
                alt={caption}
                width={200}
                height={200}
                className="w-full aspect-square object-cover rounded-xl border-2 border-[#E1E3DA] shadow-sm"
              />
              <figcaption className="mt-2 text-[11px] italic text-slate-500 leading-snug">{caption}</figcaption>
            </figure>
            <div className="space-y-3">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-[#1D60A9]">{p}</p>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#1D60A9]">Rasgos Influyentes</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {influential.map((r) => (
                <div key={r.name} className="print-block bg-[#E1E3DA] border border-slate-100 rounded-xl p-3">
                  <p className="text-sm font-black flex items-center gap-1.5" style={{ color }}>
                    <Lightbulb size={14} /> {r.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          <MbtiLista title="Tus Fortalezas" items={strengths} variant="positive" />
          <MbtiLista title="Tus Debilidades" items={weaknesses} variant="negative" />

          {listas.map((l) => (
            <MbtiLista key={l.titulo} title={l.titulo} items={l.items} variant="neutral" color={color} />
          ))}
        </div>
      </div>
    </section>
  );
}
