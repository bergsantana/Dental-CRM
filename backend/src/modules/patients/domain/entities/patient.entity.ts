import { randomUUID } from 'crypto';

export type PatientProps = {
  id?: string;
  name: string;
  birthDate: Date;
  primaryDentist: string;
  createdAt?: Date | null;
};

export class Patient {
  id: string;
  name: string;
  birthDate: Date;
  primaryDentist: string;
  createdAt: Date;

  constructor(props: PatientProps) {
    this.id = props.id ?? randomUUID();
    this.name = props.name;
    this.birthDate = props.birthDate;
    this.primaryDentist = props.primaryDentist;
    this.createdAt = props.createdAt ?? new Date();
  }
}
