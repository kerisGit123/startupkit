import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchMutation } from "convex/nextjs";
import { validateUpload } from "@/lib/upload-validation";

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;
    const type = formData.get("type") as "frontend" | "user_panel";
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = validateUpload(file.type, file.name, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get upload URL from Convex
    const uploadUrl = await fetchMutation(api.chatbot.generateUploadUrl);

    // Upload file to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to storage");
    }

    const { storageId } = await uploadResponse.json();

    // Store file message in conversation
    await fetchMutation(api.chatbot.storeFileMessage, {
      sessionId,
      type: type || "frontend",
      fileStorageId: storageId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId: (userId || undefined) as Id<"users"> | undefined,
    });

    // Get the file URL for display
    const fileUrl = await fetchMutation(api.chatbot.getFileUrl, { storageId });

    return NextResponse.json({
      success: true,
      storageId,
      fileUrl: fileUrl || undefined,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
