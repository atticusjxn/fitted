import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from '@remix-run/react';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import themeUrl from './styles/theme.css';

export const links: LinksFunction = () => [];

export function loader({ request }: LoaderFunctionArgs) {
  return {
    url: request.url
  };
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <script src="https://cdn.tailwindcss.com" />
        <link rel="stylesheet" href={themeUrl} />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
