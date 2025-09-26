#!/usr/bin/env node
/**
 * Robust clean script to replace the long rimraf CLI invocation (which was
 * failing on Windows with confusing path errors). This version:
 *  - Avoids a massive one-liner of globs that can exceed Windows ARG limits.
 *  - Runs each pattern sequentially and never hard-fails the process.
 *  - Works even before dependencies are installed (rimraf optional).
 *  - Avoids top-level await so it runs on older Node LTS versions.
 */
import path from 'node:path'
import process from 'node:process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const patterns = [
  'node_modules',
  '@guidogerb/**/node_modules',
  'websites/**/node_modules',
  '@guidogerb/**/dist',
  'websites/**/dist',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'npm-shrinkwrap.json',
  '**/pnpm-lock.yaml',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/npm-shrinkwrap.json',
]

let rimrafFn = null
let rimrafAvailable = true
try {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  const { rimraf } = require('rimraf')
  rimrafFn = rimraf
} catch (e) {
  rimrafAvailable = false
}

const root = process.cwd()
const results = []

async function removePattern(pattern) {
  const started = Date.now()
  if (!rimrafFn) {
    results.push({ pattern, ok: false, ms: 0, error: 'rimraf not installed yet' })
    return
  }
  try {
    await rimrafFn(pattern, { glob: true })
    results.push({ pattern, ok: true, ms: Date.now() - started })
  } catch (err) {
    results.push({ pattern, ok: false, ms: Date.now() - started, error: err && err.message })
  }
}

;(async () => {
  for (const p of patterns) {
    // eslint-disable-next-line no-await-in-loop
    await removePattern(p)
  }
  const okCount = results.filter((r) => r.ok).length
  const failCount = results.length - okCount
  const longest = results.reduce((m, r) => Math.max(m, r.ms), 0)
  const summaryLines = [
    `Clean summary (@ ${path.basename(root)}): ${okCount} ok, ${failCount} failed (max ${longest}ms)`,
  ]
  if (failCount) {
    summaryLines.push(...results.filter((r) => !r.ok).map((r) => `  - ${r.pattern} :: ${r.error}`))
    if (!rimrafAvailable) {
      summaryLines.push('\nNote: rimraf not installed yet. After first install this will succeed.')
    }
  }
  console.log(summaryLines.join('\n'))
  process.exit(0)
})()
