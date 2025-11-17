import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  chargeLead,
  createSetupIntent,
  listCustomerPaymentMethods
} from '../services/stripe.js';
import { store } from '../services/store.js';

const setupIntentBody = z.object({
  tradieId: z.string().min(1),
  customerId: z.string().min(1)
});

const chargeBody = z.object({
  tradieId: z.string().min(1),
  customerId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.string().min(3).max(3).default('aud'),
  description: z.string().optional()
});

export async function billingRoutes(app: FastifyInstance) {
  app.post('/billing/setup-intent', async (request, reply) => {
    const parsed = setupIntentBody.safeParse(request.body);

    if (!parsed.success) {
      return reply.badRequest('Invalid body for setup intent');
    }

    const setupIntent = await createSetupIntent(parsed.data.customerId);

    // Persist billing profile with at least customer linkage.
    store.upsertBillingProfile({
      tradieId: parsed.data.tradieId,
      stripeCustomerId: parsed.data.customerId
    });

    return reply.send({
      id: setupIntent.id,
      clientSecret: setupIntent.client_secret
    });
  });

  app.get('/billing/payment-methods', async (request, reply) => {
    const { customerId } = request.query as { customerId?: string };
    if (!customerId) {
      return reply.badRequest('customerId is required');
    }

    const paymentMethods = await listCustomerPaymentMethods(customerId);
    return reply.send({ items: paymentMethods.data });
  });

  app.post('/leads/:id/charge', async (request, reply) => {
    const parsed = chargeBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest('Invalid body for charge');
    }

    const leadId = (request.params as { id?: string }).id ?? 'lead';

    try {
      const paymentIntent = await chargeLead({
        ...parsed.data,
        description: parsed.data.description ?? `Lead charge for ${leadId}`
      });

      const requiresAuth = paymentIntent.status === 'requires_action';

      // Persist billing profile default PM and auth flag.
      store.upsertBillingProfile({
        tradieId: parsed.data.tradieId,
        stripeCustomerId: parsed.data.customerId,
        defaultPaymentMethodId: parsed.data.paymentMethodId,
        requiresAuth
      });

      // Persist lead payment record.
      store.upsertLeadPayment({
        leadId,
        tradieId: parsed.data.tradieId,
        paymentIntentId: paymentIntent.id,
        status: requiresAuth
          ? 'requires_action'
          : paymentIntent.status === 'succeeded'
            ? 'paid'
            : 'pending'
      });

      return reply.send({
        id: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        requiresAction: requiresAuth
      });
    } catch (error: unknown) {
      // Bubble up useful Stripe errors to the client for remediation.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stripeError = error as any;
      app.log.error(stripeError, 'Stripe charge failed');

      const message = stripeError?.message ?? 'Stripe charge failed';
      const code = stripeError?.code;

      // Persist failed attempt for visibility.
      store.upsertLeadPayment({
        leadId,
        tradieId: parsed.success ? parsed.data.tradieId : 'unknown',
        paymentIntentId: stripeError?.payment_intent?.id ?? 'unknown',
        status: code === 'authentication_required' ? 'requires_action' : 'failed'
      });

      return reply.status(400).send({ message, code });
    }
  });
}
