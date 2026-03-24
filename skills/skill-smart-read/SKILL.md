---
name: skill-smart-read
description: Use when loading large SKILL.md files or skill-related markdown documents. Inspect the section tree first, then read only relevant sections to save tokens.
---

# Skill Smart Read

Use the `skill_read` tool for large or structured skill documents.

## Recommended Flow

1. Call `skill_read` with `mode="index"` first
2. Inspect the section tree
3. Pick the most relevant `sectionId`
4. Load only that section with `mode="section"`
5. If a full topic block is needed, use `mode="subtree"`

## Notes

- `auto` returns the full document for small markdown files
- `auto` returns an index first for larger or more structured files
- Prefer `skill_read` over plain `read` when the file is a large `SKILL.md`
