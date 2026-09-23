import React from 'react';
import satori from 'satori';
import { PDFDocument } from 'pdf-lib';
import { getSatoriFonts, getLogoDataUrl } from './fonts';
import { AREAS, AREA_ORDER } from '../../data/chaside';
import type { calculateScores } from '../../data/scoring';

type Result = ReturnType<typeof calculateScores>;

function ChasideDoc({ result, studentName, date, logo, isTeacher }: { result: Result; studentName: string; date: string; logo: string; isTeacher?: boolean }) {
  const topI = result.topInteres;
  const secondI = result.segundoInteres;
  const topA = result.topAptitud;
  return (
    <div style={{ width: '794px', minHeight: '1123px', backgroundColor: '#ffffff', color: '#001d62', fontFamily: 'Inter, sans-serif', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <img src={logo} width={120} height={32} style={{ objectFit: 'contain' }} />
        <div style={{ textAlign: 'right', fontSize: 10, color: '#0f2b6b', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontWeight: 700 }}>TEAM GGM</div>
          <div>Test Vocacional CHASIDE</div>
          <div>{date}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, backgroundColor: '#fcfcfc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: '#001d62' }}>CÓMO LEER TU RESULTADO</div>
        <div style={{ fontSize: 9, color: '#0f2b6b', marginTop: 4 }}>CHASIDE mide 7 áreas vocacionales. Cada letra es un área. Intereses 0–10, Aptitudes 0–4.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {AREA_ORDER.map(k => {
            const info = (AREAS as any)[k];
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 6px' }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: info.color, color: '#ffffff', fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k}</div>
                <div style={{ fontSize: 7, lineHeight: 1, display: 'flex', flexDirection: 'column' }}><div style={{ fontWeight: 700 }}>{info.nombre}</div><div style={{ color: '#64748b' }}>{info.nombreCorto}</div></div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#001d62' }}>Intereses</div>
        {result.intereses[topI] === 0 ? (
          <div style={{ fontSize: 9, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>No se detectaron intereses predominantes.</div>
        ) : (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#001d62' }}>Lo que más le interesa</div>
            <div style={{ fontSize: 9, color: '#0f2b6b', marginTop: 2, display: 'flex', flexDirection: 'row' }}><span>Obtuvo </span><span style={{ fontWeight: 800, marginLeft: 2, marginRight: 2 }}>{result.intereses[topI]}/10</span><span> en {(AREAS as any)[topI].nombre}</span></div>
            <div style={{ fontSize: 8, color: '#0f2b6b', marginTop: 4, lineHeight: 1.4 }}>{(AREAS as any)[topI].interesesDesc} Aptitudes: {(AREAS as any)[topI].aptitudesTraits}.</div>
            <div style={{ fontSize: 8, marginTop: 4, display: 'flex', flexDirection: 'row' }}><span style={{ fontWeight: 700 }}>Carreras:</span><span style={{ marginLeft: 4 }}>{(AREAS as any)[topI].carreras}</span></div>
            {secondI && result.intereses[secondI] > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#001d62' }}>También le interesa</div>
                <div style={{ fontSize: 9, color: '#0f2b6b', marginTop: 2, display: 'flex', flexDirection: 'row' }}><span>Obtuvo </span><span style={{ fontWeight: 800, marginLeft: 2, marginRight: 2 }}>{result.intereses[secondI]}/10</span><span> en {(AREAS as any)[secondI].nombre}</span></div>
                <div style={{ fontSize: 8, color: '#0f2b6b', marginTop: 4, lineHeight: 1.4 }}>{(AREAS as any)[secondI].interesesDesc}</div>
                <div style={{ fontSize: 8, marginTop: 4, display: 'flex', flexDirection: 'row' }}><span style={{ fontWeight: 700 }}>Carreras:</span><span style={{ marginLeft: 4 }}>{(AREAS as any)[secondI].carreras}</span></div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#001d62' }}>Aptitudes</div>
        {result.aptitudes[topA] === 0 ? (
          <div style={{ fontSize: 9, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>No se detectaron aptitudes.</div>
        ) : (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#001d62' }}>Tiene aptitudes para</div>
            <div style={{ fontSize: 9, color: '#0f2b6b', marginTop: 2, display: 'flex', flexDirection: 'row' }}><span>Obtuvo </span><span style={{ fontWeight: 800, marginLeft: 2, marginRight: 2 }}>{result.aptitudes[topA]}/4</span><span> en {(AREAS as any)[topA].nombre}</span></div>
            <div style={{ fontSize: 8, color: '#0f2b6b', marginTop: 4, lineHeight: 1.4 }}>Aptitudes: {(AREAS as any)[topA].aptitudesTraits}.</div>
            <div style={{ fontSize: 8, marginTop: 4, display: 'flex', flexDirection: 'row' }}><span style={{ fontWeight: 700 }}>Carreras:</span><span style={{ marginLeft: 4 }}>{(AREAS as any)[topA].carreras}</span></div>
          </div>
        )}
      </div>

      {isTeacher && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#001d62' }}>Tablas puntuación CHASIDE — docente</div>
          <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: '#001d62', color: '#ffffff', display: 'flex', fontSize: 7, fontWeight: 800, padding: '4px 0' }}>
              {AREA_ORDER.map(k => <div key={k} style={{ flex: 1, textAlign: 'center' }}>{k}</div>)}
            </div>
            <div style={{ display: 'flex', fontSize: 7, backgroundColor: '#d8215d', color: '#ffffff', fontWeight: 800, padding: '4px 0' }}>
              {AREA_ORDER.map(k => <div key={k} style={{ flex: 1, textAlign: 'center' }}>{result.intereses[k as keyof typeof result.intereses]}</div>)}
            </div>
            <div style={{ display: 'flex', fontSize: 7, backgroundColor: '#fcfcfc', color: '#001d62', padding: '4px 0' }}>
              {AREA_ORDER.map(k => <div key={k} style={{ flex: 1, textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{result.aptitudes[k as keyof typeof result.aptitudes]}</div>)}
            </div>
          </div>
          <div style={{ fontSize: 7, color: '#64748b' }}>Fila 1: Intereses 0–10 · Fila 2: Aptitudes 0–4</div>
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#64748b' }}>
        <div style={{ display: 'flex', flexDirection: 'row' }}><span>Estudiante: </span><span style={{ fontWeight: 700, color: '#001d62', marginLeft: 2, marginRight: 2 }}>{studentName}</span><span> · {date}</span></div>
        <div>TEAM GGM · Orientación Vocacional</div>
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
  // Satori genera SVG, lo convertimos a PNG via canvas no disponible en browser sin sharp.
  // Para cliente, usamos satori + pdf-lib con SVG embedido como image via base64 (simplificado: usamos svg string como pdf content via embed)
  // Fallback: incrustamos SVG como texto (no ideal) — para calidad real, usar html-to-image en cliente.
  // Aquí usamos pdf-lib para crear un PDF simple con el SVG como imagen base64 (requiere conversión)
  // Simplificación: creamos PDF con texto plano y dejamos satori para vista previa; para impresión real usamos window.print fallback si satori falla.
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.src = url;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  const canvas = document.createElement('canvas');
  canvas.width = 794;
  canvas.height = 1123;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 794, 1123);
  ctx.drawImage(img, 0, 0, 794, 1123);
  const pngDataUrl = canvas.toDataURL('image/png');
  const pngImage = await pdf.embedPng(pngDataUrl);
  page.drawImage(pngImage, { x: 0, y: 0, width: 794, height: 1123 });
  const bytes = await pdf.save();
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  } catch (err) {
    console.warn("renderPdf failed, fallback print", err);
    window.print();
  }
}

export async function generateChasideStudentPdf(result: Result, studentName: string, date: string) {
  const logo = await getLogoDataUrl();
  return renderPdf(<ChasideDoc result={result} studentName={studentName} date={date} logo={logo} />, `CHASIDE_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
}

export async function generateChasideTeacherPdf(result: Result, studentName: string, date: string) {
  const logo = await getLogoDataUrl();
  return renderPdf(<ChasideDoc result={result} studentName={studentName} date={date} logo={logo} isTeacher />, `CHASIDE_DOCENTE_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
}
