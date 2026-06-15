import React, { useState, useCallback } from 'react'
import Setup from './components/Setup.jsx'
import RecordingPanel from './components/RecordingPanel.jsx'
import NotesPanel from './components/NotesPanel.jsx'
import ExportModal from './components/ExportModal.jsx'
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js'
import { useClaudeAPI } from './hooks/useClaudeAPI.js'
import { createSession } from './utils/storage.js'

export default function App() {
  const [screen, setScreen] = useState('setup') // 'setup' | 'main'
  const [config, setConfig] = useState(null)
  const [session, setSession] = useState(null)
  const [notes, setNotes] = useState([])
  const [isTeacherActive, setIsTeacherActive] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [bufferLength, setBufferLength] = useState(0)

  const speech = useSpeechRecognition(config?.language || 'es-PA')
  const { processNotes, isLoading, error: apiError, clearError } = useClaudeAPI()

  // Speech recognition is not supported
  const isSupported = speech.isSupported

  const handleStart = useCallback((cfg) => {
    setConfig(cfg)
    const newSession = createSession(cfg.subject, cfg.language)
    setSession(newSession)
    setNotes([])
    setScreen('main')
    // Start mic
    setTimeout(() => speech.start(), 100)
    speech.setOnBufferUpdate((buf) => setBufferLength(buf.length))
  }, [speech])

  const handleToggleTeacher = useCallback(() => {
    const next = !isTeacherActive
    setIsTeacherActive(next)
    speech.setTeacherActive(next)
  }, [isTeacherActive, speech])

  const handleProcessNow = useCallback(async () => {
    const buffer = speech.getBuffer()
    if (!buffer || buffer.length < 50 || isLoading) return
    clearError()

    const content = await processNotes(buffer, config.subject, config.apiKey)
    speech.clearBuffer()
    setBufferLength(0)

    if (content) {
      const now = new Date()
      const time = now.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })
      const newNote = {
        id: crypto.randomUUID(),
        time,
        content,
        fragmentIndex: notes.length + 1,
      }
      setNotes(prev => [...prev, newNote])
      setSession(prev => prev ? { ...prev, notes: [...prev.notes, newNote], noteCount: prev.notes.length + 1 } : prev)
    }
  }, [speech, isLoading, clearError, processNotes, config, notes.length])

  const handleDeleteNote = useCallback((id) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    setSession(prev => {
      if (!prev) return prev
      const filtered = prev.notes.filter(n => n.id !== id)
      return { ...prev, notes: filtered, noteCount: filtered.length }
    })
  }, [])

  const handleLoadSession = useCallback((loadedSession) => {
    setNotes(loadedSession.notes)
    setSession(loadedSession)
    setConfig(prev => prev ? { ...prev, subject: loadedSession.subject } : prev)
  }, [])

  const handleResetMic = useCallback(() => {
    speech.reset()
  }, [speech])

  const handleBackToSetup = useCallback(() => {
    speech.stop()
    setIsTeacherActive(false)
    setScreen('setup')
  }, [speech])

  // Browser compatibility warning
  if (!isSupported && screen === 'main') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          background: '#2D1515',
          border: '2px solid #EF4444',
          borderRadius: 12,
          padding: 32,
          maxWidth: 400,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ color: '#FCA5A5', marginBottom: 8 }}>Navegador no compatible</h2>
          <p style={{ color: '#FECACA', fontSize: 14 }}>
            ClassNotes AI requiere <strong>Google Chrome</strong>. Abre esta página en Chrome para usar el micrófono.
          </p>
        </div>
      </div>
    )
  }

  if (screen === 'setup') {
    return <Setup onStart={handleStart} />
  }

  const startTime = session?.startTime || '--:--'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        background: '#1A2540',
        borderBottom: '1px solid #2D3F5C',
        padding: '0 20px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#E8EDF5' }}>
            {config?.subject}
          </span>
          <span style={{ color: '#64748B', fontSize: 12, marginLeft: 10 }}>
            Inicio: {startTime}
          </span>
          {/* Listening indicator */}
          <span style={{
            marginLeft: 10,
            fontSize: 11,
            color: speech.isListening ? '#16A34A' : '#EF4444',
            fontWeight: 600,
          }}>
            {speech.isListening ? '● MIC ON' : '● MIC OFF'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowExport(true)}
            style={headerBtn('#3B82F6', '#fff')}
          >
            Exportar
          </button>
          <button
            onClick={handleBackToSetup}
            style={headerBtn('#232F4B', '#64748B')}
            title="Configuración"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* No-support warning for partial browsers */}
      {!isSupported && (
        <div style={{
          background: '#2D1515',
          borderBottom: '1px solid #EF4444',
          padding: '10px 20px',
          color: '#FCA5A5',
          fontSize: 13,
          textAlign: 'center',
        }}>
          ⚠️ ClassNotes AI requiere Google Chrome. Abre esta página en Chrome para usar el micrófono.
        </div>
      )}

      {/* Main two-column layout */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Left column — 40% */}
        <div style={{ width: '40%', minWidth: 280, borderRight: '1px solid #2D3F5C', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <RecordingPanel
            isTeacherActive={isTeacherActive}
            onToggleTeacher={handleToggleTeacher}
            transcript={speech.transcript}
            isListening={speech.isListening}
            bufferLength={bufferLength}
            isProcessing={isLoading}
            onProcessNow={handleProcessNow}
            onResetMic={handleResetMic}
            apiError={apiError}
          />
        </div>

        {/* Right column — 60% */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <NotesPanel
            subject={config?.subject}
            notes={notes}
            onDeleteNote={handleDeleteNote}
          />
        </div>
      </main>

      {/* Export modal */}
      {showExport && session && (
        <ExportModal
          session={{ ...session, notes }}
          onClose={() => setShowExport(false)}
          onLoadSession={handleLoadSession}
        />
      )}
    </div>
  )
}

const headerBtn = (bg, color) => ({
  background: bg,
  color,
  border: 'none',
  borderRadius: 8,
  padding: '6px 14px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
})
