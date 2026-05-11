import crypto from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { readConfig, writeConfig } from '../config/workspace';
import { initProject } from '../services/projectInit';
import { restartFileWatcher } from '../services/fileWatchManager';

function requestId() {
  return crypto.randomUUID();
}

export function registerWorkspaceRoutes(app: FastifyInstance) {
  app.get('/api/workspace', async () => ({
    code: 0,
    message: 'ok',
    data: await readConfig(),
    requestId: requestId(),
  }));

  app.post('/api/workspace', {
    schema: {
      body: {
        type: 'object',
        properties: {
          rootPath: { type: 'string' },
          port: { type: 'number' },
          autoSave: { type: 'boolean' },
          readOnly: { type: 'boolean' },
          theme: { type: 'string', enum: ['light', 'dark', 'system'] },
        },
      },
    },
    handler: async (request) => {
      const body = request.body as Partial<{
        rootPath: string;
        port: number;
        autoSave: boolean;
        readOnly: boolean;
        theme: 'light' | 'dark' | 'system';
      }>;
      const next = await writeConfig(body);
      if (body.rootPath) {
        await initProject(body.rootPath);
        restartFileWatcher(body.rootPath);
      }
      return { code: 0, message: 'ok', data: next, requestId: requestId() };
    },
  });

  app.get('/api/recent', async () => {
    const config = await readConfig();
    return { code: 0, message: 'ok', data: { recentFiles: config.recentFiles }, requestId: requestId() };
  });

  app.post('/api/recent', {
    schema: {
      body: {
        type: 'object',
        required: ['path'],
        properties: { path: { type: 'string' } },
      },
    },
    handler: async (request) => {
      const body = request.body as { path: string };
      const config = await readConfig();
      let recentFiles: string[];
      if (config.recentFiles.includes(body.path)) {
        recentFiles = config.recentFiles;
      } else {
        recentFiles = [body.path, ...config.recentFiles].slice(0, 20);
      }
      await writeConfig({ ...config, recentFiles });
      return { code: 0, message: 'ok', data: { recentFiles }, requestId: requestId() };
    },
  });

  app.delete('/api/recent', async (request) => {
    const query = request.query as { path?: string };
    if (!query.path) {
      return { code: 400, message: 'path is required', requestId: requestId() };
    }
    const config = await readConfig();
    const recentFiles = config.recentFiles.filter((f) => f !== query.path);
    await writeConfig({ ...config, recentFiles });
    return { code: 0, message: 'ok', data: { recentFiles }, requestId: requestId() };
  });
}
