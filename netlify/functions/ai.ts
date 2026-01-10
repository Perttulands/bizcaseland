import type { Context } from "@netlify/functions";

/**
 * Netlify Function: AI Proxy for LiteLLM
 *
 * Proxies requests to LiteLLM endpoint with:
 * - API key stored in environment variables (not exposed to client)
 * - Server-Sent Events (SSE) streaming support
 * - Token usage returned in response headers
 * - Rate limiting per client IP
 *
 * Environment Variables Required:
 * - LITELLM_API_KEY: API key for LiteLLM authentication
 * - LITELLM_ENDPOINT: (optional) Override default LiteLLM endpoint
 * - RATE_LIMIT_REQUESTS: (optional) Max requests per window (default: 60)
 * - RATE_LIMIT_WINDOW_MS: (optional) Rate limit window in ms (default: 60000)
 */

const LITELLM_ENDPOINT =
  process.env.LITELLM_ENDPOINT ||
  "https://app-litellmsn66ka.azurewebsites.net";

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = parseInt(
  process.env.RATE_LIMIT_REQUESTS || "60",
  10
);
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "60000",
  10
);

// In-memory rate limit store (resets on function cold start)
// For production, consider using Netlify Blobs or external store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface UsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

function getClientIP(request: Request, context: Context): string {
  // Netlify provides client IP in context
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
    // New window
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

async function handleStreamingResponse(
  upstreamResponse: Response
): Promise<Response> {
  const reader = upstreamResponse.body?.getReader();
  if (!reader) {
    return createErrorResponse(500, "Failed to read upstream response");
  }

  let totalUsage: UsageInfo | null = null;
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          // Parse SSE chunks to extract usage info from final chunk
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.usage) {
                  totalUsage = data.usage;
                }
              } catch {
                // Not valid JSON, continue
              }
            }
          }

          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers":
      "X-Token-Usage-Prompt, X-Token-Usage-Completion, X-Token-Usage-Total",
  };

  // Note: For streaming, usage is typically in the final chunk
  // Client should parse SSE data for usage info
  if (totalUsage) {
    headers["X-Token-Usage-Prompt"] = String(totalUsage.prompt_tokens);
    headers["X-Token-Usage-Completion"] = String(totalUsage.completion_tokens);
    headers["X-Token-Usage-Total"] = String(totalUsage.total_tokens);
  }

  return new Response(stream, { status: 200, headers });
}

async function handleNonStreamingResponse(
  upstreamResponse: Response
): Promise<Response> {
  const data = await upstreamResponse.json();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers":
      "X-Token-Usage-Prompt, X-Token-Usage-Completion, X-Token-Usage-Total",
  };

  if (data.usage) {
    headers["X-Token-Usage-Prompt"] = String(data.usage.prompt_tokens || 0);
    headers["X-Token-Usage-Completion"] = String(
      data.usage.completion_tokens || 0
    );
    headers["X-Token-Usage-Total"] = String(data.usage.total_tokens || 0);
  }

  return new Response(JSON.stringify(data), {
    status: upstreamResponse.status,
    headers,
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

  // Only allow POST requests
  if (request.method !== "POST") {
    return createErrorResponse(405, "Method not allowed");
  }

  // Check API key configuration
  const apiKey = process.env.LITELLM_API_KEY;
  if (!apiKey) {
    console.error("LITELLM_API_KEY environment variable not configured");
    return createErrorResponse(500, "Server configuration error");
  }

  // Rate limiting
  const clientIP = getClientIP(request, context);
  const rateLimit = checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    return createErrorResponse(429, "Rate limit exceeded", {
      "Retry-After": String(
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      ),
      "X-RateLimit-Limit": String(RATE_LIMIT_REQUESTS),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
    });
  }

  // Parse request body
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse(400, "Invalid JSON body");
  }

  // Validate required fields
  if (!body.messages || !Array.isArray(body.messages)) {
    return createErrorResponse(400, "messages array is required");
  }

  // Default model if not specified
  const model = body.model || "google/gemini-2.0-flash";

  // Prepare upstream request
  const upstreamBody = {
    model,
    messages: body.messages,
    stream: body.stream ?? false,
    temperature: body.temperature ?? 0.7,
    max_tokens: body.max_tokens ?? 2048,
  };

  try {
    const upstreamResponse = await fetch(
      `${LITELLM_ENDPOINT}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(upstreamBody),
      }
    );

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      console.error(`LiteLLM error: ${upstreamResponse.status} - ${errorText}`);
      return createErrorResponse(
        upstreamResponse.status,
        `Upstream error: ${upstreamResponse.statusText}`
      );
    }

    // Add rate limit headers to response
    const rateLimitHeaders = {
      "X-RateLimit-Limit": String(RATE_LIMIT_REQUESTS),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
    };

    if (body.stream) {
      const response = await handleStreamingResponse(upstreamResponse);
      // Add rate limit headers to streaming response
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    } else {
      const response = await handleNonStreamingResponse(upstreamResponse);
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return createErrorResponse(500, "Failed to connect to AI service");
  }
}

export const config = {
  path: "/api/ai",
};
