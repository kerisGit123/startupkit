"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageCircle, X, Send, Loader2, RotateCcw, Home, Search, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Tiny inline markdown renderer: bold (**x**), italic (*x*), and [text](url).
// No block-level support. Newlines are preserved by whitespace-pre-wrap in the
// parent container.
const INLINE_TOKEN_RE =
  /\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      parsed.protocol === "mailto:"
    );
  } catch {
    return false;
  }
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let key = 0;
  const re = new RegExp(INLINE_TOKEN_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) {
      nodes.push(
        <Fragment key={`t${key++}`}>{text.slice(lastIdx, m.index)}</Fragment>
      );
    }
    if (m[1] !== undefined) {
      nodes.push(<strong key={`b${key++}`}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      nodes.push(<em key={`i${key++}`}>{m[2]}</em>);
    } else if (m[3] !== undefined && m[4] !== undefined) {
      const url = m[4];
      if (isSafeUrl(url)) {
        nodes.push(
          <a
            key={`l${key++}`}
            href={url}
            target={url.startsWith("/") || url.startsWith("#") ? undefined : "_blank"}
            rel="noreferrer noopener"
            className="underline underline-offset-2 hover:opacity-80"
          >
            {m[3]}
          </a>
        );
      } else {
        nodes.push(<Fragment key={`u${key++}`}>{m[0]}</Fragment>);
      }
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    nodes.push(<Fragment key={`t${key++}`}>{text.slice(lastIdx)}</Fragment>);
  }
  return nodes;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
  /** User rating: 1 = thumbs up, -1 = thumbs down, undefined = not rated */
  rating?: 1 | -1;
}

/* ─── FAQ decision tree (hardcoded — zero API calls) ────────────────── */
interface FaqNode {
  q: string;
  a: string;
  /** Extra keywords that help search match this node (not shown to user) */
  tags?: string;
  followUp?: FaqNode[];
  /** If true, sends the question to the AI instead of showing hardcoded answer.
   *  Used for account-specific questions that need tool calls (balance, spending, etc.) */
  askAI?: boolean;
}

/** Top-level categories shown as tab buttons */
interface FaqCategory {
  label: string;
  icon: string;
  nodes: FaqNode[];
  /** Only show this category when the user is signed in */
  authOnly?: boolean;
}

