import { axiosInstance, serviceRequest } from "@/lib/api";

export const departmentService = {
  async getDepartments(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/departments", { params });
      return response.data;
    }, "Failed to fetch departments");
  },

  async getDepartment(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get(`/departments/${id}`);
      return response.data;
    }, "Failed to fetch department details");
  },

  async createDepartment(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/departments", payload);
      return response.data;
    }, "Failed to create department");
  },

  async updateDepartment(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/departments/${id}`, payload);
      return response.data;
    }, "Failed to update department");
  },

  async deleteDepartment(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.delete(`/departments/${id}`);
      return response.data;
    }, "Failed to delete department");
  },

  async getAnalytics() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/departments/analytics");
      return response.data;
    }, "Failed to fetch department analytics");
  },

  async setDepartmentHead(id, userId) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/departments/${id}/head`, { userId });
      return response.data;
    }, "Failed to update department head");
  },
};
