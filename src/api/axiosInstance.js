import axios from "axios";

console.log("API base URL:", process.env.NEXT_PUBLIC_API_URL);
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach the right Bearer token per role ──────────────
instance.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config; // ← add this guard

  // Determine which token to use based on the URL prefix
  let token = null;

  if (config.url?.startsWith("/api/admin")) {
    token = localStorage.getItem("admin_token");
  } else if (config.url?.startsWith("/api/clearance") || config.url?.startsWith("/api/officer")) {
    token = localStorage.getItem("officer_token");
  } else {
    // Student routes and everything else
    token = localStorage.getItem("token");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response interceptor — handle 401 globally ────────────────────────────────
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Clear whichever token was used and let the page handle redirect
      localStorage.removeItem("token");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("officer_token");
    }
    return Promise.reject(err);
  }
);

export default instance;