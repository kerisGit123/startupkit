"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";

/* ─── FAQ data ────────────────────────────────────────────────────────── */
interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is Storytica?",
        a: "Storytica is an AI-powered storyboard studio for filmmakers, content creators, creative directors, and production teams. It turns text scripts and prompts into visual storyboards with AI-generated images, video, audio, and music.",
      },
      {
        q: "How do I sign up?",
        a: "Visit /sign-up to create a free account. No credit card required. You get 50 credits/month, 3 projects, and 300 MB storage immediately.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes! The free plan includes 50 credits/month, 3 projects, and 300 MB storage. No credit card required. Upgrade anytime for more credits, storage, and team features.",
      },
      {
        q: "What can I create with Storytica?",
        a: "You can generate storyboard frames from text prompts, create video clips, generate music and audio, edit with a canvas editor (brush, inpaint, text, shapes, speech bubbles), maintain consistent characters with the Element Library, and export as PDF, PNG/JPG, video, or script text.",
      },
    ],
  },
  {
    title: "AI Models",
    items: [
      {
        q: "What AI models are available?",
        a: "25+ models across 4 categories. Image: Nano Banana 2, Nano Banana Pro, GPT Image 2, Z-Image, Flux 2 Pro, Character Edit, Nano Banana Edit. Video: Seedance 1.5 Pro, Seedance 2.0 (480p/720p), Kling 3.0 Motion, Veo 3.1. Music: AI Music, Cover Song. Audio: ElevenLabs TTS. Plus AI Analyze and Prompt Enhance.",
      },
      {
        q: "How much does Nano Banana 2 cost?",
        a: "General-purpose image model. 5 credits (1K), 8 credits (2K), 12 credits (4K). With 1,000 credits you can generate around 200 images at 1K quality.",
      },
      {
        q: "How much does GPT Image 2 cost?",
        a: "Photorealistic image model. 4 credits per image (text-to-image or image-to-image). With 1,000 credits you can generate around 250 images. Supports up to 16 reference images.",
      },
      {
        q: "How much does Seedance 2.0 cost?",
        a: "High-quality video generation, priced per second. With video input (480p 5s): ~36 credits. Text-to-video (480p 5s): ~60 credits. 720p costs more. Pro plan (3,500 credits) gets you around 97 videos at 480p with video input.",
      },
      {
        q: "How much does Seedance 2.0 Fast cost?",
        a: "Faster rendering at lower cost. With video input (480p 5s): 29 credits. Text-to-video (480p 5s): ~49 credits. Pro plan (3,500 credits) gets you around 120 videos at 480p with video input.",
      },
      {
        q: "How much does Seedance 1.5 Pro cost?",
        a: "Great value video model. 480p 4s: just 5 credits. 720p and longer durations cost more. Pro plan (3,500 credits) gets you around 700 videos at 480p 4s.",
      },
      {
        q: "How much does Z-Image cost?",
        a: "The cheapest image model at just 1 credit per image. Perfect for quick iterations, drafts, and brainstorming. With 1,000 credits you can generate around 1,000 images.",
      },
      {
        q: "Which image model should I use?",
        a: "Nano Banana 2 (5 credits) is great for general storyboard frames. GPT Image 2 (4 credits) excels at photorealism. Z-Image (1 credit) is cheapest for quick iterations. Nano Banana Pro offers the highest quality.",
      },
      {
        q: "Which video model should I use?",
        a: "Seedance 2.0 Fast is the best value for quick video. Seedance 2.0 offers higher quality. Seedance 1.5 Pro is a solid all-rounder. Kling 3.0 Motion is best for motion control. Veo 3.1 is Google's latest.",
      },
      {
        q: "Can I maintain consistent characters across scenes?",
        a: "Yes. The Element Library lets you save characters, props, and styles with reference images. Drag them into any frame or use @Image tags in prompts to maintain consistency across your entire storyboard.",
      },
      {
        q: "What is Prompt Enhance?",
        a: "Prompt Enhance (1 credit) uses AI to improve your text prompts for better generation results. It adds detail, composition guidance, and stylistic suggestions to get higher quality outputs.",
      },
      {
        q: "What is AI Analyze?",
        a: "AI Analyze lets you analyze images (1 credit), videos (3 credits), or audio (1 credit) to get descriptions, identify content, or extract details you can use to refine your prompts.",
      },
    ],
  },
  {
    title: "Credits & Pricing",
    items: [
      {
        q: "How does the credit system work?",
        a: "Each AI generation costs credits based on the model, resolution, and duration. The exact cost is always shown before you generate. Credits never expire.",
      },
      {
        q: "How much do generations cost?",
        a: "Costs vary by model, resolution, and duration. The exact credit cost is always shown in the generation panel before you confirm. Cheaper models like Z-Image start from 1 credit per image, while premium models cost more.",
      },
      {
        q: "How many images can I generate with my credits?",
        a: "With Pro plan (3,500 credits/mo): GPT Image 2 ~875 images. Nano Banana 2 ~700 images (1K). Z-Image ~3,500 images. For video: Seedance 1.5 Pro ~700 clips (480p 4s). Seedance 2.0 Fast ~120 clips (480p 5s with video input). Free plan (50 credits): ~12 images or ~10 short videos.",
      },
      {
        q: "What are the subscription plans?",
        a: "Free: 50 credits/month, 3 projects, 300 MB. Pro (from $39.90/mo): 3,500 credits/month, unlimited projects, 10 GB, 5 seats, 1 org. Business (from $89.90/mo): 8,000 credits/month, unlimited projects, 20 GB, 15 seats, 3 orgs.",
      },
      {
        q: "Can I buy extra credits?",
        a: "Yes. Credit top-up packs are available as one-time purchases — no subscription required. Top-ups start from $9.90 and credits never expire.",
      },
      {
        q: "Do credits expire?",
        a: "No. Credits never expire, whether they come from your subscription or a top-up purchase.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, you can cancel anytime from your account settings. You keep access and remaining credits until the end of your billing period.",
      },
    ],
  },
  {
    title: "Model Tips & Best Practices",
    items: [
      {
        q: "Tips for Nano Banana 2",
        a: "Use 1K for drafts and iteration (5 credits), switch to 2K/4K only for final frames. Works well with all art styles. Add @Image elements for character consistency. Pair with Prompt Enhance (1 credit) to improve your prompts before generating.",
      },
      {
        q: "Tips for GPT Image 2",
        a: "Our cheapest image model at 4 credits. Excels at photorealism and text in images. Use image-to-image mode with up to 16 reference images for style matching. Great for product shots and realistic scenes. Use for final hero frames after drafting with Z-Image.",
      },
      {
        q: "Tips for Seedance 2.0 and 2.0 Fast",
        a: "Use image-to-video mode (cheaper + better quality with reference). Start at 480p for previews, upgrade to 720p for finals. Keep clips 5s for best cost-to-quality ratio. Generate the image first with NB2/GPT, then animate. Use Motion presets for camera movement control.",
      },
      {
        q: "Tips for Seedance 1.5 Pro",
        a: "Cheapest video at 5 credits (480p 4s). Enable audio for synced SFX and dialogue. Draft without audio first, add it on final versions (audio doubles the cost). Supports 1080p for high-res output. Great for dialogue scenes with lip sync.",
      },
      {
        q: "Tips for Z-Image",
        a: "Use for rapid iteration and brainstorming at just 1 credit per image. Generate 10-20 variations, pick the best composition, then regenerate with Nano Banana 2 or GPT Image 2 for final quality. Great for prompt testing before spending more credits.",
      },
      {
        q: "Image-to-video vs text-to-video?",
        a: "Image-to-video (img2vid) is cheaper, gives better quality (model has a reference frame), and offers more control. Text-to-video (txt2vid) needs no reference but costs more. Recommendation: generate an image first, then use img2vid to animate it.",
      },
      {
        q: "Audio vs no audio in Seedance 1.5 Pro?",
        a: "With audio (2x cost): synced sound effects, dialogue/lip sync, background music. Great for final presentations. Without audio (half cost): visual only, best for storyboard previews. Tip: draft without audio, add it on final versions.",
      },
    ],
  },
  {
    title: "Features & Tools",
    items: [
      {
        q: "How does Script to Storyboard work?",
        a: "Write or paste your script, click Generate Storyboard, and AI breaks it into scenes. Each scene becomes a frame with dialogue and camera notes. Tip: include camera directions in your script (e.g. CLOSE-UP, WIDE SHOT) for better results.",
      },
      {
        q: "What is the Canvas Editor?",
        a: "A built-in editor for refining frames. Tools include: Brush (draw directly), Inpaint (AI regenerates selected areas), Text overlays, Shapes, Speech Bubbles, and Stickers. Tip: use Inpaint to fix small areas without regenerating the whole frame.",
      },
      {
        q: "What is the Element Library?",
        a: "Save reusable characters, props, and styles with reference images. Add elements via the sidebar, then drag into frames or use @Image tags in prompts. Elements are shared across all projects for consistent characters.",
      },
      {
        q: "What is the Prompt Library?",
        a: "Save and reuse your favorite prompts. Build a collection for different styles, scenes, and moods. Quickly generate consistent results across projects.",
      },
      {
        q: "Is there a video editor?",
        a: "Yes (Pro+). Multi-track timeline with video and audio tracks. Split, trim, reorder clips, add subtitles, apply blend modes, snapshot frames, and export to MP4 or WAV.",
      },
      {
        q: "What is Camera Studio?",
        a: "Virtual camera control (Pro+). Features: 3D Angle Picker for setting camera angles visually, 15+ Motion Presets (dolly, pan, tilt, tracking), Speed Ramp for dynamic pacing, and Color Palette for mood and grading. Use Motion Presets with Seedance models for cinematic camera movement.",
      },
      {
        q: "What is Director's View?",
        a: "Review mode for your storyboard (Pro+). Filmstrip view of all frames, side-by-side frame comparison, animatic playback, and production notes. Use Compare mode to pick the best version of a frame.",
      },
      {
        q: "What is Batch Generation?",
        a: "Generate multiple frames at once (Pro+). Select frames, choose model and settings, and all selected frames generate simultaneously. Use with Presets to apply the same style across all frames.",
      },
      {
        q: "What is AI Analyze?",
        a: "Understand your content: Image analysis (1 credit) describes composition, style, objects. Video analysis (3 credits) provides scene breakdown, actions, transitions. Audio analysis (1 credit) gives transcription. Tip: use on reference images to generate prompts that match the style.",
      },
      {
        q: "What is Prompt Enhance?",
        a: "Improves your prompts for 1 credit. Adds detail and composition guidance, suggests stylistic improvements, optimizes for the selected AI model. Write a basic prompt, then Enhance it before generating for better results on the first try.",
      },
      {
        q: "How do I export my storyboard?",
        a: "Export as PDF (landscape format with visuals), individual PNG/JPG frames, video animatics via the timeline editor, or script-only text. All exports are available from the storyboard view.",
      },
      {
        q: "Can I generate music?",
        a: "Yes (Pro+). AI Music generates original tracks from text descriptions. Cover Song re-sings with different personas. Extend Music continues an existing clip. Create Persona builds a custom voice for Cover Song.",
      },
    ],
  },
  {
    title: "Team & Collaboration",
    items: [
      {
        q: "Does it support team collaboration?",
        a: "Yes. Create organizations, invite members with roles (Admin, Member, Viewer). Team members share the organization's credit pool and storage.",
      },
      {
        q: "How many team members can I have?",
        a: "Free: 1 user only. Pro: up to 5 seats with 1 organization. Business: up to 15 seats with 3 organizations.",
      },
      {
        q: "What are the team roles?",
        a: "Admin: full access including billing and member management. Member: can create and edit storyboards, use credits. Viewer: read-only access to view storyboards.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        q: "Is my content used to train AI?",
        a: "No. Your content is never used to train AI models. Your creative work remains yours.",
      },
      {
        q: "Where are my files stored?",
        a: "Files are stored privately on Cloudflare R2 cloud storage. Only you and your team members can access your files.",
      },
      {
        q: "Is my data safe?",
        a: "Yes. We use industry-standard encryption and security practices. Authentication is handled by Clerk, and payments are processed securely by Stripe.",
      },
    ],
  },
];

