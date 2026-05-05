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

interface QuickAction {
  label: string;
  message: string;
  style?: "primary" | "secondary" | "danger";
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
  onOpenBatchGenerate?: () => void;
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

function parseChoices(content: string): { text: string; choices: string[] } {
  const match = content.match(/\[CHOICES:\s*([\s\S]*?)\]\s*$/);
  if (!match) return { text: content, choices: [] };
  const choices = [...match[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const text = content.replace(/\s*\[CHOICES:[\s\S]*?\]\s*$/, "").trimEnd();
  return { text, choices };
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
  trigger_element_image_generation: "Generating element reference...",
  trigger_video_generation: "Generating video...",
  trigger_post_processing: "Processing...",
  get_prompt_templates: "Loading templates...",
  get_presets: "Loading presets...",
  enhance_prompt: "Enhancing prompt...",
  browse_project_files: "Browsing files...",
  invoke_skill: "Writing & building storyboard...",
  suggest_actions: "",
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
  onOpenBatchGenerate,
}: DirectorChatPanelProps) {
  const { user } = useUser();
  const userId = user?.id;
  const INITIAL_VISIBLE = 10;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolProgress, setToolProgress] = useState<string | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<AgentMode>("director");
  const [scriptMode, setScriptMode] = useState<"quick" | "cinematic">("quick");
  const [quickCategory, setQuickCategory] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<{ label: string; cost: number; isEstimate?: boolean; action: () => Promise<void> } | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [postGenNudge, setPostGenNudge] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toolStartRef = useRef<number | null>(null);

  const session = useQuery(
    api.directorChat.getSession,
    userId && projectId ? { projectId: projectId as any, userId } : "skip"
  );
  const creditBalance = useQuery(
    api.credits.getBalance,
    companyId ? { companyId } : "skip"
  );
  const agentAccess = useQuery(
    api.directorChat.getAgentAccess,
    companyId ? { companyId } : "skip"
  );
  const storyItems = useQuery(
    api.storyboard.storyboardItems.listByProject,
    projectId ? { projectId: projectId as any } : "skip"
  );
  const clearSessionMutation = useMutation(api.directorChat.clearSession);
  const deductCredits = useMutation(api.credits.deductCredits);
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
      setQuickActions(null);
      setPostGenNudge(false);

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
                  setToolProgress(null);
                  break;
                case "tool_progress":
                  setToolProgress(event.message || null);
                  break;
                case "tool_result":
                  setActiveTool(null);
                  setToolProgress(null);
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
                case "quick_actions":
                  setQuickActions(event.actions || null);
                  break;
                case "open_batch_generate":
                  onOpenBatchGenerate?.();
                  break;
                case "done": {
                  const toolsUsedList = event.toolsUsed || [];
                  setMessages((prev) => prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, isStreaming: false, toolsUsed: toolsUsedList }
                      : m
                  ));
                  if (toolsUsedList.some((t: string) => t === "trigger_image_generation" || t === "trigger_video_generation")) {
                    setPostGenNudge(true);
                  }
                  break;
                }
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
        setToolProgress(null);
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

  const answerLocally = useCallback((content: string) => {
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "assistant" as const, content }]);
  }, []);

  const analyzeCurrentImage = useCallback(() => {
    if (!currentFrameImageUrl || streaming) return;
    setConfirmingAction({
      label: "Analyze current image · Gemini 2.5 Flash",
      cost: 1,
      action: async () => {
        const userMsgId = `user-${Date.now()}`;
        const assistantMsgId = `analyze-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          { id: userMsgId, role: "user" as const, content: `Analyze the current image (frame ${currentFrameNumber})` },
          { id: assistantMsgId, role: "assistant" as const, content: "", isStreaming: true },
        ]);
        setStreaming(true);
        try {
          if (companyId) {
            await deductCredits({ companyId, tokens: 1, reason: "AI Analyze Image" });
          }
          const res = await fetch("/api/ai-analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaType: "image", mediaUrl: currentFrameImageUrl }),
          });
          const data = await res.json();
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: data.result || "Could not analyze image.", isStreaming: false }
              : m
          ));
        } catch {
          setMessages((prev) => prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: "Failed to analyze image.", isError: true, isStreaming: false }
              : m
          ));
        } finally {
          setStreaming(false);
        }
      },
    });
  }, [currentFrameImageUrl, currentFrameNumber, streaming, companyId, deductCredits]);

  const handleCurrentFrameAbout = useCallback(() => {
    const items = (storyItems as any[] | undefined) ?? null;
    if (!currentFrameNumber && !currentSceneId) {
      answerLocally("No frame is selected. Click on a frame in the canvas first.");
      return;
    }
    if (!items) {
      answerLocally("Still loading storyboard data — try again in a moment.");
      return;
    }
    // Match by sceneId (most precise) or fall back to sorted order index
    let frame: any = currentSceneId
      ? items.find((i: any) => i.sceneId === currentSceneId)
      : null;
    if (!frame && currentFrameNumber) {
      const sorted = [...items].sort((a: any, b: any) => a.order - b.order);
      frame = sorted[currentFrameNumber - 1] ?? null;
    }
    if (!frame) {
      answerLocally(`Frame ${currentFrameNumber ?? "selected"} not found in this project.`);
      return;
    }

    const imagePrompt: string | null = frame.imagePrompt || null;
    const videoPrompt: string | null = frame.videoPrompt || null;
    const description: string | null = frame.description || null;
    const notes: string | null = frame.notes || null;
    const hasImage = !!(frame.imageUrl || frame.primaryImage);
    const hasVideo = !!(frame.videoUrl);
    const imgStatus = frame.imageGeneration?.status ?? null;
    const vidStatus = frame.videoGeneration?.status ?? null;

    const lines: string[] = [];
    lines.push(`**Frame ${currentFrameNumber ?? ""} — ${frame.title || "Untitled"}**`);
    lines.push("");
    lines.push(`**Image prompt:**`);
    lines.push(imagePrompt ? imagePrompt : "_Not set_");
    lines.push("");
    lines.push(`**Video prompt:**`);
    lines.push(videoPrompt ? videoPrompt : "_Not set_");
    if (description) { lines.push(""); lines.push(`**Description:** ${description}`); }
    if (notes) { lines.push(""); lines.push(`**Director notes:** ${notes}`); }
    lines.push("");
    const imgLabel = hasImage ? "✓ Image ready" : imgStatus ? `⏳ Image ${imgStatus}` : "○ No image";
    const vidLabel = hasVideo ? "✓ Video ready" : vidStatus ? `⏳ Video ${vidStatus}` : "○ No video";
    lines.push(`${imgLabel} · ${vidLabel}`);

    answerLocally(lines.join("\n"));
  }, [storyItems, currentFrameNumber, currentSceneId, answerLocally]);

  const analyzeStoryboard = useCallback(() => {
    const items = (storyItems as any[] | undefined) ?? null;
    if (!items) { answerLocally("Still loading storyboard data — try again in a moment."); return; }
    if (items.length === 0) { answerLocally("Your storyboard has no frames yet."); return; }

    const withImage = items.filter((i: any) => i.imageUrl || i.imageStorageId).length;
    const withVideo = items.filter((i: any) => i.videoUrl || i.videoStorageId).length;
    const scenes = new Set(items.map((i: any) => i.sceneId).filter(Boolean)).size;

    const samples = items.slice(0, 4).map((i: any, idx: number) => {
      const prompt = (i.imagePrompt || i.prompt || i.description || "").slice(0, 70);
      return `- Frame ${i.frameNumber ?? idx + 1}: ${prompt || "No prompt yet"}${prompt.length >= 70 ? "…" : ""}`;
    }).join("\n");

    answerLocally(
      `**Storyboard overview** (${items.length} frames, ${scenes} scene${scenes !== 1 ? "s" : ""})` +
      `\n\n- **${withImage}** frame${withImage !== 1 ? "s" : ""} with generated images` +
      `\n- **${withVideo}** frame${withVideo !== 1 ? "s" : ""} with videos` +
      `\n- **${items.length - withImage}** frame${(items.length - withImage) !== 1 ? "s" : ""} still need images` +
      `\n\n**Sample prompts:**\n${samples}` +
      `\n\n*Ask the Director for a detailed pacing, shot variety, or consistency review.*`
    );
  }, [storyItems, answerLocally]);

  const handleCreditPill = useCallback((type: "balance" | "framecost" | "cheapest" | "compare") => {
    const bal = creditBalance ?? null;
    const items = (storyItems as any[] | undefined) ?? null;

    if (type === "balance") {
      if (bal === null) { answerLocally("Still loading your credit balance — try again in a moment."); return; }
      const imgBudget = Math.floor(bal / 2);
      const imgStd = Math.floor(bal / 4);
      const vidFast = Math.floor(bal / 8);
      answerLocally(
        `Your current balance is **${bal} credits**.\n\nApproximate capacity:\n- **${imgBudget} images** at budget quality (2cr each)\n- **${imgStd} images** at standard quality (4cr each)\n- **${vidFast} videos** at Seedance Fast (8cr each)`
      );
    } else if (type === "framecost") {
      if (!items) { answerLocally("Still loading storyboard data — try again in a moment."); return; }
      const noImg = items.filter((i: any) => !i.imageUrl && !i.imageStorageId);
      const total = items.length;
      answerLocally(
        `Your project has **${total} frame${total !== 1 ? "s" : ""}** total — **${noImg.length}** without an image yet.\n\nEstimated cost to generate the missing images:\n- Budget model (2cr) → **${noImg.length * 2} credits**\n- Standard model (4cr) → **${noImg.length * 4} credits**${bal !== null ? `\n\nYour balance: **${bal} credits**` : ""}`
      );
    } else if (type === "cheapest") {
      answerLocally(
        `**Most budget-friendly approach:**\n\n- **Flux Lite** — 2cr/image · Fast drafts and layout checks\n- **Standard** — 4cr/image · Good quality for most frames\n- **High quality** — 8cr/image · Hero shots and key scenes\n\nTip: Generate all frames at budget first to validate composition, then re-generate key frames at higher quality.${bal !== null ? `\n\nYour balance: **${bal} credits**` : ""}`
      );
    } else if (type === "compare") {
      answerLocally(
        `**Image vs Video cost:**\n\n**Images**\n- Budget (Flux Lite) · 2cr\n- Standard · 4cr\n- Premium · 8cr\n\n**Videos (5s clip)**\n- Seedance Fast · 8cr\n- Wan 2.1 · 12cr\n- Seedance Pro · 15cr\n\nVideos cost 2–8× more than images. Recommended: generate all images first, then animate only the priority scenes.`
      );
    }
  }, [creditBalance, storyItems, answerLocally]);

  useEffect(() => { setQuickCategory(null); setConfirmingAction(null); }, [mode]);

  const initialMessageSent = useRef<string | null>(null);
  useEffect(() => {
    if (initialMessage && initialMessage !== initialMessageSent.current && !streaming) {
      initialMessageSent.current = initialMessage;
      sendMessage(initialMessage);
    }
  }, [initialMessage, streaming, sendMessage]);

  // ── Quick action categories ──────────────────────────────────────

  const directorCategories = [
    { id: "project", icon: "📋", label: "Storyboard" },
    ...(currentSceneId ? [{ id: "scene", icon: "🎥", label: "This scene" }] : []),
    { id: "frame", icon: "🎬", label: "This frame" },
    { id: "style", icon: "🎨", label: "Style" },
    { id: "improve", icon: "✨", label: "Improve" },
  ];

  const agentCategories = [
    { id: "write", icon: "📝", label: "Write story" },
    { id: "generate", icon: "🖼️", label: "Generate" },
    { id: "credits", icon: "💳", label: "Credits" },
  ];

  type QuickPill = { label: string; prompt?: string; localHandler?: () => void; creditEstimate?: { quick: number; cinematic: number } };

  const directorPills: Record<string, QuickPill[]> = {
    project: [
      { label: "What needs my attention?", prompt: "Assess the current project state. What are the top 3 most important things to work on right now? Surface issues with action buttons for next steps." },
      { label: "What is this storyboard about?", localHandler: () => analyzeStoryboard() },
      { label: "Review shot variety", prompt: "Look at all my frames and check for shot variety. Are there too many similar angles or compositions? Tell me what to change." },
      { label: "Pacing check", prompt: "Review my storyboard for pacing. Are scene durations appropriate? Does the flow feel right? Which scenes need more or fewer frames?" },
      { label: "Consistency check", prompt: "Check my storyboard for visual consistency — do the prompts maintain consistent character descriptions, environment, and style across frames?" },
      { label: "Script help", prompt: "Review my project and help me improve the narrative structure. Are there gaps, pacing issues, or missing scenes?" },
    ],
    scene: [
      { label: "Review this scene's shots", prompt: "Review all frames in the current scene. Are the shot types varied? Do they tell the scene's story effectively? What's missing?" },
      { label: "Shot coverage check", prompt: "Check if the current scene has proper coverage — establishing shot, mid shots, close-ups. List what shot types are present and what's missing." },
      { label: "Continuity in scene", prompt: "Check visual continuity across all frames in the current scene. Do character appearances, lighting, and environment stay consistent frame to frame?" },
      { label: "Generate this scene", prompt: "Generate images for all frames in the current scene that don't have images yet. Show me a plan with credit costs before executing." },
      { label: "Animate this scene", prompt: "Generate videos for all frames in the current scene that have images but no video. Show me the plan with credit costs first." },
    ],
    frame: [
      { label: "What is the current frame about?", localHandler: () => handleCurrentFrameAbout() },
      ...(currentFrameImageUrl
        ? [{ label: "Analyze the current image · 1cr", localHandler: () => analyzeCurrentImage() }]
        : [{ label: "Analyze the current image", localHandler: () => handleCurrentFrameAbout() }]
      ),
      ...(currentFrameNumber && currentFrameNumber > 1 ? [
        { label: "Continuity vs previous frame", prompt: `Compare frame ${currentFrameNumber} with frame ${currentFrameNumber - 1}. Are they visually consistent — same character look, lighting continuity, environment match? What specifically needs fixing?` },
      ] : []),
      { label: "Camera angle advice", prompt: `What's the best camera angle and shot type for frame ${currentFrameNumber}? Consider the scene context and what would be most cinematic.` },
      { label: "Lighting setup", prompt: `Suggest the best lighting setup for frame ${currentFrameNumber}. Consider the mood, time of day, and what would complement the scene.` },
      { label: "What's wrong with this frame?", prompt: `Critically review frame ${currentFrameNumber}. What are the weaknesses in the prompt? What might generate poorly and why? Be specific.` },
      { label: "Add director notes", prompt: `Add director notes to frame ${currentFrameNumber} with production guidance — key things to watch for when generating.` },
    ],
    style: [
      { label: "More dramatic", prompt: "Push all frame prompts toward more dramatic visual language — deeper shadows, higher contrast, intense close framing, weight in every shot. Update the prompts directly." },
      { label: "Brighter & airier", prompt: "Shift the project mood to brighter and more optimistic — soft diffused lighting, warm highlights, open airy compositions. Update the project style." },
      { label: "Grittier & raw", prompt: "Apply a gritty, raw aesthetic — film grain, desaturated palette, harsh practical lighting, tight handheld framing. Update the style and key frame prompts." },
      { label: "Warmer tones", prompt: "Apply a warm color grade across all frames — golden hour lighting, amber and terracotta palette, warm shadow tones. Update the project style prompt." },
      { label: "More cinematic", prompt: "Elevate every frame to true cinematic quality — add specific lens choices (anamorphic 2.39:1, 35mm), precise lighting setups (rembrandt, three-point), and strong composition (rule of thirds, leading lines). Update all prompts." },
      { label: "Noir & moody", prompt: "Transform the visual style to noir — low-key lighting, deep shadows, high contrast, desaturated with selective warm highlights. Update the project style." },
    ],
    improve: [
      { label: "Improve all prompts", prompt: "Look at all my frames and improve the image prompts. Make them more cinematic with specific camera angles, lighting, and composition. Update them directly." },
      { label: "Visual style suggestion", prompt: "Based on my project content, suggest a visual style that would work well — lighting mood, color palette, film stock, lens choice. Update the project style if I approve." },
      { label: "Full storyboard review", prompt: "Review my entire storyboard. Check for shot variety, pacing, continuity issues, and missing coverage. Give specific suggestions for improvement." },
      ...(currentFrameNumber ? [
        { label: "Rewrite this frame's prompt", prompt: `Rewrite frame ${currentFrameNumber}'s image prompt to be more cinematic. Add specific camera angle, lighting, composition, and mood details. Update it directly.` },
      ] : []),
    ],
  };

  const agentPills: Record<string, QuickPill[]> = {
    write: [
      { label: "🐉 Dragon epic · 5 min", prompt: "Write me an epic dragon story, 5 minutes", creditEstimate: { quick: 40, cinematic: 90 } },
      { label: "💕 Romance · 2 min",     prompt: "Write a romantic love story, 2 minutes",   creditEstimate: { quick: 12, cinematic: 36 } },
      { label: "🧒 Kids adventure · 1 min", prompt: "Write a fun kids adventure story, 1 minute", creditEstimate: { quick: 6, cinematic: 18 } },
      { label: "🚀 Sci-fi thriller · 3 min", prompt: "Write a sci-fi thriller, 3 minutes",   creditEstimate: { quick: 24, cinematic: 54 } },
      { label: "🕵️ Mystery · 2 min",    prompt: "Write a mystery thriller, 2 minutes",       creditEstimate: { quick: 12, cinematic: 36 } },
      { label: "🧙 Fantasy · 4 min",    prompt: "Write an epic fantasy adventure, 4 minutes", creditEstimate: { quick: 32, cinematic: 72 } },
    ],
    generate: [
      { label: "⚡ What's next?", prompt: "Assess the current project state and show me what to do next with action buttons." },
      { label: "Generate all images", prompt: "Check my credit balance, then generate images for all frames that don't have images yet. Use the cheapest suitable model. Show me a plan with credit costs before executing." },
      { label: "Animate all frames", prompt: "Generate videos for all frames that have images but no videos. Use Seedance 2.0 Fast for budget. Show me the plan with credit costs first." },
      { label: "Enhance all images", prompt: "Post-process all generated images with the Enhance tool to improve quality. Show me a plan with credit costs before executing." },
      { label: "Smart generate plan", prompt: "Look at my storyboard. Which frames have no image yet? Which ones have images but no video? Suggest the most cost-effective generation plan and execute after approval." },
      { label: "Build full storyboard", prompt: "Build the complete storyboard end-to-end — write the script, create frames, then generate images. Ask me about the story concept first." },
    ],
    credits: [
      { label: "Check my credit balance", localHandler: () => handleCreditPill("balance") },
      { label: "How much for all images?", localHandler: () => handleCreditPill("framecost") },
      { label: "Cheapest way to generate", localHandler: () => handleCreditPill("cheapest") },
      { label: "Image vs video cost", localHandler: () => handleCreditPill("compare") },
    ],
  };

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

        {/* Empty state — identity only */}
        {!hasMessages && (
          <div className="flex flex-col items-center text-center pt-6 pb-2">
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
                ? "Write scripts, generate images, animate frames, and run multi-step plans."
                : currentFrameNumber
                  ? `Frame ${currentFrameNumber} selected. Ask about prompts, camera, and composition.`
                  : "Ask about your storyboard, frames, pacing, and visual style."}
            </p>
            {mode === "director" && !streaming && (
              <button
                onClick={() => sendMessage("Assess the project state. What are the top things I should work on right now? Show me action buttons for next steps.")}
                className="mt-4 px-4 py-1.5 rounded-xl text-[12px] font-medium bg-white/5 border border-(--border-primary) text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/8 hover:border-(--border-secondary) transition-all"
              >
                What needs my attention? →
              </button>
            )}
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
                      ? (() => {
                          const { text, choices } = parseChoices(msg.content);
                          const isLastAssistant = messages.filter(m => m.role === "assistant").at(-1)?.id === msg.id;
                          return (
                            <>
                              {renderMarkdown(text)}
                              {isLastAssistant && !msg.isStreaming && choices.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                  {choices.map((choice, i) => (
                                    <button
                                      key={i}
                                      onClick={() => sendMessage(choice)}
                                      className="text-[11px] px-2.5 py-1 rounded-lg border border-(--border-secondary) bg-(--bg-tertiary) hover:bg-(--accent-blue)/15 hover:border-(--accent-blue)/40 text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer"
                                    >
                                      {choice}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()
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

        {(activeTool || (streaming && !activeTool)) && (
          <div className="flex flex-col gap-1 px-1">
            <div className="flex items-center gap-2 text-[11px] text-amber-400/80">
              <Wrench className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={1.75} />
              <span>{activeTool ? (TOOL_LABELS[activeTool] || `Using ${activeTool}...`) : "Thinking..."}</span>
              {elapsed > 0 && <span className="text-amber-400/50 tabular-nums">{elapsed}s</span>}
            </div>
            {toolProgress ? (
              <p className="text-[10px] text-amber-300/60 pl-5">{toolProgress}</p>
            ) : activeTool === "invoke_skill" ? (
              <p className="text-[10px] text-amber-300/40 pl-5">Keep this panel open — writing script + building frames (~30–90s)</p>
            ) : null}
          </div>
        )}

        {/* Quick action buttons — shown after Director proposes next steps */}
        {quickActions && quickActions.length > 0 && !streaming && (
          <div className="flex flex-wrap gap-2 px-1 pt-1">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => { sendMessage(action.message); setQuickActions(null); }}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                  action.style === "danger"
                    ? "bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20"
                    : action.style === "secondary" || i > 0
                    ? "bg-white/5 text-(--text-secondary) border-(--border-primary) hover:bg-white/10 hover:text-(--text-primary)"
                    : "bg-(--accent-blue)/15 text-(--accent-blue) border-(--accent-blue)/30 hover:bg-(--accent-blue)/25"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Post-generation nudge — surfaces next steps after image/video generation */}
        {postGenNudge && !streaming && (
          <div className="flex flex-col gap-1.5 px-1 pt-1">
            <p className="text-[10px] text-(--text-tertiary) font-medium uppercase tracking-wider">What's next?</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { sendMessage("Animate the frames we just generated. Show me a credit breakdown first."); setPostGenNudge(false); }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border bg-(--accent-teal)/10 text-(--accent-teal) border-(--accent-teal)/25 hover:bg-(--accent-teal)/20"
              >
                Animate these frames
              </button>
              <button
                onClick={() => { sendMessage("Check visual consistency across the frames we just generated — characters, lighting, and environments."); setPostGenNudge(false); }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border bg-white/5 text-(--text-secondary) border-(--border-primary) hover:bg-white/10 hover:text-(--text-primary)"
              >
                Check consistency
              </button>
              <button
                onClick={() => setPostGenNudge(false)}
                className="px-2 py-1.5 text-[11px] text-(--text-tertiary) hover:text-(--text-secondary) transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Agent paywall — shown instead of input when seat not active */}
      {mode === "agent" && agentAccess === false && (
        <div className="border-t border-(--border-primary) px-4 py-4 shrink-0 space-y-3">
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-3 space-y-2">
            <p className="text-[11px] font-semibold text-(--text-primary)">Agent Mode requires a seat</p>
            <p className="text-[12px] text-(--text-secondary) leading-relaxed">
              Trigger image/video generation, write scripts end-to-end, and run multi-step autonomous workflows.
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-(--text-tertiary)">$120 / seat / month</span>
              <a
                href="/dashboard/billing"
                className="px-3 py-1 rounded-md text-[11px] font-medium bg-(--accent-blue)/12 text-(--accent-blue) border border-(--accent-blue)/25 hover:bg-(--accent-blue)/20 transition"
              >
                Upgrade
              </a>
            </div>
          </div>
          <p className="text-[10px] text-(--text-tertiary) text-center">
            AI Director (advisory mode) is free for all Pro+ users.
          </p>
        </div>
      )}

      {/* Input */}
      {(mode !== "agent" || agentAccess !== false) && (
      <div className="border-t border-(--border-primary) px-3 pt-2 pb-3 shrink-0">

        {/* Balloon — category nav + quick actions */}
        <div className="mb-2">
          {confirmingAction ? (
            /* Credit confirm banner */
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 space-y-2">
              <p className="text-[11px] text-(--text-secondary) leading-snug">
                <span className="text-amber-400 font-medium">{confirmingAction.label}</span>
              </p>
              <p className="text-[11px] text-(--text-tertiary)">
                {"This will deduct "}
                <span className="text-amber-300 font-semibold">
                  {confirmingAction.isEstimate ? "~" : ""}{confirmingAction.cost} credit{confirmingAction.cost !== 1 ? "s" : ""}
                </span>
                {creditBalance != null && (
                  <span> from your balance ({creditBalance} cr available)</span>
                )}
                {"."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { confirmingAction.action(); setConfirmingAction(null); setQuickCategory(null); }}
                  className="px-3 py-1 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition"
                >
                  Confirm · {confirmingAction.isEstimate ? "~" : ""}{confirmingAction.cost}cr
                </button>
                <button
                  onClick={() => setConfirmingAction(null)}
                  className="px-3 py-1 rounded-md text-[11px] font-medium bg-(--bg-secondary) text-(--text-tertiary) border border-(--border-primary) hover:text-(--text-secondary) transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : quickCategory === null ? (
            /* Category grid */
            <div className="flex items-center gap-1.5 flex-wrap">
              {(mode === "director" ? directorCategories : agentCategories).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setQuickCategory(cat.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-(--bg-secondary) border-(--border-primary) text-(--text-tertiary) hover:text-(--text-primary) hover:border-(--border-secondary) transition-all"
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
              {/* Script mode toggle inline when in agent mode and no category */}
              {mode === "agent" && (
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => setScriptMode("quick")}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                      scriptMode === "quick"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "border-transparent text-(--text-tertiary) hover:text-(--text-secondary)"
                    }`}
                  >
                    ⚡ Quick
                  </button>
                  <button
                    onClick={() => setScriptMode("cinematic")}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                      scriptMode === "cinematic"
                        ? "bg-(--accent-blue)/15 border-(--accent-blue)/30 text-(--accent-blue)"
                        : "border-transparent text-(--text-tertiary) hover:text-(--text-secondary)"
                    }`}
                  >
                    🎬 Cinematic
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Pills for selected category */
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuickCategory(null)}
                  className="flex items-center gap-1 text-[11px] text-(--text-tertiary) hover:text-(--text-secondary) transition"
                >
                  ← Home
                </button>
                <span className="text-[11px] text-(--text-tertiary)">·</span>
                <span className="text-[11px] text-(--text-tertiary)">
                  {[...directorCategories, ...agentCategories].find(c => c.id === quickCategory)?.icon}{" "}
                  {[...directorCategories, ...agentCategories].find(c => c.id === quickCategory)?.label}
                </span>
                {/* Script mode toggle for write category */}
                {mode === "agent" && quickCategory === "write" && (
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => setScriptMode("quick")}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                        scriptMode === "quick"
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : "border-transparent text-(--text-tertiary) hover:text-(--text-secondary)"
                      }`}
                    >
                      ⚡ Quick
                    </button>
                    <button
                      onClick={() => setScriptMode("cinematic")}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                        scriptMode === "cinematic"
                          ? "bg-(--accent-blue)/15 border-(--accent-blue)/30 text-(--accent-blue)"
                          : "border-transparent text-(--text-tertiary) hover:text-(--text-secondary)"
                      }`}
                    >
                      🎬 Cinematic
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto">
                {(mode === "director" ? directorPills[quickCategory] : agentPills[quickCategory])?.map((pill) => (
                  <button
                    key={pill.label}
                    onClick={() => {
                      if (pill.creditEstimate) {
                        const cost = scriptMode === "cinematic" ? pill.creditEstimate.cinematic : pill.creditEstimate.quick;
                        setConfirmingAction({
                          label: `${pill.label} · ${scriptMode === "cinematic" ? "Cinematic" : "Quick"} mode`,
                          cost,
                          isEstimate: true,
                          action: async () => { sendMessage(pill.prompt!); setQuickCategory(null); },
                        });
                      } else if (pill.localHandler) {
                        pill.localHandler();
                      } else if (pill.prompt) {
                        sendMessage(pill.prompt);
                        setQuickCategory(null);
                      }
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] bg-(--bg-secondary) border border-(--border-primary) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-secondary) transition-all text-left"
                  >
                    {pill.label}
                    {pill.creditEstimate && (
                      <span className="ml-1 text-amber-400/70 text-[10px]">
                        · {scriptMode === "cinematic" ? pill.creditEstimate.cinematic : pill.creditEstimate.quick}cr
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
              className="p-2.5 rounded-xl bg-(--accent-blue)/12 text-(--accent-blue) hover:bg-(--accent-blue)/20 border border-(--accent-blue)/20 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
              title={!input.trim() ? "Type a message to send" : "Send"}
            >
              <Send className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
