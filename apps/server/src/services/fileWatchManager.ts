import { watchWorkspace } from './fileWatcher';
import { sseBroadcast } from './sseManager';

let stopCurrent: (() => void) | null = null;

export function restartFileWatcher(rootPath: string) {
  if (stopCurrent) {
    stopCurrent();
    stopCurrent = null;
  }
  if (!rootPath) return;
  stopCurrent = watchWorkspace(rootPath, (event, filePath) => {
    sseBroadcast('file-change', { event, path: filePath });
  });
}
