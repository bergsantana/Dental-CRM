import { randomUUID } from 'crypto';

export type ClinicalNoteType = 'procedure' | 'observation' | 'exam';

export type ClinicalNoteProps = {
  id?: string;
  patientId: string;
  dentistId: string;
  content: string; // Texto que será enviado ao RAG
  type: ClinicalNoteType;
  createdAt?: Date;
};

export class ClinicalNote {
  id: string;
  patientId: string;
  dentistId: string;
  content: string;
  type: ClinicalNoteType;
  createdAt: Date;

  constructor(props: ClinicalNoteProps) {
    this.id = props.id ?? randomUUID();
    this.patientId = props.patientId;
    this.dentistId = props.dentistId;
    this.content = props.content;
    this.type = props.type;
    this.createdAt = props.createdAt ?? new Date();
  }
}