const FAQ_TREE: FaqNode[] = [
  {
    q: "What does Storytica do?",
    a: "Storytica is an AI-powered storyboard studio.\n\n**What you can do:**\n- Write a script and generate visual storyboard frames\n- Create video clips, music, and audio\n- Edit with canvas editor (brush, inpaint, shapes)\n- Maintain consistent characters with Element Library\n- Collaborate with your team in real-time\n- Export as PDF, PNG/JPG, video, or script",
    followUp: [
      {
        q: "What AI models are available?",
        a: "**25+ models across 4 categories:**\n\n**Image:** Nano Banana 2, Nano Banana Pro, GPT Image 2, Z-Image, Character Edit, Nano Banana Edit\n\n**Video:** Seedance 1.5 Pro, Seedance 2.0, Seedance 2.0 Fast, Kling 3.0 Motion, Veo 3.1\n\n**Music:** AI Music, Cover Song\n\n**Audio:** ElevenLabs TTS\n\n**Utility:** AI Analyze, Prompt Enhance",
        followUp: [
          {
            q: "Nano Banana 2",
            a: "**Nano Banana 2** - General purpose image model\n\n**Credits per image:**\n- 1K quality: 5 credits\n- 2K quality: 10 credits\n- 4K quality: 18 credits\n\n**Per 1,000 credits:** ~200 images (1K)\n**Best for:** Storyboard frames, all styles",
            tags: "nano banana NB2 image price cost credits generation",
            followUp: [
              { q: "Tips for Nano Banana 2", a: "**Getting the best results:**\n\n- Use **1K** for drafts and iteration (5 cr)\n- Switch to **2K/4K** only for final frames\n- Works well with all art styles\n- Add **@Image** elements for character consistency\n- Use **Prompt Enhance** (1 cr) to improve prompts\n- Pair with **AI Analyze** to describe reference images", tags: "tips how to use nano banana" },
            ],
          },
          {
            q: "GPT Image 2",
            a: "**GPT Image 2** - Photorealistic image model\n\n**Credits:** 4 per image\n**Modes:** Text-to-image and image-to-image\n**Refs:** Up to 16 reference images\n\n**Per 1,000 credits:** ~250 images\n**Best for:** Photorealism, text rendering, product shots",
            tags: "gpt image GPT photorealistic price cost credits generation",
            followUp: [
              { q: "Tips for GPT Image 2", a: "**Getting the best results:**\n\n- Our **cheapest** image model at 4 credits\n- Excels at **photorealism** and **text in images**\n- Use **image-to-image** mode with up to 16 refs for style matching\n- Great for product shots and realistic scenes\n- Combine with **Element Library** for character consistency\n- Use for final hero frames after drafting with Z-Image", tags: "tips how to use gpt image" },
            ],
          },
          {
            q: "Seedance 2.0",
            a: "**Seedance 2.0** - High-quality video\n\n**480p (5s):**\n- With video input: ~36 credits\n- Text-to-video: ~60 credits\n\n**720p (5s):**\n- With video input: ~79 credits\n- Text-to-video: ~129 credits\n\n**Pro plan (3,500 cr):** ~97 videos (480p)",
            tags: "seedance 2 video price cost credits generation per second",
            followUp: [
              { q: "Tips for Seedance 2.0", a: "**Getting the best results:**\n\n- Use **image-to-video** mode (cheaper + better quality with reference)\n- Start at **480p** for previews, upgrade to 720p for finals\n- Keep clips **5s** for best cost-to-quality ratio\n- Use **Motion presets** for camera movement control\n- Generate the image first with NB2/GPT, then animate", tags: "tips how to use seedance 2" },
              { q: "img2vid vs txt2vid?", a: "**Image-to-video (img2vid):**\n- Cheaper (36 vs 60 cr at 480p 5s)\n- Better quality (has reference frame)\n- More control over the output\n\n**Text-to-video (txt2vid):**\n- No reference needed\n- Good for abstract/conceptual scenes\n- More expensive\n\n**Recommendation:** Generate an image first, then use img2vid.", tags: "image to video text to video difference" },
            ],
          },
          {
            q: "Seedance 2.0 Fast",
            a: "**Seedance 2.0 Fast** - Faster, lower cost\n\n**480p (5s):**\n- With video input: 29 credits\n- Text-to-video: ~49 credits\n\n**720p (5s):**\n- With video input: 63 credits\n- Text-to-video: ~104 credits\n\n**Pro plan (3,500 cr):** ~120 videos (480p)",
            tags: "seedance fast video price cost credits generation quick",
            followUp: [
              { q: "Tips for Seedance 2.0 Fast", a: "**Getting the best results:**\n\n- Best for **storyboard previews** and iteration\n- ~30% cheaper than Seedance 2.0\n- Use **img2vid** mode for best value (29 cr vs 49 cr)\n- Great for testing motion before committing to Seedance 2.0\n- Works well with **Speed Ramp** for dynamic pacing", tags: "tips how to use seedance fast" },
            ],
          },
          {
            q: "Seedance 1.5 Pro",
            a: "**Seedance 1.5 Pro** - Cinema quality + audio\n\n**480p:**\n- 4s: 5 credits (no audio) / 9 credits (audio)\n- 8s: 9 credits / 18 credits\n- 12s: 12 credits / 24 credits\n\n**720p:** 4s: 9 cr / 8s: 18 cr / 12s: 27 cr\n\n**Pro plan (3,500 cr):** ~700 videos (480p 4s)",
            tags: "seedance 1.5 video price cost credits generation cheap budget",
            followUp: [
              { q: "Tips for Seedance 1.5 Pro", a: "**Getting the best results:**\n\n- **Cheapest video** at 5 credits (480p 4s)\n- Enable **audio** for synced SFX and dialogue\n- Use **4s clips** for storyboard previews\n- Supports **1080p** for high-res final output\n- Great for dialogue scenes with lip sync\n- Use **Camera Studio** presets for cinematic shots", tags: "tips how to use seedance 1.5 cinema audio" },
              { q: "Audio vs no audio?", a: "**With audio** (2x cost):\n- Synced sound effects\n- Dialogue and lip sync\n- Background music\n- Great for final presentation\n\n**Without audio** (half cost):\n- Visual only\n- Best for storyboard previews\n- Use when you'll add audio separately\n\n**Tip:** Draft without audio, add it on final versions.", tags: "audio sound sfx dialogue" },
            ],
          },
          {
            q: "Z-Image",
            a: "**Z-Image** - Cheapest image model\n\n**Credits:** Just 1 per image\n**Per 1,000 credits:** ~1,000 images\n\n**Best for:** Quick iterations, drafts, brainstorming",
            tags: "z-image cheap budget price cost credits generation",
            followUp: [
              { q: "Tips for Z-Image", a: "**Getting the best results:**\n\n- Use for **rapid iteration** and brainstorming\n- Generate 10-20 variations at 1 credit each\n- Pick the best composition, then regenerate with **NB2** or **GPT Image 2**\n- Great for **prompt testing** before spending more credits\n- Pair with **Prompt Enhance** to refine prompts cheaply", tags: "tips how to use z-image cheap" },
            ],
          },
          {
            q: "Which video model should I use?",
            a: "**Quick comparison:**\n\n- **Seedance 1.5 Pro** - Best value (5 cr for 480p 4s), has audio sync\n- **Seedance 2.0 Fast** - Fast rendering, good quality\n- **Seedance 2.0** - Highest quality video\n- **Kling 3.0 Motion** - Best for motion control\n- **Veo 3.1** - Google's latest model",
            tags: "video compare",
          },
        ],
      },
      {
        q: "Can I keep characters consistent?",
        a: "**Yes!** Use the **Element Library** to:\n\n- Save characters, props, and styles with reference images\n- Drag elements into any frame\n- Use **@Image** tags in prompts\n- Maintain consistency across all scenes",
        followUp: [
          { q: "What is the Prompt Library?", a: "Save and reuse your favorite prompts.\n\n- Build a collection for different styles and moods\n- Quickly generate consistent results\n- Share prompts across projects" },
        ],
      },
      {
        q: "How do I export my storyboard?",
        a: "**Export options:**\n\n- **PDF** - Landscape format with visuals\n- **PNG/JPG** - Individual frames\n- **Video** - Animatic via timeline editor\n- **Script** - Text-only export\n\nAll available from the storyboard view.",
        tags: "pdf export download print",
      },
    ],
  },
  {
    q: "How do credits work?",
    a: "Each AI generation costs credits based on **model**, **resolution**, and **duration**.\n\n- Exact cost shown before you generate\n- Credits **never expire**\n- Different models = different costs",
    tags: "price cost money charge",
    followUp: [
      {
        q: "How much do generations cost?",
        a: "**Image models (per image):**\n- Z-Image: 1 credit\n- GPT Image 2: 4 credits\n- Nano Banana 2: 5 credits (1K)\n- Nano Banana Pro: 12 credits (1K)\n\n**Video models (480p 5s):**\n- Seedance 1.5 Pro: 5 cr (4s)\n- Seedance 2.0 Fast: 29 cr\n- Seedance 2.0: 36 cr\n\nExact cost always shown before generating.",
        tags: "price pricing expensive cheap generation",
      },
      {
        q: "How many images can I generate?",
        a: "**Pro plan (3,500 credits/mo):**\n\n**Images:**\n- GPT Image 2: ~875 images\n- Nano Banana 2: ~700 images (1K)\n- Z-Image: ~3,500 images\n\n**Videos:**\n- Seedance 1.5 Pro: ~700 clips (480p 4s)\n- Seedance 2.0 Fast: ~120 clips (480p 5s)\n\n**Free plan (50 credits):**\n~12 images or ~10 short videos",
        tags: "price cost estimate how many 1000 credits calculation per generation",
      },
      {
        q: "Can I buy extra credits?",
        a: "**Yes!** Credit top-up packs:\n\n- 1,000 credits - $9.90\n- 5,000 credits - $49.50\n- 25,000 credits - $247.50\n\nNo subscription required. Top-up credits **never expire**.",
        tags: "price buy purchase top up",
      },
      {
        q: "Do credits expire?",
        a: "**No.** Credits never expire, whether from your subscription or a top-up purchase.",
      },
    ],
  },
  {
    q: "What are the plans & pricing?",
    a: "**Free** - $0/mo\n50 credits, 3 projects, 300 MB\n\n**Pro** - from $39.90/mo\n3,500 credits, unlimited projects, 10 GB, 5 seats\n\n**Business** - from $89.90/mo\n8,000 credits, unlimited projects, 20 GB, 15 seats, 3 orgs\n\nNo credit card required for free plan.",
    tags: "price cost subscription plan money",
    followUp: [
      { q: "Is there a free plan?", a: "**Yes!**\n\n- 50 credits/month\n- 3 projects (20 frames each)\n- 300 MB storage\n- All 25+ AI models included\n- No credit card required", tags: "price free cost" },
      { q: "Can I cancel anytime?", a: "**Yes.** Cancel anytime from your account settings.\n\nYou keep access and remaining credits until the end of your billing period.", tags: "refund cancel" },
      {
        q: "What's included in Pro vs Business?",
        a: "**Pro** (from $39.90/mo):\n- 3,500 credits/mo\n- 10 GB storage\n- 5 seats, 1 org\n\n**Business** (from $89.90/mo):\n- 8,000 credits/mo\n- 20 GB storage\n- 15 seats, 3 orgs\n\nBoth: unlimited projects, no per-seat charges.",
        tags: "price compare difference",
      },
    ],
  },
  {
    q: "Does it support teams?",
    a: "**Yes!** Create organizations and invite members.\n\n**Roles:**\n- **Admin** - Full access + billing\n- **Member** - Create & edit, use credits\n- **Viewer** - Read-only access\n\nTeam members share the org's credit pool and storage.",
    tags: "collaboration organization invite",
    followUp: [
      { q: "What are the team roles?", a: "**Admin** - Full access including billing and member management\n\n**Member** - Can create and edit storyboards, use credits\n\n**Viewer** - Read-only access to view storyboards" },
      { q: "How many team members?", a: "**Free:** 1 user only\n**Pro:** Up to 5 seats + 1 organization\n**Business:** Up to 15 seats + 3 organizations\n\nNo per-seat charges on any plan.", tags: "seats limit" },
    ],
  },
  {
    q: "How do I use...?",
    a: "Tap a feature below to learn how to use it.",
    tags: "how to use feature guide tutorial help",
    followUp: [
      {
        q: "Element Library",
        a: "**Element Library** - Keep characters consistent\n\n**How to use:**\n1. Open Element Library in the sidebar\n2. Click **+ Add** to save a character/prop/style\n3. Upload a reference image\n4. Give it a name and description\n\n**In prompts:** Type **@Image** to reference saved elements\n**In frames:** Drag elements directly into any frame\n\nElements are shared across all projects.",
        tags: "element library character consistent how to use reference image",
      },
      {
        q: "Canvas Editor",
        a: "**Canvas Editor** - Edit frames visually\n\n**Tools available:**\n- **Brush** - Draw directly on frames\n- **Inpaint** - Select an area and AI regenerates it\n- **Text** - Add text overlays\n- **Shapes** - Rectangles, circles, lines\n- **Speech Bubbles** - Comic-style dialogue\n- **Stickers** - Drag and drop\n\n**Tip:** Use **Inpaint** to fix small areas without regenerating the whole frame.",
        tags: "canvas editor draw inpaint brush how to use edit paint",
      },
      {
        q: "Script to Storyboard",
        a: "**Script to Storyboard** - Auto-generate frames\n\n**How to use:**\n1. Write or paste your script in the project\n2. Click **Generate Storyboard**\n3. AI breaks your script into scenes\n4. Each scene becomes a frame with dialogue and camera notes\n\n**Tip:** Include camera directions in your script (e.g. \"CLOSE-UP\", \"WIDE SHOT\") for better results.",
        tags: "script storyboard auto generate scene breakdown how to use",
      },
      {
        q: "Video Editor",
        a: "**Video Editor** - Multi-track timeline (Pro+)\n\n**Features:**\n- **Video track** - Arrange clips on timeline\n- **Audio track** - Add music/SFX\n- **Split & trim** - Cut clips precisely\n- **Subtitles** - Add text overlays\n- **Blend modes** - Layer effects\n- **Export** - MP4 or WAV\n\n**Tip:** Use **Snapshot** to capture a frame from any point in the timeline.",
        tags: "video editor timeline multi track how to use export mp4 subtitle",
      },
      {
        q: "Batch Generation",
        a: "**Batch Generation** - Generate multiple frames (Pro+)\n\n**How to use:**\n1. Select frames in your storyboard\n2. Click **Batch Generate**\n3. Choose your model and settings\n4. All selected frames generate at once\n\n**Tip:** Use with **Presets** to apply the same style across all frames.",
        tags: "batch generate multiple frames how to use bulk",
      },
      {
        q: "Camera Studio",
        a: "**Camera Studio** - Virtual camera control (Pro+)\n\n**Features:**\n- **3D Angle Picker** - Set camera angle visually\n- **Motion Presets** - 15+ camera movements (dolly, pan, tilt, tracking)\n- **Speed Ramp** - Dynamic pacing for video clips\n- **Color Palette** - Set mood and color grading\n\n**Tip:** Use **Motion Presets** with Seedance models for cinematic camera movement.",
        tags: "camera studio 3d angle motion preset speed ramp how to use",
      },
      {
        q: "Director's View",
        a: "**Director's View** - Review your storyboard (Pro+)\n\n**Features:**\n- **Filmstrip** - See all frames at a glance\n- **Compare** - View frames side-by-side\n- **Animatic playback** - Play through your storyboard\n- **Notes** - Add production notes to frames\n\n**Tip:** Use Compare mode to pick the best version of a frame.",
        tags: "director view filmstrip compare animatic how to use review",
      },
      {
        q: "AI Analyze",
        a: "**AI Analyze** - Understand your content\n\n**What it does:**\n- **Image** (1 credit) - Describe composition, style, objects\n- **Video** (3 credits) - Scene breakdown, actions, transitions\n- **Audio** (1 credit) - Transcription and description\n\n**Tip:** Use on reference images to generate prompts that match the style.",
        tags: "ai analyze describe image video audio how to use",
      },
      {
        q: "Prompt Enhance",
        a: "**Prompt Enhance** - Improve your prompts (1 credit)\n\n**What it does:**\n- Adds detail and composition guidance\n- Suggests stylistic improvements\n- Optimizes for the selected AI model\n\n**Tip:** Write a basic prompt, then Enhance it before generating. Saves credits by getting better results on the first try.",
        tags: "prompt enhance improve how to use better results",
      },
    ],
  },
  {
    q: "Is my content private?",
    a: "**Yes.**\n\n- Your content is **never** used to train AI models\n- Files stored privately on Cloudflare R2\n- Only you and your team can access your files",
    tags: "security privacy data safe train",
  },
  {
    q: "View all FAQ",
    a: "",
  },
];

