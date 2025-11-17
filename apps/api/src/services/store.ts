// Lightweight in-memory store to keep wiring examples self-contained.
// Replace with real persistence (DB) when ready.

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

const billingProfiles = new Map<string, BillingProfile>();
const leadPayments = new Map<string, LeadPaymentRecord>();

export const store = {
  upsertBillingProfile(profile: BillingProfile) {
    billingProfiles.set(profile.tradieId, profile);
    return profile;
  },
  getBillingProfile(tradieId: string) {
    return billingProfiles.get(tradieId);
  },
  upsertLeadPayment(record: LeadPaymentRecord) {
    leadPayments.set(record.leadId, record);
    return record;
  },
  getLeadPayment(leadId: string) {
    return leadPayments.get(leadId);
  }
};
