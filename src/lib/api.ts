import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  timeout: 60000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ✅ Auto-detect FormData and remove Content-Type so Axios sets
// multipart/form-data + boundary correctly. Without this, the
// instance-level "application/json" header overrides and Laravel
// cannot parse the file ($request->hasFile('file') returns false).
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response) {
      console.warn(
        "API ERROR:",
        error.response.data?.message || error.response.status
      );
    } else {
      console.warn("API ERROR: Server unreachable or internal failure");
    }

    return Promise.reject(error);
  }
);

export default api;