/* ─── Categorized FAQ ─────────────────────────────────────────────── */
const FAQ_CATEGORIES: FaqCategory[] = [
  {
    label: "FAQ",
    icon: "💬",
    nodes: [
      FAQ_TREE[0], // What does Storytica do?
      FAQ_TREE[1], // How do credits work?
      FAQ_TREE[2], // What are the plans & pricing?
      FAQ_TREE[3], // Does it support teams?
      FAQ_TREE[5], // Is my content private?
    ],
  },
  {
    label: "How to",
    icon: "📖",
    nodes: [
      ...(FAQ_TREE[4]?.followUp ?? []), // Element Library, Canvas Editor, Script, Video Editor, etc.
    ],
  },
  {
    label: "Models",
    icon: "🤖",
    nodes: [
      ...(FAQ_TREE[0]?.followUp?.[0]?.followUp ?? []), // Individual model nodes (NB2, GPT, Seedance, Z-Image, etc.)
    ],
  },
  {
    label: "My Account",
    icon: "👤",
    authOnly: true,
    nodes: [
      { q: "What's my credit balance?", a: "", askAI: true, tags: "credits balance how many left remaining" },
      { q: "How much did I spend this month?", a: "", askAI: true, tags: "spending usage credits month cost deducted" },
      { q: "What plan am I on?", a: "", askAI: true, tags: "plan subscription pro free business tier" },
      { q: "Did I get a refund?", a: "", askAI: true, tags: "refund credits returned failed generation" },
      { q: "Why did my generation fail?", a: "", askAI: true, tags: "generation failed error broken not working" },
      { q: "Show my invoices", a: "", askAI: true, tags: "invoice receipt billing payment history" },
      { q: "Why did my balance change?", a: "", askAI: true, tags: "balance changed credits missing deducted where" },
    ],
  },
  {
    label: "Support",
    icon: "🎫",
    authOnly: true,
    nodes: [
      {
        q: "Refund policy",
        a: "**Refund Policy:**\n\n- **Failed generations** are automatically refunded — credits return to your balance instantly\n- If auto-refund didn't happen, our team reviews within 24-48 hours\n- **Subscription refunds** are handled case-by-case\n- **Top-up credits** are non-refundable once used\n\nCheck if you already received auto-refunds below.",
        tags: "refund policy return money credits back",
        followUp: [
          { q: "Did I get a refund?", a: "", askAI: true, tags: "refund credits returned" },
          { q: "Request a refund via ticket", a: "To request a manual refund, please [create a support ticket](#nav:support) from the **Support** section in the left sidebar.\n\nInclude:\n- Which generation failed\n- Approximate date\n- Credits deducted\n\nOur team reviews refund requests within 24-48 hours.", tags: "refund request ticket create" },
        ],
      },
      {
        q: "Report a bug",
        a: "**Let's troubleshoot first:**\n\n1. **What happened?** — Expected vs actual behavior\n2. **Where?** — Which page or feature?\n3. **When?** — Every time or just once?\n4. **How?** — Steps to trigger the bug\n\nCheck common issues below first:",
        tags: "bug report issue broken error problem glitch",
        followUp: [
          { q: "Generation stuck or failed", a: "**Generations can take up to 2 minutes.** If longer:\n\n1. Check your storyboard — the frame may have updated\n2. Failed generations are **auto-refunded** instantly\n3. Try a simpler prompt or **480p** for videos\n\nCheck if you got a refund below:",
            tags: "stuck generation timeout loading",
            followUp: [
              { q: "Did I get a refund?", a: "", askAI: true, tags: "refund check" },
              { q: "Why did my generation fail?", a: "", askAI: true, tags: "generation failed reason" },
              { q: "Still not resolved", a: "Please [create a support ticket](#nav:support) from the **Support** section in the left sidebar.\n\nInclude:\n- Which model you used\n- The prompt (if possible)\n- Screenshot of the error\n\nOur team responds within 24 hours.", tags: "ticket escalate" },
            ],
          },
          { q: "Canvas/editor not working", a: "**Try these fixes:**\n\n1. **Refresh the page** — most glitches resolve on reload\n2. **Clear browser cache** — old assets can cause display issues\n3. **Try Chrome/Edge** — best browser support\n4. **Check your internet** — canvas needs a stable connection",
            tags: "canvas editor broken inpaint brush",
            followUp: [
              { q: "Still not working", a: "Please [create a support ticket](#nav:support) from the **Support** section in the left sidebar.\n\nInclude:\n- What you were trying to do\n- Screenshot of the issue\n- Browser name and version\n\nOur team responds within 24 hours.", tags: "ticket create bug" },
            ],
          },
          { q: "Billing or credit issue", a: "**Check these first:**\n\n- **Missing credits?** — Failed generations are auto-refunded\n- **Wrong balance?** — Ask \"Why did my balance change?\" in **My Account**\n- **Subscription issue?** — Ask \"What plan am I on?\" in **My Account**",
            tags: "billing credits wrong charge",
            followUp: [
              { q: "Did I get a refund?", a: "", askAI: true, tags: "refund check" },
              { q: "Still not resolved", a: "Please [create a support ticket](#nav:support) from the **Support** section in the left sidebar.\n\nInclude:\n- What charge looks wrong\n- Expected vs actual credit amount\n- Date it happened\n\nOur team responds within 24 hours.", tags: "billing ticket create" },
            ],
          },
          { q: "Something else", a: "Please [create a support ticket](#nav:support) from the **Support** section in the left sidebar.\n\nInclude:\n- What you were trying to do\n- What happened instead\n- Steps to reproduce\n- Screenshots if possible\n\nOur team responds within 24 hours.", tags: "other issue ticket create" },
        ],
      },
      {
        q: "Contact support",
        a: "**Try self-service first — it's faster:**\n\n- **Credits/billing** → **My Account** tab\n- **How to use a feature** → **How to** tab\n- **Generation failed** → **My Account** → \"Why did my generation fail?\"\n- **Refund** → **Refund policy** above\n\nIf you still need help, [create a support ticket](#nav:support) from the **Support** section in the left sidebar. Our team responds within 24 hours.",
        tags: "contact support human agent ticket help email",
      },
    ],
  },
];

