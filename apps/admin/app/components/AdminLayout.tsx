import { Link, useLocation } from '@remix-run/react';
import type { PropsWithChildren } from 'react';

type NavItem = {
  label: string;
  to: string;
};

const nav: NavItem[] = [
  { label: 'Dashboard', to: '/' },
  { label: 'Leads', to: '/leads' },
  { label: 'Settings', to: '/settings' }
];

export function AdminLayout({ children }: PropsWithChildren) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-6 py-4 text-lg font-semibold">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          Fitted Admin
        </div>
        <nav className="flex flex-col gap-1 px-4 pb-6">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-md px-3 py-2 text-sm font-medium transition hover:bg-slate-50 ${
                  active
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">Fitted Merchant Console</p>
            <p className="text-lg font-semibold text-slate-900">Settings & Configuration</p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">atticus@fitted</div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
