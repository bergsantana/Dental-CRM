"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Info } from "lucide-react"

const upperLeftTeeth = [18, 17, 16, 15, 14, 13, 12, 11] // SUPERIOR ESQUERDA
const upperRightTeeth = [21, 22, 23, 24, 25, 26, 27, 28] // SUPERIOR DIREITA
const lowerLeftTeeth = [48, 47, 46, 45, 44, 43, 42, 41] // INFERIOR ESQUERDA
const lowerRightTeeth = [31, 32, 33, 34, 35, 36, 37, 38] // INFERIOR DIREITA

const procedureColors: Record<string, string> = {
  Saudável: "bg-white",
  Cárie: "bg-red-500",
  Obturação: "bg-blue-500",
  Canal: "bg-purple-500",
  Coroa: "bg-yellow-500",
  Implante: "bg-green-500",
  Extração: "bg-gray-500",
  Ausente: "bg-gray-300",
}

const initialToothData: Record<number, { status: string; notes: string; checked: boolean }> = {}
;[...upperLeftTeeth, ...upperRightTeeth, ...lowerLeftTeeth, ...lowerRightTeeth].forEach((tooth) => {
  initialToothData[tooth] = { status: "Saudável", notes: "", checked: false }
})

// Add some mock data
initialToothData[16] = { status: "Obturação", notes: "Obturação em amálgama realizada em 2023", checked: true }
initialToothData[36] = { status: "Canal", notes: "Tratamento de canal em andamento", checked: true }
initialToothData[46] = { status: "Cárie", notes: "Cárie detectada, tratamento necessário", checked: false }

