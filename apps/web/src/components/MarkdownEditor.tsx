import { useCallback } from 'react';

interface MarkdownEditorProps {
  content: string;
  readOnly: boolean;
  disabled: boolean;
  currentPath: string;
  onChange: (value: string) => void;
  onSave: () => Promise<boolean>;
}

export function MarkdownEditor({
  content, readOnly, disabled, currentPath, onChange, onSave,
}: MarkdownEditorProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      void onSave();
    }
  }, [onSave]);

  return (
    <textarea
      className="editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={currentPath ? 'Markdown content' : 'Open a file to edit'}
      disabled={readOnly || disabled}
      readOnly={readOnly}
    />
  );
}
