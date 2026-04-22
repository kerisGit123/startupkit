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
  model?: "bytedance/seedance-2" | "bytedance/seedance-2-fast";
  mode?: "text-to-video" | "first-frame" | "first-last-frame" | "multimodal";
  referenceImages?: string[];
  videoUrls?: string[];
  audioUrls?: string[];
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  resolution: "480p" | "720p";
  aspectRatio?: string;
  duration: number;
  generateAudio: boolean;
  webSearch: boolean;
  callbackUrl: string;
  companyId?: string;
}) {
  const { apiKey } = await resolveKieApiKey(params.companyId);
  const modelId = params.model || "bytedance/seedance-2";
  const mode = params.mode || "text-to-video";

  const input: Record<string, any> = {
    prompt: params.prompt,
    resolution: params.resolution,
    aspect_ratio: params.aspectRatio || "16:9",
    duration: params.duration,
    generate_audio: params.generateAudio,
    web_search: params.webSearch,
    nsfw_checker: false,
  };

  // Enforce mutual exclusivity per API docs:
  // Image-to-Video (First Frame), Image-to-Video (First & Last Frames),
  // and Multimodal Reference are mutually exclusive
  if (mode === "first-frame") {
    if (params.firstFrameUrl) input.first_frame_url = params.firstFrameUrl;
  } else if (mode === "first-last-frame") {
    if (params.firstFrameUrl) input.first_frame_url = params.firstFrameUrl;
    if (params.lastFrameUrl) input.last_frame_url = params.lastFrameUrl;
  } else if (mode === "multimodal") {
    // Reference images (max 9)
    if (params.referenceImages && params.referenceImages.length > 0) {
      input.reference_image_urls = params.referenceImages;
    }
    // Reference videos: max 3, each ≤15s, total ≤15s, format mp4/mov
    if (params.videoUrls && params.videoUrls.length > 0) {
      input.reference_video_urls = params.videoUrls;
    }
  }
  // text-to-video: no additional inputs needed

  // Audio references — only in multimodal mode (lipsync sends as multimodal)
  if (mode === "multimodal" && params.audioUrls && params.audioUrls.length > 0) {
    input.reference_audio_urls = params.audioUrls;
  }

  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      callBackUrl: params.callbackUrl,
      input,
    }),
  });
  if (!res.ok) throw new Error(`Seedance 2.0 API error: ${await res.text()}`);
  const data = await res.json();
  return { taskId: data.data?.taskId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined };
}

export async function generateTopazVideoUpscale(params: {
  videoUrl: string;
  upscaleFactor: "1" | "2" | "4";
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
      model: "topaz/video-upscale",
      callBackUrl: params.callbackUrl,
      input: {
        video_url: params.videoUrl,
        upscale_factor: params.upscaleFactor,
      },
    }),
  });
  if (!res.ok) throw new Error(`Topaz Video Upscale API error: ${await res.text()}`);
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

export async function generateInfinitalkFromAudio(params: {
  imageUrl: string;
  audioUrl: string;
  prompt: string;
  resolution: "480p" | "720p";
  nsfwChecker?: boolean;
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
      model: "infinitalk/from-audio",
      callBackUrl: params.callbackUrl,
      input: {
        image_url: params.imageUrl,
        audio_url: params.audioUrl,
        prompt: params.prompt,
        resolution: params.resolution.toLowerCase(),
      },
    }),
  });
  if (!res.ok) throw new Error(`InfiniteTalk API error: ${await res.text()}`);
  const data = await res.json();
  return { taskId: data.data?.taskId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined };
}

