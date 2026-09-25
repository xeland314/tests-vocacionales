import type { APIRoute } from "astro";
import { authenticateToken, canEnableRetake } from "../../../../lib/auth";
import { habilitarReintentoAdmin, revocarReintentoAdmin } from "../../../../lib/admin";
import type { TestCodigo } from "../../../../lib/reintentos";

export const prerender = false;

const CODIGOS: TestCodigo[] = ["CHASIDE", "PERSONALIDAD", "KUDER"];

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function esCodigo(v: any): v is TestCodigo {
  return CODIGOS.includes(v);
}

// Habilita un reintento (no borra intentos previos) — admin y docente (canEnableRetake)
export const POST: APIRoute = async ({ request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return json({ error: "No autenticado" }, 401);
  if (!canEnableRetake(auth.user)) return json({ error: "No autorizado para habilitar reintentos" }, 403);

  const body = await request.json().catch(() => ({} as any));
  const { estudiante_id, test_codigo, motivo, ventana_desde, ventana_hasta } = body ?? {};
  if (!estudiante_id) return json({ error: "estudiante_id requerido" }, 400);
  if (!esCodigo(test_codigo)) return json({ error: "test_codigo inválido (CHASIDE|PERSONALIDAD|KUDER)" }, 400);

  try {
    const row = await habilitarReintentoAdmin(
      String(estudiante_id),
      test_codigo,
      auth.user.id,
      motivo ? String(motivo).trim() || undefined : undefined,
      ventana_desde ? String(ventana_desde) : undefined,
      ventana_hasta ? String(ventana_hasta) : undefined
    );
    return json({ ok: true, reintento: row });
  } catch (e: any) {
    return json({ error: e.message }, 409);
  }
};

// Revoca un reintento pendiente (habilitado por error)
export const DELETE: APIRoute = async ({ url, request }) => {
  const auth = await authenticateToken(request.headers.get("authorization"));
  if (!auth) return json({ error: "No autenticado" }, 401);
  if (!canEnableRetake(auth.user)) return json({ error: "No autorizado para revocar reintentos" }, 403);

  const estudiante_id = url.searchParams.get("estudiante_id");
  const test_codigo = url.searchParams.get("test_codigo");
  if (!estudiante_id || !esCodigo(test_codigo)) return json({ error: "estudiante_id y test_codigo requeridos" }, 400);

  const ok = await revocarReintentoAdmin(String(estudiante_id), test_codigo);
  return json({ ok, revocado: ok });
};
