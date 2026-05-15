import { useState } from 'react';
import { Button, Loading } from 'tdesign-react';
import { AddIcon, FolderIcon, FileIcon, FolderOpenIcon } from 'tdesign-icons-react';
import type { FileNode } from '@ai-work-doc/shared';

interface DocLibraryProps {
  tree: FileNode[];
  loading: boolean;
  selectedPath: string;
  onPreview: (path: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
}

export function DocLibrary({
  tree, loading, selectedPath, onPreview, onCreate, onRefresh,
}: DocLibraryProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const dirs = new Set<string>();
    const collect = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.type === 'directory') { dirs.add(n.path); collect(n.children); }
      }
    };
    collect(tree);
    return dirs;
  });

  const [organizing, setOrganizing] = useState(false);
  const [organizeResult, setOrganizeResult] = useState<string | null>(null);

  const handleOrganize = async () => {
    setOrganizing(true);
    setOrganizeResult(null);
    try {
      const res = await fetch('/api/organize', { method: 'POST' });
      const json = await res.json();
      if (json.code === 0) {
        const data = json.data as { moved: { from: string; to: string }[]; skipped: string[]; errors: string[] };
        if (data.moved.length === 0) {
          setOrganizeResult('文件已整理完毕，无需移动。');
        } else {
          setOrganizeResult(`整理完成，共移动 ${data.moved.length} 个文件。`);
        }
        onRefresh();
      } else {
        setOrganizeResult(`整理失败：${json.message}`);
      }
    } catch {
      setOrganizeResult('整理失败，请检查网络连接。');
    } finally {
      setOrganizing(false);
    }
  };

  const toggleCollapse = (p: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  const renderRows = (nodes: FileNode[], depth = 0): JSX.Element[] => {
    return nodes.flatMap((node) => {
      const rows: JSX.Element[] = [];
      const isCollapsed = collapsed.has(node.path);
      const isSelected = selectedPath === node.path;

      if (node.type === 'directory') {
        rows.push(
          <div
            key={node.path}
            className="doc-library-row"
            style={{ paddingLeft: 16 + depth * 24 }}
            onClick={() => toggleCollapse(node.path)}
          >
            <div className="doc-library-col doc-library-col-name">
              <span className="doc-library-arrow">{isCollapsed ? '▶' : '▼'}</span>
              <span className="doc-library-icon"><FolderIcon size="16px" /></span>
              <span className="doc-library-name">{node.name}</span>
            </div>
            <div className="doc-library-col doc-library-col-desc">
              {`${node.children.length} items`}
            </div>
            <div className="doc-library-col doc-library-col-time">
              {formatTime(node.lastModified)}
            </div>
          </div>
        );
        if (!isCollapsed) {
          rows.push(...renderRows(node.children, depth + 1));
        }
        return rows;
      }

      rows.push(
        <div
          key={node.path}
          className={`doc-library-row ${isSelected ? 'active' : ''}`}
          style={{ paddingLeft: 16 + depth * 24 }}
          onClick={() => onPreview(node.path)}
        >
          <div className="doc-library-col doc-library-col-name">
            <span className="doc-library-icon"><FileIcon size="16px" /></span>
            <span className="doc-library-name">{node.name}</span>
          </div>
          <div className="doc-library-col doc-library-col-desc">
            -
          </div>
          <div className="doc-library-col doc-library-col-time">
            {formatTime(node.lastModified)}
          </div>
        </div>
      );

      return rows;
    });
  };

  return (
    <div className="doc-library">
      <div className="doc-library-header">
        <h2 className="doc-library-title">文档库</h2>
        <div className="doc-library-header-actions">
          <Button theme="default" icon={<FolderOpenIcon />} onClick={handleOrganize} loading={organizing}>
            整理文件
          </Button>
          <Button theme="primary" icon={<AddIcon />} onClick={onCreate}>
            新建文档
          </Button>
        </div>
      </div>

      {organizeResult && (
        <div className="doc-library-organize-result">
          <span>{organizeResult}</span>
          <button className="doc-library-organize-close" onClick={() => setOrganizeResult(null)}>x</button>
        </div>
      )}

      {organizing && (
        <div className="doc-library-organizing-overlay">
          <Loading text="正在整理文件..." size="small" />
        </div>
      )}

      <div className="doc-library-table-wrap">
        <div className="doc-library-header-row">
          <div className="doc-library-col doc-library-col-name">
            <span className="doc-library-header-text">项目名称</span>
          </div>
          <div className="doc-library-col doc-library-col-desc">
            <span className="doc-library-header-text">文件介绍</span>
          </div>
          <div className="doc-library-col doc-library-col-time">
            <span className="doc-library-header-text">上次编辑时间</span>
          </div>
        </div>

        <div className="doc-library-body">
          {loading && tree.length === 0 ? (
            <div className="doc-library-empty">Loading...</div>
          ) : tree.length === 0 ? (
            <div className="doc-library-empty">No Markdown files found</div>
          ) : (
            renderRows(tree)
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(ms?: number): string {
  if (!ms) return '-';
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  return new Date(ms).toLocaleDateString();
}
