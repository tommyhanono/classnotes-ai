import React, { useState, useEffect, useRef, useCallback } from 'react'

export default function RecordingPanel({
  isTeacherActive,
  onToggleTeacher,
  transcript,
  isListening,
  bufferLength,
  isProcessing,
  onProcessNow,
  onResetMic,
  apiError,
}) {
  const [countdown, setCountdown] = useState(60)
  const countdownRef = useRef(null)
  const transcriptRef = useRef(null)

  // Countdown timer — resets on each process
  const resetCountdown = useCallback(() => {
    clearInterval(countdownRef.current)
    setCountdown(60)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    resetCountdown()
    return () => clearInterval(countdownRef.current)
  }, [resetCountdown])

  // Trigger auto-process when countdown hits 0
  useEffect(() => {
    if (countdown === 0 && !isProcessing && bufferLength >= 50) {
      onProcessNow()
      resetCountdown()
    }
  }, [countdown, isProcessing, bufferLength, onProcessNow, resetCountdown])

  // Expose resetCountdown to parent via a ref trick — we use a simpler approach:
  // parent calls a prop after processing
  useEffect(() => {
    if (!isProcessing) {
      // after processing completes, reset countdown
      resetCountdown()
    }
  }, [isProcessing]) // eslint-disable-line

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '20px 16px',
      gap: 16,
    }}>
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
            height: 100,
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
            minHeight: 180,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            background: isTeacherActive ? '#16A34A' : '#1E293B',
            color: isTeacherActive ? '#fff' : '#64748B',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background 0.2s, color 0.2s',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 36 }}>{isTeacherActive ? '🎙️' : '⏸️'}</span>
          <span style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
            {isTeacherActive ? 'PROFESORA\nHABLANDO' : 'PAUSADO'}
          </span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            {isTeacherActive ? 'Toca para pausar' : 'Toca cuando hable la profesora'}
          </span>
        </button>
      </div>

      {/* Controls */}
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            📝 {bufferLength} caracteres capturados
          </span>
          {!isProcessing && (
            <span style={{ fontSize: 12, color: '#64748B' }}>
              ⏱️ Procesando en {countdown}s
            </span>
          )}
          {isProcessing && (
            <span style={{ fontSize: 12, color: '#F5A623' }}>
              <span className="spin">⚙️</span> Analizando...
            </span>
          )}
        </div>

        {/* API Error */}
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

        {/* Buttons */}
        <button
          onClick={onProcessNow}
          disabled={isProcessing || bufferLength < 50}
          style={{
            ...btnStyle,
            background: isProcessing || bufferLength < 50 ? '#1A2540' : '#3B82F6',
            color: isProcessing || bufferLength < 50 ? '#374151' : '#fff',
            cursor: isProcessing || bufferLength < 50 ? 'not-allowed' : 'pointer',
          }}
        >
          {isProcessing ? (
            <><span className="spin" style={{ marginRight: 6 }}>⚙️</span> Analizando apuntes...</>
          ) : '✨ Procesar ahora'}
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
