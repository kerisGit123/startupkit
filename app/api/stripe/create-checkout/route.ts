import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, billingCycle, companyId, type, tokens, amount } = body;

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`;

    // Credits purchase (one-time payment)
    if (type === "credits") {
      if (!tokens || !amount) {
        return NextResponse.json({ error: "Missing tokens or amount" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "myr",
              product_data: {
                name: `${tokens} Credits`,
                description: `One-time purchase of ${tokens} credits`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "credits",
          companyId,
          tokens: tokens.toString(),
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return NextResponse.json({ url: session.url });
    }

    // Subscription checkout
    if (!planId || planId === "free") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    let priceId: string | undefined;
    
    if (planId === "starter") {
      priceId = billingCycle === "yearly" 
        ? env.STARTER_YEARLY_PRICE_ID 
        : env.STARTER_MONTHLY_PRICE_ID;
    } else if (planId === "pro") {
      priceId = billingCycle === "yearly" 
        ? env.PRO_YEARLY_PRICE_ID 
        : env.PRO_MONTHLY_PRICE_ID;
    }

    if (!priceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        companyId,
        plan: planId,
      },
      subscription_data: {
        metadata: {
          companyId,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
