import type { TypeInfo, PersonalityTypeCode } from "../../../data/personalidad";
import type { IdentityScore } from "../../../data/mbti/identity";
import type { MbtiTypeProfile } from "../../../data/mbti/types";
import { MBTI_IMAGE } from "../../../data/mbti";

export function MbtiHero({
  info,
  profile,
  identity,
  code,
  intro,
}: {
  info: TypeInfo;
  profile: MbtiTypeProfile;
  identity: IdentityScore;
  code: PersonalityTypeCode;
  intro: string[];
}) {
  const suffix = `${code}-${identity.letter}`;
  return (
    <section className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
      <div className="h-1.5" style={{ background: info.color }} />
      <div className="p-6 sm:p-8 grid gap-6 md:grid-cols-[220px_1fr] items-center">
        <div className="mx-auto w-44 sm:w-52">
          <img
            src={MBTI_IMAGE.named(code)}
            alt={`${profile.title} (${suffix})`}
            width={208}
            height={208}
            className="w-full aspect-square object-cover rounded-2xl border-4 border-[#fcfcfc] shadow"
          />
        </div>
        <div className="text-center md:text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d8215d]">Tipo de personalidad</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight" style={{ color: info.color }}>
            {profile.title} ({suffix})
          </h1>
          <p className="mt-3 text-slate-700 font-semibold">{info.tagline}</p>
          <p className="mt-2 text-sm text-slate-500">{info.description}</p>
        </div>
      </div>
      <div className="px-6 sm:px-8 pb-8">
        <p className="text-sm text-slate-600">
          Revisa los resultados de este test de personalidad y conoce más detalles sobre este tipo de personalidad y sus rasgos fundamentales.
        </p>
        <div className="mt-4 space-y-3">
          {intro.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-[#1f3875]">{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
