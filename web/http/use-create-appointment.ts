import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { CreateAppointmentRequest } from "./types/create-appointment-request";

export function useCreateAppointment() {
  return useMutation({
    mutationFn: async (data: CreateAppointmentRequest) => {
      const res = await api.post<CreateAppointmentRequest>(
        "/appointments",
        data,
      );
      return res.data;
    },
  });
}
