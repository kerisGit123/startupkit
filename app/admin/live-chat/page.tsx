"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Live Chat Dashboard has been merged into the Inbox Chatbot tab.
// All chatbot conversations, admin takeover, email-back, quick replies,
// resolve, email-back, and rating features are now in the unified Inbox.
export default function LiveChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/inbox?tab=chatbot");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-muted-foreground">Redirecting to Inbox...</p>
    </div>
  );
}
