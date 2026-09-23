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
      load("https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv6yxQkrJJbeczQ.ttf"), // Poppins 700
      load("https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv6yxQkrJURIc1Q.ttf"), // Poppins 400
      load("https://fonts.gstatic.com/s/inter/v13/UcCoElRi-L_vrYpY8dM.ttf"), // Inter 400
    ]);
    fontsCache = [
      { name: "Poppins", data: poppinsBold, weight: 700 as const, style: "normal" as const },
      { name: "Poppins", data: poppinsRegular, weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: interRegular, weight: 400 as const, style: "normal" as const },
    ];
  } catch {
    // Fallback: usa un ArrayBuffer vacío y deja que satori use fallback de sistema (no ideal pero no bloquea)
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
