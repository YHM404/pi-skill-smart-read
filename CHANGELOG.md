# Changelog

All notable changes to this project will be documented in this file.

## [0.1.4] - 2026-04-01

### Fixed
- Hardened `skill_read` section selection so copied headings and index rows no longer easily break `sectionId` resolution.
- Added recovery for common malformed `sectionId` inputs such as plain titles, legacy index rows, structured index rows, and tool-style labels like `sectionId="1.1"`.
- Improved `skill_read` error messages to explicitly recommend numeric section ids.

### Changed
- Reformatted section index output to the clearer shape `id=... | title=... | lines=...` to reduce model confusion.
- Extended prompt guidance to tell the agent to pass only numeric section ids whenever possible.
- Added automated tests covering section reference recovery and duplicate-title safety.
- Bumped package version to `0.1.4`.
