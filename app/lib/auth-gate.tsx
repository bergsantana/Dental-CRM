"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/api-client"

/**
 * Client-side gate. Redirects to `/login` when no token is present.
 * Renders nothing until the check completes to avoid flashing protected UI.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.replace("/login")
      return
    }
    setReady(true)
  }, [router])

  if (!ready) return null
  return <>{children}</>
}
