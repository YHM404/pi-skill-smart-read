import { existsSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import type { SkillContext } from "./types.ts";

function stripAtPrefix(input: string): string {
  return input.startsWith("@") ? input.slice(1) : input;
}

function findSkillRoot(startPath: string): { skillRoot?: string; skillFile?: string } {
  let current = dirname(startPath);
  while (true) {
    const candidate = join(current, "SKILL.md");
    if (existsSync(candidate)) {
      return { skillRoot: current, skillFile: candidate };
    }
    const parent = dirname(current);
    if (parent === current) {
      return {};
    }
    current = parent;
  }
}

export function resolveSkillContext(cwd: string, requestedPath: string): SkillContext {
  const normalizedRequestedPath = stripAtPrefix(requestedPath);
  const absolutePath = resolve(cwd, normalizedRequestedPath);
  const isMarkdown = extname(absolutePath).toLowerCase() === ".md";

  if (absolutePath.endsWith("/SKILL.md") || absolutePath.endsWith("\\SKILL.md")) {
    return {
      requestedPath,
      absolutePath,
      isMarkdown: true,
      isSkillDocument: true,
      skillRoot: dirname(absolutePath),
      skillFile: absolutePath,
    };
  }

  const { skillRoot, skillFile } = findSkillRoot(absolutePath);
  return {
    requestedPath,
    absolutePath,
    isMarkdown,
    isSkillDocument: Boolean(skillRoot && skillFile),
    skillRoot,
    skillFile,
  };
}
