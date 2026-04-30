"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Building2, Plus, Check, X, Loader2 } from "lucide-react"
import { AuthGate } from "@/lib/auth-gate"
import {
  auth,
  clinicsApi,
  type ClinicMembership,
  type PendingInvitation,
} from "@/lib/api-client"
import { errorMessage } from "@/lib/errors"

function CompaniesPageInner() {
  const router = useRouter()
  const { toast } = useToast()
  const [companies, setCompanies] = useState<ClinicMembership[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: "", phone: "", address: "" })
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    try {
      const [list, inv] = await Promise.all([
        clinicsApi.list(),
        clinicsApi.listInvitations().catch(() => [] as PendingInvitation[]),
      ])
      setCompanies(list.filter((c) => !c.pending))
      setInvitations(inv)
    } catch (err) {
      toast({
        title: "Falha ao carregar clínicas",
        description: errorMessage(err),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const created = await clinicsApi.create({
        name: newCompany.name,
        phone: newCompany.phone || undefined,
        address: newCompany.address || undefined,
      })
      setIsDialogOpen(false)
      setNewCompany({ name: "", phone: "", address: "" })
      toast({ title: "Clínica criada", description: `${created.name} foi adicionada.` })
      await refresh()
    } catch (err) {
      toast({
        title: "Falha ao criar",
        description: errorMessage(err),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptInvitation = async (id: string) => {
    try {
      await clinicsApi.acceptInvitation(id)
      toast({ title: "Convite aceito" })
      await refresh()
    } catch (err) {
      toast({
        title: "Falha ao aceitar",
        description: errorMessage(err),
        variant: "destructive",
      })
    }
  }

  const handleDeclineInvitation = async (id: string) => {
    try {
      await clinicsApi.declineInvitation(id)
      toast({ title: "Convite recusado" })
      await refresh()
    } catch (err) {
      toast({
        title: "Falha ao recusar",
        description: errorMessage(err),
        variant: "destructive",
      })
    }
  }

  const handleOpenCompany = (companyId: string) => {
    auth.setClinicId(companyId)
    router.push("/dashboard")
  }

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s.charAt(0).toUpperCase())
      .join("") || "?"

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Suas Clínicas</h1>
          <p className="text-muted-foreground">Gerencie suas clínicas e consultórios</p>
        </div>

        {invitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Convites pendentes</h2>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="border-2 border-accent">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{invitation.clinicName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Convidado como <Badge variant="secondary">{invitation.role}</Badge>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAcceptInvitation(invitation.id)}>
                          <Check className="w-4 h-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineInvitation(invitation.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Minhas Clínicas</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova clínica
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova clínica</DialogTitle>
                <DialogDescription>Adicione uma nova clínica à sua conta</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome</Label>
                  <Input
                    id="companyName"
                    placeholder="Clínica Centro"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    placeholder="Rua das Flores, 123"
                    value={newCompany.address}
                    onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Criar
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
        ) : companies.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma clínica</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira clínica para começar
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar clínica
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Card key={company.id} className="hover:border-primary transition-colors group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <span className="text-primary font-bold text-xl">{initials(company.name)}</span>
                    </div>
                    <Badge variant={company.role === "owner" ? "default" : "secondary"}>
                      {company.role}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{company.name}</CardTitle>
                  <CardDescription>{company.address ?? "Sem endereço"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => handleOpenCompany(company.id)}>
                    <Building2 className="w-4 h-4 mr-2" />
                    Abrir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompaniesPage() {
  return (
    <AuthGate>
      <CompaniesPageInner />
    </AuthGate>
  )
}
