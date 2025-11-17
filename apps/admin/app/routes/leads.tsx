import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { AdminLayout } from '../components/AdminLayout.js';

type LeadMetrics = {
  totalLeads: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
};

type RecentLead = {
  id: string;
  customer: string;
  product: string;
  provider: string;
  message: string;
  createdAt: string;
};

export async function loader(_args: LoaderFunctionArgs) {
  const metrics: LeadMetrics = {
    totalLeads: 42,
    clicks: 180,
    conversions: 28,
    ctr: Math.round((180 / 1200) * 1000) / 10,
    conversionRate: Math.round((28 / 180) * 1000) / 10
  };

  const recent: RecentLead[] = [
    {
      id: 'lead_123',
      customer: 'Jane Smith',
      product: 'Pendant light - brass',
      provider: 'BrightSpark Electrical',
      message: 'Requested install date via SMS',
      createdAt: 'Today 2:15pm'
    },
    {
      id: 'lead_122',
      customer: 'Eric Tan',
      product: 'Dishwasher - Bosch Series 6',
      provider: 'KitchenWorks AU',
      message: 'Sent booking link (Calendly)',
      createdAt: 'Today 11:02am'
    },
    {
      id: 'lead_121',
      customer: 'Harper Lee',
      product: 'Ceiling fan - white',
      provider: 'AirFlow Tradies',
      message: 'Customer asked for weekend slot',
      createdAt: 'Yesterday 4:40pm'
    }
  ];

  return json({ metrics, recent });
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

export default function LeadsRoute() {
  const { metrics, recent } = useLoaderData<typeof loader>();

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-slate-500">Checkout engagement</p>
          <h1 className="text-2xl font-semibold text-slate-900">Leads & Analytics</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total leads" value={metrics.totalLeads.toString()} />
          <StatCard label="Clicks" value={metrics.clicks.toString()} sub={`${metrics.ctr}% CTR`} />
          <StatCard
            label="Conversions"
      value={metrics.conversions.toString()}
      sub={`${metrics.conversionRate}% CVR`}
    />
  </div>

  <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Recent leads</p>
              <p className="text-xs text-slate-500">Latest activity from your checkout prompt.</p>
            </div>
            <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Export CSV
            </button>
          </div>
          <div className="divide-y divide-slate-200 text-sm">
            <div className="grid grid-cols-5 px-4 py-2 text-xs uppercase tracking-wide text-slate-500">
              <span>Customer</span>
              <span>Product</span>
              <span>Service provider</span>
              <span>Message</span>
              <span>Time</span>
            </div>
            {recent.map((lead) => (
              <div key={lead.id} className="grid grid-cols-5 px-4 py-3">
                <div className="font-medium text-slate-900">{lead.customer}</div>
                <div className="text-slate-600">{lead.product}</div>
                <div className="text-slate-600">{lead.provider}</div>
                <div className="text-slate-600">{lead.message}</div>
                <div className="text-slate-600">{lead.createdAt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
