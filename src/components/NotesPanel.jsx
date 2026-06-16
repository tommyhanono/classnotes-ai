import React, { useEffect, useRef, useState } from 'react'
import { parseMarkdown } from '../utils/markdownParser.jsx'

export default function NotesPanel({ subject, notes, onDeleteNote }) {
  const bottomRef = useRef(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!search) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [notes.length, search])

  const filtered = search.trim()
    ? notes.filter(n => n.content.toLowerCase().includes(search.toLowerCase()))
    : notes

  const regularCount = notes.filter(n => n.type !== 'summary').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid #2D3F5C' }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #2D3F5C',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#E8EDF5' }}>📒 Apuntes — {subject}</h2>
          <span style={{
            background: '#F5A623',
            color: '#0F1729',
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 20,
            padding: '2px 10px',
          }}>
            {regularCount} {regularCount === 1 ? 'fragmento' : 'fragmentos'}
          </span>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Buscar en apuntes..."
            style={{
              width: '100%',
              background: '#0F1729',
              border: '1px solid #2D3F5C',
              borderRadius: 6,
              padding: '6px 32px 6px 10px',
              color: '#E8EDF5',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#64748B', cursor: 'pointer',
                fontSize: 13, lineHeight: 1, padding: 2, fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {search && (
          <span style={{ fontSize: 11, color: '#64748B' }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{search}"
          </span>
        )}
      </div>

      {/* Notes list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {notes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#374151' }}>
            <span style={{ fontSize: 40 }}>📒</span>
            <p style={{ textAlign: 'center', fontSize: 14 }}>
              Los apuntes aparecerán aquí<br />cuando proceses el primer fragmento
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 8, color: '#374151' }}>
            <span style={{ fontSize: 32 }}>🔍</span>
            <p style={{ textAlign: 'center', fontSize: 13 }}>
              Sin resultados para<br />"{search}"
            </p>
          </div>
        ) : (
          <>
            {filtered.map(note => (
              <NoteCard key={note.id} note={note} onDelete={() => onDeleteNote(note.id)} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  )
}

function NoteCard({ note, onDelete }) {
  const isSummary = note.type === 'summary'
  const accentColor = isSummary ? '#A855F7' : '#F5A623'
  const cardBg = isSummary ? '#1C1535' : '#1A2540'

  return (
    <div style={{
      background: cardBg,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 14,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingRight: 24 }}>
        <span style={{
          background: '#232F4B',
          color: accentColor,
          fontSize: 11,
          fontWeight: 700,
          borderRadius: 6,
          padding: '2px 8px',
          fontFamily: 'monospace',
        }}>
          {note.time}
        </span>
        <span style={{ color: '#64748B', fontSize: 12 }}>
          {isSummary ? '🎯 Resumen de clase' : `Fragmento ${note.fragmentIndex}`}
        </span>
      </div>

      <div style={{ fontSize: 13, lineHeight: 1.65 }}>
        {parseMarkdown(note.content)}
      </div>

      <button
        onClick={onDelete}
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'none', border: 'none', color: '#374151',
          cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 4,
          borderRadius: 4, fontFamily: 'inherit', transition: 'color 0.15s',
        }}
        title="Eliminar"
        onMouseEnter={e => e.target.style.color = '#EF4444'}
        onMouseLeave={e => e.target.style.color = '#374151'}
      >
        ✕
      </button>
    </div>
  )
}
