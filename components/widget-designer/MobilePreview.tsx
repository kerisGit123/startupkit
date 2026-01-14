"use client";

interface MobilePreviewProps {
  config: any;
}

export function MobilePreview({ config }: MobilePreviewProps) {
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
  const firstBotMessage = config?.firstBotMessage || "Hi there! How can we help today?";
  const showCompanyLogo = config?.showCompanyLogo ?? true;

  return (
    <div className="flex items-center justify-center min-h-[600px] bg-gray-100 rounded-lg p-4">
      {/* Mobile Frame */}
      <div className="relative w-[375px] h-[667px] bg-black rounded-[3rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
        
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col">
          {/* Mobile Status Bar */}
          <div className="h-12 bg-gray-50 flex items-center justify-between px-6 text-xs">
            <span>9:41</span>
            <div className="flex gap-1">
              <span>📶</span>
              <span>📡</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Chat Widget - Full Screen on Mobile */}
          <div className="flex-1 flex flex-col" style={{ backgroundColor }}>
            {/* Header */}
            <div 
              className="p-4 flex items-center justify-between shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                {showCompanyLogo && logoUrl && (
                  <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full bg-white object-cover" />
                )}
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    {companyName}
                  </h3>
                  <p className="text-xs text-white/80">Online</p>
                </div>
              </div>
              <button className="text-white hover:bg-white/10 rounded p-1">✕</button>
            </div>

            {/* Messages - Scrollable */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {/* Welcome Message */}
              <div className="text-center py-4">
                <p className="text-sm font-medium" style={{ color: textColor }}>
                  {welcomeMessage}
                </p>
              </div>

              {/* AI Message */}
              <div className="flex gap-2">
                <div 
                  className="rounded-2xl p-3 max-w-[75%]"
                  style={{ 
                    backgroundColor: aiMessageBgColor,
                    borderColor: aiBorderColor,
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                >
                  <p className="text-sm" style={{ color: aiMessageTextColor }}>
                    {firstBotMessage}
                  </p>
                </div>
              </div>

              {/* User Message Example */}
              <div className="flex gap-2 justify-end">
                <div 
                  className="rounded-2xl p-3 max-w-[75%]"
                  style={{ backgroundColor: userMessageBgColor }}
                >
                  <p className="text-sm" style={{ color: userMessageTextColor }}>
                    I need help
                  </p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex gap-2">
                <div 
                  className="rounded-2xl p-3 max-w-[75%]"
                  style={{ 
                    backgroundColor: aiMessageBgColor,
                    borderColor: aiBorderColor,
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                >
                  <p className="text-sm" style={{ color: aiMessageTextColor }}>
                    I&apos;d be happy to help! What can I assist you with?
                  </p>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2 items-center">
                <button className="p-2 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-full text-sm border focus:outline-none"
                  style={{ 
                    borderColor: aiBorderColor,
                    color: textColor
                  }}
                  disabled
                />
                <button
                  className="p-3 rounded-full text-white"
                  style={{ backgroundColor: primaryColor }}
                  disabled
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
