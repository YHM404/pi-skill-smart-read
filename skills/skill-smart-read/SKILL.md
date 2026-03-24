---
name: skill-smart-read
description: Use when loading large SKILL.md files or skill-related markdown documents. Inspect the section tree first, then read only relevant sections to save tokens.
---

# Skill Smart Read

Use the `skill_read` tool for large or structured skill documents.

Recommended flow:
1. Call `skill_read` with index mode first
2. Pick the most relevant section
3. Load only that section or subtree
