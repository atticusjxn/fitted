import { z } from 'zod';

export const leadSchema = z.object({
  postcode: z.string().min(3).max(4),
  productCategory: z.string(),
  productDetails: z.record(z.string().min(1), z.unknown()).default({}),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6)
  })
});

export type LeadPayload = z.infer<typeof leadSchema>;
