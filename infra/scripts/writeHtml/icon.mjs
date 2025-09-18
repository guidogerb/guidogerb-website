import fs from 'node:fs/promises'
import path from 'node:path'

function computeFontSize(text) {
  const length = text.length || 1
  if (length === 1) return 280
  if (length === 2) return 220
  if (length === 3) return 180
  return 160
}

export async function writeSvgIcon(options = {}) {
  const {
    outFile,
    text = 'GG',
    backgroundColor = '#0b0d12',
    textColor = '#f7f8fc',
    borderRadius = 112,
    fontFamily = 'Inter, "Segoe UI", system-ui, sans-serif',
  } = options

  if (!outFile) throw new Error('writeSvgIcon requires an `outFile` option')

  const label = String(text).trim().toUpperCase().slice(0, 3) || 'G'
  const fontSize = computeFontSize(label)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="${borderRadius}" fill="${backgroundColor}" />
  <text x="50%" y="50%" fill="${textColor}" font-family='${fontFamily}' font-size="${fontSize}" font-weight="700" text-anchor="middle" dominant-baseline="central">${label}</text>
</svg>
`

  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, svg, 'utf8')
  return outFile
}