export async function generateMusic(params: {
  prompt: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  model?: string;
  negativeTags?: string;
  vocalGender?: "m" | "f";
  personaId?: string;
  callbackUrl: string;
  companyId?: string;
}) {
  const { apiKey } = await resolveKieApiKey(params.companyId);
  // Music API uses /api/v1/generate (different from /api/v1/jobs/createTask)
  const res = await fetch(`${KIE_AI_BASE}/api/v1/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: params.prompt,
      customMode: true,
      instrumental: params.instrumental ?? true,
      model: params.model || "V4",
      callBackUrl: params.callbackUrl,
      ...(params.style && { style: params.style }),
      ...(params.title && { title: params.title }),
      ...(params.negativeTags && { negativeTags: params.negativeTags }),
      ...(params.vocalGender && !params.instrumental && { vocalGender: params.vocalGender }),
      ...(params.personaId && { personaId: params.personaId, personaModel: "style_persona" }),
    }),
  });
  if (!res.ok) throw new Error(`Music API error: ${await res.text()}`);
  const data = await res.json();
  return { taskId: data.data?.taskId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined };
}

export async function uploadAndCoverAudio(params: {
  uploadUrl: string;
  prompt: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  model?: string;
  vocalGender?: "m" | "f";
  personaId?: string;
  customMode?: boolean;
  negativeTags?: string;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  callbackUrl: string;
  companyId?: string;
}) {
  const { apiKey } = await resolveKieApiKey(params.companyId);
  const res = await fetch(`${KIE_AI_BASE}/api/v1/generate/upload-cover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      uploadUrl: params.uploadUrl,
      prompt: params.prompt,
      customMode: params.customMode ?? true,
      instrumental: params.instrumental ?? true,
      model: params.model || "V4",
      callBackUrl: params.callbackUrl,
      ...(params.style && { style: params.style }),
      ...(params.title && { title: params.title }),
      ...(params.vocalGender && !params.instrumental && { vocalGender: params.vocalGender }),
      // personaId, styleWeight, weirdnessConstraint, audioWeight require customMode=true
      ...((params.customMode ?? true) && params.personaId && { personaId: params.personaId, personaModel: "style_persona" }),
      ...(params.negativeTags && { negativeTags: params.negativeTags }),
      ...((params.customMode ?? true) && params.styleWeight !== undefined && { styleWeight: params.styleWeight }),
      ...((params.customMode ?? true) && params.weirdnessConstraint !== undefined && { weirdnessConstraint: params.weirdnessConstraint }),
      ...((params.customMode ?? true) && params.audioWeight !== undefined && { audioWeight: params.audioWeight }),
    }),
  });
  if (!res.ok) throw new Error(`Upload & Cover API error: ${await res.text()}`);
  const data = await res.json();
  // Handle synchronous response: API may return bare array of URLs ["url1.mp3", "url2.mp3"]
  if (Array.isArray(data)) {
    const audioUrls = data.filter((item: any) => typeof item === 'string' && item.startsWith('http'));
    return { taskId: undefined, raw: data, responseCode: 200, responseMessage: 'success', audioUrls };
  }
  // Handle async response: {code: 200, data: {taskId: "..."}}
  return { taskId: data.data?.taskId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined, audioUrls: undefined as string[] | undefined };
}

export async function generatePersona(params: {
  taskId: string;
  audioId: string;
  name: string;
  description: string;
  vocalStart?: number;
  vocalEnd?: number;
  style?: string;
  companyId?: string;
}) {
  const { apiKey } = await resolveKieApiKey(params.companyId);
  const res = await fetch(`${KIE_AI_BASE}/api/v1/generate/generate-persona`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      taskId: params.taskId,
      audioId: params.audioId,
      name: params.name,
      description: params.description,
      ...(params.vocalStart !== undefined && { vocalStart: params.vocalStart }),
      ...(params.vocalEnd !== undefined && { vocalEnd: params.vocalEnd }),
      ...(params.style && { style: params.style }),
    }),
  });
  if (!res.ok) throw new Error(`Generate Persona API error: ${await res.text()}`);
  const data = await res.json();
  // Response: {code: 200, data: {taskId: "..."}} — the taskId IS the personaId for future use
  const personaId = data.data?.personaId || data.data?.taskId;
  return { personaId: personaId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined };
}

export async function extendMusic(params: {
  audioId: string;
  prompt?: string;
  style?: string;
  title?: string;
  model?: string;
  continueAt?: number;
  vocalGender?: "m" | "f";
  personaId?: string;
  defaultParamFlag?: boolean;
  callbackUrl: string;
  companyId?: string;
}) {
  const { apiKey } = await resolveKieApiKey(params.companyId);
  const isCustom = params.defaultParamFlag ?? true;
  const res = await fetch(`${KIE_AI_BASE}/api/v1/generate/extend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      defaultParamFlag: isCustom,
      audioId: params.audioId,
      model: params.model || "V4",
      callBackUrl: params.callbackUrl,
      ...(isCustom && params.prompt && { prompt: params.prompt }),
      ...(isCustom && params.continueAt !== undefined && { continueAt: params.continueAt }),
      ...(isCustom && params.style && { style: params.style }),
      ...(isCustom && params.title && { title: params.title }),
      ...(params.vocalGender && { vocalGender: params.vocalGender }),
      ...(isCustom && params.personaId && { personaId: params.personaId, personaModel: "style_persona" }),
    }),
  });
  if (!res.ok) throw new Error(`Extend Music API error: ${await res.text()}`);
  const data = await res.json();
  return { taskId: data.data?.taskId as string | undefined, raw: data, responseCode: data.code as number | undefined, responseMessage: data.msg as string | undefined };
}
