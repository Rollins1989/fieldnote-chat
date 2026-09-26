export class AppError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

export function errorResponse(error, requestId, headers) {
  const known = error instanceof AppError;
  return json({
    error: {
      code: known ? error.code : "INTERNAL_ERROR",
      message: known ? error.message : "Unexpected server error.",
      request_id: requestId
    }
  }, known ? error.status : 500, headers);
}

export function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store"
  };
}

export function corsHeaders(request, allowedOrigins) {
  const origin = request.headers.get("Origin");
  const allowed = allowedOrigins.has(origin);
  return {
    ...securityHeaders(),
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
