/**
 * KIE AI Response Code handling utility.
 *
 * Centralizes response code interpretation and file record updates
 * so all generation paths (image, video, callback) use consistent logic.
 */

import { ConvexHttpClient } from "convex/browser";

// KIE AI response code definitions
export const KIE_RESPONSE_CODES: Record<number, { label: string; severity: "success" | "warning" | "error" }> = {
  200: { label: "Success", severity: "success" },
  401: { label: "Unauthorized", severity: "error" },
  402: { label: "Insufficient Credits", severity: "error" },
  404: { label: "Not Found", severity: "error" },
  422: { label: "Validation Error", severity: "error" },
  429: { label: "Rate Limited", severity: "warning" },
  455: { label: "Service Unavailable", severity: "error" },
  500: { label: "Server Error", severity: "error" },
  501: { label: "Generation Failed", severity: "error" },
  505: { label: "Feature Disabled", severity: "error" },
};

/**
 * Get human-readable label and severity for a KIE AI response code.
 */
export function getResponseCodeInfo(code?: number): { label: string; severity: "success" | "warning" | "error" } {
  if (!code) return { label: "Unknown", severity: "warning" };
  return KIE_RESPONSE_CODES[code] || { label: `Error ${code}`, severity: "error" };
}

/**
 * Check if a response code indicates success.
 */
export function isSuccessCode(code?: number): boolean {
  return code === 200;
}

/**
 * Extract response code and message from a KIE AI response body.
 * Works for both initial task creation and callback responses.
 */
export function extractKieResponse(data: any): {
  responseCode: number | undefined;
  responseMessage: string | undefined;
  taskId: string | undefined;
  state: string | undefined;
} {
  // Callback format: { code, data: { state, failCode, failMsg, taskId } }
  // Initial format: { code, msg, data: { taskId, recordId } }
  const code = data?.code ?? data?.data?.code;
  const msg = data?.data?.failMsg || data?.msg || data?.data?.msg;
  const taskId = data?.data?.taskId || data?.data?.recordId || data?.taskId || data?.recordId || data?.data?.id;

  let state = data?.data?.state;
  // Normalize "fail" to "failed"
  if (state === "fail") state = "failed";

  return {
    responseCode: typeof code === "number" ? code : (typeof code === "string" ? parseInt(code) || undefined : undefined),
    responseMessage: msg,
    taskId,
    state,
  };
}

/**
 * Store response code/message in a storyboard_files record and handle
 * credit refund if the response indicates failure.
 *
 * Call this after receiving a KIE AI response (both initial and callback).
 */
export async function handleKieResponse(params: {
  fileId: string;
  responseData: any;
  companyId?: string;
  creditsUsed?: number;
  modelName?: string;
}): Promise<{
  responseCode: number | undefined;
  responseMessage: string | undefined;
  taskId: string | undefined;
  isSuccess: boolean;
}> {
  const { api } = await import("../../convex/_generated/api");
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  const { responseCode, responseMessage, taskId, state } = extractKieResponse(params.responseData);
  const isSuccess = isSuccessCode(responseCode);

  // Refund credits on failure (before updating file record)
  if (!isSuccess && params.companyId && params.creditsUsed) {
    await convex.mutation(api.credits.refundCredits, {
      companyId: params.companyId,
      tokens: params.creditsUsed,
      reason: `AI Generation Failed (${responseCode}) - ${responseMessage || params.modelName || "Unknown"}`,
    });
    console.log(`[handleKieResponse] Refunded ${params.creditsUsed} credits for failed generation (code: ${responseCode})`);
  }

  // Update file record with response info + zero out creditsUsed if refunded
  await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
    fileId: params.fileId as any,
    taskId,
    status: isSuccess ? "processing" : "failed",
    responseCode,
    responseMessage,
    ...((!isSuccess && params.creditsUsed) ? { creditsUsed: 0 } : {}),
  });

  return { responseCode, responseMessage, taskId, isSuccess };
}

/**
 * Get the CSS color class for a response code badge.
 */
export function getResponseCodeColor(code?: number): string {
  if (!code) return "bg-gray-500/20 text-gray-400";
  const info = getResponseCodeInfo(code);
  switch (info.severity) {
    case "success":
      return "bg-emerald-500/20 text-emerald-400";
    case "warning":
      return "bg-amber-500/20 text-amber-400";
    case "error":
      return "bg-red-500/20 text-red-400";
  }
}
