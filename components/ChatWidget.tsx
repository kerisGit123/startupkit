"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatWidgetProps {
  type: "frontend" | "user_panel";
  userId?: string;
}

export function ChatWidget({ type, userId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [interventionRequested, setInterventionRequested] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = useQuery(api.chatbot.getConfig, { type });

  useEffect(() => {
    // Generate or retrieve session ID
    const storedSessionId = sessionStorage.getItem(`chatbot_session_${type}`);
    if (storedSessionId) {
      setSessionId(storedSessionId);
      // TODO: Load conversation history from database
    } else {
      const newSessionId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      sessionStorage.setItem(`chatbot_session_${type}`, newSessionId);
    }
  }, [type]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Auto-focus input after messages are received
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

  // Don't render if chatbot is not active
  if (!config?.isActive) return null;

  const requestIntervention = async () => {
    setInterventionRequested(true);
    const systemMessage = {
      role: "assistant" as const,
      content: "An agent will join shortly. Average wait time is 2-3 minutes.",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, systemMessage]);
    // TODO: Update conversation status in database
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // TODO: Upload to Convex storage and get URL
    // For now, create a local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageMessage = {
        role: "user" as const,
        content: "[Image]",
        timestamp: Date.now(),
        imageUrl: event.target?.result as string,
      };
      setMessages((prev) => [...prev, imageMessage]);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!input.trim() || !config?.n8nWebhookUrl || isLoading) return;

    // Check if lead capture should be triggered
    if (messages.length >= 3 && !showLeadCapture) {
      // TODO: Check lead capture config from database
      // setShowLeadCapture(true);
      // return;
    }

    const userMessage = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          n8nWebhookUrl: config.n8nWebhookUrl,
          chatId: sessionId,
          message: input,
          route: type,
          userId: userId || null,
        }),
      });

      const data = await response.json();

      const botMessage = {
        role: "assistant",
        content: data.output || "Sorry, I couldn't understand that.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please check your n8n webhook URL and ensure the workflow is active.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus input after response
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const borderRadius = `${config?.roundness || 12}px`;
  const position = config?.position || "right";

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50 transition-transform hover:scale-110"
          style={{
            [position]: "20px",
            backgroundColor: config?.primaryColor || "#854fff",
            borderRadius: borderRadius,
          }}
        >
          <span className="text-2xl">💬</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-5 w-[350px] h-[500px] flex flex-col shadow-2xl z-50"
          style={{
            [position]: "20px",
            backgroundColor: config?.backgroundColor || "#ffffff",
            borderRadius: borderRadius,
          }}
        >
          {/* Header */}
          <div
            className="p-4 text-white flex justify-between items-center"
            style={{
              backgroundColor: config?.primaryColor || "#854fff",
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
            }}
          >
            <div className="flex items-center gap-2">
              {config?.showCompanyLogo && config?.companyLogoUrl && (
                <img
                  src={config.companyLogoUrl}
                  alt="Logo"
                  className="w-8 h-8 rounded"
                />
              )}
              <div>
                <p className="font-semibold">{config?.companyName || "Chat Support"}</p>
                {config?.showResponseTime && (
                  <p className="text-xs opacity-90">
                    {config?.responseTimeText || "We typically respond right away"}
                  </p>
                )}
              </div>
            </div>
            
            <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-80">
              ✖
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: config?.backgroundColor || "#ffffff" }}>
            <div className="mb-4 text-center">
              <p className="font-semibold" style={{ color: config?.textColor || "#333" }}>
                {config?.welcomeMessage || "Hi 👋, how can we help?"}
              </p>
            </div>

            {messages.length === 0 && config?.firstBotMessage && (
              <div className="flex justify-start mb-3">
                <div
                  className="max-w-[80%] p-3 rounded-lg"
                  style={{
                    backgroundColor: config?.aiMessageBgColor || "#f1f1f1",
                    color: config?.aiTextColor || "#333333",
                    border: `1px solid ${config?.aiBorderColor || "#e0e0e0"}`,
                    borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                  }}
                >
                  {config.firstBotMessage}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%]">
                  {(msg as any).imageUrl ? (
                    <img
                      src={(msg as any).imageUrl}
                      alt="Uploaded"
                      className="rounded-lg shadow max-w-full"
                      style={{
                        borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                      }}
                    />
                  ) : (
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor:
                          msg.role === "user"
                            ? config?.userMessageBgColor || config?.primaryColor || "#854fff"
                            : config?.aiMessageBgColor || "#f1f1f1",
                        color:
                          msg.role === "user"
                            ? config?.userMessageTextColor || "#ffffff"
                            : config?.aiTextColor || "#333333",
                        border:
                          msg.role === "assistant"
                            ? `1px solid ${config?.aiBorderColor || "#e0e0e0"}`
                            : "none",
                        borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                      }}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && config?.enableTypingIndicator && (
              <div className="flex justify-start">
                <div
                  className="p-3 rounded-lg flex gap-1"
                  style={{
                    backgroundColor: config?.aiMessageBgColor || "#f1f1f1",
                    borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                  }}
                >
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Agent Intervention Button */}
          {!interventionRequested && (
            <div className="px-4 pb-2">
              <button
                onClick={requestIntervention}
                className="w-full py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                style={{
                  borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                  borderColor: config?.aiBorderColor || "#e0e0e0",
                  color: config?.textColor || "#333",
                }}
              >
                💬 Talk to Agent
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: config?.aiBorderColor || "#e0e0e0" }}>
            <div className="flex gap-2 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 px-3 py-2 border rounded-lg hover:bg-gray-50"
                style={{
                  borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                  borderColor: config?.aiBorderColor || "#e0e0e0",
                }}
                title="Upload image"
              >
                📷
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={config?.placeholderText || "Type your message..."}
                className="flex-1 min-w-0 px-3 py-2 border rounded-lg outline-none"
                style={{
                  borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                  borderColor: config?.aiBorderColor || "#e0e0e0",
                  color: config?.textColor || "#000000",
                  backgroundColor: "#ffffff",
                }}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="flex-shrink-0 px-4 py-2 text-white rounded-lg disabled:opacity-50 whitespace-nowrap"
                style={{
                  backgroundColor: config?.primaryColor || "#854fff",
                  borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
