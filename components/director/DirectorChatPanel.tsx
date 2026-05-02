"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Send, Sparkles, Trash2, Loader2, Wrench, Bot, MessageSquare } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
  isPlanApproval?: boolean;
  planData?: PlanData;
}

interface PlanData {
  steps: PlanStep[];
  totalCredits: number;
  status: "pending" | "approved" | "rejected";
}

interface PlanStep {
  action: string;
  frameNumber?: number;
  model?: string;
  credits: number;
}

type AgentMode = "director" | "agent";

interface DirectorChatPanelProps {
  projectId: string;
  companyId?: string;
  currentFrameNumber?: number;
  currentSceneId?: string;
  currentFrameImageUrl?: string; // If the current frame has a generated image
  initialMessage?: string; // Auto-send this message when set (e.g. from "Review this frame" button)
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
  analyze_frame_image: "Analyzing image...",
  get_model_recommendations: "Checking models...",
  search_knowledge_base: "Searching...",
  create_element: "Creating element...",
  get_credit_balance: "Checking credits...",
  get_model_pricing: "Comparing models...",
  create_execution_plan: "Planning...",
  trigger_image_generation: "Generating image...",
  trigger_video_generation: "Generating video...",
  trigger_post_processing: "Processing...",
  get_prompt_templates: "Loading templates...",
  get_presets: "Loading presets...",
  enhance_prompt: "Enhancing prompt...",
  browse_project_files: "Browsing files...",
};

// ── Component ───────────────────────────────────────────────────────

