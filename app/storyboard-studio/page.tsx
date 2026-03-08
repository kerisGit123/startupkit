"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StoryboardStudioPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to storyboard interface since we're focused on storyboard creation, not manga
    router.replace("/storyboard-studio/storyboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <svg className="w-8 h-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-white text-lg font-semibold mb-2">Redirecting to Storyboard Studio...</h2>
        <p className="text-gray-400 text-sm">Taking you to your storyboard workspace</p>
      </div>
    </div>
  );
}
