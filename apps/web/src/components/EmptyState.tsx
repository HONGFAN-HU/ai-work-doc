import { Card, Input, Button } from 'tdesign-react';
import { useState } from 'react';

interface EmptyStateProps {
  onConfigure: (rootPath: string) => void;
}

export function EmptyState({ onConfigure }: EmptyStateProps) {
  const [path, setPath] = useState('');

  return (
    <div className="empty-state">
      <Card>
        <h2>Welcome to Decen</h2>
        <p>Set your workspace root directory to browse and edit local Markdown files.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, maxWidth: 480 }}>
          <Input
            value={path}
            onChange={(v) => setPath(v)}
            placeholder="C:/docs/project-a"
            style={{ flex: 1 }}
          />
          <Button theme="primary" onClick={() => onConfigure(path)} disabled={!path}>
            Configure
          </Button>
        </div>
      </Card>
    </div>
  );
}
