import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { AdminLayout } from '../components/AdminLayout.js';

type Settings = {
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  appEnabled: boolean;
  industry: string;
  productTypes: string[];
};

type ProductGroup = {
  type: string;
  products: { id: number; title: string; handle: string }[];
};

// In-memory placeholder until real persistence is wired.
let settingsStore: Settings = {
  businessName: 'Demo Merchant',
  contactEmail: 'merchant@example.com',
  contactPhone: '+61 400 000 000',
  appEnabled: true,
  industry: 'home-improvement',
  productTypes: ['lighting', 'appliances', 'furniture']
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop') ?? 'demo.myshopify.com';
  const origin = url.origin;

  let groups: ProductGroup[] = [
    { type: 'Lighting & fixtures', products: [] },
    { type: 'Appliances', products: [] },
    { type: 'Furniture & assembly', products: [] }
  ];

  try {
    const res = await fetch(`${origin}/api/shopify/products?shop=${encodeURIComponent(shop)}`);
    if (res.ok) {
      const data = (await res.json()) as { grouped: Record<string, { id: number; title: string; handle: string }[]> };
      groups = Object.entries(data.grouped).map(([type, products]) => ({ type, products }));
    }
  } catch (err) {
    console.error('Failed to load Shopify products', err);
  }

  const productTypes = groups.map((g) => g.type);
  return json({ settings: settingsStore, shop, groups, productTypes });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get('intent');

  if (intent === 'update-profile') {
    settingsStore = {
      ...settingsStore,
      businessName: String(form.get('businessName') ?? settingsStore.businessName),
      contactEmail: String(form.get('contactEmail') ?? settingsStore.contactEmail),
      contactPhone: String(form.get('contactPhone') ?? settingsStore.contactPhone),
      appEnabled: form.get('appEnabled') === 'on',
      industry: String(form.get('industry') ?? settingsStore.industry)
    };
  }

  if (intent === 'update-products') {
    const all = ['lighting', 'appliances', 'furniture', 'bathroom', 'outdoor', 'custom'];
    const selected = all.filter((id) => form.get(id) === 'on');

    settingsStore = {
      ...settingsStore,
      productTypes: selected.length ? selected : settingsStore.productTypes
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
  const { settings, groups } = useLoaderData<typeof loader>();
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

        <div className="grid gap-6">
          <SectionCard title="Business Profile">
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="update-profile" />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="appEnabled"
                  defaultChecked={settings.appEnabled}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span>Enable Fitted checkout app</span>
              </label>
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
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">Industry</span>
                <select
                  name="industry"
                  defaultValue={settings.industry}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="home-improvement">Home improvement</option>
                  <option value="appliances">Appliances</option>
                  <option value="lighting">Lighting</option>
                  <option value="furniture">Furniture</option>
                  <option value="custom">Other / Custom</option>
                </select>
              </label>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
              >
                Save profile
              </button>
            </Form>
          </SectionCard>

          <SectionCard title="Products eligible for installation">
            <Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="update-products" />
              <p className="text-sm text-slate-600">
                Select the product categories where you want the "Need installation?" prompt to show.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => {
                  const id = group.type;
                  return (
                    <label
                      key={id}
                      className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        name={id}
                        defaultChecked={settings.productTypes.includes(id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      <span>{id}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                Synced from your Shopify products (by product type). All checked types will show the install prompt.
              </p>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
              >
                Save product eligibility
              </button>
            </Form>
          </SectionCard>
        </div>
      </div>
    </AdminLayout>
  );
}
