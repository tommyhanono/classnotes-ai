import React, { useEffect, useRef } from 'react'
import { parseMarkdown } from '../utils/markdownParser.jsx'

export default function NotesPanel({ subject, notes, onDeleteNote }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes.length])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderLeft: '1px solid #2D3F5C',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #2D3F5C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#E8EDF5' }}>
          📒 Apuntes — {subject}
        </h2>
        <span style={{
          background: '#F5A623',
          color: '#0F1729',
          fontSize: 11,
          fontWeight: 700,
          borderRadius: 20,
          padding: '2px 10px',
        }}>
          {notes.length} {notes.length === 1 ? 'fragmento' : 'fragmentos'}
        </span>
      </div>

      {/* Notes list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {notes.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
            color: '#374151',
          }}>
            <span style={{ fontSize: 40 }}>📒</span>
            <p style={{ textAlign: 'center', fontSize: 14 }}>
              Los apuntes aparecerán aquí<br />cuando proceses el primer fragmento
            </p>
          </div>
        ) : (
          <>
            {notes.map(note => (
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
  return (
    <div style={{
      background: '#1A2540',
      borderLeft: '3px solid #F5A623',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 14,
      position: 'relative',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        paddingRight: 24,
      }}>
        <span style={{
          background: '#232F4B',
          color: '#F5A623',
          fontSize: 11,
          fontWeight: 700,
          borderRadius: 6,
          padding: '2px 8px',
          fontFamily: 'monospace',
        }}>
          {note.time}
        </span>
        <span style={{ color: '#64748B', fontSize: 12 }}>
          Fragmento {note.fragmentIndex}
        </span>
      </div>

      {/* Content */}
      <div style={{ fontSize: 13, lineHeight: 1.65 }}>
        {parseMarkdown(note.content)}
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'none',
          border: 'none',
          color: '#374151',
          cursor: 'pointer',
          fontSize: 14,
          lineHeight: 1,
          padding: 4,
          borderRadius: 4,
          fontFamily: 'inherit',
          transition: 'color 0.15s',
        }}
        title="Eliminar fragmento"
        onMouseEnter={e => e.target.style.color = '#EF4444'}
        onMouseLeave={e => e.target.style.color = '#374151'}
      >
        ✕
      </button>
    </div>
  )
}