export default function OdontogramaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [toothData, setToothData] = useState(initialToothData)
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editData, setEditData] = useState({ status: "Saudável", notes: "", checked: false })

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber)
    setEditData(toothData[toothNumber])
    setIsDialogOpen(true)
  }

  const handleCheckboxChange = (toothNumber: number, checked: boolean) => {
    setToothData({
      ...toothData,
      [toothNumber]: { ...toothData[toothNumber], checked },
    })
  }

  const handleSave = () => {
    if (selectedTooth) {
      setToothData({
        ...toothData,
        [selectedTooth]: editData,
      })
      toast({
        title: "Dente atualizado",
        description: `Informações do dente ${selectedTooth} foram salvas`,
      })
      setIsDialogOpen(false)
    }
  }

  const ToothSVG = ({ number, type }: { number: number; type: "molar" | "premolar" | "canine" | "incisor" }) => {
    const data = toothData[number]
    const fillColor =
      data.status === "Saudável" ? "#ffffff" : procedureColors[data.status]?.replace("bg-", "") || "#ffffff"

    // Convert Tailwind color classes to actual colors
    const colorMap: Record<string, string> = {
      white: "#ffffff",
      "red-500": "#ef4444",
      "blue-500": "#3b82f6",
      "purple-500": "#a855f7",
      "yellow-500": "#eab308",
      "green-500": "#22c55e",
      "gray-500": "#6b7280",
      "gray-300": "#d1d5db",
    }
    const actualFillColor = colorMap[fillColor] || "#ffffff"

    if (type === "molar") {
      return (
        <svg width="40" height="60" viewBox="0 0 40 60" className="cursor-pointer hover:scale-110 transition-transform">
          {/* Crown */}
          <path
            d="M 5 15 Q 5 5 10 5 L 30 5 Q 35 5 35 15 L 35 30 Q 35 35 30 35 L 10 35 Q 5 35 5 30 Z"
            fill={actualFillColor}
            stroke="#374151"
            strokeWidth="1.5"
          />
          {/* Roots */}
          <path d="M 12 35 L 10 50 Q 10 55 15 55 L 15 35" fill={actualFillColor} stroke="#374151" strokeWidth="1.5" />
          <path d="M 28 35 L 30 50 Q 30 55 25 55 L 25 35" fill={actualFillColor} stroke="#374151" strokeWidth="1.5" />
          {/* Cusps */}
          <circle cx="15" cy="15" r="3" fill="#f3f4f6" opacity="0.5" />
          <circle cx="25" cy="15" r="3" fill="#f3f4f6" opacity="0.5" />
        </svg>
      )
    }

    if (type === "premolar") {
      return (
        <svg width="35" height="55" viewBox="0 0 35 55" className="cursor-pointer hover:scale-110 transition-transform">
          {/* Crown */}
          <path
            d="M 7 15 Q 7 7 12 7 L 23 7 Q 28 7 28 15 L 28 28 Q 28 33 23 33 L 12 33 Q 7 33 7 28 Z"
            fill={actualFillColor}
            stroke="#374151"
            strokeWidth="1.5"
          />
          {/* Root */}
          <path
            d="M 15 33 L 14 48 Q 14 52 17.5 52 Q 21 52 21 48 L 20 33"
            fill={actualFillColor}
            stroke="#374151"
            strokeWidth="1.5"
          />
          {/* Cusps */}
          <circle cx="17.5" cy="15" r="2.5" fill="#f3f4f6" opacity="0.5" />
        </svg>
      )
    }

    if (type === "canine") {
      return (
        <svg width="30" height="58" viewBox="0 0 30 58" className="cursor-pointer hover:scale-110 transition-transform">
          {/* Crown - pointed */}
          <path
            d="M 15 5 L 8 12 Q 6 15 6 20 L 6 28 Q 6 32 10 32 L 20 32 Q 24 32 24 28 L 24 20 Q 24 15 22 12 Z"
            fill={actualFillColor}
            stroke="#374151"
            strokeWidth="1.5"
          />
          {/* Root - long single root */}
          <path
            d="M 13 32 L 12 52 Q 12 56 15 56 Q 18 56 18 52 L 17 32"
            fill={actualFillColor}
            stroke="#374151"
            strokeWidth="1.5"
          />
        </svg>
      )
    }

    // Incisor
    return (
      <svg width="28" height="52" viewBox="0 0 28 52" className="cursor-pointer hover:scale-110 transition-transform">
        {/* Crown - flat and narrow */}
        <path
          d="M 7 10 Q 7 7 10 7 L 18 7 Q 21 7 21 10 L 21 28 Q 21 31 18 31 L 10 31 Q 7 31 7 28 Z"
          fill={actualFillColor}
          stroke="#374151"
          strokeWidth="1.5"
        />
        {/* Root - single thin root */}
        <path
          d="M 12 31 L 11 48 Q 11 50 14 50 Q 17 50 17 48 L 16 31"
          fill={actualFillColor}
          stroke="#374151"
          strokeWidth="1.5"
        />
      </svg>
    )
  }

  const Tooth = ({ number }: { number: number }) => {
    const data = toothData[number]
    const position = number % 10
    let type: "molar" | "premolar" | "canine" | "incisor"

    if (position >= 6 || position === 8) type = "molar"
    else if (position >= 4) type = "premolar"
    else if (position === 3) type = "canine"
    else type = "incisor"

    return (
      <div className="flex flex-col items-center gap-1">
        {/* Checkbox */}
        <Checkbox
          checked={data.checked}
          onCheckedChange={(checked) => handleCheckboxChange(number, checked as boolean)}
          className="mb-1"
        />
        {/* Tooth number */}
        <div className="text-xs font-semibold text-foreground mb-1">{number}</div>
        {/* Tooth drawing */}
        <div onClick={() => handleToothClick(number)} className="relative">
          <ToothSVG number={number} type={type} />
          {data.notes && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-white" />
          )}
        </div>
      </div>
    )
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
                Voltar
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Odontograma</h1>
            </div>
          </div>

          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Legenda</CardTitle>
                <CardDescription>Clique em um dente para adicionar ou editar informações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(procedureColors).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-2">
                      <div className={`w-6 h-6 ${color} border-2 border-gray-400 rounded-sm shadow-sm`} />
                      <span className="text-sm text-foreground">{status}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Um ponto azul no canto do dente indica que há observações registradas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-8 pb-8">
                <div className="space-y-8">
                  {/* Upper Section */}
                  <div className="grid grid-cols-2 gap-8">
                    {/* SUPERIOR ESQUERDA */}
                    <div className="border-2 border-border rounded-lg p-4">
                      <div className="text-center font-bold text-sm mb-4 pb-2 border-b-2 border-border">
                        SUPERIOR ESQUERDA
                      </div>
                      <div className="flex justify-center gap-1">
                        {upperLeftTeeth.map((tooth) => (
                          <Tooth key={tooth} number={tooth} />
                        ))}
                      </div>
                    </div>

                    {/* SUPERIOR DIREITA */}
                    <div className="border-2 border-border rounded-lg p-4">
                      <div className="text-center font-bold text-sm mb-4 pb-2 border-b-2 border-border">
                        SUPERIOR DIREITA
                      </div>
                      <div className="flex justify-center gap-1">
                        {upperRightTeeth.map((tooth) => (
                          <Tooth key={tooth} number={tooth} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Lower Section */}
                  <div className="grid grid-cols-2 gap-8">
                    {/* INFERIOR ESQUERDA */}
                    <div className="border-2 border-border rounded-lg p-4">
                      <div className="flex justify-center gap-1 mb-4">
                        {lowerLeftTeeth.map((tooth) => (
                          <Tooth key={tooth} number={tooth} />
                        ))}
                      </div>
                      <div className="text-center font-bold text-sm pt-2 border-t-2 border-border">
                        INFERIOR ESQUERDA
                      </div>
                    </div>

                    {/* INFERIOR DIREITA */}
                    <div className="border-2 border-border rounded-lg p-4">
                      <div className="flex justify-center gap-1 mb-4">
                        {lowerRightTeeth.map((tooth) => (
                          <Tooth key={tooth} number={tooth} />
                        ))}
                      </div>
                      <div className="text-center font-bold text-sm pt-2 border-t-2 border-border">
                        INFERIOR DIREITA
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tooth Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dente {selectedTooth}</DialogTitle>
                  <DialogDescription>Registrar procedimentos e observações</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status do Dente</Label>
                    <Select
                      value={editData.status}
                      onValueChange={(value) => setEditData({ ...editData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(procedureColors).map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 ${procedureColors[status]} border border-gray-400 rounded-sm`} />
                              {status}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      placeholder="Detalhes sobre procedimentos, datas, materiais utilizados..."
                      value={editData.notes}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>Salvar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Odontograma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(procedureColors)
                    .filter(([status]) => status !== "Saudável")
                    .map(([status, color]) => {
                      const count = Object.values(toothData).filter((data) => data.status === status).length
                      return (
                        <div
                          key={status}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 ${color} border border-gray-400 rounded-sm`} />
                            <span className="text-sm font-medium text-foreground">{status}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
