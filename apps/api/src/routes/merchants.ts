import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { getShopFromSessionToken } from '../services/session-token.js';

const merchantSettingsSchema = z.object({
  shopDomain: z.string().min(1),
  extensionEnabled: z.boolean().default(true),
  searchRadius: z.number().int().min(10).max(200).default(50),
  maxInstallers: z.number().int().min(1).max(10).default(3),
  notificationEmail: z.string().email().optional()
});

const merchantStatsQuerySchema = z.object({
  shopDomain: z.string().min(1),
  days: z.coerce.number().int().min(1).max(365).default(30)
});

export async function merchantRoutes(app: FastifyInstance) {
  // Verify session token and return merchant info
  app.post('/merchants/session', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        status: 'error',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);
    const shopDomain = getShopFromSessionToken(token);

    if (!shopDomain) {
      return reply.status(401).send({
        status: 'error',
        message: 'Invalid session token'
      });
    }

    try {
      // Find or create merchant
      let { data: merchant, error: fetchError } = await supabase
        .from('merchants')
        .select('id, shop_domain, settings, status')
        .eq('shop_domain', shopDomain)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!merchant) {
        // Auto-create merchant on first session
        const { data: newMerchant, error: createError } = await supabase
          .from('merchants')
          .insert({
            shop_domain: shopDomain,
            status: 'active',
            settings: {
              extensionEnabled: true,
              searchRadius: 50,
              maxInstallers: 3
            }
          })
          .select('id, shop_domain, settings, status')
          .single();

        if (createError) throw createError;
        merchant = newMerchant;
      }

      return reply.send({
        status: 'ok',
        merchant: {
          id: merchant.id,
          shopDomain: merchant.shop_domain,
          settings: merchant.settings || {
            extensionEnabled: true,
            searchRadius: 50,
            maxInstallers: 3
          },
          status: merchant.status
        }
      });
    } catch (err) {
      app.log.error(err, 'Error verifying session');
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to verify session'
      });
    }
  });

  // GET merchant settings
  app.get('/merchants/settings', async (request, reply) => {
    const shopDomain = (request.query as { shopDomain?: string }).shopDomain;

    if (!shopDomain) {
      return reply.badRequest('Shop domain required');
    }

    try {
      const { data: merchant, error } = await supabase
        .from('merchants')
        .select('id, shop_domain, settings')
        .eq('shop_domain', shopDomain)
        .maybeSingle();

      if (error) throw error;

      if (!merchant) {
        return reply.status(404).send({
          status: 'error',
          message: 'Merchant not found'
        });
      }

      return reply.send({
        status: 'ok',
        settings: merchant.settings || {
          extensionEnabled: true,
          searchRadius: 50,
          maxInstallers: 3
        }
      });
    } catch (err) {
      app.log.error(err, 'Error fetching merchant settings');
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to fetch settings'
      });
    }
  });

  // PUT merchant settings
  app.put('/merchants/settings', async (request, reply) => {
    const parsed = merchantSettingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Invalid settings');
    }

    const { shopDomain, ...settings } = parsed.data;

    try {
      // Find or create merchant
      let { data: merchant, error: fetchError } = await supabase
        .from('merchants')
        .select('id')
        .eq('shop_domain', shopDomain)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!merchant) {
        // Create new merchant record
        const { data: newMerchant, error: createError } = await supabase
          .from('merchants')
          .insert({
            shop_domain: shopDomain,
            settings,
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        merchant = newMerchant;
      } else {
        // Update existing merchant
        const { error: updateError } = await supabase
          .from('merchants')
          .update({ settings })
          .eq('id', merchant.id);

        if (updateError) throw updateError;
      }

      return reply.send({
        status: 'ok',
        message: 'Settings saved successfully'
      });
    } catch (err) {
      app.log.error(err, 'Error saving merchant settings');
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to save settings'
      });
    }
  });

  // GET merchant leads
  app.get('/merchants/leads', async (request, reply) => {
    const shopDomain = (request.query as { shopDomain?: string }).shopDomain;

    if (!shopDomain) {
      return reply.badRequest('Shop domain required');
    }

    try {
      // Get merchant ID
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('shop_domain', shopDomain)
        .maybeSingle();

      if (merchantError) throw merchantError;

      if (!merchant) {
        return reply.status(404).send({
          status: 'error',
          message: 'Merchant not found'
        });
      }

      // Get leads for this merchant
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          status,
          source,
          created_at,
          payload_json,
          offers (
            id,
            status,
            assignee_id
          )
        `)
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (leadsError) throw leadsError;

      return reply.send({
        status: 'ok',
        leads: leads || []
      });
    } catch (err) {
      app.log.error(err, 'Error fetching merchant leads');
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to fetch leads'
      });
    }
  });

  // GET merchant stats
  app.get('/merchants/stats', async (request, reply) => {
    const parsed = merchantStatsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? 'Invalid query');
    }

    const { shopDomain, days } = parsed.data;

    try {
      // Get merchant ID
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('shop_domain', shopDomain)
        .maybeSingle();

      if (merchantError) throw merchantError;

      if (!merchant) {
        return reply.status(404).send({
          status: 'error',
          message: 'Merchant not found'
        });
      }

      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get leads in date range
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, status, created_at')
        .eq('merchant_id', merchant.id)
        .gte('created_at', startDate.toISOString());

      if (leadsError) throw leadsError;

      // Calculate stats
      const totalLeads = leads?.length || 0;
      const pendingLeads = leads?.filter(l => l.status === 'pending').length || 0;
      const notifiedLeads = leads?.filter(l => l.status === 'notified').length || 0;
      const scheduledLeads = leads?.filter(l => l.status === 'scheduled').length || 0;
      const completedLeads = leads?.filter(l => l.status === 'completed').length || 0;

      return reply.send({
        status: 'ok',
        stats: {
          totalLeads,
          pendingLeads,
          notifiedLeads,
          scheduledLeads,
          completedLeads,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString(),
            days
          }
        }
      });
    } catch (err) {
      app.log.error(err, 'Error fetching merchant stats');
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to fetch stats'
      });
    }
  });
}
