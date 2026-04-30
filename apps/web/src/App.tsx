import { Button, Card, Space, Tag } from 'tdesign-react';
import { useCallback, useEffect } from 'react';
import type { WorkspaceConfig } from '@ai-work-doc/shared';
import { useWorkspace } from './hooks/useWorkspace';
import { useFileTree } from './hooks/useFileTree';
import { useFileContent } from './hooks/useFileContent';
import { useAutoSave } from './hooks/useAutoSave';
import { FileTree } from './components/FileTree';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MarkdownPreview } from './components/MarkdownPreview';
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

  const wrappedSaveFile = useCallback(async (p?: string, c?: string) => {
    const ok = await saveFile(p, c);
    if (ok) markClean();
    return ok;
  }, [saveFile, markClean]);

  useAutoSave(content, currentPath, workspace?.autoSave ?? false, wrappedSaveFile, setFileStatus);

  // Fetch file tree whenever workspace rootPath is set
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
  }, [saveWorkspace, fetchTree]);

  const handleManualSave = useCallback(async () => {
    const ok = await saveFile();
    if (ok) {
      markClean();
      setFileStatus('Saved');
    }
  }, [saveFile, markClean, setFileStatus]);

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
          <SettingsDialog workspace={workspace} onSave={handleSettingsSave} />
          <Button theme="primary" onClick={handleManualSave} disabled={!currentPath || workspace.readOnly}>
            Save (Ctrl+S)
          </Button>
        </Space>
      </header>
      <div className="main-layout">
        <aside className="sidebar">
          <Card title="Files" bordered={false}>
            <FileTree
              tree={tree}
              loading={treeLoading}
              readOnly={workspace.readOnly}
              currentPath={currentPath}
              onOpen={openFile}
              onRefresh={fetchTree}
              onCreate={createFile}
              onRename={renameFile}
              onDelete={deleteFile}
            />
          </Card>
        </aside>
        <main className="editor-panel">
          <Card title={currentPath || 'Editor'} bordered={false}>
            <MarkdownEditor
              content={content}
              readOnly={workspace.readOnly}
              disabled={false}
              currentPath={currentPath}
              onChange={setContent}
              onSave={handleManualSave}
            />
          </Card>
        </main>
        <aside className="preview-panel">
          <Card title="Preview" bordered={false}>
            <MarkdownPreview content={content} />
          </Card>
        </aside>
      </div>
      <StatusBar status={fileStatus} workspace={workspace} />
    </div>
  );
}

export default App;
