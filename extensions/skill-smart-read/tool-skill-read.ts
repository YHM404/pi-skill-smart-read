import { readFile } from "node:fs/promises";
import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { resolveSkillContext } from "./detect.ts";
import { formatFullDocument, formatIndex, formatSection } from "./formatter.ts";
import { parseSkillDocument } from "./parser.ts";
import type { SkillReadMode } from "./types.ts";

const AUTO_FULLTEXT_MAX_BYTES = 12 * 1024;
const AUTO_FULLTEXT_MAX_LINES = 150;
const VALID_MODES = new Set<SkillReadMode>(["auto", "index", "section", "subtree"]);

function shouldReturnFullDocument(raw: string, headingCount: number): boolean {
  const lineCount = raw.split("\n").length;
  const byteCount = Buffer.byteLength(raw, "utf-8");
  return byteCount <= AUTO_FULLTEXT_MAX_BYTES && lineCount <= AUTO_FULLTEXT_MAX_LINES && headingCount <= 12;
}

export function registerSkillReadTool(pi: ExtensionAPI) {
  pi.registerTool({
    name: "skill_read",
    label: "skill_read",
    description:
      "Read SKILL.md files and skill-related markdown efficiently. The tool can return the full document, a section index, or a requested section/subtree.",
    promptSnippet: "Read SKILL.md files and skill-related markdown through a skill-aware reader",
    promptGuidelines: [
      "Use skill_read instead of read when loading skills or skill-related markdown documents.",
      "Use skill_read mode=\"auto\" by default and let the tool choose between full text and indexed section access.",
    ],
    parameters: Type.Object({
      path: Type.String({ description: "Path to SKILL.md or a markdown document inside a skill directory" }),
      mode: Type.Optional(Type.String({ description: 'One of: auto, index, section, subtree. Default: auto' })),
      sectionId: Type.Optional(Type.String({ description: 'Required for mode="section" and mode="subtree"' })),
      maxDepth: Type.Optional(Type.Number({ description: 'Maximum heading depth to show in index mode. Default: 4' })),
      includeFrontmatter: Type.Optional(Type.Boolean({ description: 'Include frontmatter in index mode. Default: true' })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const mode = (params.mode ?? "auto") as SkillReadMode;
      if (!VALID_MODES.has(mode)) {
        throw new Error(`Invalid mode \"${params.mode}\". Expected one of: auto, index, section, subtree`);
      }

      const skillContext = resolveSkillContext(ctx.cwd, params.path);
      if (!skillContext.isMarkdown) {
        throw new Error(`skill_read only supports markdown files. Got: ${skillContext.absolutePath}`);
      }

      const raw = await readFile(skillContext.absolutePath, "utf-8");
      const doc = parseSkillDocument(skillContext.absolutePath, raw);
      const headingCount = doc.sections.length;

      let text: string;
      let resolvedMode: SkillReadMode = mode;

      if (mode === "auto") {
        resolvedMode = shouldReturnFullDocument(raw, headingCount) ? "section" : "index";
        if (resolvedMode === "index") {
          text = formatIndex(doc, params.maxDepth ?? 4, params.includeFrontmatter ?? true);
        } else {
          text = formatFullDocument(doc);
        }
      } else if (mode === "index") {
        text = formatIndex(doc, params.maxDepth ?? 4, params.includeFrontmatter ?? true);
      } else if (mode === "section") {
        if (!params.sectionId) {
          throw new Error('sectionId is required for mode="section"');
        }
        text = formatSection(doc, params.sectionId, false);
      } else {
        if (!params.sectionId) {
          throw new Error('sectionId is required for mode="subtree"');
        }
        text = formatSection(doc, params.sectionId, true);
      }

      return {
        content: [
          {
            type: "text",
            text,
          },
        ],
        details: {
          mode: resolvedMode,
          path: skillContext.absolutePath,
          isSkillDocument: skillContext.isSkillDocument,
          skillRoot: skillContext.skillRoot,
          skillFile: skillContext.skillFile,
          lineCount: doc.lineCount,
          byteCount: doc.byteCount,
        },
      };
    },
  });
}
