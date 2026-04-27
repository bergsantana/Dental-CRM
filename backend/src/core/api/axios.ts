import axios, { AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: `${process.env.RAG_HOST}:${process.env.RAG_PORT}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
