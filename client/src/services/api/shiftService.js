import { axiosInstance, serviceRequest } from "@/lib/api";

export const shiftService = {
  async getShifts(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/shifts", { params });
      return response.data;
    }, "Failed to fetch shifts");
  },

  async createShift(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/shifts", payload);
      return response.data;
    }, "Failed to create shift");
  },

  async updateShift(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/shifts/${id}`, payload);
      return response.data;
    }, "Failed to update shift");
  },

  async deleteShift(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.delete(`/shifts/${id}`);
      return response.data;
    }, "Failed to delete shift");
  },

  async assignEmployees(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post(`/shifts/${id}/assign`, payload);
      return response.data;
    }, "Failed to assign employees");
  },

  async getAssignments(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/shifts/assignments", { params });
      return response.data;
    }, "Failed to fetch shift assignments");
  },

  async getSwapColleagues(shiftId) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/shifts/swap-colleagues", {
        params: { shiftId },
      });
      return response.data;
    }, "Failed to fetch swap colleagues");
  },

  async getSwapRequests() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/shifts/swap-requests");
      return response.data;
    }, "Failed to fetch swap requests");
  },

  async requestSwap(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/shifts/swap-request", payload);
      return response.data;
    }, "Failed to request shift swap");
  },

  async respondSwapRequest(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/shifts/swap-request/${id}`, payload);
      return response.data;
    }, "Failed to respond to swap request");
  },

  async calculateOvertime(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/shifts/calculate-overtime", payload);
      return response.data;
    }, "Failed to calculate overtime");
  },
};
