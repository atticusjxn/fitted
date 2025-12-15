import Fastify, { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import rawBody from 'fastify-raw-body';
import { healthRoutes } from './routes/health.js';
import { billingRoutes } from './routes/billing.js';
import { stripeWebhookRoutes } from './routes/stripe-webhook.js';
import { shopifyRoutes } from './routes/shopify.js';
import { shopifyWebhookRoutes } from './routes/shopify-webhooks.js';
import { installerRoutes } from './routes/installers.js';
import { matchingRoutes } from './routes/matching.js';
import { schedulingRoutes } from './routes/scheduling.js';
import { tradesRoutes } from './routes/trades.js';
import { installationsRoutes } from './routes/installations.js';
import { categoriesRoutes } from './routes/categories.js';
import { checkoutRoutes } from './routes/checkout.js';
import { merchantRoutes } from './routes/merchants.js';

export function buildServer(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  });

  void app.register(rawBody, {
    field: 'rawBody',
    global: false,
    runFirst: true
  });
  void app.register(helmet);
  void app.register(cors, {
    origin: true, // Allow all origins for checkout extensions
    credentials: true
  });
  void app.register(sensible);

  void app.register(healthRoutes, { prefix: '/api' });
  void app.register(billingRoutes, { prefix: '/api' });
  void app.register(stripeWebhookRoutes, { prefix: '/api' });
  void app.register(shopifyRoutes, { prefix: '/api' });
  void app.register(shopifyWebhookRoutes, { prefix: '/api' });
  void app.register(categoriesRoutes, { prefix: '/api' });
  void app.register(installationsRoutes, { prefix: '/api' });
  void app.register(matchingRoutes, { prefix: '/api' });
  void app.register(schedulingRoutes, { prefix: '/api' });
  void app.register(tradesRoutes, { prefix: '/api' });
  void app.register(checkoutRoutes, { prefix: '/api' });
  void app.register(merchantRoutes, { prefix: '/api' });
  void app.register(installerRoutes);

  return app;
}
