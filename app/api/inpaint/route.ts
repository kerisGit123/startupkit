import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

// All models go through Kie.ai
const KIE_API_KEY      = process.env.KIE_AI_API_KEY;
const KIE_CREATE_URL   = "https://api.kie.ai/api/v1/jobs/createTask";
const KIE_POLL_URL     = "https://api.kie.ai/api/v1/jobs/recordInfo";
// Nano-banana (flux-kontext) uses its own dedicated endpoint
const KIE_FLUX_URL     = "https://api.kie.ai/api/v1/flux/kontext/generate";
const KIE_FLUX_POLL    = "https://api.kie.ai/api/v1/flux/kontext/record-info";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Upload base64 to freeimage.host → returns public URL (Kie.ai needs URLs not base64)
async function uploadImageToTemp(base64DataUrl: string): Promise<string> {
  if (!base64DataUrl.startsWith("data:")) return base64DataUrl;
  const base64 = base64DataUrl.split(",")[1];
  const formData = new FormData();
  formData.append("key", "6d207e02198a847aa98d0a2a901485a5");
  formData.append("action", "upload");
  formData.append("source", base64);
  formData.append("format", "json");
  const res = await fetch("https://freeimage.host/api/1/upload", {
    method: "POST", body: formData, signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Image upload failed: ${res.status}`);
  const data = await res.json();
  const url = data?.image?.url;
  if (!url) throw new Error(`Image upload returned no URL: ${JSON.stringify(data)}`);
  console.log("[inpaint] Uploaded URL:", url);
  return url;
}

// Poll /jobs/recordInfo until done — used by all Market API models
async function pollKieMarket(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    let pollRes: Response;
    try {
      pollRes = await fetch(`${KIE_POLL_URL}?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
    } catch { console.warn(`[inpaint] poll ${i+1} fetch error`); continue; }

    if (!pollRes.ok) { console.warn(`[inpaint] poll ${i+1} non-ok ${pollRes.status}`); continue; }

    const pd = await pollRes.json();
    // Market API uses successFlag: 0=running, 1=success, 2/3=fail
    const flag = pd?.data?.successFlag;
    const state = pd?.data?.state; // some models use "state" instead
    console.log(`[inpaint] poll ${i+1}: flag=${flag} state=${state}`);

    if (flag === 1 || state === "success") {
      // resultJson is a stringified JSON: {"resultUrls":["https://..."]}
      let parsedResult: Record<string, unknown> = {};
      if (typeof pd?.data?.resultJson === "string") {
        try { parsedResult = JSON.parse(pd.data.resultJson); } catch { /* ignore */ }
      }
      const url =
        (parsedResult?.resultUrls as string[])?.[0] ??
        (parsedResult?.resultImageUrl as string) ??
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
      const reason = pd?.data?.failMsg ?? pd?.data?.errorMessage ?? pd?.data?.failReason ?? pd?.data?.reason ?? "unknown";
      console.error("[inpaint] Kie.ai task failed. Full response:", JSON.stringify(pd?.data, null, 2));
      throw new Error(`Kie.ai task failed: ${reason}`);
    }
  }
  throw new Error("Kie.ai timed out after 300s");
}

