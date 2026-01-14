"use client";

interface WidgetPreviewProps {
  config: any;
}

export function WidgetPreview({ config }: WidgetPreviewProps) {
  const theme = config?.theme || "light";
  const position = config?.position || "right";
  const primaryColor = config?.primaryColor || "#6366f1";
  const backgroundColor = config?.backgroundColor || "#ffffff";
  const textColor = config?.textColor || "#333333";
  const userMessageBgColor = config?.userMessageBgColor || "#6366f1";
  const userMessageTextColor = config?.userMessageTextColor || "#ffffff";
  const aiMessageBgColor = config?.aiMessageBgColor || "#f3f4f6";
  const aiMessageTextColor = config?.aiMessageTextColor || "#333333";
  const aiBorderColor = config?.aiBorderColor || "#e5e7eb";
  const companyName = config?.companyName || "Your Company";
  const logoUrl = config?.companyLogoUrl;
  const welcomeMessage = config?.welcomeMessage || "Hi 👋, how can we help?";
  const responseTimeText = config?.responseTimeText || "We typically respond right away";
  const firstBotMessage = config?.firstBotMessage || "Hi there! How can we help today?";
  const showThemeToggle = config?.showThemeToggle ?? true;
  const showCompanyLogo = config?.showCompanyLogo ?? true;
  const showResponseTime = config?.showResponseTime ?? true;
  const roundness = config?.roundness || 12;

  // Apply dark theme colors if theme is dark
  const isDark = theme === "dark";
  const effectivePrimaryColor = isDark ? (config?.darkPrimaryColor || "#818cf8") : primaryColor;
  const effectiveBackgroundColor = isDark ? (config?.darkBackgroundColor || "#1f2937") : backgroundColor;
  const effectiveTextColor = isDark ? (config?.darkTextColor || "#f9fafb") : textColor;
  const effectiveAiMessageBgColor = isDark ? (config?.darkAiMessageBgColor || "#374151") : aiMessageBgColor;
  const effectiveUserMessageTextColor = isDark ? (config?.darkUserMessageTextColor || "#ffffff") : userMessageTextColor;
  const effectiveAiBorderColor = isDark ? (config?.darkAiBorderColor || "#4b5563") : aiBorderColor;
  const effectiveAiTextColor = isDark ? (config?.darkAiTextColor || "#e5e7eb") : (config?.aiTextColor || "#666666");

  return (
    <div className={`flex items-end min-h-[600px] bg-gray-100 rounded-lg p-8 ${position === "left" ? "justify-start" : "justify-end"}`}>
      <div 
        className="w-full max-w-sm shadow-2xl overflow-hidden"
        style={{ 
          backgroundColor: effectiveBackgroundColor,
          borderRadius: `${roundness}px`
        }}
      >
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between"
          style={{ backgroundColor: effectivePrimaryColor }}
        >
          <div className="flex items-center gap-3">
            {showCompanyLogo && logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full bg-white object-cover" />
            )}
            <div>
              <h3 className="font-semibold text-white text-sm">
                {companyName}
              </h3>
              {showThemeToggle && theme === "auto" && (
                <p className="text-xs text-white/80">{isDark ? "🌙 Dark" : "☀️ Light"}</p>
              )}
            </div>
          </div>
          <button className="text-white hover:bg-white/10 rounded p-1">✕</button>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
          {/* Welcome Message */}
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: effectiveTextColor }}>
              {welcomeMessage}
            </p>
            {showResponseTime && (
              <p className="text-xs mt-1 opacity-60" style={{ color: effectiveTextColor }}>
                {responseTimeText}
              </p>
            )}
          </div>

          {/* AI Message */}
          <div className="flex gap-2">
            <div 
              className="p-3 max-w-[80%]"
              style={{ 
                backgroundColor: effectiveAiMessageBgColor,
                borderColor: effectiveAiBorderColor,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: `${roundness}px`
              }}
            >
              <p className="text-sm" style={{ color: effectiveAiTextColor }}>
                {firstBotMessage}
              </p>
            </div>
          </div>

          {/* User Message Example */}
          <div className="flex gap-2 justify-end">
            <div 
              className="p-3 max-w-[80%]"
              style={{ 
                backgroundColor: userMessageBgColor,
                borderRadius: `${roundness}px`
              }}
            >
              <p className="text-sm" style={{ color: effectiveUserMessageTextColor }}>
                I need help with my account
              </p>
            </div>
          </div>

          {/* AI Response Example */}
          <div className="flex gap-2">
            <div 
              className="p-3 max-w-[80%]"
              style={{ 
                backgroundColor: effectiveAiMessageBgColor,
                borderColor: effectiveAiBorderColor,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: `${roundness}px`
              }}
            >
              <p className="text-sm" style={{ color: effectiveAiTextColor }}>
                I&apos;d be happy to help you with your account! What specific issue are you experiencing?
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: effectiveAiBorderColor }}>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 text-sm border focus:outline-none focus:ring-2"
              style={{ 
                borderColor: effectiveAiBorderColor,
                color: effectiveTextColor,
                backgroundColor: effectiveBackgroundColor,
                borderRadius: `${roundness}px`
              }}
              disabled
            />
            <button
              className="px-4 py-2 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ 
                backgroundColor: effectivePrimaryColor,
                borderRadius: `${roundness}px`
              }}
              disabled
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
