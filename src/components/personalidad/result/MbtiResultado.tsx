import { TYPES } from "../../../data/personalidad";
import type { PersonalityResult } from "../../../data/personalidadScoring";
import type { IdentityScore } from "../../../data/mbti/identity";
import { MBTI_PROFILES, MBTI_IMAGE } from "../../../data/mbti";
import { buildGauges } from "../../../data/mbti/gauges";
import { Printer } from "lucide-react";
import { MbtiHero } from "./MbtiHero";
import { MbtiRasgos } from "./MbtiRasgos";
import { MbtiCaracteristicas } from "./MbtiCaracteristicas";
import { MbtiSeccion } from "./MbtiSeccion";

type ResultadoConIdentidad = PersonalityResult & { identity: IdentityScore };

export default function MbtiResultado({
  result,
  savedAt,
  error,
  saving,
  alreadyCompleted,
  onPrint,
}: {
  result: ResultadoConIdentidad;
  savedAt: string;
  error: string | null;
  saving: boolean;
  alreadyCompleted: boolean;
  onPrint: () => void;
}) {
  const info = TYPES[result.type];
  const profile = MBTI_PROFILES[result.type];
  const identity = result.identity;
  const gauges = buildGauges(result, identity);

  return (
    <div className="min-h-screen bg-[#F9F9FB]">
      {alreadyCompleted && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">
          Ya completaste este test. Mostrando resultado guardado.
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <img src="/logo-fucsia.png" alt="TEAM GGM" className="h-9 w-auto" />
          <button
            onClick={onPrint}
            className="bg-[#001d62] hover:bg-[#0f2b6b] text-white font-bold px-5 py-2.5 rounded-full text-sm inline-flex items-center gap-2 transition"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
        {savedAt && <p className="text-xs text-[#0f2b6b] mb-2">Guardado: <span className="font-bold">{savedAt}</span></p>}
        {error && <p className="text-xs text-red-600 font-bold mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        {saving && <p className="text-xs text-[#0f2b6b] mb-3">Guardando...</p>}

        <MbtiHero info={info} profile={profile} identity={identity} code={result.type} intro={profile.intro} />

        <MbtiRasgos gauges={gauges} color={info.color} />

        <MbtiCaracteristicas
          gauges={gauges}
          profile={profile}
          color={info.color}
          identityLetter={identity.letter}
        />

        <MbtiSeccion
          numero={2}
          titulo="Tu Trayectoria Profesional"
          imagen={MBTI_IMAGE.dark(result.type)}
          caption={profile.career.caption}
          paragraphs={profile.career.paragraphs}
          influential={profile.career.influential}
          strengths={profile.career.strengths}
          weaknesses={profile.career.weaknesses}
          listas={[
            { titulo: "Ideas de carrera que podrías amar", items: profile.career.careerIdeas },
            { titulo: "Estilos de trabajo que se adaptan a ti", items: profile.career.workStyles },
          ]}
          color={info.color}
        />

        <MbtiSeccion
          numero={3}
          titulo="Tu Crecimiento Personal"
          imagen={MBTI_IMAGE.light(result.type)}
          caption={profile.growth.caption}
          paragraphs={profile.growth.paragraphs}
          influential={profile.growth.influential}
          strengths={profile.growth.strengths}
          weaknesses={profile.growth.weaknesses}
          listas={[
            { titulo: "Lo que te da energía", items: profile.growth.energyGivers },
            { titulo: "Lo que te agota", items: profile.growth.energyDrainers },
          ]}
          color={info.color}
        />

        <p className="mt-8 text-xs text-[#0f2b6b]/50 text-center">
          Para volver a rendir, solicita habilitación al administrador.
        </p>
      </div>
    </div>
  );
}
