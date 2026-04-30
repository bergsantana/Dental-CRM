"use client"

import { useEffect, useState } from "react"
import { auth, clinicsApi, type ClinicMembership } from "@/lib/api-client"

/**
 * Resolves the active clinic from localStorage + `/v1/clinics` list.
 * Returns null while loading; throws errors are surfaced via the `error` field.
 */
export function useActiveClinic() {
  const [clinic, setClinic] = useState<ClinicMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const id = auth.getClinicId()
    clinicsApi
      .list()
      .then((rows) => {
        if (cancelled) return
        const active =
          (id && rows.find((r) => r.id === id)) ||
          rows.find((r) => r.isActive && !r.pending) ||
          null
        setClinic(active)
      })
      .catch((e) => {
        if (cancelled) return
        setError((e as Error).message)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { clinic, loading, error }
}
