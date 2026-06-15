import React from 'react'

function parseLine(line, key) {
  // Bold: **text**
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return (
    <React.Fragment key={key}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: '#E8EDF5', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
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
              {parseLine(item, i)}
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

    if (trimmed.startsWith('#### ')) {
      flushList()
      elements.push(
        <h4 key={keyCounter++} style={{ color: '#93C5FD', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 8 }}>
          {parseLine(trimmed.slice(5), keyCounter)}
        </h4>
      )
    } else if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={keyCounter++} style={{ color: '#60A5FA', fontSize: 14, fontWeight: 600, marginBottom: 6, marginTop: 10 }}>
          {parseLine(trimmed.slice(4), keyCounter)}
        </h3>
      )
    } else if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={keyCounter++} style={{ color: '#3B82F6', fontSize: 15, fontWeight: 700, marginBottom: 8, marginTop: 12, paddingBottom: 4, borderBottom: '1px solid #2D3F5C' }}>
          {parseLine(trimmed.slice(3), keyCounter)}
        </h2>
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.slice(2))
    } else {
      flushList()
      elements.push(
        <p key={keyCounter++} style={{ color: '#CBD5E1', marginBottom: 6 }}>
          {parseLine(trimmed, keyCounter)}
        </p>
      )
    }
  }

  flushList()
  return elements
}
