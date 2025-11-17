import type { EntryContext } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        onShellReady() {
          if (isbot(request.headers.get('user-agent') ?? '')) {
            return;
          }

          const body = new PassThrough();
          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(body, {
              status: didError ? 500 : responseStatusCode,
              headers: responseHeaders
            })
          );

          pipe(body);
        },
        onAllReady() {
          if (!isbot(request.headers.get('user-agent') ?? '')) {
            return;
          }

          const body = new PassThrough();
          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(body, {
              status: didError ? 500 : responseStatusCode,
              headers: responseHeaders
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          didError = true;
          console.error(error);
        }
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
