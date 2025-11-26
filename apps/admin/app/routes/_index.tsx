import type { MetaFunction } from '@remix-run/node';
import { AdminLayout } from '../components/AdminLayout.js';

export const meta: MetaFunction = () => {
  return [
    { title: 'Fitted Admin' },
    { name: 'description', content: 'Admin console for Fitted' }
  ];
};

export default function IndexRoute() {
  return (
    <AdminLayout>
      <div className="card card--gradient fade-in">
        <div className="section-header">
          <span className="section-eyebrow">Welcome</span>
          <h1 className="section-title">Fitted Admin</h1>
        </div>
        <p className="muted">
          Configure merchants, manage tradies, and review leads. Everything you need to keep installation at checkout
          running smoothly.
        </p>
      </div>
    </AdminLayout>
  );
}
