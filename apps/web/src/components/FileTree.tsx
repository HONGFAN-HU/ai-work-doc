import { useState } from 'react';
import { Input } from 'tdesign-react';
import { SearchIcon, AddIcon, RefreshIcon, SettingIcon } from 'tdesign-icons-react';
import type { FileNode } from '@ai-work-doc/shared';
import { LogoSvg } from './LogoSvg';

/* Custom SVG icons matching Figma design */

function FileSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 1.5C3 1.22386 3.22386 1 3.5 1H9.79289L13 4.20711V14.5C13 14.7761 12.7761 15 12.5 15H3.5C3.22386 15 3 14.7761 3 14.5V1.5Z" stroke="currentColor" strokeWidth="1.33" fill="none" />
      <path d="M9.5 1V4.5H13" stroke="currentColor" strokeWidth="1.33" fill="none" />
      <path d="M5.5 8H10.5M5.5 10.5H10.5M5.5 5.5H7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function BookSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 2.5C2 2.22386 2.22386 2 2.5 2H5.5L8 4.5L10.5 2H13.5C13.7761 2 14 2.22386 14 2.5V13.5C14 13.7761 13.7761 14 13.5 14H2.5C2.22386 14 2 13.7761 2 13.5V2.5Z" stroke="currentColor" strokeWidth="1.33" fill="none" />
      <path d="M8 2V14" stroke="currentColor" strokeWidth="1.33" />
      <path d="M5.5 5.5H7M5.5 8H7" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

function WorkSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4.5" width="12" height="9.5" rx="1" stroke="currentColor" strokeWidth="1.33" fill="none" />
      <path d="M5.5 4.5V3C5.5 2.44772 5.94772 2 6.5 2H9.5C10.0523 2 10.5 2.44772 10.5 3V4.5" stroke="currentColor" strokeWidth="1.33" fill="none" strokeLinecap="round" />
      <path d="M2 8.5H14" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function ChevronRightSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

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
            <FileSvg />
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
      {/* Logo - matching Figma .master/item normalMenu/menuLogo */}
      <div className="sidebar-logo">
        <LogoSvg />
      </div>

      {/* Search - matching Figma Search 搜索框 */}
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

      {/* Menu items - matching Figma menu item 菜单选项 */}
      <div className="sidebar-menu">
        {/* Recent section */}
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
                  <FileSvg />
                </span>
                <span className="file-name">{f.name}</span>
              </div>
            ))}
          </>
        )}

        {/* Function section label */}
        <div className="sidebar-section-label">Function</div>

        {/* Static function items matching Figma */}
        <div className="sidebar-file-item" title="文档库">
          <span className="file-icon">
            <BookSvg />
          </span>
          <span className="file-name">文档库</span>
        </div>
        <div className="sidebar-file-item" title="项目">
          <span className="file-icon">
            <WorkSvg />
          </span>
          <span className="file-name">项目</span>
        </div>

        {/* File tree */}
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

      {/* Bottom bar - matching Figma .master/item normalMenu/menuOperations */}
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

export { ChevronRightSvg };
