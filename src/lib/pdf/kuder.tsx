import React from 'react';
import satori from 'satori';
import { PDFDocument } from 'pdf-lib';
import { getSatoriFonts, getLogoDataUrl } from './fonts';
import { KUDER_AREAS, KUDER_ORDER } from '../../data/kuder';
import type { calculateKuder } from '../../data/kuderScoring';

type Result = ReturnType<typeof calculateKuder>;

function KuderDoc({ result, studentName, date, logo, isTeacher }: { result: Result; studentName: string; date: string; logo: string; isTeacher?: boolean }) {
  const topInfo = (KUDER_AREAS as any)[result.top];
  const maxScore = Math.max(...KUDER_ORDER.map(k => (result.scores as any)[k]), 1);
  return (
    <div style={{ width: '794px', minHeight: '1123px', backgroundColor: '#ffffff', fontFamily: 'Inter, sans-serif', padding: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <img src={logo} width={120} height={32} style={{ objectFit: 'contain' }} />
        <div style={{ textAlign: 'right', fontSize: 10, color: '#0f2b6b' }}>
          <div style={{ fontWeight: 700 }}>TEAM GGM</div>
          <div>Test Kuder — 10 áreas</div>
          <div>{date}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, backgroundColor: topInfo.color, color: '#ffffff', borderRadius: 12, padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, opacity: 0.9 }}>{topInfo.key} · {topInfo.nombreCorto.toUpperCase()}</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{topInfo.nombre}</div>
        <div style={{ fontSize: 9, marginTop: 6, lineHeight: 1.4 }}>{topInfo.descripcion}</div>
        <div style={{ fontSize: 8, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>Carreras: {topInfo.carreras}</div>
        <div style={{ fontSize: 10, fontWeight: 800, marginTop: 8 }}>{(result.scores as any)[result.top]}/60</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#001d62', letterSpacing: 0.5 }}>RANKING 10 ÁREAS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {result.ranking.map(k => {
            const info = (KUDER_AREAS as any)[k];
            const w = Math.round(((result.scores as any)[k] / maxScore) * 100);
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, fontSize: 9, fontWeight: 800 }}>{k}</div>
                <div style={{ flex: 1, height: 14, backgroundColor: '#e2e8f0', borderRadius: 7, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${w}%`, backgroundColor: info.color, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6, color: '#ffffff', fontSize: 7, fontWeight: 700 }}>{(result.scores as any)[k] > 0 ? (result.scores as any)[k] : ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isTeacher && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {KUDER_ORDER.map(k => {
            const info = (KUDER_AREAS as any)[k];
            const isTop = k === result.top;
            return (
              <div key={k} style={{ width: 72, border: `1px solid ${isTop ? '#001d62' : '#e2e8f0'}`, borderRadius: 8, padding: 6, backgroundColor: isTop ? '#001d62' : '#fcfcfc', color: isTop ? '#ffffff' : '#001d62', textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 800 }}>{k}</div>
                <div style={{ fontSize: 7, fontWeight: 700 }}>{info.nombre}</div>
                <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2 }}>{(result.scores as any)[k]}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#64748b' }}>
        <div>Estudiante: <span style={{ fontWeight: 700, color: '#001d62' }}>{studentName}</span> · {date}</div>
        <div>TEAM GGM · Verif: {result.verificacion}</div>
      </div>
    </div>
  );
}

async function renderPdf(element: React.ReactElement, filename: string) {
  const fonts = await getSatoriFonts();
  if (!fonts.length) throw new Error("Satori fonts not loaded — fallback to html2pdf");
  const logo = await getLogoDataUrl();
  const withLogo = React.cloneElement(element as any, { logo });
  const svg = await satori(withLogo as any, { width: 794, height: 1123, fonts });
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
}

export async function generateKuderStudentPdf(result: Result, studentName: string, date: string) {
  const logo = await getLogoDataUrl();
  return renderPdf(<KuderDoc result={result} studentName={studentName} date={date} logo={logo} />, `KUDER_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
}
export async function generateKuderTeacherPdf(result: Result, studentName: string, date: string) {
  const logo = await getLogoDataUrl();
  return renderPdf(<KuderDoc result={result} studentName={studentName} date={date} logo={logo} isTeacher />, `KUDER_DOCENTE_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
}
