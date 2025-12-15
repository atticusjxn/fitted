import { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { env } from '../env.js';
import { supabase } from '../services/supabase.js';

/**
 * Verify Shopify webhook HMAC signature
 * https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-5-verify-the-webhook
 */
function verifyShopifyWebhook(rawBody: Buffer, hmacHeader: string): boolean {
  const hash = crypto
    .createHmac('sha256', env.SHOPIFY_API_SECRET)
    .update(rawBody)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  );
}

interface CustomersDataRequestPayload {
  shop_id: number;
  shop_domain: string;
  orders_requested: number[];
  customer: {
    id: number;
    email: string;
    phone: string;
  };
  data_request: {
    id: number;
  };
}

interface CustomersRedactPayload {
  shop_id: number;
  shop_domain: string;
  customer: {
    id: number;
    email: string;
    phone: string;
  };
  orders_to_redact: number[];
}

interface ShopRedactPayload {
  shop_id: number;
  shop_domain: string;
}

export async function shopifyWebhookRoutes(app: FastifyInstance) {
  // Shopify compliance webhooks endpoint
  app.post('/webhooks/shopify', { config: { rawBody: true } }, async (request, reply) => {
    const hmacHeader = request.headers['x-shopify-hmac-sha256'];
    const topic = request.headers['x-shopify-topic'];

    if (typeof hmacHeader !== 'string') {
      app.log.warn('Missing Shopify HMAC header');
      return reply.status(401).send('Unauthorized');
    }

    // Verify webhook authenticity
    const rawBody = request.rawBody as Buffer;
    if (!verifyShopifyWebhook(rawBody, hmacHeader)) {
      app.log.error('Shopify webhook HMAC verification failed');
      return reply.status(401).send('Unauthorized');
    }

    const payload = request.body;

    switch (topic) {
      case 'customers/data_request': {
        const data = payload as CustomersDataRequestPayload;
        app.log.info(
          {
            shopDomain: data.shop_domain,
            customerId: data.customer.id,
            customerEmail: data.customer.email,
            ordersRequested: data.orders_requested.length,
            dataRequestId: data.data_request.id
          },
          'Customer data request received'
        );

        try {
          // Query leads by Shopify customer ID or email
          const { data: leads, error } = await supabase
            .from('leads')
            .select('id, created_at, status, source, payload_json')
            .or(
              `payload_json->customerId.eq.${data.customer.id},` +
              `payload_json->email.ilike.${data.customer.email}`
            );

          if (error) {
            app.log.error({ error }, 'Failed to retrieve customer data');
          } else {
            // Log the data that should be provided to the store owner
            app.log.info(
              {
                shopDomain: data.shop_domain,
                customerId: data.customer.id,
                leadsFound: leads?.length ?? 0,
                customerData: {
                  email: data.customer.email,
                  phone: data.customer.phone,
                  leads: leads?.map(lead => ({
                    leadId: lead.id,
                    createdAt: lead.created_at,
                    status: lead.status,
                    source: lead.source,
                    details: lead.payload_json
                  }))
                }
              },
              'Customer data compiled for request'
            );

            // TODO: Send this data to the store owner via email or API
            // You have 30 days to complete this request
          }
        } catch (err) {
          app.log.error({ err }, 'Error processing customer data request');
        }

        break;
      }

      case 'customers/redact': {
        const data = payload as CustomersRedactPayload;
        app.log.info(
          {
            shopDomain: data.shop_domain,
            customerId: data.customer.id,
            customerEmail: data.customer.email,
            ordersToRedact: data.orders_to_redact.length
          },
          'Customer data redaction request received'
        );

        try {
          // Find all leads associated with this customer
          const { data: leads, error: queryError } = await supabase
            .from('leads')
            .select('id')
            .or(
              `payload_json->customerId.eq.${data.customer.id},` +
              `payload_json->email.ilike.${data.customer.email}`
            );

          if (queryError) {
            app.log.error({ error: queryError }, 'Failed to query customer leads for redaction');
          } else if (leads && leads.length > 0) {
            const leadIds = leads.map(l => l.id);

            // Anonymize customer data in leads by updating payload_json
            const { error: updateError } = await supabase
              .from('leads')
              .update({
                payload_json: {
                  redacted: true,
                  redactedAt: new Date().toISOString(),
                  customerId: data.customer.id // Keep ID for record-keeping
                }
              })
              .in('id', leadIds);

            if (updateError) {
              app.log.error({ error: updateError }, 'Failed to redact customer data');
            } else {
              app.log.info(
                {
                  shopDomain: data.shop_domain,
                  customerId: data.customer.id,
                  leadsRedacted: leadIds.length
                },
                'Customer data successfully redacted'
              );
            }

            // Delete related records that may contain customer data
            // Note: We keep the lead record but anonymize it for audit purposes
            await supabase.from('lead_scheduling').delete().in('lead_id', leadIds);
            await supabase.from('match_recommendations').delete().in('lead_id', leadIds);
            await supabase.from('offers').delete().in('lead_id', leadIds);
            await supabase.from('lead_payments').delete().in('lead_id', leadIds);
          }
        } catch (err) {
          app.log.error({ err }, 'Error processing customer redaction request');
        }

        break;
      }

      case 'shop/redact': {
        const data = payload as ShopRedactPayload;
        app.log.info(
          {
            shopDomain: data.shop_domain,
            shopId: data.shop_id
          },
          'Shop data redaction request received (app uninstalled)'
        );

        try {
          // Find the merchant by shop domain
          const { data: merchant, error: merchantError } = await supabase
            .from('merchants')
            .select('id')
            .eq('shop_domain', data.shop_domain)
            .maybeSingle();

          if (merchantError) {
            app.log.error({ error: merchantError }, 'Failed to find merchant for shop redaction');
          } else if (merchant) {
            const merchantId = merchant.id;

            // Find all leads associated with this merchant
            const { data: leads } = await supabase
              .from('leads')
              .select('id')
              .eq('merchant_id', merchantId);

            if (leads && leads.length > 0) {
              const leadIds = leads.map(l => l.id);

              // Delete all related lead data
              await supabase.from('lead_scheduling').delete().in('lead_id', leadIds);
              await supabase.from('match_recommendations').delete().in('lead_id', leadIds);
              await supabase.from('offers').delete().in('lead_id', leadIds);
              await supabase.from('lead_payments').delete().in('lead_id', leadIds);
              await supabase.from('leads').delete().in('id', leadIds);

              app.log.info(
                {
                  shopDomain: data.shop_domain,
                  leadsDeleted: leadIds.length
                },
                'Deleted leads for shop'
              );
            }

            // Delete product-related data
            await supabase.from('product_installation_settings').delete().eq('merchant_id', merchantId);
            await supabase.from('product_classifications').delete().eq('merchant_id', merchantId);

            // Delete the merchant record (which contains the access token)
            const { error: deleteError } = await supabase
              .from('merchants')
              .delete()
              .eq('id', merchantId);

            if (deleteError) {
              app.log.error({ error: deleteError }, 'Failed to delete merchant record');
            } else {
              app.log.info(
                {
                  shopDomain: data.shop_domain,
                  shopId: data.shop_id,
                  merchantId: merchantId
                },
                'Shop data successfully redacted'
              );
            }
          } else {
            app.log.info(
              {
                shopDomain: data.shop_domain
              },
              'No merchant found for shop redaction (already deleted or never installed)'
            );
          }
        } catch (err) {
          app.log.error({ err }, 'Error processing shop redaction request');
        }

        break;
      }

      default: {
        app.log.debug({ topic }, 'Unhandled Shopify webhook topic');
      }
    }

    // Always respond with 200 to acknowledge receipt
    return reply.code(200).send({ received: true });
  });
}
