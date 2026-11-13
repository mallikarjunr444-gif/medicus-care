// Extracts text from a book in the browser (no server CPU needed) and splits it into
// searchable passages. PDFs use pdf.js; .txt/.md are read directly.

export const MAX_BOOK_CHUNKS = 2000

export function chunkText(text: string, size = 900, overlap = 120): string[] {
  const clean = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  const chunks: string[] = []
  let start = 0
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length)
    if (end < clean.length) {
      const cut = Math.max(clean.lastIndexOf('\n\n', end), clean.lastIndexOf('. ', end))
      if (cut > start + size * 0.5) end = cut + 1
    }
    const piece = clean.slice(start, end).trim()
    if (piece.length > 80) chunks.push(piece)
    if (end >= clean.length) break
    start = Math.max(end - overlap, start + 1)
  }
  return chunks
}

export async function extractBookText(file: File, onProgress?: (page: number, total: number) => void): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.txt') || name.endsWith('.md')) return file.text()
  if (!name.endsWith('.pdf')) throw new Error('Please choose a PDF, TXT or MD file')
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '))
    onProgress?.(i, pdf.numPages)
  }
  const text = pages.join('\n\n')
  if (text.replace(/\s/g, '').length < 200)
    throw new Error('No readable text found. This looks like a scanned book, which needs OCR (not available yet).')
  return text
}
