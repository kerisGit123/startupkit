import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userEmail, userName, userId, timestamp } = body;

    // Validate required fields
    if (!message || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send to N8N webhook
    const n8nUrl = `${env.N8N_BASE_URL}${env.N8N_SUPPORT_WEBHOOK_PATH}`;
    const supportEmail = env.EMAIL_SUPPORT || "support@example.com";
    
    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "support_request",
        message,
        user: {
          email: userEmail,
          name: userName,
          id: userId,
        },
        supportEmail,
        timestamp,
        source: "help_center",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send to N8N");
    }

    return NextResponse.json({ 
      success: true,
      message: "Support request submitted successfully" 
    });

  } catch (error) {
    console.error("Error submitting support request:", error);
    return NextResponse.json(
      { error: "Failed to submit support request" },
      { status: 500 }
    );
  }
}
