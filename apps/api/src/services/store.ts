// Persistent store using Supabase
import { supabase } from './supabase.js';

export type BillingProfile = {
  tradieId: string;
  stripeCustomerId: string;
  defaultPaymentMethodId?: string;
  requiresAuth?: boolean;
};

export type LeadPaymentStatus = 'pending' | 'paid' | 'failed' | 'requires_action';

export type LeadPaymentRecord = {
  leadId: string;
  tradieId: string;
  paymentIntentId: string;
  status: LeadPaymentStatus;
};

export const store = {
  async upsertBillingProfile(profile: BillingProfile) {
    const { error } = await supabase.from('billing_profiles').upsert({
      trade_id: profile.tradieId,
      stripe_customer_id: profile.stripeCustomerId,
      default_payment_method_id: profile.defaultPaymentMethodId,
      requires_auth: profile.requiresAuth ?? false,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error('Failed to upsert billing profile:', error);
      throw error;
    }
    return profile;
  },

  async getBillingProfile(tradieId: string) {
    const { data, error } = await supabase
      .from('billing_profiles')
      .select('*')
      .eq('trade_id', tradieId)
      .maybeSingle();

    if (error) {
      console.error('Failed to get billing profile:', error);
      return undefined;
    }

    if (!data) return undefined;

    return {
      tradieId: data.trade_id,
      stripeCustomerId: data.stripe_customer_id,
      defaultPaymentMethodId: data.default_payment_method_id,
      requiresAuth: data.requires_auth
    } as BillingProfile;
  },

  async upsertLeadPayment(record: LeadPaymentRecord) {
    const { error } = await supabase.from('lead_payments').upsert({
      lead_id: record.leadId,
      trade_id: record.tradieId,
      payment_intent_id: record.paymentIntentId,
      status: record.status,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'lead_id'
    });

    if (error) {
      console.error('Failed to upsert lead payment:', error);
      // Don't throw - payment tracking shouldn't block the flow
    }
    return record;
  },

  async getLeadPayment(leadId: string) {
    const { data, error } = await supabase
      .from('lead_payments')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (error || !data) return undefined;

    return {
      leadId: data.lead_id,
      tradieId: data.trade_id,
      paymentIntentId: data.payment_intent_id,
      status: data.status
    } as LeadPaymentRecord;
  },

  async saveShopToken(input: { shop: string; accessToken: string }) {
    // Upsert merchant record with access token
    const { error } = await supabase.from('merchants').upsert({
      shop_domain: input.shop,
      access_token: input.accessToken,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'shop_domain'
    });

    if (error) {
      console.error('Failed to save shop token:', error);
      throw error;
    }
    return input;
  },

  async getShopToken(shop: string) {
    const { data, error } = await supabase
      .from('merchants')
      .select('access_token')
      .eq('shop_domain', shop)
      .maybeSingle();

    if (error || !data) return undefined;
    return data.access_token;
  },

  async listShopTokens() {
    const { data, error } = await supabase
      .from('merchants')
      .select('shop_domain, access_token')
      .not('access_token', 'is', null);

    if (error || !data) return [];

    return data.map(row => ({
      shop: row.shop_domain,
      accessToken: row.access_token
    }));
  }
};
