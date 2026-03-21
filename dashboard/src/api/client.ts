import axios from "axios";

// Admin credentials — in production use a proper auth flow
const ADMIN_USER = "admin";
const ADMIN_PASS = "monitor2026";

// In production (Netlify), VITE_API_URL points to the Render backend URL
// In development, Vite's proxy forwards /api → localhost:4000
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const api = axios.create({
  baseURL,
  headers: {
    Authorization: "Basic " + btoa(`${ADMIN_USER}:${ADMIN_PASS}`),
  },
});

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  created_at: string;
  last_active: string | null;
  current_status: "active" | "idle" | "offline";
  current_app: string | null;
  today_screenshots: number;
}

export interface Screenshot {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url: string | null;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  app_name: string;
  window_title: string;
  status: "active" | "idle";
  timestamp: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  totalPages: number;
}

// ── Employee APIs ────────────────────────────────────────────────────
export async function fetchEmployees(): Promise<Employee[]> {
  const { data } = await api.get("/employees");
  return data.employees;
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const { data } = await api.get(`/employee/${id}`);
  return data.employee;
}

// ── Screenshot APIs ──────────────────────────────────────────────────
export async function fetchScreenshots(
  userId: string,
  date?: string,
  page = 1
): Promise<{ screenshots: Screenshot[] } & PaginatedResponse<Screenshot>> {
  const params: Record<string, string | number> = { page, limit: 20 };
  if (date) params.date = date;
  const { data } = await api.get(`/employee/${userId}/screenshots`, { params });
  return data;
}

// ── Activity APIs ────────────────────────────────────────────────────
export async function fetchActivity(
  userId: string,
  date?: string,
  status?: string,
  page = 1
): Promise<{ activities: ActivityLog[] } & PaginatedResponse<ActivityLog>> {
  const params: Record<string, string | number> = { page, limit: 50 };
  if (date) params.date = date;
  if (status) params.status = status;
  const { data } = await api.get(`/employee/${userId}/activity`, { params });
  return data;
}

export default api;
