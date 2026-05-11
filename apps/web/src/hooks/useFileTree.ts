import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileNode } from '@ai-work-doc/shared';

export function useFileTree() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchTree = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/tree');
    const json = await res.json();
    setTree(json.data?.nodes || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const es = new EventSource('/api/events');

    es.addEventListener('file-change', () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchTree(), 200);
    });

    es.onerror = () => {
      // EventSource auto-reconnects on connection loss
    };

    return () => {
      es.close();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchTree]);

  return { tree, loading, fetchTree };
}
