#!/usr/bin/env node
import { appendFileSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_COMMON_TLDS = ['com', 'org', 'net', 'app', 'dev', 'io']

export function getTenantSlug(domain, { commonTlds = DEFAULT_COMMON_TLDS } = {}) {
  if (!domain || typeof domain !== 'string') {
    throw new TypeError('domain must be a non-empty string')
  }
  const lower = domain.toLowerCase()
  const parts = lower
    .split('.')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  let candidate
  if (parts.length === 2 && commonTlds.includes(parts[1])) {
    candidate = parts[0]
  } else if (parts.length > 0) {
    candidate = parts.join('-')
  } else {
    candidate = lower
  }

  let normalized = candidate
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!normalized) {
    normalized = lower
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  if (!normalized) {
    throw new Error(`Unable to derive slug from domain '${domain}'`)
  }

  return normalized
}

export function getTenantSecretName(domain) {
  if (!domain || typeof domain !== 'string') {
    throw new TypeError('domain must be a non-empty string')
  }
  const sanitized = domain
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  if (!sanitized) {
    throw new Error(`Unable to derive secret name from domain '${domain}'`)
  }
  return `${sanitized}_VITE_ENV`
}

function loadJsonFile(filePath) {
  const contents = readFileSync(filePath, 'utf8')
  try {
    return JSON.parse(contents)
  } catch (error) {
    throw new Error(`Failed to parse JSON file at '${filePath}': ${error.message}`)
  }
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory()
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

function discoverWebsiteDomains(websitesRoot) {
  const entries = []
  const dirEntries = readdirSync(websitesRoot, { withFileTypes: true })
  for (const entry of dirEntries) {
    if (!entry.isDirectory()) continue
    const domain = entry.name
    const pkgPath = join(websitesRoot, domain, 'package.json')
    try {
      statSync(pkgPath)
      entries.push(domain)
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        continue
      }
      throw error
    }
  }
  return entries
}

export function loadTenantRegistry(repoRoot = process.cwd()) {
  const root = resolve(repoRoot)
  const cfMapPath = join(root, 'infra', 'ps1', 'cf-distributions.json')
  const websitesRoot = join(root, 'websites')

  if (!isDirectory(websitesRoot)) {
    throw new Error(`Expected websites directory at '${websitesRoot}'`)
  }

  const distributionMap = loadJsonFile(cfMapPath)
  const domainsFromCf = Object.keys(distributionMap)
  const workspaceDomains = discoverWebsiteDomains(websitesRoot)

  const missingInCf = workspaceDomains.filter((domain) => !domainsFromCf.includes(domain))
  if (missingInCf.length > 0) {
    throw new Error(
      `cf-distributions.json is missing domain entries: ${missingInCf.sort().join(', ')}`,
    )
  }

  const missingWorkspaces = domainsFromCf.filter((domain) => !workspaceDomains.includes(domain))
  if (missingWorkspaces.length > 0) {
    throw new Error(
      `CloudFront distribution map references domains without workspaces: ${missingWorkspaces
        .sort()
        .join(', ')}`,
    )
  }

  const tenants = domainsFromCf
    .sort((a, b) => a.localeCompare(b))
    .map((domain) => {
      const distributionId = distributionMap[domain]
      if (!distributionId) {
        throw new Error(`Distribution ID missing for domain '${domain}' in cf-distributions.json`)
      }
      const workspaceSlug = getTenantSlug(domain)
      const scriptSlug = workspaceSlug
      const secretName = getTenantSecretName(domain)
      return {
        domain,
        site: domain,
        distributionId,
        workspaceSlug,
        scriptSlug,
        workspacePackage: `websites-${workspaceSlug}`,
        workspaceDirectory: join('websites', domain),
        secretName,
      }
    })

  return tenants
}

export function buildMatrix(tenants) {
  if (!Array.isArray(tenants)) {
    throw new TypeError('tenants must be an array')
  }
  return {
    include: tenants.map((tenant) => ({
      domain: tenant.domain,
      site: tenant.site,
      distributionId: tenant.distributionId,
      workspaceSlug: tenant.workspaceSlug,
      workspacePackage: tenant.workspacePackage,
      workspaceDirectory: tenant.workspaceDirectory,
      scriptSlug: tenant.scriptSlug,
      secretName: tenant.secretName,
    })),
  }
}

function formatOutput(value) {
  return JSON.stringify(value)
}

function main(argv = process.argv) {
  const args = argv.slice(2)
  let format = 'json'
  let githubOutputKey = null
  let repoRoot = process.cwd()

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--format' && args[i + 1]) {
      format = args[++i]
    } else if (arg === '--github-output' && args[i + 1]) {
      githubOutputKey = args[++i]
    } else if (arg === '--repo-root' && args[i + 1]) {
      repoRoot = resolve(args[++i])
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: resolve-tenants.mjs [--format json|matrix] [--github-output key] [--repo-root path]',
      )
      return
    }
  }

  const tenants = loadTenantRegistry(repoRoot)
  const value = format === 'matrix' ? buildMatrix(tenants) : tenants
  const serialized = formatOutput(value)

  if (githubOutputKey) {
    const outputPath = process.env.GITHUB_OUTPUT
    if (!outputPath) {
      throw new Error('GITHUB_OUTPUT environment variable is not set')
    }
    const line = `${githubOutputKey}=${serialized}\n`
    appendFileSync(outputPath, line)
  }

  console.log(serialized)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
