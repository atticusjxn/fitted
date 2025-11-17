import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { constructStripeEvent } from '../services/stripe.js';
import { env } from '../env.js';

export async function stripeWebhookRoutes(app: FastifyInstance) {
  app.post('/webhook/stripe', { config: { rawBody: true } }, async (request, reply) => {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      app.log.warn('STRIPE_WEBHOOK_SECRET not set; skipping signature verification');
      return reply.code(200).send({ received: true });
    }

    const signature = request.headers['stripe-signature'];
    if (!signature) {
      return reply.badRequest('Missing Stripe signature header');
    }

    let event: Stripe.Event;
    try {
      event = constructStripeEvent(request.rawBody as Buffer, signature);
    } catch (err) {
      app.log.error({ err }, 'Stripe webhook signature verification failed');
      return reply.status(400).send('Webhook Error');
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        app.log.info({ paymentIntent: pi.id }, 'Lead payment succeeded');
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        app.log.warn({ paymentIntent: pi.id }, 'Lead payment failed');
        break;
      }
      default: {
        app.log.debug({ eventType: event.type }, 'Unhandled Stripe event');
      }
    }

    return reply.code(200).send({ received: true });
  });
}
