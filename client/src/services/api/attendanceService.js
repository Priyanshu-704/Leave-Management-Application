import { axiosInstance, serviceRequest } from "@/lib/api";

export const attendanceService = {
  async getToday() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/attendance/today");
      return response.data;
    }, "Failed to fetch today's attendance");
  },

  async checkIn(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/attendance/checkin", payload);
      return response.data;
    }, "Failed to check in");
  },

  async checkOut(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/attendance/checkout", payload);
      return response.data;
    }, "Failed to check out");
  },

  async startBreak(type) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/attendance/break", { type });
      return response.data;
    }, "Failed to start break");
  },

  async endBreak() {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/attendance/break/end");
      return response.data;
    }, "Failed to end break");
  },

  async getHistory(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/attendance/history", { params });
      return response.data;
    }, "Failed to fetch attendance history");
  },

  async getAll(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/attendance/all", { params });
      return response.data;
    }, "Failed to fetch all attendance");
  },
};
