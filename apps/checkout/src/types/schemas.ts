import { z } from 'zod';
import { leadSchema as baseLeadSchema } from '@fitted/domain';

export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, 'Enter a valid 4 digit postcode');

export const serviceTypeSchema = z
  .string()
  .min(1, 'Select a service type')
  .max(100, 'Service type is too long');

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'This field is required')
  .max(80, 'Please keep under 80 characters');

export const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address')
  .max(160, 'Email is too long');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[\d\s+()-]{8,}$/, 'Enter at least 8 digits');

export const descriptionSchema = z
  .string()
  .trim()
  .min(10, 'Add at least 10 characters')
  .max(500, 'Keep your description under 500 characters');

export const urgencySchema = z.enum(['flexible', 'soon', 'urgent'], {
  errorMap: () => ({ message: 'Select an urgency level' })
});

export const tradieSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().min(0),
  distanceKm: z.number().min(0),
  specialties: z.array(z.string()).nonempty(),
  insured: z.boolean().default(true),
  licensed: z.boolean().default(true),
  responseTime: z.string().optional(),
  isRecommended: z.boolean().default(false)
});

export const leadFormSchema = z.object({
  postalCode: postalCodeSchema,
  serviceType: serviceTypeSchema,
  tradieId: tradieSchema.shape.id,
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  description: descriptionSchema,
  urgency: urgencySchema
});

export type Tradie = z.infer<typeof tradieSchema>;
export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const contactDetailsSchema = leadFormSchema.pick({
  serviceType: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  description: true,
  urgency: true
});

export type ContactDetailsValues = z.infer<typeof contactDetailsSchema>;

export const leadSubmissionSchema = baseLeadSchema.extend({
  tradieId: z.string(),
  serviceType: serviceTypeSchema,
  urgency: urgencySchema,
  customer: baseLeadSchema.shape.customer.extend({
    firstName: nameSchema,
    lastName: nameSchema,
    phone: phoneSchema,
    email: emailSchema
  }),
  productDetails: baseLeadSchema.shape.productDetails
    .optional()
    .default({})
});

export type LeadSubmissionPayload = z.infer<typeof leadSubmissionSchema>;
