import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function GET(request: NextRequest) {
  const convex = getConvex();
  try {
    const ip = request.nextUrl.searchParams.get('ip');
    const country = request.nextUrl.searchParams.get('country');

    if (!ip) {
      return NextResponse.json({ blocked: false });
    }

    // Check IP blacklist
    const ipCheck = await convex.query(api.ipBlocking.checkIpBlocked, { ipAddress: ip });
    if (ipCheck.blocked) {
      return NextResponse.json({
        blocked: true,
        reason: ipCheck.reason || 'Your IP address has been blocked',
        type: 'ip',
      });
    }

    // Check country blacklist
    if (country) {
      const countryCheck = await convex.query(api.ipBlocking.checkCountryBlocked, { countryCode: country });
      if (countryCheck.blocked) {
        return NextResponse.json({
          blocked: true,
          reason: countryCheck.reason || `Access from ${countryCheck.countryName} is not allowed`,
          type: 'country',
        });
      }
    }

    return NextResponse.json({ blocked: false });
  } catch (error) {
    console.error('Access check error:', error);
    // Don't block on error
    return NextResponse.json({ blocked: false });
  }
}
