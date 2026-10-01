import React from 'react';
import satori from 'satori';
import { PDFDocument } from 'pdf-lib';
import { getSatoriFonts, getLogoDataUrl } from './fonts';
import { TYPES } from '../../data/personalidad';
import type { calculatePersonality } from '../../data/personalidadScoring';

type Result = ReturnType<typeof calculatePersonality>;

function MbtiDoc({ result, studentName, date, logo, isTeacher }: { result: Result; studentName: string; date: string; logo: string; isTeacher?: boolean }) {
  const info = (TYPES as any)[result.type];
  return (
    <div style={{ width: '794px', minHeight: '1123px', backgroundColor: '#ffffff', fontFamily: 'Inter, sans-serif', padding: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <img src={logo} width={120} height={32} style={{ objectFit: 'contain' }} />
        <div style={{ textAlign: 'right', fontSize: 10, color: '#164F8D', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontWeight: 700 }}>TEAM GGM</div>
          <div>Test de Personalidad · 16 tipos</div>
          <div>{date}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, textAlign: 'center', backgroundColor: '#E1E3DA', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: '#64748b' }}>{info.role.toUpperCase()}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: info.color, marginTop: 4 }}>{result.type} — {info.name}</div>
        <div style={{ fontSize: 10, color: '#164F8D', marginTop: 4 }}>{info.tagline}</div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 8, lineHeight: 1.4 }}>{info.description}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginTop: 8 }}>
          {info.strengths.map((s: string) => (
            <div key={s} style={{ fontSize: 7, fontWeight: 700, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '2px 6px' }}>{s}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(["EI", "SN", "TF", "JP"] as const).map(d => {
          const sc = (result.dimensions as any)[d];
          const label = d === "EI" ? "Mente E/I" : d === "SN" ? "Energía S/N" : d === "TF" ? "Naturaleza T/F" : "Táctica J/P";
          const left = d === "EI" ? "I Introvertido" : d === "SN" ? "N Intuitivo" : d === "TF" ? "F Sentimiento" : "P Prospección";
          const right = d === "EI" ? "E Extravertido" : d === "SN" ? "S Observador" : d === "TF" ? "T Pensamiento" : "J Juzgador";
          return (
              <div key={d} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 8, fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                <span>{label}: {sc.letter} {sc.percent}%</span>
                <span>{sc.raw > 0 ? `+${sc.raw}` : sc.raw}/45</span>
              </div>
              <div style={{ marginTop: 4, height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${sc.percent}%`, backgroundColor: info.color }} />
                <div style={{ width: `${100 - sc.percent}%`, backgroundColor: '#e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#64748b', marginTop: 2 }}>
                <span>{left}</span><span>{right}</span>
              </div>
            </div>
          );
        })}
      </div>

      {isTeacher && (
        <div style={{ marginTop: 12, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: '#1D60A9' }}>Leyenda MBTI — docente</div>
          <div style={{ fontSize: 7, color: '#475569', marginTop: 4 }}>
            E Extravertido (energía con gente) vs I Introvertido (a solas) · S Observador vs N Intuitivo · T Pensamiento vs F Sentimiento · J Juzgador vs P Prospección · 50% neutral, &gt;60% ligera, &gt;75% marcada
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#64748b' }}>
        <div style={{ display: 'flex', flexDirection: 'row' }}><span>Estudiante: </span><span style={{ fontWeight: 700, color: '#1D60A9', marginLeft: 2, marginRight: 2 }}>{studentName}</span><span> · {date}</span></div>
        <div>TEAM GGM</div>
      </div>
    </div>
  );
}

async function renderPdf(element: React.ReactElement, filename: string) {
  try {
  const fonts = await getSatoriFonts();
  if (!fonts.length) throw new Error("Satori fonts not loaded — fallback to html2pdf");
  const logo = await getLogoDataUrl();
  const withLogo = React.cloneElement(element as any, { logo });
  let svg: string;
  try {
    svg = await satori(withLogo as any, { width: 794, height: 1123, fonts });
  } catch (e) {
    console.warn("satori failed, fallback to print", e);
    window.print();
    return;
  }
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([794, 1123]);
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.src = url;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  const canvas = document.createElement('canvas');
  canvas.width = 794; canvas.height = 1123;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 794, 1123);
  ctx.drawImage(img, 0, 0, 794, 1123);
  const pngDataUrl = canvas.toDataURL('image/png');
  const pngImage = await pdf.embedPng(pngDataUrl);
  page.drawImage(pngImage, { x: 0, y: 0, width: 794, height: 1123 });
  const bytes = await pdf.save();
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(url);
  } catch (err) {
    console.warn("renderPdf failed, fallback print", err);
    window.print();
  }
}

export async function generateMbtiStudentPdf(result: Result, studentName: string, date: string) {
  const logo = await getLogoDataUrl();
  return renderPdf(<MbtiDoc result={result} studentName={studentName} date={date} logo={logo} />, `MBTI_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
}
export async function generateMbtiTeacherPdf(result: Result, studentName: string, date: string) {
  const logo = await getLogoDataUrl();
  return renderPdf(<MbtiDoc result={result} studentName={studentName} date={date} logo={logo} isTeacher />, `MBTI_DOCENTE_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
}
