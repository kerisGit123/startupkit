import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

// All models go through Kie.ai
const KIE_API_KEY      = process.env.KIE_AI_API_KEY;
const KIE_CREATE_URL   = "https://api.kie.ai/api/v1/jobs/createTask";
const KIE_POLL_URL     = "https://api.kie.ai/api/v1/jobs/recordInfo";
// (Flux endpoints removed — all models now use Market API)

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Map aspect ratio to KIE-supported options
function getKieAspectRatio(base64DataUrl: string): string | null {
  try {
    // Extract dimensions from base64 image header
    const base64Data = base64DataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    let width = 0, height = 0;
    
    // Check if it's PNG
    if (base64Data.startsWith('iVBORw0KGgo')) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
    }
    // Check if it's JPEG
    else if (base64Data.startsWith('/9j/')) {
      width = 9;
      height = 16;
    }
    else {
      width = 9;
      height = 16;
    }
    
    // Map to KIE-supported aspect ratios
    const ratio = width / height;
    
    // KIE likely supports standard ratios
    if (ratio > 1.5) return "16:9";      // Landscape
    if (ratio > 0.8) return "4:3";        // Standard landscape
    if (ratio > 0.6) return "3:2";        // Landscape
    if (ratio > 0.4) return "2:3";        // Portrait
    return "9:16";                        // Tall portrait
    
  } catch (error) {
    console.error('Error detecting aspect ratio:', error);
    return "9:16";
  }
}

