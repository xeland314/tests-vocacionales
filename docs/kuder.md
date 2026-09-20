# Test Kuder — Forma C (60 diadas)

> Referencia local: `referencia/《 Test de orientación vocacional de Kuder gratis online 》.html` + PUCV Kuder + U. Lima Forma C (10 áreas + V).

## Modelo

- **60 diadas** (pares) = 120 actividades. El usuario elige 1 por diada → 60 elecciones.
- **10 áreas**: EXT Aire Libre, MEC Mecánico, CAL Cálculo, CIE Científico, PER Persuasivo, ART Artístico, LIT Literario, MUS Musical, SOC Social/Servicio, OFI Oficina + escala **V** verificación (60 respuestas = válido).
- Ipsativo: cada elección suma 1 a su área. Ranking por puntaje.

Catálogo en `src/data/kuder.ts` (diadas) y `src/data/kuderScoring.ts`.

## Diseño

- Usa paleta TeamGGM pero con acento azul `#2563EB` para diferenciar de CHASIDE (`#0052FF`) y Personalidad (`#7C3AED`).
- UI de diada: 2 botones con icono + texto + badge área, selección marcada con borde negro.

## Ruta

- `/kuder` → `KuderTest` (client:load). Menú `/` con 3 cards.

## Tests

`src/tests/kuder.test.ts` cubre conteo 60 diadas, scoring y top área.
