import { Dialog, DialogPlugin, Input, Breadcrumb } from 'tdesign-react';
import type { TdBreadcrumbItemProps } from 'tdesign-react/es/breadcrumb/type';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceConfig } from '@ai-work-doc/shared';
import { useWorkspace } from './hooks/useWorkspace';
import { useFileTree } from './hooks/useFileTree';
import { useFileContent } from './hooks/useFileContent';
import { FileTree } from './components/FileTree';
import { MarkdownPreview } from './components/MarkdownPreview';
import { OutlinePanel } from './components/OutlinePanel';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { SettingsDialog } from './components/SettingsDialog';

function App() {
  const { workspace, loading, error, saveWorkspace, fetchWorkspace } = useWorkspace();
  const { tree, loading: treeLoading, fetchTree } = useFileTree();
  const {
    currentPath, content, fileStatus,
    openFile, createFile, renameFile, deleteFile,
  } = useFileContent();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [createParentPath, setCreateParentPath] = useState('');
  const [createName, setCreateName] = useState('');

  useEffect(() => {
    if (workspace?.rootPath) {
      void fetchTree();
    }
  }, [workspace?.rootPath, fetchTree]);

  useEffect(() => {
    const theme = workspace?.theme || 'system';
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [workspace?.theme]);

  const handleSaveWorkspace = useCallback(async (rootPath: string) => {
    await saveWorkspace({ rootPath, port: 3001, autoSave: true, readOnly: false });
    await fetchTree();
  }, [saveWorkspace, fetchTree]);

  const handleSettingsSave = useCallback(async (updates: Partial<WorkspaceConfig>) => {
    const res = await saveWorkspace(updates);
    if (res.data) {
      await fetchTree();
    }
    setSettingsVisible(false);
  }, [saveWorkspace, fetchTree]);

  const handleOpenFile = useCallback((path: string) => {
    openFile(path);
  }, [openFile]);

  const handleCreateConfirm = async () => {
    const dir = createParentPath ? `${createParentPath}/` : '';
    const fileName = createName.endsWith('.md') ? createName : `${createName}.md`;
    const fullPath = `${dir}${fileName}`;
    const ok = await createFile(fullPath);
    if (ok) {
      setCreateDialogVisible(false);
      setCreateName('');
      setCreateParentPath('');
      void fetchTree();
    }
  };

  const handleRename = (nodePath: string, oldName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let newName = oldName;
      const RenameBody = () => (
        <Input
          defaultValue={oldName}
          onChange={(v) => { newName = v; }}
          placeholder="New name"
        />
      );

      const dialog = DialogPlugin({
        header: 'Rename',
        body: <RenameBody />,
        onConfirm: async () => {
          if (newName && newName !== oldName) {
            const dirPath = nodePath.includes('/') ? nodePath.substring(0, nodePath.lastIndexOf('/')) : '';
            const toPath = dirPath ? `${dirPath}/${newName}` : newName;
            const ok = await renameFile(nodePath, toPath);
            if (ok) void fetchTree();
            dialog.hide();
            resolve(ok);
          } else {
            dialog.hide();
            resolve(false);
          }
        },
        onClose: () => { dialog.hide(); resolve(false); },
      });
    });
  };

  const handleDelete = (nodePath: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const dialog = DialogPlugin.confirm({
        header: 'Delete file',
        body: `Are you sure you want to delete "${nodePath}"?`,
        onConfirm: async () => {
          const ok = await deleteFile(nodePath);
          if (ok) void fetchTree();
          dialog.hide();
          resolve(ok);
        },
        onClose: () => { dialog.hide(); resolve(false); },
      });
    });
  };

  const breadcrumbOptions: TdBreadcrumbItemProps[] = useMemo(() => {
    if (!currentPath || !workspace?.rootPath) return [];
    const relativePath = currentPath.replace(workspace.rootPath, '').replace(/^\//, '');
    const parts = relativePath ? relativePath.split('/') : [];
    const items: TdBreadcrumbItemProps[] = [{ content: 'Home', href: '#' }];
    parts.forEach((part, i) => {
      items.push({
        content: part,
        href: i === parts.length - 1 ? undefined : '#',
      });
    });
    return items;
  }, [currentPath, workspace?.rootPath]);

  if (error) {
    return <ErrorState message={error} onRetry={fetchWorkspace} />;
  }

  if (loading) {
    return <div className="app-loading">Loading workspace...</div>;
  }

  if (!workspace?.rootPath) {
    return <EmptyState onConfigure={handleSaveWorkspace} />;
  }

  return (
    <div className="app-shell">
      <div className="main-layout">
        <aside className="sidebar">
          <FileTree
            tree={tree}
            loading={treeLoading}
            readOnly={workspace.readOnly}
            currentPath={currentPath}
            onOpen={handleOpenFile}
            onRefresh={fetchTree}
            onCreate={() => {
              setCreateParentPath('');
              setCreateName('');
              setCreateDialogVisible(true);
            }}
            onRename={handleRename}
            onDelete={handleDelete}
            onSettings={() => setSettingsVisible(true)}
          />
        </aside>

        <div className="main-divider" />

        <div className="content-area">
          {currentPath && (
            <Breadcrumb className="app-breadcrumb" options={breadcrumbOptions} />
          )}

          <div className="editor-area">
            <div className="editor-panel">
              {currentPath && (
                <div className="editor-toolbar">
                  <div className="editor-toolbar-actions">
                    <span className="editor-path" title={currentPath}>
                      {currentPath}
                    </span>
                  </div>
                </div>
              )}
              <MarkdownPreview content={content} />
            </div>

            {currentPath && (
              <OutlinePanel content={content} />
            )}
          </div>
        </div>
      </div>

      <SettingsDialog
        workspace={workspace}
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onSave={handleSettingsSave}
      />

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

export default App;
