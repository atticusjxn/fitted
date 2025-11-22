import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';

const statusBody = z.object({
  status: z.enum(['pending', 'approved', 'rejected'])
});

const skillBody = z.object({
  category_id: z.string().uuid(),
  supported_complexities: z.array(z.enum(['simple', 'standard', 'complex', 'heavy'])).optional(),
  min_team_size: z.number().int().min(1).optional(),
  max_team_size: z.number().int().min(1).optional(),
  score: z.number().min(0).max(100).optional()
});

const credentialBody = z.object({
  credential_type: z.string().min(1),
  issuer: z.string().optional(),
  credential_id: z.string().optional(),
  expires_at: z.string().optional(),
  verified: z.boolean().optional()
});

export async function tradesRoutes(app: FastifyInstance) {
  app.get('/admin/trades', async (_request, reply) => {
    const { data, error } = await supabase
      .from('trades')
      .select('*, trade_skills(*), trade_credentials(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      app.log.error(error, 'failed to list trades');
      return reply.status(500).send({ message: 'Failed to list trades' });
    }

    return reply.send({ trades: data ?? [] });
  });

  app.post('/admin/trades/:id/status', async (request, reply) => {
    const tradeId = (request.params as { id?: string }).id;
    if (!tradeId) return reply.badRequest('trade id required');
    const parsed = statusBody.safeParse(request.body);
    if (!parsed.success) return reply.badRequest('invalid status');

    const { error } = await supabase
      .from('trades')
      .update({ status: parsed.data.status })
      .eq('id', tradeId);

    if (error) {
      app.log.error(error, 'failed to update trade status');
      return reply.status(500).send({ message: 'Failed to update status' });
    }

    return reply.send({ ok: true });
  });

  app.post('/admin/trades/:id/skills', async (request, reply) => {
    const tradeId = (request.params as { id?: string }).id;
    if (!tradeId) return reply.badRequest('trade id required');
    const parsed = skillBody.safeParse(request.body);
    if (!parsed.success) return reply.badRequest('invalid skill payload');

    const payload = parsed.data;
    const { error } = await supabase.from('trade_skills').upsert({
      trade_id: tradeId,
      category_id: payload.category_id,
      supported_complexities: payload.supported_complexities,
      min_team_size: payload.min_team_size,
      max_team_size: payload.max_team_size,
      score: payload.score
    });

    if (error) {
      app.log.error(error, 'failed to upsert trade skill');
      return reply.status(500).send({ message: 'Failed to upsert trade skill' });
    }

    return reply.send({ ok: true });
  });

  app.post('/admin/trades/:id/credentials', async (request, reply) => {
    const tradeId = (request.params as { id?: string }).id;
    if (!tradeId) return reply.badRequest('trade id required');
    const parsed = credentialBody.safeParse(request.body);
    if (!parsed.success) return reply.badRequest('invalid credential payload');

    const { error } = await supabase.from('trade_credentials').insert({
      trade_id: tradeId,
      credential_type: parsed.data.credential_type,
      issuer: parsed.data.issuer,
      credential_id: parsed.data.credential_id,
      expires_at: parsed.data.expires_at,
      verified: parsed.data.verified ?? false
    });

    if (error) {
      app.log.error(error, 'failed to insert credential');
      return reply.status(500).send({ message: 'Failed to insert credential' });
    }

    return reply.send({ ok: true });
  });
}
