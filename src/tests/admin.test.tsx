import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import React from "react";

// Mock plotly para no cargar bundle pesado en jsdom
vi.mock("plotly.js-dist-min", () => ({
  default: { newPlot: vi.fn(() => Promise.resolve()) },
  newPlot: vi.fn(() => Promise.resolve()),
}));

import AdminGeneral from "../components/AdminGeneral";

describe("AdminGeneral — hooks", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("mount sin 'Cannot read properties of null reading useState'", async () => {
    localStorage.setItem("knox_token", "dummy_token_1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab");
    // mock fetch para overview/estudiantes/users
    const overviewMock = {
      overview: { totalEstudiantes: 95, totalChaside: 60, totalPersonalidad: 54, totalKuder: 52, completos: 22, solo2: 30, solo1: 40, ninguno: 3, faltantes: [] },
      chaside: { total: 60, topIntereses: { C: 5, H: 5, A: 5, S: 5, I: 5, D: 5, E: 5 }, promediosIntereses: { C: 3, H: 3, A: 3, S: 3, I: 3, D: 3, E: 3 }, promediosAptitudes: { C: 2, H: 2, A: 2, S: 2, I: 2, D: 2, E: 2 }, topAptitudes: { C: 5, H: 5, A: 5, S: 5, I: 5, D: 5, E: 5 } },
      personalidad: { total: 54, byType: { INTJ: 5 }, byRole: { Analistas: 10, Diplomáticos: 10, Centinelas: 10, Exploradores: 10 }, dimAvg: { EI: 50, SN: 50, TF: 50, JP: 50 } },
      kuder: { total: 52, byTop: { EXT: 5, MEC: 5, CAL: 5, CIE: 5, PER: 5, ART: 5, LIT: 5, MUS: 5, SOC: 5, OFI: 5 }, avgScores: { EXT: 5, MEC: 5, CAL: 5, CIE: 5, PER: 5, ART: 5, LIT: 5, MUS: 5, SOC: 5, OFI: 5 } },
    };
    global.fetch = vi.fn((input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/api/admin/overview")) return Promise.resolve({ ok: true, status: 200, json: async () => overviewMock } as Response);
      if (url.includes("/api/admin/estudiantes")) return Promise.resolve({ ok: true, status: 200, json: async () => [] } as Response);
      if (url.includes("/api/users")) return Promise.resolve({ ok: true, status: 200, json: async () => [] } as Response);
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    }) as any;

    // No debe lanzar TypeError: Cannot read properties of null (reading 'useState')
    let error: any = null;
    try {
      render(<AdminGeneral />);
    } catch (e) {
      error = e;
    }
    expect(error).toBeNull();

    // Espera a que cargue y muestre panel
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("muestra login requerido sin token", async () => {
    localStorage.removeItem("knox_token");
    global.fetch = vi.fn() as any;
    const { getByText } = render(<AdminGeneral />);
    await waitFor(() => {
      expect(getByText(/Sesión requerida/i)).toBeTruthy();
    });
  });
});
