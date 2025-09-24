#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

let scriptDir
try {
  const scriptUrl = new URL('.', import.meta.url)
  if (scriptUrl.protocol === 'file:') {
    scriptDir = fileURLToPath(scriptUrl)
  }
} catch {
  // Fall back to process.cwd() when running in non-file module contexts (e.g., Vitest bundler)
  scriptDir = undefined
}

const workspaceDir = scriptDir ? resolve(scriptDir, '..') : undefined
const repoRoot = workspaceDir ? resolve(workspaceDir, '..', '..') : process.cwd()
const defaultDistDir = workspaceDir ? resolve(workspaceDir, 'dist') : resolve(process.cwd(), 'dist')

function log(logger, message) {
  if (logger && typeof logger.info === 'function') {
    logger.info(message)
    return
  }
  if (logger && typeof logger.log === 'function') {
    logger.log(message)
  }
}

function runCommand(command, args, spawn, { cwd, stdio }) {
  const result = spawn(command, args, { cwd, stdio })
  if (result?.error) {
    throw result.error
  }
  if ((typeof result?.status === 'number' && result.status !== 0) || result?.signal) {
    const exitInfo = result?.signal ? `signal ${result.signal}` : `exit code ${result?.status}`
    throw new Error(`Command failed: ${[command, ...args].join(' ')} (${exitInfo})`)
  }
  return result
}

export function deployReferenceTenant({
  env = process.env,
  spawn = spawnSync,
  cwd = repoRoot,
  distDir = defaultDistDir,
  logger = console,
  stdio = 'inherit',
} = {}) {
  const bucket = env.DEPLOY_S3_BUCKET
  if (!bucket) {
    throw new Error(
      'DEPLOY_S3_BUCKET environment variable is required to deploy the reference tenant.',
    )
  }

  const distributionId = env.DEPLOY_CLOUDFRONT_DISTRIBUTION_ID
  if (!distributionId) {
    throw new Error(
      'DEPLOY_CLOUDFRONT_DISTRIBUTION_ID environment variable is required to deploy the reference tenant.',
    )
  }

  const resolvedDistDir = resolve(distDir)

  log(logger, '[deploy] Building websites-guidogerbpublishing workspace')
  runCommand('pnpm', ['--filter', 'websites-guidogerbpublishing', 'build'], spawn, { cwd, stdio })

  if (!existsSync(resolvedDistDir)) {
    throw new Error(`Build output missing at ${resolvedDistDir}. Run the build step and try again.`)
  }

  log(logger, `[deploy] Syncing build artifacts to s3://${bucket}/`)
  runCommand('aws', ['s3', 'sync', resolvedDistDir, `s3://${bucket}/`, '--delete'], spawn, {
    cwd,
    stdio,
  })

  log(logger, `[deploy] Invalidating CloudFront distribution ${distributionId}`)
  runCommand(
    'aws',
    ['cloudfront', 'create-invalidation', '--distribution-id', distributionId, '--paths', '/*'],
    spawn,
    { cwd, stdio },
  )

  log(logger, '[deploy] Deployment complete.')
}

let isCliInvocation = false
try {
  const scriptPath = fileURLToPath(import.meta.url)
  if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
    isCliInvocation = true
  }
} catch {
  isCliInvocation = false
}

if (isCliInvocation) {
  try {
    deployReferenceTenant()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[deploy] ${message}`)
    process.exit(1)
  }
}
