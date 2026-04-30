import { useCallback, useEffect, useRef } from 'react';

export function useAutoSave(
  content: string,
  currentPath: string,
  autoSaveEnabled: boolean,
  saveFn: (path: string, content: string) => Promise<boolean>,
  onStatusChange: (status: string) => void,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(content);
  const dirtyRef = useRef(false);

  // Reset on file open
  useEffect(() => {
    lastSavedRef.current = content;
    dirtyRef.current = false;
  }, [currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerSave = useCallback(async () => {
    if (!dirtyRef.current || !currentPath) return;
    onStatusChange('Auto-saving...');
    const ok = await saveFn(currentPath, content);
    if (ok) {
      lastSavedRef.current = content;
      dirtyRef.current = false;
      onStatusChange('Saved');
    }
  }, [content, currentPath, saveFn, onStatusChange]);

  useEffect(() => {
    if (content !== lastSavedRef.current) {
      dirtyRef.current = true;
      if (autoSaveEnabled && currentPath) {
        onStatusChange('Unsaved changes');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          void triggerSave();
        }, 1500);
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content, autoSaveEnabled, currentPath, triggerSave, onStatusChange]);
}
