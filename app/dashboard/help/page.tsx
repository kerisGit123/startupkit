"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Search, Book, MessageCircle, Send, CheckCircle, HelpCircle } from "lucide-react";

export default function HelpCenterPage() {
  const { user } = useUser();
  const [supportMessage, setSupportMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supportMessage.trim() || !user) return;

    setIsSubmitting(true);
    
    try {
      // Send to N8N webhook
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/support/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: supportMessage,
          userEmail: user.primaryEmailAddress?.emailAddress,
          userName: user.fullName || user.firstName,
          userId: user.id,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setSupportMessage("");
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error("Error submitting support request:", error);
      alert("Failed to submit support request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "How do I upgrade my plan?",
      answer: "Go to Billing page and click 'Change Plan' to view available plans and upgrade."
    },
    {
      question: "How do credits work?",
      answer: "Credits are used for scans. You can purchase additional credits anytime from the Billing page."
    },
    {
      question: "Can I invite team members?",
      answer: "Yes! Go to the Team page and click 'Invite Member' to add team members to your organization."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "Visit the Billing page and click 'Cancel Subscription' at the bottom of the subscription section."
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Help Center</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Find answers, browse guides, or contact support</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 text-gray-900 bg-gray-50 text-sm"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer">
            <div className="p-2.5 bg-blue-100 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
              <Book className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold mb-1 text-gray-900">Documentation</h3>
            <p className="text-xs text-gray-500">Browse our comprehensive guides and tutorials</p>
          </div>
          <div className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer">
            <div className="p-2.5 bg-violet-100 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold mb-1 text-gray-900">Community</h3>
            <p className="text-xs text-gray-500">Join our community forum for discussions</p>
          </div>
          <div className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer">
            <div className="p-2.5 bg-emerald-100 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
              <Send className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold mb-1 text-gray-900">Contact Support</h3>
            <p className="text-xs text-gray-500">Get help from our support team</p>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-amber-100 rounded-xl">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <h3 className="font-medium text-gray-900 mb-1 text-sm">{faq.question}</h3>
                <p className="text-gray-500 text-xs">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support Form */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Send className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Contact Support</h2>
          </div>
          
          {submitted ? (
            <div className="flex items-center justify-center bg-[#f8f9fa] border border-emerald-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-900 text-sm">Message sent successfully!</p>
                <p className="text-xs text-emerald-700">Our team will get back to you soon.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your Email
                </label>
                <input
                  type="email"
                  value={user?.primaryEmailAddress?.emailAddress || ""}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  How can we help?
                </label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300 focus:outline-none text-gray-900 bg-white text-sm"
                  placeholder="Describe your issue or question..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !supportMessage.trim()}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
