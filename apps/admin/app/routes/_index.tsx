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
      <div className="flex flex-col gap-6">
        <div className="rounded-lg bg-white p-10 shadow-md">
          <h1 className="text-3xl font-semibold">Welcome to Fitted Admin</h1>
          <p className="mt-3 text-lg text-slate-600">
            Start here to configure merchants, manage tradies, and review leads.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
