import fs from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FastifyInstance } from 'fastify';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function registerDocsRoutes(app: FastifyInstance) {
  app.get('/api/docs', async (_request, reply) => {
    const yamlPath = join(__dirname, '../../../docs/openapi.yaml');
    const content = await fs.readFile(yamlPath, 'utf8');
    return reply.type('text/yaml').send(content);
  });
}
