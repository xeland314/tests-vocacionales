import { TYPES } from "../../data/personalidad";
import type { PersonalityResult } from "../../data/personalidadScoring";
import type { IdentityScore } from "../../data/mbti/identity";
import { MBTI_PROFILES, MBTI_IMAGE } from "../../data/mbti";
import { buildGauges } from "../../data/mbti/gauges";
import { MbtiHero } from "../../components/personalidad/result/MbtiHero";
import { MbtiRasgos } from "../../components/personalidad/result/MbtiRasgos";
import { MbtiCaracteristicas } from "../../components/personalidad/result/MbtiCaracteristicas";
import { MbtiSeccion } from "../../components/personalidad/result/MbtiSeccion";

export default function InformeMbti({
  result,
  footerNote,
}: {
  result: PersonalityResult & { identity: IdentityScore };
  footerNote?: string | null;
}) {
  const info = TYPES[result.type];
  const profile = MBTI_PROFILES[result.type];
  const identity = result.identity;
  const gauges = buildGauges(result, identity);

  return (
    <>
      <MbtiHero info={info} profile={profile} identity={identity} code={result.type} intro={profile.intro} />

      <MbtiRasgos gauges={gauges} color={info.color} />

      <MbtiCaracteristicas gauges={gauges} profile={profile} color={info.color} identityLetter={identity.letter} />

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

      {footerNote && <p className="mt-8 text-xs text-[#164F8D]/50 text-center print:hidden">{footerNote}</p>}
    </>
  );
}
