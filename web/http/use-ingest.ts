import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateIngestionRequest } from "./types/create-ingestion-request";
import { CreateIngestionResponse } from "./types/create-ingestion-response";

export function useIngest() {
  const queryClient = useQueryClient();

  return useMutation<CreateIngestionResponse, Error, CreateIngestionRequest>({
    mutationFn: async ({ patientId, file }) => {
      const formData = new FormData();
      formData.append("patientId", patientId);
      formData.append("file", file);

      // No Axios, passamos o FormData direto no body
      const { data } = await api.post<CreateIngestionResponse>(
        "/ingest",
        formData,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["patient", variables.patientId],
      });
    },
  });
}
