import { useEffect, useState } from "react";

export type Tab = "resumen" | "chaside" | "personalidad" | "kuder" | "estudiantes" | "usuarios" | "cuenta";

export function useAdminData() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [overview, setOverview] = useState<any>(null);
  const [chaside, setChaside] = useState<any>(null);
  const [pers, setPers] = useState<any>(null);
  const [kuder, setKuder] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ email: "", password: "", first_name: "", last_name: "", role: "docente" as "admin" | "docente" });
  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);

  const authHeader = token ? `Token ${token}` : "";
  const isAdmin = currentUser?.role === "admin";
  const isDocente = currentUser?.role === "docente";

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("knox_token") : null;
    const u = typeof window !== "undefined" ? localStorage.getItem("knox_user") : null;
    try {
      if (u) {
        const parsed = JSON.parse(u);
        setCurrentUser(parsed);
        setEditEmail(parsed.email || "");
        setEditFirst(parsed.first_name || "");
        setEditLast(parsed.last_name || "");
      }
    } catch {}
    setToken(t);
    if (!t) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { headers: { Authorization: `Token ${t}` } });
        if (r.ok) {
          const j = await r.json();
          if (j.user) {
            setCurrentUser(j.user);
            localStorage.setItem("knox_user", JSON.stringify(j.user));
            setEditEmail(j.user.email || "");
            setEditFirst(j.user.first_name || "");
            setEditLast(j.user.last_name || "");
          }
        } else if (r.status === 401) {
          setNeedsLogin(true);
          setLoading(false);
        }
      } catch {}
    })();
  }, []);

  const load = async () => {
    const t = token || (typeof window !== "undefined" ? localStorage.getItem("knox_token") : null);
    const hdr: any = t ? { Authorization: `Token ${t}` } : {};
    try {
      if (t) {
        const me = await fetch("/api/auth/me", { headers: hdr });
        if (me.ok) {
          const j = await me.json();
          if (j.user) {
            setCurrentUser(j.user);
            localStorage.setItem("knox_user", JSON.stringify(j.user));
            setEditEmail(j.user.email || "");
            setEditFirst(j.user.first_name || "");
            setEditLast(j.user.last_name || "");
          }
        }
      } else {
        const uRaw = typeof window !== "undefined" ? localStorage.getItem("knox_user") : null;
        if (uRaw) setCurrentUser(JSON.parse(uRaw));
      }
    } catch {}
    setLoading(true);
    setError(null);
    try {
      const [oRes, sRes] = await Promise.all([
        fetch("/api/admin/overview", { headers: hdr }),
        fetch("/api/admin/estudiantes", { headers: hdr }),
      ]);
      if (oRes.status === 401 || sRes.status === 401) {
        setNeedsLogin(true);
        throw new Error("No autenticado — inicia sesión");
      }
      if (oRes.status === 403 || sRes.status === 403) throw new Error("No autorizado — rol insuficiente");
      if (!oRes.ok) throw new Error("No se pudo cargar overview");
      const o = await oRes.json();
      setOverview(o.overview);
      setChaside(o.chaside);
      setPers(o.personalidad);
      setKuder(o.kuder);
      if (sRes.ok) setStudents(await sRes.json());
      try {
        const uRes = await fetch("/api/users", { headers: hdr });
        if (uRes.ok) setUsers(await uRes.json());
        else if (uRes.status === 403) setUsers([]);
        else setUsers([]);
      } catch {
        setUsers([]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const openDetail = async (id: string) => {
    const r = await fetch(`/api/admin/estudiante/${id}`, { headers: { Authorization: authHeader } });
    setSelected(await r.json());
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", headers: { Authorization: authHeader } });
    localStorage.removeItem("knox_token");
    localStorage.removeItem("knox_user");
    localStorage.removeItem("knox_expiry");
    window.location.href = "/admin/login";
  };
  const logoutAll = async () => {
    await fetch("/api/auth/logoutall", { method: "POST", headers: { Authorization: authHeader } });
    localStorage.removeItem("knox_token");
    localStorage.removeItem("knox_user");
    localStorage.removeItem("knox_expiry");
    window.location.href = "/admin/login";
  };

  return {
    tab, setTab,
    overview, chaside, pers, kuder, students, selected, setSelected,
    loading, error, needsLogin, users, newUser, setNewUser, pwOld, setPwOld, pwNew, setPwNew,
    token, currentUser, setCurrentUser, editEmail, setEditEmail, editFirst, setEditFirst, editLast, setEditLast, editSaving, setEditSaving, editMsg, setEditMsg,
    authHeader, isAdmin, isDocente, load, openDetail, logout, logoutAll,
  };
}
