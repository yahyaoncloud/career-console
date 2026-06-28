import { data } from "react-router";
import { z } from "zod";

/**
 * Standard API Success Response Envelope
 */
export function jsonResponse<T>(
  payload: T,
  options?: {
    message?: string;
    meta?: Record<string, any>;
    status?: number;
    headers?: HeadersInit;
  }
) {
  const { message, meta, status = 200, headers } = options || {};
  return data(
    {
      success: true,
      message,
      data: payload,
      meta,
    },
    { status, headers }
  );
}

/**
 * Standard API Error Response Envelope
 */
export function errorResponse(
  error: unknown,
  options?: {
    code?: string;
    status?: number;
    requestId?: string;
    headers?: HeadersInit;
  }
) {
  const { code = "INTERNAL_ERROR", status = 500, requestId, headers } = options || {};

  if (error instanceof z.ZodError) {
    return data(
      {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
        requestId,
      },
      { status: 422, headers }
    );
  }

  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

  return data(
    {
      success: false,
      error: errorMessage,
      code,
      requestId,
    },
    { status, headers }
  );
}
