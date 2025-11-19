import { buildServer } from '../dist/server.js';

const appPromise = (async () => {
  const app = buildServer();
  await app.ready();
  return app;
})();

export default async function handler(req, res) {
  const app = await appPromise;
  app.server.emit('request', req, res);
}
