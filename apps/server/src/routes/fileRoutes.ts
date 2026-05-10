import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { FastifyInstance } from 'fastify';
import type { FileNode } from '@ai-work-doc/shared';
import { readConfig } from '../config/workspace';
import { readTree } from '../services/treeService';
import { refreshIndex } from '../services/projectInit';
import { isMarkdownFile, normalizeWorkspacePath } from '../utils/paths';

function requestId() {
  return crypto.randomUUID();
}

function errorResponse(code: number, message: string) {
  return { code, message, data: null, requestId: requestId() };
}

export function registerFileRoutes(app: FastifyInstance) {
  app.get('/api/tree', async () => {
    const config = await readConfig();
    const nodes = config.rootPath ? await readTree(config.rootPath) : [];
    return { code: 0, message: 'ok', data: { rootPath: config.rootPath, nodes }, requestId: requestId() };
  });

  app.get('/api/file', {
    schema: {
      querystring: {
        type: 'object',
        required: ['path'],
        properties: { path: { type: 'string' } },
      },
    },
    handler: async (request, reply) => {
      const config = await readConfig();
      const filePath = (request.query as { path: string }).path;
      try {
        const absolutePath = normalizeWorkspacePath(config.rootPath, filePath);
        if (!isMarkdownFile(absolutePath)) {
          return reply.code(400).send(errorResponse(4003, 'unsupported file type'));
        }
        const content = await fs.readFile(absolutePath, 'utf8');
        const stat = await fs.stat(absolutePath);
        return { code: 0, message: 'ok', data: { path: filePath, name: path.basename(filePath), content, encoding: 'utf-8', updatedAt: stat.mtime.toISOString(), size: stat.size }, requestId: requestId() };
      } catch (error) {
        if (error instanceof Error && error.message === 'path is outside root workspace') {
          return reply.code(400).send(errorResponse(4001, error.message));
        }
        return reply.code(400).send(errorResponse(4002, error instanceof Error ? error.message : 'file not found'));
      }
    },
  });

  app.post('/api/file', {
    schema: {
      body: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string' },
          content: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const config = await readConfig();
      if (config.readOnly) {
        return reply.code(403).send(errorResponse(4005, 'workspace is in read-only mode'));
      }
      const { path: filePath, content } = request.body as { path: string; content?: string };
      try {
        const absolutePath = normalizeWorkspacePath(config.rootPath, filePath);
        if (!isMarkdownFile(absolutePath)) {
          return reply.code(400).send(errorResponse(4003, 'unsupported file type'));
        }
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, content || '', 'utf8');
        const stat = await fs.stat(absolutePath);
        return { code: 0, message: 'ok', data: { path: filePath, name: path.basename(filePath), content: content || '', encoding: 'utf-8', updatedAt: stat.mtime.toISOString(), size: stat.size }, requestId: requestId() };
      } catch (error) {
        if (error instanceof Error && error.message === 'path is outside root workspace') {
          return reply.code(400).send(errorResponse(4001, error.message));
        }
        return reply.code(400).send(errorResponse(5002, error instanceof Error ? error.message : 'failed to write file'));
      }
    },
  });

  app.put('/api/file', {
    schema: {
      body: {
        type: 'object',
        required: ['path', 'content'],
        properties: {
          path: { type: 'string' },
          content: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const config = await readConfig();
      if (config.readOnly) {
        return reply.code(403).send(errorResponse(4005, 'workspace is in read-only mode'));
      }
      const { path: filePath, content } = request.body as { path: string; content: string };
      try {
        const absolutePath = normalizeWorkspacePath(config.rootPath, filePath);
        await fs.writeFile(absolutePath, content, 'utf8');
        return { code: 0, message: 'ok', data: { path: filePath, saved: true, updatedAt: new Date().toISOString() }, requestId: requestId() };
      } catch (error) {
        if (error instanceof Error && error.message === 'path is outside root workspace') {
          return reply.code(400).send(errorResponse(4001, error.message));
        }
        return reply.code(400).send(errorResponse(5002, error instanceof Error ? error.message : 'failed to write file'));
      }
    },
  });

  app.post('/api/file/rename', {
    schema: {
      body: {
        type: 'object',
        required: ['fromPath', 'toPath'],
        properties: {
          fromPath: { type: 'string' },
          toPath: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const config = await readConfig();
      if (config.readOnly) {
        return reply.code(403).send(errorResponse(4005, 'workspace is in read-only mode'));
      }
      const { fromPath, toPath } = request.body as { fromPath: string; toPath: string };
      try {
        const from = normalizeWorkspacePath(config.rootPath, fromPath);
        const to = normalizeWorkspacePath(config.rootPath, toPath);
        await fs.rename(from, to);
        return { code: 0, message: 'ok', data: { fromPath, toPath, renamed: true }, requestId: requestId() };
      } catch (error) {
        if (error instanceof Error && error.message === 'path is outside root workspace') {
          return reply.code(400).send(errorResponse(4001, error.message));
        }
        return reply.code(400).send(errorResponse(5002, error instanceof Error ? error.message : 'failed to rename file'));
      }
    },
  });

  app.delete('/api/file', {
    schema: {
      querystring: {
        type: 'object',
        required: ['path'],
        properties: { path: { type: 'string' } },
      },
    },
    handler: async (request, reply) => {
      const config = await readConfig();
      if (config.readOnly) {
        return reply.code(403).send(errorResponse(4005, 'workspace is in read-only mode'));
      }
      const filePath = (request.query as { path: string }).path;
      try {
        const absolutePath = normalizeWorkspacePath(config.rootPath, filePath);
        await fs.unlink(absolutePath);
        return { code: 0, message: 'ok', data: { path: filePath, deleted: true }, requestId: requestId() };
      } catch (error) {
        if (error instanceof Error && error.message === 'path is outside root workspace') {
          return reply.code(400).send(errorResponse(4001, error.message));
        }
        return reply.code(400).send(errorResponse(5002, error instanceof Error ? error.message : 'failed to delete file'));
      }
    },
  });

  app.post('/api/index/refresh', async (request, reply) => {
    const config = await readConfig();
    if (config.readOnly) {
      return reply.code(403).send(errorResponse(4005, 'workspace is in read-only mode'));
    }
    if (!config.rootPath) {
      return reply.code(400).send(errorResponse(4001, 'rootPath is not configured'));
    }
    await refreshIndex(config.rootPath);
    return { code: 0, message: 'ok', data: { refreshed: true }, requestId: requestId() };
  });

  app.get('/api/search', {
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: { q: { type: 'string' } },
      },
    },
    handler: async (request) => {
      const config = await readConfig();
      const query = ((request.query as { q: string }).q || '').toLowerCase();
      if (!config.rootPath || !query) {
        return { code: 0, message: 'ok', data: { results: [] }, requestId: requestId() };
      }
      const allNodes = await readTree(config.rootPath);
      const results = filterByQuery(allNodes, query);
      return { code: 0, message: 'ok', data: { results }, requestId: requestId() };
    },
  });
}

function filterByQuery(nodes: FileNode[], query: string): FileNode[] {
  const results: FileNode[] = [];
  for (const node of nodes) {
    if (node.name.toLowerCase().includes(query) && node.type === 'file') {
      results.push(node);
    }
    if (node.children.length > 0) {
      results.push(...filterByQuery(node.children, query));
    }
  }
  return results;
}
