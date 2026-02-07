import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, rating, comment } = body;

    console.log("Rating API received:", { sessionId, rating, hasComment: !!comment });

    if (!sessionId) {
      console.error("❌ Missing sessionId");
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      console.error("❌ Invalid rating:", rating);
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    console.log("Submitting rating to Convex...");
    await fetchMutation(api.chatbot.submitRating, {
      sessionId,
      rating,
      comment: comment || undefined,
    });

    console.log("✅ Rating stored successfully in Convex");
    return NextResponse.json({ success: true, message: "Rating saved successfully" });
  } catch (error) {
    console.error("❌ Rating submission error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to submit rating", details: String(error) },
      { status: 500 }
    );
  }
}
