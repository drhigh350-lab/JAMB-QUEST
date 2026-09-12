/**
 * Error handling middleware for API routes
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: any) {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
    };
  }

  console.error("Unhandled error:", error);
  return {
    statusCode: 500,
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  };
}
