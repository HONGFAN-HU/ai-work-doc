export type WorkspaceConfig = {
  rootPath: string;
  port: number;
  autoSave: boolean;
  readOnly: boolean;
  recentFiles: string[];
  theme: 'light' | 'dark' | 'system';
};

export type FileNode = {
  name: string;
  path: string;
  absolutePath: string;
  type: 'file' | 'directory';
  ext?: string;
  lastModified?: number;
  children: FileNode[];
};
