---
name: organize-files
description: Analyze and organize all files in the ai-work-doc workspace into categorized subdirectories
---

# Organize Workspace Files

Scan all files in the ai-work-doc workspace and reorganize them into categorized subdirectories based on naming patterns and content.

## Classification Rules

| Pattern | Match Type | Target Directory | Examples |
|---------|-----------|-----------------|---------|
| `session-*` | prefix (starts with) | `sessions/` | `session-2026-05-11.md` |
| `*-skill.md`, `*-config.md` | suffix (ends with) | `skills/` | `save-session-skill.md` |
| `*-design.md`, `*-arch.md` | suffix (ends with) | `design/` | `context-persistence-design.md` |
| `project-*`, `*-summary.md`, `changelog*` | prefix or suffix | `notes/` | `project-summary.md` |
| `INDEX.md` | exact match | root (keep) | `INDEX.md` |
| Everything else | — | `notes/` | uncategorized files |

## Steps

1. Use `list_files` to get all files in the workspace.
2. For each file (excluding `INDEX.md`), determine its target directory based on the rules above.
3. Use `rename_file` to move files into their target directories (directories are created automatically).
4. Call `refresh_index` to regenerate INDEX.md.
5. Report a summary: which files were moved where.

## Guidelines

- Only move files that are loose in the root directory. Files already in subdirectories should stay put.
- If a file matches multiple patterns, use the first match.
- Do NOT move `INDEX.md` — it must stay at the root.
- If no files need moving, report that the workspace is already organized.
