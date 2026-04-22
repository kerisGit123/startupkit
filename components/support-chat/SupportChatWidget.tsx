"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageCircle, X, Send, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Tiny inline markdown renderer: bold (**x**), italic (*x*), and [text](url).
// No block-level support. Newlines are preserved by whitespace-pre-wrap in the
// parent container.
const INLINE_TOKEN_RE =
  /\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      parsed.protocol === "mailto:"
    );
  } catch {
    return false;
  }
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let key = 0;
  const re = new RegExp(INLINE_TOKEN_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) {
      nodes.push(
        <Fragment key={`t${key++}`}>{text.slice(lastIdx, m.index)}</Fragment>
      );
    }
    if (m[1] !== undefined) {
      nodes.push(<strong key={`b${key++}`}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      nodes.push(<em key={`i${key++}`}>{m[2]}</em>);
    } else if (m[3] !== undefined && m[4] !== undefined) {
      const url = m[4];
      if (isSafeUrl(url)) {
        nodes.push(
          <a
            key={`l${key++}`}
            href={url}
            target={url.startsWith("/") || url.startsWith("#") ? undefined : "_blank"}
            rel="noreferrer noopener"
            className="underline underline-offset-2 hover:opacity-80"
          >
            {m[3]}
          </a>
        );
      } else {
        nodes.push(<Fragment key={`u${key++}`}>{m[0]}</Fragment>);
      }
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    nodes.push(<Fragment key={`t${key++}`}>{text.slice(lastIdx)}</Fragment>);
  }
  return nodes;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
}

interface SupportChatWidgetProps {
  variant: "landing" | "studio";
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function SupportChatWidget({ variant }: SupportChatWidgetProps) {
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, activeTool]);

  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setSessionId(null);
    setStreaming(false);
    setActiveTool(null);
    setInput("");
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    const userMsgId = uid();
    const assistantMsgId = uid();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: trimmed },
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        isStreaming: true,
      },
    ]);
    setInput("");
    setStreaming(true);
    setActiveTool(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const clientHistory = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          variant,
          sessionId: sessionId ?? undefined,
          clientHistory,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        const json = await res.json().catch(() => null);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    json?.message ??
                    "You've hit the chat limit for this hour. Please try again later.",
                  isStreaming: false,
                  isError: true,
                }
              : m
          )
        );
        return;
      }

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `Something went wrong. ${txt || ""}`.trim(),
                  isStreaming: false,
                  isError: true,
                }
              : m
          )
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          let event: {
            type: string;
            delta?: string;
            sessionId?: string;
            name?: string;
            isError?: boolean;
            message?: string;
          };
          try {
            event = JSON.parse(payload);
          } catch {
            continue;
          }

          if (event.type === "session" && event.sessionId) {
            setSessionId(event.sessionId);
          } else if (event.type === "text" && event.delta) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + event.delta }
                  : m
              )
            );
            setActiveTool(null);
          } else if (event.type === "tool_call" && event.name) {
            setActiveTool(event.name);
          } else if (event.type === "tool_result") {
            setActiveTool(null);
          } else if (event.type === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        m.content ||
                        event.message ||
                        "Sorry, something went wrong.",
                      isStreaming: false,
                      isError: true,
                    }
                  : m
              )
            );
          } else if (event.type === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              )
            );
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  "Connection error. Please check your network and try again.",
                isStreaming: false,
                isError: true,
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
      setActiveTool(null);
      abortRef.current = null;
    }
  }, [input, messages, sessionId, streaming, variant]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        aria-label={open ? "Close support chat" : "Open support chat"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-primary text-primary-foreground hover:scale-105 active:scale-95",
          open && "rotate-90"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-24 right-5 z-[70] flex w-[calc(100vw-2.5rem)] max-w-[400px] flex-col overflow-hidden rounded-xl border shadow-2xl",
            "h-[min(600px,calc(100vh-8rem))] bg-background"
          )}
          role="dialog"
          aria-label="Storytica support chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Storytica Support</div>
              <div className="text-xs text-muted-foreground">
                {isSignedIn
                  ? "Ask about your account, credits, or generations"
                  : "Ask about features or pricing"}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={resetChat}
                disabled={streaming || messages.length === 0}
                title="New conversation"
                className="h-8 w-8"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                title="Close"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm"
          >
            {messages.length === 0 && (
              <div className="pt-8 text-center text-muted-foreground">
                <MessageCircle className="mx-auto mb-3 h-8 w-8 opacity-40" />
                <p className="mb-2 font-medium">How can I help?</p>
                <p className="text-xs">
                  {isSignedIn
                    ? "Try: “How many credits do I have?”, “What plan am I on?”, or “Why did my video fail?”"
                    : "Try: “What does Storytica do?”, “How does pricing work?”, or “Is there a free plan?”"}
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : m.isError
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-foreground"
                  )}
                >
                  {m.content ? (
                    m.role === "assistant" && !m.isError ? (
                      renderInlineMarkdown(m.content)
                    ) : (
                      m.content
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Thinking…</span>
                    </span>
                  )}
                </div>
              </div>
            ))}

            {activeTool && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Looking up {formatToolName(activeTool)}…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  streaming ? "Waiting for reply…" : "Type your question…"
                }
                rows={2}
                disabled={streaming}
                className={cn(
                  "flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:opacity-60"
                )}
                maxLength={4000}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={streaming || !input.trim()}
                className="h-10 w-10 shrink-0"
              >
                {streaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-1.5 text-[10px] text-muted-foreground">
              Powered by Claude Haiku · Enter to send, Shift+Enter for newline
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatToolName(tool: string): string {
  const map: Record<string, string> = {
    get_my_profile: "your profile",
    get_my_subscription: "your subscription",
    get_my_credit_balance: "your credit balance",
    list_my_credit_transactions: "your credit history",
    get_ai_model_pricing: "pricing info",
    list_my_recent_generations: "your recent generations",
    get_generation_details: "generation details",
    list_my_invoices: "your invoices",
    list_my_support_tickets: "your support tickets",
    create_support_ticket: "creating a ticket",
  };
  return map[tool] ?? tool.replace(/_/g, " ");
}
