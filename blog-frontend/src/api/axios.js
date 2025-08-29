import axios from "axios";

const api = axios.create({
  // Vite proxy ile aynı origin üzerinden /api istekleri backend'e yönlendirilir
  baseURL: "/api",
});

// Token interceptor
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("token");
  if (stored) {
    const trimmed = stored.replace(/^\"|\"$/g, ""); // olası tırnakları temizle
    const hasBearer = /^Bearer\s/i.test(trimmed);
    config.headers.Authorization = hasBearer ? trimmed : `Bearer ${trimmed}`;
  }
  return config;
});

export default api;
