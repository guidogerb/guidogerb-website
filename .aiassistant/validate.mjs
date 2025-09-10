#!/usr/bin/env node
import fs from 'node:fs'

const cfgPath = process.argv[2] || '.ai-self-review.json'
const inputPath = process.argv[3] || 0 // read from stdin if not provided

const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
const textRaw = inputPath ? fs.readFileSync(inputPath, 'utf8') : fs.readFileSync(0, 'utf8')

// Normalize to lowercase, replace unicode hyphens/dashes with ASCII '-', collapse whitespace
const unicodeHyphens = /[‐‑‒–—−]/g // various hyphen/dash code points
const normalize = (s) =>
  s.toLowerCase().normalize('NFKD').replace(unicodeHyphens, '-').replace(/\s+/g, ' ')

const text = normalize(textRaw)

const fails = []

for (const rule of cfg.rules) {
  const t = text

  const hasAll = (arr) => (arr || []).every((k) => t.includes(normalize(k)))
  const hasAny = (arr) => (arr || []).some((k) => t.includes(normalize(k)))
  const notAny = (arr) => !(arr || []).some((k) => t.includes(normalize(k)))

  // mustNotIncludeAny
  if (rule.mustNotIncludeAny && !notAny(rule.mustNotIncludeAny)) {
    fails.push({
      rule: rule.id,
      severity: rule.severity,
      msg: rule.description + ' (forbidden term present)',
    })
    continue
  }
  // mustIncludeAll
  if (rule.mustIncludeAll && !hasAll(rule.mustIncludeAll)) {
    fails.push({
      rule: rule.id,
      severity: rule.severity,
      msg: rule.description + ' (missing required terms)',
    })
    continue
  }
  // mustIncludeAny
  if (rule.mustIncludeAny && !hasAny(rule.mustIncludeAny)) {
    if (rule.severity !== 'error') {
      fails.push({
        rule: rule.id,
        severity: rule.severity,
        msg: rule.description + ' (consider mentioning)',
      })
    } else {
      fails.push({
        rule: rule.id,
        severity: rule.severity,
        msg: rule.description + ' (no acceptable term found)',
      })
    }
  }
  // ifMentionsAny → thenMustAlsoIncludeAny
  if (rule.ifMentionsAny && hasAny(rule.ifMentionsAny)) {
    if (!(rule.thenMustAlsoIncludeAny && hasAny(rule.thenMustAlsoIncludeAny))) {
      fails.push({ rule: rule.id, severity: rule.severity, msg: rule.message || rule.description })
    }
  }
}

const errors = fails.filter((f) => f.severity === 'error')
if (errors.length && cfg.defaults.mustPassAll) {
  console.error(JSON.stringify({ status: 'fail', errors: fails }, null, 2))
  process.exit(1)
}
console.log(JSON.stringify({ status: 'ok', notes: fails }, null, 2))
