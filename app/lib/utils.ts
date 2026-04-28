import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Color class for a [0, 1] quality score: green ≥ 0.75, amber 0.5–0.75,
 * red < 0.5. Returns Tailwind classes for background + text suitable for
 * a small inline badge.
 */
export function scoreColorClass(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return 'bg-muted text-muted-foreground'
  }
  if (score >= 0.75) return 'bg-green-600 hover:bg-green-600 text-white'
  if (score >= 0.5) return 'bg-amber-500 hover:bg-amber-500 text-white'
  return 'bg-red-600 hover:bg-red-600 text-white'
}

export function formatScorePct(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return '—'
  return `${Math.round(score * 100)}%`
}
