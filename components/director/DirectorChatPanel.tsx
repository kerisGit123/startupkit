"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Send, Sparkles, Trash2, Wrench, Bot, MessageSquare, Copy, Check, Square } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
  isPlanApproval?: boolean;
  planData?: PlanData;
  toolsUsed?: string[];
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
  currentFrameImageUrl?: string;
  initialMessage?: string;
  onClose: () => void;
}

// ── Markdown renderer ──────────────────────────────────────────────

function renderInlineSpans(text: string, keyOffset: number = 0): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = [];
  // Bold + inline code
  const regex = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let lastIndex = 0;
  let match;
  let key = keyOffset;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      parts.push(<strong key={key++} className="font-semibold text-(--text-primary)">{match[1]}</strong>);
    } else {
      parts.push(<code key={key++} className="px-1 py-0.5 rounded text-[11px] bg-white/8 text-(--text-primary) font-mono">{match[2]}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function renderMarkdown(text: string): React.ReactElement {
  const lines = text.split("\n");
  const elements: React.ReactElement[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H3
    if (line.startsWith("### ")) {
      elements.push(
        <p key={key++} className="text-[12px] font-semibold text-(--text-primary) mt-2 mb-0.5">
          {renderInlineSpans(line.slice(4), key)}
        </p>
      );
      i++; continue;
    }
    // H2
    if (line.startsWith("## ")) {
      elements.push(
        <p key={key++} className="text-[13px] font-semibold text-(--text-primary) mt-2.5 mb-1">
          {renderInlineSpans(line.slice(3), key)}
        </p>
      );
      i++; continue;
    }
    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <p key={key++} className="text-[14px] font-semibold text-(--text-primary) mt-2.5 mb-1">
          {renderInlineSpans(line.slice(2), key)}
        </p>
      );
      i++; continue;
    }
    // Divider
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(<div key={key++} className="h-px bg-(--border-primary) my-2" />);
      i++; continue;
    }
    // Unordered list item
    if (/^[-*] /.test(line)) {
      elements.push(
        <div key={key++} className="flex items-start gap-1.5 text-[13px] text-(--text-secondary) leading-snug">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-(--text-tertiary) shrink-0" />
          <span>{renderInlineSpans(line.slice(2), key)}</span>
        </div>
      );
      i++; continue;
    }
    // Numbered list item
    const numMatch = line.match(/^(\d+)\. (.+)/);
    if (numMatch) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 text-[13px] text-(--text-secondary) leading-snug">
          <span className="shrink-0 text-(--text-tertiary) tabular-nums min-w-[14px] text-right">{numMatch[1]}.</span>
          <span>{renderInlineSpans(numMatch[2], key)}</span>
        </div>
      );
      i++; continue;
    }
    // Blank line — small gap
    if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
      i++; continue;
    }
    // Regular paragraph
    elements.push(
      <p key={key++} className="text-[13px] text-(--text-secondary) leading-relaxed">
        {renderInlineSpans(line, key)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
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
  invoke_skill: "Building script...",
  save_script: "Saving script...",
  build_storyboard: "Building storyboard...",
  suggest_shot_list: "Planning shots...",
  generate_scene: "Building scene...",
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
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<AgentMode>("director");
  const [scriptMode, setScriptMode] = useState<"quick" | "cinematic">("quick");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hiddenCount, setHiddenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toolStartRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTool]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Elapsed timer — ticks every second while a tool is active
  useEffect(() => {
    if (!activeTool) {
      setElapsed(0);
      toolStartRef.current = null;
      return;
    }
    toolStartRef.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => {
      if (toolStartRef.current) {
        setElapsed(Math.floor((Date.now() - toolStartRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [activeTool]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: text.trim() };
      const assistantMsg: Message = { id: `assistant-${Date.now()}`, role: "assistant", content: "", isStreaming: true };

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
          body: JSON.stringify({ projectId, message: text.trim(), currentFrameNumber, currentSceneId, mode, scriptMode }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let errMsg = `Request failed: ${res.status}`;
          try { const errJson = await res.json(); errMsg = errJson.error || errMsg; } catch {}
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
                  setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, content: m.content + event.delta } : m));
                  break;
                case "tool_call":
                  setActiveTool(event.name);
                  break;
                case "tool_result":
                  setActiveTool(null);
                  break;
                case "error":
                  setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, content: event.message || "Something went wrong.", isError: true, isStreaming: false } : m));
                  setStreaming(false);
                  return;
                case "plan_approval":
                  setMessages((prev) => [
                    ...prev,
                    { id: `plan-${Date.now()}`, role: "assistant", content: "", isPlanApproval: true, planData: { steps: event.steps || [], totalCredits: event.totalCredits || 0, status: "pending" } },
                  ]);
                  break;
                case "done":
                  setMessages((prev) => prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, isStreaming: false, toolsUsed: event.toolsUsed || [] }
                      : m
                  ));
                  break;
              }
            } catch { /* skip malformed JSON */ }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, isStreaming: false } : m));
          return;
        }
        setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, content: "Connection error. Please try again.", isError: true, isStreaming: false } : m));
      } finally {
        setStreaming(false);
        setActiveTool(null);
        abortRef.current = null;
      }
    },
    [projectId, currentFrameNumber, currentSceneId, streaming, mode, scriptMode]
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

  const initialMessageSent = useRef<string | null>(null);
  useEffect(() => {
    if (initialMessage && initialMessage !== initialMessageSent.current && !streaming) {
      initialMessageSent.current = initialMessage;
      sendMessage(initialMessage);
    }
  }, [initialMessage, streaming, sendMessage]);

  // ── Quick actions (empty state only) ───────────────────────────

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

  const executeActions: QuickAction[] = [
    { label: "Generate images", icon: "🖼️", kind: "execute", prompt: "Check my credit balance, then generate images for all frames that don't have images yet. Use the cheapest suitable model. Show me a plan with credit costs before executing." },
    { label: "Animate frames", icon: "🎞️", kind: "execute", prompt: "Generate videos for all frames that have images but no videos. Use Seedance 2.0 Fast for budget. Show me the plan with credit costs first." },
    { label: "Enhance all", icon: "⬆️", kind: "execute", prompt: "Post-process all generated images with the Enhance tool to improve quality. Show me a plan with credit costs before executing." },
    { label: "Smart generate", icon: "🧠", kind: "execute", prompt: "Look at my storyboard. Which frames have no image yet? Which ones have images but no video? Suggest the most cost-effective generation plan and execute after approval." },
    { label: "Check credits", icon: "💳", kind: "execute", prompt: "What is my current credit balance? How many images or videos can I still generate with it?" },
    { label: "Build full story", icon: "🚀", kind: "execute", prompt: "I want to build a complete storyboard end-to-end. Help me plan the scenes and frames, then generate all the images. Ask me about the story concept first." },
  ];

  const adviceActions = currentFrameNumber ? frameAdviceActions : projectAdviceActions;
  const hasMessages = messages.length > 0;

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] z-60 flex flex-col bg-(--bg-primary) border-l border-(--border-primary) shadow-2xl">

      {/* Header — underline tab style */}
      <div className="shrink-0">
        <div className="flex items-center justify-between px-4 pt-2">
          <div className="flex items-center">
            <button
              onClick={() => setMode("director")}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
                mode === "director"
                  ? "text-(--text-primary) border-white"
                  : "text-(--text-tertiary) border-transparent hover:text-(--text-secondary)"
              }`}
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${mode === "director" ? "text-amber-400" : ""}`}
                strokeWidth={1.75}
              />
              Director
            </button>
            <button
              onClick={() => setMode("agent")}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
                mode === "agent"
                  ? "text-(--text-primary) border-white"
                  : "text-(--text-tertiary) border-transparent hover:text-(--text-secondary)"
              }`}
            >
              <Bot
                className={`w-3.5 h-3.5 ${mode === "agent" ? "text-(--accent-teal)" : ""}`}
                strokeWidth={1.75}
              />
              Agent
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={clearHistory}
              className="p-1.5 rounded-md text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 transition"
              title="Clear history"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 transition"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div className="h-px bg-(--border-primary)" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {hiddenCount > 0 && (
          <button
            onClick={loadPreviousMessages}
            className="w-full py-2 px-3 rounded-lg bg-(--bg-secondary) border border-(--border-primary) text-[11px] text-(--text-tertiary) hover:text-(--text-secondary) hover:border-(--border-secondary) transition flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-3 h-3" strokeWidth={1.75} />
            <span>{hiddenCount} earlier message{hiddenCount !== 1 ? "s" : ""}</span>
          </button>
        )}

        {/* Empty state — identity + quick actions */}
        {!hasMessages && (
          <div className="flex flex-col h-full pt-2">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-10 h-10 rounded-2xl bg-white/4 flex items-center justify-center mb-3 border border-(--border-primary)">
                {mode === "agent"
                  ? <Bot className="w-5 h-5 text-(--text-tertiary)" strokeWidth={1.75} />
                  : <Sparkles className="w-5 h-5 text-(--text-tertiary)" strokeWidth={1.75} />
                }
              </div>
              <p className="text-[13px] font-medium text-(--text-primary) mb-1">
                {mode === "agent" ? "AI Agent" : "AI Director"}
              </p>
              <p className="text-[12px] text-(--text-secondary) leading-relaxed max-w-[260px]">
                {mode === "agent"
                  ? "Generate images, create videos, post-process, and run multi-step plans."
                  : currentFrameNumber
                    ? `Frame ${currentFrameNumber} selected. Advising on prompts, camera, and composition.`
                    : "Advising on prompts, shot variety, pacing, and visual style."}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              {mode === "agent" && (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-(--text-tertiary) px-0.5 mb-0.5">Execute</p>
                  {executeActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="text-[12px] text-left px-3 py-2 rounded-lg bg-(--bg-secondary) border border-(--border-primary) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-secondary) transition flex items-center gap-2.5"
                    >
                      {action.icon && <span>{action.icon}</span>}
                      <span className="flex-1">{action.label}</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-(--accent-teal) shrink-0">run</span>
                    </button>
                  ))}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-(--text-tertiary) px-0.5 mt-2 mb-0.5">Advise</p>
                </>
              )}
              {adviceActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="text-[12px] text-left px-3 py-2 rounded-lg bg-(--bg-secondary) border border-(--border-primary) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-secondary) transition flex items-center gap-2.5"
                >
                  {action.icon && <span>{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) =>
          msg.isPlanApproval && msg.planData ? (
            <div key={msg.id} className="flex justify-start">
              <div className="w-full rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-(--text-tertiary)">Execution Plan</p>
                <div className="space-y-1.5">
                  {msg.planData.steps.map((step, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-[12px]">
                      <span className="text-(--text-secondary) leading-snug">
                        {step.action}
                        {step.frameNumber != null && <span className="text-(--text-tertiary) ml-1">· F{step.frameNumber}</span>}
                        {step.model && <span className="text-(--text-tertiary) ml-1">· {step.model}</span>}
                      </span>
                      <span className="text-amber-400 tabular-nums shrink-0 font-medium">{step.credits} cr</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-(--border-primary)">
                  <span className="text-[12px] text-(--text-secondary)">
                    Total: <span className="text-(--text-primary) font-semibold">{msg.planData.totalCredits} credits</span>
                  </span>
                  {msg.planData.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePlanApproval(msg.id, true)}
                        className="px-3 py-1 rounded-md text-[11px] font-medium bg-(--accent-blue)/12 text-(--accent-blue) border border-(--accent-blue)/25 hover:bg-(--accent-blue)/20 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handlePlanApproval(msg.id, false)}
                        className="px-3 py-1 rounded-md text-[11px] font-medium bg-red-500/8 text-red-400 border border-red-500/15 hover:bg-red-500/15 transition"
                      >
                        Cancel
                      </button>
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
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="relative group max-w-[88%]">
                <div
                  className={`px-3 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-(--accent-blue)/12 text-(--text-primary) border border-(--accent-blue)/20"
                      : msg.isError
                        ? "bg-red-500/8 text-red-300 border border-red-500/15"
                        : "bg-(--bg-secondary) text-(--text-secondary) border border-(--border-primary)"
                  }`}
                >
                  {msg.role === "user"
                    ? <span className="whitespace-pre-wrap">{msg.content}</span>
                    : msg.content
                      ? renderMarkdown(msg.content)
                      : null
                  }
                  {msg.isStreaming && !msg.content && (
                    <span className="inline-flex gap-1 text-(--text-tertiary)">
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span>
                      <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span>
                    </span>
                  )}
                </div>
                {msg.role === "assistant" && !msg.isStreaming && msg.content && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content);
                      setCopiedId(msg.id);
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-(--bg-tertiary) hover:bg-(--bg-secondary) border border-(--border-primary) rounded-md p-1 text-(--text-tertiary) hover:text-(--text-primary)"
                    title="Copy"
                  >
                    {copiedId === msg.id
                      ? <Check className="w-3 h-3 text-green-400" />
                      : <Copy className="w-3 h-3" strokeWidth={1.75} />
                    }
                  </button>
                )}
                {/* Tool call disclosure */}
                {msg.role === "assistant" && !msg.isStreaming && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-600">
                    <Wrench className="w-2.5 h-2.5 shrink-0" strokeWidth={1.5} />
                    <span>
                      {msg.toolsUsed.length} tool{msg.toolsUsed.length !== 1 ? "s" : ""}
                      {" · "}
                      {msg.toolsUsed
                        .slice(0, 4)
                        .map((t) => (TOOL_LABELS[t] || t).replace("...", ""))
                        .join(", ")}
                      {msg.toolsUsed.length > 4 ? ` +${msg.toolsUsed.length - 4}` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {activeTool && (
          <div className="flex flex-col gap-1 px-1">
            <div className="flex items-center gap-2 text-[11px] text-amber-400/80">
              <Wrench className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={1.75} />
              <span>{TOOL_LABELS[activeTool] || `Using ${activeTool}...`}</span>
              {elapsed > 0 && <span className="text-amber-400/50 tabular-nums">{elapsed}s</span>}
            </div>
            {(activeTool === "invoke_skill" || activeTool === "build_storyboard") && (
              <p className="text-[10px] text-amber-300/40 pl-5">Keep this panel open — this step takes ~30–60s</p>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-(--border-primary) px-3 pt-2 pb-3 shrink-0">

        {/* Balloon area — mode toggle + story starters (agent mode only) */}
        {mode === "agent" && (
          <div className="mb-2 space-y-1.5">
            {/* Quick / Cinematic toggle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setScriptMode("quick")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  scriptMode === "quick"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-(--bg-secondary) border-(--border-primary) text-(--text-tertiary) hover:text-(--text-secondary)"
                }`}
              >
                ⚡ Quick · 8cr/min
              </button>
              <button
                onClick={() => setScriptMode("cinematic")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  scriptMode === "cinematic"
                    ? "bg-(--accent-blue)/15 border-(--accent-blue)/30 text-(--accent-blue)"
                    : "bg-(--bg-secondary) border-(--border-primary) text-(--text-tertiary) hover:text-(--text-secondary)"
                }`}
              >
                🎬 Cinematic · 18cr/min
              </button>
            </div>

            {/* Story starter pills — empty state only */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "🐉 Dragon epic · 5min", prompt: "Write me an epic dragon story, 5 minutes" },
                  { label: "💕 Romance · 2min", prompt: "Write a romantic love story, 2 minutes" },
                  { label: "🧒 Kids story · 1min", prompt: "Write a fun kids adventure story, 1 minute" },
                  { label: "🚀 Sci-fi · 3min", prompt: "Write a sci-fi thriller, 3 minutes" },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.prompt)}
                    className="px-2.5 py-1 rounded-full text-[11px] bg-(--bg-secondary) border border-(--border-primary) text-(--text-tertiary) hover:text-(--text-primary) hover:border-(--border-secondary) transition-all"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
            className="flex-1 resize-none bg-(--bg-secondary) border border-(--border-primary) rounded-xl px-3 py-2.5 text-[13px] text-(--text-primary) placeholder:text-(--text-tertiary) focus:outline-none focus:border-(--accent-blue)/40 disabled:opacity-50 max-h-[120px] overflow-y-auto leading-5"
            style={{ minHeight: "40px" }}
          />
          {streaming ? (
            <button
              onClick={() => abortRef.current?.abort()}
              className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition shrink-0"
              title="Stop"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-(--accent-blue)/12 text-(--accent-blue) hover:bg-(--accent-blue)/20 border border-(--accent-blue)/20 disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
            >
              <Send className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
