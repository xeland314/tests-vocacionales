import type { TraitGauge } from "../../../data/mbti/gauges";

export function TraitBar({ gauge, color }: { gauge: TraitGauge; color: string }) {
  const winLeft = gauge.winner === "left";
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold mb-1">
        <span className={winLeft ? "text-[#001d62]" : "text-slate-400"}>{gauge.pair.left.name}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">{gauge.pair.label}</span>
        <span className={!winLeft ? "text-[#001d62]" : "text-slate-400"}>{gauge.pair.right.name}</span>
      </div>
      <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden flex">
        <div style={{ width: `${gauge.leftPercent}%`, background: winLeft ? color : "#E5E7EB" }} />
        <div style={{ width: `${gauge.rightPercent}%`, background: !winLeft ? color : "#E5E7EB" }} />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/70" />
      </div>
      <p className="mt-1 text-center text-[11px] font-black" style={{ color }}>
        {gauge.pair.label}: {gauge.winnerPercent}% {gauge.winnerName}
      </p>
    </div>
  );
}
