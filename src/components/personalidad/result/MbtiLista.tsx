import type { ItemTituloDesc } from "../../../data/mbti/types";
import { Check, X, Sparkles } from "lucide-react";

export function MbtiLista({
  title,
  items,
  variant = "neutral",
  color = "#1D60A9",
  columns = 2,
}: {
  title: string;
  items: ItemTituloDesc[];
  variant?: "positive" | "negative" | "neutral";
  color?: string;
  columns?: 1 | 2;
}) {
  const Icon = variant === "positive" ? Check : variant === "negative" ? X : Sparkles;
  const accent = variant === "positive" ? "#10B981" : variant === "negative" ? "#E8356A" : color;
  return (
    <div className="mt-6">
      <h4 className="text-sm font-black uppercase tracking-wider text-[#1D60A9]">{title}</h4>
      <div className={`mt-3 grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {items.map((it) => (
          <div key={it.title} className="print-block flex gap-3 bg-[#E1E3DA] border border-slate-100 rounded-xl p-3">
            <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: accent }}>
              <Icon size={14} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#1D60A9] leading-snug">{it.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{it.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
