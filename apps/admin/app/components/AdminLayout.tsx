import { Link, useLocation } from '@remix-run/react';
import type { PropsWithChildren } from 'react';

type NavItem = {
  label: string;
  to: string;
};

const nav: NavItem[] = [
  { label: 'Dashboard', to: '/' },
  { label: 'Installations', to: '/installations' },
  { label: 'Leads', to: '/leads' },
  { label: 'Trades', to: '/trades' },
  { label: 'Settings', to: '/settings' }
];

export function AdminLayout({ children }: PropsWithChildren) {
  const { pathname } = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__pill">Fitted</span>
          <span>Control</span>
        </div>
        <ul className="sidebar__nav">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <li key={item.to}>
                <Link to={item.to} className={`sidebar__link ${active ? 'sidebar__link--active' : ''}`}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="flex min-h-screen flex-col">
        <header className="topbar">
          <div>
            <p className="section-eyebrow">Fitted Console</p>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Connect shoppers with local tradespeople instantly</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="chip chip-success">● Live</div>
          </div>
        </header>

        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}
