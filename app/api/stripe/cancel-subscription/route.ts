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

    // IMMEDIATELY update Convex database so UI shows warning instantly
    const companyId = subscription.metadata?.companyId;
    if (companyId) {
      const priceId = subscription.items?.data?.[0]?.price?.id;
      let plan = "starter";
      if (priceId === env.PRO_MONTHLY_PRICE_ID) plan = "pro";
      if (priceId === env.STARTER_MONTHLY_PRICE_ID) plan = "starter";
      
      await convex.mutation(api.subscriptions.upsertSubscription, {
        companyId,
        plan,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: true,  // Set this immediately!
        status: subscription.status,
      });
      
      // Record cancellation in transaction history
      await convex.mutation(api.subscriptions.recordTransaction, {
        companyId,
        action: "canceled",
        plan,
        status: subscription.status,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        source: "user_action",
        eventType: "subscription.canceled",
        currentPeriodEnd: subscription.current_period_end,
      });
    }

    return NextResponse.json({ 
      success: true,
      subscription,
      message: "Subscription will be canceled at the end of the billing period"
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
