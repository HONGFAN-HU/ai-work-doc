import { useEffect, useState } from 'react';
import { Button, Input, Radio, Switch, Tag } from 'tdesign-react';
import { CheckIcon } from 'tdesign-icons-react';
import type { WorkspaceConfig } from '@ai-work-doc/shared';

interface SettingsPanelProps {
  workspace: WorkspaceConfig | null;
  visible: boolean;
  onSave: (updates: Partial<WorkspaceConfig>) => void;
}

export function SettingsPanel({ workspace, visible, onSave }: SettingsPanelProps) {
  const [rootPath, setRootPath] = useState(workspace?.rootPath || '');
  const [port, setPort] = useState(String(workspace?.port || 3001));
  const [autoSave, setAutoSave] = useState(workspace?.autoSave ?? true);
  const [readOnly, setReadOnly] = useState(workspace?.readOnly ?? false);
  const [theme, setTheme] = useState<string>(workspace?.theme || 'system');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible) {
      setRootPath(workspace?.rootPath || '');
      setPort(String(workspace?.port || 3001));
      setAutoSave(workspace?.autoSave ?? true);
      setReadOnly(workspace?.readOnly ?? false);
      setTheme(workspace?.theme || 'system');
      setSaved(false);
    }
  }, [visible, workspace]);

  const handleSave = () => {
    onSave({ rootPath, port: Number(port) || 3001, autoSave, readOnly, theme: theme as 'light' | 'dark' | 'system' });
    setSaved(true);
  };

  if (!visible) return null;

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <h2 className="settings-panel-title">Settings</h2>
      </div>
      <div className="settings-panel-body">
        <div className="settings-form">
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
          <div className="settings-row">
            <span>Auto Save</span>
            <Switch value={autoSave} onChange={(v) => setAutoSave(v)} />
          </div>
          <div className="settings-row">
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
      </div>
      <div className="settings-panel-footer">
        <Button theme="primary" onClick={handleSave} icon={saved ? <CheckIcon /> : undefined}>
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
