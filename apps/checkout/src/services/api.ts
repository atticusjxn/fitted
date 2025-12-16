import { tradieSchema, type LeadFormValues, type Tradie } from '../types/index.js';

// API base URL - uses production URL for Shopify extension
// For local development playground, you can override this in dev/main.tsx
const API_BASE_URL = 'https://tryfitted.com/api';

export type TradieResponse =
  | { status: 'ok'; tradies: Tradie[] }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string };

export async function fetchTradies(postalCode: string, categoryId?: string): Promise<TradieResponse> {
  const trimmed = postalCode.trim();

  try {
    const params = new URLSearchParams({ postcode: trimmed });
    if (categoryId) {
      params.set('categoryId', categoryId);
    }

    const response = await fetch(`${API_BASE_URL}/checkout/tradies?${params}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        status: 'error',
        message: errorData.message || 'Failed to fetch installers'
      };
    }

    const data = await response.json();

    if (data.status === 'empty') {
      return {
        status: 'empty',
        message: data.message || 'No installers available in that postcode yet.'
      };
    }

    // Validate the tradie data
    const parsed = tradieSchema.array().safeParse(data.tradies);
    if (!parsed.success) {
      console.error('Invalid tradie data:', parsed.error);
      return {
        status: 'error',
        message: 'We ran into an issue fetching installers.'
      };
    }

    return {
      status: 'ok',
      tradies: parsed.data
    };
  } catch (error) {
    console.error('Error fetching tradies:', error);
    return {
      status: 'error',
      message: 'Unable to connect to the server. Please try again.'
    };
  }
}

export type LeadSubmissionResult =
  | { status: 'ok'; leadId: string }
  | { status: 'error'; message: string; field?: keyof LeadFormValues };

export async function submitLead(
  payload: LeadFormValues,
  options?: {
    shopDomain?: string;
    merchantId?: string;
    productDetails?: {
      productId?: string;
      productName?: string;
      sku?: string;
      price?: string;
    };
    orderId?: string;
    customerId?: string;
  }
): Promise<LeadSubmissionResult> {
  try {
    const body = {
      merchantId: options?.merchantId,
      shopDomain: options?.shopDomain,
      postcode: payload.postalCode,
      serviceType: payload.serviceType,
      tradieId: payload.tradieId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      description: payload.description,
      urgency: payload.urgency,
      productDetails: options?.productDetails,
      orderId: options?.orderId,
      customerId: options?.customerId
    };

    const response = await fetch(`${API_BASE_URL}/checkout/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      return {
        status: 'error',
        message: data.message || 'Failed to submit your request',
        field: data.field as keyof LeadFormValues | undefined
      };
    }

    return {
      status: 'ok',
      leadId: data.leadId
    };
  } catch (error) {
    console.error('Error submitting lead:', error);
    return {
      status: 'error',
      message: 'Unable to connect to the server. Please try again.'
    };
  }
}

// Helper to get lead status (for confirmation page)
export async function getLeadStatus(leadId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/checkout/leads/${leadId}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.lead;
  } catch {
    return null;
  }
}
