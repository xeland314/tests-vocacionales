import { useAdminData } from "./admin/useAdminData";
import { ResumenTab } from "./admin/tabs/ResumenTab";
import { ChasideTab } from "./admin/tabs/ChasideTab";
import { PersonalidadTab } from "./admin/tabs/PersonalidadTab";
import { KuderTab } from "./admin/tabs/KuderTab";
import { EstudiantesTab } from "./admin/tabs/EstudiantesTab";
import { UsuariosTab } from "./admin/tabs/UsuariosTab";
import { CuentaTab } from "./admin/tabs/CuentaTab";
import { EstudianteDetailModal } from "./admin/EstudianteDetailModal";

export default function AdminGeneral() {
  const {
    tab, setTab,
    overview, chaside, pers, kuder, students, selected, setSelected,
    loading, error, needsLogin, users, newUser, setNewUser, pwOld, setPwOld, pwNew, setPwNew,
    currentUser, setCurrentUser, editEmail, setEditEmail, editFirst, setEditFirst, editLast, setEditLast, editSaving, setEditSaving, editMsg, setEditMsg,
    authHeader, isAdmin, isDocente, load, openDetail, logout, logoutAll,
  } = useAdminData();

  if (needsLogin) return <div className="max-w-md mx-auto mt-12 bg-white border rounded-2xl p-6 text-center"><p className="font-bold">Sesión requerida</p><p className="text-sm text-slate-500 mt-1">Debes iniciar sesión (Knox token).</p><a href="/admin/login" className="mt-4 inline-block bg-[#001d62] text-white px-6 py-2 rounded-full font-bold">Ir a Login</a></div>;
  if (loading) return <div className="p-8 text-center text-slate-600">Cargando panel general…</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error} <button onClick={load} className="ml-2 underline">Reintentar</button> <a href="/admin/login" className="ml-2 underline">Login</a></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl font-black" style={{ fontFamily: "Poppins" }}>Panel {isDocente ? "Docente" : "Admin"} — General</h1>
        {currentUser && <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isAdmin ? "bg-[#001d62] text-white border-[#001d62]" : "bg-amber-100 text-amber-800 border-amber-200"}`}>{currentUser.email} · {currentUser.role}</span>}
        <span className="bg-[#001d62] text-white text-xs font-bold px-3 py-1 rounded-full">{students.length} estudiantes</span>
        <span className="bg-[#001d62] text-white text-xs font-bold px-3 py-1 rounded-full">CHASIDE {overview?.totalChaside ?? 0}</span>
        <span className="bg-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full">MBTI {overview?.totalPersonalidad ?? 0}</span>
        <span className="bg-[#2563EB] text-white text-xs font-bold px-3 py-1 rounded-full">Kuder {overview?.totalKuder ?? 0}</span>
        <div className="ml-auto flex gap-2 flex-wrap">
          <a href="/" className="bg-white border-2 border-slate-300 font-bold px-4 py-2 rounded-full text-sm">← Menú</a>
          <button onClick={load} className="bg-[#1f3875] text-white font-bold px-4 py-2 rounded-full text-sm">↻ Actualizar</button>
          {isAdmin && <button onClick={async () => { await fetch("/api/chaside/init", { headers: { Authorization: authHeader } }); load(); }} className="bg-slate-100 border font-bold px-4 py-2 rounded-full text-sm">Init DB</button>}
          <button onClick={logout} className="bg-white border font-bold px-4 py-2 rounded-full text-sm">Logout</button>
          <button onClick={logoutAll} className="bg-red-50 border border-red-200 text-red-700 font-bold px-4 py-2 rounded-full text-sm">Logout All</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {([
          ["resumen", "Resumen"],
          ["chaside", "CHASIDE"],
          ["personalidad", "Personalidad"],
          ["kuder", "Kuder"],
          ["estudiantes", "Estudiantes"],
          ...(isAdmin ? [["usuarios", "Usuarios"] as const] : []),
          ["cuenta", "Mi cuenta"],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k as any)} className={`px-5 py-2.5 rounded-full font-black text-sm whitespace-nowrap border-2 ${tab === k ? "bg-[#001d62] text-white border-[#001d62]" : "bg-white border-slate-200 hover:border-slate-300"}`}>{label}</button>
        ))}
      </div>
      {isDocente && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">Rol <b>docente</b>: solo lectura. Gestión de usuarios solo <b>admin</b>. Cambia tu clave en <b>Mi cuenta</b>.</p>}

      {tab === "resumen" && <ResumenTab overview={overview} students={students} />}
      {tab === "chaside" && <ChasideTab chaside={chaside} />}
      {tab === "personalidad" && <PersonalidadTab pers={pers} />}
      {tab === "kuder" && <KuderTab kuder={kuder} />}
      {tab === "estudiantes" && <EstudiantesTab students={students} openDetail={openDetail} />}
      {tab === "usuarios" && <UsuariosTab users={users} newUser={newUser} setNewUser={setNewUser} authHeader={authHeader} load={load} isAdmin={isAdmin} />}
      {tab === "cuenta" && <CuentaTab currentUser={currentUser} isAdmin={isAdmin} editEmail={editEmail} setEditEmail={setEditEmail} editFirst={editFirst} setEditFirst={setEditFirst} editLast={editLast} setEditLast={setEditLast} editSaving={editSaving} setEditSaving={setEditSaving} editMsg={editMsg} setEditMsg={setEditMsg} pwOld={pwOld} setPwOld={setPwOld} pwNew={pwNew} setPwNew={setPwNew} authHeader={authHeader} load={load} setCurrentUser={setCurrentUser} />}

      <EstudianteDetailModal selected={selected} setSelected={setSelected} authHeader={authHeader} load={load} isAdmin={isAdmin} />
    </div>
  );
}
