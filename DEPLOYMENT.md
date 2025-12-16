# Fitted Deployment Guide

## Prerequisites

1. **Supabase Project**: Create a project at https://supabase.com
2. **Fly.io Account**: Sign up at https://fly.io
3. **Environment Variables**: Gather all required keys

## Step 1: Database Setup

### Run the migration in Supabase

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20241124000000_initial_schema.sql`
4. Run the SQL to create all tables

### Verify tables were created

Check that these tables exist:
- merchants, categories, trades
- trade_skills, trade_credentials, service_areas
- trade_scheduling_connections
- leads, match_recommendations, offers, lead_scheduling
- product_installation_settings, product_classifications
- billing_profiles, lead_payments
- installer_signups

## Step 2: Import Your Trade Network

### Prepare your trades data

Create a JSON file with your Mates Rates network:

```json
[
  {
    "businessName": "Example Electrics",
    "contactName": "John Smith",
    "email": "john@example.com",
    "phone": "0412345678",
    "postcodes": ["3000-3050"],
    "categories": ["lighting", "ceiling-fans"],
    "skillScore": 60,
    "verified": false
  }
]
```

### Run the import

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Dry run first
npx ts-node scripts/import-trades.ts --file your-trades.json --dry-run

# Then import for real
npx ts-node scripts/import-trades.ts --file your-trades.json
```

## Step 3: Deploy API to Fly.io

### Install Fly CLI

```bash
# macOS
brew install flyctl

# Or download from https://fly.io/docs/hands-on/install-flyctl/
```

### Login and launch

```bash
# Login to Fly
fly auth login

# Navigate to API directory
cd apps/api

# Launch the app (first time)
fly launch --no-deploy

# Set secrets (environment variables)
fly secrets set \
  SUPABASE_URL="<your-supabase-url>" \
  SUPABASE_SERVICE_ROLE_KEY="<your-supabase-service-role-key>" \
  STRIPE_SECRET_KEY="<your-stripe-secret-key>" \
  SHOPIFY_API_KEY="<your-shopify-api-key>" \
  SHOPIFY_API_SECRET="<your-shopify-app-shared-secret>" \
  SHOPIFY_APP_URL="https://fitted-api.fly.dev"

# Deploy
fly deploy --dockerfile Dockerfile --build-arg APP_ENV=production
```

### Verify deployment

```bash
# Check status
fly status

# View logs
fly logs

# Test the health endpoint
curl https://fitted-api.fly.dev/api/health
```

## Step 4: Configure Checkout Widget

Update the checkout app to use your deployed API:

```bash
# In apps/checkout/.env or .env.production
VITE_API_URL=https://fitted-api.fly.dev/api
```

## Step 5: Set Up Shopify App

1. Go to your Shopify Partners dashboard
2. Create a new app or update existing
3. Set the App URL to: `https://fitted-api.fly.dev`
4. Set OAuth redirect to: `https://fitted-api.fly.dev/api/shopify/callback`
5. Update your API's SHOPIFY_APP_URL secret if needed

## Environment Variables Reference

### Required

| Variable | Description |
|----------|-------------|
| SUPABASE_URL | Your Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (has full access) |
| STRIPE_SECRET_KEY | Stripe secret key for payments |
| SHOPIFY_API_KEY | Shopify app API key |
| SHOPIFY_API_SECRET | Shopify app API secret |
| SHOPIFY_APP_URL | Base URL of your deployed API |

### Optional

| Variable | Description |
|----------|-------------|
| RESEND_API_KEY | For email notifications |
| TWILIO_ACCOUNT_SID | For SMS notifications |
| TWILIO_AUTH_TOKEN | Twilio auth token |
| TWILIO_FROM_NUMBER | Twilio phone number |
| INSTALLER_SIGNUP_NOTIFY_EMAIL | Email to receive signup notifications |

## Monitoring

### View logs

```bash
fly logs --app fitted-api
```

### SSH into container

```bash
fly ssh console --app fitted-api
```

### Scale up/down

```bash
# Scale to 2 machines
fly scale count 2 --app fitted-api

# Scale memory
fly scale memory 512 --app fitted-api
```

## Troubleshooting

### API not responding

1. Check logs: `fly logs`
2. Verify secrets are set: `fly secrets list`
3. Check health endpoint: `curl https://fitted-api.fly.dev/api/health`

### Database connection issues

1. Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
2. Check Supabase dashboard for connection issues
3. Ensure tables exist in the database

### CORS errors in checkout

1. Verify the API's CORS configuration allows your domain
2. Check that VITE_API_URL is correct in checkout app
3. For Shopify stores, ensure `.myshopify.com` origins are allowed
