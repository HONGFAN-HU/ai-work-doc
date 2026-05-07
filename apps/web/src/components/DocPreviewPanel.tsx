import { FullscreenIcon, CloseIcon } from 'tdesign-icons-react';
import { MarkdownPreview } from './MarkdownPreview';

interface DocPreviewPanelProps {
  content: string;
  fileName: string;
  onClose: () => void;
  onFullscreen: () => void;
}

export function DocPreviewPanel({ content, fileName, onClose, onFullscreen }: DocPreviewPanelProps) {
  return (
    <div className="doc-preview-panel">
      <div className="doc-preview-header">
        <span className="doc-preview-title">{fileName}</span>
        <div className="doc-preview-actions">
          <button className="doc-preview-btn" onClick={onFullscreen} title="Fullscreen">
            <FullscreenIcon size="14px" />
          </button>
          <button className="doc-preview-btn" onClick={onClose} title="Close">
            <CloseIcon size="14px" />
          </button>
        </div>
      </div>
      <div className="doc-preview-body">
        <MarkdownPreview content={content} />
      </div>
    </div>
  );
}
