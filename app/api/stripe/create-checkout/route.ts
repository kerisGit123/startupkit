import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";

/**
 * Stripe checkout creation — credit top-ups only.
 *
 * Subscriptions are handled by Clerk Billing via <PricingTable />. This
 * route no longer creates subscription sessions; it only creates one-time
 * payment sessions for credit top-up packs.
 *
 * Model B: the deposit target is always the user's personal workspace
 * (companyId === user.id), regardless of which org the caller was viewing.
 * The user then distributes credits to owned orgs via the Transfer Credits
 * dialog.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      companyId: requestedCompanyId, // context only — not the deposit target
      type,
      tokens,
      amount,
    } = body;

    if (type !== "credits") {
      return NextResponse.json(
        {
          error:
            "This endpoint only handles credit top-ups. Subscriptions are managed by Clerk Billing via <PricingTable />.",
        },
        { status: 400 },
      );
    }

    if (!tokens || !amount) {
      return NextResponse.json(
        { error: "Missing tokens or amount" },
        { status: 400 },
      );
    }

    // Model B: ALL inflows land in the user's personal workspace.
    const depositCompanyId = userId;

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
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
        // Model B: deposit target is always personal workspace
        companyId: depositCompanyId,
        userId,
        // For audit: where the user was when they clicked Buy
        requestedCompanyId: requestedCompanyId ?? depositCompanyId,
        tokens: tokens.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
