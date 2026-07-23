import './index.css'
import { useState, useCallback, useEffect, useRef } from 'react'
import Setup from './components/Setup.jsx'
import RecordingPanel from './components/RecordingPanel.jsx'
import NotesPanel from './components/NotesPanel.jsx'
import ExportModal from './components/ExportModal.jsx'
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js'
import { useClaudeAPI } from './hooks/useClaudeAPI.js'
import { createSession, saveSession } from './utils/storage.js'

const SILENCE_THRESHOLD = 6  // seconds of silence before auto-processing
const MIN_BUFFER_CHARS = 50

export default function App() {
  const [screen, setScreen] = useState('setup')
  const [config, setConfig] = useState(null)
  const [session, setSession] = useState(null)
  const [notes, setNotes] = useState([])
  const [isTeacherActive, setIsTeacherActive] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [bufferWords, setBufferWords] = useState(0)
  const [silenceSeconds, setSilenceSeconds] = useState(0)

  const noteCountRef = useRef(0)
  const isAnyLoadingRef = useRef(false)

  const speech = useSpeechRecognition(config?.language || 'es-PA')
  const { processNotes, generateSummary, isLoading, isSummarizing, error: apiError, clearError } = useClaudeAPI()

  useEffect(() => {
    isAnyLoadingRef.current = isLoading || isSummarizing
  }, [isLoading, isSummarizing])

  const isSupported = speech.isSupported

  const handleStart = useCallback((cfg) => {
    setConfig(cfg)
    const newSession = createSession(cfg.subject, cfg.language)
    setSession(newSession)
    setNotes([])
    noteCountRef.current = 0
    setScreen('main')
    setTimeout(() => speech.start(), 100)
    speech.setOnBufferUpdate((buf) => {
      const words = buf.trim() ? buf.trim().split(/\s+/).filter(Boolean).length : 0
      setBufferWords(words)
    })
  }, [speech])

  const handleToggleTeacher = useCallback(() => {
    const next = !isTeacherActive
    setIsTeacherActive(next)
    speech.setTeacherActive(next)
    if (!next) setSilenceSeconds(0)
  }, [isTeacherActive, speech])

  const handleProcessNow = useCallback(async () => {
    const buffer = speech.getBuffer()
    if (!buffer || buffer.length < MIN_BUFFER_CHARS || isAnyLoadingRef.current) return
    clearError()

    const content = await processNotes(buffer, config.subject, config.apiKey)
    speech.clearBuffer()
    setBufferWords(0)
    setSilenceSeconds(0)

    if (content) {
      const now = new Date()
      const time = now.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })
      noteCountRef.current += 1
      const newNote = {
        id: crypto.randomUUID(),
        time,
        content,
        fragmentIndex: noteCountRef.current,
        type: 'note',
      }
      setNotes(prev => [...prev, newNote])
      setSession(prev => {
        if (!prev) return prev
        const updated = { ...prev, notes: [...prev.notes, newNote], noteCount: noteCountRef.current }
        saveSession(updated)
        return updated
      })
    }
  }, [speech, clearError, processNotes, config])

  const handleSummary = useCallback(async () => {
    if (isAnyLoadingRef.current) return
    clearError()
    const content = await generateSummary(notes, config.subject, config.apiKey)
    if (content) {
      const now = new Date()
      const time = now.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })
      const summaryNote = {
        id: crypto.randomUUID(),
        time,
        content,
        fragmentIndex: 0,
        type: 'summary',
      }
      setNotes(prev => {
        const withoutSummary = prev.filter(n => n.type !== 'summary')
        return [...withoutSummary, summaryNote]
      })
      setSession(prev => {
        if (!prev) return prev
        const withoutSummary = prev.notes.filter(n => n.type !== 'summary')
        const updated = { ...prev, notes: [...withoutSummary, summaryNote], noteCount: noteCountRef.current }
        saveSession(updated)
        return updated
      })
    }
  }, [notes, clearError, generateSummary, config])

  // Silence detection — auto-process after SILENCE_THRESHOLD seconds of no teacher speech
  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      if (!isTeacherActive) return
      const lastSpeech = speech.getLastSpeechTime()
      if (!lastSpeech) return
      const secs = Math.floor((Date.now() - lastSpeech) / 1000)
      setSilenceSeconds(secs)
      const buf = speech.getBuffer()
      if (buf.length >= MIN_BUFFER_CHARS && !isAnyLoadingRef.current && secs >= SILENCE_THRESHOLD) {
        handleProcessNow()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [session, isTeacherActive, speech, handleProcessNow])

  // Spacebar shortcut — toggle teacher mode (not when typing in inputs)
  useEffect(() => {
    if (screen !== 'main') return
    const handler = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') {
        e.preventDefault()
        handleToggleTeacher()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [screen, handleToggleTeacher])

  const handleDeleteNote = useCallback((id) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    setSession(prev => {
      if (!prev) return prev
      const filtered = prev.notes.filter(n => n.id !== id)
      const updated = { ...prev, notes: filtered, noteCount: filtered.filter(n => n.type !== 'summary').length }
      saveSession(updated)
      return updated
    })
  }, [])

  const handleLoadSession = useCallback((loadedSession) => {
    setNotes(loadedSession.notes)
    setSession(loadedSession)
    noteCountRef.current = loadedSession.notes.filter(n => n.type !== 'summary').length
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

  if (!isSupported && screen === 'main') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#2D1515', border: '2px solid #EF4444', borderRadius: 12, padding: 32, maxWidth: 400, textAlign: 'center' }}>
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

  const regularNoteCount = notes.filter(n => n.type !== 'summary').length
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#E8EDF5' }}>{config?.subject}</span>
          <span style={{ color: '#64748B', fontSize: 12 }}>Inicio: {startTime}</span>
          <span style={{ fontSize: 11, color: speech.isListening ? '#16A34A' : '#EF4444', fontWeight: 600 }}>
            {speech.isListening ? '● MIC ON' : '● MIC OFF'}
          </span>
          <span style={{ fontSize: 11, color: '#64748B' }}>
            {regularNoteCount} {regularNoteCount === 1 ? 'fragmento' : 'fragmentos'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setShowExport(true)} style={headerBtn('#3B82F6', '#fff')}>Exportar</button>
          <button onClick={handleBackToSetup} style={headerBtn('#232F4B', '#64748B')} title="Configuración">⚙️</button>
        </div>
      </header>

      {!isSupported && (
        <div style={{ background: '#2D1515', borderBottom: '1px solid #EF4444', padding: '10px 20px', color: '#FCA5A5', fontSize: 13, textAlign: 'center' }}>
          ⚠️ ClassNotes AI requiere Google Chrome. Abre esta página en Chrome para usar el micrófono.
        </div>
      )}

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: '40%', minWidth: 280, borderRight: '1px solid #2D3F5C', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <RecordingPanel
            isTeacherActive={isTeacherActive}
            onToggleTeacher={handleToggleTeacher}
            transcript={speech.transcript}
            isListening={speech.isListening}
            bufferWords={bufferWords}
            silenceSeconds={silenceSeconds}
            silenceThreshold={SILENCE_THRESHOLD}
            isProcessing={isLoading}
            isSummarizing={isSummarizing}
            onProcessNow={handleProcessNow}
            onResetMic={handleResetMic}
            onSummary={handleSummary}
            noteCount={regularNoteCount}
            apiError={apiError}
          />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <NotesPanel
            subject={config?.subject}
            notes={notes}
            onDeleteNote={handleDeleteNote}
          />
        </div>
      </main>

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
