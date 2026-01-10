import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";
import { env } from "@/lib/env";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    // Cancel the subscription at period end (user keeps access until billing period ends)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    
    // Type assertion for Stripe subscription response
    const typedSubscription = subscription as any;

    // IMMEDIATELY update Convex database so UI shows warning instantly
    const companyId = typedSubscription.metadata?.companyId;
    if (companyId) {
      const priceId = typedSubscription.items?.data?.[0]?.price?.id;
      let plan = "starter";
      if (priceId === env.PRO_MONTHLY_PRICE_ID) plan = "pro";
      if (priceId === env.STARTER_MONTHLY_PRICE_ID) plan = "starter";
      
      await convex.mutation(api.subscriptions.upsertSubscription, {
        companyId,
        plan,
        stripeCustomerId: typedSubscription.customer as string,
        stripeSubscriptionId: typedSubscription.id,
        currentPeriodEnd: typedSubscription.current_period_end as number,
        cancelAtPeriodEnd: true,  // Set this immediately!
        status: typedSubscription.status,
      });
      
      // Record cancellation in transaction history
      await convex.mutation(api.subscriptions.recordTransaction, {
        companyId,
        action: "canceled",
        plan,
        status: typedSubscription.status,
        stripeCustomerId: typedSubscription.customer as string,
        stripeSubscriptionId: typedSubscription.id,
        source: "user_action",
        eventType: "subscription.canceled",
        currentPeriodEnd: typedSubscription.current_period_end as number,
      });
    }

    return NextResponse.json({ 
      success: true,
      subscription,
      message: "Subscription will be canceled at the end of the billing period"
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to cancel subscription";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
