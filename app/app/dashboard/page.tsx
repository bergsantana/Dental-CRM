"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TopNav } from "@/components/top-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, FileText, TrendingUp } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const appointmentsData = [
  { dia: "Seg", consultas: 12 },
  { dia: "Ter", consultas: 15 },
  { dia: "Qua", consultas: 8 },
  { dia: "Qui", consultas: 18 },
  { dia: "Sex", consultas: 14 },
  { dia: "Sáb", consultas: 6 },
  { dia: "Dom", consultas: 2 },
]

const financialData = [
  { mes: "Jan", receita: 45000, despesas: 28000 },
  { mes: "Fev", receita: 52000, despesas: 31000 },
  { mes: "Mar", receita: 48000, despesas: 29000 },
  { mes: "Abr", receita: 61000, despesas: 35000 },
  { mes: "Mai", receita: 55000, despesas: 32000 },
  { mes: "Jun", receita: 67000, despesas: 38000 },
]

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gradient-to-b from-white to-secondary">
          <div className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-foreground">Painel</h1>
              </div>
              <TopNav />
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pacientes</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">248</div>
                  <p className="text-xs text-muted-foreground mt-1">+12% em relação ao mês passado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Consultas Hoje</CardTitle>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">12</div>
                  <p className="text-xs text-muted-foreground mt-1">3 aguardando confirmação</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Formulários Completos</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">89</div>
                  <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Crescimento</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">+18%</div>
                  <p className="text-xs text-muted-foreground mt-1">Aquisição de pacientes</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agendamentos da Semana</CardTitle>
                  <CardDescription>Número de consultas por dia nos últimos 7 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={appointmentsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="dia" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="consultas"
                        stroke="#4A90E2"
                        strokeWidth={2}
                        dot={{ fill: "#4A90E2", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Desempenho Financeiro</CardTitle>
                  <CardDescription>Receitas e despesas dos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financialData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
                      />
                      <Legend />
                      <Bar dataKey="receita" fill="#6DD4C0" name="Receita" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" fill="#F59E0B" name="Despesas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Consultas</CardTitle>
                  <CardDescription>Próximas consultas agendadas para hoje</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { time: "09:00", patient: "João Silva", type: "Limpeza" },
                    { time: "10:30", patient: "Maria Santos", type: "Canal" },
                    { time: "14:00", patient: "Pedro Costa", type: "Consulta" },
                  ].map((apt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{apt.patient}</p>
                        <p className="text-sm text-muted-foreground">{apt.type}</p>
                      </div>
                      <div className="text-sm font-medium text-foreground">{apt.time}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pacientes Recentes</CardTitle>
                  <CardDescription>Últimos cadastros de pacientes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Ana Oliveira", date: "2 horas atrás", status: "Novo" },
                    { name: "Carlos Mendes", date: "5 horas atrás", status: "Retorno" },
                    { name: "Beatriz Lima", date: "1 dia atrás", status: "Novo" },
                  ].map((patient, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.date}</p>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {patient.status}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
