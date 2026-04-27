export interface PatientSummary {
  id: string;
  name: string;
  lastVisit: string;
}

export type GetPatientsResponse = PatientSummary[];
