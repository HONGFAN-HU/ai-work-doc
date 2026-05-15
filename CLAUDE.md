# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A local-first Markdown document workspace with a web UI, HTTP API, and MCP server — built as an npm monorepo.

## Commands

```bash
npm install               # Install all dependencies
npm run dev               # Run server (port 3001) + web (port 3000) in parallel
npm run build             # Build all packages
npm run start             # Start production server
npm run lint              # ESLint across all packages
npm run typecheck         # tsc --noEmit across all packages
```

Individual workspace scripts:
```bash
npm --workspace=@ai-work-doc/server run dev     # Run server in watch mode
npm --workspace=@ai-work-doc/server run mcp     # Run MCP server (stdio transport)
npm --workspace=@ai-work-doc/web run dev        # Run Vite dev server only
```

## Architecture

```
apps/server/     Fastify HTTP server (port 3001) — local file CRUD API + MCP server
apps/web/        React + Vite + TDesign React (port 3000) — SPA editor with
                 Vite proxy forwarding /api/* to :3001
packages/shared/ Shared TypeScript types (WorkspaceConfig, FileNode) and constants
```

The web app is a three-panel layout: file tree (left), raw markdown editor (center), rendered preview (right). The API follows a uniform `{ code, message, data, requestId }` response envelope.

## Key Implementation Details

- **Workspace config** is persisted to `~/.ai-workdoc/config.json` (overridable via `CONFIG_PATH` env var). `readConfig()` and `writeConfig()` in `apps/server/src/config/workspace.ts` manage this.
- **Path traversal protection**: `normalizeWorkspacePath()` in `apps/server/src/utils/paths.ts` resolves the target path and rejects any path that escapes the configured `rootPath`.
- **File tree**: `apps/server/src/services/treeService.ts` recursively reads directories, filtering to `.md`/`.markdown` files only. The tree is sorted by `localeCompare` by name.
- **API spec** is documented in `docs/openapi.yaml`. Server runs on `127.0.0.1` by default.
- **No test infrastructure** is configured — there are no test scripts or test files.

### MCP Server (`apps/server/src/mcp.ts`)

A separate stdio-based MCP server that exposes the workspace file operations as tools for AI agents. Tools: `list_files`, `read_file`, `create_file`, `update_file`, `delete_file`, `rename_file`, `search_files`, `get_workspace`, `update_workspace`, `refresh_index`. Uses `@modelcontextprotocol/sdk` and `zod/v4` for input validation. Configured in `.mcp.json` at the repo root.

### SSE & File Watching

- `/api/events` is an SSE endpoint (`apps/server/src/routes/eventsRoutes.ts`) that streams real-time file change events to the web frontend.
- `apps/server/src/services/sseManager.ts` maintains a `Set<FastifyReply>` of connected clients and broadcasts via `sseBroadcast()`.
- `apps/server/src/services/fileWatcher.ts` uses `fs.watch()` with recursive subdirectory watching for `.md` files.
- `apps/server/src/services/fileWatchManager.ts` ties them together: when the workspace rootPath changes, it restarts the watcher and pipes events to SSE.

### Server Startup (`apps/server/src/index.ts`)

On startup, `ensureIndexOnStartup()` checks if `INDEX.md` exists in the workspace; if not, generates it. Then `app.listen()` starts the server. After listening, `restartFileWatcher()` begins file monitoring. All run in `Promise.all`.

### Project Init (`apps/server/src/services/projectInit.ts`)

`initProject()` creates a workspace by writing `settings.json` and `INDEX.md` into the root directory. `refreshIndex()` regenerates `INDEX.md` by scanning the full file tree and writing a Markdown index of all files. Called on startup, workspace config changes, and via the `/api/index/refresh` endpoint.

### Web App (`apps/web`)

- **`App.tsx`** manages three views: `doclib` (file browser with preview), `editor` (markdown viewer + outline), and `settings`. It orchestrates state through four custom hooks.
- **Hooks**: `useWorkspace` (fetch/save config), `useFileTree` (file listing), `useFileContent` (CRUD + current file state), `useAutoSave` (debounced save on content change).
- **Components**: `Sidebar` (nav + file tree), `DocLibrary` (grid-based file browser), `DocPreviewPanel` (split-pane file preview), `MarkdownPreview` (react-markdown + remark-gfm + rehype-highlight), `OutlinePanel` (heading-based TOC), `SettingsPanel`, `WelcomeState`, `ErrorBoundary`, `ErrorState`, `StatusBar`, `RecentFiles`.
- **UI library**: TDesign React (`tdesign-react`, `tdesign-icons-react`).
- **Vite config**: port 3000, proxies `/api` to `http://127.0.0.1:3001`.