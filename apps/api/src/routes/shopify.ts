import { randomBytes } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { buildShopifyAuthUrl, exchangeCodeForToken, fetchCollections, fetchProducts, verifyHmac } from '../services/shopify.js';
import { store } from '../services/store.js';

const stateStore = new Set<string>();

function generateState() {
  const state = randomBytes(16).toString('hex');
  stateStore.add(state);
  return state;
}

function consumeState(state: string) {
  if (!stateStore.has(state)) return false;
  stateStore.delete(state);
  return true;
}

export async function shopifyRoutes(app: FastifyInstance) {
  app.get('/shopify/install', async (request, reply) => {
    const shop = (request.query as { shop?: string }).shop;
    if (!shop) {
      return reply.badRequest('Missing shop');
    }

    const state = generateState();
    const authUrl = buildShopifyAuthUrl(shop, state);
    return reply.redirect(authUrl);
  });

  app.get('/shopify/callback', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const shop = query.shop;
    const code = query.code;
    const state = query.state;

    if (!shop || !code || !state) {
      return reply.badRequest('Missing shop/code/state');
    }

    if (!consumeState(state)) {
      return reply.status(400).send('Invalid state');
    }

    const params = new URLSearchParams(request.url.split('?')[1] ?? '');
    if (!verifyHmac(params)) {
      return reply.status(400).send('Invalid HMAC');
    }

    try {
      const token = await exchangeCodeForToken(shop, code);

      // Redirect to the embedded app with the shop parameter
      const redirectUrl = `https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/apps/${process.env.SHOPIFY_API_KEY || '55cff46b87909fddd4280d1a41253bbd'}`;
      return reply.redirect(redirectUrl);
    } catch (err) {
      app.log.error({ err }, 'Shopify token exchange failed');
      return reply.status(500).send('Failed to exchange token');
    }
  });

  app.get('/shopify/products', async (request, reply) => {
    const { shop } = request.query as { shop?: string };
    if (!shop) {
      return reply.badRequest('Missing shop');
    }

    try {
      const products = await fetchProducts(shop);

      // Group by product_type for easy toggles.
      const grouped = products.reduce<Record<string, { id: number; title: string; handle: string }[]>>(
        (acc, product) => {
          const key = product.product_type || 'Uncategorized';
          if (!acc[key]) acc[key] = [];
          acc[key].push({ id: product.id, title: product.title, handle: product.handle });
          return acc;
        },
        {}
      );

      return reply.send({ products, grouped });
    } catch (err) {
      app.log.error({ err }, 'Failed to fetch Shopify products');
      return reply.status(500).send('Failed to fetch products');
    }
  });

  app.get('/shopify/collections', async (request, reply) => {
    const { shop } = request.query as { shop?: string };
    if (!shop) {
      return reply.badRequest('Missing shop');
    }

    try {
      const collections = await fetchCollections(shop);
      return reply.send({ collections });
    } catch (err) {
      app.log.error({ err }, 'Failed to fetch Shopify collections');
      return reply.status(500).send('Failed to fetch collections');
    }
  });

  // Debug route to view stored shop tokens in dev.
  app.get('/shopify/debug/shops', async (_req, reply) => {
    const shops = await store.listShopTokens();
    return reply.send({ shops });
  });
}
