import { NextRequest, NextResponse } from "next/server";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    
    const providedSecret = req.headers.get("x-n8n-secret") || json.secret;
    if (providedSecret !== process.env.N8N_CALLBACK_SHARED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expenseId = json.expenseId;
    if (!expenseId) {
      return NextResponse.json({ error: "expenseId required" }, { status: 400 });
    }

    const merchantName = json.merchantName || json["Merchant Name"] || "";
    const transactionDate = json.transactionDate || json["Date"] || "";
    const transactionAmount = String(json.total || json["Total"] || "");
    const items = json.items || [];

    console.log("N8N callback received:", { expenseId, merchantName, transactionDate, transactionAmount });

    return NextResponse.json({ success: true, message: "Callback received" });
  } catch (err) {
    console.error("N8N callback error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
