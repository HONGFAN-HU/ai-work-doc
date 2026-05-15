import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import Fastify from 'fastify';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerDocsRoutes } from './routes/docsRoutes';
import { registerEventsRoutes } from './routes/eventsRoutes';
import { registerFileRoutes } from './routes/fileRoutes';
import { registerOrganizeRoutes } from './routes/organizeRoutes';
import { registerWorkspaceRoutes } from './routes/workspaceRoutes';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });

  // Serve static frontend assets in production
  const webDist = join(__dirname, '../../web/dist');
  app.register(staticFiles, {
    root: webDist,
    prefix: '/',
    decorateReply: false,
  });

  // Fallback to index.html for SPA routing (after API routes)
  app.setNotFoundHandler(async (request, reply) => {
    if ((request.raw as { url?: string }).url?.startsWith('/api/')) {
      return reply.code(404).send({ code: 404, message: 'not found', data: null });
    }
    const fs = await import('node:fs/promises');
    const indexPath = join(webDist, 'index.html');
    try {
      const html = await fs.readFile(indexPath, 'utf8');
      return reply.type('text/html').send(html);
    } catch {
      return reply.code(404).send({ code: 404, message: 'not found', data: null });
    }
  });

  app.get('/api/health', async () => ({
    code: 0,
    message: 'ok',
    data: { status: 'healthy' },
    requestId: `req_${Date.now()}`,
  }));

  registerWorkspaceRoutes(app);
  registerFileRoutes(app);
  registerOrganizeRoutes(app);
  registerDocsRoutes(app);
  registerEventsRoutes(app);

  return app;
}
