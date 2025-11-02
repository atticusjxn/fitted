import { leadSubmissionSchema, tradieSchema, type LeadFormValues, type Tradie } from '../types/index.js';

const MOCK_TRADIES: Record<string, Tradie[]> = {
  '3000': [
    {
      id: 'tradie-vibrant-electrics',
      name: 'Vibrant Electrics',
      phone: '+61 3 9112 4438',
      rating: 4.8,
      reviewCount: 132,
      distanceKm: 4.2,
      specialties: ['Lighting', 'Ceiling fans', 'Smart home'],
      insured: true,
      licensed: true,
      responseTime: 'Replies within 1 hour',
      isRecommended: true
    },
    {
      id: 'tradie-hangright',
      name: 'Hang Right Installations',
      phone: '+61 3 8568 2231',
      rating: 4.6,
      reviewCount: 96,
      distanceKm: 6.1,
      specialties: ['Mounting', 'Fixtures', 'Custom installs'],
      insured: true,
      licensed: true,
      responseTime: 'Replies same day',
      isRecommended: false
    },
    {
      id: 'tradie-precision-plumbers',
      name: 'Precision Plumbers & Fitters',
      phone: '+61 3 7002 8890',
      rating: 4.9,
      reviewCount: 188,
      distanceKm: 5.4,
      specialties: ['Plumbing', 'Gas fitting', 'Appliance installs'],
      insured: true,
      licensed: true,
      responseTime: 'Replies within 2 hours',
      isRecommended: false
    }
  ],
  '3001': [
    {
      id: 'tradie-zen-installations',
      name: 'Zen Installations',
      phone: '+61 3 8124 6670',
      rating: 4.7,
      reviewCount: 74,
      distanceKm: 3.8,
      specialties: ['Appliance installs', 'Lighting', 'Outdoor'],
      insured: true,
      licensed: true,
      responseTime: 'Replies within 3 hours',
      isRecommended: true
    },
    {
      id: 'tradie-skyline-sparks',
      name: 'Skyline Sparks',
      phone: '+61 3 9088 4511',
      rating: 4.5,
      reviewCount: 58,
      distanceKm: 7.3,
      specialties: ['Lighting', 'EV chargers', 'Switchboards'],
      insured: true,
      licensed: true,
      responseTime: 'Replies within 6 hours',
      isRecommended: false
    }
  ],
  '4151': [
    {
      id: 'tradie-eastside-electrics',
      name: 'Eastside Electrics',
      phone: '+61 7 3111 2045',
      rating: 4.8,
      reviewCount: 142,
      distanceKm: 2.9,
      specialties: ['Lighting', 'Ceiling fans', 'Safety checks'],
      insured: true,
      licensed: true,
      responseTime: 'Replies within 1 hour',
      isRecommended: true
    },
    {
      id: 'tradie-coorparoo-installations',
      name: 'Coorparoo Installations',
      phone: '+61 7 3498 2210',
      rating: 4.7,
      reviewCount: 87,
      distanceKm: 4.1,
      specialties: ['Appliance installs', 'Wall mounting', 'Smart home'],
      insured: true,
      licensed: true,
      responseTime: 'Replies within 2 hours',
      isRecommended: false
    },
    {
      id: 'tradie-brisbane-pro-fitters',
      name: 'Brisbane Pro Fitters',
      phone: '+61 7 3521 9974',
      rating: 4.6,
      reviewCount: 101,
      distanceKm: 6.3,
      specialties: ['Custom installs', 'Lighting', 'Outdoor fixtures'],
      insured: true,
      licensed: true,
      responseTime: 'Replies same day',
      isRecommended: false
    }
  ]
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type TradieResponse =
  | { status: 'ok'; tradies: Tradie[] }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string };

export async function fetchTradies(postalCode: string): Promise<TradieResponse> {
  await delay(650);

  const trimmed = postalCode.trim();
  if (!MOCK_TRADIES[trimmed]) {
    return {
      status: 'empty',
      message: 'No tradies available in that postcode yet. Try another nearby postcode.'
    };
  }

  const parsed = zParseTradies(MOCK_TRADIES[trimmed]);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'We ran into an issue fetching tradies.'
    };
  }

  return {
    status: 'ok',
    tradies: parsed.data
  };
}

export type LeadSubmissionResult =
  | { status: 'ok'; leadId: string }
  | { status: 'error'; message: string; field?: keyof LeadFormValues };

export async function submitLead(payload: LeadFormValues): Promise<LeadSubmissionResult> {
  await delay(800);

  const parsed = leadSubmissionSchema.safeParse({
    ...payload,
    postcode: payload.postalCode,
    productCategory: payload.serviceType,
    customer: {
      name: `${payload.firstName} ${payload.lastName}`,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone
    },
    productDetails: {
      description: payload.description,
      urgency: payload.urgency,
      tradieId: payload.tradieId
    }
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path ?? [];
    const rawField = path[path.length - 1];
    const mappedField = mapIssuePathToField(rawField);
    return {
      status: 'error',
      message: firstIssue?.message ?? 'Please check the details and try again.',
      field: mappedField ?? undefined
    };
  }

  return {
    status: 'ok',
    leadId: `lead_${Math.random().toString(36).slice(2, 10)}`
  };
}

function zParseTradies(tradies: Tradie[]) {
  return tradieSchema.array().safeParse(tradies);
}

function mapIssuePathToField(value: unknown): keyof LeadFormValues | null {
  if (typeof value !== 'string') {
    return null;
  }

  const pathToFieldMap: Partial<Record<string, keyof LeadFormValues>> = {
    postcode: 'postalCode',
    serviceType: 'serviceType',
    tradieId: 'tradieId',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    description: 'description',
    urgency: 'urgency'
  };

  return pathToFieldMap[value] ?? null;
}
