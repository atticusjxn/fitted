import { FastifyInstance } from 'fastify';
import { matchLeadToTrades } from '../services/matching.js';

export async function matchingRoutes(app: FastifyInstance) {
  app.post('/leads/:id/match', async (request, reply) => {
    const leadId = (request.params as { id?: string }).id;
    if (!leadId) {
      return reply.badRequest('lead id is required');
    }

    try {
      const matches = await matchLeadToTrades(leadId);
      return reply.send({ matches });
    } catch (err) {
      app.log.error(err, 'matching failed');
      return reply.status(400).send({ message: (err as Error).message });
    }
  });
}
