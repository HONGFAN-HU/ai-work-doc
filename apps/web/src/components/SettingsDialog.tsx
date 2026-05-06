import { useEffect, useState } from 'react';
import { Dialog, Input, Radio, Switch, Tag } from 'tdesign-react';
import type { WorkspaceConfig } from '@ai-work-doc/shared';

interface SettingsDialogProps {
  workspace: WorkspaceConfig | null;
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<WorkspaceConfig>) => void;
}

export function SettingsDialog({ workspace, visible, onClose, onSave }: SettingsDialogProps) {
  const [rootPath, setRootPath] = useState(workspace?.rootPath || '');
  const [port, setPort] = useState(String(workspace?.port || 3001));
  const [autoSave, setAutoSave] = useState(workspace?.autoSave ?? true);
  const [readOnly, setReadOnly] = useState(workspace?.readOnly ?? false);
  const [theme, setTheme] = useState<string>(workspace?.theme || 'system');

  useEffect(() => {
    if (visible) {
      setRootPath(workspace?.rootPath || '');
      setPort(String(workspace?.port || 3001));
      setAutoSave(workspace?.autoSave ?? true);
      setReadOnly(workspace?.readOnly ?? false);
      setTheme(workspace?.theme || 'system');
    }
  }, [visible, workspace]);

  const handleSave = () => {
    onSave({ rootPath, port: Number(port) || 3001, autoSave, readOnly, theme: theme as 'light' | 'dark' | 'system' });
  };

  return (
    <Dialog
      header="Settings"
      visible={visible}
      onClose={onClose}
      onConfirm={handleSave}
      confirmBtn="Save"
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Tag size="small" style={{ marginBottom: 4 }}>Root Path</Tag>
          <Input
            value={rootPath}
            onChange={(v) => setRootPath(v)}
            placeholder="C:/docs/project-a"
          />
        </div>
        <div>
          <Tag size="small" style={{ marginBottom: 4 }}>Port (requires restart)</Tag>
          <Input
            value={port}
            onChange={(v) => setPort(v)}
            placeholder="3001"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Auto Save</span>
          <Switch value={autoSave} onChange={(v) => setAutoSave(v)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Read Only Mode</span>
          <Switch value={readOnly} onChange={(v) => setReadOnly(v)} />
        </div>
        <div>
          <Tag size="small" style={{ marginBottom: 4 }}>Theme</Tag>
          <Radio.Group value={theme} onChange={(v) => setTheme(v as string)}>
            <Radio.Button value="light">Light</Radio.Button>
            <Radio.Button value="dark">Dark</Radio.Button>
            <Radio.Button value="system">System</Radio.Button>
          </Radio.Group>
        </div>
      </div>
    </Dialog>
  );
}
