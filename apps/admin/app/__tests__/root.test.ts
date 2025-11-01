import { describe, expect, it } from 'vitest';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { loader } from '../root.js';

describe('root loader', () => {
  it('returns the request url', () => {
    const request = new Request('https://fitted.test/dashboard');
    const args = {
      request,
      context: {} as LoaderFunctionArgs['context'],
      params: {}
    } satisfies LoaderFunctionArgs;

    const result = loader(args);

    expect(result.url).toBe('https://fitted.test/dashboard');
  });
});
