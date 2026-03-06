import axios from "axios";
import { normalizeApiError, serviceRequest } from "@/lib/api";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const candidateApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

candidateApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("candidateToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

candidateApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
);

export const candidatePortalService = {
  async register(payload) {
    return serviceRequest(async () => {
      const response = await candidateApi.post("/candidate-portal/register", payload);
      return response.data;
    }, "Failed to register candidate");
  },

  async login(payload) {
    return serviceRequest(async () => {
      const response = await candidateApi.post("/candidate-portal/login", payload);
      return response.data;
    }, "Failed to login candidate");
  },

  async getOpenJobs() {
    return serviceRequest(async () => {
      const response = await candidateApi.get("/candidate-portal/jobs");
      return response.data;
    }, "Failed to fetch open jobs");
  },

  async getMe() {
    return serviceRequest(async () => {
      const response = await candidateApi.get("/candidate-portal/me");
      return response.data;
    }, "Failed to fetch candidate profile");
  },

  async updateMe(payload) {
    return serviceRequest(async () => {
      const response = await candidateApi.put("/candidate-portal/me", payload);
      return response.data;
    }, "Failed to update candidate profile");
  },

  async getDashboard() {
    return serviceRequest(async () => {
      const response = await candidateApi.get("/candidate-portal/dashboard");
      return response.data;
    }, "Failed to fetch candidate dashboard");
  },

  async getApplications() {
    return serviceRequest(async () => {
      const response = await candidateApi.get("/candidate-portal/applications");
      return response.data;
    }, "Failed to fetch candidate applications");
  },

  async apply(jobPostingId, notes = "") {
    return serviceRequest(async () => {
      const response = await candidateApi.post("/candidate-portal/apply", {
        jobPostingId,
        notes,
      });
      return response.data;
    }, "Failed to submit application");
  },
};
