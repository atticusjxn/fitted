import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('dotenv', () => ({
  config: vi.fn()
}));

const ORIGINAL_ENV = { ...process.env };

describe('env', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'test',
      API_PORT: '4500',
      API_HOST: '127.0.0.1'
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('parses environment variables', async () => {
    const { env } = await import('../env.js');
    expect(env.NODE_ENV).toBe('test');
    expect(env.API_PORT).toBe(4500);
    expect(env.API_HOST).toBe('127.0.0.1');
  });
});
