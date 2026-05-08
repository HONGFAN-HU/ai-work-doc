import { useMemo, useCallback } from 'react';
import { Anchor } from 'tdesign-react';

interface OutlineItem {
  id: string;
  text: string;
  level: number;
  children: OutlineItem[];
}

interface OutlinePanelProps {
  content: string;
}

function buildTree(headings: OutlineItem[]): OutlineItem[] {
  const root: OutlineItem[] = [];
  const stack: { level: number; children: OutlineItem[] }[] = [
    { level: 0, children: root },
  ];

  for (const h of headings) {
    const node: OutlineItem = { ...h, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node);
    } else {
      root.push(node);
    }

    stack.push({ level: h.level, children: node.children });
  }

  return root;
}

function renderAnchorItems(items: OutlineItem[]): React.ReactNode {
  return items.map((item) => (
    <Anchor.AnchorItem key={item.id} href={`#${item.id}`} title={item.text}>
      {item.children.length > 0 && renderAnchorItems(item.children)}
    </Anchor.AnchorItem>
  ));
}

function makeId(text: string): string {
  const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  return /^\d/.test(id) ? `h-${id}` : id;
}

function parseHeadings(content: string): OutlineItem[] {
  if (!content || typeof content !== 'string') return [];
  const headingRegex = /^(#{1,6})\s+(.+)$/;
  const result: OutlineItem[] = [];
  let inCodeBlock = false;

  for (const line of content.split('\n')) {
    const trimmed = line.trimEnd();

    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    const match = headingRegex.exec(line);
    if (match) {
      const level = match[1].length;
      if (level > 2) continue;
      const text = match[2].trim();
      const id = makeId(text);
      if (!id) continue;
      result.push({ id, text, level, children: [] });
    }
  }
  return result;
}

export function OutlinePanel({ content }: OutlinePanelProps) {
  const getContainer = useCallback(() => {
    return (document.querySelector('.editor-area') as HTMLElement) || window;
  }, []);

  const tree = useMemo(() => {
    const headings = parseHeadings(content);
    return buildTree(headings);
  }, [content]);

  if (tree.length === 0) {
    return (
      <div className="outline-panel">
        <div className="outline-empty">No headings found</div>
      </div>
    );
  }

  return (
    <div className="outline-panel">
      <div className="outline-content">
        <Anchor
          size="large"
          container={getContainer}
          targetOffset={16}
          bounds={80}
          onClick={({ e }) => e.preventDefault()}
        >
          {renderAnchorItems(tree)}
        </Anchor>
      </div>
    </div>
  );
}
