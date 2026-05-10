import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod/v4';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readConfig, writeConfig } from './config/workspace.js';
import { readTree } from './services/treeService.js';
import { refreshIndex } from './services/projectInit.js';
import { isMarkdownFile, normalizeWorkspacePath } from './utils/paths.js';

const config = await readConfig();

const server = new McpServer({
  name: 'ai-work-doc',
  version: '0.1.0',
}, {
  capabilities: { tools: {} },
});

function formatError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

server.registerTool(
  'list_files',
  {
    description: 'List all markdown files and directories in the workspace.',
    inputSchema: {
      directory: z.string().optional().describe('Subdirectory path relative to workspace root. Omit for root.'),
    },
  },
  async ({ directory }) => {
    try {
      const targetPath = directory
        ? normalizeWorkspacePath(config.rootPath, directory)
        : config.rootPath;
      const nodes = await readTree(targetPath);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(nodes, null, 2) }],
      };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: formatError(e) }], isError: true };
    }
  },
);

server.registerTool(
  'read_file',
  {
    description: 'Read the content of a markdown file in the workspace.',
    inputSchema: {
      path: z.string().describe('Relative path to the markdown file within the workspace.'),
    },
  },
  async ({ path: filePath }) => {
    try {
      const absolutePath = normalizeWorkspacePath(config.rootPath, filePath);
      if (!isMarkdownFile(absolutePath)) {
        return { content: [{ type: 'text' as const, text: 'Unsupported file type. Only .md and .markdown files are allowed.' }], isError: true };
      }
      const content = await fs.readFile(absolutePath, 'utf8');
      const stat = await fs.stat(absolutePath);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ path: filePath, name: path.basename(filePath), content, size: stat.size, updatedAt: stat.mtime.toISOString() }, null, 2),
        }],
      };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: formatError(e) }], isError: true };
    }
  },
);

server.registerTool(
  'create_file',
  {
    description: 'Create a new markdown file in the workspace. Parent directories are created automatically.',
    inputSchema: {
      path: z.string().describe('Relative path for the new markdown file (e.g. notes/getting-started.md).'),
      content: z.string().optional().describe('Initial file content. Defaults to empty.'),
    },
  },
  async ({ path: filePath, content }) => {
    try {
      const absolutePath = normalizeWorkspacePath(config.rootPath, filePath);
      if (!isMarkdownFile(absolutePath)) {
        return { content: [{ type: 'text' as const, text: 'Unsupported file type. Only .md and .markdown files are allowed.' }], isError: true };
      }
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content || '', 'utf8');
      return {
        content: [{ type: 'text' as const, text: `File created: ${filePath}` }],
      };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: formatError(e) }], isError: true };
    }
  },
);

server.registerTool(
  'update_file',
  {
    description: 'Save content to an existing markdown file in the workspace.',
    inputSchema: {
      path: z.string().describe('Relative path to the markdown file to update.'),
      content: z.string().describe('New file content.'),
    },
  },
  async ({ path: filePath, content }) => {
    try {
      const absolutePath = normalizeWorkspacePath(config.rootPath, filePath);
      await fs.writeFile(absolutePath, content, 'utf8');
      return {
        content: [{ type: 'text' as const, text: `File saved: ${filePath}` }],
      };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: formatError(e) }], isError: true };
    }
  },
);

server.registerTool(
  'delete_file',
  {
    description: 'Delete a markdown file from the workspace.',
    inputSchema: {
      path: z.string().describe('Relative path to the markdown file to delete.'),
    },
  },
  async ({ path: filePath }) => {
    try {
      const absolutePath = normalizeWorkspacePath(config.rootPath, filePath);
      await fs.unlink(absolutePath);
      return {
        content: [{ type: 'text' as const, text: `File deleted: ${filePath}` }],
      };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: formatError(e) }], isError: true };
    }
  },
);

server.registerTool(
  'rename_file',
  {
    description: 'Rename or move a markdown file within the workspace.',
    inputSchema: {
      fromPath: z.string().describe('Current relative path of the file.'),
      toPath: z.string().describe('New relative path for the file.'),
    },
  },
  async ({ fromPath, toPath }) => {
    try {
      const from = normalizeWorkspacePath(config.rootPath, fromPath);
      const to = normalizeWorkspacePath(config.rootPath, toPath);
      await fs.rename(from, to);
      return {
        content: [{ type: 'text' as const, text: `Renamed ${fromPath} -> ${toPath}` }],
      };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: formatError(e) }], isError: true };
    }
  },
);

server.registerTool(
  'search_files',
  {
    description: 'Search for markdown files by name (case-insensitive).',
    inputSchema: {
      query: z.string().describe('Search query — matches filenames that contain this string.'),
    },
  },
  async ({ query }) => {
    try {
      const q = query.toLowerCase();
      const allNodes = await readTree(config.rootPath);
      const results = filterByQuery(allNodes, q);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
      };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: formatError(e) }], isError: true };
    }
  },
);

server.registerTool(
  'get_workspace',
  {
    description: 'Get the current workspace configuration including rootPath, settings, and recent files.',
  },
  async () => {
    try {
      const cfg = await readConfig();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(cfg, null, 2) }],
      };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: formatError(e) }], isError: true };
    }
  },
);

server.registerTool(
  'update_workspace',
  {
    description: 'Update workspace configuration. Only provide the fields you want to change.',
    inputSchema: {
      rootPath: z.string().optional().describe('New workspace root directory path.'),
      autoSave: z.boolean().optional(),
      readOnly: z.boolean().optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
    },
  },
  async (updates) => {
    try {
      const next = await writeConfig(updates);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(next, null, 2) }],
      };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: formatError(e) }], isError: true };
    }
  },
);

server.registerTool(
  'refresh_index',
  {
    description: 'Regenerate the INDEX.md file that lists all markdown files in the workspace.',
  },
  async () => {
    try {
      await refreshIndex(config.rootPath);
      return {
        content: [{ type: 'text' as const, text: 'INDEX.md regenerated successfully.' }],
      };
    } catch (e) {
      return { content: [{ type: 'text' as const, text: formatError(e) }], isError: true };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

function filterByQuery(nodes: Awaited<ReturnType<typeof readTree>>, query: string) {
  const results: { name: string; path: string; type: string }[] = [];
  for (const node of nodes) {
    if (node.name.toLowerCase().includes(query) && node.type === 'file') {
      results.push({ name: node.name, path: node.path, type: node.type });
    }
    if (node.children.length > 0) {
      results.push(...filterByQuery(node.children, query));
    }
  }
  return results;
}
