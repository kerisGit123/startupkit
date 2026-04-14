import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

/**
 * Stripe webhook — credit top-ups only.
 *
 * Subscriptions are now handled by Clerk Billing (via <PricingTable />),
 * so this webhook no longer processes subscription events. It only
 * processes one-time payments for credit top-up purchases.
 *
 * Model B: top-ups are always deposited to the user's personal workspace
 * (the `companyId` in session metadata is always `user.id`).
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: any;
  try {
    const text = await req.text();
    event = stripe.webhooks.constructEvent(text, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ─── Credit top-up via PaymentIntent ────────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as any;
        const md = pi.metadata || {};
        console.log("[WEBHOOK] payment_intent.succeeded", {
          metadata: md,
          piId: pi.id,
        });

        if (md.type !== "credits") break;

        const companyId = md.companyId;
        const userId = md.userId || undefined;
        const tokens = Number(md.tokens || 0);
        const amountPaid = pi.amount_received || pi.amount;
        const currency = pi.currency || md.currency;

        console.log("[WEBHOOK] Processing credit purchase", {
          companyId,
          userId,
          tokens,
          amountPaid,
          currency,
        });

        if (!companyId || tokens <= 0) {
          console.log("[WEBHOOK] Skipping - invalid companyId or tokens");
          break;
        }

        try {
          const result = await convex.mutation(
            api.transactions.createTransaction.createPaymentTransaction,
            {
              companyId,
              userId: userId as any,
              amount: amountPaid,
              currency,
              tokens,
              stripePaymentIntentId: pi.id,
            },
          );
          console.log("[WEBHOOK] Credit purchase transaction created", result);
        } catch (error) {
          console.error("[WEBHOOK] Failed to create payment transaction", error);
          throw error;
        }
        break;
      }

      // ─── Credit top-up via Checkout Session ─────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as any;
        console.log("[WEBHOOK] checkout.session.completed", {
          sessionId: session.id,
          mode: session.mode,
          metadata: session.metadata,
        });

        // Only handle credit top-ups. Subscription sessions are managed
        // by Clerk Billing and never land here.
        if (
          session.mode !== "payment" ||
          session.metadata?.type !== "credits"
        ) {
          console.log(
            "[WEBHOOK] Ignoring non-credit checkout.session.completed",
          );
          break;
        }

        const companyId = session.metadata?.companyId;
        const userId = session.metadata?.userId || undefined;
        const tokens = Number(session.metadata?.tokens || 0);
        const amountPaid = session.amount_total;
        const currency = session.currency;

        console.log("[WEBHOOK] Processing checkout credit purchase", {
          companyId,
          userId,
          tokens,
          amountPaid,
          currency,
        });

        if (!companyId || tokens <= 0) {
          console.log("[WEBHOOK] Skipping - invalid companyId or tokens");
          break;
        }

        try {
          const result = await convex.mutation(
            api.transactions.createTransaction.createPaymentTransaction,
            {
              companyId,
              userId: userId as any,
              amount: amountPaid,
              currency,
              tokens,
              stripePaymentIntentId: session.payment_intent as string,
              stripeCheckoutSessionId: session.id,
            },
          );
          console.log(
            "[WEBHOOK] Checkout credit purchase transaction created",
            result,
          );
        } catch (error) {
          console.error(
            "[WEBHOOK] Failed to create checkout payment transaction",
            error,
          );
          throw error;
        }
        break;
      }

      // Legacy subscription events are NOT handled here anymore.
      // Clerk Billing manages subscriptions end-to-end.
      default:
        console.log("[WEBHOOK] Ignoring event type:", event.type);
        break;
    }
  } catch (err) {
    console.error("Webhook handler error", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
