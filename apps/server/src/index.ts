import fs from 'node:fs/promises';
import path from 'node:path';
import { createApp } from './app';
import { readConfig } from './config/workspace';
import { refreshIndex } from './services/projectInit';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';

const app = createApp();

async function ensureIndexOnStartup() {
  const config = await readConfig();
  if (!config.rootPath) return;
  try {
    await fs.access(path.join(config.rootPath, 'INDEX.md'));
  } catch {
    await refreshIndex(config.rootPath);
  }
}

Promise.all([ensureIndexOnStartup(), app.listen({ port, host })]).then(([,]) => {
  app.log.info(`AI Work Doc server running at http://${host}:${port}`);
}).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
