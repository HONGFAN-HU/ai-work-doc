import { useCallback, useEffect, useRef, useState } from 'react';

export function useFileContent() {
  const [currentPath, setCurrentPath] = useState('');
  const [content, setContent] = useState('# Welcome\n\nSelect a markdown file from the left panel.');
  const [fileStatus, setFileStatus] = useState('Idle');
  const savedContentRef = useRef(content);
  const dirtyRef = useRef(false);

  const isDirty = () => dirtyRef.current;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const markClean = useCallback(() => {
    savedContentRef.current = content;
    dirtyRef.current = false;
  }, [content]);

  const openFile = useCallback(async (filePath: string) => {
    const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
    const json = await res.json();
    if (json.data) {
      setCurrentPath(filePath);
      setContent(json.data.content || '');
      savedContentRef.current = json.data.content || '';
      dirtyRef.current = false;
      setFileStatus(`Opened ${filePath}`);

      void fetch('/api/recent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
    } else {
      setFileStatus(`Error: ${json.message}`);
    }
  }, []);

  const saveFile = useCallback(async (filePath?: string, fileContent?: string) => {
    const p = filePath || currentPath;
    const c = fileContent ?? content;
    if (!p) return false;
    setFileStatus('Saving...');
    const res = await fetch('/api/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: p, content: c }),
    });
    const json = await res.json();
    if (json.data?.saved) {
      savedContentRef.current = c;
      dirtyRef.current = false;
      setFileStatus('Saved');
      return true;
    }
    setFileStatus('Save failed');
    return false;
  }, [currentPath, content]);

  const setContentAndDirty = useCallback((value: string) => {
    setContent(value);
    if (value !== savedContentRef.current) {
      dirtyRef.current = true;
    } else {
      dirtyRef.current = false;
    }
  }, []);

  const createFile = useCallback(async (filePath: string) => {
    const res = await fetch('/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content: '' }),
    });
    return (await res.json()).data != null;
  }, []);

  const renameFile = useCallback(async (fromPath: string, toPath: string) => {
    const res = await fetch('/api/file/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPath, toPath }),
    });
    const json = await res.json();
    if (json.data?.renamed && currentPath === fromPath) {
      setCurrentPath(toPath);
    }
    return json.data?.renamed === true;
  }, [currentPath]);

  const deleteFile = useCallback(async (filePath: string) => {
    const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (json.data?.deleted && currentPath === filePath) {
      setCurrentPath('');
      setContent('# Welcome\n\nSelect a markdown file from the left panel.');
      savedContentRef.current = '# Welcome\n\nSelect a markdown file from the left panel.';
      dirtyRef.current = false;
    }
    return json.data?.deleted === true;
  }, [currentPath]);

  return {
    currentPath, content, fileStatus, isDirty,
    setContent: setContentAndDirty, setFileStatus,
    openFile, saveFile, createFile, renameFile, deleteFile, markClean,
  };
}
