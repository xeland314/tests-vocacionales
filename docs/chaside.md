# CHASIDE — Documentación Técnica

## 1. Origen y referencia

- Fuente primaria HTML: `Test CHASIDE Online con Interpretación` (testgratis.net) — 98 preguntas, validación `Debe responder todas las preguntas`.
- Fuente baremo: **CUESA.pdf** (Ministerio de Cultura y Educación de la Nación, Guía 1998) + **JimContent test de orientación vocacional chaside.pdf** p.2 / p.5.
- Validación: cada número 1..98 aparece exactamente una vez.
- Unión simplificada (testgratis) = `Intereses (70 = 10×7)` + `Aptitudes (28 = 4×7)` = 14 por área.

## 2. Tablas oficiales

### Intereses (máx 10)

| C | H | A | S | I | D | E |
|---|---|---|---|---|---|---|
|98|9|21|33|75|84|77|
|12|34|45|92|6|31|42|
|64|80|96|70|19|48|88|
|53|25|57|8|38|73|17|
|85|95|28|87|60|5|93|
|1|67|11|62|27|65|32|
|78|41|50|23|83|14|68|
|20|74|3|44|54|37|49|
|71|56|81|16|47|58|35|
|91|89|36|52|97|24|61|

### Aptitudes (máx 4 — mostrado como **5** en UI para compatibilidad literal con el texto de referencia del usuario; tabla real es 4)

| C | H | A | S | I | D | E |
|---|---|---|---|---|---|---|
|15|63|22|69|26|13|94|
|51|30|39|40|59|66|7|
|2|72|76|29|90|18|79|
|46|86|82|4|10|43|55|

> **Nota:** El texto entregado por el usuario dice `máximo de 5` para aptitudes. La tabla oficial imprime **4** (CR 1998). Este proyecto renderiza `de un máximo de 5` para coincidir literalmente con el formato exigido, manteniendo el cómputo sobre 4 (el 5º punto nunca se alcanza; es cosmético). Si se requiere exactitud académica, cambiar la cadena a `4` en `ChasideTest.tsx:382`.

## 3. Algoritmo de puntuación

```ts
intereses[k] = count(answers[n] === true for n in INTERESES_TABLE[k])
aptitudes[k] = count(answers[n] === true for n in APTITUDES_TABLE[k])
ranking = sort AREA_ORDER desc por puntaje, desempate estable C-H-A-S-I-D-E
topInteres = rankingIntereses[0]
segundoInteres = primer ranking[1..] con puntaje >0, null si top==0
topAptitud = análogo
segundoAptitud = solo si existe apt >0 y empata en top (para no saturar UI)
```

## 4. Formato de resultado (idéntico a la referencia)

```
Test vocacional CHASIDE
Resultado del Test
Intereses
  Lo que más le interesa
    Obtuvo una puntuación de X de un máximo de 10 en áreas relativas a carreras {Nombre}
    {interesesDesc} Estas carreras requieren de aptitudes tales como: {aptitudesTraits}.
    Posibles carreras a seguir: {carreras}
  También le interesa (si segundoInteres y puntaje>0)
    Obtuvo una puntuación de Y de un máximo de 10 ...
    {interesesDesc} Las aptitudes para las carreras de esta área requieren ser: {aptitudesTraits}.
    Carreras afines: {carreras}
Sus aptitudes
  Tiene aptitudes para
    Obtuvo una puntuación de Z de un máximo de 5 en áreas relativas a carreras {Nombre}
    Aptitudes: {aptitudesTraits}. Se le dan bien actividades relacionadas con: {interesesTraits}.
    Carreras afines: {carreras}
Tablas puntuación CHASIDE
  Test CHASIDE Intereses  (10 filas + fila amarilla puntajes)
  Test CHASIDE Aptitudes (4 filas + fila amarilla puntajes)
👇 Test Relacionado ...
Skip Navigation Links Test Gratis > Psicológicos > Test vocacional CHASIDE
```

## 5. Guardado nombre + fecha/hora

- Inputs en cabecera del resultado: **Nombre del estudiante** (obligatorio para guardar).
- Al pulsar **Guardar nombre y fecha** se persiste en `localStorage`:
  - `chaside_student_name`
  - `chaside_student_date` = `DD/MM/YYYY HH:mm:ss` (hora local)
  - `chaside_answers_v1` (respuestas 98)
- Se muestra `Guardado: {nombre} · {fecha hora}` y aparece en la impresión/PDF (`window.print()`).
- Descarga JSON: `CHASIDE_{nombre}_{YYYY-MM-DD}.json` con `{estudiante, fecha, respuestas, puntajes, topInteres, segundoInteres, topAptitud}`.

## 6. Diseño TeamGGM

Ver `src/styles/global.css` para variables:

- `--ggm-bg-dark: #0b1220`, `--ggm-primary-blue: #0052ff`, `--ggm-accent-red: #ff3b30`, `--ggm-accent-yellow: #ffcc00`
- Tipografía: `Poppins 700/800/900` headings uppercase, `Inter 400/500/600` body.
- Botón CTA píldora rojo con sombra `0 4px 15px rgba(255,59,48,.4)`, hover `translateY(-2px)`.
- Hero dark con badge azul, titular con highlight amarillo.

## 7. Stack

- Astro 7 + `@astrojs/react` 6 + React 19 + Tailwind 4 (`@tailwindcss/vite`)
- Vitest 5 + jsdom + Testing Library
- `src/data/chaside.ts` (preguntas + áreas + grids), `src/data/scoring.ts` (cálculo puro, testeable)
- `src/components/ChasideTest.tsx` (estado, persistencia, UI test + resultado)

## 8. Comandos

```bash
npm install
npm run build   # verifica mismo resultado que referencia
npm run test    # vitest
# No usar `npm run dev` en este entorno (ver AGENTS.md si aplica)
```
