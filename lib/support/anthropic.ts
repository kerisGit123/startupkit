import Anthropic from "@anthropic-ai/sdk";

export const SUPPORT_MODEL = "claude-haiku-4-5";
export const MAX_TOKENS = 4096;
export const MAX_TOOL_ITERATIONS = 8;

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable the support chatbot."
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}
