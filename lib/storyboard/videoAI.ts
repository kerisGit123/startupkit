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
}) {
  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.KIE_AI_API_KEY}`,
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
  return { taskId: data.data?.taskId as string | undefined, raw: data };
}

export async function generateVeoVideo(params: {
  quality: "fast" | "quality";
  imageUrl?: string;
  prompt: string;
  aspectRatio: string;
  duration: number;
  callbackUrl: string;
}) {
  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.KIE_AI_API_KEY}`,
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
  return { taskId: data.data?.taskId as string | undefined, raw: data };
}

export async function checkVideoJobStatus(taskId: string) {
  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/${taskId}`, {
    headers: { Authorization: `Bearer ${process.env.KIE_AI_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Status check error: ${await res.text()}`);
  return await res.json();
}