// Poll flux/kontext/record-info — used only by nano-banana
async function pollKieFlux(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    let pollRes: Response;
    try {
      pollRes = await fetch(`${KIE_FLUX_POLL}?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
    } catch { console.warn(`[inpaint/flux] poll ${i+1} fetch error`); continue; }

    if (!pollRes.ok) { console.warn(`[inpaint/flux] poll ${i+1} non-ok ${pollRes.status}`); continue; }

    const pd = await pollRes.json();
    const flag = pd?.data?.successFlag;
    console.log(`[inpaint/flux] poll ${i+1}: flag=${flag}`);
    if (flag === 1) {
      const url = pd?.data?.response?.resultImageUrl ?? pd?.data?.resultImageUrl;
      if (!url) throw new Error(`No resultImageUrl in: ${JSON.stringify(pd?.data)}`);
      return url;
    }
    if (flag === 2 || flag === 3) throw new Error(`Kie.ai flux failed (${flag}): ${pd?.data?.errorMessage ?? "unknown"}`);
  }
  throw new Error("Kie.ai flux timed out after 300s");
}

// ── Model handlers (all via Kie.ai) ──────────────────────────────────────────

// google/nano-banana via Market API (/jobs/createTask)
async function runNanoBanana(image: string, prompt: string): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/nano-banana-edit",
      input: { prompt, image_urls: [imageUrl], output_format: "png", image_size: "1:1" },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[inpaint/nano-banana] create:", JSON.stringify(data));
  if (data?.code !== 200) throw new Error(`Kie.ai nano-banana: ${data?.msg ?? JSON.stringify(data)}`);
  return pollKieMarket(data.data.taskId);
}

// flux-kontext-pro via dedicated flux endpoint
async function runFluxKontextPro(image: string, prompt: string): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  const res = await fetch(KIE_FLUX_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "flux-kontext-pro", prompt, inputImage: imageUrl, outputFormat: "jpeg" }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[inpaint/flux-kontext-pro] create:", JSON.stringify(data));
  if (data?.code !== 200) throw new Error(`Kie.ai flux-kontext-pro: ${data?.msg ?? JSON.stringify(data)}`);
  return pollKieFlux(data.data.taskId);
}

async function runOpenAI4o(image: string, mask: string, prompt: string): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  const maskUrl = await uploadImageToTemp(mask);
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image/1.5-image-to-image",
      input: { input_urls: [imageUrl], mask_url: maskUrl, prompt, aspect_ratio: "1:1", quality: "medium" },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[inpaint/openai-4o] create:", JSON.stringify(data));
  if (data?.code !== 200) throw new Error(`Kie.ai GPT-Image: ${data?.msg ?? JSON.stringify(data)}`);
  return pollKieMarket(data.data.taskId);
}

async function runGrok(image: string, prompt: string): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "grok-imagine/image-to-image",
      input: { prompt, image_urls: [imageUrl] },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[inpaint/grok] create:", JSON.stringify(data));
  if (data?.code !== 200) throw new Error(`Kie.ai Grok: ${data?.msg ?? JSON.stringify(data)}`);
  return pollKieMarket(data.data.taskId);
}

// Recraft doesn't have image-to-image, only upscale. Remove or use different model
async function runRecraft(image: string, prompt: string): Promise<string> {
  throw new Error("Recraft does not support image editing/inpainting. Only upscaling is available.");
}

// Ideogram v3 doesn't have editing, only text-to-image. Remove or use different model
async function runIdeogram(image: string, prompt: string): Promise<string> {
  throw new Error("Ideogram v3 does not support image editing/inpainting. Only text-to-image is available.");
}

// ── Main route ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mask, prompt, model = "nano-banana" } = body;

    if (!image || !mask || !prompt) {
      return NextResponse.json({ error: "Missing image, mask, or prompt" }, { status: 400 });
    }
    if (!KIE_API_KEY) {
      return NextResponse.json({ error: "KIE_AI_API_KEY not set" }, { status: 500 });
    }

    console.log(`[inpaint] model=${model} prompt="${prompt.substring(0, 60)}"`);

    let resultUrl: string;
    switch (model) {
      case "nano-banana":      resultUrl = await runNanoBanana(image, prompt);     break;
      case "flux-kontext-pro": resultUrl = await runFluxKontextPro(image, prompt); break;
      case "openai-4o":        resultUrl = await runOpenAI4o(image, mask, prompt);       break;
      case "grok":             resultUrl = await runGrok(image, prompt);            break;
      default: return NextResponse.json({ error: `Unknown model: ${model}` }, { status: 400 });
    }

    console.log(`[inpaint] ✅ ${model} done:`, resultUrl.substring(0, 80));
    return NextResponse.json({ image: resultUrl });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[inpaint] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
