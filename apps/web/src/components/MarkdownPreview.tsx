import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
}

function headingId(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

const components: Components = {
  h1: ({ children, ...props }) => {
    const text = String(children);
    return <h1 id={headingId(text)} {...props}>{children}</h1>;
  },
  h2: ({ children, ...props }) => {
    const text = String(children);
    return <h2 id={headingId(text)} {...props}>{children}</h2>;
  },
  h3: ({ children, ...props }) => {
    const text = String(children);
    return <h3 id={headingId(text)} {...props}>{children}</h3>;
  },
  h4: ({ children, ...props }) => {
    const text = String(children);
    return <h4 id={headingId(text)} {...props}>{children}</h4>;
  },
  h5: ({ children, ...props }) => {
    const text = String(children);
    return <h5 id={headingId(text)} {...props}>{children}</h5>;
  },
  h6: ({ children, ...props }) => {
    const text = String(children);
    return <h6 id={headingId(text)} {...props}>{children}</h6>;
  },
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
