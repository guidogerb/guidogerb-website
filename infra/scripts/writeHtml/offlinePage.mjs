import fs from 'node:fs/promises'
import path from 'node:path'

const TEMPLATE = ({
  siteName,
  headline,
  message,
  backgroundColor,
  cardColor,
  textColor,
  accentColor,
}) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${siteName ? `${siteName} — ` : ''}Offline</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial,
          'Apple Color Emoji', 'Segoe UI Emoji';
        margin: 0;
        padding: 2.5rem;
        display: grid;
        place-items: center;
        min-height: 100vh;
        background: ${backgroundColor};
        color: ${textColor};
      }
      .card {
        max-width: 38rem;
        padding: 2rem;
        border-radius: 16px;
        background: ${cardColor};
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
      }
      h1 {
        margin: 0 0 0.75rem;
        font-weight: 650;
        font-size: clamp(1.75rem, 3vw + 1rem, 2.5rem);
      }
      p {
        opacity: 0.9;
        line-height: 1.6;
      }
      .hint {
        margin-top: 1.5rem;
        padding: 1rem 1.25rem;
        border-radius: 12px;
        background: color-mix(in srgb, ${accentColor} 14%, transparent);
        border: 1px solid color-mix(in srgb, ${accentColor} 40%, ${cardColor});
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${headline}</h1>
      <p>${message}</p>
      <p class="hint">Reload once you're reconnected to access the latest content.</p>
    </div>
  </body>
</html>
`

export async function writeOfflinePage(options = {}) {
  const {
    outFile,
    siteName = 'Guidogerb',
    headline = "You're offline",
    message = "Some pages may be unavailable without a connection. Please try again when you're back online.",
    backgroundColor = '#0b0d12',
    cardColor = '#12161f',
    textColor = '#eaeef3',
    accentColor = '#6ea8fe',
  } = options

  if (!outFile) throw new Error('writeOfflinePage requires an `outFile` option')

  const html = TEMPLATE({ siteName, headline, message, backgroundColor, cardColor, textColor, accentColor })
  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, html, 'utf8')
  return outFile
}
