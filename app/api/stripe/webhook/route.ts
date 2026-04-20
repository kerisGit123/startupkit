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
      // ─── Credit top-up via Checkout Session ─────────────────────────
      // SINGLE source of truth for credit-purchase events. Stripe also
      // fires `payment_intent.succeeded` for every Checkout-Session
      // payment; we deliberately do NOT handle that event here, because
      // both events have the same metadata and would double-grant credits
      // (createPaymentTransaction's idempotency check now also defends
      // against this, but skipping the duplicate event is cleaner).
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
              purchaserClerkUserId: userId,
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

      // ─── Stripe refund → proportional credit reversal ───────────────
      // When Stripe issues a refund (dashboard, dispute, or programmatic)
      // we claw back credits proportional to the refund amount so a user
      // can't keep credits they got a refund for.
      case "charge.refunded": {
        const charge = event.data.object as any;
        // charge.refunds is an expandable list; grab the most-recent entry
        const refund = charge.refunds?.data?.[0];
        if (!refund) {
          console.log("[WEBHOOK] charge.refunded — no refund object, skipping");
          break;
        }
        console.log("[WEBHOOK] charge.refunded", {
          chargeId: charge.id,
          piId: charge.payment_intent,
          refundId: refund.id,
          refundAmount: refund.amount,
        });
        if (!charge.payment_intent) {
          console.log("[WEBHOOK] charge.refunded — no payment_intent, skipping");
          break;
        }
        try {
          const result = await convex.mutation(
            api.credits.reverseCreditsOnRefund,
            {
              stripePaymentIntentId: charge.payment_intent as string,
              stripeChargeId: charge.id as string,
              stripeRefundId: refund.id as string,
              refundAmountCents: refund.amount as number,
            },
          );
          console.log("[WEBHOOK] Credit reversal result", result);
        } catch (err) {
          console.error("[WEBHOOK] Failed to reverse credits on refund", err);
          throw err;
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
