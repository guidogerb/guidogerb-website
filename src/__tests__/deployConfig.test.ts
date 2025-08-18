import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('amplify.yml deployment configuration', () => {
  it('includes pipeline-deploy in backend build and builds frontend', () => {
    const file = path.join(process.cwd(), 'amplify.yml');
    const text = fs.readFileSync(file, 'utf8');
    const doc = yaml.load(text) as unknown as {
        version?: number;
        backend?: { phases?: { build?: { commands?: string[] } } };
        frontend?: { phases?: { build?: { commands?: string[] } } };
      };
    expect(doc?.version).toBe(1);
    const backendCmds = doc?.backend?.phases?.build?.commands as string[];
    const frontendCmds = doc?.frontend?.phases?.build?.commands as string[];
    expect(Array.isArray(backendCmds)).toBe(true);
    expect(Array.isArray(frontendCmds)).toBe(true);
    expect(backendCmds.join('\n')).toMatch(/pipeline-deploy/);
    expect(frontendCmds.join('\n')).toMatch(/npm run build/);
  });
});
