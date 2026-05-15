---
name: save-session
description: Summarize the current conversation and save it to the ai-work-doc workspace
---

# Save Session Summary

Summarize the current conversation as a reusable knowledge artifact and save to the ai-work-doc workspace.

## Purpose

A session record balances two goals:
1. **Experience accumulation** — someone reading it later understands the problem and solution without re-reading the code
2. **Change traceability** — key additions (new endpoints, new functions, new components, config changes) are captured concretely

## Steps

1. **Review** the conversation — identify all topics, problems solved, decisions made, and patterns discovered.
2. **Write a summary** following the format below.
3. **Save** using MCP `create_file` at `sessions/session-YYYY-MM-DD--主题摘要.md`.
4. Call `refresh_index`.

## Format

```markdown
# Session YYYY-MM-DD — 主题

## 背景
（什么场景、什么需求触发了这次工作）

## 方案与实现
（核心设计思路和数据流——足够让后来者理解架构层面的做法）

## 关键变更
- 新增 `POST /api/xxx` 端点，接收...返回...
- 新增 `XxxService.ts`，核心函数 `doXxx()` 负责...
- `YyyComponent` 新增 `onRefresh` prop，用于...
- `config.ts` 增加了 `zzz` 配置项

## 涉及文件
- file-a.ts（新增）
- file-b.tsx（修改）

## 决策与经验
- 为什么选这个方案而不是其他方案
- 踩到的坑、发现的约定、可复用的模式
```

## Rules

- **No line numbers**, no step-by-step narration.
- **关键变更** 列出新增/修改的接口、函数、组件、配置——每项一句话说清它做什么。不是全部 diff，而是结构性变更。
- Each topic should be **self-contained** — readable without the original conversation.
- Don't list every file path exhaustively — only the ones central to the change.
- If the session covered multiple unrelated topics, give each its own `## 背景` + `## 方案与实现` + `## 关键变更` block.
- Use Chinese if the conversation was in Chinese.
- Target length: 30-50 lines per topic.