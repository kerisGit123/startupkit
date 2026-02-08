"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface QuickReply {
  label: string;
  value: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "admin";
  content: string;
  timestamp: number;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  messageType?: "text" | "image" | "file" | "system";
  quickReplies?: QuickReply[];
  senderId?: string;
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = useQuery(api.chatbot.getConfig, { type });

  // Fetch logged-in user info (for user_panel type) so chatbot won't ask for email
  const loggedInUser = useQuery(
    api.users.getUserByClerkId,
    type === "user_panel" && userId ? { clerkUserId: userId } : "skip"
  );

  // Subscribe to conversation for real-time admin messages
  const conversation = useQuery(
    api.chatbot.getConversationBySession,
    sessionId ? { sessionId } : "skip"
  );

  useEffect(() => {
    // Generate or retrieve session ID
    const storedSessionId = sessionStorage.getItem(`chatbot_session_${type}`);
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      sessionStorage.setItem(`chatbot_session_${type}`, newSessionId);
    }
  }, [type]);

  // Detect new admin messages from real-time Convex subscription
  useEffect(() => {
    if (!conversation?.messages) return;

    const adminMessages = conversation.messages.filter(
      (m) => m.role === "admin"
    );

    // Check if there are admin messages not yet in local state
    const localAdminCount = messages.filter((m) => m.role === "admin").length;
    if (adminMessages.length > localAdminCount) {
      const newAdminMsgs = adminMessages.slice(localAdminCount);
      const chatMsgs: ChatMessage[] = newAdminMsgs.map((m) => ({
        role: "admin" as const,
        content: m.content,
        timestamp: m.timestamp,
        senderId: m.senderId,
      }));

      // If this is the first admin message, also show a system notice
      if (localAdminCount === 0 && newAdminMsgs.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "A support agent has joined the conversation.",
            timestamp: Date.now() - 1,
            messageType: "system",
          },
          ...chatMsgs,
        ]);
      } else {
        setMessages((prev) => [...prev, ...chatMsgs]);
      }
    }
  }, [conversation?.messages]);

  // Detect admin-triggered rating request
  useEffect(() => {
    if (conversation?.ratingRequested && !showRating && !ratingSubmitted && !conversation?.rating) {
      setShowRating(true);
    }
  }, [conversation?.ratingRequested, conversation?.rating, showRating, ratingSubmitted]);

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

    // Store escalation in Convex and create inbox entry
    try {
      await fetch("/api/chat/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          type,
          userId: userId || undefined,
          lastMessages: messages.slice(-4).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      console.log("\u2705 Escalation stored");
    } catch (error) {
      console.error("Escalation error:", error);
    }
  };

  // Detect if the AI response indicates conversation is ending
  const isConversationEnding = (aiResponse: string): boolean => {
    const endPhrases = [
      "glad i could help", "happy to help", "anything else",
      "is there anything else", "have a great day", "have a good day",
      "take care", "goodbye", "bye for now", "talk to you soon",
      "thanks for chatting", "thank you for chatting",
      "feel free to reach out", "don't hesitate to reach out",
      "was there anything else", "let me know if you need",
    ];
    const lower = aiResponse.toLowerCase();
    return endPhrases.some(phrase => lower.includes(phrase));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);
      formData.append("type", type);
      if (userId) formData.append("userId", userId);

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const fileMessage: ChatMessage = {
          role: "user",
          content: `Sent a file: ${data.fileName}`,
          timestamp: Date.now(),
          fileName: data.fileName,
          fileType: data.fileType,
          fileUrl: data.fileUrl,
          messageType: "file",
        };
        setMessages((prev) => [...prev, fileMessage]);

        // Show confirmation
        const confirmMessage: ChatMessage = {
          role: "assistant",
          content: "Thank you for sending the file. Our support team will review it shortly.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, confirmMessage]);
      } else {
        alert(data.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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

    // If admin has taken over OR conversation is escalated, send message directly to Convex
    // This prevents AI from replying after user clicks "talk to agent"
    const isAgentMode = conversation?.status === "admin_takeover" || 
                        conversation?.status === "escalated" || 
                        interventionRequested;

    if (isAgentMode && conversation?._id) {
      try {
        // Store user message in conversation directly (bypass n8n)
        await fetch("/api/chat/user-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversation._id,
            message: input,
            sessionId,
          }),
        });
      } catch (error) {
        console.error("Error sending message to agent:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      return;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          n8nWebhookUrl: config.n8nWebhookUrl,
          chatId: sessionId,
          message: input,
          route: type,
          type: type,
          userId: userId || undefined,
          userEmail: loggedInUser?.email || undefined,
          userName: loggedInUser?.name || undefined,
        }),
      });

      const data = await response.json();

      const botMessage: ChatMessage = {
        role: "assistant",
        content: data.output || "Sorry, I couldn't understand that.",
        timestamp: Date.now(),
        quickReplies: data.quickReplies,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Show rating only when conversation naturally ends AND user has exchanged enough messages
      const userMessageCount = messages.filter(m => m.role === "user").length + 1; // +1 for current
      if (!ratingSubmitted && !showRating && userMessageCount >= 3 && isConversationEnding(data.output || "")) {
        setTimeout(() => setShowRating(true), 2000);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please check your n8n webhook URL and ensure the workflow is active.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickReply = async (value: string) => {
    setInput(value);
    // Auto-send the quick reply
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.value = value;
        sendMessage();
      }
    }, 100);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const submitRating = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      console.log("Submitting rating:", { sessionId, rating, hasComment: !!ratingComment });
      
      const response = await fetch("/api/chat/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          rating,
          comment: ratingComment,
        }),
      });

      const data = await response.json();
      console.log("Rating response:", data);

      if (response.ok) {
        setShowRating(false);
        setRating(0);
        setRatingComment("");
        setRatingSubmitted(true);
        
        const thankYouMsg: ChatMessage = {
          role: "assistant",
          content: "Thank you for your feedback! \ud83d\ude4f Your rating has been saved.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, thankYouMsg]);
        console.log("\u2705 Rating submitted successfully");
      } else {
        console.error("❌ Rating submission failed:", data.error);
        alert("Failed to submit rating. Please try again.");
      }
    } catch (error) {
      console.error("❌ Rating error:", error);
      alert("Failed to submit rating. Please try again.");
    }
  };

  const commonEmojis = ["😊", "👍", "❤️", "😂", "🙏", "👋", "🎉", "🔥", "💯", "✅"];

  const borderRadius = `${config?.roundness || 12}px`;
  const position = config?.position || "right";

  // Resolve effective colors based on theme (dark/light/auto)
  const isDark = config?.theme === "dark" || (config?.theme === "auto" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const ePrimary = isDark ? (config?.darkPrimaryColor || "#818cf8") : (config?.primaryColor || "#854fff");
  const eBg = isDark ? (config?.darkBackgroundColor || "#1f2937") : (config?.backgroundColor || "#ffffff");
  const eText = isDark ? (config?.darkTextColor || "#f9fafb") : (config?.textColor || "#333333");
  const eUserMsgText = isDark ? (config?.darkUserMessageTextColor || "#ffffff") : (config?.userMessageTextColor || "#ffffff");
  const eAiMsgBg = isDark ? (config?.darkAiMessageBgColor || "#374151") : (config?.aiMessageBgColor || "#f1f1f1");
  const eAiBorder = isDark ? (config?.darkAiBorderColor || "#4b5563") : (config?.aiBorderColor || "#e0e0e0");
  const eAiText = isDark ? (config?.darkAiTextColor || "#e5e7eb") : (config?.aiTextColor || "#333333");
  const eInputBg = isDark ? "#374151" : "#ffffff";
  const eInputText = isDark ? "#f9fafb" : "#000000";

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50 transition-transform hover:scale-110"
          style={{
            [position]: "20px",
            backgroundColor: ePrimary,
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
            backgroundColor: eBg,
            borderRadius: borderRadius,
          }}
        >
          {/* Header */}
          <div
            className="p-4 text-white flex justify-between items-center"
            style={{
              backgroundColor: ePrimary,
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
          <div className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: eBg }}>
            <div className="mb-4 text-center">
              <p className="font-semibold" style={{ color: eText }}>
                {config?.welcomeMessage || "Hi 👋, how can we help?"}
              </p>
            </div>

            {messages.length === 0 && config?.firstBotMessage && (
              <div className="flex justify-start mb-3">
                <div
                  className="max-w-[80%] p-3 rounded-lg"
                  style={{
                    backgroundColor: eAiMsgBg,
                    color: eAiText,
                    border: `1px solid ${eAiBorder}`,
                    borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                  }}
                >
                  {config.firstBotMessage}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.messageType === "system" && (
                    <div className="w-full text-center text-xs text-gray-400 py-1">
                      {msg.content}
                    </div>
                  )}
                  {msg.messageType !== "system" && (
                  <div className="max-w-[80%]">
                    {msg.messageType === "file" && msg.fileType?.startsWith("image/") ? (
                      <div>
                        <img
                          src={msg.fileUrl || msg.imageUrl || ""}
                          alt={msg.fileName || "Image"}
                          className="rounded-lg shadow max-w-full cursor-pointer"
                          style={{ borderRadius: `${(config?.roundness || 12) * 0.8}px`, maxHeight: "200px" }}
                          onClick={() => window.open(msg.fileUrl || msg.imageUrl, "_blank")}
                        />
                        <p className="text-[10px] mt-1 opacity-60">{msg.fileName}</p>
                      </div>
                    ) : msg.messageType === "file" ? (
                      <div
                        className="p-3 rounded-lg flex items-center gap-2"
                        style={{
                          backgroundColor: config?.userMessageBgColor || config?.primaryColor || "#854fff",
                          color: config?.userMessageTextColor || "#ffffff",
                          borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                        }}
                      >
                        <span>📎</span>
                        <span className="text-sm">{msg.fileName}</span>
                      </div>
                    ) : msg.imageUrl ? (
                      <img
                        src={msg.imageUrl}
                        alt="Uploaded"
                        className="rounded-lg shadow max-w-full"
                        style={{ borderRadius: `${(config?.roundness || 12) * 0.8}px` }}
                      />
                    ) : (
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor:
                            msg.role === "user"
                              ? ePrimary
                              : msg.role === "admin"
                                ? (isDark ? "#1e3a5f" : "#e8f4fd")
                                : eAiMsgBg,
                          color:
                            msg.role === "user"
                              ? eUserMsgText
                              : msg.role === "admin"
                                ? (isDark ? "#93c5fd" : "#1a5276")
                                : eAiText,
                          border:
                            msg.role === "admin"
                              ? (isDark ? "1px solid #3b82f6" : "1px solid #85c1e9")
                              : msg.role === "assistant"
                                ? `1px solid ${eAiBorder}`
                                : "none",
                          borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                        }}
                      >
                        {msg.role === "admin" && (
                          <p className="text-[10px] font-semibold mb-1 opacity-70">🧑‍💼 {msg.senderId || "Support Agent"}</p>
                        )}
                        {msg.content}
                      </div>
                    )}
                  </div>
                  )}
                </div>
                
                {/* Quick Reply Buttons */}
                {msg.quickReplies && msg.quickReplies.length > 0 && idx === messages.length - 1 && (
                  <div className="mb-3 flex flex-wrap gap-2 justify-start">
                    {msg.quickReplies.map((reply, replyIdx) => (
                      <button
                        key={replyIdx}
                        onClick={() => handleQuickReply(reply.value)}
                        className="px-4 py-2 text-sm border rounded-full hover:bg-gray-50 transition-colors"
                        style={{
                          borderRadius: `${(config?.roundness || 12) * 1.5}px`,
                          borderColor: ePrimary,
                          color: ePrimary,
                          backgroundColor: eInputBg,
                        }}
                      >
                        {reply.label}
                      </button>
                    ))}
                  </div>
                )}
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

            {/* Rating Dialog - inside scrollable area */}
            {showRating && (
              <div className="mb-3">
                <div
                  className="p-4 border rounded-lg"
                  style={{
                    borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                    borderColor: eAiBorder,
                    backgroundColor: isDark ? "#374151" : "#f9fafb",
                  }}
                >
                  <p className="text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>
                    How was your experience?
                  </p>
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-2xl hover:scale-110 transition-transform"
                        style={{ color: star <= rating ? "#f59e0b" : "#9ca3af" }}
                      >
                        {star <= rating ? "★" : "☆"}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Any comments? (optional)"
                    className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                    style={{
                      borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                      borderColor: config?.aiBorderColor || "#e0e0e0",
                      color: "#1a1a1a",
                      backgroundColor: "#ffffff",
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={submitRating}
                      className="flex-1 py-2 text-sm text-white rounded-lg"
                      style={{
                        backgroundColor: ePrimary,
                        borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                      }}
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setShowRating(false)}
                      className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                      style={{
                        borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                        borderColor: config?.aiBorderColor || "#e0e0e0",
                        color: "#374151",
                      }}
                    >
                      Skip
                    </button>
                  </div>
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
                className="w-full py-2 text-sm border rounded-lg transition-colors"
                style={{
                  borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                  borderColor: eAiBorder,
                  color: eText,
                  backgroundColor: eInputBg,
                }}
              >
                💬 Talk to Agent
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t relative" style={{ borderColor: eAiBorder }}>
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div
                className="absolute bottom-full left-3 mb-2 p-2 border rounded-lg shadow-lg"
                style={{
                  borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                  borderColor: eAiBorder,
                  backgroundColor: eInputBg,
                }}
              >
                <div className="flex gap-2 flex-wrap max-w-[200px]">
                  {commonEmojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-2xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="*/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 px-3 py-2 border rounded-lg transition-colors"
                style={{
                  borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                  borderColor: eAiBorder,
                  backgroundColor: eInputBg,
                  color: eInputText,
                }}
                title="Upload file"
                disabled={isLoading}
              >
                📎
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex-shrink-0 px-3 py-2 border rounded-lg transition-colors"
                style={{
                  borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                  borderColor: eAiBorder,
                  backgroundColor: eInputBg,
                  color: eInputText,
                }}
                title="Add emoji"
              >
                😊
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
                  borderColor: eAiBorder,
                  color: eInputText,
                  backgroundColor: eInputBg,
                }}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="flex-shrink-0 px-4 py-2 text-white rounded-lg disabled:opacity-50 whitespace-nowrap"
                style={{
                  backgroundColor: ePrimary,
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
