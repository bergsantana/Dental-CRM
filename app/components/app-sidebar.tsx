"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Building2, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"

const menuItems = [
  { title: "Painel", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Pacientes", icon: Users, href: "/clients" },
  { title: "Minha Agenda", icon: ClipboardList, href: "/minha-agenda" },
  { title: "Agenda Geral", icon: Calendar, href: "/calendar" },
  { title: "Configurações", icon: Settings, href: "/settings" },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold">D</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sidebar-foreground text-sm">CRM Dental</p>
            <p className="text-xs text-sidebar-foreground/60">Clínica Centro</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          <Link href="/companies">
            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
              <Building2 className="w-4 h-4 mr-2" />
              Trocar Empresa
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
