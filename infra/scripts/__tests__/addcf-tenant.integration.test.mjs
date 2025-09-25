// @vitest-environment node
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { spawn } from 'node:child_process'
import { request } from 'node:http'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { getTenantSecretName } from '../resolve-tenants.mjs'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const scriptPath = fileURLToPath(new URL('../../ps1/AddCF-Tenant.ps1', import.meta.url))

const TEST_TIMEOUT = 600_000

function commandExists(command) {
  return new Promise((resolve) => {
    const probe = spawn(command, ['-NoLogo', '-NoProfile', '-Command', 'exit'], { stdio: 'ignore' })

    probe.on('error', (error) => {
      if (error.code === 'ENOENT') {
        resolve(false)
      } else {
        resolve(false)
      }
    })

    probe.on('close', (code) => {
      resolve(code === 0)
    })
  })
}

async function resolvePowerShellCommand() {
  const candidates = ['pwsh', 'powershell', 'powershell.exe']
  for (const candidate of candidates) {
    const available = await commandExists(candidate)
    if (available) {
      return candidate
    }
  }
  return null
}

const powerShellCommand = await resolvePowerShellCommand()
const integrationTest = powerShellCommand ? test : test.skip

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? repoRoot,
      env: options.env ?? process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        const error = new Error(`${command} ${args.join(' ')} exited with code ${code}\n${stderr}`)
        error.stdout = stdout
        error.stderr = stderr
        error.exitCode = code
        reject(error)
      }
    })
  })
}

function httpGetPreview(port, hostHeader) {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/',
        method: 'GET',
        headers: {
          host: hostHeader,
        },
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body })
          } else {
            reject(new Error(`Unexpected status ${res.statusCode}`))
          }
        })
      },
    )

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

async function waitForPreview(port, hostHeader, attempts = 120, delayMs = 1000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await httpGetPreview(port, hostHeader)
      return response.body
    } catch (error) {
      await delay(delayMs)
    }
  }

  throw new Error('Preview server did not become ready within the expected window.')
}

describe('AddCF-Tenant integration', () => {
  if (!powerShellCommand) {
    test.skip('PowerShell executable not available in the current environment', () => {})
  }

  integrationTest(
    'scaffolds a tenant and passes repository workflow checks',
    async () => {
      const tempRoot = await mkdtemp(join(tmpdir(), 'cf-tenant-test-'))
      const worktreePath = join(tempRoot, 'worktree')
      const domainSlug = `tenant${Date.now()}`
      const domain = `${domainSlug}.example.com`
      const workspacePackage = `websites-${domainSlug}`
      const displayName = 'Integration Test Tenant'
      const distributionId = 'EGG1850W4K2XV'
      const envKeys = ['VITE_API_BASE_URL', 'VITE_COGNITO_CLIENT_ID']
      const previewPort = 4280
      const previewHostHeader = `local.${domain}`

      await run('git', ['worktree', 'add', '--force', worktreePath], {
        cwd: repoRoot,
      })

      try {
        await run(powerShellCommand, [
          '-File',
          scriptPath,
          '-Domain',
          domain,
          '-DisplayName',
          displayName,
          '-DistributionId',
          distributionId,
          '-EnvSecretKeys',
          ...envKeys,
          '-RepoRoot',
          worktreePath,
        ])

        const workspacePath = join(worktreePath, 'websites', domain)
        await stat(workspacePath)

        const packageJson = JSON.parse(await readFile(join(workspacePath, 'package.json'), 'utf8'))
        expect(packageJson.name).toBe(workspacePackage)

        const cfDistributions = JSON.parse(
          await readFile(join(worktreePath, 'infra/ps1/cf-distributions.json'), 'utf8'),
        )
        expect(cfDistributions[domain]).toBe(distributionId)

        const manifest = JSON.parse(
          await readFile(join(worktreePath, 'infra/ps1/tenant-manifest.json'), 'utf8'),
        )
        const manifestEntry = manifest.find((entry) => entry.domain === domain)
        expect(manifestEntry).toBeTruthy()
        expect(manifestEntry.distributionId).toBe(distributionId)
        expect(manifestEntry.displayName).toBe(displayName)
        expect(manifestEntry.workspaceSlug).toBe(domainSlug)
        expect(manifestEntry.workspacePackage).toBe(workspacePackage)
        expect(manifestEntry.workspaceDirectory).toBe(`websites/${domain}`)
        expect(manifestEntry.envSecretKeys).toEqual(envKeys)
        const expectedSecretName = getTenantSecretName(domain)
        expect(manifestEntry.secretName).toBe(expectedSecretName)
        expect(manifestEntry.secretFileName).toBe(`${expectedSecretName}-secrets`)

        const repoCommands = [['clean'], ['install'], ['build'], ['lint'], ['format']]

        for (const args of repoCommands) {
          await run('pnpm', args, { cwd: worktreePath })
        }

        const preview = spawn(
          'pnpm',
          [
            '--filter',
            workspacePackage,
            'preview',
            '--',
            '--host',
            '127.0.0.1',
            '--port',
            String(previewPort),
          ],
          {
            cwd: worktreePath,
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        )

        let previewLogs = ''
        preview.stdout?.on('data', (chunk) => {
          previewLogs += chunk.toString()
        })
        preview.stderr?.on('data', (chunk) => {
          previewLogs += chunk.toString()
        })

        try {
          const html = await waitForPreview(previewPort, previewHostHeader)
          expect(html).toContain(`<title>${displayName}</title>`)
        } catch (error) {
          error.message = `${error.message}\nPreview logs:\n${previewLogs}`
          throw error
        } finally {
          preview.kill('SIGINT')
          await once(preview, 'close').catch(() => {})
        }
      } finally {
        await run('git', ['worktree', 'remove', '--force', worktreePath], {
          cwd: repoRoot,
        }).catch(() => {})

        await rm(tempRoot, { recursive: true, force: true }).catch(() => {})
      }
    },
    TEST_TIMEOUT,
  )
})
