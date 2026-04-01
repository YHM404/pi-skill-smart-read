# pi-skill-smart-read

A pi package for token-efficient skill loading.

## What it does

This package adds a `skill_read` tool for `SKILL.md` files and skill-related markdown documents.

Instead of routing skill loading through the default `read` flow, it can:
- return a heading index when needed
- load one section body
- load one section subtree
- inject guidance telling the model to use `skill_read` for skill loading

## Current v0.1 behavior

### Tool

`skill_read` supports a minimal interface:
- `path`
- `mode`
- `sectionId`

`sectionId` should ideally be the numeric section id like `"2"` or `"2.1"`.
The tool now also tolerates copied index lines or plain heading titles and will try to recover the real id automatically.

Modes:
- `auto`
- `index`
- `section`
- `subtree`

`auto` returns:
- full document for small markdown files
- section index for larger or more structured files

Index entries are formatted explicitly as `id=... | title=... | lines=...` to reduce model confusion when selecting sections.

### Prompt injection

On each turn, the extension appends guidance telling the model:
- use `skill_read` instead of `read` when loading skills
- default to `mode="auto"`
- call `section` or `subtree` directly when the target section is already known
- pass only the numeric section id in `sectionId` whenever possible

## Package layout

- `extensions/skill-smart-read/`
  - tool registration
  - prompt injection
  - skill detection
  - markdown section parsing

## Example calls

```json
{ "path": "/path/to/SKILL.md", "mode": "auto" }
```

```json
{ "path": "/path/to/SKILL.md", "mode": "index" }
```

```json
{ "path": "/path/to/SKILL.md", "mode": "section", "sectionId": "2.1" }
```

```json
{ "path": "/path/to/SKILL.md", "mode": "subtree", "sectionId": "3" }
```

## Install in pi

### From GitHub

```bash
pi install git:github.com/YHM404/pi-skill-smart-read
```

Or with the raw GitHub URL:

```bash
pi install https://github.com/YHM404/pi-skill-smart-read
```

### From npm

```bash
pi install npm:pi-skill-smart-read
```

### Project-local install

```bash
pi install -l git:github.com/YHM404/pi-skill-smart-read
```

### Local development install

```bash
pi install /absolute/path/to/pi-skill-smart-read
```
