import React, { useState } from 'react'
import { getApiKey, saveApiKey, getLastSubject, saveLastSubject } from '../utils/storage.js'

const LANGUAGES = [
  { value: 'es-PA', label: 'Español (Panamá)' },
  { value: 'es', label: 'Español (general)' },
  { value: 'en-US', label: 'English (US)' },
]

export default function Setup({ onStart }) {
  const [subject, setSubject] = useState(getLastSubject)
  const [apiKey, setApiKey] = useState(getApiKey)
  const [language, setLanguage] = useState('es-PA')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!subject.trim()) return setError('Ingresa el nombre de la materia.')
    if (!apiKey.trim()) return setError('Ingresa tu API key de Anthropic.')
    saveApiKey(apiKey.trim())
    saveLastSubject(subject.trim())
    onStart({ subject: subject.trim(), apiKey: apiKey.trim(), language })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: '#0F1729',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📒</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E8EDF5', marginBottom: 6 }}>
            ClassNotes AI
          </h1>
          <p style={{ color: '#64748B', fontSize: 14 }}>
            Apuntes de clase con inteligencia artificial
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#1A2540',
          borderRadius: 12,
          padding: 32,
          border: '1px solid #2D3F5C',
        }}>
          <form onSubmit={handleSubmit}>
            {/* Subject */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                MATERIA <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => { setSubject(e.target.value); setError('') }}
                placeholder="ej. Biología, Historia, Matemáticas"
                style={inputStyle}
                autoFocus
              />
            </div>

            {/* API Key */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                ANTHROPIC API KEY <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setError('') }}
                placeholder="sk-ant-..."
                style={inputStyle}
                autoComplete="off"
              />
              <p style={{ color: '#64748B', fontSize: 11, marginTop: 6 }}>
                🔒 Tu API key se guarda solo en este dispositivo. Nunca sale de tu navegador excepto para llamar a Anthropic.
              </p>
            </div>

            {/* Language */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>IDIOMA DEL MICRÓFONO</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#2D1515',
                border: '1px solid #EF4444',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#FCA5A5',
                fontSize: 13,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" style={btnPrimaryStyle}>
              Comenzar clase →
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 20 }}>
          Requiere Google Chrome para el micrófono
        </p>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: '#64748B',
  marginBottom: 8,
  textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%',
  background: '#0F1729',
  border: '1px solid #2D3F5C',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#E8EDF5',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

const btnPrimaryStyle = {
  width: '100%',
  background: '#3B82F6',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '12px 24px',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'background 0.15s',
}
