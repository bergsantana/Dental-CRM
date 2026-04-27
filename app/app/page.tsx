import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, FileText, ImageIcon } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <span className="font-semibold text-xl text-foreground">CRM Dental Inteligente</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button>Começar</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground text-balance leading-tight">
            CRM Dental Inteligente
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
            Gerencie pacientes, agende consultas e sincronize com o Google Calendar. A solução completa para clínicas
            odontológicas modernas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Começar Agora
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que você precisa para gerenciar sua clínica
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Otimize seu fluxo de trabalho com recursos poderosos projetados para profissionais da odontologia
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Gestão de Pacientes</h3>
              <p className="text-muted-foreground leading-relaxed">
                Organize prontuários, informações de contato e histórico de tratamentos em um só lugar
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Agendamento Inteligente</h3>
              <p className="text-muted-foreground leading-relaxed">
                Agende consultas e sincronize perfeitamente com o Google Calendar da sua equipe
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Anamnese Odontológica</h3>
              <p className="text-muted-foreground leading-relaxed">
                Formulários completos para múltiplas especialidades incluindo ortodontia e implantodontia
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Imagens e Histórico</h3>
              <p className="text-muted-foreground leading-relaxed">
                Armazene e organize imagens de pacientes, radiografias e histórico completo de tratamentos
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-primary to-accent border-0 text-primary-foreground">
          <CardContent className="py-16 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Pronto para modernizar sua clínica?</h2>
            <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
              Junte-se aos profissionais da odontologia que confiam no CRM Dental Inteligente para gerenciar suas
              clínicas com eficiência
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Começar Teste Grátis
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">D</span>
              </div>
              <span className="font-semibold text-foreground">CRM Dental Inteligente</span>
            </div>
            <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                Sobre
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Contato
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
