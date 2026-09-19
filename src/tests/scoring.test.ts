import { describe, it, expect } from "vitest";
import { calculateScores, answersFromYesList } from "../data/scoring";
import { INTERESES_TABLE, APTITUDES_TABLE, AREA_ORDER } from "../data/chaside";

describe("scoring: tablas cubren 1..98 sin duplicados", () => {
  it("cada número 1..98 aparece exactamente una vez entre intereses+aptitudes", () => {
    const all: number[] = [];
    for (const k of AREA_ORDER) all.push(...INTERESES_TABLE[k], ...APTITUDES_TABLE[k]);
    expect(all.length).toBe(98);
    expect(new Set(all).size).toBe(98);
    for (let i = 1; i <= 98; i++) expect(all).toContain(i);
  });
  it("intereses 10 por área", () => {
    for (const k of AREA_ORDER) expect(INTERESES_TABLE[k].length).toBe(10);
  });
  it("aptitudes 4 por área", () => {
    for (const k of AREA_ORDER) expect(APTITUDES_TABLE[k]).toHaveLength(4);
  });
});

describe("calculateScores: casos base", () => {
  it("todo NO => todos 0 y ranking C primero por desempate", () => {
    const r = calculateScores({});
    for (const k of AREA_ORDER) {
      expect(r.intereses[k]).toBe(0);
      expect(r.aptitudes[k]).toBe(0);
    }
    expect(r.topInteres).toBe("C");
    expect(r.topAptitud).toBe("C");
    expect(r.segundoInteres).toBeNull();
  });

  it("todo SI => intereses 10 y aptitudes 4 por área", () => {
    const allYes = answersFromYesList(Array.from({ length: 98 }, (_, i) => i + 1));
    const r = calculateScores(allYes);
    for (const k of AREA_ORDER) {
      expect(r.intereses[k]).toBe(10);
      expect(r.aptitudes[k]).toBe(4);
    }
  });

  it("caso ejemplo usuario: Intereses C=1, E=1, resto 0 ; Aptitudes E=1", () => {
    // Para lograr ese puntaje, marcamos 1 SÍ de C-intereses (ej 98) y 1 SÍ de E-intereses (ej 77) y 1 SÍ de E-aptitudes (ej 94)
    // Esto replica el texto: "Obtuvo 1 de 10 en C" y "1 de 10 en E" y "1 de 5 en E apt"
    const yes = [98, 77, 94];
    const r = calculateScores(answersFromYesList(yes));
    expect(r.intereses.C).toBe(1);
    expect(r.intereses.E).toBe(1);
    expect(r.intereses.H).toBe(0);
    expect(r.aptitudes.E).toBe(1);
    expect(r.topInteres).toBe("C"); // empate C/E a 1 => C prima por orden
    expect(r.segundoInteres).toBe("E");
    expect(r.topAptitud).toBe("E");
  });

  it("desempate intereses: puntajes altos se ordenan desc", () => {
    // Damos 3 a C (98,12,64) y 2 a H (9,34)
    const r = calculateScores(answersFromYesList([98, 12, 64, 9, 34]));
    expect(r.intereses.C).toBe(3);
    expect(r.intereses.H).toBe(2);
    expect(r.topInteres).toBe("C");
    expect(r.segundoInteres).toBe("H");
  });

  it("aptitud empata: segundoAptitud solo si empata en top", () => {
    // E apt 2 (94,7) y C apt 2 (15,51) -> empate 2, C prima
    const r = calculateScores(answersFromYesList([94, 7, 15, 51]));
    expect(r.aptitudes.E).toBe(2);
    expect(r.aptitudes.C).toBe(2);
    expect(r.topAptitud).toBe("C");
    expect(r.segundoAptitud).toBe("E"); // empatado en 2 -> derecha
  });

  it("bug report 1,3,5,7 => C=1, A=1, D=1, E apt=1 -> top C, segundo D (derecha), no A", () => {
    const r = calculateScores(answersFromYesList([1, 3, 5, 7]));
    // intereses: 1->C, 3->A, 5->D, 7->E apt no cuenta en intereses
    expect(r.intereses.C).toBe(1);
    expect(r.intereses.A).toBe(1);
    expect(r.intereses.D).toBe(1);
    expect(r.intereses.E).toBe(0);
    expect(r.intereses.H).toBe(0);
    expect(r.aptitudes.E).toBe(1);
    // ranking intereses empate 1: C,A,D -> top izquierda C, segundo derecha D (como TestGratis.net)
    expect(r.topInteres).toBe("C");
    expect(r.segundoInteres).toBe("D");
    // apt top E
    expect(r.topAptitud).toBe("E");
    // tablas
    expect(r.intereses).toEqual(expect.objectContaining({ C: 1, A: 1, D: 1 }));
    // tabla completa esperada por el usuario: 1 0 1 0 0 1 0 / 0 0 0 0 0 0 1
    expect([r.intereses.C, r.intereses.H, r.intereses.A, r.intereses.S, r.intereses.I, r.intereses.D, r.intereses.E]).toEqual([1, 0, 1, 0, 0, 1, 0]);
    expect([r.aptitudes.C, r.aptitudes.H, r.aptitudes.A, r.aptitudes.S, r.aptitudes.I, r.aptitudes.D, r.aptitudes.E]).toEqual([0, 0, 0, 0, 0, 0, 1]);
  });

  it("mismo resultado que referencia para patrón completo por área", () => {
    // Si respondemos SI solo a todos los números de C (14 preguntas), debe dar C=10 intereses, C=4 aptitudes
    const cAll = [...INTERESES_TABLE.C, ...APTITUDES_TABLE.C];
    const r = calculateScores(answersFromYesList(cAll));
    expect(r.intereses.C).toBe(10);
    expect(r.aptitudes.C).toBe(4);
    expect(r.topInteres).toBe("C");
    expect(r.topAptitud).toBe("C");
  });
});

describe("formato resultado: texto exacto referencia", () => {
  it("frase puntuación intereses debe ser 'de un máximo de 10'", () => {
    const r = calculateScores(answersFromYesList([98]));
    const texto = `Obtuvo una puntuación de ${r.intereses[r.topInteres]} de un máximo de 10`;
    expect(texto).toBe("Obtuvo una puntuación de 1 de un máximo de 10");
  });
  it("frase puntuación aptitudes debe ser 'de un máximo de 5' (compat referencia usuario)", () => {
    const r = calculateScores(answersFromYesList([94]));
    const texto = `Obtuvo una puntuación de ${r.aptitudes[r.topAptitud]} de un máximo de 5`;
    expect(texto).toBe("Obtuvo una puntuación de 1 de un máximo de 5");
  });
});
