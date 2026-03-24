import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const PROMPT_APPENDIX = [
  "When loading skills from <available_skills>, prefer the skill_read tool over read for large or structured SKILL.md files.",
  'Use skill_read mode="index" first when the skill may be large, then load only the relevant section with mode="section" or mode="subtree".',
  "Use plain read for ordinary project files when structure-aware skill loading is not needed.",
].join("\n");

export function registerSkillReadPrompt(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => ({
    systemPrompt: `${event.systemPrompt}\n\n${PROMPT_APPENDIX}`,
  }));
}
