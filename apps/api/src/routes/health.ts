import { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance) {
  app.get('/health', () => ({
    status: 'ok',
    uptime: process.uptime()
  }));
}
