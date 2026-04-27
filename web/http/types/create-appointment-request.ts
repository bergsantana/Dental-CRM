export interface CreateAppointmentRequest {
  patientId: string;
  date: string; // ISO string
  procedure: string;
}
