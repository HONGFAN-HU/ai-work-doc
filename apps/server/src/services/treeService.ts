import fs from 'node:fs/promises';
import path from 'node:path';
import type { FileNode } from '@ai-work-doc/shared';
import { SUPPORTED_MARKDOWN_EXTENSIONS } from '@ai-work-doc/shared';
import { isMarkdownFile } from '../utils/paths';

export type { FileNode };

export async function readTree(rootPath: string, currentPath = ''): Promise<FileNode[]> {
  const absolute = path.join(rootPath, currentPath);
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    const relativePath = path.join(currentPath, entry.name).replace(/\\/g, '/');
    const absolutePath = path.join(rootPath, relativePath);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        absolutePath,
        type: 'directory',
        children: await readTree(rootPath, relativePath),
      });
      continue;
    }

    if (entry.isFile() && isMarkdownFile(entry.name)) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        absolutePath,
        type: 'file',
        ext: path.extname(entry.name),
        children: [],
      });
    }
  }

  return nodes.sort((a, b) => a.name.localeCompare(b.name));
}
