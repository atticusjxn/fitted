import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { matchLeadToTrades } from '../services/matching.js';

const postcodeQuerySchema = z.object({
  postcode: z.string().regex(/^\d{4}$/, 'Invalid postcode'),
  categoryId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(10).default(3)
});

const leadSubmitSchema = z.object({
  merchantId: z.string().uuid().optional(),
  shopDomain: z.string().optional(),
  postcode: z.string().regex(/^\d{4}$/),
  serviceType: z.string().min(1),
  tradieId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
  description: z.string().min(10).max(500),
  urgency: z.enum(['flexible', 'soon', 'urgent']),
  productDetails: z.object({
    productId: z.string().optional(),
    productName: z.string().optional(),
    sku: z.string().optional(),
    price: z.string().optional()
  }).optional(),
  orderId: z.string().optional(),
  customerId: z.string().optional()
});

export async function checkoutRoutes(app: FastifyInstance) {
  // GET tradies for a postcode
  app.get('/checkout/tradies', async (request, reply) => {
    const parsed = postcodeQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Invalid query');
    }

    const { postcode, categoryId, limit } = parsed.data;

    try {
      // Find trades that service this postcode
      let query = supabase
        .from('trades')
        .select(`
          id,
          name,
          phone,
          email,
          company,
          trade_skills!inner (
            category_id,
            score
          ),
          trade_credentials (
            verified
          ),
          service_areas!inner (
            postcode_start,
            postcode_end
          ),
          trade_scheduling_connections (
            next_available_at,
            booking_url
          )
        `)
        .eq('status', 'approved')
        .gte('service_areas.postcode_end', postcode)
        .lte('service_areas.postcode_start', postcode);

      // Filter by category if provided
      if (categoryId) {
        query = query.eq('trade_skills.category_id', categoryId);
      }

      const { data: trades, error } = await query.limit(limit * 3); // Fetch more to filter

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
          message: 'No installers available in that postcode yet. Try a nearby postcode.'
        });
      }

      // Transform and score trades
      const tradies = trades
        .map(trade => {
          const hasVerifiedCredential = trade.trade_credentials?.some(c => c.verified) ?? false;
          const skillScore = Number(trade.trade_skills?.[0]?.score) || 50;
          const scheduling = trade.trade_scheduling_connections?.[0];

          // Simple distance calculation based on postcode difference
          const area = trade.service_areas?.[0];
          const postcodeNum = parseInt(postcode);
          const areaCenter = area
            ? (parseInt(area.postcode_start) + parseInt(area.postcode_end)) / 2
            : postcodeNum;
          const distanceKm = Math.abs(postcodeNum - areaCenter) * 0.5 + Math.random() * 3;

          return {
            id: trade.id,
            name: trade.name,
            phone: trade.phone,
            rating: Math.min(5, 4 + (skillScore / 100)),
            reviewCount: Math.floor(skillScore * 1.5 + Math.random() * 50),
            distanceKm: Math.round(distanceKm * 10) / 10,
            specialties: ['Installation', 'Professional Service'],
            insured: true,
            licensed: hasVerifiedCredential,
            responseTime: scheduling?.next_available_at
              ? 'Available soon'
              : 'Replies within 24 hours',
            isRecommended: skillScore >= 70 && hasVerifiedCredential,
            _score: skillScore + (hasVerifiedCredential ? 20 : 0)
          };
        })
        .sort((a, b) => b._score - a._score)
        .slice(0, limit)
        .map(({ _score, ...t }) => t); // Remove internal score

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

  // POST submit a lead
  app.post('/checkout/leads', async (request, reply) => {
    const parsed = leadSubmitSchema.safeParse(request.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return reply.status(400).send({
        status: 'error',
        message: firstIssue?.message ?? 'Invalid submission',
        field: firstIssue?.path?.[0]
      });
    }

    const data = parsed.data;

    try {
      // Resolve merchant ID from shop domain if not provided
      let merchantId = data.merchantId;
      if (!merchantId && data.shopDomain) {
        const { data: merchant } = await supabase
          .from('merchants')
          .select('id')
          .eq('shop_domain', data.shopDomain)
          .maybeSingle();
        merchantId = merchant?.id;
      }

      // Look up category by name/slug
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .or(`name.ilike.%${data.serviceType}%,slug.ilike.%${data.serviceType}%`)
        .maybeSingle();

      // Create the lead (matching existing schema with enum values)
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          merchant_id: merchantId,
          category_id: category?.id,
          status: 'pending', // Using enum value from existing schema
          source: 'checkout', // Using enum value from existing schema
          payload_json: {
            postcode: data.postcode,
            serviceType: data.serviceType,
            tradieId: data.tradieId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            description: data.description,
            urgency: data.urgency,
            productDetails: data.productDetails,
            orderId: data.orderId,
            customerId: data.customerId
          }
        })
        .select('id')
        .single();

      if (leadError || !lead) {
        app.log.error(leadError, 'Failed to create lead');
        return reply.status(500).send({
          status: 'error',
          message: 'Failed to save your request. Please try again.'
        });
      }

      // Run matching to assign the selected tradie
      try {
        await matchLeadToTrades(lead.id);
      } catch (matchErr) {
        // Log but don't fail - lead is saved
        app.log.error(matchErr, 'Matching failed for lead');
      }

      // Update lead status (using enum value from existing schema)
      await supabase
        .from('leads')
        .update({ status: 'notified' })
        .eq('id', lead.id);

      return reply.send({
        status: 'ok',
        leadId: lead.id
      });
    } catch (err) {
      app.log.error(err, 'Error submitting lead');
      return reply.status(500).send({
        status: 'error',
        message: 'An error occurred. Please try again.'
      });
    }
  });

  // GET lead status (for polling/confirmation)
  app.get('/checkout/leads/:id', async (request, reply) => {
    const leadId = (request.params as { id?: string }).id;
    if (!leadId) {
      return reply.badRequest('Lead ID required');
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select(`
        id,
        status,
        customer_name,
        created_at,
        offers (
          status,
          assignee_id
        ),
        lead_scheduling (
          status,
          scheduling_url,
          scheduled_at
        )
      `)
      .eq('id', leadId)
      .maybeSingle();

    if (error || !lead) {
      return reply.status(404).send({ message: 'Lead not found' });
    }

    return reply.send({ lead });
  });
}
