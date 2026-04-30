import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceConfig } from '@ai-work-doc/shared';

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/workspace');
      const json = await res.json();
      if (json.data) {
        setWorkspace(json.data);
      } else {
        setError(json.message || 'Failed to load workspace');
      }
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveWorkspace = useCallback(async (updates: Partial<WorkspaceConfig>) => {
    const res = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (json.data) {
      setWorkspace(json.data);
    }
    return json;
  }, []);

  useEffect(() => {
    void fetchWorkspace();
  }, [fetchWorkspace]);

  return { workspace, loading, error, saveWorkspace, fetchWorkspace };
}
