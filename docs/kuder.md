# Test Kuder — Banco Excel Test_Kuder_Completo.xlsx (45 diadas)

> Banco exacto: `docs/Test_Kuder_Completo.xlsx` (45 diadas = 90 actividades, 10 áreas 0-9). Referencia previa PUCV/U.Lima 60 diadas reemplazada.

## Modelo

- **45 diadas** (pares) = 90 actividades. El usuario elige 1 por diada → 45 elecciones (Excel 45 filas).
- **10 áreas**: 0 Exterior/EXT Aire Libre, 1 Mecánica/MEC, 2 Cálculo/CAL, 3 Científica/CIE, 4 Persuasiva/PER, 5 Artística/ART, 6 Literaria/LIT, 7 Musical/MUS, 8 Servicio Social/SOC, 9 Oficina/OFI + escala **V** verificación (45 respuestas = válido).
- Ipsativo: cada elección suma 1 a su área. Ranking por puntaje. Mapeo exacto del Excel vía `Resultados` SUM fórmulas (ej. 0 Exterior = D3+D5+B9...).

Catálogo en `src/data/kuder.ts` (45 diadas generadas desde Excel) y `src/data/kuderScoring.ts` (verificación 45).

## Diseño

- Usa paleta TeamGGM pero con acento azul `#2563EB` para diferenciar de CHASIDE (`#0052FF`) y Personalidad (`#7C3AED`).
- UI de diada: 2 botones solo texto (área oculta hasta resultado), selección marcada con borde `#001d62`.

## Ruta

- `/kuder` → `KuderTest` (client:load). Menú `/` con 3 cards.

## Tests

`src/tests/kuder.test.ts` cubre conteo 45 diadas, scoring y top área.
