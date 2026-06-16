import React from 'react'

// Parses **bold**, *italic*, and `code` inline
function parseInline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g)
  return (
    <React.Fragment key={key}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: '#E8EDF5', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={i} style={{ color: '#CBD5E1', fontStyle: 'italic' }}>{part.slice(1, -1)}</em>
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={i} style={{
              background: '#0F1729',
              color: '#93C5FD',
              borderRadius: 3,
              padding: '1px 5px',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            }}>
              {part.slice(1, -1)}
            </code>
          )
        }
        return part
      })}
    </React.Fragment>
  )
}

export function parseMarkdown(content) {
  if (!content) return null
  const lines = content.split('\n')
  const elements = []
  let listBuffer = []
  let keyCounter = 0

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${keyCounter++}`} style={{ paddingLeft: 20, marginBottom: 8 }}>
          {listBuffer.map((item, i) => (
            <li key={i} style={{ color: '#CBD5E1', marginBottom: 3 }}>
              {parseInline(item, i)}
            </li>
          ))}
        </ul>
      )
      listBuffer = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      continue
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList()
      elements.push(
        <hr key={keyCounter++} style={{ border: 'none', borderTop: '1px solid #2D3F5C', margin: '8px 0' }} />
      )
    } else if (trimmed.startsWith('#### ')) {
      flushList()
      elements.push(
        <h4 key={keyCounter++} style={{ color: '#93C5FD', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 8 }}>
          {parseInline(trimmed.slice(5), keyCounter)}
        </h4>
      )
    } else if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={keyCounter++} style={{ color: '#60A5FA', fontSize: 14, fontWeight: 600, marginBottom: 6, marginTop: 10 }}>
          {parseInline(trimmed.slice(4), keyCounter)}
        </h3>
      )
    } else if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={keyCounter++} style={{ color: '#3B82F6', fontSize: 15, fontWeight: 700, marginBottom: 8, marginTop: 12, paddingBottom: 4, borderBottom: '1px solid #2D3F5C' }}>
          {parseInline(trimmed.slice(3), keyCounter)}
        </h2>
      )
    } else if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={keyCounter++} style={{ color: '#60A5FA', fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 14, paddingBottom: 6, borderBottom: '2px solid #3B82F6' }}>
          {parseInline(trimmed.slice(2), keyCounter)}
        </h1>
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.slice(2))
    } else {
      flushList()
      elements.push(
        <p key={keyCounter++} style={{ color: '#CBD5E1', marginBottom: 6 }}>
          {parseInline(trimmed, keyCounter)}
        </p>
      )
    }
  }

  flushList()
  return elements
}