/* ─── Accordion item ──────────────────────────────────────────────────── */
function FaqBubble({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`w-full text-left rounded-xl border transition-all ${
        open
          ? "border-teal-500/30 bg-teal-500/5"
          : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a] hover:bg-[#1e1e1e]"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <span className="text-[15px] font-medium text-white/90">{q}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-[#666] transition-transform ${
            open ? "rotate-180 text-teal-400" : ""
          }`}
        />
      </div>
      {open && (
        <div className="px-5 pb-4 pt-0">
          <p className="text-sm text-[#999] leading-relaxed">{a}</p>
        </div>
      )}
    </button>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function FaqPage() {
  return (
    <main
      className="min-h-screen bg-[#111111] text-white"
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Nav bar */}
      <nav className="sticky top-0 z-40 backdrop-blur-2xl bg-[#111111]/90 border-b border-[#222222]">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-extrabold text-teal-400"
          >
            <div className="w-6 h-6 rounded bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-[#111111]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
            </div>
            STORYTICA
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-semibold text-[#111111] bg-teal-500 hover:bg-teal-400 px-4 py-1.5 rounded-lg transition-colors"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-[800px] mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-[2.2rem] md:text-[2.8rem] font-extrabold tracking-tight mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-[#888] text-base max-w-[500px] mx-auto">
          Everything you need to know about Storytica. Can&apos;t find what
          you&apos;re looking for? Open our chat support.
        </p>
      </div>

      {/* FAQ sections */}
      <div className="max-w-[700px] mx-auto px-6 pb-24 space-y-12">
        {FAQ_DATA.map((category) => (
          <section key={category.title}>
            <h2 className="text-lg font-bold text-teal-400 mb-4">
              {category.title}
            </h2>
            <div className="space-y-2">
              {category.items.map((item) => (
                <FaqBubble key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-8 text-center">
          <h3 className="text-lg font-bold mb-2">Still have questions?</h3>
          <p className="text-sm text-[#888] mb-5">
            Our support chat is available anytime. Or sign up and get started
            for free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-[#111111] font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="text-sm text-[#888] hover:text-white transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
