import React from 'react';
import { UserPlus, Users } from "lucide-react";

export function UsuariosTab({ users, newUser, setNewUser, authHeader, load, isAdmin }: any) {
  if (!isAdmin) return <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center"><p className="font-black text-amber-800">Acceso restringido</p><p className="text-sm text-amber-700 mt-1">Solo <b>admin</b> puede gestionar usuarios.</p></div>;
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-white border rounded-2xl p-5">
        <h3 className="font-black text-sm flex items-center gap-2"><Users size={16} />Usuarios — Admin crea múltiples</h3>
        <p className="text-xs text-slate-500 mt-1">Crea docentes o más admins. Usa email como usuario. Contraseña ≥8.</p>
        <div className="mt-4 bg-[#E1E3DA] border-2 border-dashed border-[#1D60A9]/20 rounded-2xl p-4">
          <h4 className="font-black text-sm flex items-center gap-2"><UserPlus size={16} className="text-[#1D60A9]" />Crear nuevo usuario</h4>
          <div className="mt-3 grid md:grid-cols-2 gap-2">
            <input placeholder="email (usuario) *" value={newUser.email} onChange={e => setNewUser((s: any) => ({ ...s, email: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="contraseña ≥8 *" type="password" value={newUser.password} onChange={e => setNewUser((s: any) => ({ ...s, password: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="nombre" value={newUser.first_name} onChange={e => setNewUser((s: any) => ({ ...s, first_name: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="apellido" value={newUser.last_name} onChange={e => setNewUser((s: any) => ({ ...s, last_name: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
            <select value={newUser.role} onChange={e => setNewUser((s: any) => ({ ...s, role: e.target.value as any }))} className="border rounded-lg px-3 py-2 text-sm bg-white">
              <option value="docente">docente — solo revisa formularios</option>
              <option value="admin">admin — gestiona usuarios y datos</option>
            </select>
            <button onClick={async () => { if (!newUser.email || !newUser.password) { alert("email y contraseña requeridos"); return; } const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify(newUser) }); if (r.ok) { setNewUser({ email: "", password: "", first_name: "", last_name: "", role: "docente" }); load(); } else alert((await r.json()).error); }} className="bg-[#1D60A9] text-white px-4 py-2 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2"><UserPlus size={16} />Crear usuario</button>
          </div>
        </div>
        <div className="mt-4">
          <h4 className="font-black text-xs uppercase tracking-wider text-slate-500">Lista de usuarios ({users.length})</h4>
          <div className="mt-2 space-y-2 max-h-80 overflow-auto">
            {users.map((u: any) => (
              <div key={u.id} className="flex justify-between items-center border-b py-2 text-sm gap-2">
                <span className="flex-1"><span className="font-bold">{u.email}</span> <span className={`ml-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${u.role === 'admin' ? 'bg-[#1D60A9] text-white border-[#1D60A9]' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>{u.role}</span> <span className="text-xs text-slate-500">({[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"})</span></span>
                <div className="flex gap-1 items-center">
                  <select value={u.role} onChange={async e => { const newRole = e.target.value; if (!confirm(`Cambiar ${u.email} a ${newRole}?`)) return; const r = await fetch(`/api/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify({ role: newRole }) }); if (!r.ok) alert((await r.json()).error); else load(); }} className="text-xs border rounded-full px-2 py-1 bg-white">
                    <option value="admin">admin</option>
                    <option value="docente">docente</option>
                  </select>
                  <button onClick={async () => { if (!confirm("Eliminar " + u.email + "?")) return; const r = await fetch(`/api/users/${u.id}`, { method: "DELETE", headers: { Authorization: authHeader } }); if (!r.ok) alert((await r.json()).error); else load(); }} className="text-red-600 text-xs font-bold">Eliminar</button>
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-xs text-slate-500">Sin usuarios</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
