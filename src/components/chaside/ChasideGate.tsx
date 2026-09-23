export function ChasideGate({ gateChecked, isMoodle, moodleUserId }: { gateChecked: boolean; isMoodle: boolean; moodleUserId: number | null }) {
  if (!gateChecked) {
    return <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-8"><p className="text-sm text-[#0f2b6b]">Detectando entorno...</p></div>;
  }
  if (!isMoodle || !moodleUserId) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#fcfcfc] border border-[#0f2b6b]/10 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-black text-[#001d62]" style={{ fontFamily: "Poppins" }}>Accede desde Moodle</h2>
          <p className="text-sm text-[#0f2b6b] mt-2">Este test solo guarda datos de Moodle (<b>nombre completo y email</b>). Debes abrirlo dentro del curso de Moodle vía iframe con <code>?moodleUserId=&amp;moodleUserName=&amp;moodleUserEmail=</code>.</p>
          <p className="text-xs text-[#0f2b6b]/60 mt-3">No se solicita teléfono ni se expone ID en el PDF.</p>
          <a href="/" className="mt-4 inline-block bg-[#001d62] hover:bg-[#0f2b6b] text-white px-6 py-2.5 rounded-full font-bold">← Volver</a>
        </div>
      </div>
    );
  }
  return null;
}
