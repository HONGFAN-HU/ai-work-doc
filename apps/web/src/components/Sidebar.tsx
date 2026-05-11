import { useState, useEffect } from 'react';
import { Input } from 'tdesign-react';
import { SearchIcon, AddIcon, RefreshIcon, SettingIcon, FolderIcon, FileIcon, CloseIcon } from 'tdesign-icons-react';
import type { FileNode } from '@ai-work-doc/shared';
import { LogoSvg } from './LogoSvg';

interface SidebarProps {
  tree: FileNode[];
  currentPath: string;
  activeView: 'doclib' | 'editor' | 'settings';
  readOnly: boolean;
  onNavigate: (view: 'doclib' | 'editor' | 'settings') => void;
  onOpen: (path: string) => void;
  onCloseCurrentFile: () => void;
  onCreate: () => void;
  onRefresh: () => void;
  onSettings: () => void;
}

export function Sidebar({
  tree, currentPath, activeView, readOnly,
  onNavigate, onOpen, onCloseCurrentFile, onCreate, onRefresh, onSettings,
}: SidebarProps) {
  const [recentPaths, setRecentPaths] = useState<string[]>([]);

  useEffect(() => {
    if (currentPath) {
      setRecentPaths((prev) => {
        if (prev.includes(currentPath)) return prev;
        return [currentPath, ...prev].slice(0, 20);
      });
    }

    fetch('/api/recent')
      .then((res) => res.json())
      .then((json) => setRecentPaths(json.data?.recentFiles || []))
      .catch(() => {});
  }, [currentPath]);

  const pathToName = new Map(
    flattenFiles(tree).map((f) => [f.path, f.name])
  );
  const recentFiles = recentPaths
    .filter((p) => pathToName.has(p))
    .slice(0, 20)
    .map((p) => ({ path: p, name: pathToName.get(p)! }));

  const removeRecent = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentPaths((prev) => prev.filter((p) => p !== path));
    fetch(`/api/recent?path=${encodeURIComponent(path)}`, { method: 'DELETE' }).catch(() => {});
    if (currentPath === path) {
      onCloseCurrentFile();
    }
  };

  return (
    <div className="sidebar-content">
      <div className="sidebar-logo">
        <LogoSvg />
      </div>

      <div className="sidebar-search">
        <Input
          placeholder="请输入内容"
          prefixIcon={<SearchIcon />}
          clearable
          size="small"
        />
      </div>

      <div className="sidebar-menu">
        <div className="sidebar-section-label">Function</div>

        <div
          className={`sidebar-file-item ${activeView === 'doclib' ? 'active' : ''}`}
          onClick={() => onNavigate('doclib')}
          title="文档库"
        >
          <span className="file-icon"><FolderIcon size="14px" /></span>
          <span className="file-name">文档库</span>
        </div>
        <div className="sidebar-file-item" title="项目">
          <span className="file-icon"><FolderIcon size="14px" /></span>
          <span className="file-name">项目</span>
        </div>

        {recentFiles.length > 0 && (
          <>
            <div className="sidebar-section-label">Recent</div>
            {recentFiles.map((f) => (
              <div
                key={f.path}
                className={`sidebar-file-item recent-file-item ${activeView === 'editor' && currentPath === f.path ? 'active' : ''}`}
                onClick={() => onOpen(f.path)}
                title={f.path}
              >
                <span className="file-icon"><FileIcon size="14px" /></span>
                <span className="file-name">{f.name}</span>
                <button
                  className="recent-close-btn"
                  onClick={(e) => removeRecent(f.path, e)}
                  title="Remove from recent"
                >
                  <CloseIcon size="12px" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="sidebar-bottom">
        {!readOnly && (
          <button className="sidebar-bottom-btn" onClick={onCreate} title="New file">
            <AddIcon size="16px" />
          </button>
        )}
        <button className="sidebar-bottom-btn" onClick={onRefresh} title="Refresh">
          <RefreshIcon size="16px" />
        </button>
        <div style={{ flex: 1 }} />
        <button className="sidebar-bottom-btn" onClick={onSettings} title="Settings">
          <SettingIcon size="16px" />
        </button>
      </div>
    </div>
  );
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap((n) =>
    n.type === 'file' ? [n] : flattenFiles(n.children)
  );
}
