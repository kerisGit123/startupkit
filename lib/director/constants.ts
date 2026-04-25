/**
 * AI Director — Model knowledge and filmmaking reference data.
 * Used by the tool executor to give model recommendations.
 */

export const MODEL_KNOWLEDGE = {
  image: [
    {
      id: "nano-banana-2",
      name: "Nano Banana 2",
      credits: "5-18 (resolution dependent)",
      strengths: "Fast, reliable, good general-purpose storyboard frames. Best balance of speed and quality.",
      bestFor: "Storyboard frames, concept art, scene visualization",
    },
    {
      id: "nano-banana-pro",
      name: "Nano Banana Pro",
      credits: "18-24",
      strengths: "Higher detail and quality than NB2. Better textures, lighting, and composition.",
      bestFor: "Hero shots, final presentation frames, detailed close-ups",
    },
    {
      id: "gpt-image-2-image-to-image",
      name: "GPT Image 2",
      credits: "15",
      strengths: "Best for photorealistic images. Excellent text rendering in images. Strong composition.",
      bestFor: "Photorealistic scenes, images with text/signage, product shots",
    },
    {
      id: "z-image",
      name: "Z-Image",
      credits: "1",
      strengths: "Cheapest model. Good for quick drafts and rough visualization.",
      bestFor: "Quick drafts, layout planning, rough concepts when budget matters",
    },
    {
      id: "flux-2/pro-text-to-image",
      name: "Flux 2 Pro",
      credits: "10",
      strengths: "Excellent artistic composition. Strong with stylized and illustrated looks.",
      bestFor: "Artistic/stylized frames, illustration style, graphic novel aesthetic",
    },
  ],
  video: [
    {
      id: "bytedance/seedance-1.5-pro",
      name: "Seedance 1.5 Pro",
      credits: "5-90 (resolution + duration + audio)",
      strengths: "Best value. Supports audio generation. Good motion quality. 480P/720P/1080P.",
      bestFor: "General video generation, scenes with dialogue/sound, budget-friendly production",
    },
    {
      id: "bytedance/seedance-2",
      name: "Seedance 2.0",
      credits: "Varies by resolution and duration",
      strengths: "Highest quality video. Multi-shot support (UGC mode: product + influencer, Showcase mode: subject + presenter + scene).",
      bestFor: "Hero video shots, multi-angle sequences, marketing content, cinematic quality",
    },
    {
      id: "kling-3.0/motion-control",
      name: "Kling 3.0 Motion Control",
      credits: "Varies by resolution and duration",
      strengths: "Best camera motion control. Precise dolly, pan, tilt, orbit movements.",
      bestFor: "Shots requiring specific camera movement — tracking shots, dolly zooms, orbital reveals",
    },
    {
      id: "google/veo-3.1",
      name: "Veo 3.1",
      credits: "60 (fast) / 250 (quality)",
      strengths: "Google's flagship. Excellent cinematic quality and temporal coherence.",
      bestFor: "Premium cinematic shots, high-budget hero sequences, final presentation videos",
    },
    {
      id: "grok-imagine/image-to-video",
      name: "Grok Imagine",
      credits: "Varies",
      strengths: "Good stylized video generation. Unique aesthetic.",
      bestFor: "Stylized/artistic video, creative visual effects",
    },
  ],
  audio: [
    {
      id: "ai-music-api/generate",
      name: "AI Music Generator",
      credits: "15",
      strengths: "Full music track generation from text description. Create, extend, or cover.",
      bestFor: "Background music, scene scoring, mood setting",
    },
    {
      id: "elevenlabs/text-to-speech-multilingual-v2",
      name: "ElevenLabs TTS",
      credits: "Per character count",
      strengths: "High-quality multilingual text-to-speech. Natural voice synthesis.",
      bestFor: "Narration, character dialogue, voiceover",
    },
  ],
  utility: [
    {
      id: "topaz/image-upscale",
      name: "Topaz Upscale",
      credits: "8-15",
      strengths: "AI image upscaling to higher resolution.",
      bestFor: "Upscaling final frames for print or high-res export",
    },
    {
      id: "infinitalk/from-audio",
      name: "InfiniTalk Lipsync",
      credits: "Varies by resolution and duration",
      strengths: "Audio-driven lip sync on character images/videos.",
      bestFor: "Adding lip sync to character dialogue shots",
    },
  ],
};

export const SHOT_TYPES: Record<string, string> = {
  "establishing": "Wide shot showing the full location/environment. Sets the scene. Usually the first shot in a sequence.",
  "wide": "Full body or environment visible. Shows spatial relationships. Good for action and movement.",
  "medium": "Waist-up framing. Conversational distance. The workhorse of narrative filmmaking.",
  "medium-close-up": "Chest-up. More intimate than medium. Good for emotional dialogue.",
  "close-up": "Face fills the frame. Maximum emotional impact. Shows subtle expressions.",
  "extreme-close-up": "Single feature (eyes, hands, object). Creates tension or draws attention to detail.",
  "over-the-shoulder": "Camera behind one character looking at another. Standard dialogue coverage.",
  "pov": "First-person perspective. The audience sees through a character's eyes.",
  "insert": "Close shot of an object or detail. Provides information (clock, letter, weapon).",
  "cutaway": "Shot of something outside the main action. Provides context or reaction.",
  "two-shot": "Two characters in frame. Shows relationship and relative positioning.",
  "aerial": "Bird's-eye or drone perspective. Establishes scale, geography, or spectacle.",
};

export const CAMERA_MOVEMENTS: Record<string, string> = {
  "static": "Locked-off camera. Stable, composed. Best for dialogue, contemplation, formal scenes.",
  "pan": "Horizontal rotation on axis. Reveals environment, follows action, transitions between subjects.",
  "tilt": "Vertical rotation on axis. Reveals tall subjects, creates unease (tilt up = power, tilt down = submission).",
  "dolly": "Camera moves toward/away from subject on track. Creates intimacy (in) or isolation (out). The Spielberg signature.",
  "tracking": "Camera moves alongside moving subject. Maintains consistent framing during motion.",
  "crane": "Camera rises or descends. Creates grandeur (up) or intimacy (down). Reveal shots.",
  "orbit": "Camera circles around subject. Creates 360-degree view, builds tension, emphasizes isolation.",
  "handheld": "Intentional instability. Creates documentary feel, urgency, chaos, intimacy.",
  "steadicam": "Smooth gliding movement. Follows characters through spaces. The Kubrick hallway.",
  "zoom": "Optical zoom in/out. Creates unease (zoom in), revelation (zoom out). Not the same as dolly.",
  "whip-pan": "Extremely fast pan. Transitions between scenes, creates energy and disorientation.",
  "push-in": "Slow dolly toward subject. Builds tension, focuses attention, creates intimacy.",
};
