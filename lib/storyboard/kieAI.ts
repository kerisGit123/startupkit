const KIE_AI_BASE = "https://api.kie.ai";

export const STYLE_PRESETS = {
  realistic: {
    label: "Photorealistic",
    model: "kie-image-pro-v2",
    promptSuffix: "professional photography, cinematic lighting, high detail, 4K",
  },
  cartoon: {
    label: "Cartoon",
    model: "kie-image-v2",
    promptSuffix: "colorful cartoon style, bold outlines, vibrant colors",
  },
  anime: {
    label: "Anime",
    model: "kie-image-v2",
    promptSuffix: "anime style, clean lines, expressive eyes, vibrant palette",
  },
  cinematic: {
    label: "Cinematic",
    model: "kie-image-pro-v2",
    promptSuffix: "cinematic film still, dramatic lighting, shallow depth of field, moody atmosphere",
  },
} as const;

export type ImageStyle = keyof typeof STYLE_PRESETS;
export type ImageQuality = "standard" | "high";

export const IMAGE_CREDITS: Record<ImageQuality, number> = {
  standard: 5,
  high: 10,
};

export async function triggerImageGeneration(params: {
  prompt: string;
  style: ImageStyle;
  aspectRatio: string;
  quality: ImageQuality;
  callbackUrl?: string;
}) {
  const { promptSuffix, model } = STYLE_PRESETS[params.style];
  const fullPrompt = `${params.prompt}, ${promptSuffix}`;

  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.KIE_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      callBackUrl: params.callbackUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/callback/image`,
      input: {
        prompt: fullPrompt,
        aspect_ratio: params.aspectRatio,
        quality: params.quality,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kie AI image error: ${err}`);
  }

  const data = await res.json();
  return { taskId: data.data?.taskId as string | undefined, raw: data };
}

export async function enhancePromptForImage(
  sceneContent: string,
  technical: { camera?: string[]; lighting?: string[]; perspective?: string[]; action?: string[] } | undefined,
  style: string
): Promise<string> {
  const systemPrompt = `You are a professional storyboard artist creating frames for TikTok/YouTube short stories.
Given a scene description, output a detailed image generation prompt.
Style: ${style}. Include camera angle, lighting, mood, character poses, background.
Keep it under 150 words. Output ONLY the prompt, no explanation.`;

  const userInput = technical
    ? `Scene: ${sceneContent}\nCamera: ${technical.camera?.join(", ")}\nLighting: ${technical.lighting?.join(", ")}\nAction: ${technical.action?.join(", ")}`
    : sceneContent;

  const res = await fetch("https://api.kie.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KIE_AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
      temperature: 0.7,
      max_tokens: 250,
    }),
  });

  if (!res.ok) return sceneContent;
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? sceneContent;
}
