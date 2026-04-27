"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TopNav } from "@/components/top-nav"
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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Phone, Mail, CalendarIcon, MapPin, X } from "lucide-react"

const mockPatients = [
  {
    id: 1,
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "(11) 98765-4321",
    cpf: "123.456.789-00",
    birthdate: "1985-03-15",
    address: "Rua das Flores, 123 - São Paulo, SP",
    lastAppointment: "2024-01-15",
    specialty: "Geral",
    tags: ["Regular", "Convênio"],
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@email.com",
    phone: "(11) 97654-3210",
    cpf: "234.567.890-11",
    birthdate: "1990-07-22",
    address: "Av. Paulista, 456 - São Paulo, SP",
    lastAppointment: "2024-01-10",
    specialty: "Ortodontia",
    tags: ["Novo Paciente"],
  },
  {
    id: 3,
    name: "Pedro Costa",
    email: "pedro.costa@email.com",
    phone: "(11) 96543-2109",
    cpf: "345.678.901-22",
    birthdate: "1978-11-30",
    address: "Rua Augusta, 789 - São Paulo, SP",
    lastAppointment: "2024-01-08",
    specialty: "Implantodontia",
    tags: ["VIP", "Regular"],
  },
]

export default function PacientesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [patients, setPatients] = useState(mockPatients)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPatient, setNewPatient] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    birthdate: "",
    address: "",
    notes: "",
    specialties: [] as string[], // Changed from single specialty to array of specialties
    tags: "",
  })

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      patient.cpf.includes(searchQuery),
  )

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault()

    const patient = {
      id: patients.length + 1,
      name: newPatient.name,
      email: newPatient.email,
      phone: newPatient.phone,
      cpf: newPatient.cpf,
      birthdate: newPatient.birthdate,
      address: newPatient.address,
      lastAppointment: new Date().toISOString().split("T")[0],
      specialty: newPatient.specialties.join(", ") || "Geral", // Join multiple specialties
      tags: newPatient.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }

    setPatients([...patients, patient])
    setIsDialogOpen(false)
    setNewPatient({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      birthdate: "",
      address: "",
      notes: "",
      specialties: [], // Reset to empty array
      tags: "",
    })

    toast({
      title: "Paciente adicionado!",
      description: `${newPatient.name} foi adicionado à sua lista de pacientes`,
    })
  }

  const handlePatientClick = (patientId: number) => {
    router.push(`/clients/${patientId}`)
  }

  const toggleSpecialty = (specialty: string) => {
    setNewPatient((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }))
  }

  const removeSpecialty = (specialty: string) => {
    setNewPatient((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((s) => s !== specialty),
    }))
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-foreground">Administrar Pacientes</h1>
              </div>
              <TopNav />
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, telefone ou CPF..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Paciente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                    <DialogDescription>Criar um novo registro de paciente</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePatient} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input
                          id="name"
                          placeholder="João Silva"
                          value={newPatient.name}
                          onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="joao@exemplo.com"
                          value={newPatient.email}
                          onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(11) 98765-4321"
                          value={newPatient.phone}
                          onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          placeholder="123.456.789-00"
                          value={newPatient.cpf}
                          onChange={(e) => setNewPatient({ ...newPatient, cpf: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthdate">Data de Nascimento</Label>
                        <Input
                          id="birthdate"
                          type="date"
                          value={newPatient.birthdate}
                          onChange={(e) => setNewPatient({ ...newPatient, birthdate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Especialidades</Label>
                        <div className="border border-input rounded-md p-3 space-y-2">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {newPatient.specialties.length === 0 ? (
                              <span className="text-sm text-muted-foreground">Selecione as especialidades</span>
                            ) : (
                              newPatient.specialties.map((specialty) => (
                                <Badge key={specialty} variant="secondary" className="gap-1">
                                  {specialty}
                                  <X
                                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                                    onClick={() => removeSpecialty(specialty)}
                                  />
                                </Badge>
                              ))
                            )}
                          </div>
                          <div className="space-y-1">
                            {["Geral", "Ortodontia", "Implantodontia", "Endodontia", "Periodontia"].map((specialty) => (
                              <label
                                key={specialty}
                                className="flex items-center gap-2 cursor-pointer hover:bg-accent p-1 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={newPatient.specialties.includes(specialty)}
                                  onChange={() => toggleSpecialty(specialty)}
                                  className="rounded border-input"
                                />
                                <span className="text-sm">
                                  {specialty === "Geral" ? "Odontologia Geral" : specialty}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        placeholder="Rua, número - Cidade, Estado"
                        value={newPatient.address}
                        onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                      <Input
                        id="tags"
                        placeholder="VIP, Regular, Convênio"
                        value={newPatient.tags}
                        onChange={(e) => setNewPatient({ ...newPatient, tags: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Observações adicionais sobre o paciente..."
                        value={newPatient.notes}
                        onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Adicionar Paciente</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.id}
                  className="hover:border-primary transition-colors cursor-pointer"
                  onClick={() => handlePatientClick(patient.id)}
                >
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground mb-1">{patient.name}</h3>
                        <p className="text-sm text-muted-foreground">{patient.specialty}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Última visita: {new Date(patient.lastAppointment).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {patient.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{patient.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {patient.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Nenhum paciente encontrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
