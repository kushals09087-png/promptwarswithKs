import { NextResponse } from "next/server";

export type DomainErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode | string,
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * Standard API error responder ensuring safe, non-leaking error responses across all route handlers.
 */
export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/**
 * Standard API success responder ensuring consistent `{ success: true, data }` response envelope.
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Central safe error handler converting unknown exceptions into standard sanitized HTTP responses.
 */
export function handleApiError(err: unknown) {
  if (err instanceof DomainError) {
    return apiError(err.code, err.message, err.status);
  }
  const msg = err instanceof Error ? err.message : "An unexpected server error occurred.";
  return apiError("INTERNAL_ERROR", msg, 500);
}
