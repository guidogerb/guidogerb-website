import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { deployReferenceTenant } from '../deploy-reference.mjs'

describe('deployReferenceTenant', () => {
  let tempDir

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true })
      tempDir = undefined
    }
  })

  it('runs the build, sync, and invalidation commands for the reference tenant', () => {
    const spawnMock = vi.fn().mockReturnValue({ status: 0 })
    const logger = { info: vi.fn() }
    tempDir = mkdtempSync(join(tmpdir(), 'guidogerb-publish-deploy-'))
    const distDir = join(tempDir, 'dist')
    mkdirSync(distDir, { recursive: true })
    writeFileSync(join(distDir, 'index.html'), '<html></html>')

    deployReferenceTenant({
      env: {
        DEPLOY_S3_BUCKET: 'guidogerb-reference-bucket',
        DEPLOY_CLOUDFRONT_DISTRIBUTION_ID: 'EDISTRIBUTION123',
      },
      spawn: spawnMock,
      logger,
      cwd: '/repo/root',
      distDir,
      stdio: 'pipe',
    })

    expect(spawnMock).toHaveBeenCalledTimes(3)
    expect(spawnMock).toHaveBeenNthCalledWith(
      1,
      'pnpm',
      ['--filter', 'websites-guidogerbpublishing', 'build'],
      expect.objectContaining({ cwd: '/repo/root', stdio: 'pipe' }),
    )
    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      'aws',
      [
        's3',
        'sync',
        resolve(distDir),
        's3://guidogerb-reference-bucket/',
        '--delete',
      ],
      expect.objectContaining({ cwd: '/repo/root', stdio: 'pipe' }),
    )
    expect(spawnMock).toHaveBeenNthCalledWith(
      3,
      'aws',
      ['cloudfront', 'create-invalidation', '--distribution-id', 'EDISTRIBUTION123', '--paths', '/*'],
      expect.objectContaining({ cwd: '/repo/root', stdio: 'pipe' }),
    )
  })

  it('throws when required environment variables are missing', () => {
    expect(() =>
      deployReferenceTenant({
        env: {},
        spawn: vi.fn(),
        cwd: '/repo/root',
        distDir: join(tmpdir(), 'missing-dist'),
        stdio: 'pipe',
      }),
    ).toThrow(/DEPLOY_S3_BUCKET/)
  })

  it('throws when the build output directory is not created', () => {
    const spawnMock = vi.fn().mockReturnValue({ status: 0 })
    const distDir = join(tmpdir(), `missing-dist-${Date.now()}`)

    expect(() =>
      deployReferenceTenant({
        env: {
          DEPLOY_S3_BUCKET: 'guidogerb-reference-bucket',
          DEPLOY_CLOUDFRONT_DISTRIBUTION_ID: 'EDISTRIBUTION123',
        },
        spawn: spawnMock,
        cwd: '/repo/root',
        distDir,
        stdio: 'pipe',
      }),
    ).toThrow(/Build output missing/)
    expect(spawnMock).toHaveBeenCalledTimes(1)
  })
})
