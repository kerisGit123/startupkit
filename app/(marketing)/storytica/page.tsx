"use client";

import { useState, useEffect, useRef } from "react";
import {
  Film, Sparkles, PenTool, Download, Users,
  ArrowRight, Check, Star, Shield,
  Menu, X, FileText, Video, Coins,
  Minus, Plus, Layers, Zap, MessageSquare,
  Image, Camera, Brush, Box, Music, Mic, HardDrive,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import SupportChatWidget from "@/components/support-chat/SupportChatWidget";
import PricingShowcase, { WhyStorytica } from "@/components/pricing/PricingShowcase";

/* ─── scroll reveal ──────────────────────────────────────────────────── */
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

/* ─── rotating words (Storyboarder.ai inspired) ─────────────────────── */
function RotatingWord({ words, className = "" }: { words: string[]; className?: string }) {
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState<"in" | "out">("in");
  useEffect(() => {
    const interval = setInterval(() => {
      setAnim("out");
      setTimeout(() => {
        setIdx(p => (p + 1) % words.length);
        setAnim("in");
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, [words.length]);
  return (
    <span className={`inline-block relative ${className}`}>
      <span className={`inline-block transition-all duration-400 ${anim === "in" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        {words[idx]}
      </span>
    </span>
  );
}

/* ─── animated counter ───────────────────────────────────────────────── */
function Counter({ target, suffix = "+" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); o.disconnect(); } }, { threshold: 0.3 });
    o.observe(el); return () => o.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    const duration = 1600;
    const steps = 40;
    const inc = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── faq ─────────────────────────────────────────────────────────────── */
function Faq({ q, a }: { q: string; a: string }) {
  const [o, setO] = useState(false);
  return (
    <div className="border-b border-[#2a2a2a]">
      <button onClick={() => setO(!o)} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-[15px] font-medium text-white/90 group-hover:text-teal-400 transition-colors pr-6">{q}</span>
        <span className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${o ? "bg-teal-500/15 border-teal-500/40" : "border-[#3a3a3a]"}`}>
          {o ? <Minus className="w-3.5 h-3.5 text-teal-400" /> : <Plus className="w-3.5 h-3.5 text-[#555]" />}
        </span>
      </button>
      <div className={`grid transition-all duration-300 ${o ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="text-sm text-[#888] leading-relaxed pb-5">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function StorticaLanding() {
  const { user } = useUser();
  const stats = useQuery(api.landingStats.getPublicStats);
  const [nav, setNav] = useState(false);
  const [ready, setReady] = useState(false);
  const [modelFilter, setModelFilter] = useState("All");
  useEffect(() => { setTimeout(() => setReady(true), 80); }, []);

  const img = "/storytica";

  const models = [
    { name: "Nano Banana 2", sub: "General purpose", type: "Image", icon: Zap },
    { name: "Nano Banana Pro", sub: "Higher quality", type: "Image", icon: Camera },
    { name: "GPT Image 2", sub: "Photorealism", type: "Image", icon: Image },
    { name: "Z-Image", sub: "Text to Image", type: "Image", icon: Sparkles },
    { name: "Flux 2 Pro", sub: "High quality", type: "Image", icon: Sparkles },
    { name: "Flux 2 Flex I2I", sub: "Multi-ref editing", type: "Image", icon: Brush },
    { name: "Character Edit", sub: "Consistent chars", type: "Image", icon: PenTool },
    { name: "Nano Banana Edit", sub: "Image editing", type: "Image", icon: Brush },
    { name: "Crisp Upscale", sub: "Image upscale", type: "Image", icon: Image },
    { name: "Seedance 1.5 Pro", sub: "Video generation", type: "Video", icon: Video },
    { name: "Seedance 2.0", sub: "Quality 480p/720p", type: "Video", icon: Video },
    { name: "Seedance 2.0 Fast", sub: "Faster rendering", type: "Video", icon: Video },
    { name: "Kling 3.0 Motion", sub: "Motion control", type: "Video", icon: Video },
    { name: "Veo 3.1", sub: "Google Video", type: "Video", icon: Video },
    { name: "Grok Imagine", sub: "Image to Video", type: "Video", icon: Video },
    { name: "Topaz Upscale", sub: "Video upscale", type: "Video", icon: Video },
    { name: "InfiniteTalk", sub: "Lip sync", type: "Video", icon: Video },
    { name: "AI Music", sub: "Generate music", type: "Music", icon: Music },
    { name: "Cover Song", sub: "Re-sing with persona", type: "Music", icon: Music },
    { name: "Extend Music", sub: "Extend tracks", type: "Music", icon: Music },
    { name: "Create Persona", sub: "Custom voice", type: "Music", icon: Mic },
    { name: "ElevenLabs TTS", sub: "Text-to-speech", type: "Audio", icon: Mic },
    { name: "AI Analyze", sub: "Image/video/audio", type: "Utility", icon: Sparkles },
    { name: "Prompt Enhance", sub: "Improve prompts", type: "Utility", icon: Zap },
  ];

  const filteredModels = modelFilter === "All" ? models : models.filter(m => m.type === modelFilter);

  const typeColor = (t: string) =>
    t === "Video" ? "teal" : t === "Music" ? "purple" : t === "Audio" ? "blue" : t === "Utility" ? "amber" : "cyan";

  /* ─── pipeline steps (Zopia-inspired) ─────────────────────────────── */
  const pipeline = [
    { icon: FileText, label: "Script", desc: "Write or paste your screenplay" },
    { icon: Users, label: "Characters", desc: "Build with Element Forge" },
    { icon: Layers, label: "Storyboard", desc: "AI generates visual frames" },
    { icon: Film, label: "Timeline", desc: "Compose in video editor" },
    { icon: Download, label: "Export", desc: "PDF, MP4, or WAV output" },
  ];

  /* ─── bento features ──────────────────────────────────────────────── */
  const bentoFeatures = [
    { icon: Sparkles, title: "AI Storyboarding", desc: "Script-to-storyboard in one click. Smart Build auto-extracts characters, environments, and props. Update & Add mode preserves existing work. 16 genre presets (Cinematic, Horror, Noir, Sci-Fi…) and 12 format presets (Film, YouTube, Reel, Commercial…) auto-shape every generation. Visual Lock: vision-analyze reference images and auto-rewrite the script to match. Batch generate all frames at once.", span: "md:col-span-2", accent: "from-teal-500/20 to-teal-500/5", img: `${img}/storyboardItem.png` },
    { icon: Video, title: "AI Video Generation", desc: "Seedance 2.0, Veo 3.1, Kling 3.0 Motion, Topaz Upscale, InfiniteTalk lip sync and more. Multi-shot UGC mode (6 images) and Showcase mode (9 images). 15 camera motion presets and speed ramps.", span: "", accent: "from-cyan-500/20 to-cyan-500/5", img: `${img}/AIModal.png` },
    { icon: Music, title: "AI Music & Audio", desc: "Generate original music, cover songs with custom personas, extend tracks, and create voiceovers with ElevenLabs TTS. Full audio production pipeline.", span: "", accent: "from-purple-500/20 to-purple-500/5", img: `${img}/elementLibrary.png` },
    { icon: Camera, title: "Cinema Studio", desc: "Camera Studio with 9 cameras (ARRI, Hasselblad, iPhone…), 6 lenses, 8 focal lengths, 6 apertures. Cinema Grade with 12 film stocks. 3D angle picker with wireframe globe. 12-model inpaint suite — mask-based face replacement, character remix, background removal, reframe, relight, style transfer, upscale. Color palette picker with eyedropper.", span: "", accent: "from-amber-500/20 to-amber-500/5", img: `${img}/toolbox.png` },
    { icon: Film, title: "Video Editor", desc: "Multi-layer timeline with video, audio, and subtitle tracks. Overlay system with text, images, video PiP, and shapes. 5 transition types (crossfade, wipe, slide, dissolve, fade). Blend modes, opacity, scrolling text, undo/redo. Aspect ratio per project (16:9, 9:16, 1:1). Export to MP4 or WAV.", span: "md:col-span-2", accent: "from-emerald-500/20 to-emerald-500/5", img: `${img}/fileBrowser.png` },
    { icon: Zap, title: "AI Director & Agent", desc: "AI Director with 22 tools — breaks scripts into shots, generates storyboards, manages elements. Agent Mode for multi-step execution with plan approval. Visual Lock: vision-analyze reference images and rewrite the script to match. Director's View filmstrip with comparison mode, animatic playback, and snapshot continuity bridge.", span: "", accent: "from-rose-500/20 to-rose-500/5", img: `${img}/storyboard_home.png` },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes scroll-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @keyframes scroll-down { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
        @keyframes pulse-line { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }
        .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 inset-x-0 z-40 backdrop-blur-2xl bg-[#09090b]/85 border-b border-white/[0.06]">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/storytica" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Film className="w-4 h-4 text-[#09090b]" />
            </div>
            <span className="font-display text-[16px] font-extrabold tracking-tight">
              <span className="text-teal-400">STORY</span><span className="text-amber-400">TICA</span>
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8 font-body text-[13px]">
            <a href="#features" className="text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#pipeline" className="text-white/50 hover:text-white transition-colors">How It Works</a>
            <a href="#models" className="text-white/50 hover:text-white transition-colors">AI Models</a>
            <a href="#pricing" className="text-white/50 hover:text-white transition-colors">Pricing</a>
            <a href="/community" className="text-white/50 hover:text-white transition-colors">Community</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href="/sign-in" className="font-body text-[13px] text-white/50 hover:text-white px-3 py-1.5 transition-colors">Log In</a>
            <a href="/sign-up" className="font-body text-[13px] font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-[#09090b] px-5 py-2 rounded-lg transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-400/30">
              Start Free
            </a>
          </div>
          <button onClick={() => setNav(!nav)} className="md:hidden text-white/60">{nav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        </div>
        {nav && (
          <div className="md:hidden bg-[#09090b] border-t border-white/[0.06] px-6 py-5 space-y-3 font-body">
            {[["Features", "#features"], ["How It Works", "#pipeline"], ["AI Models", "#models"], ["Pricing", "#pricing"], ["Community", "/community"]].map(([l, h]) => (
              <a key={l} href={h} onClick={() => setNav(false)} className="block text-sm text-white/60">{l}</a>
            ))}
            <a href="/sign-up" className="block text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 text-[#09090b] px-4 py-2.5 rounded-lg text-center mt-3">Start Free</a>
          </div>
        )}
      </nav>

      {/* ═══ HERO — split layout (Zopia-inspired) ═══ */}
      <section className="relative pt-28 pb-10 lg:pt-36 lg:pb-16 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-[30%] -translate-x-1/2 w-[700px] h-[500px] bg-gradient-radial from-teal-500/[0.07] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-[10%] w-[400px] h-[400px] bg-gradient-radial from-amber-500/[0.05] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-12 items-center">

            {/* ── Left: headline + CTA ── */}
            <div>
              {/* Welcome label (Zopia-style) */}
              <div className={`flex items-center gap-2.5 mb-5 transition-all duration-700 ${ready ? "opacity-100" : "opacity-0 translate-y-3"}`}>
                <span className="w-6 h-[2px] bg-amber-400/70" />
                <span className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/80">Welcome to Storytica</span>
              </div>

              {/* Headline with rotating word */}
              <h1 className={`font-display text-[2.4rem] sm:text-[3rem] lg:text-[3.6rem] font-extrabold leading-[1.08] tracking-[-0.02em] mb-4 text-amber-300 transition-all duration-1000 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "150ms" }}>
                From Script to{" "}
                <span className="text-teal-400">
                  <RotatingWord words={["Storyboard", "Animatic", "Short Film", "Pitch Deck", "Music Video"]} />
                </span>
                <br />
                in Minutes
              </h1>

              <p className={`font-body text-[15px] text-white/50 leading-relaxed max-w-lg mb-5 transition-all duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "300ms" }}>
                The director's studio — not an autonomous video generator. You control every frame: set genre, camera, and style, then generate with 29+ AI models across image, video, music, and audio. Script to export, all in one pipeline.
              </p>

              {/* Bullets */}
              <div className={`flex flex-col gap-2 mb-7 transition-all duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "420ms" }}>
                {["29+ AI models — 16 image, 6 video, 12 inpaint, music, audio, utility", "16 genre presets + 12 format presets for cinematic control", "Camera Studio with 9 cameras, 6 lenses & 15 motion presets", "AI Director + Visual Lock + 12-model inpaint suite + video editor", "Files kept as long as you're active — no 30-day auto-deletion like other platforms"].map(b => (
                  <span key={b} className="flex items-center gap-2.5 font-body text-[13px] text-white/50"><Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />{b}</span>
                ))}
              </div>

              {/* CTA row */}
              <div className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "550ms" }}>
                <a href="/sign-up" className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-[#09090b] font-display font-bold text-[15px] px-7 py-3.5 rounded-xl transition-all shadow-xl shadow-teal-500/20 hover:shadow-teal-400/30 hover:scale-[1.02]">
                  Start Creating Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a href="#pipeline" className="group inline-flex items-center gap-2 font-body text-[14px] text-white/50 hover:text-white/80 transition-colors py-3.5">
                  <span className="w-9 h-9 rounded-full border border-white/[0.12] flex items-center justify-center group-hover:border-white/25 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                  </span>
                  See How It Works
                </a>
              </div>
            </div>

            {/* ── Right: animated vertical scroll gallery (Zopia-style) ── */}
            <div className={`relative h-[540px] lg:h-[600px] overflow-hidden transition-all duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "300ms" }}>
              {/* Fade edges top/bottom */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#09090b] to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#09090b] to-transparent z-10 pointer-events-none" />

              <div className="grid grid-cols-2 gap-2.5 h-full">
                {/* Col 1 — scrolls UP */}
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-2.5 animate-[scroll-up_25s_linear_infinite]">
                    {[...Array(2)].map((_, loop) => (
                      <div key={`col1-${loop}`} className="flex flex-col gap-2.5">
                        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                          <img src={`${img}/landingpage/ai-generated-1776564835359.png`} alt="Fashion portrait" className="w-full h-auto block" loading="eager" />
                        </div>
                        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                          <img src={`${img}/landingpage/ai-generated-1776565815642.png`} alt="F1 racing" className="w-full h-auto block" loading="eager" />
                        </div>
                        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                          <img src={`${img}/landingpage/frame-1777388908053.png`} alt="Mech warrior" className="w-full h-auto block" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 2 — scrolls DOWN (opposite direction) */}
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-2.5 animate-[scroll-down_30s_linear_infinite]">
                    {[...Array(2)].map((_, loop) => (
                      <div key={`col2-${loop}`} className="flex flex-col gap-2.5">
                        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                          <img src={`${img}/landingpage/ai-generated-1776566652328.png`} alt="Astronaut art" className="w-full h-auto block" loading="eager" />
                        </div>
                        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                          <img src={`${img}/landingpage/ai-generated-1776566625832.png`} alt="Magazine cover" className="w-full h-auto block" />
                        </div>
                        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                          <img src={`${img}/landingpage/ai-generated-1776565519417.png`} alt="Cinematic scene" className="w-full h-auto block" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      {stats && (stats.totalCreators > 0 || stats.totalProjects > 0 || stats.totalGenerations > 0) && (
        <section className="py-10 border-y border-white/[0.06]">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-20">
              {[
                { label: "Creators", value: stats.totalCreators, icon: Users },
                { label: "Projects Created", value: stats.totalProjects, icon: Layers },
                { label: "AI Generations", value: stats.totalGenerations, icon: Sparkles },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-teal-400" />
                  </div>
                  <div>
                    <div className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      <Counter target={s.value} />
                    </div>
                    <div className="font-body text-[11px] text-white/40 uppercase tracking-wider">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ AUTO-SCROLLING MODEL TICKER ═══ */}
      <section className="py-8 overflow-hidden border-b border-white/[0.06]">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#09090b] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#09090b] to-transparent z-10" />
          <div className="flex gap-4 animate-[scroll_35s_linear_infinite]" style={{ width: "max-content" }}>
            {[...models, ...models].map((m, i) => {
              const c = typeColor(m.type);
              return (
                <div key={`${m.name}-${i}`} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-${c}-500/10`}>
                    <m.icon className={`w-3.5 h-3.5 text-${c}-400`} />
                  </div>
                  <div>
                    <div className="font-body text-[12px] font-semibold text-white/90">{m.name}</div>
                    <div className="font-body text-[10px] text-white/35">{m.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ PIPELINE (Zopia-inspired) ═══ */}
      <section id="pipeline" className="py-24 lg:py-32 relative">
        <div className="max-w-[1280px] mx-auto px-6">
          <R>
            <div className="text-center mb-16">
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/80 mb-3 block">How It Works</span>
              <h2 className="font-display text-[2rem] lg:text-[3rem] font-extrabold tracking-tight mb-4">
                Five Steps to <span className="bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">Production</span>
              </h2>
              <p className="font-body text-[15px] text-white/45 max-w-xl mx-auto">From blank page to finished export. The AI Director handles the heavy lifting — you stay in creative control.</p>
            </div>
          </R>

          {/* Pipeline flow */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
            {pipeline.map((step, i) => (
              <R key={step.label} delay={i * 100}>
                <div className="relative group">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 h-full">
                    {/* Step number */}
                    <div className="font-display text-[10px] font-bold text-amber-400/60 uppercase tracking-[0.2em] mb-4">Step {i + 1}</div>
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/15 to-teal-500/5 border border-teal-500/20 flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-teal-500/10 transition-shadow">
                      <step.icon className="w-5 h-5 text-teal-400" />
                    </div>
                    <h3 className="font-display text-[15px] font-bold text-white mb-1.5">{step.label}</h3>
                    <p className="font-body text-[12px] text-white/40 leading-relaxed">{step.desc}</p>
                  </div>
                  {/* Connector arrow (not on last) */}
                  {i < pipeline.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 lg:-right-4 -translate-y-1/2 z-10">
                      <ArrowRight className="w-4 h-4 text-white/15" style={{ animation: "pulse-line 2s ease-in-out infinite", animationDelay: `${i * 300}ms` }} />
                    </div>
                  )}
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BENTO FEATURES (Storyboarder.ai-inspired) ═══ */}
      <section id="features" className="py-24 lg:py-32 bg-[#07070a]">
        <div className="max-w-[1280px] mx-auto px-6">
          <R>
            <div className="text-center mb-16">
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/80 mb-3 block">Core Features</span>
              <h2 className="font-display text-[2rem] lg:text-[3rem] font-extrabold tracking-tight mb-4">
                Built for Every <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Creative Workflow</span>
              </h2>
              <p className="font-body text-[15px] text-white/45 max-w-2xl mx-auto">From storyboarding to video generation — full visual and structural control in a single workspace.</p>
            </div>
          </R>

          {/* Bento grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {bentoFeatures.map((f, i) => (
              <R key={f.title} delay={i * 80}>
                <div className={`${f.span} group relative bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-500`}>
                  {/* Gradient hover effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  {/* Image */}
                  <div className="relative aspect-[2/1] overflow-hidden">
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/40 to-transparent" />
                  </div>
                  {/* Content */}
                  <div className="relative p-6 -mt-8">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                        <f.icon className="w-4 h-4 text-teal-400" />
                      </div>
                      <h3 className="font-display text-[15px] font-bold text-white">{f.title}</h3>
                    </div>
                    <p className="font-body text-[13px] text-white/45 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </R>
            ))}
          </div>

          {/* Compact feature row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {[
              { icon: Film, t: "Genre & Format System", d: "16 genre presets shape mood and lighting. 12 format presets control framing and pacing. Two independent axes — pick Cinematic + YouTube or Horror + Reel. Custom genres supported.", accent: "amber" },
              { icon: Camera, t: "Camera System", d: "3D angle picker with wireframe globe. Camera Studio: 9 bodies, 6 lenses, 8 focal lengths, 6 apertures. 15 motion presets. Speed ramps (8 types). Save presets across projects.", accent: "blue" },
              { icon: Layers, t: "Element Forge", d: "Build characters with a structured wizard — gender, build, archetype, outfit, and more. Simple (3 tabs) or Advanced (8 tabs) mode. Multi-model generation with variant system. @mention in prompts for consistency.", accent: "rose" },
              { icon: Box, t: "Director's View", d: "Filmstrip with scene grouping, drag reorder, comparison mode, animatic playback. Snapshot-to-next for continuity. Director's notes per frame. Generated outputs row.", accent: "violet" },
            ].map((f, i) => (
              <R key={f.t} delay={i * 60}>
                <div className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 h-full hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
                  <f.icon className={`w-4 h-4 text-${f.accent}-400 mb-3`} />
                  <div className="font-display text-[13px] font-bold text-white mb-1">{f.t}</div>
                  <div className="font-body text-[11px] text-white/40 leading-relaxed">{f.d}</div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI MODELS SHOWCASE (Higgsfield-inspired) ═══ */}
      <section id="models" className="py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-6">
          <R>
            <div className="text-center mb-10">
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/80 mb-3 block">AI Engine</span>
              <h2 className="font-display text-[2rem] lg:text-[3rem] font-extrabold tracking-tight mb-4">
                <span className="text-white">29+ Models.</span>{" "}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">One Studio.</span>
              </h2>
              <p className="font-body text-[15px] text-white/45 max-w-xl mx-auto">Image, video, music, audio, and utility models — all accessible from the same workspace.</p>
            </div>
          </R>

          {/* Category tabs */}
          <R>
            <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
              {["All", "Image", "Video", "Music", "Audio", "Utility"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setModelFilter(tab)}
                  className={`font-body text-[12px] font-medium px-4 py-2 rounded-lg transition-all ${
                    modelFilter === tab
                      ? "bg-white/[0.1] text-white border border-white/[0.15]"
                      : "text-white/40 hover:text-white/70 border border-transparent hover:border-white/[0.06]"
                  }`}
                >
                  {tab} {tab !== "All" && <span className="text-white/25 ml-1">{models.filter(m => m.type === tab).length}</span>}
                </button>
              ))}
            </div>
          </R>

          {/* Model grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredModels.map((m, i) => {
              const c = typeColor(m.type);
              return (
                <R key={m.name} delay={i * 30}>
                  <div className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 cursor-default">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-${c}-500/10 border border-${c}-500/20 flex items-center justify-center shrink-0 group-hover:shadow-lg group-hover:shadow-${c}-500/10 transition-shadow`}>
                        <m.icon className={`w-4 h-4 text-${c}-400`} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-body text-[13px] font-semibold text-white/90 truncate">{m.name}</div>
                        <div className="font-body text-[11px] text-white/35">{m.sub}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`font-body text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-${c}-500/10 text-${c}-400`}>{m.type}</span>
                    </div>
                  </div>
                </R>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SHOWCASE SCREENSHOTS ═══ */}
      <section className="py-24 lg:py-32 bg-[#07070a]">
        <div className="max-w-[1280px] mx-auto px-6">
          <R>
            <div className="text-center mb-16">
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/80 mb-3 block">In Action</span>
              <h2 className="font-display text-[2rem] lg:text-[3rem] font-extrabold tracking-tight">
                See the <span className="bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">Studio</span>
              </h2>
            </div>
          </R>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              { title: "Storyboard Workspace", desc: "Script-to-storyboard with genre presets, batch generation, and Director's View filmstrip", img: `${img}/storyboardItem.png` },
              { title: "AI Generation Panel", desc: "29+ models with genre/format pill, Camera Studio, and real-time cost preview", img: `${img}/AIModal.png` },
              { title: "Cinema Studio", desc: "Camera Studio (9 bodies, 6 lenses), Cinema Grade, 10 post-processing tools, 3D angle picker", img: `${img}/toolbox.png` },
              { title: "Element Forge", desc: "Structured character wizard with variants, reference photos, and @mention consistency", img: `${img}/elementLibrary.png` },
            ].map((s, i) => (
              <R key={s.title} delay={i * 80}>
                <div className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={s.img} alt={s.title} className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-display text-[14px] font-bold text-white mb-1">{s.title}</h3>
                    <p className="font-body text-[12px] text-white/45">{s.desc}</p>
                  </div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY STORYTICA ═══ */}
      <section className="py-24 lg:py-28">
        <div className="max-w-[1280px] mx-auto px-6">
          <R><WhyStorytica /></R>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-24 bg-[#07070a]">
        <div className="max-w-[1000px] mx-auto px-6">
          <R>
            <div className="text-center mb-12">
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/80 mb-3 block">Testimonials</span>
              <h2 className="font-display text-[2rem] lg:text-[2.5rem] font-extrabold tracking-tight">What Creators Say</h2>
            </div>
          </R>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { n: "Jamie T.", r: "Indie Filmmaker", q: "The AI storyboard was so good I turned a quick concept into a short film. What took two days now takes 20 minutes." },
              { n: "Mei L.", r: "Content Creator", q: "I describe what I want and have visual frames in seconds. The video generation is a game-changer for TikTok." },
              { n: "Ryan K.", r: "Creative Director", q: "We generate professional storyboards for each client pitch in minutes. They love the visual quality." },
              { n: "Sophia W.", r: "Student Filmmaker", q: "The element library keeps my characters consistent across every scene. My thesis storyboard looked professional." },
            ].map((t, i) => (
              <R key={t.n} delay={i * 80}>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 h-full hover:border-white/[0.1] transition-colors">
                  <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}</div>
                  <p className="font-body text-[14px] text-white/60 leading-relaxed mb-5 italic">&quot;{t.q}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/30 to-emerald-500/30 flex items-center justify-center">
                      <span className="font-display text-[11px] font-bold text-teal-300">{t.n[0]}</span>
                    </div>
                    <div>
                      <div className="font-body text-[13px] font-semibold text-white">{t.n}</div>
                      <div className="font-body text-[11px] text-white/35">{t.r}</div>
                    </div>
                  </div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="py-10 border-y border-white/[0.06]">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {[
              { icon: Shield, text: "Content never trains AI" },
              { icon: Coins, text: "Credits never expire" },
              { icon: HardDrive, text: "Files kept while active" },
              { icon: Zap, text: "No watermarks on exports" },
              { icon: Users, text: "Team & org support" },
              { icon: Download, text: "PDF, MP4, WAV export" },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2">
                <t.icon className="w-3.5 h-3.5 text-white/25" />
                <span className="font-body text-[12px] text-white/40">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <R>
            <PricingShowcase
              onSelectPlan={() => (window.location.href = "/sign-up")}
              isLoggedIn={!!user}
              compact
            />
          </R>
          <R>
            <div className="text-center mt-4">
              <a href="/pricing" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-body text-sm font-medium transition-colors">
                View full pricing, features & comparison <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </R>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-24 bg-[#07070a]">
        <div className="max-w-[700px] mx-auto px-6">
          <R>
            <div className="text-center mb-10">
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/80 mb-3 block">FAQ</span>
              <h2 className="font-display text-[1.8rem] lg:text-[2.2rem] font-extrabold tracking-tight">Frequently Asked Questions</h2>
            </div>
          </R>
          <R><div>
            <Faq q="What AI models are available?" a="25+ models across 5 categories. Image: Nano Banana 2, Nano Banana Pro, GPT Image 2, Z-Image, Flux 2 Pro, Flux 2 Flex Image-to-Image, Character Edit, Nano Banana Edit, Crisp Upscale, Topaz Image Upscale. Video: Seedance 1.5/2.0/2.0 Fast, Kling 3.0 Motion, Veo 3.1, Grok Imagine, Topaz Video Upscale, InfiniteTalk. Music: AI Music, Cover Song, Extend Music, Create Persona. Audio: ElevenLabs TTS. Utility: AI Analyze (image/video/audio), Prompt Enhance." />
            <Faq q="Can I maintain consistent characters?" a="Yes. Element Forge lets you build characters with a structured wizard (gender, build, archetype, outfit). Generate variants with multiple models. @mention characters in prompts — reference images auto-attach at generation time." />
            <Faq q="How does the credit system work?" a="Each generation costs credits based on model, resolution, and duration. Exact cost shown before generating. Free plan includes 50 credits/month for your first 3 months — enough to try every model and build real projects. After that, top-up packs start from $9.90 or upgrade to Pro for 3,500 credits/month." />
            <Faq q="Is there a video editor?" a="Yes. Multi-layer timeline with video, audio, and subtitle tracks. Overlay system for text, images, video picture-in-picture, and shapes. 5 transition types (crossfade, wipe, slide, dissolve, fade-to-color). Blend modes, opacity control, scrolling text overlays, and aspect ratio selector (16:9, 9:16, 1:1). Export to MP4 or WAV." />
            <Faq q="Is there an AI Director?" a="Yes. The AI Director has 22 tools — breaks scripts into shots, generates storyboards, manages elements, and controls your entire project. Agent Mode enables autonomous multi-step execution with plan approval. Visual Lock vision-analyzes your reference images and rewrites the script to match them. Director's View filmstrip with comparison mode, animatic playback, snapshot continuity bridge, and director notes per frame." />
            <Faq q="What is the Genre & Format system?" a="16 genre presets (Cinematic, Horror, Noir, Sci-Fi, Fantasy, Anime, Cyberpunk, and more) control mood, lighting, and color grading. 12 format presets (Film, YouTube, Reel/TikTok, Commercial, Music Video, and more) control framing, pacing, and camera behavior. They work as two independent axes — combine any genre with any format. You can also create custom genres." />
            <Faq q="Are my generated files ever deleted?" a="Your files stay in your library as long as your account is active. If your account has no activity for 12 months, we'll send you a warning email — simply log back in to keep everything. This is still far more generous than other AI platforms that auto-delete files after just 30 days regardless of activity. Only temporary processing files are cleaned up automatically." />
            <Faq q="Does it support team collaboration?" a="Yes. Create organizations, invite members with roles (Admin, Member, Viewer). Members share the org's credit pool and storage." />
            <Faq q="Is there a free plan?" a="Yes. 50 credits/month for your first 3 months, 300MB storage, no credit card required. That's 150 credits total — enough to generate 37 images or explore video, music, and audio AI. Upgrade anytime for more credits and pro workflow tools." />
          </div></R>
          <R>
            <div className="mt-8 text-center">
              <a href="/faq" className="inline-flex items-center gap-2 font-body text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium">
                View all FAQ <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </R>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.05] via-transparent to-amber-500/[0.03]" />
        <R>
          <div className="max-w-[800px] mx-auto px-6 text-center relative z-10">
            <h2 className="font-display text-[2rem] lg:text-[3rem] font-extrabold tracking-tight mb-4">
              Ready to create your{" "}
              <span className="bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">next story</span>?
            </h2>
            <p className="font-body text-[15px] text-white/45 mb-8 max-w-lg mx-auto">29+ AI models. 16 genre presets. Camera Studio. AI Director + Visual Lock. 12-model inpaint suite. Multi-layer video editor. Music generation. Start free — no credit card required.</p>
            <a href="/sign-up" className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-[#09090b] font-display font-bold text-base px-10 py-4 rounded-xl transition-all shadow-xl shadow-teal-500/20 hover:shadow-teal-400/30 hover:scale-[1.02]">
              Start Creating Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </R>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/[0.06] py-14 bg-[#07070a]">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                  <Film className="w-3.5 h-3.5 text-[#09090b]" />
                </div>
                <span className="font-display text-[14px] font-extrabold">
                  <span className="text-teal-400">STORY</span><span className="text-amber-400">TICA</span>
                </span>
              </div>
              <p className="font-body text-[12px] text-white/35 leading-relaxed">AI-powered storyboard studio for creators, filmmakers, and teams.</p>
            </div>
            {[
              { t: "Product", l: [
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "AI Models", href: "#models" },
                { label: "Community", href: "/community" },
              ]},
              { t: "Resources", l: [
                { label: "FAQ", href: "/faq" },
                { label: "Docs", href: "#" },
                { label: "Tutorials", href: "#" },
                { label: "Blog", href: "#" },
              ]},
              { t: "Legal", l: [
                { label: "Privacy", href: "#" },
                { label: "Terms", href: "#" },
                { label: "Billing Policy", href: "/billing-policy" },
              ]},
            ].map(c => (
              <div key={c.t}>
                <div className="font-body text-[11px] font-bold text-white/30 uppercase tracking-wider mb-4">{c.t}</div>
                <ul className="space-y-2.5">{c.l.map(l => <li key={l.label}><a href={l.href} className="font-body text-[13px] text-white/45 hover:text-white transition-colors">{l.label}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-body text-[11px] text-white/30">&copy; {new Date().getFullYear()} Storytica. All rights reserved.</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-white/25" />
              <span className="font-body text-[11px] text-white/30">Content never used to train AI</span>
            </div>
          </div>
        </div>
      </footer>

      <SupportChatWidget variant="landing" />
    </div>
  );
}