import Fastify, { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { healthRoutes } from './routes/health.js';

export function buildServer(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  });

  void app.register(helmet);
  void app.register(cors, {
    origin: true
  });
  void app.register(sensible);

  void app.register(healthRoutes, { prefix: '/api' });

  return app;
}
