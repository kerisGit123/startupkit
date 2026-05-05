import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { uploadToR2, getR2PublicUrl } from "@/lib/r2";
import sharp from "sharp";
import { extractKieResponse, getResponseCodeInfo } from "@/lib/storyboard/kieResponse";

// Extract music tracks from Suno/Kie callback in various formats
function extractMusicTracks(data: any): Array<{ audioId: string; audioUrl: string; title?: string; duration?: number }> {
  // Format 1: {code: 200, data: {callbackType: "complete", data: [{id, audio_url}]}}
  if (data?.data?.callbackType === 'complete' && Array.isArray(data?.data?.data)) {
    return data.data.data
      .filter((t: any) => t.id && (t.audio_url || t.audioUrl))
      .map((t: any) => ({
        audioId: t.id,
        audioUrl: t.audio_url || t.audioUrl,
        title: t.title,
        duration: t.duration,
      }));
  }
  // Format 2: {data: {response: {sunoData: [{id, audioUrl}]}}} — record-info / retry callback format
  if (Array.isArray(data?.data?.response?.sunoData)) {
    return data.data.response.sunoData
      .filter((t: any) => t.id && (t.audioUrl || t.sourceAudioUrl))
      .map((t: any) => ({
        audioId: t.id,
        audioUrl: t.audioUrl || t.sourceAudioUrl,
        title: t.title,
        duration: t.duration,
      }));
  }
  // Format 3: {data: {sunoData: [...]}} — direct sunoData
  if (Array.isArray(data?.data?.sunoData)) {
    return data.data.sunoData
      .filter((t: any) => t.id && (t.audioUrl || t.sourceAudioUrl))
      .map((t: any) => ({
        audioId: t.id,
        audioUrl: t.audioUrl || t.sourceAudioUrl,
        title: t.title,
        duration: t.duration,
      }));
  }
  // Format 4: bare array ["url1.mp3", "url2.mp3"]
  if (Array.isArray(data)) {
    return data
      .filter((item: any) => typeof item === 'string' && item.startsWith('http'))
      .map((url: string, i: number) => ({ audioId: `track-${i}`, audioUrl: url }));
  }
  return [];
}