export function DirectorChatPanel({
  projectId,
  companyId,
  currentFrameNumber,
  currentSceneId,
  currentFrameImageUrl,
  initialMessage,
  onClose,
}: DirectorChatPanelProps) {
  const { user } = useUser();
  const userId = user?.id;
  const INITIAL_VISIBLE = 10;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [mode, setMode] = useState<AgentMode>("director");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const session = useQuery(
    api.directorChat.getSession,
    userId && projectId ? { projectId: projectId as any, userId } : "skip"
  );
  const clearSessionMutation = useMutation(api.directorChat.clearSession);
  const allRestoredRef = useRef<Message[]>([]);

  useEffect(() => {
    if (session?.messages && !historyLoaded && messages.length === 0) {
      const allRestored: Message[] = session.messages.map((msg, i) => ({
        id: `restored-${i}-${msg.timestamp}`,
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      allRestoredRef.current = allRestored;
      if (allRestored.length > INITIAL_VISIBLE) {
        setMessages(allRestored.slice(-INITIAL_VISIBLE));
        setHiddenCount(allRestored.length - INITIAL_VISIBLE);
      } else if (allRestored.length > 0) {
        setMessages(allRestored);
      }
      setHistoryLoaded(true);
    }
  }, [session, historyLoaded, messages.length]);

  const loadPreviousMessages = () => {
    if (hiddenCount > 0 && allRestoredRef.current.length > 0) {
      setMessages(allRestoredRef.current);
      setHiddenCount(0);
    }
  };

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
            mode,
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

                case "plan_approval":
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `plan-${Date.now()}`,
                      role: "assistant",
                      content: "",
                      isPlanApproval: true,
                      planData: { steps: event.steps || [], totalCredits: event.totalCredits || 0, status: "pending" },
                    },
                  ]);
                  break;

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
    [projectId, currentFrameNumber, currentSceneId, streaming, mode]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearHistory = async () => {
    setMessages([]);
    setHistoryLoaded(false);
    setHiddenCount(0);
    allRestoredRef.current = [];
    if (userId && projectId) {
      try { await clearSessionMutation({ projectId: projectId as any, userId }); } catch {}
    }
  };

  const handlePlanApproval = useCallback(
    (planMsgId: string, approved: boolean) => {
      setMessages((prev) => prev.map((m) => m.id === planMsgId && m.planData ? { ...m, planData: { ...m.planData, status: approved ? "approved" : "rejected" } } : m));
      sendMessage(approved ? "Approved. Execute the plan." : "Rejected. Do not execute.");
    },
    [sendMessage]
  );

  // ── Auto-send initialMessage (e.g. from "Review this frame" button) ──
  const initialMessageSent = useRef<string | null>(null);
  useEffect(() => {
    if (initialMessage && initialMessage !== initialMessageSent.current && !streaming) {
      initialMessageSent.current = initialMessage;
      sendMessage(initialMessage);
    }
  }, [initialMessage, streaming, sendMessage]);

  // ── Quick action chips (always visible, context-aware) ──────────────

  // kind: "execute" = triggers generation (Agent only), "advise" = read/write advice (both modes)
  type QuickAction = { label: string; prompt: string; icon?: string; kind: "advise" | "execute" };

  const frameAdviceActions: QuickAction[] = [
    ...(currentFrameImageUrl
      ? [{ label: "Analyze image", icon: "🔍", kind: "advise" as const, prompt: `Analyze the generated image for frame ${currentFrameNumber}. Check composition, lighting, color, mood, and whether it matches the prompt. What works and what could be improved?` }]
      : [{ label: "Write prompt", icon: "✍️", kind: "advise" as const, prompt: `Write a detailed cinematic image prompt for frame ${currentFrameNumber}. Include camera angle, lighting, composition, mood, and style.` }]),
    { label: "Improve prompt", icon: "✨", kind: "advise", prompt: `Look at frame ${currentFrameNumber}'s current image prompt and rewrite it to be more cinematic. Add specific camera angle, lighting, composition, and mood details. Update it directly.` },
    { label: "Camera angle", icon: "🎬", kind: "advise", prompt: `What's the best camera angle and shot type for frame ${currentFrameNumber}? Consider the scene context and what would be most cinematic.` },
    { label: "Lighting setup", icon: "💡", kind: "advise", prompt: `Suggest the best lighting setup for frame ${currentFrameNumber}. Consider the mood, time of day, and what would complement the scene.` },
    { label: "What's wrong", icon: "🩺", kind: "advise", prompt: `Critically review frame ${currentFrameNumber}. What are the weaknesses in the prompt? What might generate poorly and why? Be specific.` },
    { label: "Add notes", icon: "📝", kind: "advise", prompt: `Add director notes to frame ${currentFrameNumber} with production guidance — key things to watch for when generating.` },
  ];

  const projectAdviceActions: QuickAction[] = [
    { label: "Review storyboard", icon: "📋", kind: "advise", prompt: "Review my entire storyboard. Check for shot variety, pacing, continuity issues, and missing coverage. Give specific suggestions for improvement." },
    { label: "Shot variety", icon: "🎥", kind: "advise", prompt: "Look at all my frames and check for shot variety. Are there too many similar angles or compositions? Suggest a more diverse shot plan." },
    { label: "Improve all prompts", icon: "✨", kind: "advise", prompt: "Look at all my frames and improve the image prompts. Make them more cinematic with specific camera angles, lighting, and composition. Update them directly." },
    { label: "Visual style", icon: "🎨", kind: "advise", prompt: "Based on my project content, suggest a visual style that would work well — lighting mood, color palette, film stock, lens choice. Update the project style if I approve." },
    { label: "Script help", icon: "📄", kind: "advise", prompt: "Review my project description and help me improve the narrative structure. Are there gaps, pacing issues, or missing scenes?" },
    { label: "Pacing check", icon: "⏱️", kind: "advise", prompt: "Review my storyboard for pacing. Are scene durations appropriate? Does the flow feel right? Which scenes need more or fewer frames?" },
    { label: "Consistency check", icon: "🔗", kind: "advise", prompt: "Check my storyboard for visual consistency — do the prompts maintain consistent character descriptions, environment, and style across frames?" },
  ];

  // Execute chips — Agent only
  const executeActions: QuickAction[] = [
    { label: "Generate images", icon: "🖼️", kind: "execute", prompt: "Check my credit balance, then generate images for all frames that don't have images yet. Use the cheapest suitable model. Show me a plan with credit costs before executing." },
    { label: "Animate frames", icon: "🎞️", kind: "execute", prompt: "Generate videos for all frames that have images but no videos. Use Seedance 2.0 Fast for budget. Show me the plan with credit costs first." },
    { label: "Enhance all", icon: "⬆️", kind: "execute", prompt: "Post-process all generated images with the Enhance tool to improve quality. Show me a plan with credit costs before executing." },
    { label: "Smart generate", icon: "🧠", kind: "execute", prompt: "Look at my storyboard. Which frames have no image yet? Which ones have images but no video? Suggest the most cost-effective generation plan and execute after approval." },
    { label: "Check credits", icon: "💳", kind: "execute", prompt: "What is my current credit balance? How many images or videos can I still generate with it?" },
    { label: "Build full story", icon: "🚀", kind: "execute", prompt: "I want to build a complete storyboard end-to-end. Help me plan the scenes and frames, then generate all the images. Ask me about the story concept first." },
  ];

  // Director = advice only. Agent = execute chips first, then all advice chips too.
  const adviceActions = currentFrameNumber ? frameAdviceActions : projectAdviceActions;
  const quickActions: QuickAction[] = mode === "agent"
    ? [...executeActions, ...adviceActions]
    : adviceActions;

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] z-60 flex flex-col bg-[#0f0f13] border-l border-[#2a2a32] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a32] shrink-0">
        <div className="flex items-center gap-1 bg-[#1a1a22] rounded-lg p-0.5 border border-[#2a2a32]">
          <button
            onClick={() => setMode("director")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              mode === "director"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Director
          </button>
          <button
            onClick={() => setMode("agent")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              mode === "agent"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Bot className="w-3 h-3" />
            Agent
          </button>
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
        {hiddenCount > 0 && (
          <button onClick={loadPreviousMessages} className="w-full py-2 px-3 rounded-lg bg-[#1a1a22] border border-[#2a2a32] text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition flex items-center justify-center gap-2">
            <MessageSquare className="w-3 h-3" />
            <span>{hiddenCount} earlier message{hiddenCount !== 1 ? "s" : ""}</span>
          </button>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            {mode === "agent" ? (
              <Bot className="w-8 h-8 text-purple-400/60 mb-3" />
            ) : (
              <Sparkles className="w-8 h-8 text-amber-400/60 mb-3" />
            )}
            <p className="text-sm text-gray-400 mb-1">{mode === "agent" ? "AI Agent" : "AI Director"}</p>
            <p className="text-xs text-gray-600 mb-4">
              {mode === "agent"
                ? "I can advise on your storyboard and execute — generate images, create videos, post-process, and run multi-step plans."
                : currentFrameNumber
                  ? `Frame ${currentFrameNumber} selected. I'll advise on prompts, camera, and composition.`
                  : "I advise on your storyboard — prompts, shot variety, pacing, style. You stay in control of generating."}
            </p>
            <div className="flex flex-col gap-2 w-full">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="text-xs text-left px-3 py-2 rounded-lg bg-[#1a1a22] border border-[#2a2a32] text-gray-400 hover:text-gray-200 hover:border-amber-500/30 hover:bg-[#1e1e28] transition flex items-center gap-2"
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) =>
          msg.isPlanApproval && msg.planData ? (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[90%] rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 space-y-2">
                <p className="text-xs font-semibold text-purple-300">Execution Plan</p>
                <div className="space-y-1">
                  {msg.planData.steps.map((step, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px]">
                      <span className="text-gray-300">
                        {step.action}
                        {step.frameNumber != null && <span className="text-gray-500 ml-1">F{step.frameNumber}</span>}
                        {step.model && <span className="text-gray-600 ml-1">({step.model})</span>}
                      </span>
                      <span className="text-amber-400 ml-2 shrink-0">{step.credits} cr</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#2a2a32]">
                  <span className="text-xs text-gray-400">Total: <strong className="text-white">{msg.planData.totalCredits} credits</strong></span>
                  {msg.planData.status === "pending" ? (
                    <div className="flex gap-2">
                      <button onClick={() => handlePlanApproval(msg.id, true)} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition">Approve</button>
                      <button onClick={() => handlePlanApproval(msg.id, false)} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition">Cancel</button>
                    </div>
                  ) : (
                    <span className={`text-[11px] font-medium ${msg.planData.status === "approved" ? "text-green-400" : "text-red-400"}`}>
                      {msg.planData.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
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
          )
        )}

        {/* Tool call indicator */}
        {activeTool && (
          <div className="flex items-center gap-2 text-xs text-amber-400/80 px-2">
            <Wrench className="w-3 h-3 animate-spin" />
            <span>{TOOL_LABELS[activeTool] || `Using ${activeTool}...`}</span>
          </div>
        )}
      </div>

      {/* Quick action chips — always visible */}
      <div className="px-3 pt-2 pb-1 border-t border-[#2a2a32] shrink-0">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {quickActions.map((action, i) => {
            const isExecute = action.kind === "execute";
            // thin divider between execute and advise groups in Agent mode
            const showDivider = mode === "agent" && i === executeActions.length;
            return (
              <div key={action.label} className="flex items-center gap-1.5 shrink-0">
                {showDivider && <div className="w-px h-4 bg-[#2a2a32] shrink-0" />}
                <button
                  onClick={() => sendMessage(action.prompt)}
                  disabled={streaming}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] disabled:opacity-40 disabled:cursor-not-allowed transition whitespace-nowrap ${
                    isExecute
                      ? "bg-purple-500/10 border-purple-500/25 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/40"
                      : "bg-[#1a1a22] border-[#2a2a32] text-gray-400 hover:text-gray-200 hover:border-amber-500/30 hover:bg-[#1e1e28]"
                  }`}
                >
                  {action.icon && <span className="text-[11px]">{action.icon}</span>}
                  {action.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "agent"
                ? "Tell the agent what to build..."
                : currentFrameNumber
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
