import { useState } from 'react';
import { Input } from 'tdesign-react';
import { SearchIcon, FileIcon, FolderOpenIcon, AddIcon, RefreshIcon, SettingIcon } from 'tdesign-icons-react';
import type { FileNode } from '@ai-work-doc/shared';

interface FileTreeProps {
  tree: FileNode[];
  loading: boolean;
  readOnly: boolean;
  currentPath: string;
  onOpen: (path: string) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onRename: (from: string, to: string) => Promise<boolean>;
  onDelete: (path: string) => Promise<boolean>;
  onSettings: () => void;
}

export function FileTree({
  tree, loading, readOnly,
  currentPath, onOpen, onRefresh,
  onCreate, onRename, onDelete, onSettings,
}: FileTreeProps) {
  const [search, setSearch] = useState('');

  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const allDirs = new Set<string>();
    const collect = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.type === 'directory') {
          allDirs.add(n.path);
          collect(n.children);
        }
      }
    };
    collect(tree);
    return allDirs;
  });

  const toggleCollapse = (nodePath: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(nodePath)) next.delete(nodePath);
      else next.add(nodePath);
      return next;
    });
  };

  const filterTree = (nodes: FileNode[]): FileNode[] => {
    if (!search) return nodes;
    return nodes.reduce<FileNode[]>((acc, node) => {
      if (node.name.toLowerCase().includes(search.toLowerCase())) {
        acc.push(node);
      } else if (node.type === 'directory') {
        const matched = filterTree(node.children);
        if (matched.length > 0) {
          acc.push({ ...node, children: matched });
        }
      }
      return acc;
    }, []);
  };

  const renderNodes = (nodes: FileNode[], depth: number = 0): JSX.Element[] => {
    return nodes.map((node) => {
      const isCollapsed = collapsed.has(node.path);
      const isActive = currentPath === node.path;

      if (node.type === 'directory') {
        return (
          <div key={node.path}>
            <button
              className="sidebar-tree-toggle"
              style={{ paddingLeft: 8 + depth * 16 }}
              onClick={() => toggleCollapse(node.path)}
            >
              <span style={{ fontSize: 10, width: 14, flexShrink: 0, color: 'rgba(0,0,0,0.4)' }}>
                {isCollapsed ? '▶' : '▼'}
              </span>
              <span className="file-name" style={{ fontWeight: 600 }}>{node.name}</span>
            </button>
            {!isCollapsed && node.children.length > 0 && (
              <div className="sidebar-tree-children">
                {renderNodes(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          className={`sidebar-file-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: 8 + depth * 16 }}
          onClick={() => onOpen(node.path)}
          title={node.path}
        >
          <span className="file-icon">
            <FileIcon size="14px" />
          </span>
          <span className="file-name">{node.name}</span>
        </div>
      );
    });
  };

  const filtered = filterTree(tree);
  const allFiles = (function collectFiles(nodes: FileNode[]): FileNode[] {
    return nodes.flatMap((n) =>
      n.type === 'file' ? [n] : collectFiles(n.children)
    );
  })(tree);

  return (
    <div className="sidebar-content">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">AI Work Doc</span>
      </div>

      <div className="sidebar-search">
        <Input
          value={search}
          onChange={(v) => setSearch(v)}
          placeholder="请输入内容"
          prefixIcon={<SearchIcon />}
          clearable
          size="small"
        />
      </div>

      <div className="sidebar-menu">
        {allFiles.length > 0 && (
          <>
            <div className="sidebar-section-label">Recent</div>
            {allFiles.slice(0, 6).map((f) => (
              <div
                key={f.path}
                className={`sidebar-file-item ${currentPath === f.path ? 'active' : ''}`}
                onClick={() => onOpen(f.path)}
                title={f.path}
              >
                <span className="file-icon">
                  <FileIcon size="14px" />
                </span>
                <span className="file-name">{f.name}</span>
              </div>
            ))}
          </>
        )}

        <div className="sidebar-section-label">Files</div>

        {loading && tree.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'rgba(0,0,0,0.4)', fontSize: 12 }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'rgba(0,0,0,0.4)', fontSize: 12 }}>
            {search ? 'No matching files' : 'No Markdown files found'}
          </div>
        ) : (
          renderNodes(filtered)
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
