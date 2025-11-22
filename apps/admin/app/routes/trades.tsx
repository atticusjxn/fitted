import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useFetcher, useLoaderData } from '@remix-run/react';
import { useMemo } from 'react';
import { AdminLayout } from '../components/AdminLayout.js';

type Trade = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  trade_skills?: {
    id: string;
    category_id: string;
    score: number | null;
    supported_complexities?: string[];
  }[];
  trade_credentials?: {
    id: string;
    credential_type: string;
    issuer?: string | null;
    verified: boolean;
  }[];
};

type Category = { id: string; name: string };

async function safeGet<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (err) {
    console.error('GET failed', url, err);
    return fallback;
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const origin = new URL(request.url).origin;
  const [tradesResp, categoriesResp] = await Promise.all([
    safeGet<{ trades: Trade[] }>(`${origin}/api/admin/trades`, { trades: [] }),
    safeGet<{ categories: Category[] }>(`${origin}/api/categories`, { categories: [] })
  ]);

  return json({
    trades: tradesResp.trades,
    categories: categoriesResp.categories
  });
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      <div className="mt-4 space-y-4 text-sm text-slate-700">{children}</div>
    </div>
  );
}

export default function TradesRoute() {
  const { trades, categories } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const statusBadge = (status: string) => {
    const color =
      status === 'approved' ? 'bg-emerald-50 text-emerald-700' : status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700';
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span>;
  };

  const categoriesMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const simulateFetcher = useFetcher<{ matches: { tradeId: string; score: number; bookingUrl?: string | null }[] }>();

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Vetting dashboard</p>
            <h1 className="text-2xl font-semibold text-slate-900">Trades & Skills</h1>
          </div>
        </div>

        <SectionCard title="Trades" description="Approve or reject providers and manage their credentials.">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Trade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Skills</th>
                  <th className="px-4 py-3">Credentials</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{trade.name}</div>
                      <div className="text-xs text-slate-500">{trade.email ?? trade.phone}</div>
                    </td>
                    <td className="px-4 py-3">{statusBadge(trade.status)}</td>
                    <td className="px-4 py-3 space-y-1">
                      {(trade.trade_skills ?? []).map((s) => (
                        <div key={s.id} className="text-xs text-slate-700">
                          {categoriesMap.get(s.category_id) ?? s.category_id} • score {s.score ?? 0}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      {(trade.trade_credentials ?? []).map((c) => (
                        <div key={c.id} className="text-xs text-slate-700">
                          {c.credential_type} {c.issuer ? `• ${c.issuer}` : ''} {c.verified ? '✅' : ''}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <fetcher.Form method="post" action="/api/admin/trades/status" className="inline-flex gap-2">
                        <input type="hidden" name="tradeId" value={trade.id} />
                        <button
                          type="button"
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          onClick={() => {
                            const fd = new FormData();
                            fd.set('status', 'approved');
                            fetcher.submit(fd, { method: 'post', action: `/api/admin/trades/${trade.id}/status` });
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          onClick={() => {
                            const fd = new FormData();
                            fd.set('status', 'rejected');
                            fetcher.submit(fd, { method: 'post', action: `/api/admin/trades/${trade.id}/status` });
                          }}
                        >
                          Reject
                        </button>
                      </fetcher.Form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Add/Update Skill" description="Attach a skill to a trade with category and score.">
          <fetcher.Form method="post" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input type="hidden" name="intent" value="add-skill" />
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Trade</div>
              <select name="tradeId" className="w-full rounded border border-slate-200 px-3 py-2 text-sm">
                {trades.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Category</div>
              <select name="category_id" className="w-full rounded border border-slate-200 px-3 py-2 text-sm">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Score</div>
              <input
                type="number"
                name="score"
                min={0}
                max={100}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
                onClick={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget.closest('form') as HTMLFormElement | null;
                  if (!form) return;
                  const fd = new FormData(form);
                  const tradeId = fd.get('tradeId') as string;
                  fetcher.submit(fd, { method: 'post', action: `/api/admin/trades/${tradeId}/skills` });
                }}
              >
                Save skill
              </button>
            </div>
          </fetcher.Form>
        </SectionCard>

        <SectionCard title="Add Credential" description="Add a credential/verification to a trade.">
          <fetcher.Form method="post" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Trade</div>
              <select name="tradeId" className="w-full rounded border border-slate-200 px-3 py-2 text-sm">
                {trades.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Type</div>
              <input name="credential_type" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Issuer</div>
              <input name="issuer" className="w-full rounded border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Verified</div>
              <input type="checkbox" name="verified" className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
            </label>
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
                onClick={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget.closest('form') as HTMLFormElement | null;
                  if (!form) return;
                  const fd = new FormData(form);
                  const tradeId = fd.get('tradeId') as string;
                  fetcher.submit(fd, { method: 'post', action: `/api/admin/trades/${tradeId}/credentials` });
                }}
              >
                Save credential
              </button>
            </div>
          </fetcher.Form>
        </SectionCard>

        <SectionCard title="Simulation" description="Preview recommended installers for a given category/postcode.">
          <simulateFetcher.Form method="post" action="/api/matching/simulate" className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Category</div>
              <select name="category_id" className="w-52 rounded border border-slate-200 px-3 py-2 text-sm">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Postcode</div>
              <input name="postcode" className="w-36 rounded border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
            >
              Simulate
            </button>
          </simulateFetcher.Form>

          {simulateFetcher.data?.matches ? (
            <div className="mt-3 space-y-2">
              {simulateFetcher.data.matches.length === 0 ? (
                <div className="text-sm text-slate-600">No matches found.</div>
              ) : (
                simulateFetcher.data.matches.map((m) => (
                  <div key={m.tradeId} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                    Trade {m.tradeId} • score {m.score}
                    {m.bookingUrl ? (
                      <a href={m.bookingUrl} target="_blank" rel="noreferrer" className="ml-2 text-emerald-700 underline">
                        Booking link
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
