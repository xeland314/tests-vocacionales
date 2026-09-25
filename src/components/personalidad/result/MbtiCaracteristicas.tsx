import type { TraitGauge } from "../../../data/mbti/gauges";
import { TRAIT_ICONS } from "../../../data/mbti/gauges";
import type { MbtiTypeProfile } from "../../../data/mbti/types";
import { LucideIcon } from "../../../lib/icons";
import { TraitBar } from "./TraitBar";

function cleanInsight(text: string, identityLetter: "A" | "T") {
  return text.replace("{ID}", identityLetter === "T" ? "Turbulenta" : "Asertiva");
}

export function MbtiCaracteristicas({
  gauges,
  profile,
  color,
  identityLetter,
}: {
  gauges: TraitGauge[];
  profile: MbtiTypeProfile;
  color: string;
  identityLetter: "A" | "T";
}) {
  return (
    <section id="caracteristicas" className="mt-10 scroll-mt-4">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-[#001d62] text-white text-xs font-black flex items-center justify-center">1</span>
        <h2 className="text-xl font-black text-[#001d62]">Características de Personalidad</h2>
      </div>

      <div className="mt-4 space-y-5">
        {gauges.map((g) => {
          const winnerPole = g.winner === "left" ? g.pair.left : g.pair.right;
          const insight = profile.insights[g.pair.key] ?? [];
          const icon = TRAIT_ICONS[g.pair.key] ?? "Activity";
          return (
            <article key={g.pair.key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="h-1" style={{ background: color }} />
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-black text-[#001d62]">{winnerPole.name}</h3>
                <div className="mt-4">
                  <TraitBar gauge={g} color={color} />
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_240px] sm:items-start">
                  <div className="order-2 sm:order-1">
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color }}>{g.pair.label}</p>
                    <p className="mt-1 text-sm text-slate-600">{winnerPole.generic}</p>
                    {insight.map((p, i) => (
                      <p key={i} className="mt-3 text-[15px] leading-relaxed text-[#1f3875]">{cleanInsight(p, identityLetter)}</p>
                    ))}
                  </div>
                  <div className="order-1 sm:order-2 bg-[#fcfcfc] border border-slate-100 rounded-xl p-4 text-center">
                    <span className="mx-auto w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: color }}>
                      <LucideIcon name={icon} size={20} />
                    </span>
                    <p className="mt-3 text-xs italic text-slate-500">{winnerPole.scene}</p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
