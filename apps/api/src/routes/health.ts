import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', () => ({
    status: 'ok',
    uptime: process.uptime()
  }));
}
