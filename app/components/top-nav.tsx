"use client"

import { Button } from "@/components/ui/button"
import { Users, DollarSign, Calendar } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    {
      label: "Pacientes",
      icon: Users,
      href: "/pacientes",
    },
    {
      label: "Financeiro",
      icon: DollarSign,
      href: "/financeiro",
    },
    {
      label: "Agendamentos",
      icon: Calendar,
      href: "/agendamentos",
    },
  ]

  return (
    <div className="flex items-center gap-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Button
            key={item.href}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => router.push(item.href)}
            className="gap-2"
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Button>
        )
      })}
    </div>
  )
}