function getResultUrl(data: any): string | undefined {
  console.log('[kie-callback] getResultUrl - checking response structure:', {
    'response array': Array.isArray(data) ? data.length + ' items' : 'not array',
    'data.data?.resultUrl': data?.data?.resultUrl,
    'data.data?.videoUrl': data?.data?.videoUrl,
    'data.data?.audioUrl': data?.data?.audioUrl,
    'data.data?.audio_url': data?.data?.audio_url,
    'data.data?.sourceUrl': data?.data?.sourceUrl,
    'data.data?.result?.videoUrl': data?.data?.result?.videoUrl,
    'data.data?.result?.resultUrl': data?.data?.result?.resultUrl,
    'data.data?.result?.sourceUrl': data?.data?.result?.sourceUrl,
    'data.data?.resultUrls': data?.data?.resultUrls,
    'data.data?.resultJson': data?.data?.resultJson ? 'exists' : 'missing',
    'data.data?.info': data?.data?.info ? 'exists' : 'missing'
  });

  // Handle music/audio API responses
  if (data?.data?.audioUrl) {
    console.log('[kie-callback] Found audioUrl in data.data.audioUrl');
    return data.data.audioUrl;
  }
  if (data?.data?.audio_url) {
    console.log('[kie-callback] Found audio_url in data.data.audio_url');
    return data.data.audio_url;
  }
  // Handle sunoData format: {data: {response: {sunoData: [{audioUrl}]}}} or {data: {sunoData: [...]}}
  const sunoTracks = data?.data?.response?.sunoData || data?.data?.sunoData;
  if (Array.isArray(sunoTracks) && sunoTracks.length > 0) {
    const firstTrack = sunoTracks[0];
    const sunoUrl = firstTrack.audioUrl || firstTrack.sourceAudioUrl;
    if (sunoUrl) {
      console.log('[kie-callback] Found music URL in sunoData[0]:', { audioId: firstTrack.id, url: sunoUrl });
      return sunoUrl;
    }
  }
  
  // Handle Suno/Music callback: {code: 200, data: {callbackType: "complete", data: [{id, audio_url}]}}
  if (data?.data?.callbackType === 'complete' && Array.isArray(data?.data?.data) && data.data.data.length > 0) {
    const firstTrack = data.data.data[0];
    const musicUrl = firstTrack.audio_url || firstTrack.audioUrl;
    if (musicUrl) {
      console.log('[kie-callback] Found music URL in Suno callback data.data.data[0]:', { audioId: firstTrack.id, url: musicUrl });
      return musicUrl;
    }
  }

  // Check if the URL is in the top-level response array (Veo 3.1, Suno music)
  if (Array.isArray(data) && data.length > 0) {
    console.log('[kie-callback] Checking response array for media URL:', data);
    for (const item of data) {
      if (typeof item === 'string' && item.match(/\.(mp4|mp3|wav|webm|mov|ogg|m4a)(\?|$)/i)) {
        console.log('[kie-callback] Found media URL in response array:', item);
        return item;
      }
      if (typeof item === 'object' && item !== null) {
        const possibleUrl = item.url || item.videoUrl || item.audioUrl || item.sourceUrl || item.resultUrl;
        if (possibleUrl && typeof possibleUrl === 'string' && possibleUrl.match(/\.(mp4|mp3|wav|webm|mov|ogg|m4a)(\?|$)/i)) {
          console.log('[kie-callback] Found media URL in response object:', possibleUrl);
          return possibleUrl;
        }
      }
    }
    // Fallback: if array contains any string URLs, take the first one
    for (const item of data) {
      if (typeof item === 'string' && item.startsWith('http')) {
        console.log('[kie-callback] Found URL string in response array (fallback):', item);
        return item;
      }
    }
  }
  
  // Check if the video URL is in the info field (Veo 3.1 specific)
  if (data?.data?.info && Array.isArray(data.data.info) && data.data.info.length > 0) {
    console.log('[kie-callback] Checking info field for video URL:', data.data.info);
    // Look for URL patterns in the info array
    for (const infoItem of data.data.info) {
      if (typeof infoItem === 'string' && infoItem.includes('.mp4')) {
        console.log('[kie-callback] Found video URL in info field:', infoItem);
        return infoItem;
      }
      // Check if infoItem is an object with URL property
      if (typeof infoItem === 'object' && infoItem !== null) {
        const possibleUrl = infoItem.url || infoItem.videoUrl || infoItem.sourceUrl;
        if (possibleUrl && typeof possibleUrl === 'string' && possibleUrl.includes('.mp4')) {
          console.log('[kie-callback] Found video URL in info object:', possibleUrl);
          return possibleUrl;
        }
      }
    }
  }
  
  // Handle Veo 3.1 response structure - check for sourceUrl first
  if (data?.data?.sourceUrl) {
    console.log('[kie-callback] Found sourceUrl in data.data.sourceUrl');
    return data.data.sourceUrl;
  }
  
  // Handle Veo 3.1 response structure
  if (data?.data?.resultUrl) {
    console.log('[kie-callback] Found resultUrl in data.data.resultUrl');
    return data.data.resultUrl;
  }
  
  // Handle Veo 3.1 alternative response structure
  if (data?.data?.videoUrl) {
    console.log('[kie-callback] Found videoUrl in data.data.videoUrl');
    return data.data.videoUrl;
  }
  
  // Handle Veo 3.1 nested result structure
  if (data?.data?.result?.sourceUrl) {
    console.log('[kie-callback] Found sourceUrl in data.data.result.sourceUrl');
    return data.data.result.sourceUrl;
  }
  
  if (data?.data?.result?.videoUrl) {
    console.log('[kie-callback] Found videoUrl in data.data.result.videoUrl');
    return data.data.result.videoUrl;
  }
  
  if (data?.data?.result?.resultUrl) {
    console.log('[kie-callback] Found resultUrl in data.data.result.resultUrl');
    return data.data.result.resultUrl;
  }

  const resultJsonRaw = data?.data?.resultJson;

  if (typeof resultJsonRaw === 'string') {
    try {
      const parsedResultJson = JSON.parse(resultJsonRaw);
      console.log('[kie-callback] Parsed resultJson keys:', Object.keys(parsedResultJson));
      
      if (Array.isArray(parsedResultJson?.resultUrls) && parsedResultJson.resultUrls.length > 0) {
        console.log('[kie-callback] Found resultUrls in parsed resultJson');
        return parsedResultJson.resultUrls[0];
      }
      
      // Check for Veo 3.1 URLs in parsed resultJson - prioritize sourceUrl
      if (parsedResultJson?.sourceUrl) {
        console.log('[kie-callback] Found sourceUrl in parsed resultJson');
        return parsedResultJson.sourceUrl;
      }
      
      if (parsedResultJson?.videoUrl) {
        console.log('[kie-callback] Found videoUrl in parsed resultJson');
        return parsedResultJson.videoUrl;
      }
      
      if (parsedResultJson?.resultUrl) {
        console.log('[kie-callback] Found resultUrl in parsed resultJson');
        return parsedResultJson.resultUrl;
      }
    } catch (parseError) {
      console.warn('[kie-callback] Failed to parse resultJson:', parseError);
    }
  }

  if (Array.isArray(data?.data?.resultUrls) && data.data.resultUrls.length > 0) {
    console.log('[kie-callback] Found resultUrls in data.data');
    return data.data.resultUrls[0];
  }

  console.log('[kie-callback] No video URL found in any location');
  return undefined;
}

