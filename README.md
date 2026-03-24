# pi-skill-smart-read

A pi package for token-efficient skill loading.

## Goal

For large `SKILL.md` files, return a section index first and load only relevant sections on demand instead of sending the whole file through the default `read` flow.

## Planned package layout

- `extensions/skill-smart-read/`
  - tool registration
  - prompt injection
  - skill detection
  - markdown section parsing
- `skills/skill-smart-read/SKILL.md`
  - teaches the model when to use `skill_read`

## Status

Initial repository scaffold.
