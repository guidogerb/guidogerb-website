#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

function log(msg) { console.log(`[publish] ${msg}`); }
function warn(msg) { console.warn(`[publish][warn] ${msg}`); }
function err(msg) { console.error(`[publish][error] ${msg}`); }

function loadJSON(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function resolveWorkspacePattern(cwd, pattern) {
  // Handles simple patterns with a single * (e.g., "@scope/pkg/*") and direct paths
  if (!pattern.includes('*')) {
    return [resolve(cwd, pattern)];
  }
  const before = pattern.split('*')[0];
  const after = pattern.slice(pattern.indexOf('*') + 1);
  const baseDir = resolve(cwd, before);
  let entries = [];
  try {
    entries = readdirSync(baseDir, { withFileTypes: true });
  } catch (e) {
    warn(`Workspace base not found: ${baseDir}`);
    return [];
  }
  return entries
    .filter(d => d.isDirectory())
    .map(d => resolve(baseDir, d.name + after.replaceAll('/', sep)));
}

function discoverWorkspaces(rootDir) {
  const rootPkg = loadJSON(join(rootDir, 'package.json'));
  const patterns = rootPkg.workspaces || [];
  const dirs = new Set();
  for (const p of patterns) {
    for (const d of resolveWorkspacePattern(rootDir, p)) {
      try {
        const pkgPath = join(d, 'package.json');
        statSync(pkgPath);
        dirs.add(d);
      } catch (e) {
        // not a package
      }
    }
  }
  return [...dirs];
}

function publishPackage(pkgDir, options) {
  const pkgJsonPath = join(pkgDir, 'package.json');
  const pkg = loadJSON(pkgJsonPath);
  const name = pkg.name || pkgDir;
  if (pkg.private) {
    warn(`${name} is private: true — skipping (set "private": false to publish).`);
    return { skipped: true };
  }
  log(`Publishing ${name}@${pkg.version} from ${pkgDir}`);
  if (options.dryRun) {
    log(`[dry-run] npm publish --registry ${options.registry}`);
    return { dryRun: true };
  }
  const args = ['publish', '--registry', options.registry];
  const res = spawnSync('npm', args, { cwd: pkgDir, stdio: 'inherit', shell: true });
  if (res.status !== 0) {
    throw new Error(`npm publish failed for ${name} (exit ${res.status})`);
  }
  return { published: true };
}

function main() {
  const rootDir = process.cwd();
  const argv = process.argv.slice(2);
  const options = {
    dryRun: argv.includes('--dry') || argv.includes('--dry-run'),
    registry: process.env.NPM_REGISTRY || 'https://npm.pkg.github.com',
    filter: null,
  };
  const filterIndex = argv.findIndex(a => a === '--filter' || a === '-F');
  if (filterIndex !== -1 && argv[filterIndex + 1]) {
    options.filter = argv[filterIndex + 1];
  }

  const workspaces = discoverWorkspaces(rootDir);
  if (!workspaces.length) {
    err('No workspaces found.');
    process.exit(1);
  }

  log(`Found ${workspaces.length} workspace(s).`);
  let publishedCount = 0, skipped = 0;
  for (const dir of workspaces) {
    const pkg = loadJSON(join(dir, 'package.json'));
    if (options.filter && !pkg.name.includes(options.filter)) {
      continue;
    }
    try {
      const r = publishPackage(dir, options);
      if (r.published) publishedCount++;
      if (r.skipped || r.dryRun) skipped++;
    } catch (e) {
      err(e.message);
      process.exitCode = 1;
    }
  }
  log(`Done. Published: ${publishedCount}, Skipped/Dry: ${skipped}`);
}

main();
