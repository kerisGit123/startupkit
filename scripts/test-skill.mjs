/**
 * Quick smoke test for Anthropic beta skills invocation.
 * Run: node scripts/test-skill.mjs
 * Needs ANTHROPIC_API_KEY and SKILL_VIDEO_PROMPT_BUILDER_ID in env (or .env.local).
 */
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (no dotenv needed in mjs)
try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
} catch {}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SKILL_ID = process.env.SKILL_VIDEO_PROMPT_BUILDER_ID;

if (!ANTHROPIC_API_KEY) { console.error("❌ ANTHROPIC_API_KEY not set"); process.exit(1); }
if (!SKILL_ID)          { console.error("❌ SKILL_VIDEO_PROMPT_BUILDER_ID not set"); process.exit(1); }

console.log(`\n🎬 Testing skill: ${SKILL_ID}`);
console.log("Prompt: 'a koi fish and tabby cat friendship story, 60 seconds, 4 scenes'\n");

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "code-execution-2025-08-25,skills-2025-10-02",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    container: {
      skills: [{ type: "custom", skill_id: SKILL_ID, version: "latest" }],
    },
    tools: [{ type: "code_execution_20250825", name: "code_execution" }],
    messages: [{ role: "user", content: "a koi fish and tabby cat friendship story, 60 seconds, 4 scenes" }],
  }),
});

const data = await res.json();

if (!res.ok) {
  console.error("❌ API error:", res.status, JSON.stringify(data, null, 2));
  process.exit(1);
}

// Extract script the same way invoke_skill does
const createBlock = (data.content || []).find(
  b =>
    b.type === "server_tool_use" &&
    b.name === "text_editor_code_execution" &&
    b.input?.command === "create" &&
    typeof b.input?.file_text === "string"
);

if (createBlock?.input?.file_text) {
  console.log("✅ Structured script extracted from file_text:\n");
  console.log(createBlock.input.file_text);
} else {
  console.log("⚠️  No create block found. Falling back to text blocks:\n");
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  console.log(text || "(no text output)");
}
