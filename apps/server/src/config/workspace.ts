import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { WorkspaceConfig } from '@ai-work-doc/shared';

const configDir = path.join(os.homedir(), '.ai-workdoc');
const configPath = process.env.CONFIG_PATH || path.join(configDir, 'config.json');

const defaultConfig: WorkspaceConfig = {
  rootPath: process.env.DEFAULT_ROOT_PATH || path.join(os.homedir(), '.ai-workdoc', 'default-workspace'),
  port: 3001,
  autoSave: true,
  readOnly: String(process.env.READ_ONLY_MODE || 'false') === 'true',
  recentFiles: [],
  theme: 'system',
};

export async function ensureConfig() {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  try {
    await fs.access(configPath);
  } catch {
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    await fs.mkdir(defaultConfig.rootPath, { recursive: true });
  }
}

export async function readConfig(): Promise<WorkspaceConfig> {
  await ensureConfig();
  const raw = await fs.readFile(configPath, 'utf8');
  const config = { ...defaultConfig, ...JSON.parse(raw) } as WorkspaceConfig;
  if (config.rootPath) {
    await fs.mkdir(config.rootPath, { recursive: true });
  }
  return config;
}

export async function writeConfig(input: Partial<WorkspaceConfig>): Promise<WorkspaceConfig> {
  const current = await readConfig();
  const next = { ...current, ...input };
  await fs.writeFile(configPath, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
