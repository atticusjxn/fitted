import { env } from './env.js';
import { buildServer } from './server.js';

async function main() {
  const app = buildServer();

  const close = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  try {
    await app.listen({
      port: env.API_PORT,
      host: env.API_HOST
    });
    app.log.info(
      `API server listening on http://${env.API_HOST}:${env.API_PORT} (env: ${env.NODE_ENV})`
    );
  } catch (error) {
    app.log.error(error, 'Failed to start API server');
    process.exit(1);
  }
}

void main();
