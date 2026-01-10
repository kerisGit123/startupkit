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
        if (md.type === "credits") {
          const companyId = md.companyId;
          const tokens = Number(md.tokens || 0);
          const amountPaid = pi.amount_received || pi.amount;
          const currency = pi.currency || md.currency;
          
          if (companyId && tokens > 0) {
            await convex.mutation(api.credits.addCredits, {
              companyId,
              tokens,
              stripePaymentIntentId: pi.id,
              stripeCheckoutSessionId: undefined,
              amountPaid,
              currency,
            });
          }
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as any;
        
        if (session.mode === "payment" && session.metadata?.type === "credits") {
          const companyId = session.metadata?.companyId;
          const tokens = Number(session.metadata?.tokens || 0);
          const amountPaid = session.amount_total;
          const currency = session.currency;
          
          if (companyId && tokens > 0) {
            await convex.mutation(api.credits.addCredits, {
              companyId,
              tokens,
              stripePaymentIntentId: session.payment_intent,
              stripeCheckoutSessionId: session.id,
              amountPaid,
              currency,
            });
          }
          break;
        }

        const companyId = session.metadata?.companyId;
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        const planFromMetadata = session.metadata?.plan || "starter";
        
        if (companyId) {
          await convex.mutation(api.subscriptions.upsertSubscription, {
            companyId,
            plan: planFromMetadata,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            currentPeriodEnd: undefined,
            status: "active",
          });
          
          await convex.mutation(api.subscriptions.recordTransaction, {
            companyId,
            action: "checkout_completed",
            plan: planFromMetadata,
            status: "active",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            source: "stripe",
            eventType: "checkout.session.completed",
          });
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
          
          await convex.mutation(api.subscriptions.recordTransaction, {
            companyId,
            action: event.type.endsWith("created") ? "created" : "updated",
            plan,
            status: sub.status,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            source: "stripe",
            eventType: event.type,
            currentPeriodEnd: sub.current_period_end,
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
        
        await convex.mutation(api.subscriptions.recordTransaction, {
          companyId: companyId || "",
          action: "deleted",
          plan: "free",
          status: sub.status,
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          source: "stripe",
          eventType: event.type,
          currentPeriodEnd: sub.current_period_end,
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
