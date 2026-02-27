import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const KIE_API_KEY      = process.env.KIE_AI_API_KEY;
const KIE_CREATE_URL   = "https://api.kie.ai/api/v1/jobs/createTask";
const KIE_POLL_URL     = "https://api.kie.ai/api/v1/jobs/recordInfo";
const KIE_FLUX_URL     = "https://api.kie.ai/api/v1/flux/kontext/generate";
const KIE_FLUX_POLL    = "https://api.kie.ai/api/v1/flux/kontext/record-info";
const KIE_GPT4O_URL    = "https://api.kie.ai/api/v1/gpt4o-image/generate";
const KIE_GPT4O_POLL   = "https://api.kie.ai/api/v1/gpt4o-image/record-info";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Upload base64 to freeimage.host → public URL
async function uploadToTemp(base64DataUrl: string): Promise<string> {
  if (!base64DataUrl.startsWith("data:")) return base64DataUrl; // already a URL
  const base64 = base64DataUrl.split(",")[1];
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const formData = new FormData();
      formData.append("key", "6d207e02198a847aa98d0a2a901485a5");
      formData.append("action", "upload");
      formData.append("source", base64);
      formData.append("format", "json");
      const res = await fetch("https://freeimage.host/api/1/upload", {
        method: "POST", body: formData, signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`Upload HTTP ${res.status}`);
      const data = await res.json();
      const url = data?.image?.url;
      if (!url) throw new Error(`No URL: ${JSON.stringify(data)}`);
      console.log("[img-proxy] Uploaded:", url.substring(0, 80));
      return url;
    } catch (err) {
      console.warn(`[img-proxy] Upload attempt ${attempt} failed:`, err);
      if (attempt === 3) throw new Error(`Image upload failed: ${err}`);
      await sleep(2000 * attempt);
    }
  }
  throw new Error("Upload failed");
}

