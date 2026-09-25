import type { TraitGauge } from "../../../data/mbti/gauges";
import { TraitBar } from "./TraitBar";

export function MbtiRasgos({ gauges, color }: { gauges: TraitGauge[]; color: string }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-black text-[#001d62]">Rasgos de personalidad</h2>
      <div className="mt-3 bg-white border border-slate-200 rounded-2xl p-5 grid gap-5 sm:grid-cols-2 print-block">
        {gauges.map((g) => (
          <TraitBar key={g.pair.key} gauge={g} color={color} />
        ))}
        <div className="hidden sm:block" />
      </div>
    </section>
  );
}
