import { useState } from 'react';
import { Button, Dialog, DialogPlugin, Input, Space } from 'tdesign-react';
import type { FileNode } from '@ai-work-doc/shared';
import { RecentFiles } from './RecentFiles';

interface FileTreeProps {
  tree: FileNode[];
  loading: boolean;
  readOnly: boolean;
  currentPath: string;
  onOpen: (path: string) => void;
  onRefresh: () => void;
  onCreate: (path: string) => Promise<boolean>;
  onRename: (from: string, to: string) => Promise<boolean>;
  onDelete: (path: string) => Promise<boolean>;
}

export function FileTree({
  tree, loading, readOnly,
  currentPath, onOpen, onRefresh,
  onCreate, onRename, onDelete,
}: FileTreeProps) {
  const [search, setSearch] = useState('');

  // All directories start collapsed
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

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [createParentPath, setCreateParentPath] = useState('');
  const [createName, setCreateName] = useState('');

  const toggleCollapse = (nodePath: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(nodePath)) next.delete(nodePath);
      else next.add(nodePath);
      return next;
    });
  };

  const handleCreate = () => {
    setCreateParentPath('');
    setCreateName('');
    setCreateDialogVisible(true);
  };

  const handleCreateConfirm = async () => {
    const dir = createParentPath ? `${createParentPath}/` : '';
    const fileName = createName.endsWith('.md') ? createName : `${createName}.md`;
    const fullPath = `${dir}${fileName}`;
    const ok = await onCreate(fullPath);
    if (ok) {
      setCreateDialogVisible(false);
      onRefresh();
    }
  };

  const handleRename = (nodePath: string, oldName: string) => {
    const dialog = DialogPlugin({
      header: 'Rename',
      body: (
        <Input
          defaultValue={oldName}
          id="rename-input"
          placeholder="New name"
        />
      ),
      onConfirm: async () => {
        const input = document.getElementById('rename-input') as HTMLInputElement;
        const newName = input?.value || '';
        if (newName && newName !== oldName) {
          const dirPath = nodePath.includes('/') ? nodePath.substring(0, nodePath.lastIndexOf('/')) : '';
          const toPath = dirPath ? `${dirPath}/${newName}` : newName;
          const ok = await onRename(nodePath, toPath);
          if (ok) onRefresh();
        }
        dialog.hide();
      },
      onClose: () => dialog.hide(),
    });
  };

  const handleDelete = (nodePath: string) => {
    const dialog = DialogPlugin.confirm({
      header: 'Delete file',
      body: `Are you sure you want to delete "${nodePath}"?`,
      onConfirm: async () => {
        const ok = await onDelete(nodePath);
        if (ok) onRefresh();
        dialog.hide();
      },
      onClose: () => dialog.hide(),
    });
  };

  const filterTree = (nodes: FileNode[]): FileNode[] => {
    if (!search) return nodes;
    return nodes.reduce<FileNode[]>((acc, node) => {
      if (node.type === 'file' && node.name.toLowerCase().includes(search.toLowerCase())) {
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
            <div
              className={`tree-node tree-directory ${isCollapsed ? '' : 'expanded'}`}
              style={{ paddingLeft: depth * 16 }}
              onClick={() => toggleCollapse(node.path)}
            >
              <span className="tree-arrow">{isCollapsed ? '▶' : '▼'}</span>
              {node.name}
            </div>
            {!isCollapsed && node.children.length > 0 && renderNodes(node.children, depth + 1)}
          </div>
        );
      }

      return (
        <div key={node.path} className="tree-node-row" style={{ paddingLeft: depth * 16 + 16 }}>
          <button
            className={`tree-node tree-file ${isActive ? 'active' : ''}`}
            onClick={() => onOpen(node.path)}
          >
            {node.name}
          </button>
          {!readOnly && (
            <span className="tree-actions">
              <Button
                size="small"
                variant="text"
                onClick={(e) => { e.stopPropagation(); handleRename(node.path, node.name); }}
              >
                Rename
              </Button>
              <Button
                size="small"
                variant="text"
                theme="danger"
                onClick={(e) => { e.stopPropagation(); handleDelete(node.path); }}
              >
                Delete
              </Button>
            </span>
          )}
        </div>
      );
    });
  };

  const filtered = filterTree(tree);

  return (
    <div className="file-tree-container">
      <div className="file-tree-header">
        <Space>
          {!readOnly && (
            <Button size="small" onClick={handleCreate}>+ New</Button>
          )}
          <Button size="small" variant="outline" onClick={onRefresh} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>
      <div className="file-tree-search">
        <Input
          value={search}
          onChange={(v) => setSearch(v)}
          placeholder="Search files..."
          clearable
        />
      </div>
      <RecentFiles onOpen={onOpen} />
      <div className="tree-scroll">
        {loading && tree.length === 0 ? (
          <div className="tree-empty">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="tree-empty">
            {search ? 'No matching files' : 'No Markdown files found'}
          </div>
        ) : (
          renderNodes(filtered)
        )}
      </div>

      <Dialog
        header="New file"
        visible={createDialogVisible}
        onClose={() => setCreateDialogVisible(false)}
        onConfirm={handleCreateConfirm}
        confirmBtn="Create"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            value={createParentPath}
            onChange={(v) => setCreateParentPath(v)}
            placeholder="Parent directory (optional)"
          />
          <Input
            value={createName}
            onChange={(v) => setCreateName(v)}
            placeholder="File name (e.g. notes)"
          />
        </div>
      </Dialog>
    </div>
  );
}
