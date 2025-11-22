import { FastifyInstance } from 'fastify';
import { matchLeadToTrades, simulateMatch } from '../services/matching.js';

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

  app.post('/matching/simulate', async (request, reply) => {
    const body = request.body as { category_id?: string; postcode?: string; limit?: number };
    if (!body.category_id) {
      return reply.badRequest('category_id is required');
    }
    try {
      const matches = await simulateMatch(body.category_id, body.postcode);
      return reply.send({ matches: matches.slice(0, body.limit ?? 3) });
    } catch (err) {
      app.log.error(err, 'simulate matching failed');
      return reply.status(400).send({ message: (err as Error).message });
    }
  });
}
