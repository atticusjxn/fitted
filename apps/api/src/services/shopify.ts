import crypto from 'node:crypto';
import { env } from '../env.js';
import { store } from './store.js';

const SHOPIFY_AUTH_PATH = '/admin/oauth/authorize';
const SHOPIFY_TOKEN_PATH = '/admin/oauth/access_token';

export function buildShopifyAuthUrl(shop: string, state: string) {
  const params = new URLSearchParams({
    client_id: env.SHOPIFY_API_KEY,
    scope: env.SHOPIFY_SCOPES,
    redirect_uri: `${env.SHOPIFY_APP_URL}/api/shopify/callback`,
    state
  });

  return `https://${shop}${SHOPIFY_AUTH_PATH}?${params.toString()}`;
}

export function verifyHmac(query: URLSearchParams) {
  const hmac = query.get('hmac');
  if (!hmac) return false;

  const entries = Array.from(query.entries())
    .filter(([key]) => key !== 'hmac' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const digest = crypto
    .createHmac('sha256', env.SHOPIFY_API_SECRET)
    .update(entries)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

export async function exchangeCodeForToken(shop: string, code: string) {
  const endpoint = `https://${shop}${SHOPIFY_TOKEN_PATH}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.SHOPIFY_API_KEY,
      client_secret: env.SHOPIFY_API_SECRET,
      code
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange token: ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string };

  store.saveShopToken({ shop, accessToken: data.access_token });
  return data.access_token;
}

export async function fetchProducts(shop: string) {
  const token = store.getShopToken(shop);
  if (!token) {
    throw new Error('No access token for this shop. Install the app first.');
  }

  const response = await fetch(`https://${shop}/admin/api/2024-10/products.json?limit=50`, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    products: Array<{ id: number; title: string; product_type: string; handle: string }>;
  };

  return data.products;
}
