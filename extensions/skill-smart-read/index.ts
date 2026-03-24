import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerSkillReadPrompt } from "./prompt.ts";
import { registerSkillReadTool } from "./tool-skill-read.ts";

export default function (pi: ExtensionAPI) {
  registerSkillReadTool(pi);
  registerSkillReadPrompt(pi);
}
