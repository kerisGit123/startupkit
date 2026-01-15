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
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cyan-400/10 via-transparent to-transparent"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/10 to-cyan-400/10 border border-yellow-400/30 rounded-full mb-6 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium bg-gradient-to-r from-yellow-400 to-cyan-400 bg-clip-text text-transparent">
                  AI-Powered SaaS Automation Platform
                </span>
              </div>
              
              {/* Main Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                <span className="text-white">Build Your SaaS in </span>
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-cyan-400 bg-clip-text text-transparent">
                  Minutes
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-base md:text-lg text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                Complete automation platform with AI chatbots, subscriptions, payments, and email management. 
                <span className="text-white font-medium"> Empower startups to build their dream software faster.</span>
              </p>
              
              {/* CTA Buttons */}
              <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
                <SignedOut>
                  <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                    <button className="group px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-xl hover:from-yellow-500 hover:to-yellow-600 font-bold text-lg transition-all duration-300 flex items-center gap-2 shadow-2xl shadow-yellow-400/50 hover:shadow-yellow-400/70 hover:scale-105">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="group px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-xl hover:from-yellow-500 hover:to-yellow-600 font-bold text-lg transition-all duration-300 flex items-center gap-2 shadow-2xl shadow-yellow-400/50 hover:shadow-yellow-400/70 hover:scale-105">
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </SignedIn>
                <a href="#pricing">
                  <button className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-white/20 font-semibold text-lg transition-all duration-300">
                    View Pricing
                  </button>
                </a>
              </div>
            </div>
            
            {/* Hero Graphic - Integrated */}
            <div className="relative max-w-xl mx-auto">
              {/* Glow Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-cyan-400/20 to-blue-400/20 blur-[80px] opacity-40"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-r from-yellow-400/15 to-cyan-400/15 rounded-full blur-3xl"></div>
              
              {/* Image Container */}
              <div className="relative">
                <img 
                  src="/hero-ai-automation.png" 
                  alt="AI Automation Platform - Centralized AI with Automation, Analytics, Reliability, and Scale" 
                  className="relative w-full h-auto drop-shadow-2xl"
                />
                
                {/* Animated Rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[115%] h-[115%] border border-yellow-400/20 rounded-full animate-ping-slow"></div>
                  <div className="absolute w-[130%] h-[130%] border border-cyan-400/10 rounded-full animate-ping-slower"></div>
                </div>
              </div>
              
              {/* Feature Pills */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-2 px-4">
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md border border-yellow-400/30 rounded-full text-xs text-gray-300 shadow-lg">
                  ⚡ Automation
                </div>
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md border border-cyan-400/30 rounded-full text-xs text-gray-300 shadow-lg">
                  🤖 AI Powered
                </div>
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md border border-blue-400/30 rounded-full text-xs text-gray-300 shadow-lg">
                  📊 Analytics
                </div>
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md border border-purple-400/30 rounded-full text-xs text-gray-300 shadow-lg">
                  🔒 Secure
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
      </section>

      {/* Features */}
      <section id="features" className="w-full px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">Everything you need to launch</h3>
            <p className="text-xl text-gray-400">Production-ready features to build your dream software</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* AI Chatbots */}
            <div className="group bg-gradient-to-br from-cyan-400/5 via-gray-900 to-gray-900 p-8 rounded-2xl border border-cyan-400/20 hover:border-cyan-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-400/20 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-cyan-400/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-400 transition-colors">AI Chatbots</h3>
              <p className="text-gray-400 leading-relaxed">
                n8n integrated chatbots for customer support with AI-powered responses and knowledge base integration
              </p>
            </div>

            {/* Automation */}
            <div className="group bg-gradient-to-br from-yellow-400/5 via-gray-900 to-gray-900 p-8 rounded-2xl border border-yellow-400/20 hover:border-yellow-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-400/20 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-yellow-400 transition-colors">Automation</h3>
              <p className="text-gray-400 leading-relaxed">
                Email campaigns, workflows, and triggers to automate your business processes and save time
              </p>
            </div>

            {/* Subscriptions */}
            <div className="group bg-gradient-to-br from-purple-400/5 via-gray-900 to-gray-900 p-8 rounded-2xl border border-purple-400/20 hover:border-purple-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-400/20 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400/20 to-purple-400/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors">Subscriptions</h3>
              <p className="text-gray-400 leading-relaxed">
                Stripe-powered recurring billing with multiple plan tiers and automatic invoicing
              </p>
            </div>

            {/* Payments */}
            <div className="group bg-gradient-to-br from-green-400/5 via-gray-900 to-gray-900 p-8 rounded-2xl border border-green-400/20 hover:border-green-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-green-400/20 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400/20 to-green-400/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-green-400 transition-colors">Payments</h3>
              <p className="text-gray-400 leading-relaxed">
                Secure payment processing with Stripe integration and PCI compliance built-in
              </p>
            </div>

            {/* Email Management */}
            <div className="group bg-gradient-to-br from-pink-400/5 via-gray-900 to-gray-900 p-8 rounded-2xl border border-pink-400/20 hover:border-pink-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-400/20 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400/20 to-pink-400/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-pink-400 transition-colors">Email Management</h3>
              <p className="text-gray-400 leading-relaxed">
                Templates, campaigns, and logs to manage all your email communications in one place
              </p>
            </div>

            {/* Analytics */}
            <div className="group bg-gradient-to-br from-blue-400/5 via-gray-900 to-gray-900 p-8 rounded-2xl border border-blue-400/20 hover:border-blue-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-400/20 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400/20 to-blue-400/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Database className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">Analytics</h3>
              <p className="text-gray-400 leading-relaxed">
                Track performance and user engagement with real-time analytics and insights
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
