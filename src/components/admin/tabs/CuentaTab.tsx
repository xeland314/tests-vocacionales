export function CuentaTab({ currentUser, isAdmin, editEmail, setEditEmail, editFirst, setEditFirst, editLast, setEditLast, editSaving, setEditSaving, editMsg, setEditMsg, pwOld, setPwOld, pwNew, setPwNew, authHeader, load, setCurrentUser }: any) {
  return (
    <div className="mt-6 grid md:grid-cols-2 gap-4">
      <div className="bg-white border rounded-2xl p-5">
        <h3 className="font-black text-sm">Mi cuenta — Cambiar usuario</h3>
        <p className="text-xs text-slate-500">Tu rol: <span className={`font-black px-2 py-0.5 rounded-full text-xs ${isAdmin ? "bg-[#001d62] text-white" : "bg-amber-100 text-amber-800"}`}>{currentUser?.role}</span></p>
        {editMsg && <p className="mt-2 text-xs font-bold px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700">{editMsg}</p>}
        <div className="mt-3 space-y-2">
          <div><label className="text-xs font-bold uppercase">Email (usuario)</label><input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs font-bold uppercase">Nombre</label><input value={editFirst} onChange={e => setEditFirst(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-bold uppercase">Apellido</label><input value={editLast} onChange={e => setEditLast(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <button disabled={editSaving} onClick={async () => { setEditSaving(true); setEditMsg(null); try { const r = await fetch(`/api/users/${currentUser.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify({ email: editEmail, first_name: editFirst, last_name: editLast }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setCurrentUser(j); localStorage.setItem("knox_user", JSON.stringify(j)); setEditMsg("Usuario actualizado ✓"); load(); } catch (e: any) { alert(e.message); } finally { setEditSaving(false); } }} className="w-full bg-[#001d62] text-white py-2 rounded-full text-sm font-bold disabled:opacity-60">{editSaving ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </div>
      <div className="bg-white border rounded-2xl p-5">
        <h3 className="font-black text-sm">Cambiar mi contraseña</h3>
        <p className="text-xs text-slate-500">Requiere tu contraseña actual. Mínimo 8 caracteres.</p>
        <div className="mt-3 space-y-2">
          <input placeholder="Contraseña actual" type="password" value={pwOld} onChange={e => setPwOld(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Nueva contraseña (≥8)" type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <button onClick={async () => { const r = await fetch("/api/users/change-password", { method: "POST", headers: { "Content-Type": "application/json", Authorization: authHeader }, body: JSON.stringify({ old_password: pwOld, new_password: pwNew }) }); const j = await r.json(); if (r.ok) { alert("Contraseña cambiada ✓"); setPwOld(""); setPwNew(""); } else alert(j.error); }} className="w-full bg-[#001d62] text-white py-2 rounded-full text-sm font-bold">Cambiar contraseña</button>
        </div>
      </div>
    </div>
  );
}
