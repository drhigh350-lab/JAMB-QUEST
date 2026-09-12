import { NextRequest, NextResponse } from "next/server";

/**
 * CORS middleware for API routes
 */
export function setCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

export function handleCorsRequest(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return setCorsHeaders(new NextResponse(null, { status: 200 }));
  }
  return null;
}
