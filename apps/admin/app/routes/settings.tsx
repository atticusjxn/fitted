import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { AdminLayout } from '../components/AdminLayout.js';

type Settings = {
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  stripeCustomerId: string;
  paymentMethodSummary?: string;
  leadFeeCents: number;
  autoChargeEnabled: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
};

// In-memory placeholder until real persistence is wired.
let settingsStore: Settings = {
  businessName: 'Demo Merchant',
  contactEmail: 'merchant@example.com',
  contactPhone: '+61 400 000 000',
  stripeCustomerId: 'cus_TR9fDNjpOpqyar',
  paymentMethodSummary: 'Visa •••• 4242',
  leadFeeCents: 2500,
  autoChargeEnabled: true,
  notifyEmail: true,
  notifySms: false
};

export async function loader(_args: LoaderFunctionArgs) {
  return json({ settings: settingsStore });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get('intent');

  if (intent === 'update-profile') {
    settingsStore = {
      ...settingsStore,
      businessName: String(form.get('businessName') ?? settingsStore.businessName),
      contactEmail: String(form.get('contactEmail') ?? settingsStore.contactEmail),
      contactPhone: String(form.get('contactPhone') ?? settingsStore.contactPhone)
    };
  }

  if (intent === 'update-billing') {
    settingsStore = {
      ...settingsStore,
      stripeCustomerId: String(form.get('stripeCustomerId') ?? settingsStore.stripeCustomerId),
      paymentMethodSummary: String(
        form.get('paymentMethodSummary') ?? settingsStore.paymentMethodSummary ?? ''
      )
    };
  }

  if (intent === 'update-leads') {
    settingsStore = {
      ...settingsStore,
      leadFeeCents: Number(form.get('leadFeeCents') ?? settingsStore.leadFeeCents),
      autoChargeEnabled: form.get('autoChargeEnabled') === 'on',
      notifyEmail: form.get('notifyEmail') === 'on',
      notifySms: form.get('notifySms') === 'on'
    };
  }

  return json({ ok: true, intent });
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4 text-sm text-slate-700">{children}</div>
    </div>
  );
}

export default function SettingsRoute() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {actionData?.ok ? (
          <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Settings saved.
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Configure your merchant account</p>
            <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard title="Business Profile">
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="update-profile" />
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">Business name</span>
                <input
                  name="businessName"
                  defaultValue={settings.businessName}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">Contact email</span>
                <input
                  type="email"
                  name="contactEmail"
                  defaultValue={settings.contactEmail}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">Contact phone</span>
                <input
                  name="contactPhone"
                  defaultValue={settings.contactPhone}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
              >
                Save profile
              </button>
            </Form>
          </SectionCard>

          <SectionCard title="Billing & Payments">
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="update-billing" />
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">Stripe customer ID</span>
                <input
                  name="stripeCustomerId"
                  defaultValue={settings.stripeCustomerId}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">Default payment method</span>
                <input
                  name="paymentMethodSummary"
                  defaultValue={settings.paymentMethodSummary}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g., Visa •••• 4242"
                />
              </label>
              <p className="text-xs text-slate-500">
                This ties to your saved card for auto-charging lead fees.
              </p>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
              >
                Save billing
              </button>
            </Form>
          </SectionCard>

          <SectionCard title="Lead Preferences">
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="update-leads" />
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">Lead fee (cents)</span>
                <input
                  type="number"
                  name="leadFeeCents"
                  defaultValue={settings.leadFeeCents}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  min={0}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="autoChargeEnabled"
                  defaultChecked={settings.autoChargeEnabled}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span>Auto-charge per lead</span>
              </label>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Notifications</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="notifyEmail"
                    defaultChecked={settings.notifyEmail}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="notifySms"
                    defaultChecked={settings.notifySms}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span>SMS</span>
                </label>
              </div>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
              >
                Save lead prefs
              </button>
            </Form>
          </SectionCard>

          <SectionCard title="API Keys & Webhooks">
            <div className="space-y-2 text-sm text-slate-600">
              <p>Connect your API keys and webhook URLs when you’re ready to enable live flows.</p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
                <li>Stripe webhook: /api/webhook/stripe (set STRIPE_WEBHOOK_SECRET when ready)</li>
                <li>Checkout mock API: point to your Fastify `/api` base</li>
                <li>Lead charge endpoint: POST /api/leads/:id/charge</li>
              </ul>
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminLayout>
  );
}
