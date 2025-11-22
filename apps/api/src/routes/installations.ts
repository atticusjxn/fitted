import { FastifyInstance } from 'fastify';
import { supabase } from '../services/supabase.js';
import { fetchProducts } from '../services/shopify.js';

function getMerchantId(request: any): string | null {
  const claim = request.headers['x-merchant-id'] as string | undefined;
  const q = (request.query as Record<string, string | undefined>)?.merchantId;
  const b = (request.body as Record<string, string | undefined> | undefined)?.merchantId;
  return claim ?? q ?? b ?? null;
}

async function resolveMerchantIdFromShop(shop?: string): Promise<string | null> {
  if (!shop) return null;
  const { data } = await supabase
    .from('merchants')
    .select('id')
    .eq('shop_domain', shop)
    .maybeSingle();
  return data?.id ?? null;
}

export async function installationsRoutes(app: FastifyInstance) {
  // GET current product settings
  app.get('/installations/settings', async (request, reply) => {
    let merchantId = getMerchantId(request);
    const { shop } = request.query as { shop?: string };
    if (!merchantId) {
      merchantId = await resolveMerchantIdFromShop(shop);
    }
    if (!merchantId) return reply.status(401).send({ message: 'Missing merchant id' });
    if (!shop) return reply.badRequest('Missing shop');

    const { data, error } = await supabase
      .from('product_installation_settings')
      .select('*')
      .eq('merchant_id', merchantId);

    if (error) {
      app.log.error(error, 'failed to load installation settings');
      return reply.status(500).send({ message: 'Failed to load settings' });
    }

    return reply.send({ settings: data ?? [] });
  });

  // UPSERT product setting
  app.post('/installations/settings', async (request, reply) => {
    let merchantId = getMerchantId(request);
    if (!merchantId && (request.body as any)?.shop) {
      merchantId = await resolveMerchantIdFromShop((request.body as any).shop);
    }
    if (!merchantId) return reply.status(401).send({ message: 'Missing merchant id' });

    const body = request.body as {
      productId: string;
      enabled: boolean;
      categoryId?: string;
      complexity?: string;
      priceMode?: string;
      priceCents?: number;
    };

    if (!body.productId) return reply.badRequest('productId required');

    const { error } = await supabase.from('product_installation_settings').upsert({
      merchant_id: merchantId,
      product_gid: body.productId,
      enabled: body.enabled,
      override_category_id: body.categoryId,
      override_complexity: body.complexity,
      price_mode: body.priceMode,
      price_cents: body.priceCents,
      source: 'merchant'
    });

    if (error) {
      app.log.error(error, 'failed to upsert installation setting');
      return reply.status(500).send({ message: 'Failed to save setting' });
    }

    return reply.send({ ok: true });
  });

  // BULK enable by collection (fetch products from Shopify)
  app.post('/installations/settings/bulk', async (request, reply) => {
    let merchantId = getMerchantId(request);
    const { shop } = request.body as { shop?: string };
    if (!merchantId) {
      merchantId = await resolveMerchantIdFromShop(shop);
    }
    if (!merchantId) return reply.status(401).send({ message: 'Missing merchant id' });
    if (!shop) return reply.badRequest('Missing shop');

    const body = request.body as {
      collectionId?: string;
      categoryId?: string;
      complexity?: string;
      priceMode?: string;
      priceCents?: number;
    };

    try {
      const products = await fetchProducts(shop);
      const updates = products.map((p) => ({
        merchant_id: merchantId,
        product_gid: String(p.id),
        enabled: true,
        override_category_id: body.categoryId,
        override_complexity: body.complexity,
        price_mode: body.priceMode ?? 'fixed',
        price_cents: body.priceCents,
        source: 'merchant'
      }));

      const { error } = await supabase.from('product_installation_settings').upsert(updates);
      if (error) {
        app.log.error(error, 'failed bulk upsert');
        return reply.status(500).send({ message: 'Failed bulk enable' });
      }
      return reply.send({ ok: true, count: updates.length });
    } catch (err) {
      app.log.error(err, 'bulk enable failed');
      return reply.status(500).send({ message: 'Failed bulk enable' });
    }
  });

  // Get classifications needing review
  app.get('/installations/classifications', async (request, reply) => {
    let merchantId = getMerchantId(request);
    const { status, shop } = request.query as { status?: string; shop?: string };
    if (!merchantId) {
      merchantId = await resolveMerchantIdFromShop(shop);
    }
    if (!merchantId) return reply.status(401).send({ message: 'Missing merchant id' });

    const { data, error } = await supabase
      .from('product_classifications')
      .select('*')
      .eq('merchant_id', merchantId)
      .or('low_confidence.eq.true,status.eq.pending');

    if (error) {
      app.log.error(error, 'failed to fetch classifications');
      return reply.status(500).send({ message: 'Failed to load classifications' });
    }

    return reply.send({ classifications: data ?? [] });
  });

  // Review classification
  app.post('/installations/classifications/review', async (request, reply) => {
    let merchantId = getMerchantId(request);
    const body = request.body as {
      id: string;
      actionType: 'accept' | 'reject';
      category?: string;
      complexity?: string;
      shop?: string;
    };

    if (!merchantId && body.shop) {
      merchantId = await resolveMerchantIdFromShop(body.shop);
    }
    if (!merchantId) return reply.status(401).send({ message: 'Missing merchant id' });

    if (!body.id) return reply.badRequest('id required');

    const updates = {
      status: body.actionType === 'accept' ? 'confirmed' : 'rejected',
      detected_category_id: body.category ?? null,
      detected_complexity: body.complexity ?? null,
      low_confidence: false,
      locked: body.actionType === 'accept'
    };

    const { error } = await supabase
      .from('product_classifications')
      .update(updates)
      .eq('id', body.id)
      .eq('merchant_id', merchantId);

    if (error) {
      app.log.error(error, 'failed to update classification');
      return reply.status(500).send({ message: 'Failed to update classification' });
    }

    if (body.actionType === 'accept' && body.shop) {
      // auto-enable installation
      const { data: cls } = await supabase
        .from('product_classifications')
        .select('product_gid')
        .eq('id', body.id)
        .maybeSingle();

      if (cls?.product_gid) {
        await supabase.from('product_installation_settings').upsert({
          merchant_id: merchantId,
          product_gid: cls.product_gid,
          enabled: true,
          override_category_id: body.category,
          override_complexity: body.complexity,
          source: 'merchant'
        });
      }
    }

    return reply.send({ ok: true });
  });
}
