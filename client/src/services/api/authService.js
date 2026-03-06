import { axiosInstance, serviceRequest } from "@/lib/api";

export const authService = {
  async login(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/auth/login", payload);
      return response.data;
    }, "Login failed");
  },

  async precheckLogin(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/auth/login/precheck", payload);
      return response.data;
    }, "Failed to verify device session");
  },

  async refresh() {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/auth/refresh");
      return response.data;
    }, "Failed to refresh session");
  },

  async getMe() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/auth/me");
      return response.data;
    }, "Failed to fetch current user");
  },

  async getLoginHistory() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/auth/login-history");
      return response.data;
    }, "Failed to fetch login history");
  },

  async logoutSession() {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/auth/logout-session");
      return response.data;
    }, "Failed to logout session");
  },

  async logoutDeviceSession(sessionId) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post(`/auth/logout-session/${sessionId}`);
      return response.data;
    }, "Failed to logout device session");
  },

  async updateTwoFactor(enabled) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/auth/two-factor", { enabled });
      return response.data;
    }, "Failed to update two-factor setting");
  },

  async forgotPassword(email) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/auth/forgot-password", { email });
      return response.data;
    }, "Failed to process forgot password request");
  },

  async resetPassword(token, password) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post(`/auth/reset-password/${token}`, {
        password,
      });
      return response.data;
    }, "Failed to reset password");
  },
};
