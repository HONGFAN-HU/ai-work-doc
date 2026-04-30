import { Tag } from 'tdesign-react';
import type { WorkspaceConfig } from '@ai-work-doc/shared';

interface StatusBarProps {
  status: string;
  workspace: WorkspaceConfig | null;
}

export function StatusBar({ status, workspace }: StatusBarProps) {
  return (
    <div className="status-bar">
      <span className="status-text">{status}</span>
      {workspace?.readOnly && (
        <Tag theme="warning" variant="light" size="small" style={{ marginLeft: 8 }}>
          Read Only
        </Tag>
      )}
      {workspace?.rootPath && (
        <span style={{ marginLeft: 12, color: '#999' }}>
          Root: {workspace.rootPath}
        </span>
      )}
      {workspace?.autoSave && (
        <span style={{ marginLeft: 12, color: '#999' }}>
          Auto-save: On
        </span>
      )}
    </div>
  );
}
