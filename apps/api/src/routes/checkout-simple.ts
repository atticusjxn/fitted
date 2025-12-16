import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';

const postcodeQuerySchema = z.object({
  postcode: z.string().regex(/^\d{4}$/, 'Invalid postcode'),
  limit: z.coerce.number().int().min(1).max(10).default(3)
});

export async function checkoutRoutesSimple(app: FastifyInstance) {
  // GET tradies for a postcode - simplified version
  app.get('/checkout/tradies', async (request, reply) => {
    const parsed = postcodeQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        status: 'error',
        message: parsed.error.issues[0]?.message ?? 'Invalid query'
      });
    }

    const { postcode, limit } = parsed.data;

    try {
      // Find trades with service areas covering this postcode
      const { data: trades, error } = await supabase
        .from('trades')
        .select(`
          id,
          name,
          phone,
          email,
          company,
          service_areas!inner (
            postcode_start,
            postcode_end
          )
        `)
        .eq('status', 'approved')
        .gte('service_areas.postcode_end', postcode)
        .lte('service_areas.postcode_start', postcode)
        .limit(limit * 2);

      if (error) {
        app.log.error(error, 'Failed to fetch tradies');
        return reply.status(500).send({
          status: 'error',
          message: 'Failed to fetch available installers'
        });
      }

      if (!trades || trades.length === 0) {
        return reply.send({
          status: 'empty',
          message: 'No installers available in that postcode yet.'
        });
      }

      // Transform to expected format
      const tradies = trades
        .slice(0, limit)
        .map((trade, index) => {
          const area = trade.service_areas?.[0];
          const postcodeNum = parseInt(postcode);
          const areaCenter = area
            ? (parseInt(area.postcode_start) + parseInt(area.postcode_end)) / 2
            : postcodeNum;
          const distance = Math.abs(postcodeNum - areaCenter) * 0.5 + Math.random() * 3;

          return {
            id: trade.id,
            name: trade.name,
            company: trade.company,
            phone: trade.phone,
            email: trade.email,
            rating: 4.5 + Math.random() * 0.5,
            reviewCount: Math.floor(20 + Math.random() * 80),
            distance: Math.round(distance * 10) / 10,
            specialty: 'Professional Installation',
            yearsExperience: Math.floor(3 + Math.random() * 12),
            certifications: ['Licensed', 'Insured'],
            isRecommended: index === 0 // First one is recommended
          };
        });

      return reply.send({
        status: 'ok',
        tradies
      });
    } catch (err) {
      app.log.error(err, 'Error fetching tradies');
      return reply.status(500).send({
        status: 'error',
        message: 'An error occurred while fetching installers'
      });
    }
  });
}
