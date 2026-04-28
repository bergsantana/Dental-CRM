import type { ApiError } from "@/lib/api-client"

/**
 * Extracts a user-friendly message from any value thrown by the api-client.
 * Falls back to a generic message when the value is not an Error.
 */
export function errorMessage(err: unknown, fallback = "Erro inesperado"): string {
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message)
  }
  return fallback
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof Error && "status" in err
}
