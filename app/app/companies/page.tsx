"use client"

import type React from "react"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Building2, Plus, Check, X } from "lucide-react"

// Mock data
const mockCompanies = [
  {
    id: 1,
    name: "Downtown Dental Clinic",
    description: "Main practice location",
    role: "Owner",
    logo: "DD",
  },
  {
    id: 2,
    name: "Smile Care Center",
    description: "Pediatric dental practice",
    role: "Member",
    logo: "SC",
  },
]

const mockInvitations = [
  {
    id: 1,
    companyName: "Bright Smiles Orthodontics",
    invitedBy: "Dr. Sarah Johnson",
    role: "Dentist",
  },
]

export default function CompaniesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [companies, setCompanies] = useState(mockCompanies)
  const [invitations, setInvitations] = useState(mockInvitations)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCompany, setNewCompany] = useState({
    name: "",
    description: "",
  })

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault()

    const company = {
      id: companies.length + 1,
      name: newCompany.name,
      description: newCompany.description,
      role: "Owner",
      logo: newCompany.name.substring(0, 2).toUpperCase(),
    }

    setCompanies([...companies, company])
    setIsDialogOpen(false)
    setNewCompany({ name: "", description: "" })

    toast({
      title: "Company created!",
      description: `${newCompany.name} has been created successfully`,
    })
  }

  const handleAcceptInvitation = (invitationId: number) => {
    setInvitations(invitations.filter((inv) => inv.id !== invitationId))
    toast({
      title: "Invitation accepted",
      description: "You've joined the company",
    })
  }

  const handleDeclineInvitation = (invitationId: number) => {
    setInvitations(invitations.filter((inv) => inv.id !== invitationId))
    toast({
      title: "Invitation declined",
      description: "The invitation has been removed",
    })
  }

  const handleOpenCompany = (companyId: number) => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Companies</h1>
          <p className="text-muted-foreground">Manage your dental practices and clinics</p>
        </div>

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Pending Invitations</h2>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="border-2 border-accent">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{invitation.companyName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Invited by {invitation.invitedBy} as {invitation.role}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAcceptInvitation(invitation.id)}>
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeclineInvitation(invitation.id)}>
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Companies Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">My Companies</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogDescription>Add a new dental practice or clinic to your account</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Downtown Dental Clinic"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your practice"
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Company</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="hover:border-primary transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <span className="text-primary font-bold text-xl">{company.logo}</span>
                  </div>
                  <Badge variant={company.role === "Owner" ? "default" : "secondary"}>{company.role}</Badge>
                </div>
                <CardTitle className="text-xl">{company.name}</CardTitle>
                <CardDescription>{company.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => handleOpenCompany(company.id)}>
                  <Building2 className="w-4 h-4 mr-2" />
                  Open
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {companies.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No companies yet</h3>
              <p className="text-muted-foreground mb-4">Create your first dental practice to get started</p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Company
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
