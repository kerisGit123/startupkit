import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId: callerUserId } = await auth();
  if (!callerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const caller = await client.users.getUser(callerUserId);
  if (caller.publicMetadata?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden — super_admin only" }, { status: 403 });
  }

  const { targetUserId, suspend } = await req.json() as {
    targetUserId?: string;
    suspend?: boolean;
  };

  if (!targetUserId || typeof suspend !== "boolean") {
    return NextResponse.json({ error: "targetUserId and suspend (bool) required" }, { status: 400 });
  }

  if (targetUserId === callerUserId) {
    return NextResponse.json({ error: "Cannot suspend yourself" }, { status: 400 });
  }

  await client.users.updateUser(targetUserId, {
    publicMetadata: { suspended: suspend ? true : undefined },
  });

  return NextResponse.json({
    ok: true,
    targetUserId,
    suspended: suspend,
  });
}
