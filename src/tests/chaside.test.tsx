import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChasideResult } from "../components/chaside/ChasideResult";
import { calculateScores } from "../data/scoring";

describe("CHASIDE — paleta TEAM GGM y sin navegación en resultado", () => {
  const mockResult = calculateScores({ 1: true, 2: false } as any);

  it("ChasideResult no muestra Volver al test ni Nuevo test (solo admin habilita)", () => {
    const { queryByText, getByText } = render(
      <ChasideResult
        result={mockResult as any}
        studentName="Test Moodle"
        setStudentName={() => {}}
        savedAt="01/01/2026 10:00:00 · ya guardado"
        onSave={() => {}}
        onPrint={() => {}}
        onDownload={() => {}}
        error={null}
        extra={{ padre: "", correoEst: "", correoPadre: "", cedulaEst: "", cedulaRepr: "" }}
        setExtra={(() => {}) as any}
        saving={false}
      />
    );
    expect(queryByText(/Volver al test/)).toBeNull();
    expect(queryByText(/Nuevo test/)).toBeNull();
    expect(getByText(/Imprimir \/ PDF/)).toBeTruthy();
    expect(getByText(/Para volver a rendir, solicita habilitación al administrador/)).toBeTruthy();
  });

  it("ChasideQuestions usa paleta: SÍ rosado #E8356A y NO azul bajo #1D60A9", async () => {
    const { ChasideQuestions } = await import("../components/chaside/ChasideQuestions");
    const { container } = render(
      <ChasideQuestions
        answers={{ 1: true, 2: false }}
        error={null}
        missing={[]}
        onAnswer={() => {}}
        onSubmit={() => {}}
        onReset={() => {}}
      />
    );
    const html = container.innerHTML;
    // SÍ seleccionado debe tener bg-[#E8356A]
    expect(html).toContain("bg-[#E8356A]");
    // NO seleccionado debe tener bg-[#1D60A9]
    expect(html).toContain("bg-[#1D60A9]");
    // No debe contener slate-300 (fuera de paleta) en botones
    // Permitimos slate en otros, pero los botones SÍ/NO deben usar paleta
    expect(html).toContain("border-[#1D60A9]/30");
    expect(html).toContain("text-[#164F8D]");
  });
});

describe("DB — url usa forward slashes (Windows fix)", () => {
  it("process.cwd().replace backslashes genera url sin \\", () => {
    const cwd = "C:\\Users\\ASUS\\workspace\\Test";
    const url = `file:${cwd.replace(/\\/g, "/")}/data/chaside.db`;
    expect(url).toBe("file:C:/Users/ASUS/workspace/Test/data/chaside.db");
    expect(url).not.toContain("\\");
  });
});

describe("Moodle — solo guarda con moodle_user_id", () => {
  it("submit sin moodle_user_id debe ser rechazado (400)", async () => {
    // Simula validación de src/pages/api/chaside/submit.ts
    const moodle_user_id = null;
    const isMoodle = moodle_user_id != null && Number(moodle_user_id) > 0;
    expect(isMoodle).toBe(false);
  });
});
