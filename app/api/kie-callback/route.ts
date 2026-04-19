import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { uploadToR2, getR2PublicUrl } from "@/lib/r2";
import sharp from "sharp";
import { extractKieResponse, getResponseCodeInfo } from "@/lib/storyboard/kieResponse";

function getResultUrl(data: any): string | undefined {
  console.log('[kie-callback] getResultUrl - checking response structure:', {
    'response array': Array.isArray(data) ? data.length + ' items' : 'not array',
    'data.data?.resultUrl': data?.data?.resultUrl,
    'data.data?.videoUrl': data?.data?.videoUrl,
    'data.data?.sourceUrl': data?.data?.sourceUrl,
    'data.data?.result?.videoUrl': data?.data?.result?.videoUrl,
    'data.data?.result?.resultUrl': data?.data?.result?.resultUrl,
    'data.data?.result?.sourceUrl': data?.data?.result?.sourceUrl,
    'data.data?.resultUrls': data?.data?.resultUrls,
    'data.data?.resultJson': data?.data?.resultJson ? 'exists' : 'missing',
    'data.data?.info': data?.data?.info ? 'exists' : 'missing'
  });
  
  // Check if the video URL is in the top-level response array (Veo 3.1 specific)
  if (Array.isArray(data) && data.length > 0) {
    console.log('[kie-callback] Checking response array for video URL:', data);
    // Look for URL patterns in the response array
    for (const item of data) {
      if (typeof item === 'string' && item.includes('.mp4')) {
        console.log('[kie-callback] Found video URL in response array:', item);
        return item;
      }
      // Check if item is an object with URL property
      if (typeof item === 'object' && item !== null) {
        const possibleUrl = item.url || item.videoUrl || item.sourceUrl || item.resultUrl;
        if (possibleUrl && typeof possibleUrl === 'string' && possibleUrl.includes('.mp4')) {
          console.log('[kie-callback] Found video URL in response object:', possibleUrl);
          return possibleUrl;
        }
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
  
  try {
    const data = await request.json();
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');
    
    console.log('[kie-callback] Received data:', { data, fileId });
    
    console.log('[kie-callback] Received:', { fileId, data });
    
    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

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
        fileId,
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
        id: fileId,
      });

      if (fileRecord?.companyId && fileRecord?.creditsUsed) {
        await convex.mutation(api.credits.refundCredits, {
          companyId: fileRecord.companyId,
          tokens: fileRecord.creditsUsed,
          reason: `AI Generation Failed - ${fileRecord.filename}`,
        });
      }

      await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
        fileId,
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

    if (state === 'success' && resultUrl) {
      const fileRecord = await convex.query(api.storyboard.storyboardFiles.getById, {
        id: fileId,
      });

      const companyId = fileRecord?.companyId ?? fileRecord?.orgId ?? fileRecord?.userId ?? 'unknown';
      const sourceResponse = await fetch(resultUrl);

      if (!sourceResponse.ok) {
        throw new Error(`Failed to fetch generated image: ${sourceResponse.status} ${sourceResponse.statusText}`);
      }

      const sourceBlob = await sourceResponse.blob();
      const mimeType = sourceBlob.type || 'image/png';
      const timestamp = Date.now();
      const generationMetadata = fileRecord?.metadata ?? {};
      const isVideo = fileRecord?.fileType === 'video' || mimeType.startsWith('video/') || resultUrl.match(/\.(mp4|webm|mov)(\?|$)/i);

      console.log('[kie-callback] File type detection:', { fileType: fileRecord?.fileType, mimeType, isVideo, resultUrl: resultUrl.substring(0, 80) });

      let finalR2Key: string;
      let finalUrl: string | undefined;
      let fileSizeBytes: number;

      if (isVideo) {
        // ── VIDEO: Save directly to {companyId}/generated/ as .mp4 ──
        const videoExt = mimeType.includes('webm') ? 'webm' : mimeType.includes('mov') ? 'mov' : 'mp4';
        finalR2Key = `${companyId}/generated/${fileRecord?.filename || `video-${timestamp}.${videoExt}`}`;
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

        let finalBuffer = sourceBuffer;

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

        const finalBlob = new Blob([finalBuffer], { type: 'image/png' });
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
        fileId,
        taskId,
        sourceUrl: finalUrl,
        r2Key: finalR2Key,
        size: fileSizeBytes,
        status: 'completed',
        responseCode: 200,
        responseMessage: 'success',
        metadata: {
          ...generationMetadata,
          ...(isVideo ? { videoUrl: finalUrl } : { tempGeneratedImageUrl: finalUrl, finalImageUrl: finalUrl }),
          processedAt: new Date().toISOString(),
          fileSizeBytes,
          fileSizeMB: Math.round(fileSizeBytes / (1024 * 1024) * 100) / 100,
        },
      });

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
              fileId,
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
