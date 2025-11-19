import Fastify, { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import rawBody from 'fastify-raw-body';
import { healthRoutes } from './routes/health.js';
import { billingRoutes } from './routes/billing.js';
import { stripeWebhookRoutes } from './routes/stripe-webhook.js';
import { shopifyRoutes } from './routes/shopify.js';
import { installerRoutes } from './routes/installers.js';

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
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = new Set([
        'https://tryfitted.com',
        'https://www.tryfitted.com'
      ]);

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'), false);
    }
  });
  void app.register(sensible);

  void app.register(healthRoutes, { prefix: '/api' });
  void app.register(billingRoutes, { prefix: '/api' });
  void app.register(stripeWebhookRoutes, { prefix: '/api' });
  void app.register(shopifyRoutes, { prefix: '/api' });
  void app.register(installerRoutes, { prefix: '/api' });

  return app;
}
