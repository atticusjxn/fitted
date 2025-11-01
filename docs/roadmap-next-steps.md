# Owner Checklist: Post-Scaffold Tasks

The shared domain package, Vitest test suites, and GitHub Actions CI workflow are now in place. Use this checklist to handle the items that still require your input or third‑party accounts.

---

## 1. Set Up Version Control & Hosting

- **Initialize git (if you haven’t already)**
  ```bash
  git init
  git add .
  git commit -m "feat: initial scaffold"
  ```
- **Create a GitHub repository** (e.g., `fitted/fitted-platform`) and add it as a remote:
  ```bash
  git remote add origin git@github.com:<your-account>/fitted-platform.git
  git push -u origin main
  ```
- **Configure branch protection** on `main` to require the CI workflow (`CI`) before merge.

## 2. Prepare Environment Variables

Create `.env` files based on the templates and populate the secrets you obtain:

`apps/api/.env`
```
NODE_ENV=development
API_HOST=0.0.0.0
API_PORT=3001
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
POSTMARK_SERVER_TOKEN=
GOOGLE_MAPS_API_KEY=
```

> Keep production credentials in your deployment platform’s secret manager (e.g., Vercel, Cloud Run) and add them as GitHub Actions secrets when CI needs to run end‑to‑end tests.

## 3. Acquire Third-Party Accounts & Keys

- **Stripe**: create a platform account, enable test mode, and grab the secret key for lead charges.
- **Twilio AU**: provision an Australian SMS-capable number and note the Account SID/Auth Token/Messaging Service SID.
- **Postmark (or Mailgun)**: set up a server token for transactional emails.
- **Supabase (Sydney region)**: create a project to host Postgres/PostGIS; copy the service-role key for backend use.
- **Google Maps Platform**: enable Geocoding API and obtain an API key with quota alerts.

Document each key in your password manager and update `.env` once ready.

## 4. Optional Domain & Hosting Decisions

- **Shopify app domain**: Not required yet for development, but reserve `fittedinstall.com` (or similar) if you want marketing pages or branded email later.
- **Production hosting**: plan to create Vercel projects (`fitted-admin`, `fitted-api`) and link them to the GitHub repo once you’re ready for deployments.

## 5. Checkout Extension Integration Prep

- **Create a Shopify Partner test app** and enable checkout extensibility. Install it on your development store.
- **Scaffold the official checkout extension project** (via `shopify app generate extension`) and point the build step to `apps/checkout/src/Checkout.tsx` or copy the component into the generated extension entry.
- **Wire the mock API to the Fastify backend** once credentials are ready (replace `services/mockApi.ts` with real fetch calls to the `/leads` endpoint).
- **Record UI polish feedback** from the Shopify preview (focus states, spacing on narrow viewports) so we can iterate quickly.
- **Local UI playground:** run `npm run dev:checkout` to open the Vite sandbox at <http://localhost:5173> for fast iterations before touching Shopify CLI.

## 6. Future Configuration To Track

- Add GitHub secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, etc.) before enabling deployment pipelines.
- Set up monitoring upgrade criteria (Better Stack) once revenue > $5k/month or an enterprise merchant requires 99.5% uptime.
- Schedule the Month‑3 tradie survey and the annual AusPost postcode dataset refresh.

Keep this checklist updated as you bring new integrations online. Ping me when you’re ready for the next build phase (Shopify checkout extension integration + Supabase schema migration tooling). 
