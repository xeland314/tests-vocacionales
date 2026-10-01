import React from 'react';
export function ChasideGate({ gateChecked, isMoodle, moodleUserId }: { gateChecked: boolean; isMoodle: boolean; moodleUserId: number | null }) {
  if (!gateChecked) {
    return <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-8"><p className="text-sm text-[#164F8D]">Detectando entorno...</p></div>;
  }
  if (!isMoodle || !moodleUserId) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#E1E3DA] border border-[#164F8D]/10 rounded-2xl p-8 text-center">
          <img src="/logo-fucsia.png" alt="TEAM GGM" className="h-10 mx-auto mb-4" />
          <h1 className="text-6xl font-black text-[#1D60A9]" style={{ fontFamily: "Poppins" }}>404</h1>
          <p className="text-sm text-[#164F8D] mt-2">Página no encontrada.</p>
          <a href="/" className="mt-4 inline-block bg-[#1D60A9] hover:bg-[#164F8D] text-white px-6 py-2.5 rounded-full font-bold">Ir al inicio</a>
        </div>
      </div>
    );
  }
  return null;
}
