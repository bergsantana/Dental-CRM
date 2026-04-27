import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor opcional para logs ou tratamento global de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Aqui você pode tratar erros 401, 500, etc.
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);
