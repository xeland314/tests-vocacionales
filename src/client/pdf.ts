// Re-export dinámico para no incluir satori/pdf-lib en el chunk inicial de hidratación (evita process is not defined en ChasideTest)
// Usar import() en handlePrint: const { generateChasideStudentPdf } = await import("./pdf/chaside");

/**
 * Genera PDF nítido usando html2pdf.js (html2canvas + jsPDF) — fallback legacy
 * - scale: 2 para alta resolución
 * - Usa data-html2canvas-ignore para ocultar botones
 * - Fallback a window.print() si falla
 * Para diseño nuevo usa generateChasideStudentPdf / generateMbtiStudentPdf / generateKuderStudentPdf (satori + pdf-lib, vectorial)
 */
export async function generateCrispPdf(elementId: string, filename: string) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }
  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        // Ignora elementos con data-html2canvas-ignore o print:hidden
        ignoreElements: (e: Element) => e.hasAttribute("data-html2canvas-ignore") || e.classList.contains("print:hidden"),
      },
      jsPDF: {
        unit: "mm" as const,
        format: "a4" as const,
        orientation: "portrait" as const,
      },
      pagebreak: { mode: ["css", "legacy"] as string[] },
    };
    // Oculta temporalmente botones con print:hidden para html2pdf
    const hidden = el.querySelectorAll(".print\\:hidden");
    hidden.forEach((e) => ((e as HTMLElement).style.display = "none"));
    await html2pdf().set(opt).from(el).save();
    hidden.forEach((e) => ((e as HTMLElement).style.display = ""));
  } catch (e) {
    console.error("html2pdf failed, fallback to print", e);
    window.print();
  }
}