async function compositeGeneratedIntoOriginal(params: {
  originalImageUrl: string;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  generatedBuffer: Buffer;
}) {
  // Fetch the original image
  const originalResponse = await fetch(params.originalImageUrl);
  if (!originalResponse.ok) {
    throw new Error(`Failed to fetch original image: ${originalResponse.status} ${originalResponse.statusText}`);
  }

  const originalBuffer = Buffer.from(await originalResponse.arrayBuffer());
  const originalMeta = await sharp(originalBuffer).metadata();
  
  console.log('[compositeGeneratedIntoOriginal] Original image:', {
    width: originalMeta.width,
    height: originalMeta.height,
    url: params.originalImageUrl?.substring(0, 80)
  });
  console.log('[compositeGeneratedIntoOriginal] Crop coords from frontend:', {
    cropX: params.cropX,
    cropY: params.cropY,
    cropWidth: params.cropWidth,
    cropHeight: params.cropHeight,
  });

  // Round to integers (sharp requires integer values)
  let cropX = Math.round(params.cropX);
  let cropY = Math.round(params.cropY);
  let cropWidth = Math.round(params.cropWidth);
  let cropHeight = Math.round(params.cropHeight);

  // Validate crop parameters
  if (!cropWidth || !cropHeight) {
    console.error('[compositeGeneratedIntoOriginal] Missing crop dimensions:', { cropX, cropY, cropWidth, cropHeight });
    return params.generatedBuffer;
  }

  // Clamp to original image bounds
  const clampedX = Math.max(0, Math.min(cropX, (originalMeta.width || 0) - 1));
  const clampedY = Math.max(0, Math.min(cropY, (originalMeta.height || 0) - 1));
  const clampedW = Math.min(cropWidth, (originalMeta.width || 0) - clampedX);
  const clampedH = Math.min(cropHeight, (originalMeta.height || 0) - clampedY);

  if (clampedW <= 0 || clampedH <= 0) {
    console.error('[compositeGeneratedIntoOriginal] Invalid crop after clamping:', { clampedX, clampedY, clampedW, clampedH });
    return params.generatedBuffer;
  }

  console.log('[compositeGeneratedIntoOriginal] Using clamped crop:', { clampedX, clampedY, clampedW, clampedH });

  // Get generated image metadata before resize
  const generatedMeta = await sharp(params.generatedBuffer).metadata();
  console.log('[compositeGeneratedIntoOriginal] Generated image size before resize:', {
    width: generatedMeta.width,
    height: generatedMeta.height
  });

  // Resize the generated image to match the crop dimensions
  console.log('[compositeGeneratedIntoOriginal] Resizing generated image to:', { width: clampedW, height: clampedH });
  
  const resizedGenerated = await sharp(params.generatedBuffer)
    .resize(clampedW, clampedH, { fit: 'fill' })
    .png()
    .toBuffer();

  // Composite the generated image onto the original at the crop position
  console.log('[compositeGeneratedIntoOriginal] Compositing at position:', { left: clampedX, top: clampedY });
  
  const finalBuffer = await sharp(originalBuffer)
    .composite([{ 
      input: resizedGenerated, 
      left: clampedX, 
      top: clampedY 
    }])
    .png()
    .toBuffer();

  // Get final image metadata
  const finalMeta = await sharp(finalBuffer).metadata();
  console.log('[compositeGeneratedIntoOriginal] Final combined image size:', {
    width: finalMeta.width,
    height: finalMeta.height
  });

  return finalBuffer;
}

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  console.log('[kie-callback] Route hit!');

  // ── Webhook secret guard (Option C) ──────────────────────────────────────
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (expectedSecret) {
    const incomingSecret =
      request.headers.get('x-webhook-secret') ||
      new URL(request.url).searchParams.get('secret');
    if (incomingSecret !== expectedSecret) {
      console.warn('[kie-callback] Rejected — invalid or missing webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const data = await request.json();
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');
    
    console.log('[kie-callback] Received data:', { data, fileId });
    
    console.log('[kie-callback] Received:', { fileId, data });
    
    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    const typedFileId = fileId as Id<"storyboard_files">;

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Use centralized response extraction
    const kieResponse = extractKieResponse(data);
    const callbackModel = data.data?.model || '';
    let state = kieResponse.state || data.data?.state;
    const taskId = kieResponse.taskId || data.data?.taskId;
    let resultUrl = getResultUrl(data);

    // Normalize state
    if (state === 'fail') state = 'failed';

    console.log('[kie-callback] Parsed completion payload:', {
      state,
      taskId,
      model: callbackModel,
      resultUrl,
      responseCode: kieResponse.responseCode,
      responseMessage: kieResponse.responseMessage,
      failMsg: data.data?.failMsg,
    });

    if (taskId) {
      await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
        fileId: typedFileId,
        taskId,
        status: state === 'success' && resultUrl ? 'processing' : 'processing',
        responseCode: kieResponse.responseCode,
        responseMessage: kieResponse.responseMessage,
      });
    }

    // Determine if this is a Veo model (only use Veo fallback for actual Veo models)
    const isVeoModel = callbackModel.includes('veo') || callbackModel.includes('Veo');

    // Special handling for Veo 3.1 ONLY: if we have taskId but no resultUrl, query the Veo API
    if (isVeoModel && taskId && !resultUrl && state !== 'failed' && state !== 'error') {
      console.log('[kie-callback] Veo 3.1 detected - querying API for video URL using taskId:', taskId);

      try {
        const endpoint = `https://api.kie.ai/api/v1/veo/record-info?taskId=${taskId}`;
        console.log(`[kie-callback] Trying Veo 3.1 specific endpoint: ${endpoint}`);

        const kieResponse = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
          },
        });

        if (kieResponse.ok) {
          const kieData = await kieResponse.json();
          console.log('[kie-callback] Veo 3.1 API response:', kieData);

          let videoUrl = null;

          if (kieData?.data?.response?.resultUrls && Array.isArray(kieData.data.response.resultUrls)) {
            videoUrl = kieData.data.response.resultUrls[0];
          } else if (kieData?.data?.resultUrls && Array.isArray(kieData.data.resultUrls)) {
            videoUrl = kieData.data.resultUrls[0];
          } else if (kieData?.data?.resultUrl) {
            videoUrl = kieData.data.resultUrl;
          } else if (kieData?.data?.videoUrl) {
            videoUrl = kieData.data.videoUrl;
          } else if (kieData?.data?.sourceUrl) {
            videoUrl = kieData.data.sourceUrl;
          }

          if (videoUrl) {
            console.log('[kie-callback] Found Veo 3.1 video URL:', videoUrl);
            resultUrl = videoUrl;
            state = 'success';
          } else {
            console.log('[kie-callback] No video URL found in Veo 3.1 API response');
            if (kieData?.code === 422 || kieData?.msg?.includes('recordInfo is null')) {
              console.log('[kie-callback] Veo 3.1 task still processing');
            }
          }
        } else {
          console.error('[kie-callback] Failed to query Veo 3.1 API:', kieResponse.status);
          const errorText = await kieResponse.text();
          if (kieResponse.status === 422 && errorText?.includes('recordInfo is null')) {
            console.log('[kie-callback] Veo 3.1 task still processing');
          } else {
            state = 'failed';
          }
        }

      } catch (error) {
        console.error('[kie-callback] Error querying Veo 3.1 API:', error);
        state = 'failed';
      }
    }

    if (state === 'failed' || state === 'error' || state === 'fail') {
      const fileRecord = await convex.query(api.storyboard.storyboardFiles.getById, {
        id: typedFileId,
      });

      if (fileRecord?.companyId && fileRecord?.creditsUsed && fileRecord.creditsUsed > 0) {
        await convex.mutation(api.credits.refundCredits, {
          companyId: fileRecord.companyId,
          tokens: fileRecord.creditsUsed,
          reason: `AI Generation Failed - ${fileRecord.filename}`,
          _secret: process.env.WEBHOOK_SECRET || 'server-bypass',
        });
      }

      await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
        fileId: typedFileId,
        taskId,
        status: 'failed',
        responseCode: kieResponse.responseCode,
        responseMessage: kieResponse.responseMessage,
        creditsUsed: 0, // Zero out after refund
      });

      return NextResponse.json({
        success: true,
        message: 'Failure callback processed',
        fileId,
        taskId,
      });
    }

    // If we have a result URL but no state (e.g. music API returns bare array of URLs), treat as success
    if (!state && resultUrl) {
      console.log('[kie-callback] No state field but resultUrl found — treating as success');
      state = 'success';
    }

    // Handle multiple music tracks (Suno returns 2 song variations per request)
    // Extract all tracks with audioId, save extras as separate files (0 credits)
    const musicTracks = extractMusicTracks(data);
    if (state === 'success' && musicTracks.length > 0) {
      console.log(`[kie-callback] Found ${musicTracks.length} music tracks:`, musicTracks.map(t => ({ audioId: t.audioId, title: t.title })));
    }
    if (state === 'success' && musicTracks.length > 1) {
      const extraTracks = musicTracks.slice(1); // skip first (handled by main flow)
      console.log(`[kie-callback] Saving ${extraTracks.length} additional music tracks`);
      const originalFileRecord = await convex.query(api.storyboard.storyboardFiles.getById, { id: typedFileId });

      for (let i = 0; i < extraTracks.length; i++) {
        const extraUrl = extraTracks[i].audioUrl;
        try {
          const extraResponse = await fetch(extraUrl);
          if (!extraResponse.ok) continue;
          const extraBlob = await extraResponse.blob();
          const extraMime = extraBlob.type || 'audio/mpeg';
          const extraExt = extraUrl.match(/\.(\w+)(\?|$)/)?.[1] || 'mp3';
          const extraCompanyId = originalFileRecord?.companyId ?? 'unknown';
          const extraR2Key = `${extraCompanyId}/generated/ai-music-${Date.now()}-v${i + 2}.${extraExt}`;

          await uploadToR2(extraBlob, extraR2Key);
          const extraPublicUrl = getR2PublicUrl(extraR2Key);

          // Create a new file record with 0 credits (already charged on the first one)
          const extraFileId = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
            companyId: extraCompanyId,
            userId: originalFileRecord?.uploadedBy || '',
            projectId: originalFileRecord?.projectId,
            category: 'generated',
            filename: `ai-music-${Date.now()}-v${i + 2}.${extraExt}`,
            fileType: 'audio',
            mimeType: extraMime,
            size: extraBlob.size,
            status: 'completed',
            creditsUsed: 0, // No extra charge — already paid
            categoryId: originalFileRecord?.categoryId,
            sourceUrl: extraPublicUrl,
            r2Key: extraR2Key,
            tags: [],
            uploadedBy: originalFileRecord?.uploadedBy || '',
            model: originalFileRecord?.model || 'ai-music-api/generate',
            prompt: originalFileRecord?.prompt || '',
            aspectRatio: undefined,
            taskId: taskId || originalFileRecord?.taskId,
            defaultAI: originalFileRecord?.defaultAI,
            metadata: { audioId: extraTracks[i].audioId, musicTitle: extraTracks[i].title, musicDuration: extraTracks[i].duration, audioUrl: extraPublicUrl },
          });

          // Set responseCode/responseMessage via updateFromCallback
          await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
            fileId: extraFileId,
            taskId: taskId || originalFileRecord?.taskId,
            status: 'completed',
            responseCode: kieResponse.responseCode || 200,
            responseMessage: kieResponse.responseMessage || 'success',
          });

          console.log(`[kie-callback] Extra audio ${i + 2} saved:`, { r2Key: extraR2Key, fileId: extraFileId, sizeMB: (extraBlob.size / (1024 * 1024)).toFixed(2) });
        } catch (extraErr) {
          console.error(`[kie-callback] Failed to save extra audio ${i + 2}:`, extraErr);
        }
      }
    }

    if (state === 'success' && resultUrl) {
      const fileRecord = await convex.query(api.storyboard.storyboardFiles.getById, {
        id: typedFileId,
      });

      const companyId = fileRecord?.companyId ?? fileRecord?.orgId ?? fileRecord?.userId ?? 'unknown';
      const sourceResponse = await fetch(resultUrl);

      if (!sourceResponse.ok) {
        throw new Error(`Failed to fetch generated image: ${sourceResponse.status} ${sourceResponse.statusText}`);
      }

      const sourceBlob = await sourceResponse.blob();
      const blobType = sourceBlob.type || '';
      const timestamp = Date.now();
      const generationMetadata = fileRecord?.metadata ?? {};
      // Determine mime from blob, response header, or URL extension — never default to image/png blindly
      const mimeType = blobType && !blobType.includes('octet-stream')
        ? blobType
        : (() => {
            const ext = resultUrl.split('?')[0].split('.').pop()?.toLowerCase();
            const map: Record<string, string> = {
              mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
              mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
              png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
            };
            return (ext && map[ext]) || 'image/png';
          })();
      // Audio/Music detection first (takes priority) — check URL, mime, fileType, AND model name
      const isMusic = fileRecord?.fileType === 'music' || fileRecord?.model?.includes('music');
      const isAudio = !isMusic && (fileRecord?.fileType === 'audio' || mimeType.startsWith('audio/') || resultUrl.match(/\.(mp3|wav|m4a|ogg|aac)(\?|$)/i));
      const isVideo = !isMusic && !isAudio && (fileRecord?.fileType === 'video' || mimeType.startsWith('video/') || resultUrl.match(/\.(mp4|webm|mov)(\?|$)/i));

      console.log('[kie-callback] File type detection:', { fileType: fileRecord?.fileType, mimeType, isVideo, isAudio, isMusic, resultUrl: resultUrl.substring(0, 80) });

      let finalR2Key: string;
      let finalUrl: string | undefined;
      let fileSizeBytes: number;

      if (isMusic || isAudio) {
        // ── MUSIC/AUDIO: Save directly to {companyId}/generated/ as correct extension ──
        const urlExt = resultUrl.match(/\.(\w+)(\?|$)/)?.[1] || 'mp3';
        const audioExt = ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(urlExt) ? urlExt : 'mp3';
        const prefix = isMusic ? 'ai-music' : 'tts-audio';
        finalR2Key = `${companyId}/generated/${prefix}-${timestamp}.${audioExt}`;
        await uploadToR2(sourceBlob, finalR2Key);
        finalUrl = getR2PublicUrl(finalR2Key);
        fileSizeBytes = sourceBlob.size;
        console.log(`[kie-callback] ${isMusic ? 'Music' : 'Audio'} saved directly:`, { r2Key: finalR2Key, sizeMB: (fileSizeBytes / (1024 * 1024)).toFixed(2) });
      } else if (isVideo) {
        // ── VIDEO: Save with correct video extension (never reuse original filename which may be .png) ──
        const videoExt = mimeType.includes('webm') ? 'webm' : mimeType.includes('mov') ? 'mov' : 'mp4';
        finalR2Key = `${companyId}/generated/generated-video-${timestamp}.${videoExt}`;
        await uploadToR2(sourceBlob, finalR2Key);
        finalUrl = getR2PublicUrl(finalR2Key);
        fileSizeBytes = sourceBlob.size;
        console.log('[kie-callback] Video saved directly:', { r2Key: finalR2Key, sizeMB: (fileSizeBytes / (1024 * 1024)).toFixed(2) });
      } else {
        // ── IMAGE: Process with optional compositing ──
        const extension = mimeType.includes('webp') ? 'webp' : mimeType.includes('jpeg') ? 'jpg' : 'png';
        const finalExtension = 'png';
        const sourceBuffer = Buffer.from(await sourceBlob.arrayBuffer());

        console.log('[kie-callback] File metadata:', generationMetadata);
        console.log('[kie-callback] Should composite check:', {
          shouldComposite: generationMetadata?.shouldComposite,
          originalImageUrl: generationMetadata?.originalImageUrl,
          cropX: generationMetadata?.cropX,
          cropY: generationMetadata?.cropY,
          cropWidth: generationMetadata?.cropWidth,
          cropHeight: generationMetadata?.cropHeight
        });

        const tempR2Key = `temps/generated-image-kie-${timestamp}.${extension}`;
        await uploadToR2(sourceBlob, tempR2Key);

        let finalBuffer: Buffer = sourceBuffer;

        // Check if we need to composite
        if (generationMetadata?.originalImageUrl &&
            generationMetadata.cropX !== undefined && generationMetadata.cropY !== undefined &&
            generationMetadata.cropWidth !== undefined && generationMetadata.cropHeight !== undefined) {
          console.log('[kie-callback] Compositing generated image into original using crop coordinates...');

          try {
            finalBuffer = await compositeGeneratedIntoOriginal({
              originalImageUrl: generationMetadata.originalImageUrl,
              cropX: generationMetadata.cropX,
              cropY: generationMetadata.cropY,
              cropWidth: generationMetadata.cropWidth,
              cropHeight: generationMetadata.cropHeight,
              generatedBuffer: sourceBuffer,
            });

            console.log('[kie-callback] ✅ Compositing successful');
          } catch (error) {
            console.error('[kie-callback] ❌ Compositing failed, using generated image as-is:', error);
            finalBuffer = sourceBuffer;
          }
        } else {
          console.log('[kie-callback] No compositing needed or missing crop info, using generated image as-is');
        }

        const finalBlob = new Blob([finalBuffer as unknown as BlobPart], { type: 'image/png' });
        finalR2Key = `${companyId}/generated/generated-image-final-${timestamp}.${finalExtension}`;
        await uploadToR2(finalBlob, finalR2Key);
        finalUrl = getR2PublicUrl(finalR2Key);
        fileSizeBytes = finalBlob.size;
      }

      console.log('[kie-callback] Final file details:', {
        r2Key: finalR2Key,
        sizeBytes: fileSizeBytes,
        sizeMB: (fileSizeBytes / (1024 * 1024)).toFixed(2),
        url: finalUrl?.substring(0, 80) + '...'
      });

      await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
        fileId: typedFileId,
        taskId,
        sourceUrl: finalUrl,
        r2Key: finalR2Key,
        size: fileSizeBytes,
        status: 'completed',
        responseCode: 200,
        responseMessage: 'success',
        metadata: {
          ...generationMetadata,
          ...(isAudio ? { audioUrl: finalUrl } : isVideo ? { videoUrl: finalUrl } : { tempGeneratedImageUrl: finalUrl, finalImageUrl: finalUrl }),
          // Store music audioId + taskId for persona creation & extend
          ...(musicTracks.length > 0 ? { audioId: musicTracks[0].audioId, musicTitle: musicTracks[0].title, musicDuration: musicTracks[0].duration } : {}),
          processedAt: new Date().toISOString(),
          fileSizeBytes,
          fileSizeMB: Math.round(fileSizeBytes / (1024 * 1024) * 100) / 100,
        },
        // Correct fileType if detected as audio from URL (fixes old records with wrong fileType)
        ...(isAudio && fileRecord?.fileType !== 'audio' ? { fileType: 'audio' } : {}),
      });

      // Auto-update element referenceUrls + thumbnailUrl when this is an element generation
      if (fileRecord?.category === 'elements' && fileRecord?.categoryId && finalUrl) {
        try {
          const meta = fileRecord.metadata as Record<string, any> | undefined;
          await convex.mutation(api.storyboard.storyboardElements.appendReferenceImage, {
            id: fileRecord.categoryId as Id<"storyboard_elements">,
            imageUrl: finalUrl,
            variantLabel: meta?.variantLabel || undefined,
            variantModel: meta?.variantModel || undefined,
            setPrimary: meta?.setPrimary === true ? true : undefined,
          });
          console.log('[kie-callback] Updated element referenceUrls/thumbnail for', fileRecord.categoryId);
        } catch (elementUpdateError) {
          console.warn('[kie-callback] Element auto-update failed (non-critical):', elementUpdateError);
        }
      }

      // Clear taskStatus when a Director-triggered production sheet finishes
      if (fileRecord?.category === 'production-sheet' && fileRecord?.projectId) {
        try {
          await convex.mutation(api.storyboard.build.setTaskStatus, {
            projectId: fileRecord.projectId as Id<"storyboard_projects">,
            taskStatus: "idle",
          });
        } catch { /* non-fatal */ }
      }

      // Auto-update project worldViewImageUrl + project cover when this is a world view sheet
      if (fileRecord?.category === 'worldview' && fileRecord?.projectId && finalUrl) {
        try {
          await convex.mutation(api.storyboard.projects.updateWorldView, {
            id: fileRecord.projectId as Id<"storyboard_projects">,
            worldViewImageUrl: finalUrl,
          });
          // Also set as the project cover image (shown in project grid)
          await convex.mutation(api.storyboard.projects.update, {
            id: fileRecord.projectId as Id<"storyboard_projects">,
            imageUrl: finalUrl,
          });
          console.log('[kie-callback] Updated worldViewImageUrl + project cover for project', fileRecord.projectId);
        } catch (worldViewUpdateError) {
          console.warn('[kie-callback] World view auto-update failed (non-critical):', worldViewUpdateError);
        }
      }

      // Auto-share for free personal users only — orgs are never auto-shared
      try {
        if (
          fileRecord?.companyId &&
          !fileRecord.companyId.startsWith('org_') &&
          fileRecord?.category === 'generated' &&
          fileRecord?.prompt &&
          (fileRecord?.creditsUsed ?? 0) > 0
        ) {
          const ownerPlanData = await convex.query(api.credits.getOwnerPlan, { companyId: fileRecord.companyId });
          const ownerPlan = ownerPlanData?.ownerPlan;
          if (ownerPlan === 'free') {
            await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
              fileId: typedFileId,
              status: 'completed',
              isShared: true,
              sharedAt: Date.now(),
              sharedBy: fileRecord.userId || 'system',
            });
          }
        }
      } catch (autoShareError) {
        console.warn('[kie-callback] Auto-share failed (non-critical):', autoShareError);
      }

      return NextResponse.json({
        success: true,
        message: 'Task completed and file stored to R2 successfully',
        fileId,
        taskId,
        sourceUrl: finalUrl,
        r2Key: finalR2Key,
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Callback processed',
      fileId,
      data
    });
    
  } catch (error) {
    console.error('[kie-callback] Error:', error);
    return NextResponse.json({ 
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