// Poll /jobs/recordInfo — Market API models
async function pollMarket(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    try {
      const res = await fetch(`${KIE_POLL_URL}?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { console.warn(`[img-proxy] poll ${i+1} non-ok ${res.status}`); continue; }
      const pd = await res.json();
      const flag = pd?.data?.successFlag;
      const state = pd?.data?.state;
      console.log(`[img-proxy] poll ${i+1}: flag=${flag} state=${state}`);
      if (flag === 1 || state === "success") {
        let parsed: Record<string, unknown> = {};
        if (typeof pd?.data?.resultJson === "string") {
          try { parsed = JSON.parse(pd.data.resultJson); } catch { /* ok */ }
        }
        const url =
          (parsed?.resultUrls as string[])?.[0] ??
          (parsed?.resultImageUrl as string) ??
          pd?.data?.response?.resultImageUrl ??
          pd?.data?.resultImageUrl ??
          pd?.data?.response?.url ??
          pd?.data?.url ??
          pd?.data?.resultUrls?.[0] ??
          pd?.data?.response?.resultUrls?.[0];
        if (!url) throw new Error(`No result URL in: ${JSON.stringify(pd?.data)}`);
        return url;
      }
      if (flag === 2 || flag === 3 || state === "fail") {
        throw new Error(`KIE task failed: ${pd?.data?.failMsg ?? pd?.data?.errorMessage ?? "unknown"}`);
      }
    } catch (err) {
      console.warn(`[img-proxy] poll ${i+1} error:`, err);
      // re-throw on task-level errors
      if (err instanceof Error && (err.message.startsWith("KIE task") || err.message.startsWith("No result"))) throw err;
    }
  }
  throw new Error("KIE timed out after 5 minutes");
}

// Poll /flux/kontext/record-info — Flux Kontext models
async function pollFlux(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    try {
      const res = await fetch(`${KIE_FLUX_POLL}?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { console.warn(`[img-proxy/flux] poll ${i+1} non-ok ${res.status}`); continue; }
      const pd = await res.json();
      const flag = pd?.data?.successFlag;
      console.log(`[img-proxy/flux] poll ${i+1}: flag=${flag}`);
      if (flag === 1) {
        const url = pd?.data?.response?.resultImageUrl ?? pd?.data?.resultImageUrl;
        if (!url) throw new Error(`No resultImageUrl in flux response: ${JSON.stringify(pd?.data)}`);
        return url;
      }
      if (flag === 2 || flag === 3) throw new Error(`Flux task failed: ${pd?.data?.errorMessage ?? "unknown"}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Flux task")) throw err;
      console.warn(`[img-proxy/flux] poll ${i+1} error:`, err);
    }
  }
  throw new Error("Flux KIE timed out after 5 minutes");
}

// Poll /gpt4o-image/record-info — GPT-4o image models
async function pollGpt4o(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    try {
      const res = await fetch(`${KIE_GPT4O_POLL}?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { console.warn(`[img-proxy/gpt4o] poll ${i+1} non-ok ${res.status}`); continue; }
      const data = await res.json();
      const { successFlag, response } = data?.data ?? {};
      console.log(`[img-proxy/gpt4o] poll ${i+1}: flag=${successFlag}`);
      if (successFlag === 1) {
        const url = response?.resultUrls?.[0] ?? response?.resultImageUrl;
        if (!url) throw new Error(`No URL in gpt4o response: ${JSON.stringify(data?.data)}`);
        return url;
      }
      if (successFlag === 2) throw new Error(`GPT-4o failed: ${data?.data?.errorMessage ?? "unknown"}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("GPT-4o")) throw err;
      console.warn(`[img-proxy/gpt4o] poll ${i+1} error:`, err);
    }
  }
  throw new Error("GPT-4o KIE timed out");
}

// ── Model handlers ─────────────────────────────────────────────────────────────

// Build model-specific input object for Market API
function buildMarketInput(
  kieModel: string,
  prompt: string,
  imageUrl: string | null,
  refUrls: string[],
  aspectRatio?: string
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    prompt,
    output_format: "png",
  };

  // Nano Banana family: uses image_urls array (supports multi-ref)
  if (kieModel.startsWith("google/nano-banana")) {
    const allUrls = [...(imageUrl ? [imageUrl] : []), ...refUrls];
    if (allUrls.length > 0) base.image_urls = allUrls;
    if (aspectRatio) base.aspect_ratio = aspectRatio;
    return base;
  }

  // Seedream 4.5: uses image_urls array + specific size fields
  if (kieModel === "seedream/4.5-text-to-image") {
    const allUrls = imageUrl ? [imageUrl, ...refUrls] : refUrls;
    if (allUrls.length > 0) {
      base.image_urls = allUrls;
    }
    base.image_size = "landscape_16_9";
    base.image_resolution = "1K";
    base.max_images = allUrls.length || 1;
    return base;
  }

  // Seedream 5 Lite: same structure as Seedream 4.5
  if (kieModel === "seedream/5-lite-text-to-image") {
    const allUrls = imageUrl ? [imageUrl, ...refUrls] : refUrls;
    if (allUrls.length > 0) {
      base.image_urls = allUrls;
    }
    base.image_size = "landscape_16_9";
    base.image_resolution = "1K";
    base.max_images = allUrls.length || 1;
    return base;
  }

  // Seedream 5 Lite image-to-image: try multiple field approaches
  if (kieModel === "seedream/5-lite-image-to-image") {
    const allUrls = imageUrl ? [imageUrl, ...refUrls] : refUrls;
    if (allUrls.length > 0) {
      // Try both image_urls and input_urls to see which one works
      base.image_urls = allUrls;
      base.input_urls = allUrls;
    }
    base.image_size = "landscape_16_9";
    base.image_resolution = "1K";
    base.max_images = allUrls.length || 1;
    // Also try adding common fields that might be required
    base.num_outputs = 1;
    base.guidance_scale = 7.5;
    return base;
  }

  // Seedream V4 / bytedance: uses image_url (single)
  if (kieModel === "bytedance/seedream-v4") {
    const primaryUrl = imageUrl ?? refUrls[0] ?? null;
    if (primaryUrl) base.image_url = primaryUrl;
    base.image_size = "landscape_16_9";
    base.image_resolution = "1K";
    base.max_images = 1;
    return base;
  }

  // Flux-2 image-to-image variants: require input_urls array + resolution field
  if (kieModel === "flux-2/flex-image-to-image" || kieModel === "flux-2/pro-image-to-image") {
    const allUrls = [...(imageUrl ? [imageUrl] : []), ...refUrls];
    if (allUrls.length > 0) base.input_urls = allUrls;
    base.image_size = "landscape_16_9";
    base.resolution = "1K";
    base.max_images = 1;
    if (aspectRatio) base.aspect_ratio = aspectRatio;
    return base;
  }

  // Flux-2 text-to-image variants: use image_url (single, optional)
  if (kieModel === "flux-2/flex-text-to-image" || kieModel === "flux-2/pro-text-to-image") {
    const primaryUrl = imageUrl ?? refUrls[0] ?? null;
    if (primaryUrl) base.image_url = primaryUrl;
    base.image_size = "landscape_16_9";
    base.resolution = "1K";
    base.max_images = 1;
    if (aspectRatio) base.aspect_ratio = aspectRatio;
    return base;
  }

  // Qwen image-edit / image-to-image: uses image_url (single, first image wins)
  if (kieModel === "qwen/image-edit" || kieModel === "qwen/image-to-image") {
    // qwen/image-edit uses the reference image as the primary edit target
    const primaryUrl = refUrls[0] ?? imageUrl ?? null;
    if (primaryUrl) base.image_url = primaryUrl;
    if (aspectRatio) base.aspect_ratio = aspectRatio;
    return base;
  }

  // Qwen text-to-image: no image input needed
  if (kieModel === "qwen/text-to-image") {
    if (aspectRatio) base.aspect_ratio = aspectRatio;
    return base;
  }

  // Grok: uses image_urls array but only supports 1 image
  if (kieModel.startsWith("grok-imagine/")) {
    // For Grok, prioritize base image over reference images (only 1 image supported)
    const primaryUrl = imageUrl ?? refUrls[0] ?? null;
    if (primaryUrl) base.image_urls = [primaryUrl];
    if (aspectRatio) base.aspect_ratio = aspectRatio;
    return base;
  }

  // Default fallback: image_urls array
  const allUrls = [...(imageUrl ? [imageUrl] : []), ...refUrls];
  if (allUrls.length > 0) base.image_urls = allUrls;
  if (aspectRatio) base.aspect_ratio = aspectRatio;
  return base;
}

// Market API — routes each model family to correct input structure
async function callMarketModel(
  kieModel: string,
  prompt: string,
  imageUrl: string | null,
  refUrls: string[],
  aspectRatio?: string
): Promise<string> {
  const input = buildMarketInput(kieModel, prompt, imageUrl, refUrls, aspectRatio);
  const requestBody = { model: kieModel, input };
  console.log("[img-proxy] Market API request:", JSON.stringify({ model: kieModel, imageCount: (imageUrl ? 1 : 0) + refUrls.length }));
  console.log("[img-proxy] Request body:", JSON.stringify(requestBody, null, 2));

  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[img-proxy] Market API create response:", JSON.stringify(data));

  if (data?.code !== 200) {
    throw new Error(`KIE ${kieModel} error: ${data?.msg ?? JSON.stringify(data)}`);
  }
  const taskId = data?.data?.taskId ?? data?.data?.recordId;
  return pollMarket(taskId);
}

// Flux Kontext Pro — dedicated endpoint
async function callFluxKontextPro(
  prompt: string,
  imageUrl: string | null,
  refUrls: string[],
  aspectRatio?: string
): Promise<string> {
  // Flux Kontext: canvas = inputImage (the scene to edit).
  // Reference image URL is injected into the prompt so the model knows what to apply.
  const sceneUrl = imageUrl ?? null;

  let finalPrompt = prompt;
  if (refUrls.length > 0) {
    // Tell Flux Kontext exactly what the reference looks like by including its URL in the prompt
    finalPrompt = `${prompt}. Use the style/item from this reference image: ${refUrls[0]}`;
  }

  const requestBody: Record<string, unknown> = {
    model: "flux-kontext-pro",
    prompt: finalPrompt,
    outputFormat: "png",
  };
  if (sceneUrl) requestBody.inputImage = sceneUrl;
  if (aspectRatio) requestBody.aspectRatio = aspectRatio;

  console.log("[img-proxy] Flux Kontext Pro request, inputImage (scene):", sceneUrl?.substring(0, 60), "refInjected:", refUrls.length > 0);

  const res = await fetch(KIE_FLUX_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[img-proxy] Flux Kontext Pro response:", JSON.stringify(data));

  if (data?.code !== 200) throw new Error(`Flux Kontext Pro: ${data?.msg ?? JSON.stringify(data)}`);
  return pollFlux(data.data.taskId);
}

// GPT-4o API only supports size: "1:1" (based on inpaint route working implementation)
function gpt4oSize(aspectRatio?: string): string {
  console.log("[img-proxy] GPT-4o aspectRatio input:", JSON.stringify(aspectRatio), "-> forcing to 1:1");
  return "1:1";
}


// GPT-4o image
async function callGpt4o(
  prompt: string,
  imageUrl: string | null,
  refUrls: string[],
  aspectRatio?: string
): Promise<string> {
  const allUrls = [...(imageUrl ? [imageUrl] : []), ...refUrls];
  const requestBody = {
    filesUrl: allUrls.length > 0 ? allUrls : undefined,
    prompt,
    size: gpt4oSize(aspectRatio),
    nVariants: 1,
    isEnhance: false,
  };
  console.log("[img-proxy] GPT-4o request, images:", allUrls.length);

  const res = await fetch(KIE_GPT4O_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[img-proxy] GPT-4o response:", JSON.stringify(data));

  if (data?.code !== 200) throw new Error(`GPT-4o: ${data?.msg ?? JSON.stringify(data)}`);
  return pollGpt4o(data.data.taskId);
}

// ── KIE model name mapping (frontend key → KIE model ID) ──────────────────────
const MODEL_MAP: Record<string, string> = {
  "nano-banana":                "google/nano-banana",
  "nano-banana-edit":           "google/nano-banana-edit",
  "nano-banana-pro":            "google/nano-banana",
  "flux-kontext-pro":           "flux-kontext-pro",
  "flux-2-flex-image-to-image": "flux-2/flex-image-to-image",
  "flux-2-flex-text-to-image":  "flux-2/flex-text-to-image",
  "flux-2-pro-image-to-image":  "flux-2/pro-image-to-image",
  "flux-2-pro-text-to-image":   "flux-2/pro-text-to-image",
  "openai-4o":                  "gpt-image",
  "gpt-image":                  "gpt-image",
  "grok":                       "grok-imagine/image-to-image",
  "grok-text":                  "grok-imagine/text-to-image",
  "qwen":                       "qwen/image-to-image",
  "qwen-text":                  "qwen/text-to-image",
  "qwen-z-image":               "qwen/image-edit",
  "seedream-4.5":               "seedream/4.5-text-to-image",
  "seedream-5.0-lite":          "seedream/5-lite-text-to-image",
  "seedream-5.0-lite-image-to-image": "seedream/5-lite-image-to-image",
  "seedream-v4":                "bytedance/seedream-v4",
  "flux-fill":                  "black-forest-labs/flux-1.1-fill",
};

export async function POST(req: NextRequest) {
  try {
    if (!KIE_API_KEY) {
      return NextResponse.json({ error: "KIE_AI_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { prompt, model: frontendModel, image, referenceImages, aspectRatio } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Resolve frontend model key → KIE model ID
    const kieModel = MODEL_MAP[frontendModel] ?? frontendModel;
    console.log(`[img-proxy] model: ${frontendModel} → ${kieModel}`);

    // Upload any base64 images to public URLs
    let imageUrl: string | null = null;
    if (image) {
      console.log("[img-proxy] Uploading base image...");
      imageUrl = await uploadToTemp(image);
    }

    let refUrls: string[] = [];
    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
      console.log(`[img-proxy] Uploading ${referenceImages.length} reference images...`);
      refUrls = await Promise.all(referenceImages.map((img: string) => uploadToTemp(img)));
    }

    // Route to the correct KIE endpoint based on model
    let resultUrl: string;

    if (kieModel === "flux-kontext-pro") {
      resultUrl = await callFluxKontextPro(prompt, imageUrl, refUrls, aspectRatio);
    } else if (kieModel === "gpt-image" || kieModel === "gpt-image/1.5-image-to-image") {
      // Handle rectangle inpaint requests
      if (body.image && body.prompt && body.model) {
        const { image, prompt, model, mask, isSquareMode, rectangle, canvasDisplaySize } = body;
        console.log("[img-proxy] Rectangle inpaint request, model:", model, "mask:", !!mask, "squareMode:", isSquareMode);
        
        try {
          let result: string;
          
          if (isSquareMode && model === "gpt-image") {
            // Square mode: frontend should handle cropping and compositing
            // Backend just receives the cropped square image directly
            console.log("[img-proxy] Square mode: processing cropped square image");
            
            if (!rectangle) {
              throw new Error("Rectangle coordinates required for square mode");
            }
            
            // For square mode, upload the cropped image and use URL like regular generation
            const squareImageUrl = await uploadToTemp(image);
            console.log("[img-proxy] Square mode: uploaded cropped square:", squareImageUrl);
            result = await callGpt4o(prompt, squareImageUrl, refUrls, "1:1");
            console.log("[img-proxy] GPT-1.5 generated square");
          } else {
            // Normal mode: send directly to model
            result = await callGpt4o(prompt, imageUrl, refUrls, aspectRatio);
          }
          
          return NextResponse.json({ image: result });
        } catch (error) {
          console.error("[img-proxy] Rectangle inpaint error:", error);
          return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to process rectangle inpaint" }, { status: 500 });
        }
      } else {
        resultUrl = await callGpt4o(prompt, imageUrl, refUrls, aspectRatio);
      }
    } else {
      // All other models use the generic Market API
      resultUrl = await callMarketModel(kieModel, prompt, imageUrl, refUrls, aspectRatio);
    }

    console.log("[img-proxy] Done:", resultUrl);
    return NextResponse.json({ image: resultUrl });
  } catch (error) {
    console.error("[img-proxy] Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
