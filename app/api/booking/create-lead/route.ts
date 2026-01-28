import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, company, source, notes } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if contact already exists
    const existingContacts = await convex.query(api.contacts.searchContacts, {
      query: email,
    });

    const existingContact = existingContacts.find(
      (c) => c.email?.toLowerCase() === email.toLowerCase()
    );

    let contactId;

    if (existingContact) {
      // Use existing contact
      contactId = existingContact._id;
    } else {
      // Create new contact
      contactId = await convex.mutation(api.contacts.createContact, {
        name,
        email,
        phone: phone || undefined,
        company: company || undefined,
        leadSource: source || "chatbot",
        tags: ["chatbot-lead"],
        type: "lead",
        lifecycleStage: "prospect",
      });
    }

    // Create lead entry
    const leadId = await convex.mutation(api.leads.createLead, {
      name,
      email,
      phone: phone || undefined,
      source: source || "chatbot",
      status: "new",
      message: notes || "Lead captured via chatbot",
    });

    return NextResponse.json({
      success: true,
      contactId,
      leadId,
      message: "Lead created successfully",
    });
  } catch (error) {
    console.error("Create lead error:", error);
    return NextResponse.json(
      { error: "Failed to create lead", message: (error as Error).message },
      { status: 500 }
    );
  }
}
