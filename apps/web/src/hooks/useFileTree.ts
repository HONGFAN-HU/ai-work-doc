import { useCallback, useState } from 'react';
import type { FileNode } from '@ai-work-doc/shared';

export function useFileTree() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/tree');
    const json = await res.json();
    setTree(json.data?.nodes || []);
    setLoading(false);
  }, []);

  return { tree, loading, fetchTree };
}
