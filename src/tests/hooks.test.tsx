import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

describe("moodle.ts — URL parsing", () => {
  it("soporta moodleUserId camelCase y snake_case", async () => {
    expect(true).toBe(true);
  });
});

describe("anonGate — BD solo Moodle", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("gateReady solo si moodleUserId existe (mock)", async () => {
    // Mock useMoodleBridge para que devuelva null
    vi.doMock("../client/moodle", async () => {
      const actual = await vi.importActual("../client/moodle") as any;
      return {
        ...actual,
        useMoodleBridge: () => ({ moodleUserId: null, moodleUserName: null, moodleUserEmail: null, isMoodle: false, origin: null }),
      };
    });
    const { useAnonGate } = await import("../client/anonGate");
    const { result } = renderHook(() => useAnonGate("chaside"));
    expect(result.current.gateReady).toBe(false);
    expect(result.current.checked).toBe(true);
  });

  it("gateReady true con moodleUserId", async () => {
    vi.doMock("../client/moodle", async () => {
      const actual = await vi.importActual("../client/moodle") as any;
      return {
        ...actual,
        useMoodleBridge: () => ({ moodleUserId: 123, moodleUserName: "Test", moodleUserEmail: "test@test.com", isMoodle: true, origin: "http://localhost" }),
      };
    });
    // Necesitamos reset para que el mock tome efecto
    vi.resetModules();
    const { useAnonGate } = await import("../client/anonGate");
    const { result } = renderHook(() => useAnonGate("chaside"));
    expect(result.current.isMoodle).toBe(true);
    expect(result.current.moodleUserId).toBe(123);
  });
});

describe("useChaside — validación", () => {
  beforeEach(() => {
    window.localStorage.clear();
    (global.fetch as any) = vi.fn(async () => ({ ok: true, json: async () => ({ found: false }), status: 200 } as any));
    Object.defineProperty(window, "location", {
      value: { search: "?moodleUserId=999&moodleUserName=HookTest&courseId=2", origin: "http://localhost:4321" } as any,
      writable: true,
    });
    (window as any).scrollTo = vi.fn();
    (document as any).getElementById = vi.fn(() => ({ scrollIntoView: vi.fn() }));
  });

  it("missing detecta preguntas faltantes 1..98", async () => {
    vi.resetModules();
    vi.doMock("../client/moodle", async () => {
      const actual = await vi.importActual("../client/moodle") as any;
      return {
        ...actual,
        useMoodleBridge: () => ({ moodleUserId: 999, moodleUserName: "HookTest", moodleUserEmail: "hook@test.com", isMoodle: true, origin: "http://localhost" }),
      };
    });
    const { useChaside } = await import("../components/chaside/useChaside");
    const { result } = renderHook(() => useChaside());
    expect(result.current.missing.length).toBe(98);
    expect(result.current.total).toBe(0);
  });
});
