import { axiosInstance, serviceRequest } from "@/lib/api";

export const settingsService = {
  async getPublicSettings() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/settings/public");
      return response.data;
    }, "Failed to fetch public settings");
  },

  async getSettings() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/settings");
      return response.data;
    }, "Failed to fetch settings");
  },

  async updateSettings(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/settings", payload);
      return response.data;
    }, "Failed to update settings");
  },

  async resetSettings(section) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/settings/reset", { section });
      return response.data;
    }, "Failed to reset settings");
  },

  async getAuditLog() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/settings/audit");
      return response.data;
    }, "Failed to fetch settings audit log");
  },

  async getSystemStatus() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/settings/status");
      return response.data;
    }, "Failed to fetch system status");
  },

  async testEmail(testEmail) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/settings/test-email", { testEmail });
      return response.data;
    }, "Failed to send test email");
  },
};
