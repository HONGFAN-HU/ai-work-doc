import fs from 'node:fs/promises';
import path from 'node:path';
import { readTree } from './treeService';

interface ProjectSettings {
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

function defaultSettings(): ProjectSettings {
  const now = new Date().toISOString();
  return {
    name: 'Default Project',
    description: '',
    createdAt: now,
    updatedAt: now,
  };
}

function buildIndexMarkdown(nodes: ReturnType<typeof collectFiles>, updatedAt: string): string {
  const lines: string[] = [
    '# Project Index',
    '',
    `> Last updated: ${updatedAt}`,
    '',
  ];

  const files = nodes.filter((n) => n.type === 'file');

  if (files.length === 0) {
    lines.push('*No files yet.*');
  } else {
    lines.push('## Files');
    lines.push('');
    for (const f of files) {
      const displayPath = f.path.replace(/\\/g, '/');
      lines.push(`- [${displayPath}](${displayPath})`);
    }
  }

  return lines.join('\n') + '\n';
}

interface IndexEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

function collectFiles(nodes: Awaited<ReturnType<typeof readTree>>): IndexEntry[] {
  const result: IndexEntry[] = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      result.push({ name: node.name, path: node.path, type: 'file' });
    }
    if (node.children.length > 0) {
      result.push(...collectFiles(node.children));
    }
  }
  return result;
}

export async function initProject(rootPath: string): Promise<void> {
  await fs.mkdir(rootPath, { recursive: true });

  const settingsPath = path.join(rootPath, 'settings.json');
  try {
    await fs.access(settingsPath);
  } catch {
    const settings = defaultSettings();
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  }

  await refreshIndex(rootPath);
}

export async function refreshIndex(rootPath: string): Promise<void> {
  const nodes = await readTree(rootPath).catch(() => []);
  const entries = collectFiles(nodes);
  const updatedAt = new Date().toISOString();
  const content = buildIndexMarkdown(entries, updatedAt);
  const indexPath = path.join(rootPath, 'INDEX.md');
  await fs.writeFile(indexPath, content, 'utf8');
}
