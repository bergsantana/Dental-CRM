"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TopNav } from "@/components/top-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

const mockTransactions = [
  {
    id: 1,
    patient: "João Silva",
    type: "Receita",
    amount: 450.0,
    method: "Cartão de Crédito",
    date: "2024-01-15",
    status: "Pago",
    description: "Limpeza Dental",
  },
  {
    id: 2,
    patient: "Maria Santos",
    type: "Receita",
    amount: 1200.0,
    method: "PIX",
    date: "2024-01-14",
    status: "Pago",
    description: "Tratamento de Canal",
  },
  {
    id: 3,
    patient: "Pedro Costa",
    type: "Receita",
    amount: 3500.0,
    method: "Parcelado",
    date: "2024-01-13",
    status: "Pendente",
    description: "Implante Dentário",
  },
  {
    id: 4,
    patient: "Fornecedor XYZ",
    type: "Despesa",
    amount: 850.0,
    method: "Transferência",
    date: "2024-01-12",
    status: "Pago",
    description: "Material Odontológico",
  },
  {
    id: 5,
    patient: "Ana Oliveira",
    type: "Receita",
    amount: 680.0,
    method: "Dinheiro",
    date: "2024-01-11",
    status: "Pago",
    description: "Clareamento Dental",
  },
]

export default function FinanceiroPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-foreground">Informações Financeiras</h1>
              </div>
              <TopNav />
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Financial Overview Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">R$ 45.280,00</div>
                  <p className="text-xs text-primary flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +12% em relação ao mês passado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
                  <TrendingDown className="w-4 h-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">R$ 12.450,00</div>
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <ArrowDownRight className="w-3 h-3" />
                    +5% em relação ao mês passado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
                  <DollarSign className="w-4 h-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">R$ 32.830,00</div>
                  <p className="text-xs text-muted-foreground mt-1">Margem de 72,5%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">R$ 8.500,00</div>
                  <p className="text-xs text-muted-foreground mt-1">12 pagamentos pendentes</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                <Select defaultValue="mes">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Este Mês</SelectItem>
                    <SelectItem value="trimestre">Este Trimestre</SelectItem>
                    <SelectItem value="ano">Este Ano</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="todos">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Tipos</SelectItem>
                    <SelectItem value="receita">Receitas</SelectItem>
                    <SelectItem value="despesa">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>

            {/* Transactions List */}
            <Card>
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>Histórico de receitas e despesas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === "Receita" ? "bg-primary/10" : "bg-destructive/10"
                          }`}
                        >
                          {transaction.type === "Receita" ? (
                            <ArrowUpRight className="w-5 h-5 text-primary" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{transaction.patient}</p>
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString("pt-BR")}
                            </span>
                            <span className="text-xs text-muted-foreground">• {transaction.method}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            transaction.type === "Receita" ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {transaction.type === "Receita" ? "+" : "-"}R${" "}
                          {transaction.amount.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <Badge variant={transaction.status === "Pago" ? "default" : "secondary"} className="mt-1">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
