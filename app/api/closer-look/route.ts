import { NextRequest, NextResponse } from "next/server";

// All models go through Kie.ai
const KIE_API_KEY      = process.env.KIE_AI_API_KEY;
const KIE_CREATE_URL   = "https://api.kie.ai/api/v1/jobs/createTask";
const KIE_POLL_URL     = "https://api.kie.ai/api/v1/jobs/recordInfo";
// (Flux endpoints removed — all models now use Market API)

// Helper: sleep
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// Helper: enhance prompt with rectangle coordinates for AI cropping
function enhancePromptWithRectangle(prompt: string, rectangle: { x: number; y: number; width: number; height: number }): string {
  const rectangleInfo = `Focus on the area at coordinates (${Math.round(rectangle.x)}, ${Math.round(rectangle.y)}) with size ${Math.round(rectangle.width)}×${Math.round(rectangle.height)}. `;
  return `${rectangleInfo}${prompt}`;
}

// Helper: upload base64 to freeimage.host
async function uploadImageToTemp(base64Data: string): Promise<string> {
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const res = await fetch("https://freeimage.host/api/1/upload", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      key: "6d207e02198a847aa98d0a2a901485a5",
      action: "upload",
      source: base64,
      format: "json",
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  if (!data?.success || !data?.image?.url) {
    throw new Error(`Failed to upload image: ${JSON.stringify(data)}`);
  }
  return data.image.url;
}

// Poll Market API (/jobs/recordInfo) — used by most models
async function pollKieMarket(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    const pollRes = await fetch(`${KIE_POLL_URL}?taskId=${taskId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
      signal: AbortSignal.timeout(30000),
    });
    const pd = await pollRes.json();
    const state = pd?.data?.state;
    const flag = pd?.data?.flag;
    console.log(`[closer-look] poll ${i + 1}: flag=${flag} state=${state}`);
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
      console.error("[closer-look] Kie.ai task failed. Full response:", JSON.stringify(pd?.data, null, 2));
      throw new Error(`Kie.ai task failed: ${reason}`);
    }
  }
  throw new Error("Kie.ai timed out after 300s");
}

// ── Model handlers (all via Kie.ai) ──────────────────────────────────────────

// google/nano-banana via Market API (/jobs/createTask)
async function runNanoBanana(image: string, prompt: string, aspectRatio: string | null): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  const input: any = { prompt, image_urls: [imageUrl], output_format: "png" };
  
  // Add aspect ratio if provided
  if (aspectRatio) {
    input.image_size = aspectRatio;
  }
  
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/nano-banana-edit",
      input: input,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[closer-look/nano-banana] create:", JSON.stringify(data));
  if (data?.code !== 200) throw new Error(`Kie.ai nano-banana: ${data?.msg ?? JSON.stringify(data)}`);
  return pollKieMarket(data.data.taskId);
}

async function runOpenAI4o(image: string, prompt: string, aspectRatio: string | null): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  const input: Record<string, any> = { input_urls: [imageUrl], prompt, quality: "medium" };
  
  // Add aspect ratio if provided
  if (aspectRatio) {
    input.aspect_ratio = aspectRatio;
  }
  
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image/1.5-image-to-image",
      input: input,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[closer-look/openai-4o] create:", JSON.stringify(data));
  if (data?.code !== 200) throw new Error(`Kie.ai GPT-Image: ${data?.msg ?? JSON.stringify(data)}`);
  return pollKieMarket(data.data.taskId);
}

async function runGrok(image: string, prompt: string, aspectRatio: string | null): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  const input: Record<string, any> = { prompt, image_urls: [imageUrl] };
  
  // Add aspect ratio if supported (grok may not support explicit aspect ratio)
  if (aspectRatio) {
    console.log(`[closer-look/grok] Requested aspect ratio: ${aspectRatio}`);
  }
  
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "grok-imagine/image-to-image",
      input: input,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[closer-look/grok] create:", JSON.stringify(data));
  if (data?.code !== 200) throw new Error(`Kie.ai Grok: ${data?.msg ?? JSON.stringify(data)}`);
  return pollKieMarket(data.data.taskId);
}

// ── Main route ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, prompt, model = "nano-banana", aspectRatioString } = body;

    if (!image || !prompt) {
      return NextResponse.json({ error: "Missing image or prompt" }, { status: 400 });
    }

    // Use the page aspect ratio passed directly from the frontend (e.g. "16:9", "9:16", "1:1")
    const aspectRatio: string | null = aspectRatioString ?? null;
    console.log(`[closer-look] Using aspect ratio: ${aspectRatio}`);

    if (!KIE_API_KEY) {
      return NextResponse.json({ error: "KIE_AI_API_KEY not set" }, { status: 500 });
    }

    console.log(`[closer-look] model=${model} prompt="${prompt.substring(0, 60)}"`);

    let resultUrl: string;
    switch (model) {
      case "nano-banana":      resultUrl = await runNanoBanana(image, prompt, aspectRatio);     break;
      case "openai-4o":        resultUrl = await runOpenAI4o(image, prompt, aspectRatio);       break;
      case "grok":             resultUrl = await runGrok(image, prompt, aspectRatio);            break;
      default: return NextResponse.json({ error: `Unknown model: ${model}` }, { status: 400 });
    }

    console.log(`[closer-look] ✅ ${model} done:`, resultUrl.substring(0, 80));
    return NextResponse.json({ image: resultUrl });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[closer-look] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
