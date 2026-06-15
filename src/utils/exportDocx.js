import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

function parseMdToDocxParagraphs(content) {
  const lines = content.split('\n')
  const paragraphs = []
  let listItems = []

  const flushList = () => {
    listItems.forEach(item => {
      const runs = parseInlineBold(item)
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: runs,
        })
      )
    })
    listItems = []
  }

  const parseInlineBold = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({ text: part.slice(2, -2), bold: true })
      }
      return new TextRun({ text: part })
    })
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      continue
    }
    if (trimmed.startsWith('## ')) {
      flushList()
      paragraphs.push(new Paragraph({ text: trimmed.slice(3), heading: HeadingLevel.HEADING_2 }))
    } else if (trimmed.startsWith('### ')) {
      flushList()
      paragraphs.push(new Paragraph({ text: trimmed.slice(4), heading: HeadingLevel.HEADING_3 }))
    } else if (trimmed.startsWith('#### ')) {
      flushList()
      paragraphs.push(new Paragraph({ text: trimmed.slice(5), heading: HeadingLevel.HEADING_4 }))
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2))
    } else {
      flushList()
      paragraphs.push(new Paragraph({ children: parseInlineBold(trimmed) }))
    }
  }

  flushList()
  return paragraphs
}

export async function exportToDocx(session) {
  const { subject, date, notes } = session

  const dateObj = new Date(date + 'T12:00:00')
  const dateFormatted = dateObj.toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const allParagraphs = [
    new Paragraph({
      text: `${subject} — ${dateFormatted}`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Generado por ClassNotes AI', italics: true, color: '666666' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ]

  notes.forEach((note, idx) => {
    allParagraphs.push(
      new Paragraph({
        text: `Fragmento ${note.fragmentIndex} — ${note.time}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300 },
      })
    )
    allParagraphs.push(...parseMdToDocxParagraphs(note.content))
    if (idx < notes.length - 1) {
      allParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: '─────────────────────────', color: '999999' })],
          spacing: { before: 200, after: 200 },
        })
      )
    }
  })

  const doc = new Document({ sections: [{ children: allParagraphs }] })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${subject}_${date}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
