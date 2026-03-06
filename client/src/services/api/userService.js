import { axiosInstance, serviceRequest } from "@/lib/api";

export const userService = {
  async getUsers(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/users", { params });
      return response.data;
    }, "Failed to fetch users");
  },

  async getProfile() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/users/profile");
      return response.data;
    }, "Failed to fetch profile");
  },

  async updateProfile(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/users/profile", payload);
      return response.data;
    }, "Failed to update profile");
  },

  async changePassword(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/users/change-password", payload);
      return response.data;
    }, "Failed to change password");
  },

  async uploadProfilePicture(formData) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/users/profile/picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }, "Failed to upload profile picture");
  },

  async createUser(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/users", payload);
      return response.data;
    }, "Failed to create user");
  },

  async updateUser(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/users/${id}`, payload);
      return response.data;
    }, "Failed to update user");
  },

  async deleteUser(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.delete(`/users/${id}`);
      return response.data;
    }, "Failed to delete user");
  },

  async updateLeaveBalance(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/users/${id}/leave-balance`, payload);
      return response.data;
    }, "Failed to update leave balance");
  },

  async toggleUserStatus(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/users/${id}/toggle-status`);
      return response.data;
    }, "Failed to update user status");
  },

  async sendCredentials(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post(`/users/${id}/send-credentials`);
      return response.data;
    }, "Failed to send credentials");
  },

  async updateUserPermissions(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/users/${id}/permissions`, payload);
      return response.data;
    }, "Failed to update user permissions");
  },

  async updateDepartmentPermissions(department, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(
        `/users/permissions/department/${encodeURIComponent(department)}`,
        payload,
      );
      return response.data;
    }, "Failed to update department permissions");
  },

  async getDepartmentCandidates(departmentName, excludeUserId) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get(
        `/users/department/${encodeURIComponent(departmentName)}/candidates`,
        {
          params: excludeUserId ? { excludeUserId } : {},
        },
      );
      return response.data;
    }, "Failed to fetch department candidates");
  },
};
