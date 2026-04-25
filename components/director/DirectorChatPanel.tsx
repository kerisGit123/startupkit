"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Trash2, Loader2, Wrench } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
}

interface DirectorChatPanelProps {
  projectId: string;
  companyId?: string;
  currentFrameNumber?: number;
  currentSceneId?: string;
  onClose: () => void;
}

// ── Inline markdown renderer (matches SupportChatWidget) ────────────

function renderInlineMarkdown(text: string) {
  const parts: (string | React.ReactElement)[] = [];
  // Bold: **text**
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<strong key={key++} className="font-semibold text-white">{match[1]}</strong>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

// ── Tool name display mapping ───────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  get_project_overview: "Reading project...",
  get_scene_frames: "Looking at scene...",
  get_frame_details: "Examining frame...",
  get_element_library: "Checking elements...",
  update_frame_prompt: "Updating prompt...",
  update_frame_notes: "Adding notes...",
  update_project_style: "Setting style...",
  create_frames: "Creating frames...",
  batch_update_prompts: "Updating prompts...",
  get_model_recommendations: "Checking models...",
  search_knowledge_base: "Searching...",
};

// ── Component ───────────────────────────────────────────────────────

export function DirectorChatPanel({
  projectId,
  companyId,
  currentFrameNumber,
  currentSceneId,
  onClose,
}: DirectorChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTool]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setStreaming(true);
      setActiveTool(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/director/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            message: text.trim(),
            currentFrameNumber,
            currentSceneId,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let errMsg = `Request failed: ${res.status}`;
          try {
            const errJson = await res.json();
            errMsg = errJson.error || errMsg;
          } catch {}
          throw new Error(errMsg);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              switch (event.type) {
                case "text":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: m.content + event.delta }
                        : m
                    )
                  );
                  break;

                case "tool_call":
                  setActiveTool(event.name);
                  break;

                case "tool_result":
                  setActiveTool(null);
                  break;

                case "error":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: event.message || "Something went wrong.", isError: true, isStreaming: false }
                        : m
                    )
                  );
                  setStreaming(false);
                  return;

                case "done":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, isStreaming: false }
                        : m
                    )
                  );
                  break;
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "Connection error. Please try again.", isError: true, isStreaming: false }
              : m
          )
        );
      } finally {
        setStreaming(false);
        setActiveTool(null);
        abortRef.current = null;
      }
    },
    [projectId, currentFrameNumber, currentSceneId, streaming]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    // TODO: call convex directorChat.clearSession
  };

  // ── Quick actions ─────────────────────────────────────────────────

  const quickActions = [
    { label: "Review storyboard", prompt: "Review my entire storyboard. Check for shot variety, pacing, continuity issues, and missing coverage. Give specific suggestions." },
    { label: "Improve prompts", prompt: "Look at all my frames and improve the image prompts. Make them more cinematic with specific camera angles, lighting, and composition." },
    { label: "Suggest style", prompt: "Based on my project, suggest a visual style prompt that would work well. Consider the genre, mood, and content." },
  ];

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] z-[60] flex flex-col bg-[#0f0f13] border-l border-[#2a2a32] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a32] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">AI Director</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition"
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkles className="w-8 h-8 text-amber-400/60 mb-3" />
            <p className="text-sm text-gray-400 mb-1">AI Director</p>
            <p className="text-xs text-gray-600 mb-4">
              I can review your storyboard, write prompts, set up shots, and break scripts into frames.
            </p>
            <div className="flex flex-col gap-2 w-full">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="text-xs text-left px-3 py-2 rounded-lg bg-[#1a1a22] border border-[#2a2a32] text-gray-400 hover:text-gray-200 hover:border-amber-500/30 hover:bg-[#1e1e28] transition"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600/20 text-blue-100 border border-blue-500/20"
                  : msg.isError
                    ? "bg-red-500/10 text-red-300 border border-red-500/20"
                    : "bg-[#1a1a22] text-gray-300 border border-[#2a2a32]"
              }`}
            >
              {renderInlineMarkdown(msg.content || (msg.isStreaming ? "" : "..."))}
              {msg.isStreaming && !msg.content && (
                <span className="inline-flex gap-1 text-gray-500">
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span>
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Tool call indicator */}
        {activeTool && (
          <div className="flex items-center gap-2 text-xs text-amber-400/80 px-2">
            <Wrench className="w-3 h-3 animate-spin" />
            <span>{TOOL_LABELS[activeTool] || `Using ${activeTool}...`}</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-[#2a2a32] shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentFrameNumber
                ? `Ask about frame ${currentFrameNumber}...`
                : "Ask the AI Director..."
            }
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none bg-[#1a1a22] border border-[#2a2a32] rounded-xl px-3 py-2.5 text-[13px] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/40 disabled:opacity-50 max-h-[120px] overflow-y-auto"
            style={{ minHeight: "40px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
          >
            {streaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
