import { FastifyInstance } from 'fastify';
import { supabase } from '../services/supabase.js';

export async function categoriesRoutes(app: FastifyInstance) {
  app.get('/categories', async (_request, reply) => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name', { ascending: true });

    if (error) {
      app.log.error(error, 'failed to fetch categories');
      return reply.status(500).send({ message: 'Failed to load categories' });
    }

    return reply.send({ categories: data ?? [] });
  });
}
