import { randomUUID } from 'crypto';

export type AppointmentStatus = 'scheduled' | 'completed';

export type AppointmentProps = {
  id?: string;
  patientId: string;
  clinicId: string;
  dentistId: string;
  date: Date;
  procedure: string;
  status: AppointmentStatus;
  notes: string;
  createdAt?: Date | null;
};

export class Appointment {
  id: string;
  patientId: string;
  clinicId: string;
  dentistId: string;
  date: Date;
  procedure: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: Date;

  constructor(props: AppointmentProps) {
    this.id = props.id ?? randomUUID();
    this.patientId = props.patientId;
    this.clinicId = props.clinicId;
    this.dentistId = props.dentistId;
    this.date = props.date;
    this.procedure = props.procedure;
    this.status = props.status;
    this.notes = props.notes;
    this.createdAt = props.createdAt ?? new Date();
  }
}
