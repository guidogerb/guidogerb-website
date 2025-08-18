import { describe, it, expect, vi } from 'vitest';

// Load the outputs JSON and validate essential keys exist
import outputs from '../../amplify_outputs.json';

describe('amplify_outputs.json', () => {
  it('contains required auth and data configuration', () => {
    expect(outputs).toBeTruthy();
    expect(outputs.auth).toBeTruthy();
    expect(outputs.auth.aws_region).toBeTypeOf('string');
    expect(outputs.auth.identity_pool_id).toMatch(/^[a-z0-9-]+:[0-9a-f-]+$/i);
    expect(outputs.data).toBeTruthy();
    expect(outputs.data.url).toMatch(/^https:\/\//);
    expect(outputs.data.authorization_types).toContain('AWS_IAM');
  });
});

// Ensure Amplify.configure is called with outputs when main.tsx is imported
vi.mock('aws-amplify', async () => {
  const actual = await vi.importActual<typeof import('aws-amplify')>('aws-amplify');
  return { ...actual, Amplify: { configure: vi.fn() } };
});

describe('main Amplify.configure', () => {
  it('calls Amplify.configure with outputs', async () => {
    // Prepare a root container for React before importing main
    document.body.innerHTML = '<div id="root"></div>';
    const { Amplify } = await import('aws-amplify');
    await import('../main');
    expect(Amplify.configure).toHaveBeenCalledWith(outputs);
  });
});
