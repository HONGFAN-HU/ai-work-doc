import { Input } from 'tdesign-react';
import { SearchIcon, AddIcon, RefreshIcon, SettingIcon, FolderIcon, FileIcon } from 'tdesign-icons-react';
import type { FileNode } from '@ai-work-doc/shared';
import { LogoSvg } from './LogoSvg';

interface SidebarProps {
  tree: FileNode[];
  currentPath: string;
  activeView: 'doclib' | 'editor';
  readOnly: boolean;
  onNavigate: (view: 'doclib' | 'editor') => void;
  onOpen: (path: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
  onSettings: () => void;
}

export function Sidebar({
  tree, currentPath, activeView, readOnly,
  onNavigate, onOpen, onCreate, onRefresh, onSettings,
}: SidebarProps) {
  const allFiles = flattenFiles(tree);
  const recentFiles = allFiles.slice(0, 6);

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
                className={`sidebar-file-item ${currentPath === f.path ? 'active' : ''}`}
                onClick={() => onOpen(f.path)}
                title={f.path}
              >
                <span className="file-icon"><FileIcon size="14px" /></span>
                <span className="file-name">{f.name}</span>
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
