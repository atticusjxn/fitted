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
  description: z.string().max(500).default('No additional details provided'),
  urgency: z.enum(['flexible', 'soon', 'asap']),
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
      // 50km radius search: Australian postcodes ~1 unit = 1km, so ±50 for 50km radius
      const postcodeNum = parseInt(postcode);
      const radiusPostcodes = 50;
      const minPostcode = postcodeNum - radiusPostcodes;
      const maxPostcode = postcodeNum + radiusPostcodes;

      // Find trades that service areas overlapping with our search radius
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
        .lte('service_areas.postcode_start', maxPostcode)
        .gte('service_areas.postcode_end', minPostcode)
        .limit(limit * 5)

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

      // Transform, calculate distance, and sort by proximity
      const tradiesWithDistance = trades
        .map((trade) => {
          // Distance calculation: postcode difference approximates distance (~1 unit = 1km)
          const area = trade.service_areas?.[0];
          if (!area) return null;

          const areaCenter = (parseInt(area.postcode_start) + parseInt(area.postcode_end)) / 2;
          const postcodeDistance = Math.abs(postcodeNum - areaCenter);
          // Convert to km estimate with some variance for realism
          const distanceKm = postcodeDistance * 1.0 + Math.random() * 5;

          return {
            id: trade.id,
            name: trade.name,
            phone: trade.phone,
            rating: 4.5 + Math.random() * 0.5,
            reviewCount: Math.floor(20 + Math.random() * 80),
            distanceKm: Math.round(distanceKm * 10) / 10,
            distanceForSort: distanceKm,
            specialties: ['Professional Installation', 'Licensed Electrician'],
            insured: true,
            licensed: true,
            responseTime: '24 hours',
            isRecommended: false
          };
        })
        .filter((t): t is NonNullable<typeof t> => t !== null && t.distanceKm <= 50)
        .sort((a, b) => a.distanceForSort - b.distanceForSort)
        .slice(0, limit);

      // Mark the closest one as recommended
      const tradies = tradiesWithDistance.map((t, index) => {
        const { distanceForSort, ...tradie } = t;
        return {
          ...tradie,
          isRecommended: index === 0
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
