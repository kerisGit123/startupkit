import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { uploadToR2, getR2PublicUrl } from "@/lib/r2";
import sharp from "sharp";

function getResultUrl(data: any): string | undefined {
  const resultJsonRaw = data?.data?.resultJson;

  if (typeof resultJsonRaw === 'string') {
    try {
      const parsedResultJson = JSON.parse(resultJsonRaw);
      if (Array.isArray(parsedResultJson?.resultUrls) && parsedResultJson.resultUrls.length > 0) {
        return parsedResultJson.resultUrls[0];
      }
    } catch (parseError) {
      console.warn('[kie-callback] Failed to parse resultJson:', parseError);
    }
  }

  if (Array.isArray(data?.data?.resultUrls) && data.data.resultUrls.length > 0) {
    return data.data.resultUrls[0];
  }

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

    const taskId = data.data?.taskId;
    const state = data.data?.state;
    const resultUrl = getResultUrl(data);

    if (taskId) {
      await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
        fileId,
        taskId,
        status: state === 'success' && resultUrl ? 'processing' : 'processing',
      });
    }

    console.log('[kie-callback] Parsed completion payload:', {
      state,
      taskId,
      resultUrl,
    });

    if (state === 'failed' || state === 'error') {
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
      const extension = mimeType.includes('webp') ? 'webp' : mimeType.includes('jpeg') ? 'jpg' : 'png';
      const finalExtension = 'png';
      const timestamp = Date.now();
      const sourceBuffer = Buffer.from(await sourceBlob.arrayBuffer());
      const generationMetadata = fileRecord?.metadata ?? {};
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
      const tempUrl = getR2PublicUrl(tempR2Key);

      let finalBuffer = sourceBuffer;

      // Check if we need to composite (like your old code)
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
          // Fallback to generated image
          finalBuffer = sourceBuffer;
        }
      } else {
        console.log('[kie-callback] No compositing needed or missing crop info, using generated image as-is');
      }

      const finalBlob = new Blob([finalBuffer], { type: 'image/png' });

      const finalR2Key = `${companyId}/generated/generated-image-final-${timestamp}.${finalExtension}`;
      await uploadToR2(finalBlob, finalR2Key);
      const finalUrl = getR2PublicUrl(finalR2Key);
      
      // Calculate file size in bytes
      const fileSizeBytes = finalBlob.size;
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
        size: fileSizeBytes, // Use standard database field name: size
        status: 'completed',
        metadata: {
          ...generationMetadata,
          tempGeneratedImageUrl: tempUrl,
          finalImageUrl: finalUrl,
          processedAt: new Date().toISOString(),
          fileSizeBytes,
          fileSizeMB: Math.round(fileSizeBytes / (1024 * 1024) * 100) / 100, // Store size in MB with 2 decimal places
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Task completed and file stored to R2 successfully',
        fileId,
        taskId,
        sourceUrl: finalUrl,
        r2Key: finalR2Key,
        tempSourceUrl: tempUrl,
        tempR2Key,
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