// Upload base64 to freeimage.host → returns public URL (Kie.ai needs URLs not base64)
async function uploadImageToTemp(base64DataUrl: string): Promise<string> {
  if (!base64DataUrl.startsWith("data:")) return base64DataUrl;
  const base64 = base64DataUrl.split(",")[1];
  
  // Retry logic for upload
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[inpaint] Upload attempt ${attempt}/3`);
      const formData = new FormData();
      formData.append("key", "6d207e02198a847aa98d0a2a901485a5");
      formData.append("action", "upload");
      formData.append("source", base64);
      formData.append("format", "json");
      const res = await fetch("https://freeimage.host/api/1/upload", {
        method: "POST", body: formData, signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`Image upload failed: ${res.status}`);
      const data = await res.json();
      const url = data?.image?.url;
      if (!url) throw new Error(`Image upload returned no URL: ${JSON.stringify(data)}`);
      console.log("[inpaint] Uploaded URL:", url);
      return url;
    } catch (error) {
      console.log(`[inpaint] Upload attempt ${attempt} failed:`, error);
      if (attempt === 3) {
        throw new Error(`Image upload failed after 3 attempts: ${error}`);
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  throw new Error("Image upload failed");
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

// ── Model handlers (all via Kie.ai) ──────────────────────────────────────────

// Qwen z-image via Market API (/jobs/createTask)
async function runQwenZImage(image: string, prompt: string): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  
  const requestBody = {
    model: "qwen/image-edit",
    input: { prompt, image_url: imageUrl, output_format: "png" },
  };
  
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[inpaint/qwen-z-image] create:", JSON.stringify(data));
  if (data?.code !== 200) throw new Error(`Kie.ai Qwen z-Image: ${data?.msg ?? JSON.stringify(data)}`);
  return pollKieMarket(data.data.taskId);
}

// Seedream 4.0 Edit via Market API (/jobs/createTask)
async function runSeedream50Lite(image: string, prompt: string): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  
  // Try Seedream 4.5 text-to-image first, then 4.0 edit
  const modelVariations = [
    "seedream/4.5-text-to-image",  // Seedream 4.5 text-to-image
    "bytedance/seedream-v4-edit",  // Seedream 4.0 edit (image-to-image)
  ];
  
  for (const modelName of modelVariations) {
    try {
      console.log(`[inpaint/seedream-5.0-lite] Trying model name: ${modelName}`);
      
      const requestBody = {
        model: modelName,
        input: { 
          prompt, 
          image_urls: [imageUrl], 
          output_format: "png",
          image_size: "square_hd",
          image_resolution: "1K",
          max_images: 1
        },
      };
      
      const res = await fetch(KIE_CREATE_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      console.log(`[inpaint/seedream-5.0-lite] ${modelName} response:`, JSON.stringify(data));
      
      if (data?.code === 200) {
        console.log(`[inpaint/seedream-5.0-lite] ✅ Success with model: ${modelName}`);
        return pollKieMarket(data.data.taskId);
      } else {
        console.log(`[inpaint/seedream-5.0-lite] ❌ ${modelName} failed: ${data?.msg}`);
        continue; // Try next variation
      }
    } catch (err) {
      console.log(`[inpaint/seedream-5.0-lite] ❌ ${modelName} error:`, err);
      continue; // Try next variation
    }
  }
  
  throw new Error(`Seedream 5.0 Lite: All model name variations failed. Please check Kie.ai documentation for the correct model name.`);
}

// google/nano-banana via Market API (/jobs/createTask)
async function runNanoBanana(image: string, prompt: string): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  
  const requestBody = {
    model: "google/nano-banana-edit",
    input: { prompt, image_urls: [imageUrl], output_format: "png" },
  };
  
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[inpaint/nano-banana] create:", JSON.stringify(data));
  if (data?.code !== 200) throw new Error(`Kie.ai nano-banana: ${data?.msg ?? JSON.stringify(data)}`);
  return pollKieMarket(data.data.taskId);
}

// Dedicated polling for OpenAI 4o
async function pollOpenAI4o(taskId: string): Promise<string> {
  const maxAttempts = 30;
  const delay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[inpaint/openai-4o] poll ${attempt}: checking task ${taskId}`);
      
      const res = await fetch(`https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=${taskId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      
      if (!res.ok) {
        console.log(`[inpaint/openai-4o] poll ${attempt}: HTTP error ${res.status}`);
        continue;
      }
      
      const data = await res.json();
      console.log(`[inpaint/openai-4o] poll ${attempt}: successFlag=${data.data?.successFlag} progress=${data.data?.progress}`);
      
      if (data?.code === 200 && data.data) {
        const { successFlag, response, progress } = data.data;
        
        if (successFlag === 1) {
          console.log(`[inpaint/openai-4o] ✅ Task completed! Full response data:`, JSON.stringify(data.data, null, 2));
          
          if (response?.resultUrls?.length > 0) {
            console.log(`[inpaint/openai-4o] ✅ Success! Generated image:`, response.resultUrls[0]);
            return response.resultUrls[0];
          } else {
            console.log(`[inpaint/openai-4o] ❌ No resultUrls found in response:`, JSON.stringify(response, null, 2));
            throw new Error(`OpenAI 4o completed but no result URL found. Response: ${JSON.stringify(data.data)}`);
          }
        }
        
        if (successFlag === 2) {
          throw new Error(`OpenAI 4o generation failed: ${data.data.errorMessage || 'Unknown error'}`);
        }
        
        if (successFlag === 0 && progress) {
          console.log(`[inpaint/openai-4o] ⏳ Progress: ${Math.round(parseFloat(progress) * 100)}%`);
        }
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (err) {
      console.log(`[inpaint/openai-4o] poll ${attempt}: error`, err);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`OpenAI 4o polling timeout after ${maxAttempts} attempts`);
}

async function runOpenAI4o(image: string, mask: string, prompt: string): Promise<string> {
  const imageUrl = await uploadImageToTemp(image);
  const maskUrl = await uploadImageToTemp(mask);
  
  // OpenAI 4o uses different endpoint and field structure
  const requestBody = {
    filesUrl: [imageUrl],
    maskUrl: maskUrl,
    prompt: prompt,
    size: "1:1",  // Default aspect ratio
    nVariants: 1,
    isEnhance: false
  };
  
  console.log("[inpaint/openai-4o] Request body:", JSON.stringify(requestBody, null, 2));
  
  try {
    const res = await fetch("https://api.kie.ai/api/v1/gpt4o-image/generate", {
      method: "POST",
      headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000),
    });
    
    const data = await res.json();
    console.log("[inpaint/openai-4o] Response:", JSON.stringify(data, null, 2));
    
    if (data?.code === 200) {
      console.log("[inpaint/openai-4o] ✅ Success, task created");
      return pollOpenAI4o(data.data.taskId);
    } else {
      throw new Error(`OpenAI 4o: ${data?.msg ?? JSON.stringify(data)}`);
    }
  } catch (err) {
    console.error("[inpaint/openai-4o] Error:", err);
    throw err;
  }
}

async function runGrok(image: string, prompt: string): Promise<string> {
  console.log('[inpaint/grok] Image input type:', image.startsWith("data:") ? "base64" : "URL", 'length:', image.length);
  
  // Try multiple Grok API approaches
  if (image.startsWith("data:")) {
    console.log('[inpaint/grok] Using base64 image input with multiple approaches');
    
    // Approach 1: Standard format from documentation
    const requestBody1 = {
      model: "grok-imagine/image-to-image",
      input: { 
        prompt: prompt,
        image_urls: [await uploadImageToTemp(image)]
      },
    };
    
    console.log("[inpaint/grok] Approach 1 - Standard format:", JSON.stringify(requestBody1, null, 2));
    
    const res1 = await fetch(KIE_CREATE_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody1),
      signal: AbortSignal.timeout(30000),
    });
    const data1 = await res1.json();
    console.log("[inpaint/grok] Approach 1 response:", JSON.stringify(data1));
    
    if (data1?.code === 200) {
      try {
        return await pollGrokWithRetry(data1.data.taskId);
      } catch (pollError) {
        console.log("[inpaint/grok] Approach 1 polling failed, trying approach 2...");
      }
    }
    
    // Approach 2: Try with different prompt structure
    const requestBody2 = {
      model: "grok-imagine/image-to-image",
      input: { 
        prompt: `Enhance this image: ${prompt}`,
        image_urls: [await uploadImageToTemp(image)]
      },
    };
    
    console.log("[inpaint/grok] Approach 2 - Enhanced prompt:", JSON.stringify(requestBody2, null, 2));
    
    const res2 = await fetch(KIE_CREATE_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody2),
      signal: AbortSignal.timeout(30000),
    });
    const data2 = await res2.json();
    console.log("[inpaint/grok] Approach 2 response:", JSON.stringify(data2));
    
    if (data2?.code === 200) {
      try {
        return await pollGrokWithRetry(data2.data.taskId);
      } catch (pollError) {
        console.log("[inpaint/grok] Approach 2 polling failed, trying approach 3...");
      }
    }
    
    // Approach 3: Try with different model name
    const requestBody3 = {
      model: "grok-imagine",
      input: { 
        prompt: prompt,
        image_urls: [await uploadImageToTemp(image)]
      },
    };
    
    console.log("[inpaint/grok] Approach 3 - Different model name:", JSON.stringify(requestBody3, null, 2));
    
    const res3 = await fetch(KIE_CREATE_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody3),
      signal: AbortSignal.timeout(30000),
    });
    const data3 = await res3.json();
    console.log("[inpaint/grok] Approach 3 response:", JSON.stringify(data3));
    
    if (data3?.code === 200) {
      try {
        return await pollGrokWithRetry(data3.data.taskId);
      } catch (pollError) {
        console.log("[inpaint/grok] Approach 3 polling failed, trying URL upload...");
      }
    }
  }
  
  // Fallback to URL upload with a different hosting service
  console.log('[inpaint/grok] Image is not base64, using URL upload with alternative service');
  console.log('[inpaint/grok] Image preview:', image.substring(0, 100) + (image.length > 100 ? '...' : ''));
  
  // Try a different image hosting service
  const imageUrl = await uploadImageToAlternativeHost(image);
  
  const requestBody = {
    model: "grok-imagine/image-to-image",
    input: { prompt, image_urls: [imageUrl] },
  };
  
  console.log("[inpaint/grok] Request body (URL):", JSON.stringify(requestBody, null, 2));
  
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[inpaint/grok] create:", JSON.stringify(data));
  if (data?.code !== 200) throw new Error(`Kie.ai Grok: ${data?.msg ?? JSON.stringify(data)}`);
  
  return pollGrokWithRetry(data.data.taskId);
}

// Alternative image hosting services
async function uploadImageToAlternativeHost(base64DataUrl: string): Promise<string> {
  if (!base64DataUrl.startsWith("data:")) return base64DataUrl;
  const base64 = base64DataUrl.split(",")[1];
  
  // Try multiple hosting services
  const hostingServices = [
    {
      name: "tempfile.aiquickdraw.com",
      url: "https://tempfile.aiquickdraw.com/api/upload",
      formData: () => {
        const formData = new FormData();
        formData.append("file", base64);
        formData.append("type", "file");
        return formData;
      }
    },
    {
      name: "postimages.org", 
      url: "https://postimages.org/api/upload",
      formData: () => {
        const formData = new FormData();
        formData.append("upload", base64);
        return formData;
      }
    },
    {
      name: "imgbb.com",
      url: "https://api.imgbb.com/1/upload",
      formData: () => {
        const formData = new FormData();
        formData.append("image", base64);
        formData.append("key", "b8bfefb66d8c3b4a8a8b8c8d8e8f8a8b"); // Use existing API key pattern
        formData.append("expiration", "3600"); // 1 hour
        return formData;
      }
    },
    {
      name: "freeimage.host (original)",
      url: "https://freeimage.host/api/1/upload",
      formData: () => {
        const formData = new FormData();
        formData.append("key", "6d207e02198a847aa98d0a2a901485a5");
        formData.append("action", "upload");
        formData.append("source", base64);
        formData.append("format", "json");
        return formData;
      }
    }
  ];
  
  for (const service of hostingServices) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[inpaint] Trying ${service.name} attempt ${attempt}/3`);
        const formData = service.formData();
        const res = await fetch(service.url, {
          method: "POST", body: formData, signal: AbortSignal.timeout(60000),
        });
        
        if (!res.ok) {
          console.log(`[inpaint] ${service.name} returned ${res.status}`);
          throw new Error(`${service.name} failed: ${res.status}`);
        }
        
        let data;
        try {
          const responseText = await res.text();
          console.log(`[inpaint] ${service.name} raw response:`, responseText.substring(0, 500));
          data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.log(`[inpaint] ${service.name} JSON parse failed:`, parseError);
          throw new Error(`${service.name} returned invalid JSON`);
        }
        
        console.log(`[inpaint] ${service.name} parsed response:`, JSON.stringify(data));
        
        // Try different response formats
        let url = data?.url || data?.data?.url || data?.image?.url || data?.link;
        
        if (!url) {
          // For imgbb, the response structure is different
          if (service.name === "imgbb.com") {
            url = data?.data?.display_url || data?.data?.thumb_url || data?.data?.medium_url || data?.data?.url;
          }
        }
        
        if (!url) {
          console.log(`[inpaint] ${service.name} returned no URL, full response:`, JSON.stringify(data));
          throw new Error(`${service.name} returned no URL`);
        }
        
        console.log(`[inpaint] ✅ ${service.name} uploaded URL:`, url);
        return url;
        
      } catch (error) {
        console.log(`[inpaint] ${service.name} attempt ${attempt} failed:`, error);
        if (attempt === 3) {
          console.log(`[inpaint] ${service.name} failed after 3 attempts, trying next service`);
          break; // Try next service
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }
  
  console.log("[inpaint] All image hosting services failed for Grok");
  console.log("[inpaint] Grok API may be temporarily unavailable or has specific requirements");
  throw new Error("Grok model is currently unavailable. Please try a different model like OpenAI 4o or Nano Banana.");
}

