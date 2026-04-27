import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

const patients = [
  { id: "001", name: "João Silva", lastVisit: "2024-03-20" },
  { id: "002", name: "Maria Oliveira", lastVisit: "2024-04-15" },
];

export default function Dashboard() {
  return (
    <main className="p-8 max-w-7xl w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dental CRM + RAG</h1>
        <Link href="/ingest">
          <Button>Novo Paciente / Ingestão</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Última Consulta</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.lastVisit}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/patient/${p.id}`}>
                      <Button variant="outline" size="sm">
                        Abrir Prontuário
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
