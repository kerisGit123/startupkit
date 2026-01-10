import { z } from "zod";

const EnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STARTER_MONTHLY_PRICE_ID: z.string().min(1),
  PRO_MONTHLY_PRICE_ID: z.string().min(1),
  STARTER_YEARLY_PRICE_ID: z.string().min(1),
  PRO_YEARLY_PRICE_ID: z.string().min(1),
  N8N_BASE_URL: z.string().url().optional(),
  N8N_SCAN_WEBHOOK_PATH: z.string().optional(),
  N8N_SUPPORT_WEBHOOK_PATH: z.string().optional(),
  N8N_CALLBACK_SHARED_SECRET: z.string().optional(),
  N8N_CALLBACK_URL: z.string().url().optional(),
  EMAIL_SUPPORT: z.string().email().optional(),
  FREE_STORAGE_MB: z.string().optional(),
  STARTER_STORAGE_MB: z.string().optional(),
  PRO_STORAGE_MB: z.string().optional(),
});

export const env = EnvSchema.parse({
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STARTER_MONTHLY_PRICE_ID: process.env.STARTER_MONTHLY_PRICE_ID,
  PRO_MONTHLY_PRICE_ID: process.env.PRO_MONTHLY_PRICE_ID,
  STARTER_YEARLY_PRICE_ID: process.env.STARTER_YEARLY_PRICE_ID,
  PRO_YEARLY_PRICE_ID: process.env.PRO_YEARLY_PRICE_ID,
  N8N_BASE_URL: process.env.N8N_BASE_URL,
  N8N_SCAN_WEBHOOK_PATH: process.env.N8N_SCAN_WEBHOOK_PATH,
  N8N_SUPPORT_WEBHOOK_PATH: process.env.N8N_SUPPORT_WEBHOOK_PATH,
  N8N_CALLBACK_SHARED_SECRET: process.env.N8N_CALLBACK_SHARED_SECRET,
  N8N_CALLBACK_URL: process.env.N8N_CALLBACK_URL,
  EMAIL_SUPPORT: process.env.EMAIL_SUPPORT,
  FREE_STORAGE_MB: process.env.FREE_STORAGE_MB,
  STARTER_STORAGE_MB: process.env.STARTER_STORAGE_MB,
  PRO_STORAGE_MB: process.env.PRO_STORAGE_MB,
});

export function buildN8nScanUrl(params: {
  orgid: string;
  imageurl: string;
  action: "invoice" | "expense" | "bank";
}): string {
  if (!env.N8N_BASE_URL || !env.N8N_SCAN_WEBHOOK_PATH) {
    throw new Error("N8N configuration is not set");
  }
  
  const base = env.N8N_BASE_URL.replace(/\/$/, "");
  const path = env.N8N_SCAN_WEBHOOK_PATH;
  const url = new URL(`${base}${path}`);
  url.searchParams.set("orgid", params.orgid);
  url.searchParams.set("imageurl", params.imageurl);
  url.searchParams.set("action", params.action);
  return url.toString();
}
