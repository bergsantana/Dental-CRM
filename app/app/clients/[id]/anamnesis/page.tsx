"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ChevronDown, Save } from "lucide-react"

export default function AnamnesisPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(["general"])
  const [formData, setFormData] = useState({
    // General
    allergies: "",
    medications: "",
    diseases: "",
    smoking: "no",
    alcohol: "no",
    // Orthodontics
    jawPain: "no",
    biteIssues: "",
    orthodonticHistory: "",
    // Implantology
    boneDensity: "",
    priorImplants: "no",
    xrayNotes: "",
    // Endodontics
    rootCanalHistory: "",
    painSensitivity: "",
    pulpVitality: "",
  })

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Anamnesis saved",
      description: "Patient medical history has been updated successfully",
    })
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger />
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Patient Anamnesis</h1>
            </div>
          </div>

          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Specialty Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Specialties</CardTitle>
                <CardDescription>Choose which specialty forms to include for this patient</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="general"
                    checked={selectedSpecialties.includes("general")}
                    onCheckedChange={() => handleSpecialtyToggle("general")}
                  />
                  <Label htmlFor="general" className="cursor-pointer">
                    General Dentistry
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orthodontics"
                    checked={selectedSpecialties.includes("orthodontics")}
                    onCheckedChange={() => handleSpecialtyToggle("orthodontics")}
                  />
                  <Label htmlFor="orthodontics" className="cursor-pointer">
                    Orthodontics
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="implantology"
                    checked={selectedSpecialties.includes("implantology")}
                    onCheckedChange={() => handleSpecialtyToggle("implantology")}
                  />
                  <Label htmlFor="implantology" className="cursor-pointer">
                    Implantology
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="endodontics"
                    checked={selectedSpecialties.includes("endodontics")}
                    onCheckedChange={() => handleSpecialtyToggle("endodontics")}
                  />
                  <Label htmlFor="endodontics" className="cursor-pointer">
                    Endodontics
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Forms */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Dentistry */}
              {selectedSpecialties.includes("general") && (
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle>General Dentistry</CardTitle>
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <CardDescription>Basic medical history and lifestyle information</CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
                        <div className="space-y-2">
                          <Label htmlFor="allergies">Allergies</Label>
                          <Textarea
                            id="allergies"
                            placeholder="List any known allergies..."
                            value={formData.allergies}
                            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="medications">Current Medications</Label>
                          <Textarea
                            id="medications"
                            placeholder="List all current medications..."
                            value={formData.medications}
                            onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="diseases">Medical Conditions</Label>
                          <Textarea
                            id="diseases"
                            placeholder="List any chronic diseases or conditions..."
                            value={formData.diseases}
                            onChange={(e) => setFormData({ ...formData, diseases: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Do you smoke?</Label>
                          <RadioGroup
                            value={formData.smoking}
                            onValueChange={(value) => setFormData({ ...formData, smoking: value })}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="smoking-no" />
                              <Label htmlFor="smoking-no" className="cursor-pointer">
                                No
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="smoking-yes" />
                              <Label htmlFor="smoking-yes" className="cursor-pointer">
                                Yes
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="former" id="smoking-former" />
                              <Label htmlFor="smoking-former" className="cursor-pointer">
                                Former smoker
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label>Alcohol consumption?</Label>
                          <RadioGroup
                            value={formData.alcohol}
                            onValueChange={(value) => setFormData({ ...formData, alcohol: value })}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="alcohol-no" />
                              <Label htmlFor="alcohol-no" className="cursor-pointer">
                                No
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="occasional" id="alcohol-occasional" />
                              <Label htmlFor="alcohol-occasional" className="cursor-pointer">
                                Occasional
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="regular" id="alcohol-regular" />
                              <Label htmlFor="alcohol-regular" className="cursor-pointer">
                                Regular
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Orthodontics */}
              {selectedSpecialties.includes("orthodontics") && (
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle>Orthodontics</CardTitle>
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <CardDescription>Jaw alignment and bite-related information</CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
                        <div className="space-y-2">
                          <Label>Do you experience jaw pain?</Label>
                          <RadioGroup
                            value={formData.jawPain}
                            onValueChange={(value) => setFormData({ ...formData, jawPain: value })}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="jaw-no" />
                              <Label htmlFor="jaw-no" className="cursor-pointer">
                                No
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="occasional" id="jaw-occasional" />
                              <Label htmlFor="jaw-occasional" className="cursor-pointer">
                                Occasional
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="frequent" id="jaw-frequent" />
                              <Label htmlFor="jaw-frequent" className="cursor-pointer">
                                Frequent
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="biteIssues">Bite Issues / Occlusion Problems</Label>
                          <Textarea
                            id="biteIssues"
                            placeholder="Describe any bite alignment issues..."
                            value={formData.biteIssues}
                            onChange={(e) => setFormData({ ...formData, biteIssues: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="orthodonticHistory">Previous Orthodontic Treatment</Label>
                          <Textarea
                            id="orthodonticHistory"
                            placeholder="Braces, retainers, or other orthodontic work..."
                            value={formData.orthodonticHistory}
                            onChange={(e) => setFormData({ ...formData, orthodonticHistory: e.target.value })}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Implantology */}
              {selectedSpecialties.includes("implantology") && (
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle>Implantology</CardTitle>
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <CardDescription>Dental implant and bone structure information</CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
                        <div className="space-y-2">
                          <Label htmlFor="boneDensity">Bone Density Assessment</Label>
                          <Input
                            id="boneDensity"
                            placeholder="e.g., Normal, Low, Requires grafting"
                            value={formData.boneDensity}
                            onChange={(e) => setFormData({ ...formData, boneDensity: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Prior Dental Implants?</Label>
                          <RadioGroup
                            value={formData.priorImplants}
                            onValueChange={(value) => setFormData({ ...formData, priorImplants: value })}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="implants-no" />
                              <Label htmlFor="implants-no" className="cursor-pointer">
                                No
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="implants-yes" />
                              <Label htmlFor="implants-yes" className="cursor-pointer">
                                Yes
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="xrayNotes">X-Ray / Imaging Notes</Label>
                          <Textarea
                            id="xrayNotes"
                            placeholder="Notes from radiographic examination..."
                            value={formData.xrayNotes}
                            onChange={(e) => setFormData({ ...formData, xrayNotes: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Endodontics */}
              {selectedSpecialties.includes("endodontics") && (
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle>Endodontics</CardTitle>
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <CardDescription>Root canal and pulp-related information</CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
                        <div className="space-y-2">
                          <Label htmlFor="rootCanalHistory">Root Canal History</Label>
                          <Textarea
                            id="rootCanalHistory"
                            placeholder="Previous root canal treatments, dates, teeth affected..."
                            value={formData.rootCanalHistory}
                            onChange={(e) => setFormData({ ...formData, rootCanalHistory: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="painSensitivity">Pain / Sensitivity Description</Label>
                          <Textarea
                            id="painSensitivity"
                            placeholder="Describe any tooth pain or temperature sensitivity..."
                            value={formData.painSensitivity}
                            onChange={(e) => setFormData({ ...formData, painSensitivity: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pulpVitality">Pulp Vitality Test Results</Label>
                          <Input
                            id="pulpVitality"
                            placeholder="e.g., Vital, Non-vital, Necrotic"
                            value={formData.pulpVitality}
                            onChange={(e) => setFormData({ ...formData, pulpVitality: e.target.value })}
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save Anamnesis
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
