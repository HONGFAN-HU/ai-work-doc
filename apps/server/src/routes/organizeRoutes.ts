import crypto from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { readConfig } from '../config/workspace';
import { organizeFiles } from '../services/organizeService';

function requestId() {
  return crypto.randomUUID();
}

export function registerOrganizeRoutes(app: FastifyInstance) {
  app.post('/api/organize', async (request, reply) => {
    const config = await readConfig();
    if (config.readOnly) {
      return reply.code(403).send({ code: 4005, message: 'workspace is in read-only mode', data: null, requestId: requestId() });
    }
    if (!config.rootPath) {
      return reply.code(400).send({ code: 4001, message: 'rootPath is not configured', data: null, requestId: requestId() });
    }
    const result = await organizeFiles(config.rootPath);
    return { code: 0, message: 'ok', data: result, requestId: requestId() };
  });
}