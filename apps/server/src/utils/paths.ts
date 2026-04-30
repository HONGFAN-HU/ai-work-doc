import path from 'node:path';
import { SUPPORTED_MARKDOWN_EXTENSIONS } from '@ai-work-doc/shared';

export function normalizeWorkspacePath(rootPath: string, targetPath: string) {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedTarget = path.resolve(resolvedRoot, targetPath);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error('path is outside root workspace');
  }
  return resolvedTarget;
}

export function isMarkdownFile(filePath: string) {
  return SUPPORTED_MARKDOWN_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}
