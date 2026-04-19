"use client";

import { useState, useEffect, useRef } from "react";
import {
  Film, Sparkles, PenTool, Download, Users,
  ArrowRight, Check, Star, Shield,
  Menu, X, FileText, Video, Coins,
  Minus, Plus, Layers, Zap, MessageSquare,
  Image, Camera, Brush, Box, User, Building2,
} from "lucide-react";
import { PricingTable, useUser } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { ChatWidget } from "@/components/ChatWidget";

/* ─── reveal ─────────────────────────────────────────────────────────── */
function useRv(t = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: t });
    o.observe(el); return () => o.disconnect();
  }, [t]);
  return { ref, v };
}
function R({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, v } = useRv();
  return <div ref={ref} className={`transition-all duration-700 ease-out ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

/* ─── faq ─────────────────────────────────────────────────────────────── */
function Faq({ q, a }: { q: string; a: string }) {
  const [o, setO] = useState(false);
  return (
    <div className="border-b border-[#3D3D3D]">
      <button onClick={() => setO(!o)} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-[15px] font-medium text-white/90 group-hover:text-teal-400 transition-colors pr-6">{q}</span>
        <span className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${o ? "bg-teal-500/15 border-teal-500/40" : "border-[#4A4A4A]"}`}>
          {o ? <Minus className="w-3.5 h-3.5 text-teal-400" /> : <Plus className="w-3.5 h-3.5 text-[#6E6E6E]" />}
        </span>
      </button>
      {o && <p className="text-sm text-[#A0A0A0] leading-relaxed pb-5">{a}</p>}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════ */
export default function StorticaLanding() {
  const { user } = useUser();
  const [nav, setNav] = useState(false);
  const [ready, setReady] = useState(false);
  const [pricingMode, setPricingMode] = useState<"personal" | "organization">("personal");
  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

  const img = "/storytica";

  // AI model data for horizontal scroller
  const models = [
    { name: "Nano Banana 2", sub: "General purpose", type: "Image", icon: Zap },
    { name: "Nano Banana Pro", sub: "Higher quality", type: "Image", icon: Camera },
    { name: "GPT Image 1.5", sub: "Image to Image", type: "Image", icon: Image },
    { name: "Flux 2 Pro", sub: "Text to Image", type: "Image", icon: Sparkles },
    { name: "Character Edit", sub: "Face editing", type: "Image", icon: Brush },
    { name: "Seedance 1.5 Pro", sub: "Video generation", type: "Video", icon: Video },
    { name: "Seedance 2.0", sub: "480p/720p", type: "Video", icon: Video },
    { name: "Kling 3.0 Motion", sub: "Motion control", type: "Video", icon: Video },
    { name: "Veo 3.1", sub: "Google Video", type: "Video", icon: Video },
    { name: "Grok Imagine", sub: "Image to Video", type: "Video", icon: Video },
  ];

  return (
    <div className="min-h-screen bg-[#111111] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 inset-x-0 z-40 backdrop-blur-2xl bg-[#111111]/90 border-b border-[#222222]">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/storytica" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center"><Film className="w-3.5 h-3.5 text-[#111111]" /></div>
            <span className="text-[15px] font-extrabold text-teal-400 tracking-tight">STORYTICA</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-[13px]">
            <a href="#features" className="text-[#888] hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-[#888] hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-[#888] hover:text-white transition-colors">Pricing</a>
            <a href="/community" className="text-[#888] hover:text-white transition-colors">Community</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href="/sign-in" className="text-[13px] text-[#888] hover:text-white px-3 py-1.5">Log In</a>
            <a href="/sign-up" className="text-[13px] font-semibold bg-teal-500 hover:bg-teal-400 text-[#111111] px-5 py-2 rounded-lg transition-all">Start Free</a>
          </div>
          <button onClick={() => setNav(!nav)} className="md:hidden text-[#888]">{nav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        </div>
        {nav && (
          <div className="md:hidden bg-[#111111] border-t border-[#222222] px-6 py-5 space-y-3">
            {["Features", "How It Works", "Pricing"].map(l => <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} onClick={() => setNav(false)} className="block text-sm text-[#888]">{l}</a>)}
            <a href="/community" onClick={() => setNav(false)} className="block text-sm text-[#888]">Community</a>
            <a href="/sign-up" className="block text-sm font-semibold bg-teal-500 text-[#111111] px-4 py-2.5 rounded-lg text-center mt-3">Start Free</a>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-28 pb-6 lg:pt-36 lg:pb-10">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          {/* Badge */}
          <div className={`flex items-center justify-center gap-3 mb-6 transition-all duration-700 ${ready ? "opacity-100" : "opacity-0 translate-y-3"}`}>
            <div className="flex -space-x-1.5">
              {["bg-teal-500", "bg-cyan-500", "bg-blue-500", "bg-purple-500"].map((c, i) => (
                <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-[#111111] text-[8px] font-bold flex items-center justify-center`}>{["A", "K", "N", "T"][i]}</div>
              ))}
            </div>
            <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}</div>
            <span className="text-[11px] text-[#555]">Trusted by creators</span>
          </div>

          {/* Heading */}
          <h1 className={`text-[2.5rem] sm:text-[3.5rem] lg:text-[4.2rem] font-extrabold leading-[1.05] tracking-tight mb-5 transition-all duration-1000 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "150ms" }}>
            The AI Storyboard Generator
            <br />
            for <span className="text-teal-400">Creative Professionals</span>
          </h1>

          <p className={`text-base lg:text-lg text-[#888] leading-relaxed max-w-2xl mx-auto mb-6 transition-all duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "300ms" }}>
            Turn text into AI storyboard images with 11+ models. Generate videos, edit with professional canvas tools, and go from script to storyboard in minutes.
          </p>

          {/* Bullets */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 transition-all duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "420ms" }}>
            {["No drawing skills needed", "Consistent characters", "PDF & video export"].map(b => (
              <span key={b} className="flex items-center gap-2 text-[13px] text-[#aaa]"><Check className="w-3.5 h-3.5 text-teal-400" />{b}</span>
            ))}
          </div>

          {/* CTA */}
          <div className={`mb-12 transition-all duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "560ms" }}>
            <a href="/sign-up" className="group inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-[#111111] font-bold text-base px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-teal-500/20">
              Create Storyboard <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Full-width hero screenshot */}
          <div className={`transition-all duration-1000 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`} style={{ transitionDelay: "700ms" }}>
            <div className="rounded-xl overflow-hidden border border-[#2a2a2a] shadow-2xl shadow-black/60">
              <img src={`${img}/storyboard_home.png`} alt="Storytica Dashboard" className="w-full h-auto block" loading="eager" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AI MODELS — horizontal auto-scroll ═══ */}
      <section className="py-10 border-y border-[#1e1e1e] overflow-hidden">
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#111111] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#111111] to-transparent z-10" />
          {/* Scrolling track */}
          <div className="flex gap-4 animate-[scroll_30s_linear_infinite]" style={{ width: "max-content" }}>
            {[...models, ...models].map((m, i) => (
              <div key={`${m.name}-${i}`} className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-5 py-3 shrink-0 min-w-[200px]">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.type === "Video" ? "bg-teal-500/10 text-teal-400" : "bg-cyan-500/10 text-cyan-400"}`}>
                  <m.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white">{m.name}</div>
                  <div className="text-[10px] text-[#666]">{m.sub}</div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ml-auto ${m.type === "Video" ? "bg-teal-500/15 text-teal-400" : "bg-cyan-500/15 text-cyan-400"}`}>{m.type}</span>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      </section>

      {/* ═══ HOW IT WORKS — 3-column cards with visuals ═══ */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto px-6">
          <R><div className="text-center mb-14">
            <h2 className="text-[2rem] lg:text-[2.8rem] font-extrabold uppercase tracking-tight mb-3">
              From Prompt to <span className="text-teal-400">Storyboard</span>
            </h2>
            <p className="text-[15px] text-[#888] max-w-xl mx-auto">Write your script, generate visuals with AI, then edit and export. Three steps to professional storyboards.</p>
          </div></R>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: "Step 1", t: "WRITE YOUR SCRIPT", d: "Paste your script or type a prompt. AI converts it into scenes with shot breakdowns, dialogue, and camera directions.", img: `${img}/storyboard_home.png` },
              { n: "Step 2", t: "GENERATE VISUALS", d: "Choose from 11+ AI models. Use the element library for consistent characters. Generate images and videos per frame.", img: `${img}/storyboardItem.png` },
              { n: "Step 3", t: "EDIT & EXPORT", d: "Refine with canvas tools — brush, inpaint, shapes, text. Export as PDF, video, or individual frames.", img: `${img}/elementLibrary.png` },
            ].map((s, i) => (
              <R key={s.n} delay={i * 120}>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden h-full group hover:border-[#3a3a3a] transition-colors">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={s.img} alt={s.t} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-6">
                    <div className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.15em] mb-2">{s.n}</div>
                    <h3 className="text-base font-extrabold text-white uppercase tracking-wide mb-2">{s.t}</h3>
                    <p className="text-[13px] text-[#888] leading-relaxed">{s.d}</p>
                  </div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES — 3-column cards like reference ═══ */}
      <section id="features" className="py-20 lg:py-28 bg-[#0e0e0e]">
        <div className="max-w-[1200px] mx-auto px-6">
          <R><div className="text-center mb-14">
            <h2 className="text-[2rem] lg:text-[2.8rem] font-extrabold uppercase tracking-tight mb-3">
              Built for Every <span className="text-teal-400">Creative Workflow</span>
            </h2>
            <p className="text-[15px] text-[#888] max-w-2xl mx-auto">From storyboarding to video generation, Storytica adapts to any creative style — giving you full visual and structural control.</p>
          </div></R>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { t: "STORYBOARDING", d: "Generate frames from text prompts. Auto scene breakdown with tags, status badges, and camera notes per frame.", img: `${img}/storyboardItem.png` },
              { t: "AI VIDEO GENERATION", d: "5 video engines — Seedance, Kling Motion, Veo 3.1, Grok Imagine. Control resolution, duration, and aspect ratio.", img: `${img}/AIModal.png` },
              { t: "ELEMENT LIBRARY", d: "Save characters, props, styles as reusable elements. Drag into any frame for consistent characters across scenes.", img: `${img}/elementLibrary.png` },
            ].map((f, i) => (
              <R key={f.t} delay={i * 100}>
                <div className="group">
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-[#2a2a2a] mb-5">
                    <img src={f.img} alt={f.t} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wide mb-2">{f.t}</h3>
                  <p className="text-[13px] text-[#888] leading-relaxed">{f.d}</p>
                </div>
              </R>
            ))}
          </div>

          {/* Second row */}
          <div className="grid md:grid-cols-3 gap-5 mt-12">
            {[
              { t: "CANVAS EDITOR", d: "Brush, inpaint, text, shapes, speech bubbles. AI upscaling with Topaz and Recraft Crisp. Zoom, crop, pan.", img: `${img}/toolbox.png` },
              { t: "FILE BROWSER", d: "All files on Cloudflare R2. Browse elements, generated images, uploads. Search, filter, download.", img: `${img}/fileBrowser.png` },
              { t: "TEAM COLLABORATION", d: "Invite members, assign roles (Admin, Member, Viewer). Organization switcher for multi-team workflows.", img: `${img}/storyboard_home.png` },
            ].map((f, i) => (
              <R key={f.t} delay={i * 100}>
                <div className="group">
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-[#2a2a2a] mb-5">
                    <img src={f.img} alt={f.t} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wide mb-2">{f.t}</h3>
                  <p className="text-[13px] text-[#888] leading-relaxed">{f.d}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MORE FEATURES (compact row) ═══ */}
      <section className="py-14">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Coins, t: "Credit System", d: "See exact cost before generating." },
              { icon: MessageSquare, t: "Support Tickets", d: "Submit, track, and reply to tickets." },
              { icon: Layers, t: "Prompt Library", d: "Save and reuse prompts by category." },
              { icon: Shield, t: "Privacy First", d: "Content never used to train AI." },
            ].map((f, i) => (
              <R key={f.t} delay={i * 50}>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 h-full">
                  <f.icon className="w-4 h-4 text-teal-400 mb-2.5" />
                  <div className="text-[13px] font-bold text-white mb-1">{f.t}</div>
                  <div className="text-[11px] text-[#777] leading-relaxed">{f.d}</div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-20 bg-[#0e0e0e]">
        <div className="max-w-[900px] mx-auto px-6">
          <R><h2 className="text-[1.8rem] font-extrabold text-center mb-10">What Our Users Say</h2></R>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { n: "Jamie T.", r: "Indie Filmmaker", q: "The AI storyboard was so good I turned a quick concept into a short film. What took two days now takes 20 minutes." },
              { n: "Mei L.", r: "Content Creator", q: "I describe what I want and have visual frames in seconds. The video generation is a game-changer for TikTok." },
              { n: "Ryan K.", r: "Creative Director", q: "We generate professional storyboards for each client pitch in minutes. They love the visual quality." },
              { n: "Sophia W.", r: "Student Filmmaker", q: "The element library keeps my characters consistent across every scene. My thesis storyboard looked professional." },
            ].map((t, i) => (
              <R key={t.n} delay={i * 80}>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 h-full">
                  <div className="flex gap-0.5 mb-3">{[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 text-amber-400 fill-amber-400" />)}</div>
                  <p className="text-[13px] text-[#aaa] leading-relaxed mb-4 italic">&quot;{t.q}&quot;</p>
                  <div className="text-sm font-semibold text-white">{t.n}</div>
                  <div className="text-[11px] text-[#555]">{t.r}</div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING (Clerk PricingTable) ═══ */}
      <section id="pricing" className="py-20">
        <div className="max-w-[1100px] mx-auto px-6">
          <R><div className="text-center mb-10">
            <h2 className="text-[1.8rem] lg:text-[2.2rem] font-extrabold mb-3">Simple, Transparent Pricing</h2>
            <p className="text-[15px] text-[#888]">Start free. Upgrade when you need more.</p>
          </div></R>

          {/* Personal / Organization toggle */}
          <R>
            <div className="flex justify-center mb-10">
              <div className="inline-flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1 gap-1">
                <button
                  onClick={() => setPricingMode("personal")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    pricingMode === "personal" ? "bg-teal-600 text-white shadow-lg" : "text-[#888] hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4" /> Personal
                </button>
                <button
                  onClick={() => setPricingMode("organization")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    pricingMode === "organization" ? "bg-teal-600 text-white shadow-lg" : "text-[#888] hover:text-white"
                  }`}
                >
                  <Building2 className="w-4 h-4" /> Organization
                </button>
              </div>
            </div>
          </R>

          {/* Clerk PricingTable — using dark base theme */}
          <R>
            <div className="storytica-clerk-pricing">
              <PricingTable
                forOrganizations={pricingMode === "organization"}
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: "#14b8a6",
                    colorBackground: "#1a1a1a",
                    fontFamily: "'Inter', sans-serif",
                    borderRadius: "0.75rem",
                  },
                }}
              />
            </div>
            {/* Force dark card backgrounds & teal CTAs */}
            <style>{`
              .storytica-clerk-pricing .cl-pricingTableCard,
              .storytica-clerk-pricing [class*="pricingTableCard"]:not([class*="pricingTableCardFee"]):not([class*="pricingTableCardTitle"]):not([class*="pricingTableCardFeature"]) {
                background-color: #1a1a1a !important;
                border-color: #2a2a2a !important;
                color: #fff !important;
              }
              .storytica-clerk-pricing button[class*="pricingTableCardCta"],
              .storytica-clerk-pricing .cl-button__pricingTableCardCta {
                background-color: #0d9488 !important;
                color: #fff !important;
                border: none !important;
                font-weight: 600 !important;
              }
              .storytica-clerk-pricing button[class*="pricingTableCardCta"]:hover {
                background-color: #14b8a6 !important;
              }
              .storytica-clerk-pricing h2,
              .storytica-clerk-pricing h3,
              .storytica-clerk-pricing [class*="pricingTableCardTitle"] {
                color: #fff !important;
              }
              .storytica-clerk-pricing [class*="pricingTableCardFee"] {
                color: #fff !important;
              }
              .storytica-clerk-pricing [class*="pricingTableCardDescription"],
              .storytica-clerk-pricing [class*="pricingTableCardFeePeriod"] {
                color: #888 !important;
              }
              .storytica-clerk-pricing [class*="pricingTableCardFeature"] {
                color: #c0c0c0 !important;
              }
            `}</style>
          </R>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20 bg-[#0e0e0e]">
        <div className="max-w-[650px] mx-auto px-6">
          <R><h2 className="text-[1.8rem] font-extrabold text-center mb-8">Frequently Asked Questions</h2></R>
          <R><div>
            <Faq q="What AI models are available?" a="11+ models: Nano Banana 2, Nano Banana Pro, GPT 1.5 Image, Flux 2 Pro, Character Edit, Nano Banana Edit for images. Seedance 1.5 Pro, Seedance 2.0, Kling 3.0, Veo 3.1, Grok Imagine for video." />
            <Faq q="Can I maintain consistent characters?" a="Yes. The Element Library saves characters, props, and styles with reference images. Drag them into any frame as AI references." />
            <Faq q="How does the credit system work?" a="Each generation costs credits based on model, resolution, and duration. Exact cost shown before generating. Free plan includes 5 generations/month." />
            <Faq q="What export options are available?" a="PDF with visuals and script, individual frames as PNG/JPG, video animatics, and script-only text export." />
            <Faq q="Does it support team collaboration?" a="Yes. Invite members, assign roles (Admin, Member, Viewer), switch between organizations." />
            <Faq q="Is there a free plan?" a="Yes. 5 AI generations/month, 1 project, PDF export. No credit card required." />
          </div></R>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-16">
        <R>
          <div className="max-w-[1000px] mx-auto px-6">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 lg:p-12 grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-[1.8rem] lg:text-[2rem] font-extrabold leading-tight mb-3">Create your storyboard in minutes</h2>
                <p className="text-[14px] text-[#888] mb-6">11+ AI models. Canvas tools. PDF and video export. Start free.</p>
                <a href="/sign-up" className="group inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-[#111111] font-bold text-sm px-7 py-3 rounded-lg transition-all">
                  Start Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
                <img src={`${img}/storyboard_home.png`} alt="Storytica" className="w-full h-auto block" />
              </div>
            </div>
          </div>
        </R>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#1e1e1e] py-12">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center"><Film className="w-3 h-3 text-[#111111]" /></div>
                <span className="text-sm font-extrabold text-teal-400">STORYTICA</span>
              </div>
              <p className="text-[11px] text-[#555] leading-relaxed">AI-powered storyboard studio for creators and teams.</p>
            </div>
            {[{ t: "Product", l: ["Features", "Pricing", "Changelog"] }, { t: "Resources", l: ["Docs", "Tutorials", "Blog"] }, { t: "Company", l: ["About", "Privacy", "Terms"] }].map(c => (
              <div key={c.t}>
                <div className="text-[11px] font-bold text-[#555] uppercase tracking-wider mb-3">{c.t}</div>
                <ul className="space-y-2">{c.l.map(l => <li key={l}><a href="#" className="text-[13px] text-[#777] hover:text-white transition-colors">{l}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1e1e1e] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-[#555]">&copy; {new Date().getFullYear()} Storytica. All rights reserved.</span>
            <div className="flex items-center gap-1"><Shield className="w-3 h-3 text-[#555]" /><span className="text-[11px] text-[#555]">Content never used to train AI</span></div>
          </div>
        </div>
      </footer>

      <ChatWidget type="frontend" userId={user?.id} />
    </div>
  );
}
