import { axiosInstance, serviceRequest } from "@/lib/api";

export const leaveService = {
  async createLeave(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/leaves", payload);
      return response.data;
    }, "Failed to submit leave request");
  },

  async getMyLeaves(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/leaves/my-leaves", { params });
      return response.data;
    }, "Failed to fetch your leaves");
  },

  async exportMyLeaves(params = {}) {
    return serviceRequest(async () => (
      axiosInstance.get("/leaves/my-leaves/export", {
        params,
        responseType: "blob",
      })
    ), "Failed to export leave history");
  },

  async cancelLeave(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/leaves/${id}/cancel`, payload);
      return response.data;
    }, "Failed to cancel leave request");
  },

  async getSummary() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/leaves/summary");
      return response.data;
    }, "Failed to fetch leave summary");
  },

  async getLeaves(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/leaves", { params });
      return response.data;
    }, "Failed to fetch leaves");
  },

  async updateStatus(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/leaves/${id}/status`, payload);
      return response.data;
    }, "Failed to update leave status");
  },
};
