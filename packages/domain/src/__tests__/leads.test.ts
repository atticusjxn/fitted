import { describe, expect, it } from 'vitest';
import { leadSchema } from '../leads.js';

describe('leadSchema', () => {
  it('validates correct payloads', () => {
    const result = leadSchema.safeParse({
      postcode: '3000',
      productCategory: 'lighting',
      customer: {
        name: 'Alex Example',
        email: 'alex@example.com',
        phone: '0400000000'
      }
    });

    expect(result.success).toBe(true);
  });

  it('fails invalid payloads', () => {
    const result = leadSchema.safeParse({
      postcode: 'abc',
      productCategory: '',
      customer: {
        name: '',
        email: 'not-an-email',
        phone: '123'
      }
    });

    expect(result.success).toBe(false);
  });
});
