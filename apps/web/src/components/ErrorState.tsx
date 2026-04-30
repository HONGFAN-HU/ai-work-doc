import { Card, Button } from 'tdesign-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <Card>
        <h2>Connection Error</h2>
        <p>{message}</p>
        <Button theme="primary" onClick={onRetry} style={{ marginTop: 16 }}>
          Retry
        </Button>
      </Card>
    </div>
  );
}
