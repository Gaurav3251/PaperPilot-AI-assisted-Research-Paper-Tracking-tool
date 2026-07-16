import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx'

function formatTimestamp(dateLike) {
  try {
    return new Date(dateLike).toLocaleString()
  } catch {
    return ''
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function safeFileName(title) {
  return (title || 'notes').replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 80) || 'notes'
}

/**
 * Downloads the given notes for a paper as a plain .txt file.
 */
export function downloadNotesAsText(paperTitle, notes) {
  const lines = [
    `Notes: ${paperTitle}`,
    `Exported: ${new Date().toLocaleString()}`,
    ''.padEnd(40, '='),
    '',
  ]

  if (!notes.length) {
    lines.push('(No notes yet.)')
  } else {
    notes.forEach((note, index) => {
      lines.push(`[${index + 1}] ${formatTimestamp(note.createdAt)}`)
      lines.push(note.content)
      lines.push('')
    })
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  triggerDownload(blob, `${safeFileName(paperTitle)}-notes.txt`)
}

/**
 * Downloads the given notes for a paper as a genuine .docx Word document.
 */
export async function downloadNotesAsWord(paperTitle, notes) {
  const children = [
    new Paragraph({ text: `Notes: ${paperTitle}`, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [new TextRun({ text: `Exported: ${new Date().toLocaleString()}`, italics: true, color: '666666' })],
    }),
    new Paragraph({ text: '' }),
  ]

  if (!notes.length) {
    children.push(new Paragraph({ text: 'No notes yet.' }))
  } else {
    notes.forEach((note, index) => {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: `Note ${index + 1} — ${formatTimestamp(note.createdAt)}` })],
        })
      )
      // Preserve manual line breaks within a note.
      const contentLines = String(note.content || '').split('\n')
      contentLines.forEach((line, lineIdx) => {
        children.push(new Paragraph({ text: line || ' ' }))
        void lineIdx
      })
      children.push(new Paragraph({ text: '' }))
    })
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, `${safeFileName(paperTitle)}-notes.docx`)
}
