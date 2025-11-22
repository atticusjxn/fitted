import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useFetcher, useLoaderData } from '@remix-run/react';
import { useMemo } from 'react';
import { AdminLayout } from '../components/AdminLayout.js';

type Product = {
  id: string;
  title: string;
  handle: string;
  productType?: string;
  collections?: { id: string; title: string }[];
};

type ProductSetting = {
  productId: string;
  enabled: boolean;
  categoryId?: string;
  complexity?: 'simple' | 'standard' | 'complex' | 'heavy';
  priceMode?: 'fixed' | 'tiered' | 'dynamic';
  priceCents?: number | null;
};

type Classification = {
  id: string;
  productId: string;
  title: string;
  suggestedCategory?: string;
  suggestedComplexity?: ProductSetting['complexity'];
  lowConfidence: boolean;
  status: 'pending' | 'needs_review';
};

type Category = { id: string; name: string; slug?: string };

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
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop') ?? 'demo.myshopify.com';
  const origin = url.origin;

  const [products, collections, settingsResp, classificationsResp, categoriesResp] = await Promise.all([
    safeGet<{ products: Product[] }>(`${origin}/api/shopify/products?shop=${encodeURIComponent(shop)}`, { products: [] }),
    safeGet<{ collections: { id: string; title: string }[] }>(
      `${origin}/api/shopify/collections?shop=${encodeURIComponent(shop)}`,
      { collections: [] }
    ),
    safeGet<{ settings: ProductSetting[] }>(`${origin}/api/installations/settings?shop=${encodeURIComponent(shop)}`, {
      settings: []
    }),
    safeGet<{ classifications: Classification[] }>(
      `${origin}/api/installations/classifications?shop=${encodeURIComponent(shop)}&status=pending`,
      { classifications: [] }
    ),
    safeGet<{ categories: Category[] }>(`${origin}/api/categories`, { categories: [] })
  ]);

  const settingsMap = new Map(settingsResp.settings.map((s) => [s.productId, s]));
  const normalizedSettings = products.products.map((p) => {
    const stored = settingsMap.get(p.id);
    return (
      stored ?? {
        productId: p.id,
        enabled: false,
        categoryId: undefined,
        complexity: undefined,
        priceMode: 'fixed' as const,
        priceCents: undefined
      }
    );
  });

  const lowConfidence = classificationsResp.classifications.filter((c) => c.lowConfidence || c.status === 'pending');

  return json({
    shop,
    products: products.products,
    collections: collections.collections,
    settings: normalizedSettings,
    classifications: lowConfidence,
    categories: categoriesResp.categories
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = String(form.get('intent') ?? '');
  const shop = String(form.get('shop') ?? '');
  const origin = new URL(request.url).origin;

  if (intent === 'toggle-product') {
    const productId = String(form.get('productId'));
    const enabled = form.get('enabled') === 'on';
    const categoryId = form.get('categoryId') ? String(form.get('categoryId')) : undefined;
    const complexity = (form.get('complexity') as ProductSetting['complexity']) ?? undefined;
    const priceMode = (form.get('priceMode') as ProductSetting['priceMode']) ?? 'fixed';
    const priceCents = form.get('priceCents') ? Number(form.get('priceCents')) : undefined;

    try {
      const res = await fetch(`${origin}/api/installations/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          productId,
          enabled,
          categoryId,
          complexity,
          priceMode,
          priceCents
        })
      });
      if (!res.ok) {
        const message = await res.text();
        return json({ ok: false, intent, productId, message }, { status: res.status });
      }
    } catch (err) {
      return json({ ok: false, intent, productId, message: 'Network error saving setting' }, { status: 500 });
    }

    return json({ ok: true, intent, productId });
  }

  if (intent === 'bulk-enable') {
    const collectionId = String(form.get('collectionId'));
    const defaults = {
      categoryId: form.get('categoryId') ? String(form.get('categoryId')) : undefined,
      complexity: (form.get('complexity') as ProductSetting['complexity']) ?? undefined,
      priceMode: (form.get('priceMode') as ProductSetting['priceMode']) ?? 'fixed',
      priceCents: form.get('priceCents') ? Number(form.get('priceCents')) : undefined
    };

    try {
      const res = await fetch(`${origin}/api/installations/settings/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, collectionId, ...defaults })
      });
      if (!res.ok) {
        const message = await res.text();
        return json({ ok: false, intent, collectionId, message }, { status: res.status });
      }
    } catch (err) {
      return json({ ok: false, intent, collectionId, message: 'Network error bulk enabling' }, { status: 500 });
    }

    return json({ ok: true, intent, collectionId });
  }

  if (intent === 'review-classification') {
    const id = String(form.get('id'));
    const actionType = String(form.get('actionType'));
    const category = form.get('category') ? String(form.get('category')) : undefined;
    const complexity = (form.get('complexity') as ProductSetting['complexity']) ?? undefined;

    try {
      const res = await fetch(`${origin}/api/installations/classifications/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, actionType, category, complexity, shop })
      });
      if (!res.ok) {
        const message = await res.text();
        return json({ ok: false, intent, id, message }, { status: res.status });
      }
    } catch (err) {
      return json({ ok: false, intent, id, message: 'Network error reviewing classification' }, { status: 500 });
    }

    return json({ ok: true, intent, id });
  }

  return json({ ok: false, intent }, { status: 400 });
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

export default function InstallationsRoute() {
  const { products, collections, settings, classifications, categories, shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();

  const settingsByProduct = useMemo(() => {
    const map: Record<string, ProductSetting> = {};
    settings.forEach((s) => (map[s.productId] = s));
    return map;
  }, [settings]);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {actionData ? (
          <div
            className={`rounded-md px-4 py-3 text-sm ${
              actionData.ok
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {actionData.ok ? 'Saved.' : actionData.message ?? 'Something went wrong.'}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Control which products offer installation</p>
            <h1 className="text-2xl font-semibold text-slate-900">Installation settings</h1>
          </div>
        </div>

        <SectionCard
          title="Products with installation toggle"
          description="Review products and enable installation. Override category, complexity, and pricing as needed."
        >
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Install?</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Complexity</th>
                  <th className="px-4 py-3">Price mode</th>
                  <th className="px-4 py-3">Price (cents)</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {products.map((product) => {
                  const current = settingsByProduct[product.id];
                  return (
                    <tr key={product.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{product.title}</div>
                        <div className="text-xs text-slate-500">{product.productType ?? 'Uncategorized'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          name="enabled"
                          defaultChecked={current?.enabled}
                          onChange={(e) => {
                            const formData = new FormData();
                            formData.set('intent', 'toggle-product');
                            formData.set('shop', shop);
                            formData.set('productId', product.id);
                            formData.set('enabled', e.target.checked ? 'on' : '');
                            formData.set('priceMode', current?.priceMode ?? 'fixed');
                            fetcher.submit(formData, { method: 'post' });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={current?.categoryId ?? ''}
                          className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                          onChange={(e) => {
                            const formData = new FormData();
                            formData.set('intent', 'toggle-product');
                            formData.set('shop', shop);
                            formData.set('productId', product.id);
                            formData.set('enabled', current?.enabled ? 'on' : '');
                            formData.set('categoryId', e.target.value);
                            formData.set('priceMode', current?.priceMode ?? 'fixed');
                            fetcher.submit(formData, { method: 'post' });
                          }}
                        >
                          <option value="">Auto</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={current?.complexity ?? ''}
                          className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                          onChange={(e) => {
                            const formData = new FormData();
                            formData.set('intent', 'toggle-product');
                            formData.set('shop', shop);
                            formData.set('productId', product.id);
                            formData.set('enabled', current?.enabled ? 'on' : '');
                            formData.set('complexity', e.target.value);
                            formData.set('priceMode', current?.priceMode ?? 'fixed');
                            fetcher.submit(formData, { method: 'post' });
                          }}
                        >
                          <option value="">Auto</option>
                          <option value="simple">Simple</option>
                          <option value="standard">Standard</option>
                          <option value="complex">Complex</option>
                          <option value="heavy">Heavy</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={current?.priceMode ?? 'fixed'}
                          className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                          onChange={(e) => {
                            const formData = new FormData();
                            formData.set('intent', 'toggle-product');
                            formData.set('shop', shop);
                            formData.set('productId', product.id);
                            formData.set('enabled', current?.enabled ? 'on' : '');
                            formData.set('priceMode', e.target.value);
                            fetcher.submit(formData, { method: 'post' });
                          }}
                        >
                          <option value="fixed">Fixed</option>
                          <option value="tiered">Tiered</option>
                          <option value="dynamic">Dynamic</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          defaultValue={current?.priceCents ?? ''}
                          className="w-28 rounded border border-slate-200 px-2 py-1 text-sm"
                          min={0}
                          onBlur={(e) => {
                            const formData = new FormData();
                            formData.set('intent', 'toggle-product');
                            formData.set('shop', shop);
                            formData.set('productId', product.id);
                            formData.set('enabled', current?.enabled ? 'on' : '');
                            formData.set('priceMode', current?.priceMode ?? 'fixed');
                            if (e.target.value) formData.set('priceCents', e.target.value);
                            fetcher.submit(formData, { method: 'post' });
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">{product.handle}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Bulk enable by collection"
          description="Quickly turn on installation for a collection and set defaults."
        >
          <Form method="post" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input type="hidden" name="intent" value="bulk-enable" />
            <input type="hidden" name="shop" value={shop} />
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Collection</div>
              <select name="collectionId" className="w-full rounded border border-slate-200 px-3 py-2 text-sm">
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Category override</div>
              <select name="categoryId" className="w-full rounded border border-slate-200 px-3 py-2 text-sm">
                <option value="">Auto</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Complexity</div>
              <select name="complexity" className="w-full rounded border border-slate-200 px-3 py-2 text-sm">
                <option value="">Auto</option>
                <option value="simple">Simple</option>
                <option value="standard">Standard</option>
                <option value="complex">Complex</option>
                <option value="heavy">Heavy</option>
              </select>
            </label>
            <div className="space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Pricing</div>
              <div className="flex gap-2">
                <select name="priceMode" className="w-32 rounded border border-slate-200 px-3 py-2 text-sm">
                  <option value="fixed">Fixed</option>
                  <option value="tiered">Tiered</option>
                  <option value="dynamic">Dynamic</option>
                </select>
                <input
                  type="number"
                  name="priceCents"
                  placeholder="cents"
                  className="w-28 rounded border border-slate-200 px-3 py-2 text-sm"
                  min={0}
                />
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
              >
                Enable installation for collection
              </button>
            </div>
          </Form>
        </SectionCard>

        <SectionCard
          title="Review low-confidence classifications"
          description="Approve or adjust AI suggestions before enabling installation."
        >
          {classifications.length === 0 ? (
            <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Nothing to review right now.
            </div>
          ) : (
            <div className="space-y-3">
              {classifications.map((c) => (
                <Form key={c.id} method="post" className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <input type="hidden" name="intent" value="review-classification" />
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="shop" value={shop} />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-500">Suggested: {c.suggestedCategory ?? 'Unknown'}</div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        name="category"
                        defaultValue={c.suggestedCategory ?? ''}
                        className="rounded border border-slate-200 px-2 py-1 text-sm"
                      >
                        <option value="">Pick category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <select
                        name="complexity"
                        defaultValue={c.suggestedComplexity ?? ''}
                        className="rounded border border-slate-200 px-2 py-1 text-sm"
                      >
                        <option value="">Complexity</option>
                        <option value="simple">Simple</option>
                        <option value="standard">Standard</option>
                        <option value="complex">Complex</option>
                        <option value="heavy">Heavy</option>
                      </select>
                      <button
                        name="actionType"
                        value="accept"
                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Accept & enable
                      </button>
                      <button
                        name="actionType"
                        value="reject"
                        className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Mark as not needed
                      </button>
                    </div>
                  </div>
                </Form>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
