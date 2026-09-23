import { useEffect, useRef } from "react";

export function PlotlyChart({ data, layout, style }: { data: any; layout: any; style?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    if (!ref.current) return;
    (async () => {
      try {
        let Plotly: any = null;
        try {
          const mod: any = await import("plotly.js-dist-min");
          Plotly = mod.default || mod.Plotly || mod;
        } catch {}
        if (!Plotly?.newPlot && typeof window !== "undefined" && (window as any).Plotly?.newPlot) {
          Plotly = (window as any).Plotly;
        }
        if (!Plotly?.newPlot) {
          await new Promise<void>((resolve, reject) => {
            if (document.querySelector("script[data-plotly]")) {
              const check = () => ((window as any).Plotly?.newPlot ? resolve() : setTimeout(check, 100));
              check();
              return;
            }
            const s = document.createElement("script");
            s.src = "https://cdn.plot.ly/plotly-2.32.0.min.js";
            s.setAttribute("data-plotly", "true");
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("CDN Plotly failed"));
            document.head.appendChild(s);
          });
          Plotly = (window as any).Plotly;
        }
        if (cancelled || !ref.current) return;
        if (!Plotly?.newPlot) {
          console.error("Plotly.newPlot no disponible", Plotly);
          if (ref.current) ref.current.innerHTML = '<p class="text-xs text-slate-500 p-4">Plotly no disponible — mostrando datos como tabla</p>';
          return;
        }
        await Plotly.newPlot(ref.current, data, { ...layout, autosize: true, margin: { t: 30, l: 40, r: 20, b: 40 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent" }, { responsive: true, displayModeBar: false });
      } catch (e) {
        console.error("Error cargando Plotly", e);
      }
    })();
    return () => { cancelled = true; };
  }, [JSON.stringify(data), JSON.stringify(layout)]);
  return <div ref={ref} style={style || { width: "100%", height: "300px" }} />;
}
