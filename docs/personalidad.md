# Test de Personalidad — 60 preguntas (16 tipos, estilo 16Personalities)

> Inspiración: **NERIS Type Explorer® / 16Personalities** — 4 dicotomías → 16 tipos. Prima su diseño limpio por sobre TeamGGM para este test.

## Modelo

- **60 preguntas**, 15 por dicotomía: `EI` (Mente E/I), `SN` (Energía S/N), `TF` (Naturaleza T/F), `JP` (Táctica J/P).
- Escala Likert **7 puntos**: `-3` Muy en desacuerdo … `0` Neutral … `+3` Muy de acuerdo.
- `direction = 1` → la pregunta mide el polo positivo (E/S/T/J); ` -1` → invertida (I/N/F/P). Score ponderado `v * direction`.
- Suma por dimensión `-45..+45` → percentil `0..100` → letra `≥50` = polo positivo.

```
raw = Σ(v * direction)  // 15 * ±3
percent = (raw +45)/90 *100
letter = percent>=50 ? positivo : negativo
type = EI + SN + TF + JP  // ej. INTJ
```

Catálogo en `src/data/personalidad.ts` (preguntas 1-60) y `src/data/personalidadScoring.ts`.

## Tipos (16)

| Rol | Tipos | Color |
|---|---|---|
| Analistas | INTJ Arquitecto, INTP Lógico, ENTJ Comandante, ENTP Innovador | #7C3AED |
| Diplomáticos | INFJ Abogado, INFP Mediador, ENFJ Protagonista, ENFP Activista | #10B981 |
| Centinelas | ISTJ Logista, ISFJ Defensor, ESTJ Ejecutivo, ESFJ Cónsul | #0EA5E9 |
| Exploradores | ISTP Virtuoso, ISFP Aventurero, ESTP Emprendedor, ESFP Animador | #F59E0B |

Descripciones, taglines y strengths en `TYPES`.

## Diseño UI (prima 16Personalities)

- Fondo `#F3F4F6` (vs `#0B1220` de CHASIDE), tarjetas blancas `rounded-2xl border-slate-200`.
- Header progreso fina barra morada `#7C3AED` (no azul TeamGGM).
- Pregunta: número en círculo negro, escala 7 círculos con tamaños 48/40/32/28 y colores morado (`Desacuerdo`) / gris (`Neutral`) / verde (`De acuerdo`) — hover y activo con borde negro.
- Resultado: hero con banda de color del rol, 4 barras horizontales con % por dimensión (estilo 16p), grid 16 tipos resaltando el obtenido.

## Persistencia

- `localStorage`: `pers_answers_v1`, `pers_student_name`, `pers_student_date` (formato `DD/MM/YYYY HH:mm:ss`).
- Botón “Guardar nombre y fecha” obligatorio antes de PDF; `window.print()`.

## Ruta

- Menú: `/` → cards CHASIDE y Personalidad.
- Personalidad: `/personalidad` → `PersonalidadTest` (client:load).
- CHASIDE movido a `/chaside`.

## Tests

`src/tests/personalidad.test.ts` cubre:
- 60 preguntas totales, 15 por dimensión
- Todo +3 → ESTJ, todo -3 → INFP, todo 0 → ESTJ (≥50)
- Caso mixto E+/I- mixto
