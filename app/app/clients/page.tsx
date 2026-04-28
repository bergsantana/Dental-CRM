"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Phone, Mail, CalendarIcon, Loader2 } from "lucide-react"
import { AuthGate } from "@/lib/auth-gate"
import { patientsApi, type PatientSummary } from "@/lib/api-client"
import { errorMessage } from "@/lib/errors"

const SPECIALTIES = [
  { value: "general", label: "Clínica Geral" },
  { value: "orthodontics", label: "Ortodontia" },
  { value: "implantology", label: "Implantodontia" },
  { value: "endodontics", label: "Endodontia" },
  { value: "periodontics", label: "Periodontia" },
]

function ClientsPageInner() {
  const router = useRouter()
  const { toast } = useToast()
  const [clients, setClients] = useState<PatientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newClient, setNewClient] = useState({
    fullName: "",
    email: "",
    phone: "",
    cpf: "",
    birthDate: "",
    address: "",
    notes: "",
    specialty: "general",
  })

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      patientsApi
        .list(searchQuery ? { search: searchQuery } : undefined)
        .then(setClients)
        .catch((err) => {
          toast({
            title: "Falha ao carregar pacientes",
            description: errorMessage(err),
            variant: "destructive",
          })
        })
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const created = await patientsApi.create({
        fullName: newClient.fullName,
        email: newClient.email || undefined,
        phone: newClient.phone || undefined,
        cpf: newClient.cpf || undefined,
        birthDate: newClient.birthDate || undefined,
        address: newClient.address || undefined,
        notes: newClient.notes || undefined,
        specialties: newClient.specialty ? [newClient.specialty] : [],
      })
      setClients((prev) => [created, ...prev])
      setIsDialogOpen(false)
      setNewClient({
        fullName: "",
        email: "",
        phone: "",
        cpf: "",
        birthDate: "",
        address: "",
        notes: "",
        specialty: "general",
      })
      toast({ title: "Paciente cadastrado", description: created.fullName })
    } catch (err) {
      toast({
        title: "Falha ao cadastrar",
        description: errorMessage(err),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo paciente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar paciente</DialogTitle>
                    <DialogDescription>Crie um novo registro de paciente</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateClient} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo *</Label>
                        <Input
                          id="name"
                          value={newClient.fullName}
                          onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newClient.email}
                          onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={newClient.phone}
                          onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={newClient.cpf}
                          onChange={(e) => setNewClient({ ...newClient, cpf: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Nascimento</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={newClient.birthDate}
                          onChange={(e) => setNewClient({ ...newClient, birthDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidade</Label>
                        <Select
                          value={newClient.specialty}
                          onValueChange={(value) =>
                            setNewClient({ ...newClient, specialty: value })
                          }
                        >
                          <SelectTrigger id="specialty">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SPECIALTIES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={newClient.address}
                        onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={newClient.notes}
                        onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Adicionar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </CardContent>
              </Card>
            ) : clients.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum paciente encontrado.
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client) => (
                  <Card
                    key={client.id}
                    className="hover:border-primary transition-colors cursor-pointer"
                    onClick={() => router.push(`/clients/${client.id}`)}
                  >
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-1">
                          {client.fullName}
                        </h3>
                        {client.specialties.length > 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {client.specialties.join(", ")}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2 text-sm">
                        {client.email ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        ) : null}
                        {client.phone ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{client.phone}</span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            Cadastrado em{" "}
                            {new Date(client.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {client.specialties.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default function ClientsPage() {
  return (
    <AuthGate>
      <ClientsPageInner />
    </AuthGate>
  )
}
