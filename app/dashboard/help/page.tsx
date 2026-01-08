"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Search, Book, MessageCircle, Send, CheckCircle } from "lucide-react";

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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Help Center</h1>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 border-2 border-yellow-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 bg-white"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-yellow-400 transition cursor-pointer">
            <Book className="w-8 h-8 text-yellow-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Documentation</h3>
            <p className="text-sm text-gray-600">Browse our comprehensive guides and tutorials</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-yellow-400 transition cursor-pointer">
            <MessageCircle className="w-8 h-8 text-yellow-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Community</h3>
            <p className="text-sm text-gray-600">Join our community forum for discussions</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-yellow-400 transition cursor-pointer">
            <Send className="w-8 h-8 text-yellow-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Contact Support</h3>
            <p className="text-sm text-gray-600">Get help from our support team</p>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Contact Support</h2>
          
          {submitted ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Message sent successfully!</p>
                <p className="text-sm text-green-700">Our team will get back to you soon.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSupportSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  value={user?.primaryEmailAddress?.emailAddress || ""}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How can we help?
                </label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Describe your issue or question..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !supportMessage.trim()}
                className="px-6 py-2.5 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition flex items-center gap-2"
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
