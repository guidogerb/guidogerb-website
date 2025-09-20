import { describe, expect, it } from 'vitest'
import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const componentsRoot = path.resolve(__dirname, '..')
const barrelPath = path.join(componentsRoot, 'index.js')

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch (error) {
    return false
  }
}

async function collectPackagePaths(directory, root) {
  const entries = await readdir(directory, { withFileTypes: true })
  const packages = []

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue
    }

    const absolutePath = path.join(directory, entry.name)
    const packageJson = path.join(absolutePath, 'package.json')

    if (await fileExists(packageJson)) {
      packages.push(path.relative(root, absolutePath).replace(/\\/g, '/'))
      continue
    }

    packages.push(...(await collectPackagePaths(absolutePath, root)))
  }

  return packages
}

describe('@guidogerb/components barrel exports', () => {
  it('exports every published component package', async () => {
    const packagePaths = await collectPackagePaths(componentsRoot, componentsRoot)
    expect(packagePaths.length).toBeGreaterThan(0)

    const barrelContent = await readFile(barrelPath, 'utf8')

    const missingExports = packagePaths.filter((relativePath) => {
      const searchTerm = `./${relativePath}/index`
      return (
        !barrelContent.includes(`'${searchTerm}`) &&
        !barrelContent.includes(`"${searchTerm}`)
      )
    })

    expect(missingExports).toEqual([])
  })
})
