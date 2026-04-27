"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function IngestPage() {
  const router = useRouter();

  const [patientId, setPatientId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleIngest = async () => {
    if (!patientId || files.length === 0) {
      toast.warning("Campos obrigatórios", {
        description:
          "Informe o ID do paciente e selecione ao menos um arquivo.",
      });
      return;
    }

    setIsUploading(true);
    setProgress(["Iniciando processamento..."]);

    try {
      // Como seu backend espera 'dir' ou 'file', vamos simular o envio de um FormData
      // Se o seu backend suporta Multer/File upload, use FormData.
      // Caso ele leia apenas do disco (como sugere o seu README), você precisaria
      // ajustar o backend para receber o binário.

      for (const file of files) {
        setProgress((prev) => [...prev, `Processando ${file.name}...`]);

        const formData = new FormData();
        formData.append("patientId", patientId);
        formData.append("file", file);

        const response = await fetch("http://localhost:3000/ingest", {
          method: "POST",
          body: formData, // Enviando como multipart/form-data
        });

        if (!response.ok) throw new Error(`Erro ao processar ${file.name}`);
      }

      toast.success("Sucesso!", {
        description: "Documentos ingeridos e vetorizados no ChromaDB.",
      });

      setProgress((prev) => [...prev, "Concluído com sucesso!"]);
      setTimeout(() => router.push(`/patient/${patientId}`), 1500);
    } catch (error) {
      console.error(error);
      toast.error("Erro na ingestão", {
        description:
          "Ocorreu um problema ao enviar os dados para o pipeline RAG.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} /> Voltar para Dashboard
        </Link>
      </div>

      <Card className="border-2 border-dashed border-slate-200 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="text-blue-600" />
            Ingestão de Dados
          </CardTitle>
          <CardDescription>
            Suba documentos (PDF, TXT, JSON) para alimentar a base de
            conhecimento do paciente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient ID Field */}
          <div className="space-y-2">
            <Label htmlFor="patient-id">ID do Paciente</Label>
            <Input
              id="patient-id"
              placeholder="Ex: 001"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* File Dropzone Mockup */}
          <div className="space-y-2">
            <Label>Documentos Clínicos</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer">
              <Input
                type="file"
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <FileText className="mx-auto mb-2 text-slate-400" size={32} />
              <p className="text-sm text-slate-600">
                {files.length > 0
                  ? `${files.length} arquivo(s) selecionado(s)`
                  : "Clique ou arraste arquivos para cá"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, TXT ou JSON (Max 10MB)
              </p>
            </div>
          </div>

          {/* Progress Alert */}
          {progress.length > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <Loader2
                className={`h-4 w-4 ${isUploading ? "animate-spin" : ""}`}
              />
              <AlertTitle>Status do Processamento</AlertTitle>
              <AlertDescription className="text-xs font-mono mt-2 max-h-24 overflow-y-auto">
                {progress.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-green-600" /> {line}
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleIngest}
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? "Processando Embeddings..." : "Iniciar Ingestão RAG"}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 text-[11px] text-slate-400 bg-slate-100 p-4 rounded-md">
        <p className="font-bold mb-1 underline uppercase">
          Nota Técnica (Trabalho UEA):
        </p>
        <p>
          Este módulo executa o{" "}
          <strong>Chunking (500 chars / 75 overlap)</strong> e gera vetores
          usando o modelo <strong>nomic-embed-text</strong> via API do Ollama,
          persistindo os dados no ChromaDB com metadados de filtragem por ID.
        </p>
      </div>
    </main>
  );
}
