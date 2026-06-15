import React, { useState } from 'react'
import { getSessions, saveSession, deleteSession } from '../utils/storage.js'
import { exportToDocx } from '../utils/exportDocx.js'

export default function ExportModal({ session, onClose, onLoadSession }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sessions, setSessions] = useState(getSessions)

  const buildMarkdown = () => {
    const { subject, date, notes } = session
    let md = `# ${subject} — ${date}\n\n`
    notes.forEach(note => {
      md += `## Fragmento ${note.fragmentIndex} — ${note.time}\n\n${note.content}\n\n---\n\n`
    })
    return md
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildMarkdown())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDocx = async () => {
    await exportToDocx(session)
  }

  const handleSave = () => {
    saveSession(session)
    setSessions(getSessions())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDelete = (id) => {
    deleteSession(id)
    setSessions(getSessions())
  }

  const handleLoad = (s) => {
    onLoadSession(s)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#1A2540',
        border: '1px solid #2D3F5C',
        borderRadius: 12,
        width: '100%',
        maxWidth: 540,
        maxHeight: '85vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #2D3F5C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: '#1A2540',
          zIndex: 1,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Exportar sesión</h2>
          <button onClick={onClose} style={iconBtn}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Export current */}
          <section>
            <p style={sectionLabel}>SESIÓN ACTUAL — {session.subject} ({session.notes.length} fragmentos)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleCopy} style={exportBtn('#232F4B')}>
                {copied ? '✅ ¡Copiado!' : '📋 Copiar como Markdown'}
              </button>
              <button onClick={handleDocx} style={exportBtn('#232F4B')} disabled={session.notes.length === 0}>
                📄 Descargar Word (.docx)
              </button>
              <button onClick={handleSave} style={exportBtn('#1E3A5F')}>
                {saved ? '✅ Guardado' : '💾 Guardar sesión'}
              </button>
            </div>
          </section>

          {/* Session history */}
          <section>
            <p style={sectionLabel}>HISTORIAL DE SESIONES ({sessions.length})</p>
            {sessions.length === 0 ? (
              <p style={{ color: '#374151', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No hay sesiones guardadas
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map(s => (
                  <div key={s.id} style={{
                    background: '#0F1729',
                    border: '1px solid #2D3F5C',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#E8EDF5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.subject}
                      </p>
                      <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        {s.date} · {s.startTime} · {s.noteCount} fragmentos
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoad(s)}
                      style={{ ...smallBtn, background: '#1E3A5F', color: '#60A5FA' }}
                    >
                      📥 Cargar
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{ ...smallBtn, background: '#2D1515', color: '#FCA5A5' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
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
  marginBottom: 10,
}

const exportBtn = (bg) => ({
  width: '100%',
  background: bg,
  border: '1px solid #2D3F5C',
  borderRadius: 8,
  padding: '11px 16px',
  color: '#E8EDF5',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background 0.15s',
})

const smallBtn = {
  border: 'none',
  borderRadius: 6,
  padding: '5px 10px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
}

const iconBtn = {
  background: 'none',
  border: 'none',
  color: '#64748B',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  padding: 4,
  fontFamily: 'inherit',
}
