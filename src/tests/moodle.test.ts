import { describe, it, expect } from "vitest";
import { validarContexto, extraerContexto, matchearDominio, type MoodleConfig, type MoodleContext } from "../server/modules/moodle-integration/validator";

const cfgCompleta: MoodleConfig = {
  moodle_domains: ["https://campus.colegio.edu.ec"],
  referer_required: true,
  course_ids: [2],
  chaside_cmids: [9],
  mbti_cmids: [10],
  kuder_cmids: [11],
};

const cfgMultiCurso: MoodleConfig = { ...cfgCompleta, course_ids: [2, 3, 5] };
const cfgMultiCmid: MoodleConfig = { ...cfgCompleta, chaside_cmids: [9, 12, 15] };

const ctxValido: MoodleContext = { origin: "https://campus.colegio.edu.ec", courseId: 2, cmid: 9 };

describe("moodle validator — contexto extraído de URL", () => {
  it("extrae courseId y cmid de los parámetros soportados", () => {
    const ctx = extraerContexto(new URL("https://app.example.com/chaside?moodleUserId=5&cid=2&cmid=9"));
    expect(ctx.courseId).toBe(2);
    expect(ctx.cmid).toBe(9);
    expect(ctx.origin).toBe("https://app.example.com");
  });

  it("devuelve null cuando faltan parámetros", () => {
    const ctx = extraerContexto(new URL("https://app.example.com/chaside?moodleUserId=5"));
    expect(ctx.courseId).toBeNull();
    expect(ctx.cmid).toBeNull();
  });
});

describe("moodle validator — validarContexto", () => {
  it("acepta dominio, curso y actividad correctos", () => {
    const r = validarContexto("CHASIDE", ctxValido, cfgCompleta);
    expect(r.ok).toBe(true);
  });

  it("rechaza dominio no permitido", () => {
    const r = validarContexto("CHASIDE", { ...ctxValido, origin: "https://malware.evil.com" }, cfgCompleta);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.join(" ")).toContain("Dominio no permitido");
  });

  it("rechaza curso incorrecto", () => {
    const r = validarContexto("CHASIDE", { ...ctxValido, courseId: 99 }, cfgCompleta);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.join(" ")).toContain("Curso incorrecto");
  });

  it("acepta cualquiera de los varios cursos configurados", () => {
    for (const c of [2, 3, 5]) {
      const r = validarContexto("CHASIDE", { ...ctxValido, courseId: c }, cfgMultiCurso);
      expect(r.ok).toBe(true);
    }
    const mal = validarContexto("CHASIDE", { ...ctxValido, courseId: 99 }, cfgMultiCurso);
    expect(mal.ok).toBe(false);
    if (!mal.ok) expect(mal.errores.join(" ")).toContain("esperado 2 o 3 o 5");
  });

  it("curso opcional: sin cursos configurados se salta la comprobación", () => {
    const sinCurso: MoodleConfig = { ...cfgCompleta, course_ids: [] };
    const r = validarContexto("CHASIDE", { ...ctxValido, courseId: null }, sinCurso);
    expect(r.ok).toBe(true);
  });

  it("cmid opcional: sin cmids configurados se salta la comprobación", () => {
    const sinCmid: MoodleConfig = { ...cfgCompleta, chaside_cmids: [] };
    const r = validarContexto("CHASIDE", { ...ctxValido, cmid: null }, sinCmid);
    expect(r.ok).toBe(true);
  });

  it("dominio opcional: sin dominios configurados se salta la comprobación", () => {
    const sinDominio: MoodleConfig = { ...cfgCompleta, moodle_domains: [] };
    const r = validarContexto("CHASIDE", { ...ctxValido, origin: "https://otro-dominio.com" }, sinDominio);
    expect(r.ok).toBe(true);
  });

  it("rechaza actividad (cmid) incorrecta", () => {
    const r = validarContexto("CHASIDE", { ...ctxValido, cmid: 10 }, cfgCompleta);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.join(" ")).toContain("Actividad incorrecta");
  });

  it("acepta cualquiera de los varios cmids configurados", () => {
    for (const cmid of [9, 12, 15]) {
      const r = validarContexto("CHASIDE", { ...ctxValido, cmid }, cfgMultiCmid);
      expect(r.ok).toBe(true);
    }
    const mal = validarContexto("CHASIDE", { ...ctxValido, cmid: 99 }, cfgMultiCmid);
    expect(mal.ok).toBe(false);
    if (!mal.ok) expect(mal.errores.join(" ")).toContain("esperada cmid=9 o 12 o 15");
  });

  it("rechaza acceso directo sin Referer cuando el dominio está configurado", () => {
    const r = validarContexto("CHASIDE", { ...ctxValido, origin: "" }, cfgCompleta);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.join(" ")).toContain("Acceso directo no permitido");
  });

  it("usa el cmid correcto por test (PERSONALIDAD→mbti_cmids, KUDER→kuder_cmids)", () => {
    const okPers = validarContexto("PERSONALIDAD", { ...ctxValido, cmid: 10 }, cfgCompleta);
    const okKuder = validarContexto("KUDER", { ...ctxValido, cmid: 11 }, cfgCompleta);
    expect(okPers.ok).toBe(true);
    expect(okKuder.ok).toBe(true);
  });

  it("modo permisivo: sin nada configurado no bloquea", () => {
    const vacia: MoodleConfig = { moodle_domains: [], course_ids: [], chaside_cmids: [], mbti_cmids: [], kuder_cmids: [], referer_required: true };
    const r = validarContexto("CHASIDE", { origin: "https://lo-que-sea.com", courseId: null, cmid: null }, vacia);
    expect(r.ok).toBe(true);
  });
});

describe("moodle validator — matchearDominio (wildcards y sufijos)", () => {
  it("wildcard *.trycloudflare.com acepta cualquier subdominio", () => {
    expect(matchearDominio("https://dividend-grows-enforcement-onto.trycloudflare.com", "https://*.trycloudflare.com")).toBe(true);
    expect(matchearDominio("https://otro-tunnel.trycloudflare.com", "*.trycloudflare.com")).toBe(true);
  });

  it("wildcard no acepta dominios de otro nivel", () => {
    expect(matchearDominio("https://trycloudflare.com", "*.trycloudflare.com")).toBe(true); // apex incluido
    expect(matchearDominio("https://evil.com", "*.trycloudflare.com")).toBe(false);
  });

  it("dominio exacto acepta subdominios por segmento", () => {
    expect(matchearDominio("https://campus.colegio.edu.ec", "https://campus.colegio.edu.ec")).toBe(true);
    expect(matchearDominio("https://sub.colegio.edu.ec", "colegio.edu.ec")).toBe(true);
    // eviltrycloudflare.com NO es subdominio de trycloudflare.com
    expect(matchearDominio("https://eviltrycloudflare.com", "trycloudflare.com")).toBe(false);
  });
});
