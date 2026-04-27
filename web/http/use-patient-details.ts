import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { GetPatientResponse } from "./types/get-patient-response";

export function usePatientDetails(patientId: string) {
  return useQuery<GetPatientResponse>({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data } = await api.get<GetPatientResponse>(
        `/patients/${patientId}`,
      );
      return data;
    },
    enabled: !!patientId,
  });
}