/* ─── Proactive follow-up suggestions ─────────────────────────────── */
/* After the AI answers a question, suggest related follow-ups.
   Key = keyword that appears in the user's original question.
   Value = array of follow-up questions to show as clickable chips. */
const FOLLOW_UP_MAP: { keywords: string[]; suggestions: string[] }[] = [
  {
    keywords: ["balance", "how many credits"],
    suggestions: ["How much did I spend this month?", "Can I buy extra credits?", "What plan am I on?"],
  },
  {
    keywords: ["spend", "spent", "usage"],
    suggestions: ["What's my credit balance?", "Did I get a refund?", "Show my invoices"],
  },
  {
    keywords: ["plan", "subscription"],
    suggestions: ["What's my credit balance?", "Can I cancel anytime?", "What's included in Pro vs Business?"],
  },
  {
    keywords: ["refund", "returned"],
    suggestions: ["Why did my generation fail?", "Did I get a refund?", "Show my invoices"],
  },
  {
    keywords: ["fail", "failed", "error", "broken"],
    suggestions: ["Did I get a refund?", "Why did my generation fail?", "What's my credit balance?"],
  },
  {
    keywords: ["invoice", "receipt", "billing"],
    suggestions: ["What plan am I on?", "How much did I spend this month?"],
  },
  {
    keywords: ["changed", "missing", "where did"],
    suggestions: ["How much did I spend this month?", "Did I get a refund?"],
  },
];

