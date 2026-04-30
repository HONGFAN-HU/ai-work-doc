# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A local Markdown document workspace with a web UI and HTTP API, built as an npm monorepo.

## Commands

```bash
npm install               # Install all dependencies
npm run dev               # Run server (port 3001) + web (port 3000) in parallel
npm run build             # Build all packages
npm run start             # Start production server
npm run lint              # ESLint across all packages
npm run typecheck         # tsc --noEmit across all packages
```

## Architecture

```
apps/server/     Fastify HTTP server (port 3001) — local file CRUD API
apps/web/        React + Vite + TDesign React (port 3000) — SPA editor with
                 Vite proxy forwarding /api/* to :3001
packages/shared/ Shared TypeScript types (WorkspaceConfig, FileNode) and constants
```

The web app is a three-panel layout: file tree (left), raw markdown editor (center), rendered preview (right). The API follows a uniform `{ code, message, data, requestId }` response envelope.

## Key Implementation Details

- **Workspace config** is persisted to `~/.ai-workdoc/config.json` (overridable via `CONFIG_PATH` env var). The server's `readConfig()` and `writeConfig()` in `apps/server/src/config/workspace.ts` manage this.
- **Path traversal protection**: `normalizeWorkspacePath()` in `apps/server/src/utils/paths.ts` resolves the target path and rejects any path that escapes the configured `rootPath`.
- **File tree**: `apps/server/src/services/treeService.ts` recursively reads directories, filtering to `.md`/`.markdown` files only. The tree is unsorted beyond a `localeCompare` by name.
- **API spec** is documented in `docs/openapi.yaml`. Server runs on `127.0.0.1` by default.
- **No test infrastructure** is configured yet — there are no test scripts or test files.