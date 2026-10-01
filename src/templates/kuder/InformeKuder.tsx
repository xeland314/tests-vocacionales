import { KUDER_AREAS } from "../../data/kuder";
import { LucideIcon } from "../../client/icons";

export default function InformeKuder({
  result,
  maxScore = 45,
  footerNote,
}: {
  result: { top: string; ranking: string[]; scores: Record<string, number> };
  maxScore?: number;
  footerNote?: string | null;
}) {
  const topInfo = KUDER_AREAS[result.top as keyof typeof KUDER_AREAS] as any;
  if (!topInfo) return null;

  return (
    <>
      <div className="print-block bg-white border border-slate-200 rounded-[20px] overflow-hidden">
        <div className="h-2" style={{ background: topInfo.color }} />
        <div className="p-8 text-center">
          <h1 className="mt-2 text-3xl font-black flex items-center justify-center gap-2" style={{ color: topInfo.color }}><LucideIcon name={topInfo.icono} size={32} style={{ color: topInfo.color }} />{topInfo.nombre}</h1>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">{topInfo.descripcion}</p>
          <p className="mt-2 text-sm"><b>Carreras afines:</b> {topInfo.carreras}</p>
        </div>
        <div className="px-6 pb-6">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-500">Ranking 10 áreas</h3>
          <div className="mt-3 space-y-3">
            {result.ranking.map((k) => {
              const info = KUDER_AREAS[k as keyof typeof KUDER_AREAS] as any;
              if (!info) return null;
              const w = Math.round((result.scores[k] || 0) / maxScore * 100);
              return (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-10 text-xs font-black">{k}</span>
                  <span className="w-8 flex justify-center"><LucideIcon name={info.icono} size={16} style={{ color: info.color }} /></span>
                  <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden"><div className="h-full flex items-center justify-end pr-2 text-[10px] font-black text-white" style={{ width: `${w}%`, background: info.color, minWidth: (result.scores[k] || 0) > 0 ? "32px" : "0" }}>{(result.scores[k] || 0) > 0 ? result.scores[k] : ""}</div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {footerNote && <p className="mt-6 text-xs text-[#164F8D]/50 text-center print:hidden">{footerNote}</p>}
    </>
  );
}