function getFollowUpSuggestions(userMessage: string): string[] {
  const msg = userMessage.toLowerCase();
  for (const entry of FOLLOW_UP_MAP) {
    if (entry.keywords.some((kw) => msg.includes(kw))) {
      return entry.suggestions;
    }
  }
  return [];
}

interface SupportChatWidgetProps {
  variant: "landing" | "studio";
  /** Called when the user clicks a link to navigate within the studio (e.g. to Support page) */
  onNavigate?: (navKey: string) => void;
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function SupportChatWidget({ variant, onNavigate }: SupportChatWidgetProps) {
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [faqPath, setFaqPath] = useState<FaqNode[][]>([FAQ_TREE]);
  const [faqCategory, setFaqCategory] = useState<string | null>(null);

  // Visible categories based on auth state
  const visibleCategories = useMemo(
    () => FAQ_CATEGORIES.filter((c) => !c.authOnly || isSignedIn),
    [isSignedIn],
  );
  const [faqSearch, setFaqSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Flatten all FAQ nodes for search
  const allFaqNodes = useMemo(() => {
    const flat: FaqNode[] = [];
    const walk = (nodes: FaqNode[]) => {
      for (const n of nodes) {
        if (n.a || n.askAI) flat.push(n);
        if (n.followUp) walk(n.followUp);
      }
    };
    for (const cat of visibleCategories) walk(cat.nodes);
    return flat;
  }, [visibleCategories]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, activeTool]);

  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setSessionId(null);
    setStreaming(false);
    setActiveTool(null);
    setInput("");
    setFaqPath([FAQ_TREE]);
    setFaqCategory(null);
    setFaqSearch("");
  }, []);

  const sendMessage = useCallback(async (overrideMessage?: string) => {
    const trimmed = (overrideMessage ?? input).trim();
    if (!trimmed || streaming) return;
    if (!overrideMessage) setInput("");

    const userMsgId = uid();
    const assistantMsgId = uid();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: trimmed },
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        isStreaming: true,
      },
    ]);
    setInput("");
    setStreaming(true);
    setActiveTool(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const clientHistory = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          variant,
          sessionId: sessionId ?? undefined,
          clientHistory,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        const json = await res.json().catch(() => null);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    json?.message ??
                    "You've hit the chat limit for this hour. Please try again later.",
                  isStreaming: false,
                  isError: true,
                }
              : m
          )
        );
        return;
      }

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `Something went wrong. ${txt || ""}`.trim(),
                  isStreaming: false,
                  isError: true,
                }
              : m
          )
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          let event: {
            type: string;
            delta?: string;
            sessionId?: string;
            name?: string;
            isError?: boolean;
            message?: string;
          };
          try {
            event = JSON.parse(payload);
          } catch {
            continue;
          }

          if (event.type === "session" && event.sessionId) {
            setSessionId(event.sessionId);
          } else if (event.type === "text" && event.delta) {
            // Filter out leaked tool call JSON from DeepSeek
            // DeepSeek sometimes outputs tool calls as text instead of proper function calls
            let delta = event.delta as string;
            // Strip JSON blocks that look like tool calls: {"category":"billing",...}
            delta = delta.replace(/```?json\s*\{[^}]*\}\s*```?/g, "");
            // Strip standalone tool call artifacts
            delta = delta.replace(/\{"\w+":\s*"[^"]*"(?:,\s*"\w+":\s*"[^"]*")*\}/g, "");
            // Strip tool separator markers
            delta = delta.replace(/<[|｜]tool[▁_]sep[|｜]>/g, "");
            if (delta.trim()) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + delta }
                    : m
                )
              );
            }
            setActiveTool(null);
          } else if (event.type === "tool_call" && event.name) {
            setActiveTool(event.name);
          } else if (event.type === "tool_result") {
            setActiveTool(null);
          } else if (event.type === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        m.content ||
                        event.message ||
                        "Sorry, something went wrong.",
                      isStreaming: false,
                      isError: true,
                    }
                  : m
              )
            );
          } else if (event.type === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              )
            );
          }
        }
      }

      // Final cleanup: strip any remaining tool call artifacts from the message
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantMsgId) return m;
          let cleaned = m.content
            .replace(/```?json\s*\{[\s\S]*?\}\s*```?/g, "")
            .replace(/\{"\w+":\s*"[^"]*"(?:,\s*"\w+":\s*"[^"]*")*\}/g, "")
            .replace(/<[|｜]tool[▁_]sep[|｜]>/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
          return { ...m, content: cleaned, isStreaming: false };
        })
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  "Connection error. Please check your network and try again.",
                isStreaming: false,
                isError: true,
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
      setActiveTool(null);
      abortRef.current = null;
    }
  }, [input, messages, sessionId, streaming, variant]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Intercept #nav: links to navigate within the studio
  const handleChatClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A") {
      const href = target.getAttribute("href") ?? "";
      if (href.startsWith("#nav:")) {
        e.preventDefault();
        const navKey = href.slice(5); // e.g. "support"
        if (onNavigate) {
          onNavigate(navKey);
          setOpen(false); // close chat widget
        }
      }
    }
  }, [onNavigate]);

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        aria-label={open ? "Close support chat" : "Open support chat"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-primary text-primary-foreground hover:scale-105 active:scale-95",
          open && "rotate-90"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-24 right-5 z-[70] flex w-[calc(100vw-2.5rem)] max-w-[400px] flex-col overflow-hidden rounded-xl border shadow-2xl",
            "h-[min(600px,calc(100vh-8rem))] bg-background"
          )}
          role="dialog"
          aria-label="Storytica support chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Storytica Support</div>
              <div className="text-xs text-muted-foreground">
                {isSignedIn
                  ? "Ask about your account, credits, or generations"
                  : "Ask about features or pricing"}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={resetChat}
                disabled={streaming || messages.length === 0}
                title="New conversation"
                className="h-8 w-8"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                title="Close"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            ref={scrollRef}
            onClick={handleChatClick}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm"
          >
            {messages.length === 0 && (
              <div className="pt-8 text-center text-muted-foreground">
                <MessageCircle className="mx-auto mb-3 h-8 w-8 opacity-40" />
                <p className="mb-1 font-medium">How can I help?</p>
                <p className="text-xs">
                  Tap a question below or type your own
                </p>
              </div>
            )}

            {messages.map((m, idx) => {
              // Find the preceding user message for follow-up suggestions
              const prevUserMsg = m.role === "assistant" && idx > 0
                ? messages.slice(0, idx).reverse().find((pm) => pm.role === "user")
                : null;
              const isLastAssistant = m.role === "assistant" && !m.isStreaming && m.content &&
                idx === messages.length - 1;
              const followUps = isLastAssistant && prevUserMsg
                ? getFollowUpSuggestions(prevUserMsg.content)
                : [];

              return (
                <div key={m.id}>
                  <div
                    className={cn(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : m.isError
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-foreground"
                      )}
                    >
                      {m.content ? (
                        m.role === "assistant" && !m.isError ? (
                          renderInlineMarkdown(m.content)
                        ) : (
                          m.content
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Thinking…</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbs up/down rating for completed assistant messages */}
                  {m.role === "assistant" && !m.isStreaming && m.content && (
                    <div className="flex items-center gap-1 mt-1 ml-1">
                      <button
                        type="button"
                        onClick={() => setMessages((prev) =>
                          prev.map((pm) => pm.id === m.id ? { ...pm, rating: pm.rating === 1 ? undefined : 1 } : pm)
                        )}
                        className={cn(
                          "h-5 w-5 flex items-center justify-center rounded transition-colors",
                          m.rating === 1
                            ? "text-emerald-600 bg-emerald-500/20"
                            : "text-muted-foreground/50 hover:text-emerald-600 hover:bg-emerald-500/10"
                        )}
                        title="Helpful"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessages((prev) =>
                          prev.map((pm) => pm.id === m.id ? { ...pm, rating: pm.rating === -1 ? undefined : -1 } : pm)
                        )}
                        className={cn(
                          "h-5 w-5 flex items-center justify-center rounded transition-colors",
                          m.rating === -1
                            ? "text-red-600 bg-red-500/20"
                            : "text-muted-foreground/50 hover:text-red-600 hover:bg-red-500/10"
                        )}
                        title="Not helpful"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Proactive follow-up suggestions */}
                  {followUps.length > 0 && !streaming && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-1">
                      {followUps.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            sendMessage(suggestion);
                          }}
                          className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {activeTool && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Looking up {formatToolName(activeTool)}…</span>
                </div>
              </div>
            )}
          </div>

          {/* FAQ balloons — persistent above input */}
          {!streaming && (() => {
            const searching = faqSearch.trim().length > 0;
            const inSubMenu = faqPath.length > 1;

            // When searching: show matching nodes across all categories
            // When in sub-menu (followUp drill-down): show that sub-menu
            // When a category is selected: show that category's nodes
            // Default: show category tabs
            const visibleNodes = searching
              ? (() => {
                  const term = faqSearch.toLowerCase();
                  return allFaqNodes.filter((n) => {
                    const haystack = `${n.q} ${n.a} ${n.tags || ""}`.toLowerCase();
                    return (
                      haystack.includes(term) ||
                      haystack.split(/\s+/).some((w) => w.startsWith(term))
                    );
                  });
                })()
              : inSubMenu
                ? faqPath[faqPath.length - 1] ?? []
                : faqCategory
                  ? (visibleCategories.find((c) => c.label === faqCategory)?.nodes ?? [])
                  : [];

            const showCategoryTabs = !searching && !inSubMenu && !faqCategory;

            return (
              <div className="border-t px-3 pt-2 pb-1">
                {/* Search + nav row */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  {(inSubMenu || faqCategory) && !searching && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (inSubMenu) {
                            setFaqPath([FAQ_TREE]);
                          }
                          setFaqCategory(null);
                          setFaqSearch("");
                        }}
                        title="Home"
                        className="shrink-0 h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Home className="h-3 w-3" />
                      </button>
                      {inSubMenu && (
                        <button
                          type="button"
                          onClick={() => setFaqPath((p) => p.slice(0, -1))}
                          className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          &larr; Back
                        </button>
                      )}
                    </>
                  )}
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      placeholder="Search FAQ..."
                      className="w-full rounded-md border bg-background pl-6 pr-2 py-1 text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                {/* Category tabs */}
                {showCategoryTabs && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {visibleCategories.map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setFaqCategory(cat.label)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                          cat.authOnly
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                            : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                        }`}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => window.open("/faq", "_blank", "noopener")}
                      className="rounded-full border border-muted-foreground/20 bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
                    >
                      View all FAQ
                    </button>
                  </div>
                )}

                {/* Balloon buttons (when category selected or searching) */}
                {!showCategoryTabs && (
                  <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                    {visibleNodes.map((node) => (
                      <button
                        key={node.q}
                        type="button"
                        onClick={() => {
                          if (node.askAI) {
                            sendMessage(node.q);
                            setFaqSearch("");
                            return;
                          }
                          const uId = uid();
                          const aId = uid();
                          setMessages((prev) => [
                            ...prev,
                            { id: uId, role: "user", content: node.q },
                            { id: aId, role: "assistant", content: node.a },
                          ]);
                          if (!searching && node.followUp?.length) {
                            setFaqPath((p) => [...p, node.followUp!]);
                          }
                          setFaqSearch("");
                        }}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors text-left ${
                          node.askAI
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                            : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                        }`}
                      >
                        {node.q}
                      </button>
                    ))}
                    {searching && visibleNodes.length === 0 && (
                      <p className="text-[11px] text-muted-foreground py-1">No matching questions</p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  streaming ? "Waiting for reply…" : "Type your question…"
                }
                rows={2}
                disabled={streaming}
                className={cn(
                  "flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:opacity-60"
                )}
                maxLength={4000}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={streaming || !input.trim()}
                className="h-10 w-10 shrink-0"
              >
                {streaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-1.5 text-[10px] text-muted-foreground">
              Powered by Claude Haiku · Enter to send, Shift+Enter for newline
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatToolName(tool: string): string {
  const map: Record<string, string> = {
    get_my_profile: "your profile",
    get_my_subscription: "your subscription",
    get_my_credit_balance: "your credit balance",
    list_my_credit_transactions: "your credit history",
    get_ai_model_pricing: "pricing info",
    list_my_recent_generations: "your recent generations",
    get_generation_details: "generation details",
    list_my_invoices: "your invoices",
    list_my_support_tickets: "your support tickets",
    create_support_ticket: "creating a ticket",
  };
  return map[tool] ?? tool.replace(/_/g, " ");
}
