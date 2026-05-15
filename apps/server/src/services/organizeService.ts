import fs from 'node:fs/promises';
import path from 'node:path';
import { readTree } from './treeService';
import { refreshIndex } from './projectInit';
import { isMarkdownFile, normalizeWorkspacePath } from '../utils/paths';

export interface OrganizeResult {
  moved: { from: string; to: string; reason: string }[];
  skipped: string[];
  errors: string[];
}

const CLASSIFICATION_RULES: { pattern: RegExp; matchType: string; target: string }[] = [
  { pattern: /^session-/, matchType: 'prefix', target: 'sessions' },
  { pattern: /-(?:skill|config)\.md$/, matchType: 'suffix', target: 'skills' },
  { pattern: /-(?:design|arch)\.md$/, matchType: 'suffix', target: 'design' },
  { pattern: /^project-|changelog|-summary\.md$/, matchType: 'prefix or suffix', target: 'notes' },
];

function classifyFile(fileName: string): string | null {
  if (fileName === 'INDEX.md' || fileName === 'settings.json') return null;
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.pattern.test(fileName)) return rule.target;
  }
  return 'notes';
}

export async function organizeFiles(rootPath: string): Promise<OrganizeResult> {
  const result: OrganizeResult = { moved: [], skipped: [], errors: [] };
  const nodes = await readTree(rootPath);

  for (const node of nodes) {
    if (node.type !== 'file') continue;
    // Only move files in the root directory
    if (node.path.includes('/')) continue;

    const targetDir = classifyFile(node.name);
    if (targetDir === null) {
      result.skipped.push(node.name);
      continue;
    }

    const targetPath = `${targetDir}/${node.name}`;
    try {
      const from = normalizeWorkspacePath(rootPath, node.path);
      const to = normalizeWorkspacePath(rootPath, targetPath);
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.rename(from, to);
      result.moved.push({ from: node.path, to: targetPath, reason: targetDir });
    } catch (e) {
      result.errors.push(`${node.path}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (result.moved.length > 0) {
    await refreshIndex(rootPath);
  }

  return result;
}