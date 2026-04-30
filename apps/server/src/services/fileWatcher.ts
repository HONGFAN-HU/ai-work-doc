import fs from 'node:fs';
import path from 'node:path';
import { isMarkdownFile } from '../utils/paths';

type ChangeCallback = (event: 'change' | 'rename' | 'delete', filePath: string) => void;

export function watchWorkspace(rootPath: string, callback: ChangeCallback): () => void {
  const watchers: fs.FSWatcher[] = [];

  function watchDir(dirPath: string) {
    try {
      const watcher = fs.watch(dirPath, { recursive: false }, (_eventType, filename) => {
        if (!filename) return;
        const fullPath = path.join(dirPath, filename);

        // Check if it still exists (might have been deleted)
        fs.stat(fullPath, (statErr, stats) => {
          if (statErr) {
            callback('delete', fullPath);
            return;
          }
          if (stats.isFile() && isMarkdownFile(filename)) {
            callback('change', fullPath);
          } else if (stats.isDirectory()) {
            callback('change', fullPath);
          }
        });
      });

      watcher.on('error', () => {
        // Suppress errors from watchers on removed directories
      });

      watchers.push(watcher);

      // Recursively watch subdirectories
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            watchDir(path.join(dirPath, entry.name));
          }
        }
      } catch {
        // Directory might not be readable
      }
    } catch {
      // Directory might not exist
    }
  }

  watchDir(rootPath);

  return () => {
    for (const watcher of watchers) {
      watcher.close();
    }
  };
}
