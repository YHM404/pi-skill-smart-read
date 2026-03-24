# pi-skill-smart-read

A pi package for token-efficient skill loading.

## What it does

This package adds a `skill_read` tool for large `SKILL.md` files and skill-related markdown documents.

Instead of dumping the whole file through the default `read` flow, it can:
- return a heading index first
- load one section body
- load one section subtree
- inject guidance telling the model to prefer `skill_read` for large skills

## Current v0.1 behavior

### Tool

`skill_read` supports these modes:
- `auto`
- `index`
- `section`
- `subtree`

`auto` returns:
- full document for small markdown files
- section index for larger/structured files

### Prompt injection

On each turn, the extension appends guidance telling the model:
- prefer `skill_read` over `read` for large or structured `SKILL.md` files
- call `skill_read` with `mode="index"` first
- then load only the relevant section or subtree

## Package layout

- `extensions/skill-smart-read/`
  - tool registration
  - prompt injection
  - skill detection
  - markdown section parsing
- `skills/skill-smart-read/SKILL.md`
  - teaches the model when to use `skill_read`

## Example calls

```json
{ "path": "/path/to/SKILL.md", "mode": "index" }
```

```json
{ "path": "/path/to/SKILL.md", "mode": "section", "sectionId": "2.1" }
```

```json
{ "path": "/path/to/SKILL.md", "mode": "subtree", "sectionId": "3" }
```

## Install locally in pi

```bash
pi install /absolute/path/to/pi-skill-smart-read
```

Or for project-local use:

```bash
pi install -l /absolute/path/to/pi-skill-smart-read
```
