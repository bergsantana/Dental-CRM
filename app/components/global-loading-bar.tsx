"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { subscribeApiLoading } from "@/lib/api-client"

/**
 * Global indicator shown whenever any API request is in flight.
 *
 * Renders:
 * - a thin animated progress bar pinned to the top of the viewport
 * - a small spinner badge in the top-right corner
 *
 * Both are auto-driven by the api-client request tracker — components do
 * not need to manage local loading state for the indicator to appear.
 */
export function GlobalLoadingBar() {
  const [pending, setPending] = useState(0)

  useEffect(() => {
    return subscribeApiLoading(setPending)
  }, [])

  if (pending === 0) return null

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-primary/10"
      >
        <div className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] bg-primary" />
      </div>
      <div
        role="status"
        aria-live="polite"
        className="fixed top-3 right-3 z-[100] flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Carregando…</span>
      </div>
    </>
  )
}
