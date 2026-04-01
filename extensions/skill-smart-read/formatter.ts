import { basename } from "node:path";
import { flattenSections, resolveSectionReference, sliceLines } from "./parser.ts";
import type { ParsedSkillDocument, SectionNode } from "./types.ts";

function formatSectionTree(nodes: SectionNode[], maxDepth = 6, indent = 0): string[] {
  const lines: string[] = [];
  for (const node of nodes) {
    if (node.level > maxDepth) continue;
    const prefix = "  ".repeat(indent);
    lines.push(`${prefix}- id=${node.id} | title=${node.title} | lines=${node.line}-${node.subtreeEndLine}`);
    lines.push(...formatSectionTree(node.children, maxDepth, indent + 1));
  }
  return lines;
}

function formatFrontmatter(doc: ParsedSkillDocument): string[] {
  const entries = Object.entries(doc.frontmatter);
  if (entries.length === 0) return ["- (none)"];
  return entries.map(([key, value]) => `- ${key}: ${value}`);
}

export function formatIndex(doc: ParsedSkillDocument, maxDepth = 4, includeFrontmatter = true): string {
  const lines = [
    `Skill index: ${doc.frontmatter.name || basename(doc.path)}`,
    `Path: ${doc.path}`,
    `Size: ${doc.lineCount} lines, ${doc.byteCount} bytes`,
    "",
  ];

  if (includeFrontmatter) {
    lines.push("Frontmatter");
    lines.push(...formatFrontmatter(doc));
    lines.push("");
  }

  if (doc.sections.length === 0) {
    lines.push("Sections");
    lines.push("- No markdown headings found. Use mode=section only after adding headings, or fall back to read for this file.");
    return lines.join("\n");
  }

  lines.push("Sections");
  lines.push(...formatSectionTree(doc.sections, maxDepth));
  lines.push("");
  lines.push("Tips");
  lines.push('- Prefer passing only the numeric section id, for example: {"mode":"section","sectionId":"1.2"}');
  lines.push('- mode="section" loads one section body; mode="subtree" loads a section plus child sections');
  lines.push('- If you accidentally copy a whole index line or heading title into sectionId, skill_read will try to recover automatically');
  return lines.join("\n");
}

export function formatFullDocument(doc: ParsedSkillDocument): string {
  return [
    `Skill document: ${doc.path}`,
    `Size: ${doc.lineCount} lines, ${doc.byteCount} bytes`,
    "",
    doc.raw.trimEnd(),
  ].join("\n");
}

export function formatSection(doc: ParsedSkillDocument, sectionId: string, subtree: boolean): string {
  const section = resolveSectionReference(doc.sections, sectionId);
  if (!section) {
    const known = flattenSections(doc.sections).map((node) => `${node.id} (${node.title})`).join(", ");
    throw new Error(
      `Unknown sectionId \"${sectionId}\". Pass the numeric id like \"1\" or \"2.3\". Available sections: ${known || "(none)"}`,
    );
  }

  const startLine = subtree ? section.line : section.bodyStartLine;
  const endLine = subtree ? section.subtreeEndLine : section.bodyEndLine;
  const content = sliceLines(doc.raw, startLine, endLine);

  return [
    `Skill ${subtree ? "subtree" : "section"}: ${section.id} ${section.title}`,
    `Path: ${doc.path}`,
    `Lines: ${startLine}-${endLine}`,
    "",
    content || "(empty section body)",
  ].join("\n");
}
