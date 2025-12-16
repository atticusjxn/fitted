# Shopify App Setup Guide

## Overview
This guide will help you configure and deploy your Fitted Shopify app. The app allows merchants to offer installation services at checkout.

## Prerequisites

1. **Shopify Partner Account**: Sign up at https://partners.shopify.com
2. **Development Store**: Create a development store from your Partner Dashboard
3. **Shopify CLI**: Already installed (version 3.87.4)

## Step 1: Create Your App in Shopify Partner Dashboard

1. Go to https://partners.shopify.com
2. Navigate to **Apps** > **Create app**
3. Choose **Create app manually**
4. Fill in the app details:
   - **App name**: Fitted
   - **App URL**: `https://fitted-api.fly.dev`
   - **Allowed redirection URLs**:
     - `https://fitted-api.fly.dev/api/shopify/callback`
     - `http://localhost:3001/api/shopify/callback` (for local development)

5. After creating the app, you'll receive:
   - **Client ID** (API Key)
   - **Client Secret** (API Secret Key)

## Step 2: Update Configuration Files

### Update `shopify.app.toml`

Edit the file at the project root and fill in these values:

```toml
client_id = "YOUR_CLIENT_ID_FROM_PARTNER_DASHBOARD"
application_url = "https://fitted-api.fly.dev"

[build]
dev_store_url = "your-dev-store.myshopify.com"
```

### Update Fly.io Secrets

Your API is running on Fly.io, so you need to set secrets there:

```bash
# Set Shopify credentials as Fly secrets
flyctl secrets set \
  SHOPIFY_API_KEY=YOUR_CLIENT_ID \
  SHOPIFY_API_SECRET=YOUR_CLIENT_SECRET \
  SHOPIFY_APP_URL=https://fitted-api.fly.dev \
  SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,read_customers \
  --app fitted-api
```

For local development, update your `/apps/api/.env` file:

```env
SHOPIFY_API_KEY=YOUR_CLIENT_ID
SHOPIFY_API_SECRET=YOUR_CLIENT_SECRET
SHOPIFY_APP_URL=http://localhost:3001
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,read_customers
```

## Step 3: Build and Deploy

### Build the Checkout Extension

```bash
npm run build:checkout
```

### Deploy Your API to Fly.io

Your API is already configured for Fly.io deployment:

```bash
# Deploy the API
cd apps/api
flyctl deploy

# Verify it's running
flyctl status
curl https://fitted-api.fly.dev/api/health
```

Make sure your Fly secrets are set (see Step 2 above).

## Step 4: Link Your App

From your project root, run:

```bash
shopify app config link
```

This will link your local project to the app you created in the Partner Dashboard.

## Step 5: Start Development Server

To start developing with live preview:

```bash
shopify app dev
```

This will:
1. Start your app development server
2. Create a secure tunnel
3. Provide a preview URL for testing
4. Enable hot reload for your checkout extension

**Note**: Make sure your API server is running separately:

```bash
npm run dev:api
```

## Step 6: Install on Development Store

1. When you run `shopify app dev`, it will provide an installation URL
2. Open that URL in your browser
3. Select your development store
4. Click "Install app"
5. Grant the requested permissions

## Step 7: Configure the Extension

After installation:

1. Go to your Shopify admin
2. Navigate to **Settings** > **Checkout**
3. Scroll to **Checkout extensions**
4. Find "Fitted Installation at Checkout"
5. Click **Add** to add it to your checkout
6. Position it where you want it to appear
7. Click **Save**

## Testing Your App

### Test the Checkout Extension

1. Add a product to your cart in your development store
2. Proceed to checkout
3. You should see your Fitted installation form appear
4. Test the form submission and API integration

### Test OAuth Flow

1. Visit: `https://your-api.fly.dev/api/shopify/install?shop=your-store.myshopify.com`
2. You should be redirected to Shopify for authorization
3. After granting permissions, you'll be redirected back with a token

## Development Workflow

### Local Development

For local development with hot reload:

```bash
# Terminal 1: API server (local)
npm run dev:api

# Terminal 2: Admin app (optional, for admin panel development)
npm run dev:admin

# Terminal 3: Shopify app dev server (for extension development)
shopify app dev
```

**Note**: When using `shopify app dev`, your checkout extension will be served locally with hot reload, but your API calls will still go to `https://fitted-api.fly.dev` (production).

If you want to test against local API:
1. Update `SHOPIFY_APP_URL` in your local `.env` to `http://localhost:3001`
2. Use a tool like ngrok to expose your local API: `ngrok http 3001`
3. Update the ngrok URL in your Shopify Partner Dashboard redirect URLs

### Building for Production

```bash
# Build checkout extension
npm run build:checkout

# Deploy the extension
shopify app deploy
```

## Project Structure

```
fitted/
├── shopify.app.toml              # Main app configuration
├── extensions/
│   └── checkout-ui/
│       ├── shopify.extension.toml  # Extension configuration
│       ├── src/                    # Symlink to apps/checkout/src
│       └── dist/                   # Symlink to apps/checkout/dist
├── apps/
│   ├── checkout/                   # Checkout UI extension source
│   ├── admin/                      # Admin panel (Remix)
│   └── api/                        # Backend API (Fastify)
└── packages/
    └── domain/                     # Shared domain logic
```

## Key Shopify CLI Commands

```bash
# Start development server
shopify app dev

# Deploy your extension
shopify app deploy

# View app info
shopify app info

# Generate extension
shopify app generate extension

# Link to existing app
shopify app config link

# View logs
shopify app logs
```

## Troubleshooting

### Extension not appearing in checkout

1. Verify the extension is activated in **Settings** > **Checkout**
2. Check that you're testing on the correct store
3. Clear your browser cache
4. Check the Shopify CLI output for errors

### OAuth errors

1. Verify redirect URLs match in:
   - Partner Dashboard
   - `shopify.app.toml`
   - Fly.io secrets (`SHOPIFY_APP_URL`)
2. Check HMAC verification in API logs: `flyctl logs --app fitted-api`
3. Ensure API URL is accessible: `curl https://fitted-api.fly.dev/api/health`
4. Verify Fly secrets are set: `flyctl secrets list --app fitted-api`

### Build errors

1. Run `npm run build:checkout` manually to see detailed errors
2. Check TypeScript errors: `npm run typecheck --workspace @fitted/checkout`
3. Verify all dependencies are installed: `npm install`

## Next Steps

1. Configure your production Shopify app in Partner Dashboard
2. Set up production environment variables
3. Deploy your API to production
4. Deploy your extension: `shopify app deploy`
5. Submit your app for review (if making it public)

## Resources

- [Shopify CLI Documentation](https://shopify.dev/docs/api/shopify-cli)
- [Checkout UI Extensions](https://shopify.dev/docs/api/checkout-ui-extensions)
- [App Development](https://shopify.dev/docs/apps/build)
- [OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)
