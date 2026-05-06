import { Button, Dialog, DialogPlugin, Input, Space, Tag } from 'tdesign-react';
import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceConfig } from '@ai-work-doc/shared';
import { useWorkspace } from './hooks/useWorkspace';
import { useFileTree } from './hooks/useFileTree';
import { useFileContent } from './hooks/useFileContent';
import { useAutoSave } from './hooks/useAutoSave';
import { FileTree } from './components/FileTree';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MarkdownPreview } from './components/MarkdownPreview';
import { OutlinePanel } from './components/OutlinePanel';
import { StatusBar } from './components/StatusBar';
import { SettingsDialog } from './components/SettingsDialog';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';

function App() {
  const { workspace, loading, error, saveWorkspace, fetchWorkspace } = useWorkspace();
  const { tree, loading: treeLoading, fetchTree } = useFileTree();
  const {
    currentPath, content, fileStatus, isDirty,
    setContent, setFileStatus, markClean,
    openFile, saveFile, createFile, renameFile, deleteFile,
  } = useFileContent();

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [createParentPath, setCreateParentPath] = useState('');
  const [createName, setCreateName] = useState('');

  const wrappedSaveFile = useCallback(async (p?: string, c?: string) => {
    const ok = await saveFile(p, c);
    if (ok) markClean();
    return ok;
  }, [saveFile, markClean]);

  useAutoSave(content, currentPath, workspace?.autoSave ?? false, wrappedSaveFile, setFileStatus);

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

  const handleManualSave = useCallback(async () => {
    const ok = await saveFile();
    if (ok) {
      markClean();
      setFileStatus('Saved');
    }
    return ok;
  }, [saveFile, markClean, setFileStatus]);

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

  const handleOpenFile = useCallback((path: string) => {
    openFile(path);
    setActiveTab('edit');
  }, [openFile]);

  const breadcrumbParts = currentPath
    ? currentPath.replace(workspace?.rootPath || '', '').replace(/^\//, '').split('/')
    : [];

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
      <header className="header">
        <div className="header-left">
          <strong>AI Work Doc</strong>
          {workspace.rootPath && (
            <span className="header-root" title={workspace.rootPath}>
              {workspace.rootPath}
            </span>
          )}
          {isDirty() && (
            <Tag theme="warning" variant="light" size="small">
              Unsaved
            </Tag>
          )}
        </div>
        <Space>
          {currentPath && (
            <Button theme="primary" onClick={handleManualSave} disabled={workspace.readOnly}>
              Save (Ctrl+S)
            </Button>
          )}
        </Space>
      </header>

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

        <div className="main-divider" style={{ width: 1, alignSelf: 'stretch', background: '#e7e7e7', flexShrink: 0 }} />

        <div className="content-area">
          {/* Breadcrumb */}
          {currentPath && (
            <div className="breadcrumb">
              <span className="breadcrumb-item" onClick={() => handleOpenFile('')}>Home</span>
              {breadcrumbParts.map((part, i) => (
                <span key={i}>
                  <span className="breadcrumb-separator">/</span>
                  <span
                    className={`breadcrumb-item ${i === breadcrumbParts.length - 1 ? 'current' : ''}`}
                  >
                    {part}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Editor Area */}
          <div className="editor-area">
            <div className="editor-panel">
              <div className="editor-toolbar">
                <div className="editor-toolbar-tabs">
                  <button
                    className={`editor-toolbar-tab ${activeTab === 'edit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('edit')}
                  >
                    Edit
                  </button>
                  <button
                    className={`editor-toolbar-tab ${activeTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preview')}
                  >
                    Preview
                  </button>
                </div>
                <div className="editor-toolbar-actions">
                  {currentPath && (
                    <span className="editor-path" title={currentPath}>
                      {currentPath}
                    </span>
                  )}
                </div>
              </div>

              {activeTab === 'edit' ? (
                <MarkdownEditor
                  content={content}
                  readOnly={workspace.readOnly}
                  disabled={!currentPath}
                  currentPath={currentPath}
                  onChange={setContent}
                  onSave={handleManualSave}
                />
              ) : (
                <MarkdownPreview content={content} />
              )}
            </div>

            {currentPath && (
              <OutlinePanel content={content} />
            )}
          </div>
        </div>
      </div>

      <StatusBar status={fileStatus} workspace={workspace} />

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
