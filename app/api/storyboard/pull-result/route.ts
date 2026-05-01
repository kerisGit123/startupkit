import { NextRequest, NextResponse } from 'next/server';
import { resolveKieApiKey } from '@/lib/storyboard/kieAI';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function POST(req: NextRequest) {
  // ── Auth guard — only authenticated clients should poll results ──────────
  const { auth } = await import('@clerk/nextjs/server');
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { taskId, fileId, companyId } = await req.json();

    if (!taskId || !fileId) {
      return NextResponse.json({ error: 'taskId and fileId are required' }, { status: 400 });
    }

    console.log('[pull-result] Polling record-info for:', { taskId, fileId });

    const { apiKey } = await resolveKieApiKey(companyId);

    // Try multiple record-info endpoints — different KIE AI services use different paths
    const endpoints = [
      `https://api.kie.ai/api/v1/jobs/record-info?taskId=${taskId}`,      // Image generation (GPT Image 2, Nano Banana, etc.)
      `https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`,  // Music/cover generation
      `https://api.kie.ai/api/v1/veo/record-info?taskId=${taskId}`,       // Veo video generation
    ];

    let resultData: any = null;

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const data = await res.json().catch(() => null);
        console.log(`[pull-result] ${endpoint.split('/api/v1/')[1]} → status=${res.status}, code=${data?.code}, taskStatus=${data?.data?.status || 'N/A'}`);
        if (res.ok && data?.code === 200 && data?.data) {
          resultData = data;
          console.log('[pull-result] Found result from:', endpoint);
          break;
        }
      } catch (e) {
        console.log(`[pull-result] ${endpoint.split('/api/v1/')[1]} → error:`, e);
      }
    }

    if (!resultData) {
      return NextResponse.json({ error: 'Task not found or still processing', status: 'unknown' }, { status: 404 });
    }

    const status = resultData.data?.status;
    console.log('[pull-result] Task status:', status);

    // Intermediate stages — still generating, not failed
    const inProgressStatuses = ['PENDING', 'PROCESSING', 'QUEUED', 'TEXT_SUCCESS', 'FIRST_SUCCESS', 'GENERATING', 'GENERATE_AUDIO'];
    const isStillProcessing = !status || inProgressStatuses.some(s => status.toUpperCase().includes(s) || s.includes(status.toUpperCase()));

    // Handle failed status — mark file as failed and refund credits
    if (status && status !== 'SUCCESS' && !isStillProcessing) {
      console.log('[pull-result] Task failed:', { status, errorMessage: resultData.data?.errorMessage, errorCode: resultData.data?.errorCode });
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

      // 1. Read file BEFORE updating (to get creditsUsed before we zero it)
      let creditsToRefund = 0;
      let fileCompanyId = '';
      try {
        const fileRecord = await convex.query(api.storyboard.storyboardFiles.getById, { id: fileId });
        creditsToRefund = fileRecord?.creditsUsed || 0;
        fileCompanyId = fileRecord?.companyId || '';
        console.log('[pull-result] File before update:', { creditsUsed: creditsToRefund, companyId: fileCompanyId });
      } catch (e) {
        console.error('[pull-result] Error reading file:', e);
      }

      // 2. Refund credits BEFORE zeroing them on the file
      if (creditsToRefund > 0 && fileCompanyId) {
        try {
          await convex.mutation(api.credits.refundCredits, {
            companyId: fileCompanyId,
            tokens: creditsToRefund,
            reason: `AI generation failed (${status}) — ${resultData.data?.errorMessage || 'Unknown error'}`,
            _secret: process.env.WEBHOOK_SECRET || 'server-bypass',
          });
          console.log('[pull-result] Refunded credits:', creditsToRefund);
        } catch (e) {
          console.warn('[pull-result] Could not refund credits:', e instanceof Error ? e.message : e);
        }
      }

      // 3. Mark file as failed and zero out creditsUsed
      try {
        await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
          fileId,
          status: 'failed',
          responseCode: resultData.data?.errorCode || 500,
          responseMessage: resultData.data?.errorMessage || status,
          creditsUsed: 0,
        });
        console.log('[pull-result] File marked as failed:', fileId);
      } catch (e) {
        console.error('[pull-result] Error updating file status:', e);
      }

      return NextResponse.json({
        success: false,
        status,
        message: resultData.data?.errorMessage || `Task failed: ${status}`,
      });
    }

    if (status !== 'SUCCESS') {
      return NextResponse.json({
        success: false,
        status: status || 'unknown',
        message: resultData.data?.errorMessage || `Still processing (${status})`,
      });
    }

    // Extract audio/video URLs from the response
    const sunoData = resultData.data?.response?.sunoData;
    const resultUrls = resultData.data?.response?.resultUrls;

    // Build callback payload based on response type
    let callbackPayload: any;

    if (Array.isArray(sunoData) && sunoData.length > 0) {
      // Music: convert sunoData to callback format
      callbackPayload = {
        code: 200,
        data: {
          callbackType: 'complete',
          data: sunoData.map((t: any) => ({
            id: t.id,
            audio_url: t.audioUrl || t.sourceAudioUrl,
            title: t.title,
            duration: t.duration,
          })),
        },
      };
    } else if (Array.isArray(resultUrls) && resultUrls.length > 0) {
      // Video/image: use resultUrls
      callbackPayload = {
        code: 200,
        data: {
          state: 'success',
          taskId,
          resultUrl: resultUrls[0],
        },
      };
    } else {
      return NextResponse.json({ error: 'No result URLs found in task data' }, { status: 404 });
    }

    // Feed the result to the kie-callback handler (pass webhook secret for internal call)
    const webhookSecret = process.env.WEBHOOK_SECRET || '';
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/kie-callback?fileId=${fileId}&secret=${encodeURIComponent(webhookSecret)}`;
    console.log('[pull-result] Forwarding to callback:', callbackUrl.replace(webhookSecret, '***'));

    const cbRes = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret,
      },
      body: JSON.stringify(callbackPayload),
    });

    const cbResult = await cbRes.json();
    console.log('[pull-result] Callback result:', { status: cbRes.status, success: cbResult.success });

    return NextResponse.json({
      success: cbResult.success,
      status: 'completed',
      message: 'Result pulled and processed successfully',
      sourceUrl: cbResult.sourceUrl,
    });
  } catch (error) {
    console.error('[pull-result] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
