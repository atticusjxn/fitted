import { supabase } from './supabase.js';

type LeadRow = {
  id: string;
  category_id: string | null;
  payload_json: Record<string, unknown> | null;
};

type TradeSkillRow = {
  trade_id: string;
  category_id: string;
  score: number | null;
};

type ServiceAreaRow = {
  trade_id: string;
  postcode_start: string | null;
  postcode_end: string | null;
};

type SchedulingRow = {
  trade_id: string;
  next_available_at: string | null;
  booking_url: string | null;
};

type CredentialRow = {
  trade_id: string;
  verified: boolean;
};

export type MatchCandidate = {
  tradeId: string;
  score: number;
  bookingUrl?: string | null;
  nextAvailableAt?: string | null;
};

function normalizePostcode(payload: Record<string, unknown> | null): string | undefined {
  if (!payload) return undefined;
  const candidates = [
    payload.postcode,
    payload.postalCode,
    payload.zip,
    payload['postal_code'],
    payload['zip_code']
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return undefined;
}

function postcodeMatches(postcode: string | undefined, start: string | null, end: string | null): boolean {
  if (!postcode || !start || !end) return false;
  // Simple lexical range check suitable for numeric-looking postcodes.
  return postcode >= start && postcode <= end;
}

function computeScore(ts: TradeSkillRow, leadPostcode: string | undefined): number {
  const base = ts.score ?? 50;
  const capped = Math.min(100, Math.max(0, base));
  return capped;
}

function withinAWeek(nextAvailableAt: string | null | undefined) {
  if (!nextAvailableAt) return false;
  const next = new Date(nextAvailableAt).getTime();
  const now = Date.now();
  const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
  return next <= weekAhead;
}

async function fetchCandidates(categoryId: string, leadPostcode?: string) {
  const { data: skills, error: skillsError } = await supabase
    .from('trade_skills')
    .select('trade_id, category_id, score')
    .eq('category_id', categoryId);

  if (skillsError) {
    throw new Error(`Failed to load trade skills: ${skillsError.message}`);
  }

  const tradeIds = Array.from(new Set((skills ?? []).map((s) => s.trade_id)));
  if (tradeIds.length === 0) return [];

  const [{ data: scheduling }, { data: serviceAreas }, { data: credentials }] = await Promise.all([
    supabase
      .from('trade_scheduling_connections')
      .select('trade_id, next_available_at, booking_url')
      .in('trade_id', tradeIds),
    supabase
      .from('service_areas')
      .select('trade_id, postcode_start, postcode_end')
      .in('trade_id', tradeIds),
    supabase
      .from('trade_credentials')
      .select('trade_id, verified')
      .eq('verified', true)
      .in('trade_id', tradeIds)
  ]);

  const schedulingMap = new Map<string, SchedulingRow>();
  (scheduling ?? []).forEach((s) => schedulingMap.set(s.trade_id, s));

  const serviceAreaMap = new Map<string, ServiceAreaRow>();
  (serviceAreas ?? []).forEach((s) => serviceAreaMap.set(s.trade_id, s));

  const verifiedSet = new Set<string>((credentials ?? []).filter((c) => c.verified).map((c) => c.trade_id));

  const candidates: MatchCandidate[] = (skills ?? [])
    .filter((ts) => verifiedSet.has(ts.trade_id))
    .map((ts) => {
      const sched = schedulingMap.get(ts.trade_id);
      const area = serviceAreaMap.get(ts.trade_id);
      const locationBonus =
        area && postcodeMatches(leadPostcode, area.postcode_start, area.postcode_end) ? 30 : 0;
      const score = Math.min(100, Math.max(0, (ts.score ?? 50) + locationBonus));

      return {
        tradeId: ts.trade_id,
        score,
        bookingUrl: sched?.booking_url,
        nextAvailableAt: sched?.next_available_at ?? undefined
      };
    })
    .filter((c) => withinAWeek(c.nextAvailableAt));

  return candidates.sort((a, b) => b.score - a.score).slice(0, 3);
}

export async function simulateMatch(categoryId: string, postcode?: string) {
  return fetchCandidates(categoryId, postcode);
}

export async function matchLeadToTrades(leadId: string) {
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, category_id, payload_json')
    .eq('id', leadId)
    .maybeSingle();

  if (leadError) {
    throw new Error(`Failed to load lead ${leadId}: ${leadError.message}`);
  }

  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  const categoryId = lead.category_id ?? (lead.payload_json as Record<string, unknown> | undefined)?.category_id;
  if (!categoryId) {
    throw new Error(`Lead ${leadId} missing category_id`);
  }

  const leadPostcode = normalizePostcode(lead.payload_json);

  const top = await fetchCandidates(categoryId, leadPostcode);

  // clear previous recommendations
  await supabase.from('match_recommendations').delete().eq('lead_id', leadId);

  if (top.length === 0) {
    return [];
  }

  await supabase.from('match_recommendations').insert(
    top.map((c) => ({
      lead_id: leadId,
      trade_id: c.tradeId,
      score: c.score,
      rationale: { method: 'basic_location_category', next_available_at: c.nextAvailableAt },
      status: 'proposed'
    }))
  );

  // create or replace an offer and scheduling record for the best candidate
  const winner = top[0];
  await supabase.from('offers').delete().eq('lead_id', leadId);

  await supabase.from('offers').insert({
    lead_id: leadId,
    assignee_type: 'trade',
    assignee_id: winner.tradeId,
    status: 'sent'
  });

  await supabase.from('lead_scheduling').delete().eq('lead_id', leadId);
  await supabase.from('lead_scheduling').insert({
    lead_id: leadId,
    trade_id: winner.tradeId,
    status: 'link_sent',
    scheduling_url: winner.bookingUrl ?? null,
    metadata: { next_available_at: winner.nextAvailableAt }
  });

  return top;
}
