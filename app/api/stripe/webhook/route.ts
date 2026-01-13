import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

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
      case "payment_intent.succeeded": {
        const pi = event.data.object as any;
        const md = pi.metadata || {};
        console.log("[WEBHOOK] payment_intent.succeeded", { metadata: md, piId: pi.id });
        
        if (md.type === "credits") {
          const companyId = md.companyId;
          const userId = md.userId || undefined;
          const tokens = Number(md.tokens || 0);
          const amountPaid = pi.amount_received || pi.amount;
          const currency = pi.currency || md.currency;
          
          console.log("[WEBHOOK] Processing credit purchase", { companyId, userId, tokens, amountPaid, currency });
          
          if (companyId && tokens > 0) {
            try {
              const result = await convex.mutation(api.transactions.createTransaction.createPaymentTransaction, {
                companyId,
                userId: userId as any,
                amount: amountPaid,
                currency,
                tokens,
                stripePaymentIntentId: pi.id,
              });
              console.log("[WEBHOOK] Credit purchase transaction created", result);
            } catch (error) {
              console.error("[WEBHOOK] Failed to create payment transaction", error);
              throw error;
            }
          } else {
            console.log("[WEBHOOK] Skipping - invalid companyId or tokens", { companyId, tokens });
          }
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as any;
        console.log("[WEBHOOK] checkout.session.completed", { 
          sessionId: session.id, 
          mode: session.mode, 
          metadata: session.metadata 
        });
        
        if (session.mode === "payment" && session.metadata?.type === "credits") {
          const companyId = session.metadata?.companyId;
          const userId = session.metadata?.userId || undefined;
          const tokens = Number(session.metadata?.tokens || 0);
          const amountPaid = session.amount_total;
          const currency = session.currency;
          
          console.log("[WEBHOOK] Processing checkout credit purchase", { companyId, userId, tokens, amountPaid, currency });
          
          if (companyId && tokens > 0) {
            try {
              const result = await convex.mutation(api.transactions.createTransaction.createPaymentTransaction, {
                companyId,
                userId: userId as any,
                amount: amountPaid,
                currency,
                tokens,
                stripePaymentIntentId: session.payment_intent as string,
                stripeCheckoutSessionId: session.id,
              });
              console.log("[WEBHOOK] Checkout credit purchase transaction created", result);
            } catch (error) {
              console.error("[WEBHOOK] Failed to create checkout payment transaction", error);
              throw error;
            }
          } else {
            console.log("[WEBHOOK] Skipping checkout - invalid companyId or tokens", { companyId, tokens });
          }
          break;
        }

        const companyId = session.metadata?.companyId;
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        const planFromMetadata = session.metadata?.plan || "starter";
        
        console.log("[WEBHOOK] Processing subscription checkout", { companyId, subscriptionId, plan: planFromMetadata });
        
        if (companyId) {
          try {
            await convex.mutation(api.subscriptions.upsertSubscription, {
              companyId,
              plan: planFromMetadata,
              stripeCustomerId: customerId as string,
              stripeSubscriptionId: subscriptionId as string,
              currentPeriodEnd: undefined,
              status: "active",
            });
            console.log("[WEBHOOK] Subscription upserted");
            
            // NEW: Create transaction with invoice for subscription
            const result = await convex.mutation(api.transactions.createTransaction.createSubscriptionTransaction, {
              companyId,
              userId: session.metadata?.userId as any,
              amount: session.amount_total || 0,
              currency: session.currency || "usd",
              plan: planFromMetadata,
              status: "active",
              action: "created",
              stripeSubscriptionId: subscriptionId as string,
              stripeCustomerId: customerId as string,
              eventType: "checkout.session.completed",
              source: "stripe",
            });
            console.log("[WEBHOOK] Subscription transaction created", result);
          } catch (error) {
            console.error("[WEBHOOK] Failed to process subscription", error);
            throw error;
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as any;
        const companyId = sub.metadata?.companyId;
        
        let plan = "starter";
        const priceId = sub.items?.data?.[0]?.price?.id;
        if (priceId === env.PRO_MONTHLY_PRICE_ID) plan = "pro";
        if (priceId === env.STARTER_MONTHLY_PRICE_ID) plan = "starter";
        
        if (companyId) {
          await convex.mutation(api.subscriptions.upsertSubscription, {
            companyId,
            plan,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end || false,
            status: sub.status,
          });
          
          // NEW: Create transaction with invoice for subscription update
          const amount = sub.items?.data?.[0]?.price?.unit_amount || 0;
          await convex.mutation(api.transactions.createTransaction.createSubscriptionTransaction, {
            companyId,
            userId: sub.metadata?.userId,
            amount,
            currency: sub.currency || "usd",
            plan,
            status: sub.status,
            action: event.type.endsWith("created") ? "created" : "updated",
            stripeSubscriptionId: sub.id,
            stripeCustomerId: sub.customer,
            eventType: event.type,
            currentPeriodEnd: sub.current_period_end,
            source: "stripe",
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const companyId = sub.metadata?.companyId;
        
        await convex.mutation(api.subscriptions.upsertSubscription, {
          companyId: companyId || "",
          plan: "free",
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: sub.current_period_end,
          status: sub.status,
        });
        
        // Record cancellation (no invoice needed for cancellations)
        await convex.mutation(api.transactions.createTransaction.createSubscriptionTransaction, {
          companyId: companyId || "",
          userId: sub.metadata?.userId,
          amount: 0,
          currency: "usd",
          plan: "free",
          status: sub.status,
          action: "cancelled",
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer,
          eventType: event.type,
          currentPeriodEnd: sub.current_period_end,
          source: "stripe",
        });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
