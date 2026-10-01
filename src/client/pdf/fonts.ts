let fontsCache: { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[] | null = null;

export async function getSatoriFonts(): Promise<{ name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[]> {
  if (fontsCache) return fontsCache;
  // Usa Google Fonts CDN con CORS habilitado. Fallback a fuentes del sistema si falla.
  const load = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Font fetch failed ${url}`);
    return res.arrayBuffer();
  };
  try {
    const [poppinsBold, poppinsRegular, interRegular] = await Promise.all([
      load("https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.0.16/files/poppins-latin-700-normal.woff"),
      load("https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.0.16/files/poppins-latin-400-normal.woff"),
      load("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff"),
    ]);
    fontsCache = [
      { name: "Poppins", data: poppinsBold, weight: 700 as const, style: "normal" as const },
      { name: "Poppins", data: poppinsRegular, weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: interRegular, weight: 400 as const, style: "normal" as const },
    ];
  } catch (e) {
    console.warn("Satori fonts failed, fallback to html2pdf", e);
    fontsCache = [];
  }
  return fontsCache;
}

export async function getLogoDataUrl(): Promise<string> {
  try {
    const res = await fetch("/logo-fucsia.png");
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "/logo-fucsia.png";
  }
}
