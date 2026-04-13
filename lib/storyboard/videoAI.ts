import { resolveKieApiKey } from "./kieAI";

const KIE_AI_BASE = "https://api.kie.ai";

export const VIDEO_MODELS = {
  "veo-3-1": {
    label: "Veo 3.1",
    description: "Premium quality, fixed price",
    maxDuration: 8,
    qualities: ["fast", "quality"] as const,
  },
  "kling-3.0": {
    label: "Kling 3.0",
    description: "Flexible, per-second pricing",
    maxDuration: 15,
    qualities: ["std", "pro"] as const,
  },
} as const;

export type VideoModel = keyof typeof VIDEO_MODELS;
export type VideoQuality = "fast" | "quality" | "std" | "pro";

export const VIDEO_CREDITS: Record<VideoModel, Record<string, number>> = {
  "veo-3-1":  { fast: 80, quality: 325 },
  "kling-3.0": { std: 25, pro: 35 }, // per second
};

export function calcVideoCredits(model: VideoModel, quality: VideoQuality, duration: number) {
  const rate = VIDEO_CREDITS[model][quality] ?? 25;
  return model === "kling-3.0" ? rate * duration : rate;
}

export async function generateKlingVideo(params: {
  tier: "std" | "pro";
  startFrameUrl?: string;
  endFrameUrl?: string;
  audioEnabled: boolean;
  duration: number;
  aspectRatio: string;
  prompt: string;
  callbackUrl: string;
  companyId?: string;
}) {
  const { apiKey } = await resolveKieApiKey(params.companyId);
  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "kling-3.0/video",
      callBackUrl: params.callbackUrl,
      input: {
        mode: params.tier,
        image_urls: [params.startFrameUrl, params.endFrameUrl].filter(Boolean),
        sound: params.audioEnabled,
        duration: String(params.duration),
        aspect_ratio: params.aspectRatio,
        multi_shots: false,
        prompt: params.prompt,
        kling_elements: [],
      },
    }),
  });
  if (!res.ok) throw new Error(`Kling API error: ${await res.text()}`);
  const data = await res.json();
  return { taskId: data.data?.taskId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined };
}

export async function generateVeoVideo(params: {
  quality: "fast" | "quality";
  imageUrl?: string;
  prompt: string;
  aspectRatio: string;
  duration: number;
  callbackUrl: string;
  companyId?: string;
}) {
  const { apiKey } = await resolveKieApiKey(params.companyId);
  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "veo-3-1/video",
      callBackUrl: params.callbackUrl,
      input: {
        quality: params.quality,
        image_url: params.imageUrl,
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio,
        duration: params.duration,
      },
    }),
  });
  if (!res.ok) throw new Error(`Veo API error: ${await res.text()}`);
  const data = await res.json();
  return { taskId: data.data?.taskId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined };
}

export async function checkVideoJobStatus(taskId: string, companyId?: string) {
  const { apiKey } = await resolveKieApiKey(companyId);
  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Status check error: ${await res.text()}`);
  return await res.json();
}

export async function generateKlingMotionControl(params: {
  prompt: string;
  inputImageUrl?: string;
  videoUrl?: string;
  mode: "720p" | "1080p";
  characterOrientation: "image" | "video";
  backgroundSource: "input_video" | "input_image";
  callbackUrl: string;
  companyId?: string;
}) {
  const { apiKey } = await resolveKieApiKey(params.companyId);
  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "kling-3.0/motion-control",
      callBackUrl: params.callbackUrl,
      input: {
        prompt: params.prompt,
        input_urls: params.inputImageUrl ? [params.inputImageUrl] : [],
        video_urls: params.videoUrl ? [params.videoUrl] : [],
        mode: params.mode,
        character_orientation: params.characterOrientation,
        background_source: params.backgroundSource,
      },
    }),
  });
  if (!res.ok) throw new Error(`Kling Motion Control API error: ${await res.text()}`);
  const data = await res.json();
  return { taskId: data.data?.taskId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined };
}

export async function generateSeedance2(params: {
  prompt: string;
  referenceImages?: string[];
  videoUrls?: string[];
  audioUrls?: string[];
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  resolution: "480p" | "720p";
  duration: number;
  hasVideoInput: boolean;
  generateAudio: boolean;
  webSearch: boolean;
  callbackUrl: string;
  companyId?: string;
}) {
  const { apiKey } = await resolveKieApiKey(params.companyId);

  const input: Record<string, any> = {
    prompt: params.prompt,
    input_urls: params.referenceImages || [],
    resolution: params.resolution,
    duration: String(params.duration),
    generate_audio: params.generateAudio,
    web_search: params.webSearch,
  };

  // Video references (max 3, total ≤15s)
  if (params.videoUrls && params.videoUrls.length > 0) {
    input.video_urls = params.videoUrls;
  }

  // Audio references (max 3, total ≤15s)
  if (params.audioUrls && params.audioUrls.length > 0) {
    input.audio_urls = params.audioUrls;
  }

  // First/last frame
  if (params.firstFrameUrl) {
    input.first_frame_url = params.firstFrameUrl;
  }
  if (params.lastFrameUrl) {
    input.last_frame_url = params.lastFrameUrl;
  }

  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "bytedance/seedance-2",
      callBackUrl: params.callbackUrl,
      input,
    }),
  });
  if (!res.ok) throw new Error(`Seedance 2.0 API error: ${await res.text()}`);
  const data = await res.json();
  return { taskId: data.data?.taskId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined };
}

export async function generateGrokImagineVideo(params: {
  prompt: string;
  imageUrls: string[];
  aspectRatio: string;
  resolution: string;
  duration: number;
  callbackUrl: string;
  companyId?: string;
}) {
  const { apiKey } = await resolveKieApiKey(params.companyId);
  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-imagine/image-to-video",
      callBackUrl: params.callbackUrl,
      input: {
        prompt: params.prompt,
        image_urls: params.imageUrls,
        mode: "normal",
        duration: String(params.duration),
        resolution: params.resolution.toLowerCase(),
        aspect_ratio: params.aspectRatio,
      },
    }),
  });
  if (!res.ok) throw new Error(`Grok Imagine API error: ${await res.text()}`);
  const data = await res.json();
  return { taskId: data.data?.taskId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined };
}
