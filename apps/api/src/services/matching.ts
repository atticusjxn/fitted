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
  postcode_start: string | null;
  postcode_end: string | null;
};

type MatchCandidate = {
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
  const locationBonus = postcodeMatches(leadPostcode, ts.postcode_start, ts.postcode_end) ? 30 : 0;
  const capped = Math.min(100, Math.max(0, base + locationBonus));
  return capped;
}

export async function matchLeadToTrades(leadId: string) {
  const { data: lead, error: leadError } = await supabase
    .from<LeadRow>('leads')
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

  const { data: skills, error: skillsError } = await supabase
    .from<any>('trade_skills')
    .select(
      'trade_id, category_id, score, service_areas:service_areas(postcode_start, postcode_end), scheduling:trade_scheduling_connections(next_available_at, booking_url)'
    )
    .eq('category_id', categoryId);

  if (skillsError) {
    throw new Error(`Failed to load trade skills: ${skillsError.message}`);
  }

  const flattened: (TradeSkillRow & { next_available_at?: string | null; booking_url?: string | null })[] =
    skills?.map((row: any) => ({
      trade_id: row.trade_id,
      category_id: row.category_id,
      score: row.score,
      postcode_start: row.service_areas?.[0]?.postcode_start ?? null,
      postcode_end: row.service_areas?.[0]?.postcode_end ?? null,
      next_available_at: row.scheduling?.[0]?.next_available_at ?? null,
      booking_url: row.scheduling?.[0]?.booking_url ?? null
    })) ?? [];

  const withinAWeek = (ts: { next_available_at?: string | null }) => {
    if (!ts.next_available_at) return false;
    const next = new Date(ts.next_available_at).getTime();
    const now = Date.now();
    const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
    return next <= weekAhead;
  };

  const candidates: MatchCandidate[] = flattened
    .filter((ts) => withinAWeek(ts))
    .map((ts) => ({
      tradeId: ts.trade_id,
      score: computeScore(ts, leadPostcode),
      bookingUrl: ts.booking_url,
      nextAvailableAt: ts.next_available_at ?? undefined
    }));

  const top = candidates.sort((a, b) => b.score - a.score).slice(0, 3);

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
