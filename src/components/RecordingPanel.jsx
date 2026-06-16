import React, { useEffect, useRef } from 'react'

export default function RecordingPanel({
  isTeacherActive,
  onToggleTeacher,
  transcript,
  isListening,
  bufferWords,
  silenceSeconds,
  silenceThreshold,
  isProcessing,
  isSummarizing,
  onProcessNow,
  onResetMic,
  onSummary,
  noteCount,
  apiError,
}) {
  const transcriptRef = useRef(null)

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  const hasEnoughBuffer = bufferWords >= 8
  const isBusy = isProcessing || isSummarizing
  const silenceProgress = isTeacherActive && silenceSeconds > 0
    ? Math.min(silenceSeconds / silenceThreshold, 1)
    : 0
  const silenceColor = silenceProgress >= 1
    ? '#EF4444'
    : silenceProgress > 0.6
    ? '#F59E0B'
    : '#16A34A'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 16px', gap: 14 }}>

      {/* Live transcript */}
      <div style={{ flex: '0 0 auto' }}>
        <p style={sectionLabel}>LO QUE ESCUCHA EL MICRÓFONO</p>
        <div
          ref={transcriptRef}
          style={{
            background: '#0F1729',
            border: '1px solid #2D3F5C',
            borderRadius: 8,
            padding: 12,
            height: 90,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#64748B',
            lineHeight: 1.6,
          }}
        >
          {transcript || (
            <span style={{ color: '#374151', fontStyle: 'italic' }}>
              {isListening ? 'Esperando voz...' : 'Micrófono no activo'}
            </span>
          )}
        </div>
      </div>

      {/* Main toggle button */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={onToggleTeacher}
          className={isTeacherActive ? 'pulse-ring' : ''}
          style={{
            width: '100%',
            minHeight: 150,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            background: isTeacherActive ? '#16A34A' : '#1E293B',
            color: isTeacherActive ? '#fff' : '#64748B',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'background 0.2s, color 0.2s',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 30 }}>{isTeacherActive ? '🎙️' : '⏸️'}</span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            {isTeacherActive ? 'PROFESORA HABLANDO' : 'PAUSADO'}
          </span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>
            {isTeacherActive ? 'Toca o presiona Espacio para pausar' : 'Toca o presiona Espacio para grabar'}
          </span>
        </button>
      </div>

      {/* Silence detection bar — only when teacher is active */}
      {isTeacherActive && (
        <div style={{ flex: '0 0 auto' }}>
          {isProcessing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spin" style={{ fontSize: 13 }}>⚙️</span>
              <span style={{ fontSize: 12, color: '#F5A623' }}>Generando apuntes...</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                <span style={{ color: '#64748B' }}>Silencio detectado</span>
                <span style={{ color: silenceColor, fontWeight: 600 }}>
                  {silenceSeconds > 0 ? `${silenceSeconds}s` : '—'} / {silenceThreshold}s
                </span>
              </div>
              <div style={{ background: '#0F1729', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${silenceProgress * 100}%`,
                  background: silenceColor,
                  borderRadius: 4,
                  transition: 'width 0.8s, background 0.3s',
                }} />
              </div>
              <p style={{ fontSize: 10, color: '#374151', marginTop: 3 }}>
                Se procesa automáticamente al pausar {silenceThreshold}s
              </p>
            </>
          )}
        </div>
      )}

      {/* Stats + controls */}
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: bufferWords > 0 ? '#94A3B8' : '#374151' }}>
            📝 {bufferWords} palabras capturadas
          </span>
          {isSummarizing && (
            <span style={{ fontSize: 12, color: '#A855F7' }}>
              <span className="spin" style={{ marginRight: 4 }}>⚙️</span>Resumiendo...
            </span>
          )}
        </div>

        {apiError && (
          <div style={{
            background: '#2D1515',
            border: '1px solid #EF4444',
            borderRadius: 6,
            padding: '8px 12px',
            color: '#FCA5A5',
            fontSize: 12,
          }}>
            ⚠️ {apiError}
          </div>
        )}

        <button
          onClick={onProcessNow}
          disabled={isBusy || !hasEnoughBuffer}
          style={{
            ...btnStyle,
            background: isBusy || !hasEnoughBuffer ? '#1A2540' : '#3B82F6',
            color: isBusy || !hasEnoughBuffer ? '#374151' : '#fff',
            cursor: isBusy || !hasEnoughBuffer ? 'not-allowed' : 'pointer',
          }}
        >
          {isProcessing
            ? <><span className="spin" style={{ marginRight: 6 }}>⚙️</span>Analizando apuntes...</>
            : '✨ Procesar ahora'}
        </button>

        <button
          onClick={onSummary}
          disabled={isBusy || noteCount === 0}
          style={{
            ...btnStyle,
            background: isBusy || noteCount === 0 ? '#1A2540' : '#7C3AED',
            color: isBusy || noteCount === 0 ? '#374151' : '#fff',
            cursor: isBusy || noteCount === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {isSummarizing
            ? <><span className="spin" style={{ marginRight: 6 }}>⚙️</span>Generando resumen...</>
            : '🎯 Resumen de clase'}
        </button>

        <button
          onClick={onResetMic}
          style={{ ...btnStyle, background: '#232F4B', color: '#94A3B8', cursor: 'pointer' }}
        >
          🔄 Reiniciar mic
        </button>
      </div>
    </div>
  )
}

const sectionLabel = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: '#64748B',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const btnStyle = {
  width: '100%',
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
}
