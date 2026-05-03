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

const PROMPT = "an epic dragon and samurai warrior story set in feudal Japan, 10 scenes, 2.5 minutes, full cinematic arc from encounter to final battle to peaceful resolution";

console.log(`\n🎬 Testing skill: ${SKILL_ID}`);
console.log(`Prompt: '${PROMPT}'\n`);

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
    max_tokens: 8192,
    container: {
      skills: [{ type: "custom", skill_id: SKILL_ID, version: "latest" }],
    },
    tools: [{ type: "code_execution_20250825", name: "code_execution" }],
    messages: [{ role: "user", content: PROMPT }],
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

// --- Cost analysis ---
const usage = data.usage || {};
const inputTokens = usage.input_tokens || 0;
const outputTokens = usage.output_tokens || 0;
const cacheRead = usage.cache_read_input_tokens || 0;
const cacheWrite = usage.cache_creation_input_tokens || 0;
const isSonnet = (data.model || "").includes("sonnet");
const inputRate  = isSonnet ? 3.00  : 0.80;   // $/1M tokens
const outputRate = isSonnet ? 15.00 : 4.00;   // $/1M tokens
const cost = (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;

console.log("\n💰 Token usage:");
console.log(`   Model:         ${data.model}`);
console.log(`   Input tokens:  ${inputTokens.toLocaleString()} (cache_read: ${cacheRead}, cache_write: ${cacheWrite})`);
console.log(`   Output tokens: ${outputTokens.toLocaleString()}`);
console.log(`   API cost:      $${cost.toFixed(4)}`);

const CREDITS = isSonnet ? 15 : 6;
const revenue = CREDITS * 0.01;
const margin  = ((revenue - cost) / revenue * 100).toFixed(1);
console.log(`   Credits charged: ${CREDITS} → revenue $${revenue.toFixed(2)}`);
console.log(`   Margin: ${margin}% ${Number(margin) > 0 ? "✅" : "❌ LOSS"}`);
console.log("");

if (createBlock?.input?.file_text) {
  console.log("✅ Structured script extracted from file_text:\n");
  console.log(createBlock.input.file_text);
} else {
  console.log("⚠️  No create block found. Falling back to text blocks:\n");
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  console.log(text || "(no text output)");
}
