const site = "https://testvocacional.teamggm.com";

export async function GET() {
  const body = `# TeamGGM Preuniversitario — Tests Vocacionales

> Plataforma de orientación vocacional con tres tests oficiales (Personalidad MBTI, CHASIDE y Kuder) diseñada para estudiantes en Quito y Ecuador que buscan elegir carrera con datos objetivos antes de entrar a la universidad.

## Información General

- **Institución:** Gonaluisa Vasco Asociados Cia. Ltda. (TeamGGM Preuniversitario)
- **Ubicación:** Quito y Machachi, Ecuador (con modalidades virtuales en vivo)
- **Acceso:** Plataforma Moodle del preuniversitario previa solicitud de acceso
- **Objetivo:** Ayudar a los estudiantes a elegir carrera universitaria mediante datos objetivos para evitar cambios de carrera, semestres extra y pérdida de tiempo.

## Los 3 Tests Vocacionales

1. **Test de Personalidad (MBTI / 16 Tipos)**
   - **Formato:** 60 preguntas en escala de acuerdo de 7 puntos.
   - **Duración:** 10–12 minutos.
   - **Resultado:** Tipo de 4 letras (ej. ENFJ-A), porcentajes por dimensión, perfil completo con fortalezas, estilo de trabajo y carreras afines.

2. **Test CHASIDE (Intereses y Aptitudes)**
   - **Formato:** 98 preguntas.
   - **Duración:** 10 minutos.
   - **Áreas evaluadas:** Administrativas y contables, humanísticas y sociales, artísticas, ciencias de la salud, ingenierías y computación, defensa y seguridad, ciencias exactas y agrarias.

3. **Test Kuder (Áreas Profesionales)**
   - **Formato:** 45 decisiones forzadas entre parejas (diadas).
   - **Duración:** 12–15 minutos.
   - **Áreas evaluadas:** Aire libre, mecánico, cálculo, científico, persuasivo, artístico, literario, musical, servicio social y oficina.

## Beneficios y Siguiente Paso

- **Resultados:** Al instante con opción de informe PDF descargable.
- **Asesoría:** Los resultados obtenidos sirven de base para una asesoría vocacional completa y el armado de una ruta de admisión (preuniversitario de 300h y simuladores para universidades como UCE, EPN y ESPE).
- **Contacto y Acceso:**
  - [WhatsApp oficial](https://wa.me/593967941844?text=${encodeURIComponent("Hola, quiero orientación vocacional para mí o para mi hijo.")})
  - [Sitio web principal de TeamGGM](${site})
  - Correo: ggm.instituto@gmail.com
  - Instagram: [@teamggm.ec](https://www.instagram.com/teamggm.ec/)
  - TikTok: [@teamggm.latam](https://www.tiktok.com/@teamggm.latam)

## Rutas restringidas

- /admin
- /admin/login
- /admin/estudiante/*
- /personalidad
- /mbti
- /chaside
- /kuder

## Landing pública

${site}/
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
