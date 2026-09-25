import React from 'react';
import { useChaside } from "./useChaside";
import { ChasideGate } from "./ChasideGate";
import { ChasideHero } from "./ChasideHero";
import { ChasideProgress } from "./ChasideProgress";
import { ChasideQuestions } from "./ChasideQuestions";
import { ChasideResult } from "./ChasideResult";

export default function ChasideTest() {
  const {
    answers, showResult, studentName, setStudentName, savedAt, error, saving, extra, setExtra,
    alreadyCompleted, reintentoPendiente, loadingExisting, moodleUserId, moodleUserName, moodleUserEmail, isMoodle, gateChecked,
    total, siCount, missing, result, progress,
    handleAnswer, handleSubmit, handleSave, handlePrint, handleDownload, handleReset,
  } = useChaside();

  const gate = ChasideGate({ gateChecked, isMoodle, moodleUserId });
  if (gate) return gate;
  if (loadingExisting) return <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-8"><p className="text-sm text-[#0f2b6b]">Cargando resultado guardado...</p></div>;
  if (showResult) {
    return (
      <>
        {alreadyCompleted && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">
            Ya completaste este test. Mostrando resultado guardado.
          </div>
        )}
        <ChasideResult
          result={result}
          studentName={studentName}
          setStudentName={setStudentName}
          savedAt={savedAt}
          onSave={handleSave}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onReset={handleReset}
          onBack={() => handleReset()}
          error={error}
          extra={extra}
          setExtra={setExtra}
          saving={saving}
        />
      </>
    );
  }
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <ChasideHero />
      {reintentoPendiente && (
        <div className="max-w-3xl mx-auto px-4 mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <b>Tienes un reintento habilitado.</b> Tu intento anterior queda guardado en el historial: responde de nuevo y al enviar se registrará como un intento adicional.
        </div>
      )}
      <ChasideProgress total={total} progress={progress} siCount={siCount} onSubmit={handleSubmit} error={error} />
      <ChasideQuestions answers={answers} error={error} missing={missing} onAnswer={handleAnswer} onSubmit={handleSubmit} onReset={handleReset} />
    </div>
  );
}
