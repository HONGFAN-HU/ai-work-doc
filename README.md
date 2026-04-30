# AI Work Doc

A local-first Markdown document workspace and HTTP API layer. Browse, edit, and preview Markdown files in your browser, with a stable local API for external AI tools.

## Features

- Browse Markdown files (`.md`, `.markdown`) in any local directory
- Three-panel layout: file tree, raw editor, rendered preview
- Create, rename, and delete Markdown files from the UI
- Auto-save with configurable debounce
- Read-only mode for safe browsing
- Recent files tracking
- File name search
- Local HTTP API with unified JSON response format
- OpenAPI specification for AI tool integration

## Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 8+

## Quick Start

```bash
git clone https://github.com/HONGFAN-HU/ai-work-doc.git
cd ai-work-doc
pnpm install
pnpm dev
```

Open `http://127.0.0.1:3000` in your browser.

On first launch, you will be prompted to set a workspace root directory. Enter an absolute path containing Markdown files (e.g., `C:/docs/project-a` on Windows, `/home/user/docs` on Linux/Mac).

## Root Directory Configuration

The workspace root directory determines which folder the app scans for Markdown files. You can configure it:

1. **Via UI**: Enter a path in the welcome screen or Settings dialog
2. **Via config file**: Edit `~/.ai-workdoc/config.json` directly
3. **Via environment variable**: Set `DEFAULT_ROOT_PATH=/path/to/docs`

All file operations are sandboxed within this root directory. Path traversal (e.g., `../`) is blocked.

## API

The server runs at `http://127.0.0.1:3001` by default and exposes these endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/workspace` | Get workspace config |
| POST | `/api/workspace` | Update workspace config |
| GET | `/api/tree` | Get Markdown file tree |
| GET | `/api/file?path=...` | Read a Markdown file |
| POST | `/api/file` | Create a Markdown file |
| PUT | `/api/file` | Save a Markdown file |
| POST | `/api/file/rename` | Rename a Markdown file |
| DELETE | `/api/file?path=...` | Delete a Markdown file |
| GET | `/api/recent` | Get recently opened files |
| POST | `/api/recent` | Add file to recent list |
| GET | `/api/search?q=...` | Search files by name |
| GET | `/api/docs` | OpenAPI specification (YAML) |

All endpoints return a unified JSON envelope: `{ code, message, data, requestId }`.

For the full API specification, see `docs/openapi.yaml` or visit `http://127.0.0.1:3001/api/docs`.

### Error Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 4001 | Path is outside root workspace |
| 4002 | File not found |
| 4003 | Unsupported file type |
| 4004 | Invalid configuration |
| 4005 | Workspace is in read-only mode |
| 5001 | File read failed |
| 5002 | File write failed |
| 5003 | Directory scan failed |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (frontend :3000 + API :3001) |
| `pnpm build` | Build all packages for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |

## Architecture

```
apps/server/     Fastify HTTP server (port 3001) — local file CRUD API
apps/web/        React + Vite + TDesign React (port 3000) — SPA editor
packages/shared/ Shared TypeScript types and constants
docs/            OpenAPI specification and development docs
```

## Troubleshooting

**"Cannot connect to server"**
Ensure the server is running on port 3001. Run `pnpm dev` to start both services.

**"Path is outside root workspace"**
The requested file path escapes the configured root directory. Check that your root path and file paths are correct.

**Port already in use**
Set a custom port via the `PORT` environment variable or in `~/.ai-workdoc/config.json`.

**"No Markdown files found"**
Only `.md` and `.markdown` files are displayed. Verify your root directory contains these file types.

## License

MIT
