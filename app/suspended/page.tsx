"use client";

import { ShieldX, Mail } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-sm p-8 space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-rose-600" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-rose-700 mb-2">Account suspended</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your account has been suspended due to a violation of our terms of
            service. If you believe this is an error, please contact our support
            team and we will review your case.
          </p>
        </div>

        <a
          href="mailto:support@yourdomain.com"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition"
        >
          <Mail className="w-4 h-4" />
          Contact support
        </a>

        <SignOutButton>
          <button className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2">
            Sign out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
