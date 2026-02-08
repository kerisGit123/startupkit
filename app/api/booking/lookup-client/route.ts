import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function POST(req: NextRequest) {
  const convex = getConvex();
  try {
    const body = await req.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Either email or phone is required" },
        { status: 400 }
      );
    }

    // Search for client by email or phone
    const clients = await convex.query(api.contacts.searchContacts, {
      query: email || phone || "",
    });

    console.log("Search query:", email || phone);
    console.log("Found clients:", clients.length);
    console.log("Clients data:", clients.map(c => ({ 
      name: c.name, 
      email: c.email, 
      contactPersonEmail: c.contactPersonEmail 
    })));

    // Find exact match
    const client = clients.find(
      (c) =>
        (email && (
          c.email?.toLowerCase() === email.toLowerCase() ||
          c.contactPersonEmail?.toLowerCase() === email.toLowerCase()
        )) ||
        (phone && c.phone === phone)
    );

    console.log("Exact match found:", !!client);

    if (!client) {
      return NextResponse.json({
        found: false,
        message: "Client not found",
      });
    }

    return NextResponse.json({
      found: true,
      client: {
        id: client._id,
        name: client.name,
        email: client.email || client.contactPersonEmail,
        phone: client.phone || client.contactPersonPhone,
        company: client.company,
        contactPersonName: client.contactPersonName,
      },
    });
  } catch (error) {
    console.error("Client lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup client", message: (error as Error).message },
      { status: 500 }
    );
  }
}
