import OpenAI from "openai";

export const DEEPSEEK_MODEL = "deepseek/deepseek-chat-v3-0324";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

let _client: OpenAI | null = null;

export function getOpenRouterClient(): OpenAI | null {
  if (_client) return _client;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  _client = new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://storytica.com",
      "X-Title": "Storytica",
    },
  });
  return _client;
}

// ── Anthropic → OpenAI tool format adapter ──────────────────────────────────

interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
}

interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export function anthropicToolsToOpenAI(tools: AnthropicTool[]): OpenAITool[] {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description || "",
      parameters: t.input_schema,
    },
  }));
}

// ── Message format adapters ─────────────────────────────────────────────────

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | unknown[];
}

export function anthropicMessagesToOpenAI(
  messages: AnthropicMessage[]
): OpenAI.ChatCompletionMessageParam[] {
  const result: OpenAI.ChatCompletionMessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      // User message could be string or array of tool_result blocks
      if (typeof msg.content === "string") {
        result.push({ role: "user", content: msg.content });
      } else if (Array.isArray(msg.content)) {
        // Anthropic tool_result blocks → OpenAI tool messages
        for (const block of msg.content) {
          const b = block as Record<string, unknown>;
          if (b.type === "tool_result") {
            result.push({
              role: "tool",
              tool_call_id: b.tool_use_id as string,
              content: typeof b.content === "string" ? b.content : JSON.stringify(b.content),
            });
          }
        }
      }
    } else if (msg.role === "assistant") {
      if (typeof msg.content === "string") {
        result.push({ role: "assistant", content: msg.content });
      } else if (Array.isArray(msg.content)) {
        // Anthropic assistant blocks can contain text + tool_use
        let text = "";
        const toolCalls: OpenAI.ChatCompletionMessageParam[] = [];
        const assistantToolCalls: {
          id: string;
          type: "function";
          function: { name: string; arguments: string };
        }[] = [];

        for (const block of msg.content) {
          const b = block as Record<string, unknown>;
          if (b.type === "text") {
            text += (b.text as string) || "";
          } else if (b.type === "tool_use") {
            assistantToolCalls.push({
              id: b.id as string,
              type: "function",
              function: {
                name: b.name as string,
                arguments: JSON.stringify(b.input ?? {}),
              },
            });
          }
        }

        if (assistantToolCalls.length > 0) {
          result.push({
            role: "assistant",
            content: text || null,
            tool_calls: assistantToolCalls,
          });
        } else {
          result.push({ role: "assistant", content: text });
        }
      }
    }
  }

  return result;
}

// ── Extract tool calls from OpenAI response ─────────────────────────────────

export interface ExtractedToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export function extractToolCalls(
  choice: OpenAI.ChatCompletion.Choice
): ExtractedToolCall[] {
  if (!choice.message.tool_calls) return [];
  return choice.message.tool_calls.map((tc: any) => ({
    id: tc.id,
    name: tc.function.name,
    input: JSON.parse(tc.function.arguments || "{}"),
  }));
}
