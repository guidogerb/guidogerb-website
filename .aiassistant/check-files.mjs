import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT_DIR = process.cwd()
const INDEX_FILENAMES = new Set(['index.html', 'index.js', 'index.jsx'])
const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  '.cache',
  'coverage',
  's3',
  'tmp',
  'temp',
])
const ALLOWED_STATUS = new Set(['todo', 'in progress', 'complete'])
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const errors = []
const validatedTasks = new Set()

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch (error) {
    return false
  }
}

function formatLocation(filePath, lineNumber) {
  const relativePath = path.relative(ROOT_DIR, filePath)
  const displayPath = relativePath === '' ? '.' : relativePath
  return lineNumber ? `${displayPath}:${lineNumber}` : displayPath
}

async function validateTasksFile(filePath) {
  if (validatedTasks.has(filePath)) {
    return
  }

  validatedTasks.add(filePath)

  let raw
  try {
    raw = await fs.readFile(filePath, 'utf8')
  } catch (error) {
    errors.push(`${formatLocation(filePath)} - Unable to read tasks.md (${error.message})`)
    return
  }

  const lines = raw.split(/\r?\n/)
  const headerIndex = lines.findIndex((line) => {
    if (!/^\s*\|/.test(line)) {
      return false
    }

    const lower = line.toLowerCase()
    return (
      lower.includes('|') &&
      lower.includes('name') &&
      lower.includes('createddate') &&
      !lower.includes('---')
    )
  })

  if (headerIndex === -1) {
    errors.push(
      `${formatLocation(filePath)} - Missing markdown table header with required task fields.`,
    )
    return
  }

  const headerLine = lines[headerIndex]
  const headerColumns = headerLine
    .split('|')
    .slice(1, -1)
    .map((column) => column.trim().toLowerCase())
    .filter((column) => column.length > 0)
  const expectedColumns = [
    'name',
    'createddate',
    'lastupdateddate',
    'completeddate',
    'status',
    'description',
  ]

  if (headerColumns.length !== expectedColumns.length) {
    errors.push(
      `${formatLocation(filePath, headerIndex + 1)} - Expected ${expectedColumns.length} task columns (${expectedColumns.join(
        ', ',
      )}). Found ${headerColumns.length}.`,
    )
    return
  }

  for (let index = 0; index < expectedColumns.length; index += 1) {
    if (headerColumns[index] !== expectedColumns[index]) {
      errors.push(
        `${formatLocation(filePath, headerIndex + 1)} - Expected column \"${expectedColumns[index]}\" at position ${
          index + 1
        } but found \"${headerColumns[index] || ''}\".`,
      )
    }
  }

  const separatorLine = lines[headerIndex + 1]
  if (!separatorLine || !/^\s*\|(?:\s*-+\s*\|)+\s*$/.test(separatorLine)) {
    errors.push(
      `${formatLocation(filePath, headerIndex + 2)} - Missing or invalid markdown table separator row (--- entries).`,
    )
  }

  let dataRowCount = 0
  for (let lineIndex = headerIndex + 2; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    if (!/^\s*\|/.test(line)) {
      if (line.trim().length === 0) {
        continue
      }
      break
    }

    if (/^\s*\|(?:\s*-+\s*\|)+\s*$/.test(line)) {
      continue
    }

    dataRowCount += 1
    const columns = line
      .split('|')
      .slice(1, -1)
      .map((column) => column.trim())

    if (columns.length !== expectedColumns.length) {
      errors.push(
        `${formatLocation(filePath, lineIndex + 1)} - Expected ${expectedColumns.length} columns but found ${
          columns.length
        }.`,
      )
      continue
    }

    const [name, createdDate, lastUpdatedDate, completedDate, status, description] = columns

    if (!name) {
      errors.push(`${formatLocation(filePath, lineIndex + 1)} - Task name must not be empty.`)
    }

    if (!DATE_PATTERN.test(createdDate)) {
      errors.push(
        `${formatLocation(filePath, lineIndex + 1)} - createdDate must use YYYY-MM-DD format (found \"${createdDate}\").`,
      )
    }

    if (!DATE_PATTERN.test(lastUpdatedDate)) {
      errors.push(
        `${formatLocation(filePath, lineIndex + 1)} - lastUpdatedDate must use YYYY-MM-DD format (found \"${lastUpdatedDate}\").`,
      )
    }

    if (completedDate !== '-' && !DATE_PATTERN.test(completedDate)) {
      errors.push(
        `${formatLocation(filePath, lineIndex + 1)} - completedDate must use YYYY-MM-DD format or '-' when incomplete (found \"${completedDate}\").`,
      )
    }

    const normalizedStatus = status.toLowerCase()
    if (!ALLOWED_STATUS.has(normalizedStatus)) {
      errors.push(
        `${formatLocation(filePath, lineIndex + 1)} - status must be one of ${Array.from(
          ALLOWED_STATUS,
        )
          .map((value) => `\"${value}\"`)
          .join(', ')} (found \"${status}\").`,
      )
    }

    if (!description) {
      errors.push(`${formatLocation(filePath, lineIndex + 1)} - description must not be empty.`)
    }
  }

  if (dataRowCount === 0) {
    errors.push(
      `${formatLocation(filePath, headerIndex + 1)} - Task table must include at least one task row.`,
    )
  }
}

async function walkDirectories(currentDir) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true })

  let hasIndexFile = false
  let hasReadme = false
  let hasTasks = false

  for (const entry of entries) {
    if (entry.isFile()) {
      const lowercaseName = entry.name.toLowerCase()
      if (INDEX_FILENAMES.has(lowercaseName)) {
        hasIndexFile = true
      }

      if (lowercaseName === 'readme.md') {
        hasReadme = true
      }

      if (lowercaseName === 'tasks.md') {
        hasTasks = true
        await validateTasksFile(path.join(currentDir, entry.name))
      }
    }
  }

  if (hasIndexFile) {
    if (!hasTasks) {
      errors.push(
        `${formatLocation(currentDir)} - Missing tasks.md (required because index file exists in this directory).`,
      )
    }

    if (!hasReadme) {
      errors.push(
        `${formatLocation(currentDir)} - Missing README.md (required because index file exists in this directory).`,
      )
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    if (IGNORED_DIRECTORIES.has(entry.name)) {
      continue
    }

    await walkDirectories(path.join(currentDir, entry.name))
  }
}

async function main() {
  const globalTasksPath = path.join(ROOT_DIR, 'global-tasks.md')
  if (!(await pathExists(globalTasksPath))) {
    errors.push('global-tasks.md - File is required at repository root.')
  } else {
    await validateTasksFile(globalTasksPath)
  }

  await walkDirectories(ROOT_DIR)

  if (errors.length > 0) {
    console.error('AI policy violations detected:')
    for (const message of errors) {
      console.error(`- ${message}`)
    }
    process.exitCode = 1
    return
  }

  console.log('All README.md and tasks.md files comply with the AI assistant policy.')
}

main().catch((error) => {
  console.error('Unexpected error while running ai:check:files:', error)
  process.exitCode = 1
})
