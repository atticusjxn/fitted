import Stripe from 'stripe';
import { env } from '../env.js';

// Shared Stripe client configured for the API version we target.
export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

export type LeadChargeInput = {
  customerId: string;
  paymentMethodId: string;
  amount: number; // in the smallest currency unit
  currency?: string;
  description?: string;
};

export async function createSetupIntent(customerId: string) {
  return stripeClient.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session'
  });
}

export async function listCustomerPaymentMethods(customerId: string) {
  return stripeClient.paymentMethods.list({
    customer: customerId,
    type: 'card'
  });
}

export async function chargeLead(input: LeadChargeInput) {
  const {
    customerId,
    paymentMethodId,
    amount,
    currency = 'aud',
    description
  } = input;

  return stripeClient.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    description,
    // Enable automatic 3DS when required; Stripe handles next actions.
    payment_method_types: ['card']
  });
}

export function constructStripeEvent(rawBody: string | Buffer, signature: string) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  return stripeClient.webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}
