import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildServer } from '../dist/server.js';

const app = buildServer();
await app.ready();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  app.server.emit('request', req, res);
}