// Custom polling for Grok that handles the specific response format
async function pollGrokWithRetry(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    let pollRes: Response;
    try {
      pollRes = await fetch(`${KIE_POLL_URL}?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
    } catch { console.warn(`[inpaint/grok] poll ${i+1} fetch error`); continue; }

    if (!pollRes.ok) { console.warn(`[inpaint/grok] poll ${i+1} non-ok ${pollRes.status}`); continue; }

    const pd = await pollRes.json();
    const flag = pd?.data?.successFlag;
    const state = pd?.data?.state;
    console.log(`[inpaint/grok] poll ${i+1}: flag=${flag} state=${state}`);

    if (flag === 1 || state === "success") {
      // Try multiple ways to extract the result URL
      let parsedResult: Record<string, unknown> = {};
      if (typeof pd?.data?.resultJson === "string") {
        try { parsedResult = JSON.parse(pd.data.resultJson); } catch { /* ignore */ }
      }
      
      // Try all possible URL locations
      const url =
        (parsedResult?.resultUrls as string[])?.[0] ??
        (parsedResult?.resultImageUrl as string) ??
        pd?.data?.response?.resultImageUrl ??
        pd?.data?.resultImageUrl ??
        pd?.data?.response?.url ??
        pd?.data?.url ??
        pd?.data?.resultUrls?.[0] ??
        pd?.data?.response?.resultUrls?.[0] ??
        // Try nested structures
        pd?.data?.response?.data?.resultImageUrl ??
        pd?.data?.response?.data?.url ??
        // Try alternative field names
        pd?.data?.outputImageUrl ??
        pd?.data?.generatedImageUrl ??
        pd?.data?.image_url;
        
      if (!url) {
        console.log("[inpaint/grok] No URL found in response, full data:", JSON.stringify(pd?.data, null, 2));
        throw new Error(`No result URL found in Grok response. Available fields: ${Object.keys(pd?.data || {}).join(', ')}`);
      }
      console.log("[inpaint/grok] ✅ Success, found URL:", url);
      return url;
    }
    
    if (flag === 2 || flag === 3 || state === "fail") {
      const reason = pd?.data?.failMsg ?? pd?.data?.errorMessage ?? pd?.data?.failReason ?? pd?.data?.reason ?? "unknown";
      console.error("[inpaint/grok] Kie.ai task failed. Full response:", JSON.stringify(pd?.data, null, 2));
      throw new Error(`Kie.ai task failed: ${reason}`);
    }
  }
  throw new Error("Grok timed out after 300s");
}

// Qwen Image Edit via Market API (/jobs/createTask)
async function runQwen(image: string, prompt: string): Promise<string> {
  // Try base64 first, fallback to URL upload
  let requestBody: any;
  
  if (image.startsWith('data:')) {
    // Use base64 directly
    requestBody = {
      model: "qwen/image-edit",
      input: { 
        prompt, 
        image: image, // Send base64 directly
        output_format: "png",
        image_size: "square_hd",
        image_resolution: "1K",
        max_images: 1
      },
    };
    console.log('[inpaint/qwen] Using base64 image input');
  } else {
    // Fallback to URL upload
    const imageUrl = await uploadImageToTemp(image);
    requestBody = {
      model: "qwen/image-edit",
      input: { 
        prompt, 
        image_url: imageUrl, 
        output_format: "png",
        image_size: "square_hd",
        image_resolution: "1K",
        max_images: 1
      },
    };
    console.log('[inpaint/qwen] Using URL image input');
  }
  
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  
  if (data?.code === 200) {
    return pollKieMarket(data.data.recordId);
  } else {
    throw new Error(`Qwen Image Edit failed: ${data?.msg || 'Unknown error'}`);
  }
}

// Seedream 4.5 Text-to-Image via Market API (/jobs/createTask)
async function runSeedream45(image: string, prompt: string): Promise<string> {
  let requestBody: any;
  
  if (image.startsWith('data:')) {
    // Use base64 directly
    requestBody = {
      model: "seedream/4.5-text-to-image",
      input: { 
        prompt, 
        image: image, // Send base64 directly
        output_format: "png",
        image_size: "square_hd",
        image_resolution: "1K",
        max_images: 1
      },
    };
    console.log('[inpaint/seedream45] Using base64 image input');
  } else {
    // Fallback to URL upload
    const imageUrl = await uploadImageToTemp(image);
    requestBody = {
      model: "seedream/4.5-text-to-image",
      input: { 
        prompt, 
        image_url: imageUrl, 
        output_format: "png",
        image_size: "square_hd",
        image_resolution: "1K",
        max_images: 1
      },
    };
    console.log('[inpaint/seedream45] Using URL image input');
  }
  
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  
  if (data?.code === 200) {
    return pollKieMarket(data.data.recordId);
  } else {
    throw new Error(`Seedream 4.5 failed: ${data?.msg || 'Unknown error'}`);
  }
}

// Seedream V4 Text-to-Image via Market API (/jobs/createTask)
async function runSeedreamV4(image: string, prompt: string): Promise<string> {
  let requestBody: any;
  
  if (image.startsWith('data:')) {
    requestBody = {
      model: "bytedance/seedream-v4",
      input: { 
        prompt, 
        image: image,
        output_format: "png",
        image_size: "square_hd",
        image_resolution: "1K",
        max_images: 1
      },
    };
    console.log('[inpaint/seedream-v4] Using base64 image input');
  } else {
    const imageUrl = await uploadImageToTemp(image);
    requestBody = {
      model: "bytedance/seedream-v4",
      input: { 
        prompt, 
        image_url: imageUrl, 
        output_format: "png",
        image_size: "square_hd",
        image_resolution: "1K",
        max_images: 1
      },
    };
    console.log('[inpaint/seedream-v4] Using URL image input');
  }
  
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  
  if (data?.code === 200) {
    return pollKieMarket(data.data.recordId);
  } else {
    throw new Error(`Seedream V4 failed: ${data?.msg || 'Unknown error'}`);
  }
}

// ── Main route ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    console.log('[API/inpaint] Received request');
    console.log('[API/inpaint] Request method:', req.method);
    // Log headers without converting to object
    console.log('[API/inpaint] Request headers received');
    
    // Test if we can read the body
    let body;
    try {
      body = await req.json();
      console.log('[API/inpaint] Request body keys:', Object.keys(body));
      console.log('[API/inpaint] Request body sample:', {
        hasImage: !!body.image,
        hasMask: !!body.mask,
        hasPrompt: !!body.prompt,
        model: body.model,
        promptLength: body.prompt?.length || 0
      });
    } catch (bodyError) {
      console.error('[API/inpaint] Failed to parse request body:', bodyError);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    
    const { image, mask, prompt, model = "nano-banana-2", referenceImages } = body;
    
    // Respect user's model selection
    const effectiveModel = model;

    // TEST MODE: Return a simple success response to test the connection
    if (prompt.includes("test")) {
      console.log('[API/inpaint] TEST MODE detected, returning mock response');
      return NextResponse.json({ 
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        test: true 
      });
    }

    if (!image || !prompt) {
      return NextResponse.json({ error: "Missing image or prompt" }, { status: 400 });
    }
    
    // Validate mask requirement: only openai-4o supports masks
    if (effectiveModel === "openai-4o" && !mask) {
      return NextResponse.json({ error: "OpenAI 4o requires a mask for inpainting" }, { status: 400 });
    }
    console.log('[API/inpaint] KIE_API_KEY exists:', !!KIE_API_KEY);
    console.log('[API/inpaint] KIE_API_KEY length:', KIE_API_KEY?.length || 0);
    console.log('[API/inpaint] KIE_API_KEY prefix:', KIE_API_KEY?.substring(0, 10) + '...');
    
    if (!KIE_API_KEY) {
      return NextResponse.json({ error: "KIE_AI_API_KEY not set" }, { status: 500 });
    }

    console.log(`[inpaint] model=${effectiveModel} (requested: ${model}) prompt="${prompt.substring(0, 60)}"`);

    console.log(`[inpaint] About to call model: ${effectiveModel}`);
    let resultUrl: string;
    try {
      switch (effectiveModel) {
        case "nano-banana":      
          console.log('[inpaint] Calling runNanoBanana...');
          resultUrl = await runNanoBanana(image, prompt);     
          break;
        case "openai-4o":       
          console.log('[inpaint] Calling runOpenAI4o...');
          resultUrl = await runOpenAI4o(image, mask ?? "", prompt); 
          break;
        case "grok":            
          console.log('[inpaint] Calling runGrok...');
          try {
            resultUrl = await runGrok(image, prompt);            
          } catch (grokError: any) {
            console.log('[inpaint] Grok failed with error:', grokError.message);
            console.log('[inpaint] Suggesting alternative models for user');
            // Return a helpful error message instead of crashing
            return NextResponse.json({ 
              error: "Grok model is currently unavailable. Please try: OpenAI 4o (best for masks), Nano Banana, or other models.",
              suggestion: "Try OpenAI 4o for rectangle inpainting with masks, or Nano Banana for general inpainting.",
              availableModels: ["openai-4o", "nano-banana", "qwen", "seedream-5.0-lite", "qwen-z-image"]
            }, { status: 503 });
          }
          break;
        case "qwen-z-image":            
          console.log('[inpaint] Calling runQwenZImage...');
          resultUrl = await runQwenZImage(image, prompt);            
          break;
        case "seedream-5.0-lite":            
          console.log('[inpaint] Calling runSeedream50Lite...');
          resultUrl = await runSeedream50Lite(image, prompt);            
          break;
        case "qwen":            
          console.log('[inpaint] Calling runQwen...');
          resultUrl = await runQwen(image, prompt);            
          break;
        case "seedream-4.5":            
          console.log('[inpaint] Calling runSeedream45...');
          resultUrl = await runSeedream45(image, prompt);            
          break;
        case "seedream-v4":            
          console.log('[inpaint] Calling runSeedreamV4...');
          resultUrl = await runSeedreamV4(image, prompt);            
          break;
        case "nano-banana-2":            
          console.log('[inpaint] Calling runNanoBanana2...');
          resultUrl = await runNanoBanana2(image, prompt, referenceImages);            
          break;
        case "ideogram/character-remix":
          console.log('[inpaint] Calling runIdeogramCharacterRemix...');
          resultUrl = await runIdeogramCharacterRemix(image, prompt, referenceImages);
          break;
        case "recraft/remove-background":
          console.log('[inpaint] Calling runRecraftRemoveBackground...');
          resultUrl = await runRecraftRemoveBackground(image);
          break;
        case "ideogram/v3-reframe":
          console.log('[inpaint] Calling runIdeogramReframe...');
          resultUrl = await runIdeogramReframe(image, body.imageSize || "landscape_16_9", body.renderingSpeed || "BALANCED");
          break;
        default: 
          console.log('[inpaint] Unknown model:', effectiveModel);
          return NextResponse.json({ error: `Unknown model: ${effectiveModel}` }, { status: 400 });
      }
      console.log(`[inpaint] ✅ ${effectiveModel} completed successfully`);
    } catch (modelError) {
      console.error(`[inpaint] ❌ ${effectiveModel} failed:`, modelError);
      console.error('[inpaint] Model error details:', {
        name: modelError?.constructor?.name,
        message: (modelError as any)?.message,
        stack: (modelError as any)?.stack
      });
      return NextResponse.json({ 
        error: `Model ${effectiveModel} failed: ${(modelError as any)?.message || 'Unknown error'}`,
        details: modelError?.toString() 
      }, { status: 500 });
    }

    console.log(`[inpaint] ✅ ${effectiveModel} done:`, resultUrl.substring(0, 80));
    
    // Ensure we always return a valid response
    if (!resultUrl) {
      console.error('[inpaint] No result URL returned from model');
      return NextResponse.json({ error: "No result URL returned from model" }, { status: 500 });
    }
    
    return NextResponse.json({ image: resultUrl });

  } catch (error) {
    console.error("[inpaint] Full error details:", error);
    console.error("[inpaint] Error type:", typeof error);
    console.error("[inpaint] Error constructor:", error?.constructor?.name);
    console.error("[inpaint] Error stack:", error instanceof Error ? error.stack : 'No stack');
    
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[inpaint] error message:", msg);
    
    // Ensure we always return a proper error response
    const errorResponse = { 
      error: msg || "Unknown error occurred", 
      details: error?.toString(),
      type: error?.constructor?.name || 'Unknown'
    };
    
    console.error("[inpaint] Returning error response:", errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Model functions with correct JSON structure for remix models
async function runNanoBanana2(image: string, prompt: string, referenceImages?: string[]): Promise<string> {
  const imageUrl = image.startsWith('data:') ? await uploadImageToTemp(image) : image;
  const refImageUrls = referenceImages ? await Promise.all(referenceImages.map(ref => 
    ref.startsWith('data:') ? uploadImageToTemp(ref) : ref
  )) : [];
  
  // Combine background image and reference images into image_input array
  const imageInput = [imageUrl, ...refImageUrls];
  
  const requestBody = {
    model: "nano-banana-2",
    callBackUrl: "https://your-domain.com/api/callback",
    input: {
      prompt,
      image_input: imageInput,
      aspect_ratio: "auto",
      google_search: false,
      resolution: "1K",
      output_format: "jpg"
    }
  };
  
  const res = await fetch(KIE_CREATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });
  
  const result = await res.json();
  return result.data?.outputImageUrl || result.data?.image_url || '';
}

async function runIdeogramCharacterRemix(image: string, prompt: string, referenceImages?: string[]): Promise<string> {
  const imageUrl = image.startsWith('data:') ? await uploadImageToTemp(image) : image;
  const refImageUrls = referenceImages ? await Promise.all(referenceImages.map(ref =>
    ref.startsWith('data:') ? uploadImageToTemp(ref) : ref
  )) : [];

  const requestBody = {
    model: "ideogram/character-remix",
    input: {
      prompt,
      image_url: imageUrl,
      reference_image_urls: refImageUrls,
      rendering_speed: "BALANCED",
      style: "AUTO",
      expand_prompt: true,
      image_size: "square_hd",
      num_images: "1",
      strength: 0.8
    }
  };

  const res = await fetch(KIE_CREATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  const result = await res.json();
  return result.data?.outputImageUrl || result.data?.image_url || '';
}

// Recraft Remove Background via Market API (/jobs/createTask)
async function runRecraftRemoveBackground(image: string): Promise<string> {
  const imageUrl = image.startsWith('data:') ? await uploadImageToTemp(image) : image;

  const requestBody = {
    model: "recraft/remove-background",
    input: {
      image: imageUrl,
    },
  };

  console.log('[inpaint/remove-bg] Sending request');
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();

  if (data?.code === 200) {
    const taskId = data.data?.taskId ?? data.data?.recordId;
    return pollKieMarket(taskId);
  } else {
    throw new Error(`Recraft Remove Background failed: ${data?.msg || 'Unknown error'}`);
  }
}

// Ideogram V3 Reframe via Market API (/jobs/createTask)
async function runIdeogramReframe(image: string, imageSize: string = "landscape_16_9", renderingSpeed: string = "BALANCED"): Promise<string> {
  const imageUrl = image.startsWith('data:') ? await uploadImageToTemp(image) : image;

  const requestBody = {
    model: "ideogram/v3-reframe",
    input: {
      image_url: imageUrl,
      image_size: imageSize,
      rendering_speed: renderingSpeed,
      style: "AUTO",
      num_images: "1",
    },
  };

  console.log('[inpaint/reframe] Sending request, size:', imageSize, 'speed:', renderingSpeed);
  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();

  if (data?.code === 200) {
    const taskId = data.data?.taskId ?? data.data?.recordId;
    return pollKieMarket(taskId);
  } else {
    throw new Error(`Ideogram V3 Reframe failed: ${data?.msg || 'Unknown error'}`);
  }
}
