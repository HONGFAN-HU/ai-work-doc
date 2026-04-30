import { useCallback, useEffect, useState } from 'react';

interface RecentFilesProps {
  onOpen: (path: string) => void;
}

export function RecentFiles({ onOpen }: RecentFilesProps) {
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const fetchRecent = useCallback(async () => {
    const res = await fetch('/api/recent');
    const json = await res.json();
    setRecentFiles(json.data?.recentFiles || []);
  }, []);

  useEffect(() => {
    void fetchRecent();
    const timer = setInterval(fetchRecent, 10000);
    return () => clearInterval(timer);
  }, [fetchRecent]);

  if (recentFiles.length === 0) return null;

  return (
    <div className="recent-files">
      <div className="recent-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="tree-arrow">{collapsed ? '▶' : '▼'}</span>
        Recent Files
      </div>
      {!collapsed && (
        <div className="recent-list">
          {recentFiles.slice(0, 10).map((f) => {
            const name = f.includes('/') ? f.substring(f.lastIndexOf('/') + 1) : f;
            return (
              <button key={f} className="tree-node tree-file recent-item" title={f} onClick={() => onOpen(f)}>
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
