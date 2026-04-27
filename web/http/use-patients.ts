import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { GetPatientsResponse } from "./types/get-patients-response";

export function usePatients() {
  return useQuery<GetPatientsResponse>({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data } = await api.get<GetPatientsResponse>("/patients");
      return data;
    },
  });
}
