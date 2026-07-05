import { NextResponse } from 'next/server';
import { ErrorCodes, ApiError, getErrorMessage } from './error-codes';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  limit: number;
  cursor?: string;
  hasMore: boolean;
}

/**
 * Standard API success response
 */
export function jsonSuccess<T>(
  data: T,
  status: number = 200,
  pagination?: PaginationMeta
): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
    pagination,
  }, { status });
}

/**
 * Paginated response helper
 */
export function jsonPaginated<T>(
  data: T,
  pagination: PaginationMeta,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
    pagination,
  }, { status });
}

/**
 * Standard API error response using ApiError
 */
export function jsonError(
  error: string,
  status: number = 500,
  code: string = ErrorCodes.INTERNAL_ERROR
): NextResponse<ApiResponse> {
  return NextResponse.json<ApiResponse>(
    new ApiError(code as any, error, status).toJSON(),
    { status }
  );
}

/**
 * Validation error response
 */
export function jsonValidationError(
  errors: Array<{ path: (string | number)[]; message: string }>
): NextResponse<ApiResponse> {
  return NextResponse.json<ApiResponse>(
    new ApiError(
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      400,
      { details: errors }
    ).toJSON(),
    { status: 400 }
  );
}

/**
 * Not found error response
 */
export function jsonNotFound(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return jsonError(`${resource} not found`, 404, ErrorCodes.NOT_FOUND);
}

/**
 * Unauthorized error response
 */
export function jsonUnauthorized(): NextResponse<ApiResponse> {
  return jsonError(getErrorMessage(ErrorCodes.UNAUTHORIZED), 401, ErrorCodes.UNAUTHORIZED);
}

/**
 * Forbidden error response
 */
export function jsonForbidden(action: string = 'access this resource'): NextResponse<ApiResponse> {
  return jsonError(`Forbidden: You don't have permission to ${action}`, 403, ErrorCodes.FORBIDDEN);
}

/**
 * Rate limit error response
 */
export function jsonRateLimit(retryAfter?: number): NextResponse<ApiResponse> {
  return NextResponse.json<ApiResponse>(
    new ApiError(ErrorCodes.RATE_LIMITED, getErrorMessage(ErrorCodes.RATE_LIMITED), 429).toJSON(),
    {
      status: 429,
      headers: retryAfter ? { 'Retry-After': retryAfter.toString() } : undefined
    }
  );
}

/**
 * Created response (201)
 */
export function jsonCreated<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
  }, { status: 201 });
}

/**
 * No content response (204)
 */
export function jsonNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Accepted response (202) for async operations
 */
export function jsonAccepted<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
    message,
  }, { status: 202 });
}

/**
 * Re-export ErrorCodes from error-codes.ts for backward compatibility
 * All error codes are defined in error-codes.ts
 */
export { ErrorCodes, type ErrorCode } from './error-codes';