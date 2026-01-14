"use client";

import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Zap, Database, ArrowRight, Check, Sparkles, Lock } from "lucide-react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { ChatWidget } from "@/components/ChatWidget";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">StartupKit</h1>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-yellow-400 transition font-medium">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-yellow-400 transition font-medium">Pricing</a>
            <a href="#faq" className="text-gray-300 hover:text-yellow-400 transition font-medium">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton forceRedirectUrl="/dashboard">
                <button className="px-4 py-2 text-white hover:text-yellow-400 transition">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton forceRedirectUrl="/dashboard">
                <button className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <a href="/dashboard" className="px-4 py-2 text-white hover:text-yellow-400 transition">
                Dashboard
              </a>
              <Link href="/dashboard">
                <button className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition">
                  Go to Dashboard
                </button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="text-center max-w-5xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Ship faster with our SaaS starter kit</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
            Build Your SaaS in <span className="text-yellow-400">Minutes</span>
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Complete multi-tenant SaaS platform with authentication, subscriptions, and
            payments. Start building your product, not infrastructure.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="px-8 py-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-bold text-lg transition flex items-center gap-2 shadow-lg hover:shadow-xl">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <button className="px-8 py-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-bold text-lg transition flex items-center gap-2 shadow-lg hover:shadow-xl">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </SignedIn>
            <div className="flex gap-4">
              <a href="#pricing">
                <button className="px-8 py-4 border-2 border-gray-700 text-white rounded-lg hover:border-yellow-400 hover:text-yellow-400 font-bold text-lg transition">
                  View Pricing
                </button>
              </a>
              <a href="#faq">
                <button className="px-8 py-4 border-2 border-gray-700 text-white rounded-lg hover:border-yellow-400 hover:text-yellow-400 font-bold text-lg transition">
                  FAQ
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="w-full px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">Everything you need to launch</h3>
            <p className="text-xl text-gray-400">Production-ready features out of the box</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="group bg-gradient-to-br from-yellow-400/5 via-gray-900 to-gray-900 p-8 rounded-2xl border border-yellow-400/20 hover:border-yellow-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-400/20 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-yellow-400 transition-colors">Authentication</h3>
              <p className="text-gray-400 leading-relaxed">
                Clerk integration with organizations support for multi-tenant access control and secure user management
              </p>
            </div>
            <div className="group bg-gradient-to-br from-yellow-400/5 via-gray-900 to-gray-900 p-8 rounded-2xl border border-yellow-400/20 hover:border-yellow-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-400/20 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-yellow-400 transition-colors">Subscriptions</h3>
              <p className="text-gray-400 leading-relaxed">
                Stripe-powered recurring billing with multiple plan tiers, credits system, and automatic invoicing
              </p>
            </div>
            <div className="group bg-gradient-to-br from-yellow-400/5 via-gray-900 to-gray-900 p-8 rounded-2xl border border-yellow-400/20 hover:border-yellow-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-400/20 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Database className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-yellow-400 transition-colors">Real-time Database</h3>
              <p className="text-gray-400 leading-relaxed">
                Convex backend with automatic tenant isolation, real-time sync, and serverless architecture
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="w-full px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple, transparent pricing</h3>
            <p className="text-xl text-gray-400">Choose the plan that fits your needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Free Plan */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300">
            <div className="mb-6">
              <h4 className="text-2xl font-bold text-white mb-2">{PLANS.free.title}</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">MYR 0</span>
                <span className="text-gray-400">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              {PLANS.free.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="w-full px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 font-semibold transition">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/pricing">
                <button className="w-full px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 font-semibold transition">
                  View Plans
                </button>
              </Link>
            </SignedIn>
          </div>

          {/* Starter Plan - Most Popular */}
          <div className="relative bg-gradient-to-br from-yellow-400/10 to-gray-900 p-8 rounded-2xl border-2 border-yellow-400 transition-all duration-300 shadow-xl shadow-yellow-400/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-black text-sm font-bold rounded-full">
              Most Popular
            </div>
            <div className="mb-6">
              <h4 className="text-2xl font-bold text-white mb-2">{PLANS.starter.title}</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">MYR {PLANS.starter.monthlyPrice}</span>
                <span className="text-gray-400">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              {PLANS.starter.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="w-full px-6 py-3 bg-yellow-400 text-black rounded-xl hover:bg-yellow-500 font-bold transition shadow-lg">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/pricing">
                <button className="w-full px-6 py-3 bg-yellow-400 text-black rounded-xl hover:bg-yellow-500 font-bold transition shadow-lg">
                  Subscribe Now
                </button>
              </Link>
            </SignedIn>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 p-8 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300">
            <div className="mb-6">
              <h4 className="text-2xl font-bold text-white mb-2">{PLANS.pro.title}</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">MYR {PLANS.pro.monthlyPrice}</span>
                <span className="text-gray-400">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              {PLANS.pro.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="w-full px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 font-semibold transition">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/pricing">
                <button className="w-full px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 font-semibold transition">
                  Subscribe Now
                </button>
              </Link>
            </SignedIn>
          </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-10 text-white">Built With Modern Tech</h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
          {["Next.js 16", "Convex", "Clerk", "Stripe", "TypeScript", "Tailwind CSS"].map(
            (tech) => (
              <div
                key={tech}
                className="px-6 py-3 bg-gray-900 border-2 border-gray-800 rounded-lg text-gray-300 font-semibold hover:border-yellow-400 hover:text-yellow-400 transition"
              >
                {tech}
              </div>
            )
          )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="w-full px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h3>
            <p className="text-xl text-gray-400">Have questions? We have answers.</p>
          </div>
          <div className="space-y-4">
            <details className="group bg-gradient-to-br from-gray-900 to-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-yellow-400/50 transition-all duration-300">
              <summary className="flex justify-between items-center cursor-pointer text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                Is there a setup fee?
                <span className="text-yellow-400 text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                No, there are no setup fees. You only pay for the plan you choose, and you can start with our free plan to test the platform.
              </p>
            </details>

            <details className="group bg-gradient-to-br from-gray-900 to-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-yellow-400/50 transition-all duration-300">
              <summary className="flex justify-between items-center cursor-pointer text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                How does the billing work?
                <span className="text-yellow-400 text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Billing is handled through Stripe. You&apos;ll be charged monthly or yearly depending on your chosen plan. You can upgrade, downgrade, or cancel anytime.
              </p>
            </details>

            <details className="group bg-gradient-to-br from-gray-900 to-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-yellow-400/50 transition-all duration-300">
              <summary className="flex justify-between items-center cursor-pointer text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                Can I upgrade or downgrade my plan?
                <span className="text-yellow-400 text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Yes! You can upgrade or downgrade your plan at any time. Changes are prorated, so you only pay the difference.
              </p>
            </details>

            <details className="group bg-gradient-to-br from-gray-900 to-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-yellow-400/50 transition-all duration-300">
              <summary className="flex justify-between items-center cursor-pointer text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                What happens when I cancel?
                <span className="text-yellow-400 text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                When you cancel, your subscription remains active until the end of your billing period. After that, you&apos;ll be moved to the free plan automatically.
              </p>
            </details>

            <details className="group bg-gradient-to-br from-gray-900 to-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-yellow-400/50 transition-all duration-300">
              <summary className="flex justify-between items-center cursor-pointer text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                How do I get support?
                <span className="text-yellow-400 text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                You can reach our support team through the Help Center in your dashboard. We typically respond within 24 hours on business days.
              </p>
            </details>

            <details className="group bg-gradient-to-br from-gray-900 to-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-yellow-400/50 transition-all duration-300">
              <summary className="flex justify-between items-center cursor-pointer text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                Is my data secure?
                <span className="text-yellow-400 text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Yes! We use industry-standard encryption and security practices. Your data is stored securely with Convex, and all payments are processed through Stripe&apos;s secure infrastructure.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black mt-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto text-center text-gray-400">
            <p>© 2026 StartupKit. Built with ❤️ for developers.</p>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget type="frontend" />
    </div>
  );
}
