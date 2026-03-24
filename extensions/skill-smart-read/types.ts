export type SkillReadMode = "auto" | "index" | "section" | "subtree";

export interface SkillContext {
  requestedPath: string;
  absolutePath: string;
  isMarkdown: boolean;
  isSkillDocument: boolean;
  skillRoot?: string;
  skillFile?: string;
}

export interface FrontmatterData {
  [key: string]: string;
}

export interface SectionNode {
  id: string;
  level: number;
  title: string;
  line: number;
  bodyStartLine: number;
  bodyEndLine: number;
  subtreeEndLine: number;
  children: SectionNode[];
}

export interface ParsedSkillDocument {
  path: string;
  raw: string;
  lineCount: number;
  byteCount: number;
  frontmatter: FrontmatterData;
  body: string;
  bodyStartLine: number;
  sections: SectionNode[];
}
