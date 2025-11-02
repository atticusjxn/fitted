# Fitted: Smart Installation Leads for E-commerce

Fitted is a Shopify checkout plugin that connects online shoppers with local tradespeople for installation services right after purchase. When customers add chandeliers, appliances, or fixtures to their cart, Fitted inserts a simple **“Need installation?”** prompt that keeps the momentum—and the shopper—inside the merchant’s experience.

## How Fitted Works
1. Shoppers enter their postcode and a few product details.
2. Fitted instantly surfaces three nearby, verified tradies ranked by rating and proximity.
3. The shopper selects the best match and jumps straight into that tradie’s existing booking flow (ServiceM8, Calendly, etc.) to lock in a time.
4. Each qualified lead routes through Stripe, where the tradie pays $25–$30 to secure the job.

By intercepting demand at the moment of highest intent, Fitted generates premium leads without sending customers off-platform.

## Why It Wins
- **High-intent moat**: Unlike broad lead marketplaces (Angi, HipPages), Fitted activates at checkout—customers have already spent money and need help now.
- **Embedded distribution**: Shopify merchants treat Fitted like revenue infrastructure, making it sticky and hard to displace once installed.
- **Tradies pull supply**: High conversion rates reduce the need for paid acquisition; tradies self-select in to access predictable, profitable work.

Fitted is less a lead marketplace and more a new category: monetized, high-intent referrals built directly into the purchase flow.

## Product Surfaces in This Repo
- `apps/checkout`: Vite-powered Shopify checkout sandbox that demonstrates the postcode lookup, tradie ranking, and lead submission UX.
- `apps/api`: Fastify service that will broker live lead intake, payments, and messaging once connected to Stripe, Supabase, and comms providers.
- `apps/admin`: Remix dashboard scaffold for merchant configuration, tradie onboarding, and revenue insights.
- `packages/domain`: Shared Zod schemas that keep the checkout, API, and admin clients aligned on lead data contracts.

## Long-Term Vision
Fitted’s goal is to become the **“Klaviyo of trade services”**—essential checkout infrastructure merchants rely on and tradespeople flock to. We’re launching in Australia with postcode-based matching, focusing on profitable regional dominance before expanding internationally. Over time, Fitted aims to be the definitive connection layer between ecommerce and local installation services, positioning the platform for strategic partnerships or acquisition by large home-services ecosystems like HomeServe or ServiceTitan.

Keep iterating on this document as the API, checkout extension, and admin tooling evolve from the current scaffolding to production-ready infrastructure.
