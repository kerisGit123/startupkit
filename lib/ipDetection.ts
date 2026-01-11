// IP Detection and Geolocation Utilities

export interface IpInfo {
  ip: string;
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
}

/**
 * Extract IP address from Next.js request headers
 */
export function getClientIp(request: Request): string {
  // Try various headers in order of preference
  const headers = request.headers;
  
  // Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;
  
  // Standard forwarded headers
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) return xRealIp;
  
  // Fallback
  return 'unknown';
}

/**
 * Get country code from Cloudflare headers (if available)
 */
export function getCountryFromHeaders(request: Request): string | null {
  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry && cfCountry !== 'XX') {
    return cfCountry.toUpperCase();
  }
  return null;
}

/**
 * Fetch IP geolocation data from free API
 * Uses ipapi.co - free tier: 1000 requests/day
 */
export async function getIpGeolocation(ip: string): Promise<IpInfo | null> {
  // Don't try to geolocate local/private IPs
  if (
    ip === 'unknown' || 
    ip.startsWith('192.168.') || 
    ip.startsWith('10.') || 
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip === '::1' ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  ) {
    return { ip, country: 'Local', countryCode: 'LOCAL' };
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      // Don't log on rate limit to avoid spam
      if (response.status !== 429) {
        console.error('IP geolocation API error:', response.status);
      }
      return { ip, country: 'Unknown', countryCode: 'XX' };
    }

    const data = await response.json();

    return {
      ip,
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      region: data.region,
    };
  } catch (error) {
    // Silently fail - don't block on geolocation errors
    return { ip, country: 'Unknown', countryCode: 'XX' };
  }
}

/**
 * Get IP info with fallback to headers
 */
export async function getIpInfo(request: Request): Promise<IpInfo> {
  const ip = getClientIp(request);
  
  // Try Cloudflare headers first (instant)
  const cfCountry = getCountryFromHeaders(request);
  if (cfCountry) {
    return {
      ip,
      countryCode: cfCountry,
      country: cfCountry,
    };
  }
  
  // Fallback to API lookup
  const geoData = await getIpGeolocation(ip);
  if (geoData) {
    return geoData;
  }
  
  // Final fallback
  return { ip };
}
