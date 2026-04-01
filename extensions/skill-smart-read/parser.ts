import type { FrontmatterData, ParsedSkillDocument, SectionNode } from "./types.ts";

interface ParsedFrontmatter {
  frontmatter: FrontmatterData;
  body: string;
  bodyStartLine: number;
}

function parseFrontmatter(raw: string): ParsedFrontmatter {
  if (!raw.startsWith("---\n") && raw !== "---") {
    return { frontmatter: {}, body: raw, bodyStartLine: 1 };
  }

  const lines = raw.split("\n");
  if (lines[0].trim() !== "---") {
    return { frontmatter: {}, body: raw, bodyStartLine: 1 };
  }

  let closingIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    return { frontmatter: {}, body: raw, bodyStartLine: 1 };
  }

  const frontmatter: FrontmatterData = {};
  for (const line of lines.slice(1, closingIndex)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    frontmatter[key] = value.trim().replace(/^"|"$/g, "");
  }

  return {
    frontmatter,
    body: lines.slice(closingIndex + 1).join("\n"),
    bodyStartLine: closingIndex + 2,
  };
}

export function parseSkillDocument(path: string, raw: string): ParsedSkillDocument {
  const { frontmatter, body, bodyStartLine } = parseFrontmatter(raw);
  const bodyLines = body.split("\n");
  const roots: SectionNode[] = [];
  const stack: SectionNode[] = [];
  const counters = [0, 0, 0, 0, 0, 0];

  let inFence = false;
  for (let i = 0; i < bodyLines.length; i += 1) {
    const line = bodyLines[i];
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const [, hashes, rawTitle] = match;
    const level = hashes.length;
    counters[level - 1] += 1;
    for (let j = level; j < counters.length; j += 1) counters[j] = 0;
    const id = counters.slice(0, level).filter(Boolean).join(".");

    const node: SectionNode = {
      id,
      level,
      title: rawTitle.trim(),
      line: bodyStartLine + i,
      bodyStartLine: bodyStartLine + i + 1,
      bodyEndLine: bodyLines.length + bodyStartLine - 1,
      subtreeEndLine: bodyLines.length + bodyStartLine - 1,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node);
    } else {
      roots.push(node);
    }
    stack.push(node);
  }

  const flat: SectionNode[] = [];
  const visit = (nodes: SectionNode[]) => {
    for (const node of nodes) {
      flat.push(node);
      visit(node.children);
    }
  };
  visit(roots);

  const lastLine = bodyLines.length + bodyStartLine - 1;
  for (let i = 0; i < flat.length; i += 1) {
    const current = flat[i];
    const nextAny = flat[i + 1];
    current.bodyEndLine = nextAny ? nextAny.line - 1 : lastLine;

    let nextSiblingOrAncestor: SectionNode | undefined;
    for (let j = i + 1; j < flat.length; j += 1) {
      if (flat[j].level <= current.level) {
        nextSiblingOrAncestor = flat[j];
        break;
      }
    }
    current.subtreeEndLine = nextSiblingOrAncestor ? nextSiblingOrAncestor.line - 1 : lastLine;
  }

  return {
    path,
    raw,
    lineCount: raw.split("\n").length,
    byteCount: Buffer.byteLength(raw, "utf-8"),
    frontmatter,
    body,
    bodyStartLine,
    sections: roots,
  };
}

export function flattenSections(nodes: SectionNode[]): SectionNode[] {
  const flat: SectionNode[] = [];
  const visit = (items: SectionNode[]) => {
    for (const item of items) {
      flat.push(item);
      visit(item.children);
    }
  };
  visit(nodes);
  return flat;
}

export function findSectionById(nodes: SectionNode[], sectionId: string): SectionNode | undefined {
  return flattenSections(nodes).find((node) => node.id === sectionId);
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function normalizeTitleReference(input: string): string {
  return normalizeWhitespace(input)
    .replace(/^#+\s*/, "")
    .replace(/^[-*+]\s*/, "")
    .replace(/^skill\s+(?:subtree|section):\s*/i, "")
    .replace(/^section(?:Id)?\s*[:=]\s*/i, "")
    .replace(/^id\s*=\s*[0-9]+(?:\.[0-9]+)*\s*\|\s*title\s*=\s*/i, "")
    .replace(/^title\s*=\s*/i, "")
    .replace(/^([0-9]+(?:\.[0-9]+)*)(?:\s*[-:|]\s*|\s+)/, "")
    .replace(/\s*\|\s*lines\s*=\s*\d+-\d+\s*$/i, "")
    .replace(/\s*\(lines\s+\d+-\d+\)\s*$/i, "")
    .replace(/^['"`]|['"`]$/g, "")
    .trim()
    .toLowerCase();
}

function extractSectionId(reference: string): string | undefined {
  const normalized = normalizeWhitespace(reference);
  const patterns = [
    /^[-*+]\s*id\s*=\s*([0-9]+(?:\.[0-9]+)*)(?:\s|\||$)/i,
    /^id\s*=\s*([0-9]+(?:\.[0-9]+)*)(?:\s|\||$)/i,
    /^section(?:Id)?\s*[:=]\s*["'`]?([0-9]+(?:\.[0-9]+)*)["'`]?(?:\s|$)/i,
    /^skill\s+(?:subtree|section):\s*([0-9]+(?:\.[0-9]+)*)/i,
    /^[-*+]\s*([0-9]+(?:\.[0-9]+)*)(?:\s|$)/,
    /^["'`]?([0-9]+(?:\.[0-9]+)*)["'`]?(?:\s|$)/,
    /\bsection\s+([0-9]+(?:\.[0-9]+)*)\b/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1];
  }

  return undefined;
}

export function resolveSectionReference(nodes: SectionNode[], reference: string): SectionNode | undefined {
  const flat = flattenSections(nodes);
  const trimmed = reference.trim();

  const exactById = flat.find((node) => node.id === trimmed);
  if (exactById) return exactById;

  const extractedId = extractSectionId(trimmed);
  if (extractedId) {
    const byExtractedId = flat.find((node) => node.id === extractedId);
    if (byExtractedId) return byExtractedId;
  }

  const normalizedTitle = normalizeTitleReference(trimmed);
  if (!normalizedTitle) return undefined;

  const titleMatches = flat.filter((node) => normalizeTitleReference(node.title) === normalizedTitle);
  if (titleMatches.length === 1) return titleMatches[0];

  return undefined;
}

export function sliceLines(raw: string, startLine: number, endLine: number): string {
  const lines = raw.split("\n");
  const start = Math.max(0, startLine - 1);
  const end = Math.max(start, endLine);
  return lines.slice(start, end).join("\n").trimEnd();
}
