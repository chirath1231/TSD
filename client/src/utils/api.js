import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tsd_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("tsd_token");
      localStorage.removeItem("tsd_username");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  },
);

export default api;
