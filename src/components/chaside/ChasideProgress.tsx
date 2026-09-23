type Props = { total: number; progress: number; siCount: number; onSubmit: () => void; error: string | null };

export function ChasideProgress({ total, progress, siCount, onSubmit, error }: Props) {
  return (
    <div className="sticky top-0 z-20 bg-[#001d62] text-white border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <img src="/logo-teamggm-horizontal-con-transparencia.webp" alt="TEAM GGM" className="h-6 sm:h-7 w-auto shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-xs font-bold text-white/80 mb-1">
            <span>Progreso: {total}/98</span>
            <span className="text-[#fcfcfc]">{progress}% · {siCount} SÍ</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-[#d8215d] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button
          onClick={onSubmit}
          className="inline-flex bg-[#d8215d] hover:bg-[#b01a4a] text-white font-bold px-5 sm:px-6 py-2.5 rounded-full shadow-[0_4px_15px_rgba(216,33,93,0.4)] transition shrink-0 text-sm"
        >
          Ver resultado →
        </button>
      </div>
      {error && (
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <p className="text-[#d8215d] font-bold text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        </div>
      )}
    </div>
  );
}
