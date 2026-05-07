import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
}

function safeId(text: string): string {
  const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  return /^\d/.test(id) ? `h-${id}` : id;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

function makeHeading(level: number) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return ({ children, ...props }: { children?: React.ReactNode }) => (
    <Tag {...props} id={safeId(extractText(children))}>{children}</Tag>
  );
}

const components: Components = {
  h1: makeHeading(1),
  h2: makeHeading(2),
  h3: makeHeading(3),
  h4: makeHeading(4),
  h5: makeHeading(5),
  h6: makeHeading(6),
};

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="markdown-preview">
      <div className="markdown-preview-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
