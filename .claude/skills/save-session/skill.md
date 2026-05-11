---
name: save-session
description: Summarize the current conversation and save it to the ai-work-doc workspace
---

# Save Session Summary

Summarize the current conversation's core content and save it to the ai-work-doc workspace.

## Steps

1. **Review** the conversation — identify all topics discussed, decisions made, and changes implemented.
2. **Write a summary** covering each topic with a clear heading, the problem/solution, and file changes.
3. **Save to workspace** using the MCP `create_file` tool at path `sessions/session-YYYY-MM-DD--主题摘要.md` (use today's date and a short slug describing the main topic).
4. Call `refresh_index` to update INDEX.md.

## Guidelines

- Focus on **what was done and why**, not step-by-step narration.
- Include file paths and line numbers for code changes.
- If no code was written, summarize the discussion and decisions.
- Keep it concise — one file per session, grouped by topic.
- Use Chinese if the conversation was primarily in Chinese.
