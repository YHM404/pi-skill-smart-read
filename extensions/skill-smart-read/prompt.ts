import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const PROMPT_APPENDIX = [
  "When loading skills from <available_skills>, use the skill_read tool instead of read.",
  'Use skill_read mode="auto" by default. The tool decides whether to return the full document, a section index, or a narrower section-loading flow.',
  'If you already know the target section, call skill_read with mode="section" or mode="subtree" directly.',
  "Use plain read for ordinary project files that are not part of skill loading.",
].join("\n");

export function registerSkillReadPrompt(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => ({
    systemPrompt: `${event.systemPrompt}\n\n${PROMPT_APPENDIX}`,
  }));
}
