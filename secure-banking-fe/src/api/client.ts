import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

let tokenProvider: () => string | undefined = () => undefined;

export function setTokenProvider(provider: () => string | undefined) {
  tokenProvider = provider;
}

api.interceptors.request.use((config) => {
  const token = tokenProvider();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const correlation = crypto.randomUUID();
  config.headers["X-Correlation-Id"] = correlation;
  return config;
});
