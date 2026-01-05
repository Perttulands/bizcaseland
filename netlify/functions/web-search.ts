import type { Context } from "@netlify/functions";

/**
 * Netlify Function: Web Search Proxy
 *
 * Proxies search requests to Brave Search API with:
 * - API key stored in environment variables
 * - Domain allowlist for trusted market research sources
 * - Rate limiting per client IP
 * - Source citation formatting
 *
 * Environment Variables Required:
 * - BRAVE_SEARCH_API_KEY: API key for Brave Search
 */

const BRAVE_SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";

// Trusted domains for market research (allowlist)
const TRUSTED_DOMAINS = [
  // Market research firms
  "statista.com",
  "gartner.com",
  "forrester.com",
  "mckinsey.com",
  "bcg.com",
  "bain.com",
  "deloitte.com",
  "pwc.com",
  "ey.com",
  "kpmg.com",
  "accenture.com",
  
  // Business publications
  "bloomberg.com",
  "reuters.com",
  "wsj.com",
  "ft.com",
  "economist.com",
  "forbes.com",
  "businessinsider.com",
  "hbr.org",
  
  // Data sources
  "worldbank.org",
  "imf.org",
  "oecd.org",
  "eurostat.ec.europa.eu",
  "census.gov",
  "bls.gov",
  
  // Industry sources
  "ibisworld.com",
  "marketwatch.com",
  "yahoo.com",
  "tradingeconomics.com",
  "investing.com",
  
  // Tech research
  "techcrunch.com",
  "venturebeat.com",
  "crunchbase.com",
  "pitchbook.com",
  
  // Academic
  "scholar.google.com",
  "researchgate.net",
  "ssrn.com",
  "arxiv.org",
];

// Rate limiting
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface SearchResult {
  title: string;
  url: string;
  description: string;
  domain: string;
  publishedDate?: string;
  isTrusted: boolean;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalResults: number;
  trustedCount: number;
}

function getClientIP(request: Request, context: Context): string {
  return (
    context.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(clientIP: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(clientIP);

  if (!record || now >= record.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(clientIP, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1, resetAt };
  }

  if (record.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_REQUESTS - record.count,
    resetAt: record.resetAt,
  };
}

function getDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. prefix
    return hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isTrustedDomain(domain: string): boolean {
  return TRUSTED_DOMAINS.some(
    (trusted) => domain === trusted || domain.endsWith(`.${trusted}`)
  );
}

function createErrorResponse(
  status: number,
  message: string,
  headers?: Record<string, string>
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...headers,
    },
  });
}

export default async function handler(
  request: Request,
  context: Context
): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Only allow POST
  if (request.method !== "POST") {
    return createErrorResponse(405, "Method not allowed");
  }

  // Check API key
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    console.error("BRAVE_SEARCH_API_KEY not configured");
    return createErrorResponse(500, "Search service not configured");
  }

  // Rate limiting
  const clientIP = getClientIP(request, context);
  const rateLimit = checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    return createErrorResponse(429, "Rate limit exceeded", {
      "Retry-After": String(
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      ),
    });
  }

  // Parse request
  let body: { query: string; count?: number; freshness?: string };
  try {
    body = await request.json();
  } catch {
    return createErrorResponse(400, "Invalid JSON body");
  }

  if (!body.query || typeof body.query !== "string") {
    return createErrorResponse(400, "Query is required");
  }

  // Build search URL
  const searchParams = new URLSearchParams({
    q: body.query,
    count: String(body.count || 10),
    result_filter: "web",
    safesearch: "moderate",
  });

  if (body.freshness) {
    searchParams.set("freshness", body.freshness);
  }

  try {
    const searchResponse = await fetch(
      `${BRAVE_SEARCH_ENDPOINT}?${searchParams}`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
      }
    );

    if (!searchResponse.ok) {
      console.error(`Brave Search error: ${searchResponse.status}`);
      return createErrorResponse(
        searchResponse.status,
        "Search service error"
      );
    }

    const data = await searchResponse.json();

    // Transform and filter results
    const results: SearchResult[] = (data.web?.results || []).map(
      (result: {
        title: string;
        url: string;
        description: string;
        page_age?: string;
      }) => {
        const domain = getDomain(result.url);
        return {
          title: result.title,
          url: result.url,
          description: result.description,
          domain,
          publishedDate: result.page_age,
          isTrusted: isTrustedDomain(domain),
        };
      }
    );

    // Sort: trusted sources first
    results.sort((a, b) => {
      if (a.isTrusted && !b.isTrusted) return -1;
      if (!a.isTrusted && b.isTrusted) return 1;
      return 0;
    });

    const response: SearchResponse = {
      results,
      query: body.query,
      totalResults: results.length,
      trustedCount: results.filter((r) => r.isTrusted).length,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return createErrorResponse(500, "Search request failed");
  }
}

export const config = {
  path: "/api/web-search",
};
