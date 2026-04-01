import test from "node:test";
import assert from "node:assert/strict";
import { formatIndex, formatSection } from "../extensions/skill-smart-read/formatter.ts";
import { parseSkillDocument, resolveSectionReference } from "../extensions/skill-smart-read/parser.ts";

const skillDoc = parseSkillDocument(
  "/tmp/SKILL.md",
  [
    "# Root",
    "",
    "Root intro",
    "",
    "## Install",
    "",
    "Install steps",
    "",
    "## Usage",
    "",
    "Usage steps",
    "",
    "### Advanced",
    "",
    "Advanced usage",
    "",
    "## FAQ",
    "",
    "Common questions",
  ].join("\n"),
);

test("formatIndex emits explicit id/title/lines fields", () => {
  const index = formatIndex(skillDoc);
  assert.match(index, /- id=1 \| title=Root \| lines=1-19/);
  assert.match(index, /- id=1\.1 \| title=Install \| lines=5-8/);
  assert.match(index, /Prefer passing only the numeric section id/);
});

test("resolveSectionReference accepts pure numeric ids", () => {
  const section = resolveSectionReference(skillDoc.sections, "1.1");
  assert.equal(section?.id, "1.1");
  assert.equal(section?.title, "Install");
});

test("resolveSectionReference recovers from copied legacy index lines", () => {
  const section = resolveSectionReference(skillDoc.sections, "- 1.1 Install (lines 5-8)");
  assert.equal(section?.id, "1.1");
  assert.equal(section?.title, "Install");
});

test("resolveSectionReference recovers from copied structured index lines", () => {
  const section = resolveSectionReference(skillDoc.sections, "- id=1.1 | title=Install | lines=5-8");
  assert.equal(section?.id, "1.1");
  assert.equal(section?.title, "Install");
});

test("resolveSectionReference recovers from tool-style labels and plain titles", () => {
  assert.equal(resolveSectionReference(skillDoc.sections, 'sectionId="1.1"')?.id, "1.1");
  assert.equal(resolveSectionReference(skillDoc.sections, "Skill section: 1.1 Install")?.id, "1.1");
  assert.equal(resolveSectionReference(skillDoc.sections, "Install")?.id, "1.1");
});

test("formatSection uses recovered references for body and subtree reads", () => {
  const sectionText = formatSection(skillDoc, "- id=1.1 | title=Install | lines=5-8", false);
  assert.match(sectionText, /Skill section: 1\.1 Install/);
  assert.match(sectionText, /Install steps/);
  assert.doesNotMatch(sectionText, /^## Install/m);

  const subtreeText = formatSection(skillDoc, "Usage", true);
  assert.match(subtreeText, /Skill subtree: 1\.2 Usage/);
  assert.match(subtreeText, /^## Usage/m);
  assert.match(subtreeText, /^### Advanced/m);
  assert.match(subtreeText, /Advanced usage/);
});

test("duplicate titles stay unresolved instead of picking the wrong section", () => {
  const duplicateDoc = parseSkillDocument(
    "/tmp/duplicate.md",
    [
      "# Root",
      "",
      "## Repeat",
      "",
      "First body",
      "",
      "## Repeat",
      "",
      "Second body",
    ].join("\n"),
  );

  assert.equal(resolveSectionReference(duplicateDoc.sections, "Repeat"), undefined);
  assert.throws(() => formatSection(duplicateDoc, "Repeat", false), /Unknown sectionId/);
});
