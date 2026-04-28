import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Models — Gemini 2.5 Flash supports image, video, and audio
const IMAGE_MODEL = "google/gemini-2.5-flash";
const VIDEO_MODEL = "google/gemini-2.5-flash";
const AUDIO_MODEL = "google/gemini-2.5-flash";

// Guess MIME type from URL extension (R2 often returns application/octet-stream)
function mimeFromUrl(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    webp: "image/webp", gif: "image/gif",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4",
  };
  return (ext && map[ext]) || "image/png";
}

// Max size for inline base64 (Gemini limit ~20MB, but OpenRouter has ~10MB request body limit)
const MAX_IMAGE_BYTES = 7 * 1024 * 1024; // 7MB raw = ~9.3MB base64
const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // 15MB raw

// Validate image magic bytes
function isValidImageData(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // WEBP: RIFF....WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  // GIF: GIF8
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;
  return false;
}

// Convert any media URL to a base64 data URL that OpenRouter/Google can consume.
// Google rejects some remote URLs (R2, etc.), so we download and inline them.
async function toDataUrl(mediaUrl: string, mediaType: "image" | "video" | "audio"): Promise<string> {
  if (mediaUrl.startsWith("data:")) {
    // Validate data URL size
    const sizeEstimate = Math.round(mediaUrl.length * 0.75); // base64 → raw bytes estimate
    const maxSize = mediaType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (sizeEstimate > maxSize) {
      throw new Error(`File too large (~${Math.round(sizeEstimate / 1024 / 1024)}MB). Max ${Math.round(maxSize / 1024 / 1024)}MB for ${mediaType}.`);
    }
    return mediaUrl;
  }

  const res = await fetch(mediaUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Failed to fetch media: ${res.status} ${res.statusText}`);

  const buffer = Buffer.from(await res.arrayBuffer());

  // Size check
  const maxSize = mediaType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (buffer.length > maxSize) {
    throw new Error(`File too large (${Math.round(buffer.length / 1024 / 1024)}MB). Max ${Math.round(maxSize / 1024 / 1024)}MB for ${mediaType}.`);
  }

  // Validate image data if it's supposed to be an image
  if (mediaType === "image" && !isValidImageData(buffer)) {
    // Check if it's SVG (text-based, not supported by Gemini)
    const head = buffer.slice(0, 200).toString("utf-8").toLowerCase();
    if (head.includes("<svg") || head.includes("<?xml")) {
      throw new Error("SVG images are not supported. Please use PNG, JPEG, or WEBP.");
    }
    // Check if we got an HTML error page instead of image data
    if (head.includes("<!doctype") || head.includes("<html")) {
      throw new Error("URL returned an HTML page instead of image data. The link may have expired.");
    }
    console.warn(`[ai-analyze] Image magic bytes not recognized. First 8 bytes: ${buffer.slice(0, 8).toString("hex")}. Proceeding anyway...`);
  }

  const headerType = res.headers.get("content-type") || "";
  // Use header content-type only if it's specific; fall back to extension-based detection
  let contentType = headerType && !headerType.includes("octet-stream")
    ? headerType.split(";")[0].trim()
    : mimeFromUrl(mediaUrl);

  // If content-type doesn't match user's selected media type, use a sensible default
  // (R2 files often have wrong extensions, e.g. video stored as .png)
  if (mediaType === "video" && !contentType.startsWith("video/")) {
    contentType = "video/mp4";
  } else if (mediaType === "audio" && !contentType.startsWith("audio/")) {
    contentType = "audio/mpeg";
  }

  // Reject SVG content-type
  if (contentType.includes("svg")) {
    throw new Error("SVG images are not supported by Gemini. Please use PNG, JPEG, or WEBP.");
  }

  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

// Single-purpose system prompts per media type
const ANALYSIS_PROMPTS: Record<string, string> = {
  image: `You are a professional cinematographer and AI prompt engineer. Analyze this image in forensic detail and output a generation prompt that could recreate it exactly.

Output format — write as a single flowing prompt, no markdown, no labels, no bullet points, no quotes. Just the prompt text.

You MUST include ALL of these:

1. CAMERA & LENS: What camera was likely used (ARRI ALEXA, RED, Sony Venice, iPhone, DSLR, etc.). Lens type (anamorphic, prime, zoom, macro). Focal length estimate (24mm wide, 50mm standard, 85mm portrait, 135mm telephoto). Aperture/DOF (shallow f/1.4 bokeh vs deep f/8). Aspect ratio (16:9, 2.39:1 widescreen, 9:16 vertical, 1:1 square, 4:3).

2. CAMERA ANGLE & FRAMING: Angle (low angle, high angle, eye-level, bird's eye, worm's eye, dutch tilt, over-the-shoulder). Shot type (extreme close-up, close-up, medium, full body, wide, establishing). Composition rules (rule of thirds, centered, symmetrical, leading lines, negative space).

3. LIGHTING: Key light direction (front, side, back, overhead, below). Quality (hard/soft). Color temperature (warm golden, cool blue, neutral). Lighting setup (Rembrandt, butterfly, split, rim, silhouette, natural available light). Fill/rim/hair light presence.

4. COLOR & GRADING: Dominant color palette. Shadow tint (teal, blue, green). Highlight tint (amber, orange, warm). Saturation level. Contrast level. Color science feel (Kodak Portra warmth, Fuji Velvia saturation, bleach bypass, cross-processed).

5. STYLE & TEXTURE: Film grain presence and intensity. Digital clean vs organic texture. Era aesthetic (1970s, cyberpunk, modern clean, vintage). Art style (photorealistic, painterly, cinematic, editorial, documentary). Mood (dramatic, intimate, epic, melancholic, joyful, tense, dreamy).

6. SUBJECT & SCENE: Describe exactly what is in the image — people (appearance, clothing, expression, pose, ethnicity, age), objects, environment, location, time of day, weather, background elements, foreground elements, props.

7. ACTION & MOVEMENT: What is happening. Motion blur presence. Dynamic vs static pose. Interaction between subjects.

Write it as one expert-level prompt that another AI could use to generate this exact image.`,

  video: `You are a professional film editor and cinematographer. Analyze this video and break it down into a detailed shot-by-shot description with precise timestamps.

Output format — use this exact structure:

First line: Brief overall description of the video (setting, mood, genre, camera system).
Then for each distinct shot or camera movement, write a timestamped entry:

[0.0s-2.5s]: Shot type, camera movement, what happens. Describe subjects, action, lighting, color. Note any slow motion, time ramp, whip-pan, rack focus, or special technique.
[2.6s-5.0s]: Next shot description with same detail level.
...continue for all shots...

For EACH timestamp entry, include:
- Camera: movement type (static, dolly in/out, crane up/down, pan L/R, tracking, handheld, orbit, whip-pan, drone/aerial)
- Shot type: extreme close-up, close-up, medium, wide, establishing, overhead
- Action: exactly what happens — subject movement, interaction, impact moments
- Technique: slow motion, time ramp, speed ramp, rack focus, lens flare, motion blur
- Lighting/color changes within the shot
- Mood/energy shift

At the end, add one line:
CAMERA: [estimated camera and lens setup]
STYLE: [overall visual style, color grading, mood]

Do NOT use markdown formatting. Do NOT add headers or labels like "Overall:" — just write the description and timestamps directly.`,

  audio: `You are a professional audio engineer and music analyst. Analyze this audio and provide a comprehensive breakdown.

Detect the TYPE of audio and respond accordingly:

--- IF SONG/MUSIC ---
Output in this order:
1. LYRICS: Write out all lyrics line by line. Use [Intro], [Verse 1], [Chorus], [Bridge], [Outro] section markers. If lyrics are unclear, write "[unclear]" for those words.
2. STYLE: Genre, sub-genre, tempo (BPM estimate), key signature estimate.
3. INSTRUMENTS: List all instruments/sounds heard (drums, bass, synth, guitar, piano, strings, etc.).
4. VOCAL: Voice type (male/female/mixed), vocal style (raspy, smooth, falsetto, rap, whisper), language, accent if notable.
5. MOOD: Emotional tone, energy level (low/medium/high), atmosphere.
6. PRODUCTION: Mix quality, effects (reverb, delay, autotune, distortion), stereo width, dynamic range.

--- IF SPEECH/DOCUMENTARY/NARRATION ---
Output in this order:
1. TRANSCRIPT: Full word-for-word transcription. Include [pause], [emphasis], [laughter] markers where applicable.
2. SPEAKER: Describe the voice — gender, estimated age, accent, tone (authoritative, casual, emotional, professional).
3. CONTEXT: What type of speech (narration, interview, presentation, podcast, voiceover, lecture).
4. BRIEF SUMMARY: 1-2 sentence summary of what was said.

--- IF DIALOGUE (multiple speakers) ---
Output in this order:
1. TRANSCRIPT: Full transcription with speaker labels:
   Speaker 1 (description): "dialogue text"
   Speaker 2 (description): "dialogue text"
   Identify each speaker by voice characteristics (male/female, young/old, accent).
2. CONTEXT: Setting, relationship between speakers, tone of conversation.
3. BRIEF SUMMARY: What the conversation is about.

--- IF SOUND EFFECTS ---
Output: Describe each sound heard, its timing, character (sharp, dull, ambient, mechanical, organic), and possible source.

Do NOT use markdown formatting. Write plain text only.`,
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { mediaType, mediaUrl } = body as {
      mediaType: "image" | "video" | "audio";
      mediaUrl: string;
    };

    if (!mediaType || !ANALYSIS_PROMPTS[mediaType]) {
      return NextResponse.json({ error: `Invalid media type: ${mediaType}` }, { status: 400 });
    }

    if (!mediaUrl) {
      return NextResponse.json({ error: "Missing mediaUrl" }, { status: 400 });
    }

    // Trust the user's selected media type — R2 files often have wrong extensions
    // (e.g. a video stored as .png). The user knows what they uploaded.
    const effectiveType = mediaType;

    const model = effectiveType === "video" ? VIDEO_MODEL
      : effectiveType === "audio" ? AUDIO_MODEL
      : IMAGE_MODEL;

    const systemPrompt = ANALYSIS_PROMPTS[mediaType];

    const content: any[] = [
      { type: "text", text: systemPrompt },
    ];

    if (effectiveType === "video") {
      console.log(`[ai-analyze] Sending video URL: ${mediaUrl.substring(0, 80)}...`);
      const videoUrl = await toDataUrl(mediaUrl, "video");
      console.log(`[ai-analyze] Video ready (${Math.round(videoUrl.length / 1024)}KB)`);
      content.push({ type: "video_url", video_url: { url: videoUrl } });
    } else {
      console.log(`[ai-analyze] Resolving ${effectiveType} URL to data URL...`);
      const dataUrl = await toDataUrl(mediaUrl, effectiveType);
      console.log(`[ai-analyze] Data URL ready (${Math.round(dataUrl.length / 1024)}KB)`);
      content.push({ type: "image_url", image_url: { url: dataUrl } });
    }

    console.log(`[ai-analyze] Analyzing ${effectiveType} (user: ${mediaType}) with model ${model}`);

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Storytica AI Analyze",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content,
          },
        ],
        max_tokens: 4096,
        temperature: 0.3,
        // For video/audio, prefer Vertex AI (supports data URLs) over AI Studio (YouTube only)
        ...(effectiveType !== "image" && {
          provider: { order: ["vertex-ai", "google"] },
        }),
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[ai-analyze] OpenRouter error:", response.status, errorData);
      // Parse and give user-friendly error
      let userError = `AI analysis failed (${response.status})`;
      if (errorData.includes("image is not valid")) {
        userError = "Image could not be processed. Try a different image (PNG/JPEG/WEBP, under 7MB).";
      } else if (errorData.includes("too large") || errorData.includes("size")) {
        userError = "File is too large for analysis. Please use a smaller file.";
      } else {
        userError += `: ${errorData.substring(0, 200)}`;
      }
      return NextResponse.json({ error: userError }, { status: 500 });
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content?.trim();

    if (!result) {
      return NextResponse.json({ error: "No result from AI model" }, { status: 500 });
    }

    return NextResponse.json({ result, mediaType, model });

  } catch (error: any) {
    console.error("[ai-analyze] Error:", error);
    return NextResponse.json(
      { error: error.message || "AI analysis failed" },
      { status: 500 }
    );
  }
}
