import { basename } from "node:path";
import { findSectionById, flattenSections, sliceLines } from "./parser.ts";
import type { ParsedSkillDocument, SectionNode } from "./types.ts";

function formatSectionTree(nodes: SectionNode[], maxDepth = 6, indent = 0): string[] {
  const lines: string[] = [];
  for (const node of nodes) {
    if (node.level > maxDepth) continue;
    const prefix = "  ".repeat(indent);
    lines.push(`${prefix}- ${node.id} ${node.title} (lines ${node.line}-${node.subtreeEndLine})`);
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
  lines.push('- Use mode="section" with sectionId="..." to load one section body');
  lines.push('- Use mode="subtree" with sectionId="..." to load a section plus child sections');
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
  const section = findSectionById(doc.sections, sectionId);
  if (!section) {
    const known = flattenSections(doc.sections).map((node) => node.id).join(", ");
    throw new Error(`Unknown sectionId \"${sectionId}\". Available section ids: ${known || "(none)"}`);
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
