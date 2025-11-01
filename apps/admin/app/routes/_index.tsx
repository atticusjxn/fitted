import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'Fitted Admin' },
    { name: 'description', content: 'Admin console for Fitted' }
  ];
};

export default function IndexRoute() {
  return (
    <main className="h-screen w-full bg-slate-100 text-slate-900">
      <section className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="rounded-lg bg-white p-10 shadow-md">
          <h1 className="text-3xl font-semibold">Welcome to Fitted Admin</h1>
          <p className="mt-3 text-lg text-slate-600">
            Start here to configure merchants, manage tradies, and review leads.
          </p>
        </div>
      </section>
    </main>
  );
}
