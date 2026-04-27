import { randomUUID } from 'crypto';

export type GeneralHealthProps = {
  allergies: string;
  medications: string;
  chronicDiseases: string;
  smoking: boolean;
  alcoholUse: string;
};

export type OrthodonticsProps = {
  jawPain: boolean;
  biteIssues: string;
  orthoHistory: string;
};

export type ImplantologyProps = {
  boneDensityNotes: string;
  priorImplants: boolean;
  xrayNotes: string;
};

export type EndodonticsProps = {
  rootCanalHistory: string;
  painSensitivity: string;
  pulpVitality: string;
};

export type ClinicalRecordProps = {
  id?: string;
  patientId: string;
  texts: string;
  procedureDescriptions: string;
  generalHealth: GeneralHealthProps;
  orthodontics: OrthodonticsProps;
  implantology: ImplantologyProps;
  endodontics: EndodonticsProps;
  createdAt?: Date | null;
};

export class ClinicalRecord {
  id: string;
  patientId: string;
  texts: string;
  procedureDescriptions: string;
  generalHealth: GeneralHealthProps;
  orthodontics: OrthodonticsProps;
  implantology: ImplantologyProps;
  endodontics: EndodonticsProps;
  createdAt: Date;

  constructor(props: ClinicalRecordProps) {
    this.id = props.id ?? randomUUID();
    this.patientId = props.patientId;
    this.texts = props.texts;
    this.procedureDescriptions = props.procedureDescriptions;
    this.generalHealth = props.generalHealth;
    this.orthodontics = props.orthodontics;
    this.implantology = props.implantology;
    this.endodontics = props.endodontics;
    this.createdAt = props.createdAt ?? new Date();
  }
}
